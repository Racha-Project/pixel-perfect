import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { screenHealth } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/screening")({
  head: () => ({ meta: [{ title: "Health Screening — Fitder X" }] }),
  component: ScreeningPage,
});

const SYMPTOMS = [
  { id: "fatigue", th: "อ่อนเพลีย/เหนื่อยล้า", en: "Fatigue" },
  { id: "headache", th: "ปวดหัว", en: "Headache" },
  { id: "back_pain", th: "ปวดหลัง", en: "Back pain" },
  { id: "shortness_of_breath", th: "หายใจไม่สะดวก", en: "Shortness of breath" },
  { id: "poor_sleep", th: "นอนหลับไม่ดี", en: "Poor sleep" },
  { id: "digestive_issues", th: "ปัญหาระบบย่อยอาหาร", en: "Digestive issues" },
  { id: "muscle_pain", th: "ปวดกล้ามเนื้อ", en: "Muscle pain" },
  { id: "mood_swings", th: "อารมณ์แปรปรวน", en: "Mood swings" },
];

const DIET_OPTIONS = [
  { val: "poor", th: "แย่มาก (Fast food ทุกวัน)", en: "Poor (Fast food daily)" },
  { val: "fair", th: "พอใช้ (ไม่สม่ำเสมอ)", en: "Fair (Inconsistent)" },
  { val: "good", th: "ดี (ค่อนข้างสมดุล)", en: "Good (Fairly balanced)" },
  { val: "excellent", th: "ดีมาก (สมดุลและหลากหลาย)", en: "Excellent (Balanced & varied)" },
];

const FREQ_OPTIONS = [
  { val: "none", th: "ไม่ออกเลย", en: "None" },
  { val: "1-2/week", th: "1-2 ครั้ง/สัปดาห์", en: "1-2x per week" },
  { val: "3-4/week", th: "3-4 ครั้ง/สัปดาห์", en: "3-4x per week" },
  { val: "5+/week", th: "5+ ครั้ง/สัปดาห์", en: "5+ per week" },
];

type ScreeningResult = {
  id: string;
  health_score: number;
  risk_level: string;
  ai_summary: string;
  recommendations: string[];
  created_at: string;
};

function SliderInput({ label, value, onChange, min = 1, max = 10 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = value <= 3 ? "bg-red-500" : value <= 6 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`font-bold text-lg ${value <= 3 ? "text-red-400" : value <= 6 ? "text-yellow-400" : "text-green-400"}`}>{value}/10</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function RiskBadge({ level, lang }: { level: string; lang: string }) {
  if (level === "low") return (
    <div className="flex items-center gap-2 text-green-400 font-semibold">
      <ShieldCheck className="h-5 w-5" /> {lang === "th" ? "ต่ำ" : "Low"}
    </div>
  );
  if (level === "high") return (
    <div className="flex items-center gap-2 text-red-400 font-semibold">
      <ShieldAlert className="h-5 w-5" /> {lang === "th" ? "สูง" : "High"}
    </div>
  );
  return (
    <div className="flex items-center gap-2 text-yellow-400 font-semibold">
      <AlertTriangle className="h-5 w-5" /> {lang === "th" ? "ปานกลาง" : "Medium"}
    </div>
  );
}

function ScreeningPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const uid = user?.id;
  const doScreen = useServerFn(screenHealth);

  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [answers, setAnswers] = useState({
    sleep_quality: 6, energy_level: 6, stress_level: 4,
    symptoms: [] as string[], diet_quality: "fair", exercise_freq: "1-2/week",
  });

  const { data: latest } = useQuery({
    queryKey: ["screening-latest", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("health_screenings")
        .select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(3);
      return (data ?? []) as ScreeningResult[];
    },
    enabled: !!uid,
  });

  const toggleSymptom = (id: string) => {
    setAnswers((a) => ({
      ...a,
      symptoms: a.symptoms.includes(id) ? a.symptoms.filter((s) => s !== id) : [...a.symptoms, id],
    }));
  };

  const submit = async () => {
    setStep("loading");
    try {
      await doScreen({ data: { answers } });
      qc.invalidateQueries({ queryKey: ["screening-latest", uid] });
      setStep("result");
    } catch (e) {
      toast.error((e as Error).message);
      setStep("form");
    }
  };

  const current = latest?.[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
          <Heart className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("screening_title")}</h1>
          <p className="text-muted-foreground">{t("screening_desc")}</p>
        </div>
      </div>

      {(step === "result" && current) ? (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted-foreground">{t("screening_result_score")}</div>
                <div className={`text-6xl font-bold mt-1 ${current.health_score >= 70 ? "text-green-400" : current.health_score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {current.health_score}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase text-muted-foreground mb-1">{t("screening_risk")}</div>
                <RiskBadge level={current.risk_level} lang={lang} />
              </div>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${current.health_score >= 70 ? "bg-green-500" : current.health_score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${current.health_score}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.ai_summary}</p>
          </div>

          {Array.isArray(current.recommendations) && current.recommendations.length > 0 && (
            <div className="glass rounded-2xl p-6 shadow-card">
              <h2 className="font-semibold mb-4">{t("screening_recommendations")}</h2>
              <ul className="space-y-3">
                {(current.recommendations as string[]).map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={() => setStep("form")} className="bg-gradient-primary shadow-glow w-full">
            {t("screening_redo")}
          </Button>
        </div>
      ) : step === "loading" ? (
        <div className="glass rounded-2xl p-16 shadow-card flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-muted-foreground">{t("screening_analyzing")}</div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 shadow-card space-y-8">
          <div className="space-y-6">
            <SliderInput label={t("screening_sleep")} value={answers.sleep_quality} onChange={(v) => setAnswers((a) => ({ ...a, sleep_quality: v }))} />
            <SliderInput label={t("screening_energy")} value={answers.energy_level} onChange={(v) => setAnswers((a) => ({ ...a, energy_level: v }))} />
            <SliderInput
              label={`${t("screening_stress")} (1=${lang === "th" ? "สูง" : "High"}, 10=${lang === "th" ? "ต่ำมาก" : "Very low"})`}
              value={answers.stress_level}
              onChange={(v) => setAnswers((a) => ({ ...a, stress_level: v }))}
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-3">{t("screening_symptoms")}</div>
            <div className="grid grid-cols-2 gap-2">
              {SYMPTOMS.map((s) => {
                const active = answers.symptoms.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSymptom(s.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm border transition ${
                      active ? "border-primary bg-primary/20 text-primary-foreground" : "border-border/40 bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    {lang === "th" ? s.th : s.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium mb-2">{t("screening_diet")}</div>
              <select
                value={answers.diet_quality}
                onChange={(e) => setAnswers((a) => ({ ...a, diet_quality: e.target.value }))}
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                {DIET_OPTIONS.map((o) => (
                  <option key={o.val} value={o.val}>{lang === "th" ? o.th : o.en}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">{t("screening_exercise_freq")}</div>
              <select
                value={answers.exercise_freq}
                onChange={(e) => setAnswers((a) => ({ ...a, exercise_freq: e.target.value }))}
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                {FREQ_OPTIONS.map((o) => (
                  <option key={o.val} value={o.val}>{lang === "th" ? o.th : o.en}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={submit} className="bg-gradient-primary shadow-glow w-full">
            <Heart className="h-4 w-4 mr-2" />
            {t("screening_submit")}
          </Button>
        </div>
      )}

      {(latest ?? []).length > 0 && step !== "result" && (
        <div className="glass rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold mb-3 text-sm">{t("screening_history")}</h3>
          <div className="space-y-2">
            {(latest ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
                <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-3">
                  <RiskBadge level={s.risk_level} lang={lang} />
                  <span className={`font-bold ${s.health_score >= 70 ? "text-green-400" : s.health_score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                    {s.health_score}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
