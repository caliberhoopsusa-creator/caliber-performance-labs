/**
 * Single source of truth for account roles.
 *
 * A role is chosen once, at sign-up, and is then LOCKED for the lifetime of the
 * account. Users cannot change it themselves — only an admin can, via
 * `PATCH /api/admin/users/:id/role`. Both the server (route middleware) and the
 * client (route guard) read their rules from this file so the two can't drift.
 */

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
  player: "/community?tab=feed",
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
 * Whether `role` may reach `path`. Query strings and hashes are ignored — access
 * is decided by pathname only, so `/analytics?tab=grading` follows `/analytics`.
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
  const pathname = path.split("?")[0].split("#")[0] || "/";
  if (SHARED_ROUTES.some((pattern) => matchesPattern(pattern, pathname))) return true;
  return ROLE_ROUTE_ACCESS[role].some((pattern) => matchesPattern(pattern, pathname));
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
