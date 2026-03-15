import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Loader2,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PlaylistView } from "../backend.d";
import { usePlayer } from "../contexts/PlayerContext";
import type { Track } from "../contexts/PlayerContext";
import { useActor } from "../hooks/useActor";

export function PlaylistPage() {
  const { actor } = useActor();
  const { playTrack } = usePlayer();

  const [playlists, setPlaylists] = useState<PlaylistView[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await actor.getMyPlaylists();
      setPlaylists(data);
    } catch {
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleCreate = async () => {
    if (!actor || !newName.trim()) return;
    setCreating(true);
    try {
      await actor.createPlaylist(newName.trim());
      toast.success(`Playlist "${newName.trim()}" created!`);
      setNewName("");
      setCreateOpen(false);
      loadPlaylists();
    } catch {
      toast.error("Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    setDeletingId(id);
    try {
      await actor.deletePlaylist(id);
      toast.success("Playlist deleted");
      loadPlaylists();
    } catch {
      toast.error("Failed to delete playlist");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveTrack = async (playlistId: string, index: number) => {
    if (!actor) return;
    const key = `${playlistId}-${index}`;
    setRemovingKey(key);
    try {
      await actor.removeFromPlaylist(playlistId, BigInt(index));
      toast.success("Track removed");
      loadPlaylists();
    } catch {
      toast.error("Failed to remove track");
    } finally {
      setRemovingKey(null);
    }
  };

  const handlePlayAll = (playlist: PlaylistView) => {
    if (playlist.tracks.length === 0) {
      toast.info("No tracks in this playlist");
      return;
    }
    const tracks: Track[] = playlist.tracks.map((t) => ({
      youtubeId: t.youtubeId,
      title: t.songTitle,
      artist: t.artistName,
      thumbnail: `https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`,
    }));
    playTrack(tracks[0], tracks);
    toast.success(`Playing "${playlist.name}"`);
  };

  const handlePlayFromTrack = (playlist: PlaylistView, fromIndex: number) => {
    if (playlist.tracks.length === 0) return;
    const tracks: Track[] = playlist.tracks.map((t) => ({
      youtubeId: t.youtubeId,
      title: t.songTitle,
      artist: t.artistName,
      thumbnail: `https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`,
    }));
    const queue = tracks.slice(fromIndex);
    playTrack(queue[0], queue);
    toast.success(`Playing from "${playlist.tracks[fromIndex].songTitle}"`);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="pt-20 pb-28 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold text-gradient">
            My Playlists
          </h2>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
              border: "none",
            }}
            data-ocid="playlist.open_modal_button"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Playlist</span>
          </Button>
        </div>

        {loading ? (
          <div
            className="flex justify-center py-16"
            data-ocid="playlist.loading_state"
          >
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : playlists.length === 0 ? (
          <div
            className="text-center py-20 glass rounded-2xl"
            data-ocid="playlist.empty_state"
          >
            <ListMusic className="h-14 w-14 mx-auto mb-4 text-primary/40" />
            <p className="text-lg font-display text-muted-foreground">
              No playlists yet
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Create one and add songs to start vibing
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {playlists.map((pl, i) => {
              const isExpanded = expanded.has(pl.id);
              return (
                <div
                  key={pl.id}
                  className="glass rounded-2xl overflow-hidden"
                  data-ocid={`playlist.item.${i + 1}`}
                >
                  {/* Playlist header row */}
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.72 0.2 295 / 0.3), oklch(0.65 0.22 350 / 0.3))",
                      }}
                    >
                      <ListMusic className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {pl.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pl.tracks.length} track
                        {pl.tracks.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 sm:gap-1.5 text-primary hover:bg-primary/10 px-2 sm:px-3"
                        onClick={() => handlePlayAll(pl)}
                        data-ocid={`playlist.primary_button.${i + 1}`}
                      >
                        <Play className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Play All</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => handleDelete(pl.id)}
                        disabled={deletingId === pl.id}
                        data-ocid={`playlist.delete_button.${i + 1}`}
                      >
                        {deletingId === pl.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground flex-shrink-0"
                        onClick={() => toggleExpand(pl.id)}
                        data-ocid={`playlist.toggle.${i + 1}`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Track list */}
                  {isExpanded && (
                    <div className="border-t border-border/20">
                      {pl.tracks.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-6">
                          No tracks — add songs from search!
                        </p>
                      ) : (
                        <ScrollArea className="max-h-72">
                          {pl.tracks.map((t, ti) => (
                            <div
                              key={`${t.youtubeId}-${ti}`}
                              className="grid px-3 sm:px-4 py-2 hover:bg-primary/5 transition-colors"
                              style={{ gridTemplateColumns: "1fr auto" }}
                              data-ocid={`playlist.row.${ti + 1}`}
                            >
                              {/* Track info + optional thumbnail */}
                              <div className="flex items-center gap-2 min-w-0 overflow-hidden pr-2">
                                <img
                                  src={`https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`}
                                  alt={t.songTitle}
                                  className="hidden sm:block w-10 h-8 rounded object-cover flex-shrink-0"
                                />
                                <div className="min-w-0 overflow-hidden">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {t.songTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {t.artistName}
                                  </p>
                                </div>
                              </div>
                              {/* Action buttons — always on the right, never clipped */}
                              <div
                                className="flex items-center gap-1"
                                style={{ flexShrink: 0 }}
                              >
                                <button
                                  type="button"
                                  className="flex items-center justify-center rounded-lg text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
                                  style={{
                                    width: 44,
                                    height: 44,
                                    minWidth: 44,
                                  }}
                                  onClick={() => handlePlayFromTrack(pl, ti)}
                                  title="Play from here"
                                  data-ocid={`playlist.primary_button.${ti + 1}`}
                                >
                                  <Play style={{ width: 18, height: 18 }} />
                                </button>
                                <button
                                  type="button"
                                  className="flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  style={{
                                    width: 44,
                                    height: 44,
                                    minWidth: 44,
                                  }}
                                  onClick={() => handleRemoveTrack(pl.id, ti)}
                                  disabled={removingKey === `${pl.id}-${ti}`}
                                  data-ocid={`playlist.delete_button.${ti + 1}`}
                                >
                                  {removingKey === `${pl.id}-${ti}` ? (
                                    <Loader2
                                      style={{ width: 16, height: 16 }}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <X style={{ width: 16, height: 16 }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          className="glass border-border/30 sm:max-w-sm"
          data-ocid="playlist.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-gradient">
              New Playlist
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Playlist name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            className="bg-input/50"
            data-ocid="playlist.input"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              data-ocid="playlist.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
                border: "none",
              }}
              data-ocid="playlist.submit_button"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
