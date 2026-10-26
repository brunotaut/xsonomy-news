# European UAV & Counter-UAS — Batch 04 reconciliation

2026-10-26. 40 external research findings reconciled into the live database.
**V1 (273) and V2 (358) unchanged. No V3.**

## 1. Executive result

| | |
|---|---:|
| Findings processed | **40** |
| Verified before | **432** |
| Verified after | **441** |
| **Net change** | **+9** |
| New companies created | **0** |

| Outcome | Count |
|---|---:|
| REMAINS_CANDIDATE | 21 |
| EXISTING_UPDATED | 9 |
| EXCLUDED | 4 |
| NEEDS_REVIEW | 4 |
| OUT_OF_SCOPE | 1 |
| PRODUCT_CORRECTED | 1 |

**The admission rate keeps falling as predicted: 31 → 29 → 14 → 9.** Over half this batch was
component and applicability cases — companies whose parts *could* be used in a drone or a
counter-drone system, which is not the same as supplying one.

**The input file was clean.** Zero field-shifted rows, every evidence column a URL, all 40 IDs
matching the queue. The quoting fix requested after Batch 03 worked.

## 2. The dominant pattern: applicability is not capability

Eleven companies came back EXCLUDE_FOR_NOW on the same reasoning, and I agreed with all of them:
Senop, Opticoelectron, Transvaro, Optix, Safran Vectronix (optics), Acconeer, RFbeam, ams OSRAM
(sensor components), Ekspla (lasers), gfai tech (acoustic cameras), Dryad Networks (wildfire
sensors), Ericsson (telecom).

A radar module that *could* detect a drone, a laser that *could* become a dazzler, an acoustic
camera that *could* hear one — none of that is a product sold for the job. This is the same line
drawn for Blickfeld and NL Acoustics in earlier batches.

**Two cases where I went further than the research:**

- **smartmicro** was recommended `cuas-det-radar` at HIGH confidence on the claim that it "markets
  drone-detection applications" — but the only evidence given was the homepage. I checked that
  page. Its sole drone reference is a **"Drone Altimeter"**, which is a radar altimeter carried
  *by* a drone, not a sensor that detects one. **The recommendation is the reverse of what the
  cited source shows.** No classification assigned.
- **Axis Communications** was recommended `cuas-det-eo-ir` because its cameras appear inside other
  vendors' C-UAS integrations. That is third-party use, exactly like Evica's searchlight inside
  DroneShield. Declined.

## 3. Two entity collisions worth noting

**ORIGIN (Poland) vs Origin Robotics (Latvia).** The research flagged a generic-name collision
around the BLAZE warhead. The registry resolves it: **Origin Robotics is already verified and
already owns the BLAZE product record.** The Polish "ORIGIN" record looks like a second entity
created from the same MSPO reporting. Moved to `needs_review`; it must not inherit that
capability. Same shape as the Ukrainian EOS case.

**HENSOLDT Optronics vs Hensoldt.** The parent is already verified carrying `cuas-det-rf`,
`cuas-det-radar` and `cuas-def-rf-jamming`. Verifying the optronics subsidiary would count the
same company twice. `needs_review`, alongside **Photonis Netherlands** (part of Exosens) and
**Innoluce** (acquired by Infineon — the same historical-entity question as Ascending
Technologies).

## 4. Admitted (9)

| Company | Country | Taxonomy | Basis |
|---|---|---|---|
| Drone-Spices | Ukraine | `cuas-det-rf`, `cuas-def-rf-jamming` | Official site; Tsukorok detector deployed at scale, plus EW. |
| Escadrone | Ukraine | `uav-fpv` | Official site + Ukrainian MoD contracted-manufacturer list. |
| First Contact | Ukraine | `uav` (broad-only) | OSA and VIDSICH UAVs named, but no airframe type stated. EW is integration, so no C-UAS leaf. |
| Certo Aerospace | UK | `vtol-uav`, `uav-heavy-lift` | CAPSTONE coaxial heavy-lift UAS, confirmed by BAE Systems. |
| Skyports | UK | `eco-integration` | Active UK drone airline/operator. Service ecosystem, as with Centaurium and Flyde. |
| Elettronica (ELT Group) | Italy | `counter-uas` (broad-only) | C-UAS/EW offerings, no product-level modality attributed. |
| Aero Vodochody | Czech Rep. | `cuas-integrated` | Demonstrated L-39 Skyfox Drone Hunter C-UAS fit on its own aircraft. |
| GMV | Spain | `eco-ground-control` | C2SG validated for centralised control of unmanned platforms. |
| Intelic | Netherlands | `cuas-integrated`, `cuas-c2` | Nexus sensor-to-effector chain; Dutch MoD partnership. |

**Aero Vodochody settles a policy thread.** Batch 02 established that a crewed host platform is
acceptable (GDELS on a ground vehicle) but PZL Mielec failed because its M28 C-UAS was only a
*concept*. Aero **demonstrated** the Skyfox Drone Hunter with guided rockets and a targeting pod,
so it clears the bar PZL did not. The rockets are third-party, so it received `cuas-integrated`
and no mitigation leaf.

**12 explicit assignments** across 9 companies — 5 C-UAS leaves, 2 evidenced broad-only, 1
redundant directory-only parent archived.

## 5. Excluded and corrected

| Company | Outcome | Why |
|---|---|---|
| Oshen | excluded | C-Star is an autonomous ocean sailing robot. Product corrected UAV → Other. |
| Arkeus | out of scope | Melbourne-headquartered; a UK facility does not move HQ. Warden is a hyperspectral ISR payload carried *by* UAS, so Counter-UAS → Sensor. |
| Electric Aviation Maven | excluded | A consortium partner in a demo using BETA Technologies' ALIA CX300. The wrongly attached CX300 record was deleted. |
| Accenture | excluded | IT services contractor. |
| Marine Alutech | excluded | Supplies the patrol boats for a Finnish counter-drone fleet. Host platform, not capability. |

## 6. One policy question, parked not guessed

**Do warhead and energetic-materials suppliers belong in the UAV ecosystem?** It affects
**EURENCO** (DEMON, tied to arming drones) and **Odin Defence** (RagnaRasa drone warheads, carried
over from Batch 03).

Every component supplier admitted so far — actuators, motor controllers, engines, LiDAR payloads —
helps the aircraft **fly or sense**. A warhead is the munition it delivers. That is a scope
boundary, not an evidence question, so I did not guess: both are candidates with no taxonomy and
the question is written up in `decisions/batch-04-warhead-supplier-scope.md` with the arguments
either way. **It is not blocking** — the loop continues, and whichever way you decide applies
cleanly to both.

A second, smaller tension is recorded against **Droneflykart**: it is an airspace/drone map
service, and **SafeSky** was admitted as `eco-utm` in Batch 02 for airspace awareness. The
difference I relied on is that no company entity or product ownership is established for
Droneflykart — but the two are worth looking at together.

## 7. Landscape after Batch 04

| | Before | After |
|---|---:|---:|
| European-scope universe | 995 | **994** |
| Verified | 432 | **441** |
| — UAV only | 229 | **234** |
| — C-UAS only | 178 | **181** |
| — both | 25 | **26** |
| Classified-but-unverified | 47 | **44** |
| Unclassified | 468 | **453** |
| needs_review | 24 | **28** |
| Excluded | 30 | **35** (7 outside scope) |

441 + 44 + 453 + 28 + 28 in-scope excluded = **994**. Reconciles. Arkeus leaving scope accounts
for the −1.

Countries gaining verified companies: Ukraine +3, United Kingdom +2, and one each for Czech
Republic, Italy, Netherlands and Spain. **Publication: zero changes** (6 live / 3 draft).

## 8. QA

| Check | Result |
|---|---|
| V1 / V2 | 273 / 358 ✓ unchanged |
| All 40 rows accounted for exactly once | ✓ |
| Input file field integrity | 0 shifted rows ✓ |
| New duplicate companies | 0 ✓ |
| Out-of-scope company verified | 0 ✓ |
| Verified failing the eligibility rule | 0 ✓ |
| Publication statuses changed | 0 ✓ |
| Redundant unevidenced structural parents | 0 ✓ |
| Component supplier given a system-level leaf | none ✓ |
| Parent/subsidiary double-counting | none — HENSOLDT, Photonis, ORIGIN all held ✓ |
| Batch 05: size / verified / excluded / recycled / duplicate ids | 40 / 0 / 0 / 0 / 0 ✓ |
| Test suite | 21/21 pass ✓ |

## 9. Batch 05 — and the recommendation is now overdue

`research-agent/queue/batch-05.csv` — 40 cases, **19 countries**, 5 Ukraine, 5
classified-but-unverified, no recycled cases, no `LIKELY_NON_AERIAL` records.

**The queue is exhausted at the top and the trend is unambiguous.** P1 has been empty for three
batches. The top score is **39**, unchanged from Batch 04. Of 497 remaining candidates, **434 are
P4** — and they are P4 mainly because they have no description, website or product for the model
to score, not because they were assessed and found wanting.

Admissions per batch: **31 → 29 → 14 → 9**. Batch 05 is drawn from the same thin pool.

**I would stop running general batches after Batch 05 and do two things instead:**

1. **The Ukraine directory pass** — 39 companies in
   `queue/ukraine-directory-verification-queue.csv`, each needing one registry lookup. All 44
   remaining classified-but-unverified records are Ukrainian, so five per batch will take nine
   more batches to clear what one focused pass would.
2. **A bulk enrichment pass over the 434 P4 records** — fill descriptions, websites and products,
   then re-run this model. That re-ranks them for free and is the only way to surface companies
   the queue currently cannot see at all.

Continuing to draw general batches from a pool with no P1 and a 39-point ceiling will keep
returning single-digit admissions.

## 10. Outputs

| File | Rows |
|---|---:|
| `research-agent/reconciled/batch-04-reconciliation.csv` | 40 |
| `research-agent/queue/batch-05.csv` | 40 |
| `research-agent/queue/ukraine-directory-verification-queue.csv` | 39 |
| `research-agent/decisions/batch-04-warhead-supplier-scope.md` | — |
| `data/research/europe-uav-coverage-research-queue-post-batch-04.csv` | 497 |
