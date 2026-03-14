import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@icp-sdk/core/principal";
import { useSearch } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatMessage, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type ProfileMap = Record<string, UserProfile | null>;

export function ChatPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();
  const search = useSearch({ strict: false }) as { with?: string };

  const [friends, setFriends] = useState<Principal[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [selectedFriend, setSelectedFriend] = useState<Principal | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConvo, setShowConvo] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadFriends = useCallback(async () => {
    if (!actor) return;
    setLoadingFriends(true);
    try {
      const f = await actor.getFriends();
      setFriends(f);
      const results = await Promise.all(
        f.map((p) => actor.getProfile(p).catch(() => null)),
      );
      const map: ProfileMap = {};
      f.forEach((p, i) => {
        map[p.toString()] = results[i] ?? null;
      });
      setProfiles(map);

      // Handle ?with= query param
      const withParam = search.with;
      if (withParam) {
        const match = f.find((p) => p.toString() === withParam);
        if (match) {
          setSelectedFriend(match);
          setShowConvo(true);
        }
      }
    } catch {
      toast.error("Failed to load friends");
    } finally {
      setLoadingFriends(false);
    }
  }, [actor, search.with]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const fetchMessages = useCallback(async () => {
    if (!actor || !selectedFriend) return;
    try {
      const msgs = await actor.getConversation(selectedFriend);
      setMessages(msgs.sort((a, b) => Number(a.timestamp - b.timestamp)));
    } catch {
      // silently fail on poll
    }
  }, [actor, selectedFriend]);

  useEffect(() => {
    if (!selectedFriend) return;
    setLoadingMessages(true);
    fetchMessages().finally(() => setLoadingMessages(false));

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedFriend, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const handleSelectFriend = (p: Principal) => {
    setSelectedFriend(p);
    setMessages([]);
    setShowConvo(true);
  };

  const handleBack = () => {
    setShowConvo(false);
    setSelectedFriend(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleSend = async () => {
    if (!actor || !selectedFriend || !messageText.trim()) return;
    setSending(true);
    const text = messageText.trim();
    setMessageText("");
    try {
      await actor.sendMessage(selectedFriend, text);
      await fetchMessages();
    } catch {
      toast.error("Failed to send message");
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const friendProfile = selectedFriend
    ? profiles[selectedFriend.toString()]
    : null;

  const formatTime = (ts: bigint) => {
    const date = new Date(Number(ts / 1_000_000n));
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (prof: UserProfile | null, principal: Principal) => {
    if (prof?.displayName) return prof.displayName[0].toUpperCase();
    return principal.toString()[0].toUpperCase();
  };

  return (
    <div className="pt-16 pb-16 md:pb-0 min-h-screen flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto w-full px-2 md:px-4 py-4 flex h-[calc(100vh-4rem)]">
        {/* ===== Friends Sidebar ===== */}
        <aside
          className={`
            w-full md:w-72 flex-shrink-0 flex flex-col
            md:flex md:mr-4
            ${showConvo ? "hidden md:flex" : "flex"}
          `}
          data-ocid="chat.list"
        >
          <div className="glass rounded-2xl flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-4 border-b border-border/30">
              <h2 className="font-display text-xl font-bold text-gradient">
                Messages
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chat with your friends
              </p>
            </div>

            {loadingFriends ? (
              <div
                className="flex-1 flex items-center justify-center"
                data-ocid="chat.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : friends.length === 0 ? (
              <div
                className="flex-1 flex flex-col items-center justify-center gap-3 px-4"
                data-ocid="chat.empty_state"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.72 0.2 295 / 0.15)" }}
                >
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm text-center">
                  Add friends to start chatting
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {friends.map((p, i) => {
                    const prof = profiles[p.toString()];
                    const isSelected =
                      selectedFriend?.toString() === p.toString();
                    return (
                      <button
                        type="button"
                        key={p.toString()}
                        onClick={() => handleSelectFriend(p)}
                        data-ocid={`chat.item.${i + 1}`}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all
                          ${
                            isSelected
                              ? "bg-primary/20 border border-primary/30"
                              : "hover:bg-primary/10 border border-transparent"
                          }
                        `}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))"
                              : "oklch(0.72 0.2 295 / 0.2)",
                            color: isSelected ? "white" : "oklch(0.8 0.2 295)",
                          }}
                        >
                          {getInitials(prof ?? null, p)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isSelected ? "text-foreground" : "text-foreground/80"}`}
                          >
                            {prof?.displayName ??
                              `${p.toString().slice(0, 12)}...`}
                          </p>
                          {prof?.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{prof.username}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: "oklch(0.72 0.2 295)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </aside>

        {/* ===== Conversation Pane ===== */}
        <section
          className={`
            flex-1 flex flex-col min-w-0
            ${showConvo ? "flex" : "hidden md:flex"}
          `}
        >
          <div className="glass rounded-2xl flex flex-col flex-1 overflow-hidden">
            {!selectedFriend ? (
              <div
                className="flex-1 flex flex-col items-center justify-center gap-4"
                data-ocid="chat.empty_state"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.2 295 / 0.15), oklch(0.65 0.22 350 / 0.1))",
                  }}
                >
                  <MessageCircle className="h-9 w-9 text-primary/60" />
                </div>
                <div className="text-center">
                  <p className="font-display text-lg text-foreground/60">
                    Select a friend
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose someone to vibe with
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Convo header */}
                <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
                      color: "white",
                    }}
                  >
                    {getInitials(friendProfile ?? null, selectedFriend)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {friendProfile?.displayName ??
                        `${selectedFriend.toString().slice(0, 16)}...`}
                    </p>
                    {friendProfile?.username && (
                      <p className="text-xs text-muted-foreground">
                        @{friendProfile.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-4">
                  {loadingMessages ? (
                    <div
                      className="flex justify-center py-8"
                      data-ocid="chat.loading_state"
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-12 gap-3"
                      data-ocid="chat.empty_state"
                    >
                      <p className="text-3xl">💬</p>
                      <p className="text-muted-foreground text-sm">
                        No messages yet. Say hello!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isMe = msg.from.toString() === myPrincipal;
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${
                              isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isMe && (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mb-0.5"
                                style={{
                                  background: "oklch(0.72 0.2 295 / 0.2)",
                                  color: "oklch(0.8 0.2 295)",
                                }}
                              >
                                {getInitials(
                                  friendProfile ?? null,
                                  selectedFriend,
                                )}
                              </div>
                            )}
                            <div
                              className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? "rounded-br-sm text-white"
                                  : "rounded-bl-sm text-foreground"
                              }`}
                              style={{
                                background: isMe
                                  ? "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))"
                                  : "oklch(0.2 0.02 280 / 0.9)",
                                border: isMe
                                  ? "none"
                                  : "1px solid oklch(0.28 0.02 280 / 0.5)",
                              }}
                            >
                              <p className="break-words">{msg.text}</p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  isMe
                                    ? "text-white/60 text-right"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="px-4 py-3 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-input/50 rounded-full border-border/30 focus-visible:ring-primary/50"
                      disabled={sending}
                      data-ocid="chat.input"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sending || !messageText.trim()}
                      size="icon"
                      className="h-10 w-10 rounded-full flex-shrink-0"
                      style={{
                        background: messageText.trim()
                          ? "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))"
                          : undefined,
                        border: "none",
                      }}
                      data-ocid="chat.submit_button"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
