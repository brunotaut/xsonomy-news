# Investor corrections, fund positions and financial expansion

**Date:** 2026-11-01 · **Status:** applied and deployed
**Reproduce / rollback:** `research-agent/imports/README-investor-corrections.md`
**Completion ledger:** `research-agent/reports/2026-11-01-investor-financial-ledger.md`

| | Before | After |
|---|---:|---:|
| Investor records | 118 | **118** |
| Ukraine-linked | 26 | **26** |
| Portfolio relationships | 61 | **74** |
| Unresolved holdings | 26 | **13** |
| Fund positions | — | **9** |
| Retired relationships (kept for audit) | — | **2** |
| Financial observations | 14 | **49** |
| Investors with financial figures | 7 | **23** |
| Ukraine-linked investors with figures | 7 | **13** |
| Landscape | 567 | **567** |

Every one of the original 87 edges is still accounted for: 74 live relationships + 13
unresolved = 87.

---

## 1. Airvolve

**Airvolve is its own company.** The previous pass left it unresolved and said so honestly:
two investors listed it, the announcement cited as its source did not mention it, and it
might have been a variant of Airvolute. It is not.

| | Airvolve | Airvolute |
|---|---|---|
| Country | Lithuania (Vilnius) | Slovakia (Trnava) |
| Legal name | airvolve, UAB | — |
| Founded | 2024 | 2020 |
| Builds | Airlift-U500 — hybrid-electric autonomous VTOL tactical transport | DroneCore open-architecture autopilots |
| Investors here | Coinvest Capital, BSV Ventures | Baryon Fund |

Both are now in the catalogue as separate published companies, and each record says in
plain words that the other exists and is a different company — so the next person to read
either one cannot repeat the conflation.

The round, from Coinvest Capital's own announcement:

- **round total €825,000** — what every investor supplied together;
- **Coinvest Capital's contribution €510,000** — its own share, in its own field;
- **Baltic Sandbox Ventures and accredited business angels** also participated;
- **announced 3 September 2024.**

Three things deliberately not done. **Baltic Sandbox Ventures' contribution is not
invented** — the announcement does not disclose it, so that field is null while the round
total it shares is recorded. **The investment date is not inferred from the announcement
date**, so `investment_date` stays null. **The €825,000 is never copied into a
contribution field**; a database CHECK would also stop a contribution exceeding its round.

**Baltic Sandbox Ventures is BSV Ventures** — the same firm renamed, not a second record.
Confirmed from its €15M fund-close coverage and from the NATO Innovation Fund's
announcement of backing it. The relationship therefore sits on the existing `bsv-ventures`
record, with the former name recorded in the record's research note *and* in the
relationship's own note, because the 2024 announcement prints the old name.

## 2. EIFO

The report was right that the recipient was wrong, and right that `fund_of_funds` did not
fix it. What the audit also found is that **two separate real facts had been collapsed into
one bad row**:

1. **EIFO → D3** is a fund commitment: US$5 million of equity into the D3 defence
   technology venture fund, from EIFO's own announcement, 4 July 2025. This is now a **fund
   position**, in its own table and its own array in the export, with a note that D3's
   portfolio companies are not EIFO holdings.
2. **EIFO → Six Robotics** is a real direct participation — just not one the D3 article
   supports. DTCP's own announcement of the €12M seed round names "EIFO (Export and
   Investment Fund of Denmark)" as a participant. That relationship is stored on **that**
   source, with the €12M round total and no invented contribution.

The original row is **retired in place** — `retired_at` and a `retired_reason` that
explains exactly what was wrong — so the audit history survives while the projection stops
publishing it. Retirement was built for this: `v_landscape_investors` now excludes any row
with `retired_at`.

**Nothing presents indirect exposure as a direct holding.** Fund positions never appear in
`portfolio`, are counted separately in `landscape.json`, render under their own heading, and
carry their own caveat.

## 3. The evidence audit

All 61 relationships and all 26 unresolved entries were re-read against their own cited
sources. **Three kinds of defect turned up**, and each is corrected differently.

### (a) The pair is real, the cited source does not support it — re-sourced (6)

| Relationship | What the cited source actually was |
|---|---|
| **Coinvest Capital → PDKINEMATICS** | The investor's announcement of *Unmanned Defence Systems'* round. PDKINEMATICS appeared on it only as a "Recent Posts" **sidebar headline**. Re-sourced to the investor's own announcement of this round: €2M seed, co-led with Iron Wolf Capital. |
| **Iron Wolf Capital → PDKINEMATICS** | The investor's **home page**, which names no portfolio company at all. Re-sourced to the co-lead's announcement. |
| **Seraphim Space → ICEYE** | A news item about **Mutable Tactics** that never mentions ICEYE. Re-sourced to Seraphim's own portfolio page, where it is a top-10 holding. |
| **DTCP → Six Robotics** | DTCP's **€500M fund-launch release**, which does not mention the company. Re-sourced to DTCP's own announcement of the round: €10M of a €12M seed that it led. |
| **Scale Capital → Six Robotics** | A company press release that now returns **HTTP 404**. Re-sourced to the lead investor's announcement, which names it as a participant. |
| **Depo Ventures → Zvook** | The Czech government investors directory, which has **refused connections across two passes**. Re-sourced to reporting that names the investor, the company and the Ukraine Fund used, and records the amount as undisclosed. |

The sidebar case is the instruction's own warning in its purest form: a page that mentions
a company is not evidence of an investment in it.

### (b) The source says more than was recorded — typed precisely (5)

| Relationship | Now recorded |
|---|---|
| **Redalpine → Cambridge Aerospace** | Direct investment, $300M Series C, through its Summit Fund (the vehicle is now stored) |
| **Gungnir Capital → Acodyne** | Direct investment, **co-lead**, €2.5M pre-seed |
| **PSV Hafnium → Acodyne** | Direct investment, **co-lead**, €2.5M pre-seed |
| **Front Ventures → Black Forest Systems** | Direct investment, **$400K contribution** co-invested alongside Hede Capital Partners |
| **Baryon Fund → Airvolute** | Confirmed, and now explicitly distinguished from Airvolve |

**The two flagged edges both survived re-checking, for the same reason.** PSV Hafnium →
Acodyne and Tesi → Kelluu were flagged because they came from another investor's portfolio
page. But that page does not merely *list* the companies: for each one it names the
investors in that specific round — Acodyne "co-led by Gungnir Capital and PSV Hafnium",
Kelluu's €15M Series A "led by NATO Innovation Fund" with "Gungnir, Keen Venture Partners,
and Tesi also participating". Naming the co-investors in a round is evidence for the pair;
appearing in a list is not. Both are kept, both say in their note that they rest on a third
party's account, and **Tesi → Kelluu was additionally re-sourced to the lead investor's own
announcement**, which names Tesi directly.

### (c) No source supports the pair — retired and listed as unresolved (1)

**Rockaway Alpha Defense → JISR.** Its only source was the unreachable Czech directory, and
nothing else found connects the two. It is retired from the portfolio and listed as an
unresolved holding with the company id kept as the candidate. That investor record now
shows **no portfolio at all** and two unresolved entries — which is the honest state.

### Evidence labels corrected (11)

Eleven relationships whose source *is* the investor's own published portfolio page were
labelled `third_party_reported`, which understated them. Each page was re-read and does
name the company, so they are now `investor_published_portfolio`: D3 (3), Expeditions (2),
Helantic (3), OTB Ventures (2), SmartCap (3), Sunfish Partners, Change Ventures, Neo
Ventures, Lifeline Ventures, Gungnir Capital (2), Plural. Two of those pages also state who
led, which the bare listing had dropped: Change Ventures → Origin Robotics and Gungnir →
Monava are now recorded as lead.

### Fully verified and unchanged

Tekever (Baillie Gifford, NATO Innovation Fund — both named, €70M round) · Green Flag
Ventures' nine holdings (all nine named on its own portfolio page) · Marathon → Delian
(the EIF case study says Marathon "invested in Delian early on") · HTGF → Alpine Eagle ·
Sisyphus Ventures' Stendr and Tiberius Aerospace · the six Helsing relationships · the
Sienna IM pair, whose separate €7M and €11.8M contributions and undisclosed round totals
were already correct.

## 4. Unresolved holdings: 26 → 13

**Thirteen edges resolved**, each to an organisation verified against a source that names
both parties, and **nine companies created** with no duplicates:

| Company | Published? | Why | Resolved for |
|---|---|---|---|
| **Airvolve** | **yes** | Lithuanian autonomous VTOL transport aircraft | Coinvest Capital, BSV Ventures |
| **Kelluu** | **yes** | Finnish autonomous hydrogen airships — uncrewed aerial | NATO Innovation Fund (lead), Keen, Gungnir, Tesi |
| **Mutable Tactics** | **yes** | British drone-swarm autonomy software | Seraphim Space (lead, $2.1M pre-seed) |
| EclecticIQ | draft | Cyber threat intelligence — out of scope | Keen Venture Partners |
| Perciv AI | draft | Radar perception software, no established UAV use | Keen Venture Partners |
| SatVu | draft | Thermal imaging satellites | Seraphim Space |
| Creoir | draft | Embedded electronics design | Gungnir Capital (lead) |
| Aerospacelab | draft | Belgian satellite manufacturer | Airbus Ventures |
| Kalray | draft | Manycore processors | Bpifrance (Definvest) |
| SinterMAT | draft | Advanced materials | Bpifrance (Definvest) |

**Publication follows the rule already in force.** `/companies/` describes itself as a
directory of UAV and counter-UAS companies, so only the three that are that are published.
The other six are drafts: the holding is shown, the relationship is stored, the profile is
not public and the export gives it no URL.

**Landscape eligibility was not touched.** None of the ten created companies has a
`company_sectors` row or a `landscape_candidates` row, and the landscape build skips any
company without an explicit taxonomy assignment — so a company created from a portfolio
listing *cannot* enter it. Verified: **567 before and after**.

### The thirteen that remain, with reasons that now say what was checked

| Holding | Investor | Why it is still unresolved |
|---|---|---|
| **URC** | Rockaway Alpha Defense | **Identity now evidenced** — URC Systems of Prostějov, id recorded. The relationship is not: Czech reporting describes an announced acquisition of 100% by **Rockaway Capital via its Piombino Group subsidiary**, still under competition-authority review, price undisclosed. A pending acquisition by a different vehicle is not a completed holding. **Needs a human decision.** |
| **Aviation Center Engelholm** | Front Ventures | **Not a company holding.** The investor's own page calls it a Swedish defence infrastructure *facility*, acquired in 2025 for 3.0 MSEK. |
| **EU Motors** | Sunfish Partners | Named on the investor's own portfolio page, so the *pair* has a source. The *organisation* does not: a trade outlet reports its European identity as unverifiable in registries. Creating a record on a disputed identity would be the error. |
| **Exotrail** | Bpifrance | The Definvest page was re-read. It names Kalray and SinterMAT, which are now resolved, but **not** this company. |
| **Teltronic** | Nazca Capital | The cited source is a regulatory fund filing that lists no portfolio companies. |
| **ANYbotics** | Verve Ventures | The cited source is an industry-association member directory, not a portfolio. The investor's own portfolio page returns **no entries at all**. |
| **ZeroPhase** | Sisyphus Ventures | Named in a third-party article's selected portfolio; the organisation could not be verified. |
| **Bravo Dynamics** | Freedom Fund VC | Source is a LinkedIn company page; no organisation of this name verified. |
| **JISR** | Rockaway Alpha Defense | Withdrawn from the portfolio this pass (above). |
| **Wayren** · **Vermeer** · **VRgineers** ×2 | Depo, Rockaway Ventures, N1, Purple Ventures | The Czech government investors directory has refused connections across **two** passes. VRgineers is a known Czech VR-headset maker; the relationship is what is unevidenced. |

## 5. Financial coverage: 7 investors → 23

**49 current observations across 23 investors**, up from 14 across 7, using **10 of the 12
metric types**. The per-investor ledger is a separate file, because the gap matters as much
as the coverage: 23 found, **19 researched and nothing usable**, **76 not yet researched**.
Those three states are deliberately distinct.

**13 of the 26 Ukraine-linked records** now carry figures, against 7 before: Brave1,
Coinvest Capital, D3, Darkstar, Expeditions, Flyer One, Green Flag, Keen, MITS Capital,
NATO Innovation Fund, Shield Capital, UA1 VC, Vsquared.

### The distinctions the vocabulary exists for

- **OTB Ventures** shows the full ladder on one fund: **€150M target → €140M first close
  → €170M final close**, plus **over €323M** manager AUM as a separate, bounded figure. The
  "$185M" other outlets report is the same close in dollars, and the scope says so.
- **MITS Capital's** first fund closed at **more than $20M** (a `minimum`) against a **$50M
  target** that is recorded *with* its controversy: one outlet's correction attributes the
  target to a third-party estimate, and a co-founder says the firm does not disclose fund
  size. A second fund is **€100M being sought** — a target, not a raise.
- **BSV Ventures'** €15M is `fund_close_announced`, not a final close, because its own
  backer calls it an initial close. The ambiguity is preserved rather than resolved.
- **Brave1** is a grant programme: **₴6.2 billion** disbursed since 2023 and **1,000+
  grants**, both labelled as grants to developers rather than investments in companies.
- **Varangians'** €9.1M close was stored and then **withdrawn**: the only source for it
  returns 404, and reachable coverage describes the firm as an investment company rather
  than a closed-end fund, which makes "close" the wrong frame as well. It is in the ledger
  as *not found*, with the reasoning.
- **Shield Capital** records both sides of an oversubscription: **$186M final close**
  against a **$120M target**.
- **DTCP's** "~€20M average investment" is stored as an `initial_investment_range` with
  bound `approximate` and a scope saying it is an average, not a published range.

### Two figures deliberately **not** stored

- **Coinvest Capital's €44.6M.** The fund describes it as "co-invested with partners" —
  combined round volume, not its own deployed capital. Only the **43 companies** it states
  are recorded, with the reason in the scope. Deriving deployed capital from round totals is
  exactly what the instruction forbids.
- **D3's "$50M."** That figure is a combined total for two funds in one 2023 report. D3's
  own stated goal, **$30M**, is what is recorded.

## 6. Fund positions: a new kind of fact

The EIFO correction needed somewhere for "committed capital to someone else's fund" to
live. `investor_fund_positions` is that place, and once it existed, eight more
well-evidenced commitments fitted it:

| Investor | Fund | Commitment |
|---|---|---|
| EIFO | D3 | **US$5M** |
| SmartCap | DTCP Defence Fund I | €5M |
| SmartCap | Darkstar Ventures Fund I | €10M |
| SmartCap | NATO Innovation Fund — NATO Sub Fund I | €26.91M |
| SmartCap | Plural Fund II | €10M |
| EIF / Defence Equity Facility | Sienna Hephaistos Private Investments | €30M |
| NATO Innovation Fund | BSV Ventures | not disclosed |
| NATO Innovation Fund | Expeditions Fund II | not disclosed |
| NATO Innovation Fund | OTB Ventures Fund II | not disclosed |

Each target is itself a directory record, so the interface links across — from an LP to the
manager it backs — without ever implying a holding. SmartCap publishes these commitment
sizes on its own fund-investments page, which is also why SmartCap has **no** AUM metric:
it states none.

## 7. Validation

| Check | Result |
|---|---|
| Edges accounted for | 74 + 13 = **87** |
| Directory records preserved | **118** in, 118 out, no slug lost or gained |
| Ukraine-linked preserved | **26**, unchanged |
| Landscape | **567**, unchanged |
| `company_sectors` / `landscape_candidates` rows on the 10 new companies | **0 / 0** |
| Duplicate companies created | **0** — every insert guarded on the normalised name, all 10 names absent beforehand |
| Unpublished profiles exposed | **0** — the 7 drafts get `published: false` and `url: null`; no page is generated for them |
| Retired rows reaching the export | **0** — the projection filters `retired_at is null` |
| Fund positions appearing as holdings | **0** — separate array, separate count, separate caveat |
| Source URLs that do not resolve | **1 of 65**, found by link-checking every new source and deleted rather than published |
| Test rows written to production | **0** (see below) |
| Tests | **59/59** (41 → 55 → 59; 4 new) |
| Idempotency | every replay guard verified closed, read-only |

**No probe rows this time.** The previous pass inserted a test "Helsing" company into
production to exercise ambiguity handling, and a scheduled deploy picked it up. This pass
exercised the same behaviour against fixtures in the catalogue test suite instead, and
proved idempotency by checking that each guard predicate is now closed rather than by
writing anything.

### Live journeys verified in a browser

- **EIFO** — one holding (Six Robotics, €12M round total, contribution "not disclosed") and
  one fund position (D3, US$5,000,000, announced 2025-07-04), under separate headings with
  separate caveats.
- **Coinvest Capital** — Airvolve with **€510,000 contribution** and **€825,000 round
  total** shown as distinct lines; 43-companies metric with its scope note.
- **BSV Ventures** — Airvolve with the former-name explanation and no invented contribution.
- **Rockaway Alpha Defense** — no portfolio section at all; two unresolved entries with the
  full URC reasoning.
- **MITS Capital** — four figures, including the contested target with its contest spelled
  out.
- **SmartCap** — four fund positions, each linking through to the manager's own record.
- Mobile at 375px: no horizontal scroll, panel opens and closes, the new link is a 35px
  touch target.

## 8. Remaining, with precise reasons

1. **76 investors not yet financially researched**, listed by name in the ledger. The
   Ukraine-linked ten are the priority queue; eight of them are workbook `watchlist`
   records with no verified web presence, so identity confirmation precedes any figure.
   The public programmes (EIF, NSSIF, SFPIM, SNCI, HBOR, SecFund/BOM, DOVOS, Invest-NL,
   Investinor) are the most likely to have published budgets.
2. **19 researched with nothing usable** — not the same as nothing existing. Gungnir
   Capital is the clearest case: it is mid-raise and third-party figures conflict.
   Varangians is the other kind: the figure exists in reporting, but its only source is
   gone.
3. **URC → URC Systems needs Nazar's decision.** Identity evidenced, transaction pending
   under competition review, and by a different group vehicle than the record we hold.
4. **The Czech government investors directory is still unreachable** (connection refused,
   two passes). Four unresolved holdings depend on it.
5. **EU Motors' identity is disputed** by a trade outlet. Resolving it means a Polish KRS
   registry check, which is beyond web search.
6. **Front Ventures publishes six further holdings** with amounts — SkyHunter, Aeromotors,
   ABX Dynamics, Molfar Defence Technologies, Trinity Robotics, Scandinavian X — four of
   them Ukrainian. They were **not** harvested: this pass audited the 87 edges it was given
   rather than growing the set. They are the best-evidenced expansion available.
7. **EIFO → Acodyne is evidenced but not stored**, for the same reason: it is a new edge,
   not one of the 87.
8. **The investors table (200 rows) is still unreconciled** with `investor_research` (118).
   Only 8 relationships carry a link to a catalogue investor row.
9. **Two metric types remain unused** — `fund_close_interim` and `committed_capital` — and
   the investor staging schema is still not mirrored in `db/schema.sql` beyond this pass's
   own additions.
