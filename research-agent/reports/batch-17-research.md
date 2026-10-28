# Batch 17 merits-verification handoff

Date: 2026-10-28. Input: `research-agent/queue/batch-17.csv`.
Output: `research-agent/researched/batch-17-researched.csv`.

All 40 VERIFY rows have direct answers: **11 IN_SCOPE, 19 OUT_OF_SCOPE, 10 UNKNOWN**. These are research recommendations, not live database admission counts.

## Validation and scope

- All 17 original columns, 40 company IDs and row order preserved exactly. CSV round-trip checks passed; every row has a verdict, answer and evidence.
- Six optional description corrections address factual errors. Blank research_description means preserve the existing description.
- Current product pages establish business activity, not independently certified legal status. Legal-status limits and parent/country distinctions are recorded per row.
- Claude must check live aliases, canonical ownership and duplicates. Taxonomy suggestions must map to existing capability leaves; do not persist invented slugs or structural parents.
- No database, publication, frozen V1/V2 or discovery changes were made.

## Reconciliation priorities

1. **Entity ownership before admission.** GeoSLAM and Liebherr-Aerospace have positive product evidence but remain UNKNOWN until the queued brand/division is mapped to its surviving operating company. Liebherr's named manufacturer is German Liebherr-Aerospace Lindenberg GmbH, not the French divisional organisation. Resolve MetaSensing BV versus Srl before assigning Netherlands or Italy. Photonis Netherlands appears under Exosens Netherlands; match aliases and avoid transferring other group companies' thermal products.
2. **Production versus prototypes.** QFI's April 2026 delivery release establishes German serial production of Frontline-designed Linza drones; record the manufacturing relationship without duplicating original IP. GKN, SE3 and PLATH remain held on demonstrator/product maturity. PLATH's aircraft and sensor belong to partners. Liebherr has a contracted Eurodrone component programme, but its entity mapping remains held.
3. **Named dedicated components.** Safran Vectronix LRF 6742 and Jenoptik second-generation DLEM modules have explicit counter-UAV ranging roles, not laser-defeat capability. Bittium Tough SDR Unmanned is a specific module. Nocturn, MicroCAM irGO and UK-manufactured Osprey qualify on specific UAV evidence. HEVI owns its integrated platform, not HENSOLDT's underlying KENIS sensor. CY4GATE CEWIS and sees.ai qualify as own systems/software, not aircraft OEMs.
4. **Historical or end-of-life evidence stays explicit.** Optris PI LightWeight and Radionix UAV SAR are real historical products with current availability unresolved. SICK's UAV SKU is documented, but exact orderability during the family phase-out (listed deadline 31 October 2026) is unresolved. Do not infer current availability from a general successor product.
5. **Space systems are not aerial UAVs.** ICEYE Polska, Thales Alenia Space, NanoAvionics, KSAT, GomSpace, KP Labs and Oxford Space Systems have space-only evidence here. Oxford uses QuadSAT's drone testing, not its own UAV product. TUBITAK UZAY is a research institute; TUBITAK UZAY / ASELSAN and OHB Italia / Leonardo are composite entity errors. Droneflykart calls itself a voluntary project.
6. **Avoid name collisions and generic-sensor inference.** OPTIX is not Opticoelectron. PRO OPTICA ARTEMIS is not NATO's ARTEMIS prototype. Living Optics explicitly says it has no purchasable UAV integration pack. Broad optics, thermography, industrial lasers and automotive LiDAR alone do not establish UAV/C-UAS eligibility.

## Row dispositions

| Rank | Company | Recommendation | Direct answer |
|---|---|---|---|
| 1 | Quantum Frontline Industries | IN_SCOPE | Yes: QFI is an operating German-Ukrainian co-production venture manufacturing Linza drones. It is a producer under the joint venture, not the original aircraft designer. |
| 2 | GKN Aerospace | UNKNOWN | The identified UAV is a demonstrator, with a full-scale mock-up and dedicated engine shown in August 2026; no current serial product for this UK record was established. |
| 3 | Sees.ai | IN_SCOPE | Yes: sees.ai identifies its proprietary full-stack autonomous BVLOS inspection system, not merely use of someone else's drones. |
| 4 | Hevi Optronics | IN_SCOPE | Yes: HeviTrack-M KENIS is HEVI's named counter-UAS EO/IR surveillance platform, manufactured as its own integrated system. |
| 5 | Opticoelectron Group | OUT_OF_SCOPE | No named dedicated UAV/C-UAS product was established; reviewed portfolio comprises general military/industrial optics and surveillance assemblies. |
| 6 | Thales Nederland | IN_SCOPE | Yes: SQUIRE has a purpose-developed drone detection/classification mode integrated and used in the field. |
| 7 | Leonardo UK | IN_SCOPE | Yes: UK-developed/manufactured Osprey radar has a specific unmanned-aircraft integration, including Osprey 30 on the US Navy's unmanned helicopter. |
| 8 | ICEYE Poland | OUT_OF_SCOPE | ICEYE Polska is a satellite/ground-segment business. MikroSAR is space reconnaissance, not a UAV payload or C-UAS system. |
| 9 | InfraTec | OUT_OF_SCOPE | ImageIR/VarioCAM are general thermography camera families marketed for many uses, including aerial thermography. No dedicated UAV variant was established. |
| 10 | MetaSensing | UNKNOWN | MetaSAR is a genuine compact airborne SAR offered for UAVs, but current product ownership between MetaSensing BV (Netherlands) and MetaSensing Srl (Italy) needs resolution. |
| 11 | Optris | UNKNOWN | Optris historically sold a dedicated PI LightWeight UAV thermography kit. Current continued sale/support of that kit was not established; the current PI 450i alone is a general industrial camera. |
| 12 | Photonis Netherlands (Exosens) | IN_SCOPE | Yes: Nocturn imaging cores are explicitly designed/marketed for reconnaissance-UAV integration. Manufacturer datasheet identifies Photonis Netherlands for Nocturn XL. |
| 13 | Safran Vectronix | IN_SCOPE | Yes: Ultisense LRF 6742 is explicitly a dedicated counter-UAV laser-rangefinder module. |
| 14 | SICK AG | UNKNOWN | SICK has a real dedicated UAV variant, LD-MRS420201, rather than only generic LiDAR. Its exact current orderability is unresolved amid LD-MRS family phase-out. |
| 15 | Thermoteknix | IN_SCOPE | Yes: MicroCAM irGO is a named miniature packaged thermal camera explicitly engineered for OEM UAV integration. |
| 16 | Valeo | OUT_OF_SCOPE | SCALA is an automotive LiDAR family for automated driving. No dedicated aerial UAV or C-UAS product was established. |
| 17 | VIGO Photonics | UNKNOWN | VIGO identifies drone-related detector applications and a new imaging FPA, but no named currently commercial UAV-specific product was established. |
| 18 | Bittium | IN_SCOPE | Yes: Tough SDR Unmanned is a dedicated radio module for unmanned air, land and sea systems. |
| 19 | Droneflykart | OUT_OF_SCOPE | Droneflykart is drone-planning software, but its own privacy statement calls it a voluntary project, not a verified company. |
| 20 | SE3 Labs | UNKNOWN | SE3 develops spatial autonomy and demonstrated multi-drone reconnaissance, but no named commercially delivered product was established. |
| 21 | Thales Alenia Space | OUT_OF_SCOPE | The evidenced SAR instruments and systems are satellite payloads and space ground segments, not UAV or counter-drone products. |
| 22 | Ekspla | OUT_OF_SCOPE | No dedicated UAV/C-UAS laser product established. FemtoLux and the reviewed portfolio are scientific/industrial lasers and customised OEM sources. |
| 23 | Kongsberg NanoAvionics | OUT_OF_SCOPE | NanoAvionics makes satellite buses and mission systems, not aerial drones or C-UAS products. |
| 24 | KSAT (Kongsberg Satellite Services) | OUT_OF_SCOPE | KSAT supplies satellite ground-network and Earth-observation services. No owned aerial UAV/C-UAS product established. |
| 25 | NL Acoustics (Noiseless Acoustics) | OUT_OF_SCOPE | NL Acoustics/Noiseless Acoustics is a Finnish industrial acoustic-imaging business now within FLIR. No own named UAV/C-UAS product was established. |
| 26 | Pro Optica | OUT_OF_SCOPE | Reviewed own products are vehicle-mounted surveillance/target-acquisition optics. No named UAV-specific or C-UAS product established. |
| 27 | TUBITAK UZAY | OUT_OF_SCOPE | TUBITAK UZAY is a space-technology research institute; IMECE and GOKTURK are satellite programmes, not UAV products. |
| 28 | TUBITAK UZAY / ASELSAN | OUT_OF_SCOPE | TUBITAK UZAY / ASELSAN is a combined programme-participant label, not one company. GOKTURK-3 is a SAR satellite programme. |
| 29 | CY4GATE | IN_SCOPE | Yes: CEWIS is CY4GATE's named integrated ground/airborne intelligence and C2 system explicitly integrating UAS. |
| 30 | GeoSLAM (FARO) | UNKNOWN | Technical scope is positive, but admission is held pending canonical company mapping. Yes: GeoSLAM designed dedicated UAV mounts for its ZEB Horizon mapping system, creating an evidenced UAV payload configuration beyond a handheld scanner merely carried by a drone. |
| 31 | GomSpace | OUT_OF_SCOPE | GomSpace products are small satellites, spacecraft subsystems and satellite-operations software, not UAVs. |
| 32 | Jenoptik | IN_SCOPE | Yes: second-generation DLEM rangefinder modules have an expressly engineered counter-UAV tracking/ranging role. |
| 33 | KP Labs | OUT_OF_SCOPE | Intuition-1 is a hyperspectral satellite with onboard computing, not an atmospheric UAV or C-UAS payload. |
| 34 | Liebherr Aerospace | UNKNOWN | Technical scope is positive, but admission is held pending canonical company mapping. EMP is a hydraulic-power component, not an aerial platform. Liebherr-Aerospace Lindenberg has a concrete Eurodrone contract for the dedicated landing-gear and hydraulic system including EMP. |
| 35 | Living Optics | OUT_OF_SCOPE | Living Optics offers a general hyperspectral camera/dev kit. Its own support page says no UAV integration pack is available for purchase. |
| 36 | Meopta | OUT_OF_SCOPE | No named dedicated UAV/C-UAS offering established. Reviewed products are precision optics and conventional military sight/OEM assemblies. |
| 37 | OHB Italia / Leonardo | OUT_OF_SCOPE | OHB Italia / Leonardo is a composite consortium label, not one company. PRISMA is an ASI-owned satellite, built by distinct industrial contributors. |
| 38 | Oxford Space Systems | OUT_OF_SCOPE | Wrapped-Rib is a deployable antenna for satellites. Drone testing is performed with QuadSAT's system, not an Oxford Space Systems UAV product. |
| 39 | PLATH | UNKNOWN | PLATH has genuine UAV intelligence work, but the named SIGFLY VTOL ELINT is a proof-of-concept integration; NOMAD/NEMO alone are broader COMINT products. |
| 40 | Radionix | UNKNOWN | Radionix developed a dedicated small SAR for Skyeton's Raybird-3, but accessible evidence is historical and current sale/production was not established. |

## Evidence and limits

The CSV records decisive evidence, source URLs, product maturity, canonical-entity notes and legal-status limitations per row. Negative findings mean no qualifying product was established, not proof that the business has no possible drone customers. Manufacturer claims were not converted into independent performance verification. UNKNOWN records require a written hold reason, not repeated re-queuing without new evidence.

## Next action

Claude: read STATE, reconcile batch 17 against live companies/products/aliases and taxonomy, resolve ownership where evidence permits, apply justified description corrections, run existing QA, write the reconciliation CSV and report, and prepare batch 18 from the remaining verification pool (approximately 35 rows before reconciliation). Keep policy holds explicit. Do not change publication status or immutable V1/V2 snapshots.
