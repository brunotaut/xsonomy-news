# European UAV & Counter-UAS Landscape — high-evidence pack ingestion

2026-10-26. Input: `europe-uav-high-missing-evidence-researched.csv` — the 31 findings that
the Pass 01–20 reconciliation could not action for want of an evidence URL.

`europe-uav-cuas-2026-v1` is unchanged (273 entries, untampered) and remains the only
snapshot. **No V2 was created.** All changes are in live tables and `europe-uav-cuas-2026`.

---

## Summary

| | |
|---|---|
| Rows processed | **31 / 31** |
| Existing confirmed | 1 |
| Existing updated | 4 |
| **New companies** | **24** |
| Entity resolutions | 1 |
| Kept in review | 1 |
| Excluded | 0 |
| Taxonomy assignments added | **73** |
| Aliases added | 3 |
| Products created | **11** |
| Products updated | 0 |
| Country corrections | 0 (1 country *resolved* at creation — AegisX) |
| Maturity changes | **0** |

**Verified landscape: 343 → 367.**

### Why no maturity changes

The pack's strongest signals are NATO DIANA cohort selections and one NATO capability-
development contract. Per the rules supplied, an accelerator selection is not deployment and
a development contract is not a fielded system. Nothing in the pack explicitly evidences a
move on the 1–5 scale, so nothing was moved.

---

## New companies (24)

All created `draft`, `discovery_source = external_research`, each with its evidence URL on
the company and on every taxonomy row.

| Company | Country | Classification | Evidence type |
|---|---|---|---|
| Agilica | Belgium | UAV, navigation/GNSS | official site |
| Fadron | Bulgaria | UAV, autonomy, inspection | official site |
| Robodrone Industries | Czech Republic | UAV, multirotor | CzechInvest (gov) |
| Abtrion | Denmark | UAV, fixed-wing, loitering munition, strike | official site |
| UMag Solutions | Denmark | UAV, payloads, sensors | official site |
| Flying Eye | France | UAV, integration | official site |
| Hexadrone | France | UAV, multirotor, ISR, payloads | official site |
| OLEDCOMM | France | UAV, datalink | NATO DIANA |
| Aether Aeronautics | Greece | UAV (root only) | Elevate Greece registry (gov) |
| UCANDRONE | Greece | UAV, integration, ground control | Hellenic defence catalogue (gov) |
| Advanced Precision Systems | Norway | UAV, autonomy | official site |
| EUROTECH | Poland | UAV, fixed-wing, ISR | Polish defence portal (gov) |
| JSW Nowe Projekty | Poland | UAV, multirotor, launch/recovery, ground control | Polish defence portal (gov) |
| MSP InnTech | Poland | UAV, loitering munition, flight software, payloads | POLSA catalogue (gov) |
| Perf Drone Systems | Poland | UAV, datalink | official site |
| Spectre Solutions | Poland | UAV, VTOL, ISR | Polish defence portal (gov) |
| ViaDrone SWARM | Poland | UAV, FPV, components, flight software, **interceptor UAV** | Polish defence portal (gov) |
| Connect Robotics | Portugal | UAV, logistics, autonomy | Portugal transparency portal (gov) |
| INCAS | Romania | UAV, components | national aerospace institute |
| ALIAS ROBOTICS | Spain | UAV (root only) | NATO |
| Arke Telekom | Türkiye | UAV, datalink | official site |
| Marble Aerospace | United Kingdom | UAV, ISR, launch/recovery | official site |
| UAVLAS | Poland | UAV, navigation, launch/recovery | official documentation |
| AegisX | Sweden | C-UAS detection | NATO DIANA |

Three deliberately conservative calls:

- **Flying Eye** resells counter-drone detection and neutralisation equipment rather than
  building it, so it got no C-UAS leaf — only the integrator role.
- **Aether Aeronautics** is bare `uav`. The registry supports "UAVs and flying targets" but
  names no platform or mission specific enough to justify a leaf.
- **ViaDrone SWARM** is the one new C-UAS defeat assignment, because the Polish government
  portal states drone-based counter-UAS explicitly. No integrated tag was inferred.

### A taxonomy gap, reported not invented

**ALIAS ROBOTICS** builds cybersecurity for unmanned systems. The UAV360 ecosystem taxonomy
has no cybersecurity leaf, and the brief forbids creating nodes silently. It carries the bare
`uav` root and the gap is recorded here for a decision: add an `eco-cybersecurity` leaf, or
accept that this class of supplier stays at root level.

---

## Existing companies updated (4)

| Company | Change |
|---|---|
| **AirRobot GmbH & Co. KG** | BDSV (German defence industry association) evidence attached; `uav-isr` added. Already correct otherwise. |
| **Autonomous Flight Technologies** | Official `aft.ro` evidence replaces directory-era sourcing; confidence raised to high; `eco-flight-software` added; description rewritten from the source. |
| **BZB UAS** | Polish government defence portal replaces a `defencejobs`-only record. `uav-isr`, `uav-fpv`, `eco-ground-control` added; VESPULA and ekoSKY created as products. **Moves from candidate to verified.** |
| **Robotto** | `robotto.ai` and the NATO DIANA announcement attached; Spectre autonomy module created as a product. |

---

## Entity resolutions

### DroneTector Limited / Milliray — already resolved, confirmed

The pack flags this as the critical entity case. It was already settled on 2026-10-25 during
the Pass 01–20 reconciliation: the `DroneTector` record was **renamed** to Milliray,
`DroneTector` and `DroneTector Limited` kept as aliases, `milliray.com` recorded and
`cuas-det-radar` assigned. The new evidence — Companies House SC790858, the shared founder,
NATO's October 2026 contract announcement using Milliray — confirms that reading.
**No second company was created.** Status: `ENTITY_RESOLVED`, no change needed.

### AegisX — Germany ambiguity closed in favour of Sweden

No AegisX record existed. Created with **Sweden**, on NATO DIANA's own listing. The earlier
Germany attribution came from a secondary research row and was not preserved. Only
`cuas-detection` was assigned: NATO describes detection and tracking of low-flying
fibre-optic drones but does not state the modality, and fibre-optic control specifically
defeats RF detection, so guessing a leaf would have been wrong.

### HERAKLES — no duplicate

`HERAKLES Defense` was created the previous day from the same `herakles-defense.com`
evidence, with interceptor, kinetic and AI/CV already assigned. Only the aliases `HERAKLES`
and `Herakles GbR` and the Munich location were added. Status: `EXISTING_CONFIRMED`.

Four of the 31 rows — HERAKLES, Robotto, and the AirRobot/AFT/BZB matches — existed only
because the Pass 01–20 ingestion ran a day earlier. Re-resolving against the live database
rather than the state at queue-creation time is what prevented four duplicates.

---

## Cases remaining in review (2)

| Case | What is still missing |
|---|---|
| **Slipstream Engineering Design Limited** | NATO DIANA places it in a contested-electromagnetic cohort for high-bandwidth comms and sensing payloads, and Companies House confirms the legal entity — but **nothing ties the payload to UAVs**. No company was created and no UAV taxonomy assigned. A defence-cohort listing is not UAV evidence. |
| **UAVLAS** | Created, because the official documentation establishes a Poland-based optical and radar landing-assistance role — but held in `needs_review` and out of the verified subset because legal-entity detail is thin. Classified as landing and navigation ecosystem, **explicitly not a UAV manufacturer**. |

`data/research/europe-uav-high-missing-evidence-urls.csv` is now **closed**: 29 of 31 are
fully actioned, and the 2 above are carried in
`data/research/europe-uav-high-evidence-still-unresolved.csv`.

---

## Landscape after ingestion

| | Before | After |
|---|---|---|
| European-scope companies | 975 | **1,002** |
| **Verified working landscape** | 343 | **367** |
| UAV only | 157 | 179 |
| C-UAS only | 174 | 175 |
| both | 12 | 13 |
| root-only UAV | 84 | 84 |
| root-only C-UAS | 1 | 1 |
| Unclassified | 535 | 535 |
| Unresolved | 75 | 74 |
| Needs review | 13 | 14 |
| Excluded | 9 | 9 |

A note on "root-only C-UAS": on the strict reading used during this pass — counting the
mid-level nodes `cuas-detection`, `cuas-mitigation` and `cuas-tracking` as *not* specific —
**20** verified companies carry no specific C-UAS leaf. The figure of 1 in the table uses the
looser definition carried through earlier reports so the before/after stays comparable. The
stricter number is the more useful one and overlaps heavily with the 111-leaf backlog below.

Regenerated backlogs:
- `data/research/europe-uav-unclassified-post-evidence.csv` — **535** (326 HIGH, 56 MEDIUM, 153 LOW)
- `data/research/europe-uav-unresolved-post-evidence.csv` — **88**

---

## QA

| Check | Result |
|---|---|
| V1 unchanged = 273 entries | **PASS** |
| V1 tampered rows | **PASS** (0) |
| No V2 | **PASS** — `europe-uav-cuas-2026-v1` is still the only snapshot |
| Duplicate normalised company names | **PASS** (0) |
| Duplicate domains requiring review | **PASS** — 44 groups, unchanged, all pre-existing parent/subsidiary pairs |
| Duplicate products | **PASS** — 2, both pre-existing model variants (`Iris`/`Iris+`, `S1000`/`S1000+`) |
| Self relationships | **PASS** (0) |
| Orphan taxonomy | **PASS** (0) |
| Taxonomy added without evidence URL | **PASS** (0) |
| Invalid product ownership | **PASS** (0) |
| Verified companies outside scope | **PASS** (0) |
| `cuas-integrated` added | **PASS** (0 — none inferred) |
| Manual Multi-Sensor Detection | **PASS** (0) |
| Article-only verification | **PASS** (0) |
| New companies accidentally published | **PASS** (0 — all 24 are draft) |
| Article-linker fix intact | **PASS** — `scripts/lib/resolve.mjs` and `scripts/resolve-entities.mjs` unchanged since commit `aaf7b6b`; **13/13 tests pass** |

---

## Next task boundary

The legacy C-UAS provenance audit was **not** started, as instructed.

**Current count of unevidenced C-UAS leaf assignments on verified companies: 111.**

Unchanged by this ingestion — every C-UAS assignment made today carries an evidence URL.

---

EVIDENCE PACK INGESTED — READY FOR LEGACY C-UAS PROVENANCE PASS
