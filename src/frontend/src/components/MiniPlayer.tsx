import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  ChevronsRight,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import { formatTime } from "../lib/youtube";

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    buffered,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    skipForward,
    skipBack,
  } = usePlayer();
  const barRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const played = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || duration === 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio * duration);
  };

  return (
    // On mobile: sit above the bottom nav (bottom-14 ≈ 56px nav height)
    // On md+: sit at the very bottom
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/30">
      <div
        ref={barRef}
        data-ocid="player.progress_bar"
        className="relative h-1 cursor-pointer group"
        onClick={handleBarClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            handleBarClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        <div className="absolute inset-0 bg-white/5" />
        <div
          className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-300"
          style={{ width: `${Math.min(bufferedPct, 100)}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full transition-all duration-150"
          style={{
            width: `${Math.min(played, 100)}%`,
            background:
              "linear-gradient(90deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
          }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-10 h-10 rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentTrack.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={skipBack}
            data-ocid="player.skip_back_button"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={prevTrack}
            data-ocid="player.prev_button"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-foreground"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
            }}
            onClick={togglePlay}
            data-ocid={isPlaying ? "player.pause_button" : "player.play_button"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={nextTrack}
            data-ocid="player.next_button"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={skipForward}
            data-ocid="player.skip_forward_button"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
