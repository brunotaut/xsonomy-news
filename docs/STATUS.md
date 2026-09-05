# STATUS — xsonomy-news

_Last updated: 2026-09-05 (session 1 — schema synced from the live DB)_

## Working now
- Daily ingest + site deploy (05:00 UTC). Email digest daily/weekly via Resend (08:00 UTC).
- LLM entity tagging on ingest; entity resolution into `companies`/`products`; enrichment scripts (manual).
- `db/schema.sql` now mirrors the live database (19 tables, 3 views, 3 functions, 2 triggers,
  52 indexes, 15 RLS policies), verified against project `uobidcahmrmfdmfbrtkt` on 2026-09-05.

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

## Next tasks (in order)
1. **README refresh** — make README match reality (short; CLAUDE.md is the real brief).
2. **ARCHITECTURE.md refresh** — add the six missing tables and explain the taxonomy subsystem
   once its writer is identified.
3. **Reports** — new `scripts/reports.mjs`: new + edited companies/products for `--period week|month`,
   output markdown + HTML, send via Resend. Add `reports.yml` (Mon 07:00 UTC weekly; 1st of month monthly).
4. **Catalogue publish gate** — decide when to flip `PUBLISH_STATUS` to `"live"` in the xSonomy repo.
   Note this is now partly moot: RLS already restricts the anon key to `publication_status = 'live'`
   rows, so the flag is belt-and-braces rather than the actual gate.
5. **Subscriber unsubscribe path** — someone who signs up on the website cannot currently remove
   themselves; removal means hand-editing `recipients.json`.

## Migrations applied to the live DB
- 2026-07-02 — `entity_resolution` (tag_resolutions + articles.entities_resolved_at).
- 2026-07-02 — `investors_institutions`.
- 2026-09-05 — none. `db/schema.sql` was brought into line with the DB; the DB was not changed.

## Decisions log
- 2026-09-05 — Keep two repos (Pages constraint). All DB writes stay in xsonomy-news.
- 2026-09-05 — `db/schema.sql` is documentation of the live DB, kept idempotent. Constraint
  definitions in it are inline in `create table` and therefore only apply on a fresh database;
  columns, indexes and policies re-apply on every run.

## Session notes
_(newest first; `/wrap-up` appends here)_

### 2026-09-05 — session 1
Committed CLAUDE.md + docs. Dumped the live Supabase schema into `db/schema.sql` (read-only;
no writes to the database). Found six tables and three views that no repo doc mentioned, and
that the draft/live review gate is currently empty — everything is published.
