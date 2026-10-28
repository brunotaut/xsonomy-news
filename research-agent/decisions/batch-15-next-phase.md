# Next phase: merits verification authorised

## RESOLVED — user decision, 2026-10-28

Nazar instructed: **«закінчуємо перевірку»** in response to the choice between preparing 158 verified companies for publication and completing verification of 119 remaining candidates.

Selected next phase: **finish merits verification of the remaining backlog** (option 3). The next-phase blocker is resolved. This authorisation persists across the following verification batches; do not ask for the same phase choice again.

### Next action for Claude
1. Read the current live candidate backlog and generate `research-agent/queue/batch-16.csv` with up to 40 VERIFY rows, starting with the 18 P1 candidates and then the highest-priority remaining candidates.
2. Include existing evidence, canonical/related entities, products and the specific unresolved eligibility question for each row. These are merits checks, not another description-enrichment pass.
3. Set STATE to batch16, READY_FOR_RESEARCH, next_actor chatgpt, with the actual queue path and expected research output.
4. Continue the existing research/reconciliation handoff until all remaining candidates have an evidence-based disposition. At the current count this is approximately three batches (40/40/39); merges or refreshed counts may change that.
5. Cases dependent on the two older scope decisions remain explicitly held; completion means an honest disposition, not forced admission/exclusion or repeated re-queuing without new evidence.

Publication, broad catalogue cleanup and new-company discovery were not selected. Keep publication statuses and frozen snapshots unchanged. Finish with a report of verified/excluded/held outcomes and remaining policy-dependent cases.

---

## Historical decision request (superseded by resolution above)

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

## The publication picture, corrected

I reported for five batches that a growing number of rejected companies were live on xsonomy.com
and called it the project's biggest problem. A concurrent check of the live site shows that was
wrong, and the correction changes what I recommend.

**The public landscape page is clean.** `xsonomy.com/data/landscape.json` holds exactly the 375
verified-and-live companies. Of 253 excluded and needs_review records checked against it, **none
appeared**. The build gate requires both landscape membership and `publication_status = live`, and
it does its job.

`publication_status = live` on a rejected record governs the **wider site catalogue** — about 2,300
companies, not scoped to this landscape. A shipbuilder being out of scope for a European UAV
landscape is not a reason to delete it from a site-wide catalogue.

| | Count |
|---|---:|
| Verified and on the landscape page | 375 |
| **Verified but NOT on the landscape page** | **158** |
| Out-of-scope records live in the wider catalogue | 292 |
| — non-companies and extraction errors among them | about 21 |
| — legitimate companies in other industries | about 271 |

The genuine, one-sided problem is the **158**. They passed the eligibility rule and are invisible
on the landscape page. The external audit found one of them from outside without realising:
**Drone Band** was flagged as a missing company and is in fact verified and sitting in draft.

The roughly 21 extraction errors — a government procurement platform, two news publications, an
NGO, an accelerator, two universities, a grenade launcher recorded as a company — do not belong in
any catalogue and are worth removing on their own merits.

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
