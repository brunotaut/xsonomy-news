# Funding research checkpoint 13 — 3 November 2026

## Outcome

- Reviewed 20 further published European landscape identities.
- Imported 13 verified events for 11 companies after a production rollback rehearsal.
- Database totals: 277 events, 619 participations, 510 investor profiles, 153 companies with events and 363 event sources.
- Fully reviewed cohort: 182 of 2,564 identities. Published-first queue remaining: 385 identities.

## Imported events

| Company | Verified event(s) |
|---|---|
| Domo Tactical Communications | 2021 Codan acquisition; USD88m upfront consideration, contingent earn-out excluded |
| Donaustahl | 2026 approximately EUR4m crowdfunded bearer-bond financing |
| Dronamics | 2026 Asia Air Survey strategic investment, amount undisclosed |
| Drone.UA | 2017 foreign strategic investment through Agricultural Systems Studio, amount undisclosed |
| Dronehub | 2022 USD500k GENIUS NY investment; instrument left undisclosed because official descriptions conflict |
| Droniq | 2019 DFS/Deutsche Telekom 51/49 joint-venture formation, contributions undisclosed |
| Elson Space | 2023 Solaris-Suborbital acquisition, terms undisclosed |
| Enterprise Control Systems | 2021 SPX acquisition, terms undisclosed |
| EOS Technologie | 2022 EUR10m Series A with Audacia |
| ERA | 2006 Rannoch, 2008 SRA International and 2011 OMNIPOL ownership changes |
| ERC System | 2020 IABG founding investment, amount undisclosed |

## Source holds

Nine identities had no attributable closed event after bounded company, investor and ecosystem searches. Dronamics cumulative pre-Series-A and prospective STEP figures, Elson facility/grant claims, EOS's unfinalized 2026 investment and Ericsson's historical listing were held rather than converted into unsupported events. The Ukrainian EDRONE identity was kept separate from the unrelated funded Polish e-commerce company.

## Controls

The importer validated 13 events. The first rollback rehearsal correctly exposed an expected-company-count error in the test assertion; the transaction rolled back cleanly. A corrected rehearsal reached the expected post-import counts and restored the exact baseline. The production import and idempotent rerun then passed.

## Files

- Manifest: `research-agent/imports/company-funding-research-13-2026-11-03.json`
- Queue: `research-agent/queues/company-funding-all.csv`
- State: `research-agent/FUNDING_STATE.json`

## Publication verification

Catalogue commit `2451ef7f78718586072952165b9bec8ec1c8339c` rebuilt the live company dataset at `2026-11-03T04:02:57.425Z` and investor dataset at `2026-11-03T04:02:58.676Z`. The live company JSON exposes Dronamics' Asia Air Survey event and EOS Technologie's Audacia Series A; the investor JSON contains both new investor profiles. See [xsonomy.com/landscape/](https://xsonomy.com/landscape/).
