# The 13 composite-name renames — execution and verification

**Date:** 2026-10-31 · **Authorised:** the 12 Tier A renames plus the dependent row F
(Vega), with the reviewed aliases. · **Applied via:** Supabase migration
`composite_name_renames_tier_a_and_vega`.
**Package:** `2026-10-31-composite-correction-package.md` ·
`2026-10-31-composite-correction-manifest.csv` ·
`2026-10-31-composite-renames.sql` + `-rollback.sql`

## Recheck before applying — zero drift

All 13 rechecked against the live records immediately before the write. **Every current
name matched the manifest exactly**, all 13 were `live`, all 13 still needed the change,
and **none of them carried any alias at all**, so no alias row was being overwritten.

Collision dry run, all five checks empty:

| check | result |
|---|---|
| new name equals another company's name | **0** |
| new name equals another company's name ignoring case and punctuation | **0** |
| alias already present on the same record | **0** |
| alias already used by a different company | **0** |
| alias equals some other company's name | **0** |

Baseline captured in the same query: 2,447 live companies = 2,410 suppliers + 37 research
organisations; landscape 567; 3,521 live products; 19 live names containing `" / "`.

## What was written

`companies.name` on 13 rows, `updated_at` on those rows, and 11 new `company_aliases`
rows. Nothing else. **A rerun now matches 0 rows and inserts 0 aliases.**

| New name | Alias kept | Slug (unchanged) |
|---|---|---|
| Brolis Defence Group | Brolis Semiconductors `former_name`, Brolis Defence `aka` | `brolis-semiconductors-brolis-defence` |
| China Academy of Aerospace Aerodynamics (CAAA) | CAAA `abbreviation` | `casc-china-academy-of-aerospace-aerodynamics-caaa` |
| Chengdu Aircraft Industry Group (CAIG) | CAIG `abbreviation` | `chengdu-aircraft-industry-group-caig-avic` |
| Guizhou Aircraft Industry Corporation (GAIC) | GAIC `abbreviation` | `guizhou-aircraft-industry-corporation-chengdu-avic` |
| KB Luch, Rybinsk | Design Bureau Luch `aka` | `kb-luch-part-of-vega-concern-rostec` |
| Meridian (S.P. Korolev Meridian) | S.P. Korolev Meridian `aka` | `meridian-politek-aero` |
| MIT Lincoln Laboratory | — | `mit-lincoln-laboratory-u-s-dod-strategic-capabilities-office` |
| Shahed Aviation Industries | — | `shahed-aviation-industries-hesa` |
| Spotter Global | SpotterRF `former_name` | `spotter-global-spotterrf` |
| UAV Tactical Systems (U-TacS) | U-TacS `abbreviation` | `thales-elbit-systems-u-tacs-joint-venture` |
| United Instrument Manufacturing Corporation (UIMC) | OPK `abbreviation` | `united-instrument-manufacturing-corporation-opk-rostec` |
| Unmanned Systems Group | Supercam `brand` | `unmanned-systems-group-supercam-bas` |
| Vega Radio Engineering Corporation (row F) | — | `vega-radio-engineering-corporation-luch-design-bureau-rybinsk` |

**Row F carries no alias on purpose.** `(Luch Design Bureau, Rybinsk)` was wrongly appended
to the parent's name — KB Luch is Vega's *subsidiary*, not another name for it — so keeping
it as an alias would preserve the error rather than the organisation's history.

## Verification after applying

| | Before | After |
|---|---|---|
| Live companies | 2,447 | 2,447 |
| `/companies/` suppliers | 2,410 | 2,410 |
| `/research/` organisations | 37 | 37 |
| **Landscape membership** | **567** | **567** |
| Live products | 3,521 | 3,521 |
| Live names containing `" / "` | 19 | **7** |
| Aliases on these 13 records | 0 | **11** |

Per record, everything that was meant to survive did: **slug, publication status,
`company_type`, `hq_country`, live product count, `product_companies` rows, sector rows and
landscape status are all identical to the before-values.** `Meridian` and
`UAV Tactical Systems (U-TacS)` are still `included` in the landscape, `Brolis Defence
Group` is still `excluded`, the other ten are still unscreened — membership is keyed on
`company_id`, never on the name, which is why renaming could not move it.

The 7 names still containing `" / "` are exactly the records that were *not* authorised:
Tier B (1 merge), Tier C (3 unpublish/reassign), Tier D (2 held) and Tier E (ECA Group /
Infotron). Nothing was changed on any of them.

No publication change, no reinstatement, no merge, no deletion, no ownership change, no
slug change, no redirect — none of which this instruction authorised. Concurrent investor
and interface work was untouched.

Rollback: `2026-10-31-composite-renames-rollback.sql`, extended to all 13 and guarded the
same way.

## Found while verifying — not fixed, not authorised

**`Spotter Global` has one product record literally named `AX250 · GAX500-3D`.** That is two
radar models crammed into a single row — the same composite-name defect this batch is
about, one level down at the product rather than the company. It is why the record counts
one live product while the page reads as if it has two. Splitting it is a product change
and needs its own approval.

## Two schema notes for whoever runs the remaining tiers

1. **`company_relationships` columns are `source_company_id` / `target_company_id`**, not
   `source` / `target`. The Tier B and C SQL in
   `2026-10-31-composite-merges-and-reassignments.sql` was written against the shorter
   names and **will fail as written** — it needs correcting before any dry run.
2. Product ownership is still stored twice, in `products.company_id` *and* in
   `product_companies`. Every reassignment in Tier B and C has to move both.
