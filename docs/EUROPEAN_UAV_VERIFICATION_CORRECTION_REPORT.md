# European UAV & Counter-UAS Landscape — verification and correction pass

2026-10-23. Source: `uav360_europe_uav_cuas_low_confidence_research_pass_2026-10-23.xlsx`
(Verification Results, 107 rows — a follow-up on the directory-backed candidates from
[the expansion pass](EUROPEAN_UAV_LANDSCAPE_REPORT.md)).

No broad import. **No snapshot taken.** No company was published or unpublished.

---

## 1. Before

| | |
|---|---|
| Companies in the database | 2,446 |
| European discovery universe | 946 |
| Carrying a UAV or C-UAS classification | 355 |
| Of those, resting on a directory listing alone | 103 |
| Countries present | including both `Czechia` and `Czech Republic` |

## 2. Reconciliation before mutation

All 107 workbook rows were matched against `companies`, aliases, products, sectors,
`company_sectors`, `landscape_candidates` and publication status before anything was
written. That reconciliation found **four things the workbook did not know**, each of
which changed how its recommendation was applied:

1. **Perennial Autonomy is already in UAV360** — US, live, and it already owns MEROPS as
   a product. So Project Eagle and Merops Project were merges, not deletions.
2. **A MEROPS product was already orphaned** (`Merops AS-3 Surveyor`, no owner).
3. **`DEFTECH` in our database is Malaysian**, not Slovak. The previous expansion pass had
   matched the Slovak candidate to it — a wrong match that had to be reversed.
4. **`Renegade UxS` was recorded as United States.** The workbook says Danish; Janes and the
   company's `ApS` legal form confirm it.

## 3. How the workbook's outcomes were applied

Its 107 outcomes are research recommendations. Two were not followed as written:

- **Confidence was recalculated from the evidence hierarchy, not copied.** The workbook
  marks several rows "High" whose only evidence is `defencejobs.org` — the same class of
  specialist directory that made them low confidence in the first place. The rule used
  here: `high` = the company's own site, a government or procurement source, or Janes;
  `medium` = credible industry or press coverage naming the company and its UAV role;
  `low` = a directory, atlas or personal profile only. Six rows the workbook called "High"
  stayed `low`.
- **UNWAVE's C-UAS claim was not acted on.** The workbook describes EW, drone detection and
  licensed interceptor production, but the source is a community miltech map. Per the
  C-UAS protection rule, no C-UAS leaf was inferred. It stays a UAV ecosystem company and
  is flagged for a dedicated C-UAS evidence check.

## 4. Corrections applied

| | |
|---|---|
| Entities merged | **3** |
| Entities excluded from the aerial Landscape | **1** |
| Companies converted to products | **2** |
| Bad matches reversed | **1** |
| Aliases added | **4** (`Project Eagle`, `Merops Project`, `ETER`, `MaXon`) |
| Aliases removed | **1** (`DefTech` off the Malaysian company) |
| Official websites verified and stored | **2** |
| Confidence upgraded | **13** (7 → `high`, 6 → `medium`) |
| Countries corrected | **4** |
| Sector assignments added | **16** |
| Sector assignments removed | **2** |
| Slug redirects created | **3** |
| Products created | **1** |
| Companies created | **0** |
| Companies published or unpublished | **0** |

### Confidence, in detail

- → `high`: Civitanavi Systems (own site), DefendEye (own site), CAFA Tech (official Estonian
  defence portal), Cloudless (Polish Space Agency catalogue), Revobeam (Polish government
  defence portal), Falcons (Janes), MaXon Systems (Brave1), Renegade UxS (Janes).
- → `medium`: Dilectro (official MSPO exhibitor record), FREEUA, Futurology, RadioBird, BOXO,
  Farmfleet (Commercial UAV Expo coverage), UNWAVE, Black Forest Systems (Militarnyi + tech.eu).
- stayed `low` despite a "High" recommendation: Archangel Imaging, Domo Tactical
  Communications, BZB UAS, Centaurium UAS, Trypillian, UA Dynamics. Directory or personal-
  profile evidence only.

### Countries

| Company | Was | Now | Why |
|---|---|---|---|
| Renegade UxS | United States | **Denmark** | Janes names it a Danish company; legal form is `ApS`; production roles advertised in Denmark. The US value came from US programme coverage. |
| Black Forest Systems | *(empty)* | **Estonia** | HQ Tallinn with a Kyiv engineering team. A null filled, not a value overridden. |
| MaXon Systems | *(empty)* | **Ukraine** | Brave1, the Ukrainian government defence-innovation programme, names it directly. |
| ERA | Czechia | **Czech Republic** | The value the `countries` reference table carries. One product row normalised too. |

## 5. The critical cases

### Project Eagle — merged into Perennial Autonomy

Imported as an independent Ukrainian company from the Ukrainian drone directory. US Army
sources identify the developer as **Perennial Autonomy** (formerly Project Eagle), a US
firm already in UAV360. Merged into it, which keeps the directory source URLs, adds
`Project Eagle` as an alias and leaves `/companies/project-eagle/` redirecting. **No
European company record exists for a US company.** The `uav` assignment the merge carried
over had the Ukrainian directory as its evidence; it was re-sourced to the two US Army
articles and raised to `high`.

### MEROPS — was never a company

Merged into Perennial Autonomy the same way. **No new product was created**: MEROPS already
existed, three times over — `Merops` (Counter-UAS), `AS-3 Merops` (UAV) and
`Merops AS-3 Surveyor` (UAV), the last of which had **no owner at all**. The orphan was
reassigned to Perennial Autonomy. The three rows are left as they are and flagged in §8:
deciding whether they are one system or a platform-plus-system family needs a product-level
pass, not a guess here.

### ETER — now a product of Falcons

Janes identifies Eter as the SIGINT/RF-detection system built by Ukrainian company
**Falcons**. Both had been imported as separate companies from the same directory. A single
product `Eter` (Counter-UAS, draft) was created under Falcons — after checking that no Eter
product existed anywhere — and the ETER company was merged into Falcons, which carried the
`ETER` alias and the source URLs across.

### Falcons — classification corrected

Given `cuas-det-rf` at `high` confidence on the Janes source, and a real description. This is
one of the few C-UAS changes this pass permits: it resolves an entity/product relationship
rather than inferring a capability.

### MaXon Systems — entity matched, not duplicated

The previous pass left `MaXon` in entity review and never imported it, so there was nothing
to merge — only an incomplete record to finish. Brave1 confirms a Ukrainian manufacturer with
a combat-tested autonomous interceptor. Country set to Ukraine, `MaXon` added as an alias,
`cuas-def-interceptor` assigned at `high`. **No second MaXon record exists.**

### Hard Cat — out of the aerial Landscape, still in UAV360

Evidence describes river and maritime unmanned surface vessels. The `uav` assignment was
removed and the Landscape row set to `excluded` with the reason recorded. **The company was
not deleted** — UAV360 covers unmanned systems more broadly than this Landscape does.

### DefTech — a bad match, reversed

Not one of the workbook's named cases, but the reconciliation caught it. The previous pass
had matched the candidate "DefTech (Slovakia)" to `DEFTECH`, a **Malaysian** company, and
added a `uav` assignment, an alias and a source URL to it. All three were removed. The
workbook could not establish a clean Slovak entity either, so nothing replaces it and no
Slovak DefTech was imported.

## 6. Remaining unresolved

**80 companies** are in scope and classified but rest on directory evidence alone or have an
unresolved identity. All are `draft`, all are `low` confidence, all stay internal candidates
and none is eligible for Dataset V1.

| Country | n | Companies |
|---|---|---|
| Ukraine | 57 | Asterion Group, Atarna, Awedyne, BeesAgainstMines, BeetechUA, Beker & Co., Bluebird Ukraine, Bulba, Celebra LLC, ComBat Vision, Drone-Spices, EOS, Escadrone, First Contact, First Parsec, Fulltime Robotics, Global Mark, GRIF, Huless, Iron Cluster, Ironflight UA, Kray Technologies, Mantis Analytics, NORDA Dynamics, Octopus Project, Offset Labs, Pastka, Pegasus Arms, PRO drones, R-G. ai, Realgold, RIY Drone Project, Ruevit, SkRIPer, SKYD, SMART UAV TECHNOLOGY, Tactical Technologies, TargetAI, TarGun, Tekhnary, Tenebris, Terminal Autonomy, Triada Robotics, Triada Trade, Tritel Electronics, **Trypillian**, Twist Robotics, **UA Dynamics**, Ukropter, UMO UA, UP Innovations, Varangians, VARDIAN, Vidar Systems, Vinnytsia Avionics, VisionMap Analytics, WARMAX |
| Poland | 5 | BZB UAS, Prometheus UAV, RB Defence, RBL Defence Polska, SoftBlue |
| Denmark | 2 | Sapient Perception, Sky-Watch |
| Estonia | 2 | **Deftak**, Skycorp Technologies |
| France | 2 | Rift, Skydrone Robotics |
| Germany | 2 | Donaustahl, WARGdrones |
| Lithuania | 2 | Baltic Viper, PDKINEMATICS |
| Romania | 2 | BraveX.Aero, Orbotix |
| United Kingdom | 2 | Drone Band, **VulcanUAV** |
| Czech Republic | 1 | siliXcon |
| Netherlands | 1 | Zephro |
| Spain | 1 | SCR Sistemas de Control Remoto |
| Switzerland | 1 | Centaurium UAS |

**Bold** = flagged `needs_review` rather than plain `candidate`:

- **VulcanUAV** — the UK market review confirms products, but Companies House surfaced a
  *dissolved* VULCANUAV LIMITED. The current trading entity is unknown.
- **Deftak** — an Estonian legal entity with Ukrainian founders and operations. The evidence
  URL points at a differently-branded site (`darkstar.ee`), so the brand relationship is
  unestablished. Its country was **not** changed: the Estonian registration is real, and
  nothing here justifies rewriting it in either direction. See §9 on the schema limit.
- **Trypillian** — the only evidence is an individual's recruitment profile.
- **UA Dynamics** — a second directory page is still a directory page.

## 7. Publication review — the seven live externally-researched companies

None has a website, none has a product, five rest on a single startup-list URL. Nothing was
changed; these are recommendations.

| Company | Country | Evidence | Recommendation |
|---|---|---|---|
| OVES Enterprise | Romania | Startup list **plus** a linked news article | **KEEP LIVE** |
| EGIDE | France | tech.eu coverage of a named €8M seed round | **KEEP LIVE** |
| OSIRIS AI | Ukraine | A Wikipedia article about the *product* OSIRIS UEB-1 | **NEEDS DECISION** — the company-to-product link is inferred, not sourced |
| ALX Systems | Belgium | One startup-list URL | **MOVE TO DRAFT** |
| Delian Alliance Industries | Greece | One startup-list URL | **MOVE TO DRAFT** |
| Qognifly | Romania | One startup-list URL | **MOVE TO DRAFT** |
| Sensrad | Sweden | One startup-list URL | **MOVE TO DRAFT** |

Four MOVE TO DRAFT plus one NEEDS DECISION is a publication decision, which project rules
reserve for you. Say the word and it is one statement.

## 8. QA

Run after all mutations.

**Clean — and specifically checked because this pass merges:**

| Check | Result |
|---|---|
| Duplicate normalised company names | **0** |
| Orphan sector assignments | **0** |
| Invalid `company_sector_products` rows | **0** |
| Directory URLs stored as a company website | **0** |
| Draft companies reachable publicly | **0** |
| Non-European rows in the European Landscape | **0** |
| C-UAS assignments lost during the merges | **0** — 475 before, 475 after |
| Aliases lost during the merges | **0** — all three merged names survive as aliases |
| Evidence URLs lost during corrections | **0** — every update unions into `source_urls` |
| Maritime company left in the aerial Landscape | **0** |
| MEROPS products without an owner | **0** (was 1) |

**Pre-existing issues, not created by this pass:**

| Issue | Count | Note |
|---|---|---|
| Products with no company | 950 | Catalogue-wide; the MEROPS orphan was the one in scope here |
| Groups of companies sharing a website domain | 43 | Some are genuine subsidiaries |
| UAV/C-UAS sector rows with no evidence URL | 418 | Mostly original catalogue records |
| Product and company sharing a name | 37 | The same class of error as ETER and MEROPS — worth a dedicated pass |
| MEROPS held as three product rows | 3 | One system family, three records |
| Alias colliding with another company's name | 1 | `KNDS France` is both an alias of KNDS and a company |
| Country value absent from the reference table | 1 | `European Union`, on BraveTech EU |

## 9. An architectural gap, reported rather than migrated

Two distinctions the data model cannot currently express:

1. **Country is one field.** `hq_country` cannot separately record legal registration, HQ,
   founding origin and operating country. Deftak (Estonian entity, Ukrainian founders and
   operations), Black Forest Systems (Tallinn HQ, Kyiv team) and Renegade UxS (Danish
   company, production lines in Ukraine) are all compressed into a single value. Nothing was
   falsified to make a company European; where the model could not hold the nuance it was
   written down here instead.
2. **"Verified" and "publishable" are the same column.** `landscape_candidates.status`
   carries one state. This pass maps *discovered → `candidate`*, *evidence-verified →
   `included`*, *identity unresolved → `needs_review`*, *not in this Landscape → `excluded`*,
   and leaves publication entirely to `companies.publication_status`. That works, but a
   company cannot currently be recorded as verified-but-not-yet-publishable except by
   reading both tables together. Fixing it properly is a migration for its own session.

## 10. After

### A. Discovery universe

**946** companies — every European-HQ company in UAV360, verified or not. This number should
never be presented as a count of verified companies.

| Status | Count |
|---|---|
| Evidence-verified (Dataset V1) | **274** |
| In scope and classified, directory evidence only | 76 |
| Identity review | 4 |
| In scope, no UAV/C-UAS classification yet | 591 |
| Excluded (maritime) | 1 |

### B. Verified European Landscape — Dataset V1

**274 companies.** Verified means European HQ, a UAV or Counter-UAS classification, and at
least one piece of entity evidence that is not a bare directory listing: an own website, a
product, a linked news article, or a non-directory source URL on the company or on one of
its sector assignments.

`confidence` is deliberately **not** the gate. It was never maintained on the original
catalogue records — 101 of them are `low` confidence yet live, with websites, products and
news coverage. Gating on it would have cut the verified set to 145 and dropped some of the
best-evidenced companies in the catalogue.

| | Count |
|---|---|
| UAV only | 97 |
| Counter-UAS only | 167 |
| Both UAV and C-UAS | 10 |
| Ecosystem suppliers with no platform or mission leaf | 17 |
| Carrying a platform or mission leaf | 4 |
| Carrying only the bare `uav` root tag | 76 |

That last row is a real weakness, though not a correctness one: 76 verified companies are
tagged `uav` and nothing more specific. The expansion pass could only map a Landscape-layer
string to a leaf where the string named a role. Refining those is enrichment work, and §17 of
the brief is explicit that enrichment does not block V1.

---

## READY FOR VERIFIED EUROPEAN LANDSCAPE SNAPSHOT: YES

The verified subset stands on its own. The six critical entity errors are fixed, no
non-European company is counted as European, no maritime company sits in an aerial
Landscape, no merge lost a C-UAS assignment, an alias or an evidence URL, and the 80
unresolved directory discoveries are fenced outside Dataset V1 as internal candidates
where they belong.

Two things to settle alongside the snapshot — neither blocks it:

- **The publication decision in §7.** Four companies are live on evidence that would not pass
  the verified-subset bar. They are live today regardless of whether a snapshot is taken, so
  this is a standing issue, not a snapshot blocker.
- **Thin taxonomy on 76 verified companies** (§10B). Correct, just coarse.

Missing maturity and incomplete product catalogues are **not** treated as blockers.
