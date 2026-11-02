# Full database investment research programme

Nazar authorises research, correction, import and publication across the company database without per-batch approvals. Ask only for an indispensable decision or missing access. This separate workstream uses FUNDING_STATE.json; legacy research STATE.json and frozen snapshots remain unchanged.

## Scope and actual progress

Inventory: 2,564 company records, including 567 currently published in the European landscape. Full queue: `research-agent/queues/company-funding-all.csv`. A queue entry is not proof of funding or completed research. Prioritise published companies, then remaining records. Coverage remains partial: the programme is NOT complete.

The expansion manifest adds 44 events across 23 additional companies and 105 participations. Production after import: 68 approved events across 28 companies, 215 participations, 235 investor profiles. One Parcom ownership relationship is recorded without treating an acquisition price as capital raised.

## Important reconciliations

- Auterion's USD130m headline includes USD25m non-dilutive financing; classified mixed, no double count.
- Destinus seed is CHF26.8m, not EUR26.8m. Its EUR140m convertible/shareholder financing and EUR50m bank facility are separate; advisers are not funders.
- Origin's EUR4m headline comprises EUR2.4m equity and EUR1.6m grants, recorded separately.
- Dronetag's investment is CZK15m convertible financing, not USD15m. Counsel's canonical page and contemporaneous announcement resolve the year to 2022.
- Swarmer SEC disclosures separate earlier SAFEs, Series A cash closings and IPO proceeds. SAFE conversion and resale registration are not new money. Disclosed investor contributions remain separate from aggregate event amounts.
- SwissDrones' more-than-USD10m financing preserves its lower-bound qualifier. Exact, approximate, more-than, at-least and up-to amounts are supported end to end.
- Flyability's company releases use EUR in the original Series C and CHF in the extension. Original currencies are retained; no FX total is fabricated.
- Public-safety company Axon and Spanish manager Axon Partners Group are separate investor identities.
- Skyeton Canada's private placement is a different issuing entity from Ukrainian Skyeton. Do not attach it to the parent by name alone. Research Capital's role as investment banker is not sufficient to establish an investment cheque.
- Windracers' nearly GBP50m headline is a government programme, not money raised by the company. Its consortium grant budget is also not its individual share. These sources are retained for reconciliation, not imported as company financing amounts.

## Validation

Applied `company_funding_amount_qualifiers` migration after local PostgreSQL tests. Security-invoker service-only views preserved. Final production dry-run yielded 68 events / 215 participations / 235 investor profiles; rollback returned to 24 / 177 before committed import. 146 news tests and 88 catalogue tests pass, including real PostgreSQL manifest execution, rerun idempotency, amount bounds, extension links and distinct contributions. No new API backfill budget or schedule changes.

## Continuing work

Research every queued identity using its website, dated company and investor releases, government records and legal transaction announcements. Check exact issuer, original currency, event versus cumulative totals, primary versus secondary proceeds, announced versus closed sums, lead roles and historical participants. Do not mark no-public-round from an empty database, search snippet, aggregator omission or an inaccessible site. Unknowns remain unknown. Keep source-level holds in the ledger and continue other companies autonomously.


## Subsequent progress in the same execution

An additional 33 verified events across 26 further companies, with 91 participations, were imported from `company-funding-research-02-2026-11-02.json`. Production totals: 101 approved events across 54 companies, 306 participations and 287 investor profiles. Dry run returned these totals; rollback was checked at 68 events before the committed apply. All 146 news tests pass with the second manifest included. The existing 88 catalogue tests cover the unchanged rendering/export path.

Discovery queries have now run for all 567 public companies: the initial 30 investigations plus 537 remaining identities. The discovery ledger contains 7,068 unique candidate URLs with search groups and an explicit not-verified status. This is discovery completion, not completion of the investment audit. No candidate headline is imported without source review. The wider 2,564-company programme continues using the durable state and queue.

Further examples: original SEK, CHF, PLN and CZK amounts are preserved; Specim equity/R&D support and Sol.One equity/debt packages are typed mixed. Perceptual Robotics January–September 2023 financing is one event rather than multiple invented rounds. OSL GBP11.5m cumulative BGF investment is represented as separate GBP8m and GBP3.5m contributions. Newly read sources for OpenWorks describe its own R&D expenditure rather than an equity raise and are not imported. Avalor/Intelic continuity and aggregated Dronamics pre-Series-A history require further reconciliation.


## Live verification and autonomous continuation

Catalogue deployment `4af6c23d3a0767138b07a7421234975f54a1fffc` completed successfully. Cache-busted public JSON generated at 14:49 UTC was checked at 567 companies, 54 financing-backed companies, 101 events, 306 participations and 287 investor records. All approved events have evidence sources. Security-invoker and restricted view permissions were verified; funding-table advisor messages are informational RLS-without-public-policy notices consistent with service-only access.

An enabled hourly ChatGPT continuation now reads the durable state, uses a short branch lease, advances source research and validated imports, and notifies Nazar only for completion or indispensable blockers. This adds no repository cron schedule or paid API backfill. The programme remains incomplete; the state records explicit next claims for reconciliation.
