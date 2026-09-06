# STATUS — xsonomy-news

_Last updated: 2026-09-05 (session 1 — schema sync + weekly/monthly roundups)_

## Working now
- Daily ingest + site deploy (05:00 UTC). Daily email digest via Resend (08:00 UTC).
- **Weekly digest (Sun 07:00 UTC)** — `digest.yml`, alongside the daily. Email only.
- **Monthly digest (1st, 07:00 UTC)** — `monthly-digest.yml`. Email **plus** a permanent archive
  page, which is why it has its own build-and-deploy stages.
- Both carry: a written lead in plain English → the trends numbers → a ranked shortlist of
  **topics** (top 10 weekly / 20 monthly in the email; 40 on the monthly archive page). Neither
  lists every headline — a week is ~210 stories, a month ~850 — and consumer / civil-mobility
  coverage is filtered out entirely.
- Only the monthly is archived. Publishing 52 weeklies a year would bury the monthly
  retrospectives in the `/digest/` catalogue.
- **One digest per day, longest period wins.** On the 1st only the monthly goes out; on Sundays
  only the weekly; otherwise the daily. Cron cannot express "not the 1st", so `digest.yml`
  decides at run time and skips the send. Manual dispatches always send.
- The scheduled monthly always runs `--month <the month that just ended>`, computed as
  `date -u -d yesterday +%Y-%m` on the 1st. That is an exact calendar month, where the old
  `--period month` was a rolling 30 days whose title claimed to be a calendar month.
- LLM entity tagging on ingest; entity resolution into `companies`/`products`; enrichment scripts (manual).
- `db/schema.sql` now mirrors the live database (19 tables, 3 views, 3 functions, 2 triggers,
  52 indexes, 15 RLS policies), verified against project `uobidcahmrmfdmfbrtkt` on 2026-09-05.

## Digest archive
Catalogue page at `SITE_URL/digest/` — built from `src/digest.html` + the per-issue `.json`
summaries, in the site's own dark theme, linked from the header nav on every page. Cards show
story/topic/outlet counts, the most-covered story, and the companies and themes that moved.
Issue pages are rendered for the web by `scripts/lib/issuepage.mjs` (dark, site header and nav,
site CSS) — deliberately separate from the email renderer in `digest.mjs`, which stays
table-based and light so it survives Gmail and Outlook.
Live issues in `archive/digests/`, published at `SITE_URL/digest/<slug>/`:
- `2026-06` June 2026 — 1,163 defence-relevant stories of 1,190
- `2026-07` July 2026 — 860 of 990
- `2026-08` August 2026 — 782 of 910

Backfill any month with `node scripts/digest.mjs --month YYYY-MM --skip-send` (writes the archive
page, sends nothing), or via the `monthly-digest.yml` dispatch, which takes a `month` input. These three were generated from the same
library code but **outside** the pipeline, because there is no `.env` on the dev machine — the
data was exported read-only from Supabase and fed to `buildTrends` / `rankTopics` / `buildHtml`
directly. Regenerating them through `digest.mjs` should reproduce them.

## PENDING — one migration to apply
`db/migrations/2026-09-07_subscriber_frequency.sql` adds `daily` / `weekly` / `monthly` to
`subscribers`. **Not yet applied** (the Supabase write was blocked in the session that wrote it).
Run it in the Supabase SQL editor. Until then the sign-up form still works and nobody loses email:
`subscribe.js` retries without the columns and `fetchSubscribers` treats everyone as subscribed to
all three — but a new subscriber's choice is silently ignored.

## Resolved this session
- **Is `resolve-entities.mjs` scheduled?** Yes — `ingest-and-deploy.yml:38` runs `npm run resolve`
  in the daily job. (Old task #3 is done; removed from the list.)
- **`subscribers` table or `recipients.json`?** Both. `digest.mjs` loads `recipients.json` as the
  base list, then merges website sign-ups from the Supabase `subscribers` table, falling back to
  the file alone if Supabase is unreachable. Note: unsubscribes are handled by hand-editing
  `recipients.json` — there is no removal path for someone who signed up on the website.
- **Repo ≠ DB.** Fixed for `db/schema.sql`. See the new gaps below for what the sync turned up.

## Known gaps / doubts (verify)
- **`docs/ARCHITECTURE.md` lists 13 tables; the DB has 19.** Missing from that doc:
  `company_locations`, `company_relationships`, `product_sectors`, `product_taxonomy`,
  `taxonomy_facets`, `taxonomy_options`. The last three are a whole faceted product-taxonomy
  subsystem (14 facets → 105 options → 9,185 product classifications) that no doc mentions and
  no script in this repo obviously writes. **Where does `product_taxonomy` get populated?**
- **Nothing is in `draft`.** All 1,559 companies and all 2,372 products are
  `publication_status = 'live'`. The draft → review → live gate described in ARCHITECTURE.md
  exists in the schema but is not currently holding anything back, even though
  `enrich-companies.mjs` is documented as leaving rows in `draft`. Either enrichment has not run
  since the rows were created, or something flipped them to live in bulk. Worth understanding
  before trusting the gate.
- **Views bypass RLS.** `feed`, `product_taxonomy_view` and `unresolved_company_tags` are plain
  (security-definer) views, so they run as their owner and ignore row-level security on the tables
  underneath. Harmless today because nothing is in draft, but the moment a draft product exists,
  `product_taxonomy_view` will expose its slug and name to the anon key. Consider
  `alter view … set (security_invoker = on)` if the draft gate is ever used in earnest.
- **`db/schema.sql` has not been executed.** It was reverse-engineered from the live catalogs and
  is documentation-accurate, but it has never been run — there is no local Postgres or Docker on
  this machine to syntax-check it against, and running it on production was out of scope. Before
  relying on it to rebuild a database, run it once against a scratch Supabase project.
- README still describes companies/products as arrays on `articles` only; the resolver is newer.
  README is stale.
- **The site is uav360.xyz, not news.xsonomy.com.** `digest.mjs` and `generate.mjs` both default to
  the old domain in code (`generate.mjs` still falls back to `https://news.xsonomy.com`), and
  CLAUDE.md / ARCHITECTURE.md still name it. Production is fine because the `SITE_URL` Actions
  variable overrides the default — but a run without that variable would emit a sitemap full of
  wrong-domain URLs. Worth fixing the defaults and the docs together.
- **`digest-preview.html` is a committed build artefact.** `npm test` rewrites it every run, so it
  always shows up as modified. The repo has no `.gitignore` at all (which is also why `.DS_Store`
  keeps appearing). One small `.gitignore` would settle both.
- **The roundup has never run end to end.** The clustering, ranking and trends maths were validated
  against a real week (210 articles pulled read-only, ranked offline — the top 10 came out as ten
  genuine multi-outlet stories), and the logic is covered by `test-trends.mjs` / `test-topics.mjs`.
  But `digest.mjs --period week` itself has not run: there is no `.env` on the dev machine, so the
  PostgREST queries in `fetchArticlesBetween` / `fetchEntityLinks` are still untested against a
  live endpoint. Do `npm run digest:week:dry` before the first real send.
- **Pushing needs the `workflow` token permission.** A push touching `.github/workflows/` is
  rejected unless the PAT grants Workflows: Read and write (fine-grained) or the `workflow` scope
  (classic). This blocked the first deploy attempt of everything built in session 1.
- **Entity extraction is noisy on the margins.** Some articles list companies that are only
  tangential (a DJI camera story tagged with Amazon, Insta360 and LandSpace). It does not affect
  ranking much — outlet spread dominates — but it shows up in the "who" line under a topic.

## Next tasks (in order)
1. **README refresh** — make README match reality (short; CLAUDE.md is the real brief).
2. **ARCHITECTURE.md refresh** — add the six missing tables and explain the taxonomy subsystem
   once its writer is identified.
3. **Catalogue reports** — still open, and distinct from the news roundups just built. `roundup.yml`
   reports on *articles*; this would report on *catalogue changes* (companies/products created or
   edited in the period). If it happens, reuse `scripts/lib/trends.mjs` and the archive plumbing
   rather than starting a new script.
4. **Catalogue publish gate** — decide when to flip `PUBLISH_STATUS` to `"live"` in the xSonomy repo.
   Note this is now partly moot: RLS already restricts the anon key to `publication_status = 'live'`
   rows, so the flag is belt-and-braces rather than the actual gate.
5. **Subscriber unsubscribe path** — someone who signs up on the website cannot currently remove
   themselves; removal means hand-editing `recipients.json`.

## Migrations applied to the live DB
- 2026-07-02 — `entity_resolution` (tag_resolutions + articles.entities_resolved_at).
- 2026-07-02 — `investors_institutions`.
- 2026-09-05 — none. `db/schema.sql` was brought into line with the DB; the DB was not changed.
- 2026-09-07 — `subscriber_frequency_preferences` — **WRITTEN, NOT APPLIED**. See the pending
  section at the top of this file.

## Decisions log
- 2026-09-05 — Keep two repos (Pages constraint). All DB writes stay in xsonomy-news.
- 2026-09-05 — `db/schema.sql` is documentation of the live DB, kept idempotent. Constraint
  definitions in it are inline in `create table` and therefore only apply on a fresh database;
  columns, indexes and policies re-apply on every run.
- 2026-09-05 — Roundup trends are built on **entity mentions**, not article volume. Volume is flat
  (~200/week for eight weeks) and the curated theme mix barely moves month to month, so neither
  carries a story; which companies the press started or stopped covering does.
- 2026-09-05 — Roundups live in their own `roundup.yml`, separate from the daily `digest.yml`.
  They run archive → deploy → send as three jobs, because a commit pushed with `GITHUB_TOKEN`
  deliberately does not trigger other workflows; relying on `ingest-and-deploy.yml` to notice the
  push would leave the emailed "read online" link 404ing until the next morning.
- 2026-09-05 — Roundups are a **shortlist of topics**, not a headline list. `scripts/lib/topics.mjs`
  clusters near-duplicate headlines into one story and ranks by **distinct outlets**, never by
  article count: measured live, DJI drew 32 mentions in a week from 2 outlets (one publisher's
  house interest) while Anduril drew 10 across 7. Counting articles would put DJI top every week.
- 2026-09-05 — Clustering runs two passes: titles ≥ 0.42 similarity (syndicated copy), then
  ≥ 0.22 **if the articles share a resolved company name**. Measured on live data, one story told
  two ways scores 0.261 while separate stories sharing a company sit at 0.05–0.13, so the shared-name
  requirement is what makes the lower threshold safe.
- 2026-09-05 — Topics and trends use the resolver's names (`article_companies`), not the raw
  `articles.companies` text array, so "AV"/"AeroVironment" and "Terra Drone"/"Terra Drone
  Corporation" count once. This also merged two real stories the title pass alone had missed.
- 2026-09-05 — Among single-outlet stories, ranking prefers **rising** coverage over steady
  presence, so the tail is not just "another story mentioning a big prime".
- 2026-09-05 — Roundups are filtered to **defence / counter-UAV** (`scripts/lib/relevance.mjs`).
  The test is "is there positive evidence this is civil", NOT "is there evidence this is
  military": a first attempt demanding military proof dropped roughly half the genuine defence
  coverage, including "Tekever acquires Flowcopter", the most-covered story of the sample week,
  which contains no military vocabulary. On a real week this keeps 197 of 210 and drops 13 —
  GoPro cameras, DJI Osmo launches, drone pharmacies, A2Z delivery.
- 2026-09-05 — The DB's own classification could not do that filtering: 2,147 of 2,372 products
  have no `use_class` and `company_sectors` covers under half the registry. Article tags are
  populated on everything, so relevance is scored from tags plus headline wording.
- 2026-09-05 — `CONSUMER_ONLY_COMPANIES` in relevance.mjs suppresses firms with no defence
  business from the highlighted name lists only — their stories are still judged on merit.
  **DJI is deliberately not on it**: consumer-branded but central to counter-UAV (import bans,
  jamming, front-line use). Edit the list as the market changes.
- 2026-09-05 — A company only counts as a "mover" if ≥3 distinct outlets carried it
  (`MIN_OUTLETS_FOR_MOVER`). DJI drew 32 mentions in a real week from 2 outlets and was leading
  "most talked about" purely on one publisher's volume. Same lesson as topic ranking, applied to
  the trends tables.
- 2026-09-05 — Outlet spread now dominates topic ranking **absolutely**: every other term
  together cannot outweigh one extra outlet (article count caps at 9). Backfilling June exposed
  the flaw — one feed's boilerplate titles clustered into a 206-article "topic" scoring 21,600,
  burying real three-outlet reporting at 3,408.
- 2026-09-05 — The related-story clustering pass only merges across DIFFERENT outlets. One outlet
  does not publish the same story twice under different wording, and allowing same-outlet merges
  let union-find chain a single prolific feed into one blob.
- 2026-09-05 — When the comparison period was covered by materially fewer outlets (<80%), the
  percentage change is suppressed and a caveat is shown instead. June 2026 (25 outlets) against
  May (14) would otherwise have announced "+272%" — that is our ingest growing, not the market.
- 2026-09-05 — The lead paragraph is generated from the same numbers the tables show
  (`buildNarrative`), so the prose cannot drift from the data. If it should instead be
  LLM-written, that is a per-issue Anthropic call and a budget decision — not yet taken.

## Session notes
_(newest first; `/wrap-up` appends here)_

### 2026-09-05 — session 1
Committed CLAUDE.md + docs. Dumped the live Supabase schema into `db/schema.sql` (read-only;
no writes to the database). Found six tables and three views that no repo doc mentioned, and
that the draft/live review gate is currently empty — everything is published.

Then built the weekly roundup and monthly digest: `scripts/lib/trends.mjs` (period-over-period
maths), trends rendering and a `--period month` in `digest.mjs`, an archive page published by
`generate.mjs` at `/digest/<slug>/`, and `roundup.yml` to run it. Also found that the weekly
digest had never actually been scheduled — `digest.yml` hard-coded `day` for every scheduled run,
despite the docs claiming weekly was live.
