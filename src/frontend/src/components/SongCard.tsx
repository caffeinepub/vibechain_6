import { Button } from "@/components/ui/button";
import { ListPlus, Pause, Play } from "lucide-react";
import { useState } from "react";
import type { Track } from "../contexts/PlayerContext";
import { usePlayer } from "../contexts/PlayerContext";
import type { YTSearchResult } from "../lib/youtube";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

interface SongCardProps {
  result: YTSearchResult;
  index: number;
  queue?: Track[];
}

export function SongCard({ result, index, queue }: SongCardProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isCurrentTrack = currentTrack?.youtubeId === result.youtubeId;
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handlePlay = () => {
    if (isCurrentTrack) togglePlay();
    else playTrack({ ...result }, queue);
  };

  return (
    <>
      <button
        type="button"
        className={`glass rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group text-left w-full relative ${
          isCurrentTrack ? "border-primary/50 glow-purple" : ""
        }`}
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
          {/* Add to playlist button — bottom-right on hover */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute bottom-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              setAddModalOpen(true);
            }}
            data-ocid={`search.open_modal_button.${index}`}
          >
            <ListPlus className="h-3.5 w-3.5" />
          </Button>
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

      <AddToPlaylistModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        track={{
          youtubeId: result.youtubeId,
          title: result.title,
          artist: result.artist,
        }}
      />
    </>
  );
}
