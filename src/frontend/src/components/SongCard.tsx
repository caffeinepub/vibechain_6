import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import type { Track } from "../contexts/PlayerContext";
import { usePlayer } from "../contexts/PlayerContext";
import type { YTSearchResult } from "../lib/youtube";

interface SongCardProps {
  result: YTSearchResult;
  index: number;
  queue?: Track[];
}

export function SongCard({ result, index, queue }: SongCardProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isCurrentTrack = currentTrack?.youtubeId === result.youtubeId;

  const handlePlay = () => {
    if (isCurrentTrack) togglePlay();
    else playTrack({ ...result }, queue);
  };

  return (
    <button
      type="button"
      className={`glass rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group text-left w-full ${isCurrentTrack ? "border-primary/50 glow-purple" : ""}`}
      onClick={handlePlay}
      data-ocid={`search.item.${index}`}
    >
      <div className="relative">
        <img
          src={result.thumbnail}
          alt={result.title}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="rounded-full h-12 w-12 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
            }}
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white" />
            )}
          </div>
        </div>
        {isCurrentTrack && (
          <div className="absolute top-2 right-2">
            <div className="flex gap-0.5 items-end h-4">
              {[1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className="w-1 rounded-full"
                  style={{
                    height: `${isPlaying ? 60 + bar * 10 : 30}%`,
                    background: "oklch(0.72 0.2 295)",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {result.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {result.artist}
        </p>
      </div>
    </button>
  );
}
