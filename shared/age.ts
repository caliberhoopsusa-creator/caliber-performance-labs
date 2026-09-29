/**
 * Age gate, shared by the client form and the server route.
 *
 * Before this existed the gate was client side only: Login.tsx disabled the
 * submit button for an under 13 date of birth, and POST /api/register never
 * read the field at all, so blanking it or calling the API directly walked
 * straight past. See docs/PIVOT_AUDIT.md section 7c.
 *
 * Both sides import from here so the rule cannot drift between them.
 */

/** COPPA line. Under this age, registration needs verifiable guardian consent. */
export const MINIMUM_AGE_YEARS = 13;

/** Oldest plausible date of birth, used to reject typos like year 0203. */
const MAX_AGE_YEARS = 120;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a date string as a LOCAL calendar date.
 *
 * `new Date("2013-09-23")` is specified to parse as UTC midnight, but every
 * comparison below uses the local getters. West of UTC those disagree by a day,
 * which let a 12 year old register on the day before their thirteenth birthday.
 * A date of birth is a calendar date, not an instant, so build it locally.
 */
function parseDateString(value: string): Date | null {
  const match = DATE_ONLY.exec(value.trim());
  if (!match) {
    const loose = new Date(value);
    return Number.isNaN(loose.getTime()) ? null : loose;
  }

  const [, y, m, d] = match;
  const year = Number(y);
  const monthIndex = Number(m) - 1;
  const day = Number(d);
  const built = new Date(year, monthIndex, day);

  // JS rolls impossible dates forward (Feb 30 becomes Mar 2). Reject instead.
  if (
    built.getFullYear() !== year ||
    built.getMonth() !== monthIndex ||
    built.getDate() !== day
  ) {
    return null;
  }

  return built;
}

/**
 * Parses a date of birth from form or JSON input.
 *
 * Accepts "YYYY-MM-DD" (what <input type="date"> submits) and anything Date
 * can parse. Returns null for absent, malformed, future, or absurd values, so
 * a caller can treat null as "reject" without a second validation pass.
 */
export function parseDateOfBirth(value: unknown, now: Date = new Date()): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;

  const parsed = value instanceof Date ? value : parseDateString(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;

  if (parsed.getTime() > now.getTime()) return null;

  const oldest = new Date(now.getTime());
  oldest.setFullYear(oldest.getFullYear() - MAX_AGE_YEARS);
  if (parsed.getTime() < oldest.getTime()) return null;

  return parsed;
}

/** Whole years elapsed, counting a birthday later today as not yet reached. */
export function ageInYears(dateOfBirth: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear();

  const monthDelta = now.getMonth() - dateOfBirth.getMonth();
  const dayDelta = now.getDate() - dateOfBirth.getDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age;
}

/** True when this date of birth falls under the COPPA line. */
export function isUnderMinimumAge(dateOfBirth: Date, now: Date = new Date()): boolean {
  return ageInYears(dateOfBirth, now) < MINIMUM_AGE_YEARS;
}

/**
 * Formats a Date as the "YYYY-MM-DD" a Postgres `date` column expects.
 *
 * Uses the local calendar date for the same reason parseDateString does:
 * toISOString would shift the day for anyone whose offset crosses midnight.
 */
export function toDateColumn(value: Date): string {
  const year = String(value.getFullYear()).padStart(4, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
