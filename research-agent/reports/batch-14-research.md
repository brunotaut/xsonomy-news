# Batch 14 external research handoff
Date: 2026-10-28
Input: `research-agent/queue/batch-14.csv`
Output: `research-agent/researched/batch-14-researched.csv`

40 ENRICH records researched externally. All 12 original columns and 40 company IDs preserved exactly; 13 research columns appended. CSV round-trip validation passed: 40 unique IDs, 25 columns, allowed verdicts, factual descriptions and evidence URLs for every row.

## Findings, not admissions
- 15 IN_SCOPE: documented UAV/C-UAS offering or dedicated integration role, including a historical entity requiring merger rather than admission.
- 14 OUT_OF_SCOPE: non-company, non-aerial, general-purpose or incorrectly attributed supplier.
- 11 UNKNOWN: maturity, entity/product ownership, current supplier status or existing service-scope question unresolved.

Confidence describes confidence in the evidence, not an admission recommendation. An IN_SCOPE row is not permission to publish or create every mentioned product. Proposed natural-language UAV taxonomy labels are not database slugs. Specific ecosystem/C-UAS leaves are conservative suggestions requiring reconciliation against the taxonomy.

## Corrections with highest impact
1. DotChain / DOTChain Defence is a Ministry of Defence procurement platform, not a company. Remove its product attribution from Ratel Robotics; do not remove legitimate Ratel aircraft.
2. Ratel's current official catalogue includes aerial drones. A UGV-only exclusion would now be wrong. Catalogue presence does not establish OEM ownership for every listed model; create products only after model-level ownership verification. The Swarmer transaction is described as an acquisition agreement, not confirmed closed ownership.
3. Holywater is entertainment technology; Oboronka is a media publication. Neither becomes a UAV maker through article co-occurrence.
4. Correct operating countries: Innokas Finland; KOVO Armor Lithuania; Dropla Denmark with Ukrainian operations/founders. Farsight's official contracting entity is FarsightVision OÜ in Estonia, with a Ukrainian team/operating connection: preserve that relationship and review whether the existing row specifically represents a Ukrainian operating entity before overwriting country.
5. ASE Group is the Polish group at ase.pl, not Taiwanese semiconductor ASE at ase.aseglobal.com. IRYDA Plus work is attributed to Squadron ASE Group and a consortium, and remains development/testing evidence.
6. Gilden Photonics Limited SC286762 is officially dissolved as of 17 July 2026. Do not retain an active-supplier description or invent a successor.
7. Tehavtofart Pivden is explicitly identified as TAF Industries by the European Commission. Merge into an existing TAF record if present.
8. ECA Group joined iXblue to form Exail in 2022. IN_SCOPE is historical domain relevance, not a recommendation for a second live company. Fold historical IT180 evidence into the canonical Exail record, with current availability unresolved.
9. Atos / Eviden / Avantix are parent, brand and business relationships requiring one canonical allocation of the UAV SIGINT work. TUNDRA 2 remains Hexadrone's aircraft.
10. Blohm+Voss's legacy domain is inactive; the current Rheinmetall page establishes the Hamburg operating company and NVL/Rheinmetall relationship. It remains a naval shipyard, not a UAV maker.

## Application of the batch-13 scope rule
Used the existing rule: a named offering built FOR unmanned aircraft or counter-UAS qualifies; general-purpose technology used by a drone customer does not.
- BT Drone SIM, Oko cameras, Dropla Blue Eyes, Aimpoint FCS 15, Meteksan KAPAN, and dedicated UAV integration/engineering roles have direct offering evidence.
- AirShaper's Wingtra use case and Siemens Simcenter's UAV use case do not turn generic simulation products into dedicated UAV offerings.
- MCL's parent and company pages establish bespoke engineering/integration, beyond distribution; recommend eco-integration only.
- Sener programme participation does not make Eurodrone or SIRTAP Sener aircraft.
- Eurosam expressly designs SAMP/T NG for UAV threats; broad anti-air language alone, such as Dearsan AAW, was not treated as sufficient.
- DEUTZ has a real drone-drive connection via SOBEK. Hold parent/subsidiary allocation rather than dismissing it as a generic engine company.

## Holds and maturity limits
- Innokas: Airlogix manufacturing LOI; production/JV execution not established.
- Gilden Photonics: dissolved legal entity; historical capability and successor require separate treatment.
- Griselda: existing intelligence platform confirmed, but company identity and dedicated UAV-product boundary unresolved; official domain was inaccessible.
- Horizon Technologies: historical Xtender UAV tests, but current UAV offering not established from present corporate history.
- Brigantes: distributor/fielding-service role; existing operator/services policy question.
- Siemens Energy: current drone-inspection offering; existing operator/services policy question, not UAV manufacturing.
- ASE Group: Squadron ownership allocation and project maturity.
- Asseco Poland: PUSZCZYK demonstrated in October 2026; no claim of deployed commercial capability. Partner sensors and Ericsson ISAC are not Asseco-owned products.
- Atos and Eviden: overlapping parent/brand/business attribution and announced mini-UAV integration.
- DEUTZ: SOBEK operating-company ownership of the actual drone-drive offering.

Navantia's exercise validation is not fleet-wide deployment. MBDA Deutschland's marketed system offering is distinct from development-stage SADM/laser elements. Aimpoint's announcement does not establish operational deployment. CODE380 attribution is secondary-source-backed while the official product documentation establishes passive RF detection; no jamming, takeover or digital-video-decryption claim is supported.

## Reconciliation instructions
- Reuse canonical entities and products before creating anything. Check TAF, Exail, Meteksan, MBDA, Atos/Eviden/Avantix, ASE/Squadron and DEUTZ/SOBEK.
- Research country always refers to the operating entity in this row. Parent geography, where verified, is separate in notes; no substitution of parent country.
- Original queue values remain intact for audit. Product lists sometimes include historical, partner or non-aerial offerings for disambiguation, explicitly marked in notes; not all are import candidates.
- No human decision is newly required to reconcile the unambiguous rows. Existing warhead and operator/services questions remain open and nonblocking; hold affected rows.
- No Supabase mutation, publication change, V3 creation or frozen-snapshot edit performed. Live counts remain Claude's last reconciled counts.
