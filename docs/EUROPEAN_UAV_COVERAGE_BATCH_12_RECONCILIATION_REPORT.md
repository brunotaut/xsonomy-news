# Batch 12 reconciliation — European UAV & Counter-UAS Landscape

Reconciled 2026-10-28. Input: `research-agent/researched/batch-12-researched.csv` (40 rows,
enrichment only). Output: `research-agent/reconciled/batch-12-reconciliation.csv`.

**Verified 507 → 513.** Landscape rows 987 → 986 after two merges.

| | Batch 09 | Batch 10 | Batch 11 | Batch 12 |
|---|---:|---:|---:|---:|
| Admitted | 8 | 11 | 3 | **6** |
| Excluded | 19 | 14 | 21 | **23** |
| Held for review | — | 10 | 10 | **9** |
| Merged | 4 | 1 | 4 | **2** |

## What the duplicate check found this time

Two of the forty were duplicates, and one of them turned an unknown into an admission.

**NUANCE Technologie → Nuances Technologies.** The research returned `UNKNOWN / LOW` on this row:
the only evidence was co-occurrence in an article about the KNDS TARGAS counter-drone ecosystem,
and the standing rule forbids treating co-occurrence as evidence. That verdict was right about the
record and wrong about the company. The database already held a second record, **Nuances
Technologies**, under a correct spelling and with two articles of its own. Checking that record
independently produced what the batch row could not: Nuances Technologies is a **Paris company with
two named products** — the **Raptor 2** electronic countermeasure, paired with the AXS-µ1 interceptor
in the KNDS France TARGAS DSP10 configuration, and the **Sniper-530** drone detection and radio-link
neutralisation system shown at Eurosatory. The duplicate was merged into it and the surviving record
was **admitted** under `cuas-def-rf-jamming` and `cuas-det-rf`.

**Flight Refuelling Limited → Cobham.** Flight Refuelling Limited is the entity the Cobham group
grew from, now dormant. Cobham was already in the backlog. Merged.

## A product that belonged to the wrong company

**Survey Copter** was admitted — an Airbus Helicopters subsidiary in France, and the designer and
producer of the **CAPA-X** modular VTOL UAS selected by the European Defence Agency for M2UAS in
March 2026.

The catalogue already held a `Capa-X` product record. It was attached to **Airbus Defence and
Space**, which neither designs nor builds it. The record was **reassigned to Survey Copter**, where
the product actually belongs. This is the same class of error as the TerMit and Motor-G corrections
in earlier batches: the entity extractor attaches a product to whichever group name appears in the
headline.

## Admitted (6)

| Company | Country | Why |
|---|---|---|
| **Survey Copter** | France | Airbus Helicopters subsidiary; CAPA-X modular VTOL UAS, EDA M2UAS selection |
| **Flarebright** | United Kingdom | Extera flight-termination system holds a UK CAA SAIL 2 component certificate; Tactera GPS-free navigation |
| **SkyBound** | United Kingdom | Owns SkyBound Control, SkyBound Intelligence and SkySim; automated stations deployed on UK rail |
| **Vizgard** | United Kingdom | FortifAI edge visual autonomy for drone operations and counter-UAS; UKDI testing, NATO DIANA |
| **Avilus** | Germany | Grille 9X casualty-evacuation and logistics UAS, Bussard, and its own RasCore flight-control system |
| **Nuances Technologies** | France | Raptor 2 countermeasure in KNDS TARGAS DSP10; Sniper-530 detection and neutralisation |

Six products and thirteen taxonomy rows were added, every one with an evidence URL.

**SkyBound was admitted without waiting for the open operator decision.** It owns its software and
its station network, which is the rule the landscape has been following all along — the same rule
the decision document recommends in writing.

## Declined against the research

**INFINTEQ** was declined in Batch 11 for a careers page. This batch produced one of the same kind:

**Eagle Eye Innovations** came back `IN_SCOPE / HIGH`. It is a real CAA-approved drone training,
test-and-evaluation and consultancy business, and UAV work is all it does. It was still held, for
two reasons. It owns no platform, which is the open operator question. And more concretely: **the
taxonomy has no training or services leaf.** An untagged company cannot become verified, so even
admitting it would have left it unverifiable. Admitting the services layer means adding a sector
first — that is now written into the operator decision as a fourth option.

## Excluded (23)

The highest count of any batch so far, and the shape has changed. Eight of the twenty-three are
**maritime**: Thales Underwater Systems, Harland & Wolff, Manor Marine, MarineAI, MFE Offshore,
Navantia UK, ZeroUSV and ORCAS. The queue is now scraping the bottom of a UK and French
defence-industry list where shipbuilders outnumber drone companies.

Three are **not companies at all**:

- **Aerorozvidka** (Ukraine) — a volunteer NGO, on the same rule that removed the trade publication
  *Unmanned Airspace* in Batch 09 and the acquisition vehicle in Batch 11. Its drones are real; it
  is not a company.
- **Bullspike** (Ukraine) — a grenade launcher extracted as a company.
- **FPV UK** — a membership association.

**Cohort** was excluded as a holding group. Its counter-UAS products belong to **Chess Dynamics**,
already verified in this landscape with CHARM50, Vision4ce CHARM and Hawkeye. Admitting the parent
would have counted the same capability twice.

**Distance Technologies**, **eSmart Systems** and **Whisper Aero** were excluded on substance, and
all three also needed their country fixed.

## Country corrections (4)

| Company | Was | Is |
|---|---|---|
| Avilus | Ukraine | **Germany** |
| Distance Technologies | United Kingdom | **Finland** |
| eSmart Systems | United Kingdom | **Norway** |
| Whisper Aero | United Kingdom | **United States** |

Avilus is the one that mattered: a German heavy-lift UAS maker was sitting in the database as
Ukrainian.

Whisper Aero leaves the landscape view entirely on the country fix: the view only admits companies
headquartered in a landscape-scope country.

## Both open decisions grew again

**Warhead and energetics scope — now five companies.** Teledyne Energetics joins EURENCO, Odin
Defence, TDW and Wolfram Europa. Left as a candidate with no taxonomy. This question has now been
raised in five separate batches.

**Operator scope — now five companies.** Team UAV and Eagle Eye Innovations join Unmanned4you and
Extensee, and Randle Engineering sits beside them as an engineering consultancy with the same shape.
Batch 12 also showed the question is wider than operators: training and engineering firms are a
services layer the taxonomy cannot currently express. A fourth option was added to the decision.

## QA gate

| Check | Result |
|---|---|
| `included` rows failing the eligibility rule | **0** |
| Publication status changed by this batch | **0** |
| V1 frozen snapshot | **273** |
| V2 frozen snapshot | **358** |
| Redundant unevidenced parent sectors | **0** |
| Landscape rows | 987 → **986** (two merges) |

## The publication gap, now 206

**206 companies whose landscape status is `excluded` or `needs_review` are published on
xsonomy.com.** It was 143 after Batch 10, 174 after Batch 11, and the batch that produced the
highest exclusion count produced the largest jump yet: **+32 in one batch.**

This batch alone added a volunteer NGO, a grenade launcher, a membership association, four
shipbuilders and an electric-propulsion company headquartered in Tennessee.

Nothing has been changed. Publication remains Nazar's decision under rule 4 of `CLAUDE.md`, and it
is now the largest data-quality problem in the project by a wide margin — and the only one the
public site actually shows.

## Where the backlog stands

Backlog **238** (was 277).

| | After 10 | After 11 | After 12 |
|---|---:|---:|---:|
| Records with nothing at all | 91 | 53 | **19** |
| Records with no description | — | 134 | **120** |

The pure-blank pool is nearly gone. Batch 13 takes all 19 remaining blanks plus 21 of the 101
records that have a website or a product but no description, spread across **17 countries** with a
cap of five per country. After that, roughly two more enrichment batches remain before the
description gap is closed and the loop has to change shape again.

**Batch 13 is queued: `research-agent/queue/batch-13.csv`.** Two questions were added for the
researcher, both earned this batch: name the legal entity in a group that actually designs and
produces an attributed product, and confirm the headquarters country of the **canonical parent**
rather than a local subsidiary.
