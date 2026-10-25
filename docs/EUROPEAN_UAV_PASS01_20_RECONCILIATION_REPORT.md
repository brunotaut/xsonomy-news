# European UAV & Counter-UAS Landscape — research passes 01–20 reconciliation

2026-10-25. Input: `europe-uav-deep-research-master-pass-01-20.xlsx` — 134 raw findings,
102 name-level unique entities, 85 HIGH actionable, 16 review/entity, 1 exclusion.

`europe-uav-cuas-2026-v1` is unchanged: **273 entries**, untampered. All changes went to live
tables and the working edition `europe-uav-cuas-2026`. Scope came from
`countries.is_landscape_scope` throughout. **No V2 snapshot was created.**

---

## 1. Before → after

| | Before | After |
|---|---|---|
| Companies in European scope | 950 | **975** |
| Verified working landscape | 326 | **347** |
| — UAV only | 140 | 156 |
| — Counter-UAS only | 175 | 178 |
| — both UAV + C-UAS | 11 | 13 |
| — root-only UAV | 85 | 84 |
| — root-only C-UAS | 0 | 0 |
| Unclassified | 532 | **531** |
| Unresolved (classified, directory-only) | 76 | 75 |
| Needs review | 8 | **13** |
| Excluded | 8 | 9 |
| V1 snapshot entries | 273 | **273** |

---

## 2. Reconciliation results

| Status | Count |
|---|---|
| EXISTING_CONFIRMED | 27 |
| EXISTING_UPDATED | 15 |
| **NEW_COMPANY** | **22** |
| DUPLICATE_MERGED | 0 |
| PRODUCT_NOT_COMPANY | 0 |
| RELATIONSHIP_ONLY | 1 |
| EXCLUDED | 1 |
| NEEDS_REVIEW | 36 |
| **Research entities processed** | **102** |

| | |
|---|---|
| Taxonomy assignments added | 56 |
| Products created | 0 |
| Products corrected | 0 |
| Maturity changes | 0 |
| Aliases added | 14 |
| Countries filled (were empty) | 3 |
| Companies renamed | 1 |
| Relationships created | 1 |

### Why only 22 of 102 became companies

The workbook's own caveat was right: 102 is name-level deduplication, not entity
deduplication. Resolving every name against all 2,479 live companies by exact name,
legal-suffix-stripped name, alias, registrable domain and product name found that **42
already existed outright**, and 6 more matched once the legal form was stripped
(`sp. z o.o.`, `ApS`, `s.r.o.`, `AS`, `SA`, `OÜ`, `Ltd`, `Oy`). Creating from the list
unchecked would have produced about 48 duplicates.

**31 findings have no evidence URL at all.** Their research notes cite official sources, but
a note is not a source, and the queue's own instruction says to assign only evidence-supported
taxonomy. None was created; all are in the unresolved backlog awaiting a primary URL. That is
the single largest reason the number is 22 rather than ~53.

### Newly created companies (22)

All `draft`, all `discovery_source = external_research`, none published.

| Company | Country | Classification |
|---|---|---|
| 3Dfense | Czech Republic | UAV, VTOL |
| AgentFly Technologies | Czech Republic | UAV, UTM, autonomy |
| Acodyne | Denmark | UAV, VTOL, logistics |
| Godwit Systems | Denmark | UAV, VTOL, logistics |
| Hecto Drone | Denmark | UAV, multirotor, heavy-lift, logistics |
| MDSI | Denmark | UAV, payloads |
| Monopulse | Denmark | UAV, multirotor, ISR |
| OODALOOP Technologies | Denmark | UAV, FPV, strike, interceptor UAV |
| Robotto | Denmark | UAV, autonomy |
| HERAKLES Defense | Germany | Interceptor UAV, kinetic, AI/CV |
| Hellion Tech | Germany | Interceptor UAV, kinetic |
| NeuralAgent | Germany | UAV, autonomy |
| A-techSYN | Ireland | UAV, fixed-wing, VTOL |
| Pekkla | Lithuania | UAV, components |
| Acecore Technologies | Netherlands | UAV, multirotor, heavy-lift |
| Kaedra Technologies | Netherlands | Interceptor UAV, AI/CV |
| ADS — Autonomous Defense Systems | Portugal | UAV, autonomy, C2 |
| UAVSAVE | Slovakia | UAV, FPV, ISR |
| Octava Defence | Ukraine | UAV, loitering munition, strike |
| Occam Industries | United Kingdom | UAV, autonomy, flight software |
| StirlingX | United Kingdom | UAV, ground control |
| Rattlesnake | Poland | Kinetic C-UAS, detection |

Sixteen rest on the company's own website; three on a government or NATO source (CzechInvest,
NATO DIANA ×2, Lithuanian MoD); three on industry coverage. **Acecore Technologies** is the
weakest — a specialist directory listing only — so it was created at `low` confidence and does
not reach the verified subset.

---

## 3. Entity cases resolved

### Milliray = DroneTector

NATO DIANA's 2026 cohort lists **DroneTector Limited**; the later DIANA counter-UAS contract
announcement and the company's own site use **Milliray**, described as formerly branded
DroneTector. One company. The existing record was **renamed** rather than duplicated,
`DroneTector` and `DroneTector Limited` kept as aliases, `milliray.com` recorded, and
`cuas-det-radar` assigned — its technology is millimetre-wave radar, which the previous record
could not specify.

### Pekkla × December One RND — a partnership, not a company

A Lithuanian MoD release describes localising Ukrainian UAV component and EW manufacturing. No
joint legal entity is evidenced, so no JV company was created. **Pekkla UAB** itself was created
as a real company, and a `partner` relationship records the arrangement.

### ÆGIR — excluded

Maritime mission-management software for naval autonomous systems. No aerial UAV evidence in
the reviewed source. Excluded from the aerial Landscape; the company stays in UAV360.

### Held as needs_review rather than guessed

| Case | Why |
|---|---|
| **U&C UAS** | Research describes a Czech `U&C UAS s.r.o.` related to Ukrainian DeViRo. Our record is Ukrainian with the Stork and Mace products. A targeted search returned nothing on the relationship. Not merged — product overlap is not identity. |
| **Orbotix Industries** | Research: Polish, one-way-attack and swarm. Our record: Romanian, from a European UAV atlas. Different countries, different descriptions — plausibly two companies. Neither merged nor duplicated. |
| **Aerodata AG** | Research says Germany; our record is Swiss (`aerodata.ch`, AeroForce X). A separate German Aerodata AG exists in Braunschweig. Plausibly two companies sharing a name. |
| **Delian Alliance Industries** | Research says United Kingdom; our record is Greek. Not changed without a primary source. |
| **Robot Aviation** | Capability is current, but research flags a historic Norwegian insolvency. Legal entity unconfirmed, so legal metadata was left alone. |
| **Black Forest Systems** | Already resolved to Estonia (Tallinn HQ, Kyiv team) on 2026-10-23. Research restates the ambiguity without new evidence; no change. |
| **AegisX** | No evidence URL here. Research places it in Sweden, consistent with the NATO DIANA listing and against a previously reported Germany. Country unsettled, so still not created. |
| **TriSEC Systems** | The research itself records no explicit UAV/C-UAS evidence. |
| **Noxvayn, UAVLAS, Slipstream** | Association listing or no URL; taxonomy would be guesswork. |

### Confirmed as already correct (27)

Among them: Sphere Defense, Dronetag, URC Systems, Frankenburg Technologies, Hevi Optronics,
Threod Systems, Bittium, Aerix Systems, AndroMach, Artech'Drone, Asterodyn, Aviation Design,
Novadem, Rift, Survey Copter, Alpine Eagle, THYRA, Tytan Technologies, Twentyfour Industries,
Alpha Autonomy, ABZ Innovation, Sol.One, UAVision, Cambridge Aerospace, Vizgard, Arcani
Systems, Weibel Radars (via its `Weibel Scientific` alias).

---

## 4. Taxonomy

56 assignments added, every one with its own evidence URL — **0 unevidenced rows created**.

- **`cuas-integrated` assigned: 0.** No new finding carried explicit evidence of an integrated
  multi-layer system, so none was inferred from a company owning several products.
- **`Multi-Sensor Detection`: 0 manual assignments** anywhere in the database. It remains
  derived.
- No new taxonomy nodes were created. No taxonomy gap was found that the existing tree could
  not express.
- Root-only UAV fell from 85 to 84 — the new companies were classified to platform, mission or
  ecosystem leaves wherever the evidence named a role, rather than parked at bare `uav`.

---

## 5. QA

| Check | Result |
|---|---|
| V1 snapshot entries | **273**, unchanged |
| V1 tampered rows | **0** |
| Duplicate normalised company names | **0** |
| Self relationships | **0** |
| Orphan sector assignments | **0** |
| Sector rows added today without an evidence URL | **0** |
| Verified companies outside `is_landscape_scope` | **0** |
| `cuas-integrated` assigned this pass | **0** |
| Manually assigned `Multi-Sensor Detection` | **0** |
| New companies promoted by article links alone | **0** |
| Invalid `company_sector_products` | **0** |
| New companies published | **0** — all 22 are draft |
| Duplicate products introduced | **0** |

Pre-existing and unchanged by this pass: 44 groups of companies sharing a domain (mostly
parent/subsidiary pairs), 961 products with no owner, and two product pairs that are genuine
model variants (`Iris`/`Iris+`, `S1000`/`S1000+`).

---

## 6. Regenerated research backlog

Counts are computed from the live database, not carried over.

**`data/research/europe-uav-unclassified-after-pass20.csv`** — **531 companies**
(was 529 before this pass; the figure moved because three countries were filled, 22 companies
were created already classified, and the nightly pipeline keeps adding European companies).

| Priority | Count |
|---|---|
| HIGH | 373 |
| MEDIUM | 58 |
| LOW | 100 |

As noted previously, HIGH at 70% is a weak filter — UAV360 is a drone catalogue, so most
company text mentions drones. The sharper signal is the 100 LOW rows.

**`data/research/europe-uav-unresolved-after-pass20.csv`** — **88 companies**
(75 classified on directory evidence only, 13 identity/scope review — up from 8 because this
pass added five unresolved entity cases).

**`data/research/europe-uav-pass01-20-reconciliation.csv`** — 102 rows, one per research entity.

---

## 7. Decision

NOT READY FOR FINAL PRE-V2 REVIEW

Two concrete blockers, both carried from the pre-V2 integrity audit and neither created here:

1. **The article-company linker still manufactures false evidence nightly.** The verification
   rule now stops it promoting companies, but the linker itself is unchanged and has already
   been shown to recreate deleted links within a day. This was flagged on 2026-10-25 as needing
   a decision; it has not had one.
2. **35 `cuas-integrated` assignments carry no evidence URL** — Thales, Saab, Leonardo, MBDA,
   Rheinmetall and others. Integrated is the largest C-UAS category, so most of it rests on
   unevidenced legacy tags, against a standing rule that Integrated requires explicit evidence.
   Backfill or formally accept, but decide before freezing.

One new, smaller item from this pass:

3. **31 HIGH-confidence research findings were not actioned** because the workbook supplies no
   evidence URL for them. They are real leads and probably real companies; they are simply not
   creatable under the evidence standard as it stands. Supplying the URLs would likely convert
   most of them in a single short pass.

Not blockers: the 84 root-only UAV companies, the 13 held review cases, and the 44 shared-domain
parent/subsidiary pairs.
