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
