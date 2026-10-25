# European UAV & Counter-UAS Landscape — pre-V2 data integrity sprint

2026-10-25. `europe-uav-cuas-2026-v1` is unchanged (273 entries, untampered) and **no V2 was
created** — it remains the only snapshot. All work is in live tables, the working edition
`europe-uav-cuas-2026`, and the ingestion code.

---

## Executive result

Both blockers are closed. The linker that manufactured false evidence is fixed **at source**
with regression tests, and the Integrated C-UAS category has been audited end to end — it
shrank from 76 assignments to 27, because most of it was inferred rather than evidenced.

The verified landscape fell from 347 to **343**. Four companies lost verification because
`cuas-integrated` was their only C-UAS classification and it was not evidenced. That is the
intended outcome, not a regression.

| | Before | After |
|---|---|---|
| European-scope companies | 975 | 975 |
| **Verified working landscape** | 347 | **343** |
| UAV only | 156 | 157 |
| C-UAS only | 178 | 174 |
| both UAV + C-UAS | 13 | 12 |
| root-only UAV | 84 | 84 |
| root-only C-UAS | 0 | 1 |
| Unclassified | 531 | 535 |
| Unresolved | 75 | 75 |
| Needs review | 13 | 13 |
| Excluded | 9 | 9 |
| `cuas-integrated` assignments | 76 | **27** |
| V1 snapshot entries | 273 | **273** |

---

## Article linker

### What it was doing

`scripts/resolve-entities.mjs` runs after ingestion, reading `articles.companies` — the names
an LLM extracted from each article — and resolving each tag through `matchCompany()` in
`scripts/lib/resolve.mjs`. Matching was exact name → suffix-normalised name → token prefix →
bigram fuzzy. **No country, domain, product or context was considered**, and every match was
treated as equally certain.

Two defects produced the production failures:

1. **A short name matched on string identity alone.** The tag `EOS`, extracted correctly from
   articles about Australia's EOS Defence Systems, hit `exact` against a Ukrainian directory
   record called EOS. The extractor was not wrong — two real companies share a three-letter
   name.
2. **`tag_resolutions` cached the decision and was only invalidated when the *entity* was
   deleted.** Deleting the junction rows did nothing, so the next run replayed
   `eos → that company` instantly. **This is why the links deleted on 2026-10-24 were back
   within a day.**

### What changed

`scripts/lib/resolve.mjs`
- `isAmbiguousName()` — a tag is ambiguous when its compacted form is ≤6 characters or it is a
  single ordinary English word (`sky`, `vector`, `verity`, `rift`, …).
- `corroboration()` — looks for signals independent of the name itself: the company's domain
  in the text, one of its products in the article's product tags, its country, a legal suffix
  on the tag, or the record being *established* (own website **and** products).
- `gate()` — assigns `high` / `medium` and **refuses an ambiguous tag with no corroboration**.

`scripts/resolve-entities.mjs`
- passes article context (title, summary, URL, product tags) into the matcher;
- writes the existing, previously unused `article_companies.confidence` and `mention_type`
  columns rather than inventing new schema;
- caches an uncorroborated ambiguous tag as a **refusal**, so it is not retried per article;
- **drops cached ambiguous-name matches on load**, so a corrected decision sticks and a
  deleted false link cannot be resurrected.

Two design points worth stating, because both were found by the tests rather than by reasoning:

- **The domain signal was circular.** For `Sol.One` at `sol.one`, finding the domain in the
  text proves nothing the name had not already claimed. It is suppressed when the host is
  exactly the name, and kept when the host adds information (`MDSI` at `mdsi.dk`).
- **A blunt length rule destroyed good links.** An early version refused `Boeing`, `Thales`,
  `Airbus` and `Diehl` — all ≤6 characters and all unambiguous. The *established* signal
  resolves this: a record with a website and a product catalogue may carry its short name
  alone; a bare directory record may not. That is precisely the difference between `DJI` and
  the Ukrainian `EOS`.

### Links audited

**8,996** article-company links scored against each article's own extractor output.

| Status | Links | On verified companies |
|---|---|---|
| VALID — named exactly or by alias | 7,825 | 1,450 |
| PROBABLE — corporate-form variant | 996 | 116 |
| AMBIGUOUS | 175 | 16 |
| **FALSE_MATCH** | **4** | 0 |

**4 false links removed:** AIDC and NCSIST (acronyms absent from Taiwanese articles) and
Suzuyo ×2 (`Suzu` matching `Suzuki`). All four were non-European and none affected
verification.

The 16 AMBIGUOUS links on verified companies were read individually: all are corporate-form
variants already validated on 2026-10-25 (Airbus Defence & Space, Diehl Defense, Kongsberg
Gruppen, MARSS Systems Limited, MSI Defense Systems, senseFly/AgEagle, Baykar/Bayraktar,
EVPÚ, Alta Arès, Nammo Defense Systems). They were kept — the brief is explicit that a short
name is not itself grounds for removal.

All 8,996 links now carry a confidence and a `mention_type`.

### Regression tests

`scripts/test/resolve-linking.test.mjs`, wired to `npm test`. **13 tests, 13 passing.**

Covering: the EOS false positive; the UP Innovations false positive; a short acronym with
product context (links, medium); the same acronym without context (refused); alias match;
exact long name; a name shared across countries; a product named without its company; the
established-vs-directory collision (`DJI` links, `EOS` does not); short primes `Thales`,
`Boeing`, `Diehl` still linking; and the refusal being cacheable so a deleted link does not
reappear.

---

## Integrated C-UAS

Audited all **76** assignments, not only the 35 without URLs.

| Outcome | Count |
|---|---|
| CONFIRMED_INTEGRATED — evidence URL already attached | 19 |
| EVIDENCE_FOUND — backfilled | 7 |
| INCORRECT_INFERENCE — inferred from several capabilities | 26 |
| INSUFFICIENT_EVIDENCE | 23 |
| NEEDS_REVIEW — plausible but unstated | 1 |
| **Remaining after audit** | **27** |

**Backfilled (7):** Anduril, BAE Systems, DroneShield, Fortem Technologies, Lockheed Martin,
MBDA, Thales — each from an article that *both* names the company and describes an integrated
or multi-layer counter-UAS system. An earlier, looser query also offered IAI ELTA and Ondas on
articles that merely mentioned them; the requirement that the article name the company was
added precisely because Thales's first candidate was a Lockheed Martin story.

**Removed (49).** Capability leaves were left untouched: Saab, Leonardo, Hensoldt, Rheinmetall
and the rest keep Radar, RF Detection, C2, Jamming and Interceptor where those are
independently evidenced. They lost only the claim that they sell an integrated system, which
nothing in the database actually stated.

**Held (1):** Teledyne FLIR Defense — two detection leaves plus C-UAS products make an
integrated system plausible, but no source says so.

One honest limitation: `CONFIRMED_INTEGRATED` means an evidence URL is attached, not that the
page was re-read. Nineteen URLs were not individually re-verified in this pass.

---

## Verification

**347 → 343.** Four companies left the verified subset, all for the same reason —
`cuas-integrated` was their only C-UAS classification and it was unevidenced:

- Elettronica (ELT Group), Italy
- DefSecIntel Solutions, Estonia
- Hertz Systems, Poland
- Qognifly, Romania

None lost verification because of the link cleanup: **0 companies were verified by article
evidence alone**, before or after.

---

## Research queue — HIGH findings missing evidence URLs

`data/research/europe-uav-high-missing-evidence-urls.csv` — **31 rows**.

| Priority | Count |
|---|---|
| P1 — likely meaningful missing European company | 17 |
| P2 — likely existing entity needing evidence/update | 9 |
| P3 — entity/country ambiguity | 5 |
| P4 — weak or questionable relevance | 0 |

No company was created, no taxonomy assigned, and no URL inferred from a research note.

---

## Other provenance issues

`data/research/taxonomy-provenance-integrity-summary.csv`

| Severity | Assignments |
|---|---|
| BLOCKER | **0** |
| SHOULD_FIX_BEFORE_V2 | **111** — C-UAS leaves on verified companies with no evidence URL |
| POST_V2_CLEANUP | **113** — UAV-side assignments with no evidence URL |
| OK | 526 |

No LLM-assigned taxonomy without evidence survives, so there is no blocker here. The 111
unevidenced C-UAS leaves are the same legacy class the Integrated audit addressed, one level
down: real capabilities recorded before provenance was enforced. They are a quality debt, not
a correctness defect, and they are listed so the next evidence pass can target them.

---

## Current landscape

**343 verified** — 157 UAV only, 174 C-UAS only, 12 both. 84 carry only the bare `uav` root
and 1 only the C-UAS root. 535 unclassified, 75 unresolved, 13 needs-review, 9 excluded,
within 975 European-scope companies.

Regenerated backlogs:
- `data/research/europe-uav-unclassified-post-integrity.csv` — **535** (326 HIGH, 56 MEDIUM, 153 LOW)
- `data/research/europe-uav-unresolved-post-integrity.csv` — **88**

---

## QA

| Check | Result |
|---|---|
| V1 snapshot unchanged, 273 entries | **PASS** |
| V1 tampered rows | **PASS** (0) |
| No V2 created | **PASS** — `europe-uav-cuas-2026-v1` is the only snapshot |
| Duplicate normalised company names | **PASS** (0) |
| Self relationships | **PASS** (0) |
| Orphan taxonomy | **PASS** (0) |
| Invalid product ownership in `company_sector_products` | **PASS** (0) |
| False article links remaining | **PASS** (0) |
| High-risk article-link matches | **PASS** — 175 ambiguous, reviewed, none false |
| Unevidenced new taxonomy | **PASS** (0 created this pass) |
| `cuas-integrated` without evidence | **PASS** — 1, the flagged NEEDS_REVIEW case |
| Manual Multi-Sensor Detection | **PASS** (0) |
| Verified companies outside landscape scope | **PASS** (0) |
| Article-only verification | **PASS** (0) |
| New companies accidentally published | **PASS** (0) |
| Links carrying confidence/mention_type | **PASS** (8,996) |

### Does the fix stop deleted false matches reappearing?

**Yes, and by two independent mechanisms.** The cached `eos` / `up` decisions were deleted, and
the loader now discards any cached *match* on an ambiguous company name so the gate re-decides
every run. Even if a cache row returned, `matchCompany("EOS", …)` on an uncorroborated article
now returns `null` — asserted by two regression tests. A bare directory record can no longer
win a name collision against the company the article is actually about.

---

READY FOR EXTERNAL EVIDENCE PASS
