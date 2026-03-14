import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Mood, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AppContextType {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function unwrapOptional<T>(val: T | null | T[]): T | null {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return (val[0] as T) ?? null;
  return val;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Start as true so we show the loading spinner while the actor initializes,
  // preventing a false flash of SetupProfilePage for existing users.
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!actor || !identity) return;
    const principal = identity.getPrincipal();
    if (principal.isAnonymous()) return;
    setIsLoadingProfile(true);
    try {
      const raw = await actor.getCallerUserProfile();
      setProfile(unwrapOptional(raw as UserProfile | null | UserProfile[]));
    } catch {
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [actor, identity]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <AppContext.Provider
      value={{
        profile,
        isLoadingProfile,
        selectedMood,
        setSelectedMood,
        refreshProfile,
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
