# Merits verification complete — final report on batches 16, 17 and 18

Date: 2026-10-29. Authorised by Nazar on 2026-10-28
(`research-agent/decisions/batch-15-next-phase.md`, «закінчуємо перевірку»).

**Every backlog candidate in the European UAV & Counter-UAS landscape now has an evidence-based
disposition.** The phase goal is met. Nothing was published, unpublished, deleted or discovered;
none of that was authorised and none of it was done.

## Where the landscape stands

| | Start of phase | Now |
|---|---:|---:|
| Verified | 537 | **567** |
| Undecided backlog candidates | 119 | **4** |
| Held for review, with a written reason | 104 | 140 |
| Excluded | 217 | 266 |
| Rows in the landscape | 977 | 977 |

The four remaining candidates are **not** unresolved research. They are **EURENCO, Odin Defence,
TDW and Teledyne Energetics** — warhead and energetics suppliers parked against an open scope
question that only Nazar can answer. A fifth case, **Wolfram Europa**, is filed under
`needs_review` rather than `candidate`, which is why the live count reads four and the policy list
reads five. No research pass can close these; they need a decision about whether a company that
supplies the explosive in somebody else's loitering munition belongs in a drone landscape.

Verified companies by country, top of the list: Ukraine 94, United Kingdom 75, France 56,
Germany 48, Poland 46, Italy 24, Denmark 22, Switzerland 20, Czech Republic 19, Netherlands 19.

## The three batches

| | Batch 16 | Batch 17 | Batch 18 | Total |
|---|---:|---:|---:|---:|
| Rows | 40 | 40 | 35 | **115** |
| Verified | 11 | 12 | 7 | **30** |
| Excluded | 13 | 19 | 17 | **49** |
| Held with a reason | 16 | 9 | 11 | **36** |
| Agreement with the research | 38/40 | 39/40 | 33/35 | **110/115** |
| Products created | 16 | 9 | 7 | **32** |
| Taxonomy rows added | 13 | 12 | 8 | **33** |

Five disagreements in 115 rows. Two declined admissions recommended by research (Bulba, a brand, and
Fulltime Robotics, a prototype, in Batch 16). One changed a hold to exclusion
(Diehl Aviation in Batch 18). Two **upgraded** a hold to an admission (Liebherr Aerospace, Grupo
Amper) — in both cases because the entity question the hold rested on was already answered by the
database, which the external research could not see.

## What the phase actually found

**The backlog was not a queue of unknown companies. It was a queue of bad records.**

Going in, the assumption was that 119 candidates needed research. What they mostly needed was
reading against the database. Three defect classes account for most of the exclusions:

**Composite labels** — three found, all new to this run. *TUBITAK UZAY / ASELSAN*,
*OHB Italia / Leonardo*, *Thales Alenia Space Italia / e-GEOS*. Two organisations glued together
with a slash by the entity extractor because their names appeared next to each other in a contract
announcement. In every case both constituents already existed separately, and in one case
(ASELSAN) the constituent was verified with fifty products.

**Wrong domain** — space and underwater. Batch 17 excluded nine space companies; Batch 18 excluded
seven underwater or ground-vehicle companies and two more space ones. The scoring model has no
notion of altitude or depth: a synthetic-aperture radar reads the same at 400 metres and
400 kilometres, and *UAS* in "Underwater Armaments & Systems" is not an unmanned aircraft.

**Products filed under the wrong company** — five of them in Batch 18 alone, after one in Batch 17
and several in Batch 16. The worst was **CS Group**, a verified French counter-UAS company whose single
recorded product was MBDA's MISTRAL 3 missile, while the counter-drone system it has actually sold
since 2015 was missing entirely. Both halves are now right. **Threat-Sense** had no owner at all.
**Tactical Core Middleware** sat under a parent while the subsidiary's own record named it.

## What this phase did not do, and could not

**Publication was not touched.** No company's `publication_status` was changed at any point in
eighteen batches. The landscape page continues to show verified-and-live companies only.

**The one-sided gap is still open and has grown.** **162 verified companies are not published** and
therefore do not appear on the public landscape page. That is the clearest, lowest-risk piece of
work left, and under rule 4 of CLAUDE.md it is Nazar's decision, not mine.

**Two scope questions are still open** and have been for most of the run:
- **Warhead and energetics suppliers** — five companies, first raised in Batch 04.
- **Operators and service companies** — eleven companies, first raised in Batch 10. Batch 18 added
  DroneVia to the same pattern.

**One observation outside this phase's remit.** The wider catalogue holds **966 product records
with no company attached**. Threat-Sense was one of them and is now fixed, but it was found by
accident. That is a site-wide data-quality problem, not a landscape one, and nothing in this phase
authorised touching it. Flagging it, not acting on it.

## The run in total

Eighteen batches. **715 companies researched and reconciled.** Verified 273 at the V1 snapshot,
**567 now**. Backlog 634 at the start, **4 now**, and those four are waiting on a human decision
rather than on evidence. Records with no description at all: 453 at the start, **0 now**.

V1 remains 273 rows and V2 remains 358 rows. Neither has been modified at any point.

## What should happen next

Not another batch. The verifiable pool is empty, and manufacturing a batch 19 out of records that
are already dispositioned would be make-work. The next move is one of Nazar's three decisions:

1. **Publish the 162 verified-but-unpublished companies.** One-sided, low risk, and the only thing
   standing between work already done and the public site.
2. **Answer the two scope questions** — warheads and operators — which together release sixteen
   held companies to a final disposition.
3. **Clean the wider catalogue**, starting with the ~21 entity-extraction errors already identified
   and, separately, the 966 ownerless products.

Discovery — the six companies the external audit showed are genuinely absent — remains unstarted
and unauthorised.
