import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users2, Dumbbell, CalendarCheck, TrendingUp, DollarSign, ShieldAlert,
  ArrowUpRight, Activity,
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Fitder X" }] }),
  component: AdminDashboard,
});

type Stats = {
  totalUsers: number;
  totalTrainers: number;
  totalBookings: number;
  totalRevenue: number;
  commissionRevenue: number;
  monthRevenue: number;
  pendingTrainers: number;
  monthlyTrends: { month: string; bookings: number; revenue: number }[];
};

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const cards = [
    {
      label: "ผู้ใช้ทั้งหมด",
      value: stats?.totalUsers ?? 0,
      icon: Users2,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      glow: "shadow-[0_0_20px_-4px_rgba(59,130,246,0.3)]",
    },
    {
      label: "เทรนเนอร์",
      value: stats?.totalTrainers ?? 0,
      icon: Dumbbell,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
      glow: "shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]",
    },
    {
      label: "การจองทั้งหมด",
      value: stats?.totalBookings ?? 0,
      icon: CalendarCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      glow: "shadow-[0_0_20px_-4px_rgba(245,158,11,0.3)]",
    },
    {
      label: "รายได้รวม",
      value: `฿${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      glow: "shadow-[0_0_20px_-4px_rgba(52,211,153,0.3)]",
    },
    {
      label: "ค่าคอมมิชชัน",
      value: `฿${(stats?.commissionRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      glow: "shadow-[0_0_20px_-4px_rgba(251,146,60,0.3)]",
    },
    {
      label: "รอยืนยัน Trainer",
      value: stats?.pendingTrainers ?? 0,
      icon: ShieldAlert,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      glow: "shadow-[0_0_20px_-4px_rgba(250,204,21,0.3)]",
    },
  ];

  const maxBookings = Math.max(1, ...(stats?.monthlyTrends?.map(t => t.bookings) ?? [1]));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-1 flex items-center gap-2">
          <Activity className="h-3 w-3" />
          Admin Portal
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">ภาพรวมระบบ Fitder X ทั้งหมด</p>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/5 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className={`glass rounded-2xl p-5 border ${c.bg} ${c.glow} shadow-card transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-9 w-9 rounded-xl ${c.bg} grid place-items-center`}>
                  <c.icon className={`h-4.5 w-4.5 ${c.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <div className="text-2xl font-bold tracking-tight">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly Trends */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 shadow-card border border-amber-500/10">
          <h2 className="font-semibold flex items-center gap-2 mb-5">
            <CalendarCheck className="h-4 w-4 text-amber-400" />
            Booking Trends
          </h2>
          {stats?.monthlyTrends && stats.monthlyTrends.length > 0 ? (
            <div className="space-y-3">
              {stats.monthlyTrends.map((t) => (
                <div key={t.month} className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground w-16 font-mono shrink-0">{t.month}</div>
                  <div className="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden relative">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-amber-500/60 to-orange-500/60 transition-all duration-700"
                      style={{ width: `${Math.max(4, (t.bookings / maxBookings) * 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] font-medium text-white/90">
                        {t.bookings} bookings
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-amber-400 w-20 text-right font-mono">
                    ฿{t.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูล</p>
          )}
        </div>

        {/* Revenue This Month */}
        <div className="glass rounded-2xl p-6 shadow-card border border-emerald-500/10">
          <h2 className="font-semibold flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            รายได้เดือนนี้
          </h2>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-emerald-400">
                ฿{(stats?.monthRevenue ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Monthly Revenue</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                <div className="text-lg font-bold text-amber-400">
                  ฿{Math.round((stats?.monthRevenue ?? 0) * 0.2).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">Commission (20%)</div>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-center">
                <div className="text-lg font-bold text-violet-400">
                  ฿{Math.round((stats?.monthRevenue ?? 0) * 0.8).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">Trainer Payouts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "จัดการผู้ใช้", to: "/admin/users", icon: Users2, color: "text-blue-400 border-blue-500/20" },
          { label: "ยืนยัน Trainer", to: "/admin/trainers", icon: Dumbbell, color: "text-violet-400 border-violet-500/20" },
          { label: "จัดการ Booking", to: "/admin/bookings", icon: CalendarCheck, color: "text-amber-400 border-amber-500/20" },
          { label: "รายได้ & Commission", to: "/admin/revenue", icon: TrendingUp, color: "text-emerald-400 border-emerald-500/20" },
        ].map((link) => (
          <a
            key={link.to}
            href={link.to}
            className={`glass rounded-xl p-4 border ${link.color} flex items-center gap-3 group hover:border-white/20 transition-all`}
          >
            <link.icon className={`h-5 w-5 ${link.color.split(" ")[0]}`} />
            <span className="text-sm font-medium flex-1">{link.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
