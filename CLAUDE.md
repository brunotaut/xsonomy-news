# xsonomy-news — Claude Code brief

Read this first, then `docs/STATUS.md` for current state. Update STATUS.md at the end of every session (`/wrap-up`).

## What this repo is
The **data pipeline + news site** for xSonomy (UAV / counter-UAS intelligence). It is the only repo that
*writes* to the Supabase database. The sister repo `brunotaut/xSonomy` only *reads* it to build the catalogue site.

- Site: news.xsonomy.com (GitHub Pages, static, deployed by Actions)
- DB: Supabase project `uobidcahmrmfdmfbrtkt` (Postgres). Server scripts use `SUPABASE_SERVICE_KEY`; the browser uses the anon key.
- Owner: Nazar — marketing background, **not a developer**. Explain in plain English, propose before acting, prefer dry runs.

## Pipeline (runs in GitHub Actions)
| Step | Script | Schedule | Writes |
|---|---|---|---|
| Ingest RSS from ~40 outlets (`sources.json`), relevance gate, keyword tags, dedupe on canonical URL | `scripts/ingest.mjs` | daily 05:00 UTC (`ingest-and-deploy.yml`) | `articles` |
| LLM entity pass: reads article body, extracts `companies[]` / `products[]` names | `scripts/lib/analyze.mjs` (called by ingest) | same run | `articles.companies/products/analyzed_at` |
| Entity resolution: turn name strings into real `companies` / `products` rows + junction links; LLM vets unknown names once, decisions cached | `scripts/resolve-entities.mjs` | see STATUS (check if scheduled) | `companies`, `products`, `company_aliases`, `article_companies`, `article_products`, `tag_resolutions`, `investors`, `institutions` |
| Company enrichment (profile/financial fields) from Claude knowledge; leaves `publication_status='draft'` | `scripts/enrich-companies.mjs` | manual | `companies` |
| Company enrichment from Wikidata | `scripts/enrich-wikidata.mjs` | manual | `companies` |
| Build static site from recent articles | `scripts/generate.mjs` | daily, after ingest | `public/` → Pages |
| Email digest via Resend (daily + weekly) | `scripts/digest.mjs` | 08:00 UTC (`digest.yml`) | none (reads `articles`, `subscribers`/`recipients.json`) |
| Historical sitemap backfill / analyze backfill | `backfill.mjs`, `analyze-backfill.mjs` | manual, resumable | `articles` |

## Key files
- `sources.json` — outlet list. `"specialist": true` = keep everything; `false` = must match a UAV keyword.
- `scripts/lib/enrich.mjs` — relevance keywords + tag→theme map (counter-uas, critical-infra, eu-regulatory, c2-sensors, contract-intel, ukraine, swarm, maritime).
- `scripts/lib/resolve.mjs` — matching/blocklist/LLM gate for entity resolution.
- `scripts/lib/supabase.mjs` — all REST calls to Supabase live here. Add new table access here, not inline.
- `db/schema.sql` — **incomplete**: covers `articles`, `tag_resolutions`, `investors`, `institutions` only. `companies`, `products`, junctions, `sectors`, `subscribers` exist in the DB but are not in the repo yet (see STATUS task #1).
- `src/` — frontend template/CSS/JS. `public/` is a build artefact; never hand-edit.

## Env / secrets (GitHub → Settings → Secrets and variables)
Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`.
Variables: `SITE_URL`, `HOME_URL`, `NEWS_CNAME`, `DIGEST_FROM`, `DIGEST_UNSUBSCRIBE`.
Locally: `.env` (git-ignored). Never print or commit keys.

## Working rules
1. **Dry run first** on anything that writes to Supabase: `npm run ingest:dry`, `resolve:dry`, `enrich:companies:dry`, `digest:dry`.
2. Keep writes idempotent (upsert on `url` / `slug`). Re-running must never duplicate.
3. Store only headline + summary + image URL + backlink. Never persist full article text.
4. LLM cost guards stay in place: `ANALYZE_MAX`, `LLM_GATE_MAX`, per-name caching in `tag_resolutions`.
5. New DB columns/tables: add to `db/schema.sql` idempotently **and** apply via Supabase SQL editor (or the Supabase MCP). Note the migration in STATUS.md.
6. Commit small. Explain each change in one plain-English sentence in the commit message.
7. Ask before: deleting data, changing schedules, touching `recipients.json`/`subscribers`, or spending API budget on a backfill.

## Commands
`npm test` · `npm run ingest:dry` · `npm run ingest` · `npm run build` · `npx serve public` · `npm run resolve:dry` · `npm run digest:dry`
