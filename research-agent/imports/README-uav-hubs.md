# European UAV & Counter-UAS hub research — import

**Source:** `research-agent/data/2026-10-31-european-uav-hubs.json`
("European UAV and Counter-UAS Hubs Research", version `research-1`, as of 2026-10-31).
Companion report: `research-agent/data/2026-10-31-european-uav-hubs-report.md`.
**Target:** the `hub_research*` staging layer in Supabase project `uobidcahmrmfdmfbrtkt`.
**Report:** `research-agent/reports/2026-10-31-uav-hub-research-import.md`.

## Reproducing the import

```bash
python3 -I research-agent/imports/prepare_uav_hubs.py \
  research-agent/data/2026-10-31-european-uav-hubs.json /tmp/countries_en.json /tmp/hubslices
```

`countries_en.json` is an ISO-code → English-name map taken from the project's own
`countries` table, so the hub export speaks the same country vocabulary as the rest of the
catalogue rather than the dataset's own spelling:

```sql
select json_object_agg(trim(code), name) from countries;
```

That matters for two countries: the dataset says *Czechia* and *Türkiye*, the catalogue says
*Czech Republic* and *Turkey*. The catalogue's names win.

The script validates rather than cleans, and exits non-zero naming the record on: an unknown
`evidence_status`, `record_unit`, `location_kind` or `precision`; a missing `research_id` or
location id; a duplicate of either; a coordinate that is absent, out of range, or carries
more than two decimals while claiming to be an approximate centroid; a source URL that is
not http(s); a country absent from the catalogue; a country review referencing an unknown
record; and a non-Latin character in an authored English field. Source titles are exempt —
they are evidence metadata and keep their original spelling.

Then load the five slices with the SQL functions from
`uav_hub_research_loaders` (hubs first: the other four join on `research_id`):

```sql
select hub_research_load('<hubs json>'::jsonb, '<dataset>', '<version>',
                         'not_independently_confirmed',
                         'Contact operator; availability and eligibility not established in this research.');
select hub_research_load_locations('<locations json>'::jsonb);
select hub_research_load_sources('<sources json>'::jsonb);
select hub_research_load_relationships('<relationships json>'::jsonb);
select hub_research_load_country_reviews('<country reviews json>'::jsonb, '<dataset>');
```

Each returns the number of rows it changed. The payload may omit anything the loader can
derive — `slug` (defaults to `research_id`), `country_name` (from the `countries` table),
`match_key` (from `investor_name_key`), and `operational_status` / `access_model` (the two
trailing arguments, constant across this whole dataset).

Finally re-run the guarded statements in `uav_hub_research_matching_and_review`
(matching, validation, review, per-location approval). They are safe to repeat.

### Verifying a replay creates nothing

Rather than re-feeding the file, replay the database's own content back through the loaders.
A correctly guarded loader must report 0 and the row counts must not move:

```sql
select hub_research_load((select jsonb_agg(jsonb_build_object(
    'research_id',research_id,'slug',slug::text,'name',name,'country',country,
    'country_name',country_name,'locality_text',locality_text,'hub_type',hub_type,
    'record_unit',record_unit,'evidence_status',evidence_status,
    'technology_focus',to_jsonb(technology_focus),'summary_en',summary_en,
    'research_note_en',research_note_en,'operational_status',operational_status,
    'access_model',access_model,'bvlos_status',bvlos_status,'cuas_evidence',cuas_evidence,
    'reviewed_at',reviewed_at,'map_candidate',map_candidate,'match_key',match_key))
  from hub_research), '<dataset>', '<version>');
```

The full five-loader version is in the import report. Verified on this import: 0, 0, 0, 0, 0.

## Migrations, in order

| Name | What it does |
|---|---|
| `uav_hub_research_staging_schema` | the five staging tables |
| `uav_hub_research_loaders` | the five idempotent loaders |
| `uav_hub_research_loader_defaults` | derive slug, country name and match key; constant fields as arguments |
| `uav_hub_research_loader_drop_old_overload` | removes the superseded three-argument signature |
| `uav_hub_research_matching_and_review` | curated matching, validation, the editorial review, per-location approval |
| `uav_hub_research_landscape_projection` | `v_landscape_hubs` and `v_hub_country_reviews` |

## Two deliberate differences from the investor layer

**`hub_research_sources` has a real uniqueness key** — `unique nulls not distinct (hub_id,
location_id, url)`. `investor_research_sources` is unique only on its surrogate `id`, so the
`on conflict do nothing` in `investor_research_load_locations` can never fire and a replay of
that loader would duplicate every location source. It has not been replayed, so there are no
duplicates there today (checked: 202 rows, 0 duplicate groups), but the hub loaders must not
inherit the problem.

**Location-level sources are not stored in this wave.** All 43 localities carry a source set
identical to their record's, so per-location rows would add bytes and no information. The
`location_id` column stays on the sources table for a wave where they differ, and the export
says so in `caveats.locationEvidence`.

## What the import does not do

- It writes nothing to `companies`, `investors`, `products`, `landscape_candidates` or any
  taxonomy table. Verified unchanged: 2,447 live companies, 200 investors, 21 approved
  investor research records, 567 landscape members.
- It does not merge anything. Five records carry a link to an existing catalogue row in
  `matched_company_id` / `matched_investor_id`, each with a `match_role` saying what kind of
  link it is, and one carries `rejected_false_positive` so the wrong match is not made later.
- It does not publish a map candidate on the dataset's recommendation alone. 40 records were
  recommended; 38 were approved. See the report for the two that were not and why.
