# Exail admission + ECA/Infotron merge — APPLIED

**Date:** 2026-11-01 · **Status:** APPLIED AND DEPLOYED · **Next actor:** ChatGPT

Authorised by Nazar in three parts: (1) the reviewed admission and merge, including the
`merged_with` lineage row and the retirement of ECA's duplicate entries in both landscape
editions, preserving historical notes; (2) the Exail description proposed in §8.1 of the
merge review; (3) **category-only** corrections for products whose maritime / non-aerial
identity is supported by evidence, with the explicit caveat *"do not assume all 12 flagged
records are resolved."*

Deliverables: [applied SQL](2026-11-01-exail-merge-applied.sql) ·
[rollback](2026-11-01-exail-merge-rollback.sql) ·
[prepared package & review](2026-10-31-exail-merge-review.md) ·
[re-screen](2026-10-31-exail-rescreen.md)

The 2026-10-31 rollback file is **superseded** — it does not undo the description, the
eleven category corrections or the eleven product redirects.

---

## 1. What changed, and what did not

One transaction, 17 steps, applied once. Steps 1–14 are the reviewed package verbatim;
15, 16 and 17 are the newly authorised work.

| # | Change | Rows |
|---|---|---|
| 0 | Identity guard (extended: + the 11 products, + the `from_section` column) | read-only |
| 1–2 | Exail gains `eco-navigation` (primary) + `eco-components`, `high`/`editor`, both with the SIRTAP release and the product range as `source_urls` | 2 inserted |
| 3 | Exail `europe-uav-cuas-2026` → **included**, with the full reasoning and the explicit "no aerial platform is claimed" caveat in the screening note | 1 updated |
| 4–5 | IT180 STH-U → Exail in `products.company_id` **and** `product_companies` | 2 updated |
| 6–8 | `ECA Group` + `Infotron` added to Exail as `former_name`; ECA's own `ECA Group` alias **deleted** (moved, not copied — see §3 of the review) | 2 inserted, 1 deleted |
| 9–10 | `eca-group` repointed straight to `exail`; `eca-group-infotron → exail` added | 1 updated, 1 inserted |
| 11–13 | ECA → `draft`; both landscape rows → `excluded` with explanatory notes | 3 updated |
| 14 | `ECA Group / Infotron —merged_with→ Exail` (started_year 2022) | 1 inserted |
| **15** | **Exail description** set from §8.1 (335 chars) | 1 updated |
| **16** | **11 category corrections**, UAV → Other | 11 updated |
| **17** | **11 product redirects** keeping the old `/uav/` urls alive | 11 inserted |

**Nothing was deleted except the one ECA alias.** The ECA row, its two landscape rows,
their screening notes, its article link and the new lineage row all survive. The IT180
keeps its name, slug, category, specs, description and all 14 `product_taxonomy` rows.
No product was renamed, retired, deduplicated, reassigned or unpublished.

## 2. Counts — rebased on today's database

The 31 October package's baseline was stale: the hub import and the investor
reconciliation have since published companies, so live companies are 2,458 today, not
2,447. Everything else was unchanged.

| | Before | After | Why |
|---|---|---|---|
| **Landscape (`europe-uav-cuas-2026`)** | **567** | **567** | +1 Exail admitted, −1 ECA retired |
| Live companies | 2,458 | **2,457** | ECA → draft |
| Live products | 3,522 | **3,522** | nothing published or unpublished |
| Products categorised UAV | 1,455 | **1,444** | 11 corrected |
| Products categorised Other | 371 | **382** | the same 11 |
| Exail's products | 18 | **19** | IT180 arrives |
| …of them UAV | 12 | **2** | IT180 (correctly aerial) + Exail A27 (held) |
| …of them Other | 2 | **13** | 11 corrected + DriX H-9, Oryx O-16 (already Other) |
| Exail description | **empty** | **335 chars** | §8.1 |
| Redirect rows | 53 | **65** | +1 company, +11 product |
| Investor records / institutions | 118 / 193 | **118 / 193** | untouched |

As the re-screen insisted: the net 567 is the coincidence of two independent decisions,
not a target. Both were authorised, so both landed.

## 3. The category corrections — 11 applied, 1 held

The authorised test was *"products whose maritime/non-aerial identity is supported by
evidence"*, **category only**.

**Applied (UAV → Other):**

| ID | Name | Evidence for non-aerial identity |
|---|---|---|
| `1de976af…` | A-18M | A18-M autonomous **underwater** vehicle, mine countermeasures |
| `c87b1319…` | DriX | USV **series**; the record's own `product_taxonomy` note reads *"filed under category UAV but is not an aerial system — verify category"*, beside *"hydrographic survey USV"* |
| `b9f83dc2…` | DriX H-8 | USV, 7.71 m / 1.6 t; taxonomy carries *"diesel, 550 L"* and *"max 14 kn"* |
| `2dbd66ec…` | DriX O-16 | USV, 15.75 m / 10.5 t; same *"is not an aerial system"* taxonomy note, plus *"3,500 nmi transoceanic range"* |
| `e38073ce…` | H-8 | bare designation — but see below |
| `9511089c…` | H-9 | bare designation — but see below |
| `3e1dcc70…` | Inspector | Inspector 125 / 90 **surface** vessel |
| `6efaadb9…` | K-Ster | the record's own summary: *"expendable mine-disposal system … autonomous mine countermeasures"* (ROV) |
| `b9dbf15b…` | Neptis | the record's own summary: *"maritime surveillance system … based on naval drones from the Oryx range"*, launched 9 Oct 2026 |
| `0aa9487c…` | O-16 | bare designation — but see below |
| `8b1f6503…` | Oryx | USV **family** unveiled 9 Oct 2026 |

**The three bare designations deserve their own sentence.** `H-8`, `H-9` and `O-16`
are genuinely ambiguous and almost certainly prefix-stripped duplicates — DriX and Oryx
reuse the same designations. Both of those questions are unauthorised and untouched. But
**every candidate identity is an uncrewed surface vessel**, so the non-aerial fact is
settled whichever family they belong to. The ambiguity bears on the name and on the
duplicate question, not on the category, so a category-only correction is exactly the
operation the ambiguity does not block.

**Same logic for the two family records.** Whether `DriX` and `Oryx` should exist as
product records at all is a separate decision, and retiring family records was explicitly
forbidden. They are maritime either way, so they were recategorised and kept.

**Held back, unchanged, and reported as instructed:**

- **`3515b298…` Exail A27** — the re-screen found **no source anywhere** naming this
  product. Its identity cannot be established, so neither can its category. It remains
  live and categorised UAV. *This is why Exail still shows two UAV products rather than
  one.* Resolving it means either finding evidence or unpublishing it — a publication
  change, which was not authorised.
- **`17f660ef…` DORCUS** — categorised Counter-UAS and **not an Exail product**: a
  SOFRAME / MAC JEE armoured fire-support vehicle in which Exail supplies inertial
  navigation. That is an **ownership** question, explicitly left pending.
- The re-screen's proposed **renames** (`A-18M`→`A18-M`, `Inspector`→`Inspector 125`)
  are not applied — renaming was forbidden, and the generated slug comes from the name,
  so a rename would move the url a second time.
- **`product_taxonomy` is untouched** for every one of these records. "Category only"
  was taken literally. Two consequences: the stale *"verify category"* notes on DriX and
  DriX O-16 now describe a fixed problem, and any UAV-flavoured taxonomy fields these
  records carry still render on their new `/other/` pages. Cleaning that up is a
  separate pass.

**One thing worth flagging beyond this cluster.** The *"filed under category UAV but is
not an aerial system"* taxonomy flag sits on **24 products, only 3 of them Exail's**.
Nineteen others are still categorised UAV — Saildrone Explorer and Spectre, MAGURA V5,
Sea Baby, REMUS 100/130, Hugin, Gavia, XLUUV, WOLF-X, Hunter WOLF, Ghost Shark and more.
Three (Sea Lancer, Sea Sabre, GhostFoiler) have already been moved to `Other` by an
earlier pass, which is the precedent this correction follows. **Not touched here** — the
authorisation covers the Exail cluster. It is the obvious next batch.

## 4. URLs — the part that needed new code

**Checked, as instructed, before applying.** A product page lives at
`/<section>/<slug>/`, where the section comes from `products.category` and the slug from
the product **name**. So correcting a category *does* move the url, even though the slug
does not change: `/uav/drix-h-8/` → `/other/drix-h-8/`.

**Collisions verified beforehand, both directions:**

- Each of the eleven slugs is **unique within `/uav/`**, so no other product's `-2`
  suffix shifted when they left. (`slugify` dedupes per section in `name.asc, id.asc`
  order, so a departure can renumber a namesake — there were none.)
- Each slug is **free within `/other/`**, so none of the eleven landed on a `-2` suffix
  of its own. Confirmed against all 3,522 live products, and the eleven destination
  slugs match `products.slug` exactly.

**The redirect table could not express this move, so the generator was changed.** Every
stub was written into the section of its **target**, so a same-slug redirect would land
on top of the live page it points at and be skipped as a collision — and the old
`CHECK (from_slug <> to_slug)` rejected the row outright. Two changes, both in the
catalogue repo and the shared schema:

1. `slug_redirects.from_section` (nullable) records the section the **old** url lived in;
   the not-self CHECK is relaxed to `from_slug <> to_slug OR from_section is not null`.
   NULL keeps the previous behaviour, so all 53 pre-existing rows are unaffected —
   including the one existing product redirect, `ax250-gax500-3d → ax250`.
2. The generator writes the stub into `from_section` when it is set, while the canonical
   and the meta-refresh still point at the target's own section.

Migration `slug_redirects_from_section`, mirrored idempotently in `db/schema.sql`.

**`/uav/it180-sth-u/` does not move** — only the owner changed, not the name or the
category. **`/companies/eca-group-infotron/`** stops being a real page and becomes a stub
to `/companies/exail/`; **`/companies/eca-group/`** was repointed straight to `exail`
rather than left to chain through a retired slug, which GitHub Pages cannot do.

## 5. Validation

| Check | Result |
|---|---|
| Four cluster records — id, name, slug, country, status | **zero drift** from 31 Oct |
| Live baseline re-measured today | companies 2,458 (not 2,447), landscape 567, products 3,522 |
| Schema re-verified against the live database | `source_company_id`/`target_company_id`, `(product_id, company_id, role)`, `screening_note`, `citext` per-company alias uniqueness, `products.category` CHECK |
| **Triggers found that `PREPARE` cannot exercise** | 4 — see below |
| **Full-transaction dry run** (`begin … rollback`) | **all 23 verification values exactly as predicted** |
| Database state after the dry run | **unchanged** — sectors 0, ECA live, description NULL, UAV products 1,455, redirects 53 |
| Applied transaction | same 23 values, committed |
| Idempotency | every statement guarded by its own `WHERE` / `ON CONFLICT`; the step-0 guard tests identity invariants only, so it does not fire on a rerun |
| Schema mirror replayed against the live DB | no change (65 redirects, 11 with a section, CHECK intact) |
| Tests | **60/60 pass**, including a new one for the cross-section redirect |

**The four triggers, and why they matter.** The instruction was right that `PREPARE` does
not prove execution will succeed. Four triggers exist on the tables this transaction
writes, and none of them appears in the 31 October validation:

- `companies` and `products` each carry `BEFORE UPDATE set_updated_at`, which overwrites
  `updated_at` with `now()`. **Consequence for the rollback:** the restored original
  timestamps are silently discarded. The 31 October rollback claimed byte-identical
  restoration *including* timestamps — that claim was wrong, and the new rollback says so
  in its header. Content restores exactly; `updated_at` does not.
- `company_sectors` carries `BEFORE INSERT company_sectors_skip_derivable`, which
  **silently drops** a sector row implied by a more specific one the company already
  holds, and `AFTER INSERT company_sectors_prune_implied`, which **deletes** an implied
  ancestor row. Either could have quietly swallowed one of the two admission rows and
  left the landscape verdict without the taxonomy that makes it count. They did not: the
  skip function returns early when `source_urls` is non-empty (both rows carry two
  sources), Exail had zero existing rows to prune, and the two new rows are siblings. The
  dry run confirmed `exail_sectors = 2`.

A new test, *"a category correction keeps the old /uav/ url alive via from_section"*,
builds the whole site against a fixture and asserts that the stub lands at `/uav/<slug>/`,
that `/other/<slug>/` is still the real page and not a stub, that the retired url stays
out of the sitemap — and that **without** `from_section` the same move cannot be
expressed at all.

## 6. Live verification

Deployed by the existing workflow (`deploy.yml`, push-triggered) from catalogue commit
`c4b3555`. Site rebuilt **2026-11-01T16:26:23Z**. Every check below was run against
xsonomy.com after the deploy, not against the build output.

| Check | Result |
|---|---|
| **Exail appears with its description and taxonomy** | ✓ one row in `/data/landscape.json`: `domains: ['uav']`, sectors `eco-navigation`, `eco-components`, `uav-ecosystem`, `uav`, the 335-char description, 19 products |
| **ECA is no longer counted separately** | ✓ **zero** ECA rows in the landscape; absent from `companies.json` |
| **Landscape total** | ✓ **567** |
| `/companies/exail/` | ✓ 200 |
| `/companies/eca-group-infotron/` | ✓ 200, canonical → `/companies/exail/` |
| `/companies/eca-group/` | ✓ 200, canonical → `/companies/exail/` — straight there, not chained |
| `/companies/gorge/` | ✓ 200, canonical → `/companies/exail/` (pre-existing, unaffected) |
| **IT180 remains accessible under Exail** | ✓ `/uav/it180-sth-u/` 200, unmoved, and the IT180 is in Exail's product list |
| **11 new product URLs** | ✓ all `/other/<slug>/` 200, and `/other/neptis/` verified to be the real product page (`<title>Neptis — Exail · xSonomy</title>`), not a stub |
| **11 old product URLs** | ✓ all `/uav/<slug>/` 200, each canonical + meta-refresh → its own `/other/<slug>/` |
| Section data files | ✓ `uav.json` **1,444**, `other.json` **382** — matching the database exactly |
| Moved products gone from `/uav/` | ✓ none of the 11 remains in `uav.json`; all 11 are in `other.json` |
| Exail A27 deliberately unmoved | ✓ still in `uav.json` |
| **Investors intact** | ✓ 118 records, 26 Ukraine-linked, 74 portfolio relationships, 13 unresolved, 9 fund positions, 23 with financial metrics |
| **Hubs intact** | ✓ 37 organisations + 1 site, 40 locations, 25 countries |
| **Academia intact** | ✓ 37 research & academic organisations, `/research/` 200; suppliers 2,421 → 2,420, the single expected drop |
| Landscape candidate rows | ✓ included 567, excluded 266, needs_review 140, candidate 4, total 977 — **identical** before and after, because ECA moved included→excluded as Exail moved excluded→included |

**One thing found while verifying, outside this change.** 101 live `included` landscape
companies have an **empty description** and therefore render blank on the public map.
Exail was one of them until today, which is exactly the problem §8.1 of the review raised
— it is just much more widespread than one record. Not caused by this change and not in
scope; it deserves its own pass.

## 7. Left pending, as instructed

| | Why |
|---|---|
| **iXblue** (`e99326a6…`) | still `needs_review`, 0 sectors, and it owns **Qinertia**, Exail's own GNSS-INS software. Half of the entity that became Exail; the database now records that ECA merged into Exail while iXblue did not. A later iXblue merge repeats this exact pattern. |
| **Exail Robotics (BE)** (`ffa0380d…`) | excluded on maritime grounds that were inherited, not re-tested against the widened criteria |
| **Parent-company restructuring** | Exail still holds `Exail Technologies`, `Gorgé`, `Gorgé SA` and `Groupe Gorge` as aliases of the *operating* company, with a `gorge → exail` redirect baking it in. Six aliases now. This transaction made the record more right without making it right. |
| **Thales's 35.51% stake** (July 2026, heading to full ownership by 2028) | still unrecorded |
| **DORCUS ownership** | see §3 |
| **Exail A27** | see §3 |
| **H-8 / H-9 / O-16 duplicates and the DriX / Oryx family records** | see §3 |
| **`product_taxonomy` cleanup** on the eleven corrected records | see §3 |
| **The 19 other non-aerial products still categorised UAV** | see §3 |
| **A retired draft can still capture an entity match** | `resolve-entities.mjs` does not filter drafts, so the *name* "ECA Group / Infotron" remains an exact-match key. Moving the alias fixes the likely case; the general fix (filter drafts, or prefer a live record on a tie) belongs in this repo and would protect every past and future merge. |
| **`2026-10-31-composite-merges-and-reassignments.sql`** | still uses `source` / `target` and **will fail as written**. Untouched. |

## Sources

- Exail, *"Exail to equip Airbus SIRTAP tactical UAS with advanced inertial navigation technology"*, 12 May 2025
- Exail product range, Defense → *"Land and air navigation & pointing"*
- Exail, *"Exail unveils Neptis…"*, 9 October 2026; Euro-SD, *Exail Neptis / Oryx*, October 2026
- `product_taxonomy` notes on `c87b1319…` and `2dbd66ec…` (in-database editorial flags)
- Live schema, constraints, triggers and row state, Supabase project `uobidcahmrmfdmfbrtkt`, 2026-11-01
- `scripts/lib/landscape.mjs`, `scripts/generate-supabase.mjs` (catalogue repo) — the membership gate, slug derivation, section mapping and the redirect-collision rule
- `scripts/lib/resolve.mjs`, `scripts/resolve-entities.mjs` (this repo) — the alias index behaviour
