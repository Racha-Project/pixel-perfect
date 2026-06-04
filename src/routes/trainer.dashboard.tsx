import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Calendar, Users2, TrendingUp, Clock, Check, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/trainer/dashboard")({
  head: () => ({ meta: [{ title: "Trainer Dashboard — Fitder X" }] }),
  component: TrainerDashboard,
});

type Stats = { pending: number; confirmed: number; completed: number; totalRevenue: number; monthRevenue: number; clients: number };
type Booking = { id: string; clientName: string | null; clientAvatar: string | null; sessionDate: string; sessionTime: string; modality: string; status: string; priceThb: number; trainerId: string };

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-green-500/20 border-green-500/30 text-green-400",
  pending:   "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  completed: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  cancelled: "bg-red-500/20 border-red-500/30 text-red-400",
};

function TrainerDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["trainer-stats"],
    queryFn: async () => {
      const res = await fetch("/api/trainer/stats", { credentials: "include" });
      return res.ok ? res.json() : { pending: 0, confirmed: 0, completed: 0, totalRevenue: 0, monthRevenue: 0, clients: 0 };
    },
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-bookings"] });
      qc.invalidateQueries({ queryKey: ["trainer-stats"] });
      toast.success("อัพเดตสถานะแล้ว");
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const pending  = bookings.filter(b => b.status === "pending").slice(0, 5);
  const today    = new Date().toISOString().slice(0, 10);
  const todayBks = bookings.filter(b => b.sessionDate === today && (b.status === "confirmed" || b.status === "pending"));
  const name     = (user?.profile as any)?.displayName || user?.firstName || "Trainer";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-1">Trainer Portal</div>
        <h1 className="text-3xl font-bold tracking-tight">สวัสดี, {name} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">ภาพรวมธุรกิจและการนัดหมาย</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "รอยืนยัน",    value: stats?.pending ?? 0,    icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          { label: "ยืนยันแล้ว",   value: stats?.confirmed ?? 0,  icon: Check,       color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20"  },
          { label: "ลูกค้าทั้งหมด", value: stats?.clients ?? 0,    icon: Users2,      color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"    },
          { label: "เซสชันสำเร็จ", value: stats?.completed ?? 0,  icon: Calendar,    color: "text-primary",    bg: "bg-primary/10 border-primary/20"       },
          { label: "รายได้เดือนนี้", value: `฿${(stats?.monthRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          { label: "รายได้รวม",    value: `฿${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
        ].map((s) => (
          <div key={s.label} className={`glass rounded-2xl p-4 border ${s.bg} shadow-card`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending approvals */}
        <div className="glass rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              รอการยืนยัน ({pending.length})
            </h2>
            <Link to="/trainer/bookings" className="text-xs text-purple-400 hover:underline">ดูทั้งหมด</Link>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">ไม่มีคำขอที่รอยืนยัน</p>
          ) : (
            <div className="space-y-3">
              {pending.map(b => (
                <div key={b.id} className="border border-yellow-500/20 rounded-xl p-3 bg-yellow-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-primary/20 grid place-items-center shrink-0">
                      {b.clientAvatar ? <img src={b.clientAvatar} className="w-full h-full rounded-lg object-cover" /> : <User className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{b.clientName || "ลูกค้า"}</div>
                      <div className="text-xs text-muted-foreground">{b.sessionDate} · {b.sessionTime}</div>
                    </div>
                    <div className="text-sm font-bold text-primary">฿{b.priceThb}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 flex-1 bg-green-600 hover:bg-green-500 text-xs"
                      onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })}>
                      <Check className="h-3 w-3 mr-1" />ยืนยัน
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 flex-1 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}>
                      ปฏิเสธ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's schedule */}
        <div className="glass rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              นัดหมายวันนี้ ({todayBks.length})
            </h2>
          </div>
          {todayBks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">ไม่มีนัดหมายวันนี้</p>
          ) : (
            <div className="space-y-2">
              {todayBks.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30">
                  <div className="text-sm font-mono text-purple-400 w-14 shrink-0">{b.sessionTime}</div>
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary/20 grid place-items-center shrink-0">
                    {b.clientAvatar ? <img src={b.clientAvatar} className="w-full h-full rounded-lg object-cover" /> : <User className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{b.clientName || "ลูกค้า"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{b.modality === "online" ? "ออนไลน์" : b.modality === "gym" ? "ยิม" : "บ้าน"}</div>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status] ?? ""}`}>
                    {b.status === "confirmed" ? "ยืนยัน" : "รอยืนยัน"}
                  </div>
                  {b.status === "confirmed" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => updateStatus.mutate({ id: b.id, status: "completed" })}>
                      เสร็จ
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
