import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Calendar, Sparkles, Star, Gift, CheckCircle2, Clock, Compass, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Fitder X" }] }),
  component: Dashboard,
});

const DAY_REWARDS = [
  { day: 1, pts: 10,  emoji: "🎁" },
  { day: 2, pts: 20,  emoji: "🎁" },
  { day: 3, pts: 30,  emoji: "✨" },
  { day: 4, pts: 40,  emoji: "✨" },
  { day: 5, pts: 50,  emoji: "🔥" },
  { day: 6, pts: 60,  emoji: "🔥" },
  { day: 7, pts: 100, emoji: "⭐" },
];

type DailyReward = {
  id: string; loginDate: string; dayStreak: number;
  rewardPoints: number; claimed: boolean; claimedAt: string | null;
};

function RewardDay({ day, pts, emoji, state }: {
  day: number; pts: number; emoji: string;
  state: "done" | "today" | "upcoming";
}) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl p-3 border transition-all ${
      state === "done"     ? "border-primary/40 bg-primary/10 opacity-70" :
      state === "today"    ? "border-primary bg-primary/20 shadow-glow scale-105" :
                             "border-border/30 bg-muted/10 opacity-40"
    }`}>
      <div className="text-xl">{state === "done" ? "✅" : emoji}</div>
      <div className="text-[10px] font-medium text-muted-foreground">Day {day}</div>
      <div className={`text-xs font-bold ${state === "today" ? "text-primary" : ""}`}>+{pts}</div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const [claimAnim, setClaimAnim] = useState(false);

  const { data: reward } = useQuery<DailyReward>({
    queryKey: ["daily-reward", uid],
    queryFn: async () => {
      const res = await fetch("/api/daily-reward", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
    enabled: !!uid,
  });

  const { data: rewardHistory } = useQuery<DailyReward[]>({
    queryKey: ["reward-history", uid],
    queryFn: async () => {
      const res = await fetch("/api/daily-reward/history", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!uid,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
    enabled: !!uid,
  });

  const { data: bookings } = useQuery({
    queryKey: ["my-bookings", uid],
    queryFn: async () => {
      const res = await fetch("/api/bookings", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!uid,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/daily-reward/claim", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Already claimed");
      return res.json();
    },
    onSuccess: (data: DailyReward) => {
      setClaimAnim(true);
      setTimeout(() => setClaimAnim(false), 1500);
      toast.success(`🎉 รับรางวัล +${data.rewardPoints} คะแนน!`);
      qc.invalidateQueries({ queryKey: ["daily-reward", uid] });
      qc.invalidateQueries({ queryKey: ["reward-history", uid] });
    },
    onError: () => toast.error("รับรางวัลแล้วในวันนี้"),
  });

  const totalPoints = (rewardHistory ?? []).filter(r => r.claimed).reduce((s, r) => s + r.rewardPoints, 0);
  const streak = reward?.dayStreak ?? 1;
  const upcomingBookings = (bookings ?? []).filter((b: { status: string }) => b.status === "pending" || b.status === "confirmed");
  const name = profile?.displayName || user?.firstName || "Athlete";

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dashboard</div>
        <h1 className="text-3xl font-bold tracking-tight">สวัสดี, {name} 👋</h1>
        <p className="text-sm text-muted-foreground">เข้าสู่ระบบทุกวันเพื่อรับรางวัลและติดตามการฝึกซ้อม</p>
      </div>

      {/* Daily Login Reward — Hero Card */}
      <div className={`relative overflow-hidden rounded-[2rem] border ${reward?.claimed ? "border-primary/30 bg-primary/5" : "border-primary/50 bg-gradient-to-br from-primary/10 to-transparent"} p-6 shadow-card transition-all duration-500`}>
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-2xl grid place-items-center text-3xl shadow-glow transition-transform duration-300 ${claimAnim ? "scale-125" : ""} ${reward?.claimed ? "bg-primary/20" : "bg-primary/30 animate-pulse-glow"}`}>
              {reward?.claimed ? "✅" : DAY_REWARDS[(streak - 1) % 7]?.emoji ?? "🎁"}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">
                {reward?.claimed ? "รับรางวัลแล้วในวันนี้" : "รางวัลประจำวันพร้อมรับแล้ว!"}
              </div>
              <div className="text-2xl font-bold">
                {reward?.claimed
                  ? `+${reward.rewardPoints} คะแนนสะสม`
                  : `+${DAY_REWARDS[(streak - 1) % 7]?.pts ?? 10} คะแนน รอคุณอยู่`}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-sm text-muted-foreground">วันที่ {streak} · รวม {totalPoints} คะแนน</span>
              </div>
            </div>
          </div>

          {!reward?.claimed && (
            <Button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="bg-gradient-primary shadow-glow text-base px-8 h-12 shrink-0"
            >
              <Gift className="h-5 w-5 mr-2" />
              รับรางวัล
            </Button>
          )}
        </div>

        {/* 7-day strip */}
        <div className="relative z-10 mt-6 grid grid-cols-7 gap-2">
          {DAY_REWARDS.map(({ day, pts, emoji }) => {
            const st = day < streak ? "done" : day === streak ? "today" : "upcoming";
            return <RewardDay key={day} day={day} pts={pts} emoji={emoji} state={st} />;
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Streak", value: `${streak} วัน`, icon: "🔥" },
          { label: "คะแนนรวม", value: String(totalPoints), icon: "⭐" },
          { label: "Bookings", value: String((bookings ?? []).length), icon: "📅" },
          { label: "รอยืนยัน", value: String(upcomingBookings.length), icon: "⏳" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 shadow-card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/discover" className="group">
          <div className="glass rounded-2xl p-5 shadow-card hover:shadow-glow transition h-full flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 grid place-items-center shrink-0">
              <Compass className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="font-semibold text-sm">Discover Trainers</div>
              <div className="text-xs text-muted-foreground">ค้นหาเทรนเนอร์</div>
            </div>
          </div>
        </Link>

        <Link to="/matches" className="group">
          <div className="glass rounded-2xl p-5 shadow-card hover:shadow-glow transition h-full flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shrink-0 shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">AI Matches</div>
              <div className="text-xs text-muted-foreground">เทรนเนอร์ที่เหมาะกับคุณ</div>
            </div>
          </div>
        </Link>

        <Link to="/pose" className="group">
          <div className="glass rounded-2xl p-5 shadow-card hover:shadow-glow transition h-full flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 grid place-items-center shrink-0">
              <Camera className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="font-semibold text-sm">AI Pose</div>
              <div className="text-xs text-muted-foreground">วิเคราะห์ท่าทาง</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div className="glass rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              การนัดหมายที่กำลังจะมาถึง
            </h2>
            <Link to="/bookings" className="text-xs text-primary-glow hover:underline">ดูทั้งหมด</Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.slice(0, 3).map((b: { id: string; trainerName?: string; sessionDate: string; sessionTime: string; status: string }) => (
              <div key={b.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{b.trainerName || "Trainer"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{b.sessionDate} {b.sessionTime}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reward history */}
      {(rewardHistory ?? []).length > 1 && (
        <div className="glass rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            ประวัติการรับรางวัล
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(rewardHistory ?? []).slice(0, 14).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.loginDate}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Day {r.dayStreak}</span>
                  {r.claimed
                    ? <span className="text-primary font-semibold">+{r.rewardPoints} pts ✅</span>
                    : <span className="text-muted-foreground">ไม่ได้รับ</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
