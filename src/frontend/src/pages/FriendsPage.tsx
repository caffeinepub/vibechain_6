import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@icp-sdk/core/principal";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ListMusic,
  Loader2,
  MessageCircle,
  Play,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PlaylistView, UserProfile } from "../backend.d";
import { usePlayer } from "../contexts/PlayerContext";
import type { Track } from "../contexts/PlayerContext";
import { useActor } from "../hooks/useActor";

type ProfileMap = Record<string, UserProfile | null>;

export function FriendsPage() {
  const { actor } = useActor();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Principal[]>([]);
  const [pending, setPending] = useState<Principal[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [addInput, setAddInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Friend playlists modal state
  const [playlistModalPrincipal, setPlaylistModalPrincipal] =
    useState<Principal | null>(null);
  const [friendPlaylists, setFriendPlaylists] = useState<PlaylistView[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [expandedPl, setExpandedPl] = useState<Set<string>>(new Set());

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
      const all = [...f, ...p];
      const results = await Promise.all(
        all.map((pr) => actor.getProfile(pr).catch(() => null)),
      );
      const map: ProfileMap = {};
      all.forEach((pr, i) => {
        map[pr.toString()] = results[i] ?? null;
      });
      setProfiles(map);
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
      const uname = addInput.trim().replace(/^@/, "");
      await actor.sendFriendRequestByUsername(uname);
      toast.success("Friend request sent!");
      setAddInput("");
    } catch {
      toast.error("User not found or request failed");
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

  const openFriendPlaylists = async (p: Principal) => {
    if (!actor) return;
    setPlaylistModalPrincipal(p);
    setFriendPlaylists([]);
    setExpandedPl(new Set());
    setLoadingPlaylists(true);
    try {
      const data = await actor.getFriendPlaylists(p);
      setFriendPlaylists(data);
    } catch {
      toast.error("Failed to load playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handlePlayAll = (pl: PlaylistView) => {
    if (pl.tracks.length === 0) {
      toast.info("Playlist is empty");
      return;
    }
    const tracks: Track[] = pl.tracks.map((t) => ({
      youtubeId: t.youtubeId,
      title: t.songTitle,
      artist: t.artistName,
      thumbnail: `https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`,
    }));
    playTrack(tracks[0], tracks);
    toast.success(`Playing "${pl.name}"`);
    setPlaylistModalPrincipal(null);
  };

  const handlePlayFromTrack = (pl: PlaylistView, fromIndex: number) => {
    const tracks: Track[] = pl.tracks.map((t) => ({
      youtubeId: t.youtubeId,
      title: t.songTitle,
      artist: t.artistName,
      thumbnail: `https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`,
    }));
    const queue = tracks.slice(fromIndex);
    playTrack(queue[0], queue);
    toast.success(`Playing "${pl.tracks[fromIndex].songTitle}"`);
    setPlaylistModalPrincipal(null);
  };

  const toggleExpandPl = (id: string) => {
    setExpandedPl((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderIdentity = (p: Principal) => {
    const prof = profiles[p.toString()];
    if (prof) {
      return (
        <div>
          <span className="text-sm font-medium text-foreground">
            {prof.displayName}
          </span>
          <span className="ml-2 text-xs text-muted-foreground/70">
            @{prof.username}
          </span>
        </div>
      );
    }
    return (
      <span className="text-sm font-mono text-muted-foreground">
        {p.toString().slice(0, 20)}...
      </span>
    );
  };

  const friendModalProfile = playlistModalPrincipal
    ? profiles[playlistModalPrincipal.toString()]
    : null;

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
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm">
                @
              </span>
              <Input
                value={addInput.replace(/^@/, "")}
                onChange={(e) => setAddInput(e.target.value)}
                placeholder="Enter @username..."
                className="bg-input/50 pl-7"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendRequest();
                }}
                data-ocid="friends.input"
              />
            </div>
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
                        {renderIdentity(p)}
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
                    No friends yet. Search by @username to connect!
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
                        {renderIdentity(p)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-primary hover:bg-primary/10 gap-1.5"
                          onClick={() =>
                            navigate({
                              to: "/chat",
                              search: { with: p.toString() },
                            })
                          }
                          data-ocid={`friends.secondary_button.${i + 1}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-primary hover:bg-primary/10 gap-1.5"
                          onClick={() => openFriendPlaylists(p)}
                          data-ocid={`friends.secondary_button.${i + 1}`}
                        >
                          <ListMusic className="h-3.5 w-3.5" />
                          Playlists
                        </Button>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Friend Playlists Modal */}
      <Dialog
        open={!!playlistModalPrincipal}
        onOpenChange={(open) => {
          if (!open) setPlaylistModalPrincipal(null);
        }}
      >
        <DialogContent
          className="glass border-border/30 sm:max-w-md"
          data-ocid="friends.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-gradient">
              {friendModalProfile
                ? `${friendModalProfile.displayName}'s Playlists`
                : "Friend's Playlists"}
            </DialogTitle>
          </DialogHeader>

          {loadingPlaylists ? (
            <div
              className="flex justify-center py-10"
              data-ocid="friends.loading_state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : friendPlaylists.length === 0 ? (
            <div className="text-center py-10" data-ocid="friends.empty_state">
              <ListMusic className="h-10 w-10 mx-auto mb-3 text-primary/30" />
              <p className="text-muted-foreground text-sm">No playlists yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3 pr-2">
                {friendPlaylists.map((pl, i) => (
                  <div
                    key={pl.id}
                    className="rounded-xl border border-border/20 overflow-hidden"
                    data-ocid={`friends.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.72 0.2 295 / 0.25), oklch(0.65 0.22 350 / 0.25))",
                        }}
                      >
                        <ListMusic className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {pl.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pl.tracks.length} track
                          {pl.tracks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-primary hover:bg-primary/10 gap-1"
                          onClick={() => handlePlayAll(pl)}
                          data-ocid={`friends.primary_button.${i + 1}`}
                        >
                          <Play className="h-3 w-3" /> Play
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => toggleExpandPl(pl.id)}
                          data-ocid={`friends.toggle.${i + 1}`}
                        >
                          {expandedPl.has(pl.id) ? (
                            <X className="h-3.5 w-3.5" />
                          ) : (
                            <ListMusic className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedPl.has(pl.id) && pl.tracks.length > 0 && (
                      <div className="border-t border-border/20">
                        {pl.tracks.map((t, ti) => (
                          <div
                            key={`${t.youtubeId}-${ti}`}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-primary/5 transition-colors"
                          >
                            <img
                              src={`https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`}
                              alt={t.songTitle}
                              className="hidden sm:block w-10 h-7 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {t.songTitle}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {t.artistName}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 min-w-[1.75rem] text-primary/70 hover:text-primary hover:bg-primary/10"
                                title="Play from here"
                                onClick={() => handlePlayFromTrack(pl, ti)}
                                data-ocid={`friends.primary_button.${ti + 1}`}
                              >
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
