import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { matchTrainers } from "@/lib/ai.functions";
import { Star, Shield, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/matches")({
  head: () => ({ meta: [{ title: "AI Matches — Fitder X" }] }),
  component: MatchesPage,
});

type Trainer = {
  id: string; displayName: string; bio: string; specialties: string[];
  certifications: string[]; experienceYears: number; hourlyRateThb: number;
  trainingModality: string[]; trainingStyle: string; rating: number;
  reviewCount: number; retentionRate: number; gender: string;
  location: string; avatarUrl: string | null; isVerified: boolean;
  experienceLevel: string; targetLevels: string[];
};

type MatchResult = { trainer_id: string; score: number; reasons: string[] };

const MODALITY_LABELS: Record<string, string> = { online: "ออนไลน์", gym: "ยิม", home: "บ้าน", studio: "สตูดิโอ", outdoor: "กลางแจ้ง" };

function MatchesPage() {
  const { user } = useAuth();
  const uid = user?.id;
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: trainers = [], isLoading: tLoading } = useQuery<Trainer[]>({
    queryKey: ["trainers"],
    queryFn: async () => {
      const res = await fetch("/api/trainers");
      return res.ok ? res.json() : [];
    },
  });

  const runMatch = async () => {
    if (!trainers.length) return;
    setLoading(true);
    try {
      const input = trainers.map(tr => ({
        id: tr.id, display_name: tr.displayName, specialties: tr.specialties,
        experience_years: tr.experienceYears, experience_level: tr.experienceLevel,
        hourly_rate_thb: tr.hourlyRateThb, training_modality: tr.trainingModality,
        training_style: tr.trainingStyle, target_levels: tr.targetLevels,
        rating: Number(tr.rating), retention_rate: tr.retentionRate, gender: tr.gender,
      }));
      const result = await matchTrainers({ data: { trainers: input } });
      setMatches(result.matches);
      toast.success("AI จับคู่เสร็จแล้ว!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getMatch = (id: string) => matches?.find(m => m.trainer_id === id);

  const sorted = [...trainers].sort((a, b) => {
    if (!matches) return 0;
    return (getMatch(b.id)?.score ?? 0) - (getMatch(a.id)?.score ?? 0);
  });

  const scoreColor = (s: number) => s >= 85 ? "text-green-400" : s >= 70 ? "text-yellow-400" : "text-muted-foreground";
  const scoreBg = (s: number) => s >= 85 ? "border-green-500/30 bg-green-500/5" : s >= 70 ? "border-yellow-500/30 bg-yellow-500/5" : "";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">Matches</div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            AI Trainer Matches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI วิเคราะห์โปรไฟล์ของคุณเพื่อจับคู่เทรนเนอร์ที่เหมาะที่สุด</p>
        </div>
        <Button onClick={runMatch} disabled={loading || tLoading || !trainers.length} className="bg-gradient-primary shadow-glow gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />กำลังวิเคราะห์…</> : <><Sparkles className="h-4 w-4" />จับคู่ AI</>}
        </Button>
      </div>

      {!matches && !loading && (
        <div className="glass rounded-2xl p-10 shadow-card border border-primary/20 text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3 opacity-60" />
          <h2 className="text-xl font-semibold mb-2">ยังไม่ได้จับคู่</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            กด "จับคู่ AI" เพื่อให้ระบบวิเคราะห์ความเข้ากันระหว่างโปรไฟล์ของคุณกับเทรนเนอร์แต่ละคน พร้อมอธิบายเหตุผล
          </p>
          <Button onClick={runMatch} disabled={loading || tLoading} className="bg-gradient-primary shadow-glow gap-2">
            <Sparkles className="h-4 w-4" />จับคู่ AI
          </Button>
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl p-16 shadow-card flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">AI กำลังวิเคราะห์เทรนเนอร์ {trainers.length} คน…</p>
        </div>
      )}

      {matches && !loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((tr, idx) => {
            const match = getMatch(tr.id);
            const score = match?.score ?? 0;
            const isOpen = expanded === tr.id;
            return (
              <div key={tr.id} className={`glass rounded-2xl p-5 shadow-card border transition-all ${match ? scoreBg(score) : "border-border/30"}`}>
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-xl bg-gradient-primary/20 grid place-items-center">
                      {tr.avatarUrl
                        ? <img src={tr.avatarUrl} alt={tr.displayName} className="h-full w-full rounded-xl object-cover" />
                        : <span className="font-bold text-lg text-primary">{tr.displayName[0]}</span>}
                    </div>
                    {idx === 0 && match && <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[8px] font-bold px-1 rounded-full">#1</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold leading-tight">{tr.displayName}</h3>
                      {tr.isVerified && <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tr.specialties.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>฿{tr.hourlyRateThb}/ชม.</span>
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{Number(tr.rating).toFixed(1)}</span>
                    </div>
                  </div>
                  {match && (
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}%</div>
                      <div className="text-[10px] text-muted-foreground">Match</div>
                    </div>
                  )}
                </div>

                {match && match.reasons.length > 0 && (
                  <button className="w-full mt-3 text-left" onClick={() => setExpanded(isOpen ? null : tr.id)}>
                    <div className="flex items-center justify-between text-xs text-primary hover:underline">
                      <span>✨ ทำไม AI ถึงแนะนำ?</span>
                      {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </div>
                    {isOpen && (
                      <ul className="mt-2 space-y-1">
                        {match.reasons.map((r, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-400 mt-0.5">✓</span><span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                )}

                <div className="mt-3">
                  <Link to="/bookings">
                    <Button size="sm" className="w-full bg-gradient-primary text-xs h-8">จองเซสชัน</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
