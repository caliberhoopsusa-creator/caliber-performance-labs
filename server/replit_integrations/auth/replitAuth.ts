import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { parseDateOfBirth, isUnderMinimumAge, toDateColumn } from "@shared/age";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
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
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await authStorage.getUserByEmail(email);
        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid email or password" });
        }
        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, { claims: { sub: user.id }, userId: user.id });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, referralCode, dateOfBirth } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      /* Age gate (docs/PIVOT_AUDIT.md 7c). Date of birth used to be collected by
         the form, sent by the client, and dropped on the floor here, so nothing
         in the database recorded how old anyone was. It is required now. */
      const birthDate = parseDateOfBirth(dateOfBirth);
      if (!birthDate) {
        return res.status(400).json({
          message: "A valid date of birth is required",
          type: "date_of_birth_required",
        });
      }

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      if (isUnderMinimumAge(birthDate)) {
        /* No users row and no session: the account does not exist until a
           guardian consents. Hold only what is needed to reach them later.
           The guardian flow itself is a stub, see POST /api/guardian-consent. */
        const { db } = await import("../../db");
        const { pendingGuardianConsents } = await import("../../../shared/schema");
        const { and, eq: eqOp } = await import("drizzle-orm");

        const [alreadyPending] = await db
          .select({ id: pendingGuardianConsents.id })
          .from(pendingGuardianConsents)
          .where(and(
            eqOp(pendingGuardianConsents.email, email),
            eqOp(pendingGuardianConsents.status, "pending"),
          ))
          .limit(1);

        if (!alreadyPending) {
          await db.insert(pendingGuardianConsents).values({
            email,
            dateOfBirth: toDateColumn(birthDate),
          });
        }

        return res.status(403).json({
          message: "Guardian consent required",
          type: "guardian_consent_required",
        });
      }

      const hash = await hashPassword(password);

      // Resolve referral code to a referrer user ID
      let referredBy: string | undefined;
      if (referralCode && typeof referralCode === 'string') {
        const { db } = await import("../../db");
        const { users } = await import("../../../shared/models/auth");
        const { eq } = await import("drizzle-orm");
        const [referrer] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.referralCode, referralCode.toUpperCase()))
          .limit(1);
        if (referrer) referredBy = referrer.id;
      }

      const user = await authStorage.upsertUser({
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash: hash,
        emailVerified: false,
        dateOfBirth: birthDate,
        ...(referredBy ? { referredBy } : {}),
      } as any);
      const sessionUser = { claims: { sub: user.id }, userId: user.id };
      req.login(sessionUser, (err) => {
        if (err) return res.status(500).json({ message: "Login after register failed" });
        const { passwordHash: _pw, ...safeUser } = user as any;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ message: "Logged in successfully" });
      });
    })(req, res, next);
  });

  // Keep /api/login GET for any redirects (send to frontend login page)
  app.get("/api/login", (req, res) => {
    res.redirect("/#/login");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  /**
   * Guardian consent: STUB.
   *
   * Registration below the COPPA line parks a row in pending_guardian_consents
   * and stops. This lets an under 13 registrant attach a guardian email to that
   * row so the real flow has something to work with, and reports status back.
   * It grants nothing: no account is created and no session is issued here.
   *
   * Building the actual verifiable parental consent flow is a separate piece of
   * work and is deliberately not attempted yet.
   */
  app.post("/api/guardian-consent", async (req, res) => {
    try {
      const { email, guardianEmail } = req.body ?? {};
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      const { db } = await import("../../db");
      const { pendingGuardianConsents } = await import("../../../shared/schema");
      const { and, eq: eqOp } = await import("drizzle-orm");

      const [pending] = await db
        .select()
        .from(pendingGuardianConsents)
        .where(and(
          eqOp(pendingGuardianConsents.email, email),
          eqOp(pendingGuardianConsents.status, "pending"),
        ))
        .limit(1);

      if (!pending) {
        return res.status(404).json({ message: "No pending consent request for that email" });
      }

      if (guardianEmail && typeof guardianEmail === "string") {
        await db
          .update(pendingGuardianConsents)
          .set({ guardianEmail })
          .where(eqOp(pendingGuardianConsents.id, pending.id));
      }

      return res.status(202).json({
        message: "Guardian consent required",
        type: "guardian_consent_required",
        status: "pending",
        implemented: false,
      });
    } catch (err) {
      console.error("Guardian consent stub error:", err);
      return res.status(500).json({ message: "Failed to record consent request" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    message: "Your session has expired. Please log in again.",
    type: "session_expired",
  });
};
