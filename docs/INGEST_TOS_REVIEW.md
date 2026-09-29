# Ingest review: MaxPreps as a distribution source

**Status: DECIDED 2026-09-25. No scrape. Ship honest.**

The operator chose option 4 below. **No ingest code will be written and nothing
has been or will be scraped from MaxPreps.** Section 6B closes on that basis.

A data agreement (options 2 and 3) stays available if the cold start ever
justifies the calendar time, but nothing is blocked on it: the rarity system
already degrades honestly with a thin distribution.

Prepared 2026-09-25 for pivot Section 6B, which requires this review before any
ingest at scale.

I am not a lawyer and this is not legal advice. It is an engineer's read of the
source's own published rules, which is the part I can check directly.

---

## 1. What we actually need

A grade distribution, not profiles. Section 6B is explicit: *"Ingested data
powers distribution only. No ingested-player profiles on leaderboard or
search."*

That matters to this review, because it means we need **aggregate shape** (how
Montana high school basketball scoring and efficiency are distributed by class
year and position), not identified records about named minors. Those are very
different asks, legally and ethically, and the second one is the expensive one.

Concretely, the rarity system needs enough peers in a `class year + position`
cohort for a percentile to mean something. Today every cohort is under the
minimum of 5, so every player is unranked and sits at Base. See
`server/rarityService.ts`.

## 2. robots.txt: the blocking finding

Fetched live from `https://www.maxpreps.com/robots.txt` on 2026-09-25
(HTTP 200, 209 lines).

```
User-agent: *
Disallow: /school/
Disallow: /team/
Disallow: /discovery/
...
Disallow: /scores/
```

**The two paths that hold the data we want, `/school/` and `/team/`, are
disallowed for all user agents.** The `Googlebot` block repeats the same
disallows, so there is no more permissive carve out to point at. `Exabot` is
banned outright from the whole site.

There is no `Crawl-delay` directive, so robots.txt offers no sanctioned rate
either.

State hub paths such as `/mt/basketball/stat-leaders/` return HTTP 200 and are
not obviously disallowed by the patterns above. I did **not** fetch any stat
page content while preparing this. Reading one page to check a status code is
not an ingest; pulling rosters is, and that is the line this document exists to
stop me crossing without you.

### What that means

robots.txt is not itself a contract, and ignoring it is not automatically
unlawful. But it is the site's published, machine readable statement of what it
does not want automated clients to take. Building a pipeline against paths it
explicitly disallows is:

- a clear signal of intent that a plaintiff would put in front of a judge
- a direct aggravating factor in a Computer Fraud and Abuse Act or
  breach-of-contract argument
- indefensible in front of a partner, a school, or a parent asking how we got
  a Montana sophomore's stat line

## 3. Terms of Service

MaxPreps is operated by CBS Interactive / Paramount. Their terms should be read
in full before any decision, and I have deliberately not paraphrased clauses I
have not read end to end. What consistently appears in terms of this shape, and
what you should have counsel confirm:

- a prohibition on automated access, scraping, crawling or data mining
- a prohibition on reproducing or redistributing site content
- a reservation of database rights over compiled statistics

The relevant question is not "are these facts public". It is whether **the
compilation** is protected and whether **automated collection** is separately
prohibited by contract. Individual sports statistics are facts and facts are not
copyrightable in the US, but a curated database of them can attract protection,
and a browsewrap or clickwrap term against scraping can bind regardless.

## 4. The minors problem, which is the real one

Every subject in this dataset is a **high school athlete, most of them minors**.

Your own privacy policy commits to: no data sold, no sharing without the
player's explicit action, deletion on a verified guardian request within 30
days, and an under-13 account deleted within 30 days of detection.

Ingesting third-party records about minors who never signed up creates people in
our systems who:

- never consented and cannot meaningfully be asked
- cannot exercise the rights the policy promises them, because they do not know
  we hold anything
- have no guardian relationship for us to verify a deletion request against

**This is the part I would not do on a scrape, even if robots.txt allowed it.**
The COPPA gap in Section 1 existed because nobody had checked whether the age
gate was real. Creating a pile of minor records with no consent path would be
the same mistake, made deliberately and at scale.

## 5. The distinction that makes this solvable

Section 6B only needs a **distribution**. It does not need identified rows.

If what we retain is "Montana, class of 2027, guards, N players, these scoring
percentiles", with no names, no schools, no per-player rows and no way to
re-identify, then:

- the minors problem largely dissolves, because there is no personal data
- the database rights problem shrinks, because we are not reproducing their
  compilation
- the product need is still met, because percentile is all rarity consumes

That does not fix robots.txt. Deriving an aggregate still requires fetching the
disallowed pages. It changes what we *keep*, not how we *get* it.

## 6. Options, with my recommendation

| # | Option | robots.txt | Minors | Effort | Verdict |
|---|---|---|---|---|---|
| 1 | Scrape MaxPreps `/school/`, `/team/` | **Violates** | Bad | Low | **Do not** |
| 2 | Ask MaxPreps / CBS for a data or API agreement | Clean | Manageable | Weeks of calendar time | **Recommended** |
| 3 | Montana High School Association as a source | Likely cleaner | Same consent question | Medium | **Worth a call** |
| 4 | Publish a public distribution and ingest nothing | Clean | None | Low | **Do this now** |
| 5 | Lower `MIN_COHORT` and ship without seeding | Clean | None | Trivial | **No.** It would make Chrome cheap |

### Recommended path

**Do option 4 now, pursue 2 and 3 in parallel, never do 1.**

Option 4 in practice: rather than seeding from someone else's data, be honest in
the product that the distribution is thin while the platform is new. The rarity
system already handles this correctly and by design. A cohort under 5 is
unranked, and a player sits at Base rather than being handed a rank the data
cannot support. That is a feature, not a gap to paper over with scraped rows.

The cold start is real, but the cure proposed is worse than the disease: a
ranking built on non-consenting minors' data, obtained against the source's
published wishes, on a product whose entire pitch is that the number is honest.

### If you want to proceed with a scrape anyway

That is your call to make, not mine, and you may have context I do not. I would
want, in writing, before I build it:

1. Counsel's read on the ToS and on CFAA exposure.
2. A decision on what happens when a parent asks what we hold on their child.
3. A retention rule: aggregate only, raw pages discarded, nothing identified
   persisted.
4. A rate limit and a real contact User-Agent, so we are not pretending to be a
   browser.

I will build it if you direct me to after reading this. I am telling you plainly
that I think it is the wrong move.

## 7. What is NOT blocked

Section 6A, the leaderboard as stacked cards, is done and needs none of this. It
ranks the players we actually have.

---

## Decision

- [x] **Option 4, publish honestly, no ingest** (chosen 2026-09-25)
- [ ] Pursue option 2 or 3, partnership or association data
- [ ] Proceed with a scrape, having read section 6 above

### What this means in practice

Nothing to build. The behaviour is already correct:

- `MIN_COHORT = 5` in `server/rarityService.ts` leaves a small cohort unranked
  rather than inventing a percentile for it.
- An unranked player lands on Base, never on a tier they did not earn.
- Chrome needs roughly a hundred players in one class year and position, so it
  stays genuinely rare while the platform is small.

The honest surface for this is the product saying so where it matters, not a
seeded ranking. If a player asks why they have no tier yet, the answer is that
there are not enough comparable players on the platform, which is true.

**Do not lower `MIN_COHORT` to make the cold start look better.** That was
option 5 and it was rejected for the same reason as the scrape: it would make
the tier mean less on the first card anyone shares.
