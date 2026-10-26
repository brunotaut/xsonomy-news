# Claude Reconciliation Protocol

When `research-agent/STATE.json` has `next_actor: claude`:

## If status is AWAITING_BATCH_*_FROM_CLAUDE
Finish the current reconciliation task, then generate the specified next batch and place it in `research-agent/queue/`.

## If status is READY_FOR_RECONCILIATION
1. Read the exact researched CSV path in `input`.
2. Reconcile every row against live names, aliases, domains, products, relationships, country and evidence.
3. Never blind-import ChatGPT verdicts or taxonomy suggestions.
4. Audit product ownership and physical domain (aerial vs ground vs maritime vs crewed).
5. Preserve derived-parent taxonomy architecture. Store specific evidenced leaves; broad-only only when genuinely supported and modality is unknown.
6. Recompute verification using the existing eligibility rule; never mark verified by hand just because research says INCLUDE.
7. Do not automatically publish newly verified companies.
8. Run QA/tests and confirm V1=273 and V2=358 unchanged.
9. Write `reconciled/batch-NN-reconciliation.csv` and `reports/batch-NN-reconciliation.md`.
10. Regenerate research priorities from the updated live DB and create exactly 40 rows in `queue/batch-(NN+1).csv`, unless a human decision blocks safe continuation.
11. Update `STATE.json` to `READY_FOR_RESEARCH`, `next_actor=chatgpt`, `input=<new queue>`, `expected_output=<new researched path>`.

## Human decisions
If reconciliation requires a policy decision rather than an evidence decision, do not guess. Write `decisions/batch-NN-<slug>.md`, set `status=HUMAN_DECISION_REQUIRED`, `next_actor=human`, and describe the blocker in STATE.

## Fixed boundaries
- V1 and V2 immutable.
- No V3 without Nazar's explicit instruction.
- No global maturity enrichment or unrelated cleanup inside a batch.
- Do not expand the Landscape beyond aerial UAV + Counter-UAS without explicit policy approval.
