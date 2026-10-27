# Batch 10 reconciliation — third enrichment batch

Date: 2026-10-27
Input: `research-agent/researched/batch-10-researched.csv`
Output: `research-agent/reconciled/batch-10-reconciliation.csv`
Queue produced: `research-agent/queue/batch-11.csv`

## Headline

**Verified passed 500** — 493 → **504 (+11)**, the best enrichment yield so far. All forty records
now carry a description, and the no-data backlog is down to **91** from 214 three batches ago.

| Outcome | Count |
|---|---|
| Admitted to landscape | 11 |
| Excluded | 14 |
| Held for review | 7 |
| Declined, stays a candidate | 7 |
| Merged into an existing record | 1 |
| **Total** | **40** |

Input was clean: 40 rows, exact queue match, no field shifts, every evidence cell a URL.

## The entity-type question earned its place

It was added to this queue after Batch 09 turned up a trade publication filed as a UAV company.
In forty records it caught: a **ropeway manufacturer** (Bartholet), a **military recruitment
agency** (Ex-Mil Recruitment, also filed under the wrong country), an **investment holding company**
(Armira), a **charter airline** (Avanti Air), an **armoured vehicle joint venture** (ARTEC) and a
**historic aircraft brand** that has not existed as a company for years (Fokker, merged into GKN
Aerospace).

Six of forty. That is the clean-up rate the enrichment pass is really buying.

## Admissions (11)

The strongest batch yet for genuine industry entries:

- **Hyllus Systems** (NL) — HS4 tactical UAVs and the HS Trident 300 interceptor, corroborated by a
  partnership with Robin Radar, which is already verified here.
- **BLACKTEQ** (DE) — COBRA-E and COBRA-T loitering munitions, stated on its own site.
- **Orbion Technologies** (NL) — airborne sense-and-avoid radar plus ground-based drone detection.
- **SwissP Defence** (CH) — SHATTER4K anti-drone ammunition, following the Norma and Benelli
  precedent settled last batch.
- **Dronus** (IT) — NEST drone-in-a-box infrastructure and the Randon-N UAV, in the ENAC registry.
- **Swisscom Broadcast** (CH) — drone operations plus a modular drone detection solution. Tagged
  detection only; Swisscom does not say what the "defence" half does, so I did not guess.
- **Venetz Aerospace** — certified electric UAS propulsion with UK CAA Part 21J approval. Filed as
  Swiss; it is British.
- Plus **Terra Inspectioneering**, **ELSON Space**, **Aiviewgroup** and **Diehl Aerospace**.

Twelve products and nineteen taxonomy rows added, each with its evidence URL.

## Declines, and why they are not rejections

Seven companies stay candidates, and five of them for the same reason: **the capability is
announced, not delivered.** Skeleton Technologies has an MoU to put its power systems into
counter-UAS interceptors. Odense Maritime Technology has an MoU to integrate the Destinus Hornet.
Tekne has run laser counter-UAS tests that are explicitly not yet qualified. DroneVia is a market
partner for someone else's aircraft.

Every one of these may well be admissible in six months. None of them is today.

The other two are parent-company double counts, the same pattern as Grupo Oesía in Batch 08:
**Beretta Defense Technologies** holds nothing of its own — Benelli and SwissP Defence do — and
**Diehl Aviation**'s unmanned contribution belongs to the Diehl Aerospace joint venture that was
admitted in this batch.

## A new scope question for you

**Unmanned4you** (Italy) is an ENAC-registered professional drone operator that flies a
FlyingBasket FB3 and DJI aircraft. Real company, real authorisation, nothing of its own.

The landscape already includes five operators — Manna, Apian, Cyberhawk, Airspection,
Aiviewgroup — but every one of them has a proprietary network, platform or regulatory first.
Unmanned4you does not. There are thousands of companies across Europe in exactly its position.

I held it for review and wrote the question up in
`decisions/batch-10-drone-operator-scope.md`. My recommendation is option 2: operators count when
they have something of their own, which is the rule the landscape has been following already
without anyone writing it down.

## Landscape after Batch 10

| | Before | After |
|---|---|---|
| Verified | 493 | **504** |
| UAV only | 270 | 277 |
| C-UAS only | 187 | 188 |
| Both | 36 | 39 |
| Candidates | 348 | 315 |
| Needs review | 55 | 62 |
| Excluded | 96 | 110 |

QA clean: V1 = 273 and V2 = 358 unchanged, zero verified companies failing the eligibility rule,
zero redundant unevidenced parents, zero publication changes.

## Enrichment is close to done

| | After 07 | After 08 | After 09 | After 10 |
|---|---|---|---|---|
| Backlog with nothing on file | 214 | 164 | 128 | **91** |
| Admissions | — | 7 | 8 | **11** |
| Exclusions | — | 16 | 19 | 14 |

**94 never-researched blank records remain.** Batch 11 takes 40 of them and Batch 12 would take
the next 40, so the enrichment runway is about two and a half more batches. After that the backlog
is 315 records that all have *something* on file and still score P3 or below — a different problem,
and worth deciding what, if anything, it is worth.

## Three things waiting on you

1. **Warhead scope** — do warheads that arm drones count, given ammunition that destroys drones
   already does? (EURENCO, Odin Defence, TDW.)
2. **Operator scope** — new this batch, written up in `decisions/batch-10-drone-operator-scope.md`.
3. **143 excluded or needs-review companies are live on xsonomy.com**, up from 122 after Batch 09.
   The public catalogue currently lists a fashion retailer, a trade magazine, a ropeway maker, a
   military recruitment agency and a charter airline as UAV companies. I have changed no
   publication status. This one gets worse every batch and it is the only one costing you anything
   visible.
