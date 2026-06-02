import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/twin")({
  head: () => ({ meta: [{ title: "Digital Twin — Fitder X" }] }),
  component: TwinPage,
});

function TwinPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const uid = user?.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
    enabled: !!uid,
  });

  const { data: stats } = useQuery({
    queryKey: ["twin-stats", uid],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const [meals, workouts] = await Promise.all([
        fetch(`/api/nutrition?since=${since.toISOString()}`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/workout/logs?since=${since.toISOString()}`, { credentials: "include" }).then(r => r.json()),
      ]);
      const days = Math.max(1, Math.min(30, new Set([...(meals ?? []).map((m: { loggedAt?: string }) => m.loggedAt?.slice(0, 10))]).size));
      const avgCal = (meals ?? []).reduce((s: number, m: { calories?: number }) => s + Number(m.calories ?? 0), 0) / days;
      const workoutsPerWeek = ((workouts ?? []).length / 30) * 7;
      return { avgCal, workoutsPerWeek };
    },
    enabled: !!uid,
  });

  const projection = useMemo(() => {
    if (!profile?.weightKg) return [];
    const w0 = Number(profile.weightKg);
    const avgCal = stats?.avgCal ?? 0;
    const tdee = 10 * w0 + 6.25 * Number(profile.heightCm ?? 170) - 5 * Number(profile.age ?? 30) + (profile.gender === "female" ? -161 : 5);
    const dailyDeficit = avgCal > 0 ? avgCal - tdee * 1.4 : 0;
    const weeklyChange = (dailyDeficit * 7) / 7700;
    const out: { week: number; weight: number; fitness: number }[] = [];
    const baseFit = 40 + Math.min(40, (stats?.workoutsPerWeek ?? 0) * 8);
    for (let i = 0; i <= 12; i++) {
      out.push({ week: i, weight: Number((w0 + weeklyChange * i).toFixed(1)), fitness: Math.min(100, Math.round(baseFit + i * 1.2)) });
    }
    return out;
  }, [profile, stats]);

  const last = projection[projection.length - 1];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow animate-pulse-glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("twin")}</h1>
          <p className="text-muted-foreground">{t("twin_desc")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-6 shadow-card">
          <div className="text-xs uppercase text-muted-foreground">{t("predicted_weight")}</div>
          <div className="mt-2 text-4xl font-bold text-gradient-primary">{last?.weight ?? "—"} kg</div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-card">
          <div className="text-xs uppercase text-muted-foreground">{t("predicted_fitness")}</div>
          <div className="mt-2 text-4xl font-bold text-gradient-primary">{last?.fitness ?? "—"}</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">12-week projection</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={projection}>
              <CartesianGrid stroke="oklch(0.3 0.05 275 / 30%)" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="oklch(0.7 0.03 275)" />
              <YAxis yAxisId="l" stroke="oklch(0.7 0.03 275)" />
              <YAxis yAxisId="r" orientation="right" stroke="oklch(0.7 0.03 275)" />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.05 275)", border: "1px solid oklch(0.3 0.05 275)" }} />
              <Line yAxisId="l" type="monotone" dataKey="weight" stroke="oklch(0.62 0.22 275)" strokeWidth={2.5} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="fitness" stroke="oklch(0.78 0.18 195)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
