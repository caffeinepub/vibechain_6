import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Mood } from "../backend.d";
import { useApp } from "../contexts/AppContext";
import { useActor } from "../hooks/useActor";
import { MOOD_CONFIG } from "../lib/youtube";

export function SetupProfilePage() {
  const { actor } = useActor();
  const { refreshProfile } = useApp();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.chill);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!actor || !displayName.trim()) return;
    setLoading(true);
    try {
      await actor.createProfile(
        displayName.trim(),
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h2 className="font-display text-3xl font-bold text-gradient mb-2">
          Set your vibe
        </h2>
        <p className="text-muted-foreground mb-8">
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
                  className={`p-3 rounded-xl text-center transition-all border ${
                    selectedMood === key
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/30 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="text-xl">{cfg.emoji}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
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
            disabled={loading || !displayName.trim()}
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
