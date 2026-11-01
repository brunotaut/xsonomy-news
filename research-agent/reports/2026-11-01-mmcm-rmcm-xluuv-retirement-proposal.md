# MMCM, rMCM and XLUUV — retirement proposal. PREPARED, NOT APPLIED

**Date:** 2026-11-01 · **Status:** PREPARED — nothing applied · **Next actor:** Nazar

Deliverables: [SQL](2026-11-01-mmcm-rmcm-xluuv-retirement.sql) ·
[rollback](2026-11-01-mmcm-rmcm-xluuv-retirement-rollback.sql)

Follows [batch 2 applied](2026-11-01-non-aerial-product-batch-2-applied.md). The prepared
TX B would have **recategorised** these three UAV → Other. This proposes the alternative
the review offered instead: **retire them as product records.** Both options are still on
the table and §6 says when each is right.

---

## 1. What these three records are

| Record | ID | URL today | What it actually is |
|---|---|---|---|
| **MMCM** | `ccfd9d18-4029-4c1b-a46e-68e8de044f6b` | `/uav/mmcm/` | The **FR/UK Maritime Mine Counter Measures programme**, run by OCCAR for the French DGA and the UK MOD, Thales leading an industrial team with BAE Systems and ECA. Eight uncrewed mine-hunting systems contracted 2020; first serial system to the French Navy, February 2025 |
| **rMCM** | `5d6c6ab3-6b4c-4552-9734-b6f7cff54903` | `/uav/rmcm/` | The **Belgian-Dutch replacement Mine CounterMeasures programme** — 12 City-class and Vlissingen-class **crewed** vessels, contracted 2019 to Belgium Naval & Robotics (Naval Group + ECA Group, now Exail) |
| **XLUUV** | `9d80e014-03aa-4342-9a91-1fcaa702fca2` | `/uav/xluuv/` | A **US Navy class term** for extra-large uncrewed undersea vehicles, above 84 inches in diameter. Boeing's **Orca** is the vehicle that fills it |

None is a product. Two are procurement programmes and one is a size class. All three are
still live, still categorised UAV, and all three carry an unanswered editorial flag.

## 2. The provenance, which is the part worth reading

All three came from automated extraction, and two of them came from **one article**:

| Record | Source article |
|---|---|
| MMCM | opex360.com, 2026-08-04, *Guerre des Mines : Le ministère des armées commande davantage de drones navals…* |
| rMCM | **the same opex360 article** |
| XLUUV | dronesworldmag.com, 2026-08-25, *KONGSBERG and OCEANEERING Team Selected by US DoW to Support DIU CAMP Program for XLUUV* |

That one French article about mine-warfare drone orders produced **three** entity errors:
MMCM, rMCM, and **Exail A27** — the product name that matches no source anywhere and that
was unpublished earlier today. A single article naming several programmes, vendors and
vehicles in one breath is where this class of error comes from, and it is worth knowing
that before the next extraction pass runs rather than after.

The XLUUV case is the other shape of the same mistake: a **class term** read as a model
name. The article is about Kongsberg and Oceaneering supporting a DIU programme *for*
XLUUVs.

## 3. Dependencies — what is attached to each, exactly

Measured, not assumed:

| | MMCM | rMCM | XLUUV |
|---|---:|---:|---:|
| `article_products` | 1 | 1 | 1 |
| `product_taxonomy` | 1 | 1 | **5** |
| `product_companies` | 0 | 0 | 0 |
| `product_sectors` | 0 | 0 | 0 |
| `company_evidence` | 0 | 0 | 0 |
| `company_sector_products` | 0 | 0 | 0 |
| `slug_redirects` pointing in | 0 | 0 | 0 |
| `products.company_id` | null | null | null |

No company owns any of them, which is itself consistent with their not being products.

**A hard DELETE is the wrong instrument, and the schema says so.** Five of the six foreign
keys into `products` are `ON DELETE CASCADE`:

| Table | On delete |
|---|---|
| `article_products` | **CASCADE** |
| `product_taxonomy` | **CASCADE** |
| `product_companies` | **CASCADE** |
| `product_sectors` | **CASCADE** |
| `company_sector_products` | **CASCADE** |
| `company_evidence` | SET NULL |

Deleting these three rows would therefore take their three article links and seven taxonomy
rows with them, silently and unrecoverably. **This proposal does not delete anything.**

## 4. The proposed change — exact IDs

`publication_status = 'draft'`, the same mechanism used for Exail A27 earlier today, plus
a note on each domain row recording why. Eleven rows in all.

| # | Table | Exact ID | Field | Before | After |
|---|---|---|---|---|---|
| 1 | `products` | `ccfd9d18-4029-4c1b-a46e-68e8de044f6b` | `publication_status` | `live` | `draft` |
| 2 | `products` | `5d6c6ab3-6b4c-4552-9734-b6f7cff54903` | `publication_status` | `live` | `draft` |
| 3 | `products` | `9d80e014-03aa-4342-9a91-1fcaa702fca2` | `publication_status` | `live` | `draft` |
| 4 | `product_taxonomy` | `ccfd9d18` + option `9624877b` | `note` | `filed under category UAV but is not an aerial system — verify category` | retirement note, §5 |
| 5 | `product_taxonomy` | `9d80e014` + option `85766220` | `note` | same literal | retirement note, §5 |
| 6 | `product_taxonomy` | `5d6c6ab3` + option `9624877b` | **row deleted** | `surface-usv`, `knowledge`/`medium`, same literal note | — |

Row 6 is separable and stands on its own evidence: **rMCM's `surface-usv` row is false, not
merely unsourced.** The programme delivers twelve **crewed** vessels that *carry* uncrewed
systems — two Exail Inspector 125 USVs, three A-18 AUVs and two Saab V200 Skeldar air
vehicles apiece. The row asserts the programme *is* a USV. Deleting it leaves rMCM with no
domain assertion at all, which is the honest state. MMCM's identical row is **kept**,
because MMCM's deliverable genuinely is a USV.

XLUUV's other four taxonomy rows (control, mission_military, origin, range_class) are bare
model seeds and are **left untouched**: they are unsupported, but a retired record's seeds
assert nothing publicly, and removing them would be a change nobody has evidence for.

## 5. Expected impact, recalculated from today's live baseline

Baseline is the state **after** this morning's applied batch, not before it:

| | Now | After this proposal |
|---|---:|---:|
| Live products, category UAV | 1,413 | **1,410** |
| Live products, total | 3,521 | **3,518** |
| `product_taxonomy` rows | 11,133 | **11,132** |
| `slug_redirects` | 97 | **97** (unchanged) |
| Notes matching `verify category` | 4 | **1** |
| Notes matching `not an aerial system` | 3 | **0** |
| Public pages removed | — | 3 |

The one flag left would be **LUNA-2**, which is pending by instruction and keeps it.

**URLs.** `/uav/mmcm/`, `/uav/rmcm/` and `/uav/xluuv/` cease to exist at the next build,
which fetches `publication_status = 'live'` only. **No redirect is created**, because there
is no product to redirect to — the same reasoning applied to Exail A27, and the site's
established retirement behaviour. If you would rather these URLs point somewhere, the
honest targets would be `/other/orca/` for XLUUV and company pages for the two programmes,
and that is a separate decision, not a retirement.

## 6. When retirement is right, and when TX B is

**Retire** if the catalogue's unit is a product you could buy or field. A programme and a
size class are neither, and leaving them live means the UAV listing contains three entries
that no amount of correct metadata can make into products.

**Recategorise instead** (the prepared TX B) if you would rather keep them as findable
reference entries while the question stays open. That is reversible in one statement and
strictly better than today, because today they are filed as aerial vehicles.

What is **not** defensible is the status quo. Either option improves it.

My recommendation: **retire.** The provenance in §2 makes these three extraction artefacts
rather than incomplete records, and an extraction artefact does not get better with a
better category.

## 7. Rollback

[2026-11-01-mmcm-rmcm-xluuv-retirement-rollback.sql](2026-11-01-mmcm-rmcm-xluuv-retirement-rollback.sql).
Every statement keyed on exact IDs, guarded by expected current values, with an
affected-row assertion.

**One limit, stated.** `products` carries a `BEFORE UPDATE set_updated_at` trigger, so a
reversal cannot restore the original `updated_at`. The literal previous values:

```
MMCM   ccfd9d18-4029-4c1b-a46e-68e8de044f6b   2026-08-09 05:46:16.886986+00
rMCM   5d6c6ab3-6b4c-4552-9734-b6f7cff54903   2026-08-10 06:09:58.130665+00
XLUUV  9d80e014-03aa-4342-9a91-1fcaa702fca2   2026-08-30 10:18:56.057622+00
```

Everything else reverses exactly, including the re-insert of rMCM's deleted domain row with
its literal original `option_id`, `source`, `confidence`, `note` **and `created_at`**
(`2026-09-05 16:56:47.583515+00`) — that column takes its value from a default rather than a
trigger, so unlike `products.updated_at` it can be restored. `product_taxonomy` has no
surrogate key and no `updated_at`, so the statement is keyed on `(product_id, option_id)`.

**The rollback has not been dry-run.** It is prepared from verified current values, but the
transactional round-trip proof will be run at the point of application, as it was for the
applied batch — not now, against a change nobody has authorised.

## 8. What this proposal deliberately does not do

- No deletion of any `products`, `article_products` or `product_taxonomy` row except rMCM's
  false domain row.
- No merge of iXblue, no change to Exail's parent relationships, no DORCUS ownership change,
  no renames, no deduplication of family records.
- No change to LUNA-2, and no answer to the satellite inclusion question.
- No new company links for the two programmes, though OCCAR, Thales, Naval Group and Exail
  are all candidates if these ever become reference entries rather than product records.
