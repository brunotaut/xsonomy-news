# Batch 17 reconciliation — second merits-verification batch

Reconciled 2026-10-28. Input: `research-agent/researched/batch-17-researched.csv` (40 VERIFY rows).
Output: `research-agent/reconciled/batch-17-reconciliation.csv`.

**Verified 548 → 560.** No publication status changed. V1 and V2 untouched.

| | Research recommended | Claude applied |
|---|---:|---:|
| In scope / verified | 11 | **12** |
| Out of scope / excluded | 19 | **19** |
| Unknown / held | 10 | **9** |

Agreement on 39 of 40 — the closest alignment of the run, and the one difference went the other way
from usual: a hold was **upgraded** to an admission.

## The one disagreement

**Liebherr Aerospace** was held as UNKNOWN, and the stated reason was entity mapping — the
manufacturer is *Liebherr-Aerospace Lindenberg GmbH*, a German company, while the research worried
the record might represent the French divisional organisation. **The record is already filed as
Germany.** The mapping question it was held on is already answered in the database.

What is left is a **contracted landing-gear and hydraulic programme for the Eurodrone**, a named
UAV. That is precisely the basis on which **Avio Aero** was admitted in Batch 15 for the Catalyst
1300-ED1 engine on the same aircraft. Admitting one and holding the other would be inconsistent.
Verified.

## A new kind of bad record: the composite label

Two rows were not companies at all, and not in any way seen before:

- **TUBITAK UZAY / ASELSAN** — a programme-participant label joining two organisations with a slash.
- **OHB Italia / Leonardo** — a consortium label, same shape.

Both already exist separately in the database, and **ASELSAN is verified with fifty products**.
These are entity-extraction artefacts that glued two names together because they appeared next to
each other in a contract announcement. Both excluded, and a question about composite labels has
been added to the Batch 18 queue.

## Verified (12)

| Company | Country | What decided it |
|---|---|---|
| **Quantum Frontline Industries** | Germany | manufactures Linza drones under a German-Ukrainian venture |
| **Sees.ai** | United Kingdom | its own full-stack autonomous BVLOS inspection system |
| **Hevi Optronics** | Estonia | HeviTrack-M KENIS integrated counter-UAS platform |
| **Thales Nederland** | Netherlands | SQUIRE's purpose-developed drone detection mode |
| **Leonardo UK** | United Kingdom | Osprey 30 radar integrated on an unmanned helicopter |
| **Photonis Netherlands** | Netherlands | Nocturn cores designed for reconnaissance-UAV integration |
| **Safran Vectronix** | Switzerland | Ultisense LRF 6742, a dedicated counter-UAV rangefinder |
| **Thermoteknix** | United Kingdom | MicroCAM irGO engineered for OEM UAV integration |
| **Bittium** | Finland | Tough SDR Unmanned, a dedicated module |
| **CY4GATE** | Italy | CEWIS, its own airborne intelligence and C2 system |
| **Jenoptik** | Germany | second-generation DLEM counter-UAV ranging modules |
| **Liebherr Aerospace** | Germany | contracted Eurodrone landing gear and hydraulics |

Nine products created, twelve taxonomy rows added.

**Quantum Frontline Industries was recorded as a producer, not an owner.** It manufactures the Linza,
which **Frontline Robotics** designed and which is already verified here. Rather than create a
duplicate Linza, QFI was attached to the existing product as a *manufacturer* through the
product-companies link. The design credit stays where it belongs and the production relationship is
still recorded.

The same discipline ran through the rest: **Hevi Optronics** was admitted for its own integrated
platform while the underlying KENIS sensor stayed with **HENSOLDT**; **Oxford Space Systems** was
excluded partly because the drone testing it cites uses **Quadsat** equipment, and Quadsat is
verified here separately.

## Excluded (19) — and what they say about the queue

Nine of the nineteen are **space**: Thales Alenia Space, ICEYE Poland, Kongsberg NanoAvionics, KSAT,
GomSpace, KP Labs, Oxford Space Systems, TUBITAK UZAY and the composite TUBITAK label. The scoring
model has no notion of altitude: a synthetic-aperture radar reads the same whether it flies at
400 metres or 400 kilometres.

The rest are general-purpose sensing — InfraTec thermography, Valeo automotive LiDAR, Ekspla
industrial lasers, Living Optics (whose own support page says no UAV integration pack is purchasable),
NL Acoustics, Meopta, Pro Optica, Opticoelectron — plus Droneflykart, which its own privacy
statement calls a voluntary project rather than a company.

Two near-miss name collisions were caught: **Opticoelectron** is not **OPTIX** of Bulgaria, verified
in Batch 13; **Pro Optica's** ARTEMIS is not NATO's ARTEMIS prototype.

## QA gate

| Check | Result |
|---|---|
| `included` rows failing the eligibility rule | **0** |
| Publication status written by this batch | **none** |
| V1 / V2 frozen snapshots | **273 / 358** |
| Redundant unevidenced parent sectors | **0** |
| Status applied to every row of the batch | **40 of 40** |

## Batch 18 finishes the pool

Backlog **79 → 39**. Four are held for the warhead decision, so **35 remain**, and Batch 18 takes all
of them.

The question mix has flipped again. Batch 17 was dominated by the sensors-domain question; in
Batch 18 it is **21 of 35 with a website but no product on file** — companies that look plausible
and have never had anything named attached to them. Nine are sensors-domain cases and four have
products with no capability assigned.

**Batch 18 is queued: `research-agent/queue/batch-18.csv`** — 35 rows, 13 countries, with one
question added after this batch: *is this record a composite label joining two organisations?*

After it, every backlog candidate will have an evidence-based disposition, and the only records
without one will be the four held for the open warhead decision.
