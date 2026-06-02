import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { generateWorkoutPlan } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workout")({
  head: () => ({ meta: [{ title: "Workout — Fitder X" }] }),
  component: WorkoutPage,
});

function WorkoutPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const uid = user?.id;
  const gen = useServerFn(generateWorkoutPlan);
  const [genLoading, setGenLoading] = useState(false);
  const [f, setF] = useState({ exercise: "", sets: "", reps: "", duration: "" });

  const { data: plan } = useQuery({
    queryKey: ["plan", uid],
    queryFn: async () => {
      const { data } = await supabase.from("workout_plans").select("*").eq("user_id", uid!).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!uid,
  });

  const { data: logs } = useQuery({
    queryKey: ["wlogs", uid],
    queryFn: async () => {
      const { data } = await supabase.from("workout_logs").select("*").eq("user_id", uid!).order("performed_at", { ascending: false }).limit(15);
      return data ?? [];
    },
    enabled: !!uid,
  });

  const log = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !f.exercise) return;
    const { error } = await supabase.from("workout_logs").insert({
      user_id: uid, exercise: f.exercise,
      sets: Number(f.sets) || null, reps: Number(f.reps) || null,
      duration_sec: f.duration ? Number(f.duration) * 60 : null,
    });
    if (error) return toast.error(error.message);
    setF({ exercise: "", sets: "", reps: "", duration: "" });
    qc.invalidateQueries({ queryKey: ["wlogs", uid] });
    qc.invalidateQueries({ queryKey: ["today", uid] });
    toast.success("✓");
  };

  const generate = async () => {
    setGenLoading(true);
    try { await gen(); qc.invalidateQueries({ queryKey: ["plan", uid] }); toast.success("AI plan ready"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setGenLoading(false); }
  };

  type PlanDay = { day: number; focus?: string; exercises?: { name: string; sets: number; reps: string | number }[] };
  const planObj = (plan?.plan as { days?: PlanDay[] } | null) ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("workout")}</h1>
        <Button onClick={generate} disabled={genLoading} className="bg-gradient-primary shadow-glow">
          {genLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {t("generate_plan")}
        </Button>
      </div>

      {planObj?.days && (
        <div className="glass rounded-2xl p-6 shadow-card">
          <h2 className="font-semibold mb-4">{plan?.title}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {planObj.days.map((d) => (
              <div key={d.day} className="rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="text-xs uppercase text-primary-glow">Day {d.day}</div>
                <div className="font-semibold mt-1">{d.focus}</div>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  {(d.exercises ?? []).map((ex, i) => (
                    <li key={i}>• {ex.name} — {ex.sets}×{ex.reps}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">{t("log_workout")}</h2>
        <form onSubmit={log} className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2"><Label>{t("exercise")}</Label>
            <Input value={f.exercise} onChange={(e) => setF({ ...f, exercise: e.target.value })} required /></div>
          <div><Label>{t("sets")}</Label><Input type="number" value={f.sets} onChange={(e) => setF({ ...f, sets: e.target.value })} /></div>
          <div><Label>{t("reps")}</Label><Input type="number" value={f.reps} onChange={(e) => setF({ ...f, reps: e.target.value })} /></div>
          <div><Label>{t("duration_min")}</Label><Input type="number" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></div>
          <Button type="submit" className="md:col-span-5 bg-gradient-primary">{t("add")}</Button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">{t("recent_workouts")}</h2>
        {(logs ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("no_data")}</p>}
        <div className="space-y-2">
          {(logs ?? []).map((w) => (
            <div key={w.id} className="flex justify-between text-sm border-b border-border/40 pb-2">
              <span>{w.exercise}</span>
              <span className="text-muted-foreground">{w.sets ?? 0}×{w.reps ?? 0} · {new Date(w.performed_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
