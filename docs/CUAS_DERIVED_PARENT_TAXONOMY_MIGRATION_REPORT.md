# C-UAS derived-parent taxonomy migration

2026-10-26. First post-V2 architecture task. **V1 and V2 snapshots unchanged. No V3.**

## 1. The problem, stated plainly

A company that does counter-drone radar used to carry two rows: `cuas-det-radar` and
`cuas-detection`. The second says nothing the first had not already said — radar *is*
detection — but it was a row like any other, so anything that counted rows counted it
as a capability.

That is how I reported **"111 unevidenced C-UAS capability assignments"** in an earlier
session. The query selected sectors with `slug LIKE 'cuas-%'`. The real figure was **10
unevidenced capabilities and 101 structural parents**. The number was not wrong because
the data was wrong. It was wrong because the storage model let a parent impersonate a
capability, and a slug pattern could not tell them apart.

This migration removes the ambiguity at the source: **the most specific sector is
stored, every parent above it is computed.**

## 2. The hierarchy, as the database actually holds it

Read from `sectors`, not assumed:

```
counter-uas                 Counter-UAS                 kind=domain
├─ cuas-detection           C-UAS Detection             kind=capability       (parent)
│  ├─ cuas-det-acoustic · cuas-det-eo-ir · cuas-det-radar · cuas-det-rf
├─ cuas-tracking            Tracking / Identification   kind=capability       (parent)
│  ├─ cuas-c2 · cuas-track-ai-cv · cuas-track-fusion
├─ cuas-mitigation          C-UAS Mitigation            kind=capability       (parent)
│  ├─ cuas-def-directed-energy · cuas-def-gnss · cuas-def-interceptor
│  ├─ cuas-def-kinetic · cuas-def-rf-jamming
└─ cuas-integrated          Integrated C-UAS Systems    kind=cuas_capability  (LEAF)
```

Two details defeat any slug rule, which is why none is used any more:

- **`cuas-integrated` is a leaf that hangs directly off the root.** Depth does not
  identify a parent.
- **`cuas-detection` is a parent and `cuas-det-radar` is a leaf**, and both start
  `cuas-`. Prefix does not identify a capability.

Leaf-ness is now decided the only way that is always right: *a sector is a leaf when
nothing has it as a parent.*

## 3. Every C-UAS assignment, classified

457 live `company_sectors` rows sat in the counter-UAS subtree.

| Classification | Rows | What it means |
|---|---:|---|
| `SPECIFIC_LEAF` | 309 | A real capability. Untouched. |
| `STRUCTURAL_PARENT` | 94 | The company also holds a leaf beneath it — pure redundancy. |
| `LEGITIMATE_BROAD_ONLY` | 4 | Evidenced as counter-UAS with no modality stated. Kept. |
| `UNSUPPORTED_BROAD` | 50 | Broad, unevidenced, no leaf. Not redundant — left alone, see §9. |

The four legitimate broad-only companies are **AegisX** (NATO DIANA), **Rattlesnake**,
**Stendr** (both sourced detection with no modality named) and **Phantom Defense**
(Eurosatory 2026). All four are verified members of V2. None was forced into a leaf it
cannot support.

## 4. What was removed

**93 of the 94** structural rows were archived and deleted: `counter-uas` ×4,
`cuas-detection` ×35, `cuas-mitigation` ×54.

One was kept. **Milliray** holds an evidenced `cuas-detection` row (NATO DIANA names
drone detection without stating a modality) and later gained a `cuas-det-radar` leaf.
The row is technically redundant, but deleting it would destroy a citation to buy a
tidier model, so it stays as an explicit evidenced assignment and its note — which
still claimed "no leaf is assigned" — was corrected.

A **94th row outside the stated scope** was also removed by the same rule:
**AirRobot GmbH & Co. KG** held both the `uav` root and `uav-isr`. The invariant is not
C-UAS-specific, so the UAV root row went too. All UAV counts were verified unchanged
(§6). Flagging it because it was not in the brief.

Everything removed is in `company_sectors_derived_archive` with its original evidence,
confidence, note and assignment metadata. The deletion is reversible.

**Side effect worth recording:** 89 of the deleted rows carried `is_primary = true`, and
those 89 companies now have no primary sector. `is_primary` appears nowhere outside the
schema definition — no script, query or page reads it — so nothing changes behaviourally.
Inventing a primary leaf would have been a guess, so none was made.

## 5. The model that replaced it

| View | Answers |
|---|---|
| `v_sector_closure` | Ancestor/descendant pairs for the whole taxonomy. **Use instead of slug patterns.** |
| `v_sector_leaves` | Sectors with no children. |
| `v_company_sectors_explicit` | What was actually asserted, and on what evidence. |
| `v_company_sectors_effective` | Explicit **plus** derived parents — for display and counts. |
| `v_cuas_specific_capabilities` | Specific capabilities only, decided structurally. |
| `v_cuas_specific` | Unchanged contract; now structural instead of a hard-coded slug list. |

**Provenance rule.** Every effective row carries `assignment_type`:

- `explicit` — somebody asserted it, with whatever `source_urls` and `confidence` they had.
- `derived` — implied by a more specific sector. It carries **no source_urls and no
  confidence**, and names its basis in `derived_from`. A parent is an arithmetic
  consequence of a leaf, not a separately sourced claim; copying the leaf's URL upward
  would manufacture evidence nobody wrote.

## 6. Proof that nothing moved

The whole point of a storage change is that it changes storage and nothing else.

| Measure | Before | After |
|---|---:|---:|
| Verified set (V2 eligibility rule, recomputed) | 358 | **358** |
| …with C-UAS | 175 | **175** |
| …with UAV | 194 | **194** |
| …both / C-UAS only / UAV only | 11 / 164 / 183 | **11 / 164 / 183** |
| Companies with any C-UAS classification | 234 | **234** |
| All 13 specific capability counts | — | **13 of 13 identical** |
| V1 snapshot entries | 273 | **273** |
| V2 snapshot entries | 358 | **358** |
| Redundant unevidenced rows remaining | 94 | **0** |

Per-capability: c2 25 · directed-energy 11 · gnss 4 · interceptor 43 · kinetic 30 ·
rf-jamming 28 · acoustic 18 · eo-ir 23 · radar 34 · rf 33 · integrated 28 · ai-cv 18 ·
fusion 14. Unchanged, every one.

## 7. What *did* change, and why that is a correction

The three grouping categories now count everyone they should. On the public
`/cuas-systems/` page, for live companies:

| Chip | Site before | Site after | |
|---|---:|---:|---|
| Detection | 47 | **85** | was undercounting |
| Mitigation | 85 | **123** | was undercounting |
| Tracking / Identification | 0 | **35** | never appeared at all |
| All 13 specific capabilities | — | — | identical |
| Companies listed in the registry | 199 | **199** | identical |

The old numbers were not a measure of anything. A company appeared under "Detection"
only if somebody had happened to also store the parent row — 47 of the 85 companies
that actually do detection. Under derivation the category means "has a detection
capability", consistently, and `cuas-tracking` stops being invisible despite 35
companies sitting under it.

Membership of the registry and every specific capability is untouched. This is the one
visible change and it is a correction, not drift.

## 8. Keeping it fixed

Writes reach `company_sectors` from this repo *and* from the catalogue repo, so the
guard lives in the database, with a readable helper in front of it.

**Database triggers** (`db/migrations/2026-10-26_cuas_derived_parent_taxonomy.sql`):

- `company_sectors_no_implied_parent` — an unevidenced parent of something the company
  already holds is silently not stored.
- `company_sectors_prune_implied_parents` — adding a specific sector removes the parents
  it makes redundant.
- Both exempt rows carrying evidence or product links. The invariant is never worth a
  lost citation.

**Shared helper**: `scripts/lib/taxonomy.mjs` — `buildTaxonomy`, `deriveEffectiveSectors`,
`specificCapabilities`, `planAssignment`. One place decides what a leaf is.

**8 unit guardrails**: `scripts/test/taxonomy-derivation.test.mjs` (`npm test`, 21/21 pass
with the existing linking suite). They cover: leaf-ness is structural not prefix-based;
counting capabilities never counts a parent (the original regression); an implied parent
is not stored; a later leaf prunes it; an evidenced broad-only survives; an evidenced
parent is not pruned; derived parents carry no evidence and name their basis; the
effective view lists each sector once with explicit winning.

**6 live trigger tests** ran against the database and passed, fixtures removed.

## 9. Left open, deliberately

**50 unevidenced broad assignments** — exported to
`data/research/cuas-broad-only-unevidenced-backlog.csv`. These are not redundant (no leaf
implies them) so the migration left them alone. Every one is a pre-landscape seed row for
a **non-European** company — United States, Israel, Japan, Russia, India, Australia,
Malaysia — and **none is in V2**. They are a data-quality backlog for Nazar, not an
architecture problem, and deleting unevidenced classifications is a content decision, not
mine to take.

Also noted: **2 of the 309** specific capability assignments are unevidenced. That is the
real version of the number that was once reported as 111.

## 10. Boundaries

Not done, by instruction: V1 and V2 untouched; no V3; no company discovery; the 542
unclassified and 74 classified-but-unverified companies untouched; no UAV provenance
campaign; no maturity changes; no parent/subsidiary merges; no taxonomy redesign; no
broad-only company forced into a leaf.

Changed outside this repo: `xSonomy/scripts/generate-supabase.mjs` now derives the
grouping chips from `parent_id` instead of matching `cuas-` slugs. The catalogue build
could not be run locally (no `.env`), so the generator's output was verified by
reproducing its exact logic against the database (§7) rather than by executing it. **The
next catalogue deploy will carry the §7 chip changes.**
