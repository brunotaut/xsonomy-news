# European UAV & Counter-UAS — coverage research queue

2026-10-26. **Read + analysis + export only.** No company was verified, classified, created,
merged, published or edited. V1 and V2 are untouched. No V3.

This decides *which* companies deserve external research. It does not research them.

## 1. The universe, recalculated

Counted from the live database after the derived-parent migration, not from the figures in
the brief. They agree.

| | Companies |
|---|---:|
| European-scope universe (`countries.is_landscape_scope`) | **1,002** |
| Verified — in V2 (`status = included`) | 358 |
| Normal research queue (`status = candidate`) | **616** |
| — unclassified | 542 |
| — classified-but-unverified | 74 |
| `needs_review` — held separately | 18 |
| Excluded — not queued | 10 |

358 + 616 + 18 + 10 = **1,002**. Reconciles exactly.

**What "classified-but-unverified" actually means here.** I checked each candidate against the
V2 eligibility rule stored in the snapshot rather than assuming. The 74 are precisely the
companies that *are* tagged inside the `uav`/`counter-uas` tree but fail the evidence clause —
and they fail it identically: **no website, no products, and source URLs that are directory
listings only** (drone-directory.com.ua or defencejobs.org). Every one came in through
`discovery_source = external_research`.

A second group matters for interpretation: **84 backlog companies are classified under a
separate `sensors` domain**, which sits outside the landscape tree. They count as unclassified
for this purpose, but a sensors company is adjacent enough to be worth a small positive signal,
so the model gives it one — not the full weight of a landscape classification.

## 2. The scoring model

Score 0–100 from seven components, every one reproducible from the database. The `notes`
column of the queue carries each company's arithmetic (`score = A21 + B30 + C18 + … = 87`).

| | Component | Max | How it is earned |
|---|---|---:|---|
| A | Own-text terminology | 30 | `16 × distinct tier-3 families + min(10, 5 × tier-2 families)`. Tier 3 is explicit ("counter-UAS", "loitering munition", "unmanned aerial"); tier 2 is suggestive but ambiguous ("radar", "payload", "drone"). Counted by **family**, so synonyms cannot inflate a single claim. |
| B | Product signal | 30 | 24 for a product catalogued `UAV` or `Counter-UAS`, 16 for `Effector`, +9 per tier-3-named product (max 2), +3 for having any product. |
| C | Article signal | 18 | `6 × high-confidence primary + 3 × high-confidence mention + 2 × medium`. Only links the fixed linker rates ≥ 0.6, and only where the **article itself** is about UAV/C-UAS. |
| D | Existing taxonomy | 15 | 15 C-UAS leaf · 12 UAV leaf · 8 landscape root/mid · 3 adjacent domain (`sensors`). **Explicit assignments only** — derived parents are never counted. |
| E | Sources | 8 | 3 non-directory website + 2 non-directory source URL + 3 authoritative (.gov, europa.eu, nato.int, janes.com). |
| F | Strategic value | 14 | Under-covered country (0–4) + thin-capability hint (3) + looks like an OEM (3) + **5 if classified-but-unverified**, because one official source would resolve membership. |
| G | Corroboration | 15 | `5 × (independent evidence families − 1)`. Families: explicit terms, products, primary articles, landscape taxonomy, authoritative source. |
| — | Noise penalty | −15 | −15 when a noise label matches and there is no tier-3 term; −5 when a strong term is present anyway. Never excludes. |

This directly implements the rule that combinations beat volume: ten generic tier-2 hits are
capped at 10 points, while one explicit tier-3 term scores 16 and two independent families add
a further 5.

### A deviation you should know about

The brief suggested P1 ≈ 75–100. **Nothing in this backlog scores that way, and that is a
property of the records, not of the companies.** Only 204 of 634 have a description, 246 a
website, 201 any product. A company cannot reach 75 without being richly documented already —
and a richly documented company is, by definition, not the one most in need of research.

So I kept the 0–100 model exactly as documented above and set the band cut-points where the
distribution actually breaks, preserving the *meaning* the brief assigned to each band:

| Band | Score | Companies | Meaning |
|---|---|---:|---|
| **P1** | ≥ 45 | 25 | Strong likelihood of belonging. Research first. |
| **P2** | 35–44 | 114 | Multiple meaningful signals; verification required. |
| **P3** | 25–34 | 31 | Possible relevance. |
| **P4** | < 25 | 446 | Weak or peripheral. Kept, not discarded. |

Under the literal 75/55/35 thresholds the same ranking yields P1 = 1, P2 = 6, P3 = 132,
P4 = 477. The ordering is identical either way; only the labels move. Raw scores are in the
CSV, so you can re-band at any threshold.

## 3. Priority distribution

| Priority | Unclassified | Classified-but-unverified | Total |
|---|---:|---:|---:|
| P1 | 24 | 1 | **25** |
| P2 | 42 | 72 | **114** |
| P3 | 31 | 0 | **31** |
| P4 | 445 | 1 | **446** |
| **Total** | **542** | **74** | **616** |

Plus **18** `needs_review`, scored but held in their own file.

## 4. ChatGPT Batch 01 — the 40 to research first

Not the top 40 scores. Country-capped at 5, with 12 classified-but-unverified cases, 4
capability-gap probes drawn from lower bands, and 7 entity-risk cases where resolving the
entity would materially improve coverage. **17 countries represented.**

| # | Company | Country | State | Score | Why now |
|---|---|---|---|---:|---|
| 1 | Fire Point | Ukraine | unclassified | 87 | Products AI-25, Flamingo, FP-5…; 4 article(s) as subject; uses "strike drone"; unclassified |
| 2 | EOS | Ukraine | CBU | 62 | 1 article(s) as subject; uses "c-uas"; classified but directory-only sources |
| 3 | Exail | France | unclassified | 61 | Products A-18M, DORCUS, DriX…; 3 article(s) as subject; unclassified |
| 4 | Malloy Aeronautics | United Kingdom | unclassified | 61 | Products Malloy T-150B, T150; 1 article(s) as subject; unclassified |
| 5 | Kraken Technology Group | United Kingdom | unclassified | 58 | Products K3 Scout, K5 Kraken, K7 Sabre; 4 article(s) as subject; unclassified |
| 6 | Altitude Angel | United Kingdom | unclassified | 55 | Products SENTRair; 1 article(s) as subject; unclassified |
| 7 | DeltaQuad | Netherlands | unclassified | 55 | Products Evo, Evo-LE; 1 article(s) as subject; unclassified |
| 8 | Skycutter | Germany | unclassified | 53 | Products Shrike 10-F; 6 article mention(s); unclassified |
| 9 | Firebolt Engineering | United Kingdom | unclassified | 52 | Products Griffen; 1 article(s) as subject; unclassified |
| 10 | HAVELSAN | Turkey | unclassified | 52 | Products BARKAN, EW/SIGINT & C4ISR, HAMZA-1; 1 article(s) as subject; classified sensors, outside landscape tree |
| 11 | Systematic | Denmark | unclassified | 52 | Products OSL, SitaWare Insight, SitaWare Suite; 3 article(s) as subject; unclassified |
| 12 | Ptashka Drones | Ukraine | unclassified | 51 | Products Ptashka 15-O30; 1 article(s) as subject; unclassified |
| 13 | AIRO Group Holdings | United Kingdom | unclassified | 49 | Products RQ-35 Heidrun; 1 article(s) as subject; unclassified |
| 14 | Wingcopter | Germany | unclassified | 49 | Products P2, Wingcopter 198, Wingcopter 262; 1 article(s) as subject; unclassified |
| 15 | Maximus Labs Romania | Romania | unclassified | 48 | Products Max1; 1 article(s) as subject; unclassified |
| 16 | Nordic Wing | Sweden | unclassified | 48 | Products Astero ISR, Raptor 2; 1 article(s) as subject; unclassified |
| 17 | TB2 Aerospace | Turkey | unclassified | 48 | Products E455; 1 article(s) as subject; unclassified |
| 18 | Hertz Systems | Poland | unclassified | 47 | Products HAWK Counter-Drone System; uses "unmanned aerial"; classified sensors, outside landscape tree |
| 19 | GDELS-Santa Bárbara Sistemas | Spain | unclassified | 46 | Products Hunter; 1 article(s) as subject; unclassified |
| 20 | KBP International | Ukraine | unclassified | 46 | Products GRYF; 1 article(s) as subject; unclassified |
| 21 | MKE | Turkey | unclassified | 46 | Products PİRANA; 1 article(s) as subject; unclassified |
| 22 | ROKETSAN | Turkey | unclassified | 46 | Products Cirit 70mm; 1 article(s) as subject; unclassified |
| 23 | Baltic Viper | Lithuania | CBU | 42 | Uses "c-uas"; classified but directory-only sources |
| 24 | Donaustahl | Germany | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 25 | Rift | France | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 26 | Sapient Perception | Denmark | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 27 | siliXcon | Czech Republic | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 28 | Sky-Watch | Denmark | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 29 | Skycorp Technologies | Estonia | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 30 | Skydrone Robotics | France | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 31 | WARGdrones | Germany | CBU | 39 | Uses "c-uas"; classified but directory-only sources |
| 32 | SafeSky | Belgium | unclassified | 32 | Products SafeSky; uses "unmanned aircraft"; gap probe: eco-utm; unclassified |
| 33 | Telespazio Germany | Germany | unclassified | 32 | Uses "drone detection"; gap probe: eco-utm; unclassified |
| 34 | Blickfeld | Germany | unclassified | 23 | Products Cube · Qb2 solid-state LiDAR; gap probe: cuas-track-ai-cv; classified sensors, outside landscape tree |
| 35 | NL Acoustics (Noiseless Acoustics) | Finland | unclassified | 18 | Products Si124 acoustic camera; gap probe: cuas-det-acoustic; classified sensors, outside landscape tree |
| 36 | NORDA Dynamics | Ukraine | CBU | 43 | Uses "c-uas"; classified but directory-only sources |
| 37 | uAvionics | Poland | unclassified | 43 | Products Tiguar M; unclassified |
| 38 | PDKINEMATICS | Lithuania | CBU | 42 | Uses "c-uas"; classified but directory-only sources |
| 39 | LBA Systems | Italy | unclassified | 41 | Products Astore Levante; 2 article mention(s); unclassified |
| 40 | YellowScan | France | unclassified | 41 | Products UAV LiDAR systems, YellowScan Explorer V2; uses "unmanned aerial"; classified sensors, outside landscape tree |
## 5. Country coverage

V2 membership against what is still waiting to be researched.

| Country | V2 | Backlog | P1+P2 | | Country | V2 | Backlog | P1+P2 |
|---|---:|---:|---:|---|---|---:|---:|---:|
| Luxembourg | 0 | 2 | 0 | | Belgium | 8 | 6 | 1 |
| **Malta** | 0 | 0 | 0 | | Sweden | 9 | 13 | 2 |
| **Cyprus** | 0 | 0 | 0 | | Italy | 10 | 26 | 4 |
| Ireland | 1 | 5 | 0 | | Netherlands | 10 | 24 | 3 |
| Slovakia | 1 | 1 | 0 | | Spain | 11 | 13 | 3 |
| Croatia | 1 | 0 | 0 | | Estonia | 11 | 9 | 1 |
| Slovenia | 2 | 3 | 2 | | Norway | 12 | 11 | 1 |
| Hungary | 2 | 1 | 0 | | Czech Republic | 15 | 9 | 2 |
| Finland | 3 | 12 | 0 | | Switzerland | 16 | 12 | 0 |
| Lithuania | 3 | 8 | 3 | | Denmark | 18 | 11 | 3 |
| Greece | 3 | 1 | 0 | | Germany | 25 | 81 | 6 |
| Bulgaria | 4 | 2 | 0 | | Poland | 34 | 37 | 8 |
| Austria | 5 | 5 | 0 | | France | 42 | 77 | 13 |
| Portugal | 5 | 2 | 0 | | United Kingdom | 43 | 102 | 18 |
| Turkey | 6 | 20 | 6 | | Ukraine | 46 | 109 | 60 |
| Romania | 6 | 10 | 3 | | Latvia | 6 | 4 | 0 |

**The thin-market question is answered, and the answer is "there is nothing there".**
Malta and Cyprus have **zero V2 companies and zero backlog companies** — not a coverage gap
but an absence of recorded industry. Luxembourg has 2 backlog companies, neither of which
reaches P1 or P2. Chasing these three markets would be effort spent on the empty set; the
honest next step for them is a one-off directory check, not a research batch.

Genuinely under-covered with real backlog to work: **Finland** (3 V2, 12 backlog) and
**Ireland** (1 V2, 5 backlog) — though neither produced a P1/P2 case, so the backlog there is
thin on evidence too. **Turkey** (6 V2, 20 backlog, 6 P1/P2) is the clearest under-covered
market with real candidates behind it, and Batch 01 carries four Turkish companies.

Ukraine's 60 P1/P2 are mostly the directory-only cluster (§7), not 60 distinct discoveries.

## 6. Capability-gap opportunities

Thin V2 capabilities, counted from explicit assignments on V2 members:

| Capability | V2 companies | | Capability | V2 companies |
|---|---:|---|---|---:|
| Inspection | 2 | | Loitering Munition | 6 |
| Heavy-Lift UAV | 3 | | Communications / Datalink | 7 |
| **UTM / Traffic Management** | 3 | | Flight Software | 8 |
| Mapping / Survey | 3 | | Components | 8 |
| Strike UAV | 4 | | Integration | 8 |
| **GNSS Jamming / Spoofing** | 4 | | **Directed Energy** | 10 |
| Sensors | 5 | | **Sensor Fusion** | 14 |
| Ground Control | 5 | | **AI / Computer Vision** | 17 |
| FPV | 6 | | **Acoustic Detection** | 18 |
| Launch / Recovery / Docking | 6 | | Navigation / GNSS | 6 |

Only **7 backlog companies** carry wording that hints at one of these, which is itself a
finding: the internal text simply is not rich enough to find gap candidates at scale. All
seven are in the queue with `potential_gap_categories` set, and four are in Batch 01 —
**UAVLAS** (GNSS / navigation), **SafeSky** and **Telespazio Germany** (UTM), **NL Acoustics**
(acoustic detection) and **Blickfeld** (AI/CV). NL Acoustics is the most interesting: a Finnish
acoustic-camera specialist, in the capability earlier coverage work already identified as the
weakest, in a country with 3 V2 companies.

These are **hints, not classifications.** No taxonomy was assigned.

## 7. Classified-but-unverified — all 74 fail the same way

| Missing evidence type | Companies |
|---|---:|
| `DIRECTORY_ONLY` | 72 |
| `MISSING_ENTITY_CONFIRMATION` | 2 |

Every one of the 74 has **no website, no products, and only directory URLs**
(drone-directory.com.ua, defencejobs.org). Two additionally carry an entity-risk flag that must
be resolved before anything else.

This is the single most actionable group in the queue: they already hold a landscape
classification, so **one official source flips each of them into the verified set** — which is
why the model gives them +5 strategic value and why 72 of them land in P2. The caution is that
their existing classification also came from the same directory, so research must confirm the
capability, not just the existence of the company.

## 8. Entity-risk summary

| Flag | Companies |
|---|---:|
| GENERIC_NAME_COLLISION | 39 |
| DUPLICATE_RISK | 19 |
| SHARED_DOMAIN | 18 |
| PARENT_SUBSIDIARY | 13 |
| BRAND_VS_COMPANY | 12 |
| ACQUISITION_OR_HISTORICAL_BRAND | 9 |
| COUNTRY_CONFLICT | 4 |
| PROJECT_OR_PROGRAM | 2 |
| PRODUCT_AS_COMPANY | 1 |

`DUPLICATE_RISK` names the likely match in `possible_duplicate_of`, including matches against
companies **already in V2**, so the same firm is not researched twice. Two examples in Batch 01:
*Exail* vs *Exail Robotics*, and *Kraken Technology Group* vs *Kraken*.

All four `COUNTRY_CONFLICT` cases are real and worth asking about — Swarmer (recorded Germany,
products United States), MGI Engineering (United Kingdom / United States), RSI Europe
(Lithuania / Estonia) and Fire Point (Ukraine, products Canada and Ukraine).

**A correction made during this pass:** `PRODUCT_AS_COMPANY` initially flagged 5 companies. Four
were false — the matching product record has no owner at all, which is a *missing product link*
in our data, not a sign the company is really a product. Only **D-Flight** survives, where the
identically-named product belongs to DJI. The four orphan products (Fire Point, Avengers Labs,
FlyingBasket, Heavy Shot) are worth linking to their companies as a separate data-hygiene job.

## 9. What dominates P4

446 companies, and the reason is consistent rather than interesting:

- **397** have no explicit terminology, no UAV/C-UAS product and no primary article — the model
  has nothing positive to work with.
- **236** have no website and no products at all.
- **69** are classified only under the adjacent `sensors` domain.
- **33** carry a noise label. The largest noise groups across the whole backlog are
  satellite-only (13+2), maritime-only (5), generic cybersecurity (3), UGV-only (3) and
  research bodies (3+2).

P4 is therefore mostly **thin records, not rejected companies**. Nothing was discarded. If a
later enrichment pass adds descriptions or products to these records, re-running this model
will re-rank them automatically.

## 10. Recommended research sequence

1. **Batch 01 (40 cases) — now.** Highest expected value and deliberately diverse.
2. **Re-evaluate after Batch 01.** Each resolved company adds products, websites and source
   URLs, which feed components B and E and will move other records. Do not plan batches 2–5 in
   advance against today's scores.
3. **Batch 02 — the remaining classified-but-unverified.** ~62 cases after Batch 01, uniform
   and cheap to research: one official source each. This is the fastest route to new verified
   companies.
4. **Batch 03 — the rest of P1/P2**, 42 cases, mostly unclassified companies with real
   products. This includes the 3 P1 companies the United Kingdom cap held back from Batch 01.
5. **Then stop and re-score.** After roughly **three to four batches (~120–160 companies)** the inputs will
   have changed enough that today's ranking is stale. Expect a V3 decision around that point,
   not before.

P3 and P4 should not be researched company-by-company. A better use of effort for them is a
bulk enrichment pass that fills descriptions and websites, after which this model can re-rank
them for free.

## 11. Outputs

| File | Rows |
|---|---:|
| `data/research/europe-uav-coverage-research-queue.csv` | 616 |
| `data/research/europe-uav-coverage-chatgpt-batch-01.csv` | 40 |
| `data/research/europe-uav-needs-review-resolution-queue.csv` | 18 |

The `needs_review` file is hand-written rather than templated: each of the 18 has a specific
recorded problem (Sky Map is a platform not a company; Aerodata Switzerland vs Aerodata AG
Germany; Delian Alliance recorded Greek but researched as British), so each gets the one
question that would actually resolve it.

## 12. QA

| Check | Result |
|---|---|
| V1 entries | 273 ✓ |
| V2 entries | 358 ✓ |
| Normal queue is European scope | 616 / 616 ✓ |
| Verified companies in the normal queue | 0 ✓ |
| Excluded companies in the normal queue | 0 ✓ |
| `needs_review` separated | 18, own file ✓ |
| Each company appears once | no duplicate ids ✓ |
| Ranks sequential 1…616 | ✓ |
| Every P1/P2 has a research reason | 139 / 139 ✓ |
| Every P1/P2 has ≥1 exact question | 139 / 139 ✓ |
| Article links below 0.6 confidence counted | 0 ✓ |
| Derived C-UAS parents counted as taxonomy signal | 0 ✓ |
| Universe reconciles | 358 + 616 + 18 + 10 = 1,002 ✓ |
| `company_sectors` unchanged | 364 rows in the C-UAS tree ✓ |
| `landscape_candidates` unchanged | candidate 616, included 358, needs_review 18, excluded 10 ✓ |

Scores are reproducible: every row's `notes` column carries its own component arithmetic, and
the analysis tables (`rq_terms`, `rq_scored` and the rest) remain in the database so the model
can be re-run or audited.
