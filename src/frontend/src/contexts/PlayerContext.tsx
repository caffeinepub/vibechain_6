import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface Track {
  youtubeId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  skipForward: () => void;
  skipBack: () => void;
  setQueue: (tracks: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          height: string;
          width: string;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(id: string): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoLoadedFraction(): number;
  getPlayerState(): number;
  destroy(): void;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiReady = useRef(false);
  const pendingVideoId = useRef<string | null>(null);

  const clearProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const ct = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          const buf = playerRef.current.getVideoLoadedFraction() * dur;
          setCurrentTime(ct);
          setDuration(dur);
          setBuffered(buf);
        } catch {
          // player not ready yet
        }
      }
    }, 500);
  }, []);

  const initPlayer = useCallback(
    (videoId: string) => {
      if (!apiReady.current) {
        pendingVideoId.current = videoId;
        return;
      }
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
        setIsPlaying(true);
        startProgressTracking();
        return;
      }
      playerRef.current = new window.YT.Player("yt-player-hidden", {
        height: "0",
        width: "0",
        videoId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
        events: {
          onReady: () => {
            setIsPlaying(true);
            startProgressTracking();
          },
          onStateChange: (event) => {
            const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
            if (event.data === PLAYING) {
              setIsPlaying(true);
            } else if (event.data === PAUSED) {
              setIsPlaying(false);
            } else if (event.data === ENDED) {
              setIsPlaying(false);
              setQueueIndex((prev) => {
                const next = prev + 1;
                setQueueState((q) => {
                  if (next < q.length) {
                    const nextTrack = q[next];
                    setCurrentTrack(nextTrack);
                    if (playerRef.current) {
                      playerRef.current.loadVideoById(nextTrack.youtubeId);
                      setIsPlaying(true);
                    }
                  }
                  return q;
                });
                return next;
              });
            }
          },
        },
      });
    },
    [startProgressTracking],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: initPlayer is stable
  useEffect(() => {
    if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
      if (pendingVideoId.current) {
        const vid = pendingVideoId.current;
        pendingVideoId.current = null;
        initPlayer(vid);
      }
    };
    return () => clearProgress();
  }, []);

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      setCurrentTrack(track);
      if (newQueue) {
        setQueueState(newQueue);
        setQueueIndex(
          newQueue.findIndex((t) => t.youtubeId === track.youtubeId) || 0,
        );
      }
      initPlayer(track.youtubeId);
    },
    [initPlayer],
  );

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    setQueueIndex((prev) => {
      const next = prev + 1;
      setQueueState((q) => {
        if (next < q.length) {
          const track = q[next];
          setCurrentTrack(track);
          if (playerRef.current) {
            playerRef.current.loadVideoById(track.youtubeId);
            setIsPlaying(true);
            startProgressTracking();
          }
        }
        return q;
      });
      return next;
    });
  }, [startProgressTracking]);

  const prevTrack = useCallback(() => {
    setQueueIndex((prev) => {
      const prevIdx = Math.max(0, prev - 1);
      setQueueState((q) => {
        if (prevIdx < q.length) {
          const track = q[prevIdx];
          setCurrentTrack(track);
          if (playerRef.current) {
            playerRef.current.loadVideoById(track.youtubeId);
            setIsPlaying(true);
            startProgressTracking();
          }
        }
        return q;
      });
      return prevIdx;
    });
  }, [startProgressTracking]);

  const seekTo = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (playerRef.current) {
      setCurrentTime((prev) => {
        const newTime = Math.min(prev + 10, duration);
        playerRef.current?.seekTo(newTime, true);
        return newTime;
      });
    }
  }, [duration]);

  const skipBack = useCallback(() => {
    if (playerRef.current) {
      setCurrentTime((prev) => {
        const newTime = Math.max(prev - 10, 0);
        playerRef.current?.seekTo(newTime, true);
        return newTime;
      });
    }
  }, []);

  const setQueue = useCallback((tracks: Track[]) => {
    setQueueState(tracks);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        currentTime,
        duration,
        buffered,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        skipForward,
        skipBack,
        setQueue,
      }}
    >
      <div
        id="yt-player-hidden"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
