# Verification phase — how batches 16 onward differ

Authorised by Nazar on 2026-10-28 (`research-agent/decisions/batch-15-next-phase.md`).
Enrichment is over. The remaining 119 backlog candidates all have descriptions. What is missing is
a **decision** on each one, not more text.

## What changed in the queue

A VERIFY row is not an ENRICH row. Each carries:

- **`description_on_file`** — already written. Do not rewrite it unless it is wrong.
- **`current_taxonomy`**, **`products_on_file`**, **`article_signals`** — everything the database
  already knows.
- **`unresolved_eligibility_question`** — the single specific thing blocking a decision on this
  company, computed per row. Five kinds appear in Batch 16:

| Question | Rows in batch 16 | What it means |
|---|---:|---|
| Tagged only under the general **sensors** domain | 18 | sits outside the UAV and counter-UAS trees, so it cannot be verified as tagged |
| Tagged with the **root UAV** category only | 12 | a directory import with no website, product or source — the tag is an assertion, not evidence |
| **Website but no product** | 6 | needs a named owned product, or a plain statement that it owns none |
| **No website, no product, no tag** | 2 | needs the legal entity confirmed before anything else |
| **Products but no capability assigned** | 2 | needs each product classified |

## Standing rules, unchanged

Everything from the enrichment phase still applies: ownership before admission, planned versus
delivered, operating country separate from parent country, non-companies excluded, duplicates
checked against the live database including local-language names.

## What is deliberately NOT in this queue

Companies held for the two open scope decisions are **excluded from verification batches**, because
they turn on policy and not on evidence. Re-researching them would produce the same answer again.
Batch 16 omits **Odin Defence, EURENCO and TDW** for this reason.

They will be dispositioned when Nazar answers the warhead and the operator/services questions, not
before.

## What "finished" means

An honest disposition for every remaining candidate: verified, excluded, or held with a written
reason. Not forced admission, not forced exclusion, and not re-queuing the same record without new
evidence. About three batches at 40 a batch.

No publication status changes. No frozen-snapshot changes. V1 and V2 stay immutable.
