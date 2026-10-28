# Batch 14 reconciliation — European UAV & Counter-UAS Landscape

Reconciled 2026-10-28. Input: `research-agent/researched/batch-14-researched.csv` (40 rows,
enrichment only). Output: `research-agent/reconciled/batch-14-reconciliation.csv`.

**Verified 524 → 533.** Landscape rows 981 → 977 after four merges.

| | Batch 11 | Batch 12 | Batch 13 | Batch 14 |
|---|---:|---:|---:|---:|
| Admitted | 3 | 6 | 11 | **9** |
| Excluded | 21 | 23 | 19 | **15** |
| Held for review | 10 | 9 | 5 | **12** |
| Merged | 4 | 2 | 5 | **4** |

**The blank-record backlog is now zero.** When this run started, 214 companies in the backlog had
no description, no website and no product. There are none left.

## Four merges, all four into already-verified companies

| Duplicate | Merged into | Why it was a duplicate |
|---|---|---|
| **Tehavtofart Pivden** | **TAF Industries** | the same company under its registered Ukrainian name; the keeper already held the Kolibri family |
| **Dropla** (filed Ukraine) | **Dropla Tech** (Denmark) | the keeper already held five products |
| **Meteksan Savunma** | **METEKSAN Defence** | the same company in Turkish; the keeper already held Retinar and KAPAN |
| **ECA Group** | **ECA Group / Infotron** | the keeper holds the IT180 UAV lineage |

Every one was a duplicate of a company already verified. That is the fifth consecutive batch in
which the live-database check changed the outcome, and this time it changed all four.

**ECA Group was merged differently from the research's advice.** ECA Group joined iXblue to form
Exail in 2022, and the research recommended folding the IT180 evidence into Exail. The landscape
already separates these: `ECA Group / Infotron` holds the UAV lineage and is verified, while `Exail`
is excluded as maritime. Merging into Exail would have collapsed that distinction and dragged a
verified UAV record into an excluded maritime one. The duplicate went to Infotron instead.

## A procurement platform was filed as a Ratel product

**Ratel Robotics** held a product record called **DOT-Chain Defence**. DOTChain is the Ukrainian
Ministry of Defence's procurement and supply-management platform — not a product, and not Ratel's.
It was removed from Ratel and attached to the DOTChain record, which is itself excluded as a
government platform rather than a company.

Ratel was then **admitted**: its current catalogue carries aerial drones alongside its ground
robots, so the earlier UGV-only reading is out of date. No aerial product rows were created, because
model-level ownership was not verified and the reported Swarmer transaction is an agreement rather
than a completed acquisition.

## MBDA Deutschland: upgraded against the research

The research offered only "the Sky Warden NNbS counter-UAS concept" — a conflation of MBDA's
Sky Warden system with the German NNbS air-defence programme, and the kind of phrasing that usually
means a hold.

An independent check found something firmer: **DefendAir**, a counter-drone guided missile, is under
a contract MBDA signed with the Bundeswehr procurement office in **November 2025**, to arm the
Skyranger 30. That is a delivered, contracted counter-UAS product, not a concept. MBDA Deutschland
was admitted with both Sky Warden and DefendAir recorded.

## Admitted (9)

| Company | Country | Basis |
|---|---|---|
| **Farsight Vision** | Estonia | FSV Platform, Mapper and App — UAV imagery to geospatial data |
| **Oko Camera** | Ukraine | Cameras and vision modules built for unmanned platforms |
| **BT** | United Kingdom | Drone SIM, connectivity built for drone operations |
| **CODE380** | Ukraine | D-Vision SDR passive drone detector |
| **Marlborough Communications** | United Kingdom | Bespoke small-UAS and counter-UAS integration |
| **Aimpoint** | Sweden | FCS 15 fire-control sight marketed for engaging drones |
| **Eurosam** | France | SAMP/T NG, expressly designed against UAV threats |
| **MBDA Deutschland** | Germany | Sky Warden and DefendAir |
| **Ratel Robotics** | Ukraine | aerial drones in the current catalogue |

Eight products created, one orphaned product rehomed, twelve taxonomy rows added.

**Marlborough Communications is a Cohort subsidiary** — the second one in this landscape after Chess
Dynamics. That strengthens rather than contradicts the Batch 12 decision to exclude Cohort itself:
subsidiaries are admitted on what they make, the holding group is not.

**An orphaned product was rehomed.** A `SAMP/T NG` product record existed with no company attached
at all. It now belongs to Eurosam.

## The Batch 13 rule held up

The rule written last batch — *a named offering built for unmanned aircraft counts, a general-purpose
product someone else put in a drone does not* — decided four more rows without further argument:

- **In**: Oko Camera (cameras for unmanned platforms), BT (a drone-specific SIM).
- **Out**: Siemens (Simcenter is general simulation software), AirShaper (general CFD; the Wingtra
  case study is a customer use).

## Declined against the research

**Navantia** came back IN_SCOPE on NAIAD. An independent check found NAIAD is an open-architecture
layer that integrates unmanned vehicles with naval combat-management systems, and **no source ties
NAIAD itself to counter-UAS engagement** — the counter-drone systems fitted to Navantia ships, such
as Indra's CROW, belong to other companies. Held, not admitted. Navantia UK was excluded in Batch 12.

**Sener** came back IN_SCOPE for UAV engineering on Eurodrone and SIRTAP. Held on the same basis as
Randle Engineering in Batch 13: real UAV engineering, carried out for programme primes, no owned
aircraft.

## Excluded (15)

Three are **not companies**: DOTChain (a government procurement platform), Oboronka (a news
publication, on the rule that removed *Unmanned Airspace*), and Nurol Holding (a holding group, on
the Cohort precedent).

One is **dissolved**: Gilden Photonics Limited SC286762 was struck off on **17 July 2026**. Its
company status was set to `defunct` and no successor was invented.

The rest are maritime (Dearsan, Blohm+Voss, CMN), ground robotics (Rovertech, VDL Defentec),
general-purpose software (Siemens, AirShaper), space (LuxSpace), services (LOM PRAHA), or simply
another industry (Holywater, KOVO Armor).

## Held for review (12) — the largest hold of the run

Twelve rows could not be resolved on evidence, and the reasons cluster:

- **Parent-and-subsidiary allocation unresolved**: Atos / Eviden / Avantix (one owner needed for the
  UAV SIGINT work), DEUTZ (the drone drive belongs to SOBEK, which has no record), ASE Group (split
  with its Squadron company, which has its own backlog record).
- **Planned or demonstrated, not delivered**: Innokas (a letter of intent), Asseco Poland (PUSZCZYK
  demonstrated in October 2026).
- **Services and engineering**, awaiting the open decision: Brigantes, Siemens Energy, Sener.
- **Entity or scope unresolved**: Griselda, Horizon Technologies, Navantia.

## Country corrections (3)

Innokas Ukraine → **Finland**, KOVO Armor Ukraine → **Lithuania**, Farsight Vision Ukraine →
**Estonia**. All three were Ukrainian-adjacent records filed under the wrong flag.

Farsight Vision was handled carefully: the registered entity is FarsightVision OÜ in Estonia and the
team is Ukrainian. The country records the registered entity and the description records the team,
rather than overwriting one with the other.

## QA gate

| Check | Result |
|---|---|
| `included` rows failing the eligibility rule | **0** |
| Publication status written by this batch | **none** |
| V1 frozen snapshot | **273** |
| V2 frozen snapshot | **358** |
| Redundant unevidenced parent sectors | **0** |
| Landscape rows | 981 → **977** (four merges) |

## The publication gap, now 256

**256 companies whose landscape status is `excluded` or `needs_review` are published on
xsonomy.com** — 143 after Batch 10, then 174, 206, 229, and **256 now**. It has grown every batch
for five batches and has nearly doubled.

Nothing has been changed. This is Nazar's decision under rule 4 of `CLAUDE.md`.

## The enrichment phase ends with Batch 15

| | After 11 | After 12 | After 13 | After 14 |
|---|---:|---:|---:|---:|
| Backlog | 277 | 238 | 199 | **159** |
| No description | 134 | 120 | 80 | **40** |
| No data at all | 53 | 19 | 9 | **0** |

**Batch 15 takes all 40 remaining records with no description.** After that every company in the
backlog has a description, and there is nothing left to enrich.

What follows has to be different work, and there are two obvious candidates:

1. **Verify the backlog on its merits.** 159 described companies whose membership is still open,
   including 18 scoring P1.
2. **Clear the publication gap.** 256 companies on the public site that this process has judged
   out of scope or unresolved. This is the larger problem and the only one visitors see.

**Batch 15 is queued: `research-agent/queue/batch-15.csv`**, with two further questions added — is
the legal entity still trading, and was it dissolved, acquired or renamed — because Gilden Photonics
showed that a record can be enriched into a company that no longer exists.
