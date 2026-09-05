# xSonomy — system architecture (both repos)

```
 ~40 RSS outlets (sources.json)
        │  daily 05:00 UTC, GitHub Actions in xsonomy-news
        ▼
 ingest.mjs ──► articles ──► analyze.mjs (Claude) ──► companies[]/products[] name strings
                                                           │
                                                           ▼
                                             resolve-entities.mjs (match / blocklist / Claude vet)
                                                           │
                              ┌────────────────────────────┼────────────────────────────┐
                              ▼                            ▼                            ▼
                          companies                    products                  investors / institutions
                     (+ aliases, sectors)          (specs JSONB, maker link)         (side catalogues)
                              │                            │
                enrich-companies / enrich-wikidata         │
                (draft → human review → live)              │
                              └──────────────┬─────────────┘
                                             ▼
                                   Supabase (Postgres)  ◄── anon read from browsers
                                     │                │
       xsonomy-news: generate.mjs ───┘                └─── xSonomy: generate-supabase.mjs
       → news.xsonomy.com (Pages)                          → xsonomy.com catalogue (Pages, 06:00 UTC)

       xsonomy-news: digest.mjs → Resend email (daily/weekly)
```

## Why two repos
GitHub Pages serves one site per repo. `news.xsonomy.com` and `xsonomy.com` need separate repos.
All **writing** to the DB is deliberately concentrated in `xsonomy-news`; `xSonomy` is read-only.

## Tables (in Supabase; not all are in `db/schema.sql` yet)
`articles` · `companies` · `company_aliases` · `company_sectors` · `sectors` · `products` · `product_companies` ·
`article_companies` · `article_products` · `tag_resolutions` · `investors` · `institutions` · `subscribers`

## Human gates
- `companies.publication_status` (`draft` → `live`), `enrichment_status` (`NULL` → `llm`/`wikidata`/curated).
- Catalogue build `PUBLISH_STATUS` flag in `xSonomy/scripts/generate-supabase.mjs` (`null` = all rows, `"live"` = gated).

## Planned: weekly / monthly reports (not built yet)
Query `companies` / `products` where `created_at` or `updated_at` falls in the period → markdown/HTML report of
**new** and **edited** items → email via Resend (reuse digest plumbing) and/or commit to `reports/`.
Options: a `reports.mjs` script on a cron in Actions (cheap, deterministic), or a Claude Code cloud Routine
if you want a written narrative on top of the lists.
