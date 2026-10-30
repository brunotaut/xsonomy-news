# Research & academia — class created

**Date:** 2026-10-30 · **Decision:** Nazar approved the counting rule proposed in
`2026-10-30-composite-and-academia-review.md` (decision 1).
**Scope:** the class only. No publication change, no merge, no deletion, no composite-name fix.

---

## What the class is

`company_type IN ('research_institute', 'university')`.

The `companies_company_type_check` constraint already permitted both values and 36 live records
already used them, so **the database needed no schema change at all.** What was missing was that
the site still counted and presented these organisations as companies. The class is therefore a
build-time split, defined once in `scripts/generate-supabase.mjs`:

```js
const RESEARCH_TYPES = new Set(["research_institute", "university"]);
const isResearchOrg = (c) => RESEARCH_TYPES.has(c.company_type);
```

## What changed on the site

| Before | After |
|---|---|
| `/companies/` listed and counted 2,447 rows | lists and counts **2,411 suppliers** |
| academia folded into the company count | **36 organisations** counted at the new `/research/` |
| no separate view | `/research/` — same registry UI, filters, table and search |
| — | both pages cross-link; a "Research" tab sits in every header |

Nothing was removed. Research and academic organisations keep:

- their `/companies/<slug>/` detail pages, at the same indexed URLs,
- their products and the product links on those pages,
- their landscape membership — Delft (MAVLab), Fraunhofer IDMT, NPTs 'Virazh' and Roke Manor
  Research stay in the published landscape, which is still **567**. Landscape membership runs on
  reconciled merits, not on entity type, and that rule is untouched.

`/research/` is in the sitemap, and its list is in the static HTML, so the 36 pages lose no
crawl path.

### Implementation note

`companiesShell` and `cuasShell` were near-identical copies; a third copy for `/research/` would
have made three. They were factored into one `registryShell()`. The refactor was verified by
generating `/companies/` and `/cuas-systems/` before and after against a fake PostgREST server and
diffing: the only change to `/cuas-systems/` is the new nav link.

A regression test, `scripts/test/research-registry.test.mjs`, asserts the guarantee that matters —
the two datasets partition the companies, academia is absent from the company count and the
supplier list, and its pages, products and landscape places survive. Suite: **18/18 pass**.

## Membership corrections — NOT YET APPLIED

The class is only as good as the `company_type` values behind it, and eleven are wrong. The SQL is
written, guarded and idempotent in `2026-10-30-research-academia-class.sql`, with its rollback, but
**it has not run**: both database-write tools were refused in this session. It needs running in the
Supabase SQL editor, which is the route CLAUDE.md names anyway.

**Five records are mistyped as research and are not research organisations:**

| Record | Current | Proposed | Why |
|---|---|---|---|
| CASC / China Academy of Aerospace Aerodynamics (CAAA) | research_institute | `state_owned` | State aerospace institute that designs and sells UAVs |
| Chengdu Aircraft Design and Research Institute | research_institute | `division` | State design bureau inside AVIC |
| NPO Android Technology | research_institute | `sme` | Russian robotics manufacturer |
| **Roke Manor Research** | research_institute | `division` | Commercial engineering firm owned by Chemring; "Research" is its trading name. **In the published landscape** — retyping does not move it, membership is reconciled separately |
| SGS-CSTC | research_institute | `jv` | An SGS joint venture selling certification services |

**Six universities carry no `company_type` at all**, so the class cannot see them: Central
Michigan, Embry-Riddle, Peking, Hong Kong, Maryland, Pennsylvania.

> Correction to the earlier report, which said seven. There are six. The seventh it counted, Yale
> School of Public Health, is already typed `university`.

After the SQL: **2,410 companies · 37 research & academic organisations.**

The site does not depend on this running — it is already correct for whatever the types say. Until
it runs, the five mistyped records sit under `/research/` and the six universities under
`/companies/`.

## Still open — deliberately untouched

These are publication decisions under CLAUDE.md rule 4, and the class does not settle them:

1. **Pixhawk** (`849037d4-bb73-4bce-acc6-9a80a862861a`) is an open autopilot hardware standard, not
   an organisation — an entity-extraction error of exactly the kind removed on 2026-10-30, missed
   then because it is typed `research_institute`. It is now listed under `/research/`. Unpublishing
   it is a publication change and was not made.
2. **CyArk, WeRobotics, LMI** — heritage digitisation, a humanitarian non-profit and a US
   government-advisory non-profit. Not UAV organisations and not research institutes; out of scope
   or a retype, not decided here.
3. **The four records unpublished on 2026-10-30 that this policy would retain** — Rzeszów
   University of Technology, University of Porto, Laser Zentrum Hannover, TUBITAK UZAY. One update
   against the rollback file already on record. Not made: reinstatement is a publication change.
4. **A relevance test for academia** — Harvard and Yale School of Public Health are now harmless to
   the company count, which is not the same as useful in a UAV catalogue.
5. **Four records whose typing is unverified** — Sensorama Lab, Sentinel Research and Development,
   TulaDrone, Veter. All four have no products and no country; they sit under `/research/` on a
   type nobody has checked.

Decisions 2–6 from the review report are untouched, including the ECA Group / Infotron merge.

## Totals

- Class defined: **1**, no migration, no schema change.
- Site: `/companies/` **2,447 → 2,411**; `/research/` created with **36**; landscape **567**,
  unchanged.
- Pages lost: **0**. URLs changed: **0**.
- Database rows changed: **0** (11 written and pending in the SQL file).
- Tests: **18/18**.
