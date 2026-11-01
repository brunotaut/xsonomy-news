# Investor portfolio reconciliation, financial metrics and supplement retirement

**Date:** 2026-11-01 · **Status:** applied, deployed and verified live
**Reproduce / rollback:** `research-agent/imports/README-investor-portfolio.md`
**Commits:** catalogue `6b2db2d`, `01a5dee`

---

## 1. Portfolio reconciliation

All 87 relationships in `docs/investor-portfolio-reconciliation.json` were processed. **The
file recorded a match *status* for 43 of them but never resolved the ids** — every
`companyId` in it is `null` — so resolution was done here from scratch against name, alias
and legal name, across **all** companies including drafts.

| | |
|---|---:|
| Edges processed | **87** |
| **Existing companies matched** | **45** edges → 29 existing companies |
| ‣ by exact name | 43 |
| ‣ by alias, added here | 2 |
| ‣ of which to an **unpublished** company | 1 |
| **New companies created** | **16** |
| ‣ published | **8** |
| ‣ created as draft, outside catalogue scope | **8** |
| Relationships now stored | **61** |
| Unresolved, with a recorded reason | **26** edges / 21 names |
| Duplicate companies created | **0** |
| Unsupported landscape admissions | **0** |

61 + 26 = 87. Every edge is accounted for.

### The 38 "unresolved" names were not 38 missing companies

That was the instruction's warning, and it held for three of them:

- **Delian Alliance Industries** was already in the catalogue — as a **draft**. The previous
  matcher filtered to `publication_status === 'live'`, which is exactly why it looked absent.
  Its existing id is reused and the relationship stored with `match_method='draft_company'`.
- **Unmanned Defense Systems** / **Unmanned Defence Systems** — the investor publishes the
  American spelling, the company uses the British one. Resolved by alias, not by a second
  company.
- **Milvus** / **Milvus Advanced** — MD One publishes the short form. Resolved by alias. Also
  distinguished in the record from the similarly named robotics companies.

### Companies created

Published, because they belong in a UAV and counter-UAS directory:

| Company | What it is | Verified from |
|---|---|---|
| Unmanned Defence Systems | Vilnius; swarm UAVs, Partisan recce drone, loitering munitions, FPV | Coinvest Capital announcement |
| Airvolute | Trnava; DroneCore open-architecture autopilots on NVIDIA Jetson, fixed-wing and VTOL | airvolute.com, UST profile |
| Turgis & Gaillard | France; civil/military aeronautics and MRO, developer of the Aarok MALE UAV | Sienna IM announcement |
| Claymore Industries | Scotland; hard-kill counter-drone, DroneBuster | Green Flag portfolio |
| Kara Dag Technologies | C-UAS detection, tracking, jamming; Obriy detectors | Green Flag portfolio |
| Teletactica | Encrypted jam-resistant radios for drones, UGVs, VTOLs | Green Flag portfolio |
| BaBayte | Onboard AI for drone survivability in contested airspace | Green Flag portfolio |
| Hive Robotics | C2 and connectivity for GPS-denied environments | D3 portfolio |

Created as **draft**, deliberately: `/companies/` describes itself as a *"Directory of UAV
and counter-UAS companies"*, so publishing a therapeutics or nanomaterials company there
would make that description false. The relationship is stored and the holding is shown; only
the profile is unpublished. **GutSee Health** (phage therapy), **Fernride** (ground logistics
autonomy, reported acquired by Quantum Systems), **HyImpulse** (rocket launch), **LiveEO**
(satellite analytics), **Valarian** (zero-trust security), **Milvus Advanced**
(nanomaterials), **Spherea** (aerospace test systems), **Tiberius Aerospace** (ramjet
munitions).

### Landscape eligibility was not touched

**None of the 16 has a `company_sectors` row or a `landscape_candidates` row.** The landscape
build skips any company without an explicit taxonomy assignment, so a company created from a
portfolio listing *cannot* enter it. Verified: landscape **567** before and after.

### Matching is curated where automation was wrong

A substring pass was run and discarded. It matched **Systematic Paris Region** (a French
cluster) to **Systematic A/S** (a Danish software company) and **INTA** to the startup
**iNTACT**. Resolution therefore uses exact normalised name, alias and legal name only.

### Unresolved, by reason

21 names across 26 edges, each with its reason stored:

- **Airvolve** — two investors list it; nothing verifies it, and the Coinvest announcement
  cited as its source **does not mention it at all**. It may be a variant of Airvolute
  (Slovakia), which is a separate verified company, but treating them as one would be a guess.
- **Wayren**, **Vermeer** — sourced only from the Czech government defence investors
  directory, which was unreachable (connection refused) during this pass.
- **URC** — the catalogue holds *URC Systems* (Czech Republic, published) as a candidate, but
  the same directory was unreachable, so the identity is unconfirmed and no relationship is
  asserted. The candidate id is recorded for the next pass.
- 17 further names not verified in this pass, held with their source.

## 2. Relationships: what is stored and what is refused

`investor_companies` holds investor research id, catalogue investor id where one exists,
company id, fund vehicle id, relationship type, evidence status, source URL, review date,
investment date, round, role, and **two separate nullable amount pairs**.

Three relationships carry disclosed amounts:

| Investor → company | Contribution | Round total |
|---|---|---|
| Coinvest Capital → Unmanned Defence Systems | **€0.9M** (its own fund share) | **€3.2M** |
| Sienna IM → Turgis & Gaillard | €7M | *not disclosed* |
| Sienna IM → Spherea | €11.8M | *not disclosed* |

The Coinvest case is the one the separate fields exist for: the announcement states a €3.2M
round and the fund's own €0.9M share. A database CHECK enforces that a contribution cannot
exceed its round, and nothing ever copies one into the other.

**EIFO → Six Robotics is stored as `fund_of_funds`**, not a direct investment: the cited
source describes EIFO investing in the **D3 fund**, not in that company. Two further edges
(PSV Hafnium → Acodyne, Tesi → Kelluu) are sourced from *another investor's* portfolio page
and carry a note that co-investor attribution needs a primary source.

## 3. Financial metrics

The 14 source-confirmed observations for 7 investors were imported onto a **twelve-type**
vocabulary, because the distinctions are what a single "fund size" field destroys.

| Investor | Metrics |
|---|---|
| Vsquared Ventures | `fund_close_final` €214M (Fund II) · `manager_aum` €450M, bound **approximate** |
| Dark Star | `fund_size_stated` €25M (Fund I, closing status unstated) · `initial_investment_range` €0.5–1.5M · `investment_count` **9** |
| Keen Venture Partners | `fund_close_first` €150M, bound **minimum** · `initial_investment_range` €1–10M |
| NATO Innovation Fund | `manager_aum` €1B · `initial_investment_range` €3–15M |
| D3 | `initial_investment_range` $0.5–1.5M |
| Expeditions | `fund_close_announced` €197M (Fund II) |
| Flyer One Ventures | `fund_size_target` €50M (Fund V launch size) · `cumulative_capital_invested` $46M · `portfolio_company_count` **97** |

By type: fund closes 3 · fund sizes (target/stated) 2 · manager AUM 2 · cumulative capital
invested 1 · initial investment ranges 4 · investment count 1 · portfolio company count 1.

The two that matter most:

- **Flyer One's €50M is a launch size** — a target, not money raised — so it is
  `fund_size_target`, never a close.
- **Dark Star's "9" counts investments; Flyer One's "97 companies" counts distinct portfolio
  companies.** Different types. A CHECK forbids a count row from carrying money fields and a
  money row from carrying a count.

Each row has currency, scope verbatim from the source, fund vehicle where named (5 vehicles
created), as-of date — with `as_of_text` for sources that date a figure only to a year, so
"2025" is never invented into 2025-01-01 — source URL, verification status, checked-at date
and `is_current`, so a newer figure becomes a new row rather than overwriting the old one.
**Nothing was copied from the workbook as a verified fact**; the 12 workbook records carry no
financial figures at all.

## 4. Export and interface

**`https://xsonomy.com/data/landscape-investors.json`**, pointer at `landscape.json →
investors` carrying count, locations, `ukraineRelated`, `portfolioRelationships` and
`withFinancialMetrics`.

Each portfolio entry carries `companyId` always and `url` only when the company is published,
plus `published`, `relationshipType`, `evidenceStatus`, `source`, `reviewedAt`, `role`,
`investorContribution`, `roundTotal`, `matchMethod`, `matchNote` and `nameAsPublished` — the
investor's own spelling, kept beside the resolved company name. `portfolioUnresolved` lists
the rest with reasons. Eleven caveats, four of them new: portfolio is not eligibility,
amounts are separate, metric types are distinct, unresolved holdings are not matched to near
names.

Interface: the directory cards show fund size, ticket range, invested capital and the linked
company count; profiles show every metric with its scope, vehicle, date and source, and
portfolio cards that link published companies, label the relationship and evidence, and print
contribution and round total separately as "not disclosed" when unknown.

**The supplement is deleted.** `scripts/lib/investor-directory.json` and
`investor-profiles.mjs` are gone, after parity was proved: 118 records in and out, no slug
lost or gained, Ukraine count unchanged at 26, **zero** populated fields emptied once
case-insensitive holding names and relationship sources were accounted for, and both
`portfolioSource` URLs still present. The old export carried 78 portfolio entries; the new one
represents 87.

The projection was broadened from the 21 `deal`/`mandate` records with a city location to all
118, each keeping its own evidence label (16 watchlist, 3 programmes). **94 records have no
city at all** — placed only by country association — which is why a JSON file had to exist
beside the database. The companies publication gate was not touched.

## 5. Validation

| Check | Result |
|---|---|
| Edges accounted for | 61 + 26 = **87** |
| Duplicate companies created | **0** (0 duplicate normalised names across 2,455 live companies) |
| **Ambiguity** — second "Helsing" inserted, loader re-run | **0** links to it; all 7 affected investors recorded unresolved with the ambiguity reason; the 7 pre-existing Helsing relationships kept. Rolled back. |
| **Unpublished-company link** | Marathon VC → Delian: stored, `url` null, `published` false, method `draft_company` |
| **Metric distinctions** | 12 types; counts carry no money fields; `minimum`/`approximate` bounds preserved |
| **Idempotency** | loader returns **0** on replay, twice, with all three verified upgrades intact |
| Import cannot downgrade a verified relationship | enforced: the loader skips a `portfolio_listed` write where a precise type exists, and refreshes only `match_method` on conflict |
| Tests | **41/41** |
| Landscape | **567**, unchanged |
| Live journeys | Coinvest → UDS with both amounts; Marathon → Delian unlinked; Green Flag → 9 holdings; Sienna → T&G €7M; 8 new company pages 200, draft 404 |

### One mistake worth recording

The ambiguity test inserted a probe company into the production database. It was rolled back,
but the scheduled deploy built while it was in place, so the live export briefly carried 7
spurious "Helsing" unresolved entries. The database was already clean; commit `01a5dee`
forced a rebuild and the live export now shows 26. The test should have run against a branch
database, or at least not while a deploy was pending.

## 6. Remaining blockers

1. **17 portfolio names still unverified**, plus Airvolve, Wayren, Vermeer and URC for the
   specific reasons above. The Czech government directory needs re-fetching when it is back.
2. **URC → URC Systems** needs a human decision; the candidate id is already recorded.
3. **Round totals are absent for 58 of 61 relationships** because the sources do not disclose
   them. That is the correct state, not a gap to fill by arithmetic.
4. **Fernride is reported acquired by Quantum Systems**, which is in the catalogue. That is an
   ownership relationship worth recording separately; not done here.
5. **Tiberius Aerospace and Spherea** are defence-adjacent drafts whose catalogue scope is a
   judgement call worth revisiting.
6. The `investors` table (200 rows) is still separate from `investor_research` (118). Only 8
   relationships carry a link to a catalogue investor row; the two identity sets have never
   been reconciled.
