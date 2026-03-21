import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMOTION_MUSIC_MAP, emotionToMood } from "../lib/emotionMusic";
import { MOOD_CONFIG } from "../lib/youtube";

declare global {
  interface Window {
    faceapi: any; // eslint-disable-line
  }
}

type DetectorState =
  | "idle"
  | "requesting-permission"
  | "loading-models"
  | "scanning"
  | "detected"
  | "fallback";

interface Props {
  onEmotionDetected: (mood: string) => void;
}

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
const FACEAPI_CDN =
  "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const SCAN_DURATION = 4000;

function loadFaceApiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.faceapi) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${FACEAPI_CDN}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Script load failed")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = FACEAPI_CDN;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load face-api.js"));
    document.head.appendChild(script);
  });
}

export function EmotionDetector({ onEmotionDetected }: Props) {
  const [state, setState] = useState<DetectorState>("idle");
  const [countdown, setCountdown] = useState(SCAN_DURATION / 1000);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scoresRef = useRef<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const pickDominantEmotion = useCallback((): string => {
    const scores = scoresRef.current;
    let dominant = "neutral";
    let max = 0;
    for (const [emotion, score] of Object.entries(scores)) {
      if (score > max) {
        max = score;
        dominant = emotion;
      }
    }
    return dominant;
  }, []);

  const finishScan = useCallback(() => {
    stopCamera();
    const dominant = pickDominantEmotion();
    const hasAnyData = Object.values(scoresRef.current).some((v) => v > 0);
    if (!hasAnyData) {
      setFallbackMessage("No face found — pick your vibe manually");
      setState("fallback");
      return;
    }
    setDetectedEmotion(dominant);
    setState("detected");
    const mood = emotionToMood(dominant);
    setTimeout(() => onEmotionDetected(mood), 1200);
  }, [stopCamera, pickDominantEmotion, onEmotionDetected]);

  const startScanning = useCallback(
    async (stream: MediaStream) => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      scoresRef.current = {};
      setState("scanning");
      setCountdown(SCAN_DURATION / 1000);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !window.faceapi) return;
        try {
          const result = await window.faceapi
            .detectSingleFace(
              videoRef.current,
              new window.faceapi.TinyFaceDetectorOptions(),
            )
            .withFaceExpressions();
          if (result?.expressions) {
            for (const [expr, score] of Object.entries(
              result.expressions as Record<string, number>,
            )) {
              scoresRef.current[expr] = (scoresRef.current[expr] ?? 0) + score;
            }
          }
        } catch {
          // silent
        }
      }, 400);

      timerRef.current = setTimeout(() => {
        finishScan();
      }, SCAN_DURATION);
    },
    [finishScan],
  );

  const handleScanClick = async () => {
    setState("requesting-permission");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
    } catch {
      setFallbackMessage("Camera unavailable — pick your vibe manually");
      setState("fallback");
      return;
    }

    setState("loading-models");
    try {
      await loadFaceApiScript();
      await new Promise<void>((resolve, reject) => {
        let tries = 0;
        const check = setInterval(() => {
          tries++;
          if (window.faceapi) {
            clearInterval(check);
            resolve();
          } else if (tries > 40) {
            clearInterval(check);
            reject(new Error("faceapi not available"));
          }
        }, 100);
      });
      await Promise.all([
        window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
    } catch {
      for (const t of stream.getTracks()) t.stop();
      setFallbackMessage(
        "Could not load detection models — pick your vibe manually",
      );
      setState("fallback");
      return;
    }

    await startScanning(stream);
  };

  const handleReset = () => {
    stopCamera();
    scoresRef.current = {};
    setDetectedEmotion(null);
    setState("idle");
  };

  const emotionEntry = detectedEmotion
    ? EMOTION_MUSIC_MAP[detectedEmotion]
    : null;
  const moodCfg = emotionEntry
    ? (
        MOOD_CONFIG as Record<
          string,
          { emoji: string; label: string; color: string }
        >
      )[emotionEntry.mood]
    : null;

  return (
    <div className="mb-8">
      <AnimatePresence mode="wait">
        {/* IDLE */}
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center gap-3 py-6 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.04 280 / 0.6), oklch(0.15 0.03 230 / 0.6))",
              border: "1px solid oklch(0.55 0.25 295 / 0.3)",
            }}
          >
            <div className="text-4xl mb-1">🎭</div>
            <p className="text-sm text-muted-foreground text-center px-4">
              Let us read your vibe from your face
            </p>
            <button
              type="button"
              onClick={handleScanClick}
              className="relative px-8 py-3 rounded-full font-semibold text-white text-sm overflow-hidden transition-transform hover:scale-105 active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.28 295), oklch(0.62 0.26 200))",
                boxShadow:
                  "0 0 24px oklch(0.55 0.28 295 / 0.5), 0 0 48px oklch(0.55 0.28 295 / 0.2)",
              }}
              data-ocid="emotion.primary_button"
            >
              <span className="relative z-10">✨ Scan My Vibe</span>
            </button>
          </motion.div>
        )}

        {/* REQUESTING / LOADING */}
        {(state === "requesting-permission" || state === "loading-models") && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-10 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.04 280 / 0.6), oklch(0.15 0.03 230 / 0.6))",
              border: "1px solid oklch(0.55 0.25 295 / 0.3)",
            }}
            data-ocid="emotion.loading_state"
          >
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full border-2 border-transparent animate-spin"
                style={{
                  borderTopColor: "oklch(0.72 0.2 295)",
                  borderRightColor: "oklch(0.65 0.22 200)",
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">
                {state === "requesting-permission" ? "📷" : "🧠"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {state === "requesting-permission"
                ? "Requesting camera access..."
                : "Loading detection models..."}
            </p>
          </motion.div>
        )}

        {/* SCANNING */}
        {state === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl overflow-hidden relative"
            style={{
              border: "2px solid oklch(0.55 0.28 295 / 0.8)",
              boxShadow:
                "0 0 32px oklch(0.55 0.28 295 / 0.4), 0 0 64px oklch(0.55 0.28 295 / 0.15)",
            }}
          >
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-h-72 object-cover block"
                style={{ transform: "scaleX(-1)" }}
              />

              <div className="absolute inset-0 pointer-events-none">
                {[
                  "top-3 left-3 border-t-2 border-l-2",
                  "top-3 right-3 border-t-2 border-r-2",
                  "bottom-3 left-3 border-b-2 border-l-2",
                  "bottom-3 right-3 border-b-2 border-r-2",
                ].map((cls, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: static positional array
                    key={i}
                    className={`absolute w-6 h-6 ${cls}`}
                    style={{ borderColor: "oklch(0.72 0.2 295)" }}
                  />
                ))}

                <motion.div
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute left-0 right-0 h-0.5"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.72 0.2 295), oklch(0.65 0.22 200), transparent)",
                    boxShadow: "0 0 8px oklch(0.72 0.2 295)",
                  }}
                />

                <div
                  className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{
                    background: "oklch(0.12 0.02 280 / 0.85)",
                    border: "1px solid oklch(0.55 0.28 295 / 0.6)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Scanning vibe... {countdown}s
                </div>
              </div>
            </div>

            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: "oklch(0.12 0.03 280 / 0.95)" }}
            >
              <span className="text-xs text-muted-foreground">
                Hold still while we read your aura ✨
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* DETECTED */}
        {state === "detected" && emotionEntry && (
          <motion.div
            key="detected"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8 rounded-2xl"
            style={{
              background: moodCfg
                ? `radial-gradient(circle at 50% 30%, ${moodCfg.color}18, oklch(0.14 0.03 280 / 0.9))`
                : "oklch(0.14 0.03 280 / 0.9)",
              border: moodCfg
                ? `1px solid ${moodCfg.color}55`
                : "1px solid oklch(0.55 0.25 295 / 0.3)",
            }}
            data-ocid="emotion.success_state"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, -8, 8, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: 2,
                ease: "easeInOut",
              }}
              className="text-7xl"
            >
              {emotionEntry.emoji}
            </motion.div>

            <div className="text-center">
              <p
                className="text-2xl font-bold font-display"
                style={{ color: moodCfg?.color ?? "oklch(0.72 0.2 295)" }}
              >
                {moodCfg?.label ?? emotionEntry.label}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Vibe detected! 🎵 Loading your music...
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              data-ocid="emotion.secondary_button"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* FALLBACK */}
        {state === "fallback" && (
          <motion.div
            key="fallback"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-ocid="emotion.panel"
          >
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                {fallbackMessage || "Pick your vibe manually"}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(
                MOOD_CONFIG as Record<
                  string,
                  { emoji: string; label: string; color: string }
                >,
              ).map(([key, cfg], idx) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onEmotionDetected(key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `radial-gradient(circle, ${cfg.color}22, oklch(0.15 0.015 280 / 0.7))`,
                    border: `1.5px solid ${cfg.color}55`,
                  }}
                  data-ocid={`emotion.item.${idx + 1}`}
                >
                  <span className="text-3xl">{cfg.emoji}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {cfg.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Try camera again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
