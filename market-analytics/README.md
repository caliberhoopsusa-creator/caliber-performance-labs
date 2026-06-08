# Quanta — AI Market Analytics

A standalone, sellable web app that turns 12 quant-research prompts into a live
AI analytics desk. Pick a tool, fill in the inputs, and a Claude-powered report
streams in live: strategy generation, backtesting, risk/reward, Monte Carlo,
portfolio construction, alpha detection, and more.

This is a self-contained app (its own `package.json` and build) and can be
split into its own repository at any time. It is **not** part of the Caliber app
it currently lives next to.

## How it works

```
Browser (React SPA)  ──POST /api/analyze──▶  Express server  ──▶  Claude (Opus 4.8)
        ▲                                          │
        └──────────  streamed report (SSE)  ───────┘
```

- The **frontend** (`src/`, `index.html`) renders the 12 tools and their input
  forms and streams the result in live.
- The **backend** (`server/`) holds the Anthropic API key, builds the prompt
  for the chosen tool, and streams Claude's response back as Server-Sent Events.
- The **prompt engineering** lives in `server/prompts.ts` and is never shipped
  to the browser — it's the product's core IP.
- `shared/catalog.ts` defines the tools and their form fields (used by both
  sides) and contains no prompt text.

## Quick start

```bash
cd market-analytics
npm install
cp .env.example .env        # then paste your ANTHROPIC_API_KEY into .env
npm run dev                  # web on :5173, api on :5174
```

Open http://localhost:5173.

> You only pay Anthropic when you actually run an analysis. No key configured?
> The app loads fine and tells you to add one — nothing is billed.

## Production build

```bash
npm run build               # bundles the SPA into dist/
npm start                   # serves dist/ + the API on PORT (default 5174)
```

Set `ANTHROPIC_API_KEY` (and optionally `PORT`, `RATE_LIMIT_PER_MINUTE`) in the
environment.

## Cost

Uses `claude-opus-4-8` — $5 / 1M input tokens, $25 / 1M output tokens. A typical
multi-section report is roughly $0.05–$0.20. Price your product above that and
keep the margin.

## Selling it — what's already here vs. next steps

Built in:
- 12 working analysis tools with a polished dark UI
- Live streaming responses
- Server-side key handling, per-IP rate limiting, input validation
- "Not financial advice" framing baked into every response

Natural next steps to turn it into a paid product:
- **Auth + billing** (Stripe) and per-plan usage limits
- **Usage metering / quotas** per user
- A cheaper tier on Claude Haiku for free trials
- Saved reports / history (a database)

## Disclaimer

This product generates **educational analysis only**. It is not financial
advice, it does not execute trades, and it has no live market data. All output
is illustrative and markets carry risk of loss.
