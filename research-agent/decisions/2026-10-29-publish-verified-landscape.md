# Approved: publish verified landscape companies

Date: 2026-10-29
Decision maker: Nazar
User instruction: “go”, directly in response to the recommendation to publish the 162 verified-but-unpublished companies.

## Authorisation

Publish the existing verified European UAV & Counter-UAS landscape companies currently missing publication, reported as 162 after batch 18. This expressly authorises their publication_status change and the normal catalogue/landscape rebuild and deployment needed to make them visible. No further confirmation is required for this approved scope.

Claude owns live database changes under research-agent/README.md. This is a publication task, not research batch 19.

## Execute

1. Read current repository instructions and inspect the live database. Capture a manifest of the exact eligible company IDs, names, landscape verification status and previous publication_status before writing. Save it as research-agent/reports/2026-10-29-publication-manifest.csv. Use the actual schema and publication mechanism; do not invent status values.
2. Reconcile that manifest with the reported baseline: 567 verified, 405 verified-and-published, 162 verified-but-unpublished. Explain any drift. Skip records already published or no longer verified; do not broaden the operation to new candidates, held records or unrelated companies merely to reach 162.
3. Perform the required dry run. Validate canonical IDs, scope-country eligibility and existing publication prerequisites. Publish the qualifying manifest records using an idempotent, guarded update that changes only publication status and required audit fields. Retain prior statuses for rollback. A genuine record-specific blocker should be reported and skipped while the rest proceed.
4. Use the sister catalogue repository brunotaut/xSonomy's established build/deployment workflow to refresh the public catalogue and landscape. Respect its instructions. Do not hand-edit generated data. This approval covers the normal publication deployment.
5. Verify database outcomes and the deployed public data, including xsonomy.com/data/landscape.json: newly published eligible IDs appear, previously published eligible IDs remain, and excluded/needs_review records are not introduced into the landscape. Check per-ID membership, not just counts. The expected eligible total is 567 only if the live baseline and all prerequisites remain unchanged.
6. Write research-agent/reports/2026-10-29-verified-publication.md with before/after counts, changed IDs, skipped reasons, dry-run/QA results, build/deployment identifiers and live verification. Distinguish database publication from confirmed public visibility; if deployment is pending, report it as pending rather than complete.
7. Update docs/STATUS.md as required and research-agent/STATE.json with the publication outcome and next_actor chatgpt for review. Keep historical verification results intact.

## Scope boundaries

Existing V1=273 and V2=358 remain immutable; no V3 requested. No discovery, broad catalogue cleanup, ownership repair, scope-policy changes, deletion or bulk unpublication is included. The warhead/energetics and operator/services decisions remain open. Do not change scheduled jobs or send emails/digests as part of this publication.
