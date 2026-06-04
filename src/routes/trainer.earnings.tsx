import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Loader2 } from "lucide-react";

export const Route = createFileRoute("/trainer/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Trainer Portal" }] }),
  component: EarningsPage,
});

type Earnings = {
  total: number;
  monthly: { month: string; amount: number }[];
  byModality: { modality: string; amount: number }[];
};

const MODALITY_TH: Record<string, string> = { online: "ออนไลน์", gym: "ยิม", home: "บ้าน", studio: "สตูดิโอ", outdoor: "กลางแจ้ง" };
const MONTH_SHORT: Record<string, string> = {
  "01": "ม.ค.", "02": "ก.พ.", "03": "มี.ค.", "04": "เม.ย.", "05": "พ.ค.", "06": "มิ.ย.",
  "07": "ก.ค.", "08": "ส.ค.", "09": "ก.ย.", "10": "ต.ค.", "11": "พ.ย.", "12": "ธ.ค.",
};

function EarningsPage() {
  const { data, isLoading } = useQuery<Earnings>({
    queryKey: ["trainer-earnings"],
    queryFn: async () => {
      const res = await fetch("/api/trainer/earnings", { credentials: "include" });
      return res.ok ? res.json() : { total: 0, monthly: [], byModality: [] };
    },
  });

  const monthly = data?.monthly ?? [];
  const byModality = data?.byModality ?? [];
  const maxMonth = Math.max(...monthly.map(m => m.amount), 1);
  const maxModal = Math.max(...byModality.map(m => m.amount), 1);
  const thisMonth = monthly[monthly.length - 1]?.amount ?? 0;
  const lastMonth = monthly[monthly.length - 2]?.amount ?? 0;
  const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-1">Trainer Portal</div>
        <h1 className="text-3xl font-bold tracking-tight">รายได้</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Hero totals */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-6 shadow-card border border-violet-500/20 bg-violet-500/5 sm:col-span-1">
              <div className="text-xs uppercase tracking-widest text-violet-400 mb-2">รายได้รวม</div>
              <div className="text-4xl font-bold">฿{(data?.total ?? 0).toLocaleString()}</div>
            </div>
            <div className="glass rounded-2xl p-6 shadow-card">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">เดือนนี้</div>
              <div className="text-3xl font-bold">฿{thisMonth.toLocaleString()}</div>
              {growth !== null && (
                <div className={`text-sm mt-1 font-medium ${growth >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {growth >= 0 ? "↑" : "↓"} {Math.abs(growth)}% จากเดือนก่อน
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-6 shadow-card">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">เดือนก่อน</div>
              <div className="text-3xl font-bold">฿{lastMonth.toLocaleString()}</div>
            </div>
          </div>

          {/* Monthly bar chart */}
          {monthly.length > 0 && (
            <div className="glass rounded-2xl p-6 shadow-card">
              <h2 className="font-semibold mb-5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                รายได้รายเดือน (6 เดือนล่าสุด)
              </h2>
              <div className="flex items-end gap-3 h-40">
                {monthly.map(({ month, amount }) => {
                  const pct = maxMonth > 0 ? (amount / maxMonth) * 100 : 0;
                  const [yr, mo] = month.split("-");
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[10px] font-medium text-violet-300">
                        ฿{amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount}
                      </div>
                      <div className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-purple-400 transition-all"
                        style={{ height: `${Math.max(pct, 4)}%` }} />
                      <div className="text-[10px] text-muted-foreground">{MONTH_SHORT[mo] ?? mo}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By modality */}
          {byModality.length > 0 && (
            <div className="glass rounded-2xl p-6 shadow-card">
              <h2 className="font-semibold mb-4">รายได้ตามรูปแบบ</h2>
              <div className="space-y-3">
                {byModality.sort((a, b) => b.amount - a.amount).map(({ modality, amount }) => {
                  const pct = maxModal > 0 ? (amount / maxModal) * 100 : 0;
                  return (
                    <div key={modality}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span>{MODALITY_TH[modality] ?? modality}</span>
                        <span className="font-semibold">฿{amount.toLocaleString()} <span className="text-xs text-muted-foreground">({Math.round(pct)}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data?.total === 0 && (
            <div className="glass rounded-2xl p-16 text-center shadow-card">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground">ยังไม่มีรายได้</p>
              <p className="text-sm text-muted-foreground mt-1">รายได้จะแสดงหลังจากมีเซสชันที่เสร็จสิ้น</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
