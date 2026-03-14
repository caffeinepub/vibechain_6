import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Edit2, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mood } from "../backend.d";
import { useApp } from "../contexts/AppContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MOOD_CONFIG } from "../lib/youtube";

export function ProfilePage() {
  const { actor } = useActor();
  const { profile, refreshProfile } = useApp();
  const { identity } = useInternetIdentity();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.chill);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl);
      setSelectedMood(profile.currentMood);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      await actor.updateProfile(displayName, avatarUrl, selectedMood, bio);
      await refreshProfile();
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const principal = identity?.getPrincipal().toString();
  const moodColor = profile ? MOOD_CONFIG[profile.currentMood]?.color : "";

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-start gap-5 mb-8">
            <div className="relative">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
                  }}
                >
                  {profile?.displayName?.[0] || "👤"}
                </div>
              )}
              {profile && (
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: `${moodColor}33`,
                    border: `2px solid ${moodColor}66`,
                  }}
                >
                  {MOOD_CONFIG[profile.currentMood]?.emoji}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {profile?.displayName || "Anonymous Vibe"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profile?.bio || "No bio yet"}
              </p>
              {principal && (
                <p className="text-xs text-muted-foreground/50 font-mono mt-2">{`${principal.slice(0, 30)}...`}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditing(!editing)}
              data-ocid="profile.edit_button"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {editing && (
            <div className="space-y-4 border-t border-border/30 pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Display Name
                </p>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-input/50"
                  data-ocid="profile.input"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bio</p>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-input/50 resize-none"
                  rows={3}
                  data-ocid="profile.textarea"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avatar URL</p>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="bg-input/50"
                  placeholder="https://..."
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Current Mood
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedMood(key as Mood)}
                      className={`p-3 rounded-xl text-center transition-all border ${
                        selectedMood === key
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="text-xl">{cfg.emoji}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {cfg.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
                  border: "none",
                }}
                onClick={handleSave}
                disabled={loading}
                data-ocid="profile.save_button"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
