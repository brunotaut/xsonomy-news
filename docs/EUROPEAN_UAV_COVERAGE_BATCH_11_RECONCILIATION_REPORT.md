# Batch 11 reconciliation — fourth enrichment batch

Date: 2026-10-28
Input: `research-agent/researched/batch-11-researched.csv`
Output: `research-agent/reconciled/batch-11-reconciliation.csv`
Queue produced: `research-agent/queue/batch-12.csv`

## Headline

Verified **504 → 507 (+3)** — the smallest gain of the enrichment run, and the number that matters
least this time. The real results are **21 exclusions**, **four duplicates of already-verified
companies caught**, and the blank-record backlog falling to **53**.

| Outcome | Count |
|---|---|
| Admitted to landscape | 3 |
| Excluded | 21 |
| Held for review | 10 |
| Merged into an existing record | 4 |
| Declined, stays a candidate | 2 |
| **Total** | **40** |

One row (V4Smart) was missing its `article_count` field, shifting everything after it by one
column. Caught and repaired; nothing was misattributed.

## Half the "in scope" findings were already in the landscape

Six records came back IN_SCOPE. Four of them were companies this landscape already holds:

- **Grupa WB** is **WB Group (WB Electronics)**, verified, with FLYEYE, WARMATE and FT-5.
- **Polaris Raumflugzeug** is **POLARIS Spaceplanes**, verified, with four products.
- **Gorgé** is the pre-2022 name of **Exail**.
- **Grupa Boryszew** duplicates the existing **Boryszew** record — whose drone work sits in
  **Hornet-Polskie Drony**, also already verified.

All four merged. Without the check they would have become phantom companies, and WB Group would
have been split in two.

This is the fourth consecutive batch where the duplicate check mattered. It is the single most
valuable step in this reconciliation.

## Admissions (3)

**Germandrones** (DE) — the Songbird VTOL UAV and its own mission-planning software.
**THYRA** (DE) — the NEPTOR autonomous interceptor drone and its launchers, a real counter-UAS
entry. **Artech'Drone** (FR) — ten named multirotor models designed and assembled in France.

Six products and six taxonomy rows added, each with its evidence URL.

**INFINTEQ** was returned IN_SCOPE but declined: the aerial evidence is a careers page and a
LinkedIn listing showing UAV engineering roles. Job adverts are not a product, and no named
platform was established.

## Exclusions (21), the highest yet

Maritime: ELAC Sonar, Lürssen, Covelya, Inocea Group. Land systems: Huta Stalowa Wola, Rosomak.
Space: OHB Digital Connect, HyPrSpace, Eutelsat OneWeb, and **Look Up**, whose radar tracks
objects in low Earth orbit — radar alone is not counter-UAS. Components with no UAV-specific
product: V4Smart (batteries), JFG Composites. Resellers: NaviGate.pl, uStrażaka.pl (a fire-and-
rescue equipment shop). Consultancies: Dornier — the current Dornier Group is an energy and
infrastructure consultancy, not the aircraft maker — and EGIS.

And **SMOT Acquisition**, which is not a company at all: it is the acquisition vehicle Red Cat
Holdings set up to bid for Steyr Motors. Steyr Motors itself was admitted in Batch 08.

**Bayards Vertiports** was excluded on the Skyports Infrastructure precedent from Batch 08:
vertiports are landing infrastructure, not a UAV or counter-UAS capability.

Five countries corrected: Klau Geomatics → Australia, SMOT Acquisition → Austria, Bayards and
Bayards Vertiports → Netherlands, Wolfram Europa → Estonia.

## Both open decisions gained a case

**Wolfram Europa** is a fourth warhead supplier — energetic materials and warheads, with an
effector partnership with Harmattan AI. Added to the warhead decision, held at the same
conservative default.

**Extensee** is a second operator case, and a more interesting one than Unmanned4you: it runs
heavy long-range UAVs and does its own data processing, which is much closer to Cyberhawk than to
a DJI operator. Under my recommended rule it might well be admitted while Unmanned4you is not.
Added to the operator decision.

Both decisions have now been raised by two separate batches each. Each new case costs another
round of holding and re-explaining.

## Landscape after Batch 11

| | Before | After |
|---|---|---|
| Verified | 504 | **507** |
| UAV only | 277 | 279 |
| C-UAS only | 188 | 189 |
| Both | 39 | 39 |
| Candidates | 315 | 277 |
| Needs review | 62 | 72 |
| Excluded | 110 | 131 |

Rows 991 → 987, the difference being the four merges. QA clean: V1 = 273 and V2 = 358 unchanged,
zero verified companies failing the eligibility rule, zero redundant unevidenced parents, zero
publication changes.

## Where enrichment stands

| | After 07 | After 08 | After 09 | After 10 | After 11 |
|---|---|---|---|---|---|
| Backlog with nothing on file | 214 | 164 | 128 | 91 | **53** |
| Admissions | — | 7 | 8 | 11 | 3 |
| Exclusions | — | 16 | 19 | 14 | 21 |

Admissions are falling and exclusions are rising, which is what you would expect: the genuinely
unknown good companies were found first, and what is left is mostly noise to be cleared.

**Batch 12 takes 40 of the remaining 54 never-researched blanks.** After that the pure-blank pool
is gone, but **81 more records have a website or a product yet no description** — still
enrichable. So there are roughly three more useful batches, not one.

## Three things waiting on you

1. **Warhead scope** — four companies now.
2. **Operator scope** — two companies now, and the second one may split the answer.
3. **174 excluded or needs-review companies are live on xsonomy.com**, up from 143 after Batch 10.
   Thirty-one more this batch alone. The public catalogue now also lists a ropeway maker's
   neighbours: a fire-equipment shop, an aluminium engineer, a satellite operator, a rocket
   company and an acquisition vehicle. I have changed no publication status, and I will keep not
   changing it, but this is now the largest and fastest-growing data-quality problem in the
   project — and the only one your visitors can see.
