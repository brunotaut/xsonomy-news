# European UAV & C-UAS Landscape — pre-change audit

2026-10-23. Workbook: `uav360_europe_uav_cuas_verification_complete_2026-10-23.xlsx`.
**No database changes made.** Inspection only, as instructed.

## The seven numbers

| # | | |
|---|---|---|
| 1 | Total companies | **2,312** |
| 2 | In the 32-country European scope | **809** |
| 3 | Classified C-UAS, in scope | **174** (145 with an evidence-backed leaf) |
| 4 | Identifiable as UAV companies, in scope | **135** |
| 5 | Workbook candidates already in the DB | **18** |
| 6 | Genuinely new | **139** |
| 7 | Ambiguous / needs review | **1 + 4** (see below) |

**521 of the 809 in-scope companies carry no UAV and no C-UAS signal at all.** That, not the
139 new names, is the larger part of the expansion job.

## The workbook

Nine sheets. `Final Verification` is the operative one: 158 candidates, each with a decision.

| Decision | Rows | Confidence |
|---|---|---|
| INCLUDE | 47 | High — official / government / authoritative |
| INCLUDE — DIRECTORY BACKED | 107 | Medium — specialist directory |
| ENTITY REVIEW | 4 | — |

**Two things to weigh before importing.**

**107 of 154 includes rest on a directory, not a primary source.** The workbook says so itself
("Do not auto-import directory hits"). At our current evidence bar that is a *candidate* list,
not an import list.

**82 of the 158 — 52% — are Ukrainian, all from one source** (Ukrainian Drone Ecosystem
Directory). A further 54 come from DefenceJobs. So two directories produce 86% of the discovery.
Importing as-is would tilt the Landscape heavily toward Ukraine, which is a fact about the
sources used rather than about the European market.

Layer assignment is also thin: **104 of 158 carry the generic layer "UAV / C-UAS / ecosystem"**,
which does not say what the company does.

## Matching against the live database

Matched on normalised name, alias and product name (the Session 2 rules).

| | Count |
|---|---|
| Already in UAV360 by name | 17 |
| Already in UAV360, missed by exact match | **1** |
| Ambiguous — matches a product, not a company | 1 |
| Genuinely new | **139** |

**The one the matcher missed: `Turkish Aerospace Industries`.** UAV360 holds it as
**`Turkish Aerospace (TAI)`**. The normaliser strips a trailing parenthetical and a trailing
legal suffix, but "Industries" is neither, so the keys differ. Importing the workbook as it
stands would have created a duplicate of one of Europe's largest aerospace companies.

**Ambiguous:** `Odin` matches an existing *product* named ODIN. The sheet's "Odin" may be its
maker, a different firm, or the same thing recorded twice.

**The workbook's own four entity reviews:** SubSea Craft, Robot Aviation, Bavovna,
Sky-Hero by Axon. SubSea Craft is already in the DB.

## Conflict: the workbook's "C-UAS" count disagrees with ours

`European Master` labels **464** of its 794 rows as Landscape layer "C-UAS". The database has
**174** in-scope companies with any C-UAS tag, and 145 with an evidence-backed capability.

The workbook's layer appears to be inferred from having any sensor or defence signal. Ours
requires evidence tying the company to counter-UAS. **The workbook's layer column should not be
imported as classification** — it is a different and much looser question than the one
`company_sectors` answers.

Its `Audit classification` column is more consistent with our data: **396 of 794 are
"No explicit UAV/C-UAS signal — review"**, close to our own 521 with no signal.

## Taxonomy — most of what the expansion needs already exists

`sectors` holds 37 rows: 13 C-UAS capability leaves (in use) and 24 others, **nearly all unused**.

| Kind | Slug | Companies |
|---|---|---|
| domain | `uav` | 192 |
| domain | `sensors` | 196 |
| domain | `counter-uas`, `effectors`, `c2-software` | 11, 6, 3 |
| domain | `electronic-warfare`, `isr`, `space-satcom` | **0** |
| platform | `fixed-wing-uav`, `multirotor-uav`, `vtol-uav`, `loitering-munition` | **0 each** |
| capability | `radar`, `rf-detection`, `eo-ir`, `acoustic`, `lidar`, `hyperspectral`, `passive-radar` | **0 each** |

So a UAV platform vocabulary **already exists and is empty**. The expansion is largely a
question of filling `uav`-side sectors, not inventing them — and the structure already supports
a company holding both UAV and C-UAS assignments, so "UAV + C-UAS" needs no new category.

Gaps against the requested ecosystem list: there is no sector for propulsion, datalink/comms,
navigation/GNSS, UTM, docking/launch-recovery, or ground control. Those are genuinely new terms.

## Current scope and publication logic

- Scope: `countries.is_landscape_scope` — 32 countries, EU-27 plus UK, Norway, Switzerland,
  Ukraine, Türkiye. Israel seeded but out of scope. **Unchanged, as instructed.**
- `landscape_candidates` holds 807 rows under `europe-cuas-2026`. The slug is C-UAS-specific; a
  broader landscape wants its own edition slug rather than redefining this one.
- Publication: `PUBLISH_STATUS = "live"` since 2026-10-22, and the build throws if an
  unpublished row reaches it. 14 draft companies are correctly withheld — verified live.

## What I recommend before any import

1. **Do not import the 107 directory-backed rows on directory evidence alone.** They are a
   candidate set. Load them into `landscape_candidates` with reason `external_research` and
   leave them unclassified, which is what that table is for.
2. **Import the 47 high-confidence rows**, after re-running the match with a looser name rule —
   the TAI case shows the exact matcher is not sufficient on its own for this list.
3. **Resolve the 5 ambiguous cases by hand** (Odin plus the workbook's four).
4. **Treat the 521 unsignalled in-scope companies as the main work**, not the 139 new names.

## One thing I could not read

The instruction ends mid-sentence: *"Do NOT classify generic aerospace, electronics, AI, software
or defence companies as UAV ecosystem companies unless there"*. The rule's condition is missing,
and it is the rule that decides what qualifies as an ecosystem company — the single most
consequential judgement in this expansion. I have not guessed at it.
