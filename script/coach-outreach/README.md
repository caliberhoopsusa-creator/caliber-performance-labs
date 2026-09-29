# Coach Outreach

Automated, compliant cold-email outreach to basketball coaches introducing
Caliber. Three-touch sequence, dry-run by default, throttled, capped, and
CAN-SPAM-compliant by construction.

## Quick start

```bash
# 1. Build your lead list (public coaching directories, school sites, etc.)
cp script/coach-outreach/leads.example.csv script/coach-outreach/leads.csv
# ...fill in real coaches

# 2. Preview every email (writes .txt files to outbox/, sends nothing)
npx tsx script/coach-outreach/send.ts --touch 1

# 3. Review outbox/, then send for real
npx tsx script/coach-outreach/send.ts --touch 1 --live

# 4. ~4 days later, follow up (only goes to leads who got touch 1)
npx tsx script/coach-outreach/send.ts --touch 2 --live
# ~4 days after that
npx tsx script/coach-outreach/send.ts --touch 3 --live
```

## Required setup (live mode)

| Env var | What it is |
|---|---|
| `SENDGRID_API_KEY` | SendGrid key with Mail Send scope |
| `OUTREACH_FROM_EMAIL` | Verified sender (domain-authenticate it in SendGrid first) |
| `OUTREACH_FROM_NAME` | e.g. `Matthew at Caliber` |
| `OUTREACH_MAILING_ADDRESS` | Your physical mailing address — legally required in every email |
| `OUTREACH_UNSUB_GROUP_ID` | SendGrid unsubscribe group; provides the one-click unsubscribe link and permanent suppression |
| `OUTREACH_SITE_URL` | Public URL the emails link to, e.g. `https://caliber.app`. Preflighted before every live send |

Optional: `OUTREACH_DAILY_CAP` (default 50), `OUTREACH_SEND_DELAY_MS` (default 30000).

## Compliance rules (do not bypass)

1. **Unsubscribe**: every email goes out through a SendGrid unsubscribe
   group (`asm`), which injects a working one-click unsubscribe link and
   permanently suppresses opt-outs. Never send without it.
2. **Physical address**: appended to every email footer. Required by CAN-SPAM.
3. **Truthful subjects**: templates state exactly what the email is. Keep it
   that way when editing `templates.ts`.
4. **Manual opt-outs**: if a coach replies asking to stop, add their email to
   `suppression.txt` the same day (law allows 10 days; do it immediately).
5. **Working link**: every template links to `OUTREACH_SITE_URL`. Live mode
   fetches it first and aborts if it does not resolve or returns an error.
   A cold list is spent the moment recipients click into nothing — never
   bypass this check.
6. **Volume**: daily cap defaults to 50 with a 30s delay between sends. New
   sender domains should warm up slowly (25-50/day for the first two weeks)
   or deliverability will tank.

## How state works

- `sent-log.json` — append-only log of every live send; prevents duplicate
  sends and gates follow-ups (touch 2 only goes to touch-1 recipients).
- `suppression.txt` — local never-email list checked before every send.
- `outbox/` — dry-run previews. Git-ignored; safe to delete.

## Lead sourcing

Fill `leads.csv` from public sources: state high-school athletic association
directories, school athletics pages, AAU program sites, tournament coach
lists. Only use publicly listed *professional* coaching contacts (this is
B2B outreach about a coaching tool, not consumer marketing).
