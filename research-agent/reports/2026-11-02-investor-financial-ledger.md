# Investor financial-coverage ledger — 2 November 2026

Supersedes `2026-11-01-investor-financial-ledger.md`. All **118** approved directory
records appear exactly once. Generated from the database, not maintained by hand: the
queue now lives in the `investor_financial_research_log` table, so these counts are
measurable rather than asserted.

| State | Records | Meaning |
|---|---:|---|
| **Found** | **55** | At least one typed, sourced, current observation is stored |
| **Researched, nothing usable** | **23** | Sources were opened and read; no figure could be stored honestly |
| **Never researched** | **40** | No row in the research log. **Not** the same as "nothing to find" |
| | **118** | |

Baseline on 1 November: 23 found, 19 researched-nothing, 76 never researched.
**32 records gained figures and 36 of the 76 were worked through.**

Ukraine-linked coverage: **23 of 26** carry figures, against 13 of 26 before. The three
without are **Defender Ventures** (no fund of that name exists in any reviewed source),
**R-G.AI** (not a fund — a US defence technology company) and **Varangians** (its only
source returns 404, and the firm is described as an investment company rather than a fund).

An investor with **no row** in `investor_financial_research_log` and **no** current metric
is one of the 40. That is the precise definition of the remaining queue.

---

## Found (55)

Figure counts in brackets.

201 Ventures (1) · **Angel One** [UA] (3) · Atlantic Bridge (1) · Baillie Gifford (1) ·
Balnord (2) · Bpifrance (3) · Brave1 [UA] (2) · BSV Ventures (1) · Coinvest Capital [UA] (1) ·
D3 [UA] (3) · Darkstar [UA] (3) · **Defence Builder** [UA] (3) · Depo Ventures (2) ·
**Double Tap Investments** [UA] (2) · DTCP (3) · EIF / Defence Equity Facility (2) ·
Expeditions [UA] (2) · Final Frontier (2) · Flyer One Ventures [UA] (3) ·
Freedom Fund VC [UA] (1) · Front Ventures (1) · Green Flag Ventures [UA] (1) ·
Gungnir Capital (1) · Helantic (1) · HTGF (2) · Hyperion (2) · **In-Q-Tel** [UA] (2) ·
Investinor (2) · Iron Wolf Capital (2) · Join Capital (2) · Keen Venture Partners [UA] (2) ·
Lakestar (2) · **Lux Capital** [UA] (2) · MITS Capital / Lightning Fund [UA] (4) ·
NATO Innovation Fund [UA] (2) · Nazca Capital (1) · **Network VC** [UA] (1) ·
Osney Capital (1) · OTB Ventures (4) · PSV Hafnium (2) · Purple Ventures (1) ·
**Radius Capital** [UA] (1) · Seraphim Space (1) · Shield Capital [UA] (3) ·
Sienna Investment Managers (2) · SmartCap (2) · Speedinvest (2) · Sunfish Partners (1) ·
Tesi (1) · Twin Track Ventures (1) · TYR.vc (2) · UA1 VC [UA] (1) ·
**Ukraine Phoenix Tech Fund** [UA] (1) · Vsquared Ventures [UA] (2) · ZAS Ventures [UA] (1)

**Bold** = one of the ten priority Ukraine-linked records. All ten were researched; eight
produced figures and two produced findings instead (below).

## Researched, nothing usable (23)

| Investor | Why nothing was stored |
|---|---|
| Accel | A $20bn AUM figure exists only in an encyclopaedia ranking table; the PitchBook AUM field is blank. A ranking table is not an acceptable source. **Form ADV is the lead** |
| Airbus Ventures / AV | Portfolio page read; no fund size or AUM stated *(backfilled from the 1 Nov pass)* |
| Amadeus Capital Partners | PitchBook profile's AUM field is blank; no firm disclosure found |
| Baryon Fund | No size, AUM, ticket or count published. Its portfolio names Airvolute and Airlogix — relationship information, not a figure |
| Change Ventures | Portfolio page carries no fund figure *(backfilled)* |
| **Defender Ventures** [UA] | **No fund of this name in any reviewed source**, including a specialist survey of active Ukrainian defence-tech investors. A record-identity question |
| EIFO | Nothing for EIFO itself. Three figures rejected: a DKK39bn "new activity in 2030" target, a DKK3bn defence ambition found only in a personal LinkedIn post, and a DKK1bn **guarantee** budget. Its DKK500m commitment to DTCP Defence Fund I was stored as a **fund position** |
| General Catalyst | $43bn appears only in a ranking table |
| Greenoaks | No figure anywhere, not even a ranking entry |
| Invest-NL | A ~€3bn **institutional budget** (own annual report) — neither fund size, nor LP committed capital, nor AUM. Also only *exploring* a defence role, so no defence scope exists |
| IQ Capital | Appears only as a co-investor in others' deals |
| Lifeline Ventures | Site carries no fund size or AUM *(backfilled)* |
| Lightspeed | $40bn appears only in a ranking table |
| Marathon Venture Capital | EIF case study names the intermediary fund but no size *(backfilled)* |
| MD One Ventures | Only a selected-portfolio list of five, which is not an investment count |
| Neo Ventures / Neo Autonomy | Investments page names five funds and no sizes *(backfilled)* |
| **R-G.AI** [UA] | **Not a fund.** Coverage consistently calls it a US defence *technology company*, while naming it lead investor in Swarmer's 2024 seed. Relationship recorded; entity type needs review |
| Redalpine | Newsletter names the Summit Fund without a size *(backfilled)* |
| Scale Capital | A 2022 Fund III first close of €27m and a €100m hard cap are reported, but no final close and trackers conflict. **The 2022 first close is the lead** *(backfilled)* |
| ScaleWolf | Only €13.5m for Lithuania's **MILInvest state programme** — a programme, not this manager's fund |
| Sisyphus Ventures | No size, AUM, ticket or count in the source that lists its portfolio |
| Varangians [UA] | Sole source for the €9.1m close returns **404**; reachable coverage supports only a *plan* to invest €10m and calls the firm an investment company, not a fund |
| Verve Ventures | Own portfolio page returns no entries. Re-checked this pass against ANYbotics' own funding history, where Verve appears in none of four named rounds |

## Never researched (40)

These have **no** row in the research log. Nothing about them is claimed.

Adara Ventures · Alpine Space Ventures · Archangel · BADideas.fund · Day One Capital ·
Defence Invest · DOVOS · Expansion VC · Faber · GapMinder ·
HBOR defence and security lending · iG TECH Capital · IVC / Ilavska Vuillermoz Capital ·
Karista · Kaya VC · Kibo Ventures · LitBAN · METU70 / ODTU70 · N1 · NewSpace Capital ·
NSSIF · Omnes · Plural · Polarion · Prima Materia · Primo Capital · Project A ·
Radix Ventures · Rockaway Alpha Defense · Rockaway Ventures · Saab ·
Safran Corporate Ventures · SecFund / BOM · Seven Capital · SFPIM Defence ·
SNCI / National Defence Fund · Tech Horizons · Tensor Ventures · Tikehau Capital ·
Weinberg Capital Partners

**Leads already visible for a next pass:** Plural and Prima Materia both appear as fund
targets in SmartCap's existing fund positions (Plural Fund II, €10m committed), and the
national investors (NSSIF, SNCI, SFPIM, HBOR, SecFund/BOM, Defence Invest) publish annual
reports that were not opened in this pass. Saab and Safran Corporate Ventures are corporate
venture arms of listed parents, where the parent's accounts are the place to look.

## Figures found and deliberately not stored

Each would have required a type that does not exist, or would have misrepresented what the
source says.

| Investor | Figure | Why not stored |
|---|---|---|
| Front Ventures | €5m rights issue, May 2026, 278% oversubscribed | A **listed investment company's share capital** is neither a fund close nor LP committed capital. **The clearest case for a future `share_capital_raised` type** |
| Invest-NL | ~€3bn budget, plus €900m added capacity | An institution's budget is not a fund, a commitment or AUM |
| EIFO | DKK39bn new-activity target; DKK1bn guarantee budget | An activity goal and a guarantee scheme, not investment capital |
| Tesi | €425m of 2025 investments and commitments | A single-year flow, not an amount under management |
| Speedinvest | "exceeds €1bn AUM" | **No as-of date could be established** |
| HTGF | €7.1bn cumulative follow-on across Funds I–IV | Capital raised by **portfolio companies**, not this manager |
| Radius Capital | $55.5m across 8 projects | **Those projects' combined funding**, not Radius's deployed capital |
| ScaleWolf | €13.5m MILInvest | A **state programme**, not this manager's fund |
| Defence Builder | "$55m+ across 120+ startups" | The **team's prior track record**, on the fund's own page |
| Angel One | "$300 mln" upper ticket | A plain typographical error for $300K in the source |
| In-Q-Tel | $500K–$3m ticket; 12–60 deals a year | Ticket traces to no official disclosure; the deal counts are irreconcilable across sources |
| Ukraine Phoenix Tech Fund | €32.5m of anchor LP figures | A board-approved **potential** commitment, a confirmed **willingness**, a **proposed** commitment and only €2.5m actually committed. Not committed capital |

## Rollback

| Change | Reversal |
|---|---|
| `investor_metric_types_vehicle_nav_grants_average` | Restore the previous `metric_type` and `shape` CHECKs and drop `investor_financial_metrics_vehicle_nav_needs_vehicle`. **Retype the five corrected rows first**, or the old CHECK will reject them |
| The five metric retypings | `update investor_financial_metrics set metric_type='manager_aum' where id='73fc025e-739c-4472-b015-790075232879'` and the same shape for `0f58d997…`→`initial_investment_range`, `e505f068…`→`cumulative_capital_invested`, `59ebaf8f…`→`investment_count`, `fb2f357e…`→`fund_size_target` |
| `investor_companies_retired_kind` | `alter table investor_companies drop constraint investor_companies_retired_kind_with_retirement, drop constraint investor_companies_retired_kind_check, drop column retired_kind` |
| `investor_financial_research_log` | `drop table public.investor_financial_research_log` |
| New relationships (26) | `delete from investor_companies where reviewed_at = '2026-11-01' and created_at::date = '2026-11-01'` — scope to the specific investor names if any other pass writes the same day |
| New companies (8) | `delete from companies where slug in ('sky-hunter','scandinavian-x','abx-dynamics','vrgineers','eu-motors','vermeer','teltronic','exotrail')`. Aliases cascade; none carries a sector or landscape row |
| Resolved unresolved rows (6) | Re-insert from the superseded 1 November report, which records each original reason verbatim |
| New metrics (51) | `delete from investor_financial_metrics where checked_at = '2026-11-01' and created_at::date = '2026-11-01'` |
| New fund positions (4) | `delete from investor_fund_positions where reviewed_at = '2026-11-01'` |
| New vehicles (17) | `delete from investor_research_vehicles where created_at::date = '2026-11-01'` — metrics reference them, so retype or delete those first |
| MITS bridge row | `update investor_research set matched_investor_id = null where id = '51ea94a6-1aee-4f49-9255-11fb92d0055f'` |
