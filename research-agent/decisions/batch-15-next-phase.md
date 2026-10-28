# Decision needed: what the loop does next

Raised at the end of Batch 15, 2026-10-28. **This one is blocking.** The enrichment loop has run
out of work, and there is no default next batch.

## Where things stand

Fifteen batches, 600 companies researched externally and reconciled independently.

| | Start of run | Now |
|---|---:|---:|
| Verified companies | 273 (V1) | **537** |
| Backlog candidates | 634 | **119** |
| Backlog records with no description | 453 | **0** |
| Companies excluded on the evidence | 0 | **218** |
| Held for review | 18 | **103** |

Every company in the backlog now has a description, a country and, where one exists, a website and
products. There is nothing left to enrich.

## The publication mismatch, measured properly for the first time

I have been reporting one half of this number for five batches. Here is both halves.

| | Count |
|---|---:|
| Verified companies **published** on xsonomy.com | 375 |
| Verified companies **not published** | **158** |
| Excluded or unresolved companies **published** | **292** |

So of the 667 company pages the public site can show from this landscape, **292 are companies this
process judged out of scope or unresolved**, and **158 companies it verified are missing**.

The site is not a smaller version of the landscape. It is a different set.

This matters more than any remaining research. A visitor looking for European counter-drone
companies currently finds a fire-equipment shop, four shipbuilders, two universities, a news
publication and an accelerator — and does not find 158 companies that belong there.

## The three candidates for the next phase

**1. Publication reconciliation.** Bring the public site into line with the landscape: unpublish the
292, publish the 158. Largest effect, entirely within this repository's data, and the only one
visitors would notice. It is a `PUBLISH_STATUS` change, which under rule 4 of `CLAUDE.md` is Nazar's
decision and must be logged — which is why it has never been done.

**2. Merits verification of the 119.** Every remaining candidate now has a description, so they can
be judged without more research. 18 score P1. This is the natural completion of the landscape, but
it adds at most a few dozen companies.

**3. Discovery.** The external audit found **six European companies absent from the database
entirely**: Fly4Future (Czechia), BizGarden, GINA Software (Czechia), 42 Solutions (Netherlands),
Adevex (Spain) and AURYN Aero (Italy), with Aeronautica SDLE unresolved. Those are real gaps, but
six is a small return next to 292 and 158.

A seventh audit candidate, **Drone Band**, turned out not to be a gap at all: it is already in the
database, already verified, and simply **not published** — the same problem as option 1, found from
the outside.

## My recommendation

**Option 1, then option 2.** The publication mismatch is the largest, the most visible and the only
one that is already fully decided on the evidence — every one of those 292 has a written screening
note explaining why it is out of scope, and every one of the 158 passed the eligibility rule.
Nothing further needs researching to act on it.

I will not change a single publication status until you say so.

## The two older questions are still open

- **Warhead and energetics scope** — five companies, raised in five separate batches.
- **Operator and services scope** — eight companies, and it grew in each of the last five batches.
  Batch 15 adds Marshall Aerospace, DSV and INECO as further cases, which would make it eleven.

Neither blocks anything. Both would be cheap to apply once decided.
