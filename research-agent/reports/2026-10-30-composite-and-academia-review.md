# Composite-name records and the academia population — read-only review

**Date:** 2026-10-30 · **Status:** read-only. No database change, no publication change, no merge,
no deletion, no deployment.
**Manifests:** `2026-10-30-composite-name-review-manifest.csv` (19 rows) ·
`2026-10-30-academia-inventory.csv` (43 rows)
**Follows:** `research-agent/reports/2026-10-30-entity-error-removal.md`

---

## The population is 19, not 22

The earlier report flagged 22 live composite-name records. Three of them —
`OHB Italia / Leonardo`, `TUBITAK UZAY / ASELSAN` and `Thales Alenia Space Italia / e-GEOS` —
were unpublished in that same removal. **19 remain live.** A fresh sweep on any slash, not only
` / `, found no others.

## Not every slash is an error — and one assumption was wrong

| Classification | Records |
|---|---|
| **Genuine legal entity** | 1 |
| One organisation — divisions, brand, former name or parent annotation | 8 |
| Multiple independent organisations incorrectly combined | 8 |
| Unresolved, no source found | 1 |
| Probable rebrand, weak evidence | 1 |

Confidence: 11 high, 5 medium, 3 low.

**`Thales / Elbit Systems (U-TacS joint venture)` is a real company.** UAV Tactical Systems Ltd is
registered in Leicester, formed end-2005, owned 51% Elbit / 49% Thales UK, and it develops and
builds the Watchkeeper. Keep it; rename it to its legal name. One source says it passed to full
Elbit ownership in January 2026 — a single source, so the ownership fields should not be written
from it yet.

**`Guizhou Aircraft Industry Corporation / Chengdu (AVIC)` overturned my own assumption.** The
earlier report guessed "Chengdu" was spurious. It is not: Chengdu designed the WZ-7 Soar Dragon
and Guizhou built it. Two separate AVIC subsidiaries, correctly named — just badly combined.

## The one that needs care: ECA Group / Infotron

This is the only record where a naive fix would damage the published landscape.

ECA acquired Infotron, maker of the IT180, in 2014. ECA Group and iXblue then combined under the
name **Exail** in October 2022. So the record names a former parent and an absorbed subsidiary of
a company that already exists here.

> **`Exail` is live with 18 products — but it is reconciled `excluded`, while `ECA Group /
> Infotron` is `included` in the published landscape.**

Merging the obvious way would drop a landscape member, 567 → 566. The landscape status has to move
with the merge, and that is a reconciliation decision, not a data tidy. The record also already
carries the alias `ECA Group` and a redirect `eca-group → eca-group-infotron`, both of which must
survive any rename.

Two other composites are also in the published landscape: `Meridian / Politek-Aero` and the U-TacS
record. Both are recommended for rename only, which preserves membership.

## What I did not do

Three records are held rather than fixed, because the evidence does not support an answer:

- **`NPKC Novik (Novik-XXI Vek) / Kyshtym Radio Plant`** — no authoritative source found for the
  GrANT UAV or this pairing. The shape looks like developer-plus-plant, but that is inference. A
  similarly named record, `NPKTs Novik-91, Egoryevsk`, holds a different product; do not merge.
- **`NESCOM / GIDS (with Pakistan Air Force)`** — sources conflict on who owns the Burraq design,
  and Quwa questions whether it is indigenous at all rather than a licensed CASC CH-3 derivative.
- **`Spotter Global / SpotterRF`** — almost certainly one company, but the `/about` page 404s and
  no rebranding announcement exists. Renaming is low-risk; recording a formal former name is not.

And one duplicate is flagged but **not** resolved: `KB Luch (part of Vega Concern / Rostec)` and
`Vega Radio Engineering Corporation (Luch Design Bureau, Rybinsk)` may be the same Rybinsk bureau
recorded twice, or a parent and its subsidiary. They hold different products (Korsar and Lastochka
versus BLA-08 Tipchak). This pass could not settle it.

## Where products would move

Six records combine genuinely independent organisations and hold products that would need
reassigning. In four of those the receiving record already exists:

| Record | Product(s) | Proposed owner | Already in catalogue? |
|---|---|---|---|
| BUAA / HAIG | BZK-005 | Harbin Aircraft Industry Corporation | yes, live, 0 products |
| Northrop Grumman / IAI | RQ-5 and MQ-5B Hunter | Israel Aerospace Industries, as originator | yes, live, 17 products |
| IAI / Israel MoD | TecSAR / Ofeq | IAI — or unpublish as a satellite | yes |
| Shahed Aviation Industries / HESA | Shahed 129 | Shahed Aviation Industries, by rename | no separate record |
| NESCOM / GIDS | Burraq | **held** | no |
| Novik / Kyshtym | GrANT | **held** | no |

The Hunter assignment is a judgement call on a genuinely joint programme, not a clerical fix — IAI
Malat originated the design, TRW built the US side, and Northrop Grumman inherited it in 2002.

`IAI / Israel MoD` raises a scope question rather than an ownership one: TecSAR and Ofeq are
reconnaissance satellites, the same class of record as the PRISMA and COSMO-SkyMed products
unpublished yesterday. If that rule stands, the product goes regardless of who owns it.

---

# The academia population

43 live records, found by type and by name pattern. Not the "about 40" estimate's worth of
universities — the set is more mixed than that.

| | Count |
|---|---|
| Genuine universities and research institutes to retain | 25 |
| Retain **and** currently in the published landscape | 3 |
| Mistyped — actually companies, should be retyped | 5 |
| Out of scope entirely, or needs retyping away from research | 3 |
| Typing unverified, needs a read | 4 |
| Outright entity-extraction error | 1 |
| False positive, matched on a word | 1 |

**Four are inside the published landscape**, which is the fact that makes a blanket rule unsafe:
Delft University of Technology (MAVLab), Fraunhofer IDMT, NPTs 'Virazh' (National Aviation
University) and **Roke Manor Research**. Removing academia wholesale would take four of the 567.

**Roke Manor Research is not academia at all.** It is a commercial engineering firm owned by
Chemring; "Research" is part of its trading name. It is the clearest mistyping in the set and the
best argument for reading records rather than matching names. Four more are similar: CASC/CAAA,
Chengdu Aircraft Design and Research Institute, NPO Android Technology and SGS-CSTC.

**`Pixhawk` is an entity-extraction error** of exactly the kind removed yesterday — an open
autopilot hardware standard, not an organisation. It was missed because it is typed
`research_institute`. **CyArk** (heritage digitisation) and **WeRobotics** (humanitarian
non-profit) are not UAV organisations either, and **LMI** is a US government-advisory non-profit.

## The proposal

**The type already exists.** `company_type` is a `text` column with a CHECK constraint that
already permits `research_institute` and `university` — 24 and 12 live records use them. Nothing
needs to be added to the database to classify these organisations. What is missing is that the
*site* still counts and presents them as companies.

So the proposal is a presentation and counting rule, not a schema change:

1. **Define a "Research & academia" class** as `company_type IN ('research_institute',
   'university')`. No migration, no new enum value, no risk to the CHECK constraint.
2. **Exclude the class from the headline company count.** The companies registry would read
   "2,4xx companies · 36 research and academic organisations" rather than folding them together.
   This is the user's actual complaint — that a university inflates a company count — and it is
   solved without removing anything.
3. **Keep their pages and products.** They are real organisations with real UAV work; Delft's
   MAVLab and Fraunhofer IDMT earn their place. Removing them loses genuine coverage.
4. **Give the class its own filter** on the registry, defaulted off, so a reader looking for
   suppliers sees suppliers.
5. **Landscape membership on the existing merits rule, unchanged.** An institution stays in the
   landscape only where it already passes — owning an evidenced, named product in scope. That
   keeps the four current members and admits nothing new. Count them separately on the page if the
   distinction matters.
6. **Fix the typing first, because the class is only as good as its membership.** Seven
   universities carry no `company_type` at all (Central Michigan, Embry-Riddle, Peking, Hong Kong,
   Maryland, Pennsylvania — plus Yale School of Public Health is typed but questionable in a UAV
   catalogue). Five records are mistyped as research when they are companies. One, Pixhawk, is not
   an organisation.

**What this does not solve.** It does not answer whether Harvard or Yale School of Public Health
belong in a UAV catalogue on relevance grounds. The class makes them harmless to the company
count; it does not make them useful. That remains a judgement, and the honest options are to keep
them as low-cost context or to apply a relevance test — owns a product, or is cited by an article
in scope — and drop the rest.

## Which of the 19 removed this would reconsider

Four of yesterday's removals were taken out on entity type alone and would be retained under this
policy rather than unpublished:

| Record | Kind | Why it would come back |
|---|---|---|
| Rzeszów University of Technology | university | Removed as "a university", which the policy accommodates |
| University of Porto | university | Same |
| Laser Zentrum Hannover | research institute | Non-profit institute; its spinout INLEAP owns the product |
| TUBITAK UZAY | research institute | National space-tech institute; though its products are satellites, which the separate satellite-scope question may exclude anyway |

The other fifteen are unaffected: a publication, a cluster, an NGO, an accelerator, a recruiter, an
acquisition vehicle, an association, a procurement platform, a product line and the composite
labels are not research organisations under any reading.

Reversing those four is one `publication_status` update against the rollback file already on
record. It should happen only if the policy is adopted, and it is not proposed here on its own.

---

## Totals

- Composite records reviewed: **19** (not 22 — three were removed yesterday).
- Genuine entity 1 · one organisation 8 · wrongly combined 8 · held for lack of evidence 2 (plus 1
  weak-evidence rename).
- Recommended: keep-and-rename 9 · unpublish-and-reassign 4 · merge 2 · split 1 · hold 3.
- Academia records inventoried: **43**. Retain 25, retype 5, out of scope 3, unverified 4,
  extraction error 1, false positive 1, and 4 sit in the published landscape.
- Database changes made: **none**.

## Decisions needed

1. **Adopt the Research & academia counting rule?** It needs no migration and is the cheap fix.
2. **ECA Group / Infotron → Exail**: approve the merge *and* the landscape-status move, or leave
   it. It cannot be half-done.
3. **The Hunter products**: assign to IAI as originator, or keep them attributed jointly?
4. **Satellites in the catalogue**: does the rule that unpublished PRISMA and COSMO-SkyMed also
   apply to TecSAR/Ofeq and TUBITAK UZAY's IMECE/GOKTURK?
5. **Reinstate the four academic records** removed yesterday, if the policy is adopted?
6. **Relevance test for academia** — keep Harvard and Yale School of Public Health, or require a
   product or an in-scope article?
