import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { VibePost } from "../backend.d";
import { Mood } from "../backend.d";
import { useApp } from "../contexts/AppContext";
import { usePlayer } from "../contexts/PlayerContext";
import type { Track } from "../contexts/PlayerContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  MOOD_CONFIG,
  type YTSearchResult,
  searchYouTube,
} from "../lib/youtube";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function timeAgo(ts: bigint): string {
  const diff = Date.now() - Number(ts) / 1e6;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function expiresIn(ts: bigint): string {
  const postedMs = Number(ts) / 1e6;
  const expiresMs = postedMs + TWENTY_FOUR_HOURS_MS;
  const remaining = expiresMs - Date.now();
  if (remaining <= 0) return "expiring soon";
  const hrs = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (hrs > 0) return `expires in ${hrs}h`;
  return `expires in ${mins}m`;
}

function VibePostCard({
  post,
  index,
  username,
  isOwner,
  onDelete,
}: {
  post: VibePost;
  index: number;
  username?: string;
  isOwner: boolean;
  onDelete: (ts: bigint) => void;
}) {
  const { playTrack } = usePlayer();
  const cfg = MOOD_CONFIG[post.mood];
  const [deleting, setDeleting] = useState(false);

  const track: Track = {
    youtubeId: post.youtubeId,
    title: post.songTitle,
    artist: post.artistName,
    thumbnail: `https://img.youtube.com/vi/${post.youtubeId}/mqdefault.jpg`,
  };

  const displayName = username
    ? `@${username}`
    : `${post.author.toString().slice(0, 8)}...`;

  const handleDelete = async () => {
    setDeleting(true);
    onDelete(post.timestamp);
  };

  return (
    <div className="glass rounded-2xl p-4" data-ocid={`feed.item.${index}`}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{
            background: `${cfg?.color}22`,
            border: `1px solid ${cfg?.color}44`,
          }}
        >
          {cfg?.emoji || "🎵"}
        </div>
        <div className="flex-1 min-w-0">
          {/* Top row: name + time ago */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timeAgo(post.timestamp)}
            </span>
          </div>
          {/* Second row: expires label + delete button — always visible */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-muted-foreground/60 flex-shrink-0">
              {expiresIn(post.timestamp)}
            </span>
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-shrink-0 text-muted-foreground/50 hover:text-red-400 transition-colors p-2 rounded touch-manipulation"
                title="Delete post"
                data-ocid={`feed.item.delete_button.${index}`}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {post.message && (
            <p className="text-sm text-foreground/80 mb-2">{post.message}</p>
          )}
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl p-3 hover:brightness-110 transition-all w-full text-left"
            style={{
              background: `${cfg?.color}10`,
              border: `1px solid ${cfg?.color}20`,
            }}
            onClick={() => playTrack(track)}
          >
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {post.songTitle}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {post.artistName}
              </p>
            </div>
            <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PostVibeDialog({ onPosted }: { onPosted: () => void }) {
  const { actor } = useActor();
  const { currentTrack } = usePlayer();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.chill);
  const [songSearch, setSongSearch] = useState("");
  const [songResults, setSongResults] = useState<YTSearchResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<YTSearchResult | null>(
    currentTrack
      ? {
          youtubeId: currentTrack.youtubeId,
          title: currentTrack.title,
          artist: currentTrack.artist,
          thumbnail: currentTrack.thumbnail,
        }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchSongs = async () => {
    if (!songSearch.trim()) return;
    setSearching(true);
    try {
      const res = await searchYouTube(songSearch, 5);
      setSongResults(res);
    } finally {
      setSearching(false);
    }
  };

  const handlePost = async () => {
    if (!actor || !selectedSong) return;
    setLoading(true);
    try {
      await actor.createVibePost(
        selectedMood,
        selectedSong.youtubeId,
        selectedSong.title,
        selectedSong.artist,
        message || null,
      );
      toast.success("Vibe posted!");
      setOpen(false);
      setMessage("");
      onPosted();
    } catch {
      toast.error("Failed to post vibe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
            border: "none",
          }}
          data-ocid="feed.open_modal_button"
        >
          <Plus className="h-4 w-4" /> Share Vibe
        </Button>
      </DialogTrigger>
      <DialogContent
        className="glass-strong border-border/40 max-w-md"
        data-ocid="feed.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-gradient">
            Share Your Vibe
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your mood</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMood(key as Mood)}
                  className={`p-2 rounded-xl text-center transition-all border text-sm ${
                    selectedMood === key
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/20 hover:bg-white/5"
                  }`}
                >
                  {cfg.emoji}
                </button>
              ))}
            </div>
          </div>

          {selectedSong ? (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "oklch(0.2 0.02 280)" }}
            >
              <img
                src={selectedSong.thumbnail}
                alt={selectedSong.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedSong.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedSong.artist}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSong(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Find a song</p>
              <div className="flex gap-2 mb-2">
                <Input
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  placeholder="Search songs..."
                  className="bg-input/50"
                  onKeyDown={(e) => e.key === "Enter" && searchSongs()}
                  data-ocid="feed.search_input"
                />
                <Button
                  variant="outline"
                  onClick={searchSongs}
                  disabled={searching}
                >
                  {searching ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Go"
                  )}
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {songResults.map((r) => (
                  <button
                    key={r.youtubeId}
                    type="button"
                    onClick={() => {
                      setSelectedSong(r);
                      setSongResults([]);
                    }}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/5 text-left"
                  >
                    <img
                      src={r.thumbnail}
                      alt={r.title}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.artist}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What are you feeling? (optional)"
            className="bg-input/50 resize-none"
            rows={2}
            data-ocid="feed.textarea"
          />

          <Button
            className="w-full"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
              border: "none",
            }}
            onClick={handlePost}
            disabled={loading || !selectedSong}
            data-ocid="feed.submit_button"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Post Vibe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FeedPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [globalFeed, setGlobalFeed] = useState<VibePost[]>([]);
  const [friendFeed, setFriendFeed] = useState<VibePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  const myPrincipal = identity?.getPrincipal().toString();

  const loadFeeds = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [gf, ff] = await Promise.all([
        actor.getGlobalFeed(),
        actor.getFriendFeed(),
      ]);
      setGlobalFeed(gf);
      setFriendFeed(ff);

      // Batch-fetch usernames for all unique authors
      const allPosts = [...gf, ...ff];
      const uniquePrincipals = [
        ...new Map(
          allPosts.map((p) => [p.author.toString(), p.author]),
        ).values(),
      ];
      const profiles = await Promise.all(
        uniquePrincipals.map((principal) =>
          actor.getUserProfile(principal).catch(() => null),
        ),
      );
      const map: Record<string, string> = {};
      for (let i = 0; i < uniquePrincipals.length; i++) {
        const profile = profiles[i];
        if (profile) {
          map[uniquePrincipals[i].toString()] = profile.username;
        }
      }
      setUsernames(map);
    } catch {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const handleDelete = useCallback(
    async (timestamp: bigint) => {
      if (!actor) return;
      try {
        await actor.deleteVibePost(timestamp);
        toast.success("Post deleted");
        await loadFeeds();
      } catch {
        toast.error("Failed to delete post");
      }
    },
    [actor, loadFeeds],
  );

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold text-gradient">
            Vibe Feed
          </h2>
          <PostVibeDialog onPosted={loadFeeds} />
        </div>

        <Tabs defaultValue="global">
          <TabsList
            className="glass border border-border/30 mb-6 w-full"
            data-ocid="feed.tab"
          >
            <TabsTrigger value="global" className="flex-1">
              Global
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex-1">
              Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            {loading ? (
              <div
                className="flex justify-center py-12"
                data-ocid="feed.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : globalFeed.length === 0 ? (
              <div className="text-center py-16" data-ocid="feed.empty_state">
                <p className="text-4xl mb-3">🌊</p>
                <p className="text-muted-foreground">
                  No vibes yet. Be the first!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {globalFeed.map((post, i) => (
                  <VibePostCard
                    key={`${post.youtubeId}-${String(post.timestamp)}`}
                    post={post}
                    index={i + 1}
                    username={usernames[post.author.toString()]}
                    isOwner={post.author.toString() === myPrincipal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends">
            {loading ? (
              <div
                className="flex justify-center py-12"
                data-ocid="feed.friends.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : friendFeed.length === 0 ? (
              <div
                className="text-center py-16"
                data-ocid="feed.friends.empty_state"
              >
                <p className="text-4xl mb-3">👥</p>
                <p className="text-muted-foreground">
                  Add friends to see their vibes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {friendFeed.map((post, i) => (
                  <VibePostCard
                    key={`${post.youtubeId}-${String(post.timestamp)}`}
                    post={post}
                    index={i + 1}
                    username={usernames[post.author.toString()]}
                    isOwner={post.author.toString() === myPrincipal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
