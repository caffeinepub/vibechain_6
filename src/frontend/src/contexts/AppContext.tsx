import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Mood, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const LAST_SEEN_KEY = "vibechain_last_seen";

function getLastSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LAST_SEEN_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setLastSeen(map: Record<string, string>) {
  localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(map));
}

interface AppContextType {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  refreshProfile: () => Promise<void>;
  unreadCount: number;
  clearUnread: () => void;
  requestNotificationPermission: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function unwrapOptional<T>(val: T | null | T[]): T | null {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return (val[0] as T) ?? null;
  return val;
}

// Helper to show notification via SW (works even when tab is backgrounded/closed)
async function showNotification(
  title: string,
  body: string,
  tag: string,
  url: string,
) {
  const icon = "/assets/generated/vibechain-icon.dim_512x512.png";
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      // Cast to any to allow renotify which is valid but may be missing in older TS DOM types
      const opts: any = {
        body,
        icon,
        badge: icon,
        tag,
        renotify: true,
        data: { url },
      };
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    // fall through to basic Notification
  }
  // Fallback to basic Notification API
  try {
    const notif = new Notification(title, { body, icon, tag });
    notif.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  } catch {
    // ignore
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching: isActorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileFetching, setIsProfileFetching] = useState(true);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());
  const sessionStartRef = useRef<number>(Date.now());
  const friendProfilesRef = useRef<Record<string, UserProfile>>({});

  // Combined loading: true while actor is loading OR while profile is being fetched
  const isLoadingProfile = isActorFetching || isProfileFetching;

  const requestNotificationPermission = useCallback(async () => {
    try {
      if (typeof Notification === "undefined") return;
      // Register SW first so notifications work in background
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch {
      // ignore -- some browsers throw on requestPermission
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!actor || !identity) {
      setIsProfileFetching(false);
      return;
    }
    const principal = identity.getPrincipal();
    if (principal.isAnonymous()) {
      setIsProfileFetching(false);
      return;
    }
    setIsProfileFetching(true);
    try {
      const raw = await actor.getCallerUserProfile();
      setProfile(unwrapOptional(raw as UserProfile | null | UserProfile[]));
    } catch {
      setProfile(null);
    } finally {
      setIsProfileFetching(false);
    }
  }, [actor, identity]);

  useEffect(() => {
    if (!isActorFetching) {
      refreshProfile();
    }
  }, [refreshProfile, isActorFetching]);

  // Request notification permission once profile is loaded
  useEffect(() => {
    if (profile) {
      requestNotificationPermission();
    }
  }, [profile, requestNotificationPermission]);

  // Poll for unread messages
  const checkUnread = useCallback(async () => {
    if (!actor || !profile) return;
    try {
      const friends = await actor.getFriends();
      const lastSeen = getLastSeen();
      let count = 0;
      const myPrincipal = identity?.getPrincipal().toString();
      await Promise.all(
        friends.map(async (friend) => {
          const friendKey = friend.toString();
          try {
            const msgs = await actor.getConversation(friend);
            if (!msgs || msgs.length === 0) return;
            // Find latest message not from me
            const incoming = msgs.filter(
              (m) => m.from.toString() !== myPrincipal,
            );
            if (incoming.length === 0) return;
            const latest = incoming.reduce((a, b) =>
              a.timestamp > b.timestamp ? a : b,
            );
            const latestTs = latest.timestamp.toString();
            const seenTs = lastSeen[friendKey];
            if (!seenTs || latestTs > seenTs) {
              count++;
            }

            // Push notifications for new messages
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              for (const msg of incoming) {
                const msgId = `${friendKey}:${msg.timestamp.toString()}`;
                if (notifiedRef.current.has(msgId)) continue;
                // Only notify for messages received after session started
                const msgTimeMs = Number(msg.timestamp / 1_000_000n);
                if (msgTimeMs < sessionStartRef.current) {
                  notifiedRef.current.add(msgId);
                  continue;
                }
                // Only notify if this message is newer than last seen
                const seenTsNum = seenTs ? Number(seenTs) : 0;
                if (Number(msg.timestamp.toString()) <= seenTsNum) {
                  notifiedRef.current.add(msgId);
                  continue;
                }

                // Fetch friend profile for display name (cached)
                let senderName = `@${friendKey.slice(0, 8)}`;
                try {
                  if (!friendProfilesRef.current[friendKey]) {
                    const fp = await actor.getProfile(friend);
                    const unwrapped = unwrapOptional(
                      fp as UserProfile | null | UserProfile[],
                    );
                    if (unwrapped)
                      friendProfilesRef.current[friendKey] = unwrapped;
                  }
                  const fp = friendProfilesRef.current[friendKey];
                  if (fp) {
                    senderName = fp.displayName || `@${fp.username}`;
                  }
                } catch {
                  // use fallback name
                }

                try {
                  const body =
                    msg.text.length > 80
                      ? `${msg.text.slice(0, 80)}\u2026`
                      : msg.text;
                  await showNotification(
                    `\u{1F4AC} ${senderName}`,
                    body,
                    `vibechain-msg-${friendKey}`,
                    `/#/chat?with=${friendKey}`,
                  );
                } catch {
                  // ignore notification errors
                }

                notifiedRef.current.add(msgId);
              }
            }
          } catch {
            // ignore per-friend errors
          }
        }),
      );
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, [actor, profile, identity]);

  useEffect(() => {
    if (!actor || !profile) return;
    checkUnread();
    pollRef.current = setInterval(checkUnread, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [actor, profile, checkUnread]);

  const clearUnread = useCallback(async () => {
    setUnreadCount(0);
    if (!actor) return;
    try {
      const friends = await actor.getFriends();
      const lastSeen = getLastSeen();
      await Promise.all(
        friends.map(async (friend) => {
          try {
            const msgs = await actor.getConversation(friend);
            if (!msgs || msgs.length === 0) return;
            const latest = msgs.reduce((a, b) =>
              a.timestamp > b.timestamp ? a : b,
            );
            lastSeen[friend.toString()] = latest.timestamp.toString();
          } catch {
            // ignore
          }
        }),
      );
      setLastSeen(lastSeen);
    } catch {
      // ignore
    }
  }, [actor]);

  return (
    <AppContext.Provider
      value={{
        profile,
        isLoadingProfile,
        selectedMood,
        setSelectedMood,
        refreshProfile,
        unreadCount,
        clearUnread,
        requestNotificationPermission,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
