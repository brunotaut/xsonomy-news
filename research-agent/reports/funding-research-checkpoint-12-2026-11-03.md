# Funding research checkpoint 12 — 3 November 2026

## Outcome

- Reviewed 20 published European landscape identities.
- Imported 17 verified events for 13 companies after a successful production rollback rehearsal.
- Database totals after the atomic, idempotent import: 264 events, 606 round participations, 498 investor profiles, 144 companies with events and 346 event sources.
- Fully reviewed cohort: 162 of 2,564 identities. Published-first queue remaining: 405 identities.
- No source candidate or empty structured row was treated as proof of zero funding.

## Imported events

| Company | Verified event(s) |
|---|---|
| CRFS | 2025 Motorola Solutions acquisition, consideration undisclosed |
| CS Group | 2023 Sopra Steria majority acquisition, consideration undisclosed |
| CSG Group | 2026 IPO, EUR750m primary proceeds separated from secondary offering |
| CTech | 2018 Turkish Aerospace acquisition, terms undisclosed |
| Cubert | 2025 Emtek majority investment, terms undisclosed |
| CY4GATE | 2020 EUR21.13m IPO; 2022 EUR90m capital increase |
| Cyberhawk | 2019 investment with GBP2.1m CT contribution; 2026 approximately USD125m Ondas acquisition consideration |
| D-Flight | 2019 EUR6.6m capital increase |
| Dares Technology | 2026 Indra acquisition, terms undisclosed |
| DASAL | 2024 Altınay acquisition of remaining 49%, terms undisclosed |
| DefendEye | 2025 USD1.2m round; 2026 undisclosed NovaCapital-led round |
| Deutsche Telekom | 1996 EUR10.0bn DT1 IPO; 1999 EUR10.8bn DT2 primary offering |
| DK UNITY | Signed EUR908,289.03 ERDF/state support ceiling |

## Reviewed without an attributable event

Dassault Aviation, Delft Dynamics, TU Delft MAVLab, DeViRo, Diehl Aerospace, Diehl Defence and Dilectro were dispositioned with explicit source holds. Consortium budgets, secondary shareholder sales, future funding plans and university-level funding were not assigned as company proceeds.

## Controls

The existing importer was validated, rehearsed inside a transaction and rolled back to the 247-event baseline before the production import. The same manifest was then applied twice to confirm idempotency. Curated records were preserved and no existing event was overwritten.

## Files

- Manifest: `research-agent/imports/company-funding-research-12-2026-11-03.json`
- Queue: `research-agent/queues/company-funding-all.csv`
- State: `research-agent/FUNDING_STATE.json`

## Publication verification

The catalogue rebuild from site commit `a53b3f89467eebe7ebb3612774eb6d0e6d720f36` generated the live landscape dataset at `2026-11-03T03:53:44.428Z`. The public JSON exposes all 567 landscape companies and the new DefendEye rounds, source links and investor roles at [xsonomy.com/landscape/](https://xsonomy.com/landscape/).
