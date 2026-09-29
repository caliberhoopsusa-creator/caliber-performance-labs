---
name: backend-patterns
description: Caliber backend architecture — the IStorage/DatabaseStorage seam, manual per-route auth checks, and how to add a route or persistence method without breaking the existing shape. Use when adding or editing any server-side endpoint or storage method.
metadata:
  origin: adapted from Parcel's backend-patterns skill, rewritten for Caliber's centralized (non-service-split) architecture
---

# Backend Patterns (Caliber)

## The one real seam: IStorage
`server/storage.ts` defines `export interface IStorage { ... }` — every persistence
operation the app supports, as a typed method signature — followed by
`export class DatabaseStorage implements IStorage { ... }`, the only implementation.

This is Caliber's version of Parcel's injected-store pattern. The difference is scale and
location: Parcel splits stores into `packages/db` per-service; Caliber has one `IStorage`
covering all 116 tables in one file. Functionally it's the same idea — routes never call
`db.query` or `db.select` directly, they call a method on the storage instance.

**When adding a new persistence operation:**
1. Add the method signature to `IStorage` (grouped near related methods — the interface is
   already organized in commented sections like `// Players`, `// Games`, `// Badges`).
2. Implement it on `DatabaseStorage` in the matching position.
3. Call it from the route — never inline a new `db.*` call in `routes.ts`.

This matters more than it might seem: it's the only thing keeping persistence logic testable
and findable in a 19.8K-line route file. Breaking it by inlining a one-off query is the
single easiest way to make this codebase harder to navigate than it already is.

## Route auth pattern (copy, don't invent)
There's no global auth middleware applied uniformly. The repeated pattern inside route
handlers is:
```ts
if (!req.isAuthenticated() || !req.user?.claims?.sub) {
  return res.status(401).json({ message: "Unauthorized" });
}
const user = await authStorage.getUser(req.user.claims.sub);
```
Some routes additionally check `isAppOwner(req.user.claims.sub)` for owner-only actions, or
check a role field on `user` for Coach/Recruiter/Guardian gating.

**Find the nearest existing route that serves the same resource to the same role and copy
its auth block verbatim**, adjusting only the role/permission check. Don't write a new shape
even if you think it's cleaner — consistency here is worth more than a marginally better
pattern, because the next person (or next session of you) will pattern-match against
whatever's already there.

## Adding a route to routes.ts
- Find the right section by grepping for a nearby existing route path or resource name, not
  by scrolling. Section dividers (`// === X ===`) exist but aren't comprehensive or
  consistently formatted — don't rely on them alone.
- Match the response shape of sibling routes for the same resource (status codes, error
  message format, field naming) before inventing your own.
- `requiresSubscription` middleware gates some premium features (e.g. `/api/analyze-plays`).
  Check whether the feature you're adding belongs behind it by looking at what similar
  AI/premium features already do.

## What NOT to do
- Don't propose extracting `routes.ts` into multiple service files as a side effect of an
  unrelated task. It's a legitimate idea but it's a dedicated migration with its own review,
  not something to fold into a feature change.
- Don't add a second auth-check helper or pattern "to clean things up." If the existing
  pattern is repetitive, that's a separate, explicit refactor task — flag it, don't silently
  fix it while doing something else.
- Don't assume `IStorage` is missing a method before checking — grep the interface first.
