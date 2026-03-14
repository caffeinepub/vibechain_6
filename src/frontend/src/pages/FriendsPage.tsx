import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Principal } from "@icp-sdk/core/principal";
import { Check, Loader2, UserMinus, UserPlus, X } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

export function FriendsPage() {
  const { actor } = useActor();
  const [friends, setFriends] = useState<Principal[]>([]);
  const [pending, setPending] = useState<Principal[]>([]);
  const [addInput, setAddInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [f, p] = await Promise.all([
        actor.getFriends(),
        actor.getPendingFriendRequests(),
      ]);
      setFriends(f);
      setPending(p);
    } catch {
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendRequest = async () => {
    if (!actor || !addInput.trim()) return;
    setSending(true);
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(addInput.trim());
      await actor.sendFriendRequest(p);
      toast.success("Friend request sent!");
      setAddInput("");
    } catch {
      toast.error("Invalid principal or request failed");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (p: Principal) => {
    if (!actor) return;
    try {
      await actor.acceptFriendRequest(p);
      toast.success("Friend added!");
      load();
    } catch {
      toast.error("Failed to accept");
    }
  };

  const handleReject = async (p: Principal) => {
    if (!actor) return;
    try {
      await actor.rejectFriendRequest(p);
      load();
    } catch {
      toast.error("Failed to reject");
    }
  };

  const handleUnfriend = async (p: Principal) => {
    if (!actor) return;
    try {
      await actor.unfriend(p);
      toast.success("Removed friend");
      load();
    } catch {
      toast.error("Failed to unfriend");
    }
  };

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="font-display text-3xl font-bold text-gradient mb-6">
          Friends
        </h2>

        {/* Add friend */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Add a Friend
          </h3>
          <div className="flex gap-3">
            <Input
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="Enter their principal ID..."
              className="bg-input/50"
              data-ocid="friends.input"
            />
            <Button
              onClick={handleSendRequest}
              disabled={sending || !addInput.trim()}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
                border: "none",
              }}
              data-ocid="friends.submit_button"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div
            className="flex justify-center py-12"
            data-ocid="friends.loading_state"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Pending requests */}
            {pending.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Pending Requests ({pending.length})
                </h3>
                <div className="space-y-3">
                  {pending.map((p, i) => (
                    <div
                      key={p.toString()}
                      className="glass rounded-xl p-4 flex items-center justify-between"
                      data-ocid={`friends.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                          👤
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {p.toString().slice(0, 20)}...
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-400"
                          onClick={() => handleAccept(p)}
                          data-ocid={`friends.confirm_button.${i + 1}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400"
                          onClick={() => handleReject(p)}
                          data-ocid={`friends.cancel_button.${i + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Friends ({friends.length})
              </h3>
              {friends.length === 0 ? (
                <div
                  className="text-center py-12"
                  data-ocid="friends.empty_state"
                >
                  <p className="text-4xl mb-3">👥</p>
                  <p className="text-muted-foreground">
                    No friends yet. Share your principal to connect!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((p, i) => (
                    <div
                      key={p.toString()}
                      className="glass rounded-xl p-4 flex items-center justify-between"
                      data-ocid={`friends.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                          👤
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {p.toString().slice(0, 20)}...
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnfriend(p)}
                        data-ocid={`friends.delete_button.${i + 1}`}
                      >
                        <UserMinus className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
