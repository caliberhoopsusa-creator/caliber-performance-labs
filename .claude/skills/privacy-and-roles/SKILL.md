---
name: privacy-and-roles
description: Caliber's four-role system (Player/Coach/Recruiter/Guardian) and player privacy flags — what's actually enforced on the backend vs. what's only saved in settings. Use before adding or editing any endpoint that returns player data to a role other than the player themselves.
metadata:
  origin: Caliber-specific — no Parcel equivalent, found by reading the actual enforcement code rather than trusting replit.md's description
---

# Privacy & Roles (Caliber)

## The four roles
`users.role` (`shared/models/auth.ts`) is one of `'player' | 'coach' | 'recruiter' | 'guardian'`,
or `null` if not yet selected. A `player` row links to a `user` via `players.userId`. Coaches,
recruiters, and guardians view *other* players' data through dedicated routes/dashboards —
they don't have their own `players` row.

## The 9 visibility flags on `players` — what's actually enforced
| Flag | Read by which audience | Actually enforced in routes.ts? |
|---|---|---|
| `showSchool` | Recruiter search / directory | **Yes** — checked before returning `school` |
| `showGpa` | Recruiter search / directory | **Yes** — checked before returning `gpa` |
| `showDetailedStatsToGuardians` | Guardian dashboard | **Yes** — `/api/guardian/players/:id/dashboard` |
| `showGradesToGuardians` | Guardian dashboard | **Yes** — same route |
| `showEmail` | Recruiter / public profile | Settings-only — verify before relying on it |
| `showPhone` | Recruiter / public profile | Settings-only — verify before relying on it |
| `openToRecruiting` | Recruiter search ranking | Used as a search-boost signal, not a gate |
| `showStatsToCoaches` | Coach views of a player | **No** — saved in settings, never read anywhere |
| `showContactToCoaches` | Coach views of a player | **No** — saved in settings, never read anywhere |

Do not assume the table is symmetric. `showStatsToCoaches` and `showContactToCoaches` exist
in the schema and the player's privacy settings UI, and a player can toggle them and believe
they did something — but no coach-facing route currently checks either flag before returning
player stats or contact info. **If you're building or editing anything a Coach role can see,
this is currently a real gap, not a my-mistake-to-assume-away.** Either:
- Tell the user this gap exists before shipping a new coach-facing feature that touches
  player data, so they can decide whether to fix it now or knowingly defer it, or
- If asked to fix it, the pattern to follow is the guardian dashboard route — check the flag,
  conditionally null out or omit the field, same shape as `showSchool`/`showGpa` checks.

Re-verify this table by grepping before trusting it long-term — if someone wires up coach
enforcement after this skill is written, this table needs an update too.

## COPPA / minor-data fields
`players.dateOfBirth`, `players.minorDataPublic`, `players.verifiedAthlete`, and
`players.verificationMethod` exist for age-related compliance (the comment in schema.ts says
"For COPPA age verification" on `dateOfBirth`). If you're adding any feature that surfaces a
player's data publicly or to a new audience, check whether `minorDataPublic` should gate it
— especially anything in a public-facing route (recruiter directory, discover feed, public
profile) rather than an authenticated, role-gated one.

## When adding a new field a non-owning role might see
Ask: does this need its own visibility flag, or does an existing one already cover it
semantically (e.g. a new academic field probably belongs under `showGpa`'s spirit, even if
it needs its own boolean)? Don't silently expose new player fields to Coach/Recruiter/Guardian
views without an explicit privacy decision — that's the kind of gap that's easy to introduce
by accident in a codebase this size, and exactly the kind of bug that erodes trust if a parent
or player notices their privacy settings didn't actually do anything.
