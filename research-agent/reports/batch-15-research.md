# Batch 15 external research handoff
Date: 2026-10-28
Input: `research-agent/queue/batch-15.csv`
Output: `research-agent/researched/batch-15-researched.csv`

Final enrichment batch: all 40 queued records have been researched and supplied with factual descriptions. This does not itself clear the live backlog; Claude must reconcile the rows first.

## Findings, not admission counts
- 4 IN_SCOPE: Heliguy, Restube, SBG Systems, Avio Aero.
- 30 OUT_OF_SCOPE: mostly customers, non-aerial businesses, media, universities, general technology or non-European entities.
- 6 UNKNOWN: BMT Global, EE, Marshall Aerospace, DSV, INECO, Sopra Steria.

Preserved every original value in all 12 input columns, all 40 company IDs and row order. Appended 14 research columns. Round-trip CSV checks passed: 40 unique IDs, 26 columns per row, valid verdicts, descriptions and evidence URLs. Confidence reflects confidence in the stated findings, not automatic eligibility.

## Four positive recommendations
- **Heliguy / Colena Ltd (05819252)**: dedicated drone and layered C-UAS engineering/integration, supported by company terms/about pages and regional-authority coverage. Check Colena duplicate. Recommend eco-integration only; DJI aircraft and AeroScope remain DJI products.
- **Restube GmbH**: AUTOMATIC 75 is a current rescue payload explicitly designed with a drone attachment and marketed for drone deployment. Multiple other uses do not erase its documented UAV-specific design.
- **SBG Systems**: Quanta Micro is explicitly developed for UAV payloads/navigation. This is stronger than a generic sensor merely appearing in another company's aircraft. Recommend eco-components.
- **Avio Aero**: Catalyst 1300-ED1 is a named Eurodrone variant with an engine supply contract. Italy remains the operating country despite US parent GE Aerospace. Correct the erroneous avioacro.it domain to avioaero.com. Eurodrone remains the aircraft prime's product; civil engine certification is not proof of Eurodrone service entry.

## Entity and product corrections
- **Ricardo**: the queue article names *Ricardo Mendes*, TEKEVER's CEO. It does not establish a link to the Ricardo consultancy. Record the consultancy's actual business; never assign CORVUS or AR5 to it. WSP acquisition completed **9 October 2025**; UK operation, Canadian parent separately.
- **Calibre Defence**: publisher at calibredefence.co.uk, not an interceptor manufacturer. Distinguish similarly named calibre-defence.com equipment supplier. Exact publisher legal entity remains unresolved.
- **Porsche**: the drone-investment announcement is from **Porsche Automobil Holding SE**, whereas the queued porsche.com is the automotive business. Investor role does not establish product ownership; do not blindly merge Porsche SE and Porsche AG.
- **Safran Electrical & Power**: **INTEGRAL E belongs to AURA AERO** and is a crewed trainer. ENGINeUS and GENeUSGRID belong to Safran Electrical & Power. No dedicated UAV-specific offering for this subsidiary established in this pass; do not import Patroller from its sister business.
- **Marshall**: Extera is **Flarebright's** product; Marshall is the flightworthiness assessor, as confirmed by the CAA certificate list.
- **EE**: supports BT Drone SIM with network connectivity; the dedicated product was already admitted under BT in batch14. These are related businesses, not interchangeable legal names. Resolve allocation without duplicate product creation.
- **Exail Robotics Belgium**: the official delivery release expressly says the UAVs were NOT among the unmanned assets produced in Ostend. Preserve the existing distinction between Belgian maritime production and the verified ECA Group/Infotron UAV lineage.
- **Iveco**: Leonardo reports acquisition of the IDV defence business completed **18 March 2026**. Do not leave current defence-product ownership automatically on the commercial Iveco record.
- **SLM Solutions**: current name Nikon SLM Solutions AG; Nikon squeeze-out completed **4 September 2023**. Germany operating country, Japanese parent separately; generic metal printers do not qualify as UAV products.
- **Sopra Steria**: **3 September 2026** announcement says CS Group acquired UAVIA technology, assets and team. This is not proof of a legal-entity merger or permission to duplicate products at parent level.
- **Synnovis**: current pathology partnership, formerly Viapath; official site identifies Synnovis Group LLP. It is the logistics customer, not Apian or an aircraft OEM.
- **Van der Valk**: current shipyard domain differs from queue. Saildrone confirms future Spectre construction; it is a surface vessel and Saildrone's design.

## Geography and uncertain entities
- **Firecrest Aerospace Inc.**: United States, not UK. CSG European parentage does not change the US operating company. Manufacturing is planned. Latest parent statement says wholly owned by CSE USA; earlier July wording described a CSE USA/AviaNera venture. Preserve this distinction and avoid asserting a completed production ramp.
- **HALO Aeronautics**: US operations and manufacturing documented by By Light and the US vendor directory; no UK operation established. Brand/partnership with Hush Aerospace, standalone legal entity unresolved.
- **Silynx**: article identifies **Silynxcom Ltd, Netanya, Israel**, with a wearable detector at prototype stage. Not a verified UK manufacturer. Check any specific local subsidiary before a country overwrite or merge; exclude identified issuer from European scope.
- **Signature Aviation**: global brand has US-centred activity and UK operations; US JV evidence alone does not identify which legal entity the UK row represents. Country is retained provisionally, with entity caveat. Passenger AAM/vertiport development does not establish UAV/C-UAS scope anyway.

## Six holds
- **BMT Global**: SPARO is a genuine UAV-specific co-developed prototype demonstrated in exercises, not proven current deliveries. Resolve operating company and maturity.
- **EE**: product ownership/duplication with already-verified BT.
- **Marshall Aerospace**: current UAV assessment service; existing services-scope decision.
- **DSV**: commercial offshore drone-logistics partnership using Skyways aircraft; operator/services scope remains open, and regulatory approval/initial deployment is not presumed completed.
- **INECO**: U-space research and integration demonstrated through SPATIO; evidence discusses future market deployment. Service-scope and maturity hold; not C-UAS.
- **Sopra Steria**: pre-operational U-space platform and CS Group/UAVIA ownership allocation; no parent-level duplication.

## Evidence and legal-status limits
Sources were reviewed for current company/institutional activity, specific product roles, acquisition/rename evidence and maturity. This is not a comprehensive registry certificate of good standing for every legal entity. Unknown exact legal identities are labelled, and no active status should be inferred merely from a functioning website. No additional dissolution was confirmed. Historical dates, future programmes and planned deliveries remain explicit.

OUT_OF_SCOPE is based on the documented role and existing landscape rules, not a claim that a diversified business can never have any UAV-related activity. Named genuine subsidiary projects (for example OHB Austria UAV-x-NAV) stay with their operating entity.

## Handoff and next phase
- Reconcile this batch first. Preserve existing nonblocking energetics and operator/services decisions.
- No database, publication, frozen-snapshot or V3 changes were made.
- Do not automatically create batch16 as another enrichment batch: STATE calls batch15 the final enrichment batch.
- After reconciliation, report remaining merits-verification backlog and public-site mismatch counts separately. The last reconciled counts were 159 candidates and 256 published excluded/needs-review companies; these are not post-batch15 counts.
- Choice of next phase remains open: merits verification versus publication-gap work. This handoff authorises neither bulk unpublishing nor new publication.
