# European UAV & Counter-UAS Landscape — pre-V2 verification integrity audit

2026-10-25. The purpose of this pass was to try to **disprove** the 330-company verified set,
not to confirm it. No Dataset V2 was created.

`europe-uav-cuas-2026-v1` is unchanged: **273 entries**, immutability triggers intact.
All changes are in the live tables and the working edition `europe-uav-cuas-2026`.
Scope came from `countries.is_landscape_scope` throughout.

---

## 1. Executive summary

| | |
|---|---|
| Verified before audit | **330** |
| Verified after audit | **326** |
| PASS | 308 |
| PASS_WITH_CORRECTION | 18 |
| NEEDS_REVIEW | 1 |
| FALSE_VERIFICATION | 2 |
| OUT_OF_SCOPE | 4 |
| False article links removed | **33** |
| Product ownership corrections | 1 (plus 1 product added) |
| Country corrections | 3 |
| Taxonomy corrections | 1 company classified, 3 excluded |
| Duplicate entities found | 3 |
| Portal/news URLs removed from the website field | 4 |
| **Verification rule changed** | **yes — see §9** |

The headline number barely moved, which is the least interesting thing about this audit. What
changed is that **two companies were in the verified set for reasons that were simply wrong**,
**four do not belong in a European landscape at all**, and the mechanism that let the first two
in was still live and had already re-created the evidence deleted the day before.

---

## 2. Verification integrity

### The rule as it stood

It was not written down anywhere executable. It existed only as SQL re-typed into each
migration — which is how it drifted. A company was verified when it had a European HQ in
scope, at least one sector in the `uav` or `counter-uas` subtree, and **any one** of:

1. a website that is not a known directory,
2. at least one product,
3. at least one linked news article,
4. a non-directory source URL on the company or on one of its sector assignments.

### How the 330 actually qualified

| Evidence path | Companies |
|---|---|
| Official company website | 266 |
| Product evidence | 199 |
| Source URL (any non-directory) | 294 |
| — of which government / procurement / Janes / ESA | 21 |
| Linked news article (any) | 170 |
| **Article was the ONLY path** | **1** |

That last row is the one that matters, and it is reassuringly small. But "article-only" was
not the whole exposure: a false article link also props up companies whose other evidence is
thin, and it is the path that regenerates automatically every night.

---

## 3. Article-link audit

### Method

`articles.companies` holds the names the extractor actually resolved from each article. Every
one of the **1,643** article links on verified companies was tested against it.

| Result | Links |
|---|---|
| Company name present exactly | 1,312 |
| Present as a recorded alias | 161 |
| Substring overlap only | 129 |
| No overlap at all | 41 |

The 170 non-exact links were read individually. Corporate-form variants were kept — Saab /
Saab AB, Diehl Defence / Diehl Defense, Airbus Defence and Space / Airbus Defence & Space,
MARSS Group / MARSS Systems Limited, EVPU / EVPÚ, MSI-Defence / MSI Defense, senseFly /
AgEagle, Baykar / Bayraktar, Orqa / Orqa US. **33 were wrong and were deleted.**

| Company | Article(s) | Problem | Decision | Action |
|---|---|---|---|---|
| EOS (Ukraine) | 9: MARSS Kuwait, Land Forces 2026, Chain Gun C-UAS, Falcon Peak… | All refer to **EOS Defence Systems (Australia)** | FALSE | 9 links deleted |
| SkyFall (Ukraine) | 6: EU-Ukraine Drone Alliance, Croatian expansion | Name ORQA, Indra, Fincantieri — never SkyFall | FALSE | 6 deleted |
| AReS Technologies | 5: ANRA UTM, Chinese radios, Neros, Tytan ×2 | Acronym collision | FALSE | 5 deleted |
| OM Defense Systems | 4: EOS RWS, EOS Slinger, Lithuanian scout, Picket | Matched any "… Defense Systems" | FALSE | 4 deleted |
| Diehl Defence | 3: Hegseth AUSA, robot technicians, Zone 5 | Name absent in any spelling | FALSE | 3 deleted |
| Orqa | 3: Pentagon Gauntlet, Phase 3, 60,000 drones | Name Perennial, Neros, Skycutter | FALSE | 3 deleted |
| Unifly | 2: ISO UAS standard, drone-in-a-box | Both name **Unifly Consulting**, a different entity | FALSE | 2 deleted |
| Verity | 2: FCC drone-ban stories | Name SiFly, Verge, Sees.ai | FALSE | 2 deleted |
| MC2 Technologies | 2: DJI cattle, MCTECH Maccabiah | Collision with MCTECH | FALSE | 2 deleted |
| UP Innovations | 1: Upstate Medical | Token "UP" | FALSE | 1 deleted |
| OVES Enterprise | 1: DJI guide | Token "Enterprise" (DJI Enterprise) | FALSE | 1 deleted |
| WB Group | 1: Prodrone Japan | Token "Electronics" (Canon Electronics) | FALSE | 1 deleted |
| Safran Electronics & Defense | 1: French artillery | Names MBDA, Tekever, Delair | FALSE | 1 deleted |
| Archangel Imaging | 1: Skyfly eVTOL funding | "Archangel" is the investor | FALSE | 1 deleted |
| ASL, ETH Zurich | 1: VAERIDION | Names "ASL Group" | FALSE | 1 deleted |
| TU Delft (MAVLab) | 1: Honeywell satcoms | Names Brno University | FALSE | 1 deleted |

### ARTICLE_DEPENDENT_VERIFICATION

**1 company before the audit: Sky-Watch (Denmark).** Independently verified — the RQ-35
Heidrun named in its one article genuinely is Sky-Watch's product, so the *link* is correct.
It still leaves the verified set, because under the tightened rule one article is no longer
sufficient on its own. It is a recoverable false negative: recording its website or a product
restores it.

During the audit two more companies briefly became article-dependent — EOS and UP Innovations
— because the nightly pipeline had **re-created the links deleted on 2026-10-24**. See §9.

---

## 4. Entity problems

| Company | Problem | Resolution |
|---|---|---|
| **EADS (now Airbus Defence and Space)** | Duplicate of Airbus Defence and Space; the record name says so, and both use airbus.com. Both were verified. | Cannot be merged — V1 references it. Excluded from the verified subset, `merged_with` relationship recorded, "EADS" added as an alias. |
| **WB Electronics** | Duplicate of WB Group (WB Electronics): same Polish group, same wbgroup.pl. Both were verified. | Same treatment. |
| **ArianeGroup / Ariane Group** | Spelling duplicate. Neither verified. | Merged properly. |
| **EOS (Ukraine)** vs EOS Defence Systems (Australia) | Two real companies sharing a three-letter name | No merge — genuinely different companies. The verification rule was changed instead. |
| **AReS Technologies** | `brave1.gov.ua`, a government portal, was stored as its website | Website cleared |
| **Sky Fortress, Sky Map** | Same: `brave1.gov.ua` as website | Website cleared |
| **I-SEE** | `defence-blog.com`, a news site, as its website | Website cleared |

Those four website values matter because "has an own website" is a verification path, so a
portal URL in that column satisfies it falsely. All four keep verified status on product
evidence.

Nine verified companies share a domain with another verified company — Safran/Safran E&D,
KNDS/KNDS France, Rheinmetall/Rheinmetall Air Defence, Thales/Aveillant, Hensoldt/ESG,
Quantum Systems/Welles Acoustics, DefSecIntel/Origin Robotics, Airbus ×3. These are genuine
parent/subsidiary pairs, not duplicates, but each pair counts twice in the Landscape. Flagged,
not changed — collapsing them is an editorial decision about what a Landscape entry represents.

---

## 5. Product ownership corrections

| Product | Previous company | Correct company | Evidence | Action |
|---|---|---|---|---|
| **Heliblade** | Hemeria | **X721** (not in the database) | French MoD and AeroMorning attribute the HALE/HAPS demonstrator to X721. Hemeria's own stratospheric product is the BalMan balloon. | Detached and annotated. No company invented: X721's corporate home is contested (Dubai parent, Mérignac subsidiary). |
| **BLK2FLY** | — (did not exist) | **Leica Geosystems (Hexagon)** | Leica's own store: a fully integrated LiDAR UAV | Product created |

The earlier Sky Spy ↔ Orqa payload/airframe swap was already fixed. A systematic re-scan for
that pattern — products whose name matches a different company's name — found four candidates
(Vector/Quantum Systems, Polaris/FlyFocus, Fractl/AIM Defence, S.EN.T.IN.EL/DroneZone) and all
four are correctly attributed.

---

## 6. Country corrections

| Company | Old country | Correct country | Evidence | Action |
|---|---|---|---|---|
| **Teledyne FLIR Defense** | Norway | **United States** | Teledyne FLIR LLC, Wilsonville OR and Arlington VA. Norway is the Black Hornet (ex-Prox Dynamics) manufacturing site, not the HQ. The record even described it as "a Norwegian defense company". | Corrected; leaves the European Landscape |
| **AIM Defence** | United Kingdom | **Australia** | Melbourne headquarters and manufacturing; the evidence trail is Australian (DroneShield partnership) | Corrected; leaves the Landscape |
| **AerialMetric** | France | **Madagascar** | HQ Antananarivo; French founder and a Biarritz presence do not move the HQ | Corrected; leaves the Landscape |

**Teledyne FLIR Defense and AIM Defence were both in Dataset V1.** V1 is frozen and cannot be
corrected — that is the point of a snapshot — so V1 is now known to contain two non-European
companies. V2 will not.

---

## 7. The seven needs-review cases

| Company | Issue | Research | Decision | DB action |
|---|---|---|---|---|
| **Leica Geosystems (Hexagon)** | Recorded products are airborne sensors flown on crewed aircraft | Found the **BLK2FLY**, which Leica's own store calls a fully integrated LiDAR UAV — an aircraft Leica builds and sells | **INCLUDE** | Classified `uav`, `eco-payloads`, `uav-mapping`; BLK2FLY product added |
| **Gamaya** | Explicit UAV relevance not established | No UAV-specific product found; agricultural analytics consuming imagery from several sources. Also merged into Terraview in 2024, so the standalone entity is doubtful | **EXCLUDE** | Excluded from the aerial Landscape; company kept in UAV360 |
| **Hemeria** | French MoD attributes Heliblade to X721 | Confirmed: Heliblade is X721's; Hemeria's high-altitude product is the BalMan balloon, not a UAV | **EXCLUDE** | Heliblade detached; excluded |
| **AerialMetric** | Evidence points to Madagascar, record says France | Confirmed HQ Antananarivo | **EXCLUDE (scope)** | Country corrected; out of scope |
| **Shark Aviation Dynamics** | IRYDA evidence belonged to MBF Group; domain conflict | Only solid source is an MBF Group filing recording a *commercial cooperation* with Shark Aviation. No Turkish connection found — but nothing establishes a Polish HQ either | **KEEP NEEDS_REVIEW** | Note updated; country unchanged |
| **ELDIS Pardubice** | ATC radar established, C-UAS not | Dedicated search found no counter-UAS evidence | **KEEP OUTSIDE** | Note updated; stays unclassified |
| **Molfar Defence Technologies** | Country conflict, aggregator-only evidence | Not resolved | **KEEP NEEDS_REVIEW** | Note updated |

Three resolved, four deliberately not. Forcing the last four would have been guessing.

---

## 8. Taxonomy corrections

- **Added:** Leica Geosystems — `uav`, `eco-payloads`, `uav-mapping` (BLK2FLY evidence).
- **Removed:** none. No sector assignment was found to be contradicted by its evidence.
- **Excluded from the Landscape:** Gamaya, Hemeria (plus AerialMetric on scope).
- **Derived categories:** `Multi-Sensor Detection` is not manually assigned anywhere — **0**
  occurrences. Correct.

### One unresolved taxonomy issue, flagged for decision

**35 verified companies carry `cuas-integrated` with no evidence URL on the assignment** —
Thales, Saab, Leonardo, Hensoldt, MBDA, Rheinmetall, QinetiQ, Indra, Terma, MARSS and others.
These are legacy assignments from the original catalogue, made before the evidence requirement
existed. They are almost certainly *correct* — these are the integrated C-UAS primes — but
they are unevidenced, and the standing rule is that Integrated requires explicit evidence.

More broadly, **199 of the UAV/C-UAS sector rows on verified companies carry no evidence URL**,
all legacy.

Stripping those tags would damage the dataset for a bookkeeping reason; leaving them means the
evidence rule is not actually enforced across the whole set. **This needs your decision** —
see §12.

---

## 9. Verification logic risk — severity **HIGH** (now mitigated)

### Can automated article linking promote a company into the verified Landscape?

**Yes, and it did — twice, and it did it again after being corrected.**

The sequence matters:

1. 2026-10-24: EOS and UP Innovations were found in the verified set on false article links.
   The links were deleted and both were returned to candidate.
2. 2026-10-25, less than a day later: the nightly pipeline had **re-created both sets of
   links**, and the recompute promoted both companies straight back into the verified set.

So the defect is not "some bad rows exist". It is that **row-by-row correction does not hold**,
because the thing producing the rows runs every night.

### Why a stricter matcher cannot fix the EOS case

The obvious fix — require the company name to appear in the extractor's resolved list — fails
here. The extractor **did** resolve "EOS" and it was right to: the articles print "EOS". The
collision is between two real companies that share a three-letter name. No string-matching
rule can separate a Ukrainian EOS from an Australian EOS Defence Systems.

### The change made

The smallest robust change, implemented:

- The rule is now a database view, **`v_landscape_verified`**, instead of SQL re-typed into
  every migration. One definition, one place to audit.
- **A linked article is corroborating evidence only.** It can no longer verify a company by
  itself. Verification now requires an own website, a product, or a non-directory source URL.
- The website test now also rejects portal and aggregator domains (`brave1.gov`, Wikipedia,
  Wikidata, LinkedIn, Crunchbase, `defence-blog`) as well as the two directories.
- A register table, **`article_company_false_matches`**, records every known bad pair so a
  recreated link is recognised rather than re-audited from scratch.

Backward-compatible: the rule only tightens. Cost: one false negative (Sky-Watch), recoverable
by recording a website or product.

### Not changed — recommended, needs approval

The linker itself still creates these links nightly and will keep doing so. Fixing it properly
means adding a confidence or entity-match score to `article_companies` and having the extractor
disambiguate same-name companies by country or domain. That changes the evidence model and the
nightly pipeline, so it is recommended here rather than done. Until then the links will keep
appearing on company pages; they just can no longer promote anyone.

---

## 10. Final working Landscape

| | Count |
|---|---|
| **Total verified** | **326** |
| UAV only | 140 |
| Counter-UAS only | 175 |
| Both | 11 |
| Candidate (classified but directory-only, or unclassified) | 608 |
| Needs review | 8 |
| Excluded | 8 |
| **Working edition total** | **950** |

### UAV taxonomy depth

| | Count |
|---|---|
| Platform leaf | 18 |
| Mission leaf | 17 |
| Ecosystem leaf | 40 |
| Bare `uav` root only | **85** |

### C-UAS capability distribution

| Group | Capability | Companies |
|---|---|---|
| Detection | RF Detection | 30 |
| | Radar | 32 |
| | EO/IR | 22 |
| | Acoustic Detection | 18 |
| Track / Identify | Sensor Fusion | 13 |
| | AI / Computer Vision | 15 |
| | Command & Control | 28 |
| Defeat | RF Jamming | 27 |
| | GNSS Jamming / Spoofing | 4 |
| | Interceptor UAV | 34 |
| | Kinetic | 25 |
| | Directed Energy | 9 |
| Integrated | Integrated / Multi-Layer | 54 |

### Geography

Ukraine 47 · United Kingdom 42 · France 39 · Poland 27 · Germany 24 · Switzerland 16 ·
Czech Republic 12 · Estonia 12 · Norway 12 · Italy 11 · Spain 11 · Denmark 9 · Belgium 8 ·
Netherlands 8 · Sweden 8 · Latvia 7 · Romania 6 · Austria 5 · Turkey 5 · Bulgaria 3 ·
Finland 3 · Greece 2 · Hungary 2 · Lithuania 2 · Portugal 2 · Slovenia 2 · Croatia 1 ·
Cyprus 0 · Ireland 0 · Luxembourg 0 · Malta 0 · Slovakia 0

### QA

| Check | Result |
|---|---|
| V1 entries | **273**, unchanged, untampered |
| Duplicate normalised company names | **0** (was 1; ArianeGroup merged) |
| Alias collides with another company name | 1 — `KNDS France`, pre-existing |
| Broken redirects | **0** |
| Self relationships | **0** |
| Orphan sector assignments | **0** |
| Invalid `company_sector_products` | **0** |
| Verified companies outside `is_landscape_scope` | **0** |
| Portal URL as a company website (verified set) | **0** (was 4) |
| Manually assigned derived category | **0** |
| Duplicate domains within the verified set | 9 parent/subsidiary pairs — flagged, §4 |
| UAV/C-UAS sector rows without an evidence URL | **199** legacy — flagged, §8 |

---

## 11. V2 decision

NOT READY FOR DATASET V2 SNAPSHOT

The dataset is now materially more defensible than it was this morning, and nothing found
here is unfixable. But two blockers remain, and both are about the verified subset itself:

1. **The article linker still manufactures false evidence every night.** The rule change stops
   it promoting companies, which was the dangerous part. But the underlying defect is live, it
   has already demonstrated that it re-creates deleted links within a day, and no one has
   measured how many wrong links exist outside the 330 I audited. Freezing V2 on top of a
   pipeline that is actively producing bad entity links means the next audit starts from the
   same place. This needs the §9 recommendation accepted or explicitly deferred.

2. **35 `cuas-integrated` assignments have no evidence**, against a standing rule that
   Integrated requires explicit evidence. Integrated is the single largest C-UAS category at
   54 companies, so two-thirds of the biggest category in the Landscape rests on unevidenced
   legacy tags. Either backfill the evidence or formally accept legacy assignments — but it
   should be a decision, not an oversight carried into a frozen artefact.

Neither needs much work. What neither should get is a snapshot on top of it.

Not blockers: the 85 bare-root UAV companies (coarse, not wrong), the nine parent/subsidiary
domain pairs (an editorial question), Sky-Watch (recoverable), and the four held review cases.
