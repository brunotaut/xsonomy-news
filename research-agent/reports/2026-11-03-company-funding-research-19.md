# Company funding research checkpoint 19 — 2026-11-03

## Result

Twenty further published European landscape identities were source-audited. Eleven attributable financing, grant, debt or ownership events for eight companies were approved and imported after a production rollback rehearsal. The database moved from 353 to 364 approved events, from 204 to 212 companies with approved events, from 700 to 717 event participations and from 563 to 571 investor profiles.

The manifest is `research-agent/imports/company-funding-research-19-2026-11-03.json`. Research remains partial; an empty result is a bounded public-source disposition, not evidence that a company raised no money.

## Reviewed identities

| Company | Disposition | Evidence outcome |
|---|---|---|
| Lyocon | partial, 1 event | Nuburu's completed 2026 acquisition recorded at USD2m contractual consideration; contingent earnout and accounting fair-value adjustments excluded. |
| Malloy Aeronautics | partial, 1 event | BAE Systems' 2024 acquisition recorded at GBP60m cash consideration; working-capital adjustments and contingent consideration excluded. |
| Marble Aerospace | source_review_partial | Secondary databases list early grants and seed events, but no issuer, investor or award-party source established event-level attribution. |
| Marlborough Communications | partial, 2 events | Cohort's 2014 majority acquisition and 2017 remaining-stake purchase recorded separately as secondary ownership transactions. |
| Marshall Land Systems | partial, 2 events | Flowing River's 2025 acquisition and Eden Rock's 2026 debt raise recorded with undisclosed amounts. |
| MARSS Group | partial, 1 event | EOS's 2026 acquisition recorded at USD36m upfront cash; contingent earnout excluded. |
| Maximus Labs Romania | reviewed_public_sources | Company and product sources did not establish an attributable closed financing event. |
| MaXon Systems | source_review_partial, 2 events | 2025 pre-seed recorded at investor-reported USD300k and 2026 round at undisclosed amount; a conflicting USD350k secondary figure remains flagged. |
| MBDA | reviewed_public_sources | Current ownership and merger history checked; no dated attributable issuer financing event established. |
| MBDA Deutschland | reviewed_public_sources | Subsidiary sources did not establish separately attributable external financing. |
| MBDA France | reviewed_public_sources | Wholly owned subsidiary sources did not establish separately attributable external financing. |
| MBDA Italia | source_review_partial | Proposed EUR17.7m public support remained subject to appraisal; no closed award established. |
| MBF Group | source_review_partial | Target raise of at least PLN20m remained open with no binding financing agreements. |
| MC2 Technologies | partial, 1 event | Completed 2021 more-than-EUR50m transaction recorded as mixed Andera/Bpifrance equity and Tikehau unitranche debt. |
| MDSI | reviewed_public_sources | Company and registry searches produced no attributable financing; same-name foreign-company results were excluded. |
| Mehler Protection | source_review_partial | DPE's 2020 group acquisition was not assigned to the subsidiary identity. |
| Meridian (S.P. Korolev Meridian) | reviewed_public_sources | State and corporate ownership checked; registry ownership was not treated as financing. |
| MESKO | partial, 1 event | PLN400m Reprivatisation Fund contribution to Project 400 recorded; MESKO's PLN66.7m own investment excluded. |
| METEKSAN Defence | reviewed_public_sources | Bilkent Holding group ownership checked; no separately attributable external financing event established. |
| Metis Aerospace | source_review_partial | Government-backed research funding and share allotments lacked attributable award amounts or proceeds. |

## Validation

- Tested importer accepted all 11 manifest events.
- Production rollback rehearsal completed successfully before the write and baseline remained 353 / 204 / 700 / 563.
- Atomic production import resolved all 11 events; an immediate rerun was idempotent.
- Post-import counts: 364 approved events, 212 covered companies, 717 participations and 571 investor profiles.
- Original currencies, public date precision and amount qualifiers were retained.
- Equity, debt, grants and secondary acquisition consideration remain separately typed.
- Open raises, contingent earnouts, issuer spending, registry capital, programme proposals and group-level financing misattributable to subsidiaries were excluded.

## Principal sources

Transaction-party, official and regulated sources include SEC filings, BAE Systems results, Cohort announcements and results, Marshall Group, Kroll, Electro Optic Systems, Freedom Fund, Bpifrance, Andera Partners and MESKO. Secondary reporting was used only for explicitly named participants or company statements and never to invent undisclosed amounts, unsupported lead roles or subsidiary proceeds.

## Publication

Catalogue rebuild and live payload verification are tracked separately. Database success alone is not claimed as publication.
