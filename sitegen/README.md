# sitegen

A done-for-you website business in a box. Finds local businesses without websites, AI-generates a custom mockup for each, emails them a preview, and collects $650 via Stripe when they click "make it live".

**Money flows to your Stripe account.** You're the merchant of record. The customer pays *you*, not Claude or anyone else.

## How it works

```
[Find leads]  →  Google Places search by city + category, skip ones with sites
       ↓
[Generate]   →  Claude builds a custom mockup spec for each business
       ↓
[Preview]    →  Live at /preview/{slug} with a "Make it live for $650" button
       ↓
[Outreach]   →  Email each lead a link to their preview
       ↓
[Pay]        →  Stripe Checkout, $650 → your account
       ↓
[Deliver]    →  Customer gets an intake email; you ship their real site
```

The "deliver" step is intentionally manual — you collect logo/photos/hours and ship the final site. This keeps the legal/quality side honest: a real human builds the production version with the customer's real assets.

## What you need before starting

**Required:**

| Service | Why | Cost to start |
|---|---|---|
| Google Cloud — Places API (New) | Lead discovery | Free tier: ~$200/month credit |
| Anthropic API | Mockup generation | Pay as you go (~$0.05 per mockup at Opus 4.7) |
| Stripe account | Payments | Free; 2.9% + 30¢ per transaction |
| Resend account | Sending email | Free up to 3k/month |
| Vercel account (or any Node host) | Marketing-site deploy | Free tier works |

**Optional — fills in the manual gaps:**

| Service | Why | Cost to start |
|---|---|---|
| Hunter.io | Auto-finds business emails at discovery time | Free 25/month, then $34/mo |
| Twilio | SMS outreach (the realistic channel for SMBs w/o web presence) | $0.0079/SMS in the US |
| Vercel token | Auto-deploys the AI mockup to a real URL after Stripe payment | Free tier covers ~hundreds of deploys |

## Local setup

```sh
cd sitegen
npm install
cp .env.example .env
# Edit .env — at minimum: DATABASE_URL, ADMIN_PASSWORD, ANTHROPIC_API_KEY
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000/admin (Basic auth: any username, the password from `ADMIN_PASSWORD`).

## Running the pipeline

You can drive it from the admin UI or the CLI. Both write to the same database.

### From the admin UI
1. Go to `/admin`
2. Enter a category + area → "Find leads"
3. Click any lead → "Generate mockup"
4. Open the lead → enter the business's email → "Send preview email"

### From the CLI (batched)
```sh
# Find leads in an area (free-form: city, state, ZIP, neighborhood, etc.)
# If HUNTER_API_KEY is set, each lead is auto-enriched with an email.
npm run find-leads -- "plumber" "Cleveland, OH" 2

# Generate mockups for up to 10 NEW leads
npm run generate-mockups -- 10

# Send outreach. Default --channel=auto: email if address known, else SMS.
# Pass --dry-run first to preview.
npm run send-outreach -- 10 --dry-run
npm run send-outreach -- 10
npm run send-outreach -- 10 --channel=sms       # force SMS
npm run send-outreach -- 10 --channel=email     # force email
```

**Channel notes.** Google Places returns business *phone* numbers but rarely emails. For SMBs without websites, SMS via Twilio is usually the only reliable outreach channel. Hunter.io can fill in emails when the business has any kind of web presence (even a directory listing), but expect a low hit rate on this segment.

## Auto-deploy on payment (Vercel)

When `VERCEL_TOKEN` is set, the Stripe webhook automatically publishes the customer's mockup to a fresh Vercel deployment as soon as payment clears. The customer gets the live URL in their intake email, so they see "your site is already up, here's what we still need to finalize it" — much better than "we'll be in touch."

How to set up:
1. Create a Vercel token at https://vercel.com/account/tokens (scope: full account or just the team you want deploys to land in).
2. Add `VERCEL_TOKEN` to your env. Optionally `VERCEL_TEAM_ID` if deploying to a team.
3. That's it — next paid lead gets auto-deployed. Failure is logged to the owner email but doesn't block the payment flow.

The auto-deploy ships a static `index.html` rendered from the same mockup spec. It's *not* the final production site — you still build the real one when the customer sends their photos/logo via the intake email. The auto-deploy is a confidence signal, not a substitute for delivery.

## Stripe webhook setup

Local testing (uses the Stripe CLI):
```sh
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... into STRIPE_WEBHOOK_SECRET in .env, then restart `npm run dev`
```

Production: add a webhook endpoint in the Stripe dashboard pointing at `https://your-domain.com/api/webhooks/stripe`, subscribed to `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Deploying

The simplest path is Vercel:
```sh
# from inside sitegen/
npx vercel
```

You'll need to:
1. Swap `DATABASE_URL` to a Postgres connection string (Vercel Postgres, Neon, or Supabase) — SQLite doesn't work on Vercel.
2. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`, then run `npx prisma migrate dev --name init` against the new DB.
3. Set every env var from `.env.example` in Vercel's project settings.
4. Set the Stripe webhook URL to `https://your-domain.com/api/webhooks/stripe`.

## Moving sitegen into its own repo

This project was scaffolded inside another repo. To extract it cleanly while preserving git history:

```sh
# From the parent repo root:
git subtree split --prefix=sitegen -b sitegen-only

# Create a new GitHub repo, then:
git remote add sitegen-origin git@github.com:YOU/sitegen.git
git push sitegen-origin sitegen-only:main
```

After that, clone the new repo somewhere fresh and work from there. You can delete the `sitegen/` folder from the parent repo.

## Legal & ethical guardrails baked in

- **No charges without consent.** A mockup at `/preview/{slug}` is just a preview — the customer has to actively click "make it live" and pay before anything goes live or is billed.
- **No domain squatting.** The mockup lives on *your* preview URL, not a domain registered in the business's name.
- **CAN-SPAM compliant outreach.** The default email template identifies you, explains why you're reaching out, and gives a clear opt-out (ignore the email). Add a physical address before scaling outreach.
- **No fake billing.** You are *not* invoicing businesses for services they didn't order. You're showing them a free preview and offering to build the real thing if they want it.

## File map

```
sitegen/
├── prisma/schema.prisma        Lead + OutreachLog models
├── src/
│   ├── middleware.ts           HTTP Basic auth for /admin and /api/admin
│   ├── app/
│   │   ├── page.tsx            Public landing
│   │   ├── preview/[slug]/     The mockup the customer sees
│   │   ├── thanks/             Post-checkout success page
│   │   ├── admin/              Password-gated dashboard
│   │   └── api/
│   │       ├── checkout/[slug]/        Creates Stripe session
│   │       ├── webhooks/stripe/        Handles payment success
│   │       └── admin/                  Find leads, gen mockups, send outreach
│   ├── components/
│   │   └── MockupRenderer.tsx  Renders the AI-generated spec
│   └── lib/
│       ├── db.ts               Prisma client + status constants
│       ├── stripe.ts           Stripe SDK + $650 price
│       ├── anthropic.ts        Claude client (claude-opus-4-7)
│       ├── places.ts           Google Places + slug + website filter
│       ├── mockup.ts           Claude prompt + JSON schema validation
│       └── email.ts            Resend wrapper
└── scripts/
    ├── find-leads.ts           Batched lead discovery
    ├── generate-mockups.ts     Batched mockup generation
    └── send-outreach.ts        Batched email outreach (with --dry-run)
```

## Costs per lead (rough)

| Step | Cost | Notes |
|---|---|---|
| Google Places search | ~$0.04 | One call per 20 places |
| Mockup generation (Claude Opus 4.7) | ~$0.05 | Adaptive thinking, ~1k input + 1.5k output tokens |
| Outreach email (Resend) | $0 | Free up to 3k/month |
| Stripe fee on $650 | $18.95 | 2.9% + $0.30 |

So at $650 sale price, gross margin is ~$631 minus your time to ship the real site.
