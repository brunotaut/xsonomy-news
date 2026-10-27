# Batch 09 reconciliation — second enrichment batch

Date: 2026-10-27
Input: `research-agent/researched/batch-09-researched.csv`
Output: `research-agent/reconciled/batch-09-reconciliation.csv`
Queue produced: `research-agent/queue/batch-10.csv`

## Headline

Verified **485 → 493 (+8)**. Nineteen records excluded, two duplicates merged, and the no-data
backlog is down to **128** from 164.

| Outcome | Count |
|---|---|
| Admitted to landscape | 8 |
| Excluded | 19 |
| Held for review | 8 |
| Declined, stays a candidate | 3 |
| Merged into an existing record | 2 |
| **Total** | **40** |

Input was clean: 40 rows, exact queue match, no field shifts, every evidence cell a URL. The
UNRESOLVED instruction added after Batch 08 was used four times and used correctly.

## The database was describing its own sources as companies

Row 5 of this batch is **Unmanned Airspace** — the trade publication whose articles appear as
evidence URLs throughout this landscape, including in earlier batches of this very project. It had
been entered as a UAV company. Excluded.

It is the same class of error as LPP Holding (the fashion retailer) in Batch 08: the entity
extractor turning a name that appears near drone coverage into a drone company. Batch 10's queue
now asks explicitly whether each record is a company at all, or a publication, a cluster, a
government programme, a military unit or a product line. Five of the last eighty records were one
of those.

## Admissions (8)

**Hybrid Drones** (UK) — HYDRA-400 hybrid jet-electric heavy-lift VTOL, evidenced by MBDA's own
release and Companies House. **Buntar Aerospace** (Ukraine) — Buntar-3 EW-resilient ISR VTOL plus
Copilot control software. **Kolarms** (Slovakia) — the Ares Shield layered counter-UAV complex with
the I2 Defender interceptor and Nemesis turret, documented by Janes and confirmed in the Slovak
contract registry; a genuinely new C-UAS entry. **CTech** (Turkey) — airborne SATCOM with flight
hours on ANKA and AKSUNGUR. **WholeShip** (UK) — the CAA-listed National Drone Hub test site and
SADIE ship-air integration equipment. **4iG** (Hungary), **LV-Teh** and **NEWT21** (Latvia) — all
on stated UAV design and manufacture, tagged at the `uav` root because no aerial model is named yet.

Seven products and thirteen taxonomy rows added, each with its evidence URL.

## Two merges

**Norma Precision** is a duplicate of **Norma**, which turns out to have been verified in this
landscape all along — see the section below. **UDD**, **UDD Tech Corp** and **Ukrainian Defense
Drones** were three records for one company, which the US DoD vendor list names as Ukrainian
Defense Drones Tech Corp, a **US** entity. Consolidated into one record, country corrected, and
excluded as outside European scope.

## The warhead question just got smaller

Norma Precision looked like a fourth warhead-policy case: it makes the cartridge for Benelli's
counter-UAV shotgun. But **Norma is already verified under `cuas-def-kinetic`**, with the Norma
AD-LER anti-drone cartridge on file, and so is Benelli.

So ammunition made to *shoot drones down* is already in scope, by existing precedent, and has been
for some time. The open question is now only about the other direction — warheads that *arm*
drones (EURENCO, Odin Defence, TDW). I have updated
`decisions/batch-04-warhead-supplier-scope.md` to reflect this; it is a narrower and easier call
than it was this morning.

## Exclusions (19)

Ground systems: Armatech Finland, Brasa Defence Systems, NATRIX, Romarm, BAE Systems Hägglunds,
Otokar. Maritime: Belgium Naval & Robotics, Aston Harald Composite, Zparq. Services and holdings:
Avolon (aircraft lessor), B&C Holding, Millog, Sabena Aerospace Engineering. Not UAV/C-UAS:
Hatsan (firearms), Invisio (headsets), Unmanned Airspace (a publication). Outside Europe:
Wayland Autonomy, Sentinel Research and Development, Ukrainian Defense Drones.

Five country attributions were wrong: Wayland Autonomy → United States, Brasa → Latvia,
Millog → Finland, Sentinel R&D → United States, Componentas → Czech Republic.

## Declines (3)

**iCOMAT** — a composites manufacturer TEKEVER names as an industrial partner, but with no
UAV-specific product of its own. Same call as Alloyed in Batch 08. **Eyeonix** — the AV Eagle
joint venture with AeroVironment is *intended* to localise manufacturing; a planned JV is not a
capability, and the AV products are not Eyeonix's. **Neramo Distribution** — won a Romanian
Gendarmerie C-UAS contract but is a distributor, not the manufacturer.

## Held for review (8)

Four UNRESOLVED (Brook Aviation, PBS Group, Steiner, ICI) plus Trinity Robotics, Stratonex,
Componentas and **DroneFlight**. DroneFlight is the interesting one: it is plainly a BVLOS drone
operator, which is in scope, but the only evidence is a trade-press article announcing *plans* and
no official site was found. Cyberhawk and Airspection were admitted last batch on their own sites;
holding DroneFlight keeps that line straight.

## Landscape after Batch 09

| | Before | After |
|---|---|---|
| Verified | 485 | **493** |
| UAV only | 264 | 270 |
| C-UAS only | 186 | 187 |
| Both | 35 | 36 |
| Candidates | 385 | 348 |
| Needs review | 47 | 55 |
| Excluded | 77 | 96 |

Rows 994 → 992, the difference being the two merges. QA clean: V1 = 273 and V2 = 358 unchanged,
zero verified companies failing the eligibility rule, zero redundant unevidenced parents, zero
publication changes.

## Enrichment over three batches

| | After Batch 07 | After Batch 08 | After Batch 09 |
|---|---|---|---|
| Backlog with nothing on file | 214 | 164 | **128** |
| Exclusions that batch | 11 | 16 | 19 |

The exclusion rate is climbing as the enrichment reaches further into the records nobody ever
checked, and those exclusions are permanent. Batch 10 is another 40-row enrichment pass.

## Still waiting on you

1. **The warhead question**, now narrowed to one clean sentence: do warheads that arm drones count,
   given that ammunition which destroys drones already does?
2. **122 excluded or needs-review companies are live on xsonomy.com**, up from 95 after Batch 08 —
   the number grows with every batch because exclusions accumulate and publication never changes.
   The public catalogue currently lists a fashion retailer, a trade magazine, a submarine builder
   and an aircraft lessor as UAV companies. I have changed no publication status; it is your call.
   Say the word and the unpublish list takes me ten minutes.
