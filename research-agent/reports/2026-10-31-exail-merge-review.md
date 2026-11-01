# Exail admission + ECA Group / Infotron merge — prepared package, for review

**Date:** 2026-10-31 · **Status:** PREPARED, NOT APPLIED · **Next actor:** ChatGPT, then Nazar

Authorised for preparation and read-only validation only. **Nothing was written.** The
database was re-checked at the end of the validation and is byte-identical to its state at
the start: live companies 2,447, Exail sectors 0, Exail `excluded`, ECA `live` and
`included`, IT180 still owned by ECA, no new redirect, no new relationship.

Deliverables: [manifest](2026-10-31-exail-merge-manifest.csv) ·
[SQL](2026-10-31-exail-merge.sql) · [rollback](2026-10-31-exail-merge-rollback.sql)

---

## 1. Recheck — identity and evidence both hold

All four cluster records are present under exactly the IDs in the re-screen report, with
no drift in name, slug, country or status.

| Record | ID | Live | Landscape (uav-cuas) | Sectors | Products |
|---|---|---|---|---|---|
| **Exail** | `8517768e-5a14-4ac2-8296-692a39e2a0a0` | live | **excluded** | **0** | 18 |
| **ECA Group / Infotron** | `92299e36-58f5-4c27-9486-20bae0ab2d26` | live | **included** | 1 (`uav`) | 1 |
| iXblue | `e99326a6-0edb-4920-bfe2-814b2e36281c` | live | needs_review | 0 | **1** |
| Exail Robotics (BE) | `ffa0380d-6768-4846-a396-49d7faca91c9` | live | excluded | 0 | 0 |

**Does the evidence belong to the destination record?** Yes, and I re-fetched both primary
sources to confirm it rather than trusting the report.

- The **SIRTAP release (12 May 2025)** names **Exail** — "a global leader in inertial
  navigation technologies" — selected with its Spanish partner Grafinta to supply the
  **UmiX-40 IMU** for the navigation system of Airbus's SIRTAP, described as a "tactical
  unmanned aerial system (UAS)". *"Exail Technologies"* appears only in an investor-site
  link, **not as the supplier**, and **iXblue is not mentioned at all**. So the evidence
  attaches to the operating company Exail, which is what record `8517768e…` represents
  (name *Exail*, France, exail.com) — not to the holding company and not to iXblue.
- The **product range** today carries a Defense category **"Land and air navigation &
  pointing"** listing Inertial Navigation Systems, Inertial Measurement Units and
  Stabilized platforms.

And the negative check matters as much: the product range has **no UAV, aerial or drone
category** at all. The admission is correctly on the navigation/components limb, and the
screening note is written so it can never be read as an aircraft claim.

*One blemish in the source:* the SIRTAP page contradicts itself on who developed SIRTAP —
one sentence says GMV, a later paragraph says Airbus. It does not affect the attribution to
Exail, but it is a reminder the page is a press release.

## 2. Schema validation — three things the old plan had wrong

Checked against the live catalogue rather than assumed. The previously identified
`source`/`target` error is corrected, and checking "all other columns and constraints"
turned up two more:

| | Old plan | Actual schema |
|---|---|---|
| `company_relationships` | `source` / `target` | **`source_company_id` / `target_company_id`** ✓ corrected |
| `product_companies` PK | assumed `(product_id, company_id)` | **`(product_id, company_id, role)`** — three columns |
| `landscape_candidates` note | `note` | **`screening_note`**; PK `(landscape_slug, company_id)` |
| ECA landscape rows | one | **two** — see §4 |
| `company_aliases.alias` | — | `citext`, UNIQUE **per company**, not globally — see §3 |

Constraint vocabularies confirmed and respected throughout: `publication_status`
draft/review/live · `landscape_candidates.status` candidate/screening/included/excluded/
needs_review · `company_aliases.type` aka/former_name/native_name/abbreviation/ticker/brand
· `company_sectors.assigned_by` editor/llm/import/seed · `confidence` low/medium/high ·
`slug_redirects.kind` company/product with `CHECK (from_slug <> to_slug)` ·
`company_relationships.type` includes `merged_with`.

> **Not fixed, still broken:** `2026-10-31-composite-merges-and-reassignments.sql` (the
> Tier B/C package) still uses `source` / `target` and **will fail as written**. Out of
> scope here; it must be corrected before its own dry run.

## 3. Two corrections I made to the plan in §7 of the re-screen

**(a) The ECA Group alias must MOVE, not be copied.** The report said "add `ECA Group` and
`Infotron` as `former_name` on Exail" and said nothing about ECA's existing copy.
`company_aliases` is unique per *(company_id, alias)*, so both records could legally hold
`ECA Group` — but `resolve-entities.mjs` fetches companies and aliases with **no
`publication_status` filter**, and `buildCompanyIndex`'s exact map is **first-write-wins**
(`if (!exact.has(key)) exact.set(key, val)`). With the alias on both records, a future
article mentioning "ECA Group" would resolve to whichever alias row the fetch returned
first — non-deterministically, possibly onto the retired draft record. So ECA's alias is
deleted in the same transaction. The audit trail does not depend on it: the ECA row, both
its landscape rows, its screening note and the new `merged_with` relationship all survive.
An alias is a routing-table entry, not history.

**(b) The ECA row is retired, not deleted.** §7 said "Delete the ECA row". The instruction
requires the audit history preserved, so nothing is deleted — `publication_status` goes to
`draft` and both landscape rows go to `excluded` with explanatory notes. The instruction
wins over the report.

## 4. A second landscape edition the report missed

All four cluster records carry a row in **`europe-cuas-2026`** as well, as unscreened
`candidate`s. The re-screen only discussed `europe-uav-cuas-2026`.

Left alone, the retired duplicate stays queued for a future C-UAS screening pass and could
be re-admitted there. The transaction therefore excludes ECA in that edition too, with a
pointer to the merge. **Exail's own `europe-cuas-2026` candidate row is deliberately not
touched** — C-UAS admission is a separate question resting on weaker evidence (the Neptis
mission-area listing), and nothing here prejudges it.

## 5. Expected counts

The landscape gate was reproduced in SQL — `publication_status='live'` **and**
`landscape_candidates.status='included'` **and** a non-empty slug **and** `hq_country` in
the landscape country scope **and** at least one `company_sectors` row whose ancestry
reaches the `uav` or `counter-uas` root. It returns **567**, matching the live site, so the
simulation is trustworthy.

Exail fails on exactly two of those gates — `excluded`, and `0` domained sectors. Both are
fixed by this transaction.

| | Before | After | Why |
|---|---|---|---|
| **Landscape** | **567** | 568 → **567** | +1 Exail admitted, −1 ECA retired |
| Live companies | 2,447 | **2,446** | ECA → draft |
| Suppliers (`/companies/`) | 2,410 | **2,409** | ECA is `sme` |
| Research orgs | 37 | 37 | untouched |
| Live products | 3,522 | **3,522** | IT180 changes owner, not status |
| Exail's products | 18 | **19** | IT180 arrives |
| Redirect stubs | 53 | **54** | `eca-group` repointed, `eca-group-infotron` added |

Net **567** — but, as the re-screen said, that is the coincidence of two independent
decisions. **If only the admission is approved the honest number is 568; if only the merge
is approved it is 566.** Correctness first.

Both sector assignments resolve through `uav-ecosystem → uav`, so Exail's landscape row
still reports `domains: ['uav']` and appears in the UAV domain on the map. Verified by
precedent: **SBG Systems** is `included` carrying exactly these two rows — `eco-navigation`
primary, `eco-components` secondary, both `high`/`editor` — and **no `uav` row at all**.
The proposed assignment mirrors it field for field.

## 6. Read-only validation performed

| Check | Result |
|---|---|
| Four cluster IDs present under reviewed names/slugs | ✓ no drift |
| Both sector IDs resolve to `eco-navigation` / `eco-components` | ✓ |
| Both sectors' ancestry reaches the `uav` root | ✓ `eco-* → uav-ecosystem → uav` |
| France in landscape country scope | ✓ |
| Name / slug / alias / redirect collisions | **0 of 7 checks** |
| IT180 `product_companies` row already on Exail | no → safe to move |
| Exail already holds either sector row | no |
| Exail already holds either alias | no |
| `eca-group-infotron` redirect already exists | no |
| slug `exail` held by exactly one company | ✓ |
| ECA's single linked article already on Exail | **YES — nothing to move** |
| Dependent rows on ECA needing re-pointing | 1 product, 1 alias, 2 landscape rows, 0 relationships, 0 evidence |
| IT180 dependents preserved | 14 `product_taxonomy` rows, 0 articles, 0 evidence |
| Step-0 guard block executed (read-only) | ✓ passes |
| All 18 DML shapes `PREPARE`d against the live schema | **18/18 parse + analyse clean, 0 executed** |
| Quote / `$$` / `begin-commit` balance in both files | ✓ balanced |
| Stale schema references (`.source`, `.target`, `lc.note`) | none |
| Database state after validation | **unchanged** |

`PREPARE` runs Postgres's full parse and analyse phases — column names, types and
constraint compatibility — without executing anything, so this is real validation rather
than inspection.

## 7. URL safety

- **`/uav/it180-sth-u/` does not move.** The public product slug is generated from the
  product *name* (`slugify(row.Name, bucket)`), and neither the name nor the category
  changes — only the owner. Confirmed against the generator.
- **`/companies/eca-group-infotron/`** stops being a real page (the companies fetch is
  gated `publication_status=eq.live`) and is replaced by a redirect stub to
  `/companies/exail/`. This ordering is *required*: the generator writes real pages first
  and **skips any redirect stub whose directory already holds an `index.html`**, so if ECA
  stayed live the stub would be silently skipped and the URL would keep serving the
  duplicate.
- **`/companies/eca-group/`** is repointed from `eca-group-infotron` straight to `exail`.
  The generator emits a canonical + meta-refresh, not a 301, and GitHub Pages cannot chain,
  so without this repoint that URL would dead-end at a retired slug.

## 8. Unresolved dependencies

Recorded as instructed. **None of these makes the transaction unsafe to run** — it is
internally consistent and fully reversible — but two of them make it *unwise to run alone*.

### Would make the result visibly wrong — fix in the same pass

1. **Exail's `description` is empty.** `buildLandscape` emits `description: c.description
   || ''`. ECA's description is real ("French robotics and defense company specializing in
   unmanned systems, mine clearance, and explosive ordnance disposal (EOD) solutions").
   So the net effect of this merge is that the landscape **loses a described member and
   gains a blank one**. This is the single most user-visible consequence, and it is not in
   the seven authorised operations, so it is not in the SQL. Recommended addition, for
   approval:
   > *"French navigation, robotics and photonics group formed in 2022 by the merger of ECA
   > Group and iXblue. Supplies inertial navigation systems and IMUs for airborne, land
   > and naval platforms — including the UmiX-40 IMU selected for the navigation system of
   > Airbus's SIRTAP tactical UAS — alongside uncrewed surface and underwater vehicles."*

2. **The 12 mis-categorised products stay live and wrong.** After the merge Exail owns 19
   live products, 12 of them maritime or underwater vehicles still categorised `UAV`, and
   `buildLandscape` publishes a company's product list on its landscape row. **Admitting
   Exail makes its bad product data newly prominent on the public map** — a navigation
   supplier whose listed "UAVs" are USVs and mine-disposal ROVs. The corrections are
   explicitly out of scope, but doing the admission before them is a presentational own
   goal. Strong recommendation: approve decision 3 of the re-screen in the same release.

### Leaves the cluster half-merged — acceptable, but know it

3. **iXblue is still `needs_review`, and the re-screen was wrong that it has 0 products.**
   It owns **`Qinertia`** (`86629aac-c160-4338-a7a8-19abb607b49b`, Software, live) — which
   is Exail's own GNSS-INS post-processing software. Exail is the 2022 merger of ECA Group
   **and iXblue**; after this transaction the database records that ECA merged into Exail
   while iXblue did not. iXblue's own screening note says *"Resolve the cluster before any
   classification."* A later iXblue merge will have to repeat this exact pattern.

4. **A retired duplicate can still capture an entity match.** Moving the alias fixes
   "ECA Group", but the record's *name* — "ECA Group / Infotron" — stays an exact-match key
   in `buildCompanyIndex` because the resolver does not filter drafts. Low risk (that exact
   string is unlikely in prose), but the general fix — filter drafts, or prefer a live
   record on a tie — belongs in the news repo and would protect every past and future
   merge.

### Known, out of scope, unchanged

5. **The parent-entity conflation stays.** After the merge Exail holds six aliases: the two
   correct former names this adds, plus `Exail Technologies`, `Gorgé`, `Gorgé SA` and
   `Groupe Gorge` — a holding company and a listed parent carried as aliases of the
   operating company, with a `gorge → exail` redirect baking it in. This transaction makes
   the record *more* right without making it right.
6. **Thales's 35.51% controlling stake in Exail Technologies (July 2026)**, heading to full
   ownership by 2028, is still unrecorded. The only relationship in the cluster is
   `Belgium Naval & Robotics → Exail` (`jv_partner`), which the merge does not touch.
7. **DORCUS, Exail Robotics and the duplicate/family-name product records** are untouched.

## 9. One step I added

**Step 14** inserts `ECA Group / Infotron —merged_with→ Exail` (started_year 2022) into
`company_relationships`, so the merge is recorded as structured lineage and not only as
prose in a screening note. It is invisible publicly — the catalogue generator reads neither
`company_relationships` nor `company_aliases`. It was not in the original plan; **strike it
if unwanted**, nothing else depends on it.

## 10. Decisions needed before execution

1. Approve the transaction as prepared — 14 steps, net landscape **567**?
2. Approve or strike **step 14** (the `merged_with` lineage row)?
3. Approve the **Exail description** in §8.1, or supply different wording? Without it the
   map gains a blank-description member.
4. Approve the **ECA `europe-cuas-2026` exclusion** (§4) — not in the original plan?
5. Run the **product corrections** in the same release (§8.2), or accept publishing Exail
   with 12 mis-categorised products on its landscape row?

## Sources

- Exail, *"Exail to equip Airbus SIRTAP tactical UAS with advanced inertial navigation technology"*, 12 May 2025 — re-fetched and verified 2026-10-31
- Exail product range, Defense → *"Land and air navigation & pointing"* — re-fetched and verified 2026-10-31
- `research-agent/reports/2026-10-31-exail-rescreen.md` — the review this package implements
- Live schema, constraints and row state, Supabase project `uobidcahmrmfdmfbrtkt`, read-only, 2026-10-31
- `scripts/lib/landscape.mjs` and `scripts/generate-supabase.mjs` (catalogue repo) — the membership gate, the slug derivation and the redirect-collision rule
- `scripts/lib/resolve.mjs`, `scripts/resolve-entities.mjs` (this repo) — the alias index behaviour in §3

---

## Re-validation — 1 November 2026

The package was re-checked against the live database **after** the European hub import and
the investor portfolio reconciliation had both written to it. **Zero drift.** Every value
in the manifest still matches the database, so the prepared SQL and rollback need no change.

| Checked today | Result |
|---|---|
| Four cluster records — id, name, slug, country, status | identical to 31 Oct |
| Exail | live, `excluded`, **0 sectors**, 18 products, description still **EMPTY** |
| ECA Group / Infotron | live, `included`, 1 sector, 1 product, 134-char description |
| IT180 STH-U `3b53c4ed…` | still ECA in `products.company_id` **and** `product_companies` (manufacturer) |
| Sector ids | `157db255…`=`eco-navigation`, `e73703e1…`=`eco-components` |
| `ECA Group` alias | on ECA only · `Infotron` on no company · no collision |
| Redirects | only `eca-group → eca-group-infotron` and the pre-existing `gorge → exail` |
| Relationships | only `1d4a81cd… → Exail` (`jv_partner`) — nothing to preserve or move |
| Landscape gate, re-simulated on today's rows | **567 → 568 → 567** |

**Nothing was written.** Every statement in this pass was a `SELECT`.

One false alarm worth recording: my ad-hoc probe query used `alias_type` and
`relationship_type` and errored. The **prepared SQL is correct** — both tables name the
column `type`, and the package already writes
`company_aliases (company_id, alias, type)` and
`company_relationships (source_company_id, target_company_id, type)`.

Status unchanged: **PREPARED, NOT APPLIED.** Awaiting ChatGPT's review, then Nazar's go-ahead.
