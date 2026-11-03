# Company funding research checkpoint 18 — 2026-11-03

## Result

Twenty further published European landscape identities were source-audited. Thirteen attributable financing, grant or ownership events for eleven companies were approved and imported after a production rollback rehearsal. The database moved from 340 to 353 approved events, from 193 to 204 companies with approved events, from 686 to 700 event participations and from 556 to 563 investor profiles.

The manifest is `research-agent/imports/company-funding-research-18-2026-11-03.json`. Research remains partial; an empty result is a bounded public-source disposition, not evidence that a company raised no money.

## Reviewed identities

| Company | Disposition | Evidence outcome |
|---|---|---|
| KBP International | reviewed_public_sources | Company and Czech registry/ownership sources established operating identity and private ownership; registry capital was not treated as financing. |
| Kirintec | partial, 1 event | BAE Systems' completed 2024 acquisition recorded at GBP252m gross cash consideration; GBP40m acquired cash and GBP212m net outflow remain explanatory, not separate events. |
| KNDS | source_review_partial | Proposed listing remains unclosed; the 2026 RENK share disposal generated KNDS proceeds from an asset sale rather than issuer financing. |
| KNDS France | reviewed_public_sources | Subsidiary sources did not establish a separately attributable external financing event. |
| Kolarms | reviewed_public_sources | Company history and registry ownership checked; authorised capital was not treated as external financing. |
| Kongsberg Defence & Aerospace | partial, 2 events | NOK200m Norwegian-authority and EUR10m EU ASAP grants recorded separately; Kongsberg's NOK640m own capex excluded. |
| Kray Technologies | source_review_partial, 1 event | CIG's 2017 investment verified with undisclosed amount; two unnamed co-investors and secondary-database history remain unresolved. |
| Kseonics Technology | partial, 1 event | Brave1 production grant verified with undisclosed amount; an early UAH30k credit lacked lender/date/issuer attribution. |
| Kvertus | reviewed_public_sources | Company reporting described self-funding and reinvestment; issuer spending was not converted into financing. |
| LBA Systems | partial, 1 event | Leonardo/Baykar 50:50 joint-venture formation recorded with undisclosed initial capital. |
| Lehmann Aviation | source_review_partial | Registry material indicates a 2025 capital increase but does not expose an attributable amount or participant record. |
| Leica Geosystems (Hexagon) | partial, 1 event | Hexagon's 2005 acquisition of outstanding shares recorded; mixed per-share consideration retained without an invented aggregate. |
| Leonardo | source_review_partial | Current official reporting covered debt-programme capacity and repayments, not reconciled historical primary proceeds; subsidiary events were not assigned to the parent. |
| Leonardo UK | reviewed_public_sources | Wholly owned subsidiary sources did not establish a separately attributable external financing event. |
| Liebherr Aerospace | partial, 1 event | EUR2.4m France Relance co-financing recorded; the approximately EUR5m total project cost excluded. |
| LiveLink Aerospace | partial, 2 events | Two exact UK government radar-mitigation grants recorded at GBP1,331,505 and GBP505,938. |
| LMT (Latvijas Mobilais Telefons) | partial, 1 event | EIB's signed EUR50m network-development loan recorded; EUR101m project cost excluded. |
| Logika Design Bureau | reviewed_public_sources | Company and identity sources checked; no attributable closed financing event established. |
| LV-Teh | source_review_partial, 1 event | Official EUR64,425 Latvian defence grant recorded; secondary references to later support remain unreconciled. |
| Lynred | partial, 1 event | France 2030 financial support verified with undisclosed amount; Lynred's approximately EUR111m own project investment excluded. |

## Validation

- The tested importer accepted all 13 manifest events.
- Production rollback rehearsal completed successfully before the write.
- Atomic production import resolved all 13 events.
- Post-import counts: 353 approved events, 204 covered companies, 700 participations and 563 investor profiles.
- Original currencies and public precision were retained.
- Grants, debt, equity, acquisition consideration and joint-venture formation remain separately typed.
- Open offerings, registry capital, issuer spending, project totals, programme ceilings, unattributed consortium support and subsidiary financing were excluded.

## Principal sources

Transaction-party or official sources include BAE Systems, Kongsberg, CIG, Leonardo, Hexagon, Liebherr, EIB, Lynred, UK government subsidy/project records and the Latvian Ministry of Defence. Secondary reporting was used only where it directly preserves a company statement or contemporaneous event detail and never to invent amounts or participant roles.

## Publication

Catalogue rebuild and live payload verification are tracked separately. Database success alone is not claimed as publication.
