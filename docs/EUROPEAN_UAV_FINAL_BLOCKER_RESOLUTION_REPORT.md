# European UAV & Counter-UAS Landscape — final pre-V2 blocker resolution

2026-10-26. Scope limited to the two blockers from the legacy C-UAS provenance audit.
`europe-uav-cuas-2026-v1` unchanged (273 entries, untampered). **No V2 created.**

---

## Sky Map

**Entity identified?** Yes — and it is not a company.

Targeted research found Reuters-sourced reporting that Sky Map is a **Ukrainian software
platform for coordinating the response to drone attacks**: a map and video interface that
synthesises radar and sensor data. Ukrainian personnel deployed it at **Prince Sultan Air
Base, Saudi Arabia**, and trained US troops on it — which matches the "also deployed in Saudi
Arabia" line already sitting in the product summary. **No source names a developer company
called Sky Map.**

Two further defects surfaced:

- The record's description said "aerial reconnaissance and **mapping** systems", which
  contradicts its own product summary and matches nothing in the evidence.
- The "10,000+ passive acoustic sensors" figure belongs to **Sky Fortress**, a separate
  Ukrainian acoustic network that is already a distinct record here with the correct
  `cuas-det-acoustic` leaf. The summary appears to have been written from Sky Fortress
  material and attached to the wrong record.

**Evidence found:** yes, for the *platform* — `mezha.net` (Reuters-sourced). Not for a company.

**Taxonomy decision:** `cuas-c2` removed. The capability is real but it belongs to a system
whose owner is unknown, and an unsourced entity must not be frozen. No substitute leaf was
assigned. The record is **kept, not deleted**, with the evidence attached and the
misattribution corrected, so the work is recoverable the moment a developer is identified.

**Verification: verified → not verified.** Marked `needs_review` as PRODUCT_NOT_COMPANY.

---

## DefSecIntel Solutions

| | |
|---|---|
| Canonical entity | DefSecIntel Solutions |
| Country | Estonia |
| Website | `defsecintel.com` |
| Products | EIRSHIELD |
| Evidence | Defence Industry Europe (partnership agreement), Janes (Latvia demonstration), Estonia.ee (Poland expansion) |

**Capability.** EIRSHIELD is an AI-assisted ultra-short-range counter-UAS architecture with
multi-layer sensor fusion and AI-assisted command and control, demonstrated in Latvia paired
with Origin Robotics' BLAZE interceptor.

**Final taxonomy:** `cuas-integrated`, `cuas-track-fusion`, `cuas-c2` (plus pre-existing
`sensors`).

The architecture also *lists* radar, RF, EO/IR and acoustic sensors — but as components it
integrates, not as DefSecIntel products. **No detection leaf was assigned**, because
integrating a sensor is not supplying one.

**Verification:** verified before and after. It was previously classified only as `sensors`;
it is now properly a C-UAS company.

---

## Origin Robotics

| | |
|---|---|
| Canonical entity | Origin Robotics |
| Country | **Latvia** (not Estonia — it is the Latvian half of the pairing) |
| Website | `originrobotics.com` (corrected from the `origin-robotics.com` in `source_urls`) |
| Products | BLAZE |
| Evidence | Janes (automated interception in Latvia), DroneLife (first fully automated counter-drone interception in the Baltic region) |

**Capability.** BLAZE is an autonomous counter-drone interceptor with AI-driven tracking,
computer vision and a fragmentation warhead.

**Final taxonomy:** `cuas-def-interceptor` (re-sourced), `cuas-track-ai-cv` (explicit computer
vision), `cuas-def-kinetic` (fragmentation warhead), plus pre-existing `cuas-mitigation` and
`sensors`.

Its interceptor leaf previously cited only a bare domain; it now cites the Janes report of the
automated interception.

**Verification:** verified before and after.

---

## Entity repair — what actually happened

The conflated record turned out to be **case B: both companies already existed as correct,
separate records.** The row named `DefSecIntel · Origin Robotics` was an empty shell — no
products, no article links, no source URLs, one bogus `jv_partner` edge and a bare
`counter-uas` tag. Nothing unique was attached to it, so nothing needed splitting or
reassigning.

**A merge was attempted and refused.** The frozen V1 snapshot references this company, and the
foreign key from `landscape_entries` blocks deletion. That is the immutability guarantee
working as designed, and it is the second time it has prevented a duplicate from being merged
away. The shell was therefore **neutralised in place**:

- classification stripped (`counter-uas` removed)
- the bogus `jv_partner` edge deleted
- `merged_with` edges recorded to **both** real companies
- excluded from the Landscape with an explanatory screening note
- description rewritten to state plainly that it is not a single company

**No company was renamed, created or split. No article links or products were reassigned,
because the shell had none.**

The partnership is real and is now recorded where it belongs: a `partner` edge between
DefSecIntel Solutions and Origin Robotics, from the September 2025 MoU. It was **not**
assumed from the record name — it was evidenced independently.

---

## Three further cases surfaced by the final check

Resolving the two blockers exposed a third population: verified companies whose *only*
classification was an unevidenced broad C-UAS node — the same shape as Sky Map.

| Company | Outcome |
|---|---|
| **Phantom Defense** (Ukraine) | Evidence attached. Eurosatory 2026 coverage establishes a counter-UAS EW range, so the broad node is legitimate. No specific leaf: no source names the defeat modality, and inferring RF jamming from "EW" is not permitted. **Stays verified.** |
| **Cambridge Sensoriis** (UK) | C-UAS classification **removed**. Its micro-radar serves a drone's *own* detect-and-avoid, precision landing and GPS-denied navigation — a UAV-side sensor role. Leaves the verified subset. |
| **SAF Tehnika** (Latvia) | C-UAS classification **removed**. No company source URLs at all, and Spectrum Compact is handheld RF test equipment. Leaves the verified subset. |

---

## A correction to my own earlier work

The 2026-10-25 integrity sprint deleted an **AIDC** article link as a false match. That was
wrong. The article names *"Aerospace Industrial Development Corporation"* — which **is** AIDC.
The fault was in my audit view: it compared the short DB name against the extractor's output
and read a spelled-out legal name as a mismatch. The nightly linker correctly recreated the
link.

Fixed: the classifier now also accepts an extracted name that contains the canonical name as a
whole word, so a long legal name against a short record reads as VALID rather than FALSE_MATCH.
The AIDC entry has been withdrawn from the false-match register.

**Suzuyo was a genuine false match** and did recur — the articles name *Suzuki Motor
Corporation*. Both links were deleted again and the tag is now cached as a refusal so the next
nightly run cannot recreate them.

---

## Landscape effect

| | Before | After |
|---|---|---|
| **Verified** | 362 | **359** |
| UAV only | 183 | 183 |
| C-UAS only | 168 | 165 |
| both | 11 | 11 |
| Unclassified | 540 | 539 |
| Unresolved | 74 | 74 |
| Needs review | 14 | 17 |
| Excluded | 9 | 10 |

Five companies left the verified subset across this pass: Sky Map, Cambridge Sensoriis, SAF
Tehnika (classification removed), the conflated shell (excluded), with DefSecIntel Solutions
and Origin Robotics strengthened rather than lost.

---

## Final C-UAS provenance check

| | Count |
|---|---|
| 1. Specific C-UAS assignments without an evidence URL | **0** |
| 2. Verified C-UAS companies without a specific leaf | **2** — AegisX and Phantom Defense, both evidenced and legitimately broad |
| 3. Unresolved C-UAS entity conflations | **0** |
| 4. Invalid product ownership | **0** |
| 5. `cuas-integrated` without evidence | **1** — Teledyne FLIR Defense, held from the 2026-10-25 audit and no longer in European scope |
| 6. Verified C-UAS companies whose only classification is unsupported | **0** |

---

## QA

| Check | Result |
|---|---|
| V1 = exactly 273 | **PASS** |
| V1 tampered rows | **PASS** (0) |
| No V2 | **PASS** — `europe-uav-cuas-2026-v1` only |
| Duplicate normalised company names | **PASS** (0) |
| Self relationships | **PASS** (0) |
| Orphan taxonomy | **PASS** (0) |
| Invalid product ownership | **PASS** (0) |
| False article links | **PASS** (0 after the AIDC false positive was corrected and Suzuyo re-deleted) |
| Article-link regression tests | **PASS** — 13/13 |
| Taxonomy added in this task without an evidence URL | **PASS** (0) |
| Verified companies outside scope | **PASS** (0) |
| Accidental publications | **PASS** (0) |

### Publication inconsistencies to report, not fix

- **`DefSecIntel · Origin Robotics` is still `live`.** It is a demonstrably invalid entity, now
  carrying no classification and excluded from the Landscape, but its public page still exists.
  It cannot be deleted (V1 references it) and unpublishing is a publication decision, which
  project rules reserve for you. Recommend moving it to `draft`.
- **Sky Map is still `live`** on the same reasoning: it is a product, not a company.

---

FINAL BLOCKERS RESOLVED — READY FOR PRE-V2 AUDIT

Both named blockers are closed. Specific C-UAS assignments without evidence: **0**. C-UAS
entity conflations: **0**. The two remaining broad-only C-UAS companies are evidenced and
legitimate, which the brief explicitly does not treat as blockers, and the held
`needs_review` cases are excluded from snapshot eligibility.

The two publication inconsistencies above are decisions for you, not technical blockers — but
both records are already outside the verified subset, so neither can reach a V2 snapshot.
