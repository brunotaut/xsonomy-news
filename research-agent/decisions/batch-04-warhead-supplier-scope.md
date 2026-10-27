# Decision needed: do warhead / energetic-materials suppliers belong in the UAV ecosystem?

Raised during Batch 04 reconciliation, 2026-10-26; a third company was added in Batch 08,
2026-10-27. **Not blocking** — all three are candidates with no taxonomy, so the loop continues. This needs Nazar's call, not more research.

## The question

Three companies supply **warheads and energetic materials for drones**, and nothing else ties them
to the Landscape:

| Company | Country | Evidence |
|---|---|---|
| **EURENCO** | France | Energetic-materials and munitions supplier; its DEMON line is reported as arming drones. |
| **Odin Defence** | Estonia | Explosives manufacturer; RagnaRasa is a joint industrial project for drone and loitering-munition warheads. |
| **TDW** | Germany | Warhead and effector developer; supplies the warhead system for STARK's Gambit loitering munition. Added during Batch 08, 2026-10-27. |

None of them builds an airframe, a sensor or a counter-drone system.

## Why it is a policy question, not an evidence one

The evidence is clear in all three cases. What is unclear is the scope boundary.

**Arguments for including them** (as `eco-payloads` or `eco-components`):
- The Landscape already admits UAV component suppliers that build no aircraft: Volz Servos
  (flight-control actuators), siliXcon (motor controllers), Turkish Engine Industries (engines),
  Aktyvus Photonics (laser designators), YellowScan (LiDAR payloads).
- A warhead built specifically for loitering munitions is as UAV-specific as an actuator.

**Arguments against:**
- Every component admitted so far helps the aircraft **fly or sense**. A warhead is the munition
  the aircraft delivers, which is arguably the weapons domain rather than the UAV domain.
- All three are primarily munitions companies; drone warheads are one product line among many.
  Admitting them invites every ammunition maker with a drone-adjacent product.
- EURENCO and Odin Defence have no *delivered* drone-warhead product: DEMON is reported and
  RagnaRasa is a "joint industrial project". TDW's Gambit warhead is delivered and named.

## What I did

Left all three as **candidates with no taxonomy** — the conservative default. Nothing is lost
either way and the decision is cheap to apply later.

TDW is the strongest of the three: the Gambit warhead is a delivered, named, drone-specific
product, so option 3 (case by case) would now admit TDW while still excluding EURENCO and
Odin Defence.

## Narrowed by Batch 09

Batch 09 returned **Norma Precision** as a fourth apparent case: it makes the cartridge for
Benelli's A.I. Drone Guardian counter-UAV shotgun. It turned out to be a duplicate of **Norma**,
which **has been verified in this landscape all along** under `cuas-def-kinetic`, with the
Norma AD-LER anti-drone cartridge as its product. **Benelli** is verified on the same basis.

That settles half the question by precedent. Ammunition made specifically to *shoot drones down*
is already in scope and has been for some time. What remains open is narrower and cleaner:

> **Do warheads that arm drones count, when ammunition that destroys drones already does?**

EURENCO, Odin Defence and TDW are all on the arming side. Nothing in the landscape yet sets a
precedent for them either way.

## What I need

One of:

1. **In scope** — admit all three under `eco-payloads`, and the rule becomes "UAV-specific munitions
   components count".
2. **Out of scope** — exclude all three, and the rule becomes "components must serve flight, sensing
   or counter-drone function, not weapons payload".
3. **Case by case** — admit only where a delivered, named, drone-specific product exists, which
   today would admit TDW and neither of the other two.

Whichever you pick, I will apply it to all three companies and record it as Landscape policy so
future batches do not re-raise it. This has now come up in two separate batches; each new
warhead supplier costs another round of this question.
