# STATUS — xsonomy-news

_Last updated: 2026-09-05 (session 1 — schema sync + weekly/monthly roundups)_

## Working now
- Daily ingest + site deploy (05:00 UTC). Daily email digest via Resend (08:00 UTC).
- **Weekly digest (Sun 07:00 UTC)** — `digest.yml`, alongside the daily. Email only.
- Subscribers pick daily / weekly / monthly on the sign-up form; `digest.mjs` mails only the
  people who asked for that period. A recipient with no preference recorded counts as opted IN,
  which is what keeps `recipients.json` / `DIGEST_TO` entries receiving everything.
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

## Monitored media
`sources.json` — **87 outlets** (16 drone/UAS specialist, 71 general defence where a UAV keyword
must match). Ids 1–55 came from the Laplace Dome tracker; **ids 56–87 were added 2026-09-29** from
the owner's outlet list.

Every added feed was verified live, not assumed: discovered by autodiscovery or path probing,
parsed with `scripts/lib/feed.mjs`, and run through `isRelevant()` to confirm it yields on-topic
items. Across the 32, 331 of 992 current feed items pass the gate (specialist sources 100%,
general ones 0–40%).

Of the owner's 75-entry list: 24 were already monitored, 32 added, 19 not added —
- **no discoverable feed** (checked twice, incl. browser UA and per-site paths): C-UAS Hub,
  Unmanned Aerial Online, Inside Unmanned Systems, GPS World, Defense Advancement, ASDNews,
  Defence Online, European Defence Agency, NATO Review, European Defence Matters, FlightGlobal,
  Aviation International News, AirMed & Rescue, IISS, Robotics 24/7, CSIS.
- **feed exists but is abandoned**: Forces News (last item 2020), CSIS (2016),
  Aviation Week (Mar 2026), Defence iQ (Aug 2024).
These are candidates for the sitemap backfill path instead.

## Unsubscribe
The footer link used to be `mailto:news@uav360.xyz` — and **uav360.xyz publishes no MX record**, so
that address can receive nothing. The link was a dead end for every subscriber since launch. The
email also sent `List-Unsubscribe-Post: One-Click` alongside a mailto, which RFC 8058 does not
allow (one-click requires a URL that accepts POST); Gmail and Yahoo would have POSTed into nothing.

Now: every subscriber row carries an unguessable `unsub_token`, the footer links to
`SITE_URL/unsubscribe/?t=<token>`, and that static page calls the `unsubscribe(uuid)` SECURITY
DEFINER function with the publishable key. anon still has no read or write access to `subscribers`
— verified: a direct SELECT returns `[]` and a direct PATCH changes nothing. `List-Unsubscribe`
now carries the https URL and `List-Unsubscribe-Post` is gone.

People on `recipients.json` / `DIGEST_TO` have no row to act on, so they still get the mailto —
which still goes nowhere. Either add an MX record for uav360.xyz or point `DIGEST_UNSUBSCRIBE` at
a mailbox that exists.

Verified end to end against a throwaway subscriber: clicking the link flipped daily/weekly/monthly
to false in the database; an unknown token says "not recognised"; a malformed one is rejected
before any request. Test rows removed afterwards (3 real subscribers, all still subscribed).

## Analytics & consent
Google Analytics 4 (`G-WG7PSZKB78`) on every page, gated by Consent Mode v2 in
`scripts/lib/chrome.mjs`. `analytics_storage` and the ad signals start **denied**, so no cookie is
written until the visitor accepts; the small bar at the bottom asks once and stores the answer in
`localStorage` under `uav360-consent`. Declining leaves storage denied — GA still receives
cookieless pings, which is how Consent Mode is designed to work, and is the usual reading of what
consent requires. `GA_MEASUREMENT_ID=""` builds the site with neither analytics nor banner.
Verified in a browser on a genuinely clean profile: no cookies before a choice, `_ga` +
`_ga_<id>` after accepting, none after declining, and the choice persists across pages.

**Fixed 2026-10-12 — the buttons did nothing.** `.consent` sets `display: flex`, and an author
rule always outranks the browser's own `[hidden] { display: none }`, so `el.hidden = true` never
hid anything: the bar stayed on screen after a click, and for anyone with a stored answer the
handlers were never attached at all (they sat after an early `return`). Two fixes: a global
`[hidden] { display: none !important; }` in styles.css, and the click handlers now attach before
the stored-choice check. `test-site.mjs` asserts both. The original verification missed this
because it checked the `hidden` *property* rather than whether the element was actually visible —
test visibility (`getBoundingClientRect().height`), not the attribute.

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

## Resolved this session

### 2026-11-01 — a retired company no longer captures article matches
Commit `55a95f1`. Write-up: `research-agent/reports/2026-11-02-resolver-merger-policy.md`.

- **Moving the aliases was not enough.** When ECA Group / Infotron was retired into Exail,
  the draft record's own *name* stayed an exact key in the resolver's index, because
  `resolve-entities.mjs` fetched companies with no publication-status filter and the exact
  map was first-write-wins. An article mentioning "ECA Group / Infotron" relinked to a
  draft nobody can open.
- **Row order was deciding matches.** Proven directly: the same tag, the same old code,
  two row orders — "Teledyne FLIR OEM" comes back as Teledyne FLIR or Teledyne FLIR
  Defense depending on which row arrived first, and "EOS Defence Systems" landed on an
  unrelated **Ukrainian draft called EOS**, which is the exact false-link family the test
  file was written to document.
- **The policy.** A company that is the source of a `merged_with` edge and is no longer
  live resolves to its single live successor, or to nothing. Chains are followed, cycles
  terminate, missing successors are safe. **Live** `merged_with` sources — EADS, BlueHalo,
  AAI Corporation, WB Electronics — are deliberately untouched: five of the seven edges
  have a live source, where the edge records history, not retirement. **Ordinary drafts
  still resolve**; only merged-away ones are excluded.
- **One rule everywhere else:** a company's own name beats another company's alias, the
  closest name wins a shared key, and a genuine tie is refused rather than guessed.
- **A crash, found on the way.** `matchProduct` called the confidence gate with an
  undeclared variable, so **every exact product-name match threw a ReferenceError and
  aborted the run**. Only the cache hid it — the error fired on new tags only.
- **Comparison before activation** was an enumeration, not a sample: across all 2,539
  company names and 351 aliases exactly four normalised keys are claimed by two companies,
  and every other key maps to one. 4 of 23 tags in those families change, all four
  corrections. No cached decision and no article link was rewritten.
- Tests **35/35**, with 14 new merger cases. Live REST reads validated before activation.

### 2026-11-01 — non-aerial product batch: 28 applied, 8 held
`research-agent/reports/2026-11-02-non-aerial-product-batch.md` + manifest, SQL, rollback.
Prepared under a preparation-only authorisation, dry-run clean, then **applied on Nazar's
go-ahead** to the first of the four decisions it raised. Products categorised UAV
**1,444 → 1,416**, Other **382 → 410**, live products unchanged at 3,522, redirect rows
**65 → 93**. The guard was re-checked for drift first (28 of 28 still matched). The other
three decisions — LUNA-2 and Dot's scope, the three programme names, and the WOLF /
Ghostfin clusters — remain open.

- **The candidate set is 36, not 19.** The earlier count came from matching one note
  phrasing; defining it from the taxonomy's own `domain` facet finds 36, eleven of which
  carry no such note at all. **28 ready, 8 held.**
- **One flag was simply wrong.** Katana is a single-rotor helicopter that won DARPA's Lift
  Challenge, and its own taxonomy contradicted itself — a web-sourced "Single-rotor /
  helicopter" airframe beside a knowledge-seeded "Surface (USV)" domain. A catalogue-wide
  sweep for that contradiction returns **Katana alone**, which is what makes the other 28
  credible. It stays a UAV and the bad row is corrected instead.
- **Held with reasons:** Katana; Exail A27 (no source names it); MMCM, rMCM and XLUUV
  (programmes and a class term, not products); LUNA-2 (a satellite); Ghost Shark (the name
  is Anduril's vehicle while the record is Albacore's, whose real product Ghostfin is a
  separate record); Dire WOLF (part of the Hunter WOLF / WOLF-X cluster).
- **The taxonomy review came out narrower than feared:** no specs to preserve or strip
  anywhere, no incompatible taxonomy values, and exactly **two** stale notes. Three
  taxonomy changes proposed in total.
- URLs checked for all 28: every slug free in `/other/`, none left behind in `/uav/`.
- The dry run earned its keep — it caught a generated-SQL defect where a trailing comma
  sat inside a `--` comment, truncating the `id in (…)` list. `PREPARE` would not show that.


### 2026-11-01 — investor figures labelled by what they are, and coverage more than doubled
Full write-up: `research-agent/reports/2026-11-02-investor-semantics-and-coverage.md`;
per-investor ledger alongside it, superseding the 1 November one.

- **A note never reaches a label.** Four figures had careful prose and the wrong type, so
  the card showed them wrong anyway: a listed trust's net asset value was stored as the
  manager's **total** assets (Seraphim), an average cheque as a published **range** (DTCP),
  and grant money and grant counts as **equity invested** and **investments made**
  (Brave1). Flyer One's €50M was a **target** when its own source says Fund V was
  "launched at €50 million" — no target claimed, no close reported. All five corrected.
- **Two checks produced no change, which is also a result:** NIF's €1B stays manager AUM
  because its own page says "assets under management", and Bpifrance's 6 deals stays an
  investment count with the single-year basis in its scope.
- **The interface had to move with the data.** The list card picks figures by type, so
  retyping would have silently emptied the slot each one used to fill while the data sat
  there. Each slot now reads every type that belongs in it.
- **Coverage: 23 → 55 investors with figures**, and **13 → 23 of the 26 Ukraine-linked**.
  All ten priority Ukraine-linked records were researched; eight produced figures and two
  produced findings instead — **Defender Ventures** does not exist under that name in any
  reviewed source, and **R-G.AI is not a fund** but a US defence technology company that
  led Swarmer's 2024 seed.
- **Twelve figures were found and deliberately not stored**, each with its reason: a
  listed company's share capital, an institution's budget, an activity target, a guarantee
  budget, a single-year flow, a figure with no as-of date, portfolio companies' own
  follow-on capital, a state programme's size, a team's prior track record, a typo,
  irreconcilable counts, and approvals and intentions presented as commitments.
- **Relationships 74 → 100 rows over 70 unique companies** (those are different numbers),
  with 82 linking a published profile. All seven authorised additions are in, plus Defence
  Builder's seven own-portfolio companies. **SWEBAL was deliberately left out**: Front
  Ventures lists it under a separate partnership heading, and a partner is not a holding.
- **Unresolved holdings 13 → 7**, every resolution found by going somewhere other than the
  unreachable Czech directory. **Nazca → Teltronic** turned out to be fully evidenced but
  *historical* — Amper completed the purchase from Nazca in June 2026 — which is why
  retirement now distinguishes an ended holding from a withdrawn one.
- **URC Systems is now a fact, not a question.** The Czech competition office permitted the
  deal in **2024**, the acquirer it names is **Piombino Group** of the Rockaway grouping,
  and the register shows Piombino then merged *into* URC Systems. So it completed, in 2024,
  through a different vehicle — Rockaway Alpha Defense is not the holder, and no human
  decision was needed to establish that.
- **Eight companies created, none given a landscape category.** ABX Dynamics is a draft on
  purpose: its product range is confidential by its own investor's statement, so nothing
  about UAV or C-UAS activity is established.
- Tests **72/72**. Landscape **567**. Verified live, including on a 375px viewport.
- **Not complete, and not claimed as such: 40 investors have still never been researched
  financially.** They are named in the ledger and identifiable from the data as those with
  no research-log row and no current metric.


### 2026-11-01 — hub cards now link to the profiles their matches point at
DLR and MITS Capital were both **confirmed** catalogue matches that the landscape page
still rendered as plain text. Two unrelated causes, both now fixed; full write-up in
`research-agent/reports/2026-11-01-hub-profile-links.md`.

- **DLR** — the page resolved a company match by searching the landscape payload, which
  holds only the 567 landscape members. DLR is a research institute, counted *outside* that
  list, so its id was never there to find. Its profile existed all along.
- **MITS Capital** — `hub_research.matched_investor_id` points at the **legacy `investors`
  table**, while the published investor records are `investor_research` rows keyed on their
  own ids. The page was comparing ids from two different tables, so *no* investor match
  could ever have resolved. `investor_research.matched_investor_id` is the bridge, and for
  MITS it was null.
- **The fix.** `v_landscape_hubs` now resolves both ids to a published profile slug in SQL
  — by id, never by name, and never by building a slug. The export emits
  `matchedCompanySlug` / `matchedCompanyUrl` / `matchedInvestorSlug` only when the
  relationship is a reviewed conclusion **and** the target has a published profile, and the
  page renders what it is given. `atlas.js`'s own duplicate copy of the role list is gone —
  that duplication is what let the rule drift.
- **The MITS link is evidence, not a name guess.** The names differ, which is why the
  resolver had not linked them. MITS Capital's own site — also the published record's own
  ticket source — carries the Lightning Fund under the heading "MITS Capital Portfolio" and
  lists MITS Accelerator as the same group's programme, which confirms both the identity
  and the hub's "related, different function" role.
- **Bofors Test Center stays text.** Its matched company is published, but the match is
  only `needs_review`, so the export withholds the slug entirely. That is why "confirmed"
  and "published" are two independent conditions rather than one.
- **One thing the first pass got wrong**, caught by checking the rendered page rather than
  the export: the link worked but its *label* was still looked up in the landscape payload,
  so DLR read as `dlr-german-aerospace-center`. The name now travels with the slug.
- Tests **66/66**. Hub eligibility, locations, approvals, counts and filters untouched; 118
  approved investor records unchanged.


### 2026-11-01 — Exail admitted, ECA Group / Infotron merged into it, 11 product categories corrected
Nazar authorised three things: the reviewed admission and merge, the Exail description, and
**category-only** corrections for the products whose maritime identity is evidenced. All three
applied in one guarded 17-step transaction and deployed. Full write-up:
`research-agent/reports/2026-11-01-exail-merge-applied.md`; SQL and rollback alongside it.

- **Exail is in the landscape** as a UAV-*ecosystem* supplier on the Navigation / GNSS limb — two
  `company_sectors` rows (`eco-navigation` primary + `eco-components`, both with sources), not as
  an aerial UAV OEM, and the screening note says so explicitly so nobody later reads it as an
  aircraft claim. It mirrors SBG Systems, its French competitor, which was already included.
- **ECA Group / Infotron is retired, not deleted** — `publication_status` → `draft`, both
  landscape rows → `excluded` with explanatory notes, and a `merged_with` lineage row records the
  2022 merger. Its article link and screening history survive. The IT180 STH-U moved to Exail in
  both places ownership is stored, keeping all 14 of its taxonomy rows and its URL.
- **Landscape stays 567** — +1 Exail, −1 ECA. That is a coincidence of two independent decisions,
  not a target; both were authorised, so both landed. Live companies 2,458 → 2,457.
- **Exail had no description**, so the merge would have swapped a described member for a blank
  one. Now 335 characters.
- **11 of 12 mis-categorised products corrected** UAV → Other. Category only: no renames, no
  retirements, no deduplication, no ownership or publication changes, `product_taxonomy`
  untouched. Held back and reported: **Exail A27** (no source anywhere names it, so its identity
  cannot be established) and **DORCUS** (not an Exail product at all — an ownership question,
  explicitly pending). The three bare designations H-8 / H-9 / O-16 *were* corrected, because
  every candidate identity is an uncrewed surface vessel — the ambiguity is about which family
  and whether they are duplicates, neither of which touches the category.
- **Those 11 pages changed URL** (`/uav/drix-h-8/` → `/other/drix-h-8/`), which needed a schema
  and generator change to keep the old URLs alive — see the migration above. Collisions were
  checked in both directions across all 3,522 live products before applying.
- **A dry run caught what `PREPARE` cannot.** Four triggers exist on these tables that the
  31 October validation never saw: `set_updated_at` on `companies` and `products` (so a rollback
  cannot restore the original timestamps — the old rollback file claimed it could, wrongly), and
  two on `company_sectors` that can silently drop or delete sector rows. Neither fired, but
  either could have left the landscape verdict without the taxonomy that makes it count.
- Catalogue tests **60/60**, including a new one for the cross-section redirect. Investors
  (118 / 26 Ukraine-linked), hubs (37 + 1) and the 37 research & academic organisations are
  untouched and verified live.
- **Flagged, not fixed:** 101 live landscape companies still have an empty description; and the
  same "filed under category UAV but is not an aerial system" taxonomy flag sits on 19 further
  products outside Exail that are still categorised UAV. Both deserve their own pass.

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
- **The first live weekly (Sun 13 Sep, run 34757254039) failed on two Supabase 504s** — on a
  3-row table and a ~200-row query, with the DB instantly healthy 30 minutes later. Infrastructure,
  not code: the queries themselves were never reached. Fixed by routing every Supabase call through
  `sbFetch()` (reads retry 502/503/504 with backoff; writes retry only on network errors, since a
  5xx on a plain INSERT is ambiguous). `loadRecipients` also used to swallow a subscriber-fetch
  failure and carry on with the base list — which would have sent that weekly to ONE address and
  skipped all three subscribers under a green tick. It now fails loudly instead. The weekly still
  has never completed end to end; the next scheduled attempt is Sun 20 Sep.
- **Scheduled runs are hours late.** The 07:00 UTC weekly ran at 12:30; the 08:00 daily routinely
  runs after 12:00. That is GitHub's cron queue, not a bug, but "Sunday 07:00" means "Sunday
  afternoon" in practice.
- **GitHub is deprecating the Node 20 action runtime.** `actions/checkout@v4` and
  `actions/setup-node@v4` now warn on every run. Bump to `@v5` before it becomes a failure.
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
- 2026-09-07 — `subscriber_frequency_preferences` — **applied 2026-09-08**. Adds
  `daily`/`weekly`/`monthly` to `subscribers`, all `not null default true`, plus a partial index
  on each. Verified afterwards: all 3 subscribers carry all three flags, and PostgREST serves the
  new columns (a `select=daily,weekly,monthly` returns 200; a nonexistent column returns 42703).
  Nobody was opted out. Source: `db/migrations/2026-09-07_subscriber_frequency.sql`.
- 2026-11-01 — investor corrections, in six MCP migrations:
  `investor_relationship_retirement_and_fund_positions` (adds `investor_companies.retired_at` /
  `retired_reason` and the new `investor_fund_positions` table, RLS on with no policies),
  `investor_eifo_correction_and_fund_positions`, `investor_airvolve_identity_and_round`,
  `investor_relationship_evidence_audit`, `investor_unresolved_holdings_resolution`,
  `investor_landscape_projection_with_fund_positions_v2`. The new columns and table are mirrored
  in `db/schema.sql`; the rest of the investor staging schema, applied in the 2026-10-30/31
  passes, is still not. Rollback: `research-agent/imports/README-investor-corrections.md`.

- 2026-11-01 — `slug_redirects_from_section`. Adds `slug_redirects.from_section` (nullable) and
  relaxes the not-self CHECK to `from_slug <> to_slug or from_section is not null`. A product
  page lives at `/<section>/<slug>/`, where the section comes from `products.category` and the
  slug from the product *name* — so correcting a category moves the url without changing the
  slug, and the redirect table could not express that at all: the catalogue generator wrote every
  stub into the section of its **target**, so a same-slug stub landed on top of the live page it
  pointed at. NULL keeps the old behaviour, so all 53 pre-existing rows are unaffected. Mirrored
  idempotently in `db/schema.sql`. Rollback:
  `research-agent/reports/2026-11-01-exail-merge-rollback.sql` (header explains why the column
  itself is deliberately not reverted).

- 2026-11-01 — `hub_matched_profile_slugs`. Redefines `v_landscape_hubs` to resolve each hub's
  stored catalogue match to a published profile slug **by id**: `matched_company_slug` from
  `companies` (gated `publication_status='live'` with a slug, which is exactly when
  `/companies/<slug>/` is built) and `matched_investor_slug` from the `approved`
  `investor_research` row whose `matched_investor_id` equals the hub's. The view had to be
  dropped and recreated — adding columns changes the column order and `create or replace`
  refuses it. Plus one data write: `investor_research.matched_investor_id` set on
  `mits-capital-lightning-fund`, the bridge that was missing. No `db/schema.sql` change —
  the hub subsystem is not mirrored there at all (see the note on the investor staging
  schema above; same gap, task #1). Report and rollback:
  `research-agent/reports/2026-11-01-hub-profile-links.md`.
- 2026-11-01 — `hub_matched_profile_names`. Adds `matched_company_name` /
  `matched_investor_name` to the same view. The slug alone was not enough: the panel still
  looked the label up in the landscape company payload, the very lookup that cannot find a
  research institute, so the DLR link rendered as "dlr-german-aerospace-center — company
  profile". The label now travels with the link from the row that resolved it.

- 2026-11-01 — three investor migrations.
  `investor_metric_types_vehicle_nav_grants_average` adds `vehicle_nav`,
  `average_investment_size`, `grant_funding_disbursed`, `grant_count` and
  `follow_on_investment_range`, extends the shape CHECK so `grant_count` is a count type,
  and adds a CHECK requiring a named vehicle for a `vehicle_nav` — a net asset value with
  no vehicle is the ambiguity the type exists to remove.
  `investor_companies_retired_kind` distinguishes `unsupported_evidence` from
  `holding_ended`, so an exit is not filed as "we were wrong".
  `investor_financial_research_log` makes the financial research queue a table: an
  investor with no row has not been researched, which is not the same as researched and
  yielding nothing. **All eight investor tables are now mirrored in `db/schema.sql`**,
  generated from the live database and replayed against it with 0 rows changed, closing
  the gap this file used to record. Rollback:
  `research-agent/reports/2026-11-02-investor-financial-ledger.md`.

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

## 2026-10-13 — product summaries enriched from linked news (daily)

**2,320 products had no summary, and every one of them already had news articles linked.**
So this is synthesis from material already in the database — no web access, no model recall.

`scripts/enrich-products.mjs` + `.github/workflows/enrich-products.yml`, daily 04:00 UTC
(before the catalogue build at 06:00), ~60 products a run — about five weeks to clear the
backlog. Manual runs accept `max`, `concurrency` and `dry_run`.

**It is allowed to refuse.** The article↔product links come from entity extraction and are
sometimes wrong. In a hand-reviewed sample of ten, two were unusable: *ARCHER AI*, whose
linked articles were about Neros and Perennial and never mention it, and *AS21 Redback*,
Hanwha's infantry fighting vehicle filed under Counter-UAS. The prompt asks the model to
decide first whether the articles actually describe the product, and to decline otherwise.

`products.enrichment_status` records the outcome and makes the job resumable:
- `news-derived` — summary written, `source_urls` set to the articles used
- `needs-review` — articles do not support a summary; left empty for a human

Rows with either value are not fetched again, so re-runs always move forward and never
re-spend tokens. Existing summaries are never overwritten (`summary=is.null` in the query).
Best-covered products are handled first, so early runs produce the strongest entries.

Reads use three plain selects joined in JS rather than a nested PostgREST embed — the FKs
exist so an embed would likely work, but this shape is already proven against this database
by the catalogue generator.

**Seeded by hand from the catalogue session** (same method, 8 written / 2 refused): Alexa
Spatium, Apollo, Archer, Bullfrog M240, Chaparral, Compact Laser Weapon System,
DJI SDR Transmission 2, DragonFire.

**Corrections spotted, not applied:** `Archer` has no company but the articles are clear it is
**Neros Technologies**; `DJI SDR Transmission 2` is filed under Software but is hardware;
`AS21 Redback` is miscategorised as Counter-UAS.

## 2026-10-28 — external landscape audit continuation

Saved `research-agent/audits/2026-10-28-external-landscape-audit-part-2.md`: three additional first-party-supported candidates (42 Solutions, Adevex, AURYN Aero), one historical lead on hold (Aeronautica SDLE), and duplicate/scope controls. Candidates require current full-database and alias reconciliation; cached public snapshots do not prove absence. No DB or publication changes. STATE remains Batch 15 READY_FOR_RESEARCH; this separate audit does not advance the batch workflow.

## 2026-10-28 — Batch 15 supplementary review

An independent review overlapped another session's completed Batch 15 submission. Preserved its CSV, counts and reconciliation handoff. Added `research-agent/audits/2026-10-28-batch-15-supplementary-review.md` and linked it from STATE: historical Safran Electrical & Power UAV wiring evidence; CS GROUP BOREADES operational evidence; Nikon SLM effective-date clarification; Ricardo historical US-engine attribution. No DB/publication mutations.

## 2026-10-28 — public scope check

Saved `research-agent/audits/2026-10-28-publication-scope-review.md` and companion CSV. Fetched public landscape contains 375 companies; zero matches by UUID among 253 excluded/needs_review records from latest reconciliation rows across batches 02–14. General catalogue has 235 exact-name matches from that subset. This supports treating catalogue scope separately from landscape eligibility, not bulk unpublishing from the STATE headline. No DB/site/state changes; Batch 15 still awaits Claude reconciliation.

## 2026-11-01 — investor corrections, fund positions and financial expansion

Report `research-agent/reports/2026-11-01-investor-corrections.md`; per-investor ledger
`research-agent/reports/2026-11-01-investor-financial-ledger.md`; rollback
`research-agent/imports/README-investor-corrections.md`. Catalogue commit recorded in STATE.

**Airvolve is its own company.** Lithuanian (airvolve, UAB, Vilnius, 2024), building the
Airlift-U500 autonomous VTOL tactical transport — not a misspelling of Airvolute of Slovakia,
which builds DroneCore autopilots. Both are published, and each record says the other exists and
is different. Coinvest Capital's **€510,000** contribution and the **€825,000** round total are
separate fields; Baltic Sandbox Ventures' share is not invented, and no investment date is
inferred from the 3 September 2024 announcement. **BSV Ventures is the former Baltic Sandbox
Ventures** — one record, with the old name noted where the 2024 announcement uses it.

**EIFO had two facts collapsed into one bad row.** The commitment to the D3 *fund* (US$5m,
4 July 2025) is now a **fund position** in a new table and a separate export array, never a
holding. EIFO's participation in the Six Robotics €12m seed is real but needed the lead
investor's announcement as its source. The original row is **retired in place** with a reason, so
the audit history survives while the projection stops publishing it.

**The evidence audit found three kinds of defect.** Six relationships had a cited source that did
not support the pair — including one sourced to a page where the company appeared only as a
sidebar headline, one sourced to a news item about a different company, and one whose URL now
404s. Five said more than was recorded and are now typed with their disclosed amounts. One
(Rockaway Alpha Defense → JISR) had no supporting source at all and is retired and listed as
unresolved. Eleven evidence labels were corrected upward where the source is the investor's own
portfolio page. **Both flagged edges survived**: PSV Hafnium → Acodyne and Tesi → Kelluu rest on a
page that names the investors in that specific round, which is evidence, unlike a bare listing.

**Unresolved holdings 26 → 13.** Ten companies created, none a duplicate, **three published**
(Airvolve, Kelluu, Mutable Tactics) and seven kept as drafts because `/companies/` is a UAV and
counter-UAS directory. **None has a taxonomy or candidate row, so none can enter the landscape**:
567 before and after. Thirteen remain unresolved with reasons that now say what was checked —
including URC, whose identity is evidenced as URC Systems but whose transaction is a pending
acquisition by a different group vehicle, and which **needs Nazar's decision**.

**Financial coverage 7 investors → 23**, 49 observations across 10 of the 12 metric types, and
**13 of the 26 Ukraine-linked records** now carry figures. The ledger lists all 118 records in
three honest states: 23 found, 19 researched with nothing usable, **76 not yet researched**. Two
figures were deliberately not stored — Coinvest's €44.6m, which it describes as co-invested with
partners rather than its own deployed capital, and D3's "$50m", which is a combined total for two
funds.

**Every new source URL was link-checked**, and the one that did not resolve was deleted rather
than published: Varangians' €9.1m close had a single source, which now returns 404. That is why
the count is 23 and not 24.

**No probe rows in production this time.** The previous pass inserted a test company and a
scheduled deploy picked it up; this pass used fixtures and proved idempotency by checking that
every replay guard is closed. Tests 59/59.

## 1 November 2026 (later) — the Tech Horizons identity, and rollback finished properly

**Resolved on a registration number.** `techhorizons.eu` prints `RCS Luxembourg B282214`;
the register's entry for B282214 runs Presto GP III Sàrl (Dec 2023) → Presto Tech Horizons
GP Sàrl (Oct 2024) → Tech Horizons GP Sàrl (Apr 2026). The Prague-launched "Presto Tech
Horizons" and the Luxembourg "Tech Horizons" are one organisation; the fund vehicle was
formerly Presto Ventures III SCSp, which matches the launch coverage calling it Presto
Ventures' third fund. Domicile Luxembourg (Capellen), office Prague, CSG the anchor
investor. Vehicle renamed to `Tech Horizons SCSp`.

**Two figures were wrong in ways the identity question had hidden.** The €150M was sourced
to an article about *Keen Venture Partners'* €150M first close. The €300K–€3M ticket range
is contradicted by the manager's own €1M–€5M. Both corrected; counts unchanged at
118 / 102 / 207. The manager's ten published portfolio companies were deliberately **not**
added: that is research, not correction.

**Rollback.** The unscoped `retired_kind` update is replaced with exact ids and
expected-current-value guards. It would have touched `fa0fec40`, which the *coverage* pass
retired at 18:39 — and would then have failed `retired_kind_with_retirement`. A provenance
finding behind it: **there is no trigger on these tables**, so `updated_at` moves only when
a statement sets it, and `788055c2`'s equals its `created_at` despite a later update — so
nothing in the database says which pass retired it. Marked unavailable.

New manifest `README-investor-rollback-manifest-2026-11-01-coverage-and-correction.md`
covers the 18:43 coverage pass (107 metrics, 68 vehicles, 63 log rows, 1 fund position,
2 redirects, every update with a before-image) and the 21:05 correction pass (5 rows, all
complete). Passes A and B are declared to have no exact-id manifest. The dependency check
immediately caught a real cross-pass reference. Scenario A (original checkpoint) and
scenario B (selective, today) are now distinguished everywhere, because in B the three
pass-C migrations must not be reverted at all.

**Two constraints now enforce what prose could not**: a composite FK tying a metric's
vehicle to its own investor, and `attribution_status` with a CHECK that an unresolved
figure cannot be `is_current`. Proven by statements expected to fail; nothing written.
`db/schema.sql` is caught up on the three migrations it had missed.

Tests **48/48** — up from 41, one of which had been failing on the committed tree since the
coverage pass regenerated the ledger and dropped its manifest pointer.
