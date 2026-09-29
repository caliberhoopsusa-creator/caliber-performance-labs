/**
 * Player privacy serialization.
 *
 * CLAUDE.md rule 2: privacy flags are opt-in per route, nothing in the DB layer
 * or middleware enforces them. That is still true. This module does not change
 * it; it gives the routes that DO need to enforce a single, tested place to do
 * so, instead of nine hand-rolled ternaries per handler.
 *
 * The four flags fixed here (showEmail, showPhone, showStatsToCoaches,
 * showContactToCoaches) were written by PATCH /api/players/:playerId/visibility
 * and read by nothing, anywhere. See docs/PIVOT_AUDIT.md section 7a.
 *
 * Rules, in order:
 *   1. The owner and the app admin see the untouched row.
 *   2. Everyone else loses the compliance columns and the settings themselves.
 *      A visibility setting is configuration, not profile content.
 *   3. School and GPA follow showSchool / showGpa (already enforced at 27 call
 *      sites; repeated here so one funnel is sufficient).
 *   4. A coach viewer follows showStatsToCoaches and showContactToCoaches.
 *   5. Any other non owner follows showEmail and showPhone.
 */
import type { UserRole } from "@shared/roles";

/** Who is asking. Role is null for a logged out visitor. */
export interface ViewerIdentity {
  userId: string | null;
  role: UserRole | null;
  isAdmin: boolean;
}

export const ANONYMOUS_VIEWER: ViewerIdentity = {
  userId: null,
  role: null,
  isAdmin: false,
};

/**
 * Columns that must never reach a non owner regardless of any flag.
 *
 * dateOfBirth and minorDataPublic are compliance data on a platform whose users
 * are minors. The visibility settings are stripped because leaking them tells a
 * scraper exactly which players have their guard down.
 */
const ALWAYS_PRIVATE = [
  "dateOfBirth",
  "minorDataPublic",
  "profileVisibility",
  "showEmail",
  "showPhone",
  "showSchool",
  "showGpa",
  "showStatsToCoaches",
  "showContactToCoaches",
  "showDetailedStatsToGuardians",
  "showGradesToGuardians",
] as const;

/** Keys carrying the player's own contact details. */
const CONTACT_KEYS = ["email", "phone"] as const;

/** Keys carrying the player's coach contact block. */
const COACH_CONTACT_KEYS = ["coachName", "coachPhone"] as const;

/** Keys carrying game by game or aggregate performance data. */
const STAT_KEYS = ["games", "advancedMetrics", "stats", "seasonAverages"] as const;

/** A player row, plus whatever a given route has joined onto it. */
type PlayerLike = Record<string, any>;

function isOwner(player: PlayerLike, viewer: ViewerIdentity): boolean {
  return Boolean(viewer.userId && player.userId && player.userId === viewer.userId);
}

/** Treats an undefined flag as its column default rather than as false. */
function flagOn(value: unknown, defaultValue: boolean): boolean {
  return value === undefined || value === null ? defaultValue : value !== false;
}

/**
 * Whether this viewer may see the player at all.
 *
 * `hidden` means hidden: the route should 404 rather than serve a redacted
 * husk, so a scraper cannot confirm the player exists. `link_only` stays
 * readable, since the whole point is that a shared link resolves.
 */
export function canViewPlayer(player: PlayerLike, viewer: ViewerIdentity): boolean {
  if (!player) return false;
  if (viewer.isAdmin || isOwner(player, viewer)) return true;
  return player.profileVisibility !== "hidden";
}

/**
 * Returns a redacted copy. Never mutates the input, so a caller that reuses the
 * row for an ownership check afterwards still sees the real values.
 */
export function applyPlayerPrivacy<T extends PlayerLike>(
  player: T,
  viewer: ViewerIdentity = ANONYMOUS_VIEWER,
): PlayerLike {
  if (!player) return player;
  if (viewer.isAdmin || isOwner(player, viewer)) return player;

  const safe: PlayerLike = { ...player };

  for (const key of ALWAYS_PRIVATE) {
    delete safe[key];
  }

  if (!flagOn(player.showSchool, true)) safe.school = null;
  if (!flagOn(player.showGpa, true)) safe.gpa = null;

  if (viewer.role === "coach") {
    // A coach is a known, authenticated adult, so the player gets a separate
    // pair of switches for them rather than the public ones.
    //
    // Both default to FALSE, matching the column defaults and the privacy
    // policy's "not without your explicit action". A null or missing flag has
    // to read as "do not share", or the opt in promise fails open.
    if (!flagOn(player.showContactToCoaches, false)) {
      for (const key of [...CONTACT_KEYS, ...COACH_CONTACT_KEYS]) delete safe[key];
    }
    if (!flagOn(player.showStatsToCoaches, false)) {
      for (const key of STAT_KEYS) delete safe[key];
    }
    return safe;
  }

  // Public, recruiter and guardian viewers.
  // showEmail and showPhone both default to false, so silence is the default.
  if (!flagOn(player.showEmail, false)) {
    delete safe.email;
  }
  if (!flagOn(player.showPhone, false)) {
    delete safe.phone;
    delete safe.coachPhone;
  }
  // A coach's name is a third party's PII and has no public switch of its own.
  delete safe.coachName;

  return safe;
}

/** Convenience for list endpoints. Drops rows this viewer may not see at all. */
export function applyPlayerPrivacyToList<T extends PlayerLike>(
  list: T[],
  viewer: ViewerIdentity = ANONYMOUS_VIEWER,
): PlayerLike[] {
  if (!Array.isArray(list)) return list;
  return list
    .filter((player) => canViewPlayer(player, viewer))
    .map((player) => applyPlayerPrivacy(player, viewer));
}
