# Batch 18 — final merits-verification research handoff

Date: 2026-10-29. Input: `research-agent/queue/batch-18.csv`.
Output: `research-agent/researched/batch-18-researched.csv`.

**35 direct answers: 6 IN_SCOPE, 16 OUT_OF_SCOPE, 13 UNKNOWN.** These are research recommendations; final database outcomes await Claude's reconciliation. This exhausts the current research queue, not the policy holds or the reconciliation work.

## Validation

All 14 original input columns, 35 unique company IDs and row order are preserved exactly. Added 16 research fields. CSV round-trip, verdict and nonempty answer/evidence checks passed. Six optional descriptions correct entity or technology errors; a blank research_description means preserve the current description.

Official manufacturer, partner and government sources provide the technical evidence. Registry mirrors are explicitly identified and do not constitute fresh official registry certification. Current websites establish activity, not universal certified legal status. No database, publication or frozen-snapshot changes were made.

## Recommendations and reconciliation priorities

- **Qualifying own offerings:** Alloyed's Argive engines; INFINTEQ's UAV GCS/control architecture; MBDA France's MISTRAL capability; MBDA Italia's contracted FULGUR programme; Pearson's Threat-Sense UAV analytics; SensusQ's Winning Mind ISR software. Map suggested prose taxonomy to real capability leaves. Do not infer aircraft manufacture from software or ground-control systems.
- **Contracted development is not delivery:** FULGUR has an awarded development contract, with first delivery targeted in 2028. This follows the Avio Aero/Liebherr contracted-programme precedent. Alloyed A300 is in serial production; A1100 is not claimed delivered. MoUs and generic demo integrations remain held.
- **Ownership mapping holds:** Amper has a genuine C-UAS C2 product, but the group record must be resolved against Amper Sistemas/actual operating owner. Fugro's RAMMS is genuine co-developed UAV payload technology, but Dutch-parent versus US-business/Areté allocation remains unresolved. Elbit Deutschland markets Israeli-parent aircraft without established local manufacture. Cobham's former Mission Systems business was sold to Eaton; do not carry legacy portfolio ownership forward.
- **MBDA national records require care:** SKY WARDEN's Canadian trademark is registered to MBDA UK Limited. Trademark ownership alone does not settle engineering workshare, but a group brochure is insufficient to assign it exclusively to France or Italy. French admission instead rests on French MISTRAL production and DGA contracts naming MBDA France. Italian FULGUR attribution is independently named by the Italian Defence Ministry. Preserve one canonical product with justified manufacturer relationships.
- **Identity corrections:** Beretta Defense Technologies is an alliance, not a separate Benelli manufacturer. Thales Alenia Space Italia / e-GEOS is a composite label. Leonardo's former underwater business was sold to Fincantieri as WASS in January 2025; do not reassign every sonar without checking its product-specific owner. SensusQ/Sensus Septima OÜ and possible Quantum-Systems OÜ rename require live alias matching. DroneVia Group SA/former SAGL is corroborated via registry mirror and EHang, but has no own product established.
- **Maturity/services holds:** 61N has a real C-UAS integration contract but no named owned product established; keep the services boundary explicit. blackned has genuine middleware and UAV exercise involvement, not established dedicated current UAV product evidence. Diehl's relevant work is developmental. iCOMAT's AR5 primary release is an MoU, not proof of a named supplied component. OMT and Skeleton likewise have planned integrations. SDB AME has a corroborated legal identity but no named currently offered UAV established. Ultra Maritime has UAV-specific technology, but UK trial maturity and US/UK ownership allocation remain unresolved.
- **Generic sensor versus real integration:** Evica PinPoint has released DroneShield support, but no dedicated C-UAS-engineered variant was established; the exclusion is evidence-limited. It is an illumination component, not a detector. Scantinel mobility LiDAR and Videometer industrial imaging do not qualify merely because they are sensors. Unseenlabs is RF satellite intelligence, not SAR as described on file.
- **Ground, sea and space:** DATUM, FFG/REX, S2M, KNDS France Robotics, NORBIT and the queued Fincantieri systems have non-aerial evidence. Fincantieri NexTech/IDS's multi-domain UMS should remain with the operating owner, not automatically duplicated at parent. SSTL and the COSMO-SkyMed records concern orbital systems. Laser Zentrum Hannover is a nonprofit research institute. Exclusion concerns landscape eligibility, not publication in the wider catalogue.

## Row dispositions

| Rank | Company | Recommendation | Answer |
|---|---|---|---|
| 1 | 61N Solutions | UNKNOWN | No named owned UAV/C-UAS product established. 61N has a real contract to integrate data into authorities' command systems, but this is bespoke integration work and the evaluation system is future. |
| 2 | AGIMUS | OUT_OF_SCOPE | No qualifying owned product established. AGIMUS provides environmental/safety consulting for a laser risk study, not the laser effector. |
| 3 | Alloyed | IN_SCOPE | Yes: Alloyed offers its own Argive A300 and A1100 propulsion systems. The A300 has reached serial production; do not describe the larger model as delivered. |
| 4 | Beretta Defense Technologies | OUT_OF_SCOPE | BDT is a strategic alliance of Beretta Holding companies, not the distinct manufacturer of Drone Guardian or Benelli M4. |
| 5 | blackned | UNKNOWN | blackned owns TACTICAL CORE, RIDUX and XONITOR. A UAV collaboration and exercise participation are real, but a current dedicated UAV product/configuration beyond general tactical networking is not established. |
| 6 | Cobham | UNKNOWN | The broad Cobham record does not identify a current product-owning entity. Historical refuelling and unmanned catalogues cannot establish current ownership after business disposals. |
| 7 | DATUM Submarine Technologies | OUT_OF_SCOPE | Sinarit XLUUV is an underwater vehicle, not an aerial platform, C-UAS system or aerial payload. Official portfolio corroborates submarine and underwater-robotics specialisation, but not this model's current sale. |
| 8 | Diehl Aviation | UNKNOWN | Diehl Aviation's cited ARES role belongs to Diehl Aerospace and is a communications-development initiative. UAV cockpit interaction also remains a demonstrator; no current owned qualifying product for this division established. |
| 9 | DroneVia | UNKNOWN | DroneVia is corroborated as EHang's Swiss project partner, not the owner/manufacturer of EH216-S. No own product established; operator/services scope and exact legal mapping remain held. |
| 10 | Elbit Systems Deutschland | UNKNOWN | The German subsidiary markets Skylark, Hermes, MAGNI and THOR, but local product design/manufacture or independently owned capability is not established. These are also Israeli parent products. |
| 11 | Evica | OUT_OF_SCOPE | PinPoint is an illumination/searchlight component, not itself a drone detector or defeat system. DroneShield supports cueing it for identification, but a dedicated UAV/C-UAS-engineered variant was not established. |
| 12 | FFG | OUT_OF_SCOPE | REX MK II is an unmanned ground vehicle, not an aerial drone or C-UAS product. FFG's partnership does not make it owner of IAI's wider UAV portfolio. |
| 13 | Fincantieri | OUT_OF_SCOPE | DEEP and LDAUV are underwater systems; SAND is an unmanned surface vessel. The evidenced aerial-capable UMS belongs to Fincantieri NexTech/IDS, not a separately demonstrated parent product. |
| 14 | Fugro | UNKNOWN | RAMMS is a real co-developed airborne bathymetric lidar deployed on a UAV. This is stronger than operator-only evidence, but assignment to the Dutch parent versus US Fugro business/Areté remains unresolved. |
| 15 | Grupo Amper | UNKNOWN | Amper offers its own named C-UAS command-and-control system; technical scope is positive. The queued group record needs mapping to Amper Sistemas or the actual operating owner before admission. |
| 16 | iCOMAT | UNKNOWN | iCOMAT owns RTS composite-manufacturing technology and supports the AR5 partnership, but the primary announcement is an MoU to explore further collaboration; no named contracted/delivered UAV component established. |
| 17 | INFINTEQ | IN_SCOPE | Yes: INFINTEQ offers named BKS HV/BKS MV UAV ground-control stations and its shared mission-control architecture; it also lists GULL ONE E. |
| 18 | KNDS Robotics | OUT_OF_SCOPE | KNDS France Robotics makes NERVA ground robots and ground mission modules. No owned current aerial or C-UAS system was established for this subsidiary. |
| 19 | Laser Zentrum Hannover | OUT_OF_SCOPE | LZH is a nonprofit research institute, not a commercial UAV/C-UAS manufacturer. Laser safety studies do not establish ownership of an offered effector. |
| 20 | Leonardo (Underwater Systems) | OUT_OF_SCOPE | Hull/towed sonar are underwater sensors. The legacy Underwater Armaments & Systems business was sold to Fincantieri and is not an independent current Leonardo aerial company. |
| 21 | MBDA France | IN_SCOPE | Yes: the French MBDA manufacturing business produces MISTRAL 3, whose current designed roles explicitly include counter-UAV engagement; French authorities also identify MBDA France launcher contracts. |
| 22 | MBDA Italia | IN_SCOPE | Yes: MBDA Italia has the contracted FULGUR programme, a specifically UAS-capable interceptor. This is contracted development, not an operational delivery. |
| 23 | Norbit | OUT_OF_SCOPE | WINGHEAD and WBMS are underwater multibeam sonars, including USV/UUV configurations, not aerial drone or airborne counter-drone sensors. |
| 24 | Odense Maritime Technology | UNKNOWN | OMT owns naval engineering expertise, but the Hornet counter-drone system belongs to Destinus. The proposed naval module is at MoU/concept stage, with qualification ahead. |
| 25 | Pearson Engineering | IN_SCOPE | Yes: Pearson owns Threat-Sense, an AI mine-detection system integrated with the Skydio X10D aerial platform; it is not only a ground-vehicle supplier. |
| 26 | S2M Equipment | OUT_OF_SCOPE | The evidenced business refurbishes military land vehicles; Refurbot is a ground-vehicle concept. No named own aerial or C-UAS product established. |
| 27 | Scantinel Photonics | OUT_OF_SCOPE | SingleChip FMCW LiDAR is a general mobility/automotive/industrial sensing technology; no named UAV/C-UAS-specific variant established. |
| 28 | SDB AME | UNKNOWN | The company exists, but no named currently sold UAV was established from its own site. Reports of an unnamed quadcopter in a KNDS concept do not meet current-product evidence requirements. |
| 29 | SensusQ | IN_SCOPE | Yes: SensusQ owns Winning Mind intelligence-fusion software, used to ingest unmanned-system data in ASGARD; acquisition does not transfer parent airframe ownership to it. |
| 30 | Skeleton Technologies | UNKNOWN | Skeleton owns power-storage technology and markets counter-UAV power applications, but a named delivered/contracted dedicated system was not established. The GDELS and TEKEVER announcements are MoUs. |
| 31 | Surrey Satellite Technology (SSTL) | OUT_OF_SCOPE | NovaSAR-1 and CarbSAR are Earth-observation satellites and orbital SAR payload systems, not aerial UAV/C-UAS sensors. |
| 32 | Thales Alenia Space Italia / e-GEOS | OUT_OF_SCOPE | This is a composite label for two separate companies. COSMO-SkyMed is an orbital satellite programme; Thales Alenia Space manufactures satellites while e-GEOS commercialises data and participates in operations. |
| 33 | Ultra Maritime | UNKNOWN | Ultra has genuine UAV-tailored small sonobuoys and receivers. UK MSARS completed a first water trial, while UAV integration is planned; US-versus-UK product allocation and maturity remain unresolved. |
| 34 | Unseenlabs | OUT_OF_SCOPE | Unseenlabs uses space-based passive RF detection, not SAR imagery as the current description claims. No named aerial UAV/C-UAS product established. |
| 35 | Videometer | OUT_OF_SCOPE | VideometerLab and inline multispectral systems are laboratory/industrial quality-control instruments; no UAV/C-UAS-specific product established. |

## Completion instruction for Claude

Read STATE and reconcile all 35 rows against live entities, products, aliases and taxonomy. Resolve holds only where live evidence genuinely closes the stated gap. Keep unresolved rows in needs_review with an explicit reason; do not repeatedly requeue them without new evidence. Apply only justified description corrections and complete existing QA. Write batch-18-reconciliation.csv and its report.

Then produce the final verification-phase report covering batches 16–18 and refresh authoritative run totals from the live database. Confirm that the original 119 candidates have dispositions or documented policy holds; STATE currently reports 39 candidates, of which 35 are in this queue and four are policy-held. The five-name policy exclusion list and four-row count should be explained from live IDs, not guessed. Do not manufacture batch 19 if the verifiable pool is empty.

Report the end of merits verification separately from publication, wider catalogue cleanup and discovery, none of which are authorised by this phase. Preserve V1=273 and V2=358. Update STATE to the protocol's appropriate completion/decision state only after reconciliation and QA. Existing scope questions remain explicit; this research does not answer them.
