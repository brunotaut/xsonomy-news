# ChatGPT External Research Protocol

When `STATE.json` has `next_actor: chatgpt`:

1. Read the exact CSV path in `input`.
2. Research every row externally; do not rely on keyword matching alone.
3. Prefer official company/product pages, government/defence ministries, NATO/EU, corporate registries and authoritative defence/aerospace sources. Use secondary press for corroboration.
4. Resolve canonical entity, country, aerial-vs-ground/maritime/crewed domain, UAV/C-UAS role, product ownership, suggested specific taxonomy, confidence and evidence URLs.
5. Use conservative verdicts. Distinguish primary-source verified findings from weaker evidence.
6. Do not mutate Supabase or frozen snapshots.
7. Write the result to `researched/batch-NN-researched.csv` with the original columns preserved plus research fields.
8. Update `STATE.json`: `status=READY_FOR_RECONCILIATION`, `next_actor=claude`, `input=<researched file>`, `expected_output=<reconciliation file>`.
9. If a policy/entity decision cannot safely be made, create a decision note and set `HUMAN_DECISION_REQUIRED` rather than guessing.

Minimum appended fields:
`research_verdict,research_confidence,researched_country,recommended_taxonomy,research_summary,research_evidence_urls,research_notes`.

Research recommendations are not database commands. Claude must independently reconcile them.
