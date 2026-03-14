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
import { ListMusic, Loader2, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PlaylistView, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface AddToPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    youtubeId: string;
    title: string;
    artist: string;
  };
}

interface FriendSection {
  principal: Principal;
  profile: UserProfile | null;
  playlists: PlaylistView[];
}

export function AddToPlaylistModal({
  open,
  onOpenChange,
  track,
}: AddToPlaylistModalProps) {
  const { actor } = useActor();
  const [myPlaylists, setMyPlaylists] = useState<PlaylistView[]>([]);
  const [friendSections, setFriendSections] = useState<FriendSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [myPls, friendPrincipals] = await Promise.all([
        actor.getMyPlaylists(),
        actor.getFriends(),
      ]);
      setMyPlaylists(myPls);

      // Load each friend's profile + playlists
      const sections = await Promise.all(
        friendPrincipals.map(async (fp) => {
          const [profile, pls] = await Promise.all([
            actor.getProfile(fp).catch(() => null),
            actor.getFriendPlaylists(fp).catch(() => [] as PlaylistView[]),
          ]);
          return { principal: fp, profile, playlists: pls } as FriendSection;
        }),
      );
      setFriendSections(sections.filter((s) => s.playlists.length > 0));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (open) loadAll();
  }, [open, loadAll]);

  const addTrackToMyPlaylist = async (playlistId: string) => {
    if (!actor) return;
    setAddingTo(playlistId);
    try {
      await actor.addToPlaylist(playlistId, {
        youtubeId: track.youtubeId,
        songTitle: track.title,
        artistName: track.artist,
      });
      toast.success("Added to playlist!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to add track");
    } finally {
      setAddingTo(null);
    }
  };

  const addTrackToFriendPlaylist = async (playlistId: string) => {
    if (!actor) return;
    setAddingTo(playlistId);
    try {
      await actor.addToFriendPlaylist(playlistId, {
        youtubeId: track.youtubeId,
        songTitle: track.title,
        artistName: track.artist,
      });
      toast.success("Added to friend's playlist!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to add track to friend's playlist");
    } finally {
      setAddingTo(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!actor || !newName.trim()) return;
    setCreating(true);
    try {
      const id = await actor.createPlaylist(newName.trim());
      await actor.addToPlaylist(id, {
        youtubeId: track.youtubeId,
        songTitle: track.title,
        artistName: track.artist,
      });
      toast.success(`Added to new playlist "${newName.trim()}"`);
      setNewName("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass border-border/30 sm:max-w-sm"
        data-ocid="add-to-playlist.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-gradient">
            Add to Playlist
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">
            {track.title} — {track.artist}
          </p>
        </DialogHeader>

        {/* New playlist row */}
        <div className="flex gap-2">
          <Input
            placeholder="New playlist name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateAndAdd();
            }}
            className="bg-input/50 text-sm"
            data-ocid="add-to-playlist.input"
          />
          <Button
            size="sm"
            onClick={handleCreateAndAdd}
            disabled={creating || !newName.trim()}
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
              border: "none",
            }}
            data-ocid="add-to-playlist.submit_button"
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <ScrollArea className="max-h-72">
          {loading ? (
            <div
              className="flex justify-center py-6"
              data-ocid="add-to-playlist.loading_state"
            >
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* My Playlists */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  My Playlists
                </p>
                {myPlaylists.length === 0 ? (
                  <p
                    className="text-center text-sm text-muted-foreground py-3"
                    data-ocid="add-to-playlist.empty_state"
                  >
                    No playlists yet — create one above
                  </p>
                ) : (
                  <div className="space-y-1">
                    {myPlaylists.map((pl, i) => (
                      <button
                        key={pl.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors text-left"
                        onClick={() => addTrackToMyPlaylist(pl.id)}
                        disabled={!!addingTo}
                        data-ocid={`add-to-playlist.item.${i + 1}`}
                      >
                        <ListMusic className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium text-foreground truncate">
                          {pl.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pl.tracks.length}
                        </span>
                        {addingTo === pl.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Friends' Playlists */}
              {friendSections.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Friends' Playlists
                  </p>
                  <div className="space-y-3">
                    {friendSections.map((section) => (
                      <div key={section.principal.toString()}>
                        <p className="text-xs font-medium text-foreground/60 px-1 mb-1">
                          {section.profile?.displayName ??
                            `${section.principal.toString().slice(0, 12)}...`}
                          {section.profile && (
                            <span className="text-muted-foreground/50 ml-1">
                              @{section.profile.username}
                            </span>
                          )}
                        </p>
                        <div className="space-y-1">
                          {section.playlists.map((pl, i) => (
                            <button
                              key={pl.id}
                              type="button"
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors text-left"
                              onClick={() => addTrackToFriendPlaylist(pl.id)}
                              disabled={!!addingTo}
                              data-ocid={`add-to-playlist.item.${i + 1}`}
                            >
                              <ListMusic className="h-4 w-4 text-primary/60 flex-shrink-0" />
                              <span className="flex-1 text-sm font-medium text-foreground truncate">
                                {pl.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {pl.tracks.length}
                              </span>
                              {addingTo === pl.id && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
