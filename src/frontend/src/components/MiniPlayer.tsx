import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  ChevronsRight,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  const [dismissed, setDismissed] = useState(false);

  // When a new track starts, show the player again
  useEffect(() => {
    if (currentTrack) setDismissed(false);
  }, [currentTrack]);

  if (!currentTrack) return null;

  const played = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || duration === 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio * duration);
  };

  // Dismissed state: show a small floating restore pill above the nav
  if (dismissed) {
    return (
      <div className="fixed bottom-16 md:bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setDismissed(false)}
          data-ocid="player.restore_button"
          className="flex items-center gap-2 px-3 py-2 rounded-full glass-strong border border-border/30 shadow-lg hover:border-primary/50 transition-all"
        >
          <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <Music className="h-3.5 w-3.5 text-primary" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>
        </button>
      </div>
    );
  }

  return (
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
            data-ocid="player.dismiss_button"
            aria-label="Dismiss player"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
