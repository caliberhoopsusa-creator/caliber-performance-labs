/**
 * Product feature flags, shared by the client route guard and the server
 * middleware so the two cannot drift.
 *
 * Caliber is pivoting to player first. The coach, recruiter and guardian
 * products stay in the codebase but ship dark until player growth justifies
 * bringing them back. Nothing is deleted: flip a flag and the surface returns.
 *
 * This module is pure. Each side reads its own environment and passes the
 * result in, because `process.env` does not exist in the browser and
 * `import.meta.env` does not exist in Node:
 *
 *   server  -> server/features.ts          reads process.env.ENABLE_*
 *   client  -> client/src/lib/features.ts  reads import.meta.env.VITE_ENABLE_*
 *
 * Both halves must be set together, matching the existing
 * DISABLE_SUBSCRIPTION_GATE / VITE_DISABLE_SUBSCRIPTION_GATE pattern.
 */
import type { UserRole } from "./roles";

export const PRODUCT_FLAGS = [
  "ENABLE_COACH_PRODUCT",
  "ENABLE_RECRUITER_PRODUCT",
  "ENABLE_GUARDIAN_PRODUCT",
] as const;

export type ProductFlag = (typeof PRODUCT_FLAGS)[number];

export type FeatureFlags = Record<ProductFlag, boolean>;

/** Every flag off. The default, and what an unset environment produces. */
export const ALL_PRODUCTS_DISABLED: FeatureFlags = {
  ENABLE_COACH_PRODUCT: false,
  ENABLE_RECRUITER_PRODUCT: false,
  ENABLE_GUARDIAN_PRODUCT: false,
};

/**
 * Which flag gates each role.
 *
 * `player` maps to null: the player product is the platform now, so it has no
 * flag and can never be switched off.
 */
export const ROLE_PRODUCT_FLAG: Record<UserRole, ProductFlag | null> = {
  player: null,
  coach: "ENABLE_COACH_PRODUCT",
  recruiter: "ENABLE_RECRUITER_PRODUCT",
  guardian: "ENABLE_GUARDIAN_PRODUCT",
};

/**
 * Parses one environment value.
 *
 * Strictly opt in: only the exact string "true" enables a product. Anything
 * else, including undefined, an empty string, "1" or "TRUE", reads as off, so
 * a typo in a deploy config fails closed rather than exposing a dark product.
 */
export function parseFlagValue(value: unknown): boolean {
  return value === "true";
}

/** Builds a flag set from a bag of environment values. */
export function readFlags(env: Record<string, unknown>, prefix = ""): FeatureFlags {
  return {
    ENABLE_COACH_PRODUCT: parseFlagValue(env[`${prefix}ENABLE_COACH_PRODUCT`]),
    ENABLE_RECRUITER_PRODUCT: parseFlagValue(env[`${prefix}ENABLE_RECRUITER_PRODUCT`]),
    ENABLE_GUARDIAN_PRODUCT: parseFlagValue(env[`${prefix}ENABLE_GUARDIAN_PRODUCT`]),
  };
}

/** Whether this role's product is currently shipping. */
export function isRoleEnabled(role: UserRole, flags: FeatureFlags): boolean {
  const flag = ROLE_PRODUCT_FLAG[role];
  if (flag === null) return true;
  return flags[flag] === true;
}

/** The roles a new account may choose at sign up. Player is always offered. */
export function selectableRoles(flags: FeatureFlags): UserRole[] {
  return (Object.keys(ROLE_PRODUCT_FLAG) as UserRole[]).filter((role) =>
    isRoleEnabled(role, flags),
  );
}
