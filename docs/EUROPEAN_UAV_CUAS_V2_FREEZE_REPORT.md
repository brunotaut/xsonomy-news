# European UAV & Counter-UAS Landscape — V2 freeze

2026-10-26.

---

## Snapshot created

| | |
|---|---|
| Snapshot ID | `02bce196-1aad-4934-b9cd-925223f9df50` |
| Slug | **`europe-uav-cuas-2026-v2`** |
| Title | European UAV & Counter-UAS Landscape 2026 — V2 |
| `taken_at` | 2026-10-26 13:26:37 UTC |
| `published_at` | 2026-10-26 13:26:37 UTC |
| **Entries** | **358** |

### Pre-freeze guard

Rerun immediately before creation, against live state:

| | Required | Actual |
|---|---|---|
| Eligible by rule | 358 | **358** |
| Working edition `included` | 358 | **358** |
| Mismatch | 0 | **0** |
| European universe | 1,002 | **1,002** |

Nothing had moved between the final audit and the freeze. V1 was verified first: present,
273 entries, untampered, and no V2 existed.

---

## Eligibility rule

Stored verbatim in `scope.eligibility_rule`, derived from the implementation
(`public.v_landscape_verified` plus the working-edition status filter):

```
  companies c JOIN countries co ON co.name = c.hq_country AND co.is_landscape_scope
  AND  tagged          := EXISTS (company_sectors row whose sector is in the
                                  'uav' OR 'counter-uas' subtree, resolved recursively)
  AND ( ev_website     := c.website IS NOT NULL
                          AND c.website !~* '(drone-directory|defencejobs|brave1\.gov|wikipedia
                                              |wikidata|linkedin|crunchbase|dealroom|defence-blog)'
      OR ev_product    := EXISTS (products p WHERE p.company_id = c.id)
      OR ev_source_url := EXISTS (a non-directory URL in c.source_urls)
                       OR EXISTS (a non-directory URL in any company_sectors.source_urls
                                  for that company)
      )
  AND  landscape_candidates.status NOT IN ('excluded','needs_review')
```

Explicitly **not** part of eligibility, and recorded as such in `scope`:

- **article-company links** — corroborating only, never sufficient alone
- **publication_status** — 114 of the 358 entries are draft
- **confidence** — never consistently maintained on legacy records
- **maturity** — optional enrichment

`scope` also stores the country list, the evidence policy (including the C-UAS leaf and
Integrated rules), the article-link policy, the verification view name, the source working
edition, and a note that `landscape_candidates.status` carries editorial decisions the rule
cannot derive — so membership is rule-plus-recorded-decisions, each with a screening note.

---

## Scope

**32 countries** from `countries.is_landscape_scope`. European-scope universe at freeze:
**1,002 companies**, of which 358 are in V2.

---

## V2 composition

| | Count |
|---|---|
| **Total entries** | **358** |
| UAV only | 183 |
| Counter-UAS only | 164 |
| Both | 11 |

Matches the audited live state exactly.

---

## Country distribution

| Country | Total | UAV only | C-UAS only | Both |
|---|---|---|---|---|
| Ukraine | 46 | 26 | 18 | 2 |
| United Kingdom | 43 | 17 | 24 | 2 |
| France | 42 | 21 | 20 | 1 |
| Poland | 34 | 20 | 13 | 1 |
| Germany | 25 | 6 | 18 | 1 |
| Denmark | 18 | 11 | 6 | 1 |
| Switzerland | 16 | 12 | 4 | 0 |
| Czech Republic | 15 | 6 | 9 | 0 |
| Norway | 12 | 8 | 4 | 0 |
| Estonia | 11 | 5 | 6 | 0 |
| Spain | 11 | 7 | 4 | 0 |
| Italy | 10 | 4 | 5 | 1 |
| Netherlands | 10 | 5 | 5 | 0 |
| Sweden | 9 | 2 | 7 | 0 |
| Belgium | 8 | 3 | 5 | 0 |
| Latvia | 6 | 4 | 2 | 0 |
| Romania | 6 | 2 | 4 | 0 |
| Turkey | 6 | 4 | 2 | 0 |
| Austria | 5 | 3 | 2 | 0 |
| Portugal | 5 | 4 | 0 | 1 |
| Bulgaria | 4 | 2 | 1 | 1 |
| Finland | 3 | 1 | 2 | 0 |
| Greece | 3 | 3 | 0 | 0 |
| Lithuania | 3 | 1 | 2 | 0 |
| Hungary | 2 | 1 | 1 | 0 |
| Slovenia | 2 | 2 | 0 | 0 |
| Croatia | 1 | 1 | 0 | 0 |
| Ireland | 1 | 1 | 0 | 0 |
| Slovakia | 1 | 1 | 0 | 0 |
| **Cyprus, Luxembourg, Malta** | **0** | 0 | 0 | 0 |

Every V2 company sits in a country with `is_landscape_scope = true` — verified, 0 exceptions.
Five countries hold 53% of the dataset; three in-scope countries hold nothing.

---

## UAV taxonomy distribution

| Summary | Companies |
|---|---|
| Root-only `uav` | **85** |
| Any platform leaf | 34 |
| Any mission leaf | 35 |
| Any ecosystem leaf | 68 |

| Platform | | Mission | | Ecosystem | |
|---|---|---|---|---|---|
| VTOL UAV | 12 | ISR / Reconnaissance | 12 | Autonomy / AI | 20 |
| Fixed-wing UAV | 10 | Logistics / Cargo | 8 | Payloads | 12 |
| Multirotor UAV | 10 | FPV | 6 | Flight Software | 8 |
| Loitering Munition | 6 | Strike UAV | 4 | Integration | 8 |
| Heavy-Lift UAV | 3 | Mapping / Survey | 3 | Components | 8 |
| | | Industrial / Commercial | 3 | Communications / Datalink | 7 |
| | | Inspection | 2 | Navigation / GNSS | 6 |
| | | | | Launch / Recovery | 6 |
| | | | | Sensors | 5 |
| | | | | Ground Control | 5 |
| | | | | UTM / Traffic Management | 3 |
| | | | | Propulsion | 0 |

---

## C-UAS taxonomy distribution — all 13 leaves

| Group | Capability | Companies |
|---|---|---|
| **Detection** | RF Detection | 33 |
| | Radar | 33 |
| | EO/IR | 21 |
| | Acoustic Detection | 18 |
| **Track / Identify** | Sensor Fusion | 14 |
| | AI / Computer Vision | 17 |
| | Command & Control | 24 |
| **Defeat** | RF Jamming | 28 |
| | GNSS Jamming / Spoofing | 4 |
| | Interceptor UAV | **42** |
| | Kinetic | 30 |
| | Directed Energy | 10 |
| **Integrated** | Integrated / Multi-Layer C-UAS | 23 |

| | Count |
|---|---|
| Legitimate broad-only C-UAS companies | **2** — AegisX, Phantom Defense |
| Unsupported broad-only | **0** ✓ |

Interceptor UAV is the largest single capability at 42, ahead of RF Detection and Radar at 33.
GNSS jamming/spoofing at 4 remains conspicuously thin next to RF jamming at 28 — more likely
under-tagging than market shape, and a candidate for post-V2 work.

---

## Maturity distribution

| Level | Companies |
|---|---|
| 1 Emerging | 1 |
| 2 Demonstrated | 5 |
| 3 Commercial | 15 |
| 4 Deployed | 3 |
| 5 Scaled | 0 |
| **Unassessed** | **334** |

93% unassessed. Maturity was never a membership condition and was not touched during freeze.

---

## Publication distribution

| | Companies |
|---|---|
| Live | 244 |
| Draft | 114 |
| Other | 0 |

Nearly a third of V2 is unpublished. That is by design: verification and publication are
separate decisions, and publication status is not part of eligibility.

---

## V1 → V2

| | Count |
|---|---|
| V1 entries | 273 |
| V2 entries | 358 |
| Present in both | **254** |
| Added in V2 | **104** |
| Removed from V2 | **19** |
| Net change | **+85** |

Reasons for the 19 removals:

| Reason | Count |
|---|---|
| Unsupported classification | 8 |
| Needs review | 6 |
| Excluded (non-aerial or duplicate) | 3 |
| Outside scope | 2 |

The two "outside scope" removals are **Teledyne FLIR Defense** (recorded as Norway, actually
the US business) and **AIM Defence** (recorded as United Kingdom, actually Australian). Both
were frozen into V1 before their countries were corrected. V1 was not modified to hide this —
the diff is the honest record of it.

Full per-company detail: `data/research/europe-uav-v1-v2-membership-diff.csv` (377 rows).

---

## Accounting at freeze

| State | Count |
|---|---|
| **V2 verified** | **358** |
| Classified but unverified | 74 |
| Needs review | 18 |
| Excluded | 10 |
| Unclassified | 542 |
| In scope but absent from the edition | 0 |
| **Total** | **1,002** ✓ |

Unclassified reads 542 rather than the 539 quoted in the brief: the final audit added three
companies the nightly pipeline had created and left outside the working edition. The universe
total is unchanged at 1,002 and the accounting reconciles exactly.

---

## QA

| # | Check | Result |
|---|---|---|
| Q1 | V1 count = 273 | **PASS** |
| Q2 | V2 count = 358 | **PASS** |
| Q3 | V1 tampered | **PASS** (0) |
| Q4 | V2 duplicate entries | **PASS** (0) |
| Q5 | V2 companies outside scope | **PASS** (0) |
| Q6 | V2 excluded companies | **PASS** (0) |
| Q7 | V2 needs_review companies | **PASS** (0) |
| Q8 | V2 entries with no UAV/C-UAS taxonomy | **PASS** (0) |
| Q9 | V2 product-not-company | **PASS** (0) |
| Q10 | V2 unresolved entity conflations | **PASS** (0) |
| Q11 | V2 unsupported standalone broad C-UAS | **PASS** (0) |
| Q12 | V2 specific C-UAS assignments without evidence | **PASS** (0) |
| Q13 | Invalid company-sector-product links | **PASS** (0) |
| Q14 | Orphan taxonomy | **PASS** (0) |
| Q15 | Self relationships | **PASS** (0) |
| Q16 | False article links affecting V2 companies | **PASS** (0) |
| Q17 | Article-only verification in V2 | **PASS** (0) |
| Q18 | V2 entry company_ids unique | **PASS** |
| Q19 | Eligibility metadata stored in `scope` | **PASS** |
| Q20 | Snapshots present | v1, v2 |
| — | Article-link regression tests | **13/13 pass** |
| — | Full automated test suite | **13 tests, 13 pass, 0 fail** |

### Immutability

Four tamper attempts were made against the live V2 snapshot — update entries, delete entries,
change the snapshot slug, delete the snapshot. **All four were rejected by the triggers.**
Afterwards: 358 entries intact, 0 tampered rows, slug unchanged, V1 still 273. No test
mutation was left committed.

---

## Known post-V2 debt

Carried forward, not fixed:

- **47 UAV-side assignments without evidence URLs** — the UAV branch has not had the treatment the C-UAS side received.
- **85 root-only UAV companies** — UAV relevance evidenced, no narrower leaf.
- **156 C-UAS leaves citing a company homepage** rather than a specific product page — tier-1 evidence, but coarse.
- **968 orphan products** across the catalogue.
- **Mid-level C-UAS parents are stored rows, not derived** — 90 structural rows in V2. This is what made my own earlier "111 unevidenced leaves" count misleading, and deriving them at read time would prevent a repeat.
- **Parent/subsidiary editorial policy** — 7 shared-domain pairs in V2; whether an entry is a group or a legal entity is undecided.
- **Snapshot per-assignment evidence** — entries store the company-level union of source URLs, so which leaf a given URL supports is not recoverable from the snapshot alone.
- **542 unclassified and 74 classified-but-unverified** companies — the discovery backlog.
- **GNSS jamming/spoofing at 4** — probably under-tagged.
- **Maturity unassessed for 334 of 358.**

## Next recommended work

1. **Derive mid-level taxonomy parents at read time** instead of storing them. Cheapest fix with the widest effect on measurement honesty.
2. **UAV-side provenance pass** — mirror the C-UAS audit over the 47 unevidenced assignments.
3. **Per-assignment evidence in snapshot entries** before V3, so a frozen Landscape can justify each capability on its own.
4. **Work the 542-company unclassified backlog** with the targeted-evidence process that worked for the 31-case pack.
5. **Settle the parent/subsidiary policy** before it compounds.
6. Decide whether the 18 needs-review cases are resolvable or should be formally closed.

---

EUROPEAN UAV & COUNTER-UAS DATASET V2: FROZEN
