# Company funding research checkpoint 28 — 3 November 2026

## Result

The second pass closed all 41 held identities from the approved 100-company pilot. The pilot now has a bounded public-source disposition for all 100 companies. This checkpoint imported 19 supported events across 13 companies and 16 source-backed participant roles.

Database totals after the atomic import: 514 approved funding events, 312 companies with events, 911 round participations and 681 investor profiles.

## Controls

- Verified issuer identity, original currency, date precision, amount qualifier, financing instrument, closing status and participant role before import.
- Excluded unallocated consortium budgets, procurement totals, planned rounds, fundraising targets and subsidiary financing that could not be assigned to the catalogue identity.
- Preserved 14 explicit source holds. These are bounded research dispositions, not evidence that the company raised zero funding.
- Production rollback rehearsal passed and restored the 495-event baseline.
- Atomic import matched all 19 manifest events.
- Re-running the importer was idempotent: totals remained 514 events and 911 participations.
- Post-import integrity check found 19 events, 20 event sources, 16 participations and no invalid undisclosed-amount rows.

## Imported facts

Torquing Group reward crowdfunding; TEI TÜBİTAK and two EU grants; Twist Robotics SPATRA grant; UAVTEK share issue and Innovate UK grant; UNAC regional aid; Venetz Aerospace earlier seed; ViaDrone MILTECH grant; Vyriy corporate-bond first close; WaiV seed; WARGdrones pre-seed; two WZL-2 grants; Zvook/DEPO investment; and three Turkish Aerospace EU grants.

## Pilot timing

Second-pass active time was 9.83 minutes, including evidence validation, reconciliation, rollback rehearsal, import and database verification, and excluding waiting between hourly runs. Measured throughput was 250.3 companies per active hour. Five read-only research lanes were used; no causal concurrency speedup is claimed because there is no serial control measurement.

Publication verification is recorded separately after the catalogue rebuild.
