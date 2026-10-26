# European UAV & Counter-UAS — Batch 03 reconciliation

2026-10-26. 40 external research findings reconciled into the live database.
**V1 (273) and V2 (358) unchanged. No V3.**

## 1. Executive result

| | |
|---|---:|
| Findings processed | **40** |
| Verified before | **418** |
| Verified after | **432** |
| **Net change** | **+14** |
| New companies created | **0** |

| Outcome | Count |
|---|---:|
| EXISTING_UPDATED | 12 |
| EXCLUDED | 9 |
| REMAINS_CANDIDATE | 9 |
| COUNTRY_CORRECTED | 3 |
| NEEDS_REVIEW | 3 |
| PRODUCT_CORRECTED | 2 |
| ENTITY_RESOLVED | 1 |
| OUT_OF_SCOPE | 1 |

**This batch was mostly rejection, and that is the correct outcome.** Only 14 of 40 were
admitted, against 31 in Batch 01 and 29 in Batch 02. P1 was already empty when Batch 03 was
drawn, so the queue was working through weaker signals — and the research confirmed that most of
them are weak for a reason.

## 2. Before anything else: the input file needed repair

19 of the 40 rows were **field-shifted**. Unescaped commas inside `research_summary` and
`research_notes` pushed later columns right, so a naive read attributed the *wrong evidence URL*
to a company — for example Beker & Co's summary text landed in the evidence column.

Rows were repaired by anchoring on the field that begins with `http`: everything before it is
summary, everything after is notes. All 40 rows reconstructed cleanly; the four with no evidence
URL (BeetechUA, Bulba, MP-SEC, EuroSpike) are genuinely evidence-free KEEP_REVIEW cases.

**For future batches: quote CSV fields containing commas.** No data was lost, but reading the
file as-is would have attached evidence to the wrong companies.

## 3. Country corrections

| Company | From | To | Basis |
|---|---|---|---|
| Frost Unmanned | France | **Sweden** | Official material; Tracer-160 is a Swedish fixed-wing UAS. In scope either way. |
| Vatn Systems | Norway | **United States** | Autonomous *underwater* vehicles for US customers. **Leaves scope.** |
| Odin Defence | Lithuania | **Estonia** | Estonian explosives manufacturer. In scope either way. |
| Thor Industries | Estonia | **United Kingdom** | UK parent of Odin Defence. In scope either way. |

The last two are a matched pair the research file did not flag as such: **the parent and the
subsidiary had each other's countries.** Thor (the UK parent) was recorded in Estonia, and Odin
(the Estonian subsidiary) in Lithuania.

## 4. Entity resolutions

**Bluebird Ukraine → BlueBird Tech — merged.** Both records existed as separate Ukrainian
candidates. Official evidence identifies BlueBird Tech LLC as the real entity; the records were
merged and `/companies/bluebird-ukraine/` now redirects. Note the registry also holds **Bluebird
Aero Systems (Israel)**, which is a different company and was left alone.

**Thor Industries / Odin Defence / RSI Europe — a three-way product error.** Thor Industries held
**Shpak**, which is RSI Europe's Vilnius-built FPV drone. Shpak was moved to RSI Europe, Thor
keeps no capability of its own, and `subsidiary_of` was recorded between Odin and Thor.

**Kraken — entity error.** The queued **K4 MANTA** belongs to Kraken Technology Group (maritime,
excluded in Batch 02) and was moved there. This generic "Kraken" record has no capability, and
its recorded website `krakenrobotics.com` belongs to the *Canadian* Kraken Robotics. Moved to
`needs_review`: it is unclear what entity it represents at all.

**Leonardo, Bofors, Ascending Technologies — three held back to avoid double-counting or
guessing.** Bofors is a brand inside BAE Systems, which is already verified. Ascending
Technologies was acquired by Intel in 2016 and is a policy question, not an evidence one.

**Thales Nederland — capability real, leaf withheld.** It is a genuine Dutch operating subsidiary
and `division_of Thales` was recorded. But **Thales and Aveillant (Thales) already carry
`cuas-det-radar`**, and the Dutch MoD evidence covers radar production generally, not drone
detection. A third Thales radar record would count the same capability three times.

## 5. Product ownership and domain corrections — 14 in total

| Product | Was | Now | Why |
|---|---|---|---|
| Shpak | Thor Industries | **RSI Europe** | Vilnius-built FPV drone. |
| K4 MANTA | Kraken | **Kraken Technology Group**, UAV → Other | Maritime platform. |
| Stalker VXE30 | Inzpire | **removed** | Edge Autonomy builds it; Inzpire trains crews on it. |
| Pioneer | UAV | Other | Uncrewed **surface** vessel. |
| Sea Lancer, Sea Sabre | UAV | Other | Anti-submarine **USV** design programme. |
| Flying USV | UAV | Other | Maritime, despite the name. |
| Seaquest S | UAV | Other | Uncrewed **surface** vehicle. |
| Skelmir S12 | UAV | Other | Autonomous **underwater** vehicle. |
| TEC800 | UAV | Other | Teleoperated **ground** robot. |
| SQ DDS, SQ PDDS, SQ UDS | UAV | Other | **Sonar** products. |
| DA 15-N.ISS | UAV | Other | Flight-control **actuator**, not an aircraft. |
| PD170, TF6000 | Effector | Other | UAV **engines**, not effectors. |
| HSWL 076 | Effector | Other | Land-vehicle **transmission**. |
| Evica PinPoint Searchlight | Counter-UAS | Sensor | Third-party component inside DroneShield's system. |

Nine of these were catalogued as UAV while being maritime, ground or a component. The
`LIKELY_NON_AERIAL` hint added after Batch 02 kept them out of Batch 04's picks, but they were
already inside Batch 03 when it was drawn.

## 6. Taxonomy

**27 explicit assignments** across 14 companies — 6 C-UAS leaves, 20 in the UAV tree, 1 evidenced
broad-only. **2 removed** (archived directory-only `uav` parents).

Cut back from what was recommended:

- **POLARIS Spaceplanes** was recommended `cuas-def-kinetic`. COBRA carries and launches **IRIS-T,
  which is Diehl's missile**. POLARIS builds the carrier aircraft, so it received `fixed-wing-uav`
  plus **evidenced broad-only `counter-uas`** — the same treatment KBP International got in
  Batch 01 for exactly this pattern. `partner` link to Diehl recorded.
- **Optoelectronica-2001** integrates D-Fend and Skylock products; it received `cuas-integrated`
  and `eco-integration`, not the partners' RF modalities.
- **Sentiq Defence** integrates partner aerial platforms: `eco-integration` only.
- **Inzpire** trains British Army crews: `eco-integration` only, and the Stalker product removed.
- **SVANTEK** was the closest call. An acoustic-analyser maker whose *own 2026 release* says its
  technology is applied in a defence project including acoustic drone detection. NL Acoustics was
  excluded twice on a weaker version of this, with no company statement tying it to drone
  detection. SVANTEK has that statement, so it was admitted as a **technology contributor** with
  `cuas-det-acoustic` and the limitation written into the assignment note.

## 7. Companies not admitted

Nine excluded: **Beker & Co** (consultancy), **ACUA Ocean**, **Dutch Naval Design**, **Keys4sea**,
**SIREHNA** (all maritime), **Angatec**, **RENK** (ground), **Vatn Systems** (US + underwater),
**CN Romtehnica** (state procurement intermediary — MEROPS is Perennial Autonomy's and the
SHORAD/VSHORAD systems are Rafael's), **Ørsted** (the offshore-wind *customer* of drone services,
not a supplier).

Nine remain candidates, including **BeetechUA, Bulba and Celebra LLC** — Ukrainian directory
records where no authoritative source was found. They are deprioritised in the Ukraine queue
rather than re-researched immediately.

## 8. Landscape after Batch 03

| | Before | After |
|---|---:|---:|
| European-scope universe | 997 | **995** |
| Verified | 418 | **432** |
| — UAV only | 221 | **229** |
| — C-UAS only | 175 | **178** |
| — both | 22 | **25** |
| Classified-but-unverified | 50 | **47** |
| Unclassified | 493 | **468** |
| needs_review | 21 | **24** |
| Excluded | 20 | **30** (6 outside scope) |

432 + 47 + 468 + 24 + 24 in-scope excluded = **995**. Reconciles. The universe fell by two:
Vatn Systems left the scope and Bluebird Ukraine was merged away.

Countries gaining verified companies: Germany +2, Italy +2, Poland +2, Sweden +2, United
Kingdom +2, and one each for Lithuania, Romania, Turkey and Ukraine.

**Publication: zero changes.** The 14 newly verified split 13 live / 1 draft.

## 9. QA

| Check | Result |
|---|---|
| V1 / V2 | 273 / 358 ✓ unchanged |
| All 40 rows accounted for exactly once | ✓ |
| New duplicate companies | 0 ✓ |
| Out-of-scope company verified | 0 ✓ |
| Maritime/ground/crewed product left in a UAV category | 0 ✓ |
| Company verified on directory evidence alone | 0 ✓ |
| Verified companies failing the eligibility rule | 0 ✓ |
| Publication statuses changed | 0 ✓ |
| Redundant **unevidenced** structural parents | 0 ✓ |
| New redundant parents from Batch 03 | 0 ✓ |
| Integrated system exploded into component leaves | none ✓ |
| Group parent inheriting subsidiary capability | none — Thales, Bofors, Thor all held back ✓ |
| Shpak owner / K4 MANTA owner | RSI Europe / Kraken Technology Group ✓ |
| Bluebird Ukraine record removed after merge | ✓ (slug redirect in place) |
| Batch 04: size / verified / excluded / recycled / duplicate ids | 40 / 0 / 0 / 0 / 0 ✓ |
| Test suite | 21/21 pass ✓ |

## 10. Batch 04 — and a recommendation

`research-agent/queue/batch-04.csv` — 40 cases, **20 countries**, scored from the updated
database. 5 classified-but-unverified (the Ukraine cap), 35 unclassified, no recycled cases, no
`LIKELY_NON_AERIAL` records.

**The queue is running out of strong signal.** P1 has been empty for two batches and the top
score is now **39** (it was 87 at Batch 01). The remaining 515 candidates are P2 53 · P3 18 ·
P4 444, and **all 47 remaining classified-but-unverified are Ukrainian directory-only records**,
now held in `queue/ukraine-directory-verification-queue.csv` (42 rows after Batch 04's five).

Batch 03 returned 14 admissions from 40; Batch 04 is drawn from weaker signal still, so expect
fewer. **Two suggestions for after Batch 04:**

1. **Run the Ukraine directory pass as its own batch.** 42 near-identical cases, each needing one
   registry lookup. That is a far better use of research effort than five per batch.
2. **Consider a bulk enrichment pass instead of more research batches.** 444 of 515 remaining
   candidates are P4, mostly because they have no description, website or products for the model
   to score. Filling those fields would re-rank them for free and may surface companies the
   current queue cannot see.

## 11. Outputs

| File | Rows |
|---|---:|
| `research-agent/reconciled/batch-03-reconciliation.csv` | 40 |
| `research-agent/queue/batch-04.csv` | 40 |
| `research-agent/queue/ukraine-directory-verification-queue.csv` | 42 |
| `data/research/europe-uav-coverage-research-queue-post-batch-03.csv` | 515 |
