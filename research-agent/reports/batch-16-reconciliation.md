# Batch 16 reconciliation — first merits-verification batch

Reconciled 2026-10-28. Input: `research-agent/researched/batch-16-researched.csv` (40 VERIFY rows).
Output: `research-agent/reconciled/batch-16-reconciliation.csv`.

**Verified 537 → 548.** No merges. No publication status changed. V1 and V2 untouched.

| | Research recommended | Claude applied |
|---|---:|---:|
| In scope / verified | 13 | **11** |
| Out of scope / excluded | 13 | **13** |
| Unknown / held | 14 | **16** |

Agreement on 38 of 40. The two differences are both cases where the research's own wording
undercut its verdict.

## The two disagreements

**Bulba** came back IN_SCOPE, and the same sentence said it is *"a manufacturer's brand for own
counter-drone electronic-warfare systems, not an independent legal company name"*. The capability is
real; the record is not a company. Admitting it would repeat the **Bullspike** error from Batch 12,
where a grenade launcher had been entered as a company. The named manufacturer, Servis Budtrans,
has no record here. **Held** until the legal entity is resolved.

**Fulltime Robotics** came back IN_SCOPE with the maturity field reading *"prototype/demonstration,
not proven fielded"*. That is the planned-versus-delivered rule that held Frenel Imaging, Dryad
Networks and Asseco Poland. **Held.** Its only cited link was a LinkedIn post, which was not
recorded as a website.

## What the queue's new question field did

Each row carried one specific question instead of a request for prose. It worked: every one of the
40 came back with a direct answer, and the questions that were structural got structural answers.

**The root-UAV-tag problem resolved cleanly.** Twelve Ukrainian records were tagged with the bare
root `uav` category, carrying no website, product or source — tags somebody typed during a directory
import, not evidence. Of those twelve:

- **four were real and are now verified** with a capability leaf and named products: Ukropter
  (UKROPTER Drone), BeetechUA (BOMBUS, WireDO), Celebra (LAURUS FPV), Twist Robotics (OSCAR, OBRIY,
  STEZHKA);
- **eight could not be confirmed** — SKYD, SMART UAV TECHNOLOGY, UP Innovations, Vinnytsia Avionics,
  Tekhnary, RIY, PRO drones and Bulba.

**The unevidenced root `uav` tags were deleted** from every candidate that still carries them. They
were asserting membership the evidence does not support, and they would have made the admitted four
fail the redundant-parent check once real leaves were added.

## Verified (11)

| Company | Country | What decided it |
|---|---|---|
| **Ukropter** | Ukraine | UKROPTER Drone, own platform in two configurations |
| **BeetechUA** | Ukraine | BOMBUS and the WireDO communications system |
| **Celebra** | Ukraine | LAURUS FPV line under direct contracts |
| **Twist Robotics** | Ukraine | OSCAR, OBRIY, STEZHKA navigation, comms and simulation |
| **Creotech Instruments** | Poland | GREY, a commercial BVLOS route-planning portal |
| **Squadron** | Poland | its own UAV Fleet Management solution |
| **Tekne** | Italy | J4SKY-T and J4EAD-T anti-UAV electronic warfare |
| **smartmicro** | Germany | Drone Altimeter, a dedicated variant in full production |
| **PCO S.A.** | Poland | TCKM-1 thermal sight with a stated counter-drone purpose |
| **Senop** | Finland | HSC-2 engineered for lightweight aerial imaging |
| **AIM Infrarot-Module** | Germany | HiPIR-Engine and eSWIR 640/10 for small UAV gimbals |

Sixteen products created, thirteen taxonomy rows added, four aliases recorded (Bravery Invest,
BeeTA Technologies, Celebra Tech, Aerotechnica-MLT).

The sensor cases divided exactly where the Batch 13 rule says they should. smartmicro, PCO, Senop
and AIM each have a **named variant engineered for drones**. Acconeer, Blickfeld and ams OSRAM have
general-purpose parts that appeared in a drone demonstration. Same industry, opposite answers.

## Ownership checks against the live database

- **Grupo Oesía** excluded as a parent group: its autopilots belong to **UAV Navigation SLU**, which
  is already verified here and already carries the alias *UAV Navigation-Grupo Oesia*.
- **FLANQ** held: the ORKA UAS it integrates is already recorded under **CiS**, with ORKA, ORKA Dock
  and ORKA Dock Mini.
- **TNO** excluded on entity type: **Destinus** and **Robin Radar**, its industrialisation partners,
  are both already verified here and own the products.
- **PRO drones** (Ukraine) kept distinct from **Prodrone** (Japan), a separate record.
- **Twist Robotics' OBRIY** was given its own slug: an unrelated *Obriy 2.0* belongs to Kara Dag.

## Excluded (13)

Two research organisations — **DLR** and **TNO** — excluded on entity type rather than technology,
on the rule that removed universities in Batch 15. Both genuinely build and test unmanned aircraft.

The rest: industrial acoustics (gfai tech, Distran), tactical radios (Himera), satellites (ICEYE),
general components (Acconeer, Blickfeld, ams OSRAM), guided missiles (EuroSpike), optical-sight
protection (Brolis), an AI business (Offset Labs) and a parent group (Grupo Oesía).

## QA gate

| Check | Result |
|---|---|
| `included` rows failing the eligibility rule | **0** |
| Publication status written by this batch | **none** |
| V1 / V2 frozen snapshots | **273 / 358** |
| Redundant unevidenced parent sectors | **0** |
| Status applied to every row of the batch | **40 of 40** |

## What is left, and an honest note about it

Backlog **119 → 79**. Of those, four are held for the warhead decision, leaving **75** to verify.

**The top of the pool is gone.** Batch 16 took every candidate above the P4 floor:

| | Before batch 16 | After |
|---|---:|---:|
| P1 | 18 | **0** |
| P2 | 12 | **0** |
| P3 | 19 | **1** |
| P4 | 70 | **74** |

Everything remaining is weak-signal. That does not mean they are all out of scope — Celebra and
Ukropter scored P1 only because of a tag that turned out to be meaningless, while four genuine
companies in this batch came in from lower bands. But the expected admission rate from here is low,
and two batches of 40 and 35 should finish the pool.

**Batch 17 is queued: `research-agent/queue/batch-17.csv`** — 40 rows, 17 countries. The question
mix has shifted: **34 of 40 are tagged only under the general sensors domain**, outside the UAV and
counter-UAS trees. That single question now dominates what is left. One question was added to the
researcher's list after Bulba: *is this record a BRAND of another manufacturer?*
