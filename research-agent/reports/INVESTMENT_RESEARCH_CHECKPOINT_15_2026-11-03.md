# Investment research checkpoint 15 — 3 November 2026

## Result

Twenty published European landscape identities were source-audited. Twelve attributable events for ten companies were imported after a production rollback rehearsal and an idempotent atomic import.

- Funding events: 298 total (+12)
- Round participations: 649 total (+20)
- Investor profiles: 535 total (+19)
- Companies with structured investment coverage: 171 total (+10)
- Source rows: 392 total (+17)
- Fully reviewed public-source dispositions: 193 total (+7)
- Source-reconciliation holds: 72 total (+3)

## Imported facts

- Flowcopter — GBP950,000 Scottish Enterprise grant and TEKEVER acquisition.
- FLYDE — retrospectively disclosed EUR300,000 angel funding and an undisclosed Group Vanguard investment.
- FlyFocus — EUR4.5m first institutional round led by ff Venture Capital with NCBR Investment Fund.
- Flying Eye — January 2024 management buyout backed by Sud Rebond / Connect Pro.
- Frequentis — EUR21.6m of primary IPO proceeds; secondary shareholder sales excluded.
- Freya Industries — SEK6m seed with six named participants.
- GDELS–Santa Bárbara Sistemas — 2001 acquisition by General Dynamics.
- General Cherry — USD5m Accordbank credit line, classified as debt.
- Germandrones — 2017 strategic capital increase with CONDOR Group.
- Greenjets — USD40m Series A led by Blossom Capital.

## Holds and exclusions

FlyTech UAV, Futurology and Godwit Systems retain explicit reconciliation notes. Procurement contracts, company revenue, registry capital, aggregate historical investment, unnamed private investors, secondary share sales and parent/group financing were not converted into issuer rounds.

## Validation

The transaction rehearsal projected 298 events, 392 event sources, 649 participations, 171 covered companies and 535 investors, then restored the exact 286/375/629/161/516 baseline. Production and an idempotent rerun produced the same 298/392/649/171/535 counts. All twelve manifest event keys resolved; every event has a source and every participant source URL matches an event source.

Live publication verification is recorded in FUNDING_STATE.json after the catalogue build completes.
