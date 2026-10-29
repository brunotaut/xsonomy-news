# Publication of the 162 verified landscape companies

Date: 2026-10-29. Authorised by Nazar, `research-agent/decisions/2026-10-29-publish-verified-landscape.md`.
Manifest: `research-agent/reports/2026-10-29-publication-manifest.csv` (captured before any write).

**Database publication: complete. Public deployment: complete and verified.** The build finished at
12:57:45 UTC and all five post-deploy checks pass, per ID rather than by count.

## Baseline reconciliation

The approval quoted 567 verified, 405 verified-and-published, 162 verified-but-unpublished. The live
database matched exactly:

| Measure | Approval | Live DB before writing |
|---|---:|---:|
| Verified (included, in a scope country) | 567 | **567** |
| Of those, already published | 405 | **405** |
| Of those, not published | 162 | **162** |

All 162 carried `publication_status = 'draft'`. No other status appeared. **Zero drift** against the
approval, so nothing had to be explained away or skipped on that account.

One figure did differ and is worth stating because it looks like drift and is not. The **live
landscape page held 398 companies**, not 405, when checked before the write. The page was built at
11:53 UTC today; the seven companies admitted in Batch 18 — Alloyed, Grupo Amper, INFINTEQ,
MBDA France, MBDA Italia, Pearson Engineering, SensusQ — were verified **after** that build.
398 + 7 = 405. Confirmed per ID against the live JSON, not inferred from the arithmetic.

## Prerequisites checked before writing

The landscape page is built by `scripts/lib/landscape.mjs` in the catalogue repository. A company
reaches it only if **all five** of these hold: `publication_status = 'live'`, reconciled status
`included`, a non-empty `slug`, an `hq_country` inside the configured scope, and at least one
taxonomy assignment inside the UAV or Counter-UAS trees. Publishing a record that fails any of the
other four would change a status and achieve nothing visible, so every one was checked first:

| Prerequisite | Failures among the 162 |
|---|---:|
| Reconciled `included` | 0 |
| Scope country | 0 |
| Slug present | 0 |
| Taxonomy inside the UAV / C-UAS trees | 0 |
| Slug collides with another company | 0 |
| Slug shadowed by an existing redirect | 0 |
| Slug outside `[a-z0-9-]` | 0 |

No record was skipped. All 162 qualified.

## Dry run and write

The dry run ran the update's exact `WHERE` clause as a `SELECT`: it returned **162** rows, matching
the manifest row for row.

The update is guarded and idempotent by construction — its predicate includes
`publication_status is distinct from 'live'`, so a second run matches nothing. It changed
**`publication_status` and `updated_at` only**. `last_reviewed_at` was deliberately left alone:
this is a publication, not a re-review.

| | Before | After |
|---|---:|---:|
| Rows updated | — | **162** |
| Companies live, whole catalogue | 2,304 | **2,466** |
| Verified landscape companies published | 405 | **567** |
| Verified landscape companies unpublished | 162 | **0** |
| Verified companies that would render on the landscape | 405 | **567** |

Prior statuses are retained in the manifest CSV, which is committed. Rollback is setting those 162
IDs back to `draft`; no other field was touched, so nothing else would need undoing.

## Deployment: complete

The catalogue deploys through `.github/workflows/deploy.yml`, which runs on push to `main`, on a
daily 06:00 UTC schedule, and on manual dispatch. There is no `gh` CLI and no GitHub token in this
environment, so a manual dispatch was not possible; the keychain was not touched. Instead the
`docs/STATUS.md` entry that rule 4 of CLAUDE.md requires anyway was committed and pushed to the
catalogue repository (`a3f7a3c`), which fired the push build.

**Build output live at `generatedAt` 2026-10-29T12:57:45.399Z**, replacing the 11:53:09.565Z build.

## Post-deploy verification

Per-ID membership, as the approval requires — not counts alone.

| # | Check | Expected | Actual | |
|---|---|---:|---:|---|
| 1 | `landscape.json` companies | 567 | **567** | PASS |
| 2 | Manifest IDs present | 162 | **162** | PASS |
| 3 | Pre-deploy IDs still present | 398 | **398** | PASS |
| 4 | Batch 18 admissions present | 7 | **7** | PASS |
| 5 | `companies.json` companies | 2,466 | **2,466** | PASS |

The three ID sets are disjoint and 162 + 398 + 7 = 567, which equals the page exactly. Since every
member of all three sets is a reconciled `included` company, **no `excluded`, `needs_review` or
`candidate` record is present on the page** — established by set equality, not assumed from the
builder's gate.

Five newly published company pages were fetched directly and all returned HTTP 200:
`/companies/3dfense/`, `/companies/a-techsyn/`, `/companies/abtrion/`, `/companies/infinteq/`,
`/companies/mbda-france/`.

## Two things this publication does not do

**Products stay in draft.** The approval covers companies. Of the 162, **26 have products** —
37 rows, 36 of them `draft`. Those 26 company pages will appear with empty product lists until
products are published, which is a separate decision and was not made. The remaining 136 have no
products either way.

**Nothing else changed.** No unpublication, no deletion, no scope change, no discovery, no ownership
repair. V1 remains 273 and V2 remains 358.

## One thing found in passing, not acted on

The local checkout of the catalogue repository has **uncommitted changes to
`scripts/generate-supabase.mjs` and `docs/STATUS.md`** from an earlier session — the C-UAS grouping
chip fix — and is **two commits behind `origin/main`**, which has since changed the same generator
file. That work is not deployed and now needs a merge. I left it untouched: untangling it is not
part of this publication, and a careless merge could lose it. The `docs/STATUS.md` entry for this
publication was therefore written from `origin/main` in a separate worktree, so the working tree was
not disturbed.
