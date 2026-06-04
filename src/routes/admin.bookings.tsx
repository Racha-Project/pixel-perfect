import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings Management — Fitder X Admin" }] }),
  component: AdminBookings,
});

type Booking = {
  id: string;
  trainerId: string | null;
  userId: string | null;
  sessionDate: string;
  sessionTime: string;
  modality: string | null;
  status: string | null;
  priceThb: number | null;
  createdAt: string | null;
  trainerName: string | null;
  clientName: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  confirmed: "bg-green-500/20 border-green-500/30 text-green-400",
  completed: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  cancelled: "bg-red-500/20 border-red-500/30 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};

const MODALITY_LABEL: Record<string, string> = {
  online: "ออนไลน์",
  gym: "ยิม",
  home: "บ้าน",
};

function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const filtered = bookings.filter((b) => {
    const matchStatus = !statusFilter || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || [b.trainerName, b.clientName]
      .some(v => (v ?? "").toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const totalRevenue = filtered
    .filter(b => b.status === "completed")
    .reduce((s, b) => s + (b.priceThb ?? 0), 0);

  const statusCounts = {
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-1">Admin Portal</div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalendarCheck className="h-7 w-7 text-amber-400" />
          จัดการการจอง
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ทั้งหมด {bookings.length} รายการ · รายได้จากที่แสดง ฿{totalRevenue.toLocaleString()}
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`glass rounded-xl p-3 border text-center transition-all ${
              statusFilter === s ? "ring-2 ring-amber-500/50 scale-[1.02]" : ""
            } ${STATUS_STYLE[s]}`}
          >
            <div className="text-xl font-bold">{statusCounts[s]}</div>
            <div className="text-[10px] opacity-80">{STATUS_LABEL[s]}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อลูกค้า, เทรนเนอร์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {statusFilter && (
          <Button size="sm" variant="outline" onClick={() => setStatusFilter("")} className="text-xs gap-1">
            <Filter className="h-3 w-3" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center shadow-card">
          <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">ไม่พบการจอง</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_100px_80px_100px_80px_100px] gap-3 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
            <div>ลูกค้า</div>
            <div>เทรนเนอร์</div>
            <div>วันที่</div>
            <div>เวลา</div>
            <div>สถานะ</div>
            <div>รูปแบบ</div>
            <div className="text-right">ราคา</div>
          </div>

          {filtered.map((b) => (
            <div
              key={b.id}
              className="glass rounded-xl p-4 shadow-card border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="md:grid md:grid-cols-[1fr_1fr_100px_80px_100px_80px_100px] md:gap-3 md:items-center flex flex-col gap-2">
                {/* Client */}
                <div className="text-sm font-medium">{b.clientName || "—"}</div>

                {/* Trainer */}
                <div className="text-sm text-muted-foreground">{b.trainerName || "—"}</div>

                {/* Date */}
                <div className="text-xs text-muted-foreground font-mono">{b.sessionDate}</div>

                {/* Time */}
                <div className="text-xs text-muted-foreground font-mono">{b.sessionTime}</div>

                {/* Status */}
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status ?? ""] ?? ""}`}>
                    {STATUS_LABEL[b.status ?? ""] ?? b.status}
                  </span>
                </div>

                {/* Modality */}
                <div className="text-xs text-muted-foreground">
                  {MODALITY_LABEL[b.modality ?? ""] ?? b.modality}
                </div>

                {/* Price */}
                <div className="text-sm font-bold text-amber-400 md:text-right">
                  ฿{(b.priceThb ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
