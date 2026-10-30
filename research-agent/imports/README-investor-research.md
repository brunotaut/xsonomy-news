# European defence investor research — import

**Source:** `research-agent/data/2026-10-30-european-defence-investors.json`
("European Defence & UAV Investor Research", version `research-1`, as of 2026-10-30).
**Target:** the `investor_research*` staging layer in Supabase project `uobidcahmrmfdmfbrtkt`.
**Report:** `research-agent/reports/2026-10-30-investor-research-import.md`.

## Reproducing the import

```bash
python3 -I research-agent/imports/prepare_investor_research.py /tmp/payload.json /tmp/countries_en.json
```

`countries_en.json` is an ISO-code → English-name map; take it from the project's own
`countries` table so the names match the rest of the catalogue rather than a fresh
translation:

```sql
select json_object_agg(code, name) from countries;
```

The script translates the Ukrainian labels, derives the English country names, computes
each record's deduplication key and validates the map candidates. It fails loudly on an
untranslated string rather than passing it through.

Then load the slices with the SQL functions created by migration
`20261030223328_investor_research_loaders`:

```sql
select investor_research_load('<records json>'::jsonb, '<dataset>', '<version>', '<assoc meaning>');
select investor_research_load_locations('<locations json>'::jsonb);
select investor_research_load_sources('<sources json>'::jsonb);
select investor_research_load_country_associations('<associations json>'::jsonb, '<assoc meaning>');
```

Every loader returns the number of rows it changed. All four are guarded, so a replay of
the same data returns 0 — verified on this import.

Finally re-run the three guarded statements in
`20261030224217_investor_research_dedupe_and_validation` (dedupe, validation, promotion).
They are safe to repeat and also match nothing on a replay.

## Migrations, in order

| Version | Name | What it does |
|---|---|---|
| 20261030222722 | `investor_research_staging_schema` | the six staging tables |
| 20261030223032 | `investor_research_staging_additions` | English label, dedupe key and link, validation columns, `investor_name_key()` |
| 20261030223130 | `investor_research_ticket_columns` | ticket range as columns rather than free text |
| 20261030223328 | `investor_research_loaders` | the four idempotent loaders |
| 20261030224217 | `investor_research_dedupe_and_validation` | match to existing investors, validate candidates, promote |
| 20261030224259 | `investor_research_landscape_projection` | `v_landscape_investors` and friends |

## What the import does not do

- It does not write to `investors`, `companies`, `products` or any taxonomy table. The 200
  existing investors and 2,447 live companies are untouched; a match is recorded as a link
  in `investor_research.matched_investor_id`, never as a merge.
- It does not populate `investor_research_vehicles`. The dataset nests vehicle names inside
  prose notes ("Definvest and Fonds Innovation Défense are distinct vehicles"), and parsing
  them out would be invention. The table exists so the manager/vehicle distinction has
  somewhere to live when the names are researched properly.
- It does not treat `country_associations` as a headquarters, a legal domicile or an
  investment-eligibility claim. The dataset's own caveat is stored on every record and is
  republished in the export.
