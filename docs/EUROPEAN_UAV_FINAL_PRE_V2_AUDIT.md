# European UAV & Counter-UAS Landscape — final pre-V2 audit

2026-10-26. Consistency, reproducibility and defensibility check before freezing V2.
**No V2 was created.** `europe-uav-cuas-2026-v1` unchanged at 273 entries.

---

## Executive decision

**GO.**

The verified subset reconciles exactly against its own eligibility rule with **zero** mismatch,
every specific C-UAS capability carries provenance, no entity conflation or product-as-company
survives in it, and no company is held in by a false article link. Seven defects were found
and fixed during the audit; one of them cost a company its membership, which is the right
outcome.

| | |
|---|---|
| European-scope companies | **1,002** |
| **Verified / V2-eligible** | **358** |
| Eligibility-vs-membership mismatch | **0** |
| V1 entries | 273, untampered |
| V2 exists | **NO** |

---

## Current landscape

| | Count |
|---|---|
| European-scope universe | 1,002 |
| **Verified (V2-eligible)** | **358** |
| — UAV only | 183 |
| — Counter-UAS only | 164 |
| — both | 11 |
| Classified but unverified | 74 |
| Unclassified | 539 |
| Needs review | 18 |
| Excluded | 10 |

---

## Changes made during this audit

Seven corrections, all safe and all evidenced:

| # | Change | Effect |
|---|---|---|
| 1 | **Sky Map** `live → draft` | A platform, not a company, was published as one. Record, evidence, screening note and product retained. |
| 2 | **DefSecIntel · Origin Robotics** `live → draft` | Conflated shell published as a company. Cannot be deleted — frozen V1 references it — so `merged_with` edges and the screening note stay. |
| 3 | **I-SEE** C-UAS classification removed | All three assignments cited `https://defence-blog.com`, a **news-site root** that is neither the company's domain nor a page about it. Left the verified subset. |
| 4 | **Sky Fortress** acoustic leaf re-sourced | Previously cited the bare `brave1.gov.ua` portal root. Now cites Wikipedia and Militarnyi coverage of the acoustic network. Stays verified. |
| 5 | **ESG, Quell, Senhive** — 3 standalone broad C-UAS rows removed | Unevidenced broad rows with no matching specific leaf. Each company keeps its evidenced leaves. |
| 6 | **DASAL, SBG Systems, NEURA Robotics** added to the working edition | Created today by the news pipeline and absent from the accounting. All unclassified; none could have been eligible. |
| 7 | **`v_link_audit` acronym test added** | The classifier still mislabelled AIDC. See *Article-link integrity*. |

Only change 3 altered V2 eligibility.

---

## V2 eligibility rule

Derived from the implementation (`v_landscape_verified` plus the working-edition status filter),
not written as prose:

```
V2 ELIGIBILITY RULE:
  companies c JOIN countries co ON co.name = c.hq_country AND co.is_landscape_scope
  AND  tagged         := EXISTS (company_sectors in the 'uav' OR 'counter-uas' subtree)
  AND ( ev_website    := c.website IS NOT NULL
                         AND c.website !~* '(drone-directory|defencejobs|brave1\.gov|wikipedia
                                             |wikidata|linkedin|crunchbase|dealroom|defence-blog)'
      OR ev_product   := EXISTS (products p WHERE p.company_id = c.id)
      OR ev_source_url:= EXISTS (non-directory URL on the company OR on one of its sector rows) )
  AND  landscape_candidates.status NOT IN ('excluded','needs_review')
```

A linked news article is **not** in the rule: it is corroborating evidence only, by the
2026-10-25 change.

### Membership reconciliation

| | |
|---|---|
| Eligible by rule | **358** |
| Working edition `included` | **358** |
| Eligible but not included | **0** |
| Included but not eligible | **0** |

---

## Entity integrity

| Check (verified set) | Result |
|---|---|
| Country missing | 0 |
| Country outside scope | 0 |
| Duplicate normalised names | 0 |
| Merged shell still verified | 0 |
| Product or programme stored as company | 0 |
| Entity conflation without its own domain | 0 |
| Verified with neither website nor any source URL | 0 (was 2 — I-SEE removed, Sky Fortress re-sourced) |

**Three slash-separated names were examined and cleared:** ECA Group / Infotron,
Meridian / Politek-Aero, and Thales / Elbit Systems (U-TacS joint venture). Each has its own
domain and its own product, and U-TacS is a genuinely registered JV — unlike the
DefSecIntel shell, which had neither. Display-name tidy-up is post-V2.

**Seven shared-domain groups** remain in the verified set: Safran/Safran E&D, KNDS/KNDS France,
Rheinmetall/Rheinmetall Air Defence, Thales/Aveillant, Quantum Systems/Welles Acoustics,
Hensoldt/ESG, and three Airbus entities. All are genuine parent/subsidiary pairs, not
duplicates. Whether a Landscape entry should represent a group or a legal entity is an
editorial question, not a correctness defect.

---

## UAV taxonomy integrity

Light systematic scan, as scoped.

| Finding | Count | Severity |
|---|---|---|
| Root-only `uav` companies | 85 | POST_V2_ENRICHMENT — explicitly not a blocker |
| Conflicting platform leaves (fixed-wing + multirotor + VTOL together) | 0 | — |
| UAV-side assignments with no evidence URL | 47 | POST_V2_ENRICHMENT |
| Products classified as companies | 0 | — |
| Both loitering-munition and uav-strike | 2 | Not conflicting; a maker can field both |

The 47 unevidenced UAV-side assignments are the same legacy class the C-UAS side has now
worked through, one branch over. They make the classification *coarse*, not false, and the
UAV side has not yet had an evidence pass.

---

## C-UAS integrity

| | Count |
|---|---|
| Specific C-UAS assignments without an evidence URL | **0** |
| Standalone broad C-UAS classifications unsupported | **0** |
| `cuas-integrated` without evidence, in scope | **0** |
| Manually assigned Multi-Sensor Detection | **0** |
| C-UAS entity conflations in the verified set | **0** |
| C-UAS product-ownership problems | **0** |

**A sharper test than last time.** The previous audit counted *presence* of a URL. This one
asked whether the URL can evidence anything: 174 specific leaves cite a bare homepage. For
156 that homepage is the company's own domain — tier-1 under the evidence hierarchy, coarse
but legitimate. A further 15 are the company's own domain under a different variant or TLD
than the `website` field (Indra, Leonardo, Kvertus, Marduk, Monava, EDRONE, AP-FLYER's product
site). **Three were genuine defects** — I-SEE (2) and Sky Fortress (1) — and both were resolved.

### Known acceptable exceptions, confirmed

- **AegisX** — broad detection evidenced by NATO, modality not stated. Fibre-optic control
  specifically defeats RF detection, so inventing a leaf would be wrong. Retained broad.
- **Phantom Defense** — broad C-UAS EW offering evidenced by Eurosatory coverage, defeat
  modality not explicit. No RF-jamming inference made.
- **Teledyne FLIR Defense** — its unevidenced `cuas-integrated` cannot reach V2: the company
  is US, outside `is_landscape_scope`. In-scope `cuas-integrated` without evidence is **0**.

---

## Mid-level C-UAS nodes

| | Count |
|---|---|
| Mid-level rows in the verified set | 97 |
| Structural (a matching specific leaf exists) | 90 |
| Standalone, evidenced | 4 |
| Standalone, unsupported | **0** (was 3; removed) |
| Companies kept verified **solely** by an unsupported broad node | **0** |

No snapshot membership depends on an accidental legacy parent row. The architectural change —
deriving parents at read time instead of storing them — stays post-V2, as instructed.

---

## Product integrity

| | Count |
|---|---|
| Companies verified **only** by a product | **0** |
| Duplicate products within one verified company | 0 |
| Product name colliding with another company's name | 3 — Vector/Quantum Systems, Polaris/FlyFocus, S.EN.T.IN.EL/Sentinel; all previously checked and correctly attributed |
| Invalid `company_sector_products` links | 0 |
| Orphan products (whole catalogue) | 968 — POST_V2; none affects verification |

---

## Article-link integrity

9,093 links scored: **8,288 VALID, 645 PROBABLE, 160 AMBIGUOUS, 0 FALSE_MATCH.**

| | |
|---|---|
| False links affecting verified companies | **0** |
| False links anywhere | **0** |
| Article-only verification | **0** |
| Regression tests | **13/13 pass** |
| Linker source unchanged since the fix | yes — commit `aaf7b6b` |

**A classifier defect I had to fix twice.** On 2026-10-25 an AIDC link was deleted as a false
match; it was not — the article names *"Aerospace Industrial Development Corporation"*, which
**is** AIDC. On 2026-10-26 I added a containment test, which still missed it, because the
acronym does not literally appear inside the expanded name. The correct test is an initials
comparison, now implemented. The data was never wrong after the first correction; my
*measurement* of it was, twice.

Cached refusals work: `EOS` is cached `rejected / manual:ambiguous`, and `Suzuyo` is cached
`rejected / manual:collides-with-Suzuki` after the nightly linker recreated it once.

---

## Verification reproducibility

**REPRODUCIBLE.**

Membership is recomputed from `v_landscape_verified` plus the status filter, and the
independent recomputation matched the stored membership exactly — 358 = 358, zero drift in
either direction. The rule lives in a database view rather than in re-typed SQL, so it is
auditable in one place.

Two documented dependencies, neither affecting correctness:

1. **`landscape_candidates.status` carries hand-made decisions** (`excluded`, `needs_review`)
   that the rule respects but cannot derive. That is intended — they are editorial judgements
   — but it means membership is rule-plus-decisions, not rule alone. Every such decision has a
   written `screening_note`.
2. **Publication status is not an input**, confirmed: 67 of the verified set are `draft`.

---

## Snapshot architecture

`landscape_entries` carries: `snapshot_id`, `company_id`, `company_name`, `hq_country`,
`categories`, `category_ids`, `website`, `source_urls`, `publication_status`, `confidence`,
`maturity`, `maturity_rationale`, `evidence_count`, `product_count`.
`landscape_snapshots` carries `slug`, `title`, `scope` jsonb, `taken_at`, `published_at`, `notes`.
Immutability triggers are present on both tables and were tested against V1.

| Finding | Severity |
|---|---|
| Company identity, name, country, classification, taxonomy IDs, maturity, confidence and provenance all preserved | OK |
| `scope` jsonb records the country list and inclusion rule used, so a snapshot stays readable after the rule changes | OK |
| Entries do not record **per-assignment** evidence URLs — only the company-level union in `source_urls` | **POST_V2_IMPROVEMENT** — which leaf each URL supports is not recoverable from the snapshot alone |
| Entries do not record the eligibility rule **version** that produced them | **SHOULD_FIX_BEFORE_V2** — cheap: write the rule text into `scope` at freeze time, as V1 did |

**No BLOCKER_BEFORE_V2 schema findings.**

---

## European-scope accounting

Mutually exclusive, in precedence order: excluded → needs_review → verified → classified-unverified → unclassified.

| State | Count |
|---|---|
| Excluded | 10 |
| Needs review | 18 |
| **Verified (V2-eligible)** | **358** |
| Classified but unverified | 74 |
| Unclassified | 539 |
| In scope but absent from the edition | **0** (was 3; added) |
| **Total** | **1,002** ✓ |

Reconciles exactly to the European-scope universe. No company disappears between states.

---

## Remaining debt

### Before V2 — blockers

**None.**

One cheap non-blocking item to do *at* freeze time: write the eligibility rule text into the
snapshot's `scope` jsonb so V2 records the rule that produced it.

### After V2

- 47 UAV-side assignments without evidence URLs — the UAV branch has not had the C-UAS treatment.
- 156 C-UAS leaves citing a company homepage rather than a specific page.
- 85 root-only UAV companies.
- 968 orphan products.
- Mid-level C-UAS parents stored rather than derived.
- Display-name tidy-up for the three slash-separated records.
- Seven parent/subsidiary pairs sharing a domain — an editorial decision about what an entry represents.
- 539 unclassified and 74 classified-unverified companies — the research backlog.

---

## QA

| # | Check | Result |
|---|---|---|
| Q01 | European-scope companies | 1,002 |
| Q02 | Verified working count | 358 |
| Q03 | V2-eligible by rule | 358 |
| Q04 | Eligibility vs membership mismatch | **0** |
| Q05 | V1 entries | **273** |
| Q06 | V1 tampered | **0** |
| Q07 | V2 exists | **NO** |
| Q08 | Duplicate normalised company names | 0 |
| Q09 | Shared-domain groups in verified | 7 — genuine parent/subsidiary |
| Q10 | Self relationships | 0 |
| Q11 | Orphan taxonomy | 0 |
| Q12 | Invalid company-sector-product links | 0 |
| Q13 | Specific C-UAS leaves without evidence | **0** |
| Q14 | Unsupported standalone broad C-UAS | **0** |
| Q15 | `cuas-integrated` without evidence, in scope | **0** |
| Q16 | Manual Multi-Sensor Detection | 0 |
| Q17 | Verified outside scope | 0 |
| Q18 | Product-not-company in verified | 0 |
| Q19 | Entity conflations in verified | 0 |
| Q20 | Article-only verification | 0 |
| Q21 | False article links affecting verified | **0** |
| Q22 | False article links anywhere | **0** |
| Q23 | Accidental publications (invalid entities live) | 0 |
| Q24 | UAV-side assignments without evidence | 47 — post-V2 |
| Q25 | Root-only UAV | 85 — not a blocker |
| — | Article-link regression tests | **13/13 pass** |
| — | Full automated test suite | **13 tests, 13 pass, 0 fail** |

---

PRE-V2 AUDIT PASSED — READY TO FREEZE V2

**Exact V2-eligible company count: 358.**

**Snapshot eligibility rule:** as printed above — European scope from
`countries.is_landscape_scope`, at least one sector in the `uav` or `counter-uas` subtree, at
least one of own website / product / non-directory source URL, and a working-edition status
outside `excluded` and `needs_review`. Article links do not verify.

**Schema or migration work required immediately before freeze:** none mandatory. One
recommended line: record the eligibility rule text in the snapshot's `scope` jsonb at freeze
time, so V2 carries the rule that produced it alongside the country list it already stores.
