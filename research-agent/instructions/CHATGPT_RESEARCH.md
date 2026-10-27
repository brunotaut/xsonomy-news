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

## Mixed VERIFY / ENRICH batches (from Batch 07 onward)

A queue may carry a `task_type` column. Treat the two kinds differently.

**`VERIFY`** — as above: decide whether the company belongs in the European UAV / counter-UAS
landscape and supply evidence for it.

**`ENRICH`** — the database holds nothing but a name and a news mention: no description, no
website, no product. Do not try to reach a verdict. Fill in the basics so the record can be
assessed later:

- `research_website` — the official site, or empty if there genuinely isn't one.
- `research_description` — one factual sentence on what the company makes. No marketing copy.
- `research_products` — named products, each with a one-clause description, separated by `;`.
- `researched_country` — headquarters country.
- `research_verdict` — `IN_SCOPE` / `OUT_OF_SCOPE` / `UNKNOWN` only. `OUT_OF_SCOPE` is a useful
  answer: say plainly when a company has nothing to do with UAV or counter-UAS.
- `research_notes` — flag it here if the row looks like a duplicate of another company.

Both kinds still require `research_evidence_urls`, and the standing rules are unchanged: never
treat appearing in the same article as another company as evidence of anything, quote commas
inside free-text fields, and do not write to Supabase.
