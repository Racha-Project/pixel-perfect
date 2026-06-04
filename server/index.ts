import express from "express";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { GoogleGenAI } from "@google/genai";
import {
  users, profiles, workoutPlans, workoutLogs, nutritionLogs,
  chatHistory, userStreaks, userAchievements, healthScreenings,
  trainers, trainerReviews, trainerBookings, trainerAvailability, dailyRewards,
} from "../shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "public/uploads/avatars");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, _file, cb) => {
    const uid = (req as any).userId ?? "unknown";
    cb(null, `${uid}_${Date.now()}.jpg`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|png|webp|gif)/.test(file.mimetype);
    cb(null, ok);
  },
});

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function callGemini(messages: { role: string; content: string }[], systemPrompt?: string) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: systemPrompt ? { systemInstruction: systemPrompt } : undefined,
  });
  return res.text ?? "";
}

await setupAuth(app);

function getUserId(req: express.Request): string {
  return (req as any).userId;
}

app.get("/api/auth/user", isAuthenticated, async (req, res) => {
  try {
    const userId = getUserId(req);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    res.json({
      id: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      profile: profile ?? null,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

app.get("/api/profile", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [p] = await db.select().from(profiles).where(eq(profiles.id, uid));
  res.json(p ?? null);
});

app.put("/api/profile", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { display_name, height_cm, weight_kg, age, gender, goal, language, onboarded, user_type } = req.body;
  const [p] = await db.insert(profiles).values({
    id: uid,
    displayName: display_name ?? null,
    heightCm: height_cm ? String(height_cm) : null,
    weightKg: weight_kg ? String(weight_kg) : null,
    age: age ? Number(age) : null,
    gender: gender ?? null,
    goal: goal ?? null,
    language: language ?? "th",
    onboarded: onboarded ?? false,
    userType: user_type ?? "client",
  }).onConflictDoUpdate({
    target: profiles.id,
    set: {
      displayName: display_name ?? null,
      heightCm: height_cm ? String(height_cm) : null,
      weightKg: weight_kg ? String(weight_kg) : null,
      age: age ? Number(age) : null,
      gender: gender ?? null,
      goal: goal ?? null,
      language: language ?? undefined,
      onboarded: onboarded ?? undefined,
      userType: user_type ?? undefined,
      updatedAt: new Date(),
    },
  }).returning();
  res.json(p);
});

app.post("/api/profile/avatar", isAuthenticated, uploadAvatar.single("avatar"), async (req, res) => {
  const uid = getUserId(req);
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const [p] = await db.insert(profiles).values({ id: uid, avatarUrl })
    .onConflictDoUpdate({ target: profiles.id, set: { avatarUrl, updatedAt: new Date() } })
    .returning();
  res.json({ avatarUrl: p.avatarUrl });
});

app.get("/api/nutrition", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const since = req.query.since ? new Date(req.query.since as string) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const rows = await db.select().from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, uid), gte(nutritionLogs.loggedAt, since)))
    .orderBy(desc(nutritionLogs.loggedAt));
  res.json(rows);
});

app.get("/api/nutrition/today", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const start = new Date(); start.setHours(0,0,0,0);
  const rows = await db.select().from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, uid), gte(nutritionLogs.loggedAt, start)))
    .orderBy(desc(nutritionLogs.loggedAt));
  res.json(rows);
});

app.post("/api/nutrition", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { meal, calories, protein_g, carbs_g, fat_g, water_ml } = req.body;
  const [row] = await db.insert(nutritionLogs).values({
    userId: uid, meal,
    calories: String(calories ?? 0),
    proteinG: String(protein_g ?? 0),
    carbsG: String(carbs_g ?? 0),
    fatG: String(fat_g ?? 0),
    waterMl: String(water_ml ?? 0),
  }).returning();
  res.json(row);
});

app.get("/api/workout/plans", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [plan] = await db.select().from(workoutPlans)
    .where(and(eq(workoutPlans.userId, uid), eq(workoutPlans.active, true)))
    .orderBy(desc(workoutPlans.createdAt)).limit(1);
  res.json(plan ?? null);
});

app.get("/api/workout/plan", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [plan] = await db.select().from(workoutPlans)
    .where(and(eq(workoutPlans.userId, uid), eq(workoutPlans.active, true)))
    .orderBy(desc(workoutPlans.createdAt)).limit(1);
  res.json(plan ?? null);
});

app.get("/api/workout/logs", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const since = req.query.since ? new Date(req.query.since as string) : undefined;
  let q = db.select().from(workoutLogs).where(eq(workoutLogs.userId, uid));
  if (since) q = db.select().from(workoutLogs).where(and(eq(workoutLogs.userId, uid), gte(workoutLogs.performedAt, since)));
  const rows = await q.orderBy(desc(workoutLogs.performedAt)).limit(15);
  res.json(rows);
});

app.post("/api/workout/logs", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { exercise, sets, reps, duration_sec } = req.body;
  const [row] = await db.insert(workoutLogs).values({
    userId: uid, exercise,
    sets: sets ? Number(sets) : null,
    reps: reps ? Number(reps) : null,
    durationSec: duration_sec ? Number(duration_sec) : null,
  }).returning();
  res.json(row);
});

app.post("/api/workout/log", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { exercise, sets, reps, duration_sec } = req.body;
  const [row] = await db.insert(workoutLogs).values({
    userId: uid, exercise,
    sets: sets ? Number(sets) : null,
    reps: reps ? Number(reps) : null,
    durationSec: duration_sec ? Number(duration_sec) : null,
  }).returning();
  res.json(row);
});

app.get("/api/streaks", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [streak] = await db.select().from(userStreaks).where(eq(userStreaks.userId, uid));
  res.json(streak ?? null);
});

app.put("/api/streaks", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { current_streak, longest_streak, last_active_date } = req.body;
  const [row] = await db.insert(userStreaks).values({
    userId: uid,
    currentStreak: current_streak,
    longestStreak: longest_streak,
    lastActiveDate: last_active_date,
  }).onConflictDoUpdate({
    target: userStreaks.userId,
    set: { currentStreak: current_streak, longestStreak: longest_streak, lastActiveDate: last_active_date, updatedAt: new Date() },
  }).returning();
  res.json(row);
});

app.post("/api/streaks", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { current_streak, longest_streak, last_active_date } = req.body;
  const [row] = await db.insert(userStreaks).values({
    userId: uid,
    currentStreak: current_streak,
    longestStreak: longest_streak,
    lastActiveDate: last_active_date,
  }).onConflictDoUpdate({
    target: userStreaks.userId,
    set: { currentStreak: current_streak, longestStreak: longest_streak, lastActiveDate: last_active_date, updatedAt: new Date() },
  }).returning();
  res.json(row);
});

app.get("/api/achievements", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const rows = await db.select().from(userAchievements).where(eq(userAchievements.userId, uid));
  res.json(rows);
});

app.post("/api/achievements", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { badge_id, badges } = req.body;
  try {
    if (badges && Array.isArray(badges)) {
      const results = [];
      for (const bid of badges) {
        const [row] = await db.insert(userAchievements).values({ userId: uid, badgeId: bid })
          .onConflictDoNothing().returning();
        if (row) results.push(row);
      }
      return res.json(results);
    }
    const [row] = await db.insert(userAchievements).values({ userId: uid, badgeId: badge_id })
      .onConflictDoNothing().returning();
    res.json(row ?? null);
  } catch {
    res.json(null);
  }
});

app.get("/api/screenings", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const rows = await db.select().from(healthScreenings)
    .where(eq(healthScreenings.userId, uid))
    .orderBy(desc(healthScreenings.createdAt)).limit(5);
  res.json(rows);
});

app.get("/api/screening", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const rows = await db.select().from(healthScreenings)
    .where(eq(healthScreenings.userId, uid))
    .orderBy(desc(healthScreenings.createdAt)).limit(3);
  res.json(rows);
});

app.get("/api/today-stats", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const start = new Date(); start.setHours(0,0,0,0);
  const [meals, workoutsRows] = await Promise.all([
    db.select().from(nutritionLogs).where(and(eq(nutritionLogs.userId, uid), gte(nutritionLogs.loggedAt, start))),
    db.select().from(workoutLogs).where(and(eq(workoutLogs.userId, uid), gte(workoutLogs.performedAt, start))),
  ]);
  res.json({
    meals: meals.length,
    workouts: workoutsRows.length,
    water: meals.reduce((s, m) => s + Number(m.waterMl ?? 0), 0),
  });
});

app.get("/api/all-stats", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [
    allMeals, allWorkouts, chatRows, planRows, screenRows,
  ] = await Promise.all([
    db.select({ id: nutritionLogs.id }).from(nutritionLogs).where(eq(nutritionLogs.userId, uid)),
    db.select({ id: workoutLogs.id }).from(workoutLogs).where(eq(workoutLogs.userId, uid)),
    db.select({ id: chatHistory.id }).from(chatHistory).where(eq(chatHistory.userId, uid)).limit(1),
    db.select({ id: workoutPlans.id }).from(workoutPlans).where(eq(workoutPlans.userId, uid)).limit(1),
    db.select({ id: healthScreenings.id }).from(healthScreenings).where(eq(healthScreenings.userId, uid)).limit(1),
  ]);
  res.json({
    totalMeals: allMeals.length,
    totalWorkouts: allWorkouts.length,
    hasChatted: chatRows.length > 0,
    hasPlan: planRows.length > 0,
    hasTwin: planRows.length > 0,
    hasScreening: screenRows.length > 0,
  });
});

app.get("/api/twin-stats", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const since = new Date(); since.setDate(since.getDate() - 30);
  const [meals, workoutsRows] = await Promise.all([
    db.select({ calories: nutritionLogs.calories, loggedAt: nutritionLogs.loggedAt }).from(nutritionLogs)
      .where(and(eq(nutritionLogs.userId, uid), gte(nutritionLogs.loggedAt, since))),
    db.select({ id: workoutLogs.id, performedAt: workoutLogs.performedAt }).from(workoutLogs)
      .where(and(eq(workoutLogs.userId, uid), gte(workoutLogs.performedAt, since))),
  ]);
  const days = Math.max(1, new Set(meals.map(m => m.loggedAt?.toISOString().slice(0,10))).size);
  const avgCal = meals.reduce((s, m) => s + Number(m.calories ?? 0), 0) / days;
  const workoutsPerWeek = (workoutsRows.length / 30) * 7;
  res.json({ avgCal, workoutsPerWeek });
});

app.get("/api/trainers", async (req, res) => {
  const rows = await db.select().from(trainers).where(eq(trainers.isActive, true));
  res.json(rows);
});

app.get("/api/trainers/:id/reviews", async (req, res) => {
  const rows = await db.select().from(trainerReviews).where(eq(trainerReviews.trainerId, req.params.id));
  res.json(rows);
});

app.post("/api/trainers/:id/reviews", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { rating, comment } = req.body;
  const trainerId = req.params.id;
  const [row] = await db.insert(trainerReviews).values({
    trainerId, userId: uid, rating: Number(rating), comment,
  }).onConflictDoNothing().returning();
  // Recalculate trainer avg rating
  const all = await db.select().from(trainerReviews).where(eq(trainerReviews.trainerId, trainerId));
  const avg = all.length ? all.reduce((s, r) => s + (r.rating ?? 0), 0) / all.length : 0;
  await db.update(trainers).set({ rating: avg.toFixed(2), reviewCount: all.length }).where(eq(trainers.id, trainerId));
  res.json(row ?? null);
});

app.get("/api/my-reviews", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const rows = await db.select().from(trainerReviews).where(eq(trainerReviews.userId, uid));
  res.json(rows);
});

app.get("/api/bookings", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const rows = await db.select({
    id: trainerBookings.id,
    trainerId: trainerBookings.trainerId,
    userId: trainerBookings.userId,
    sessionDate: trainerBookings.sessionDate,
    sessionTime: trainerBookings.sessionTime,
    modality: trainerBookings.modality,
    status: trainerBookings.status,
    notes: trainerBookings.notes,
    priceThb: trainerBookings.priceThb,
    createdAt: trainerBookings.createdAt,
    trainerName: trainers.displayName,
    trainerAvatar: trainers.avatarUrl,
  }).from(trainerBookings)
    .leftJoin(trainers, eq(trainerBookings.trainerId, trainers.id))
    .where(eq(trainerBookings.userId, uid))
    .orderBy(desc(trainerBookings.createdAt));
  res.json(rows);
});

app.post("/api/bookings", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { trainer_id, session_date, session_time, modality, notes, price_thb } = req.body;
  const [row] = await db.insert(trainerBookings).values({
    trainerId: trainer_id, userId: uid,
    sessionDate: session_date, sessionTime: session_time,
    modality: modality ?? "online",
    notes: notes ?? "",
    priceThb: price_thb ?? 0,
  }).returning();
  res.json(row);
});

app.post("/api/bookings/:id/cancel", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const rows = await db.update(trainerBookings)
    .set({ status: "cancelled" })
    .where(and(eq(trainerBookings.id, req.params.id), eq(trainerBookings.userId, uid)))
    .returning();
  res.json(rows[0] ?? null);
});

app.put("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { status } = req.body;
  const rows = await db.update(trainerBookings)
    .set({ status })
    .where(and(eq(trainerBookings.id, req.params.id), eq(trainerBookings.userId, uid)))
    .returning();
  res.json(rows[0] ?? null);
});

app.delete("/api/bookings/:id", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  await db.delete(trainerBookings)
    .where(and(eq(trainerBookings.id, req.params.id), eq(trainerBookings.userId, uid)));
  res.json({ ok: true });
});

app.get("/api/trainer/bookings", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [trainer] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!trainer) return res.json([]);
  const rows = await db.select({
    id: trainerBookings.id,
    trainerId: trainerBookings.trainerId,
    userId: trainerBookings.userId,
    sessionDate: trainerBookings.sessionDate,
    sessionTime: trainerBookings.sessionTime,
    modality: trainerBookings.modality,
    status: trainerBookings.status,
    notes: trainerBookings.notes,
    priceThb: trainerBookings.priceThb,
    createdAt: trainerBookings.createdAt,
    clientName: profiles.displayName,
    clientAvatar: profiles.avatarUrl,
  }).from(trainerBookings)
    .leftJoin(profiles, eq(trainerBookings.userId, profiles.id))
    .where(eq(trainerBookings.trainerId, trainer.id))
    .orderBy(desc(trainerBookings.createdAt));
  res.json(rows);
});

app.put("/api/trainer/bookings/:id/status", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { status } = req.body;
  const [trainer] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!trainer) return res.status(403).json({ message: "Not a trainer" });
  const rows = await db.update(trainerBookings)
    .set({ status })
    .where(and(eq(trainerBookings.id, req.params.id), eq(trainerBookings.trainerId, trainer.id)))
    .returning();
  res.json(rows[0] ?? null);
});

app.get("/api/trainer/stats", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [t] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!t) return res.json({ pending: 0, confirmed: 0, completed: 0, totalRevenue: 0, monthRevenue: 0, clients: 0 });
  const all = await db.select().from(trainerBookings).where(eq(trainerBookings.trainerId, t.id));
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const monthStr = monthStart.toISOString().slice(0,10);
  const pending   = all.filter(b => b.status === "pending").length;
  const confirmed = all.filter(b => b.status === "confirmed").length;
  const completed = all.filter(b => b.status === "completed");
  const totalRevenue = completed.reduce((s, b) => s + (b.priceThb ?? 0), 0);
  const monthRevenue = completed.filter(b => (b.sessionDate ?? "") >= monthStr).reduce((s, b) => s + (b.priceThb ?? 0), 0);
  const clients = new Set(all.map(b => b.userId).filter(Boolean)).size;
  res.json({ pending, confirmed, completed: completed.length, totalRevenue, monthRevenue, clients });
});

app.get("/api/trainer/clients", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [t] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!t) return res.json([]);
  const rows = await db.select({
    clientId: trainerBookings.userId,
    clientName: profiles.displayName,
    clientAvatar: profiles.avatarUrl,
    sessionDate: trainerBookings.sessionDate,
    status: trainerBookings.status,
  }).from(trainerBookings)
    .leftJoin(profiles, eq(trainerBookings.userId, profiles.id))
    .where(eq(trainerBookings.trainerId, t.id))
    .orderBy(desc(trainerBookings.sessionDate));
  const map = new Map<string, any>();
  for (const r of rows) {
    if (!r.clientId) continue;
    const ex = map.get(r.clientId);
    if (!ex) map.set(r.clientId, { id: r.clientId, name: r.clientName ?? r.clientId, avatar: r.clientAvatar, sessions: 1, lastDate: r.sessionDate, completedSessions: r.status === "completed" ? 1 : 0 });
    else { ex.sessions++; if (r.status === "completed") ex.completedSessions++; }
  }
  res.json([...map.values()]);
});

app.get("/api/trainer/earnings", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [t] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!t) return res.json({ total: 0, monthly: [], byModality: [] });
  const completed = await db.select().from(trainerBookings)
    .where(and(eq(trainerBookings.trainerId, t.id), eq(trainerBookings.status, "completed")))
    .orderBy(desc(trainerBookings.sessionDate));
  const total = completed.reduce((s, b) => s + (b.priceThb ?? 0), 0);
  const monthlyMap = new Map<string, number>();
  for (const b of completed) {
    const month = (b.sessionDate ?? "").slice(0,7);
    if (month) monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + (b.priceThb ?? 0));
  }
  const monthly = [...monthlyMap.entries()].sort().slice(-6).map(([month, amount]) => ({ month, amount }));
  const modalMap = new Map<string, number>();
  for (const b of completed) {
    const mod = b.modality ?? "online";
    modalMap.set(mod, (modalMap.get(mod) ?? 0) + (b.priceThb ?? 0));
  }
  const byModality = [...modalMap.entries()].map(([modality, amount]) => ({ modality, amount }));
  res.json({ total, monthly, byModality });
});

app.get("/api/trainer/availability", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [t] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!t) return res.json([]);
  const rows = await db.select().from(trainerAvailability).where(eq(trainerAvailability.trainerId, t.id));
  res.json(rows);
});

app.post("/api/trainer/availability", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [t] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!t) return res.status(403).json({ message: "Not a trainer" });
  const { day_of_week, start_time, end_time } = req.body;
  const [row] = await db.insert(trainerAvailability)
    .values({ trainerId: t.id, dayOfWeek: Number(day_of_week), startTime: start_time, endTime: end_time })
    .returning();
  res.json(row);
});

app.delete("/api/trainer/availability/:id", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [t] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  if (!t) return res.status(403).json({ message: "Not a trainer" });
  await db.delete(trainerAvailability)
    .where(and(eq(trainerAvailability.id, req.params.id), eq(trainerAvailability.trainerId, t.id)));
  res.json({ ok: true });
});

app.get("/api/trainer/profile", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [t] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  res.json(t ?? null);
});

app.put("/api/trainer/profile", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { bio, specialties, certifications, experience_years, hourly_rate_thb, training_modality, training_style } = req.body;
  const [existing] = await db.select().from(trainers).where(eq(trainers.userId, uid));
  const payload = {
    bio: bio ?? "",
    specialties: specialties ?? [],
    certifications: certifications ?? [],
    experienceYears: experience_years ? Number(experience_years) : 1,
    hourlyRateThb:   hourly_rate_thb ? Number(hourly_rate_thb) : 500,
    trainingModality: training_modality ?? ["online"],
    trainingStyle: training_style ?? "supportive",
  };
  let row;
  if (!existing) {
    const [userRow] = await db.select().from(users).where(eq(users.id, uid));
    const displayName = [userRow?.firstName, userRow?.lastName].filter(Boolean).join(" ") || "Trainer";
    [row] = await db.insert(trainers).values({
      userId: uid,
      displayName,
      ...payload,
    }).returning();
  } else {
    [row] = await db.update(trainers).set(payload).where(eq(trainers.userId, uid)).returning();
  }
  res.json(row);
});

app.get("/api/daily-reward", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const today = new Date().toISOString().slice(0, 10);
  const [existing] = await db.select().from(dailyRewards)
    .where(and(eq(dailyRewards.userId, uid), eq(dailyRewards.loginDate, today)));
  if (existing) return res.json(existing);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const [prev] = await db.select().from(dailyRewards)
    .where(and(eq(dailyRewards.userId, uid), eq(dailyRewards.loginDate, yStr)));
  const streak = prev ? ((prev.dayStreak % 7) + 1) : 1;
  const PTS = [10, 20, 30, 40, 50, 60, 100];
  const rewardPoints = PTS[streak - 1] ?? 10;
  const [row] = await db.insert(dailyRewards)
    .values({ userId: uid, loginDate: today, dayStreak: streak, rewardPoints, claimed: false })
    .returning();
  res.json(row);
});

app.post("/api/daily-reward/claim", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db.update(dailyRewards)
    .set({ claimed: true, claimedAt: new Date() })
    .where(and(eq(dailyRewards.userId, uid), eq(dailyRewards.loginDate, today), eq(dailyRewards.claimed, false)))
    .returning();
  if (!row) return res.status(400).json({ message: "Already claimed" });
  res.json(row);
});

app.get("/api/daily-reward/history", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const rows = await db.select().from(dailyRewards)
    .where(eq(dailyRewards.userId, uid))
    .orderBy(desc(dailyRewards.loginDate)).limit(30);
  res.json(rows);
});

app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { messages } = req.body;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid));
  const lang = profile?.language === "en" ? "en" : "th";
  const sys = lang === "th"
    ? `คุณคือ AI Fitness & Health Coach ของ Fitder X ตอบเป็นภาษาไทย กระชับ ใช้น้ำเสียงให้กำลังใจ. ข้อมูลผู้ใช้: ${JSON.stringify(profile ?? {})}`
    : `You are Fitder X's AI Fitness & Health Coach. Reply concisely and encouragingly. User profile: ${JSON.stringify(profile ?? {})}`;
  try {
    const reply = await callGemini(messages, sys);
    const last = messages[messages.length - 1];
    await db.insert(chatHistory).values([
      { userId: uid, role: last.role, content: last.content },
      { userId: uid, role: "assistant", content: reply },
    ]);
    res.json({ reply });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/api/ai/workout-plan", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid));
  const lang = profile?.language === "en" ? "en" : "th";
  const prompt = lang === "th"
    ? `สร้างแผนออกกำลังกาย 7 วัน สำหรับ: ${JSON.stringify(profile)}. ตอบเป็น JSON {days:[{day:number,focus:string,exercises:[{name:string,sets:number,reps:string}]}]} เท่านั้น`
    : `Create a 7-day workout plan for: ${JSON.stringify(profile)}. Return ONLY JSON {days:[{day:number,focus:string,exercises:[{name:string,sets:number,reps:string}]}]}`;
  try {
    let text = await callGemini([{ role: "user", content: prompt }], "You output strict JSON only, no markdown.");
    text = text.replace(/```json|```/g, "").trim();
    let plan: unknown;
    try { plan = JSON.parse(text); } catch { plan = { raw: text }; }
    const [inserted] = await db.insert(workoutPlans).values({
      userId: uid,
      title: lang === "th" ? "แผน AI 7 วัน" : "AI 7-Day Plan",
      goal: profile?.goal ?? "general_fitness",
      daysPerWeek: 7,
      plan: plan as any,
    }).returning();
    res.json(inserted);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/api/ai/match-trainers", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { trainers: trainerList } = req.body;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid));
  const lang = profile?.language === "en" ? "en" : "th";
  const prompt = lang === "th"
    ? `คุณเป็น AI Trainer Matching Engine\nโปรไฟล์ผู้ใช้: ${JSON.stringify(profile)}\nรายชื่อเทรนเนอร์: ${JSON.stringify(trainerList)}\nวิเคราะห์ความเข้ากันได้และตอบเป็น JSON เท่านั้น:\n{"matches":[{"trainer_id":"<id>","score":<0-100>,"reasons":["<เหตุผล>"]}]}`
    : `You are Fitder X's AI Trainer Matching Engine.\nUser: ${JSON.stringify(profile)}\nTrainers: ${JSON.stringify(trainerList)}\nReturn ONLY JSON:\n{"matches":[{"trainer_id":"<id>","score":<0-100>,"reasons":["<reason>"]}]}`;
  try {
    let text = await callGemini([{ role: "user", content: prompt }], "You output strict JSON only, no markdown fences.");
    text = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    res.json(result);
  } catch {
    res.json({ matches: trainerList.map((t: any) => ({ trainer_id: t.id, score: 70, reasons: [] })) });
  }
});

app.post("/api/ai/recognize-meal", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { description } = req.body;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid));
  const lang = profile?.language === "en" ? "en" : "th";
  const prompt = lang === "th"
    ? `วิเคราะห์อาหาร: "${description}"\nตอบเป็น JSON เท่านั้น:\n{"meal":"<ชื่ออาหาร>","calories":<kcal>,"protein_g":<g>,"carbs_g":<g>,"fat_g":<g>}`
    : `Analyze: "${description}"\nReturn ONLY JSON:\n{"meal":"<name>","calories":<kcal>,"protein_g":<g>,"carbs_g":<g>,"fat_g":<g>}`;
  try {
    let text = await callGemini([{ role: "user", content: prompt }], "You output strict JSON only, no markdown fences.");
    text = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    res.json({ meal: String(result.meal ?? description), calories: Number(result.calories ?? 0), protein_g: Number(result.protein_g ?? 0), carbs_g: Number(result.carbs_g ?? 0), fat_g: Number(result.fat_g ?? 0) });
  } catch (e: any) {
    res.status(500).json({ message: "Could not parse meal. Try a more specific description." });
  }
});

app.post("/api/ai/screen-health", isAuthenticated, async (req, res) => {
  const uid = getUserId(req);
  const { answers } = req.body;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid));
  const lang = profile?.language === "en" ? "en" : "th";
  const prompt = lang === "th"
    ? `ประเมินสุขภาพ: ${JSON.stringify({ profile, answers })}\nตอบเป็น JSON:\n{"health_score":<0-100>,"risk_level":"low"|"medium"|"high","summary":"<สรุป>","recommendations":["<คำแนะนำ>"]}`
    : `Assess health: ${JSON.stringify({ profile, answers })}\nReturn ONLY JSON:\n{"health_score":<0-100>,"risk_level":"low"|"medium"|"high","summary":"<summary>","recommendations":["<rec>"]}`;
  try {
    let text = await callGemini([{ role: "user", content: prompt }], "You output strict JSON only, no markdown fences.");
    text = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    const [inserted] = await db.insert(healthScreenings).values({
      userId: uid, answers,
      healthScore: result.health_score,
      riskLevel: result.risk_level,
      aiSummary: result.summary,
      recommendations: result.recommendations,
    }).returning();
    res.json(inserted);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

const PORT = parseInt(process.env.API_PORT ?? "3001");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
