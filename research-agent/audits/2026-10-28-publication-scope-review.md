# Public landscape and catalogue scope check
Checked: 2026-10-28
Repository baseline: xsonomy-news origin/main 5e8e197
Public landscape generatedAt: 2026-10-28T21:46:22.771Z

## Result
| Measure | Count |
|---|---:|
| Companies in fetched public landscape | 375 |
| Companies in fetched general catalogue data | 2,304 |
| Unique original/company IDs covered by reconciliation reports 02–14 | 489 |
| Latest report status excluded | 174 |
| Latest report status needs_review | 79 |
| Combined reviewed excluded/unresolved records | 253 |
| Those IDs present in public landscape | 0 |
| Those names exactly matched in general catalogue | 235 |

The landscape passes this scoped exclusion check. The general catalogue contains exact-name matches for many records outside this particular landscape or awaiting resolution. Landscape exclusion is not by itself a reason to unpublish a valid company from a wider catalogue.

## Method
Fetched https://xsonomy.com/data/landscape.json and https://xsonomy.com/data/companies.json directly. Read committed reconciliation CSVs for batches 02–14, ordered by batch number, retaining the latest row for each original/company UUID. Selected statuses excluded and needs_review. Compared UUIDs to the landscape. The general catalogue does not expose UUIDs, so compared trimmed, case-insensitive exact company names only, retaining match counts and slugs. No fuzzy matching or inferred alias substitution.

The catalogue source implementation also requires both included landscape membership and publication_status=live; the fetched output is consistent with this gate.

## Reviewable output
See 2026-10-28-publication-scope-review.csv alongside this report. It contains all 253 reviewed records, report provenance, observed landscape presence, catalogue match counts/slugs, and prior reconciliation notes.

## Interpretation and next action
1. Complete Batch 15 reconciliation first. It remains assigned to Claude; this check neither reconciles nor advances that batch.
2. Do not bulk-unpublish 256 records solely from the STATE headline. That number is a database-wide reported count; this independently checked subset differs in coverage, timing and matching method.
3. Separate legitimate general-catalogue entries from erroneous entities, duplicates and inaccurate product attribution. Resolve the latter against the live database before changing publication.
4. If the intended general catalogue is also European UAV/C-UAS-only, decide that scope explicitly before applying edition eligibility across the whole site.

## Limits
Not a full current-database audit: batch 01, records outside available reconciliation reports, later manual DB changes, aliases and mergers may change coverage. No full alias resolution was performed for the catalogue. Exact-name matches are review leads, not guaranteed entity joins. Individual profile pages and browser rendering were not exhaustively tested. No database, publication status, website code, batch state or frozen snapshots changed.
