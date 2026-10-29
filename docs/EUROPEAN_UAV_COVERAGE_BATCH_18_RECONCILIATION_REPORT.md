# Batch 18 reconciliation — final merits-verification batch

Reconciled 2026-10-29. Input: `research-agent/researched/batch-18-researched.csv` (35 VERIFY rows).
Output: `research-agent/reconciled/batch-18-reconciliation.csv`.

**Verified 560 → 567.** No publication status changed. V1 and V2 untouched.

| | Research recommended | Claude applied |
|---|---:|---:|
| In scope / verified | 6 | **7** |
| Out of scope / excluded | 16 | **17** |
| Unknown / held | 13 | **11** |

Agreement on 33 of 35. Both differences turn on questions the live database already answers.

## The research CSV arrived damaged

Before any reconciliation: `batch-18-researched.csv` was delivered with a tool-output truncation
banner written into the top of the file — three junk lines ahead of the header — and one row,
**#18 KNDS Robotics**, truncated mid-cell so that its fields shifted and its verdict column read
`France`. The banner lines have been stripped. The KNDS row cannot be repaired without inventing
data, so its disposition was recovered from the batch-18 research report, which states the verdict
plainly, and the reconciliation CSV records the row as damaged rather than pretending it parsed.
No other row was affected.

## The two disagreements

**Grupo Amper — held as UNKNOWN, admitted.** The hold was over which entity inside the group owns
the counter-UAS command-and-control system: the listed parent, or *Amper Sistemas S.A.U.* This
catalogue holds **exactly one Spanish Amper record**, and the product page sits on that record's own
domain. There is no subsidiary record here to duplicate and nothing to allocate between. The same
reasoning admitted Liebherr Aerospace in Batch 17. If an Amper Sistemas record is ever created, the
product moves to it; the note on the record says so.

**Diehl Aviation — held as UNKNOWN, excluded.** The hold was over which Diehl entity owns the cited
ARES work. The database answers it: **Diehl Aerospace** and **Diehl Defence** are separate records,
both already verified, with their own products. What is left for the Aviation division is aircraft
cabin and avionics work plus a UAV cockpit **demonstrator** — the maturity rule that held GKN and
SE3 Labs. Excluded rather than held, because the entity question that justified the hold is closed.

## Five product-ownership errors found in the database

This batch found more misfiled products than any before it. None of them were visible from the
research CSV alone; all five came out of checking the queued names against what the database
already held.

| Product | Was filed under | Moved to | Why |
|---|---|---|---|
| **MISTRAL 3** | CS Group | **MBDA France** | CS Group is a C2 integrator. It does not build missiles. |
| **Fulgur** | Leonardo | **MBDA Italia** | The Italian Defence Ministry names MBDA Italia as the contracted developer. |
| **Threat-Sense** | *nobody* | **Pearson Engineering** | The product row had no company at all. |
| **Tactical Core Middleware** | Rheinmetall | **blackned** | blackned's own record already named TacticalCore as its product, while the product row sat under its parent. |
| **BOREADES** | *did not exist* | **CS Group** (created) | CS Group's only product was a missile that was not its. Its actual counter-UAV system was missing. |

The CS Group pair is the clearest: the one product on a verified French C-UAS company was somebody
else's missile, and the system it has sold since 2015 was not recorded at all. Both halves are now
right. CS Group keeps its verified status — it was never resting on the missile.

## The seven admitted

- **Alloyed** (UK) — Argive A300, a sovereign UK turbojet in serial production since September 2026, plus the A1100 in development. Both engines created; neither credited to a customer's airframe.
- **Grupo Amper** (Spain) — its own counter-UAS C2, as described above.
- **INFINTEQ** (Germany) — BKS HV and BKS MV unmanned-aircraft control stations.
- **MBDA France** — MISTRAL 3, whose current engagement set explicitly includes counter-UAV.
- **MBDA Italia** — FULGUR, contracted June 2025, first deliveries targeted 2028. The same contracted-programme standard as Avio Aero (Batch 15) and Liebherr (Batch 17).
- **Pearson Engineering** (UK) — Threat-Sense AI detection, tagged autonomy, **not** counter-UAS defeat. Mine detection is not drone defeat.
- **SensusQ** (Estonia) — Winning Mind intelligence fusion. Quantum Systems is the parent and keeps its airframes, as Welles Acoustics is already kept separate here.

## What was deliberately not created

**GULL ONE E.** The research listed it among INFINTEQ's offerings and asked that the original
designer be confirmed before assigning aircraft IP. A product called **GULL** already exists here
and belongs to **ARMMO Defense Technologies** of Spain. Without evidence that these are different
aircraft, creating a second GULL would have been the Bullspike error again. INFINTEQ was admitted on
its ground control stations alone, which is enough.

**Sky Warden** was left where it is, under MBDA Deutschland. The research found its Canadian
trademark registered to MBDA UK Limited — evidence against the current filing, but a trademark does
not settle engineering workshare, and the research said so. Recorded, not acted on.

## The shape of the exclusions

Seventeen exclusions, and almost all of them are the same four kinds of record:

- **Wrong domain — underwater or ground, not air** (7): DATUM, FFG, Fincantieri, KNDS Robotics, Leonardo (Underwater Systems), Norbit, S2M Equipment. In the Leonardo case *UAS* in the business name means **Underwater Armaments & Systems**, which is how it reached a drone landscape in the first place.
- **Orbital, not aerial** (2): SSTL, Thales Alenia Space Italia / e-GEOS. Batch 17 had nine of these; the scoring model still has no notion of altitude.
- **Not a company** (3): AGIMUS and Laser Zentrum Hannover are a consultancy and a nonprofit institute attached to a laser study whose laser belongs to **INLEAP Photonics**, verified here. Beretta Defense Technologies is an **alliance**, and Drone Guardian is already under Benelli.
- **General-purpose sensors** (3): Scantinel, Unseenlabs, Videometer — automotive LiDAR, orbital RF intelligence and laboratory imaging. The Batch 13 rule separated all three without argument.

A third **composite label** turned up: **Thales Alenia Space Italia / e-GEOS**, two companies joined
with a slash, matching the two found in Batch 17. Thales Alenia Space has its own record here
(already excluded); e-GEOS has none.

## Six descriptions corrected

Unseenlabs's record claimed synthetic-aperture radar imagery; the company does space-based **passive
RF** detection, which is a different technology. Scantinel's now records the MicroVision ownership.
Videometer, Beretta Defense Technologies, Leonardo (Underwater Systems) and the Thales Alenia Space
composite were rewritten to say what each record actually is.

## The eleven held, and why holding is the honest answer

61N Solutions, blackned, Cobham, DroneVia, Elbit Systems Deutschland, Fugro, iCOMAT, Odense Maritime
Technology, SDB AME, Skeleton Technologies, Ultra Maritime.

Four of them (iCOMAT, Odense Maritime, Skeleton, DroneVia) rest on **memoranda of understanding** —
an agreement to explore working together is not a product. In every one of those four the real
product belongs to a partner who is **already verified here**: Tekever, Destinus, GDELS, EHang.

**Ultra Maritime** is held with an explicit caveat written into the record: this is *not* a blanket
underwater exclusion. A sonobuoy purpose-built for an unmanned aircraft is an aerial payload and
would qualify. MSARS reached a first water trial in June 2026 with UAV integration still planned,
and the UK/US allocation is open.

**Fugro** is held on two separate grounds, which is worth stating because only one of them is an
evidence gap. RAMMS is real and is flown on UAVs, but it originates in the US business with Areté;
and whether an airborne survey lidar flown on a drone passes the Batch 13 rule at all is a **scope
question nobody has decided**. More research will not settle the second one.

## QA

| Check | Result |
|---|---|
| Rows dispositioned | 35 of 35 |
| Verified rows failing the eligibility rule | **0** |
| V1 snapshot | **273**, unchanged |
| V2 snapshot | **358**, unchanged |
| Publication status written | **none** |
| Backlog candidates with no description | 0 |

Products created: 7. Products reassigned: 4. Taxonomy rows added: 8. Aliases added: 1
(*Sensus Septima OÜ*).
