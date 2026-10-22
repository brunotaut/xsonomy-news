# Company imports

Companies found by research rather than by the news pipeline. One JSON file per pass.

```bash
node scripts/import-companies.mjs data/company-imports/<file>.json           # dry run
node scripts/import-companies.mjs data/company-imports/<file>.json --write   # apply
```

The file is the audit trail: the diff shows who added what, citing which source, and is
reviewable before anything reaches the database. Entries are checked against company
names, aliases, websites by domain and product names first — this catalogue has already
had to merge seventeen duplicates created by automatic entity resolution, and an import
path that adds more is worse than none.

`suggested_categories` is recorded in the file for the classification step to look at.
It is **not** applied on import; a classification needs its own evidence.

Every entry needs `name`, `hq_country` (which must resolve in the `countries` table) and
at least one `source_urls` entry. `website` is optional but it is the strongest
deduplication key, so include it where known.
