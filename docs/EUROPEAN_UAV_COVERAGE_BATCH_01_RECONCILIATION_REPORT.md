# European UAV & Counter-UAS — Batch 01 reconciliation

2026-10-26. 40 external research findings reconciled into the live database.
**V1 (273) and V2 (358) unchanged. No V3.**

## 1. Executive result

| | |
|---|---:|
| Findings processed | **40** |
| Verified landscape before | **358** |
| Verified landscape after | **389** |
| **Net change** | **+31** |
| New companies created | **0** |

Every one of the 40 researched companies already existed in the registry. Batch 01 added
coverage by *evidencing and classifying* records we already held, not by discovering new ones —
which is what a queue built from the existing backlog should do.

| Outcome | Count | Who |
|---|---:|---|
| EXISTING_UPDATED | 27 | admitted on official/authoritative evidence |
| COUNTRY_CORRECTED | 3 | Skycutter, Nordic Wing, KBP International |
| ENTITY_RESOLVED | 1 | Sky-Watch |
| OUT_OF_SCOPE | 2 | AIRO Group Holdings, TB2 Aerospace |
| EXCLUDED | 2 | Exail, Kraken Technology Group |
| NEEDS_REVIEW | 1 | EOS |
| REMAINS_CANDIDATE | 4 | HAVELSAN, Blickfeld, NL Acoustics, WARGdrones |

31 of the 40 now satisfy the eligibility rule. **None was declared verified by hand** — each was
promoted only after the rule was recomputed against the updated record.

## 2. Country corrections

| Company | From | To | Basis |
|---|---|---|---|
| Skycutter | Germany | United Kingdom | Reporting identifies a British company; Shrike 10-F developed with SkyFall. Both in scope. |
| Nordic Wing | Sweden | Denmark | Official site describes Danish manufacturing of ASTERO ISR and RAPTOR. Both in scope. |
| KBP International | Ukraine | Czech Republic | FFF 2026 coverage identifies KBP International as Czech. Both in scope. |
| AIRO Group Holdings | United Kingdom | United States | NASDAQ-listed US parent. **Leaves the 32-country scope.** |
| TB2 Aerospace | Turkey | United States | Official material places the operation in the US; the E455 is Event 38's airframe. **Leaves scope.** |

None was changed on manufacturing or deployment location — only on the canonical operating
entity. The last two reduce the European universe from 1,002 to **1,000**.

## 3. Entity resolutions

**EOS (Ukraine) — not verified, moved to `needs_review`.** The retrievable EOS/Slinger evidence
belongs to Australian Electro Optic Systems, which the registry already holds separately as
**EOS Defence** (Australia), alongside EOS Technologie (France, in V2) and EOS Data Analytics
(US). No Australian evidence was attached to the Ukrainian record, and nothing found establishes
it as a trading entity. Four same-name records made this the highest-risk case in the batch.

**AIRO Group Holdings / Sky-Watch — separated.** AIRO is the US parent; the RQ-35 Heidrun is
engineered by Danish **Sky-Watch**, which was already a separate European candidate. The product
was moved to Sky-Watch, a `subsidiary_of` relationship recorded, and AIRO excluded as
out-of-scope. European coverage attaches to the Danish entity, and the US parent is not counted
as European.

**NORDA Dynamics — capability admitted, HQ question left open.** norda.tech evidences the
autonomy core, GNSS-denied navigation and terminal guidance. Engineering is in Ukraine while
governance is reported in Estonia. **Both are in scope, so eligibility is unaffected either way**
— the country was left at Ukraine and the entity question recorded rather than guessed.

**LBA Systems — confirmed as a genuine JV**, not folded into either parent. `jv_partner`
relationships recorded to both Leonardo and Baykar, which are already in V2.

## 4. Two duplicate risks the queue did not catch

**Hertz Systems vs Hertz New Technologies.** `Hertz New Technologies` (hertznt.eu) is *already in
V2* carrying the full C-UAS leaf set. `Hertz Systems` (hertzsystems.com) is the Batch 01
candidate. Different names, different domains — no matcher would have linked them. Both are
Polish and plausibly the same group. I admitted Hertz Systems on its own official HAWK evidence
with `cuas-integrated` only, and **flagged the overlap rather than merging**. If they are one
company, the landscape currently counts that capability twice. **This is the one item worth your
decision.**

**GDELS-Santa Bárbara Sistemas vs Santa Bárbara Sistemas.** Both exist as separate Spanish
candidate records for what is almost certainly one company. Classified only the GDELS record;
merging is a slug-changing decision left to you.

## 5. Product ownership defects found and fixed

Three records had products attributed to the wrong company — all caught by cross-checking rather
than by the research file:

| Product | Was on | Now on | Basis |
|---|---|---|---|
| TOLGA | BMC | **MKE** | Official mke.gov.tr product page |
| ALKA | BMC | **ROKETSAN** | Official roketsan.com.tr product page |
| RQ-35 Heidrun | AIRO Group Holdings | **Sky-Watch** | Danish engineering per sky-watch.com |
| SENTRair | Altitude Angel *(duplicate)* | **Wardyn Technologies** | The cited article says *former* Altitude Angel executives founded Wardyn |

BMC is a vehicle manufacturer that appeared in the same article as TOLGA and ALKA; the extractor
had attached both to it. The duplicate SENTRair on Altitude Angel was deleted — Wardyn (in V2)
already held the correct copy. One product was created: **Viper Hunter 8** (Baltic Viper), the
named basis for its inclusion.

## 6. Taxonomy changes

**68 explicit assignments added** across 31 companies — 13 in the C-UAS tree, 55 in the UAV tree.
**10 rows removed** (archived, reversible): redundant `uav` parents whose only source was a
directory listing, now implied by a newly evidenced leaf.

Assignment was deliberately conservative, and in several cases narrower than the research
recommended:

- **MKE** was recommended 9 leaves from one TOLGA page; it received `cuas-integrated` +
  `cuas-def-kinetic`. MKE makes the guns; the radar, EO and acoustic subsystems are not
  attributed to it and the laser is described as planned.
- **ROKETSAN** was recommended 8; it received `cuas-integrated`, `cuas-def-directed-energy` and
  `cuas-def-rf-jamming` — the three effects ALKA itself delivers as Roketsan's own weapon.
- **Hertz Systems** and **Telespazio Germany** were recommended full modality sets; both received
  `cuas-integrated` only, because they integrate third-party sensors.
- **Baltic Viper** was recommended AI/CV and kinetic leaves; those are functions *of* its
  interceptor, so it received `cuas-def-interceptor` alone.
- **KBP International** is the one deliberate broad-only: GRYF is evidenced as a counter-UAS
  carrier, but the interceptors it carries are not KBP products, so `counter-uas` is stored as an
  **evidenced broad-only** assignment with no mitigation leaf. This is exactly what the
  derived-parent architecture reserves broad storage for.

The researcher's slug vocabulary did not match ours (`uav-fixed-wing`, `cuas-kinetic`,
`eco-autonomy-ai`…); every value was mapped to a real sector before insert, never inserted raw.

## 7. Companies not admitted, and why

| Company | Outcome | Reason |
|---|---|---|
| Exail | excluded | DriX, A-18M and DORCUS are maritime/underwater. UMIS integrates third-party UAVs — that does not make Exail an aerial OEM. |
| Kraken Technology Group | excluded | Maritime surface/subsurface portfolio. "Uncrewed" is not "aerial". |
| AIRO Group Holdings | out of scope | US parent; European coverage sits with Sky-Watch. |
| TB2 Aerospace | out of scope | US operation; the E455 belongs to Event 38. |
| EOS | needs_review | Name collision with Australian EOS; no Ukrainian entity established. |
| HAVELSAN | candidate | Only unmanned *surface* system evidence retrieved. Carried into Batch 02. |
| Blickfeld | candidate | LiDAR perimeter security that can dispatch drones is drone-adjacent, not drone detection. |
| NL Acoustics | candidate | An acoustic camera does not establish acoustic drone detection. |
| **WARGdrones** | candidate | **Downgraded against the research verdict.** Research rated it MEDIUM_HIGH on a third-party profile and asked that the domain confirm activity. wargdrones.com serves only a name and the tagline "Integrated defence systems" — no country, products or capability. Its website was deliberately *not* recorded, because doing so would have verified the company on a placeholder page. Carried into Batch 02. |

## 8. Publication

**Zero publication statuses changed.** 21 of the 31 newly verified companies are `live` and 10
are `draft`; verification and publication remain separate decisions.

One item to note rather than act on: **Altitude Angel entered administration** per the research.
It is verified on current evidence and remains `live`. Whether a company in administration should
stay published is your call.

## 9. Landscape after reconciliation

| | Before | After |
|---|---:|---:|
| European-scope universe | 1,002 | **1,000** |
| Verified | 358 | **389** |
| — UAV only | 183 | **204** |
| — C-UAS only | 164 | **171** |
| — both | 11 | **14** |
| Classified-but-unverified | 74 | **63** |
| Unclassified | 542 | **517** |
| needs_review | 18 | **19** |
| Excluded | 10 | **14** (2 now outside scope) |

389 + 63 + 517 + 19 + 12 in-scope excluded = **1,000**. Reconciles.

Countries gaining verified companies: Denmark +4, United Kingdom +4, France +3, Germany +3,
Ukraine +3, Czech Republic +2, Lithuania +2, Poland +2, Turkey +2, and one each for Belgium,
Estonia, Italy, Netherlands, Romania and Spain.

## 10. QA

| Check | Result |
|---|---|
| V1 entries | 273 ✓ unchanged |
| V2 entries | 358 ✓ unchanged |
| All 40 input rows accounted for exactly once | ✓ |
| New duplicate companies created | 0 ✓ |
| Products on the wrong owner (TOLGA/ALKA/Heidrun) | 0 ✓ |
| Australian EOS evidence attached to Ukrainian EOS | 0 ✓ |
| US AIRO parent counted as European | no — excluded, Sky-Watch carries it ✓ |
| Out-of-scope company admitted | 0 ✓ |
| Verified companies failing the eligibility rule | 0 ✓ |
| Excluded / needs_review marked verified | 0 ✓ |
| Publication statuses changed | 0 ✓ |
| Redundant **unevidenced** structural parents | 0 ✓ |
| Legitimate evidenced broad-only preserved | 6 ✓ |
| Batch 01 companies left in the normal queue | 4 — the four not admitted, by design ✓ |
| Batch 02 size / verified / excluded / duplicate ids | 40 / 0 / 0 / 0 ✓ |
| Test suite | 21/21 pass ✓ |

**One QA line needs an honest footnote.** A check for "derived parents stored as evidence-bearing"
returns 113, not 0. Batch 01 created **none** of them: 112 are pre-existing `uav`-root rows in the
UAV tree whose source is a directory listing, and 1 is Milliray's `cuas-detection`, kept
deliberately during the derived-parent migration because deleting an evidenced row destroys a
citation. The post-V2 migration cleaned the C-UAS subtree; the equivalent UAV-tree pass was out of
scope then and is out of scope here. It is a real backlog item, not a regression.

## 11. Batch 02

`data/research/europe-uav-coverage-chatgpt-batch-02.csv` — 40 cases, **17 countries**, scored from
the updated database (P1 4 · P2 101 · P3 29 · P4 446 across 580 candidates).

Composition: 13 classified-but-unverified, 27 unclassified, 4 capability-gap probes, 2 carried
forward from Batch 01 and flagged `FOLLOW_UP_FROM_BATCH_01` (HAVELSAN — is it the OEM of HAMZA-1
or BARKAN?; WARGdrones — does the company exist as a trading entity?).

**A deliberate deviation from the suggested 15–20 classified-but-unverified.** Of the 62 still
unresolved, **53 are Ukrainian** and 8 of the remaining 9 are already in the batch. Reaching 15–20
would mean adding four to eight more near-identical Ukrainian directory records and breaking the
5-per-country cap — the thing §18 explicitly warns against. I kept the cap, took the one remaining
non-Ukrainian case (Switzerland) for a 17th country, and left the figure at 13.

Those 53 remain the cheapest route to new verified companies: each needs one official source. They
suit a dedicated single-country pass better than a slot in a diversified batch.

## 12. Outputs

| File | Rows |
|---|---:|
| `data/research/europe-uav-coverage-batch-01-reconciliation.csv` | 40 |
| `data/research/europe-uav-coverage-research-queue-post-batch-01.csv` | 580 |
| `data/research/europe-uav-coverage-chatgpt-batch-02.csv` | 40 |
| `data/research/europe-uav-needs-review-resolution-queue.csv` | 19 (EOS added) |
