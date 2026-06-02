import { pgTable, text, varchar, integer, numeric, boolean, date, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (t) => [index("IDX_session_expire").on(t.expire)]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  heightCm: numeric("height_cm"),
  weightKg: numeric("weight_kg"),
  age: integer("age"),
  gender: text("gender"),
  goal: text("goal"),
  activityLevel: text("activity_level").default("moderate"),
  language: text("language").default("th"),
  userType: text("user_type").default("client"),
  onboarded: boolean("onboarded").default(false),
  isVerifiedTrainer: boolean("is_verified_trainer").default(false),
  trainerBio: text("trainer_bio"),
  trainerSpecialties: text("trainer_specialties").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutPlans = pgTable("workout_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  goal: text("goal"),
  daysPerWeek: integer("days_per_week"),
  plan: jsonb("plan").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exercise: text("exercise").notNull(),
  reps: integer("reps"),
  sets: integer("sets"),
  durationSec: integer("duration_sec"),
  caloriesBurned: numeric("calories_burned"),
  notes: text("notes"),
  performedAt: timestamp("performed_at").defaultNow(),
});

export const nutritionLogs = pgTable("nutrition_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  meal: text("meal").notNull(),
  calories: numeric("calories").default("0"),
  proteinG: numeric("protein_g").default("0"),
  carbsG: numeric("carbs_g").default("0"),
  fatG: numeric("fat_g").default("0"),
  waterMl: numeric("water_ml").default("0"),
  loggedAt: timestamp("logged_at").defaultNow(),
});

export const chatHistory = pgTable("chat_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStreaks = pgTable("user_streaks", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActiveDate: date("last_active_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const healthScreenings = pgTable("health_screenings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(),
  healthScore: integer("health_score"),
  riskLevel: text("risk_level"),
  aiSummary: text("ai_summary"),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainers = pgTable("trainers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  displayName: text("display_name").notNull(),
  bio: text("bio").default(""),
  specialties: text("specialties").array().default(sql`'{}'`),
  certifications: text("certifications").array().default(sql`'{}'`),
  experienceYears: integer("experience_years").default(1),
  experienceLevel: text("experience_level").default("intermediate"),
  hourlyRateThb: integer("hourly_rate_thb").default(500),
  trainingModality: text("training_modality").array().default(sql`'{online}'`),
  trainingStyle: text("training_style").default("supportive"),
  targetLevels: text("target_levels").array().default(sql`'{beginner,intermediate}'`),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  retentionRate: integer("retention_rate").default(80),
  gender: text("gender").default("other"),
  location: text("location").default("Bangkok"),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainerReviews = pgTable("trainer_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: uuid("trainer_id").references(() => trainers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating"),
  comment: text("comment").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainerBookings = pgTable("trainer_bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: uuid("trainer_id").references(() => trainers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionDate: date("session_date").notNull(),
  sessionTime: text("session_time").notNull(),
  modality: text("modality").default("online"),
  status: text("status").default("pending"),
  notes: text("notes").default(""),
  priceThb: integer("price_thb").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
