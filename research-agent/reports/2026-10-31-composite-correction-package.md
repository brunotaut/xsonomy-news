# Composite-name records — correction package

**Date:** 2026-10-31 · **Status:** preparation only. No database write, no publication
change, no merge, no deletion, no deployment. Academia and investor work untouched.
**Reviews this builds on:** `2026-10-30-composite-and-academia-review.md`,
`2026-10-30-composite-name-review-manifest.csv`
**Package:** `2026-10-31-composite-correction-manifest.csv` (20 rows) ·
`2026-10-31-composite-renames.sql` + `-rollback.sql` ·
`2026-10-31-composite-merges-and-reassignments.sql` · `2026-10-31-eca-exail.sql`

---

## Recheck against current records

All 19 rechecked today. **Zero drift**: every one is still `live`, and every current name
matches the review manifest exactly.

**Accounting for the 11 organisation-type corrections applied yesterday**, two notes in the
review are now stale and are corrected here:

- **CASC / CAAA is no longer `research_institute`** — it is `state_owned`, so it is a
  supplier and no longer part of the academia inventory. Its rename has no academia effect.
- **Chengdu Aircraft Design and Research Institute is now `division`**, which does not
  change the design-versus-manufacture question below.
- `MIT Lincoln Laboratory / U.S. DoD Strategic Capabilities Office` is **still**
  `research_institute`, so its rename keeps it on `/research/` and alters nothing about the
  academia class.

Current baseline: 2,447 live companies = 2,410 suppliers + 37 research organisations;
landscape 567; 3,521 live products.

## Tier A — 12 renames, ready

Evidence-backed, and the whole change is `companies.name` plus alias rows.

| Current | Proposed | Alias kept |
|---|---|---|
| Brolis Semiconductors / Brolis Defence | **Brolis Defence Group** | Brolis Semiconductors (former name), Brolis Defence |
| CASC / China Academy of Aerospace Aerodynamics (CAAA) | **China Academy of Aerospace Aerodynamics (CAAA)** | CAAA |
| Chengdu Aircraft Industry Group (CAIG) / AVIC | **Chengdu Aircraft Industry Group (CAIG)** | CAIG |
| Guizhou Aircraft Industry Corporation / Chengdu (AVIC) | **Guizhou Aircraft Industry Corporation (GAIC)** | GAIC |
| KB Luch (part of Vega Concern / Rostec) | **KB Luch, Rybinsk** | Design Bureau Luch |
| Meridian / Politek-Aero | **Meridian (S.P. Korolev Meridian)** | S.P. Korolev Meridian |
| MIT Lincoln Laboratory / U.S. DoD Strategic Capabilities Office | **MIT Lincoln Laboratory** | — |
| Shahed Aviation Industries / HESA | **Shahed Aviation Industries** | — |
| Spotter Global / SpotterRF | **Spotter Global** | SpotterRF (former name) |
| Thales / Elbit Systems (U-TacS joint venture) | **UAV Tactical Systems (U-TacS)** | U-TacS |
| United Instrument Manufacturing Corporation (OPK / Rostec) | **United Instrument Manufacturing Corporation (UIMC)** | OPK |
| Unmanned Systems Group (Supercam / BAS) | **Unmanned Systems Group** | Supercam (brand) |

**Why a rename is safe here.** Slugs are untouched, and the catalogue keys company pages on
`slug`, so **no URL moves and no redirect is needed** (CLAUDE.md rule 3 satisfied by doing
nothing). Publication status, products, relationships, sectors, article links and landscape
rows are all untouched. **Meridian and U-TacS are in the published landscape and stay in
it** — membership is keyed on `company_id`, never on the name.

**Dry run:** 12 rows would change; all 12 before-values match the review; **no exact or
normalised name collisions** with any other company; products retained (1, 2, 3, 1, 2, 1,
1, 1, 1, 1, 1, 4); landscape statuses unchanged. A rerun changes nothing.

### Two upgrades on the earlier review

**Spotter Global goes from low confidence to high.** The review could not find a rebranding
announcement because the company's own `/about` 404s. There is one: a press release dated
**24 March 2022, "SpotterRF has Grown into Spotter Global"**, which states "SpotterRF, now
Spotter Global, was founded in 2009…". `SpotterRF` is therefore a documented `former_name`,
not a guess.

**The KB Luch "possible duplicate" is resolved, and it is not a duplicate.** Russian-language
sources establish that KB Luch, Rybinsk is a subsidiary of Vega Concern and is Vega's lead
enterprise for the artillery air-reconnaissance system; *Rossiyskaya Gazeta* records the
Defence Ministry ordering the Korsar from the Rybinsk bureau. So the two records are
**parent and subsidiary**, both legitimate: `KB Luch` holds Korsar and Lastochka, and Vega
holds the BLA-08 Tipchak, which is a Vega product.

> That leaves a **dependent rename outside the 19**: `Vega Radio Engineering Corporation
> (Luch Design Bureau, Rybinsk)` → **Vega Radio Engineering Corporation**, dropping the
> wrongly appended subsidiary. It is row F in the manifest, flagged separately because it
> is not one of the 19 and needs the same approval.

### Deliberately left out of the ready tier

The review recommended recording parents — AVIC for CAIG and GAIC, Rostec for UIMC, Vega
for KB Luch, CASC for CAAA, Thales and Elbit for U-TacS. Writing those means either an
ownership column or new `company_relationships` rows, and **ownership changes are not
authorised by this instruction**. They are listed as optional enrichment and need their own
approval. The facts are in the manifest either way, so nothing is lost by deferring them.

## Tier B — one merge, needs confirmation

**`IAI (Tamam / MALAT)` → `Israel Aerospace Industries (IAI)`.** Tamam and MALAT are IAI
divisions, not companies, and **the catalogue already says so**: a `division_of`
relationship already points from this record to the real IAI record. The merge makes the
record agree with the relationship.

Moves `POP300 · POP400 · MiniPOP · MOSP` to IAI (17 → 18 products), adds `Tamam` and
`MALAT` as aliases, adds a redirect, deletes the now-meaningless relationship row, and sets
the composite to `draft`. **Neither record is in the landscape, so membership is unaffected.**

## Tier C — three unpublish-and-reassign proposals, each needing a decision

| Record | Product(s) | To | The decision |
|---|---|---|---|
| BUAA / HAIG | BZK-005 | Harbin Aircraft Industry Corporation (live, 0 products) | Clean: a university designer paired with its manufacturer. Only the publication change needs approving |
| Northrop Grumman / IAI | RQ-5 and MQ-5B Hunter | Israel Aerospace Industries | **A judgement, not a clerical fix.** IAI Malat originated the design, TRW built the US side, Northrop Grumman inherited it in 2002. Both products are `discontinued`, so no current business moves |
| IAI / Israel MoD | TecSAR / Ofeq SAR satellites | IAI **or** unpublish the product | **The satellite-scope rule has to be decided first.** These are the same class as the PRISMA and COSMO-SkyMed products unpublished on 2026-10-29 |

Both C3 variants are written out; pick one.

### Two traps the dry run caught

1. **Product ownership is stored twice.** `products.company_id` *and*
   `product_companies(product_id, company_id, role)`. Every affected product has one mirror
   row with role `manufacturer`. A reassignment that updates only `products.company_id`
   leaves the mirror pointing at the retired owner. Every block updates both.
2. **A product's URL does not move with its owner.** The public product slug comes from
   `slugify(product name)`, not from the company, so reassignment needs **no product
   redirect** and breaks no indexed product URL. Confirmed: no destination holds a
   same-named live product, so no slug collision either.

## ECA Group / Infotron → Exail — and why the status must not move

This is the item the instruction asked to handle separately, and it turned out differently
from the earlier report. **I am correcting my own earlier recommendation.**

**Why Exail is excluded** — its own screening note: *"queued products (DriX, A-18M, DORCUS)
are maritime/underwater. UMIS integrates third-party UAVs rather than establishing Exail as
an aerial UAV OEM. Outside the aerial Landscape until Exail-owned aerial evidence appears."*

**Why ECA Group / Infotron is included** — its own note: *"the duplicate record ECA Group
was merged into this one, which holds the IT180 UAV lineage… Exail is recorded separately
and excluded as maritime, and that distinction was kept."*

So the split was **deliberate**, not an accident: one record carries the aerial lineage and
is included, the other is the maritime successor and is excluded. Reconciling them means
answering whether the merged entity has current aerial UAV evidence. Four findings:

1. **Exail's current robotics page lists no aerial drone or UAV family** — uncrewed surface
   vessels, AUVs, ROVs, unmanned ground vehicles, and no IT180.
2. **The newest IT180 material on exail.com is dated 7 December 2015** and was issued as
   ECA Group, with ecagroup.com links. Legacy content rehosted after the rebrand, not
   current Exail aerial evidence.
3. **Exail's 12 products categorised `UAV` in this database are all maritime or
   underwater** — DriX and its H-8/H-9/O-16/Oryx variants, A-18M, K-Ster, Neptis,
   Inspector, Exail A27 — and several are duplicates of each other. They are
   mis-categorised. They are not aerial evidence.
4. **Exail has zero `company_sectors` rows.** The landscape build skips any company with no
   explicit taxonomy assignment, so setting Exail to `included` **would not put it in the
   landscape at all.** The published count would read 566 while the database claimed 567.

> **Moving `included` onto Exail is therefore declined.** It is unsupported on the merits,
> and point 4 means it would not even work. That is exactly the "transfer status merely to
> preserve a count" the instruction ruled out.

The identity question and the landscape question come apart:

- **Identity: the merge is correct.** ECA Group and Infotron are both inside Exail.
- **Landscape: the surviving entity has no current aerial UAV evidence. 567 → 566.**

**Option E1 (recommended): merge on identity and accept 566.** Atomic, and it preserves
everything legitimate — the IT180 product and its evidence, both former names as aliases,
the sector assignment copied across so Exail can ever be screened at all, and the redirects.
**Watch the redirect chain**: `eca-group → eca-group-infotron` currently points at the slug
the merge retires, and GitHub Pages cannot chain, so it is repointed to `exail` as well as a
new `eca-group-infotron → exail` being added.

**Option E2: do not merge yet; re-screen Exail first.** Nothing is written. The re-screen
has to fix three things a merge would not: the 12 mis-categorised products, whether Exail
markets any aerial UAV today, and the missing taxonomy assignment. Only then is a landscape
verdict for the merged entity meaningful.

**Also found, not actionable here:** Thales agreed in July 2026 to take a 35.51% controlling
stake in Exail Technologies, heading to full ownership by 2028. Ownership changes are not
authorised, so it is recorded and not written.

## Tier D — two held

- **NESCOM / GIDS (with Pakistan Air Force).** Sources conflict on who owns the Burraq
  design, and Quwa questions whether it is indigenous rather than a licensed CH-3
  derivative. The split shape looks right; the assignment is not supportable.
- **NPKC Novik (Novik-XXI Vek) / Kyshtym Radio Plant.** No authoritative source found for
  the GrANT or this pairing. The record's `status` is already `defunct`. Needs a
  Russian-language source check; the similarly named `NPKTs Novik-91, Egoryevsk` is a
  different place with a different product and must not be merged into it.

## Ready vs needs a decision

**Ready to apply on approval — 12 renames.** Zero drift, no collisions, no URL change, no
publication change, full rollback written.

**Needs a decision:**

1. **The 12 renames** — approve as a block, or individually.
2. **Row F**, the dependent `Vega Radio Engineering Corporation` rename outside the 19.
3. **Optional enrichment** — whether to record parents (AVIC, Rostec, Vega, CASC, Thales
   and Elbit) as ownership or relationship rows.
4. **Merge B1** — IAI (Tamam / MALAT) into IAI.
5. **Unpublish C1** — BUAA / HAIG, BZK-005 to Harbin.
6. **Unpublish C2** — Northrop Grumman / IAI, and whether the Hunters go to IAI as
   originator.
7. **The satellite-scope rule**, which decides C3a versus C3b.
8. **ECA / Exail: E1 or E2**, knowing that either way the landscape honestly reads 566
   unless Exail is re-screened and admitted on fresh evidence.
9. **A separate Exail data-quality pass** — 12 mis-categorised products, several
   duplicates, and no taxonomy assignment. This is a defect on a live record regardless of
   what happens to ECA.

## Totals

- Records rechecked: **19** · drift found: **0**.
- Ready: **12 renames** (+1 dependent, outside the 19).
- Needing a decision: **5 records** (1 merge, 3 unpublish/reassign, 1 ECA).
- Held: **2**.
- Database rows changed by this pass: **0**.
