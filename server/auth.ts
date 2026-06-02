import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users } from "../shared/schema";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

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
    cookie: { httpOnly: true, secure: true, maxAge: sessionTtl },
  });
}

function updateUserSession(user: any, tokens: any) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await db.insert(users).values({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      updatedAt: new Date(),
    },
  });
}

const registeredStrategies = new Set<string>();

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const ensureStrategy = (domain: string) => {
    const name = `replitauth:${domain}`;
    if (!registeredStrategies.has(name)) {
      passport.use(new Strategy(
        { name, config, scope: "openid email profile offline_access", callbackURL: `https://${domain}/api/callback` },
        async (tokens: any, verified: any) => {
          const user = {};
          updateUserSession(user, tokens);
          await upsertUser(tokens.claims());
          verified(null, user);
        }
      ));
      registeredStrategies.add(name);
    }
  };

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/dashboard",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(async () => {
      const config = await getOidcConfig();
      res.redirect(client.buildEndSessionUrl(config, {
        client_id: process.env.REPL_ID!,
        post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
      }).href);
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  if (!user.refresh_token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, user.refresh_token);
    updateUserSession(user, tokenResponse);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
