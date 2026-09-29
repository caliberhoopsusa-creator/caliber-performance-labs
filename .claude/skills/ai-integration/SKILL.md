---
name: ai-integration
description: Gemini AI integration patterns in Caliber — the real retry/timeout setup on video analysis (and its absence elsewhere), prompt-engineering conventions for edge cases, and confidence/quality reporting. Use when adding or editing any Gemini-backed feature.
metadata:
  origin: Caliber-specific — no Parcel equivalent, written from the actual /api/analyze-video implementation, not from replit.md's summary of it
---

# AI Integration (Caliber)

## Client setup
```ts
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
});
```
Model used throughout: `"gemini-2.5-flash"`. This is repeated per-call-site, not centralized
in a shared client module — if you add a new Gemini-backed feature, follow the same
import/init pattern at the top of `routes.ts` rather than trying to factor out a shared
client (that's a legitimate future refactor, but don't do it silently inside a feature task).

## Retry exists — but only on `/api/analyze-video`, and it's inline
That route has real resilience: an `AbortController` with a 60-second timeout wrapping the
call, plus a 3-attempt loop with exponential backoff (`1000 * 2^attempt` ms between
attempts) and a final error response that distinguishes timeout from other failure.

**No other Gemini call site in the codebase has this.** Scouting report generation and
other `generateContent` calls are a direct call inside try/catch, fail straight to a 500.
If you're asked to "add retry to the AI feature," check which feature first — if it's video
analysis, it already has it (read it, don't duplicate). If it's anything else, you're
building new, and the video-analysis block is the right pattern to copy (timeout +
exponential backoff + distinguish timeout-vs-other-error in the response).

## Prompt-engineering conventions worth preserving
The video-analysis prompt (`server/routes.ts`, `/api/analyze-video`) is a good reference for
how this codebase handles AI edge cases, and new AI prompts should follow the same instinct:
- **Explicit edge-case handling written into the prompt itself**: low-quality/shaky video,
  multiple players visible, partial clips, occlusion/camera motion, skill-level calibration
  (a youth hustle score of 80 ≠ an NBA hustle score of 80). Each has its own numbered
  instruction block in the prompt.
- **Confidence and quality are first-class output fields**, not afterthoughts: every response
  must include `confidence` (`high`/`medium`/`low`) and `videoQuality` (`good`/`fair`/`poor`),
  plus a `limitations` array of specific, human-readable caveats — not a generic disclaimer.
- **"Don't fabricate" is stated explicitly**: the prompt tells the model to report 0 for stats
  it can't observe rather than guessing, and to explain why in `limitations`. Any new
  AI-judgment feature (scouting reports, projections, etc.) should carry the same instinct —
  tell the model what to do when it's uncertain, don't just hope it behaves.
- **Strict JSON-only response format**, parsed by regex-extracting `{[\s\S]*\}` from the
  response text and `JSON.parse`-ing it, with a dedicated `parse_error` response if that fails.
  Match this shape for new structured-output AI features rather than inventing a different
  parsing strategy.

## Confidence-based review UX (client side)
`replit.md` describes a confidence-based review/edit flow with inline stat editing and a
"Use Stats in Game Entry" bridge that pre-fills the game form. When extending video analysis
on the client, low/medium confidence results should route the user through an editable
review step before stats are committed — don't auto-save high-uncertainty AI output as if
it were a verified game stat.

## Where results are persisted
`video_analyses` table (`shared/schema.ts`) stores analysis history for load/delete from the
client. If you add a new AI feature whose output should persist and be revisitable, follow
this table's shape (one row per analysis run, linked to the player) rather than overwriting
a single field in place.
