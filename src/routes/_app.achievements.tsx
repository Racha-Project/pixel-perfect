import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Flame, Trophy, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/_app/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Fitder X" }] }),
  component: AchievementsPage,
});

type Badge = {
  id: string;
  emoji: string;
  th: string;
  en: string;
  desc_th: string;
  desc_en: string;
};

const BADGES: Badge[] = [
  { id: "first_workout",  emoji: "💪", th: "ออกกำลังกายครั้งแรก", en: "First Workout",     desc_th: "บันทึกการออกกำลังกายครั้งแรก",    desc_en: "Log your first workout" },
  { id: "first_meal",     emoji: "🍎", th: "บันทึกมื้อแรก",        en: "First Meal",        desc_th: "บันทึกอาหารครั้งแรก",               desc_en: "Log your first meal" },
  { id: "hydration_hero", emoji: "💧", th: "ฮีโร่น้ำดื่ม",          en: "Hydration Hero",   desc_th: "ดื่มน้ำครบ 2000ml ในหนึ่งวัน",       desc_en: "Drink 2000ml in a single day" },
  { id: "ai_explorer",    emoji: "🤖", th: "นักสำรวจ AI",            en: "AI Explorer",      desc_th: "ใช้งาน AI Coach ครั้งแรก",           desc_en: "Chat with AI Coach" },
  { id: "plan_getter",    emoji: "📋", th: "มีแผนในมือ",             en: "Plan Getter",      desc_th: "สร้างแผนออกกำลังกาย AI",             desc_en: "Generate an AI workout plan" },
  { id: "twin_preview",   emoji: "🔮", th: "เห็นอนาคต",              en: "Future Vision",    desc_th: "ดู Digital Twin ครั้งแรก",            desc_en: "View your Digital Twin" },
  { id: "screened",       emoji: "🩺", th: "ตรวจสุขภาพแล้ว",         en: "Health Checked",   desc_th: "ทำ Health Screening ครั้งแรก",        desc_en: "Complete a Health Screening" },
  { id: "streak_3",       emoji: "🔥", th: "ไฟลุก 3 วัน",            en: "3-Day Streak",     desc_th: "Active 3 วันติดต่อกัน",               desc_en: "Stay active 3 days in a row" },
  { id: "streak_7",       emoji: "⚡", th: "นักรบ 7 วัน",            en: "Week Warrior",     desc_th: "Active 7 วันติดต่อกัน",               desc_en: "Stay active 7 days in a row" },
  { id: "streak_30",      emoji: "🌟", th: "นักรบ 30 วัน",           en: "Month Legend",     desc_th: "Active 30 วันติดต่อกัน",              desc_en: "Stay active 30 days in a row" },
  { id: "meals_10",       emoji: "🥗", th: "นักโภชนาการ",             en: "Nutrition Ace",    desc_th: "บันทึกมื้ออาหารครบ 10 ครั้ง",         desc_en: "Log 10 total meals" },
  { id: "workouts_10",    emoji: "🏆", th: "นักกีฬาอาชีพ",           en: "Pro Athlete",      desc_th: "ออกกำลังกายครบ 10 ครั้ง",            desc_en: "Log 10 total workouts" },
];

async function apiFetch(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function updateStreakLogic(
  last: Date | null,
  current: number,
  longest: number,
): { current: number; longest: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!last) return { current: 1, longest: Math.max(1, longest) };
  const diff = Math.floor((today.getTime() - last.getTime()) / 86400000);
  if (diff === 0) return { current, longest };
  if (diff === 1) {
    const next = current + 1;
    return { current: next, longest: Math.max(next, longest) };
  }
  return { current: 1, longest };
}

function AchievementsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: streak } = useQuery({
    queryKey: ["streak", uid],
    queryFn: () => apiFetch("/api/streaks"),
    enabled: !!uid,
  });

  const { data: earned } = useQuery({
    queryKey: ["achievements", uid],
    queryFn: async () => {
      const data = await apiFetch("/api/achievements");
      return new Set((data ?? []).map((r: { badge_id: string }) => r.badge_id));
    },
    enabled: !!uid,
  });

  const { data: todayData } = useQuery({
    queryKey: ["today", uid],
    queryFn: () => apiFetch("/api/today-stats"),
    enabled: !!uid,
  });

  const { data: allStats } = useQuery({
    queryKey: ["allstats", uid],
    queryFn: () => apiFetch("/api/all-stats"),
    enabled: !!uid,
  });

  useEffect(() => {
    if (!uid || streak === undefined || allStats === undefined) return;
    const grantBadges = async () => {
      const newBadges: string[] = [];
      const s = allStats;
      const td = todayData;
      if ((s.totalWorkouts ?? 0) >= 1) newBadges.push("first_workout");
      if ((s.totalMeals ?? 0) >= 1) newBadges.push("first_meal");
      if (td && td.water >= 2000) newBadges.push("hydration_hero");
      if (s.hasChatted) newBadges.push("ai_explorer");
      if (s.hasPlan) newBadges.push("plan_getter");
      if (s.hasTwin) newBadges.push("twin_preview");
      if (s.hasScreening) newBadges.push("screened");
      if ((s.totalMeals ?? 0) >= 10) newBadges.push("meals_10");
      if ((s.totalWorkouts ?? 0) >= 10) newBadges.push("workouts_10");
      const cur = streak?.current_streak ?? 0;
      if (cur >= 3) newBadges.push("streak_3");
      if (cur >= 7) newBadges.push("streak_7");
      if (cur >= 30) newBadges.push("streak_30");

      if (newBadges.length > 0) {
        await apiPost("/api/achievements", { badges: newBadges });
        qc.invalidateQueries({ queryKey: ["achievements", uid] });
      }
    };
    grantBadges();
  }, [uid, streak, allStats, todayData, qc]);

  useEffect(() => {
    if (!uid || streak === undefined) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    if (streak?.last_active_date === todayStr) return;
    const last = streak?.last_active_date ? new Date(streak.last_active_date) : null;
    const { current, longest } = updateStreakLogic(
      last, streak?.current_streak ?? 0, streak?.longest_streak ?? 0,
    );
    apiPost("/api/streaks", { current_streak: current, longest_streak: longest, last_active_date: todayStr })
      .then(() => qc.invalidateQueries({ queryKey: ["streak", uid] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, streak?.last_active_date]);

  const CHALLENGES = [
    { id: "workout_today", emoji: "💪", th: "ออกกำลังกายวันนี้",   en: "Workout today",       done: (todayData?.workouts ?? 0) > 0 },
    { id: "water_2000",   emoji: "💧", th: "ดื่มน้ำให้ครบ 2000ml", en: "Drink 2000ml water", done: (todayData?.water ?? 0) >= 2000 },
    { id: "log_meal",     emoji: "🍽️", th: "บันทึกมื้ออาหาร",       en: "Log a meal",          done: (todayData?.meals ?? 0) > 0 },
  ];

  const earnedCount = earned?.size ?? 0;
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-400" />
          {t("achievements")}
        </h1>
        <p className="text-muted-foreground mt-1">{earnedCount} / {BADGES.length} {lang === "th" ? "ป้ายที่ได้รับ" : "badges earned"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-6 shadow-card flex flex-col items-center text-center">
          <div className="text-5xl mb-2">🔥</div>
          <div className="text-4xl font-bold text-gradient-primary">{currentStreak}</div>
          <div className="text-xs text-muted-foreground mt-1">{t("streak_current")}</div>
          <div className="text-sm mt-1">{t("days")}</div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-card flex flex-col items-center text-center">
          <div className="text-5xl mb-2">🏅</div>
          <div className="text-4xl font-bold">{longestStreak}</div>
          <div className="text-xs text-muted-foreground mt-1">{t("streak_longest")}</div>
          <div className="text-sm mt-1">{t("days")}</div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-card flex flex-col items-center text-center">
          <div className="text-5xl mb-2">🏆</div>
          <div className="text-4xl font-bold text-yellow-400">{earnedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">{lang === "th" ? "ป้ายทั้งหมด" : "Total badges"}</div>
          <div className="text-sm mt-1">/ {BADGES.length}</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          {t("daily_challenges")}
        </h2>
        <div className="space-y-3">
          {CHALLENGES.map((c) => (
            <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition ${c.done ? "border-green-500/40 bg-green-500/10" : "border-border/40 bg-muted/20"}`}>
              <span className="text-xl">{c.emoji}</span>
              <span className="flex-1 text-sm font-medium">{lang === "th" ? c.th : c.en}</span>
              {c.done
                ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                : <Circle className="h-5 w-5 text-muted-foreground" />}
              <span className={`text-xs font-medium ${c.done ? "text-green-400" : "text-muted-foreground"}`}>
                {c.done ? t("challenge_done") : t("challenge_pending")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">{t("badges_earned")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const isEarned = earned?.has(b.id) ?? false;
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 text-center transition ${
                  isEarned
                    ? "border-primary/40 bg-primary/10 shadow-glow"
                    : "border-border/30 bg-muted/10 opacity-50 grayscale"
                }`}
              >
                <div className="text-3xl mb-2">{isEarned ? b.emoji : "🔒"}</div>
                <div className="text-xs font-semibold leading-tight">{lang === "th" ? b.th : b.en}</div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{lang === "th" ? b.desc_th : b.desc_en}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 shadow-card flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{t("streak_desc")}</div>
        <Link to="/workout" className="text-xs text-primary-glow hover:underline">{t("view_all")}</Link>
      </div>
    </div>
  );
}
