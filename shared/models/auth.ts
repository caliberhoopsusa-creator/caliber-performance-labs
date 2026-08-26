import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, timestamp, varchar, unique } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // NOTE: in the live DB this column is `user_role` NOT NULL DEFAULT 'player',
  // so it is never null — a brand-new account reads as 'player' before the user
  // has chosen anything. "Has the user actually picked?" is `roleSelectedAt`,
  // not `role`. Don't reintroduce `!user.role` as a "no role yet" check.
  role: varchar("role"), // 'player', 'coach', 'recruiter', 'guardian', 'admin'
  // Set when the user confirms their role at sign-up. Once set, the role is
  // locked: only an admin can change it (PATCH /api/admin/users/:id/role).
  roleSelectedAt: timestamp("role_selected_at"),
  playerId: integer("player_id"), // For players, links to their player profile
  preferredSport: varchar("preferred_sport").default("basketball"), // 'basketball' - user's selected sport context
  passwordHash: varchar("password_hash"), // For local auth
  emailVerified: boolean("email_verified").default(false), // Whether email has been verified
  coachVerified: boolean("coach_verified").default(false), // Whether coach has been approved by admin
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Active subscription ID
  subscriptionStatus: varchar("subscription_status"), // 'active', 'canceled', 'past_due', etc.
  coinBalance: integer("coin_balance").default(0), // Coins for shop purchases
  activeThemeId: integer("active_theme_id"), // Currently active theme from shop
  referralCode: varchar("referral_code", { length: 10 }).unique(), // Unique invite code for referral program
  referredBy: varchar("referred_by"), // User ID of the person who referred this user
  referralConversions: integer("referral_conversions").default(0), // How many users signed up via this user's referral
  dateOfBirth: timestamp("date_of_birth"), // For COPPA age gate
  consentVerifiedAt: timestamp("consent_verified_at"), // When parental consent was verified
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
