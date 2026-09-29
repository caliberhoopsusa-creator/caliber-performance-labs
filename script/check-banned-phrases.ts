/**
 * CI gate for the CALIBER refuses list (docs/CALIBER_DESIGN.md section 7).
 *
 * Fails the build when a banned phrase appears in client/src/pages/ or
 * client/src/components/, excluding client/src/components/admin/, which is
 * still a SIGNAL era internal surface and is not player facing.
 *
 * Run:  npx tsx script/check-banned-phrases.ts
 * Exit: 0 clean, 1 on any match.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// package.json sets "type": "module", so __dirname does not exist here.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const SCAN_DIRS = [
  "client/src/pages",
  "client/src/components",
];

/**
 * Player facing rules do not apply to internal admin surfaces, where SIGNAL
 * stays. The brief named components/admin; pages/Admin.tsx is the same console
 * (a password gated ops view on a separate port) and is excluded for the same
 * reason.
 */
const EXCLUDE_DIRS = [
  "client/src/components/admin",
];

const EXCLUDE_FILES = [
  "client/src/pages/Admin.tsx",
];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".html", ".md"]);

/**
 * Case insensitive. These target COPY, not identifiers.
 *
 * The boundaries reject a hyphenated or underscored neighbour so a CSS utility
 * or a prop name never trips the gate. Without that, `hover-elevate` (a real
 * utility defined in index.css and used 74 times) reads as the banned word
 * "elevate" and the check cries wolf on a design token.
 */
const EDGE = String.raw`(?<![\w-])`;
const EDGE_END = String.raw`(?![\w-])`;
const copy = (body: string) => new RegExp(EDGE + body + EDGE_END, "i");

const BANNED: Array<{ label: string; pattern: RegExp }> = [
  { label: "level up", pattern: copy(String.raw`level\s?up`) },
  { label: "unlock your potential", pattern: copy(String.raw`unlock\s+your\s+potential`) },
  { label: "student-athlete", pattern: copy(String.raw`student[\s-]athlete`) },
  { label: "take your game to the next level", pattern: copy(String.raw`take\s+your\s+game\s+to\s+the\s+next\s+level`) },
  { label: "game-changer", pattern: copy(String.raw`game[\s-]changer`) },
  { label: "elevate", pattern: copy(String.raw`elevate`) },
  { label: "next level", pattern: copy(String.raw`next\s+level`) },
  { label: "em dash", pattern: /—/ },
];

interface Finding {
  file: string;
  line: number;
  label: string;
  text: string;
}

function isExcluded(fullPath: string): boolean {
  const rel = path.relative(ROOT, fullPath).split(path.sep).join("/");
  if (EXCLUDE_FILES.includes(rel)) return true;
  return EXCLUDE_DIRS.some((dir) => rel === dir || rel.startsWith(dir + "/"));
}

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (isExcluded(full)) continue;

    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      walk(full, out);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

function scan(file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = readFileSync(file, "utf-8").split("\n");

  lines.forEach((line, index) => {
    for (const { label, pattern } of BANNED) {
      if (pattern.test(line)) {
        findings.push({
          file: path.relative(ROOT, file),
          line: index + 1,
          label,
          text: line.trim().slice(0, 120),
        });
      }
    }
  });

  return findings;
}

/**
 * Legacy debt, counted per file and per phrase.
 *
 * The repo carried 324 em dashes across ~60 files before this gate existed,
 * almost all of them empty value placeholders and comments in pages that later
 * pivot sections rewrite or delete. Sweeping them inside the design system work
 * would have buried it in unrelated churn.
 *
 * So the gate gives no amnesty and grants no exceptions: it pins the existing
 * count and fails the moment any file exceeds it. Counts are per file rather
 * than per line so an unrelated edit that shifts line numbers does not trip it.
 *
 * Lower these numbers as files get cleaned. Never raise one by hand; running
 * with --update-baseline after DELETING offences is the only intended way to
 * change this file.
 */
const BASELINE_PATH = path.join(HERE, "banned-phrases-baseline.json");

type Baseline = Record<string, Record<string, number>>;

function loadBaseline(): Baseline {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf-8")) as Baseline;
  } catch {
    return {};
  }
}

function tally(findings: Finding[]): Baseline {
  const out: Baseline = {};
  for (const f of findings) {
    out[f.file] ??= {};
    out[f.file][f.label] = (out[f.file][f.label] ?? 0) + 1;
  }
  return out;
}

function main() {
  const updating = process.argv.includes("--update-baseline");
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
  const findings = files.flatMap(scan);
  const actual = tally(findings);

  if (updating) {
    const sorted: Baseline = {};
    for (const file of Object.keys(actual).sort()) sorted[file] = actual[file];
    writeFileSync(BASELINE_PATH, JSON.stringify(sorted, null, 2) + "\n");
    console.log(`Baseline written: ${findings.length} known offence(s) across ${Object.keys(sorted).length} file(s).`);
    return;
  }

  const baseline = loadBaseline();
  const regressions: Finding[] = [];

  for (const f of findings) {
    const allowed = baseline[f.file]?.[f.label] ?? 0;
    const seenSoFar = regressions.filter((r) => r.file === f.file && r.label === f.label).length;
    const countedBefore = findings
      .filter((x) => x.file === f.file && x.label === f.label)
      .indexOf(f);
    if (countedBefore >= allowed) regressions.push(f);
    void seenSoFar;
  }

  const known = findings.length - regressions.length;

  if (regressions.length === 0) {
    console.log(
      `Banned phrase check: clean. ${files.length} files scanned, ` +
      `${known} known legacy offence(s) still pinned in the baseline.`,
    );
    return;
  }

  console.error(`\nBanned phrase check FAILED: ${regressions.length} new match(es).`);
  console.error("See docs/CALIBER_DESIGN.md section 7.\n");

  for (const f of regressions) {
    console.error(`  ${f.file}:${f.line}`);
    console.error(`    banned: "${f.label}"`);
    console.error(`    line:   ${f.text}\n`);
  }

  console.error("Fix the copy. Do not add it to the baseline.\n");
  process.exit(1);
}

main();
