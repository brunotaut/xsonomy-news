# Spotter Global — splitting the composite product record

**Date:** 2026-10-31 · **Status:** applied and deployed · **Scope:** one product row → two, plus one redirect

Found while verifying the 13 composite-company renames: Spotter Global's single live product
row was named `AX250 · GAX500-3D`. The split was spawned as a separate task because it is a
product-level defect, not a company one.

## What was actually wrong

Two problems, and the second was worse than the one the task was raised for.

**1. Two products in one row.** `AX250` and `GAX500-3D` are separate radars with separate
datasheets. The row's own summary described both.

**2. A third spec profile belonging to neither.** The row's specs contradicted themselves —
5.4 kg *and* 29 kg, 18 Hz *and* 30 rpm, solid-state *and* rotating mechanical. Tracing the
odd values through the database identified them:

| Field | Value on the Spotter row | Where it actually comes from |
|---|---|---|
| `Sensor · SWaP` | `29 kg; 550 mm dia x 630 mm; 2x 12 W` | Robin Radar **IRIS** — `IRIS 29 kg upmast` |
| `Radar · Scan type` | `Rotating (mechanical)` | IRIS (true of the AX250 too, coincidentally) |
| `Radar · Update/revisit rate` | `1.0 s (30 rpm)` | IRIS — `30 rpm / 1 s (IRIS)` |
| `Radar · Detection range (km)` | `5` | IRIS — `5` |
| `Radar · Tx power & licensing` | `2x 12 W` | IRIS — `IRIS 2x12 W continuous` |

Every one of them matches row `fed75c9b-fe2e-4bff-a996-058da1bef4c9`, Robin Radar Systems'
`IRIS · ELVIRA`, where they are still present and still correctly labelled. They were
copy-pasted into the Spotter row with the `IRIS` labels stripped. **The catalogue was
publishing a Dutch competitor's radar specifications as Spotter Global's**, at 20x the real
detection range. The true AX250 figure is 250 m radius / 500 m diameter, not 5 km.

Robin's own record is undamaged — the copy went one way.

## Pre-flight checks

Ran before applying; all clear.

| Check | Result |
|---|---|
| Target row still exactly as reviewed (name, status, category, subcategory) | 1 ✓ |
| Name collision on `AX250` or `GAX500-3D` | 0 |
| Slug collision on `ax250` or `gax500-3d` | 0 |
| Existing `slug_redirects` row for either slug | 0 |
| `article_products` / `product_sectors` / `product_taxonomy` / `company_sector_products` / `company_evidence` rows to re-point | 0 each |

Nothing depended on the row but `product_companies`, so nothing needed re-pointing.

## What was written

Migrations `split_spotter_global_composite_product_record` and
`split_spotter_global_product_companies_row`. SQL and rollback are alongside this report.

- **`27ac953c-be35-4642-8f7d-67b8b7cc7f94` → `AX250`.** The id is preserved, so the record
  keeps its history, its ownership and its creation date. Specs replaced with the figures
  from the SpotterRF AX-250-3D datasheet (REV011, 01.06.2022).
- **`7a4aec82-262b-487f-af69-db12f3f00ec8` → `GAX500-3D`,** new row, `live`, same company and
  role, with a `product_companies` row to match (ownership is stored in both places).
- **`slug_redirects`:** `ax250-gax500-3d` → `ax250`, kind `product`.

Both rows keep `category=Sensor`, `subcategory=Radar`, `use_class=cuas`,
`country=United States`, so both stay in the Sensors → Radar tab and in every radar filter.
`source_urls` went from empty to 2 and 4 entries respectively.

### Publication status

Both rows are `live`. This preserves the status quo rather than changing it: the GAX500-3D's
content is **already published today** inside the composite row, so making the new row
`draft` would have removed live content instead of keeping it. `PUBLISH_STATUS` itself is
untouched (CLAUDE.md rule 4).

### Corrected figures

| | Was (composite) | AX250 | GAX500-3D |
|---|---|---|---|
| Detection range | 5 km | 0.25 km radius / 500 m dia. | 500 m vs a 3 kg drone |
| Weight | 5.4 kg + "29 kg" | 5.4 kg radar / 10.4 kg assembly | <4 kg |
| Revisit | "1.0 s (30 rpm)" | 0.667 Hz track; 8 Hz scan | 18 Hz full volume; 56 ms |
| Scan | Rotating (mechanical) | Rotating, 220°/s = 36.6 rpm | *(not stated — omitted)* |
| Tx power | "2x 12 W" | max 1 W, normally <100 mW EIRP | 3.2 W EIRP |
| Coverage | 360° | 360° × 90° dome | 90° × 90°, 50 targets |

### Deliberately left blank

Unknown is recorded as unknown rather than inferred:

- **`Radar · Band` on the GAX500-3D.** No source states its frequency. The AX250's X band is
  confirmed (10.0–10.5 GHz, FCC licensed), and the GAX500 is probably the same, but "probably"
  is not a specification. It will stay out of the band filter until Spotter publishes one.
- **`Radar · Scan type` on the GAX500-3D.** CH3D is described as a volumetric "floodlight"
  that spends all its time on target, which implies no mechanical scan, but Spotter never says
  so. Omitted rather than labelled `Staring/electronic (AESA)` — Spotter explicitly contrasts
  CH3D *against* ESA, so that label would misdescribe it.
- **`Radar · Micro-Doppler`, dropped from both.** The old row claimed `Yes`. Spotter documents
  bird/drone discrimination and an object-class list but never names micro-Doppler as the
  mechanism.
- **The price estimate, dropped.** The old row read `Quote-based · est. mid five-figures/unit`.
  The estimate is unsourced, and attributing it to one of the two radars would be a new claim.
  Both now read `Quote-based`.

No new vocabulary values were introduced into any filter: every value used is one the radar
records already use.

## A latent bug this exposed, in the catalogue repo

The public product URL is generated from the product **name**, not from `products.slug`
(`slugify(row.Name, bucket)` in `generate-supabase.mjs`). So renaming a product moves its page,
and `/sensors/ax250-gax500-3d/` could not survive the split without a redirect.

The redirect machinery could not do it. `redirectPage` and the stub writer both derived the
path from `kind` alone:

```js
const dir = join(OUT, r.kind === "product" ? "uav" : "companies", r.from_slug);
```

Products live under `/uav/`, `/cuas/`, `/sensors/`, `/software/` or `/other/` depending on
`category`. A product redirect was therefore always written to `/uav/` and always pointed at
`/uav/<to>/` — for this sensor, two paths that do not exist. **All 52 existing redirects are
`kind=company`, so this had never run.** This split is the first product redirect in the
table, and it would have produced a dead stub in the wrong section.

Fixed by resolving the section from the target product's own built page, and skipping — with a
warning — any product redirect whose target is not live, rather than guessing it into a
section. Covered by a new test, `scripts/test/product-redirects.test.mjs`, which asserts the
sensor stub lands in `/sensors/`, that nothing appears under `/uav/`, that a UAV redirect still
resolves to `/uav/`, that company redirects are unaffected, that a dead redirect is written
nowhere, and that stubs stay out of the sitemap. The test fails against the pre-fix generator
(verified) and passes against the fix. Redirects previously had **no** test coverage at all —
all three generator fixtures passed `slug_redirects: []`.

## Verification

Local build with the public anon key, then the deployed site.

| Check | Result |
|---|---|
| `/sensors/ax250/` and `/sensors/gax500-3d/` built | both present |
| Stub at `/sensors/ax250-gax500-3d/`, canonical `https://xsonomy.com/sensors/ax250/` | ✓ |
| Nothing written to `/uav/ax250-gax500-3d/` | absent ✓ |
| Any Robin IRIS value (`29 kg`, `550 mm`, `2x 12 W`, `30 rpm`) on either page | none |
| Redirect stubs | 52 → 53 |
| Sensors section | 500 → 501 rows |
| Live products | 3,521 → 3,522 |
| Spotter Global live products | 1 → 2 |
| Test suite | 31/31 pass (30 before, +1 new) |
| Rerun of the migration | 0 rows changed, 0 inserted |

Landscape membership is unaffected — it is keyed on companies, not products, and no company
row was touched.

## Not done, and why

- **The other ~114 records with `·` in the name were left alone.** Most are deliberate
  portfolio entries, not split failures: `Toplite · RecceLite · Litening`, `POP300 · POP400 ·
  MiniPOP · MOSP`, `Night vision · thermal sights · observation`. The convention is "this
  vendor's family of X", and splitting them wholesale would be a different, much larger
  editorial decision. See below for the ones that look like genuine defects.
- **No merge, no publication change, no taxonomy change.**

## Open items for review

1. **`IRIS · ELVIRA` (`fed75c9b-…`, Robin Radar) is the same shape of defect** — two distinct
   radars in one row, with per-product prefixes stuffed into shared fields
   (`30 rpm / 1 s (IRIS); ELVIRA 1.3 s`). It is the source of this contamination and the
   obvious next split. Also `EchoGuard / EchoShield (MESA)` (`d3eb02d7-…`, Echodyne), which
   does the same thing (`EchoGuard 10 Hz`, two SWaP figures in one string).
2. **Where else did the copy-paste land?** Two sweeps were run over the 50-odd live radar
   records before closing this out.

   *Exact duplicate spec strings across different companies:* **none.** Worth knowing that
   this would not have caught the Spotter case either — the pasted values had been partly
   edited (`IRIS 29 kg upmast; 200 W nominal / 336 W max` became
   `29 kg; 550 mm dia x 630 mm; 2x 12 W`), so string matching is the wrong detector. What
   exposed it was the record contradicting *itself*.

   *Self-contradiction (a rotating scan type alongside a solid-state or AESA architecture):*
   4 hits, 3 of them legitimate — ELDIS RL-2000, Robin IRIS and Thales Ground Master all
   genuinely rotate a solid-state or AESA antenna. The fourth is a real defect:

   > **`MAVERICK Fortress-3D` (Silentium Defence)** — its `Radar · Architecture` field is not
   > a specification at all, it is an unresolved analyst note that has been **published**:
   > *"Note: 'MAVERICK/Fortress-3D' is a Silentium Defence passive radar; DeTect's drone radar
   > is HARRIER S-band solid-state Doppler"*. The record also carries
   > `Radar · Scan type: Rotating (mechanical)` against `Sensor modality: SDR PCL 3D` —
   > passive coherent location has no rotating transmitter, and `Passive` is an existing
   > value in that field. This looks like the same class of two-vendors-one-row confusion as
   > Spotter/Robin, between **Silentium Defence and DeTect**, and it needs a re-screen rather
   > than a tidy-up. Not touched here.

   A sweep across all 3,522 live products, on the self-contradiction signature rather than
   string equality, is still worth running.
3. **Should the GAX500-3D stay `live`?** It is a March 2026 product documented only by
   Spotter's own material and trade coverage of the launch; there is no independent test data.
   It is published here because it already was.
4. **`products.slug` is dead weight.** It exists, it is `NOT NULL`, and nothing reads it — the
   public URL comes from the name. It was kept in step by hand here (`ax250`, `gax500-3d`). It
   should either drive the URL or be dropped; carrying it unused invites exactly the kind of
   mismatch that makes a rename look safe when it is not.

## Sources

- SpotterRF, *AX-250-3D Counter UAS Radar* datasheet, REV011, 01.06.2022 — full specification table
- Spotter Global, *AX250 360° Drone Detection Radar* — https://www.spotterglobal.com/drone-detection-ax-series
- Spotter Global, *The GAX500-3D Powered by CH3D™* — https://www.spotterglobal.com/compact-holographic-3d-radar
- Spotter Global, *Releases the Fastest Radar in the World (18 Hz)* — blog post 87
- Spotter Global, *GAX500-3D Radar Wins Prestigious SIA Award* — blog post 88
- The Defense Post, *New Holographic 3D Radar Promises 32x Faster Sky Monitoring*, 19 May 2026 — weight and dimensions
- Unmanned Airspace, *Spotter Global's new radar "detects 50 targets every 56 milliseconds"*, 25 March 2026
- SecurityInfoWatch, *Spotter Global Unveils Compact Holographic 3D Radar*
