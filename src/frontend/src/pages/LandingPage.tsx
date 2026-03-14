import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const MOODS = [
  { emoji: "😊", color: "oklch(0.85 0.2 85)", key: "happy" },
  { emoji: "😢", color: "oklch(0.55 0.18 240)", key: "sad" },
  { emoji: "⚡", color: "oklch(0.75 0.25 35)", key: "energetic" },
  { emoji: "🌊", color: "oklch(0.65 0.15 200)", key: "calm" },
  { emoji: "🌧️", color: "oklch(0.5 0.15 260)", key: "melancholic" },
  { emoji: "💜", color: "oklch(0.65 0.22 350)", key: "romantic" },
  { emoji: "🔥", color: "oklch(0.6 0.25 20)", key: "angry" },
  { emoji: "🌙", color: "oklch(0.6 0.18 180)", key: "chill" },
];

export function LandingPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {MOODS.map((m) => (
        <div
          key={m.key}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "120px",
            height: "120px",
            left: `${(MOODS.indexOf(m) * 137.5) % 100}%`,
            top: `${(MOODS.indexOf(m) * 97.3) % 100}%`,
            background: m.color,
            opacity: 0.08,
            filter: "blur(40px)",
            animation: `float ${4 + MOODS.indexOf(m)}s ease-in-out infinite`,
            animationDelay: `${MOODS.indexOf(m) * 0.7}s`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="font-display font-bold text-6xl md:text-8xl text-gradient mb-2">
            VIBECHAIN
          </h1>
          <div
            className="h-0.5 w-32 mx-auto rounded-full"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
            }}
          />
        </div>

        <p className="font-display text-xl md:text-2xl text-foreground/80 mb-3 leading-relaxed">
          It's not about how you look.
        </p>
        <p className="font-display text-xl md:text-2xl text-gradient font-semibold mb-8">
          It's about how you feel.
        </p>
        <p className="text-muted-foreground mb-10 text-base leading-relaxed">
          Connect emotionally through real-time vibe circles. Moods and music
          replace followers and filters. Every connection is real, fresh, and
          soulful.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Button
            size="lg"
            className="w-full max-w-xs h-12 font-semibold text-base"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
              border: "none",
            }}
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            data-ocid="auth.login_button"
          >
            {isLoggingIn || isInitializing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2 text-lg">🔑</span>
            )}
            {isLoggingIn ? "Connecting..." : "Connect with Internet Identity"}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full max-w-xs h-12 text-muted-foreground border-border/40"
            onClick={() =>
              toast.info("Use Internet Identity to sign in on Caffeine")
            }
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <title>Google</title>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full max-w-xs h-12 text-muted-foreground border-border/40"
            onClick={() =>
              toast.info("Use Internet Identity to sign in on Caffeine")
            }
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <title>Apple</title>
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continue with Apple
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/50 mt-6">
          Decentralized. Soulful. Yours.
        </p>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {MOODS.map((m) => (
          <div
            key={`float-${m.key}`}
            className="absolute text-4xl"
            style={{
              left: `${5 + ((MOODS.indexOf(m) * 13) % 90)}%`,
              top: `${10 + ((MOODS.indexOf(m) * 17) % 80)}%`,
              opacity: 0.1,
              animation: `float ${5 + MOODS.indexOf(m) * 1.3}s ease-in-out infinite`,
              animationDelay: `${MOODS.indexOf(m) * 0.5}s`,
              filter: "blur(1px)",
            }}
          >
            {m.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
