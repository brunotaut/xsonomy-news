# UAV360 Research Agent

This directory is the hand-off layer between ChatGPT external research and Claude Code database reconciliation.

## Workflow

1. Claude generates a 40-row research batch in `queue/` and sets `STATE.json` to `READY_FOR_RESEARCH` with `next_actor: chatgpt`.
2. ChatGPT reads the queued CSV from GitHub, performs external research, writes a matching `*-researched.csv` into `researched/`, and changes state to `READY_FOR_RECONCILIATION` / `next_actor: claude`.
3. Claude reconciles the findings against the live database, runs QA/tests, writes the reconciliation CSV and report, regenerates the queue, and hands the next batch back to ChatGPT.
4. Either actor may stop the loop with `HUMAN_DECISION_REQUIRED`; the question goes in `decisions/` and `STATE.json` must describe the blocker.

## Safety

- V1 (273) and V2 (358) are immutable historical snapshots.
- No actor creates V3 unless Nazar explicitly requests it.
- External research is evidence, not a blind import instruction.
- Claude owns live DB reconciliation and mutations. ChatGPT does not mutate Supabase.
- New companies remain draft unless explicitly approved for publication.
- C-UAS structural parents are derived; store specific evidence-bearing leaves, except legitimate evidenced broad-only cases.
- Do not infer product ownership from article co-occurrence.
- Keep aerial UAV distinct from UGV/USV/crewed aircraft; non-aerial companies may still qualify through genuine C-UAS capability.

## File naming

- Queue: `queue/batch-NN.csv`
- Research result: `researched/batch-NN-researched.csv`
- Reconciliation: `reconciled/batch-NN-reconciliation.csv`
- Claude report: `reports/batch-NN-reconciliation.md`
- Human decision: `decisions/batch-NN-<slug>.md`

`STATE.json` is the authoritative hand-off pointer. Actors should not guess the next file from directory contents.
