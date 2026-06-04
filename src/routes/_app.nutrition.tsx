import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { recognizeMeal } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — Fitder X" }] }),
  component: NutritionPage,
});

function calcTargets(p: { weight_kg?: number | null; height_cm?: number | null; age?: number | null; gender?: string | null; goal?: string | null } | null) {
  if (!p?.weight_kg || !p?.height_cm || !p?.age) return null;
  const s = p.gender === "female" ? -161 : 5;
  const bmr = 10 * Number(p.weight_kg) + 6.25 * Number(p.height_cm) - 5 * Number(p.age) + s;
  const tdee = bmr * 1.45;
  const target = p.goal === "weight_loss" ? tdee - 400 : p.goal === "muscle_gain" ? tdee + 300 : tdee;
  return {
    calories: Math.round(target),
    protein: Math.round(Number(p.weight_kg) * 1.8),
    carbs: Math.round((target * 0.45) / 4),
    fat: Math.round((target * 0.25) / 9),
  };
}

function NutritionPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const uid = user?.id;
  const [f, setF] = useState({ meal: "", calories: "", protein: "", carbs: "", fat: "", water: "" });
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!uid,
  });

  const { data: meals } = useQuery({
    queryKey: ["meals", uid],
    queryFn: async () => {
      const res = await fetch("/api/nutrition/today", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!uid,
  });

  const targets = calcTargets(profile ?? null);
  const totals = (meals ?? []).reduce((s: { cal: number; p: number; c: number; f: number; w: number }, m: { calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; water_ml?: number }) => ({
    cal: s.cal + Number(m.calories ?? 0),
    p: s.p + Number(m.protein_g ?? 0),
    c: s.c + Number(m.carbs_g ?? 0),
    f: s.f + Number(m.fat_g ?? 0),
    w: s.w + Number(m.water_ml ?? 0),
  }), { cal: 0, p: 0, c: 0, f: 0, w: 0 });

  const handleAiRecognize = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const result = await recognizeMeal({ data: { description: aiInput.trim() } });
      setF({
        meal: result.meal,
        calories: String(result.calories),
        protein: String(result.protein_g),
        carbs: String(result.carbs_g),
        fat: String(result.fat_g),
        water: f.water,
      });
      setAiInput("");
      toast.success(t("ai_recognize_meal") + " ✓");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI error");
    } finally {
      setAiLoading(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !f.meal) return;
    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        meal: f.meal,
        calories: Number(f.calories) || 0,
        protein_g: Number(f.protein) || 0,
        carbs_g: Number(f.carbs) || 0,
        fat_g: Number(f.fat) || 0,
        water_ml: Number(f.water) || 0,
      }),
    });
    if (!res.ok) return toast.error(await res.text());
    setF({ meal: "", calories: "", protein: "", carbs: "", fat: "", water: "" });
    qc.invalidateQueries({ queryKey: ["meals", uid] });
    qc.invalidateQueries({ queryKey: ["today", uid] });
  };

  const Ring = ({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) => {
    const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
    return (
      <div className="glass rounded-2xl p-5 shadow-card">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-bold">{Math.round(value)} <span className="text-sm font-normal text-muted-foreground">/ {target}{unit}</span></div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("nutrition")}</h1>

      {targets && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Ring label={t("calories")} value={totals.cal} target={targets.calories} unit="kcal" />
          <Ring label={t("protein")} value={totals.p} target={targets.protein} unit="g" />
          <Ring label={t("carbs")} value={totals.c} target={targets.carbs} unit="g" />
          <Ring label={t("water_intake")} value={totals.w} target={2500} unit="ml" />
        </div>
      )}

      <div className="glass rounded-2xl p-6 shadow-card border border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h2 className="font-semibold">{t("ai_recognize_meal")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{t("ai_recognize_hint")}</p>
        <div className="flex gap-2">
          <Textarea
            className="flex-1 min-h-[60px] resize-none"
            placeholder={t("ai_recognize_placeholder")}
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiRecognize(); } }}
          />
          <Button
            onClick={handleAiRecognize}
            disabled={aiLoading || !aiInput.trim()}
            className="bg-gradient-primary self-end px-5"
          >
            {aiLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("ai_recognizing")}</>
            ) : (
              t("ai_recognize_btn")
            )}
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">{t("log_meal")}</h2>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2"><Label>{t("meal_name")}</Label>
            <Input value={f.meal} onChange={(e) => setF({ ...f, meal: e.target.value })} required /></div>
          <div><Label>{t("calories")}</Label><Input type="number" value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} /></div>
          <div><Label>{t("protein")}</Label><Input type="number" value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })} /></div>
          <div><Label>{t("carbs")}</Label><Input type="number" value={f.carbs} onChange={(e) => setF({ ...f, carbs: e.target.value })} /></div>
          <div><Label>{t("water_ml")}</Label><Input type="number" value={f.water} onChange={(e) => setF({ ...f, water: e.target.value })} /></div>
          <Button type="submit" className="md:col-span-6 bg-gradient-primary">{t("add")}</Button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">{t("recent_meals")}</h2>
        {(meals ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("no_data")}</p>}
        <div className="space-y-2">
          {(meals ?? []).map((m: { id: string; meal: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number }) => (
            <div key={m.id} className="flex justify-between text-sm border-b border-border/40 pb-2">
              <span>{m.meal}</span>
              <span className="text-muted-foreground">{Math.round(Number(m.calories))} kcal · P{Math.round(Number(m.protein_g))} C{Math.round(Number(m.carbs_g))} F{Math.round(Number(m.fat_g))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
