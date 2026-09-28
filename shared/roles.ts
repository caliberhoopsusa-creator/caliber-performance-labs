/**
 * Single source of truth for account roles.
 *
 * A role is chosen once, at sign-up, and is then LOCKED for the lifetime of the
 * account. Users cannot change it themselves — only an admin can, via
 * `PATCH /api/admin/users/:id/role`. Both the server (route middleware) and the
 * client (route guard) read their rules from this file so the two can't drift.
 */

import {
  ALL_PRODUCTS_DISABLED,
  isRoleEnabled,
  type FeatureFlags,
} from "./features";

export const USER_ROLES = ["player", "coach", "recruiter", "guardian"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  player: "Player",
  coach: "Coach",
  recruiter: "Recruiter",
  guardian: "Guardian",
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** Where each role lands when it hits "/" or gets bounced off a forbidden route. */
export const ROLE_HOME: Record<UserRole, string> = {
  /* The player lands on their own card. This used to be the community feed,
     which meant the player saw someone else's content before their own number:
     the clearest artifact of the coach first era (pivot Section 4A). */
  player: "/",
  coach: "/",
  recruiter: "/recruiter",
  guardian: "/family",
};

/**
 * Client routes every signed-in role may reach, regardless of role.
 * Account/legal surfaces plus public-by-design discovery pages.
 */
const SHARED_ROUTES: readonly string[] = [
  "/pricing",
  "/privacy",
  "/terms",
  "/community",
  "/feed",
  "/newsfeed",
  "/stories",
  "/social-hub",
  "/discover/highlights",
  "/players/:id/card",
  "/players/:id/caliber",
  "/grade-pending",
  /* Named right after profile completion. Shared because every role that can
     hold a player profile can build a roster (pivot Section 7). */
  "/roster",
  "/reels/:playerId",
  "/debug",
];

/**
 * Client routes each role may reach on top of SHARED_ROUTES.
 *
 * Patterns support `:param` segments and a trailing `/*` wildcard. Anything not
 * listed here (and not shared) is denied for that role — default-deny, so a new
 * page must opt a role in explicitly rather than leaking by omission.
 */
export const ROLE_ROUTE_ACCESS: Record<UserRole, readonly string[]> = {
  player: [
    "/",
    "/analyze",
    "/analytics",
    "/challenges",
    "/leaderboard",
    "/compare",
    "/grading",
    "/team-comparison",
    "/performance",
    "/workouts",
    "/schedule",
    "/players",
    "/players/:id",
    "/highlights",
    "/reel-builder",
    "/canvas",
    "/report-card",
    "/video",
    "/scout",
    "/teams",
    "/leagues",
    "/leagues/:id",
    "/recruiting",
    "/college-recruiting",
    "/camps-showcases",
    "/colleges/:id",
    "/whos-watching",
    "/recruiter-directory",
    "/transfer-portal",
  ],
  coach: [
    "/",
    "/analyze",
    "/analytics",
    "/challenges",
    "/leaderboard",
    "/compare",
    "/grading",
    "/team-comparison",
    "/performance",
    "/workouts",
    "/schedule",
    "/players",
    "/players/:id",
    "/highlights",
    "/report-card",
    "/video",
    "/scout",
    "/teams",
    "/leagues",
    "/leagues/:id",
    "/coach",
    "/coach/*",
    "/colleges/:id",
    "/transfer-portal",
  ],
  recruiter: [
    "/recruiter",
    "/recruiter-directory",
    "/players",
    "/players/:id",
    "/discover/players",
    "/scout",
    "/highlights",
    "/colleges/:id",
    "/transfer-portal",
  ],
  guardian: [
    "/family",
    "/players/:id",
    "/report-card",
    "/schedule",
    "/highlights",
  ],
};

/** Matches a concrete pathname against one pattern from the tables above. */
function matchesPattern(pattern: string, pathname: string): boolean {
  if (pattern === pathname) return true;

  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  const hasWildcard = patternParts[patternParts.length - 1] === "*";
  if (hasWildcard) {
    const prefix = patternParts.slice(0, -1);
    if (pathParts.length < prefix.length) return false;
    return prefix.every((part, i) => part.startsWith(":") || part === pathParts[i]);
  }

  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) => part.startsWith(":") || part === pathParts[i]);
}

/**
 * Whether `role` may reach `path`. Query strings and hashes are ignored, so
 * access is decided by pathname only and `/analytics?tab=grading` follows
 * `/analytics`.
 *
 * `flags` defaults to every product disabled, which is deliberate: a caller
 * that forgets to pass them denies a gated role rather than exposing a product
 * that is meant to be dark. Player is never gated, so the player path is
 * unaffected either way.
 */
export function canAccessRoute(
  role: UserRole,
  path: string,
  flags: FeatureFlags = ALL_PRODUCTS_DISABLED,
): boolean {
  const pathname = path.split("?")[0].split("#")[0] || "/";
  if (SHARED_ROUTES.some((pattern) => matchesPattern(pattern, pathname))) return true;
  // A role whose product is switched off keeps only the shared routes.
  if (!isRoleEnabled(role, flags)) return false;
  return ROLE_ROUTE_ACCESS[role].some((pattern) => matchesPattern(pattern, pathname));
}

/**
 * Where `role` lands, accounting for a switched off product.
 *
 * A coach signed in while ENABLE_COACH_PRODUCT is false cannot be sent to `/`,
 * because that is the coach dashboard. Send them to the shared community feed
 * instead, which every role can reach.
 */
export const DISABLED_PRODUCT_HOME = "/community?tab=feed";

export function roleHome(
  role: UserRole,
  flags: FeatureFlags = ALL_PRODUCTS_DISABLED,
): string {
  return isRoleEnabled(role, flags) ? ROLE_HOME[role] : DISABLED_PRODUCT_HOME;
}

/**
 * Whether `path` belongs to *some* role. Lets the caller tell "this page exists
 * but isn't yours" (bounce to your home) apart from "this page doesn't exist"
 * (render the normal 404) instead of redirecting every typo.
 */
export function isKnownRoute(path: string): boolean {
  const pathname = path.split("?")[0].split("#")[0] || "/";
  if (SHARED_ROUTES.some((pattern) => matchesPattern(pattern, pathname))) return true;
  return USER_ROLES.some((role) =>
    ROLE_ROUTE_ACCESS[role].some((pattern) => matchesPattern(pattern, pathname)),
  );
}
