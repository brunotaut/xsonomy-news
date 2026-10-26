# European UAV & Counter-UAS — Batch 02 reconciliation

2026-10-26. 40 external research findings reconciled into the live database.
**V1 (273) and V2 (358) unchanged. No V3.**

## 1. Executive result

| | |
|---|---:|
| Findings processed | **40** |
| Verified before | **389** |
| Verified after | **418** |
| **Net change** | **+29** |
| New companies created | **0** |

28 of the 40 were admitted. The 29th addition is **Valhalla Turrets**, which is not a Batch 02
row but is the evidenced owner of three products the batch moved off other companies (§4).

| Outcome | Count |
|---|---:|
| EXISTING_UPDATED | 26 |
| OUT_OF_SCOPE | 3 (Bale Defence, Asterion Group, Arnold Defense) |
| EXCLUDED | 3 (BMC, EvoloFoil, VoltAero) |
| ENTITY_RESOLVED | 2 (SCR, CAVOK Engineering) |
| NEEDS_REVIEW | 2 (Zireh, Leonardo Helicopters) |
| REMAINS_CANDIDATE | 4 (Blickfeld, NL Acoustics, PZL Mielec, Ratel Robotics) |

**Batch 02 was a domain-error batch.** Where Batch 01 was mostly about finding evidence, this
one was mostly about discovering that catalogued "UAVs" were ground vehicles, boats and crewed
aircraft. Eleven product records were in the wrong physical domain or on the wrong company.

## 2. Country corrections — all three leave the scope

| Company | From | To | Basis |
|---|---|---|---|
| Bale Defence | United Kingdom | **Australia** | Australian Business Register; RTV6 is an Australian ground vehicle. |
| Asterion Group | Ukraine | **United States** | The Ukrainian drone directory itself gives a Washington, D.C. address. Directory presence is not HQ. |
| Arnold Defense | Slovenia | **United States** | Headquartered and manufacturing in Missouri. Its rockets integrate into the Slovenian Skythunder — a company does not take the country of its integrator. |

**MGI Engineering was checked and NOT moved.** It carried a COUNTRY_CONFLICT flag, but official
MGI material confirms TigerShark as UK-developed under UK MOD Project BRAKESTOP. A flag is a
question, not a verdict.

The European universe falls from 1,000 to **997**.

## 3. Entity resolutions

**SCR Sistemas de Control Remoto** — acquired by Sener, which also exists as a separate record.
Kept SCR as its own operating brand with `acquired_by` recorded, rather than folding it into
Sener or duplicating Sener's portfolio.

**CAVOK Engineering / Cavok UAS** — **Cavok UAS already existed and was already verified**, with
the platform leaves. CAVOK Engineering therefore received `eco-integration` only and a
`subsidiary_of` relationship from Cavok UAS. No platform leaf was duplicated onto the parent.

**Leonardo Helicopters — held back deliberately.** Proteus is a genuine Leonardo autonomous
uncrewed helicopter, but **Leonardo, Sistemi Dinamici (Leonardo) and PZL-Swidnik (Leonardo Group)
are already verified**. Verifying a fourth Leonardo record would count the same operating company
again. Moved to `needs_review` with a `division_of` relationship; the capability is recorded, the
company count is not inflated.

**Zireh** — MANGART 25 AD is Valhalla Turrets' product. With it reassigned, nothing establishes
Zireh as a trading entity at all. Moved to `needs_review`.

**VoltAero** — liquidated June 2026, assets acquired by Aura Aero (which exists as a record).
`acquired_by` recorded; excluded as a crewed-aircraft company.

## 4. Product ownership and domain corrections

The heart of this batch. Eleven corrections, each from the owner's own material:

| Product | Was | Now | Why |
|---|---|---|---|
| Skythunder, Skythunder 300 | Arnold Defense (SI) | **Valhalla Turrets** | Valhalla's own C-UAS portfolio; Arnold is a US rocket supplier. |
| MANGART 25 AD | Zireh | **Valhalla Turrets** | Valhalla already held MANGART 25 and MANGART 30. |
| RTV6 | Counter-UAS | **Other** | Australian ground vehicle in a C-UAS configuration. |
| AMAZON | Counter-UAS | **Other** | Autonomous armoured **ground** vehicle that can carry a drone. |
| Evolo, GhostFoiler | UAV | **Other** | Autonomous hydrofoiling **uncrewed surface vessels**. |
| Ratel H, Ratel M | UAV | **Other** | Unmanned **ground** vehicles. |
| Cassio S | UAV | **Other** | **Crewed** hybrid-electric aircraft. |
| PZL M28 | UAV | **Other** | **Crewed** aircraft. |
| BARKAN | Counter-UAS | **Other** | HAVELSAN unmanned **ground** vehicle. |
| Trident | Effector | **Counter-UAS** | CSG multi-layer air-defence / counter-UAS system. |

**Valhalla Turrets became verified as a consequence.** It is the real Slovenian C-UAS company
behind Skythunder and Mangart; once the products landed where they belong, it satisfied the rule
on its own official evidence. It received `cuas-integrated` and `cuas-def-kinetic`. Flagging this
because it was not one of the 40.

**MESKO — a correction the research itself asked for.** The queued Deluge and Skynight products
could not be substantiated as MESKO's. They were left in place but **not used as the inclusion
basis**; MESKO's `cuas-def-kinetic` rests on Piorun missiles and 35mm programmable ammunition for
the Polish SAN anti-drone system instead. The two products remain a flagged ownership question.

## 5. Taxonomy

**59 explicit assignments added** across 27 companies — 17 C-UAS leaves, 42 in the UAV tree, 1
evidenced broad-only. **8 removed** (archived): directory-only `uav` parents made redundant by a
new leaf.

Where the research recommended more than the evidence carried, it was cut back:

- **CSG Group** was recommended a group-level set; it received `cuas-integrated` + `cuas-c2` only.
  Trident integrates radar, guns, EW and interceptors **from subsidiaries** — the parent does not
  inherit subsystem leaves.
- **RBL Defence Polska** received `cuas-integrated`, not modality leaves: Falcon detects, tracks
  and neutralises, but no modality is attributed to RBL as manufacturer.
- **Qognifly** was recommended 8 leaves and received 5. The reusable interceptors are its own; the
  AI tracking is a feature of Drone Wall, not a separate owned capability.
- **ALX Systems** was recommended `cuas-def-interceptor` on "historical company material". Dropped —
  historical work is not a current product. It kept loitering-munition, autonomy and navigation.
- **Drone Band** was recommended interceptor **and** kinetic; capture *is* the interception
  mechanism, so it received interceptor only.
- **HAVELSAN** received `eco-autonomy` alone. The airframe type of HAMZA-1 is not stated, and
  BARKAN is ground-domain.
- **Atarna** and **WARGdrones** received evidenced **broad-only `uav`** — registry evidence proves
  the entity and the aerial manufacturing purpose, but neither has a named product, so no
  platform leaf was invented.

## 6. Two policy decisions, documented

**PZL Mielec — crewed C-UAS platform.** Landscape policy *does* allow a C-UAS company whose host
platform is not a UAV: GDELS-Santa Bárbara was admitted in Batch 01 for an anti-drone fit on a
ground combat vehicle. So PZL is not blocked on policy. It is blocked on **evidence**: an M28
counter-UAS *concept* presented at MSPO is not a delivered system. Left as candidate; the M28
product category was corrected to crewed. Revisit if the concept becomes a product.

**Centaurium UAS — UAV operators.** The ecosystem already contains `eco-integration` companies, so
operational service providers are in scope. Centaurium was admitted conservatively as an
operator/integrator, not as an OEM.

## 7. Batch 01 follow-ups — both resolved

**HAVELSAN**: the AOI sales agreement for HAMZA-1 establishes HAVELSAN as the autonomy and
engineering partner with AOI manufacturing. Admitted on `eco-autonomy`. BARKAN confirmed
ground-domain and recategorised — the opposite of what the original queue assumed.

**WARGdrones**: the German commercial register confirms WARGdrones GmbH, Hamburg, with a corporate
purpose covering development, manufacture and sale of drones. This answers the Batch 01 question
that the placeholder website could not. Admitted on **broad-only `uav`** — the register proves the
entity, not a product line.

## 8. Duplicate risks flagged, not merged

- **CSG Group vs Czechoslovak Group** — both Czech candidate records for the same group.
- **Hertz Systems vs Hertz New Technologies** — still open from Batch 01.
- **GDELS-Santa Bárbara Sistemas vs Santa Bárbara Sistemas** — still open from Batch 01.

## 9. Landscape after Batch 02

| | Before | After |
|---|---:|---:|
| European-scope universe | 1,000 | **997** |
| Verified | 389 | **418** |
| — UAV only | 204 | **221** |
| — C-UAS only | 171 | **175** |
| — both | 14 | **22** |
| Classified-but-unverified | 63 | **50** |
| Unclassified | 517 | **493** |
| needs_review | 19 | **21** |
| Excluded | 14 | **20** (5 now outside scope) |

418 + 50 + 493 + 21 + 15 in-scope excluded = **997**. Reconciles.

Countries gaining verified companies: Poland +4, United Kingdom +4, France +3, Ukraine +3,
Italy +2, Romania +2, Spain +2, Turkey +2, and one each for Belgium, Czech Republic, Germany,
Lithuania, Netherlands and Switzerland.

**Publication: zero changes.** The 28 newly verified split 14 live / 14 draft.

## 10. QA

| Check | Result |
|---|---|
| V1 / V2 entries | 273 / 358 ✓ unchanged |
| All 40 rows accounted for exactly once | ✓ |
| New duplicate companies | 0 ✓ |
| Out-of-scope company verified | 0 ✓ |
| Ground/maritime/crewed product left in a UAV category | 0 ✓ |
| Counter-UAS category left on a ground system | 0 ✓ |
| Company verified on directory evidence alone | 0 ✓ |
| Verified companies failing the eligibility rule | 0 ✓ |
| Publication statuses changed | 0 ✓ |
| Redundant **unevidenced** structural parents | 0 ✓ |
| New redundant evidenced parents from Batch 02 | 0 ✓ |
| Integrated systems exploded into component leaves | none — CSG, RBL, Qognifly and Telespazio all held back ✓ |
| Batch 02 companies left in the normal queue | 4 — the four not admitted, by design ✓ |
| Batch 03: size / verified / excluded / recycled / duplicate ids | 40 / 0 / 0 / 0 / 0 ✓ |
| Test suite | 21/21 pass ✓ |

The pre-existing UAV-tree redundancy noted in the Batch 01 report (112 `uav`-root rows sourced
from directories) is unchanged — still out of scope, still a known backlog item.

## 11. A model improvement this batch forced

The scoring model had **no notion of physical domain**, which is why it kept surfacing boats and
ground vehicles as UAV candidates. A `LIKELY_NON_AERIAL` hint now flags companies whose product
text reads maritime, ground or crewed with no aerial signal — **14 companies** in the current
queue. They remain in the queue, flagged, and are excluded from Batch 03's picks. Every research
question in the new queue also now asks explicitly whether the system is aerial, ground or
maritime.

## 12. Batch 03

`data/research/europe-uav-coverage-chatgpt-batch-03.csv` — 40 cases, **14 countries**, scored from
the updated database.

**P1 is now empty.** Two batches have consumed the entire high-value end of the queue; the
remaining 543 candidates are P2 70 · P3 29 · P4 444. Composition: 6 classified-but-unverified,
34 unclassified, capability-gap probes, no recycled Batch 01/02 cases.

**§23's 15–20 classified-but-unverified target is unreachable, and the brief already anticipated
why.** Of the 50 remaining, **49 are Ukrainian directory-only** and 1 is Polish. Honouring §24's
5-Ukraine cap leaves 6. All **44** remaining Ukrainian cases are exported to
`data/research/ukraine-directory-verification-queue.csv` for the dedicated single-country pass.

**Blickfeld and NL Acoustics were deliberately not recycled.** Both were researched in Batch 01
*and* Batch 02 and reached the same conclusion twice. A third pass would waste the slot.

## 13. Outputs

| File | Rows |
|---|---:|
| `data/research/europe-uav-coverage-batch-02-reconciliation.csv` | 40 |
| `data/research/europe-uav-coverage-research-queue-post-batch-02.csv` | 543 |
| `data/research/europe-uav-coverage-chatgpt-batch-03.csv` | 40 |
| `data/research/ukraine-directory-verification-queue.csv` | 44 |
