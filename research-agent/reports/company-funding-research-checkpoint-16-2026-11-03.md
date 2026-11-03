# Company funding research checkpoint 16 — 2026-11-03

## Scope

Source-audited review of 21 published European landscape identities, continuing the published-first queue. The batch covers Greentech Harvest through Hybrid Drones.

## Production result

- Rollback rehearsal started from 298 funding events, 392 event sources, 649 participations, 171 covered companies and 535 investor profiles.
- The rehearsal resolved all 23 manifest events and was rolled back; all baseline counts returned exactly.
- The atomic production import added 23 events for 12 newly covered companies, 35 event-source records, 23 structured participations and 14 investor profiles.
- Post-import counts are 321 events, 427 sources, 672 participations, 183 companies with events and 549 investor profiles.
- The exact importer was rerun idempotently with no count changes.
- Validation found zero events without sources and zero participations without a source URL.
- One additional company-confirmed ownership relationship links Hologarde to Groupe ADP without misrepresenting current share capital as a dated funding event.

## Approved facts

- Griff Aviation: 2018 USD2.3m Drone Fund convertible investment; 2021 NOK40m Ronja Capital equity; 2022 NOK40m equity from Ronja Capital and Jakob Hatteland.
- Grupo Amper: 2023 EUR31m equity increase; 2024 EUR30.7m bond, EUR12m tap and EUR20m institutional note; 2025 EUR32.3m second tap and exact EUR77,165,308.35 capital increase.
- HAVELSAN: EUR36,286.25 EQUALS-EU and EUR666,955.13 TeamAware participant-level EU contributions from CORDIS.
- Hecto Drone: Maj Invest strategic investment, terms undisclosed.
- Heliguy: GBP15,000 Made Smarter grant.
- Hellion Tech: Sunfish investment, terms undisclosed, plus two EUR100,000 SPRIND challenge stages.
- HENSOLDT: EUR300m primary component of the 2020 IPO; secondary shareholder sales excluded.
- Hevi Optronics: Quantum Systems 60% secondary acquisition; no issuer proceeds inferred.
- Hexadrone: May 2018 EUR800,000 first equity round with CIRLY, Sabarot Wassner and Planet Monetic.
- HGH Infrared Systems: Carlyle Europe Technology Partners majority acquisition in 2018, consideration undisclosed.
- Huless: company-confirmed aggregate above USD1m across private equity, a state-bank loan and a Brave1 grant, represented as mixed financing without fabricated component splits.
- Hybrid Drones: 2025 MBDA investment and 2026 GBP200,000 S-Ventures investment.

## Reviewed with no attributable import

Greentech Harvest, Grim Tech, HADES Defense Systems, HERAKLES Defense, Hertz New Technologies, Hertz Systems and Hologarde received evidenced dispositions. Hologarde's current Groupe ADP ownership is retained as a relationship, not a fabricated financing round.

## Holds and exclusions

- Gurzuf Defence: a secondary Resist.UA investment claim lacks issuer or investor confirmation.
- Hornet–Polskie Drony: the 52% ITWL transfer was conditional and planned Boryszew financing remains unquantified; no funded event was imported.
- Hexadrone: an older article conflicts with the later EUR800,000 amount and remains flagged for source reconciliation.
- Grupo Amper subsidiary financings, acquisition consideration and placement-agent roles were excluded from issuer funding.
- HENSOLDT secondary IPO shares, Hevi seller proceeds and pending THEON/HGH discussions were excluded.
- Contracts, procurement revenue, projected capex, programme ceilings and fundraising intentions were not treated as closed financing.

## Files

- Manifest: `research-agent/imports/company-funding-research-16-2026-11-03.json`
- Queue: `research-agent/queues/company-funding-all.csv`
- State: `research-agent/FUNDING_STATE.json`

## Publication verification

Catalogue commit `0d06829e0998da1ec1b5b39120b16e7fd6027722` triggered the read-only production build. The live exports report `generatedAt=2026-11-03T07:03:54.091Z` and investor `generatedAt=2026-11-03T07:03:55.147Z`, with 321 funding events across 183 companies, 672 participations and 549 investor profiles. Live spot checks confirmed Griff Aviation (3 events), Grupo Amper (6) and Hellion Tech (3), and the landscape UI loaded the 567-company catalogue.
