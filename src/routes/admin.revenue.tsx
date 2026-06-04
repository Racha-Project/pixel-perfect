import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, DollarSign, Wallet, PieChart, BarChart3, Percent,
} from "lucide-react";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({ meta: [{ title: "Revenue & Commission — Fitder X Admin" }] }),
  component: AdminRevenue,
});

type Revenue = {
  totalRevenue: number;
  commission: number;
  trainerPayouts: number;
  commissionRate: number;
  monthly: { month: string; total: number; commission: number; payout: number }[];
  byModality: { modality: string; amount: number }[];
};

const MODALITY_LABEL: Record<string, string> = {
  online: "ออนไลน์",
  gym: "ยิม",
  home: "บ้าน",
};

const MODALITY_COLOR: Record<string, { bar: string; text: string; bg: string }> = {
  online: { bar: "from-blue-500 to-cyan-500", text: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  gym:    { bar: "from-violet-500 to-purple-500", text: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  home:   { bar: "from-amber-500 to-orange-500", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

function AdminRevenue() {
  const { data: revenue, isLoading } = useQuery<Revenue>({
    queryKey: ["admin-revenue"],
    queryFn: async () => {
      const res = await fetch("/api/admin/revenue", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const maxMonthly = Math.max(1, ...(revenue?.monthly?.map(m => m.total) ?? [1]));
  const totalModality = Math.max(1, revenue?.byModality?.reduce((s, m) => s + m.amount, 0) ?? 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-1">Admin Portal</div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-emerald-400" />
          รายได้ & Commission
        </h1>
        <p className="text-sm text-muted-foreground mt-1">ภาพรวมรายได้และค่าคอมมิชชันของแพลตฟอร์ม</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-8 animate-pulse h-36" />
          ))}
        </div>
      ) : (
        <>
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-6 border border-emerald-500/20 bg-emerald-500/5 shadow-card shadow-[0_0_30px_-6px_rgba(52,211,153,0.2)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-sm text-muted-foreground">รายได้รวม</div>
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                ฿{(revenue?.totalRevenue ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total Revenue</div>
            </div>

            <div className="glass rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5 shadow-card shadow-[0_0_30px_-6px_rgba(245,158,11,0.2)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 grid place-items-center">
                  <Percent className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-sm text-muted-foreground">ค่าคอมมิชชัน (20%)</div>
              </div>
              <div className="text-3xl font-bold text-amber-400">
                ฿{(revenue?.commission ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Platform Commission</div>
            </div>

            <div className="glass rounded-2xl p-6 border border-violet-500/20 bg-violet-500/5 shadow-card shadow-[0_0_30px_-6px_rgba(139,92,246,0.2)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 grid place-items-center">
                  <Wallet className="h-5 w-5 text-violet-400" />
                </div>
                <div className="text-sm text-muted-foreground">จ่ายเทรนเนอร์</div>
              </div>
              <div className="text-3xl font-bold text-violet-400">
                ฿{(revenue?.trainerPayouts ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Trainer Payouts (80%)</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Breakdown */}
            <div className="glass rounded-2xl p-6 shadow-card border border-white/5">
              <h2 className="font-semibold flex items-center gap-2 mb-5">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                รายได้รายเดือน
              </h2>
              {revenue?.monthly && revenue.monthly.length > 0 ? (
                <div className="space-y-3">
                  {revenue.monthly.map((m) => (
                    <div key={m.month}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-mono">{m.month}</span>
                        <span className="text-emerald-400 font-medium">฿{m.total.toLocaleString()}</span>
                      </div>
                      <div className="h-6 rounded-lg bg-white/5 overflow-hidden relative">
                        {/* Total bar */}
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-emerald-500/40 to-emerald-600/40 absolute inset-y-0 left-0 transition-all duration-700"
                          style={{ width: `${(m.total / maxMonthly) * 100}%` }}
                        />
                        {/* Commission portion */}
                        <div
                          className="h-full rounded-l-lg bg-gradient-to-r from-amber-500/60 to-orange-500/60 absolute inset-y-0 left-0 transition-all duration-700"
                          style={{ width: `${(m.commission / maxMonthly) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>Commission: ฿{m.commission.toLocaleString()}</span>
                        <span>Payout: ฿{m.payout.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-amber-500" /> Commission
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" /> Total
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูล</p>
              )}
            </div>

            {/* Revenue by Modality */}
            <div className="glass rounded-2xl p-6 shadow-card border border-white/5">
              <h2 className="font-semibold flex items-center gap-2 mb-5">
                <PieChart className="h-4 w-4 text-violet-400" />
                รายได้ตามรูปแบบ
              </h2>
              {revenue?.byModality && revenue.byModality.length > 0 ? (
                <div className="space-y-5">
                  {/* Visual bars */}
                  <div className="space-y-4">
                    {revenue.byModality.map((m) => {
                      const colors = MODALITY_COLOR[m.modality] ?? MODALITY_COLOR.online;
                      const pct = Math.round((m.amount / totalModality) * 100);
                      return (
                        <div key={m.modality}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className={`font-medium ${colors.text}`}>
                              {MODALITY_LABEL[m.modality] ?? m.modality}
                            </span>
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="h-8 rounded-xl bg-white/5 overflow-hidden relative">
                            <div
                              className={`h-full rounded-xl bg-gradient-to-r ${colors.bar} transition-all duration-700`}
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                            <div className="absolute inset-0 flex items-center px-3">
                              <span className="text-xs font-medium text-white/90">
                                ฿{m.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {revenue.byModality.map((m) => {
                      const colors = MODALITY_COLOR[m.modality] ?? MODALITY_COLOR.online;
                      return (
                        <div key={m.modality} className={`rounded-xl p-3 border text-center ${colors.bg}`}>
                          <div className={`text-sm font-bold ${colors.text}`}>
                            ฿{m.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {MODALITY_LABEL[m.modality] ?? m.modality}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>

          {/* Commission Rate Info */}
          <div className="glass rounded-2xl p-6 shadow-card border border-amber-500/10">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Percent className="h-4 w-4 text-amber-400" />
              อัตราค่าคอมมิชชัน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground mb-1">Default Commission</div>
                <div className="text-2xl font-bold text-amber-400">20%</div>
                <div className="text-xs text-muted-foreground mt-1">ของราคาเซสชัน</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground mb-1">ตัวอย่าง: เซสชัน ฿1,000</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-lg font-bold text-amber-400">฿200</span>
                  <span className="text-xs text-muted-foreground">Platform</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-violet-400">฿800</span>
                  <span className="text-xs text-muted-foreground">Trainer</span>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground mb-1">Commission Range</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  10–30%
                </div>
                <div className="text-xs text-muted-foreground mt-1">ปรับได้ตามระดับ Trainer</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
