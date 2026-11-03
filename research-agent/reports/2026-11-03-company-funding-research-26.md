# Company funding research checkpoint 26

**Checked:** 3 November 2026  
**Scope:** 20 published European landscape identities, from `singular-aircraft` through `solone`  
**Import manifest:** `research-agent/imports/company-funding-research-26-2026-11-03.json`

## Result

- 20 identities received a bounded public-source review.
- 15 new approved financing or change-of-control events were imported; one existing Sol.One parent event was repeated in the manifest solely to attach an extension idempotently.
- Database after import: 449 approved events across 270 companies, 843 round participations and 652 approved investor profiles.
- Every approved event has at least one source and every participant has a source URL.
- Production rollback rehearsal and a second idempotency execution both passed.
- Equity, grants, debt, acquisitions and announced-but-not-closed commitments remain separate. Consortium budgets, self-funding, fundraising targets and unattributable cumulative totals were not imported.

## Identity dispositions

| Company | Disposition | Confirmed result / limitation |
|---|---|---|
| Singular Aircraft | Reviewed; no external event imported | Company reports more than EUR24m of self-funded development; the Zenith document is a letter of intent, not a closed investment. |
| Siralab Robotics | Partial | Dronus' 70% acquisition in October 2020 is recorded with consideration undisclosed. |
| Sistemi Dinamici | Partial | Leonardo's purchase of the remaining 60% on 23 December 2016 is recorded without consideration. |
| Six Robotics | Partial | Existing EUR12m 2026 seed remains; earlier EUR1m cumulative external equity is not publicly broken into attributable events. |
| SkRIPer | Reviewed; no event imported | No attributable public financing event found in checked company and ecosystem sources. |
| Sky-Drones | Partial | RISE, ALIAS and BLUEPRINT Innovate UK awards recorded with company amounts undisclosed; consortium totals not assigned. |
| Sky Fortress | Partial hold | Government support is described publicly, but recipient entity, amount and instrument were not established at event level. |
| Sky Spy | Reviewed | Existing issuer-confirmed USD1.6m pre-seed remains the supported public round. |
| Sky-Watch | Partial hold | Dangroup/Borean ownership is public, but a sufficiently precise dated financing transaction was not established. |
| Skyassist | Partial hold | Approximately UAH5m combines founders' and friends' money and cannot be split into an attributable external event. |
| SkyBound | Partial hold | GBP7.68m aggregate across four rounds and a GBP52.5k grant need event-level original sources. |
| Skycorp Technologies | Partial | EUR305k December 2023 pre-seed and four named investors recorded. |
| Skycutter | Partial hold | A capital raise was being sought; no closed round was established. |
| Skydrone Robotics | Reviewed | EUR5m package split into EUR2m equity, EUR1.8m grants and EUR1.2m debt; eleven equity networks named. |
| SkyFall | Reviewed; no event imported | Alliance membership, procurement support and an Airbus MoU are not company financing events. |
| Skyports | Partial | GBP5.35m Series A and GBP650k extension added; 2018 seed amount remains undisclosed. |
| Skysec Defence | Reviewed; no event imported | CHF20k incorporation capital is not treated as external financing. |
| smartmicro | Reviewed; no event imported | Checked history supports an operating company and acquisitions it made, not financing into smartmicro. |
| SoftBlue | Partial | PLN26.98m Series E and PLN10.296275m Series F imported; other public issues await issuer-document reconciliation. |
| Sol.One | Partial | EUR2.5m Drone Volt extension added; EUR5.5m conditional SOLFORGE commitments recorded as announced. |

## Principal sources

### Acquisitions and ownership

- [Siralab company history](https://siralab.it/chi-siamo/)
- [Leonardo acquisition release](https://www.leonardo.com/documents/15646808/16750990/ComLDO_Leonardo_Sistemi_Dinamici_27_12_2016_ENG.pdf?t=1538990092271)
- [Leonardo 2016 results](https://www.leonardo.com/documents/15646808/16752258/ComLDO_FY2016_15_03_2017_ENG.pdf?t=1538990356088)

### Grants and private rounds

- [Sky-Drones Future Flight projects](https://sky-drones.com/future-flight)
- [UKRI Future Flight programme](https://www.ukri.org/what-we-do/browse-our-areas-of-investment-and-support/future-flight/)
- [Skycorp EUR305k pre-seed announcement](https://eac.ee/news/skycorp-technologies-secures-e305000-in-pre-seed-funding-to-revolutionise-emergency-response-with-hydrogen-drones/)
- [Skydrone Robotics financing release](https://defenseangels.org/wp-content/uploads/2026/02/CP_SKYDRONE-ROBOTICS_20260213.pdf)

### Public and strategic financings

- [Skyports GBP5.35m Series A](https://pressat.co.uk/releases/skyports-raises-535-million-in-series-a-funding-33ced2b69ccc9ceacdd50a5b7df403d4/)
- [Skyports Series A extension](https://skyportsdroneservices.com/2020/03/skyports-extends-its-series-a-capital-raise-to-6m-with-investment-from-irelandia-aviation/)
- [InventionMed subscription for SoftBlue Series E](https://inventionmed.pl/download/espi-raport-biezacy-nr-28-2020/)
- [SoftBlue Series F information document](https://softblue.pl/wp-content/uploads/2024/03/SoftBlue_DI_seria_F.pdf)
- [Sol.One / Drone Volt cross-investment](https://www.sol.one/blog/newsroom-7/sol-one-completes-2-5-million-reciprocal-investment-with-drone-volt-first-shipments-arrive-in-sol-one-production-plant-19)
- [Drone Volt confirmation](https://live.euronext.com/sites/default/files/company_press_releases/attachments/2026/09/30/cpr05_actus_100581_FR001400SVN0.pdf)
- [Sol.One SOLFORGE commitments](https://www.sol.one/blog/newsroom-7/sol-one-secures-eur-5-5-million-to-launch-project-solforge-25)

## Validation

The generated importer SQL was exercised inside a production transaction and rolled back. Assertions verified 449 approved events, 843 participations and 18 approved events across the eight affected companies before rollback, followed by the exact 434-event / 816-participation baseline after rollback. The atomic production import then passed the same assertions. A second production execution made no count changes, confirming idempotency. Post-import audit found zero approved events without sources and zero participations without source URLs.
