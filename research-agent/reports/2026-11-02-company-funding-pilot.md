# Company funding pilot — 2 November 2026

Nazar authorised direct implementation after the investment coverage audit. This additive pilot verifies **one 2026 round for each of five companies**. It is not a completed funding history review.

## Baseline and cause

Direct Supabase queries found no total_funding values in 2,539 companies, zero company_evidence rows and zero evidence_scanned_at stamps. The 100 active portfolio relationships matched the public export field for field. Facts were principally absent in the database. The old investor_companies uniqueness key represents a relationship, not repeat financing rounds.

## Structure

Migration `company_funding_rounds_pilot_structure` is mirrored in `db/schema.sql` and `db/company-funding-schema.sql`.

- `company_funding_rounds`: company and stable round key, stage, financing type, source-precision date, amount/currency, amount basis, closing status, public note, approval and check date.
- `company_funding_round_sources`: source metadata, never full article text.
- `company_funding_round_investors`: round, investor_research identity, role, nullable own contribution and source FK belonging to the same round.
- `company_investment_research`: coverage status and public explanation. All five are `partial`.
- `v_company_funding_rounds` / `v_company_investment_research`: sourced approved rounds for live companies; security invoker; service-role-only read access. RLS enabled, anon/authenticated privileges revoked. No public credentials or new functions.

All 103 existing relationship rows (100 active) remain unchanged. Existing investor profiles are not overwritten. 29 new identities are minimally source-confirmed, bringing the directory from 118 to 147. Offices, coordinates, mandate, fund size and cheque sizes are not invented. New identities without verified geography appear in the list and company links, without map markers.

## Records and source interpretation

| Company | Round | Date | Size | Treatment | Participants |
|---|---|---|---|---|---|
| Alta Ares | Series A | 2026-06-09 | EUR 50m | Closed, transaction-party confirmation | 7 |
| Helsing | Series E | 2026-07-13 | USD 1.8bn | Raised; lead not inferred | 10 |
| Quantum Systems | Series D | 2026-07-02 | USD 1.2bn | Signed; announced size, not asserted received | 11 |
| Tekever | Series D | 2026-09-23 | USD 580m | Announced size; first close covers a majority, exact closed amount undisclosed | 6 |
| Harmattan AI | Series B | 2026-01-12 | USD 200m | Announced size; Dassault lead; complete syndicate not asserted | 1 |

Exact source URLs and supported participant roles are in `research-agent/imports/company-funding-pilot-v1.json`. Alta's company announcement supplies the main syndicate, OTB confirms Series A, and Apeiron confirms additional participants and closed status. Expansion VC's own site confirms the Expansion Ventures identity. Quantum's Airbus is distinct from Airbus Ventures. Helsing's separately named historic backers are not automatically participants in Series E.

No round size is written into company total_funding. No cross-currency or per-investor summation is performed. Individual contributions remain NULL. Generic portfolio entries are not automatically converted into rounds.

## Verification and reproduction

`npm ci` then `node --test scripts/test/company-funding.test.mjs` runs the schema and importer in embedded PostgreSQL. Checks cover rerun idempotency, multiple rounds for one company/investor, hidden drafts, source FKs, currency consistency and denied public access.

`node scripts/prepare-funding-pilot.mjs` validates the manifest and prints SQL only. Review it inside BEGIN/ROLLBACK before BEGIN/COMMIT. The production dry run returned 5 rounds / 35 participations / 147 investors. Rollback was verified at 0 rounds / 118 investors. The committed transaction returned 5 / 35 / 147 and 103 legacy relationships unchanged.

The catalogue reads the two new views, exports rounds on their company, and renders them in both company and investor details. Tests cover single-round/multiple-investor cardinality, partial research, source validation, both-way links and first-close wording. Existing tests remain applicable.

RLS-without-policy notices on the four server-only tables are intentional: anonymous and authenticated grants and policies are absent. Unrelated security findings were not modified.

## Next work

1. Reconcile earlier rounds for the five pilot companies; keep partial status until scope is documented.
2. Review the 100 legacy relationships, linking them to rounds only when evidence supports date/stage/identity. Preserve generic portfolio membership.
3. Research the next 25 company histories, prioritising funded private companies, with a queue for all 567 landscape members.
4. Feed collected news into a review queue. Contracts, spending plans, targets, closes, debt, grants and valuations are separate facts.

## Rollback

Revert the catalogue integration commit to restore the old read path. To withdraw the pilot data, mark the five manifest rounds retired and preserve their sources and participant rows. New minimal investor profiles may return to staging only after checking for other approved facts depending on them. Do not modify the pre-existing 118 investor profiles, legacy portfolio links, membership or frozen snapshots. No destructive rollback runs automatically.
