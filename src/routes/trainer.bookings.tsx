import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Check, AlertCircle, User, Loader2 } from "lucide-react";

export const Route = createFileRoute("/trainer/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Trainer Portal" }] }),
  component: TrainerBookingsPage,
});

type Booking = {
  id: string; clientName: string | null; clientAvatar: string | null;
  sessionDate: string; sessionTime: string; modality: string;
  status: string; priceThb: number; notes: string; createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-green-500/20 border-green-500/30 text-green-400",
  pending:   "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  completed: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  cancelled: "bg-red-500/20 border-red-500/30 text-red-400",
};
const STATUS_TH: Record<string, string> = {
  pending: "รอยืนยัน", confirmed: "ยืนยันแล้ว", completed: "เสร็จสิ้น", cancelled: "ยกเลิก",
};

function TrainerBookingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["trainer-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/trainer/bookings", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/trainer/bookings/${id}/status`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainer-bookings"] }); qc.invalidateQueries({ queryKey: ["trainer-stats"] }); toast.success("อัพเดตสถานะแล้ว"); },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const TABS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
  const TAB_LABEL: Record<string, string> = { all: "ทั้งหมด", pending: "รอยืนยัน", confirmed: "ยืนยัน", completed: "สำเร็จ", cancelled: "ยกเลิก" };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const counts = { pending: bookings.filter(b => b.status === "pending").length };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-1">Trainer Portal</div>
        <h1 className="text-3xl font-bold tracking-tight">การนัดหมาย</h1>
        <p className="text-sm text-muted-foreground mt-1">{bookings.length} การจองทั้งหมด</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === t ? "bg-violet-600 text-white" : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
            }`}>
            {TAB_LABEL[t]}
            {t === "pending" && counts.pending > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-400 text-black text-[8px] font-bold grid place-items-center">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">ไม่มีการจองในหมวดนี้</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="glass rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all">
              <div className="flex gap-4 items-start justify-between flex-wrap">
                {/* Client info */}
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-primary/20 grid place-items-center shrink-0">
                    {b.clientAvatar ? <img src={b.clientAvatar} className="w-full h-full rounded-xl object-cover" /> : <User className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <div className="font-semibold">{b.clientName || "ลูกค้า"}</div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.sessionDate}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.sessionTime}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.modality === "online" ? "ออนไลน์" : b.modality === "gym" ? "ยิม" : "บ้าน"}</span>
                    </div>
                    {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{b.notes}"</p>}
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${STATUS_STYLE[b.status] ?? ""}`}>
                    {STATUS_TH[b.status] ?? b.status}
                  </div>
                  <div className="font-bold">฿{b.priceThb}</div>
                </div>
              </div>

              {/* Action buttons */}
              {b.status === "pending" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-border/20">
                  <Button size="sm" className="bg-green-600 hover:bg-green-500 text-xs h-8 gap-1"
                    onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })}>
                    <Check className="h-3 w-3" />ยืนยันการจอง
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}>
                    ปฏิเสธ
                  </Button>
                </div>
              )}
              {b.status === "confirmed" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-border/20">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs h-8"
                    onClick={() => updateStatus.mutate({ id: b.id, status: "completed" })}>
                    ✓ เสร็จสิ้นเซสชัน
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
