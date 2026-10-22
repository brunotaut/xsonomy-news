# Session 2 — Landscape foundation: implementation report

2026-10-22. Database, schema and plumbing only. No classification, no bulk LLM run,
no snapshots, no frontend.

**SESSION 2 STATUS: PASS** — with three things carried forward, listed in §9.

---

## 1. Migrations applied

Six, all non-destructive and all additive. Recorded in `db/migrations/`; the exact
statements live in `supabase_migrations.schema_migrations`.

| Migration | What it did |
|---|---|
| `countries_reference` | `countries` table + `resolve_country()` |
| `cuas_landscape_taxonomy` | 4 groups, 13 leaves, under the existing sector hierarchy |
| `company_sectors_provenance_and_products` | provenance columns + `company_sector_products` |
| `landscape_candidates` | staging tables |
| `companies_discovery_source` | `discovery_source` column + backfill |
| `merge_companies_self_relationship_fix` | bug found during this session (§8) |

## 2. Tables created

| Table | Rows | Purpose |
|---|---|---|
| `countries` | 74 | geographic reference; 32 flagged `is_landscape_scope` |
| `company_sector_products` | 0 | links a classification to the product that supports it |
| `landscape_candidates` | 794 | workflow staging for one Landscape edition |
| `landscape_candidate_reasons` | 946 | why each company is a candidate, one row per signal |

## 3. Columns added

**`company_sectors`** — `confidence`, `source_urls[]`, `assigned_by`, `assigned_at`, `note`.
**`companies`** — `discovery_source`.

## 4. Constraints and indexes

| Constraint | Effect |
|---|---|
| `company_sectors_llm_needs_source` | an LLM-assigned category must cite ≥1 source **and** carry a date. Human, import and legacy rows are unaffected. |
| `company_sectors_confidence_check` / `_assigned_by_check` | controlled vocabularies, NULL allowed for the 623 legacy rows |
| `companies_discovery_source_check` | `news \| seed \| external_research \| manual \| import` |
| `landscape_candidates_status_check` | `candidate \| screening \| included \| excluded \| needs_review` |
| `landscape_candidate_reasons_check` | the 7 reason values |
| `company_sector_products_classification_fkey` | **composite FK to `company_sectors`** — a supporting product cannot survive the classification it supports |
| `sectors_kind_check` | widened to allow `cuas_capability` |

Indexes: `countries_scope_idx`, `countries_aliases_idx` (GIN), `company_sectors_assigned_by_idx`,
`company_sector_products_product_idx`, `landscape_candidates_status_idx`,
`landscape_candidates_priority_idx`, `landscape_candidate_reasons_reason_idx`.

## 5. Country resolution

**Resolved: 2,051 of 2,052** companies that had a country string. All map to an ISO code
through `countries.name` or `countries.aliases` — including `Czechia`, which the alias
list folds into `Czech Republic`.

**Unresolved: 1.** `BraveTech EU` has `hq_country = 'European Union'`, which is not a
country. Left as it is for review rather than guessed at.

**Still missing: 227.** Of these:

| Signal available | Companies |
|---|---|
| A city | 0 |
| A website (so a TLD to read) | 2 |
| A usable `hq_region` | 0 |
| A unanimous country across their products | 7 |

**Nothing was backfilled.** The only available signal, `products.country`, is itself an
LLM-derived field. Measured against the 847 companies that have both, it agrees with
`hq_country` **93.7%** of the time — good, but a ~6% error rate propagated into the
company record is not "resolved confidently", and one of the seven (`Omnisys`) looks
wrong on inspection. The seven are named in §9 if you want them applied anyway.

**Method used:** exact and alias match on `countries`, via `resolve_country()`. No
inference from name, city, TLD or product.

## 6. Taxonomy

4 groups, **13** assignable leaves. (The brief listed 14 including Multi-Sensor
Detection; removing it leaves 13 — an earlier note in the plan said 14 and was wrong.)

| Group | Leaves | Existing assignments preserved |
|---|---|---|
| C-UAS Detection | RF Detection, Radar, EO/IR, Acoustic Detection | **54** |
| Tracking / Identification | Sensor Fusion, AI / Computer Vision, Command & Control | **11** (on C2) |
| C-UAS Mitigation | RF Jamming, GNSS Jamming / Spoofing, Interceptor UAV, Kinetic, Directed Energy | **93** |
| Integrated C-UAS Systems | *(is its own leaf)* | **57** |

**215 assignments preserved, none moved or deleted.** A company tagged `cuas-mitigation`
today reads as "DEFEAT group, leaf not yet determined".

`Multi-Sensor Detection` was **not** created. It is derived from holding 2+ detection
leaves. `Integrated / Multi-Layer` stays explicit, because a firm selling a radar line
and a jammer line is not thereby an integrator.

The generic `radar` / `rf-detection` / `eo-ir` / `acoustic` sectors were deliberately
**not** reused: "makes radar" and "makes counter-drone radar" are different claims, and
those rows belong to the sensors catalogue.

## 7. Landscape candidates — `europe-cuas-2026`

**794 candidates.** Group A 149, Group B 645.

| Reason | Companies |
|---|---|
| `counter_drone_article` | 201 |
| `existing_cuas_tag` | 149 |
| `cuas_product` | 63 |
| `in_scope_unclassified` | 494 |
| `effector_product` | 34 |
| `external_research` | 7 |

**Overlap — reasons per company:**

| Reasons | Companies |
|---|---|
| 1 | 691 |
| 2 | 67 |
| 3 | 29 |
| 4 | 9 |

Group B splits into **153 with a real signal** (a Counter-UAS or Effector product, a
counter-drone article, or external research) and **494 with none** — in scope and
unclassified, but nothing yet suggesting C-UAS. Screening the 153 first is roughly a
quarter of the cost for nearly all of the yield.

Priority is derived from signal strength (`existing_cuas_tag` 5, `cuas_product` 3,
`external_research` 3, `effector_product` 2, `counter_drone_article` 1) so the screening
pass can work down the list.

**Nothing was classified.** Every row is `status = 'candidate'`.

## 8. Discovery source

| Value | Companies | How determined |
|---|---|---|
| `news` | 1,819 | created after the pipeline was clearly running **and** linked to ≥1 article |
| `seed` | 419 | created in the first two days, when 419 companies existed against 39 products |
| `external_research` | 7 | added by hand on 2026-10-22, certain |
| *(NULL)* | 34 | not determinable — mostly companies with no article link and no early creation date |

Articles start 2026-06-23 and companies 2026-06-25, so "created before any article" was
not usable as the seed boundary and the creation window was used instead.

### The import mechanism

`scripts/import-companies.mjs`, dry-run by default, reading a JSON file from
`data/company-imports/`. Deduplicates against **company names, aliases, websites by
registrable domain, and product names** before inserting; rejects any entry without a
source URL or with a country that does not resolve. Imported rows land as ordinary
`companies` rows with `discovery_source='external_research'` and join the candidate set.
`suggested_categories` is recorded but **not** applied — a classification needs its own
evidence.

Matching rules are in `lib/company-match.mjs` and tested by `test-company-match.mjs`
(50 cases, including every duplicate pair this database has actually produced and the
parent/division pairs that must **not** collapse).

## 9. Unresolved, carried forward

1. **227 companies with no country.** Seven could be filled from `products.country` at
   ~94% confidence: Lendurai (Estonia), Millibeam, Mountain Horse Solutions, Omnisys,
   Parry Labs, Quantum Cyber, Zone 5 (all United States). `Omnisys` is the one I would
   check first — there is a Swedish company of that name. Say the word and they go in.
2. **`BraveTech EU`** has `hq_country='European Union'`. Needs a real country or a
   decision to leave it out of geographic scopes.
3. **Migration SQL is summarised in `db/migrations/`, not reproduced.** The exact
   statements are in Supabase; `supabase db pull` writes them back. Worth doing once
   the CLI is set up, so the repo is self-contained.

## 10. Tests performed

| Test | Result |
|---|---|
| Full `npm test` (10 suites) | pass |
| `test-company-match.mjs` (new, 50 cases) | pass |
| `test-status.mjs` (155 cases) | pass |
| `test-evidence.mjs`, `test-maturity.mjs` | pass |
| Every country string resolves | 2,051 / 2,052 |
| 32 countries flagged in scope | confirmed |
| C-UAS assignments preserved | 215 before, 215 after |
| `products` row count unchanged | 3,405 before, 3,405 after |
| New normalisation does not collapse distinct companies | checked across all 2,279; found 2 **genuine** duplicates, no false positives |
| Orphaned article links / products after merges | 0 |
| Catalogue generator reads only columns that still exist | confirmed — this session only added columns |

### Verification counts

| | Before | After | Why |
|---|---|---|---|
| companies | 2,279 | 2,277 | 2 genuine duplicates merged (§8 below) |
| products | 3,405 | 3,405 | unchanged |
| company_sectors | 624 | 623 | Leonardo duplicate's sector folded into the keeper |
| cuas assignments | 215 | 215 | preserved |
| sectors | 25 | 37 | +1 group, +11 leaves |
| article_companies | 8,711 | 8,711 | unchanged |
| slug_redirects | 15 | 17 | the 2 new merges keep their URLs |

### A bug this session found

Building the importer's name normalisation surfaced two duplicates the earlier cleanup
had missed: **Leonardo / Leonardo S.p.A.** and **Terma / Terma A/S**. Merging them then
failed, which exposed a real bug in `merge_companies()`: a duplicate usually has a
relationship *to* its keeper — "Leonardo S.p.A. is a `division_of` Leonardo" — and
moving that relationship made source = target, which `company_relationships` forbids.
The UPDATE failed before the function's own self-relationship cleanup could run. Those
rows are now deleted first. Both merges then completed, and both old URLs redirect.

---

## 11. Not done, by instruction

No classification into leaves. No bulk LLM enrichment. No Coverage Gap Analysis pass.
No snapshots. No frontend. No Group B screening.

The next step is step 5 of the revised sequence — screening Group B's 153 signalled
candidates — and it should start as its own session.
