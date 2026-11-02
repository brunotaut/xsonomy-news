# Company funding history expansion — 2026-11-02

Published primary-source histories for the same five pilot companies. The new manifest adds 19 events and 75 round participations: production now has 24 events, 110 participations and 177 investor profiles. Company event counts: Alta Ares 3; Helsing 5; Quantum Systems 9; Tekever 4; Harmattan AI 3.

## Evidence and interpretation

Source URLs, event-level notes and the reviewed facts are in `research-agent/imports/company-funding-history-v1.json`. No article bodies are stored. All five research coverage statuses remain partial; these histories are not asserted exhaustive.

- Extensions point to their original company round. Quantum's Series B and C cumulative amounts are not added as separate raises.
- Credit facilities use lender roles. The EIB's EUR70m contribution is part of the EUR150m European financing package. Helsing's EUR100m Prima Materia contribution is separate from the EUR102.5m round size.
- Harmattan's earlier rounds have unknown dates and individual amounts. The combined USD42m disclosure is not allocated between rounds.
- Alta's E2D participation is an investment disclosure with no assumed amount or Series A assignment. Airbus is not attributed a direct investment through its LP relationship.
- AVP and FJ Labs are company-published Alta investor relationships, without an invented round or cheque. The original 103 generic relationship rows are preserved; two additions bring the count to 105.
- Tekever's 2025 UK spending commitment is not treated as money raised. Its source does not establish an exact financing amount or stage.

## Database and validation

Applied named migration `company_funding_history_event_types`; idempotent reference in `db/company-funding-history-schema.sql`, mirrored in `db/schema.sql`. Service-only views and RLS restrictions remain. No schedules, subscribers or legacy research state changed.

The final SQL was executed in a production transaction and rolled back: 24 events / 110 participations inside the transaction, then 5 events after rollback. The subsequent committed import was verified at 24 / 110. Import refuses conflicting existing financial facts instead of overwriting. Repeated imports are idempotent.

137 news tests passed, including PostgreSQL execution of schema, both manifests, repeat imports, unknown dates, extension parent links, lender contributions and conflict refusal. 87 catalogue tests passed. Catalogue shows unknown dates explicitly and renders disclosed investor contributions independently of event totals.

## Next batch

`research-agent/queues/company-funding-next-25.json` contains 25 verified identities from the published company landscape. This is a research queue, not evidence that those companies raised funding. Research each company's primary-source history before importing; retain undisclosed fields and partial coverage where appropriate.

## Withdrawal

If a new event requires withdrawal, set its publication_status to retired after reviewing the manifest key. Do not delete original pilot events, investor profiles or generic relationships. Rebuild the read-only catalogue afterwards.
