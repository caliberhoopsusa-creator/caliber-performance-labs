/**
 * Reference data seeding at boot: colleges, their stats, and recruiting
 * contacts. Every step is idempotent and the data is already in the live
 * database, so this runs AFTER the server is listening, never before it.
 *
 * It used to be awaited before `listen()`. Against remote Neon that is hundreds
 * of sequential writes, which kept the port closed for minutes: the dev server
 * looked hung, and an autoscale cold start would fail its health check.
 */
import { seedColleges } from "./colleges";
import { updateCollegeStats } from "./updateCollegeStats";
import { seedRecruitingContacts, seedAdditionalLowerDivisionColleges } from "./recruitingContacts";

type SeedStep = () => Promise<void>;

const DEFAULT_STEPS: readonly SeedStep[] = [
  seedColleges,
  updateCollegeStats,
  seedAdditionalLowerDivisionColleges,
  seedRecruitingContacts,
];

/** Seeds run unless SKIP_STARTUP_SEEDS is exactly "true". */
export function shouldRunStartupSeeds(env: Record<string, string | undefined>): boolean {
  return env.SKIP_STARTUP_SEEDS !== "true";
}

/** Runs each step in order. Never rejects: a seed failure must not take down a live server. */
export async function runStartupSeeds(steps: readonly SeedStep[] = DEFAULT_STEPS): Promise<void> {
  try {
    for (const step of steps) {
      await step();
    }
  } catch (error) {
    console.error("Failed to seed colleges:", error);
  }
}
