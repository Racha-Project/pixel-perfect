import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users, profiles } from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: sessionTtl },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (existing.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const id = randomUUID();
      const [user] = await db.insert(users).values({
        id,
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
      }).returning();

      const userType = role === "trainer" ? "trainer" : "client";
      await db.insert(profiles).values({
        id,
        displayName: [firstName, lastName].filter(Boolean).join(" ") || null,
        userType,
        onboarded: false,
        isVerifiedTrainer: false,
      });

      (req.session as any).userId = user.id;
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: userType });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  (req as any).userId = userId;
  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
  if (!profile || profile.userType !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};
