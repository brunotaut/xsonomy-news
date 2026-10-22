# European C-UAS research integration — report

2026-10-22. Source: `uav360_europe_cuas_master_enriched_2026-10-22.xlsx`.
Pre-import analysis: `CUAS_PREIMPORT_REPORT.md`. No frontend work, no snapshot.

## Database changes

| | Before | After |
|---|---|---|
| Companies | 2,277 | **2,288** (+12 imported, −1 merged) |
| Products | 3,405 | **3,425** (+20) |
| `company_sectors` | 623 | **691** (+68) |
| C-UAS leaf assignments | 68 (pre-existing C2 + Integrated) | **136** |
| `company_sector_products` | 0 | **39** |
| Companies with maturity | 0 | **25** |

- **New companies imported: 12** — `discovery_source = 'external_research'`, `publication_status = 'draft'`.
- **Existing companies newly classified: 14.**
- **Total companies classified this pass: 26.**
- **In-scope companies carrying any C-UAS tag: 172.**
- **New products created: 20** (33 named systems proposed, 13 already existed and were reused).

## Classification by leaf

| Leaf | Total | Added now |
|---|---|---|
| Integrated / Multi-Layer | 64 | 7 |
| Command & Control | 20 | 9 |
| RF Detection | 8 | 8 |
| Radar | 7 | 7 |
| Kinetic | 7 | 7 |
| EO/IR | 6 | 6 |
| AI / Computer Vision | 5 | 5 |
| Sensor Fusion | 5 | 5 |
| Interceptor UAV | 4 | 4 |
| RF Jamming | 4 | 4 |
| Acoustic Detection | 3 | 3 |
| Directed Energy | 2 | 2 |
| GNSS Jamming / Spoofing | 1 | 1 |

Integrated and C2 start high because both existed as group tags before this pass.
Every other leaf was empty until today.

## Geography — the 26 classified

Poland 5 · United Kingdom 3 · Ukraine 3 · France 2 · Italy 2 · Denmark 2 ·
Bulgaria, Czech Republic, Estonia, Finland, Germany, Romania, Sweden — 1 each.

## Maturity

Of the 26: **commercial 16 · demonstrated 5 · deployed 3 · emerging 1 · not assessed 1.**
No value was changed — every one of the 25 was NULL before, so nothing was downgraded.

**Three set below what the spreadsheet proposed:**

| Company | Sheet | Set | Why |
|---|---|---|---|
| Kseonics Technology | Scaled | **Commercial** | "2,500+ sold" is the manufacturer's own claim; self-reported volume is not independent evidence of scale |
| Advanced Protection Systems | Scaled | **Deployed** | SAN CUAS is one named deployment; multiple separate customers are not evidenced |
| DroneZone | Deployed | **Commercial** | evidence is the company's own product page, which shows a marketed product, not operational use |

## Changes against what the research proposed

**1. Weibel — not imported; three records were one company.** The sheet listed "Weibel Scientific"
as a high-confidence import. Its own evidence gives the website `weibelradars.com`, and UAV360
already held **Weibel Radars** at that domain *and* **Weibel** at `weibel.dk`. Two pre-existing
duplicates no matcher could see — different names, different domains. They were merged, "Weibel
Scientific" kept as an alias, and the Radar classification applied to the surviving record, which
already had the XENTA-C counter-UAS radar.

**2. GDELS-Santa Bárbara Sistemas — dropped entirely.** The evidence confirms testing of a C-UAS
concept on HUNTER but names no capability. Marked `needs_review` rather than classified.

**3. Wardyn Technologies — four detection leaves withheld.** SENTRair is described as
*sensor-agnostic*: it integrates other makers' radar, RF, EO/IR and acoustic sensors rather than
producing them. Kept Sensor Fusion, C2 and AI/CV.

**4. Mehler Protection and Naval Group — Integrated withheld.** SCILT is "a close-range C-UAS
layer" and Rampart's evidence is at-sea firings. Neither is a multi-layer system.

**5. 80 product-support links removed after creation.** The research gives each company a list of
capabilities and a list of products but never says which product supports which. For five
companies with several of each, the join asserted a mapping no source contains — HADES alone
gained 36 claims including "SKADS supports GNSS jamming". Those were deleted. The remaining 39
links are the unambiguous ones, where a company has a single product or a single capability.
The products themselves were kept.

## Review queue

| Company | Why |
|---|---|
| **GDELS-Santa Bárbara Sistemas** | C-UAS work confirmed, no capability evidenced. `needs_review`. |
| **Wardyn Technologies** | Classified, but maturity not set — the evidence is a company-launch announcement. |
| **APS, HADES, JISR, Harmattan AI, TrackDeep** | Classified and products created, but no capability↔product mapping exists. Needs a per-product pass. |
| **Skylance** (sheet) | Not imported. Matches an existing *product* named SkyLance; may be the maker. |
| **OPTIX** (sheet) | Not imported. Matches existing company **Optix Co.** |
| **PZL Defence** (sheet) | Not imported. The research itself marks it "Hold / future capability". |
| **21 "Needs review" companies** (sheet) | Not imported — Medium confidence, most without a website. |
| **147 "Retain + validate leaves"** | Existing C-UAS companies still holding only group tags. Resolving those into the 13 leaves is the main remaining job. |

## QA

| Check | Result |
|---|---|
| Duplicate company names | **0** |
| Duplicate product slugs | **0** |
| Orphaned products | **0** |
| Orphaned `company_sector_products` | **0** |
| `company_sector_products` with a missing product | **0** |
| Invalid sector ids | **0** |
| Import-assigned leaves with no source URL | **0** |
| Maturity with no source or date | **0** |
| Classified company outside the 32-country scope | **0** |
| Pre-existing group tags intact | **yes** — Detection 54, Mitigation 93, unchanged |
| Existing classifications removed | **none** |
| Failed constraints | **none** |
| Full test suite (12 suites) | **pass** |

The total on `cuas-*` tags rose 215 → 231. That is not new group tagging: `cuas-c2` (+9) and
`cuas-integrated` (+7) are both group names *and* assignable leaves, so this pass's leaf
assignments land in the same count.

Candidate workflow for `europe-cuas-2026`: **included 33 · needs_review 1 · candidate 771**.
Every original reason row was preserved.

## Known limitations

1. Capability↔product mapping is missing for 5 companies (above).
2. Maturity for all 25 is `confidence = 'medium'` and `assigned_by = 'import'`. `research` is not
   a permitted value and the constraint was not weakened to add one.
3. Imported companies are `publication_status = 'draft'`, but the catalogue build ignores that
   field (`PUBLISH_STATUS = null`), so they will appear on xsonomy.com at the next build.
   Changing that is a publishing decision, flagged rather than taken.
4. The 21 Medium-confidence new companies were not imported and remain in the spreadsheet only.
