import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Mood } from "../backend.d";
import { useApp } from "../contexts/AppContext";
import { useActor } from "../hooks/useActor";
import { MOOD_CONFIG } from "../lib/youtube";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const validateUsername = (val: string) => /^[a-z0-9_]{3,20}$/.test(val);

export function SetupProfilePage() {
  const { actor } = useActor();
  const { refreshProfile } = useApp();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>("chill" as Mood);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    if (!validateUsername(username)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    debounceRef.current = setTimeout(async () => {
      if (!actor) return;
      try {
        const taken = await actor.isUsernameTaken(username);
        setUsernameStatus(taken ? "taken" : "available");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, actor]);

  const handleCreate = async () => {
    if (!actor || !displayName.trim() || usernameStatus !== "available") return;
    setLoading(true);
    try {
      await actor.createProfile(
        displayName.trim(),
        username,
        avatarUrl || "",
        selectedMood,
        bio,
      );
      await refreshProfile();
      toast.success("Welcome to VIBECHAIN!");
    } catch {
      toast.error("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    displayName.trim() && usernameStatus === "available" && !loading;

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8 overflow-y-auto">
      <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-md my-auto">
        <h2 className="font-display text-3xl font-bold text-gradient mb-2">
          Set your vibe
        </h2>
        <p className="text-muted-foreground mb-6">
          Tell us how you feel to get started
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Display Name</p>
            <Input
              id="setup-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              className="bg-input/50"
              data-ocid="profile.input"
            />
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Username</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm">
                @
              </span>
              <Input
                id="setup-username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                placeholder="your_username"
                className="bg-input/50 pl-7 pr-9"
                data-ocid="setup.username.input"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <Check
                    className="h-4 w-4 text-green-400"
                    data-ocid="setup.username.success_state"
                  />
                )}
                {(usernameStatus === "taken" ||
                  usernameStatus === "invalid") && (
                  <X
                    className="h-4 w-4 text-red-400"
                    data-ocid="setup.username.error_state"
                  />
                )}
              </div>
            </div>
            {usernameStatus === "taken" && (
              <p
                className="text-xs text-red-400 mt-1"
                data-ocid="setup.username.error_state"
              >
                Username already taken
              </p>
            )}
            {usernameStatus === "invalid" && (
              <p
                className="text-xs text-red-400 mt-1"
                data-ocid="setup.username.error_state"
              >
                3–20 chars, lowercase letters, numbers, underscores only
              </p>
            )}
            {usernameStatus === "available" && (
              <p
                className="text-xs text-green-400 mt-1"
                data-ocid="setup.username.success_state"
              >
                @{username} is available!
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Bio (optional)</p>
            <Textarea
              id="setup-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your soul..."
              className="bg-input/50 resize-none"
              rows={3}
              data-ocid="profile.textarea"
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Avatar URL (optional)
            </p>
            <Input
              id="setup-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="bg-input/50"
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-3">Current Mood</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMood(key as Mood)}
                  className={`p-2 sm:p-3 rounded-xl text-center transition-all border ${
                    selectedMood === key
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/30 bg-white/5 hover:bg-white/10"
                  }`}
                  data-ocid="profile.toggle"
                >
                  <div className="text-lg sm:text-xl">{cfg.emoji}</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 leading-tight">
                    {cfg.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Button
            className="w-full h-11 font-semibold mt-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
              border: "none",
            }}
            onClick={handleCreate}
            disabled={!canSubmit}
            data-ocid="profile.submit_button"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enter VIBECHAIN
          </Button>
        </div>
      </div>
    </div>
  );
}
