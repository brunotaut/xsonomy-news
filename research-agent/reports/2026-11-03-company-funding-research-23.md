# Company funding research checkpoint 23 — 2026-11-03

## Result

Reviewed 20 additional published European landscape identities, from Prometheus UAV through Restube. Seven source-audited events for seven companies passed a production rollback rehearsal, were imported atomically, and passed an idempotent rerun.

## Imported events

- Prometheus UAV — amount-undisclosed JR Holding Series G primary share subscription (2021); separate secondary purchase excluded.
- PZL Defence — conditional 40% Unimot stake agreement for PLN400,000 (2025), explicitly treated as an ownership disclosure rather than issuer proceeds.
- Leonardo PZL-Świdnik — PLN26.6m production and development public support (2026).
- QinetiQ — GBP150m gross primary IPO proceeds (2006); shareholder divestment proceeds excluded.
- Qognifly — EUR2m first external financing (2026); investor remains undisclosed.
- Ratel Robotics — signed up-to-USD224m Swarmer acquisition agreement (2026), explicitly marked pending, contingent and secondary.
- Restube — EUR600,000 Seedmatch crowdinvesting round from 640 investors (2016).

## Evidence holds

Thirteen reviewed identities did not receive invented zero-funding claims or unsupported rows. Material holds include the Rantelon consortium grant without a beneficiary allocation, Quell public development support without award-level company terms, Quantum joint-venture announcements without separate capital amounts, and Renegade UxS's undisclosed EIFO guarantee.

## Import controls

- Baseline: 397 events; 235 companies with events; 775 participations; 605 investor profiles.
- Rollback rehearsal returned exactly to baseline.
- Atomic production import completed.
- Idempotent rerun completed without duplication.
- Post-import: 404 events; 242 companies with events; 779 participations; 609 investor profiles.
- Curated rows were preserved; no existing event was overwritten.

## Programme position

- Published European landscape identities reviewed: 286 of 567.
- Full cohort: 2,564 identities.
- Next identity begins after Restube.
