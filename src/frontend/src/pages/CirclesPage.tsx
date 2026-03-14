import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { VibeCircleView } from "../backend.d";
import { Mood } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { MOOD_CONFIG } from "../lib/youtube";

export function CirclesPage() {
  const { actor } = useActor();
  const [circles, setCircles] = useState<[string, VibeCircleView][]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMood, setActiveMood] = useState<Mood>(Mood.chill);
  const [newName, setNewName] = useState("");
  const [newMood, setNewMood] = useState<Mood>(Mood.chill);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadCircles = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const res = await actor.getCirclesByMood(activeMood);
      setCircles(res);
    } catch {
      toast.error("Failed to load circles");
    } finally {
      setLoading(false);
    }
  }, [actor, activeMood]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const handleJoin = async (name: string) => {
    if (!actor) return;
    try {
      await actor.joinCircle(name);
      toast.success(`Joined ${name}!`);
      loadCircles();
    } catch {
      toast.error("Failed to join circle");
    }
  };

  const handleLeave = async (name: string) => {
    if (!actor) return;
    try {
      await actor.leaveCircle(name);
      toast.success(`Left ${name}`);
      loadCircles();
    } catch {
      toast.error("Failed to leave circle");
    }
  };

  const handleCreate = async () => {
    if (!actor || !newName.trim()) return;
    setCreating(true);
    try {
      await actor.createCircle(newName.trim(), newMood);
      toast.success("Circle created!");
      setCreateOpen(false);
      setNewName("");
      loadCircles();
    } catch {
      toast.error("Failed to create circle");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold text-gradient">
            Vibe Circles
          </h2>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
                  border: "none",
                }}
                data-ocid="circles.open_modal_button"
              >
                <Plus className="h-4 w-4" /> Create Circle
              </Button>
            </DialogTrigger>
            <DialogContent
              className="glass-strong border-border/40"
              data-ocid="circles.dialog"
            >
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-gradient">
                  Create a Vibe Circle
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Circle name..."
                  className="bg-input/50"
                  data-ocid="circles.input"
                />
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewMood(key as Mood)}
                      className={`p-3 rounded-xl text-center border transition-all ${
                        newMood === key
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
                <Button
                  className="w-full"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.2 295), oklch(0.65 0.22 350))",
                    border: "none",
                  }}
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  data-ocid="circles.submit_button"
                >
                  {creating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMood(key as Mood)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all ${
                activeMood === key
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border/20 text-muted-foreground hover:border-border/40"
              }`}
            >
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div
            className="flex justify-center py-12"
            data-ocid="circles.loading_state"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : circles.length === 0 ? (
          <div className="text-center py-16" data-ocid="circles.empty_state">
            <p className="text-4xl mb-3">🌀</p>
            <p className="text-muted-foreground">
              No circles for this mood yet. Create one!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {circles.map(([name, circle], i) => {
              const cfg = MOOD_CONFIG[circle.themeMood];
              return (
                <div
                  key={name}
                  className="glass rounded-2xl p-5 border border-border/20"
                  style={{ borderColor: `${cfg?.color}30` }}
                  data-ocid={`circles.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ background: `${cfg?.color}20` }}
                    >
                      {cfg?.emoji}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {cfg?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{circle.members.length} members</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleJoin(name)}
                        data-ocid={`circles.join_button.${i + 1}`}
                      >
                        Join
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-muted-foreground"
                        onClick={() => handleLeave(name)}
                        data-ocid={`circles.cancel_button.${i + 1}`}
                      >
                        Leave
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
