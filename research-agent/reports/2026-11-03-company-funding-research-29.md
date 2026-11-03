# Company funding research checkpoint 29 — 3 November 2026

## Result

Reviewed 20 previously partial published-landscape identities and reconciled their existing database histories before import. Added 40 supported events across 10 companies and 38 source-backed participant roles.

Database totals after the atomic import: 554 approved funding events, 312 companies with events, 949 round participations and 689 investor profiles. The number of covered companies is unchanged because all 20 identities already had at least one event.

## Imported facts

- ESG: Luxempart's 2015 27.6% investment.
- Everdrone: four beneficiary-specific Vinnova grants.
- Fiocchi: Charme III's 2018 majority acquisition.
- Flarebright: two beneficiary-specific Innovate UK grants.
- Fotokite: seven earlier grants, prizes and investments from NCCR Spin Fund, Qualcomm, IBM, GENIUS NY, the European Commission and Credit Suisse Entrepreneur Capital.
- Falcons: two competition awards, three issuer-confirmed BRAVE1 grants and an amount-undisclosed anonymous angel investment without allocating the four-company aggregate.
- Farsight Vision: an Estonian defence grant, joint RUP support with amount withheld, and EIC Localizer support with the beneficiary amount withheld.
- Frequentis: the 2020 employee capital increase plus thirteen beneficiary-specific EU grants.
- Frontline Robotics: UAH2m BRAVE1 support for LINZA.
- GDELS–Santa Bárbara Sistemas: the authorised EUR176m PIZARRO-ACT zero-interest industrial prefinancing facility.

## Controls and holds

- Production rollback rehearsal restored the exact 514-event baseline.
- Atomic import matched all 40 manifest events; idempotent rerun left totals unchanged.
- Post-import integrity: 40 events, 41 sources, 38 participations and no invalid undisclosed-amount rows.
- Consortium totals, contracts, planned financings, anonymous cheque splits and subsidiary financing were excluded.
- Existing Fotokite 2024 amount, Fadron disclosure date, Fire Point founder-financing conflict and GDELS historical consideration remain explicit reviewed-correction holds; no silent overwrite or duplicate event was made.
- Frequentis remains source-review partial because more historical project-level CORDIS reconciliation may exist.

## Timing

Active work through database verification was 8.56 minutes for 20 identities, or 140.2 identities per active hour. This includes current-database reconciliation, source validation, rollback rehearsal, atomic import and integrity verification, and excludes waiting between scheduled runs. Five read-only research lanes were used; no causal speedup is claimed without a serial control.

## Publication verification

Catalogue commit 2c25fe3ca3835807ff44180b31ac0f6ad95205e5 rebuilt successfully. Live landscape.json generated at 2026-11-03T19:59:13.430Z contains 554 events across 312 companies and 949 participations. Live landscape-investors.json generated at 2026-11-03T19:59:14.291Z contains 689 investor profiles.
