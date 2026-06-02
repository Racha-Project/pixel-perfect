import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Shield, Loader2, User, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/discover")({
  head: () => ({ meta: [{ title: "Discover Trainers — Fitder X" }] }),
  component: DiscoverPage,
});

type Trainer = {
  id: string; displayName: string; bio: string; specialties: string[];
  certifications: string[]; experienceYears: number; hourlyRateThb: number;
  trainingModality: string[]; trainingStyle: string; rating: number;
  reviewCount: number; retentionRate: number; location: string;
  avatarUrl: string | null; isVerified: boolean;
};

const MODALITY_LABELS: Record<string, string> = { online: "ออนไลน์", gym: "ยิม", home: "บ้าน", studio: "สตูดิโอ", outdoor: "กลางแจ้ง" };

function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [modality, setModality] = useState("all");
  const [budget, setBudget] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: trainers = [], isLoading } = useQuery<Trainer[]>({
    queryKey: ["trainers"],
    queryFn: async () => {
      const res = await fetch("/api/trainers");
      return res.ok ? res.json() : [];
    },
  });

  const filtered = trainers.filter((t) => {
    if (search && !t.displayName.toLowerCase().includes(search.toLowerCase()) && !t.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))) return false;
    if (modality !== "all" && !t.trainingModality.includes(modality)) return false;
    if (budget && t.hourlyRateThb > Number(budget)) return false;
    return true;
  }).sort((a, b) => Number(b.rating) - Number(a.rating));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">Discover</div>
        <h1 className="text-3xl font-bold tracking-tight">ค้นหาเทรนเนอร์</h1>
        <p className="text-sm text-muted-foreground mt-1">{trainers.length} เทรนเนอร์ · ค้นหาและจองผ่านระบบ</p>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        <Input placeholder="ค้นหาชื่อหรือความเชี่ยวชาญ…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[180px]" />
        <select value={modality} onChange={e => setModality(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <option value="all">ทุกรูปแบบ</option>
          {["online", "gym", "home", "studio", "outdoor"].map(m => <option key={m} value={m}>{MODALITY_LABELS[m]}</option>)}
        </select>
        <Input type="number" placeholder="งบสูงสุด ฿" value={budget} onChange={e => setBudget(e.target.value)} className="w-32" />
        <div className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} ผลลัพธ์</div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">ไม่พบเทรนเนอร์ที่ตรงกับเงื่อนไข</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((tr) => {
            const isOpen = expanded === tr.id;
            return (
              <div key={tr.id} className="glass rounded-2xl p-5 shadow-card border border-border/30 transition-all">
                <div className="flex gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-primary/20 grid place-items-center shrink-0">
                    {tr.avatarUrl
                      ? <img src={tr.avatarUrl} alt={tr.displayName} className="h-full w-full rounded-xl object-cover" />
                      : <span className="font-bold text-lg text-primary">{tr.displayName[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold leading-tight">{tr.displayName}</h3>
                      {tr.isVerified && <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />{tr.location}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tr.specialties.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>)}
                      {tr.specialties.length > 3 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{tr.specialties.length - 3}</Badge>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-primary">฿{tr.hourlyRateThb}</div>
                    <div className="text-[10px] text-muted-foreground">/ชม.</div>
                    <div className="flex items-center gap-0.5 justify-end mt-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold">{Number(tr.rating).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="glass rounded-lg py-2"><div className="text-sm font-bold">{tr.experienceYears}</div><div className="text-[10px] text-muted-foreground">ปีประสบการณ์</div></div>
                  <div className="glass rounded-lg py-2"><div className="text-sm font-bold text-green-400">{tr.retentionRate}%</div><div className="text-[10px] text-muted-foreground">Retention</div></div>
                  <div className="glass rounded-lg py-2"><div className="text-sm font-bold">{tr.reviewCount}</div><div className="text-[10px] text-muted-foreground">รีวิว</div></div>
                </div>

                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {tr.trainingModality.map(m => <Badge key={m} variant="outline" className="text-[10px]">{MODALITY_LABELS[m] ?? m}</Badge>)}
                </div>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground leading-relaxed">{tr.bio}</p>
                    {tr.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tr.certifications.map(c => <Badge key={c} variant="outline" className="text-[10px] border-blue-500/40 text-blue-400">{c}</Badge>)}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Link to="/bookings" className="flex-1">
                    <Button size="sm" className="w-full bg-gradient-primary text-xs h-8">จองเซสชัน</Button>
                  </Link>
                  <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => setExpanded(isOpen ? null : tr.id)}>
                    {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
