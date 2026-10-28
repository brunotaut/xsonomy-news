# External landscape audit — second pass
Date: 2026-10-28

## Result
Three additional candidate companies have current first-party capability evidence: 42 Solutions, Adevex and AURYN Aero. Aeronautica SDLE remains a historical lead requiring identity and current-offer verification. These are candidates for reconciliation, not confirmed missing live-database records or approved publications.

This supplements the first audit and its four candidates (Drone Band, Fly4Future, BizGarden and GINA Software). It does not replace that audit.

## Evidence and proposed treatment

| Entity | Country | Evidence | Proposed treatment |
|---|---|---|---|
| 42 Solutions | Netherlands | SPARROW combines third-party sensor data into a counter-UAS command/control interface. Company contact identifies Eindhoven. | Candidate: C-UAS C2/software and integration. Do not assign radar/RF/EO sensor manufacturing merely because their data is integrated. Current primary page uses SPARROW; preserve CUPS as a historical product reference pending verification, not an assumed alias. |
| Adevex | Spain | Company describes DRACO C4ISR, integrated C-UxV, ESM detector and ECM offerings; exhibitor record identifies Spain and Adevex as manufacturer. | Candidate: C2, RF detection, electronic countermeasures and integration, subject to taxonomy matching. Record AICOX relationship separately. No automatic radar or kinetic-effector manufacturing tags. |
| AURYN Aero | Italy | Company identifies itself as Italian and describes UAV platforms, autonomy software and training assets. Beretta confirms a strategic partnership. Several fleet entries explicitly say Coming soon. | Candidate: UAV/platform engineering, autonomy and training; record each product's maturity individually. Do not assign shotgun ownership or deployed maturity from partnership/test participation. |
| Aeronautica SDLE | Spain, directory attribution | Historical directory and 2019 reporting identify a drone-jammer supply contract. Current first-party identity and product ownership were not established in this pass. | HOLD: verify legal entity, SDLE/Star Defence Logistics aliases, current website and OEM versus supplier role before inclusion. |

Primary sources checked:
- 42 Solutions SPARROW: https://42solutions.nl/projects/sparrow/
- 42 Solutions projects/contact: https://42solutions.nl/projects/
- 42 Solutions 2020 integration exercise: https://42solutions.nl/blog/2020-10-22-42-solutions-at-nato-c-uas-measurement-event/
- Adevex products: https://adevex.es/en/2025/05/05/adevex-presents-advanced-solutions-in-surveillance-electronic-warfare-and-c-uas-at-feindef-2025-to-strengthen-the-tactical-security-of-the-armed-forces/
- Adevex exhibitor/manufacturer record: https://registro.feindefevent.com/feindef2025/en/Products/Details/1339211
- AURYN identity: https://www.aurynaero.com/about-auryn-aero/
- AURYN fleet and availability labels: https://www.aurynaero.com/air-system/
- Beretta partnership: https://www.berettadefensetechnologies.com/beretta-and-auryn-aero-announce-strategic-partnership-to-shape-the-future-of-the-battlefield/
- SDLE historical lead only: https://www.unmannedairspace.info/counter-uas-systems-and-policies/spanish-mod-selects-two-rifle-shaped-aeronautica-sdle-counter-drone-systems/
- Edey FX location and products: https://edeyfx.com/

## Duplicate and scope controls
Checked the cached public registry, cached public landscape and 2026-10-22 repository company export. No candidate-name match was found for 42 Solutions, Adevex, AURYN Aero or Aeronautica SDLE in these snapshots. This does not establish absence from current drafts, aliases or subsequent reconciliation.

Benelli and Chess Dynamics match existing public landscape records. Beretta Defense Technologies matches the general registry; it was not in the cached landscape. Enrich/reconcile the existing record rather than create another company. Keep Fabbrica d’Armi Pietro Beretta and the BDT umbrella distinct when assigning ownership.

ARGE is a consortium/project reference, not a new standalone company. Do not create a new company for the MBDA/Rheinmetall laser collaboration. Existing multinational parent names and product mentions require operating-entity checks, not automatic new company creation. Edey FX's own contact page places it in Ottawa, Canada, so it is outside the European headquarters scope.

## Coverage and limitations
The remaining sections of the public April 2026 Unmanned Airspace sample were screened. Non-European entries were scope exclusions; projects and product names were not treated as companies. This is a sample audit, not an exhaustive review of the paid directory or a full DII logo/database reconciliation.

Discovery sample: https://www.unmannedairspace.info/wp-content/uploads/2026/05/Counter-UAS-directory-April-2026-sample.pdf

## Handoff
At review, origin/main STATE.json reports Batch 15 READY_FOR_RESEARCH, next_actor chatgpt; Batch 14 completed. This side audit does not advance or replace that batch. Claude should reconcile these candidate identities against current full DB/aliases and existing queues before creating any draft. No Supabase mutations, publication changes or frozen-snapshot changes were made.
