import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Edit2, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mood } from "../backend.d";
import { useApp } from "../contexts/AppContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MOOD_CONFIG } from "../lib/youtube";

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "unchanged";

const validateUsername = (val: string) => /^[a-z0-9_]{3,20}$/.test(val);

export function ProfilePage() {
  const { actor } = useActor();
  const { profile, refreshProfile } = useApp();
  const { identity } = useInternetIdentity();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.chill);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username || "");
      setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl);
      setSelectedMood(profile.currentMood);
    }
  }, [profile]);

  useEffect(() => {
    if (!editing) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    if (username === (profile?.username || "")) {
      setUsernameStatus("unchanged");
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
  }, [username, actor, editing, profile]);

  const handleSave = async () => {
    if (!actor) return;
    if (usernameStatus === "taken" || usernameStatus === "invalid") return;
    setLoading(true);
    try {
      await actor.updateProfile(
        displayName,
        username,
        avatarUrl,
        selectedMood,
        bio,
      );
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
              {profile?.username && (
                <p className="text-sm text-muted-foreground/70 mt-0.5">
                  <span className="text-muted-foreground/40">@</span>
                  {profile.username}
                </p>
              )}
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
                <p className="text-sm text-muted-foreground mb-1">Username</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm">
                    @
                  </span>
                  <Input
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    className="bg-input/50 pl-7 pr-9"
                    data-ocid="profile.username.input"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {(usernameStatus === "available" ||
                      usernameStatus === "unchanged") && (
                      <Check
                        className="h-4 w-4 text-green-400"
                        data-ocid="profile.username.success_state"
                      />
                    )}
                    {(usernameStatus === "taken" ||
                      usernameStatus === "invalid") && (
                      <X
                        className="h-4 w-4 text-red-400"
                        data-ocid="profile.username.error_state"
                      />
                    )}
                  </div>
                </div>
                {usernameStatus === "taken" && (
                  <p
                    className="text-xs text-red-400 mt-1"
                    data-ocid="profile.username.error_state"
                  >
                    Username already taken
                  </p>
                )}
                {usernameStatus === "invalid" && (
                  <p
                    className="text-xs text-red-400 mt-1"
                    data-ocid="profile.username.error_state"
                  >
                    3–20 chars, lowercase letters, numbers, underscores only
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p
                    className="text-xs text-green-400 mt-1"
                    data-ocid="profile.username.success_state"
                  >
                    @{username} is available!
                  </p>
                )}
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
                disabled={
                  loading ||
                  usernameStatus === "taken" ||
                  usernameStatus === "invalid"
                }
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
