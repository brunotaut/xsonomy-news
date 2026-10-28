# Batch 16 merits-verification handoff

Date: 2026-10-28. Input: `research-agent/queue/batch-16.csv`.
Output: `research-agent/researched/batch-16-researched.csv`.

All 40 VERIFY questions have a written answer and disposition recommendation: **13 IN_SCOPE, 13 OUT_OF_SCOPE, 14 UNKNOWN**. These are external research findings, not database admission counts. Claude must reconcile against the live database. The remaining backlog is not cleared by this file.

## Validation and scope

- Preserved all 17 input columns, all 40 company IDs and original order exactly. Added research fields, including a direct answer, decisive evidence, maturity, canonical identity and legal-status limitations.
- Round-trip CSV validation passed: 40 unique IDs, consistent column count, valid verdicts and nonempty answer/evidence fields.
- Original descriptions are untouched. Seven optional corrected descriptions address material factual errors; blank research_description means preserve the existing description, not erase it. Directory-origin placeholders were not rewritten during this verification phase.
- Current official product pages support business activity, not a universal claim of legally certified active status. Registry-mirror dates and unresolved identities are stated per row.
- External aliases were checked; live-database duplicate checks remain Claude's task. No Supabase, publication, frozen V1/V2 or discovery changes were made.
- Proposed taxonomy labels are suggestions. Map prose UAV/software labels to real current leaves, and do not persist invented slugs or structural parents. Validate that EO/IR aiming components fit the actual leaf definition.

## Reconciliation priorities

1. **One product, one canonical owner.** Match UKROPTER/Bravery Invest; BeeTA Technologies/BeetechUA; Bulba/Servis Budtrans; Celebra/Celebra Tech; Twist aliases; Squadron versus ASE. BeeTA NGO is not automatically the LLC. Grupo Oesia's demonstrated UAV products belong to UAV Navigation, and ORKA belongs to CiS, not FLANQ.
2. **Do not erase maturity limits.** Fulltime Robotics is a qualified positive for an own offered C-UAS prototype, not proven fielded autonomous interception. RFbeam's new dedicated front end remains a demonstrator without established commercial sale; cosine's drone instrument is an R&D derivative; Babcock SwarmCore has only a historical demonstration established. Hold these latter records unless existing live evidence resolves the gap. Different outcomes reflect evidence of an offered product, not a universal ban on prototypes.
3. **Sensor evidence must be specific.** smartmicro has a dedicated Drone Altimeter; PCO has a specifically counter-drone TCKM-1 sight. Senop HSC-2 has aerial-imaging design evidence but limited current sales/support. AIM's small-UAV imaging engines qualify at medium confidence; apply the same dedicated-design standard as prior batches. Generic Acconeer, Blickfeld and ams OSRAM compatibility/demonstrations do not suffice.
4. **Do not force unresolved directory imports.** SKYD lacks accessible primary/legal confirmation. SMART UAV TECHNOLOGY and UP-INNOVATIONS have corroborated company identities but no verified named products. Vinnytsia Avionics has conflicting entity clues. Riy and Tekhnary have real engineering work but unresolved company/ownership attribution. PRODRONE has own-branded FPV listings, so retailer-only exclusion would be premature.
5. **Research bodies are not commercial manufacturers.** DLR and TNO have genuine relevant R&D; exclude their company-landscape records on entity type, not on absence of technology. Do not pre-admit planned joint ventures or transfer industrial partners' products to research bodies.
6. **No repeated re-queue without new evidence.** UNKNOWN means needs_review with the written reason. Neramo/FLANQ may depend on the existing nonblocking services/integration scope question. Keep policy holds separate; do not ask Nazar again to choose the already-authorised verification phase.

## Row dispositions

| Rank | Company | Recommendation | Direct answer |
|---|---|---|---|
| 1 | Ukropter | IN_SCOPE | Yes: UKROPTER Drone is an own aerial platform offered in reconnaissance and bomber configurations. |
| 2 | BeetechUA | IN_SCOPE | Yes: BeeTA Technologies lists BOMBUS and its own WireDO UAV communications system. Resolve BeetechUA as the commercial entity, not the similarly named NGO. |
| 3 | Bulba | IN_SCOPE | Yes: Bulba is a manufacturer's brand for own counter-drone electronic-warfare systems, not an independent legal company name. |
| 4 | Celebra LLC | IN_SCOPE | Yes: Celebra Tech manufactures and supplies the LAURUS FPV line under direct contracts. |
| 5 | Fulltime Robotics | IN_SCOPE | Yes: Fulltime Robotics developed and offers SlimBeam for counter-drone use; maturity is prototype/demonstration, not proven fielded autonomous interception. |
| 6 | Neramo Distribution | UNKNOWN | NERAMO DISTRIBUTION SRL is a real Romanian supplier; no owned C-UAS product was established. A procurement award proves supply, not manufacturing. |
| 7 | PRO drones | UNKNOWN | Own-branded ProDrone FPV models are offered, but design/manufacturing ownership and the contracting legal entity were not established. Do not conclude retailer-only without checking these models. |
| 8 | RIY Drone Project | UNKNOWN | Horhona is attributed to the Uzhhorod Riy engineering project in a direct interview, but a commercial legal entity and current sale were not established. |
| 9 | SKYD | UNKNOWN | UNRESOLVED: a directory names a SKYD payload-release system, but accessible primary evidence did not confirm the legal entity, ownership or current trading. |
| 10 | SMART UAV TECHNOLOGY | UNKNOWN | The legal company exists, but no named owned UAV product or corporate website was established. Registration under an aviation activity code is not a product. |
| 11 | Tekhnary | UNKNOWN | The Tekhnary/Technary team has an own ePPO application and reported interceptor-development work, but this record's company status and product ownership relative to Firebolt Engineering remain unresolved. |
| 12 | Twist Robotics | IN_SCOPE | Yes: Twist Robotics offers own UAV-specific navigation, simulation and communications products, including OSCAR and OBRIY. |
| 13 | UP Innovations | UNKNOWN | The legal entity UP-INNOVATIONS exists, but no named owned UAV/C-UAS product or official product website was established. |
| 14 | Vinnytsia Avionics | UNKNOWN | UNRESOLVED: Vinnytsia Avionics has not been tied to a verified legal company or named UAV product. The directory appears to conflate aviation-repair entities. |
| 15 | cosine | UNKNOWN | A drone-specific HyperScout-derived instrument exists in an ESA-funded research campaign, but a currently sold UAV product and its canonical owner were not established. |
| 16 | gfai tech | OUT_OF_SCOPE | No qualifying UAV/C-UAS product established. Acoustic Camera is for industrial acoustic source localisation, not evidence of drone detection. |
| 17 | Himera | OUT_OF_SCOPE | No UAV platform or dedicated UAV communications product established. G1 PRO, B1 and R1 are personnel tactical communications; drone delivery of repeaters is a use case, not UAV-product ownership. |
| 18 | Creotech Instruments | IN_SCOPE | Yes: GREY is a co-developed commercial terrain/risk-analysis portal explicitly supporting UAV BVLOS route planning. EagleEye and HyperSat themselves are satellites. |
| 19 | Eyeonix | UNKNOWN | Eyeonix SA exists as a Greek defence/software company, but the AV Eagle plan does not prove Eyeonix currently owns and manufactures an unmanned system. |
| 20 | ICEYE | OUT_OF_SCOPE | ICEYE's named SAR products are satellites and sovereign space ISR services, not aerial UAVs or dedicated counter-drone systems. |
| 21 | Squadron | IN_SCOPE | Yes: Squadron explicitly identifies UAV Fleet Management among its own solutions, beyond training and operating third-party aircraft. |
| 22 | Tekne | IN_SCOPE | Yes: Tekne owns named anti-UAV electronic-warfare systems J4SKY-T and J4EAD-T; eligibility does not depend on the laser-development project. |
| 23 | Aerotechnika | UNKNOWN | Aerotechnica-MLT makes/modernises radar and air-defence systems, but no named dedicated UAV/C-UAS product was verified from accessible evidence. It is not established as a UAV manufacturer. |
| 24 | Distran | OUT_OF_SCOPE | No qualifying UAV/C-UAS product established. Ultra Pro family is industrial ultrasonic gas-leak detection, not drone detection. |
| 25 | Offset Labs | OUT_OF_SCOPE | Offset Labs is an AI/communications business, but no owned UAV or dedicated counter-drone product was established. |
| 26 | DLR (German Aerospace Center) | OUT_OF_SCOPE | DLR genuinely develops and tests unmanned aircraft, but it is a public research organisation, not the commercial company this landscape record requires. |
| 27 | FLANQ | UNKNOWN | The ORKA UAS is explicitly from CiS; FLANQ integrates it with its maritime platforms/software. No FLANQ-owned aerial product was established. |
| 28 | Acconeer | OUT_OF_SCOPE | A121 is a general-purpose radar component. Official mentions of drones among many applications do not establish a UAV-specific variant or dedicated C-UAS product. |
| 29 | Babcock International | UNKNOWN | ARMOR Force is a maritime architecture, Nomad is signals-intelligence software, and SwarmCore is a Babcock-developed unmanned-vehicle control demonstrator. Current aerial commercial product status is unproven. |
| 30 | smartmicro | IN_SCOPE | Yes: smartmicro offers its own Drone Altimeter explicitly designed for small UAVs and described as in full production. |
| 31 | Grupo Oesía | OUT_OF_SCOPE | The demonstrated autopilot/navigation products belong to UAV Navigation SLU, a Grupo Oesía subsidiary. No separate parent-owned product was established for this row. |
| 32 | PCO S.A. | IN_SCOPE | Yes: PCO's TCKM-1 thermal machine-gun sight is explicitly designed also for counter-drone applications. Generic night vision and vehicle heads alone would not suffice. |
| 33 | TNO | OUT_OF_SCOPE | TNO is a research organisation. It develops relevant radar technology, while Destinus/Robin Radar are planned industrialisation partners; those products must not be attributed as TNO commercial offerings. |
| 34 | Blickfeld | OUT_OF_SCOPE | Cube/Qb2 are general LiDAR products. Drone-use and ground-security-plus-drone-verification articles did not establish a separate UAV-specific or C-UAS product. |
| 35 | RFbeam Microwave | UNKNOWN | A dedicated counter-drone Active Antenna front-end is now evidenced, beyond generic modules, but it is an October 2026 concept/demonstrator with no established commercial availability. |
| 36 | ams OSRAM | OUT_OF_SCOPE | TMF8829 and TCS3448 were used in a drone demonstration, but remain general-purpose sensing components; no dedicated UAV/C-UAS product was established. |
| 37 | Senop | IN_SCOPE | Yes: HSC-2 was specifically engineered for lightweight aerial imaging and remains supported, with production capability retained. Active sales are now limited. |
| 38 | EuroSpike | OUT_OF_SCOPE | MELLS is an anti-tank weapon/launcher system; SPIKE SR, LR2, ER2 and NLOS are guided missile variants. None was established here as a UAV airframe or dedicated C-UAS product. |
| 39 | AIM Infrarot-Module | IN_SCOPE | Yes: HiPIR-Engine and eSWIR 640/10 are named miniaturised imaging engines explicitly engineered/marketed for small UAV/gimbal integration, beyond the unrelated HuntIR weapon sight. |
| 40 | Brolis Semiconductors / Brolis Defence | OUT_OF_SCOPE | No named UAV-specific or counter-drone product was established. Ghostbuster protects optical-sight users against detection/laser exposure; it is not a drone-defeat device. |

## Evidence and limits

The CSV contains per-row source URLs, the decisive observation, dates/maturity, canonical-entity notes and legal-status limitations. Negative findings mean no qualifying product was established in this research, not proof that the business can never enter the market. Source assertions of performance were not converted into independently verified operational claims.

## Next action

Claude: read STATE, reconcile this batch with live aliases/products/taxonomy, keep held reasons explicit, apply only justified description corrections, run the existing QA checks, write batch-16-reconciliation.csv and its report, and generate batch 17 from the remaining verification pool. Do not change publication status or immutable V1/V2 snapshots.
