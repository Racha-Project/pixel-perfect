import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { matchTrainers } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Loader2, Users, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/trainers")({
  head: () => ({ meta: [{ title: "Trainer Marketplace — Fitder X" }] }),
  component: TrainersPage,
});

type Trainer = {
  id: string;
  display_name: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  experience_years: number;
  experience_level: string;
  hourly_rate_thb: number;
  training_modality: string[];
  training_style: string;
  target_levels: string[];
  rating: number;
  review_count: number;
  retention_rate: number;
  gender: string;
  location: string;
  avatar_url: string | null;
  is_verified: boolean;
};

type MatchResult = {
  trainer_id: string;
  score: number;
  reasons: string[];
};

const STYLE_EMOJI: Record<string, string> = {
  strict: "⚡",
  supportive: "💚",
  analytical: "📊",
  flexible: "🌊",
};

const GOAL_SPECIALTIES: Record<string, string[]> = {
  weight_loss: ["Weight Loss", "HIIT", "Fat Loss", "Functional Training", "Cardio"],
  muscle_gain: ["Muscle Gain", "Strength Training", "Bodybuilding", "Hypertrophy", "Powerlifting"],
  recomposition: ["Body Recomposition", "Strength Training", "Functional Training", "HIIT"],
  general_fitness: ["General Fitness", "Functional Training", "Calisthenics", "Pilates", "Yoga"],
};

function avatarInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function TrainersPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const uid = user?.id;

  const [aiMatches, setAiMatches] = useState<MatchResult[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [filterModality, setFilterModality] = useState<string>("all");
  const [filterBudget, setFilterBudget] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMatchOnly, setShowMatchOnly] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!uid,
  });

  const { data: trainers = [], isLoading } = useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const res = await fetch("/api/trainers", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Trainer[]>;
    },
  });

  const handleAiMatch = async () => {
    if (!trainers.length) return;
    setAiLoading(true);
    setShowMatchOnly(true);
    try {
      const input = trainers.map((tr) => ({
        id: tr.id,
        display_name: tr.display_name,
        specialties: tr.specialties,
        experience_years: tr.experience_years,
        experience_level: tr.experience_level,
        hourly_rate_thb: tr.hourly_rate_thb,
        training_modality: tr.training_modality,
        training_style: tr.training_style,
        target_levels: tr.target_levels,
        rating: Number(tr.rating),
        retention_rate: tr.retention_rate,
        gender: tr.gender,
      }));
      const result = await matchTrainers({ data: { trainers: input } });
      setAiMatches(result.matches);
      toast.success(lang === "th" ? "AI จับคู่เสร็จแล้ว!" : "AI matching complete!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI error");
    } finally {
      setAiLoading(false);
    }
  };

  const getMatch = (id: string): MatchResult | undefined =>
    aiMatches?.find((m) => m.trainer_id === id);

  const styleLabel = (s: string) => {
    const map: Record<string, string> = {
      strict: t("trainer_style_strict"),
      supportive: t("trainer_style_supportive"),
      analytical: t("trainer_style_analytical"),
      flexible: t("trainer_style_flexible"),
    };
    return `${STYLE_EMOJI[s] ?? ""} ${map[s] ?? s}`;
  };

  const modalityLabel = (m: string) => {
    const map: Record<string, string> = {
      online: t("trainer_online"),
      gym: t("trainer_gym"),
      home: t("trainer_home"),
      studio: "Studio",
      outdoor: "Outdoor",
      clinic: "Clinic",
    };
    return map[m] ?? m;
  };

  const filteredTrainers = trainers
    .filter((tr) => {
      if (filterModality !== "all" && !tr.training_modality.includes(filterModality)) return false;
      if (filterBudget && tr.hourly_rate_thb > Number(filterBudget)) return false;
      return true;
    })
    .sort((a, b) => {
      if (!aiMatches) return Number(b.rating) - Number(a.rating);
      const ma = getMatch(a.id)?.score ?? 0;
      const mb = getMatch(b.id)?.score ?? 0;
      return mb - ma;
    });

  const goalSpecialties = profile?.goal ? (GOAL_SPECIALTIES[profile.goal] ?? []) : [];

  const scoreColor = (score: number) =>
    score >= 85 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-muted-foreground";

  const scoreBg = (score: number) =>
    score >= 85 ? "border-green-500/40 bg-green-500/5" : score >= 70 ? "border-yellow-500/40 bg-yellow-500/5" : "";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-purple-400" />
            {t("trainers")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {lang === "th" ? `เทรนเนอร์ ${trainers.length} คน — AI จับคู่ตามโปรไฟล์ของคุณ` : `${trainers.length} trainers — AI-matched to your profile`}
          </p>
        </div>
        <Button
          onClick={handleAiMatch}
          disabled={aiLoading || !trainers.length}
          className="bg-gradient-primary gap-2"
        >
          {aiLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{t("trainer_matching")}</>
          ) : (
            <><Sparkles className="h-4 w-4" />{t("trainer_match_btn")}</>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 glass rounded-xl p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">{t("trainer_filter_modality")}:</label>
          <select
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
            value={filterModality}
            onChange={(e) => setFilterModality(e.target.value)}
          >
            <option value="all">{lang === "th" ? "ทั้งหมด" : "All"}</option>
            <option value="online">{t("trainer_online")}</option>
            <option value="gym">{t("trainer_gym")}</option>
            <option value="home">{t("trainer_home")}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">{t("trainer_filter_budget")}:</label>
          <Input
            type="number"
            placeholder="e.g. 1000"
            className="w-28 h-8 text-sm"
            value={filterBudget}
            onChange={(e) => setFilterBudget(e.target.value)}
          />
        </div>
        {aiMatches && (
          <Button
            size="sm"
            variant={showMatchOnly ? "default" : "outline"}
            onClick={() => setShowMatchOnly(!showMatchOnly)}
            className="text-xs"
          >
            {showMatchOnly ? "✨ AI Sorted" : "Sort by AI"}
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground self-center">
          {filteredTrainers.length} {lang === "th" ? "เทรนเนอร์" : "trainers"}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredTrainers.map((tr) => {
          const match = getMatch(tr.id);
          const isExpanded = expandedId === tr.id;
          const hasGoalMatch = goalSpecialties.some((s) => tr.specialties.includes(s));

          return (
            <div
              key={tr.id}
              className={`glass rounded-2xl p-5 shadow-card border transition-all ${match ? scoreBg(match.score) : "border-border/30"}`}
            >
              <div className="flex gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-primary shadow-glow grid place-items-center font-bold text-lg text-primary-foreground shrink-0">
                  {tr.avatar_url
                    ? <img src={tr.avatar_url} alt={tr.display_name} className="h-full w-full rounded-xl object-cover" />
                    : avatarInitials(tr.display_name)
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold leading-tight">{tr.display_name}</h3>
                        {tr.is_verified && (
                          <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" title={t("trainer_verified")} />
                        )}
                        {hasGoalMatch && !match && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/40 text-purple-400">
                            {lang === "th" ? "เหมาะกับเป้าหมาย" : "Goal match"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{tr.location} · {styleLabel(tr.training_style)}</div>
                    </div>

                    {match ? (
                      <div className="text-right shrink-0">
                        <div className={`text-2xl font-bold ${scoreColor(match.score)}`}>{match.score}%</div>
                        <div className="text-[10px] text-muted-foreground">{t("trainer_match_score")}</div>
                      </div>
                    ) : (
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-sm">{Number(tr.rating).toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{tr.review_count} {t("trainer_reviews_count")}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tr.specialties.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                    ))}
                    {tr.specialties.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{tr.specialties.length - 3}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center glass rounded-lg py-2 px-1">
                  <div className="text-sm font-bold text-primary-glow">{tr.hourly_rate_thb.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">{t("trainer_thb")}/hr</div>
                </div>
                <div className="text-center glass rounded-lg py-2 px-1">
                  <div className="text-sm font-bold">{tr.experience_years}</div>
                  <div className="text-[10px] text-muted-foreground">{t("trainer_years")}</div>
                </div>
                <div className="text-center glass rounded-lg py-2 px-1">
                  <div className="text-sm font-bold text-green-400">{tr.retention_rate}%</div>
                  <div className="text-[10px] text-muted-foreground">{t("trainer_retention")}</div>
                </div>
              </div>

              <div className="flex gap-1.5 mt-3 flex-wrap">
                {tr.training_modality.map((m) => (
                  <Badge key={m} variant="outline" className="text-[10px] px-2 py-0.5">{modalityLabel(m)}</Badge>
                ))}
              </div>

              {match && match.reasons.length > 0 && (
                <button
                  className="w-full mt-3 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : tr.id)}
                >
                  <div className="flex items-center justify-between text-xs text-primary-glow hover:underline">
                    <span>✨ {t("trainer_why")}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                  {isExpanded && (
                    <ul className="mt-2 space-y-1">
                      {match.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              )}

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-primary text-xs h-8"
                  onClick={() => toast.info(lang === "th" ? "ระบบจองกำลังจะมาเร็วๆ นี้!" : "Booking system coming soon!")}
                >
                  {t("trainer_book")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3"
                  onClick={() => setExpandedId(isExpanded ? null : tr.id)}
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {isExpanded && !match && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground leading-relaxed">{tr.bio}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tr.certifications.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/40 text-blue-400">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && match && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground leading-relaxed">{tr.bio}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tr.certifications.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/40 text-blue-400">{c}</Badge>
                    ))}
                  </div>
                  {match.score > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-muted-foreground">{Number(tr.rating).toFixed(2)} · {tr.review_count} {t("trainer_reviews_count")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLoading && filteredTrainers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{lang === "th" ? "ไม่พบเทรนเนอร์ที่ตรงกับเงื่อนไข" : "No trainers match your filters"}</p>
        </div>
      )}

      {!aiMatches && !aiLoading && trainers.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-purple-500/20 text-center">
          <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">{t("trainer_match_ai")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {lang === "th"
              ? "กด AI จับคู่ เพื่อให้ระบบวิเคราะห์ความเข้ากันระหว่างคุณกับเทรนเนอร์แต่ละคน พร้อมอธิบายเหตุผล"
              : "Click AI Match to score compatibility between your profile and each trainer, with detailed explanations."
            }
          </p>
          <Button onClick={handleAiMatch} disabled={aiLoading} className="bg-gradient-primary">
            <Sparkles className="h-4 w-4 mr-2" />
            {t("trainer_match_btn")}
          </Button>
        </div>
      )}
    </div>
  );
}
