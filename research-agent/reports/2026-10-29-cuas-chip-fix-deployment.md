# C-UAS grouping-chip fix: merged, deployed, verified

Date: 2026-10-29. Repository: `brunotaut/xSonomy` (catalogue). Scope: this interface fix only.
No database write, no publication change, no research status touched.

**Deployed and verified.** Build `2026-10-29T13:51:02.050Z`. Every chip count matches what was
predicted from the live data before the push, and the registry size did not move.

## What was wrong

`fetchCuasCapabilities()` in `scripts/generate-supabase.mjs` selected sectors by the `cuas-` slug
prefix and chipped each company with whatever taxonomy rows it happened to hold. That treats
`cuas-detection` — a grouping — as if it were a capability like `cuas-det-radar`. A radar company
was counted under "Detection" only if somebody had *also* stored the redundant parent row.

The fix walks `parent_id` from the `counter-uas` root and gives each company its own capabilities
**plus every grouping above them**. Nesting comes from `parent_id`, never from the slug, because
`cuas-integrated` is a leaf hanging directly off the root while `cuas-detection` is a parent — no
prefix rule gets both right.

## Preserving the work and reconciling with main

The fix existed only as **uncommitted edits** to `scripts/generate-supabase.mjs` and
`docs/STATUS.md` in a local checkout that was **four commits behind `origin/main`**, and main had
since changed the same generator file. The working tree was backed up first, then committed to a
branch at its original base (`2f72465`) so the merge had two real parents and nothing depended on
an unsaved file.

Merging `origin/main` produced **one conflict, in `docs/STATUS.md`** — both sides had appended
entries. Both were kept, in date order. The generator **merged cleanly**: main's `fetchLandscape`
import, the `publication_status` column on the companies select and the Landscape tab all sit
alongside the rewritten function, whose prefix-based predecessor no longer exists anywhere in the
file.

## Checks

| Check | Result |
|---|---|
| `node --check scripts/generate-supabase.mjs` | pass |
| `node --check scripts/lib/landscape.mjs` | pass |
| `npm test` (the suite `landscape-checks.yml` runs) | **10 of 10 pass** on the merged tree |
| Re-run after the STATUS correction | 10 of 10 pass |

## The published figures were stale, and have been corrected

The draft `STATUS.md` entry predicted **199 vendors** and Detection 47 → 85, Mitigation 85 → 123,
Tracking 0 → 35. Those numbers were worked out on 2026-10-26 and **two things happened before the
fix shipped**:

1. The stored parent rows were deleted, which pushed the grouping counts *further down*, not up.
2. **162 companies were published earlier today**, which enlarged the registry.

Shipping the entry unchanged would have put three wrong numbers into the permanent log. Both
columns below were re-measured against live data on 2026-10-29, so the comparison isolates this
fix and nothing else.

## Verified on the live site

| Chip | Before | After | Expected |
|---|---:|---:|---:|
| **Vendors in the registry** | 300 | **300** | 300 — unchanged |
| Mitigation | 31 | **180** | 180 |
| Detection | 18 | **118** | 118 |
| Tracking / Identification | *absent* | **52** | 52 — new chip |
| Integrated | 51 | 51 | 51 |
| Command & Control | 29 | 29 | 29 |

All ten specific capability chips unchanged and matching exactly: Interceptor UAV 65, Kinetic 42,
RF Detection 40, RF Jamming 38, Radar 37, EO/IR 26, Acoustic 21, AI / Computer Vision 19,
Sensor Fusion 16, Directed Energy 13, GNSS 5. **No unexpected chip appeared.**

Read back from the deployed `/data/cuas-systems.json`, not from a local build. `/cuas-systems/`
returns HTTP 200 and renders "300 vendors".

**No regression to this morning's publication:** `landscape.json` still holds **567** companies and
`companies.json` still **2,466**, on the same build.

## Scope held

Draft products untouched — the 36 draft product rows belonging to 26 newly published companies are
still draft. No research status, candidate status or `publication_status` was changed. V1 remains
273 and V2 remains 358. The only database access was read-only SQL to predict and confirm the chip
counts.
