# Batch 13 external research handoff
Date: 2026-10-28
Input: `research-agent/queue/batch-13.csv`
Output: `research-agent/researched/batch-13-researched.csv`

40 ENRICH records researched externally. All 12 original columns and all 40 company IDs preserved exactly; 16 research columns appended. CSV parsed back successfully with consistent 28-column rows, unique IDs, descriptions, evidence URLs and allowed verdicts.

## Findings, not admission counts
- 25 IN_SCOPE: a documented UAV/C-UAS product, component or integration role. This is NOT permission to admit or publish; some are development-stage, subsidiary or unresolved-entity cases.
- 9 UNKNOWN: unresolved identity/geography, policy or product maturity.
- 6 OUT_OF_SCOPE: current evidence supports another domain, customer/investor role or parent-level attribution rather than an eligible supplier.

Confidence describes evidence confidence, not admission certainty. An UNKNOWN/HIGH row can have well-established facts but an unresolved policy boundary. Named product fields sometimes explicitly identify partner-owned products or unverified existing catalogue claims: these are ownership warnings, NOT product-creation instructions.

## Country semantics: do not blindly overwrite DB countries
The queue explicitly requested canonical-parent headquarters. For confirmed parent groups, researched_country contains that country; research_operating_country preserves the supplier's own country and research_parent_entity names the group.
- Qioptiq: UK operating business / US Teledyne parent.
- Rotax: Austria manufacturer / Canada BRP parent.
- Axis: Sweden manufacturer / Japan Canon parent.
- PZL Mielec: Poland manufacturer / US Lockheed Martin parent.
- Santa Bárbara: Spain operating company and GDELS headquarters / US General Dynamics ultimate parent.
- Odin Defence: Estonia operating entity / UK Thor Industries parent.
Where no controlling parent was established, country is the identifiable operating/company HQ, NOT an assertion that ultimate ownership was exhaustively verified. MP-SEC France and several private brands retain explicit parent/entity caveats. Simrad country is UNRESOLVED because the name covers distinct businesses. Resolve schema and geographic eligibility before applying changes.

## Highest-value reconciliation checks
1. Frankenberg -> Frankenburg Technologies, Tallinn HQ; dedupe spelling and UK-local record.
2. TUSAS = Turkish Aerospace / TAI / TUSAŞ; never assign Baykar TB3.
3. Roboneers has aerial UAV products despite the ground-robot discovery story; preserve domain separation.
4. GRIM/Grim Tech: product evidence exists, but legal entity versus charity-footer relationship is unresolved. No automatic company/NGO merge.
5. GLEFA: direct manufacturer interview plus government partner mention; official-domain lead supplied by company profile, site unavailable. Legal entity and joint Behemoth ownership allocation remain unresolved.
6. PREZIS: software integration, not ownership of partner radar/effectors. Dutch Tree B.V. alias requires confirmation.
7. MP-SEC France/Vigilant Solution differs from Swedish MP-SEC International. STRIX is a robotics kit, Khronos belongs to Elistair, V60 to Ghost Robotics.
8. Thor and Odin are parent/subsidiary, not duplicate synonyms. Do not use odindefence.com (unrelated UK training-equipment firm) for Estonian Odin.
9. Stemme supplies airframe lineage; Patroller belongs to Safran Electronics & Defense.
10. Boryszew is an industrial investor; Hornet–Polskie Drony/ITWL is the product entity. A July 2026 production-line presentation supersedes the earlier mere plan, but does not prove deliveries.
11. Varjo owns XR-4 hardware; Horizon Guardian is Australian Applied Virtual Simulation software.
12. ArianeGroup sold its majority CILAS stake in 2022; stale ownership cannot assign HELMA-P to ArianeGroup.
13. Droniq is a separate DFS/Telekom JV. Telekom's protection service involves T-Systems onsite and third-party sensors.
14. Simrad is ambiguous between Navico/Brunswick and Kongsberg businesses. Neither marine use nor marine radar establishes UAV/C-UAS scope.
15. SNCF Réseau is an end user; inspect Altametris separately. HyLight's airship is not SNCF's product.
16. SVOS makes the MARS carrier; Saab makes the integrated air-defence system. ARMMO makes BANDIT-X, not Santa Bárbara.

## Maturity and taxonomy
Dryad's Silvaguard is demonstrated but its current page specifies 2027 pilots / 2028 commercial launch; the demonstration suppression airframe has an external supplier. Ericsson ISAC is demonstrated, distinct from deployed aerial connectivity. QLM has primary evidence of 2021 UAV sensor trials, but current commercial airborne availability is unresolved. Vertical's optionally piloted defence version and PZL's C-UAS adaptation are future/concept cases. Kitemill/Kitewall's optional payloads do not establish ownership of every advertised sensor. Santa Bárbara counter-UAS integration is at testing/demonstration stage.

Known C-UAS leaves are used where supported. Plain-language UAV/UTM/simulation recommendations are proposals to map against the live taxonomy, not invented slugs. Never add derived structural parents as evidenced capabilities.

## Existing decisions remain open and non-blocking
Retain the existing batch-04 warhead-supplier hold for EURENCO/Odin and related Thor exposure. EURENCO's HX-2 partnership is documented by Helsing; DEMON attribution was not independently established in this pass and must not be confused with the BAE/Cranfield demonstrator. No warhead-scope policy chosen.

Retain the batch-10 operator/services decision. Varjo/Althimis simulation cases require an appropriate owned-hardware/software mapping or continued review; simulated detection/defeat does not justify operational C-UAS leaves. No taxonomy expansion authorised by this research.

The prior STATE warning about 206 live records marked excluded/needs_review is carried forward without changing publication status. No new blocking decision is needed merely to hand off enrichment; unresolved rows remain held.

## Limits and next action
Evidence includes official company/product pages, government and partner sources, company-controlled profiles and explicitly labelled direct interviews/secondary corroboration. It is not a legal-registry audit of all 40 firms. Potential duplicates are candidates for Claude's LIVE DB check; no claim that unseen DB rows were exhaustively compared. Unavailable domains and uncertain entities are flagged.

Claude: reconcile independently, inspect ownership and country semantics, validate taxonomy and dedupe, preserve unresolved holds, run existing QA, write reconciliation/report and regenerate the next queue. No Supabase writes, publication changes, V3 creation or frozen-snapshot changes were made by ChatGPT.
