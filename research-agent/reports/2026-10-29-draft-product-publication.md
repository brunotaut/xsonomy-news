# 36 draft products corrected and published — application and verification

**Date:** 2026-10-29 (deployment verified 2026-10-30 UTC)
**Authorised by:** Nazar, 2026-10-29, for the exact 36 product IDs in
`research-agent/reports/2026-10-29-draft-product-corrections.csv`.
**Applied manifest / rollback data:** `research-agent/reports/2026-10-29-draft-product-publication-applied.csv`
**Rollback script:** `research-agent/reports/2026-10-29-draft-product-publication-rollback.sql`
**Correction package:** `research-agent/reports/2026-10-29-draft-product-corrections.md`

---

## Amendments made before applying

Four instructions were given with the authorisation. All four were applied to the patch before
any write, and are visible in the applied manifest's `summary_after` column.

1. **WireDO.** The absolute claim "so the link cannot be jammed or intercepted" was removed and
   replaced with the supplied wording: *"Carries control and video over optical fibre rather than
   a radio link."*
2. **Development status preserved.** Fenix reads *"APS describes Fenix as still in development."*
   HILDR reads *"Valkyr reports a pilot order from the Swedish FMV, with series development
   ongoing."* FoxHUNTER reads *"Not yet in general availability: offered pre-sale, with deliveries
   planned from spring 2027."* No product implies general availability it does not have.
3. **Source attribution retained.** Every performance figure is attributed to whoever claims it —
   "Manufacturer figures", "TrackDeep states", "Hexadrone lists", "Eurotech reports", "Janes
   reports", "Valkyr states", "VirtuaLabs figures", "The Czech investment agency catalogue lists".
   Six summaries were tightened for this beyond the reviewed package: LAURUS FPV, Eter, TUNDRA 2,
   STEZHKA, Ukropter Complex and HILDR.
4. **Annotations treated as instructions.** The manifest's `(unchanged)` markers and explanatory
   category notes — `Software (change withdrawn)`, `Software (confirmed)` — were read as "leave
   this field alone", never written as values. Only one real category change reached the database.

---

## Pre-flight

**Before-values captured** for all 36 rows: `name`, `category`, `country`, `summary`,
`source_urls`, `publication_status`, `company_id`, `slug`, `updated_at`. These are the rollback
record.

**Drift check — zero.** Every one of the six fields on all 36 live rows matched the manifest's
recorded current value exactly. 36 patch rows, 36 matched, 0 missing, all 36 still `draft`. No
sibling products of the 25 owning companies sat outside the patch.

One apparent discrepancy was investigated and dismissed: the first comparison flagged
`source_urls` on all 36 rows, because PostgreSQL renders a `text[]` literal without quoting
elements while the comparison string quoted them. Re-run as an array-to-array comparison it
returned zero. A formatting artefact in the check, not drift in the data.

**Dry run** against the live rows, before writing:

| | |
|---|---|
| rows matched | 36 |
| summary changes | 36 |
| source_urls changes | 15 |
| country changes | 8 |
| name changes | 2 |
| category changes | 1 |
| to publish | 36 |
| guard matches | 36 |
| invalid category / null country / empty summary / empty sources | 0 / 0 / 0 / 0 |
| slug changes | 0 |

Name collisions after publication: ANDROMEDA, Komodo and HAWK, all three already documented as
genuinely different products under different owners with distinct slugs. Expected, not a defect.

---

## The write

One statement, guarded and idempotent. It matches only rows still in `draft` whose values actually
differ, so a rerun changes nothing.

**36 rows updated. 0 skipped.** Fields written: `name`, `category`, `country`, `summary`,
`source_urls`, `publication_status`, `updated_at`. Nothing else.

**Confirmed after the write:**

- 36 of 36 `live`, 0 still `draft`.
- 0 null countries, 0 empty summaries, 0 empty source lists.
- All 36 slugs byte-identical to before — including the two renamed products, which keep
  `ukropter-drone` and `argonian-argonian-dome`. Rule 3 of CLAUDE.md holds.
- Company ownership unchanged on all 36; all 25 owning companies are `live`.
- STEZHKA category is now `Other`.
- Products live, whole catalogue: **3,492 → 3,528**.
- Companies live: **2,466 — unchanged**, as expected; no company record was touched.
- Landscape candidates: **567 included**, 266 excluded, 140 needs_review, 4 candidate — identical
  to the pre-write state.
- Frozen snapshots: **V1 = 273, V2 = 358**, untouched.

---

## Out of scope and not done

- **No company was renamed.** BeetechUA → BeeTA remains a proposal for Nazar.
- **No product was created.** The coverage gaps recorded in the correction package — HADES EAGLE
  and CONDOR, BZB UAS BX4 and BX8, Twist Robotics DZHERELO, CYCLOP, SNODE and CBPH, Ukropter BLACK
  CAT and RETRIX DRONE, Argonian Flux, Robotto Strike and twelve further VirtuaLabs radars — are
  still absent.
- **No unrelated cleanup.** The 966 ownerless products and the ~21 entity-extraction errors were
  not touched.

---

## Rebuild and deployment

Triggered by pushing the rule-4 `docs/STATUS.md` entry to `brunotaut/xSonomy` (`59bed3f`) at
23:53:42Z, which fires the push build in `.github/workflows/deploy.yml`. No `gh` CLI or GitHub
token is available in this environment, so a manual workflow dispatch was not possible; keychain
credentials were not touched.

| | |
|---|---|
| previous build | 2026-10-29T23:48:22.412Z — 3,492 products |
| deployed build | **2026-10-29T23:57:55.490Z — 3,528 products** |
| landscape.json | generated 23:57:59.898Z, **567 companies** |
| companies.json | **2,466** |

The independent rebuild at 23:48:22Z, a few minutes before the push, was not triggered by this
work. It is accounted for rather than left unexplained: it came from concurrent atlas UI work in
the same repo, and it carried 3,492 products and 567 landscape companies — exactly the
pre-publication state — so it establishes the baseline rather than disturbing it.

That concurrent work continued. A later atlas commit (`7cbda93`, cache-busting content hashes for
the atlas assets) landed on `origin/main` while this verification was running, and the follow-up
`docs/STATUS.md` note was rebased onto it rather than pushed over it. The two entries conflicted
only because both append to the end of the file; both were kept, in order. `npm test` passes
16 of 16 on the rebased tree.

**Final build after all of that: `2026-10-30T00:13:21.632Z`.** Re-verified on it: 3,528 products
(uav 1,455 / cuas 798 / sensors 504 / software 399 / other 372), landscape 567, companies 2,466,
and all 36 present with no mismatch on category, country or summary. The publication survives the
concurrent work intact.

**Per-category counts moved by exactly the expected amounts:**

| bucket | before | after | delta | expected |
|---|---|---|---|---|
| uav | 1,445 | 1,455 | +10 | 10 |
| cuas (Counter-UAS + Effector) | 779 | 798 | +19 | 18 + 1 Effector |
| sensors | 504 | 504 | 0 | 0 |
| software | 394 | 399 | +5 | 6 − 1 (STEZHKA out) |
| other | 370 | 372 | +2 | 1 + 1 (STEZHKA in) |
| **total** | **3,492** | **3,528** | **+36** | **36** |

### Verification against the deployed data

- **36 of 36 present** in the deployed per-category JSON, matched on name and company.
- **0 mismatches** on category, country, summary or source URLs. Every corrected summary is live,
  including the OBRIY/STEZHKA unswap and the three caveats (Fenix in development, HILDR pilot
  order with series development ongoing, FoxHUNTER pre-sale with spring 2027 deliveries).
- **36 of 36 product pages return HTTP 200.**
- **25 of 25 company pages return HTTP 200**, and all 25 now show a populated
  "Products in the catalogue" section. The empty product lists are gone.
- **landscape still 567.** Unchanged, as it must be: no company record was touched.

### Public URLs

The site slug is **not** `products.slug`. The generator derives it from the product name via
`slugify` (the generator says so at `scripts/generate-supabase.mjs:332`). Preserving the database
slug therefore does not by itself preserve a URL.

This cost nothing here. All 36 were `draft` until this write, so none of them had a public page
before: every one of these URLs is new, and no indexed URL moved. `/uav/ukropter-drone/` returns
404 because that page never existed, not because it was moved. The renamed Argonian product lands
on `/cuas/argonian-dome/` either way, since `slugify` lowercases.

---

## One exception — two company pages now link to the wrong product

This is the only defect found, and this deployment caused it to surface.

`pageUrlByProduct` at `scripts/generate-supabase.mjs:1237` keys product page URLs by **product
name**. When two live products share a name exactly, the last bucket processed wins and both
owners' pages point at that single URL:

| Company page | Links its product to | Which actually is |
|---|---|---|
| Bionic System Solutions | `/other/komodo/` | DOK-ING's Komodo ground robot (Croatia) |
| HADES Defense Systems | `/cuas/hawk-2/` | the ownerless HAWK record |

Both products' own pages are correct and return 200 — `/cuas/komodo/` and `/cuas/hawk/`. Only the
cross-link from the company page is wrong.

Before today both were `draft`, so neither company page linked them at all. Publishing them turned
a dormant generator defect into two visible wrong links. The third known collision, ANDROMEDA,
escapes it only by accident: JISR's is `ANDROMEDA` and High Lander's is `Andromeda`, so the two
map keys differ by letter case.

**Not fixed here.** The fix is a code change in the catalogue repo — key that map by product id
rather than name — and code changes were outside the scope of this instruction. Flagged for a
decision. Nothing in the database is wrong; this is purely an interface defect, the same shape as
the C-UAS grouping-chip bug fixed earlier today.

---

## Totals

- 36 products corrected and published. 0 skipped, 0 failed, 0 held.
- Drift before the write: **0**. Rows updated: **36**. Rerun would change **0**.
- Products live: 3,492 → **3,528**. Companies live: **2,466**, unchanged.
- Landscape: **567**, unchanged. V1 = 273, V2 = 358, untouched.
- Pages verified: **36 product pages + 25 company pages, all HTTP 200**.
- Exceptions: **1** — two wrong cross-links from company pages, caused by a name-keyed lookup in
  the generator. Reported, not fixed.

---

## Follow-up, 2026-10-30 — the exception is fixed

The wrong-link defect above was fixed in the catalogue repo (`0fe2b77`) and deployed.

`pageUrlByProduct` is now keyed on the product **id** rather than the name. It is filled while the
product pages are generated, which is the only point where the database id and the generated slug
are both in hand — `reshape` does not carry the id into the row — and `fetchCompanyProducts` now
selects `id` to look it up.

Measured on build `2026-10-30T00:19:09.744Z`:

| Company page | before | after |
|---|---|---|
| Bionic System Solutions → Komodo | `/other/komodo/` (DOK-ING's ground robot) | `/cuas/komodo/` |
| HADES Defense Systems → HAWK | `/cuas/hawk-2/` (an unrelated HAWK) | `/cuas/hawk/` |

Diffing every company's product links between the two builds, **exactly those two changed across
all 567 landscape companies — none gained, none lost.** DOK-ING keeps `/other/komodo/` and the
ANDROMEDA pair is untouched. No slug changed, so no URL moved: products 3,528, companies 2,466,
landscape 567, and all 36 published products still present.

`landscape.json` is built from the same map and was wrong in the same two places. It is fixed too.

A regression test was added, `scripts/test/company-product-links.test.mjs`, running the real
generator end to end against a fake PostgREST server. It covers both shapes — a name shared across
two buckets, and one shared inside a single bucket where `slugify` appends `-2` — and asserts each
owner's link resolves to a page that is actually that owner's product. It was confirmed to fail
against the old name-keyed lookup before being kept. `npm test` passes 17 of 17.

**Nothing is left open on this thread.**
