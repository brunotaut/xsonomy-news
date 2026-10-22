# Pre-import report — `uav360_europe_cuas_master_enriched_2026-10-22.xlsx`

2026-10-22. **Database not yet modified.** Inspection and matching only.

## The file

Six sheets. `Master Enriched` is the 2,277-row export produced from UAV360 on 2026-10-22 with
8 research columns added, so the core fields agree with the database by construction and cannot
conflict with it. The research is carried in `Research C-UAS relevance`, `Research confidence`,
`Suggested C-UAS capabilities`, `Research products`, `Research evidence URL`, `Research note`,
`Suggested maturity` and `Research action`.

| Sheet | Rows | What it is |
|---|---|---|
| Master Enriched | 2,277 | the full UAV360 export plus research columns |
| C-UAS Candidates | 174 | existing companies with a C-UAS signal |
| New Companies | 37 | companies the research says are absent |
| Import Queue | 27 | the proposed actions — 13 import, 14 classify |
| Summary | — | the researcher's own counts |
| Research Sources | 7 | directories and primary sources used |

### What the research proposes

| Research action | Rows | Confidence |
|---|---|---|
| No C-UAS action | 2,103 | — |
| Retain + validate leaves | 147 | Medium |
| Classify existing / evidence-link | 14 | **High** |
| Validate / classify | 13 | Medium |

Only **27 rows carry High confidence**, and those are exactly the Import Queue.

## 1. Existing companies matched

**14 of 14** "CLASSIFY EXISTING" rows resolve to real UAV360 companies, and every country agrees
with the database. Thirteen currently carry **no** C-UAS tag. The fourteenth, Advanced Protection
Systems, already holds the `Integrated C-UAS Systems` group tag, so the research adds leaves
beneath a tag that already exists rather than contradicting it.

## 2. New companies

**34 of the 37** are genuinely absent from UAV360, confirmed with the Session 2 matcher
(normalised name, alias, registrable domain, product name).

Of those 34: **12 are High confidence**, 21 are Medium / "Needs review", and 1 (PZL Defence) the
research itself marks **"Hold / future capability"**.

## 3. Potential duplicates — 3 found

The spreadsheet lists all 37 as "Missing from UAV360". Three are not.

| Sheet says | Actually in UAV360 as | Caught by | Sheet confidence |
|---|---|---|---|
| **Weibel Scientific** | **Weibel Radars** | **domain** — the sheet's own website is `weibelradars.com` | **High — queued for import** |
| OPTIX | Optix Co. | normalised name | Medium |
| Skylance | a product named `SkyLance` | product name | Medium |

Weibel is the one that matters: it is in the High-confidence import queue and would have created
a duplicate of an existing Danish C-UAS radar company. Its own evidence URL gives the website
that proves the match.

## 4. Ready for classification

**26**, after removing Weibel: 14 existing companies and 12 new imports. All have a named
capability, a named product or programme in most cases, and an evidence URL.

## 5. Requiring manual review

| Group | Count | Why |
|---|---|---|
| New companies marked "Needs review" | 21 | Medium confidence, mostly no website in the sheet |
| Potential duplicates | 3 | §3 |
| PZL Defence | 1 | research marks it future capability, not current |
| "Retain + validate leaves" | 147 | already tagged at group level; the research proposes no new leaves and offers no per-row evidence |

The 147 are the important number for later: they are the existing European C-UAS companies whose
**group** tags need resolving into the 13 leaves, and this research pass does not do that.

## 6. Conflicts between the research and UAV360

1. **Weibel** — the only hard conflict (§3).
2. **Evidence weight varies.** 21 of 27 queue rows cite a company or product page, 1 cites a
   government source (`gov.pl`, for PGZ's SAN programme), 4 cite specialist press (Unmanned
   Airspace ×2, Defence24, RFE/RL, Janes). **One cites a directory alone — `defencejobs.org`,
   and that one is Weibel.** No other queue row depends on a secondary directory.
3. **Suggested maturity runs ahead of its evidence in places.** `Kseonics Technology` is proposed
   as `Scaled` on a manufacturer's own claim of 2,500+ units sold; `DroneZone` as `Deployed` from
   a product page. Vendor self-description supports `Commercial`, not operational deployment.
   These will be set conservatively and the claim recorded in the rationale.
4. **No country conflicts** and no website conflicts for existing companies.
5. **`assigned_by = 'research'` is not a permitted value.** The column allows
   `editor | llm | import | seed`. These assignments arrive through a research file, so `import`
   is the closest existing value and the constraint stays as it is.

## 7. One architectural note

The instruction is not to make imported companies publicly visible unless the architecture
requires it. New rows will be written with `publication_status = 'draft'`, which is the column
default and the correct intent — **but the catalogue build currently ignores that field**
(`PUBLISH_STATUS = null` in `generate-supabase.mjs`, meaning all rows are published). Draft rows
will therefore still appear on xsonomy.com at the next build. Changing that is a publishing
decision and is out of scope here, so it is flagged rather than acted on.
