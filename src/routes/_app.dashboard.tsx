import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Apple, Dumbbell, Droplet, Flame, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Fitder X" }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, sub, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`h-9 w-9 rounded-lg grid place-items-center ${accent ?? "bg-gradient-primary"} shadow-glow`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const uid = user?.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid!).maybeSingle();
      return data;
    },
    enabled: !!uid,
  });

  const { data: today } = useQuery({
    queryKey: ["today", uid],
    queryFn: async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const [{ data: meals }, { data: workouts }] = await Promise.all([
        supabase.from("nutrition_logs").select("*").eq("user_id", uid!).gte("logged_at", start.toISOString()),
        supabase.from("workout_logs").select("*").eq("user_id", uid!).gte("performed_at", start.toISOString()),
      ]);
      const calories = (meals ?? []).reduce((s, m) => s + Number(m.calories ?? 0), 0);
      const water = (meals ?? []).reduce((s, m) => s + Number(m.water_ml ?? 0), 0);
      return { calories, water, workouts: workouts?.length ?? 0, meals: meals ?? [], workoutsList: workouts ?? [] };
    },
    enabled: !!uid,
  });

  const healthScore = Math.min(100, Math.round(
    50
    + Math.min((today?.workouts ?? 0) * 10, 30)
    + Math.min((today?.water ?? 0) / 50, 20)
  ));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">{t("today")}</div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">{t("welcome")}, {profile?.display_name || "athlete"} 👋</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Activity} label={t("health_score")} value={String(healthScore)} sub="/ 100" />
        <Stat icon={Flame} label={t("calories_today")} value={String(Math.round(today?.calories ?? 0))} sub="kcal" accent="bg-gradient-cyan" />
        <Stat icon={Dumbbell} label={t("workouts_done")} value={String(today?.workouts ?? 0)} />
        <Stat icon={Droplet} label={t("water_intake")} value={String(Math.round(today?.water ?? 0))} sub="ml" accent="bg-gradient-cyan" />
      </div>

      {/* Digital Twin card */}
      <Link to="/twin" className="block group">
        <div className="glass rounded-2xl p-6 shadow-card hover:shadow-glow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow animate-pulse-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">{t("twin")}</div>
                <div className="text-xs text-muted-foreground">{t("twin_desc")}</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition" />
          </div>
        </div>
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("recent_meals")}</h3>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {(today?.meals ?? []).length === 0 && <div className="text-muted-foreground">{t("no_data")}</div>}
            {(today?.meals ?? []).slice(0, 5).map((m) => (
              <div key={m.id} className="flex justify-between border-b border-border/40 pb-2">
                <span>{m.meal}</span>
                <span className="text-muted-foreground">{Math.round(Number(m.calories))} kcal</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("recent_workouts")}</h3>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {(today?.workoutsList ?? []).length === 0 && <div className="text-muted-foreground">{t("no_data")}</div>}
            {(today?.workoutsList ?? []).slice(0, 5).map((w) => (
              <div key={w.id} className="flex justify-between border-b border-border/40 pb-2">
                <span>{w.exercise}</span>
                <span className="text-muted-foreground">{w.sets ?? 0}×{w.reps ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
