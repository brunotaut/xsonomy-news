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

### 2026-11-02 — events database expanded without an upper date cutoff

Nazar removed the 1 November 2027 limit. Current canonical data is `research-agent/events/european-events.json`: 72 records, comprising 57 dated events across 20 countries and 15 undated watch items, with 90 source observations. Added 8 confirmed editions and 7 watch items. Latest dated edition is INTERGEO Hamburg, 11–13 September 2029; this is not a collection boundary. ISE 2027 is admitted after its former window-only exclusion. INTERGEO 2028 stays undated because a later organiser partnership superseded the old Frankfurt plan. Research runs now permit null `window_end` for open-ended discovery; original v1 remains historical. Migration, idempotent expansion, validation and detailed sources committed. No frontend work.

### 2026-11-02 — European events research module (data only)

Created and populated `ecosystem_events`, `ecosystem_event_sources`, and `ecosystem_event_research_runs`; server-only `v_ecosystem_events`. Research window 2 Nov 2026–1 Nov 2027: 49 dated events in 19 countries (27 core, 22 adjacent), 8 undated watch items, 72 source observations. Migration and idempotent import are in `research-agent/events/` and `db/migrations/20261102_ecosystem_events.sql`; schema mirrored in `db/schema.sql`. Dry-run rollback passed, then live counts, date bounds, provenance and access controls verified. RLS enabled with no anonymous/authenticated grants. No website UI or publication change. This is a broad initial research edition, not an exhaustive calendar; unknown dates remain null. Full field dictionary, source decisions and coverage gaps: `research-agent/events/README.md`. Investment research and frozen snapshots untouched.

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

### 2026-11-12 — Landscape email subscriptions

Added email-only “Subscribe to updates” in the map, Events and Insights headers. A public `landscape-subscribe` Edge Function verifies a short-lived signed proof of work, a bot-trap field, explicit versioned signup consent and an atomic database quota (20/IP/hour, 3/email/hour, 200/day). It normalises and deduplicates email addresses without revealing whether an address already exists. Private `landscape_subscribers` stores the email and consent; `landscape_subscription_requests` holds short-lived hashed rate-limit identifiers and single-use challenge IDs. RLS is enabled with public/authenticated table and RPC permissions revoked; only the server role can save signups. No service key reaches the browser. The list is separate from the news digest and no campaign emails or new schedules were introduced. Privacy/removal instructions are beside the form.

Validation: 113 frontend and 180 backend tests pass, including private access, consent, replay binding, duplicate addresses, quotas, signed/aged challenge verification, bot trap and expired challenges. Live schema permissions verified. Supabase advisor notices that these private tables have no RLS policies are expected: client access is deliberately denied.
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

## 1 November 2026 (later still) — resolver re-verified, and non-aerial batch 2 prepared

**The resolver fix needed no work.** A repeat brief asked for it; it was already applied and
active (commit `55a95f1`). Re-checked rather than assumed: `scripts/resolve-entities.mjs`
reads `companies.publication_status` and `company_relationships` and calls
`buildSuccessorMap`, and `scripts/test/resolve-mergers.test.mjs` passes 14/14 inside a suite
of **48/48**. No code change was needed and none was made.

**Non-aerial batch 2 is prepared and NOT applied.** The candidate set is **7** — batch 1's
eight holds minus Katana — and nothing new has appeared: UAV 1,416 / Other 410 still match
batch 1's applied figures. Verdict **6 ready, 1 held**, across two separately runnable
transactions so group B can be declined without blocking group A.

- **Dire WOLF is now fully sourced** where it was a bare model seed: BLADE (formerly HDT
  Global), a six-wheeled diesel-electric hybrid logistics UGV derived from WOLF-X, put to
  the U.S. Army's Project Sustainment effort in July 2026.
- **Ghost Shark** is Anduril's XL-AUV for the Royal Australian Navy, not Albacore's —
  Albacore's own vehicle is **Ghostfin**, a separate record. Underwater either way, so the
  category moves and the ownership fix is held.
- **MMCM, rMCM and XLUUV** are two programmes and a class term. Not products — but not
  aerial either, so the category is wrong today whatever is decided about the records.
- **rMCM carries a third error:** its `surface-usv` row is wrong, not just unsourced. The
  programme delivers **crewed** vessels that carry uncrewed systems. The row is deleted.
- **Exail A27 stays held.** Exail's AUV range is A9-M, A18-M, A6K-M and Ulyx; no source
  names an A27. It is the one record whose *category* is also unsupported.

**The more useful finding: the editorial flag count has been lying.** A catalogue-wide
search for `verify category` returns **31** rows when only **5** are genuinely open. A fix
that quotes the instruction it retires re-creates the searchable string, so the population
can never shrink — the Exail pass did this to DriX and DriX O-16, and my own first draft of
the cleanup did it to 26 more rows. The dry run caught it by reporting rows still stale
after an update that had run. Every replacement note now contains neither phrase; after all
three transactions a search for either returns **zero**.

**Validation.** Three dry runs, all exactly as predicted, database confirmed unchanged
afterwards. **The rollback is proven, not asserted:** applied forward and reversed inside
one transaction and compared against a before-snapshot — 0 taxonomy rows differing, 0
missing, 11,133 = 11,133, 0 category differences, 0 redirect differences. That covers the
regexp inverse on six notes and the delete-and-re-insert of rMCM's row with its original
`option_id`. Nothing was written to production.

**Closed:** the "Hunter WOLF / WOLF-X / Dire WOLF cluster" is not a duplicate problem — the
sources show three distinct vehicles from one maker.

**A read-only check worth recording.** The merger edge population has grown since the
resolver fix — **9 `merged_with` edges, not 7** — because the coverage pass merged
`JISR → JISR Institute` and `Kara Dag Technologies → Kara Dag`. **The policy covers both
with no change:** each retired draft has exactly one live successor and resolves to it,
where the original bug would have left both capturing matches under their retired names.
Current outcomes: four **live** sources keep their keys (EADS, BlueHalo, AAI Corporation,
WB Electronics — corporate history, not retirements); ECA Group / Infotron, JISR and Kara
Dag Technologies each resolve to their single live successor; `DefSecIntel · Origin
Robotics` has **two** live successors, so it owns no index key at all. That is the general
rule working, rather than the ECA case having been special-cased.

## 1 November 2026 — non-aerial batch 2: the authorised subset applied

**43 rows changed, three transactions, deployed and verified live.** The authorised subset
only: the prepared TX A was **not** run as written (LUNA-2 excluded, so a two-record TX A′
replaced it) and TX B was **not** run at all. Report:
`research-agent/reports/2026-11-01-non-aerial-product-batch-2-applied.md`.

**Order mattered, and it was the opposite of the obvious one.** TX T's first statement
rewrites every note containing `not an aerial system` on a record no longer categorised
UAV. Ghost Shark carries exactly that note and was being moved out of UAV — so had the
category fix run first, Ghost Shark would have been swept into the generic rewrite and lost
the note written for it. TX T ran first, while Ghost Shark was still out of its reach.

**Dire WOLF and Ghost Shark** → Other, old URLs preserved by redirect. Four of Dire WOLF's
five seed rows upgraded to `web`/`high`; the fifth, `control`, is **not**, because no source
states the control mode.

**Ghost Shark's maker was wrong and the record's own source says why.** It was attributed to
Albacore, whose site names exactly one vehicle — Ghostfin. Its single `source_urls` entry is
a dronexl article *about Albacore's Ghostfin*: the record was seeded from a piece about a
different vehicle with a similar name and the company came along with it. Corrected to
**Anduril** at both ends, role unchanged. All 17 article links preserved, and they
corroborate Anduril unanimously. Ghostfin kept separate. **The stale `source_urls` was not
authorised and was not changed — the taxonomy note now says so in as many words,** and the
one-statement fix is in the report. I also **withdrew a claim of my own**: the batch 2
review said "Project SEA 1200", which Anduril's and the Australian Department of Defence's
own material did not confirm, so it appears nowhere in the data.

**Exail A27 unpublished** (`live → draft`). Nothing deleted — record, 4 taxonomy rows, Exail
link, article link and sources all verified surviving. **A hard delete would have been
destructive:** five of the six foreign keys into `products` are `ON DELETE CASCADE`.

**The flag count: 31 → 4.** The four left are LUNA-2, MMCM, rMCM and XLUUV, every one
pending by instruction — a pending record keeps its flag, which is why it is 4 and not 0.
Three upgrades were **refused**, each named: A-18M `mission_military = isr` (mine
countermeasures is not ISR), K-Ster `control = tethered`, Dire WOLF `control`.

**Counts.** Live UAV 1,416 → **1,413** (two moved, A27 unpublished — three, not two), Other
410 → **412**, total 3,522 → **3,521**, redirects 95 → **97**, taxonomy unchanged at 11,133.
Tests: catalogue **75/75**, news **48/48**.

**Validation.** Two dry runs inside `begin … rollback`. All 43 affected-row counts matched;
the round trip diffed to **0 differences** across `product_taxonomy`, `products`,
`product_companies` and `slug_redirects`. Three of my *predicted* figures were wrong and the
measurements were right — corrected from the data, not the other way round.

### Prepared, not applied: retire MMCM, rMCM and XLUUV

`research-agent/reports/2026-11-01-mmcm-rmcm-xluuv-retirement-proposal.md`.
`live → draft` on all three, retirement notes on MMCM's and XLUUV's domain rows, and
**deletion of rMCM's `surface-usv` row** — false, not merely unsourced, since the programme
delivers twelve *crewed* vessels. Eleven rows. Nothing else deleted.

**The provenance is the finding.** MMCM, rMCM **and Exail A27** all came from **one
article** — opex360, 2026-08-04, on French mine-warfare drone orders. Two programme names
and one invented product from a single extraction. XLUUV is the same failure in its other
form: a **class term** read as a model name. That is a property of the source shape, not of
these four records — an article naming several programmes, vendors and vehicles in one
breath is where this class of error comes from.

**A correction to the batch 2 review:** it said `product_taxonomy` has "no timestamp at
all". It has no `updated_at`, but it does carry a `created_at` set by a column default
rather than a trigger — so a deleted taxonomy row's creation time *can* be restored on
re-insert, and the retirement rollback now does.

## 1 November 2026 — batch 2 closed out: four decisions applied, flag count zero

**13 rows, three transactions, deployed and verified.** Report:
`research-agent/reports/2026-11-01-batch-2-decisions-applied.md`.

**MMCM, rMCM and XLUUV retired** (`live → draft`). The prepared TX B, which would have
recategorised them, is superseded and not run. **Nothing deleted but rMCM's false row** —
five of the six foreign keys into `products` are `ON DELETE CASCADE`, so a hard delete
would have taken three article links and seven taxonomy rows with it. Verified surviving:
3 article links, XLUUV's 5 taxonomy rows, `article_products` unchanged at 10,284.

**rMCM's `surface-usv` row deleted.** Wrong, not merely unsourced: the programme delivers
twelve *crewed* vessels that carry uncrewed systems. rMCM now carries no domain assertion
at all, which is the honest state — and worth doing independently of the retirement,
because a false claim is worth removing whether or not the record is published.

**Ghost Shark's sources corrected**, and the before-value *is* the explanation of the
original error: its only source was an article about **Albacore's Ghostfin**, a different
vehicle with a similar name, so when the record was seeded the company came along with it.
Replaced with anduril.com and defence.gov.au — the two sources the maker correction rests
on.

**LUNA-2 → Other, kept published.** My call, decided by two checks rather than a view.
It is the **only `space-orbital` record in the catalogue**, so this was never a scope policy
— one record to place; a guard in the SQL asserts that count is 1 and **aborts if it is
not**, so the next pass cannot quietly assume. And **Dot**, which raised the identical
doubt in batch 1, is already `Other`/`live` — the house answer existed. Not retired,
because unlike Exail A27 it demonstrably exists (ASELSAN's own announcement, SpaceX launch
30 March 2026, a `web`/`high` row with a real citation); unpublishing a well-sourced real
product to dodge a scope question trades a small ambiguity for a plain inaccuracy.

**Counts.** Live UAV 1,413 → **1,409** (three retired, one moved), Other 412 → **413**,
total 3,521 → **3,518**, drafts 111 → **115**, redirects 97 → **98**.

### The flag count reached zero, and honestly

31 at the start of the day → 4 after the applied batch → **0**. Every flagged record was
**answered or retired**, not papered over. The defect that kept the number at 31 while 26
of those rows were already correct was fixes that quoted the instruction they retired; no
note written today contains either phrase.

**Validation.** Forward and round-trip dry run; all 13 counts matched and **every predicted
figure matched** this time. The round trip diffed to 0 differences across five tables —
`product_taxonomy` **including `created_at`**, `products` **including `source_urls`**,
`product_companies`, `article_products` and `slug_redirects`. Two things this proved that
the morning's run could not: the re-insert of rMCM's deleted row restored its original
`created_at` exactly, and the claim that retirement preserves article links is now
measured rather than asserted. Tests **75/75** and **48/48**.

**Still open, and not answered by anything here:** Cassio S and DA 15-N.ISS — a *piloted*
light aircraft and a servo *actuator*, both categorised `Other` yet holding an **aerial**
domain row. They need a ruling on whether a domain row describes what a product **is** or
what it **flies on**, which affects more than two records.

**The failure mode, which is the part worth keeping.** All four bad records in this batch
share one shape. MMCM, rMCM **and Exail A27** came from **one article** — opex360,
2026-08-04, on French mine-warfare drone orders. XLUUV is a **class term** read as a model
name. Ghost Shark was seeded off an article about a **different vehicle with a similar
name**. An article that names several programmes, vendors and vehicles in one breath, read
as if each name were a product.

**A residual limb, found while verifying the fix.** Chasing a `dronexl.co` link on the
Ghost Shark page — which turned out to be a *different*, correct article about Anduril —
showed that the **original wrong source is still attached as a news link**, and to two
other products: Ghostfin (correct, it is Albacore's article), Ghost Shark (spurious, the
same name confusion) and MAGURA V7 (doubtful). So the misattribution had two limbs:
`company_id` and `source_urls`, now fixed, and an article link, which is not. Removing it
was not authorised, so it is reported with ready SQL rather than changed.

That also corrects a count of mine: Ghost Shark's "17 article links, which corroborate
Anduril unanimously" was **16 that corroborate it and 1 that caused the problem.** The
conclusion stands; the arithmetic was too generous.

**And the number that matters more than the flag count:** live UAV products whose every
`domain` row is non-aerial is now **0**. That is the condition this work existed to fix,
measured directly rather than through the flag text.

## 1 November 2026 — the Tech Horizons €150M was typed as a target it never claimed

**One row.** `fund_size_target` → **`fund_size_stated`**.

The scope note already read "an announced launch size, not a reported close" — but the
*type* said target, and that type renders on the live card as **"Fund size (announced
target)"**. The prose and the published label disagreed, and the label was making the
stronger claim.

I rechecked the cited source instead of reasoning from the note. Vestbee says Presto
Ventures **"has launched a €150 million Presto Tech Horizons fund"** — and uses **no target
language anywhere**: no "target", no "aims to raise", no commitment, first-close or raised
figure. A stated size. So the type was wrong, not the wording. It is not a close either —
the manager publishes no fund size — so `fund_close_announced` would have been the opposite
error.

**Two things I did not change, both after checking rather than assuming.** `display_en`
stays "€150M announced at launch", because it never claimed a target and there was nothing
to align. And `scope_en` keeps `EUR150m` rather than `€150m`: the corpus convention is the
symbol in `display_en` (33 of 41 target rows) and the **word** in `scope_en` (only 1 of 26
stated rows uses the symbol), so "aligning" it would have broken the convention.

Coverage did not move — 207 observations and 118 investors, unchanged, because one
observation was re-typed rather than added or withdrawn. `fund_size_target` 41 → 40,
`fund_size_stated` 26 → 27. No code change: `fund_size_stated` already has a label and a
card slot, and the standing test that every storable type has exactly one of each still
passes. The complete before-image and reversal SQL are in the closeout report's addendum.

## 1 November 2026 — stopping the extraction errors at source

**The five bad rows had one cause, and the decision cache proves it.** Every one is
`decision='created', reason='llm'` in `tag_resolutions` — all through the LLM gate, none
through name matching or the blocklist. **Ghost Shark, Ghostfin and the Albacore company
share a single timestamp**, `2026-08-28 17:12:28.084217+00`: one batched gate call from one
article, and the only company in the batch was Albacore. Co-occurrence became ownership,
visible in the data.

**Why the gate could not have known better.** Its instruction was *"judge from the name and
the article titles it appeared in"* — and `articles` **has no body column**. The body is
fetched at analysis time and thrown away, so by the time the gate ran it was deciding what
a name *denoted* from a name and a headline. A programme acronym and a model designation
look identical from there. Then `publication_status: 'live'` on insert, unreviewed.

**The fix is three rules in code, not a prompt and not a blacklist** (nothing matches on
any of the five names):

1. **Positive classification** — `kind` must be exactly `product`. Programme, class,
   family, contract and organisation are refused, and an *absent or unrecognised* kind goes
   to review, so the default is never "publish".
2. **Quote verification** — the model returns a verbatim span and code checks it is really
   in the article text.
3. **Joint evidence** — a maker is accepted only when **one span names both the product and
   the maker**. The product is still created; only the ownership claim is dropped.

Evidence is captured and verified **at analysis time, where the body still exists**, and
only the verdict is stored (one additive column, `articles.entity_evidence`). Unverified
candidates become `publication_status='review'` — kept, reviewable, and unreachable by the
site build. A retired artefact can no longer be recreated under a differently worded name.

**Two of my own counterexample tests failed, and both bugs were in the fix.**
`mentionsName` used a plain substring, so **"Ghostfin" matched the name "Ghost Shark"**
through the shared "ghost" — the exact error class the module exists to prevent,
reproduced inside the prevention. And a ≥4-character token floor silently dropped **"BAE"**.
Both fixed, both now pinned by their own tests. 70/70 passing.

**Read-only comparison against the real sources** (I could not call the model — no `.env`,
the key lives only in CI — so this exercised the model-free half): on the real dronexl
article, Ghost Shark is mentioned but **no span names both it and Albacore, so the maker is
dropped**. The misattribution is prevented on the actual article — which, incidentally,
says "**Anduril's** Ghost Shark". Body available on **15 of 16** recent articles (94%); the
one failure is `defence-blog.com`, the source Dire WOLF came from, so ~6% of articles will
hold new products for review.

**A correction to the batch 2 review.** It said *"No source names an A27"*. **Wrong.** The
opex360 article says *"trois drones sous-marins [AUV] **Exail A27 [ou A-18M]**"* — a
bracketed alternative designation for the A-18M. Unpublishing it was still right, but
because it is an **alias of an existing product**, not because it does not exist. And rule 2
would *not* have caught it, since the quote verifies — an honest limit of the fix.

**Activation: activated, not yet exercised.** `ingest-and-deploy.yml` runs `ingest` then
`resolve` in one job, so new articles are analysed and resolved in a single pass. I have
**not** seen a production run and will not claim one. Before that run: **719 backlog
articles carry no evidence**, so **1,041 genuinely new product names would be held for
review** — safe, nothing reaches the site, but the catalogue stops auto-growing from the
backlog. `analyze-backfill.mjs --missing-evidence` fills it, writing *only*
`entity_evidence` for names already stored. Not run: that is a production ingestion pass.

### Reviewed: the Albacore article links are all supported — I was wrong

The batch 2 report called Ghost Shark's link "spurious" and MAGURA V7's "doubtful". Reading
the article, **all three are supported.** Ghost Shark gets a full comparison paragraph
(A$1.7bn contract, Royal Australian Navy, Sydney factory, contrasted with Albacore's
cheaper approach); Magura V7 is a specific factual claim in the business-case section.
**Zero corrections proposed.** I had inferred the error from Ghost Shark not being the
article's main subject — exactly the inference to avoid. A news link means "this article
discusses this product"; a source URL means "this is where the record's facts come from".
The same URL can be the first and not the second.

### Prepared, not applied: `domain` means what the product *is*

Not a semantics problem. **1,009 of the 1,055 domain rows are `source='rule'`,
`note='category=UAV'`** — a mechanical copy of `products.category`, not an assertion about
the product. Only 46 were ever observed. And **zero** Sensor, Counter-UAS, Effector or
Software products carry a domain row: components are not tagged at all.

So `domain` means what the product is, with *absence* as the convention for a component —
consistent across 1,053 of 1,055 rows. **Cassio S and DA 15-N.ISS are stale derivations**:
derived when the category was UAV, and left behind when it was corrected to `Other`. The
same shape as the flag count that kept lying — a derived value outliving its basis.

Proposed: delete those 2 rows. Dry-run clean, round trip exact including `created_at`
(read from the live rows, not assumed). Both products then carry no taxonomy at all, which
is consistent but worth knowing. **No live code writes `product_taxonomy`**, so nothing
regenerates them — but nothing keeps derivations in step with a category change either, and
the report gives a standing check for that.

## 2 November 2026 — the safeguards reviewed, two defects found and fixed

**Both criticisms of my fix were correct.** Reported here because they mattered.

**1. Naming both sides is not a relationship.** Reproduced on the real article: given the
wider dronexl passage as *one span*, my maker rule returned **"Albacore"** for Ghost Shark
— the original error — and accepted a **customer** ("the Navy ordered the Ghost Shark") as a
manufacturer. My 1 November claim that the misattribution was "prevented on the real
article" was **wrong**: it was prevented by a sentence splitter cutting between the two
names, not by the rule.

Now a maker needs an explicit making relationship: the names within 120 characters, the
text *between* them classified as manufacture (possessive, "built by", maker verb,
adjacency), and a **disqualifying frame beats any positive cue** — comparison, competitor,
customer, operator, purchaser, partner, integrator. The accepted cue is stored, so a
published maker link records which relationship justified it.

Two more defects fell out of the counterexamples. **`"Boeing's Orca and Anduril's Ghost
Shark"` made Boeing the maker of Ghost Shark** — the possessive belonged to the intervening
product; cues are now anchored. And **the rule was English-only**: `"Inspector 125 fournis
par Exail"` started returning null, silently dropping makers for every French, German and
Italian source. Now covers FR/DE/IT/ES.

**2. Collapsing punctuation does not equate an acronym with its expansion.** Also right.
Measured: the guard caught `M.M.C.M.` and `mm cm` but **missed both `MMCM programme` and
`Maritime Mine Counter Measures`**. My claim that it stopped differently worded duplicates
was wrong. Acronym matching added, both directions, with and without connectives. **Hits go
to review, never refusal**, and are labelled: a name collision is near-certain, an **acronym
match is plausible, not proven**. A *phonetic* acronym is still not caught — XLUUV's
initials are ELUUV — and that limit is written down rather than hidden.

**Tests 100/100**, up from 70.

### The production run has not happened, and something else has been broken for a week

The first qualifying run is **05:00 UTC today**; at the time of writing it was ~5 hours
away. My push *did* trigger the workflow, but ingest and resolve both skip on a code push,
so **deployment happened and execution did not**. There is no run URL to give.

**Separately: the resolver has not stamped an article since 26 October.** Not the model
budget — 47 of the 150 most recent unresolved articles need no model call at all and would
have been stamped. It wrote nothing. I cannot see why: there is no `gh` CLI and no Actions
access here, so the run log — the one piece of evidence that matters — is out of reach.
**That log is the thing to read**, and it covers both the new code and the week-old failure.

### Real-model evaluation and evidence backfill: blocked, not done

Both need `ANTHROPIC_API_KEY`, which exists only as a GitHub secret, and I can neither read
it nor dispatch a workflow. **Zero model spend; I am not claiming validation.** Instead I
built them to be run by someone who can: `extraction-validate.yml` with `eval`,
`backfill-dry`, `backfill-pilot` and `backfill` modes, every one gated on `npm test`. The
eval is read-only by construction and a test asserts that against the code, not the
comments.

Backfill safety verified and pinned by tests: writes restricted to
`articles.entity_evidence`, nothing else touched, dry mode returns before the write.
Re-measured backlog: **635 articles** (719 counted articles with no products), 2,001
distinct tags, 1,039 genuinely new. **Attempted 0, completed 0, failed 0.**

One consequence worth knowing: once resolve runs, a held candidate gets cached as `created`
pointing at a `review` product, so a later backfill will **not** retry or promote it. That
is correct, but review products will accumulate and need a deliberate pass — a separate
proposal, not attempted.

### Applied: the two stale taxonomy rows are gone

Cassio S and DA 15-N.ISS no longer assert an aerial-UAV domain. `product_taxonomy`
11,132 → **11,130**; aerial rows on non-UAV products **2 → 0**. Both products unchanged
otherwise — `Other`/`live`, companies and article links intact. Round trip proven before
applying, including `created_at`.

### And a tripwire so it cannot happen quietly again

`npm run check:taxonomy` flags rule-derived rows whose recorded basis contradicts the
product's current category, wired into the daily workflow as a **non-blocking** step.
Reports only — it never deletes and never touches an observed row, because an observed row
is research and a category is not grounds to overrule it. Tested against both a stale
derivation and HALIA, the legitimately amphibious record that must *not* be flagged.

## 2 November 2026 — the resolver stall, diagnosed from the logs

**First, a correction.** Yesterday's report said there was "no Actions access" and treated
the run logs as unreachable. **That was wrong, and it cost a day.** Both repositories are
**public**, so the Actions REST API answers with no credential at all. I had inferred
unavailability from one missing binary (`gh`) instead of trying the API.

### Six consecutive failures, and the database agrees

`ingest-and-deploy.yml`, scheduled runs:

| Started | Commit | Result |
|---|---|---|
| 1 Nov 11:37 | `796dc5e` | **failure** |
| 31 Oct · 30 Oct · 29 Oct · 28 Oct | | **failure** |
| **27 Oct 10:09** | `dd22e18` | **failure — first** |
| **26 Oct 10:42** | `fb8036e` | success — last |

`max(entities_resolved_at)` is **26 Oct 10:45:30**, three minutes after that successful run
started. The logs and the data corroborate each other exactly.

**Step level, identical on the first and last failure:** ingest **succeeded**, resolve
**failed**, and build, the Pages upload and the deploy job were all **skipped** behind it.
So it was not skipped, not a timeout, and not a run that completed without progress —
**resolve failed outright.**

**It also killed the daily rebuild.** The build sits behind the failing step, so no
scheduled run has rebuilt the site since 27 October. The site was never stale only because
pushes trigger the same workflow — **73 successful push runs** in that window kept it
current. The daily path was dead and ordinary activity hid it.

### The cause

```js
export function matchProduct(tag, index) {
  const hit = index.exact.get(tag.toLowerCase());
  if (hit) return gate(tag, { id: hit, reason: "exact" }, index, context);
  //                                                            ^^^^^^^ not a parameter
```

`ReferenceError: context is not defined`, thrown out of the resolve step. It stayed hidden
for two days because it only fires on a tag that *both* exactly matches an existing product
name *and* is not already cached — and the 26 October run used a commit that predates the
bug, verified with `git merge-base`. **55 such tags are still pending**, which is why it
would fire again today.

**It is already fixed.** Commit `55a95f1` (1 Nov 18:08 UTC) removed the bad call as a side
effect. Every failing run predates that fix, and **no scheduled run has happened since it
landed** — so the correction is deployed and has never been exercised. The next cron is its
first test. No new fix was needed.

### What let it through: no test at all

**`matchProduct` had zero coverage.** One call with an exact hit would have caught it
immediately. Added `resolve-product-match.test.mjs` — 7 tests including an arity assertion
— and **mutation-checked it**: reintroducing the original line fails 4 tests with the exact
`ReferenceError`. **107/107** with the file restored.

### Still blocked, and now precisely

Read access to Actions works unauthenticated; **`workflow_dispatch` does not** —
`POST …/dispatches` returns **401 Requires authentication**. `extraction-validate.yml` has
**0 runs** and I am not presenting it as a result. **Zero model spend.**

To unblock: open
`https://github.com/brunotaut/xsonomy-news/actions/workflows/extraction-validate.yml`,
press **Run workflow**, and pick `eval` → `backfill-dry` → `backfill-pilot` (10) →
`backfill`. Every mode runs the tests first.

### One decision before the next cron

**Because the resolver now works, the next run will start consuming the
evidence-incomplete backlog** — 635 articles with no evidence, whose new product names
become `review` rows that a later backfill will *not* retry. Either pause only the resolve
step for a day and backfill first, or let it run and reconcile with the retry proposal.
**I applied neither:** re-disabling resolve the moment it recovers should be your call, not
a side effect of mine.

Also offered and not taken: `if: always()` on the build step, so a resolver bug can never
freeze the daily rebuild again while still failing the run visibly.

## 2026-11-02 — Extraction evaluation hardened; the first green run was hiding failures

The first production eval run ([41438189153](https://github.com/brunotaut/xsonomy-news/actions/runs/41438189153),
commit `cc2c6b8`) finished green while one required article was never parsed and
three required cases were never tested. Four causes, all confirmed:

- **"Unparseable response" was truncation.** `max_tokens` was 1024; an
  evidence-heavy French article needs ~900–1,200 output tokens for its evidence
  array alone, so the JSON was cut off mid-object. `stop_reason` was never read,
  so truncation looked identical to malformed output. Now 4096 (retry 8192),
  with `empty_reply` / `no_json_object` / `invalid_json` / `truncated_json` /
  `schema_violation` reported separately, a shape check, and a bounded retry for
  the recoverable cases only. A malformed reply is never a confident empty
  extraction again.
- **The XLUUV article had two body bugs.** The junk-class strip ran before
  region selection and, being non-greedy, deleted the opening `<article>` tag —
  so the whole page was kept and a leading rail of *other* headlines supplied
  DroneSentry-X Mk2, Mission Master SP, FUSE and Chaparral. Separately, the bare
  word `comments` was a cut marker, so "…for OCEANEERING, comments:" truncated
  the real body at 2,292 of 5,018 characters, mid-quote. Region selection now
  runs first and cut markers match only at the start of a line. The body is now
  the complete story with none of the four rail products.
- **Nine real manufacturer-pattern gaps** (relative clause, "a product of",
  appositive, "said its", "is the manufacturer of", `X-built`/`X-made`), found
  by measuring a battery of phrasings rather than by looking at the two named
  pairs. Fixed: 0 gaps, 0 leaks, with customers, operators, competitors,
  partners and integrators still refused.
- **The evaluation could not fail.** It counted errors and exited 0, and its
  Ghost Shark expectation was inverted — a *missing* maker printed "PREVENTED"
  while the correct `maker=Anduril` printed as a failure.

**Supply is no longer manufacture.** `supplies` / `delivers` / `provides` /
`integrates` and their French, Italian, Spanish and German equivalents now give
a `supply_only` cue that assigns **no** maker. This deliberately reverses an
earlier change of mine that made `fournis par Exail` ("supplied by") assign
Exail as maker; one test was updated on purpose, with the reason in the test.

**Ghostfin → Albacore is a documented recall limit, not a bug.** Albacore does
build Ghostfin, but the article only says so across sentences; all three spans
naming both describe publishing specs, crediting a battery design and naming a
use case. Cross-sentence inference is exactly what attached Albacore to Ghost
Shark originally, so the one-span rule stays and the miss is counted in maker
recall instead of hidden in a "prevented" total.

**`defence-blog.com` blocks every non-browser client** (403 to plain `curl` too)
while its robots.txt disallows only `/wp-admin/`. That article's body has never
been available, so the Dire WOLF record came from its headline alone. No browser
masquerade was used; the case now asserts safe degradation. Relatedly, only the
real body counts as article text now — a headline-only article yields `review`,
not live.

The evaluation reports PASS/FAIL/BLOCKED per case with exit codes 0/1/2/3,
measures retention and maker precision/recall separately, asserts the four
contamination names absent, and writes `eval-results.json` uploaded on failure
too. `set -o pipefail` was needed because `| tee` would otherwise have masked a
failing eval — the same defect being repaired.

**134 tests pass** (was 107); 27 new in `scripts/test/extraction-robustness.test.mjs`.
Verified end-to-end against a mocked model, including the truncation retry, and
a mock that attributes Ghost Shark to Albacore correctly exits 1. **Zero
database writes** — live 3,518, review 0, taxonomy 11,130, evidence 0, pending
719, `max(entities_resolved_at)` still 2026-10-26, identical to the start.

**Backfill is NOT ready.** It needs a new read-only eval run on the new commit,
and authenticated dispatch is unavailable here (`POST .../dispatches` → 401).
Run `extraction-validate.yml` with `mode=eval`, `sample=12`. Report:
`research-agent/reports/2026-11-02-extraction-eval-hardening.md`.


### Decision (2026-11-02): let the cron run, accept review rows

What that run does, measured beforehand:

- It fetches the **newest 150** unresolved articles (`RESOLVE_MAX`, default 150),
  ordered `published_at desc`.
- The LLM gate vets at most **40 new product names and 40 new company names per
  run** (`LLM_GATE_MAX`), so cost and blast radius are bounded.
- No article has stored `entity_evidence` yet (0 of 719), so every new product
  this run creates lands as **`review`**, not live, with reason
  `no_evidence_captured`. That is the accepted trade of this decision.
- **Nothing is silently dropped.** A tag with no verdict leaves the article
  `complete = false`, so it is not stamped `entities_resolved_at` and comes back
  next run. Names beyond the 40-per-run cap are deferred, not lost.

Once those candidates are cached as `review`, a later evidence backfill will not
retry them, so a separate exact-ID retry/promotion proposal will be prepared
after the run — prepared, not executed.

### Finding (2026-11-02): the resolve backlog is chronic, not the outage

The 719 pending articles are **not** six days of outage. **458 of them predate
27 October**, and the oldest pending article is from **30 June 2026**; only 261
fall in the outage window. Because `fetchUnresolvedArticles` orders newest-first
and the gate decides only ~40 names per run while new articles keep arriving,
the June–October tail sits at the back of the queue and may never be reached.

Pre-existing and unrelated to the resolver stall or to the extraction work — no
action taken. It needs its own decision: raise `LLM_GATE_MAX` / `RESOLVE_MAX`,
drain the old tail oldest-first in a one-off pass, or accept that old articles
go unlinked.

## 2026-11-02 (later) — The evaluation did its job: red, with six real findings

Run [41449704934](https://github.com/brunotaut/xsonomy-news/actions/runs/41449704934)
on `a9810f0` exited **1**. Unit tests passed, the eval failed, every backfill
step was skipped, and the diagnostics were still uploaded. This morning the same
situation came back green.

**Confirmed fixed, with proof.** The French article needed **1,236 output
tokens**; the old cap was 1,024 — the truncation diagnosis was exactly right,
and it parsed first time at 4,096 (`attempts: []`). The XLUUV article returned
only `CAMP` (programme) and `XLUUV` (class), both refused, with all four rail
names absent. Ghost Shark took **Anduril** via the possessive and never
Albacore.

**Six findings from the run, all fixed:**

1. **`normText` was destroying accents.** `NFKD` decomposed every accented
   letter and the punctuation strip then turned each combining mark into a
   *space*: `développé` → `de veloppe`, `confiée` → `confie e`, `conçu` →
   `conc u`. No pattern containing an accent could ever match, so French maker
   detection was partly dead — production dropped a correct manufacturer from
   "le capteur ELIT AI développé par Eviden". Marks are now folded away, which
   also makes matching accent-insensitive.
2. **A possessive on a name ending in s was missed.** The pattern required a
   literal `s` in the gap, so `Thales' Martlet` and `Kratos' Firejet` both lost
   a correct manufacturer. Two instances in sixteen articles.
3. **An appended photo gallery was supplying products.** breakingdefense.com
   tacks the same "PHOTOS: Farnborough 2026" block onto unrelated stories;
   A-400M, Sea King, JAS-39 Gripen, C-390 Millennium, Astore Levante and MV250
   all came from **captions**. The gallery was 36–45% of the extracted text.
4. **`&reg;` was never decoded**, so the body held `SkyGuardian&reg;` while the
   model quoted `SkyGuardian®`; the verbatim check failed and two real products
   went to review as `mention_not_found_in_source`. The entity map now covers
   the trademark, degree and accented-letter entities.
5. **MMCM and rMCM were created as products** — the two required failures. The
   model returned `kind=product` for a programme and a ship class while its own
   quotes said otherwise. The `kind` is now treated as a *claim* and verified
   against the quote: a type/class/programme/family marker beside the name, or
   award framing ("a été **confiée à** Thales"), sends it to **review**.
   Measured against all 78 product claims the real model made: the type rule
   flags exactly `rMCM` and `Ghadir` (both genuine classes) and the award rule
   flags exactly `MMCM`. **Zero false positives.**
6. **The Dire WOLF expectation was wrong, and so was I.** I wrote that
   defence-blog.com "has never been available" to the pipeline, concluding that
   from a local 403. It 403s plain curl from this machine but answers normally
   from CI — the run fetched 6,480 characters. The case now asserts the original
   intent (a legitimate product survives) with the degradation check only as a
   fallback.

Replaying the real model output through the fixed code: **all four required
cases pass.** 143 tests pass (was 136). The real evidence corpus is kept at
`scripts/test/fixtures/eval-run-41449704934.json` so an identity or maker rule
can be measured against real output instead of invented examples.

Cost of the run: **$0.0884** for 16 articles. No database writes.

Still open: of 45 maker claims the model made, 15 were assigned and 30 dropped.
Several drops are correct (contract awards, coreference like "the company's X"
where the company is not in the span), but a dropped claim still does **not**
force review, so the loss is invisible. That proposal remains Nazar's call.
Report: `research-agent/reports/2026-11-02-extraction-eval-hardening.md`.

## 2026-11-02 — company funding structure and source-verified pilot

Nazar authorised direct implementation after the coverage audit. Four additive tables and two service-only security-invoker views separate rounds from portfolio membership. Five 2026 rounds / 35 participations were imported after local PostgreSQL and production rollback dry runs; 29 minimally sourced investors added (118 -> 147). All 103 legacy relationship rows remain unchanged. Every company research status is partial; no total_funding is fabricated. See `research-agent/reports/2026-11-02-company-funding-pilot.md` for sources, semantics, validation and rollback. Catalogue integration is in the sister repo. No schedules, frozen snapshots or company publication gates changed. This is a new funding workstream, independent of the older landscape reconciliation batches in STATE.json.


### 2026-11-02 — primary-source funding histories and next-25 queue

Expanded five-company pilot from 5 to 24 financing events and 35 to 110 participations; 177 investors, 105 generic relationships (original 103 preserved). Applied `company_funding_history_event_types`; supports unknown dates, round extensions, credit facilities, lender/grantor roles and separate investor contributions. Final production rollback rehearsal passed before commit. 137 tests pass. See `research-agent/reports/2026-11-02-company-funding-history.md`, the versioned history manifest and next-25 queue. Coverage remains partial; queue companies have not been marked researched. Legacy research STATE and automation unchanged.


### 2026-11-02 — autonomous full database financing research

Nazar authorises the entire investment research programme without per-batch approvals. All 2,564 identities queued (567 published landscape first). FUNDING_STATE.json tracks this separately from legacy STATE.json. Expansion adds 44 primary-source events / 105 participations across 23 more companies; production 68 events / 215 participations / 235 investor profiles. Applied `company_funding_amount_qualifiers`; 146 news and 88 catalogue tests pass. See `research-agent/reports/2026-11-02-investment-research-programme.md`. Full programme remains in progress; no API spending or schedule changes.


### 2026-11-02 — public landscape discovery complete; further verified financing

Completed discovery queries for all 537 remaining public landscape companies, after 30 initial company investigations (all 567 now searched). Saved 7,068 unique candidate URLs under `research-agent/discovery/funding-landscape-2026-11-02/`; these remain explicitly unverified and are not imported as financial facts. Added 33 source-reviewed events across 26 further companies: production now 101 events / 54 companies / 306 participations / 287 investor profiles. PostgreSQL dry run and rollback passed before committed import; rerun/tests verify idempotency. Full database programme remains in progress; no-public-round conclusions have not been assigned from search absence. Autonomous continuation instructions are in `research-agent/instructions/INVESTMENT_RESEARCH_AUTONOMOUS.md`.


### 2026-11-02 — continuation enabled and current publication verified

Dedicated ChatGPT continuation enabled hourly, with no routine batch notifications and no changes to repository cron schedules. Its ID is stored privately in FUNDING_STATE.json for completion/pause handling. Released initial run lease after verifying successful catalogue deploy `4af6c23d3a0767138b07a7421234975f54a1fffc`: live JSON at 14:49 UTC contains 567 companies, 54 with 101 sourced events, 306 participations and 287 investor profiles. Every approved event has a source; funding view remains security-invoker with no anon read access. Full programme is still in progress.

## 2026-11-02 (later still) — CI never installed dependencies

Run [41484197287](https://github.com/brunotaut/xsonomy-news/actions/runs/41484197287) failed in
`npm test`: `company-funding.test.mjs` could not import `@electric-sql/pglite`.

Cause: until the company funding work, this repo had **no dependencies at all**, so no workflow
ever ran an install step — `npm test` worked straight off a bare checkout. `package.json` and
`package-lock.json` were both correct and committed; nothing was ever installed in CI.

Fix: `extraction-validate.yml` now runs `npm ci --include=dev` before `npm test`, with
`cache: npm` on `setup-node`. `--include=dev` is explicit so a `NODE_ENV=production` environment
cannot silently drop the devDependencies and reintroduce the failure. The funding tests are
untouched — none skipped, none removed.

Verified from a clean install: `rm -rf node_modules && npm ci --include=dev && npm test` →
**145 pass, 0 fail**, lockfile unchanged. The failure reproduces exactly without `node_modules`
(143 pass, 1 fail — that one file). No other workflow runs `npm test` or imports a package, so
none needed the step.

## 2026-11-02 (evening) — the evaluation is green, and backfill is ready

Run [41485716264](https://github.com/brunotaut/xsonomy-news/actions/runs/41485716264) on commit
`a3e5c05` (one commit past the CI fix `87ba9db`; that commit touched no extraction code, no tests
and no dependencies). **All four required cases PASS.** The eval step ran — not skipped.

**Bodies, which is what the last two failures were really about.** All 16 articles returned HTTP 200
with a real body, 1,221–8,578 chars. No fetch failures, no title mismatches. The XLUUV body is
2,248 chars with all four rail names absent. The breakingdefense gallery products are gone.
SkyGuardian and SeaGuardian now `create` rather than `review`, so the `&reg;` decode holds.

Retention: extracted 84 · created 72 · review 7 · rejected 5. Cost $0.0798.
**Zero writes**, verified by query, not by assumption: 0 products created or updated in the run
window, 0 articles analysed, `max(entities_resolved_at)` unchanged at 2026-10-26 10:45:30.

### The remaining defect is manufacturer recall, not precision

37 claims, 11 assigned, 26 dropped for no stated relation, **0 wrong makers**, 0 dropped as
supply-only. Measured against 73 real claims stored in `articles.entity_evidence`, the dominant
cause is **company name variants**: the model returns the full legal name (`General Atomics
Aeronautical Systems, Inc.`, `Kratos Defense & Security Solutions`, `Ondas Inc.`) while the article
uses the short form or acronym (`GA-ASI`, `Kratos'`, `Ondas'`). `mentionsName` fails, so the
relationship is never even tested. Secondary causes: announcement verbs (`reveals`, `announced`,
`introduced`) missing from `MAKER_VERB`; conjunction lists after one possessive (`Elistair's Safe-T
and Ligh-T` assigns only Safe-T); `from <firm>`; a long appositive bridge before `by`.

About half the drops are **correct** — coreference (`it`, `its`, `the company`), the maker absent
from the span, contract awards, purchases. Including a good one: *"Talon Avionics made the same
silence argument"*, where `made` is not manufacture.

### Why this does not block the backfill

`entity_evidence` stores `makerClaimed`, the verbatim quote and `quotedFromBody`, so the maker
decision is a pure function of data already on the row. Proven, not argued: replaying
`makerRelationship` over 24 stored production records offline reproduced 19 verdicts and **recovered
5 real manufacturers** the pre-fix 13:00 run had dropped — Sentrycs, Silvus Technologies, Ondas,
General Atomics and Malloy Aeronautics, four of them the bare-apostrophe possessive fixed earlier
today. A later rules improvement can therefore be replayed over stored evidence at **zero model cost
and without refetching a single body**. Backfilling now does not lock the loss in.

**Backfill is ready.** Sequence unchanged: `backfill-dry` → `backfill-pilot` (`pilot_size=10`) →
verify → `backfill` (`max_articles=100`, repeat). It writes `entity_evidence` only, and only for
product names already on the row.

### Also noticed

The daily pipeline ran at 13:00 UTC and wrote 46 analysed articles and 24 new products (23 live,
1 review) — on the pre-fix code. Pending resolution is now 765.

### Still Nazar's call

Whether a dropped ownership claim should force `review`. Whether to fix name-variant matching before
or after the backfill — it is precision-safe, since a relationship cue is still required, and
recoverable either way.

## 2026-11-02 (night) — the two defects the pilot exposed, fixed and measured

The evidence-backfill pilot (run [41488875093](https://github.com/brunotaut/xsonomy-news/actions/runs/41488875093),
after a clean dry run) wrote **33 evidence rows over 9 articles**. Audit of every row:
33/33 quotes verified against the article body, every name a genuine product, Italian and French
bodies included. It assigned exactly **one** manufacturer — and it was wrong.

**Defect 1, precision.** *"A Heavy Shot Ayudag-6 hexacopter built by **a Brave1 participant**"* →
Brave1 credited as the maker. Brave1 is a Ukrainian defence-technology cluster; a participant in it
built the drone. The same shape held for `by an Acme subsidiary / supplier / partner` — and the
`supplier` case reaches a wrong maker by a route that walks straight past the
supply-is-not-manufacture rule. Cause: the disqualifier only ever read the text *between* the two
names, and the qualifying noun sits *after* the company. Fixed with a new `qualified_party` cue, so
the near-miss is auditable rather than looking like silence. Its own staff still count:
*"built by Acme engineers"* is Acme.

**Defect 2, recall.** *"Teal Drones in South Salt Lake builds 1,000 Black Widow..."* produced no
maker, because `drones` is a token of `Teal Drones`, sat beside the product, and the closest-pairing
rule preferred it to the real mention eight words away. Same for the stray `air` in `Skynex Air
Defence System` beating `rheinmetall`. Fixed by trying the complete name first and its own tokens
after, longest first, and by refusing a pairing where **both** sides are loose tokens — that last
one caught a false positive the fix had just introduced (`marble` next to `hub`).

Also widened, because I had cited it as part of defect 2: a possessive now governs its product
through a describing word or two — `Palantir's AI-enabled Maven Smart System`, `Wisk's second
Generation 6`, `OpenWorks' modular optical sensor, Vision Flex`. The stop list is the substance:
prepositions **and determiners** end the run, so `SpaceX's rendering of Starlink satellites` is
still refused. My own earlier regression test caught the determiner case
(`unlike Anduril's Ghost Shark, the Ghostfin`) when the first version was too greedy.

### Measured, not asserted

New fixture `scripts/test/fixtures/maker-claims-production.json` — **91 cases**: every maker claim
the model made in the 13:00 production run and the pilot, with the span it cited, plus 5 synthetic
controls. Labelled `make` / `no` / `amb`, where `amb` is genuinely arguable and scored neither way.

| | before | after |
|---|---|---|
| recall (`want=make`) | 23/31 | **30/31** |
| false positives (`want=no`) | **4** | **0** |

154 tests pass from a clean `npm ci --include=dev`. The eval now prints `dropped as a qualified
party` as its own column, so this class cannot hide inside the generic total.

**Left unfixed on purpose:** the conjunction list. `builds 1,000 Black Widow and 2,000 Fang FPV`
credits Black Widow only. Reaching across `and` is the risky widening — in *"Boeing beat Anduril and
its Ghost Shark"* the conjunction introduces a different company — so a list rule needs to tell
those apart before it earns a place. There is a test asserting it stays refused.

### Not done, and needing a decision

The Brave1 row is still in the database with its wrong maker. The clean correction is a **replay**:
re-derive maker and cue for all stored evidence from the `makerClaimed` + `quote` already on each
row, at zero model cost and without refetching anything. That is a write to `articles.entity_evidence`,
so it waits for Nazar. The remainder of the backfill is unblocked either way.

## 2026-11-02 (late) — backfill remainder ran clean; the drop rate was misleading

Run [41497085215](https://github.com/brunotaut/xsonomy-news/actions/runs/41497085215) on `780484e`
(contains the maker fix `60cc29c`) wrote **88 more articles** in 3 minutes. Total backfilled: **97
articles, 353 evidence rows.** No products created or updated, `entities_resolved_at` untouched.

Quality of what was written:

- **348 of 353 quotes verified against the article body.** The other 5 had no body, and **all 5
  went to `review`** with reason `no_article_text_to_verify` — the headline-only rule doing its job.
- creates 323 · reviews 15 · rejects 15. The pilot's 0 reviews / 0 rejects was a small-sample
  artefact, not a stuck classifier. Rejects are 6 family, 6 programme, 3 class. Reviews include
  **6 firings of the new "the quote calls it a series/family" rule** on real articles.
- **Zero `qualified_party` cues** — the Brave1 shape did not recur.

### I was reading the maker numbers wrong

I had been quoting "26 of 37 claims dropped" as a recall figure. Decomposing all 217 claims in the
backfilled set shows that is the wrong denominator:

| | |
|---|---|
| claims where the span **does not name the maker at all** | **102** (47%) |
| claims where the maker **is** named | 115 |
| → assigned | **54** |
| → named but no relationship found | 61 |

Those 102 are the model attaching a manufacturer it knew from elsewhere rather than from the span it
cited. Refusing them is the safeguard working, not recall being lost.

Inspecting the 61: 28 are co-mention only (`a Neros Archer drone` in a photo caption), 12 are
contract awards or lists (`AEVEX Corp. said its Maritime Systems division was awarded two
contracts`), 8 are possessives that are not manufacture (`the drone Verizon's Frontline Crisis
Response Team made its primary aircraft`), 10 turn on an announcement verb (`Applied Aeronautics
today introduced Fleet`), and 3 have a real make verb across too long a bridge (`Griffon also
developed a derivative of the Gen 1 design ... called the Outlaw`).

So the genuinely addressable residue is roughly **13 of 217**, not 163. The announcement-verb group
is the only one worth a rule, and it is a judgement call: introducing a product is not always
building it.

### State

**538 candidates remain** (`analyzed_at` set, not resolved, no evidence, has products) — about six
more runs at `max_articles=100`, roughly $2.50–3.00 in total at the observed ~$0.005 per article.

The pilot's 33 rows were written **before** the maker fix and the remainder's 320 after, so the set
is not uniform. The replay would normalise it and correct the Brave1 row, which still reads
`maker=Brave1, cue=made_by`. Still waiting on Nazar.

Cosmetic: one review reason renders as `quote_calls_it_a_-series`, from a hyphen ahead of the
marker. Harmless label wart, not fixed.

## 2026-11-02 (later) — the 600-cap run exposed a paging bug that wastes money

Run [41503115561](https://github.com/brunotaut/xsonomy-news/actions/runs/41503115561) succeeded in
14 minutes, and evidence went 143 → **358 articles**. But **323 candidates remain**, not 0 — so a
cap of 600 wrote only 215 articles.

**Cause.** An article that yields no usable evidence is never marked, so it stays in the candidate
query — and `fetchMissingEvidenceBatch` always returns the *first N candidates in the same order*,
with no offset and no exclusion. The next page therefore re-fetched the same stuck rows and re-sent
them to the model. They accumulated at the head of the ordering and progressively crowded out the
articles that had never been tried. 600 analyses, 215 articles written: roughly **385 wasted model
calls, about $1.90**, and the waste grows with every run because the stuck set never shrinks.

**Fix.** The paging is now an exported generator, `candidateBatches`, which offers each candidate
**at most once per run**: it over-fetches past everything already attempted, filters, and stops when
a page holds nothing new. The run also now *names* the stuck articles at the end instead of letting
them quietly reappear forever. `analyze-backfill.mjs` got an `import.meta.url` run-guard so the
paging is importable without the script executing.

**Tested against a pool that behaves like the real query** — ordered, and a row only leaves once it
is written. 538 candidates with every 8th permanently stuck and a cap of 600: all 538 offered, none
twice, 471 written, where the old paging reached 215. Also covered: the cap still caps, an exhausted
pool ends the run, and an all-stuck pool terminates instead of looping on spend.

159 tests pass.

**Next run finishes the job:** `mode=backfill`, `max_articles=400` covers the 323 that remain, and
the stuck ones will be listed by URL at the end of the log.

## 2026-11-02 (later still) — the backfill finished, and the replay turned out to be only half possible

The `max_articles=400` run cleared the backlog. Evidence went **358 → 626 articles**
(2,345 evidence rows); candidates fell **323 → 55**, and the paging fix held: every
candidate was offered exactly once.

The 55 left are not failures. They are rows whose stored `products` should never
have been there — `ChatGPT`, `Tomahawk`, `FPV goggles`, `MILSATCOM`, `Virginia-class`,
`P-51 Mustang`, the ANRA software platforms, a Messerschmitt Me 163 history piece.
The extractor declines to evidence them because they are not UAV or sensor products,
which is the right answer. They will sit as candidates forever; that is a stored-data
problem, not an extraction one.

### The replay cannot do what I said it would

I told Nazar the replay was "a pure function of stored data". **It is not, and that
was my error.** The maker decision is made from the model's `makerQuote` — and that
span was never written to the evidence row. Only the product-mention `quote` was.
So for all 2,345 existing rows, the evidence the rule actually judged is gone.

Measured, rather than assumed:

| | rows |
|---|---|
| maker claims the model made | 1,477 |
| makers currently stored | 411 |
| …whose `quote` does name the maker | 373 |
| …**whose `quote` does not name it at all** | **38** |
| dropped claims whose `quote` does name the maker | 428 |
| dropped claims whose `quote` is silent on the maker | 638 |

Those **38** are the whole argument. They were accepted on a `makerQuote` the replay
cannot see, so a quote-only replay would strip 38 good makers as "unevidenced". The
638 are simply unreachable. The honest ceiling on recovery is 428, and the real figure
will be well below it.

**Two changes, both pushed.**

1. `analyze.mjs` now stores `makerQuote` on every evidence row. One line. Without it
   the pipeline records verdicts whose evidence is discarded, so rules can be improved
   but never re-applied — every rule change would mean paying the model again.
2. `scripts/replay-maker-rules.mjs`, additive-only by construction. A null maker may
   become a maker on any span the row has. An existing maker is cleared **only** when
   the row stores the `makerQuote` it was decided from and today's rules reject that
   very span. Nine tests pin the asymmetry, including the 38-row case and the real
   Brave1 row. Rows written from today carry `makerQuote` and are fully replayable
   both ways.

New workflow modes: `replay-dry` (reads, reports, writes nothing, no model calls) and
`replay` (applies). **Run `replay-dry` first** — it costs nothing and prints exactly
what would change.

Still untouched: nothing has resolved since **26 October**. 765 articles queued, 397
of them over a week old. That is the actual blockage, and it is a separate decision.

## 2026-11-02 (late) — a green run that did nothing, and the guard that stops the next one

Run [41538174199](https://github.com/brunotaut/xsonomy-news/actions/runs/41538174199)
was dispatched as the replay dry run. It reported **success** in 40 seconds and
**did nothing at all**: checkout, install, 169 unit tests, taxonomy check — and
every one of the six mode steps `skipped`, the replay among them. The commit it ran
(`a51a42b`) did contain the replay script, so the code was there; the `mode` input
simply matched no step's `if:`, so every branch was false and the job sailed through.

This is the same failure shape as the first production run that "succeeded" while a
required article came back unparseable: **a green tick that means nothing happened.**
The workflow now validates `mode` against the six it actually implements and fails
the job on anything else, before any step that could spend money or write.

Nothing was written — all write steps were skipped — so the database is exactly as
the backfill left it: 626 articles with evidence, 2,345 evidence rows, 55 candidates.

**Re-dispatch with `mode` exactly `replay-dry`** (hyphen, lower case, no spaces).


## 2026-11-03 — funding checkpoint 08 recovery

Nazar authorised retrying rollback rehearsal, atomic import and hourly continuation. Prepared manifest adds 15 events, enriches one existing event and adds ten investor identities. Guarded FlyingBasket correction replaces its undisclosed 2022 amount with approximately EUR1.5m; before-image and reversal record committed. Production rehearsal matched all seven table fingerprints after rollback. Atomic apply: 203 events, 106 companies, 541 participations, 457 investors, 272 event-source links. No duplicate keys or events without sources; legacy relationships unchanged. Existing 169 tests and checkpoint-specific PostgreSQL rollback/idempotency/guard regression passed. Catalogue publication and scheduler resumption are being verified. Programme remains incomplete at 82 source-reviewed cohort identities.


### Checkpoint 08 recovery closed — 3 November 2026

Catalogue build and deployment succeeded (run 41551680894, site commit 71adb0c26c11c0d64ef0e216b5fc86754715bdec). Live cache-busted landscape and investor exports generated at 00:17 UTC verified: 567 companies, 203 sourced events across 106 companies, 541 participations, 457 investor profiles. FlyingBasket EUR1.5m is explicitly approximate; its EUR2m follow-on remains separate and Leonardo consideration remains null. All 170 writer tests pass. Existing hourly continuation was re-enabled and read back as enabled; its schedule and prompt are unchanged. Lease cleared after saving this checkpoint; full database research continues.
## 2026-11-03 — it was a trailing space, both times

The new guard fired on the re-dispatch: `mode 'replay-dry ' matches no step`. So the
silent green no-op the day before was the same thing — **a trailing space pasted into
the dispatch box**, which no `if:` comparison can ever match.

Rejecting it loudly was right, but making Nazar retype it is not a fix. The workflow
now strips whitespace and lower-cases the input, and all seven mode-gated steps key
off that trimmed value rather than the raw one. `replay-dry `, ` replay-dry` and
`Replay-Dry` all run; `replay dry`, a misspelling and an empty box still fail the job
before anything can spend money or write.

Exercised against each of those nine inputs before pushing. Still 626 articles with
evidence, 2,345 evidence rows, 55 candidates — the replay has not yet run.

## 2026-11-03 — the replay dry run ran, and auditing what it wanted to add found a rule defect

Run [41596894241](https://github.com/brunotaut/xsonomy-news/actions/runs/41596894241):
the mode guard normalised the input, `Maker-rule replay — DRY` ran for 5 seconds and
`APPLY` was correctly skipped. (The job log needs admin rights, so the printed report
is not readable from here; the numbers below come from querying the database directly.)

**Do not apply the replay yet.** Auditing the 428 rows it could add a maker to — rather
than trusting the rules — turned up the largest false-positive class yet found:

> `DJI -> DJI Mavic 3`, on a quote that is the four words **`DJI Mavic 3`**.

The company's name is *part of the product's name*, so the two are trivially adjacent
and the `adjacent` cue fires on **the name sitting next to itself**. Checked against
real stored spans, the same shape gave `Ford -> Ford F-250`, `Boeing -> Boeing 737 MAX`
(from a sentence about Natilus), `Agisoft -> Agisoft Metashape` (from a list of file
formats) and well over a hundred DJI rows. Six of the seven adjacency acceptances in a
16-row probe were this.

DJI does of course make the Mavic 3 — but **not because that span says so**, and the
whole contract of rule 3 is that one span must say it. Inferring a maker from a brand
prefix is a reasonable thing to want; it belongs in its own deliberate rule, where it
can be measured, not smuggled in through adjacency. **That is Nazar's call, separately.**

Fixed: bare adjacency is now refused when either name contains the other as whole
words, recorded as the cue `name_self_reference` so it shows up in reports instead of
vanishing. Only *bare* adjacency is affected — `DJI manufactures the DJI Mavic 3` and
`DJI's DJI Mavic 3` still pass through the verb and the possessive, and
`Lockheed -> F-94 Starfire` (different names, genuine designator) is untouched.

Six new tests, and the 91-case production fixture still holds its hard
`falsePositives = []` with recall unchanged. **175 tests pass.** The new cue has its
own column in both the eval report and the replay report.

The replay has still written nothing: 626 articles with evidence, 2,345 evidence rows,
55 candidates. **Re-run `mode=replay-dry`** — the count it reports now will be the one
worth applying.


### Company funding checkpoint53 — 2026-11-05

Source-audited18new events and24participations;605approved events,1008participations,705profiles. Explicit Kitemill precision correction and reversal tested;20parallel read-only reviews plus2writer followups remain partial. Publication pending. Dedicated state/report contain evidence and next actions; legacy STATE and snapshots untouched.


Checkpoint 53 publication verified: workflow 42031512224 succeeded; live data generated 2026-11-05T12:58:10.713Z and 2026-11-05T12:58:11.669Z. Verified 605 events, 1,008 participations and 705 profiles; all manifest facts and correction matched. Active elapsed 12.22 minutes; zero newly completed bounded histories. Lease released.


### Funding checkpoint54 — 2026-11-05

25 identities reconciled;25 new events and34 participations safely imported after rollback rehearsal.630 events,1,042 participations,719 profiles. Helsing bounded review complete; source holds preserved. Current queue completed count338 replaces legacy aggregate455, which is retained separately. Publication pending.


Checkpoint54 publication verified: deployment 42040331723 succeeded. Live catalogue 2026-11-05T13:57:52.659Z; investor catalogue 2026-11-05T13:57:53.591Z. All27 manifest representations matched.630 events,1,042 participations,719 profiles. Active elapsed 14.34 minutes;1 newly completed bounded review. Writer lease released; full programme remains in progress.


## Investment research checkpoint — 2026-11-10T23:04:56.345Z

Checked 27 published company identities in four read-only lanes. Imported 14 supported events and applied three expected-value-guarded corrections after production rollback and repeated-import idempotency rehearsal. Independently verified 1,485 approved events, 1, 362 approved round participations and 815 investor profiles; curated profiles and legacy relationships are unchanged. Six bounded reviews closed; queue now 429 reviewed, 138 partial, 1,997 queued. Source manifest staged at 229a64da113036d93551edd092e8fff3d2eb24a9.

Audit: `research-agent/reports/2026-11-10-funding-landscape-third-late-night.json`; manifest: `research-agent/imports/funding-landscape-20261110-third-late-night.json`. Database committed; fresh catalogue publication pending under explicit read-only catalogue scope. Live remains generated 2026-11-10T13:52:10.085Z with 1,145 events. Existing daily catalogue schedule and hourly continuation remain unchanged. Legacy research STATE.json and frozen snapshots were preserved.


## Investment research checkpoint — 2026-11-10T23:57:42.953Z

Checked 24 identities in four read-only groups: 18 history follow-ups and six prepared source reconciliations. Atomic import added ten events, linked one existing investor and applied three expected-value-guarded corrections. Reused Indra's unchanged 2016 bond only to link its incremental 2020 tap. Production rollback, repeated-import idempotency and independent value/source checks passed; existing investor profiles and legacy relationships remained unchanged.

Queue: 431 bounded reviews, 136 partial histories, 1,997 queued. Production: 1,495 approved events, 1, 363 approved participations, 815 investor profiles. Audit: `research-agent/reports/2026-11-10-funding-landscape-midnight.json`; manifest: `research-agent/imports/funding-landscape-20261110-midnight.json`. Source staging commit: b3215aeb609956bd8270bccd0c6a37c1490bcf1b. New publication remains pending: catalogue's latest successful run is unchanged, and current JSON fetch was unavailable. Repository schedules, legacy research STATE.json and frozen snapshots were preserved.


## Investment research checkpoint — 2026-11-11T00:57:06.161Z

Checked 24 identities in four read-only groups:18 history follow-ups and six focused prepared reconciliations. Added ten events and applied five expected-value-guarded corrections after production rollback and repeated-import rehearsal; independent event/source audits passed. Investor profiles and legacy relationships unchanged. Original statutory/PDF documents resolved additional company-specific grants and cash-consideration details; noncash/overlap and borrower-attribution holds preserved.

Queue:434 bounded reviews,133 partial histories,1,997 queued. Database:1,505 approved events,1, 363 participations, 815 profiles. Audit:`research-agent/reports/2026-11-11-funding-landscape-early.json`; manifest:`research-agent/imports/funding-landscape-20261111-early.json`; source staging commit:f32360defe52a0ce2dbc13b82158591e447de03f. Live JSON remains generated10November13:52UTC; publication pending under read-only catalogue scope. Existing schedules, legacy STATE.json and frozen snapshots preserved.


## Investment research checkpoint — 2026-11-11T01:58:37.009Z

Checked 24 identities in four read-only groups: 18 public-history followups and six focused prepared reconciliations. Added nine events; applied three expected-value-guarded event corrections and three explicit co-lead role corrections. Production rollback, repeated-import idempotency and independent event/source/role audits passed. Curated profiles and legacy relationships unchanged.

Queue: 439 bounded reviews, 128 partial histories, 1,997 queued. Database: 1,514 approved events, 1, 363 approved participations, 815 investor profiles. Audit: `research-agent/reports/2026-11-11-funding-landscape-second-night.json`; manifest: `research-agent/imports/funding-landscape-20261111-second-night.json`; source staging commit: dc3a8ff634ef5946eab1387169c2444f29b14951. Live JSON still generated 10 November 13:52 UTC; publication remains pending under read-only catalogue scope. Existing schedules, legacy STATE.json and frozen snapshots preserved.


## Investment research checkpoint — 2026-11-11T02:56:27.045Z

Checked23 identities:18 public-history followups, four focused prepared reconciliations and one additional beneficiary crosscheck. Added nine events and one source-confirmed GEPE investor profile/participation. Withheld two Rinicom rows whose original recipient is a different legal company; preserved OSL's distinct own allocations of the same projects. Production rollback/idempotency and independent source/event checks passed; previously curated profiles and legacy relationships preserved.

Queue:440 bounded reviews,127 partial histories,1,997 queued. Database:1,521 approved events,1, 364 approved participations, 816 investor profiles. Audit:`research-agent/reports/2026-11-11-funding-landscape-third-night.json`; manifest:`research-agent/imports/funding-landscape-20261111-third-night.json`; source staging commit:b344b9b71953e1416ef72a89bfdb55b79e6ea30c. Stale live JSON still contains the two newly withheld Rinicom rows. Fresh scheduled catalogue build/publication verification remains pending under read-only scope. Existing schedules, legacy STATE.json and frozen snapshots preserved.


## Funding research — 11 November 2026 fourth-night checkpoint

Reviewed22 distinct published identities under one writer lease;20 bounded public-source reviews completed and2 issuer mappings remain partial. Atomic source-backed import added8 events,2 explicitly supported investor roles and15 source rows after production rollback and repeated-import checks. Current DB:1,529approved events,1, 366approved participations, 816investor profiles. Existing curated profiles and relationships preserved. Queue:460reviewed,107partial,1,997queued. New report: `research-agent/reports/2026-11-11-funding-landscape-fourth-night.json`; source manifest commit: `b0265879bb83d1323261257ff4da5f07f04f0931`.

Live still generated10November13:52UTC and is not yet verified for pending16manifests. Catalogue repository remains read-only; existing scheduled deployment route retained without schedule changes. Hourly continuation verified enabled; no automation edits. Legacy STATE.json and frozen snapshots untouched.


## Funding research — 11 November 2026 fifth-night checkpoint

Checked20 distinct published identities;17 bounded public-source reviews completed,3 issuer mappings retained partial. Added8 confirmed grant participations with undisclosed company allocations and guarded UMag acquisition status closed→signed against original approval condition. Production rollback, repeated-import idempotency and independent post-commit audits passed; existing curated profiles/relationships preserved. DB:1,537approved events,1, 366approved participations, 816profiles. Queue:477reviewed,90partial,1,997queued. Source commit `49e418e10dd94bf8e3885161438b65415881d810`; report `research-agent/reports/2026-11-11-funding-landscape-fifth-night.json`.

Live remains10November13:52UTC; pending17base manifests and3corrective manifests require fresh scheduled deployment audit, including four exact draft exclusions. Catalogue remains read-only; schedules and legacy STATE/frozen snapshots unchanged.


## Funding research — 11 November 2026 sixth-night checkpoint

Checked22 published identities under one lease;18 newly completed bounded reviews,3 partial,1 previously completed followup. Added8 events(5Terma grants,WB2016BGK facility,WB2023PLN100m nominal bonds,Weibel credit disclosure),2 lender roles,2 generic backing links,1 BGKprofile and14source rows. Corrected WB2020 allocation date/status and Weles award status with expected-old guards/reversals; Weles company amount remains unknown. Rollback/repeat-import and independent audits passed; all pre-existing curated profiles/relationships preserved. DB:1,545approved events,1, 368approved participations, 817profiles. Queue:495reviewed,72partial,1,997queued. Sourcecommit `51d44df9c82a11f386567cd5401e9a13867edbaa`; report `research-agent/reports/2026-11-11-funding-landscape-sixth-night.json`.

Live remains10November13:52UTC;18base/four corrective manifests await fresh scheduled deployment audit. Catalogue remains read-only; schedules, legacy STATE.json and frozen snapshots untouched.


## Funding research — 11 November 2026 seventh-night checkpoint

Completed22 bounded public-source reviews. Added22 supported records(14grant participations,7XSun rounded loan-designation disclosures,1Robotto announced contractual programme support),1generic IFP backing link/new profile and36source rows. Four expected-old/reversal corrections clarify ProPatria own contracted allocation,Primoco conflicting transfer year,XSun signed grant basis andTerma AI4DEF public announcement date. No new cash inferred from debt stocks,guarantees,consortium budgets,procurement or successor funding. Production rollback,repeat-import and independent audits passed; curated profiles/relationships preserved. DB:1,567approved events,1, 368approved participations, 818profiles. Queue:517reviewed,50partial,1,997queued. Sourcecommit `305426a500e352ed3c37bc76e1bd6fe129e33ace`; report `research-agent/reports/2026-11-11-funding-landscape-seventh-night.json`.

Fresh live remains10November13:52UTC.19base/five corrective manifests await deployment audit; catalogue stays read-only, schedules unchanged. Legacy STATE.json/frozen snapshots untouched.


## Funding research checkpoint — 2026-11-11 eighth night

Source commit: `780fc8c22ffa6e2d263f16fc62f4888427447339`. Reviewed 22 published company identities in four disjoint read-only groups; 16 bounded reviews complete and 6 reconciliations retained. Production rollback/repeated-import rehearsal and atomic import passed: 4 new events, 5 round participations, 2 profiles, 12 guarded corrections and 9 source rows. Existing curated profiles and legacy relationships preserved. DB: 1,571 approved events, 1,373 approved links, 820 profiles. Queue: 533 reviewed, 34 partial, 1,997 queued. Live publication remains pending: latest observed catalogue build 10 Nov 13:51 UTC; live 1,145 events/1,214 links/774 profiles. Catalogue stays read-only; no schedules changed. Audit: `research-agent/reports/2026-11-11-funding-landscape-eighth-night.json`.


## Funding research checkpoint — 2026-11-11 ninth night

Reviewed 22 published identities; 17 bounded reviews completed and 5 retained for specific reconciliations. Source commit `dedffc42365a425567c3b6e9b46e7e5fb208f7c5`. Tested importer, repeated production rollback and atomic application passed: 16 new events (5 exact-company loan-flow disclosures and 11 grant participations), 7 round links and 26 sources; no new profiles or duplicate generic backing. All existing curated profile/relationship fingerprints preserved. DB: 1,587 approved events, 1,380 approved links, 820 profiles. Queue: 550 reviewed, 17 partial, 1,997 queued. Publication remains pending; fresh live data still generated 10 Nov 13:52 UTC. Catalogue is read-only; no schedules changed. Audit: `research-agent/reports/2026-11-11-funding-landscape-ninth-night.json`.


## Funding checkpoint — 2026-11-11 tenth continuation

Reviewed21 distinct identities (17 published followups and4 wider cohort).18 bounded reviews complete;3 retained for exact source/issuer reconciliation. Tested importer, repeated production rollback, atomic import and independent curated-fingerprint checks passed:3 new events,2 guarded corrections,1 lender link,1 profile and8 sources. Queue568 reviewed/3partial/1,993queued; published565/567 reviewed. DB1,590approved events/1,381links/821profiles. Both catalogue builds succeeded; final live1,589events/1,380links/821profiles, with515 event/source records and9 withheld records checked.2Excel excluded from map by existing membership; no gate changes. Source commit `12fd37c444f14eabc4dd05ad863b026f3ceb612d`; catalogue commit `4a919c55a6e68125ceee3dd5cb05c2c631fc07a4`. Audit `research-agent/reports/2026-11-11-funding-landscape-tenth.json`. Legacy STATE and frozen snapshots untouched; schedules unchanged.


## Autonomous funding reconciliation 36 — 2026-11-12
24 wider-cohort identities reviewed (8 bounded reviews complete, 16 partial); 38 events, 102 participant links, 48 sources and 4 ownership relationships imported after rollback rehearsal and verified idempotency. DB totals: 2,729 events (2,716 approved), 3,299 links, 2,008 investor profiles, 693 company coverage rows. Catalogue commit 4267d20026a6dd41922b593e383a2bf0d88772c6, workflow 43221982130, live JSON verified. Dedicated queue: 922 reviewed, 267 partial, 1,375 queued. Next: Evica through FFG.


## Autonomous funding reconciliation 37 — 2026-11-12
24 wider-cohort identities researched: 8 bounded reviews complete, 16 partial. Imported 33 events, 70 participant links, 45 event sources and 8 ownership relationships following production rollback, atomic import, source audit and idempotency verification. DB totals: 2,762 funding rows (2,749 approved), 3, 369 participant links, 2,046 profiles, 705 covered identities. Catalogue 6478092df4e49bde514bb07d178b0b673a0db03b, deployment 43232929670, live JSON verified at 2026-11-12T14:03:38.490Z; 2,037 named directory profiles (9 legacy anonymous placeholders filtered by launch cleanup), 567 landscape companies and 1,589 displayed events. Queue: 930 reviewed, 283 partial, 1,351 queued. Next Fieldmade through Flyfreely.


### Funding reconciliation 38 — 2026-11-12T15:05:33.201Z

Checked 24 wider-cohort identities under one short writer lease and four read-only research groups. Queue: 934 reviewed, 303 partial, 1327 queued. Imported 49 approved financing events, 101 sourced participant links, 54 source rows, 7 generic relationships and 50 named investor profiles across 12 newly covered companies. Production rollback rehearsal, atomic import, post-import idempotency and source matching passed. Database: 2811 total / 2798 approved events, 3470 participant links, 2096 investor profiles, 717 companies with supported event rows.

Publication verified: catalogue commit f6513c1077719b7bf60c1ca1bcf53378f8b35ad7; [successful build](https://github.com/brunotaut/xSonomy/actions/runs/43243520314); live landscape generated 2026-11-12T15:03:33.206Z, investor directory 2026-11-12T15:03:35.099Z. Published membership remains 567 with 1589 displayed events / 1380 participant links; directory 2087 named profiles / 254 portfolio relationships (225 published). Nine pre-existing anonymous profiles remain excluded by the existing directory filter. Current 24 identities remain outside the published map. Actual elapsed 14.1 minutes; 102.5 identities/hour, 17.1 bounded completions/hour; no concurrency speedup inferred.

Audit: [report](../research-agent/reports/2026-11-12-funding-landscape-thirty-eighth.json), [manifest](../research-agent/imports/funding-landscape-20261112-thirty-eighth.json). Full programme remains in progress. Lease released; no pending import/publication. Next: FlyGuys through Frenel Imaging (24 queued identities). No schedule, legacy snapshot, classification or geography changes.


### Funding reconciliation 39 — 2026-11-12T16:00:06.502Z

Checked 24 wider-cohort identities through four read-only research groups and one writer. Queue 941 reviewed / 320 partial / 1303 queued. Imported 28 approved events, 81 sourced links, 36 source rows, 4 generic investor relationships and 45 new named profiles across 8 newly event-covered companies. Actual database 2839 total / 2826 approved events, 3551 links, 2141 profiles, 725 event-covered companies. PostgreSQL rollback/idempotency/conflict/source-constraint tests, production rollback rehearsal, atomic import and repeat idempotency rollback passed. No new exact-name investor duplicates.

Publication verified: catalogue commit 6ae4fe44f40f498bc85613855edde500fcc2e256; [successful build](https://github.com/brunotaut/xSonomy/actions/runs/43253481020). Live landscape generated 2026-11-12T15:58:47.286Z; investor directory 2026-11-12T15:58:49.822Z. Membership 567, displayed events 1589, links 1380, named profiles 2132, portfolio relationships 258 (229 published). Current 24 identities stay outside map membership; nine pre-existing anonymous profiles remain excluded under current filter. Actual elapsed 9.7 minutes, 149 checked identities/hour, 43.5 bounded completions/hour; no concurrency speedup claimed.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-thirty-ninth.json) and [manifest](../research-agent/imports/funding-landscape-20261112-thirty-ninth.json). Lease released; no pending import/publication. Continue Frequentis USA through Geely. Full programme remains in progress. Schedules, geography/classification/publication gates, legacy STATE.json and frozen snapshots preserved.


### Funding reconciliation 40 — 2026-11-12T16:58:08.103Z

Checked 24 wider-cohort identities through four read-only research groups and one writer. Queue: 947 reviewed / 338 partial / 1279 queued. Imported 30 approved financing events, 45 sourced participant links, 38 source rows, 7 generic relationships and 30 named profiles across 12 newly event-covered companies. Database: 2869 total / 2856 approved events, 3596 links, 2171 profiles, 737 event-covered companies. Local PostgreSQL rollback, idempotency, conflict and source-FK tests; production rollback rehearsal; atomic import; repeat idempotency rollback and manifest source audit all passed. No new exact-name profile duplicates.

Publication verified: catalogue commit 45842bc9a4097a28191a2b6c790418b601a16121; [successful build](https://github.com/brunotaut/xSonomy/actions/runs/43263930840). Live landscape generated 2026-11-12T16:56:19.856Z, directory 2026-11-12T16:56:22.017Z. Membership remains 567 with 1589 displayed events / 1380 participant links; directory 2162 named profiles / 265 portfolio relationships (236 published). Nine pre-existing anonymous profiles remain excluded by current filter. The 24 current identities remain outside map membership. Actual elapsed 10 minutes, 143.8 checked identities/hour, 35.9 bounded completions/hour; no concurrency speedup claim.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-fortieth.json), [manifest](../research-agent/imports/funding-landscape-20261112-fortieth.json). Full programme remains in progress. Lease released; no pending import/publication. Next: Gemfan through GLEFA. GE Aerospace issuer financing must not be duplicated under GE Aviation or the queued General Electric identity. Geography, classification, publication gates, schedules, legacy STATE.json and frozen snapshots preserved.


### Funding reconciliation 41 — 2026-11-12T18:02:34.051Z

Checked 24 wider-cohort identities through four read-only research groups and one writer. Queue: 957 reviewed / 352 partial / 1255 queued. Imported 21 approved financing events, 17 sourced participant links, 29 source rows, 13 generic relationships and 19 named profiles across 10 newly event-covered companies. Database: 2890 total / 2877 approved events, 3613 links, 2190 profiles, 747 event-covered companies. Local PostgreSQL rollback, idempotency, conflict and source-FK tests; production rollback rehearsal; atomic import; repeat idempotency rollback and manifest source audit passed. No new exact-name investor duplicates.

Publication verified: catalogue commit 0552353f47059d68bc1cd014e23639099411fed6; [successful build](https://github.com/brunotaut/xSonomy/actions/runs/43275223196). Live landscape generated 2026-11-12T18:00:57.920Z, directory 2026-11-12T18:01:00.447Z. Membership remains 567 with 1589 displayed events / 1380 participant links; directory 2181 named profiles / 278 portfolio relationships (249 published). Nine pre-existing anonymous profiles remain excluded by current filter. Live landscape contained none of the 24 target identities, preserving membership gates. Actual elapsed 12.3 minutes, 116.7 checked identities/hour, 48.6 bounded completions/hour; no concurrency speedup claim.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-forty-first.json), [manifest](../research-agent/imports/funding-landscape-20261112-forty-first.json). Full programme remains in progress. Lease released; no pending import/publication. Next: Glenair through Griffon Aerospace. GE/GA-ASI duplicate finance, acquisitions, procurement and consortium budgets excluded as documented. Geography, classification, publication gates, schedules, legacy STATE.json and frozen snapshots preserved.

### 2026-11-12 — private landscape feedback inbox and notifications

Nazar requested a free-text suggestion form with a required email address, mandatory consent, private table storage, owner email copies and spam protection. Added the isolated `landscape_feedback` table and service-only RPCs, deployed `landscape-feedback` Edge Function, and implemented the existing-Resend mail queue worker. A new five-minute feedback-only delivery workflow reuses existing configured secrets; existing digest schedules and subscribers are unchanged. Anonymous roles cannot read, insert or execute the storage RPCs. Exact consent wording/time/version and notification retry state are stored. Signed short-lived proof of work, a honeypot and atomic email/network/global quotas protect submissions. No raw IP is stored. See docs/LANDSCAPE_FEEDBACK.md.

Validation: 178 news tests pass, including the new PGlite schema/access/consent/quota/outbox tests and endpoint/mail-worker tests. Frontend form and footer changes are in brunotaut/xSonomy. Live submission and owner-delivery checks are completed during publication; no real visitor information is used in tests.


## Funding reconciliation — forty-second verified checkpoint (12 November 2026)

- Reviewed 24 wider-cohort identities, Glenair through Griffon Aerospace: 13 completed bounded public-source reviews and 11 partial histories. Queue: 970 reviewed / 363 partial / 1,231 queued across 2,564 baseline identities.
- Imported 24 approved financing events, 28 participant links, 42 event source rows, 20 new named investor profiles and 5 generic relationships. PostgreSQL tests, production rollback, atomic import, idempotency and exact manifest/source audit passed; no missing participant sources, mismatched facts or new exact-name profile duplicates. Curated profiles, draft/geography gates and legacy stream preserved.
- Database totals: 2,914 events (2,901 approved), 3,641 participant links, 2,210 investor profiles and 754 event-covered companies. Source dates, amount qualifiers, exact borrowers, primary/secondary distinction, grants and procurement exclusions are documented in the manifest and report.
- Live build verified: catalogue commit a1f916752a7ff788f2944140673e1c7cd91abdf1, workflow https://github.com/brunotaut/xSonomy/actions/runs/43285543455, source checkpoint bef36ed46a47d307c0d5bd7656744fc0d637aca0. JSON generated 2026-11-12T19:00:42.155Z / 2026-11-12T19:00:44.797Z: 567 landscape companies, 1,589 events, 1,380 links; directory 2,201 named profiles, 283 generic portfolio relationships / 254 linked to published full-catalogue pages. All24 targets remain outside the European landscape. Nine pre-existing anonymous placeholders remain excluded from the directory.
- Audit report: [forty-second reconciliation](../research-agent/reports/2026-11-12-funding-landscape-forty-second.json); manifest: [approved import](../research-agent/imports/funding-landscape-20261112-forty-second.json). Elapsed 18 minutes, 79.8 checked identities/hour and 43.2 completed bounded reviews/hour; no concurrency speedup inferred.
- Next: original-source review of the unverified same-day Uforce candidate, then Griselda through Hard Cat (24 queued identities). The Uforce discovery is not an imported fact or a reviewed identity. Hourly continuation automation verified enabled without changing schedules. Writer lease released.


## Forty-third funding reconciliation verified — 12 November 2026

Reviewed24 new cohort identities (Griselda–HardCat) plus1 published UFORCE followup. Queue977 reviewed /380 partial /1207 queued across2564. Imported16 approved events,93 participant links,26 source rows,53 named profiles and11 generic relationships. PostgreSQL tests, production rollback, atomic import, repeat-idempotency and source audit passed:16/93/26/11 matches and zero missing participant sources; no new exact-name profile duplicates. Existing Fidelity duplicate retained for final programme audit, canonical pilot profile reused. Curated profiles, draft gates, geography, legacy research and frozen snapshots preserved.

Database2930 events/2917 approved,3734 participant links,2263 profiles,762 companies with events. Successful catalogue build https://github.com/brunotaut/xSonomy/actions/runs/43295358597, commit 2da2471306b3b306f906e23d0c34108b27a628e1, source checkpoint 1239b4fa8fde263e6c498bca42dd7b4f2bbcf448. Live JSON 2026-11-12T19:57:44.145Z / 2026-11-12T19:57:45.815Z:567 companies,1590 events,1390 links,2254 named directory profiles,294 generic portfolio links/265 to published full-catalogue pages. UFORCE new700mUSD SeriesA and NWF113mGBP contribution verified alongside existing50mUSD seed. Nine pre-existing anonymous placeholders excluded. Draft GutSee/HardCat remain excluded from landscape.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-forty-third.json) · [Manifest](../research-agent/imports/funding-landscape-20261112-forty-third.json). Elapsed11.6min, 128.8 checked identities/hour, 36.1 new completed bounded reviews/hour; no concurrency speedup claim. Next24: Harland & Wolff through HID Global. UFORCE discovery followup resolved. No schedules changed; writer lease released.


## Forty-fourth funding reconciliation verified — 12 November 2026

Reviewed 24 wider-cohort identities, Harland & Wolff through HID Global: 12 completed bounded reviews and 12 partial histories. Queue: 989 reviewed / 392 partial / 1,183 queued across 2,564 baseline identities.

Imported 11 approved financing records, 83 participant links, 13 event source rows, 55 named investor profiles and 13 generic relationships. PostgreSQL tests, production rollback, atomic import, idempotency and exact fact/role/source audit passed: 11/83/13/13 matches, zero mismatched facts, missing participant sources or new exact-name profile duplicates. Hermeus equity/debt components avoid duplicating the aggregate package; Harvard direct issuer and announced status remain explicit. SEC overlap, intermediary and subsidiary claims are retained as holds. Curated profiles, geography, publication gates, legacy research and frozen snapshots preserved.

Database: 2,941 events (2,928 approved), 3,817 participant links, 2,318 profiles and 768 companies with events. Successful catalogue build: https://github.com/brunotaut/xSonomy/actions/runs/43297903841; commit 62693222bf0728f02f5b961c937fe8d3468dbded, source checkpoint 4f75d56a9e63bb49658fbc07bb6555a106107092. Live JSON generated 2026-11-12T20:12:55.380Z / 2026-11-12T20:12:57.664Z: 567 companies, 1,590 events, 1,390 links; directory 2,309 named profiles, 307 generic portfolio links / 278 to published full-catalogue pages. All 24 targets remain outside the European landscape. Nine pre-existing anonymous placeholders remain excluded.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-forty-fourth.json) · [Manifest](../research-agent/imports/funding-landscape-20261112-forty-fourth.json). Elapsed 12.4 minutes; 116.2 checked identities/hour and 58.1 completed bounded reviews/hour. No concurrency speedup inferred. Next 24: Hidden Level through Hoplynk. Unmatched Agile Robots external discovery saved for final identity/additions audit, without importing a financing claim or counting a cohort review. No schedules changed; writer lease released.


### Autonomous funding research — reconciliation 45, 12 November 2026

Checked 24 distinct wider-cohort identities, Hidden Level through Hoplynk: nine bounded reviews completed, fifteen retained partial with source-specific holds. Queue: 998 reviewed, 407 partial, 1159 queued (2564 identities; full queue readback verified). Imported 28 approved financing events, 43 source-linked participations, 47 event sources and 22 named investor profiles. Seven new generic portfolio links; existing D3/Hive association and its original source preserved. PostgreSQL rollback/atomicity/idempotency/conflict/source-link tests, production rollback, atomic import and exact post-import fact/source audit passed. Database: 2969 total events, 2956 approved, 3860 links, 2340 profiles, 778 event-covered identities.

Honeywell parent debt/facility records are separated from Honeywell Aerospace new-money financing; USD6bn noncash exchange is excluded from new-money notes. Facility ceilings are marked up_to and do not assert drawn cash. Cumulative totals, procurement, namesake issuers, subsidiary/parent financing and unverified investor roles are held. Existing investor aliases reused without overwriting curated profiles. Unknown private funding is not zero.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-forty-fifth.json) · [Manifest](../research-agent/imports/funding-landscape-20261112-forty-fifth.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43305979794) completed successfully at 270e51d9462ea15dd42660efea3bc5df4d449272; live JSON generated 2026-11-12T21:01:46.740Z / 2026-11-12T21:01:48.818Z verified: 567 companies, 1590 landscape events, 1390 participations; 2331 named investor profiles, 314 generic relationships, 285 linked to published company pages. All24 target identities explicitly outside European landscape; new profiles and all8 reconciled generic associations verified live. Actual elapsed 16.6 minutes; 86.7 checked identities/hour and 32.5 completed bounded reviews/hour. No claimed parallel speedup. Lease released; continuation remains enabled and programme incomplete.


### Autonomous funding research — reconciliation 46, 12 November 2026

Checked24 distinct wider-cohort identities Horizon Aircraft through Hyperion Technology Group:3 bounded reviews completed,21 retained partial with source-specific holds. Queue1001 reviewed/428 partial/1135 queued; all2564 identities and full durable queue readback verified. Imported56 approved financing records,51 source-linked participations,91 event sources,35 named investor profiles and2 generic associations. Current importer and three schema fixtures match currentmain blob hashes. Meaningful PostgreSQL rollback/atomicity/idempotency/conflict/source-link tests and production rollback, atomic import, idempotency and exact post-import source/fact audit passed. DB3025total/3012approved events,3911links,2375profiles,793event-covered identities. New profile exact-name duplicate check0.

Exact issuer separation retained: HOVERAir is a brand of separately queued ZeroZero Robotics, so no parent rounds duplicated. Huawei records identify Huawei Investment & Holding group borrower; offshore SPV debt excluded. HPInc post2015 tranches separated from HPE/predecessor issuer. Facility maxima are up_to and do not imply drawn cash. HSW incremental PLN642m distinguished from cumulative PLN1.242bn envelope. Hydrix cash entitlement proceeds exclude noncash conversion. HyImpulse >EUR50m extension is incremental equity; 2025 EUR30m public financing/cumulative totals held. Hylio final common-stock sales distinguished from live offering targets and noncash fees. Existing MBG Baden-Württemberg profile reused. All uncertain histories remain explicitly partial, not zero funding.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-forty-sixth.json) · [Manifest](../research-agent/imports/funding-landscape-20261112-forty-sixth.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43315694363) succeeded at d2bec2c9d9ea5555a5de3e949efa16025fac518f. Live JSON 2026-11-12T22:00:44.582Z/2026-11-12T22:00:47.072Z:567 European companies,1590events,1390participations;2366named profiles,316generic associations/287published company links. All24 targetslugs explicitly outside European landscape; new profiles and bothgeneric associations verified, without claiming new wider-cohort events appear on European map. Actual elapsed9min;160 checkedidentities/hour,20 completedreviews/hour; no parallel speedup inferred. Lease released; next24 Hyperscale through Imaging in the Sky. Programme incomplete; continuation remains enabled; schedules unchanged.


### Autonomous funding research — reconciliation 47, 12 November 2026

Checked24 identities Hyperscale through Imaging in the Sky:5 bounded reviews completed,19 retained partial with source-specific holds. Queue1006 reviewed/447 partial/1111 queued; all2564 unique identities and full durable queue readback verified. Imported37 approved financing records,100 source-linked participations,47 event sources,36 named investor profiles and5 generic associations. Current importer and three schema fixtures exactly match main. PostgreSQL rollback/atomicity/idempotency/conflict/source-link tests, production rollback, atomic import, idempotency and exact fact/source audit passed. DB3062total/3049approved events,4011links,2411profiles,804event-covered identities. New profile exact-name duplicate check0. Research ledger:91 queries/117source checks.

ICEYE primary Series E EUR150m and Series F EUR450m are separated from secondary placements. Series F remains conditional/announced; August Scaleup Europe Fund joins same round, not a new event. Business Finland grants/loans split; overlapping EUR28.3m continuation held. ICEYE Poland does not inherit Finnish parent financing. True Ventures2015 retrospective investment preserves date precision and undisclosed amount. ideaForge IPO/QIP fresh proceeds exclude OFS; Infosys exact individual contributions stored only as participations, unknown round totals null. ICI EUR725k is exact own allocation, not EUR4m/8m consortium budget; signeddate not projectstart. IAI division/collaboration labels do not inherit parent bonds. ImageSat primaryIPO proceeds exclude secondary sale. Parent/control associations and procurement do not assert cash raises. Existing manager aliases reused with original source names noted; named vehicles FIMI6/FrenchTechSeed/DeepTech2030 retained separately. Unknown histories remain partial, not zero funding.

[Audit report](../research-agent/reports/2026-11-12-funding-landscape-forty-seventh.json) · [Manifest](../research-agent/imports/funding-landscape-20261112-forty-seventh.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43324173569) succeeded at 51f23f8b31a9ee4791f439896536e985ea151277. Live JSON 2026-11-12T22:55:15.962Z/2026-11-12T22:55:18.544Z:567European companies,1590events,1390participations;2402named profiles,321generic associations/292published company links. All24targetslugs explicitly outside European landscape; new profiles and five newgeneric associations verified without claiming new wider-cohort events appear on European map. Existing Seraphim/ICEYE association preserved. Actual elapsed12.3min;117.1 checkedidentities/hour,24.4 completedreviews/hour; no parallel speedup inferred. Lease released; next24 Immersive Wisdom through Inspired Flight. Programme incomplete; continuation enabled; schedules unchanged.


## Investment research checkpoint — 2026-11-13 UTC (forty-eighth run)

Research completed for 24 disjoint wider-cohort identities, Immersive Wisdom through Inspired Flight, across four read-only groups. Saved 24 event proposals, 47 participant proposals and 16 generic association proposals, with 85 logged searches and 108 source-ledger entries. Five bounded-review and 19 partial-review dispositions are proposals pending writer consolidation; queue counters remain unchanged.

The execution environment disconnected before canonical reconciliation and new-manifest PostgreSQL validation. No rollback rehearsal, atomic import or new publication was performed; database writes: zero. Read-only production recheck: 3,062 events / 3,049 approved, 4,011 participations, 2,411 investor profiles, 804 event-covered companies and 324 generic associations, unchanged from baseline. The forty-seventh import and its verified publication remain the latest completed result. Research proposals are not production-approved facts; unknown private financing remains unknown.

[Prepared recovery index](../research-agent/prepared/funding-landscape-20261112-forty-eighth.json) · [Checkpoint report](../research-agent/reports/2026-11-12-funding-landscape-forty-eighth.json). Four group files were read back from main and cover 24 unique planned IDs. Restore execution, reconcile canonical vehicles/issuer continuity, test the consolidated manifest, rehearse rollback, import atomically and audit before applying queue dispositions or triggering the existing catalogue build. No source holds require Nazar. Writer lease released; continuation configuration retained and repository schedules unchanged. Actual elapsed 15.37 minutes; 93.7 researched identities/hour during this preparation run; zero completed queue updates/imports. No concurrency speedup inferred.


## Investment research recovery and publication — 2026-11-13 (forty-ninth run)

Recovered all24 prepared identities from the forty-eighth checkpoint, reran original-source QA in four disjoint read-only groups and consolidated one tested manifest. Added24 approved events,47 sourced participations,34 event sources,37 investor profiles and16 generic associations. Five bounded public-source reviews completed;19 histories remain partial. Queue:1011 reviewed /466partial /1087queued (2564identities). Production:3086events /3073approved,4058participations,2448profiles,815event-covered companies,340generic associations.

PostgreSQL rollback/atomicity/idempotency/conflict/source-FK tests passed. Production rollback baseline, atomic commit, post-import idempotency, exact facts/roles/sources and unchanged curated-profile hash verified. Canonical Vertex Ventures Israel reused; Indrajaal kept announced basis; contracts/acquisitions/cumulative totals and unsupported histories remain excluded or held.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-forty-ninth.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-forty-ninth.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43340558952) succeeded at 4fe4e537d98bdbba78d46a81f36402090e6d9d01. Live JSON 2026-11-13T00:53:32.381Z / 2026-11-13T00:53:34.530Z:567European companies,1590events,1390participations;2439named profiles,337generic portfolio links. All50 referenced profiles,47participant sourceURLs and16generic links verified. All24targets remain outside European landscape; no gate changes or false map-event claim. Previous execution environment issue resolved. Actual elapsed 7.73minutes; 186.3audited identities/hour, 38.8completed bounded reviews/hour. Prior preparation was recovered, not counted as fresh research; no parallel speedup claim.

Writer lease released. Programme incomplete; continuation retained. Next24 queued identities:Insta360 through Iveco. Repository schedules unchanged.


## Investment research publication — 2026-11-13 (fiftieth run)

Researched24 identities Insta360 through Iveco in four disjoint read-only groups;88logged searches (85group+3writer) and112per-company source-ledger entries. Five bounded public-source reviews completed;19historiespartial. Imported23approved events,23source-backed participations,28event sources,20new investor profiles and10generic associations. Queue1016reviewed /485partial /1063queued (2564total). Actualproduction3109events/3096approved,4081participations,2468profiles,823event-covered companies,350generic associations.

Meaningful PostgreSQL tests and production rollback rehearsal passed; baseline restored, one atomic import, exact fact/role/source counts and post-import idempotency verified. All existing investor-profile hash preserved. Parent/subsidiary borrowing, ownership transfers, procurement, consortium totals and uncertain identities retained as holds. IAI recorded faceprincipal inILS, notnetcash; Iridium exactprimaryproceeds and Intelactual closes distinct from netproceeds/options/cumulativecaps. DASA delivery not inferred contractualgrantor. Five bounded negative reviews are unknownprivatefunding, notzero.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fiftieth.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fiftieth.json). [Existing catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43349112530) succeeded at 6283fb4129a905fe3b5be23411cf0583376aa964. Live JSON 2026-11-13T02:01:57.481Z / 2026-11-13T02:01:59.251Z:567European companies,1590events,1390participations;2459named profiles,347generic portfolio links. All33referenced profiles,23participant sourceURLs and10newgeneric links verified. All24targetidentities remain outside European landscape; geography/classification/publicationgates unchanged. Actualelapsed10.72min, 134.4checkedidentities/hour and28completedreviews/hour; no concurrency speedup claimed.

Lease released. Programme incomplete; continuation enabled and repositoryschedules unchanged. Next24:iVent Mobile through Kaizen Aerospace; next iwi potentialalias requires source identity reconciliation.


## Investment research publication — 2026-11-13 (fifty-first run)

Researched 24 identities, iVent Mobile through Kaizen Aerospace, in four disjoint read-only groups. Logged 89 searches and 112 per-company source entries. Six bounded public-source reviews completed; 18 histories remain partial. Added 18 approved events, 27 participations, 20 event sources, 21 investor profiles and eight generic associations. Queue: 1,022 reviewed / 503 partial / 1,039 queued (2,564 identities). Production: 3,127 events / 3,114 approved, 4,108 participations, 2,489 profiles, 830 event-covered companies and 358 generic associations.

Current importer/schema checks and meaningful PostgreSQL tests passed. Production rollback restored the baseline; atomic import, exact fact/role/source/contribution audit, idempotency and curated-profile preservation passed. IWI/iXblue aliases were reconciled without copying 26 existing alias/sibling events. Unavailable Kalashnikov originals remain held. Conditional Toyota proceeds, joint-venture cash, ATM capacities, acquisition consideration, procurement and consortium totals were excluded. The current First Citizens lender was distinguished from pre-2023 Silicon Valley Bank; exact Toyota and JFB vehicles were retained.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fifty-first.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fifty-first.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43356160391) succeeded at 99c0a8f4bc0b0c4e244ab88dfe6ea2998ab63b92. Live JSON generated at 2026-11-13T03:02:39.339Z / 2026-11-13T03:02:41.990Z: 567 European companies, 1,590 events, 1,390 participations; 2,480 named profiles and 355 generic portfolio links. All 32 referenced profiles, 27 participant source URLs and eight new generic links verified. All 24 target identities remain outside the European landscape; geography, classification, publication gates and schedules are unchanged.

Actual elapsed 10.28 minutes; 140.1 checked identities/hour and 35 completed reviews/hour. No concurrency speedup claimed. Lease released; programme incomplete and continuation retained. Next 24: Kaizen Laboratories through Kelly Hills Unmanned Systems. Legacy STATE and frozen snapshots remain untouched.


## Investment research publication — 2026-11-13 (fifty-second run)

Researched 24 identities, Kaizen Laboratories through Kelly Hills Unmanned Systems, in four disjoint read-only groups. Logged 88 searches and 116 per-company source entries. Four bounded public-source reviews completed; 20 histories remain partial. Added 28 approved events, 20 participations, 35 event sources, 14 investor profiles and nine generic associations. Queue: 1,026 reviewed / 523 partial / 1,015 queued (2,564 identities). Production: 3,155 events / 3,142 approved, 4,128 participations, 2,503 profiles, 843 event-covered companies and 367 generic associations.

Current importer/schema checks and meaningful PostgreSQL tests passed. Production rollback restored the baseline; atomic import, exact fact/role/source/contribution audit, idempotency and curated-profile preservation passed. Kara Dag alias events were not duplicated. Facility limits, bond face principal, gross/net proceeds and pending share allotments remain distinct. KBR's actual parent draw was verified; government/programme budgets and subsidiary or parent borrowing were not misassigned. Kelly Hills' original 19 February announcement was distinguished from the next-day repost.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fifty-second.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fifty-second.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43362796705) succeeded at e24e76fc1d70d8acc2501e8a9b76ec4e3e1b8041. Live JSON generated at 2026-11-13T04:02:32.153Z / 2026-11-13T04:02:34.892Z: 567 European companies, 1,590 events, 1,390 participations; 2,494 named profiles and 364 generic portfolio links. All 26 referenced profiles, 20 participant source URLs and nine new generic links verified. All 24 target identities remain outside the European landscape; geography, classification, publication gates and schedules are unchanged.

Actual elapsed 15.14 minutes; 95.1 checked identities/hour and 15.9 completed reviews/hour. No concurrency speedup claimed. Lease released; programme incomplete and continuation retained. Next 24: KestrelX through Kongsberg Discovery. Legacy STATE and frozen snapshots remain untouched.


## Investment research publication — 2026-11-13 (fifty-third run)

Researched 24 cohort identities, KestrelX through Kongsberg Discovery, in four disjoint read-only groups. Executed 79 searches (76 group + three writer); three shared Kite alias queries were counted once. Retained 101 per-company source entries. Eight bounded public-source reviews completed; 16 histories remain partial. Added 18 approved events, 19 participations, 24 event sources, 11 investor profiles and ten generic associations. Queue: 1,034 reviewed / 539 partial / 991 queued (2,564 identities). Production: 3,173 events / 3,160 approved, 4,147 participations, 2,514 profiles, 849 event-covered companies and 377 generic associations.

Current importer/schema checks and meaningful PostgreSQL tests passed. Production rollback restored the baseline; atomic import, exact fact/role/source/contribution audit, idempotency and curated-profile preservation passed. Kinetica is a venture firm, not the funded database namesake. Kite aliases were reconciled without transferring Swoop or university proceeds. Kinnami's instrument remains undisclosed; Klein's own PPP allocation and Kodiak's explicitly named Ares contribution were verified. SPAC aggregates, parent borrowing, undrawn facilities, acquisition prices and programme totals were not presented as fresh company cash.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fifty-third.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fifty-third.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43369980981) succeeded at 43ad9ed617d9d776e632fb0b3d49557d3c7b226a. Live JSON generated at 2026-11-13T05:09:09.645Z / 2026-11-13T05:09:13.280Z: 567 European companies, 1,590 events, 1,390 participations; 2,505 named profiles and 374 generic portfolio links. All 25 referenced profiles, 19 participant source URLs and ten new generic links verified. All 24 target identities remain outside the European landscape; geography, classification, publication gates and schedules are unchanged.

Actual elapsed 17.87 minutes; 80.6 checked identities/hour and 26.9 completed reviews/hour. No concurrency speedup claimed. Lease released; programme incomplete and continuation retained. Next 24: Kongsberg NanoAvionics through L3Harris WESCAM; reconcile Kraken and group/subsidiary identities before attributing facts. Legacy STATE and frozen snapshots remain untouched.


## Investment research publication — 2026-11-13 (fifty-fourth run)

Researched 24 new cohort identities, Kongsberg NanoAvionics through L3Harris WESCAM, in four disjoint read-only groups and rechecked published Liebherr Aerospace. Executed 109 searches (106 group + three writer); two shared Kraken identity queries counted once. Retained 131 per-company source entries. Seven bounded public-source reviews completed; 18 new or retained partial reviews include the Liebherr follow-up. Added 77 approved events, 40 participations, 98 event sources, 25 investor profiles and eight generic associations. Nine generic associations were confirmed, with the existing SmartCap link preserved. Queue: 1,041 reviewed / 556 partial / 967 queued (2,564 identities). Production: 3,250 events / 3,237 approved, 4,187 participations, 2,539 profiles, 862 event-covered companies and 385 generic associations.

Current importer/schema checks and meaningful PostgreSQL tests passed. Production rollback restored the baseline; atomic import, exact fact/role/source/contribution audit, idempotency and curated-profile preservation passed. Kpler's EUR20m primary equity is distinct from secondary sales. Kraken namesakes, earlier convertible holdings and alternate round currencies were reconciled. KP Labs own grant allocations exclude consortium totals; implementation dates are not award dates. Kubota Credit USA and WESCAM financing was not transferred to parents or siblings. Original AST&Science investor name retained. Published Liebherr remains partial because the generic brand spans distinct legal recipients; its latest industrial capex is not a round.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fifty-fourth.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fifty-fourth.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43376725939) succeeded at e808b20ed4cd8b05497dadbf6281bf6632cc79b6. Live JSON generated at 2026-11-13T06:10:16.072Z / 2026-11-13T06:10:19.316Z: 567 European companies, 1,590 events, 1,390 participations; 2,530 named profiles and 382 generic portfolio links. All 45 referenced profiles, 40 participant source URLs and nine generic links plus their source URLs verified. All 24 new target identities remain outside the European landscape; no funding event changed for the published Liebherr follow-up. Geography, classification, publication gates and schedules remain unchanged.

Actual elapsed 15.81 minutes; 94.9 checked identities/hour and 26.6 completed reviews/hour. No concurrency speedup claimed. Lease released; programme incomplete. Hourly continuation independently confirmed enabled. Next 24: Lamarr AI through LightPath Technologies. Legacy STATE and frozen snapshots remain untouched.


## Investment research publication — 2026-11-13 (fifty-fifth run)

Researched 24 cohort identities, Lamarr AI through LightPath Technologies, in four disjoint read-only groups. Executed 118 searches (116 group + two writer) and retained 107 per-company source entries. Six bounded reviews completed; 18 histories remain partial. Added 62 approved events, 72 participations, 68 event sources, 40 investor profiles and four generic associations. Queue: 1,047 reviewed / 574 partial / 943 queued (2,564 identities). Production: 3,312 events / 3,299 approved, 4,259 participations, 2,579 profiles, 878 event-covered companies and 389 generic associations.

Current importer/schema checks and meaningful PostgreSQL tests passed. Production rollback restored the baseline; atomic import, exact fact/role/source/contribution audit, idempotency and curated-profile preservation passed. Nineteen existing Leonardo/DRS-RADA alias events were inspected without copying. LightPath primary proceeds exclude secondary sales. Leidos actual borrowers, Leonardo divisions, WASS ownership transfer, conditional LeoLabs commitment and undrawn facilities remain distinct. GENIUS award instrument is unknown; programme totals and finalist selection were not extra financing. Non-Latin investor names retain original spellings with English transliterations; identity matching preserves distinct names.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fifty-fifth.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fifty-fifth.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43382795721) succeeded at 18e2dc1572ffd8dccd9bf2eda06dac23e3897333. Live JSON generated at 2026-11-13T07:02:45.532Z / 2026-11-13T07:02:47.443Z: 567 European companies, 1,590 events, 1,390 participations; 2,570 named profiles and 386 generic portfolio links. All 62 referenced profiles, 72 participant source URLs and four generic links plus their source URLs verified. All 24 targets remain outside the European landscape; geography, classification, publication gates and schedules are unchanged.

Actual elapsed 11.58 minutes; 124.3 checked identities/hour and 31.1 completed reviews/hour. No concurrency speedup claimed. Lease released; programme incomplete and continuation retained. Next 24: Lily Robotics through M-tron Industries. Legacy STATE and frozen snapshots remain untouched.


## Investment research publication — 2026-11-13 (fifty-sixth run)

Researched 24 cohort identities, Lily Robotics through M-tron Industries, in four disjoint read-only groups. Executed 99 searches (96 group + three writer) and retained 101 per-company source entries. Six bounded reviews completed; 18 histories remain partial. Added 41 approved events, 70 participations, 48 event sources, 40 investor profiles and 13 generic associations. Queue: 1,053 reviewed / 592 partial / 919 queued (2,564 identities). Production: 3,353 events / 3,340 approved, 4,329 participations, 2,619 profiles, 889 event-covered companies and 402 generic associations.

Current importer/schema checks and meaningful PostgreSQL tests passed. Production rollback restored the baseline; atomic import, exact fact/role/source/contribution audit, idempotency and curated-profile preservation passed. LiveEO's latest amount remains more than EUR28m at first close, while 2022 public funding and possible 2023/2024 overlap remain held. Living Optics January GBP16m versus later USD20m descriptions were not counted twice. ESA project support remains generic pending legal instrument verification. Original investor names and exact fund contributions were retained with canonical continuity mapping. LPP, LUNA and M-Air issuer conflicts, IPO secondary proceeds, acquisition prices and undrawn capacity were not converted to new company cash.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fifty-sixth.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fifty-sixth.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43390061408) succeeded at 409900c46ea23d9c970c8b5bd9e414322ee20872. Live JSON generated at 2026-11-13T08:02:51.090Z / 2026-11-13T08:02:53.461Z: 567 European companies, 1,590 events, 1,390 participations; 2,610 named profiles and 399 generic portfolio links. All 65 referenced profiles, 70 participant source URLs and 13 generic portfolio entries with their source URLs verified. Twelve entries link to company pages; the ESA/LiveEO entry is present by slug and company ID with published=false and no URL under existing publication gates. All 24 targets remain outside the European landscape; geography, classification, publication gates and schedules are unchanged.

Actual elapsed 10.52 minutes; 136.9 checked identities/hour and 34.2 completed reviews/hour. No concurrency speedup claimed. Lease released; programme incomplete and continuation retained. Next 24: Mach Industries through Marvin Test Solutions, with Manna alias reconciliation first. Legacy STATE and frozen snapshots remain untouched.


## Investment research publication — 2026-11-13 (fifty-seventh run)

Researched 24 cohort identities, Mach Industries through Marvin Test Solutions, in four disjoint read-only groups. Executed 98 searches (96 group + two writer) and retained 116 per-company source entries. Eight bounded reviews completed; 16 histories remain partial. Added 29 approved events, 55 participations, 35 event sources, 35 investor profiles and 15 generic associations. Queue: 1,061 reviewed / 608 partial / 895 queued (2,564 identities). Production: 3,382 events / 3,369 approved, 4,384 participations, 2,654 profiles, 900 event-covered companies and 417 generic associations.

Current importer/schema checks and meaningful PostgreSQL tests passed. Production rollback restored the baseline; atomic import, exact fact/role/source/contribution and extension-parent audit, idempotency and curated-profile preservation passed. Manna's six canonical events were inspected without duplication. Mach's additional USD600m is linked to the initial USD300m Series C, rather than another USD900m primary record. MagLev actual sold snapshots exclude limits and already included sales; Afcon's MOU remains conditional and attributed to the exact subsidiary. Mahindra parent securities, government allocations, registered capital, acquisitions, crowdfunding orders and procurement remain distinct. Exact source investor names and legal vehicles retained; unresolved histories documented.

[Audit report](../research-agent/reports/2026-11-13-funding-landscape-fifty-seventh.json) · [Manifest](../research-agent/imports/funding-landscape-20261113-fifty-seventh.json). [Catalogue build](https://github.com/brunotaut/xSonomy/actions/runs/43397783455) succeeded at 7eae5e58a17b7d4d3896c6ed7457f53917113676. Live JSON generated at 2026-11-13T09:01:48.146Z / 2026-11-13T09:01:50.623Z: 567 European companies, 1,590 events, 1,390 participations; 2,645 named profiles and 414 generic portfolio entries. All 53 referenced profiles, 55 participant source URLs and 15 generic portfolio entries with their source URLs verified; all 15 current entries have company links. All 24 targets remain outside the European landscape; geography, classification, publication gates and schedules are unchanged.

Actual elapsed 12.53 minutes; 114.9 checked identities/hour and 38.3 completed reviews/hour. No concurrency speedup claimed. Lease released; programme incomplete and continuation retained. Next 24: Material Impact through MG Cleaning Systems; fund LP commitments require distinction from company rounds. Legacy STATE and frozen snapshots remain untouched.


## 2026-11-13 — funding research run58 verified

Audited the next24 cohort identities, Material Impact through MG Cleaning Systems, in four disjoint read-only groups. Executed95 financing/history and transaction-party searches (91group,4writer); recorded107 per-company source-ledger dispositions plus writer primary-source QA. Eleven bounded public-source reviews completed; thirteen retained partial histories. Private funding and held candidates remain unknown, never zero by inference.

The unchanged tested importer added22 approved events,21 sourced round participations,28 event-source rows,10 investor profiles and4 generic owner/parent associations, covering9 additional companies with supported events. Actual production totals:3404 events (3391approved),4405 participations,4701 sources,2664 profiles,909 companies with events,421 generic relationships. PostgreSQL rollback/atomic/idempotency/conflict/source-FK checks, production rollback rehearsal, post-import repeat rehearsal and exact fact/role/source/contribution audit passed; one same-company extension parent matched. No conflicting facts or missing participation sources; existing curated-profile hash preserved. Exact-name duplicate check found none among new profiles.

Source checkpoint: 02e7e4df545fcaebb5c72fa39574878cc71d39a6. Catalogue docs-only trigger: 3599c506251437f03b44bd3174716938216c54ee; [workflow](https://github.com/brunotaut/xSonomy/actions/runs/43406313516) completed successfully. Live landscape generated 2026-11-13T10:05:28.964Z, investor directory 2026-11-13T10:05:32.010Z. European map remains567 companies/1590 events/1390 participations; all24 targets are outside that map. Directory publishes2655 profiles (nine existing anonymous placeholders excluded) and418 portfolio entries. All22 referenced profiles,21 participation source URLs and4 generic identity/source entries verified; all4 generic entries have company links. No geography, classification or publication gate changed.

Amounts and issuer notes distinguish Matternet cash from bridge conversions, Mercury net equity proceeds from debt capacity, MetalCraft's own more-than-CAD6m award from programme budgets and US subsidiary grants, and exact Dutch MetaSensing beneficiary allocations from consortium totals. Historical GE source maps to the same General Electric Company registrant operating as GE Aerospace; exact subscribing vehicle stays unknown. MatrixSpace filing overlap and Merlin initial PIPE terms remain explicit source holds. Fund LP commitments, procurement, noncash changes, outgoing investment and secondary acquisition consideration are excluded.

Queue:1072 reviewed_public_sources,621 source_review_partial,871 queued (2564 identities). Actual elapsed lease-to-publication 16.63minutes: 86.6 identities/hour and 39.7 bounded reviews/hour; no concurrency speedup or programme ETA claimed. Next24 queued: Micantis through ModalAI. [Audit](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-fifty-eighth.json); [manifest](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/imports/funding-landscape-20261113-fifty-eighth.json). Legacy STATE.json, frozen snapshots, curated profiles, existing gates and repository schedules preserved. Programme remains in progress; no user decision or access blocker. Lease released.


## 2026-11-13 — funding research run59 verified

Audited the next24 cohort identities, Micantis through ModalAI, in four disjoint read-only groups. Executed110 financing/history and transaction-party searches (104group,6writer); recorded106 per-company source-ledger dispositions plus writer original-source QA. Seven bounded public-source reviews completed; seventeen histories remain partial. Source candidates, unidentified issuers and empty rows never imply zero funding.

Unchanged tested importer added32 approved events,29 sourced participations,42 event-source rows,24 profiles and9 generic owner/investor associations, covering12 further companies with events. Production now3436 events (3423approved),4434 participations,4743 sources,2688 profiles,921 covered companies and430 generic relationships. PostgreSQL rollback/atomic/repeat/conflict/source-FK tests, production rollback rehearsal, exact fact/role/source/contribution audit and post-import idempotency rehearsal passed. No fact mismatches or missing participant sources; curated-profile hash preserved. New-profile exact-name duplicate check found none.

Source checkpoint: edf45b73fab1911cc7cc1e5f9e905e9143ff162f. Catalogue documentation trigger: 0df1ee5d340bc8b1d1d1b99c25ea561cb3ffa9b4; [workflow](https://github.com/brunotaut/xSonomy/actions/runs/43412720548) succeeded. Live landscape generated 2026-11-13T10:55:13.490Z, investor directory 2026-11-13T10:55:16.003Z. European map remains567 companies/1590 events/1390 participations; all24 targets outside map. Directory now2679 profiles (nine existing anonymous placeholders excluded) and427 portfolio entries. All34 referenced profiles,29 participation source URLs and9 generic identity/source entries verified; all9 new generic entries have company links. Company geography, classification and publication gates unchanged.

Original-currency equity, convertible SAFE proceeds, grants, repayable TPC financing and Japanese parent bonds remain distinct. Millibeam ownAUD3m SeriesA preference-share cheque is not entire multi-investor round; IGP ownAUD2616297 grant retains unknown award date. MicroCon USD5m gross SAFE and USD2m loan repayment are not additional net financing. Milvus EUR200k and MindFoundry GBP249980 cheques retained without converting or duplicating USD rounds. MiTAC unknown cash capital-increase amounts remain null; noncash spin-off and nominal-price inference excluded. Underwriting and investor intentions do not establish beneficial debt investors. Mobilicom warrants record actual incremental cash, Mobix gross/net describe same offering. Acquisition consideration, government procurement and group budgets excluded. Identity and historical claims remain explicit source holds.

Queue:1079 reviewed_public_sources,638 source_review_partial,847 queued;2564 identities preserved. Actual elapsed lease-to-publication 9.41minutes: 153 identities/hour and 44.6 bounded reviews/hour; no concurrency speedup or ETA inferred. Next24 queued: Molfar Defence Technologies through Navantia. [Audit](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-fifty-ninth.json); [manifest](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/imports/funding-landscape-20261113-fifty-ninth.json). Legacy STATE.json, frozen snapshots, curated profiles, existing gates and repository schedules preserved. Programme remains in progress; no decision/access blocker. Writer lease released.


## 2026-11-13 — funding research run60 verified

Audited the next24 cohort identities, Molfar Defence Technologies through Navantia, in four disjoint read-only groups. Executed105 financing/history and transaction-party searches (99group,6writer); recorded126 per-company source-ledger dispositions plus writer source QA. Three database article contexts resolved identity questions. Ten bounded public-source reviews completed; fourteen histories remain partial. No zero-funding inference from candidates, empty rows or failed fetches.

Unchanged tested importer added37 approved events,71 sourced participations,46 event-source rows,34 profiles and9 generic associations, covering14 further companies with events. Production now3473 events (3460approved),4505 participations,4789 sources,2722 profiles,935 companies with events and439 generic relationships. PostgreSQL rollback/atomic/repeat/conflict/source-FK tests, production rollback rehearsal, exact fact/role/source/contribution and one same-company extension-parent audit, and post-import idempotency rehearsal passed. No fact mismatches or missing participant sources; curated-profile hash preserved. New-profile case-insensitive exact-name duplicate check found none.

Source checkpoint: 4bbd5c8582cd11854d958cb8fa755074cc242ba9. Catalogue documentation trigger: 0475629133390ab73a91a9784b8054f6e7c42adc; [workflow](https://github.com/brunotaut/xSonomy/actions/runs/43420985512) succeeded. Live landscape generated 2026-11-13T11:56:50.829Z, investor directory 2026-11-13T11:56:52.582Z. European map remains567 companies/1590 events/1390 participations; all24 targets outside map. Directory now2713 profiles (nine existing anonymous placeholders excluded) and436 portfolio entries. All57 referenced profiles,71 participation source URLs and9 generic identity/source entries verified; all9 generic entries have company links. Company geography, classification and publication gates unchanged.

Muon original exactUSD56703744 SeriesB and incremental44.5m equity distinguished from45m facilities and cumulative totals. Molfar1.5m firstclose is not2m target. Moog/Motorola own borrowing separated from group/secondary finance and undrawn capacity. Non-dilutive Army275k/DARPA750k cash prizes explicitly labelled, not conventional grants or procurement; no prize enum invented. NTU original confirms Google.org750k inUSD; same3November grant, notwhole6mSingapore programme or340k safety/faculty subsets. Nash logistics and N3XT Quantum department resolved through cohort context and primary parties; unrelated banking entities excluded. Navantia three2025 SEPI loans are own primary cash, not598m extra aggregate or2026framework. NaTran draft regulatory approval held, not cash. NATRIX SEB loan and LIAA support retain distinct instruments and unknown amounts where required. Public histories and source limits remain explicit.

Queue:1089 reviewed_public_sources,652 source_review_partial,823 queued;2564 identities preserved. Actual elapsed lease-to-publication 10.92minutes: 131.9 identities/hour and 54.9 bounded reviews/hour; no concurrency speedup or ETA inferred. Next24 queued: Navantia UK through Nikon; parent financing and NextVision aliases require reconciliation. [Audit](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixtieth.json); [manifest](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/imports/funding-landscape-20261113-sixtieth.json). Legacy STATE.json, frozen snapshots, curated profiles, existing gates and schedules preserved. Programme remains in progress; no decision/access blocker. Writer lease released.


## 2026-11-13 — funding research run61 verified

Audited the next24 cohort identities, Navantia UK through Nikon, in four disjoint read-only groups. Recorded112 successful financing/history and transaction-party search queries (106group,6writer),115 per-company source-ledger dispositions plus writer source QA, and4 database article identity contexts. One groupB four-query call returned503; execution unknown and excluded from successful counts. Seven bounded reviews completed; seventeen histories remain partial. Source candidates, empty rows and failed fetches never imply zero funding.

Unchanged tested importer added29 approved events,68 sourced participations,40 event-source rows,31 profiles and4 generic associations, covering10 further companies with events. Production now3502 events (3489approved),4573 participations,4829 sources,2753 profiles,945 companies with events and443 generic relationships. PostgreSQL rollback/atomic/repeat/conflict/source-FK tests, production rollback rehearsal, exact fact/role/source/contribution and two same-company extension-parent audits, and post-import idempotency rehearsal passed. No fact mismatches or missing participant sources; curated-profile hash preserved. New-profile case-insensitive exact-name duplicate check found none.

Source checkpoint: 24d153ffab3dcbe37dd31ccb43a782b85e8b61fc. Catalogue documentation trigger: 5d16a8c8db03e65ac846002c6b1abcc00450cbfe; [workflow](https://github.com/brunotaut/xSonomy/actions/runs/43429320012) succeeded. Live landscape generated 2026-11-13T12:56:48.365Z, investor directory 2026-11-13T12:56:50.978Z. European map remains567 companies/1590 events/1390 participations; all24 targets outside map. Directory now2744 profiles (nine existing anonymous placeholders excluded) and440 portfolio entries. All54 referenced profiles,68 participation source URLs and4 generic identity/source entries verified; all4 generic entries have company links. Company geography, classification and publication gates unchanged.

NavantiaUK ownGBP2.05m contribution retains unknown formal instrument; parentSEPI loans and project budgets not copied. UK75mcapitalincrease cash/in-kind terms and parenttiming remainheld. NearEarth Boeing/Kaman actual issuer findings separated from potential debt/rights conversion overlap. Neros450mconditionalcommitment is not cash; own165mprojectequity notnewraise. NEURA up-toUSD1.4bn staysannounced/unknowninstrument; writer originalTether release identifies Tether Investments independentarm and explicitlead. Newsight source-reported USDgrants distinct from angel/equity and cumulative financing; originallegalgrantcurrency remainsunknown. NextGeoEUR50mprimary excludes secondarygreenshoe; NextVisionILS1387000000 stored onlycanonicalIsraeliissuer, aliaszero duplicate and2026secondarysales excluded. NextNav primary cash/warrant proceeds separated from noncash conversions/redemptions; Nikon additionalunknownamountgrant linkedtoownparentaward. Procurement, rated credit limits, SPAC projections and unrelated Neuromorphic/NexTech namesakes excluded.

Queue:1096 reviewed_public_sources,669 source_review_partial,799 queued;2564 identities preserved. Actual elapsed lease-to-publication 12.29minutes: 117.1 identities/hour and 34.2 bounded reviews/hour; no concurrency speedup or ETA inferred. Next24 queued: NIOA through NUBURU. [Audit](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-first.json); [manifest](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/imports/funding-landscape-20261113-sixty-first.json). Legacy STATE.json, frozen snapshots, curated profiles, existing gates and schedules preserved. Programme remains in progress; no decision/access blocker. Writer lease released.


## 2026-11-13 — funding research run62 verified

Audited the next24 cohort identities, NIOA through NUBURU, in four disjoint read-only groups. Recorded112 financing/history and transaction-party queries (106group,6writer),118 per-company source-ledger dispositions plus writer primary QA and9 database identity contexts. GroupD's two additional debenture/instrument queries are included in106groupqueries. Six bounded reviews completed; eighteen histories remain partial. Source candidates, empty rows and failed fetches never imply zero funding.

Unchanged tested importer added41 approved events,46 sourced participations,53 event-source rows,24 profiles and5 generic associations, covering10 further companies with events. Production now3543 events (3530approved),4619 participations,4882 sources,2777 profiles,955 companies with events and448 generic relationships. PostgreSQL rollback/atomic/repeat/conflict/source-FK tests, production rollback rehearsal, exact fact/role/source/contribution and one same-company extension-parent audit, and post-import idempotency rehearsal passed after final NUBURU reconciliation. Per-event source URL uniqueness and publication-date precision checked. No fact mismatches or missing participant sources; curated-profile hash preserved. New-profile case-insensitive exact-name duplicates: none.

Source checkpoint: f6607fb63a0357430dcbf83494bf83bf3f38fc5f. Catalogue documentation trigger: 691d0e103df9935033ef7c10d23a15065d3a657a; [workflow](https://github.com/brunotaut/xSonomy/actions/runs/43438464150) succeeded. Live landscape generated 2026-11-13T14:00:01.150Z, investor directory 2026-11-13T14:00:04.421Z. European map remains567 companies/1590 events/1390 participations; all24 targets outside map. Directory now2768 profiles (nine existing anonymous placeholders excluded) and445 portfolio entries. All42 referenced profiles,46 participation source URLs and5 generic identity/source entries verified; all5 generic entries have company links. Company geography, classification and publication gates unchanged.

Niron conditionalOSC150m capacity and separateSMSC150mloan distinguished from closedcash, taxcredits andCityofSartell grant. nLight primaryIPO/followonNET and2026base/optiongross keptseparate from secondaryshares/fees/cumulative totals. IntelNixie500k explicitlycashprize. NODA3mpreseed and1mbridge confirmedincremental with datesunknown; Norbit350mactualdraw separated fromacquisitionprice; Nordic1bnNOKissue not1.5bncap,200mUSDundrawnRCF notcash. NorthVector >USD20mA excludesCADtranslation and possibleCSGoverlap. Nova300k/600kbare-dollar backing retained as unknownamount/currency facts pending exactdenomination, notproject/programmebudgets. Northrop ownnotes/facilities nottransferred tocompositeIAI record; uncommittedrenewal clearlynotcash. NTTJapanoperatingissuer notholding/NTTFinanceborrower. NUBURU originalSEC confirms17December2025close, debt repayment plusseparatewarrants:25mprincipal,23.25mgrosscash andestimatednet21.85m areonefinancing. Esousa2024cash versusOID/noncashdebt and July2026gross38m versusrepayments/conversioncapacity reconciled. Russianregisteredcapital, subscription-withunknowncash/in-kind, cancelledbond andstateprocurement excluded.

Queue:1102 reviewed_public_sources,687 source_review_partial,775 queued;2564 identities preserved. Actual elapsed lease-to-publication 17.27minutes: 83.4 identities/hour and 20.8 bounded reviews/hour; no concurrency speedup or ETA inferred. Next24 queued: Nurol Holding through OJSC AGAT (Belarus); Ocius aliases and OHB group require reconciliation. [Audit](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-second.json); [manifest](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/imports/funding-landscape-20261113-sixty-second.json). Legacy STATE.json, frozen snapshots, curated profiles, existing gates and schedules preserved. Programme remains in progress; no decision/access blocker. Writer lease released.


### 2026-11-13 — Sixty-third funding reconciliation published

Audited 24 wider-cohort identities in four disjoint read-only groups; 7 completed bounded public-source reviews and 17 partial source/identity holds. Imported 23 approved events, 34 participations, 33 event source rows, 26 profiles and 7 generic relationships. Source ledger records 119 actual search executions; 124 company-level query references include nine Ocius shared-alias references executed once. Ocius/Ocius Technology duplicate issuer resolved without duplicate events; UK/Estonia Archangel mapped to curated profile separately from Australian Archangel Ventures. Own-issuer primary proceeds, disclosed cash prizes and credit capacities distinguished from secondary consideration, procurement and consortium allocations. Unsupported amounts remain unknown.

PostgreSQL tests, production rollback baseline, atomic import, repeat idempotency, exact fact/role/source/contribution and extension-parent audits passed: 23/34/33/7 matches, zero fact mismatches, zero orphan participation sources, zero new exact-name profile duplicates. Curated profile hash unchanged. DB totals: 3566 events (3553 approved), 4653 participations, 4915 sources, 2803 investor profiles, 963 companies with events. Queue: 1109 reviewed, 704 partial, 751 queued; all 2564 identities preserved. Manifest and queue current-main readbacks verified.

Catalogue docs-only trigger `bc226982b0b9a9cd4fe22f864dea599948d51e11` built successfully: [workflow](https://github.com/brunotaut/xSonomy/actions/runs/43448877538). Fresh live datasets generated 2026-11-13T15:05:17.901Z and 2026-11-13T15:05:21.254Z: 567 European companies, 1590 map events, 1390 map participations; 2794 directory profiles and 452 portfolio entries. All39 referenced profiles,34 participation source URLs and7 original-source generic entries verified; all7 company links clickable. Wider-cohort events remain outside European map under existing gates. Nine legacy anonymous profile placeholders remain excluded. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-third.json).

Measured lease-to-live verification: 13.36 minutes, 107.8 identities/hour and 31.4 completed bounded reviews/hour; no extrapolated ETA or concurrency speedup claim. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company gates/classifications/geography and schedules preserved. Next queue: OKB Simonov through Opticoelectron. Unresolved published Liebherr issuer hold retained. Programme incomplete; short lease released and hourly continuation remains enabled.


### 2026-11-13 — Sixty-fourth funding reconciliation published

Audited 24 wider-cohort identities in four disjoint read-only groups: four bounded public-source reviews completed and 20 partial histories or issuer holds retained. The source ledger records 123 actual searches (119 group, four root). Imported 11 events, 25 participations, 12 event source rows, 13 profiles and nine generic relationships. OpenWorks and Airobotics canonical records were inspected without copying their financing onto aliases. Onebrief mixed primary/secondary proceeds remain unknown; OPSYS Series C total includes its final tranche once. Olaeris campaign claims retain unknown dates; consortium budgets, procurement, acquisitions, product identities and conditional grants were distinguished from confirmed own-issuer funding.

Current importer and three schema fixtures were unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored the baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 11 events, 25 participations, 12 sources and nine relationships, with one correct extension parent, no fact mismatches or unsupported source links. Curated profile hash preserved; no new exact-name profile duplicates. Existing NEA duplicate profiles were preserved, with the existing exact-slug participant reused.

DB totals: 3577 events (3564 approved), 4678 participations, 4927 sources, 2816 investor profiles and 970 companies with events. Queue: 1113 reviewed, 724 partial and 727 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-fourth.json). Catalogue docs-only trigger `d7cc6e0a546f954068781959de801324342b3938`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43457520353). Fresh live datasets generated 2026-11-13T15:56:35.056Z and 2026-11-13T15:56:37.405Z: 567 European companies, 1590 map events, 1390 map participations, 2807 directory profiles and 461 portfolio entries. All 27 referenced profiles, 25 participation source URLs and nine generic entries with original sources verified; all nine company links clickable. Wider-cohort event rows remain outside the European map under existing gates; nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-live verification: 8.9 minutes, 161.7 identities/hour and 27 bounded reviews/hour. No extrapolated ETA or concurrency speedup claim. Legacy STATE.json, frozen snapshots, curated profiles/relationships, geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: Optris through PacMar Technologies. Unresolved published Liebherr attribution retained. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Sixty-fifth funding reconciliation published

Audited 24 wider-cohort identities in four disjoint read-only groups: five bounded public-source reviews completed and 19 partial histories or issuer holds retained. The source ledger records 128 actual searches (122 group, six root), 122 company-level query references and 110 source ledger entries. Imported 26 events, 53 participations, 41 event source rows, 27 profiles and nine generic relationships. Canonical ORIGIN financing was not duplicated onto its alias. OSIRIS DroneOS/UEB-1 continuity verified from issuer products. Orbotix group financing is identified as an economic-brand disclosure, without asserting proceeds to its Romanian operating SRL; draft company gate preserved. Original announced currencies and amount qualifiers retained; unknown legal security, original cash amounts and private parties remain unknown. OQ conditional equity, project budgets, acquisition consideration, programme ceilings, procurement and unexercised Ouster option excluded. Overland equity and venture-debt capacity separated. Existing OTIF ampersand-name profile reused rather than duplicated; Gustav Söhne name decoded correctly and Seattle Ascend distinguished from StLouis namesake.

Current importer and three schema fixtures were unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed after final canonical reconciliation. Production rollback restored the baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 26 events, 53 participations, 41 sources and nine relationships, with no fact mismatches or unsupported participant-source links. Curated profile hash preserved; no new exact-name profile duplicates.

DB totals: 3603 events (3590 approved), 4731 participations, 4968 sources, 2843 investor profiles and 981 companies with events. Queue: 1118 reviewed, 743 partial and 703 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-fifth.json). Catalogue docs-only trigger `43856536cb7e2c9e52d417404c1ffbae775a48a2`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43469027144). Fresh live datasets generated 2026-11-13T17:05:27.365Z and 2026-11-13T17:05:31.273Z: 567 European companies, 1590 map events, 1390 map participations, 2834 directory profiles and 470 portfolio entries. All 51 referenced profiles, 53 participation source URLs and nine generic entries with original sources verified; all nine company links clickable. Wider-cohort event rows remain outside the European map under existing gates; nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-live verification: 12.5 minutes, 115.2 identities/hour and 24 completed bounded reviews/hour. No extrapolated ETA or concurrency speedup claim. Legacy STATE.json, frozen snapshots, curated profiles/relationships, geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: PAE Aviation through Performance Drone Works, with particular attention to PAE, PDW, Perennial and Paramount aliases. Unresolved published Liebherr attribution retained. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Sixty-sixth funding reconciliation published

Audited 24 wider-cohort identities in four disjoint read-only groups: six bounded public-source reviews completed and 18 partial histories or issuer holds retained. The source ledger records 105 actual searches (101 group, four root), 101 company-level query references and 98 source ledger entries. Imported 35 events, 35 participations, 46 event source rows, 21 profiles and three generic relationships. PAE Aviation/Fires/Munitions were evidenced as government acquisition offices, with no company financing assigned. PDW and Perennial aliases did not receive copied financing. Palantir US primary investment was separated from Japan JV, outgoing investment and direct-listing resales. Panasonic actual Holdings issuer and historical renaming lineage were stated explicitly. ParaZero gross primary offerings, Parker actual drawn loans versus undrawn capacity, and Parsons primary IPO/option proceeds and convertible principal were kept distinct. Percepto USD67m remains mixed equity/debt with component split unknown. PDW >USD110m Series B is identified as PDW Holdings economic-brand financing; earlier USD35m tranche is not added again. Conditional loan and later preferred-purchase ambiguities remain held. Palladyne period-aggregate ATM sales remain an explicit programme-level reconciliation hold, not a fabricated individual round.

Current importer and three schema fixtures were unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored the baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 35 events, 35 participations, 46 sources and three relationships, with one correct same-company extension parent, no fact mismatches or unsupported participant-source links. Curated profile hash preserved; no new exact-name profile duplicates. Existing Keen/Perciv relationship preserved; canonical DayOne spelling reused.

DB totals: 3638 events (3625 approved), 4766 participations, 5014 sources, 2864 investor profiles and 993 companies with events. Queue: 1124 reviewed, 761 partial and 679 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-sixth.json). Catalogue docs-only trigger `3c5cff8606a1b5b6d20254060449d28e4a97117c`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43478811207). Fresh live datasets generated 2026-11-13T18:04:03.466Z and 2026-11-13T18:04:06.265Z: 567 European companies, 1590 map events, 1390 map participations, 2855 directory profiles and 473 portfolio entries. All 30 referenced profiles, 35 participation source URLs and three generic entries with original sources verified. Two generic company links clickable; Destinus/Perciv entry correctly retains published=false and no URL because Perciv remains draft. Wider-cohort event rows remain outside the European map under existing gates; nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-live verification: 10.96 minutes, 131.4 identities/hour and 32.8 completed bounded reviews/hour. No extrapolated ETA or concurrency speedup claim. Legacy STATE.json, frozen snapshots, curated profiles/relationships, geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: PerimeterAI through Portal Aircraft. Unresolved published Liebherr attribution retained. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Sixty-seventh funding reconciliation published

Audited 24 wider-cohort identities in four disjoint read-only groups: three bounded public-source reviews completed and 21 partial histories or issuer holds retained. The ledger records 128 actual searches (122 group, six root), 122 company-level query references and 100 source ledger entries. Imported 22 events, 29 participations, 33 event source rows, 32 profiles and seven generic relationships. Persona actual sold securities are separated from its open offering target and earlier pre-seed. Perseus and Petrel dates and private terms remain unknown. Phenix predecessor identity and sister-brand Petrel funding were not inferred. Picraft's repeated INR800k grant announcement was deduplicated; Runway INR1.2m remains instrument-undisclosed. Pierce's USD1.08m debt disclosure retains its 2021 first-sale date and 2024 filing date without asserting a new 2024 cash closing. Planet PIPE, historical cash Series D and convertible principal are separate from noncash acquisition shares, SPAC aggregate proceeds, fees, targets and option double-counting. Porsche SE is distinct from operating Porsche AG; original H1 and Q3 reports confirm March EUR740m plus May EUR320m extension, disbursed in September, without adding the EUR1.06bn aggregate again. Polaris is the US vehicle issuer. Government budgets, contract awards, programme pools and product identities were not treated as company funding.

Current importer and three schema fixtures were unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed with the final corrected manifest. Production rollback restored the baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 22 events, 29 participations, 33 sources and seven relationships, with one correct same-company extension parent, no fact mismatches or unsupported participant-source links. Curated profile hash preserved; no new exact-name profile duplicates.

Final source QA corrected PNI prize status from closed to announced because the winner announcement does not confirm disbursement. This used an explicit exact-old-value guarded update, production rollback rehearsal, verified atomic correction and preserved reversal record; the amount and date remain unknown. No new or duplicate event was created. [Reviewed correction and reversal record](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/imports/funding-landscape-20261113-sixty-seventh-correction.json).

DB totals: 3660 events (3647 approved), 4795 participations, 5047 sources, 2896 investor profiles and 1004 companies with events. Queue: 1127 reviewed, 782 partial and 655 queued; all 2564 identities preserved. Current-main queue and corrected manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-seventh.json). Catalogue docs-only trigger `d994c29e2dd6db3d1cddbc701e1f8cce5c98250c`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43489246256). Fresh live datasets generated 2026-11-13T19:08:47.057Z and 2026-11-13T19:08:49.396Z: 567 European companies, 1590 map events, 1390 map participations, 2887 directory profiles and 480 portfolio entries. All 36 referenced profiles, 29 participation source URLs and seven generic entries with original sources verified; all seven company links clickable. Wider-cohort event rows, including PNI's corrected status, remain outside the European map under existing gates; the status correction does not change published directory data and required no duplicate build. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 17.37 minutes, 82.9 identities/hour and 10.4 completed bounded reviews/hour. This includes the reviewed correction; concurrent durations are not summed. No extrapolated ETA or concurrency speedup claim. Legacy STATE.json, frozen snapshots, curated profiles/relationships, geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: POSCO through PteroDynamics. Unresolved published Liebherr attribution retained. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Sixty-eighth funding reconciliation published

Audited 24 cohort identities in four disjoint read-only groups: four bounded public-source reviews completed and 20 partial histories or attribution holds retained. An additional published Liebherr follow-up retained the exact-recipient hold. The ledger records 148 actual searches (140 group, eight root), 140 company-level query references and 119 company-source ledger entries. Imported 35 events, 74 participations, 55 event sources, 38 profiles and one generic relationship. POSCO operating issuer is separate from Holdings/subsidiaries. Powerus APC actual cash is separated from OID face value, AGH predecessor proceeds and merger consideration; the conflicting initial placement remains held. Procore completed USD950m convertible notes replace an undrawn terminated USD700m bridge candidate; IPO gross and net proceeds are distinct. Prodrone exact allotment vehicles and approval/disbursement status are preserved. Project35 cancelled funding and Protego fund commitments are excluded. PSI primary/secondary allocation remains unknown in investment disclosures with null amounts. PT PAL capital injections are equity, not grants. Protora/C Speed continuity supports only evidenced generic backing.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored the baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched all 35 events, 74 participations, 55 source rows and one generic relationship, without mismatches or unsupported participant-source links. Curated profile hash preserved; no new exact-name profile duplicates. No existing fact correction was required.

DB totals: 3695 events (3682 approved), 4869 participations, 5102 sources, 2934 investor profiles, 1016 companies with events and 484 generic relationships. Queue: 1131 reviewed, 802 partial and 631 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-eighth.json). Catalogue docs-only trigger `9f62081ccb10a9d9d48bd87a6bb8008d403e0a1a`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43498173878). Fresh live datasets generated 2026-11-13T20:05:28.361Z and 2026-11-13T20:05:31.083Z: 567 European companies, 1590 map events, 1390 map participations, 2925 directory profiles and 481 portfolio entries. All57 referenced profiles,74 participation source URLs andone generic entry with original source andclickable companylink verified. Wider-cohort event rows remain outside the European map under existing gates; nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 12.29 minutes, 117.2 identities/hour and 19.5 completed bounded reviews/hour. Concurrent durations not summed; no extrapolated ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: PVP Advanced EO Systems through Rannon. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Sixty-ninth funding reconciliation published

Audited24 cohort identities in four disjoint read-only groups: five bounded public-source reviews and19 partial histories or identity holds. The ledger records118 actual searches (114 group,four root),114 company query references and105 company-source entries. Imported25 events,51 participations,36 event sources and33 profiles; no generic relationships. Rafael alias receives no duplicate events. PX4 is a software project; creator patronage and QTI procurement are excluded. Pyka earlierUSD3m/late2019USD8m are distinct original chronology events; unverified2026SeriesC candidate remains held. QLM exact GBP rounds, legal subscriber identities and GBP1m SWIF contribution are preserved without claiming an additional fullGBP3.5m closing. PZL signed PLN grant is not confirmed disbursement. Quantum Cyber actualUSD6m preferred placement differs from undrawn up-toUSD8m commitment; warrant/ATM history remains partial. Quectel CNY gross and nine exact contributions reconcile. RADA gross proceeds, direct contributions and secondary/conversion boundaries are separate. Rakuten parentnotes retain legal debt status. Rannon prize is announced without inventing a grantor, amount or payment date.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored baseline, atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched25 events,51 participations and36 sources, with no mismatches or unsupported source links. Curated profile hash preserved; no new exact-name profile duplicates. No existing fact correction required.

DB totals:3720 events (3707 approved),4920 participations,5138 sources,2967 investor profiles,1027 companies with events and484 generic relationships. Queue:1136 reviewed,821 partial,607 queued; all2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-sixty-ninth.json). Catalogue docs-only trigger `9a6aa32cd86861d0361bd8fd5f202fefc1e8f2eb`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43505617116). Fresh live datasets generated 2026-11-13T20:53:48.691Z and 2026-11-13T20:53:50.712Z:567 European companies,1590 map events,1390 map participations,2958 directory profiles and481 portfolio entries. All41 referenced profiles and51 participation source URLs verified;33 new profiles published. Wider-cohort event rows remain outside the European map under existing gates. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification:9.48 minutes,151.8 identities/hour,31.6 completed bounded reviews/hour. Concurrent durations not summed; no extrapolated ETA or concurrency speedup claimed. Legacy STATE.json,frozen snapshots,curated profiles/relationships,company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue:Rantizo through Remote Tactical Solutions Group. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Seventieth funding reconciliation published

Audited 24 cohort identities in four disjoint read-only groups: three bounded public-source reviews and 21 partial histories or issuer holds. The ledger records 119 actual searches (113 group, six root), 116 company-level query references and 100 company-source entries. Imported 35 events, 120 participations, 43 event sources, 53 profiles and three generic backing relationships. Rantizo seller and renamed listed issuer remain distinct; acquisition shares and deferred capital are not assumed cash. RTX parent notes and undrawn renewal are separated from Raytheon UK's verified GBP250k grant payment. RayNeo retains over-CNY1bn lower bound. Raptor award instrument/payment and backing dates remain unknown. Red Cat final options are counted once; Lind cash differs from note face. Red Dot Japan does not inherit Singapore financing. Redwire parent equity and actual ATM sales differ from subsidiary credit, capacity and secondary proceeds. Regal facility is corporate AUD capacity. REGENT alias receives no duplicate events; Craft mixed financing retains debt-draw uncertainty. Relativity and Reliable histories preserve original source dates, explicit roles and mixed extension boundaries. Allen and Senator source-name variants reuse existing profiles; source spellings retained and profiles preserved.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed with final canonical mappings and RayNeo qualifier. Production rollback restored baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 35 events, 120 participations, 43 sources and three relationships, including two correct same-company extension parents, with no mismatches or unsupported source links. Curated profile hash preserved; no new exact-name duplicates. No existing fact correction required.

DB totals: 3755 events (3742 approved), 5040 participations, 5181 sources, 3020 investor profiles, 1039 companies with events and 487 generic relationships. Queue: 1139 reviewed, 842 partial, 583 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-seventieth.json). Catalogue docs-only trigger `2cdd0434128b379b36c9281dd8b23a1fab6f7844`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43515071805). Fresh live datasets generated 2026-11-13T21:57:14.908Z and 2026-11-13T21:57:18.006Z: 567 European companies, 1590 map events, 1390 map participations, 3011 directory profiles and 484 portfolio entries. All 95 referenced profiles, 120 participation source URLs and three generic entries with original sources and clickable company links verified; 53 new profiles published. Wider-cohort event rows remain outside the European map under existing gates. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 12.72 minutes, 113.2 identities/hour and 14.1 completed bounded reviews/hour. Concurrent durations not summed; no extrapolated ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: RENK through Rocky Mountain Unmanned Systems. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Seventy-first funding reconciliation published

Audited 24 cohort identities in four disjoint read-only groups: three bounded public-source reviews and 21 partial histories or issuer holds. The ledger records 140 actual searches (136 group, four root), 136 company query references and 99 company-source entries. Imported 23 events, 18 participations, 27 event sources, nine profiles and one generic backing relationship. RENK Group financing capacity is distinct from operating GmbH history, seller IPO proceeds and guarantees. Replay's unknown round total differs from an explicit USD9m contribution. ResilienX awards retain unknown instrument/payment. Resonant's unnamed Cerberus affiliate is not replaced with a parent cheque. Canada contribution repayment/disbursement terms remain unknown; Rheinmetall partner/JV/division and parent borrowers remain separate. Ricardo gross financing and RCF capacity differ from WSP acquisition consideration. Rincell seed and final CEC approval are distinct; Army procurement and tax exclusion are excluded. RIIS award role/instrument remains undisclosed. Robinson does not inherit Ascent financing; Robot Aviation legal restart remains held. Rocket Lab actual programme sales preserve original thousands units, approximate gross, successor issuer and guarantee boundaries. Rocket One is former Hoth Therapeutics; precise-looking ATM gross retains the original approximate qualifier.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed, repeated with the final corrected manifest. Production rollback restored baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 23 events, 18 participations, 27 sources and one relationship, with no mismatches or unsupported source links. Curated profile hash preserved; no new exact-name duplicates. Australian Future Fund canonical identity reused.

Final source QA corrected the NRC contribution announcement date to unknown: the exact February22/2021 agreement start remains in the note and does not prove a public announcement date. An expected-old-value guard, separate production rollback, atomic update, verified reversal record and corrected-manifest idempotency were used. Counts, amount, instrument, roles and curated profiles remain unchanged; no new event created. [Reviewed correction and reversal record](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/imports/funding-landscape-20261113-seventy-first-correction.json).

DB totals: 3778 events (3765 approved), 5058 participations, 5208 sources, 3029 investor profiles, 1051 companies with events and 488 generic relationships. Queue: 1142 reviewed, 863 partial, 559 queued; all 2564 identities preserved. Current-main queue and corrected manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-seventy-first.json). Catalogue docs-only trigger `310ca8922ce14c788ae4e50768b8a49bd4dbcec3`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43523582769). Fresh live datasets generated 2026-11-13T22:59:35.456Z and 2026-11-13T22:59:39.011Z: 567 European companies, 1590 map events, 1390 map participations, 3020 directory profiles and 485 portfolio entries. All 19 referenced profiles, 18 participation source URLs and one generic entry with original source and clickable company link verified; nine new profiles published. Wider-cohort event rows remain outside the European map under existing gates, including the corrected NRC date. The correction does not affect directory data and needed no duplicate build. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 14.56 minutes, 98.9 identities/hour and 12.4 completed bounded reviews/hour. Concurrent durations not summed; no extrapolated ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: Romarm through SandboxAQ. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-13 — Seventy-second funding reconciliation published

Audited 24 cohort identities in four disjoint read-only groups: two bounded public-source reviews and 22 partial histories or issuer holds. The ledger records 135 actual searches (129 group, six root), 129 company query references and 106 company-source entries. Imported 24 events, 61 participations, 38 event sources, 19 profiles and one historical backing relationship.

Rotax grants retain exact recipient allocations and unknown public announcement dates. Romarm conditional subsidiary borrowing, Roselectronics subsidiary loans, Rosomak tax relief and Rostec ISIN registrations remain held. Rotor Riot historical Red Cat backing does not assert current ownership or a new artificial round. Racing RotorX stays distinct from namesakes. Rovertech grant amount, grantor and cash payment remain unknown. Rownd continuity is explicit in the original YC profile; procurement is excluded. Ørsted gross rights issue, actual Danish State subscription, nominal parent bonds and subsidiary guarantor are distinct; banks with zero underwriting subscriptions are not investors. Rune individual investors are separate from their employers; Pax VC source name reuses existing Pax after original portfolio corroboration. University support retains its own PLN159,028 allocation, not total project value. Safran E&P and Sabena grants retain exact legal recipients; holding acquisitions stay separate. SAF Luminor capacity is not a new draw or renewal round. Saildrone stages and EIFO original DKK164m contribution retain currencies and explicit roles. SandboxAQ same final Series E is refined to USD452m from a later original disclosure; USD95m employee secondary is excluded. Its CHIPS award carries minority nonvoting equity, so it remains mixed signed funding with unknown disbursement. Published Liebherr allocation hold rechecked against originals and retained without a duplicate reviewed-identity count.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 24 events, 61 participations, 38 sources and one relationship, with no mismatches or unsupported links. Curated profile hash preserved; no new exact-name profile duplicates. No existing fact correction required. Nine public announcement dates remain unknown; signature, issue and project-start dates are preserved only in notes.

DB totals: 3802 events (3789 approved), 5119 participations, 5246 sources, 3048 profiles, 1062 companies with events and 489 generic relationships. Queue: 1144 reviewed, 885 partial, 535 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-13-funding-landscape-seventy-second.json). Catalogue docs-only trigger `fc70bc4a19d38a5a96fc17f17851393d8da6dfc8`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43530673554). Fresh live datasets generated 2026-11-13T23:56:51.919Z and 2026-11-13T23:56:56.321Z: 567 European companies, 1590 map events, 1390 map participations, 3039 directory profiles and 486 portfolio entries. All 51 referenced profiles, 61 participation source URLs and one historical backing entry with original source and clickable company link verified; 19 new profiles published. Wider-cohort events remain outside the European map under existing gates. Nine pre-existing anonymous profiles remain excluded.

Measured actual lease-commit-to-verification: 11.75 minutes, 122.6 identities/hour and 10.2 completed bounded reviews/hour. Concurrent durations not summed; no ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: Saronic Technologies through SEAir. Programme incomplete; short writer lease released and continuation remains enabled.


### 2026-11-14 — Seventy-third funding reconciliation published

Audited 24 identities in four disjoint read-only groups: one bounded evidenced non-company review and 23 partial histories or issuer holds. The ledger records 123 actual searches (121 group, two root), 130 company query references and 103 company-source entries. Imported 33 events, 124 participations, 40 event sources, 39 profiles and four historical or generic backing relationships.

Saronic original datelines distinguish migrated page dates, closed Series C/D and procurement/capex. Exact SAS competition provenance identifies Greece despite preserved French catalogue metadata; two recipient grants retain unknown public announcement dates. SatVu earlier rounds and same-company extension remain distinct from undisclosed incremental amounts, insurance and unresolved 2024/2026 overlap; original currencies and explicit bank contribution preserved. Scaled Directed Energy is an evidenced government technology area, not a separate financed company; no metadata deletion. Scaleout Swedish identity and currency are source-supported despite unchanged US metadata; Almi contribution and SEB foundation differ from bank financing. Scantinel unknown total differs from Scania contribution; extension links its parent, while later annual-report overlap remains held. SCD news identity and canonical manufacturer share exact infrared provenance; no duplicate events/backing across aliases. SAIC current issuer differs from predecessor Leidos; actual drawn term loan, revolver capacity, nominal notes and latest conditional priced offering are distinct. Belgian ScioTeq recipient grants exclude French affiliate allocations. Scout rounds retain explicit co-leads; source-disclosed unresolved BVVC/Evolution profiles remain visible holds, not guessed duplicate profiles. Exact SDA/SDB/Scorpion identities prevent agency budgets, contracts or supplier prizes becoming company proceeds. SE3 latest original Nov12 round and prior undisclosed seed are separate. Sea Machines final closes are counted once; earlier aggregate, sidecar and overlapping filing amounts remain held. SEA.AI original former OSCAR/BSB continuity and individual investors verified. Seagate subsidiary borrowers and SEAir unresolved legal/tranche claims remain held. Published Liebherr source-level issuer/allocation limitation rechecked and retained.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored baseline, atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 33 events, 124 participations, 40 sources, four relationships and two correct same-company extension parents, with no mismatches or unsupported source links. Curated profile hash preserved; no new exact-name duplicates. No existing fact correction required.

DB totals: 3835 events (3822 approved), 5243 participations, 5286 sources, 3087 profiles, 1073 companies with events and 493 generic relationships. Queue: 1145 reviewed, 908 partial, 511 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-14-funding-landscape-seventy-third.json). Catalogue docs-only trigger `9ac8a067cd81c4ade9e0643ea5f66786b044c692`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43537710027). Fresh live datasets generated 2026-11-14T01:00:02.523Z and 2026-11-14T01:00:05.221Z: 567 European companies, 1590 map events, 1390 map participations, 3078 directory profiles and 490 portfolio entries. All 90 referenced profiles, 124 participation source URLs and four generic entries with original sources and clickable company links verified; 39 new profiles published. New event rows remain outside the European map under existing gates. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 11.73 minutes, 122.7 identities/hour and 5.1 completed bounded reviews/hour. Concurrent durations not summed; no ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: SeaOwl Group through Shenzhen Xindong Energy Technology. Programme incomplete; writer lease released and continuation remains enabled.


### 2026-11-14 — Seventy-fourth funding reconciliation published

Audited 24 identities in four disjoint read-only groups: one bounded review and 23 partial histories or issuer holds. The ledger records 122 actual searches (120 group, two root), 121 company query references and 106 company-source entries. Imported 19 events, 59 participations, 25 event sources, 34 profiles and seven historical or generic backing relationships.

Seasats early and latest original rounds retain explicit roles, unknown strategic amount and source vehicle holds; procurement and cumulative contracts are excluded. Seneca launch financing remains an investment disclosure with unresolved historical components, not an invented priced seed/Series A split. SeaOwl historical investor fund vehicles and buyer backing remain separate from seller consideration. Sener signed EIB commitment does not imply loan draw. SenseNet exact NRC contribution preserves CAD, unknown repayment terms and unknown announcement date; conflicting Series A currencies remain held. Sensorama own CORDIS allocation and Seeds of Bravery support differ from programme maxima and founder aggregates. Sentera additional2018 financing and same-company Series C extension remain distinct from later acquisition. Sentient recipient-specific award differs from programme total. SES actual USD138.5m preferred round refines rounded139m; D-plus and USD274.5m common-stock PIPE are distinct. Trust cash, combined gross, secondary registration and ATM capacity are excluded from PIPE proceeds; collective subscriptions are not split into invented cheques. Sesame Verizon USD125k is explicitly a per-winner prize, not an inferred share or presumed grant; Michigan own award amount remains unknown. SGS subsidiaries do not inherit parent finance. Shahed/HESA, Sentinel and other namesakes retain source-specific identity holds. Shenyang operating SAC received the exact CNY3,481,236,582.58 cash equity injection from its distinct listed parent; parent placement and recipient registered capital are not additional recipient proceeds. Chinese issuer original PDFs and completion evidence were checked, including screenshots. Published Liebherr control-company versus operating-recipient allocation hold remains explicit.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 19 events, 59 participations, 25 sources, seven relationships and one correct same-company extension parent, with no mismatches or unsupported source links. Curated profile hash preserved; no new exact-name duplicates. No existing fact correction required.

DB totals: 3854 events (3841 approved), 5302 participations, 5311 sources, 3121 profiles, 1083 companies with events and 500 generic relationships. Queue: 1146 reviewed, 931 partial, 487 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-14-funding-landscape-seventy-fourth.json). Catalogue docs-only trigger `37955ca75a0b28c9fc3c6337447218528ba0bcd5`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43544159325). Fresh live datasets generated 2026-11-14T02:04:28.263Z and 2026-11-14T02:04:31.005Z: 567 European companies, 1590 map events, 1390 map participations, 3112 directory profiles and 497 portfolio entries. All 56 referenced profiles, 59 participation source URLs and seven generic entries with original sources and clickable company links verified; 34 new profiles published. New event rows remain outside the European map under existing gates. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 12.85 minutes, 112.1 identities/hour and 4.7 completed bounded reviews/hour. Concurrent durations not summed; no ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: Shield AI through SimX. Programme incomplete; writer lease released and continuation remains enabled.


### 2026-11-14 — Seventy-fifth funding reconciliation published

Researched 24 identities in four disjoint read-only groups; all 24 retain partial-history or identity dispositions. The ledger records 112 actual searches (109 group, three root), 126 company query references and 102 company-source entries. Imported 25 events, 42 participations, 33 event sources, 17 profiles and eight historical or generic backing relationships. No completed bounded reviews are claimed in this checkpoint.

Shield original rounds distinguish mixed debt/equity and same-company equity extensions; final totals are not duplicated. Closed March2026 components are corroborated by June closure; unnamed Blackstone-managed funds do not become a manager cheque. November acquisition financing remains planned and held; JPMorgan arranger is not a presumed lender. Conflicting Hercules200m/150m disclosures remain held. Siemens direct AG digital bonds differ from subsidiary issuance and settlement providers. Siemens Energy approximate own cash share issuance retains its qualifier; Finance BV debt guarantees are separate. SiFly and Sila aliases receive no duplicated events; source-supported canonical identities hold their histories while catalogue metadata remains unchanged. SNC/SierraSpace/DeutscheAircraft borrowers and SIG/BFA real-estate financing remain distinct. Sila verified grant, Series G and current private equity disclosures preserve unknown announcement dates and fund vehicles; conflicting2021 totals and conditional OSC1.4bn before definitive documents remain held. Silentium recipient grant is distinct from fund budget. Signature, Sightline and Silvus generic ownership backing does not imply new operating-company cash. Silynx gross offerings retain exact/approximate qualifiers, actual closes and unknown shareholders; underwriters/options are excluded. SimActive government contribution is expressly repayable debt, not grant cash. SIMCom exact fund vehicles' CNY200m subscriptions preserve source-described nominal equity with debt-like substance and repurchase obligations as mixed signed financing. SimpleSense original FormD reports USD629300 actually sold with zero remaining, not an extra aggregate or named shareholder cheque. SIMCom acquisition/capex, Simrad business splits, SimX product/namesake ambiguity and procurement are source-specific holds. Published Liebherr allocation limitation remains unresolved.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 25 events, 42 participations, 33 sources, eight relationships and two correct same-company extension parents, with no mismatches or unsupported links. Curated profile hash preserved; no new exact-name duplicates. No existing fact correction required.

DB totals: 3879 events (3866 approved), 5344 participations, 5344 sources, 3138 profiles, 1093 companies with events and 508 generic relationships. Queue: 1146 reviewed, 955 partial, 463 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-14-funding-landscape-seventy-fifth.json). Catalogue docs-only trigger `27fbbfc44681d7d7db7dfa7a23d1e843eb9757a2`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43549448632). Fresh live datasets generated 2026-11-14T03:02:38.178Z and 2026-11-14T03:02:41.860Z: 567 European companies, 1590 map events, 1390 map participations, 3129 directory profiles and 505 portfolio entries. All 39 referenced profiles, 42 participation source URLs and eight generic entries with original sources and clickable company links verified; 17 new profiles published. New event rows remain outside the European map under existing gates. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 12.9 minutes, 111.6 checked identities/hour and zero completed bounded reviews/hour. Concurrent durations not summed; no ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: SiNAB Technologies through SkyDefense. Programme incomplete; writer lease released and continuation remains enabled.


### 2026-11-14 — Seventy-sixth funding reconciliation published

Researched 24 identities in four disjoint read-only groups: two bounded reviews and 22 partial histories or source holds. The ledger records 131 actual searches (125 group, six root), 125 company query references and 101 company-source entries. Imported 25 events, 53 participations, 31 event sources, 32 profiles and eight historical or generic backing relationships.

SiNAB official recipient allocation refines rounded issuer amount to AUD215400; approval month and EBITDA-based programme term do not establish payment, announcement date or non-repayability. Singularity prior seed disclosure retains unknown amount and current Series A excludes valuation and unresolved short investor names. Sintermat source precision conflict is retained with a conservative common lower bound; exact fund vehicles differ from managers. Sion historical BASF and Cummins stakes remain separate from current round and manager identities. Skeleton source-supported rounds and same-company extension exclude factory grants, subsidiary borrowers, ambiguous later nine-digit claims and cumulative totals. SmartCap Green Fund is generic backing, not a manager or Defence Fund cheque. Skapion original body36m prevails over conflicting headlines; QFund normalization additionally corroborated by original qfund.io portfolio naming both Skapion and existing Esh-Tech provenance, reusing q-fund without profile duplication. SkeyDrone exact BAV SA subscription cash increase is one event across instalments, not registered capital or parent airport proceeds. SKK original primary IPO gross7m differs from seller3m and net~5.26m; listed successor Rantizo remains distinct from Delaware seller. Registered-direct amount is issuer-reported USD value of actual USDT crypto consideration, explicitly not USD cash or an independently assumed peg; token quantity is undisclosed. Actual ATM gross retains approximate qualifier; shelf/programme capacity is excluded. Existing Rantizo and SKK funding rows were checked before import and both were empty. Skoltech annual grant schedule is not multiplied into an invented total; federal support retains upper bound. SkyHunter own Front contribution does not establish round total or turn valuation into financing. SkySapience legal creditors and historical convertible/secured instruments retain unknown original principal/date/currency; later payoff is not a new round. Generic owners and product/brand aliases do not inherit unrelated financing. Published Liebherr issuer/allocation limitation remains explicit.

Current importer and three schema fixtures unchanged. PostgreSQL rollback, atomicity, idempotency, conflict and source-FK tests passed. Production rollback restored baseline; atomic import and repeat rehearsal passed. Exact fact/role/source/contribution audit matched 25 events, 53 participations, 31 sources, eight relationships and one correct same-company extension parent, with no mismatches or unsupported source links. Curated profile hash preserved; no new exact-name duplicates. No existing fact correction required.

DB totals: 3904 events (3891 approved), 5397 participations, 5375 sources, 3170 profiles, 1104 companies with events and 516 generic relationships. Queue: 1148 reviewed, 977 partial, 439 queued; all 2564 identities preserved. Current-main queue and manifest readbacks verified. [Audit report](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-14-funding-landscape-seventy-sixth.json). Catalogue docs-only trigger `6c4fefaaf34c0556bd29db024d15fe0ab0d2b475`: [successful workflow](https://github.com/brunotaut/xSonomy/actions/runs/43554580605). Fresh live datasets generated 2026-11-14T04:02:39.661Z and 2026-11-14T04:02:44.531Z: 567 European companies, 1590 map events, 1390 map participations, 3161 directory profiles and 513 portfolio entries. All 49 referenced profiles, 53 participation source URLs and eight generic entries with original sources and clickable company links verified; 32 new profiles published. New event rows remain outside the European map under existing gates. Nine pre-existing anonymous profile placeholders remain excluded.

Measured lease-to-verification: 17.45 minutes, 82.5 checked identities/hour and 6.9 completed bounded reviews/hour. Concurrent durations not summed; no ETA or concurrency speedup claimed. Legacy STATE.json, frozen snapshots, curated profiles/relationships, company geography/classification/publication gates and repository schedules preserved. No paid API backfill. Next queue: Skydio through SLI. Programme incomplete; writer lease released and continuation remains enabled.


## Funding research — 14 November 2026, seventy-seventh continuation

24 cohort identities checked in four disjoint read-only groups; all24 retain explicit partial-history holds. Imported30 supported events,78 financing participations,35 sources,45 new investor profiles and4 generic relationships after current PostgreSQL tests and production rollback. Exact facts/roles/source/contribution audit passed; idempotency and preserved-profile hash verified. SkyDrop/Flirtey and Skyports group duplicates excluded; Archangel London/Tallinn fund separated from Australian namesake; Axon primary Skydio cash/stock transaction distinct from secondary purchases. Queue1148 bounded reviews,1001 partial,415 queued. No zero-funding inference, gate or schedule changes. Catalogue publication pending. Audit: research-agent/reports/2026-11-14-funding-landscape-seventy-seventh.json.

Publication verified 2026-11-14T05:03:39Z: catalogue commit bcd718d87561b4911eab381ca9318bacbf7a4036, successful build https://github.com/brunotaut/xSonomy/actions/runs/43559440065; fresh landscape05:02:00Z and investor directory05:02:03Z. European map567 companies/1590 events/1390 participations unchanged under existing gates. Directory3206 profiles/517 portfolio entries; all71 referenced profiles,78 source links and4 clickable generic entries verified. DB3934 events/3921 approved/5475 participations/5410 sources/3215 profiles,1118 partial coverage records. 17.65 elapsed minutes, 81.6 checked identities/hour;0 bounded-review closures,24 partial; no concurrency speedup or ETA inferred. Lease cleared; programme remains incomplete, continuation enabled.


## Funding research — 14 November 2026, seventy-eighth continuation

24 cohort identities checked in four read-only groups plus published Liebherr follow-up. Final bounded-review QA completes SMG Consulting with scoped no_public_round_found;23 retain partial histories. Unknown private financing is not zero funding. Imported37 supported financing events,43 participations,45 sources,25 new profiles and5 generic relationships after current PostgreSQL tests, production rollback and exact fact/role/source/contribution audit. Idempotency, profile preservation and2 same-issuer extension parents verified. Sodyo2024 ambiguous subscriber withheld; SocioTeq alias not duplicated; Fortitude alias reused from original portfolio evidence. SoftBank Corp separate from Group; bondholders/arrangers not invented. Queue1149 bounded reviews,1024 partial,391 queued. Publication pending. Audit: research-agent/reports/2026-11-14-funding-landscape-seventy-eighth.json.

Publication verified 2026-11-14T05:59:39Z: catalogue commit dd708e73e6fd276f49f0e748fee1c8b594f1c0cd, successful build https://github.com/brunotaut/xSonomy/actions/runs/43563893027; fresh landscape 2026-11-14T05:57:45.087Z and investor directory 2026-11-14T05:57:49.118Z. European map567 companies/1590 events/1390 participations unchanged. Directory3231 profiles/522 portfolio entries;37 referenced profiles,43 source links and5 clickable generic entries verified. DB3971 events/3958 approved/5518 participations/5455 sources/3240 profiles,1130 partial coverage records. 12.82 elapsed minutes, 112.4 checked identities/hour, 4.7 bounded-review closures/hour. Lease cleared; programme incomplete, continuation enabled.


## Funding research — 14 November 2026, seventy-ninth continuation

24 cohort identities checked in four read-only groups;8 bounded reviews complete,16 partial with explicit holds. Imported13 supported events,41 participations,15 sources,22 new profiles and6 generic relationships after current PostgreSQL tests, production rollback, atomic import and exact fact/role/source/contribution audit. Idempotency and profile preservation verified. SpecktreWorks/SpektreWorks and Spatial/SPS aliases reconciled without duplicated events. Spherea remains draft; group budgets, subsidiary finance and secondary proceeds excluded where unsupported. Published Liebherr is a post-baseline addition absent from cohort queue; separate issuer/allocation hold retained. Queue1157 bounded,1040 partial,367 queued. Publication pending. Audit: research-agent/reports/2026-11-14-funding-landscape-seventy-ninth.json.

Publication verified 2026-11-14T06:59:58Z: catalogue commit ce06369a0d114692bcf6b2360cc4faa4f97cbd27, successful build https://github.com/brunotaut/xSonomy/actions/runs/43568817388; fresh landscape 2026-11-14T06:58:24.676Z and investor directory 2026-11-14T06:58:27.958Z. European map567 companies/1590 events/1390 participations unchanged. Directory3253 profiles/528 portfolio entries;36 referenced profiles,41 source links and6 clickable generic entries verified. DB3984 events/3971 approved/5559 participations/5470 sources/3262 profiles,1138 partial coverage records. 11.58 elapsed minutes, 124.3 checked identities/hour, 41.4 bounded-review closures/hour. Lease cleared; programme incomplete, continuation enabled.


## Funding research — 14 November 2026, eightieth continuation

24 cohort identities checked in four read-only groups;8 bounded reviews complete,16 partial with concrete holds. Imported33 supported events,35 participations,39 sources,16 new investor profiles and9 generic relationships after current PostgreSQL tests, production rollback, atomic import and exact fact/role/source/contribution audit. Idempotency and profile preservation verified. StarkJune round distinct from heldOctober candidate; Advent International identified by original portfolio without merging legacy profiles. Stridar filings verified as separate offerings. Superwake amended contributions counted once; repayment terms remain unknown. Conditional commitments not reported as cash receipts. Queue1165 bounded,1056 partial,343 queued. Publication pending. Audit: research-agent/reports/2026-11-14-funding-landscape-eightieth.json.

Publication verified 2026-11-14T08:01:31Z: catalogue commit 28d794872f8e34b305f2e30dd7fc5b98d8901e1d, successful build https://github.com/brunotaut/xSonomy/actions/runs/43573568730; fresh landscape 2026-11-14T07:59:24.510Z and investor directory 2026-11-14T07:59:27.395Z. European map567 companies/1590 events/1390 participations unchanged. Directory3269 profiles/537 portfolio entries;37 referenced profiles,35 source links and9 clickable generic entries verified. DB4017 events/4004 approved/5594 participations/5509 sources/3278 profiles,1148 partial coverage records. 15.45 elapsed minutes, 93.2 checked identities/hour, 31.1 bounded-review closures/hour. Lease cleared; programme incomplete, continuation enabled.


## Funding research — 14 November 2026, eighty-first continuation

24 cohort identities checked in four read-only groups;8 bounded reviews complete,16 partial with concrete holds. Imported18 supported events,25 participations,24 sources,16 new profiles and14 generic relationships. Reviewed published QuantumSystems co-lead identity moved from legacy Advent alias to existing Advent International using expected-old guards, saved reversal and original source evidence; both profiles and all existing fields retained. Current PostgreSQL tests and combined production rollback, atomic import, exact facts/roles/source/contribution audit and idempotency passed. Profile hash preserved. Swiftstrike alias not duplicated; staged T3 commitments/gross/net cash separated; contracts not grants. Queue1173 bounded,1072 partial,319 queued. Publication pending. Audit: research-agent/reports/2026-11-14-funding-landscape-eighty-first.json.

Publication verified 2026-11-14T09:06:55Z: catalogue commit be87bc5b2f1423006d4f3863dcce184768496f27, successful build https://github.com/brunotaut/xSonomy/actions/runs/43578800275; fresh landscape 2026-11-14T09:05:22.380Z and investor directory 2026-11-14T09:05:25.740Z. European map567 companies/1590 events/1390 participations unchanged; reviewed QuantumSystems co-lead identity/source verified live. Directory3285 profiles/551 portfolio entries;34 referenced profiles,25 source links and14 clickable generic entries verified. DB4035 events/4022 approved/5619 participations/5533 sources/3294 profiles,1156 partial coverage records. 15.67 elapsed minutes, 91.9 checked identities/hour, 30.6 bounded-review closures/hour. Lease cleared; programme incomplete, continuation enabled.


### 2026-11-14 — eighty-second funding reconciliation

Reviewed24 distinct cohort identities in four read-only groups:9 bounded reviews completed,15 retain source-specific holds. Imported27 approved financing disclosures,24 source-linked participations,34 source rows and19 evidenced ownership/portfolio relationships;29 new investor profiles. PostgreSQL tests, production rollback restoration, exact fact/role/source/contribution checks and idempotency passed; curated profiles preserved. Programme remains incomplete. Existing catalogue build pending; schedules unchanged.

Audit: [research-agent/reports/2026-11-14-funding-landscape-eighty-second.json](https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-14-funding-landscape-eighty-second.json).

Publication verified 2026-11-14T10:02:52Z: existing catalogue workflow https://github.com/brunotaut/xSonomy/actions/runs/43583199546 succeeded. Fresh landscape 2026-11-14T10:01:21.526Z and investor data 2026-11-14T10:01:24.841Z verified:567 map companies,1590 events,1390 participations;3314 investor profiles and570 portfolio entries. All40 referenced profiles,24 participation source URLs and19 generic entries/clickable company links verified. New targets remain outside existing European scope. Queue:1182 bounded source reviews,1087 partial,295 queued;2564 identities total. Lease released; continuation remains enabled.


### 2026-11-14 — eighty-third funding reconciliation

Reviewed24 distinct cohort identities in four read-only groups:8 bounded reviews completed,16 retain concrete source/issuer holds. Imported27 approved financing disclosures,23 source-linked participations,41 source rows and18 ownership/portfolio associations;19 new investor profiles. PostgreSQL tests, production rollback restoration, exact fact/role/source/contribution audit and idempotency passed; curated profiles preserved. Existing catalogue build pending. Programme incomplete; schedules unchanged.

Audit: https://github.com/brunotaut/xsonomy-news/blob/main/research-agent/reports/2026-11-14-funding-landscape-eighty-third.json

Publication verified 2026-11-14T10:56:59Z: https://github.com/brunotaut/xSonomy/actions/runs/43587499639 succeeded. Fresh map 2026-11-14T10:55:37.954Z and investor data 2026-11-14T10:55:41.229Z verified:567 map companies,1590 events,1390 participations;3333 investor profiles and588 portfolio entries. All32 referenced profiles,23 participation source URLs and18 generic entries/clickable links verified. New targets remain outside existing European scope. Queue:1190 bounded source reviews,1103 partial,271 queued;2564 identities total. Lease released; continuation enabled.
