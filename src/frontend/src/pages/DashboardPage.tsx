import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Mood } from "../backend.d";
import { SongCard } from "../components/SongCard";
import { useApp } from "../contexts/AppContext";
import type { Track } from "../contexts/PlayerContext";
import {
  MOOD_CONFIG,
  MOOD_QUERIES,
  type YTSearchResult,
  searchYouTube,
} from "../lib/youtube";

export function DashboardPage() {
  const { profile, selectedMood, setSelectedMood } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YTSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const moods = Object.entries(MOOD_CONFIG);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await searchYouTube(q);
      setResults(res);
    } catch {
      toast.error("Search failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood as Mood);
    await doSearch(MOOD_QUERIES[mood]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  useEffect(() => {
    doSearch(MOOD_QUERIES.chill);
  }, [doSearch]);

  const queue: Track[] = results.map((r) => ({ ...r }));

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            {profile ? (
              <>
                Hey <span className="text-gradient">{profile.displayName}</span>
                , what's your vibe?
              </>
            ) : (
              <>
                What's your <span className="text-gradient">vibe</span> today?
              </>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            Choose a mood to discover music that matches your soul
          </p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
          {moods.map(([key, cfg], i) => (
            <button
              key={key}
              type="button"
              onClick={() => handleMoodSelect(key)}
              className={`relative rounded-2xl p-4 flex flex-col items-center gap-2 transition-all border overflow-hidden ${
                selectedMood === key
                  ? "border-primary/60 scale-105"
                  : "border-border/20 hover:border-border/40"
              }`}
              style={{
                background:
                  selectedMood === key
                    ? `radial-gradient(circle, ${cfg.color}22, ${cfg.color}08)`
                    : "oklch(0.15 0.015 280 / 0.7)",
              }}
              data-ocid={`mood.item.${i + 1}`}
            >
              <span className="text-2xl">{cfg.emoji}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {cfg.label}
              </span>
              {selectedMood === key && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-20"
                  style={{
                    background: `radial-gradient(circle at center, ${cfg.color}, transparent 70%)`,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any song, artist, or vibe..."
              className="pl-10 bg-input/50 h-12 text-base border-border/30"
              data-ocid="search.search_input"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 px-6"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
              border: "none",
            }}
            disabled={loading}
            data-ocid="search.submit_button"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {loading ? (
          <div
            className="flex justify-center py-20"
            data-ocid="search.loading_state"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Finding your vibe...</p>
            </div>
          </div>
        ) : results.length > 0 ? (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              {selectedMood
                ? `${MOOD_CONFIG[selectedMood]?.emoji} ${MOOD_CONFIG[selectedMood]?.label} Vibes`
                : "Search Results"}
              <span className="ml-2 text-primary">{results.length} tracks</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((r, i) => (
                <SongCard
                  key={r.youtubeId}
                  result={r}
                  index={i + 1}
                  queue={queue}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20" data-ocid="search.empty_state">
            <p className="text-4xl mb-4">🎵</p>
            <p className="text-muted-foreground">
              Search for songs or pick a mood to start
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
