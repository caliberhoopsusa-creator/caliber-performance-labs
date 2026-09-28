/**
 * Server side product feature flags.
 *
 * Reads process.env and hands the result to the pure helpers in shared/features
 * so the client guard and this middleware agree on the rules.
 *
 * A disabled product answers 404, not 403. 403 would confirm the route exists
 * and that the caller merely lacks a role, which tells a prober exactly what is
 * parked behind the flag. 404 is what the pivot wants it to look like: gone.
 */
import type { RequestHandler } from "express";
import {
  readFlags,
  isRoleEnabled,
  type FeatureFlags,
  type ProductFlag,
} from "@shared/features";
import type { UserRole } from "@shared/roles";

/**
 * Read on every call rather than cached at import time, so a test or a running
 * process can flip a flag without a restart. The cost is an object literal.
 */
export function getFeatureFlags(): FeatureFlags {
  return readFlags(process.env as Record<string, unknown>);
}

export function isProductEnabled(flag: ProductFlag): boolean {
  return getFeatureFlags()[flag] === true;
}

/** Whether this role's product is currently shipping. */
export function isRoleProductEnabled(role: UserRole): boolean {
  return isRoleEnabled(role, getFeatureFlags());
}

/** The 404 body a dark product returns. Shaped like the real not found body. */
export const PRODUCT_DISABLED_BODY = { message: "Not found" } as const;

/**
 * Guards a whole product surface. Mount ahead of the role check so a dark
 * product 404s before it can 401 or 403, which would otherwise leak that the
 * route is real and only gated by role.
 */
export function requireProductEnabled(flag: ProductFlag): RequestHandler {
  return (_req, res, next) => {
    if (!isProductEnabled(flag)) {
      return res.status(404).json(PRODUCT_DISABLED_BODY);
    }
    next();
  };
}
