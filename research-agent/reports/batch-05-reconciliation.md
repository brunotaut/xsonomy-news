# European UAV & Counter-UAS — Batch 05 reconciliation

2026-10-26. 40 external research findings reconciled into the live database.
**V1 (273) and V2 (358) unchanged. No V3.**

## 1. Executive result

| | |
|---|---:|
| Findings processed | **40** |
| Verified before | **441** |
| Verified after | **448** |
| **Net change** | **+7** |
| New companies created | **0** |

| Outcome | Count |
|---|---:|
| REMAINS_CANDIDATE | 24 |
| EXISTING_UPDATED | 6 |
| EXCLUDED | 4 |
| NEEDS_REVIEW | 4 |
| EXISTING_CONFIRMED | 1 |
| COUNTRY_CORRECTED | 1 |

**Admissions: 31 → 29 → 14 → 9 → 7.** Input file was clean again — zero field shifts.

## 2. Three research claims I did not apply

**Frankenburg Technologies was already verified** — Estonia, `cuas-def-kinetic`, product Mark I.
The research described it as a **UK company** and recommended `cuas-def-interceptor`. Neither was
applied: a UK MoD contract does not move an Estonian company's HQ, and **Mark I is an interceptor
*missile*, whereas our interceptor leaf means an interceptor UAV** — the existing kinetic leaf is
the correct one. The UK MoD source was ingested as corroboration.

**Swarmer's "Brave1" product was deleted.** Brave1 is the Ukrainian government defence-tech
cluster — it appears in our own directory-exclusion regex — not a Swarmer product. Country also
corrected Germany → Ukraine, which the research did catch.

**Aura Aero's "ENGINeUS" was reassigned to Safran Electrical & Power.** ENGINeUS is Safran's
electric motor family; Aura Aero is a customer.

## 3. Entity resolution

**Manna existed four times**: Manna Aero (UK), Manna Air Delivery (Ireland), Manna Drone Delivery
(Ireland) and an unrelated US "Manna". The three European records were merged into the Irish
operating company, with slug redirects. The US record sits outside the landscape and was left alone.

**Czechoslovak Group duplicates CSG Group, which is already verified** with `cuas-integrated` and
`cuas-c2` from Batch 02 — the same Czech group under its long-form name. `needs_review`.

**Thales UK would be the fifth Thales record.** Thales and Aveillant (Thales) are verified and
already carry `cuas-det-radar`; Thales Nederland is already in needs_review for the same reason.
`needs_review` pending a group-entity policy.

**iXblue** merged with ECA Group into Exail. The registry holds Exail (excluded, maritime), Exail
Robotics, ECA Group and ECA Group / Infotron (verified). `needs_review` until the cluster is sorted.

**GRIF** — too generic to resolve from a directory seed. Same class as the Ukrainian EOS and the
Polish ORIGIN.

## 4. The line I drew on component suppliers

Half this batch was component and payload makers, and the research repeatedly asked "include if
ecosystem policy allows". The line applied, consistent with earlier batches:

> **Explicit marketing for UAV use is in. Mere applicability is out.**

**Admitted** — Intelligent Energy (`eco-propulsion`, UAV power modules and heavy-lift drone
powertrains), JetCat (`eco-propulsion`, miniature turbines built for UAV and target platforms),
Cubert (`eco-payloads`, explicitly markets airborne/UAV hyperspectral), Specim (`eco-payloads`,
offers drone remote-sensing applications).

**Declined** — Thermoteknix ("suitable for" UAV payloads), VIGO Photonics ("can serve"), Brolis
("used in unmanned-platform contexts"), Valeo (automotive LiDAR), Distran, Meopta, Pro Optica,
Videometer, LuxSpace, LOM PRAHA, 61N Solutions.

**Rotax is the closest call and the clearest illustration.** Its engines are genuinely widespread
on UAVs, but they are general light-aircraft powerplants with UAV use as one application. JetCat's
miniature turbines exist *for* UAV and target drones. Same category, opposite sides of the line —
and I would rather that distinction be written down than applied silently.

Also admitted: **Swarmer** (`eco-autonomy`), **FlyingBasket** (`uav-logistics`, `uav-heavy-lift` —
the company that actually flies the Ørsted cargo drones from Batch 03), **Manna Drone Delivery**
(`uav-logistics`, `eco-integration`).

## 5. Three consistency calls against earlier precedent

- **Kitemill** — autonomous tethered airborne kites, with Kitewall *presented* as persistent ISR.
  Presented is not delivered. Declined on the same bar PZL Mielec failed.
- **SVOS** — the MARS 4x4 shown with twin machine guns for drone defence. That is a weapon mount
  on a host vehicle, not the detection-and-engagement chain GDELS and Aero Vodochody demonstrated.
  Treated as a host platform, like Supacat, Defenture and Marine Alutech.
- **Varjo** — XR headsets used in UAS training. Declined where Inzpire was admitted, because
  Inzpire's service is drone-specific crew training while Varjo sells general XR hardware.

**Excluded**: Supacat, Defenture, FNSS (ground vehicles), Aura Aero (crewed aircraft).

**9 explicit assignments** across 7 companies.

## 6. Landscape after Batch 05

| | Before | After |
|---|---:|---:|
| European-scope universe | 994 | **992** |
| Verified | 441 | **448** |
| — UAV only | 234 | **241** |
| — C-UAS only | 181 | **181** |
| — both | 26 | **26** |
| Classified-but-unverified | 44 | **43** |
| Unclassified | 453 | **437** |
| needs_review | 28 | **32** |
| Excluded | 35 | **39** (7 outside scope) |

448 + 43 + 437 + 32 + 32 in-scope excluded = **992**. Reconciles. The −2 is the two Manna merges.

**Publication: zero changes.**

## 7. QA

| Check | Result |
|---|---|
| V1 / V2 | 273 / 358 ✓ unchanged |
| All 40 rows accounted for exactly once | ✓ |
| Input field integrity | 0 shifted rows ✓ |
| Out-of-scope company verified | 0 ✓ |
| Verified failing the eligibility rule | 0 ✓ |
| Publication statuses changed | 0 ✓ |
| Redundant unevidenced structural parents | 0 ✓ |
| Component supplier given a system-level leaf | none ✓ |
| Parent/subsidiary double-counting | none — Thales UK, Czechoslovak Group, iXblue all held ✓ |
| ENGINeUS owner / Manna records | Safran Electrical & Power / 1 European record ✓ |
| Batch 06: verified / non-candidate / duplicate ids | 0 / 0 / 0 ✓ |
| Test suite | 21/21 pass ✓ |

## 8. Batch 06 is not a general batch — and that is deliberate

**The general pool is exhausted.** Of 480 remaining candidates: P1 **0** (four batches running),
P2 **45** — of which **43 are the Ukrainian directory cluster** — P3 **16**, P4 **419**. The top
score is **39** and has not moved in three batches.

So the next queue is **not** another general 40. It is the dedicated pass both this report and
ChatGPT have been pointing at:

`research-agent/queue/batch-06-ukraine-directory.csv` — **43 rows**, the entire remaining
Ukrainian directory cluster in one go rather than five per batch for nine more rounds. Each needs
the same single lookup: a registry entry, an official domain, one named product. Ten of them have
already been looked at once without success and are marked to deprioritise.

**43, not 40**, because that is the whole cluster; trimming to 40 would strand three.

**After Batch 06, I would stop research batches entirely and run a bulk enrichment pass.** 419 of
480 remaining candidates are P4 because they have no description, website or product for the model
to read — not because anyone assessed them and said no. Enriching those fields and re-running this
model is the only move left that can surface companies the queue currently cannot see. Another
general batch would return five or six admissions at best.

## 9. Outputs

| File | Rows |
|---|---:|
| `research-agent/reconciled/batch-05-reconciliation.csv` | 40 |
| `research-agent/queue/batch-06-ukraine-directory.csv` | 43 |
| `data/research/europe-uav-coverage-research-queue-post-batch-05.csv` | 480 |

The open policy question on warhead suppliers (`decisions/batch-04-warhead-supplier-scope.md`)
is still unanswered and still not blocking.
