# Research & academia — the 11 membership corrections applied and verified

**Date:** 2026-10-30 · **Authorised by:** Nazar, for these exact 11 `company_type`
corrections and the subsequent rebuild and deployment.
**Pending SQL this closes:** `research-agent/reports/2026-10-30-research-academia-class.sql`
**Follows:** `research-agent/reports/2026-10-30-research-academia-class-adopted.md`
**Manifest / rollback:** `...-class-applied.csv` · `...-class-rollback.sql`
**Commits:** catalogue `f70f4c2` · news — this one. **Migration:**
`research_academia_class_membership_corrections`.

---

## The earlier refusal was not bypassed

The previous session's write attempts were refused, so the SQL was handed over for the
Supabase editor. In this session the permitted migration route was available and accepted
the **same guarded statement**, unchanged in scope: `company_type` and `updated_at` only,
on the eleven approved ids. Nothing was retried against a standing denial and no alternative
route was improvised around one.

## Pre-apply: zero drift

Each of the 11 was rechecked against its live record and compared with the value the
approved SQL was written from.

- All 11 present, all `publication_status = 'live'`, all still needing the change.
- **Drift: 0.** Every `before` value matched what the approved SQL expected — five
  `research_institute`, six `null`.
- All 11 proposed values satisfy the existing `companies_company_type_check`.
- No row was missing a slug, so no indexed URL was at risk.

## Dry run, then apply

The dry run computed the post-state without writing: **11 rows to update, 2,410 suppliers,
37 research organisations, landscape 567.** The apply produced exactly that.

| | Before | After | Change |
|---|---|---|---|
| `/companies/` suppliers | 2,411 | **2,410** | −1 |
| `/research/` organisations | 36 | **37** | +1 |
| Live companies | 2,447 | 2,447 | none |
| Live products | 3,521 | 3,521 | none |
| Landscape membership | 567 | **567** | none |
| Live companies without a slug | 0 | 0 | none |

The net −1/+1 is the arithmetic of the correction: five records left the class and six
joined it.

**A rerun of the statement now matches 0 rows.**

## What moved

**Out of `/research/` — five records that are not research organisations:**

| Record | Was | Now | Why |
|---|---|---|---|
| CASC / China Academy of Aerospace Aerodynamics (CAAA) | research_institute | `state_owned` | State aerospace institute that designs and sells UAVs |
| Chengdu Aircraft Design and Research Institute | research_institute | `division` | State design bureau inside AVIC |
| NPO Android Technology | research_institute | `sme` | Russian robotics manufacturer |
| **Roke Manor Research** | research_institute | `division` | Chemring-owned engineering firm; "Research" is its trading name |
| SGS-CSTC | research_institute | `jv` | An SGS joint venture selling certification services |

**Into `/research/` — six universities that carried no type at all**, so the class could
not see them: Central Michigan, Embry-Riddle, Peking, Hong Kong, Maryland, Pennsylvania.

## Verification on the deployed site

Rebuild deployed at `2026-10-30T22:54:38Z` and checked live:

- **Registry split: 2,410 suppliers + 37 research = 2,447.** No overlap between the two
  datasets, no academia row left in `companies.json`, and `research.json` contains only
  `research_institute` and `university`.
- **All eleven are in the right registry now** — the five companies in `companies.json`,
  the six universities in `research.json`. Before the fix it was the other way round for
  every one of them.
- **All eleven detail pages return 200 at the same URLs**, and each now shows the corrected
  type: State-owned, Division, SME, Division, Joint venture, and University ×6.
- **Products and links are intact.** The five product links on the retyped records are
  byte-identical to the pre-apply capture — CASC's CH-4 and CH-5, NPO Android's Marker and
  Kuryer, Roke's RESOLVE — and all five product pages return 200.
- **Landscape is 567 and Roke Manor Research is still in it**, now carrying
  `companyType: division`. Membership runs on reconciled merits, not entity type, so
  retyping moved which registry lists it and nothing else.
- `/research/` reads "37 organisations"; `/companies/` reads "Directory of 2410" and its
  lead names 37 research organisations.
- **Tests: 22/22.**

## Concurrent work preserved

The investor research imported earlier today is untouched and still live: 106 staging
records, and `/data/landscape-investors.json` serving 21 approved investors with 38
locations, with its pointer intact in `landscape.json`. `docs/STATUS.md` and `STATE.json`
were appended to, not rewritten.

## Not done, because it was not authorised

No publication change, no reinstatement of the four academic records removed on 2026-10-30,
no composite merge, no ownership change, no deletion. **Pixhawk** remains live and listed
under `/research/` — it is an open autopilot hardware standard rather than an organisation,
and removing it is a publication change. CyArk, WeRobotics and LMI likewise stay as they
are. These remain the open decisions recorded in the adoption report.

## Totals

- Rows updated: **11** · skipped: **0** · drift found: **0** · rerun effect: **0**.
- Columns written: `company_type`, `updated_at`. Nothing else.
- Pages lost: **0** · URLs changed: **0** · product links changed: **0**.
