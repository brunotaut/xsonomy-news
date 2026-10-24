# European UAV & Counter-UAS Landscape — research reconciliation and correction pass

2026-10-24. Source workbook: `europe-uav-research-consolidated-claude-ready.xlsx`
(589 screened rows, 56 INCLUDE-family, 3 EXCLUDE-family, 4 entity/country/product reviews,
526 still REVIEW, 17 External Gap candidates).

**The frozen snapshot `europe-uav-cuas-2026-v1` was not modified.** All 273 entries are intact
and byte-identical; the immutability triggers were not bypassed. Every change in this pass went
to the live tables and the mutable working edition `europe-uav-cuas-2026`.

Geographic scope came from `countries.is_landscape_scope` throughout. No hard-coded list.

---

## 1. Headline

| | Before | After |
|---|---|---|
| Verified European companies (working edition) | 273 | **330** |
| Classified but directory-only | 76 | 75 |
| Identity / scope review | 5 | 12 |
| Excluded from the aerial Landscape | 1 | 4 |
| Unclassified European companies | 589 | **529** |

Net **+57 verified**. Companies created: **5**. Companies merged away: **3**.

**The 526 REVIEW rows were not touched.** They remain unclassified research backlog, as the
workbook's caveat requires. Screened is not verified.

---

## 2. The INCLUDE rows were not an import list

All 56 INCLUDE rows already carried a `company_id` and all 56 resolved to existing UAV360
records. **No company needed creating.** The work was classification — and reconciliation found
four entity problems the workbook had treated as ordinary classification rows. Had these been
applied as written, four records would have been wrong.

### Squarehead was a duplicate

The workbook asked to classify **Squarehead** (Denmark) as acoustic C-UAS, citing `sqhead.com`.
That domain belongs to **Squarehead Technology** (Norway) — already in the database, already
tagged `cuas-det-acoustic`, already owning *Discovair G2+*. The Danish record held the same
product under the generic name *Discovair*.

→ Merged into Squarehead Technology. Alias and redirect preserved. A third, ownerless
*Discovair array G2+* product was adopted at the same time.

### "Oerlikon" was the wrong company

The workbook asked to classify **Oerlikon** as kinetic C-UAS, citing `rheinmetall.com`. Our
Oerlikon record held *AHEAD* and *GDF-006* — genuine Rheinmetall Air Defence products — but its
website was `oerlikon.com`, which is **OC Oerlikon, an unrelated surface-solutions company with
no counter-drone role whatsoever**. Classifying that record would have tagged the wrong company.

→ Merged into **Rheinmetall Air Defence** (ex-Oerlikon Contraves), which is where AHEAD and
GDF-006 belong. The incorrect website is gone; "Oerlikon" survives as an alias, which is
accurate for the product branding.

### Euroflir is a product, not a company

French MoD evidence identifies EUROFLIR 410 as the EO/IR pod on the Patroller UAV. The product
already existed under Safran Electronics & Defense; the company record was a duplicate of its
own maker.

→ Merged into Safran Electronics & Defense.

### MBDA France is an empty shell

The SKY WARDEN evidence describes the MBDA group, and our **MBDA** record already carries
`cuas-integrated`. **MBDA France** had no products and no website. Classifying it would have
created a second Landscape row for one capability.

→ Linked `subsidiary_of` MBDA; the evidence went on the parent. Same treatment for Safran
Electronics & Defense → Safran, except there the subsidiary is the genuine maker of Skyjacker
and was classified.

---

## 3. Country corrections

Both verified against independent sources, not taken from the workbook.

| Company | Was | Now | Evidence |
|---|---|---|---|
| **General Cherry** | Croatia | **Ukraine** | Its own site and Kyiv Post describe a Ukrainian manufacturer; Croatia is where its partner Orqa manufactures. |
| **Orqa** | Estonia | **Croatia** | Headquartered in Osijek. The Estonian value came from coverage of a trial of a payload that was not even Orqa's. |

### A paired product misattribution

The Sky Spy / Orqa demonstration put a Sky Spy SIGINT payload on an Orqa FPV airframe, and the
database had **both products filed under the wrong partner**:

- *SkyAgent 001* was under Orqa → moved to **Sky Spy**
- *MRM2-10* was under Sky Spy → moved to **Orqa**

Three further ownerless products were attributed: *Bullet* → General Cherry, *IRYDA Plus* and
*IRYDA+ X1* → MBF Group (which already owned *IRYDA+ SPACE Z1*).

---

## 4. Classifications applied

**51 companies, 128 sector assignments**, each carrying its own evidence URL, confidence,
assignment date and provenance. Zero assignments without a source URL.

Confidence follows the evidence hierarchy rather than the workbook's column: `high` for a
company's own site, a government or procurement source, or Janes; `medium` for credible
industry coverage.

The mission layer, which was **completely empty in V1**, is now populated:

| Layer | Assignments |
|---|---|
| UAV root | 46 |
| Platform (fixed-wing 6, VTOL 5, multirotor 2, loitering munition 2, heavy-lift 1) | 16 |
| Mission (ISR 4, logistics 4, industrial 3, FPV 2, mapping 2, inspection 1, strike 1) | 17 |
| Ecosystem (payloads 6, autonomy 5, integration 4, sensors 4, flight software 3, navigation 3, components 2, UTM 2, datalink 1, ground control 1, launch/recovery 1) | 32 |
| C-UAS (interceptor 4, kinetic 3, RF detection 3, C2 2, RF jamming 2, radar 2, detection 2, integrated 2, GNSS 1, acoustic 1, EO/IR 1, AI/CV 1) | 24 |

**`cuas-integrated` was assigned exactly twice** — FN Herstal and John Cockerill — in both cases
because the source describes a complete system (sensors plus effectors plus fire control), never
inferred from a company owning several C-UAS products. Multi-sensor detection was not assigned
by hand; it derives from two or more detection leaves.

### Three INCLUDE rows were refused

| Company | Why |
|---|---|
| **Gamaya** | UAV relevance rests on a homepage and a third-party industry map. No source establishes an explicit UAV role. |
| **Leica Geosystems (Hexagon)** | Its recorded products (TerrainMapper, CoastalMapper, CityMapper) are airborne mapping sensors flown mainly on **crewed** aircraft. No source establishes UAV relevance. |
| **Shark Aviation Dynamics** | The workbook's IRYDA+ X1 evidence belongs to **MBF Group** (Poland), which already owns that product. The record also carries a `.com.tr` domain against a `.pl` research domain. Country left unchanged. |

These are exactly the "generic technology vendor whose products could theoretically be used on
drones" case the brief warns against. All three are flagged `needs_review`.

---

## 5. Exclusions

All three verified for an aerial division before excluding. None was deleted; each remains in
UAV360, which covers unmanned systems more broadly than this Landscape.

| Company | Country | Reason |
|---|---|---|
| **DOK-ING** | Croatia | Unmanned ground vehicles and robotic demining. Only product is the Komodo UGV. |
| **Copenhagen Global** | Denmark | Orca unmanned surface vessel. Maritime. |
| **Splatica** | Bulgaria | 3D reconstruction software; drone capture is one input among several. |

---

## 6. Entity / country / product reviews

| Company | Outcome |
|---|---|
| **AerialMetric** | `needs_review`. UAV relevance is clear, but the evidence places the operating company in Madagascar while the record says France. |
| **Euroflir** | Resolved — merged into Safran Electronics & Defense (§2). |
| **Hemeria** | `needs_review`. The French MoD attributes the Heliblade demonstrator to **X721**, not Hemeria. The product-to-company mapping must be settled first. |
| **ELDIS Pardubice** | `needs_review`. Official evidence covers air-traffic-control and surveillance radar. Adjacent to C-UAS, but no source ties it to counter-UAS. Left unclassified. |

---

## 7. External Gap — 17 candidates cross-checked

Checked against companies, aliases, products, article mappings, domains and relationships.
**The assumption that these were missing was wrong for 10 of 17.**

### ALREADY COVERED — 6, and already verified in Dataset V1

ALTA ARES, Frankenburg Technologies, INLEAP Photonics, Tytan Technologies, Valkyr Defense
Systems, and **MARSS** (held as *MARSS Group*). All six already carry C-UAS classifications.

### ALREADY PRESENT but unclassified — 4

| Candidate | In database as | Outcome |
|---|---|---|
| **Cambridge Aerospace** | Cambridge Aerospace (UK), products *Skyhammer* / *Starhammer*, 7 articles | **Classified** `cuas-def-interceptor` on UK MoD interceptor-contract evidence |
| **Molfar Defence** | *Molfar Defence Technologies* (**Ukraine**, not Poland) | `needs_review` — country conflict, aggregator evidence only |
| **Drone Band** | Drone Band (UK), draft, directory-only | Already in the unresolved queue; unchanged |
| **Ground A** | Ground A (**United States**, not Germany) | `needs_review` — country conflict, and its single linked article is about Quantum Systems |

### TRUE DATABASE GAP — 7, of which 5 created after fresh verification

| Company | Country | Classification | Evidence |
|---|---|---|---|
| **CDDS** | Switzerland | Interceptor UAV | Zurich; single-use collision interceptors; Swisscom Ventures seed |
| **Shotling** | Denmark | Kinetic | Copenhagen; rotary electric shotgun for FPV defence; EIFO-backed pre-seed |
| **Stendr** | Norway | Detection, AI/CV | Oslo; AI detection and tracking stack; $5.4M pre-seed |
| **DroneTector** | United Kingdom | Detection | NATO DIANA 2026 cohort |
| **Alpha Autonomy** | Greece | UAV, Autonomy | NATO DIANA 2026 cohort; Athens; swarm autonomy in GPS-contested environments |

All five created as **draft**. None published.

Stendr also resolves an open item from the earlier Coverage Gap Analysis, which recorded it as
having no country and therefore failing import validation. It is Oslo-headquartered.

**Two were not created:**

- **AegisX** — in the NATO DIANA cohort, but a directory places it in **Sweden** while the
  workbook says Germany. Country decides scope, so it is held rather than guessed.
- **Noxvayn** — the only source found is a web-design agency's portfolio page. Insufficient to
  establish the entity.

---

## 8. A finding worth acting on: false article matches inflate verification

While auditing why three directory-only companies had suddenly become evidence-verified, two
turned out to be **false matches made by the article-linking pipeline**:

- **EOS**, a Ukrainian directory listing, was linked to **nine** articles, every one of them
  about **EOS Defence Systems**, the Australian remote-weapon-station maker — MARSS Kuwait,
  Land Forces 2026, Falcon Peak, Chain Gun C-UAS. A three-letter name matched the wrong company.
- **UP Innovations** was linked to *"Upstate Medical Hires FAA Veteran Behind The First BVLOS
  Approvals"* — the token "UP" matching "Upstate".

Both links were deleted and both companies returned to `candidate`. The third, **Sky-Watch**,
was a genuine match: the RQ-35 Heidrun is its own product, so it stays verified.

**This matters beyond these two rows.** "Has a linked news article" is one of the four branches
of the verified-subset evidence rule, so a false article match silently promotes a company into
Dataset V1. Short or generic company names are the exposure. Worth a dedicated audit of
article-company links for companies with names under about six characters before the next
snapshot.

---

## 9. QA

| Check | Result |
|---|---|
| V1 snapshot entries | **273**, unchanged |
| V1 entries altered | **0** — immutability held |
| V1 member dropped from the verified set | **0** |
| Merged companies that were in V1 | **0** |
| Duplicate normalised company names | **0** |
| Orphan sector assignments | **0** |
| Sector rows added without an evidence URL | **0** |
| Non-European company in the working edition | **0** |
| Newly created companies published | **0** — all 5 are draft |
| Publication status changed | **0** |
| Products orphaned by the merges | **0** |
| Aliases preserved from the merges | Oerlikon, Squarehead, Euroflir — all three |
| Redirects created | `squarehead→squarehead-technology`, `oerlikon→rheinmetall-air-defence`, `euroflir→safran-electronics-and-defense` |
| C-UAS assignments | 475 → **499** (+24, all new, none lost) |

### Two things to be aware of

1. **The older `europe-cuas-2026` candidate list went from 807 to 804 rows.** The three merged
   companies ceased to exist, and `merge_companies` removes a deleted company from every
   candidate list. This is unavoidable given referential integrity, and it does **not** touch
   any snapshot: `landscape_candidates` is mutable working state, while the immutable record
   lives in `landscape_entries`, which is untouched. None of the three was ever in V1.
2. **29 companies were created live today and 9 products were orphaned** — all by the nightly
   news pipeline, not by this pass. Verified separately.

---

## 10. Where the Landscape now stands

Working edition `europe-uav-cuas-2026`, 950 companies in scope:

| | Count |
|---|---|
| **Verified** | **330** |
| — UAV only | 142 |
| — Counter-UAS only | 176 |
| — Both | 12 |
| Classified, directory evidence only | 75 |
| Identity / scope review | 12 |
| Excluded (non-aerial) | 4 |
| Unclassified | 529 |

Taxonomy depth among the 330 verified: 18 carry a platform leaf, 16 a mission leaf, 39 an
ecosystem leaf, and **89 still carry only the bare `uav` root**. That is up from 86 at V1 in
absolute terms but down as a share, and the mission layer has gone from zero to sixteen. The
coarse-tagging problem named in the V1 report is improving, not solved.

### Ready for a V2 snapshot?

The verified set is 57 companies larger and materially more accurate than V1 — four entity
errors corrected, two countries fixed, five product misattributions resolved. A V2 snapshot
could be cut on this basis.

Two things are worth doing first, neither large:

1. **Audit article-company links for short names** (§8). This is the one defect that can
   silently inflate the verified set, and it is cheap to check.
2. **Settle the seven `needs_review` cases added by this pass** — or accept that they stay
   outside V2, which is also a reasonable outcome.

The 529 unclassified companies and the 526 untouched REVIEW rows remain the research backlog.
