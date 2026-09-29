# Loop Runbook — SIGNAL Phase 1 (sequential, safe mode)

Started 2026-07-15 by /loop-start. Orchestrated from the operator's background
session; one worker agent per surface, one surface at a time.

## Pattern
`sequential` — the Phase 1 queue from docs/DESIGN-LANGUAGE.md §6, one
PR-sized iteration per surface:

1. **1a — Landing** (ModernLandingPage): obsidian-first rebalance, drop the
   ~1.1MB ShaderGradient chunk for CSS atmosphere + grain, OvrPlate +
   PlayerCard demo moment (labeled DEMO), console-layer polish, coach section
   with the honest demo-first offer. ← CURRENT
2. **1b — PublicPlayerProfile**: the career screen (PlayerCard hero, OvrPlate,
   AttributeBars, verified provenance). The coach-conversion surface.
3. **1c — Dashboard**: career-mode home (hero StatNumber, TelemetryStrip,
   first-game CTA).
4. **1d — AnalyzeGame**: the grade-reveal unlock moment (count-up, tier flash,
   AchievementToast).

## Gates (every iteration, before commit)
- `npx tsc --noEmit` → exit 0
- `npm run build` → success
- **NEVER `npm test`** — vitest injects the real `.env`; the suite writes to
  the LIVE production Neon DB. (Substitutes for the standard tests-pass gate.)
- Tokens only (no raw hex / arbitrary font values); no fabricated data
  presented as real (labeled DEMO is fine); reduced-motion respected.
- Commits: explicit `git add <paths>` only (parallel work exists in this
  checkout). Local commits on `main`; **never push** (operator pushes after
  rotating the leaked remote token).

## Stop conditions (explicit)
- Phase 1 queue complete (all four surfaces committed + gates green), or
- 3 consecutive failed/blocked iterations, or
- the operator says stop.

## Session-limit handling
Worker agents die on account session limits (hit 3× on 2026-07-14; next reset
02:50 America/Denver). On death: wait for reset, then resume the SAME agent
(context is kept) rather than relaunching. Orchestrator self-schedules
wakeups rather than polling.

## Monitoring
- Task list in the operator session (tasks #7+ map to queue items).
- `git log --oneline` on ~/caliber-performance-labs main — one feat(design)
  commit per surface.
- Dev server runs on :3002 with HMR; workers must not restart it.
