import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Check, AlertCircle, Trash2, Plus, User, Star } from "lucide-react";

export const Route = createFileRoute("/_app/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Fitder X" }] }),
  component: BookingsPage,
});

type Booking = {
  id: string; trainerId: string; sessionDate: string; sessionTime: string;
  modality: string; status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string; priceThb: number; createdAt: string;
  trainerName?: string; trainerAvatar?: string | null;
};

type Trainer = {
  id: string; displayName: string; bio: string; hourlyRateThb: number;
  rating: number; reviewCount: number; location: string;
  avatarUrl: string | null; specialties: string[];
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-green-500/20 border-green-500/30 text-green-400",
  pending:   "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  completed: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  cancelled: "bg-red-500/20 border-red-500/30 text-red-400",
};

function BookingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const [tab, setTab] = useState<"list" | "new">("list");
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [form, setForm] = useState({ session_date: "", session_time: "", modality: "online" as "online"|"gym"|"home", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings", uid],
    queryFn: async () => {
      const res = await fetch("/api/bookings", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!uid,
  });

  const { data: trainers = [] } = useQuery<Trainer[]>({
    queryKey: ["trainers"],
    queryFn: async () => {
      const res = await fetch("/api/trainers");
      return res.ok ? res.json() : [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-bookings"] }); toast.success("ยกเลิกการจองแล้ว"); },
    onError: () => toast.error("ไม่สามารถยกเลิกได้"),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer || !form.session_date || !form.session_time) return toast.error("กรุณากรอกข้อมูลให้ครบ");
    setSubmitting(true);
    try {
      const trainer = trainers.find(t => t.id === selectedTrainer);
      const res = await fetch("/api/bookings", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainer_id: selectedTrainer, price_thb: trainer?.hourlyRateThb ?? 0, ...form }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("จองสำเร็จ! รอการยืนยันจากเทรนเนอร์");
      setTab("list");
      setForm({ session_date: "", session_time: "", modality: "online", notes: "" });
      setSelectedTrainer("");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    finally { setSubmitting(false); }
  };

  const upcoming = bookings.filter(b => b.status === "pending" || b.status === "confirmed");
  const past     = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">Bookings</div>
          <h1 className="text-3xl font-bold tracking-tight">การนัดหมาย</h1>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "list" ? "default" : "outline"} size="sm" onClick={() => setTab("list")}>การจองของฉัน</Button>
          <Button variant={tab === "new"  ? "default" : "outline"} size="sm" onClick={() => setTab("new")} className="bg-gradient-primary gap-1">
            <Plus className="h-4 w-4" />จองเซสชัน
          </Button>
        </div>
      </div>

      {/* ── NEW BOOKING TAB ─────────────────────────────────── */}
      {tab === "new" && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Trainer list */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">เลือกเทรนเนอร์</h2>
            {trainers.map(tr => (
              <div key={tr.id} onClick={() => setSelectedTrainer(tr.id)}
                className={`glass rounded-2xl p-4 border-2 cursor-pointer transition-all ${selectedTrainer === tr.id ? "border-primary bg-primary/10 shadow-glow" : "border-white/10 hover:border-white/20"}`}>
                <div className="flex gap-3 items-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary/20 grid place-items-center shrink-0">
                    {tr.avatarUrl ? <img src={tr.avatarUrl} alt={tr.displayName} className="h-full w-full rounded-xl object-cover" /> : <User className="h-6 w-6 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{tr.displayName}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{Number(tr.rating).toFixed(1)}</span>
                      <span><MapPin className="h-3 w-3 inline mr-0.5" />{tr.location}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{tr.specialties.slice(0,2).join(", ")}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-primary">฿{tr.hourlyRateThb}</div>
                    <div className="text-[10px] text-muted-foreground">/ชม.</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking form */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 glass rounded-2xl border border-white/10 p-6 shadow-card">
              <h3 className="font-bold text-lg mb-5">รายละเอียดการจอง</h3>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">เทรนเนอร์</Label>
                  <div className="mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-sm min-h-[42px]">
                    {selectedTrainer ? trainers.find(t => t.id === selectedTrainer)?.displayName : <span className="text-muted-foreground">เลือกเทรนเนอร์จากรายการ</span>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">วันที่</Label>
                  <div className="relative mt-1.5">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input type="date" required value={form.session_date} onChange={e => setForm(p => ({...p, session_date: e.target.value}))} className="pl-10" min={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">เวลา</Label>
                  <div className="relative mt-1.5">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input type="time" required value={form.session_time} onChange={e => setForm(p => ({...p, session_time: e.target.value}))} className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">รูปแบบ</Label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {(["online","gym","home"] as const).map(m => (
                      <button key={m} type="button" onClick={() => setForm(p => ({...p, modality: m}))}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${form.modality === m ? "bg-primary text-primary-foreground" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>
                        {m === "online" ? "ออนไลน์" : m === "gym" ? "ยิม" : "บ้าน"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">หมายเหตุ (ถ้ามี)</Label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="ความต้องการพิเศษ…" className="mt-1.5 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-muted-foreground resize-none min-h-[70px] focus:border-primary/50 focus:outline-none" />
                </div>
                {selectedTrainer && (
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ค่าบริการ</span>
                    <span className="font-bold text-primary">฿{trainers.find(t => t.id === selectedTrainer)?.hourlyRateThb ?? 0}</span>
                  </div>
                )}
                <Button type="submit" disabled={submitting || !selectedTrainer} className="w-full bg-gradient-primary shadow-glow h-11 font-semibold">
                  {submitting ? "กำลังจอง…" : "ยืนยันการจอง"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-3 text-center">เทรนเนอร์จะยืนยันภายใน 24 ชม.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MY BOOKINGS TAB ─────────────────────────────────── */}
      {tab === "list" && (
        <div className="space-y-6">
          {isLoading && <div className="text-center text-muted-foreground py-8">กำลังโหลด…</div>}

          {!isLoading && bookings.length === 0 && (
            <div className="glass rounded-2xl border border-white/10 p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground mb-5">ยังไม่มีการจอง</p>
              <Button onClick={() => setTab("new")} className="bg-gradient-primary shadow-glow">
                <Plus className="h-4 w-4 mr-2" />จองเซสชันแรก
              </Button>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <h2 className="font-semibold">กำลังจะมาถึง ({upcoming.length})</h2>
              </div>
              <div className="space-y-3">{upcoming.map(b => <BookingCard key={b.id} b={b} onCancel={() => cancelMutation.mutate(b.id)} cancelling={cancelMutation.isPending} />)}</div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <h2 className="font-semibold">ประวัติ ({past.length})</h2>
              </div>
              <div className="space-y-3">{past.map(b => <BookingCard key={b.id} b={b} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ b, onCancel, cancelling }: { b: Booking; onCancel?: () => void; cancelling?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary/20 grid place-items-center shrink-0">
            {b.trainerAvatar ? <img src={b.trainerAvatar} alt={b.trainerName} className="w-full h-full rounded-xl object-cover" /> : <User className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <div className="font-semibold">{b.trainerName || "เทรนเนอร์"}</div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{b.sessionDate}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{b.sessionTime}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /><span className="capitalize">{b.modality === "online" ? "ออนไลน์" : b.modality === "gym" ? "ยิม" : "บ้าน"}</span></span>
            </div>
            {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{b.notes}"</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${STATUS_STYLE[b.status] ?? ""}`}>
            {b.status === "confirmed" ? <Check className="w-3.5 h-3.5" /> : b.status === "pending" ? <AlertCircle className="w-3.5 h-3.5" /> : null}
            {b.status === "confirmed" ? "ยืนยันแล้ว" : b.status === "pending" ? "รอยืนยัน" : b.status === "completed" ? "เสร็จสิ้น" : "ยกเลิก"}
          </div>
          <div className="text-right">
            <div className="font-bold">฿{b.priceThb}</div>
            <div className="text-[10px] text-muted-foreground">/ชม.</div>
          </div>
          {onCancel && (b.status === "pending" || b.status === "confirmed") && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={cancelling}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 h-8 w-8 p-0">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
