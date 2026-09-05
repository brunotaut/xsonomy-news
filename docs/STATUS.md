# STATUS — xsonomy-news

_Last updated: 2026-09-05 (initial, written from the repo + README; verify against the live DB in session 1)_

## Working now
- Daily ingest + site deploy (05:00 UTC). Email digest daily/weekly via Resend (08:00 UTC).
- LLM entity tagging on ingest; entity resolution into `companies`/`products`; enrichment scripts (manual).

## Known gaps / doubts (verify)
- `db/schema.sql` is missing `companies`, `products`, `company_aliases`, `company_sectors`, `sectors`,
  `product_companies`, `article_companies`, `article_products`, `subscribers`. Repo ≠ DB.
- README still describes companies/products as arrays on `articles` only; the resolver is newer. README is stale.
- Is `resolve-entities.mjs` scheduled, or only run by hand? Check `ingest-and-deploy.yml`.
- Both `subscribers` table and `recipients.json` exist — which one does `digest.mjs` actually use?

## Next tasks (in order)
1. **Schema sync** — dump live schema into `db/schema.sql` (idempotent). No code changes.
2. **README refresh** — make README match reality (short; CLAUDE.md is the real brief).
3. **Schedule check** — ensure resolve-entities runs daily after analyze; add to workflow if not.
4. **Reports** — new `scripts/reports.mjs`: new + edited companies/products for `--period week|month`,
   output markdown + HTML, send via Resend. Add `reports.yml` (Mon 07:00 UTC weekly; 1st of month monthly).
5. **Catalogue publish gate** — decide when to flip `PUBLISH_STATUS` to `"live"` in the xSonomy repo.

## Decisions log
- 2026-09-05 — Keep two repos (Pages constraint). All DB writes stay in xsonomy-news.

## Session notes
_(newest first; `/wrap-up` appends here)_
