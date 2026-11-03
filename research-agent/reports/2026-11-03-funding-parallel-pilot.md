# 100-company parallel funding pilot — reconciliation report

Checked and published: 2026-11-03

## Result

The four-lane first-pass evidence checkpoint covered 100 published European landscape company identities. Reconciliation against current main and production data produced:

- 59 identities with bounded public-source review dispositions.
- 48 newly fully reviewed identities added to the programme counter; 11 identities were already reviewed before the pilot.
- 41 independent second-pass holds retained. These remain open research work and are not treated as zero-funding findings.
- 46 new approved financing, grant, debt or ownership events across 30 company identities.
- 52 supported event–investor participations.
- Production catalogue after import: 495 events across 299 companies, 895 participations and 675 investor profiles.

## Evidence and disposition rules

The durable first-pass file was reconciled company by company against the current queue and production database. Candidate rows, empty rows and first-pass negatives were not promoted automatically. Imports require an attributable issuer or transaction party, an original or official source, preserved date precision, original currency, explicit amount qualifier, distinct financing instrument and only source-supported investor roles.

The 41 held identities retain their individual notes and sources for a second pass. Holds include issuer ambiguity, primary-versus-secondary proceeds, consortium allocation, conflicting amounts, inaccessible underlying filings and events announced without a verified close.

## Database and publication checks

- Production rollback rehearsal inserted the complete manifest inside a transaction, asserted 495 events and 895 participations, rolled back, and restored the exact 449-event / 843-participation baseline.
- The atomic production import reached the expected counts.
- An idempotent rerun produced no duplicate events or participations.
- All 495 events are approved and imported source links resolve in the database.
- Catalogue source commit: [1d1d6b077c10bfea6a4b5a3b3e89b2f49b5ea6b3](https://github.com/brunotaut/xsonomy-news/commit/1d1d6b077c10bfea6a4b5a3b3e89b2f49b5ea6b3)
- Publication trigger commit: [967248de021cd60316d93ab2497db629199b28d7](https://github.com/brunotaut/xSonomy/commit/967248de021cd60316d93ab2497db629199b28d7)
- Live company catalogue generated at 2026-11-03T17:53:36.047Z.
- Live investor catalogue generated at 2026-11-03T17:53:37.085Z and exposes 675 investor profiles.
- Audit manifest: [company-funding-research-27-2026-11-03.json](../imports/company-funding-research-27-2026-11-03.json)

## Timing and throughput

Measured active finalization time was 7.99 minutes from lease acquisition through verification, reconciliation, rollback rehearsal, atomic import, writer checkpoint, catalogue rebuild and live publication verification. This equals 360.3 newly fully reviewed identities per active hour for the finalization phase.

The first-pass lane checkpoint did not record per-lane active time. Therefore the pilot does **not** claim a measured concurrency speedup or a full-pilot throughput figure.

## Continuation

The full programme remains in progress: 394 of 2,564 cohort identities now have bounded public-source review dispositions. The next scheduled runs should complete the 41 pilot second-pass holds and then continue the published-landscape priority cohort before the remaining database identities.
