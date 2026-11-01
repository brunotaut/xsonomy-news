# Investor data model corrected, coverage widened — applied and deployed

**Date:** 2026-11-01 · **Status:** APPLIED AND DEPLOYED · **Next actor:** ChatGPT

Seven authorised parts: correct the financial metric semantics, complete financial
research, add the known missing portfolio relationships, revisit the unresolved holdings,
expose the data properly on the public cards, validate and deploy, and report.

Companion: [per-investor ledger](2026-11-02-investor-financial-ledger.md) ·
supersedes the [1 November ledger](2026-11-01-investor-financial-ledger.md)

---

## 1. Before and after, reconciled against the exported data

Every "after" figure below was read back from `/data/landscape-investors.json` after the
deploy, not from the database alone.

| | Before | After |
|---|---:|---:|
| Investor records | 118 | **118** — none added, none merged, none lost |
| …Ukraine-linked | 26 | **26** |
| **Investors carrying financial figures** | 23 | **55** |
| …of the 26 Ukraine-linked | 13 | **23** |
| Financial observations | 49 | **100** |
| Named fund vehicles | 19 | **36** |
| Company relationships (rows) | 74 | **100** |
| …**unique companies** behind them | 61 | **70** |
| Relationships linking a published profile | 58 | **82** |
| Unresolved holdings | 13 | **7** |
| Fund positions | 9 | **13** |
| Retired relationships (never exported) | 2 | **3** |
| Live catalogue companies | 2,457 | **2,464** |
| Tests | 59 | **72** |

**Relationship rows are not unique companies.** 100 rows cover 70 distinct companies: an
investor–company pair is one row, and several investors hold the same company. The 82
"links to a published profile" counts rows whose company is live with a slug, so it too
exceeds the company count.

## 2. Financial metric semantics (part 1)

A note never reaches a label, a card slot or a filter — only the type does. Four figures
had explanatory prose and the wrong type, and all four are corrected.

| Investor | Was | Now | Why |
|---|---|---|---|
| **Seraphim Space** | `manager_aum` £421.3M | **`vehicle_nav`** + an explicit vehicle, *Seraphim Space Investment Trust plc* | It is the net asset value of **one listed trust**, not the firm's total assets. A NAV also moves with valuations, which an AUM figure does not imply. |
| **DTCP** | `initial_investment_range` €20M–€20M | **`average_investment_size`**, €20M, no upper bound | A stated **average** cheque, which had been stored as a published range with min = max. |
| **Brave1** | `cumulative_capital_invested` ₴6.2B | **`grant_funding_disbursed`** | Grant disbursements by a state programme, not equity deployed. |
| **Brave1** | `investment_count` 1,000+ | **`grant_count`** | Grants awarded, not investments in companies. |
| **Flyer One Ventures** | `fund_size_target` €50M | **`fund_size_stated`** + the Fund V vehicle | **Source re-read, as instructed.** It says Fund V was *"launched at €50 million"* — no target is claimed and no close is reported, so neither is recorded. |

**Five new types**, with the shape constraint extended so `grant_count` joins the count
branch: `vehicle_nav`, `average_investment_size`, `grant_funding_disbursed`, `grant_count`
and `follow_on_investment_range`. `vehicle_nav` additionally **requires** a vehicle — a net
asset value with no named vehicle is the exact ambiguity the type exists to remove, and the
database now refuses one.

**Every other observation was reviewed for the same class of error.** Two checks are worth
recording because they produced *no* change:

- **NATO Innovation Fund's €1B** stays `manager_aum`: its own page says "with €1 billion in
  assets under management", which is the type already used.
- **Bpifrance's 6 deals (2018)** stays `investment_count`: it is a count of investments, and
  the single-year basis is carried in the scope and the as-of year, where it belongs.

Four figures found during this pass were **deliberately not stored** for want of a correct
type, rather than forced into a near-enough one — listed in the ledger, with Front
Ventures' €5M rights issue the clearest case for a future `share_capital_raised` type.

**The interface had to change with the data.** The list card picks each figure by type, so
retyping one would have silently emptied the slot it used to fill — Seraphim's figure would
have vanished from the AUM line, DTCP's from the ticket line, Brave1's from the invested
line, while all three sat in the data. Each slot now reads every type that belongs in it and
labels the corrected ones for what they are: *Vehicle NAV*, *Average ticket*, *Grants
disbursed*, *Own capital invested*. A test asserts no slot is keyed on a single bare type
again.

**Schema documentation.** `db/schema.sql` previously carried a note saying the investor
schema was not mirrored. All eight investor tables are now mirrored there, generated from
the live database, with every CHECK vocabulary and the reasoning inline — and replayed
against the live database to prove the block is idempotent (0 rows changed). The four views
are deliberately *not* mirrored, with the reason stated: they are rebuilt by migration
whenever a column is added, because adding one changes column order and `create or replace
view` refuses it, so a stale copy would be worse than none.

## 3. Financial research (part 2)

**All ten priority Ukraine-linked records were researched.** Ukraine-linked coverage went
from 13 of 26 to **23 of 26**.

| Priority record | Outcome |
|---|---|
| Angel One | $1.5M initial fund volume, ~$50K average cheque, 6 investments in six months (2024) — plus 3 relationships |
| Defence Builder | $5M Fund I, $100–300K ticket, 7 companies — **plus 7 relationships from its own fund page** |
| Defender Ventures | Researched, nothing found: **no fund of this name exists in any reviewed source**, including a specialist survey of active Ukrainian defence-tech investors. A record-identity question, not a financial one |
| Double Tap Investments | $100–300K ticket; €100M Fund II **target**, first close only expected |
| In-Q-Tel | ~$1B assets (tax records, reported); 800+ companies over 26 years |
| Lux Capital | Lux Ventures IX $1.5B final close; over $7B manager AUM |
| Network VC | Cheques from $25,000 (a floor, not a range) — plus 2 relationships |
| R-G.AI | Researched, nothing found — and **it is not a fund**: coverage consistently calls it a US defence *technology company*, while naming it as lead investor in Swarmer's 2024 seed. Relationship recorded; entity type needs review |
| Radius Capital | 8 projects since 2022. The $55.5M beside it is **those projects' combined funding, not Radius's own capital**, and was not stored |
| Ukraine Phoenix Tech Fund | €50M target, from the EIB's own release |

**Ukraine Phoenix Tech Fund is the clearest example of the committed-capital discipline.**
Against its €50M target, the anchor LPs total €32.5M — but the EIB *approved a potential*
€15M, Bpifrance *confirmed a willingness to commit* €10M, Proparco *proposed* €5M, and only
Henri Seydoux's €2.5M is stated as committed. No committed-capital figure was recorded, and
the distinction is written into the scope.

**Beyond the ten**, 26 further investors were researched, including the EU institutional
layer (EIF's €175M facility and €1B DEF 2.0 target), national investors (SmartCap's €100M
Estonian Defence Fund, Investinor's NOK 7.1B from its own quarterly report, Tesi),
generalists stored with manager-wide scope as instructed (Lux, Baillie Gifford, Lakestar,
Atlantic Bridge, HTGF, Speedinvest), and **Lakestar Resilience I**, a $300M dedicated
defence fund found during this pass.

**Figures found and deliberately rejected** — each one the kind of conflation this pass was
asked to avoid:

- HTGF: €7.1B of cumulative **follow-on financing raised by portfolio companies** across
  Funds I–IV. Not this manager's capital.
- Radius Capital: $55.5M of **projects' combined funding**.
- ScaleWolf: €13.5M for Lithuania's **MILInvest state programme**, not this manager's fund.
- Invest-NL: a ~€3B **institutional budget**, which is neither a fund size, nor LP
  committed capital, nor AUM.
- EIFO: a DKK 39B **"new activity in 2030" target** and a DKK 1B **guarantee** budget.
- Defence Builder: "$55M+ across 120+ startups" on its own page — the **team's prior track
  record**, not this fund.
- Accel, General Catalyst, Lightspeed: AUM figures that exist **only in an encyclopaedia
  ranking table**. A ranking table is not an acceptable source; Form ADV is where a later
  pass should look.
- Speedinvest: an "exceeds €1B AUM" figure whose **date could not be established**.

**The research log is now a database table, not prose.** `investor_financial_research_log`
records, per investor, the outcome, the sources opened, the date and a note — so the queue
is measurable from the data and an investor with no row is one that has *not* been
researched. The 8 records the previous pass researched without storing anything were
backfilled into it, with that stated.

### Coverage, honestly

| State | Records |
|---|---:|
| Carrying sourced figures | **55** |
| Researched, no usable figure found | **23** |
| **Never researched** | **40** |
| | **118** |

The baseline was 76 never researched; **36 of those 76 were worked through** and 40 remain.
**This is not complete, and nothing here claims it is.** The checkpoint is precise: the 40
remaining records are exactly those with no row in `investor_financial_research_log` and no
current metric, and the ledger lists them by name. No record was marked "not found" without
being researched.

## 4. Portfolio relationships (part 3)

All seven named additions are in, with Front Ventures' own portfolio page supplying
disclosed amounts.

| Relationship | Contribution | Round total | Status |
|---|---|---|---|
| Front Ventures → **SkyHunter** | not disclosed | not disclosed | Pre-seed, autumn 2025; pair also reported independently |
| Front Ventures → **Aeromotors** | $550,000 | $550,000 | December 2025; the reported raise *is* Front's cheque, so both fields are the same stated figure |
| Front Ventures → **ABX Dynamics** | SEK 2,000,000 | not disclosed | **Completed**, per the investor's own 6 May 2026 release; 9.9% holding |
| Front Ventures → **Molfar Defence Technologies** | €1,500,000 | not disclosed | Lead investor, June 2026, 10% holding |
| Front Ventures → **Trinity Robotics** | SEK 2,400,000 | not disclosed | Co-investor with Hede Capital, June 2026; holding withheld for stated security reasons |
| Front Ventures → **Scandinavian X** | not disclosed | not disclosed | A **co-founded four-party joint venture**, not a funding round |
| EIFO → **Acodyne** | not disclosed | €2,500,000 | **Completed** pre-seed announced 22 June 2026; EIFO participated, Gungnir and PSV Hafnium co-led |

**Announced, committed and completed were kept apart.** ABX Dynamics and Acodyne are
recorded as completed because their sources say the investment *was made*; where only a
month is published, no investment date was invented.

**One thing on that page was deliberately not recorded: SWEBAL.** Front Ventures lists it
under a separate "Strategiskt Partnerskap" heading, not in its portfolio. A partner is not
a holding. The two legacy fintech holdings and the Aviation Center Engelholm facility
acquisition were also held back, the last of those remaining an explicit unresolved entry.

**Nine further relationships** were captured during the financial research, as instructed:
Defence Builder's seven own-portfolio companies, and Angel One, Radius Capital, R-G.AI and
Network VC into Swarmer and others.

**Three companies created**, none given a landscape category:

| Company | Status | Why |
|---|---|---|
| **Sky Hunter** (Ukraine) | live | C-UAS interception software, Brave1-approved. Reporting attributes the product to LLC Art Development; the registered entity behind the brand is not asserted |
| **Scandinavian X** (Sweden) | live | Swedish-Ukrainian interceptor-drone JV, registered November 2025. Production status is reported inconsistently, so no output level is stated |
| **ABX Dynamics** (Sweden) | **draft** | Existence well evidenced, but its **product range is confidential** by its investor's own statement, so no UAV or C-UAS activity is established and there is nothing substantive to publish. The relationship is stored; no profile is linked |

Receiving investment admitted nothing to the landscape: all three carry **zero**
`company_sectors` rows and **zero** `landscape_candidates` rows, and the landscape total is
unchanged.

## 5. Unresolved holdings (part 4): 13 → 7

**Six resolved, every one by finding a source other than the unreachable Czech directory.**

| Holding | Resolution |
|---|---|
| **Purple Ventures → VRgineers** | The investor's **own portfolio page**, read directly: "VRgineers Inc." with its website and the tag "PV 1 \| Invested in 2021" |
| **N1 → VRgineers** | Lupa.cz (4 August 2021) names "fondem Nation 1" among the investors entering VRgineers in an additional $2.5M. N1 is the current name of Nation 1 |
| **Sunfish Partners → EU Motors** | The pair always had a source — the investor's own dedicated portfolio page. The **company's identity** was the gap, and the earlier note recorded a trade outlet calling it unverifiable. Resolved: **EU Motors Sp. z o.o.**, a Polish company making BLDC drone motors in Kraków, with its own domain and a Florida plant from February 2026 |
| **Rockaway Ventures → Vermeer** | Vermeer's own 23 October 2025 announcement names Rockaway Ventures among co-investors in a $10M Series A led by Draper Associates, and **quotes Rockaway's general partner** — a transaction party on the record |
| **Bpifrance → Exotrail** | The Definvest page genuinely does not name Exotrail — because the investment is through **different Bpifrance vehicles**. Exotrail's own Series B announcement records Bpifrance leading through its **SPI fund and the Fonds Innovation Défense**, with F3A and Digital Venture participating. Deliberately not attached to Definvest |
| **Nazca Capital → Teltronic** | Fully evidenced, and **historical**. Nazca bought 100% of Teltronic from Hytera on 21 July 2025 (~€75.5M, the first investment of its new defence fund) and **Amper completed the purchase from Nazca on 15 June 2026** |

That last one needed a model change. `retired_at` existed to withdraw a relationship whose
source turned out not to support the pair; an **ended** holding is a different fact. A new
`retired_kind` column distinguishes `unsupported_evidence` from `holding_ended`. Both stay
out of the public export, because neither is a current holding, but the audit trail no
longer records "we were wrong" and "they sold it" as the same thing.

### URC Systems — a precise status, and no decision asked of anyone

As instructed, the three vehicles are distinguished and the transaction status re-checked.
The previous note said "announced … pending competition-authority review … needs a human
decision." That was wrong on the facts and wrong to ask:

- The **identity** is URC Systems, spol. s r.o. of Prostějov (IČO 25547526) — electronic
  reconnaissance and radio jamming for the Czech army, police and NATO.
- The Czech competition office **permitted** the transaction in simplified proceedings in
  **2024**, and the acquirer it names is **Piombino Group, a.s.** — a vehicle of the same
  business grouping as **Rockaway Group, a.s.** — taking sole control.
- The commercial register then records **Piombino Group being merged into URC Systems
  itself** during 2025, with URC Systems as the surviving company.
- So the acquisition **completed, in 2024, through a different vehicle of the group**. It is
  not pending, and it is not 2026.
- **Rockaway Alpha Defense**, the fund this directory record represents, is not evidenced as
  the holder, and the directory holds no Rockaway Capital or Rockaway Group record for the
  holding to attach to.

Nothing is asserted against the record, and **no decision is needed to establish that** —
the evidence names a different acquirer. The entry stays unresolved with that reason.

### The seven that remain, with exact reasons

| Investor → holding | Why it is still unresolved |
|---|---|
| Rockaway Alpha Defense → **URC** | Above: completed in 2024 by Piombino Group, a different vehicle. Not this record's holding |
| Rockaway Alpha Defense → **JISR** | Only source for the pair is the unreachable Czech directory. The company exists in the catalogue and its id is kept as the candidate. **Note: two records, "JISR" and "JISR Institute", may be duplicates — flagged, not merged** |
| Depo Ventures → **Wayren** | Only source is the unreachable Czech directory; no other source names the pair |
| Verve Ventures → **ANYbotics** | **Re-checked against ANYbotics' own funding history** this pass: its 2020 Series A, 2023 Series B, the 2024 Qualcomm-led extension and the 2025 Climate Investment extension name a long list of investors between them and Verve appears in none; Verve's own portfolio page returns no entries. The company is not in doubt. A platform that syndicates through SPVs may legitimately not be named, which is why this is unresolved rather than rejected |
| Freedom Fund VC → **Bravo Dynamics** | No organisation of that name could be verified in any reviewed source |
| Sisyphus Ventures → **ZeroPhase** | The pair has a weak third-party source; the organisation itself could not be verified |
| Front Ventures → **Aviation Center Engelholm** | Not a portfolio company: the investor's own page describes a Swedish defence **infrastructure facility** acquired in 2025. A facility acquisition is not a holding in a company |

**EU Motors** was the explicit instruction here and it resolved, through press releases
naming the Polish legal entity rather than the registry itself. Where uncertainty survives
it is stated, not smoothed.

## 6. Public directory and investor cards (part 5)

| Requirement | State |
|---|---|
| Fund size or AUM, with scope | List card and detail card. Scope, as-of date, verification status and source link on every figure |
| Own capital invested | Now its own slot, labelled **"Own capital invested"**, with grants in a separate **"Grants disbursed"** slot |
| Ticket size | Slot covers initial, follow-on and average, and says which it is showing |
| Portfolio companies linked to published pages | Each holding links to `/companies/<slug>/` when the company is live, and says "Company profile not published" otherwise — which is what ABX Dynamics and Mantis Analytics show |
| Fund commitments in a separate section | A separate **Fund positions** section. 13 positions, never merged into holdings |
| Unknown amounts never shown as zero | "not disclosed", "not established", "not established" — tested, and a test forbids any slot falling back to a zero |
| Unverified investors visible with an evidence label | Kept, with the label |
| No invented office coordinates | Unchanged: a record with no verified city gets a country-association marker that says so |
| **Defence relevance separated from organisational verification** | **Changed.** The notice read "Unverified candidate. Limited information is available; inclusion is not confirmation of investment activity" — directly above sourced figures and sourced holdings. It now reads that what is unestablished is the investor's **defence relevance**, *not its existence*, and where the record carries sourced figures or holdings it says they are sourced facts in their own right. The softer fallback survives for a record that genuinely has nothing |

## 7. Validation and deployment (part 6)

| Check | Result |
|---|---|
| **No test entity in production** | None created. Every ambiguity test ran against fixtures |
| Dry runs | Every write dry-run in a `begin … rollback` first, with the verification select inside the transaction. Two shape-constraint errors were caught that way and fixed before any commit |
| Idempotency | Every statement guarded by `WHERE` or `ON CONFLICT`; the schema mirror replayed against the live database with 0 rows changed |
| Rollback | Recorded in the ledger per migration, including the one-row MITS-style reversals |
| Tests | **72/72**, including 7 new ones for the corrected types, the card slots, the reworded notice and the zero-rendering rule |
| No investor disappeared | 118 before, 118 after. No merge |
| No duplicate companies | 0 duplicate normalised names across all live companies. Two **pre-existing** suspected duplicate pairs flagged, not merged: JISR / JISR Institute, and Kara Dag / Kara Dag Technologies |
| No duplicate relationships | Unique on (investor, company, relationship_type); all inserts `ON CONFLICT DO NOTHING` |
| No unpublished profile URL exposed | Verified: 0 exported holdings carry a URL for a non-live company |
| No retired relationship exported | The view filters `retired_at is null`; 3 retired rows, 0 exported |
| Fund positions separate from holdings | Separate array, separate section, separate count |
| Labels match structured types | Asserted by test for all five new types |
| Landscape unchanged | 567 |

## 8. Remaining work, stated precisely

1. **40 investors never researched financially** — named in the ledger. The queue is a
   database table now, so this count is measurable rather than asserted.
2. **7 unresolved holdings** — reasons above. Four hinge on the Czech government directory
   being unreachable; three on an organisation that cannot be verified.
3. **R-G.AI's entity type** — it is a defence technology company, not a fund.
4. **Defender Ventures' identity** — no fund of that name exists in any reviewed source.
5. **Two suspected duplicate company pairs** — JISR / JISR Institute, Kara Dag / Kara Dag
   Technologies. Both predate this pass.
6. **A `share_capital_raised` metric type** — for listed investment companies such as Front
   Ventures and Varangians, whose share issues are neither fund closes nor LP commitments.
7. **ABX Dynamics** stays a draft until its products are publicly established.
