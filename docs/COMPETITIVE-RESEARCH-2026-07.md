# Competitive Research — Caliber Performance Labs

**Date:** July 2026
**Scope:** High-school basketball analytics, film, stats, and recruiting platforms, with a focus on what matters to Montana HS coaches (Class AA through Class C) and where Caliber can realistically win as a tiny, AI-native team.

**Hard constraint honored throughout:** no fabricated social proof. Every hook and claim below is honest for a platform with ~4 real players launching Montana-first.

---

## 1. Anchor Profile: Hudl

### What it is
The de facto operating system for high-school game film. Founded in Lincoln, NE; owns film capture (Hudl Focus cameras), film storage/exchange, human-tagged stat breakdowns (Hudl Assist), and free athlete recruiting profiles (Hudl Profile). Roughly 98% of US high schools use Hudl for football, and its film-exchange network is the reason: you effectively cannot trade film with opponents unless you're on Hudl. Basketball rides on the same platform but is a second-class citizen relative to football.

### Current pricing (2025–26, high school)
| Package | Price/yr | Storage | Analysis |
|---|---|---|---|
| Silver+ | $1,500 | 150 hrs | Game only |
| Gold+ | $2,500 | 300 hrs | Game & scout |
| Platinum+ | $4,000 | 750 hrs | Game & scout, express turnaround |
| Athletic Department | Custom quote | — | Video + streaming + ticketing + Focus cameras + Profile |

Notes:
- Historically basketball teams could get in cheaper (Hudl has marketed "as low as $200/yr" when boys/girls split cost and another sport at the school already pays — a bundling discount, not a list price). Hudl Assist stat breakdowns have run ~$399 (10 games) to ~$999 (30 games) as an add-on.
- Hudl Focus (auto-tracking gym camera) is additional hardware cost; it feeds the Focus Exchange Network so away-game film at Focus-equipped gyms is auto-shared — deepening the network moat.

### What coaches love
- The film exchange network (the single biggest lock-in in the category).
- Hudl Assist: humans tag the game overnight; coaches get stat-linked clips, shot charts, plus/minus, assist/TO ratios without doing the work themselves.
- Focus cameras: set-and-forget capture, auto-upload.
- Free athlete profiles with verified-recruiter database — athletes get recruiting exposure "for free" because the school pays.
- Reliability and ubiquity: every AD, coach, and college recruiter already knows it.

### Documented complaints / weaknesses
- **Price, and rising.** In March 2025 FootballScoop reported Hudl restructuring pricing and storage in ways "sure to upset a lot of coaches": price increases across tiers and — the bigger pain — archived game film now counting against storage quotas (it previously didn't). Multi-angle programs saw storage consumption effectively double. Coaches publicly did the math on how fast practice film + archives + scout film burns the quota.
- **Cost stacks per sport and per level.** Storage pools across varsity/JV/frosh; small schools with one shared budget feel it most. A $1,500–$4,000 line item is brutal against a Class C athletic budget.
- **Basketball is downstream of football.** The product's center of gravity (workflows, Assist SLAs, marketing) is football; basketball coaches are served but not courted.
- **It measures, it doesn't teach.** Hudl gives the *coach* film and stats. Players get raw clips and a profile — no interpretation, no "here's what you personally need to work on this week."
- **Cottage industry of cheaper defectors exists** precisely because of price: QwikCut (~$300–$450/sport, "half the price of Hudl"), Hoopsalytics (markets itself as the affordable Hudl Assist alternative for basketball), watchgamefilm.com ($0–$100). These prove the price pain is real, especially in rural markets — six-man football forums literally have "Alternatives to Hudl" threads.

### Business/adoption model
School (or program/booster) pays annual SaaS per sport or per athletic department. Spread is bottom-up + network-coerced: once enough schools in a conference are on Hudl, film exchange forces the rest on. State associations sometimes mandate or bulk-discount it (e.g., GHSA deals). Athletes and parents are free users — the audience, not the customer.

---

## 2. Anchor Profile: MaxPreps

### What it is
America's scoreboard for high-school sports: schedules, scores, standings, box scores, player stat leaderboards, rankings, and team pages for nearly every US high school. **Sold by CBS Sports (Paramount) to PlayOn Sports in April 2025**, uniting it with the NFHS Network (streaming) and GoFan (ticketing). That merger produced **MaxPreps Advantage**: NFHS Network game streams auto-converted into film + stats + breakdowns.

### Current pricing (2025–26)
- **Core MaxPreps: free** for coaches/ADs (account, roster, schedule, stat entry, team page). It's ad- and data-monetized, and state associations often require score reporting through it.
- **MaxPreps Advantage — All Access: free** for every NFHS Network school (film library from the stream, basic editing, stats; footage ready 8–12 hours after the game).
- **MaxPreps Advantage — Advanced Breakdowns: $600/team/season** (human-logged stats, stat-linked clips, shot charts, tendency/opponent reports, player-level analytics).

### What coaches love
- Free, and it's *the* public record: local papers, fans, grandparents, and college coaches all check MaxPreps. Rankings/leaderboards drive pride and visibility.
- State-association integration (many states funnel official schedules/scores through it — including workflows Montana schools already know).
- 80+ stat-partner import integrations; iPad MaxStats app.
- Advantage turns a stream the school already produces into film without new hardware.

### Documented complaints / weaknesses
- **Garbage-in stats.** Data is only as good as the volunteer/coach entering it. Documented cases of wild inaccuracy and stat-padding (a running back with 17 real yards credited with 124), and those errors get republished by local media. National leaderboards are distorted by entry quality.
- **Data-entry burden.** Stats are typed in postgame field-by-field; support forums are full of "stats not saving," correction workflows, and coach frustration. Many coaches do "the bare minimum the section requires."
- **Dated UX.** The web-first, form-heavy experience predates modern app expectations; the post-PlayOn integrations added verification burden on coaches.
- **It's a record, not a tool.** MaxPreps tells you *what happened*, publicly. It doesn't help a coach coach or a player develop.
- **Advantage requires the NFHS Network camera/stream** — fine for schools that stream every game, useless for gyms that don't.

### Business/adoption model
Free wedge → mandated/normalized by state associations → monetized via ads, NFHS Network subscriptions ($ from parents/fans), GoFan ticketing, and the $600 Advantage upsell. Spread is top-down (association deals) plus fan demand ("why isn't our team's score up?").

---

## 3. Adjacent Field (brief profiles)

| Platform | What it is | Basketball strength | Price signal | Relevance to Caliber |
|---|---|---|---|---|
| **Synergy Sports** | Human possession-tagged film + analytics; the college/pro scouting standard | Very strong (basketball-native) | HS: ~$3,500–$7,500/yr; D1: $15k–$35k | Overkill and overpriced for HS; proves demand for possession-level insight. Not a Montana Class C threat. |
| **GameChanger (DICK'S)** | Scorekeeping + free streaming + team management app | Good and growing (baseball/softball-first, basketball supported) | **Free for coaches**, fans pay $9.99/mo for premium baseball/softball streams; basketball streaming free | The most dangerous "free" incumbent for stats. But: box-score tool, zero development/recruiting layer, no AI feedback. |
| **SportsRecruits** | Recruiting network (athlete profiles, coach messaging); club/school pays | Solid across club sports | Club-funded; free athlete profile tier | College coaches reportedly use it heavily; strongest in club circuits, thin in rural HS. |
| **NCSA** | Family-paid recruiting service | Broad, not basketball-specific | $1,000–$3,000+; complaints: hard cancellation, generic advice, "price doesn't match outcome" | Its reputation problem is Caliber's opening: families distrust pay-to-be-recruited. |
| **FieldLevel** | Coach-to-coach referral recruiting network | Moderate | Public pricing, athlete subscriptions | Trust-based model; low presence in MT HS hoops. |
| **HomeCourt (NEX Team)** | AI shot-tracking/training app via phone; NBA partner | Basketball-native training | Pivoted free-to-play | Individual skill training, not team ops or recruiting. Validates phone-camera AI. |
| **Balltime** | AI game breakdown + highlights (volleyball-first; **now sold under Hudl's umbrella** — hudl.com hosts its pricing) | Limited for basketball | ~$20–25/mo player plans | Shows Hudl's playbook: acquire AI-native challengers. Reviews note AI misidentifying players — accuracy is the trust bar. |
| **BallerTV** | Tournament/club streaming with AI cameras; recruiters watch | Strong in club/AAU | ~$199/mo per 5v5 team | Club-event coverage, not school-season ops. |
| **ScoutU** | Personal recruiting coordination service | Generalist | Consultative, undisclosed | Same family-paid model as NCSA, smaller. |
| **SportsVisio** | **AI-native newcomer**: phone/stream video → auto stats, highlights, shot charts | Basketball-first | <$3/player/game; ~$34/game or $199/mo/team | Closest analog to an AI-native wedge; publishes "vs Hudl" comparisons targeting youth/HS price pain. Watch closely. |
| **Hoopsalytics** | Affordable basketball film/stat breakdowns; markets as "Hudl Assist alternative" | Basketball-only | Well under Hudl Assist | Another proof point that Hudl's basketball pricing leaves room underneath. |

**Pattern:** the field splits into (a) film platforms priced for football budgets, (b) free scorekeepers with no intelligence, (c) recruiting services with trust problems, and (d) young AI-stat startups racing on price. **Nobody owns "AI that tells each player what to work on, attached to the official season record."**

---

## 4. Strategic Analysis

### 4.1 Table stakes — a coach won't even trial without these
1. **Zero (or trivial) cost to try.** GameChanger and MaxPreps set the anchor: free. A rural coach will not spend budget on an unknown.
2. **No new work.** The coach already reports scores to MaxPreps (association expectation) and may already keep a book. Anything that *adds* a workflow is dead on arrival; anything that *reuses* existing data (stat import, photo of the scorebook, CSV) can live.
3. **No new hardware.** Class B/C gyms don't have Focus cameras; many games aren't streamed. Phone-or-nothing capture, or stats-only mode.
4. **Roster/schedule/season basics** that just work, plus mobile-first UX (coaches live on phones, often on bad rural bandwidth).
5. **Minor-athlete safety**: guardian consent, sane privacy defaults, no DMs from strangers to kids. One incident kills a Montana launch permanently.
6. **Doesn't threaten what they already use.** Position as a layer *on top of* MaxPreps/Hudl, not a rip-and-replace — coaches won't abandon the film exchange or the official record for a startup.

### 4.2 Where the real gaps are
1. **Price for small/rural schools.** Hudl's 2025 price/storage restructuring actively squeezed small programs; >half of Montana's high schools have fewer than 130 students (Class C). A $1,500–$4,000 platform vs. a whole-department budget of a few thousand dollars is a non-starter — which is why QwikCut/Hoopsalytics-style defectors exist.
2. **Player-facing intelligence.** Every incumbent serves the coach (Hudl, Synergy) or the public record (MaxPreps). No one hands the *player* a graded, personalized, per-game development report. Hudl gives clips; MaxPreps gives box scores; neither says "your 3rd-quarter turnovers came from picking up your dribble — here are two things to drill." Caliber Score is exactly this, and it's the whitest space on the board.
3. **Stats-centric (film-optional) workflow.** MaxPreps Advantage needs an NFHS stream; Hudl needs film. Many Class C games have neither. A stats-first AI report (film later, when available) fits reality that incumbents' architectures ignore.
4. **Data-entry burden + accuracy.** MaxPreps' known weakness. Whoever makes entry near-zero (import, OCR the scorebook photo, one-tap live tagging) and *rewards* accuracy (better AI feedback from better data) flips the incentive that currently produces garbage stats.
5. **Athlete-owned profiles.** Hudl Profile exists but is school-subscription-dependent and film-centric; MaxPreps pages are school-owned records. A profile the *athlete* owns across school/club/transfer — with verified stats + AI progression — matters in the transfer-portal/NIL era. MHSA adopted an NIL policy (effective 2025), so Montana athletes can now monetize NIL (with restrictions: no school marks, and notably *no use of game film* in NIL activities — which makes stat/score-based profiles more NIL-useful than film).
6. **Guardian involvement.** Parents are paying customers everywhere (NFHS subs, GameChanger premium, NCSA fees) but are an afterthought as *users*. A real guardian role — see the report card, follow development honestly — is unserved.
7. **Small-state invisibility.** Recruiters don't drive to Circle, MT. NCSA charges families $1k–$3k to fix that and has a trust problem. An honest, free visibility layer ("Who's Watching," recruiter directory) for overlooked Class B/C kids attacks a felt injustice.

### 4.3 Caliber's differentiation wedge — ranked
Scored on (a) how much a Montana HS coach cares, (b) feasibility for a tiny team.

| # | Differentiator | Coach cares | Feasibility | Why |
|---|---|---|---|---|
| 1 | **AI game report cards per player (Caliber Score)** — "Hudl films the game; Caliber grades it and tells each kid what to work on" | High — saves the coach the hardest, most time-consuming conversation ×12 players, every game | High — already built; the engine is the company | The only capability nobody else offers at any price. It's a *development* tool, which is what coaches at non-recruiting schools actually do all day. |
| 2 | **Priced/architected for small schools** — free first season, no hardware, no film required, works from a stat sheet | High — removes the only two objections that matter (money, work) | High — pricing + onboarding decisions, not new tech | Directly exploits Hudl's 2025 price/storage backlash and MaxPreps' film dependency. |
| 3 | **Near-zero stat entry** — import/CSV/scorebook-photo → stats in minutes | High — attacks MaxPreps' documented pain | Medium — import first (easy), OCR later (Gemini can do this) | This is the adoption unlock for #1: report cards are only as good as the data pipe. |
| 4 | **Montana-first visibility for overlooked athletes** — Class B/C leaderboards, transfer portal, "Who's Watching," recruiter directory, honest and free | Medium-high — coaches advocate hard for their 1–2 college-capable kids; families resent NCSA pricing | Medium — features exist; the hard part is recruiter-side liquidity (don't overclaim it) | Own the market incumbents ignore; being *the* Montana platform is defensible and word-of-mouth-friendly at 8-team district tournaments. |
| 5 | **Guardian role + athlete-owned profile (NIL-era)** | Medium — coaches care indirectly (parent management); parents care a lot | High — roles already built | Differentiates vs. school-owned MaxPreps pages; monetization path (guardian premium) that doesn't charge the coach. |

De-prioritized: the social layer (feed/stories/polls/DMs) is not a differentiator to coaches and raises minor-safety surface area; keep it quiet in coach-facing positioning.

### 4.4 Cold-email hooks for Montana coaches (honest only)
Context: every MT coach knows Hudl and MaxPreps; many just absorbed Hudl's price/storage changes; Class B/C coaches often have no film at all.

**Hooks that land (truthful today):**
1. **The one-liner:** "Hudl films your games. MaxPreps posts your scores. Neither one tells your kids what to work on. Caliber turns your box score into an AI-written report card for every player — I'd like to run it on one of your games, free."
2. **The tiny ask / proof-first:** "Send me the stat sheet from your last game and I'll send back a personalized report card for each of your players within a day. If your kids don't find it useful, delete my email." (Zero risk, zero work, demonstrates the engine instead of claiming traction.)
3. **The honest-underdog frame:** "I'm a small team launching this in Montana first — you'd be one of the first programs in the state, and the product will be shaped around Class B/C reality: no film crew, no camera budget, no extra data entry." (Early-stage honesty as a feature: founding coaches get influence, not a sales pitch.)
4. **The price contrast (factual):** "Free for your first season. For context, Hudl's high-school packages now start around $1,500/yr and MaxPreps' breakdowns run $600/team — we're not asking for budget, just one game's stats."
5. **The player-development angle:** "It's not a scouting tool — it's a development tool. Every kid gets a graded card after every game: what they did well, what to drill this week. Coaches keep the coaching; Caliber does the paperwork."

**Claims to avoid** (would be fabricated or unsupportable): user counts, "coaches love us," college-recruiter reach, "trusted by teams across Montana," any implied MHSA affiliation, guaranteed recruiting outcomes.

**Mechanics:** CAN-SPAM basics (real address, unsubscribe), one coach per school, reference their actual team/season (public on MaxPreps — which doubles as proof you can ingest their stats), send Tue–Thu mornings out of season or Sunday in season.

---

## 5. What to Build Next — 5 highest-leverage moves

1. **MaxPreps/CSV/scorebook-photo stat ingestion.** *(Gap: MaxPreps data-entry burden; table-stakes "no new work.")* Coach pastes a MaxPreps box-score link, uploads a CSV, or photographs the paper scorebook; Gemini parses it; report cards generate. This makes the cold-email ask ("send me your stat sheet") a product feature and removes double-entry — the #1 adoption killer.
2. **Shareable report-card artifact.** *(Gap: player-facing intelligence + guardian involvement; also the growth loop.)* Each Caliber Score renders as a beautiful, phone-shaped card (obsidian/crimson brand) the player/guardian can share by link or image. Every shared card is honest marketing to the next family and coach — the viral loop GameChanger gets from live-stream links.
3. **"Founding Program" free tier + honest pilot page.** *(Gap: Hudl price pain in small schools.)* Public page stating exactly what Caliber is (early, Montana-first, free first season, what founding coaches get: direct line to the builder, roadmap influence). Converts early-stage honesty into positioning instead of a liability; gives the cold email somewhere credible to land.
4. **Coach weekly digest.** *(Gap: incumbents serve the coach film OR the record, never synthesis.)* One automated email/screen per week: team trends, each player's trajectory, top 2 team-wide issues the AI keeps seeing, suggested practice emphases. Costs the coach zero clicks; makes Caliber feel like an assistant coach rather than another dashboard.
5. **Montana Class B/C leaderboards + verified-stat athlete pages.** *(Gap: small-state invisibility, athlete-owned profiles, NIL era — noting MHSA's NIL policy bars game film but not stats/branding.)* Public, SEO-friendly pages per athlete with verified game-by-game stats and Caliber Score progression, owned by the athlete/guardian. Start by being definitive for Montana — 180 schools is a countable market where "the whole state is on it" is achievable, and district tournaments do the word-of-mouth.

**Explicit non-moves:** don't build film exchange (Hudl's moat, unwinnable), don't build streaming (NFHS/GameChanger own it), don't charge families for recruiting promises (NCSA's reputation trap), don't lead with the social feed to coaches.

---

## 6. Sources

**Hudl**
- https://www.hudl.com/pricing/high-school (Silver+/Gold+/Platinum+ pricing, storage, analysis tiers)
- https://www.hudl.com/pricing
- https://www.footballscoop.com/2025/03/04/hudl-planning-major-changes-sure-upset-lot-coaches (2025 storage/pricing changes, coach backlash)
- https://www.ghsa.net/big-basketball-discount-offered-hudl ("as low as $200/yr" basketball bundling; Assist $399–$999)
- https://www.hudl.com/products/assist/basketball
- https://www.hudl.com/basketball-camera (Focus Indoor)
- https://www.hudl.com/products/focus/exchange-network
- https://sgx.studio/product-intelligence/report-hudl/ (exchange network ≈98% penetration analysis)
- https://www.nfhs.org/articles/online-film-exchange-now-thriving-at-high-school-level/
- https://www.hudl.com/blog/new-hudl-recruiting-tools-college-search-contact (free Hudl Profile, recruiter database)
- https://www.hudl.com/support/athlete-recruiting/guides/overview

**MaxPreps / PlayOn / NFHS**
- https://maxpreps.playonsports.com/advantage (Advantage tiers; free All Access; $600 Advanced Breakdowns; 8–12h film)
- https://maxpreps.playonsports.com/basketball
- https://support.maxpreps.com/hc/en-us/articles/202103644-Stat-Management (manual entry workflow)
- https://support.maxpreps.com/hc/en-us/articles/360021077474-Stat-Entry-Issues
- https://www.egcitizen.com/2023/12/19/476021/maxpreps-is-a-handy-app-but-as-good-as-those-inputting-data (accuracy criticism, 124-yard example)
- https://www.ushsho.com/forums/viewtopic.php?t=14543 (forum complaints on accuracy)
- https://www.maxpreps.com/news/Qeg1tApLoUWYz53EnRnWZQ/playon-acquires-maxpreps-to-elevate-the-high-school-sports-fan-experience.htm (April 2025 acquisition)
- https://www.sportico.com/business/media/2025/maxpreps-sale-playon-cbs-paramount-1234845892/
- https://frontofficesports.com/private-equity-youth-sports-push-continues-with-maxpreps-deal/

**Adjacent field**
- https://hoopbrief.com/blog/synergy-sports-pricing-2026 (Synergy HS $3.5k–$7.5k; tier analysis)
- https://gc.com/basketball and https://gc.com/coaches (GameChanger free-for-coaches model, DICK'S ownership)
- https://en.wikipedia.org/wiki/GameChanger
- https://sportsrecruits.com/ and https://sportsrecruits.com/clubs
- https://www.rosterhunter.com/blog/ncsa-reviews and https://www.getvrm.com/blog/is-ncsa-worth-it (NCSA $1k–$3k+, cancellation/value complaints)
- https://www.collegevine.com/faq/21542/sportsrecruits-vs-ncsa-which-one-should-i-choose
- https://www.ballertv.com/ (BallerTV model; ~$199/mo 5v5)
- https://www.scoutu.com/
- https://www.homecourt.ai/ and https://medium.com/nex-team/homecourt-is-now-free-to-play-d16c75fc7680 (HomeCourt free-to-play pivot, NBA partnership)
- https://www.hudl.com/en_gb/pricing/balltime (Balltime under Hudl; player plans)
- https://apps.apple.com/us/app/balltime-ai/id6450258692 (mixed AI-accuracy reviews)
- https://www.sportsvisio.com/pricing and https://www.sportsvisio.com/stories/sportsvisio-vs-hudl-2026-comparison-for-youth-teams (<$3/player/game; $34/game; $199/mo)
- https://hoopsalytics.com/alternative-to/hudl/ (affordable Hudl Assist alternative)
- https://www.qwikcut.com/the-alternative-to-hudl/ ($300–$450/sport)
- https://sixmanfootball.com/threads/alternatives-to-hudl.36281/ (rural-school price-pain thread)

**Montana context**
- https://www.nfhsnetwork.com/associations/mhsa (MHSA streaming on NFHS Network)
- https://406mtsports.com/high-school/basketball/boys/class-a/all-state-basketball-games-to-be-streamed-on-nfhs-network/article_9be6c23a-fec2-11ef-a9f1-23b5cef98f94.html
- https://www.montanapbs.org/programs/ClassC/ (>half of MT schools <130 students)
- https://406mtsports.com/high-school/basketball/mhsa-annual-meeting-nil-brian-michelotti/article_d61c69ae-d772-11ef-8a6b-271057c4c1c3.html (MHSA NIL policy adoption)
- https://blog.rallyfuel.com/montana-nil-laws/ (NIL restrictions incl. no game film in NIL activities)
- https://cdn1.sportngin.com/attachments/document/8589-3338095/Proposals-2025_revised_Final_NIL_Rule_only.pdf
