/**
 * Coach outreach sender — CAN-SPAM-compliant by construction.
 *
 * Usage:
 *   npx tsx script/coach-outreach/send.ts --touch 1                 # dry run (default)
 *   npx tsx script/coach-outreach/send.ts --touch 1 --live          # real sends
 *   npx tsx script/coach-outreach/send.ts --touch 2 --limit 25
 *
 * Dry run writes previews to script/coach-outreach/outbox/ so every email
 * can be reviewed before anything is sent. Live mode requires:
 *   SENDGRID_API_KEY          SendGrid API key (mail send scope)
 *   OUTREACH_FROM_EMAIL       verified sender, e.g. matthew@caliber.app
 *   OUTREACH_FROM_NAME        e.g. "Matthew at Caliber"
 *   OUTREACH_MAILING_ADDRESS  physical mailing address (CAN-SPAM requires it)
 *   OUTREACH_UNSUB_GROUP_ID   SendGrid unsubscribe group id (handles the
 *                             one-click unsubscribe link + suppression)
 *   OUTREACH_SITE_URL         public URL the emails link to, e.g.
 *                             https://caliber.app — preflighted before every
 *                             live send so a dead link can never go out
 *
 * Guardrails:
 *   - suppression.txt is checked before every send (one email per line)
 *   - sent-log.json prevents double-sending the same touch to a lead
 *   - DAILY_CAP limits volume; SEND_DELAY_MS throttles between sends
 *   - the link target in OUTREACH_SITE_URL must resolve and return OK, or
 *     live mode aborts before the first send
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { templates, renderTemplate } from "./templates";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const LEADS_CSV = path.join(DIR, "leads.csv");
const SUPPRESSION_FILE = path.join(DIR, "suppression.txt");
const SENT_LOG = path.join(DIR, "sent-log.json");
const OUTBOX = path.join(DIR, "outbox");

const DAILY_CAP = Number(process.env.OUTREACH_DAILY_CAP ?? 50);
const SEND_DELAY_MS = Number(process.env.OUTREACH_SEND_DELAY_MS ?? 30_000);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// leads.csv carries postal codes, but "MT basketball programs" reads like a
// mail merge. Prose uses {{stateName}}; add states here as the list expands.
const STATE_NAMES: Record<string, string> = {
  MT: "Montana",
  WY: "Wyoming",
  ID: "Idaho",
  ND: "North Dakota",
  SD: "South Dakota",
};

interface Lead {
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  city: string;
  state: string;
  level: string;
}

interface SentRecord {
  email: string;
  touch: number;
  sentAt: string;
}

function parseArgs(): { touch: number; live: boolean; limit: number } {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const touch = Number(get("--touch") ?? 1);
  if (![1, 2, 3].includes(touch)) {
    throw new Error("--touch must be 1, 2, or 3");
  }
  return {
    touch,
    live: args.includes("--live"),
    limit: Math.min(Number(get("--limit") ?? DAILY_CAP), DAILY_CAP),
  };
}

function parseCsv(text: string): Lead[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",").map((h) => h.trim());
  const required = ["firstName", "lastName", "email", "school", "city", "state", "level"];
  for (const col of required) {
    if (!header.includes(col)) throw new Error(`leads.csv missing column: ${col}`);
  }
  return lines.slice(1).filter(Boolean).map((line, n) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    const lead = row as unknown as Lead;
    if (!EMAIL_RE.test(lead.email)) {
      throw new Error(`leads.csv row ${n + 2}: invalid email "${lead.email}"`);
    }
    return { ...lead, email: lead.email.toLowerCase() };
  });
}

function loadSuppression(): Set<string> {
  if (!existsSync(SUPPRESSION_FILE)) return new Set();
  return new Set(
    readFileSync(SUPPRESSION_FILE, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith("#")),
  );
}

function loadSentLog(): SentRecord[] {
  if (!existsSync(SENT_LOG)) return [];
  return JSON.parse(readFileSync(SENT_LOG, "utf8"));
}

function complianceFooter(mailingAddress: string): string {
  return [
    "",
    "---",
    "You're receiving this because your coaching contact info is publicly",
    "listed. If you'd rather not hear from us, use the unsubscribe link",
    "below and we'll never email you again.",
    mailingAddress,
  ].join("\n");
}

/**
 * Every template links to OUTREACH_SITE_URL. A cold-outreach list is spent the
 * moment recipients click into nothing, so verify the target is actually up
 * before a live run rather than discovering it from the bounce-back.
 */
async function preflightSiteUrl(siteUrl: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(siteUrl);
  } catch {
    return `not a valid URL: "${siteUrl}"`;
  }
  if (parsed.protocol !== "https:") {
    return `must be https, got "${parsed.protocol}//"`;
  }
  try {
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return `${parsed.origin} returned HTTP ${res.status}`;
    return null;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return `${parsed.origin} is unreachable (${reason})`;
  }
}

async function sendViaSendGrid(opts: {
  to: string;
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
  unsubGroupId: number;
}): Promise<void> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: { email: opts.fromEmail, name: opts.fromName },
      subject: opts.subject,
      content: [{ type: "text/plain", value: opts.body }],
      asm: { group_id: opts.unsubGroupId },
    }),
  });
  if (!res.ok) {
    throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const { touch, live, limit } = parseArgs();
  const template = templates.find((t) => t.touch === touch);
  if (!template) throw new Error(`No template for touch ${touch}`);

  if (!existsSync(LEADS_CSV)) {
    console.error(`No leads.csv found. Copy leads.example.csv to leads.csv and fill it in.`);
    process.exit(1);
  }

  const senderName = process.env.OUTREACH_FROM_NAME ?? "The Caliber Team";
  const mailingAddress = process.env.OUTREACH_MAILING_ADDRESS ?? "";
  const siteUrl = process.env.OUTREACH_SITE_URL ?? "";

  if (live) {
    const missing = ["SENDGRID_API_KEY", "OUTREACH_FROM_EMAIL", "OUTREACH_FROM_NAME", "OUTREACH_MAILING_ADDRESS", "OUTREACH_UNSUB_GROUP_ID", "OUTREACH_SITE_URL"]
      .filter((v) => !process.env[v]);
    if (missing.length > 0) {
      console.error(`Live mode requires env vars: ${missing.join(", ")}`);
      process.exit(1);
    }
  }

  // Preflight the link target: blocking in live mode, advisory in a dry run.
  if (siteUrl) {
    const problem = await preflightSiteUrl(siteUrl);
    if (problem && live) {
      console.error(`Preflight failed: ${problem}`);
      console.error("Refusing to send — every email links here, and a dead link burns the list.");
      process.exit(1);
    }
    if (problem) {
      console.warn(`WARNING preflight: ${problem}`);
      console.warn("A live run would abort. Fix before sending.");
    } else {
      console.log(`Preflight OK: ${siteUrl} is reachable`);
    }
  } else if (!live) {
    console.warn("WARNING: OUTREACH_SITE_URL is unset — previews will show a placeholder.");
  }

  const suppression = loadSuppression();
  const sentLog = loadSentLog();
  const alreadySent = new Set(
    sentLog.filter((r) => r.touch === touch).map((r) => r.email),
  );
  const gotEarlierTouch = new Set(
    sentLog.filter((r) => r.touch === touch - 1).map((r) => r.email),
  );

  const seen = new Set<string>();
  const queue = parseCsv(readFileSync(LEADS_CSV, "utf8"))
    .filter((lead) => {
      if (seen.has(lead.email)) return false;
      seen.add(lead.email);
      if (suppression.has(lead.email)) return false;
      if (alreadySent.has(lead.email)) return false;
      // follow-ups only go to leads who received the previous touch
      if (touch > 1 && !gotEarlierTouch.has(lead.email)) return false;
      return true;
    })
    .slice(0, limit);

  console.log(`Touch ${touch} / ${live ? "LIVE" : "dry run"} / ${queue.length} recipients (cap ${limit})`);
  if (!live) mkdirSync(OUTBOX, { recursive: true });

  const newRecords: SentRecord[] = [];
  for (const lead of queue) {
    const tokens = {
      ...lead,
      senderName,
      siteUrl: siteUrl || "[SITE URL — set OUTREACH_SITE_URL]",
      stateName: STATE_NAMES[lead.state.toUpperCase()] ?? lead.state,
    };
    const subject = renderTemplate(template.subject, tokens);
    const body = renderTemplate(template.body, tokens) + complianceFooter(mailingAddress || "[MAILING ADDRESS — set OUTREACH_MAILING_ADDRESS]");

    if (live) {
      await sendViaSendGrid({
        to: lead.email,
        subject,
        body,
        fromEmail: process.env.OUTREACH_FROM_EMAIL!,
        fromName: senderName,
        unsubGroupId: Number(process.env.OUTREACH_UNSUB_GROUP_ID),
      });
      newRecords.push({ email: lead.email, touch, sentAt: new Date().toISOString() });
      // persist after every send so a crash never causes double-sends
      writeFileSync(SENT_LOG, JSON.stringify([...sentLog, ...newRecords], null, 2));
      console.log(`  sent -> ${lead.email}`);
      await sleep(SEND_DELAY_MS);
    } else {
      const file = path.join(OUTBOX, `touch${touch}-${lead.email.replace(/[@.]/g, "_")}.txt`);
      writeFileSync(file, `To: ${lead.email}\nSubject: ${subject}\n\n${body}\n`);
      console.log(`  preview -> ${path.relative(process.cwd(), file)}`);
    }
  }

  console.log(live ? `Done. ${newRecords.length} emails sent.` : `Done. Review previews in outbox/ then re-run with --live.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
