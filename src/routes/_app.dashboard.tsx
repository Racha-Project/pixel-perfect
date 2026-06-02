import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Activity, Apple, Dumbbell, Droplet, Flame, Sparkles, ArrowRight, Trophy, Heart } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Fitder X" }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, sub, accent }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; accent?: string;
}) {
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

function updateStreakLogic(last: Date | null, current: number, longest: number) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!last) return { current: 1, longest: Math.max(1, longest) };
  const diff = Math.floor((today.getTime() - last.getTime()) / 86400000);
  if (diff === 0) return { current, longest };
  if (diff === 1) { const next = current + 1; return { current: next, longest: Math.max(next, longest) }; }
  return { current: 1, longest };
}

function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
    enabled: !!uid,
  });

  const { data: today } = useQuery({
    queryKey: ["today", uid],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [meals, workouts] = await Promise.all([
        fetch(`/api/nutrition?since=${start.toISOString()}`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/workout/logs?since=${start.toISOString()}`, { credentials: "include" }).then(r => r.json()),
      ]);
      const calories = (meals ?? []).reduce((s: number, m: { calories?: number }) => s + Number(m.calories ?? 0), 0);
      const water = (meals ?? []).reduce((s: number, m: { waterMl?: number }) => s + Number(m.waterMl ?? 0), 0);
      return { calories, water, workouts: (workouts ?? []).length, meals: meals ?? [], workoutsList: workouts ?? [] };
    },
    enabled: !!uid,
  });

  const { data: streak } = useQuery({
    queryKey: ["streak", uid],
    queryFn: async () => {
      const res = await fetch("/api/streaks", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
    enabled: !!uid,
  });

  const { data: achievements } = useQuery({
    queryKey: ["achievements", uid],
    queryFn: async () => {
      const res = await fetch("/api/achievements", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!uid,
  });

  useEffect(() => {
    if (!uid || streak === undefined) return;
    const update = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const last = streak?.lastActiveDate ? new Date(streak.lastActiveDate) : null;
      const { current, longest } = updateStreakLogic(last, streak?.currentStreak ?? 0, streak?.longestStreak ?? 0);
      await fetch("/api/streaks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_streak: current, longest_streak: longest, last_active_date: today.toISOString().slice(0, 10) }),
      });
      qc.invalidateQueries({ queryKey: ["streak", uid] });
    };
    update();
  }, [uid, streak, qc]);

  const healthScore = Math.min(100, Math.round(
    50
    + Math.min((today?.workouts ?? 0) * 10, 30)
    + Math.min((today?.water ?? 0) / 50, 20)
  ));

  const currentStreak = streak?.currentStreak ?? 0;
  const earnedCount = (achievements ?? []).length;

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4 py-8">
      <section className="space-y-4">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Dashboard</div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{t("welcome")}, {profile?.displayName || "athlete"}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-7">
              Fitder X นำ AI มาแปลงข้อมูลสุขภาพของคุณเป็นภาพรวมที่ชัดเจนและ ready-to-act ในทุกวัน
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 shadow-card">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Live AI Pulse</div>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-5xl font-bold text-gradient-primary">{healthScore}</span>
              <span className="text-sm text-muted-foreground pb-1">/100</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              คะแนนสุขภาพที่รวมการออกกำลังกาย น้ำ และ recovery เป็นตัวเดียว
            </div>
          </div>
        </div>
      </section>

      <section className="glass rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="relative isolate rounded-[1.75rem] border border-white/10 bg-background/80 p-6 text-center overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#00ff85]/20 to-transparent blur-3xl" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00ff85]/20 to-transparent blur-2xl" />
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-background/90 shadow-glow">
                    <div className="text-5xl font-semibold tracking-tight text-gradient-primary">{healthScore}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">Health Score</div>
                  </div>
                </div>
              </div>
              <p className="max-w-[280px] text-sm leading-6 text-muted-foreground">
                AI Digital Twin ให้คุณเห็นสัญญาณสุขภาพหลักพร้อม insight สำหรับการตัดสินใจในวันนี้
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Command Center</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">Premium Health Operating System</h2>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary shadow-glow">
                Realtime
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              สรุปทุกการเคลื่อนไหวของคุณในหน้าเดียวด้วยความชัดเจน แข็งแรง และดูเป็นระบบ.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass rounded-3xl border border-white/10 p-5 shadow-card">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Current streak</div>
                <div className="mt-3 text-3xl font-semibold text-gradient-primary">{currentStreak}</div>
                <div className="mt-1 text-sm text-muted-foreground">days active</div>
              </div>
              <div className="glass rounded-3xl border border-white/10 p-5 shadow-card">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Badges earned</div>
                <div className="mt-3 text-3xl font-semibold text-gradient-primary">{earnedCount}</div>
                <div className="mt-1 text-sm text-muted-foreground">AI achievements</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Activity} label={t("health_score")} value={String(healthScore)} sub="/ 100" />
        <Stat icon={Flame} label={t("calories_today")} value={String(Math.round(today?.calories ?? 0))} sub="kcal" accent="bg-gradient-cyan" />
        <Stat icon={Dumbbell} label={t("workouts_done")} value={String(today?.workouts ?? 0)} />
        <Stat icon={Droplet} label={t("water_intake")} value={String(Math.round(today?.water ?? 0))} sub="ml" accent="bg-gradient-cyan" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/achievements" className="block group">
          <div className="glass rounded-2xl p-5 shadow-card hover:shadow-glow transition h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{currentStreak >= 7 ? "⚡" : currentStreak >= 3 ? "🔥" : "🌱"}</div>
                <div>
                  <div className="font-semibold">{t("daily_streak")}</div>
                  <div className="text-xs text-muted-foreground">{earnedCount} {lang === "th" ? "ป้ายที่ได้รับ" : "badges earned"}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gradient-primary">{currentStreak}</div>
                <div className="text-xs text-muted-foreground">{t("days")}</div>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/screening" className="block group">
          <div className="glass rounded-2xl p-5 shadow-card hover:shadow-glow transition h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/30 grid place-items-center">
                  <Heart className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <div className="font-semibold">{t("screening_title")}</div>
                  <div className="text-xs text-muted-foreground">{t("screening_desc").slice(0, 40)}…</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition" />
            </div>
          </div>
        </Link>
      </div>

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
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t("recent_meals")}</h3>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2 text-sm">
            {(today?.meals ?? []).length === 0 && <div className="text-muted-foreground">{t("no_data")}</div>}
            {(today?.meals ?? []).slice(0, 5).map((m: { id: string; meal: string; calories?: number }) => (
              <div key={m.id} className="flex justify-between border-b border-border/40 pb-2">
                <span>{m.meal}</span>
                <span className="text-muted-foreground">{Math.round(Number(m.calories))} kcal</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t("recent_workouts")}</h3>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2 text-sm">
            {(today?.workoutsList ?? []).length === 0 && <div className="text-muted-foreground">{t("no_data")}</div>}
            {(today?.workoutsList ?? []).slice(0, 5).map((w: { id: string; exercise: string; sets?: number; reps?: number }) => (
              <div key={w.id} className="flex justify-between border-b border-border/40 pb-2">
                <span>{w.exercise}</span>
                <span className="text-muted-foreground">{w.sets ?? 0}×{w.reps ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {earnedCount > 0 && (
        <Link to="/achievements" className="block">
          <div className="glass rounded-2xl p-5 shadow-card hover:shadow-glow transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">{earnedCount} {lang === "th" ? "ป้ายรางวัลที่ได้รับ" : "badges earned"}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
