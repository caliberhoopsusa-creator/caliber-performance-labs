/**
 * College data scheduler — makes the (already-built) ESPN / CollegeFootballData
 * ingestion run automatically so program records, rosters, coaches, rankings and
 * standings stay live instead of requiring a manual admin trigger.
 *
 * Opt-in by design. It does nothing unless `ENABLE_COLLEGE_SYNC=true`, so local
 * and restricted environments (where the outbound hosts may be blocked) never
 * hammer ESPN or crash on a failed fetch. The underlying sync functions already
 * fail soft per-team, so a blocked network just logs and moves on.
 *
 * To go live in production:
 *   1. ENABLE_COLLEGE_SYNC=true
 *   2. Allowlist `site.api.espn.com` (and `api.collegefootballdata.com` + set
 *      CFB_API_KEY if you want football records too).
 */

const STATS_INTERVAL_MS = 12 * 60 * 60 * 1000; // refresh records/rankings twice a day
const ROSTER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // rosters + coaches weekly
const BOOT_DELAY_MS = 60 * 1000; // let the server settle before the first pull

let started = false;

async function runStatsSync(): Promise<void> {
  try {
    const { autoMapEspnTeamIds, syncAllCollegeStatsFromESPN } = await import("./sportsDataApi");
    // Ensure newly-seeded programs get an ESPN id before we ask ESPN for stats.
    await autoMapEspnTeamIds();
    const result = await syncAllCollegeStatsFromESPN();
    console.log(
      `[college-sync] stats refresh: ${result.updated} updated, ${result.errors} errors, ${result.skipped} skipped`,
    );
  } catch (error) {
    console.error("[college-sync] stats refresh failed:", error);
  }
}

async function runRosterSync(): Promise<void> {
  try {
    const { syncRosterData } = await import("./sportsDataApi");
    const result = await syncRosterData();
    console.log(`[college-sync] roster refresh: ${result.updated} updated, ${result.errors} errors`);
  } catch (error) {
    console.error("[college-sync] roster refresh failed:", error);
  }
}

/**
 * Starts the recurring college-data refresh. Safe to call once on boot;
 * a no-op unless ENABLE_COLLEGE_SYNC=true.
 */
export function startCollegeDataScheduler(): void {
  if (started) return;

  if (process.env.ENABLE_COLLEGE_SYNC !== "true") {
    console.log(
      "[college-sync] disabled (set ENABLE_COLLEGE_SYNC=true and allowlist site.api.espn.com to enable live program data).",
    );
    return;
  }

  started = true;
  console.log("[college-sync] enabled — scheduling live program data refresh.");

  // Initial pull shortly after boot, then on a recurring cadence.
  setTimeout(() => {
    void runStatsSync();
    void runRosterSync();
  }, BOOT_DELAY_MS);

  setInterval(() => void runStatsSync(), STATS_INTERVAL_MS);
  setInterval(() => void runRosterSync(), ROSTER_INTERVAL_MS);
}
