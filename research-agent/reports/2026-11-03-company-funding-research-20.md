# Company funding research checkpoint 20 — 2026-11-03

## Result

Twenty further published European landscape identities were source-audited. Ten attributable financing and grant events for six companies were approved and imported after a production rollback rehearsal. The database moved from 364 to 374 approved events, from 212 to 218 companies with approved events, from 717 to 736 event participations and from 571 to 580 investor profiles.

The manifest is `research-agent/imports/company-funding-research-20-2026-11-03.json`. Research remains partial; an empty result is a bounded public-source disposition, not evidence that a company raised no money.

## Reviewed identities

| Company | Disposition | Evidence outcome |
|---|---|---|
| Metravib Defence (Acoem) | source_review_partial | The 2011 Areva sale concerns the predecessor group and is not assigned to the current defence identity. |
| MGI Engineering | source_review_partial, 2 events | Two company-confirmed OxLEP public grants recorded with undisclosed amounts and announcement-date precision. |
| MGT Europe | reviewed_public_sources | Company and registry sources established the identity but no attributable financing event. |
| Microdrones GmbH | reviewed_public_sources | Company history documents acquisitions made by Microdrones, not external financing into the issuer. |
| Microflown AVISA | source_review_partial | EU-project aggregator claims lack beneficiary-specific official allocations and award dates. |
| MITS Industries | source_review_partial | Announced consolidation remained subject to definitive agreements; no closed event recorded. |
| MKE | reviewed_public_sources | State-owned-company and corporate sources did not establish attributable external financing. |
| Monava | partial, 1 event | 2026 Gungnir-led pre-seed recorded with Foundry Ventures and Hede Capital; amount undisclosed. |
| Monopulse | source_review_partial, 2 events | Signed EUR1.12m ILTE loan and more-than-EUR2m Coinvest-led equity round recorded separately. |
| Motion Robotics | source_review_partial, 1 event | Beneficiary-specific GBP73,815 SEASHORE grant recorded; another programme reference lacks a company amount. |
| MSI-Defence Systems | reviewed_public_sources | Wholly owned MS International subsidiary; contracts and parent investment are not issuer financing. |
| MSP InnTech | source_review_partial, 2 events | Approximately PLN7.5m AutoLand grant and exact PLN446,850 technology grant recorded; consortium budget excluded. |
| Munin Dynamics | source_review_partial | Cumulative founder, private and defence-support figures lack event dates and named private investors. |
| Nammo | source_review_partial | Public mechanisms and capacity guarantees were not converted from procurement or issuer spending into grants. |
| Naval Group | reviewed_public_sources | State ownership, contracts and investments made by Naval Group do not establish issuer financing. |
| NeuralAgent | source_review_partial | ESA BIC support claim predates incorporation and lacks an original award record and amount. |
| NEWT21 | source_review_partial | Company confirms EU co-funding but not the beneficiary amount or award date. |
| NORDA Dynamics | source_review_partial, 2 events | USD150k Angel One investment and USD1m Varangians-led round recorded; secondary grant claim held. |
| Nordic Wing | reviewed_public_sources | Company states profits are reinvested; no attributable external financing event established. |
| Norma | source_review_partial | Group-level RUAG Ammotec acquisition and US expansion spending were not assigned to the Swedish subsidiary. |

## Validation

- The tested importer accepted all 10 manifest events.
- Production rollback rehearsal completed successfully and restored the exact 364 / 212 / 717 / 571 baseline.
- Atomic import resolved all 10 events; immediate rerun was idempotent.
- Post-import counts: 374 approved events, 218 covered companies, 736 participations and 580 investor profiles.
- Original currencies, public date precision and amount qualifiers were retained.
- Debt, grants and equity remain separately typed.
- Consortium budgets, procurement, issuer spending, predecessor/group transactions, proposed consolidations and unsupported accelerator claims were excluded or held.

## Principal sources

Company, investor and official sources include MGI Engineering, Gungnir Capital, Fylgia, ILTE, Coinvest Capital, UKRI Gateway to Research, Poland's European Funds programme, the Open Innovation Network, MSP InnTech, Angel One and MITS Capital.

## Publication

Catalogue rebuild and live payload verification are tracked separately. Database success alone is not claimed as publication.
