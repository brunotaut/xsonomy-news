# Batch 07 reconciliation — first mixed VERIFY / ENRICH batch

Date: 2026-10-27
Input: `research-agent/researched/batch-07-researched.csv`
Output: `research-agent/reconciled/batch-07-reconciliation.csv`
Queue produced: `research-agent/queue/batch-08.csv`

## Headline

Verified **463 → 478 (+15)**. The enrichment experiment worked: the 29 ENRICH rows produced
10 admissions and 3 duplicate resolutions, against 5 admissions from the 11 VERIFY rows.

| Outcome | Count |
|---|---|
| Admitted to landscape | 15 |
| Merged into an existing record | 5 |
| Excluded | 11 |
| Held for review | 1 |
| Declined, insufficient evidence | 8 |
| **Total** | **40** |

## Input validation

40 rows, all matching the queue, no extras. Three rows (Aerotechnika, Fincantieri, Babcock) carried
a stray empty 15th column; the fields either side still lined up, so nothing was misattributed —
unlike the Batch 03 comma problem. Dropped the empty column and proceeded.

## What the research got wrong, and I corrected

**Three of the "new" companies were duplicates of companies already verified in the landscape.**
ChatGPT flagged PGZ/Polish Armaments Group and Vyriy/Vyriy Industry as internal duplicate pairs but
did not check them against the existing database:

- **Center of Unmanned Technologies** is the legal entity behind **General Cherry**, which has been
  verified since an earlier batch with four products and four taxonomy leaves. Merged, not admitted.
- **PGZ** and **Polish Armaments Group** are both **Polska Grupa Zbrojeniowa**, verified, with the
  SAN CUAS product. Three records collapsed into one.
- **Vyriy** and **Vyriy Industry** merged.
- **Heavy Shot** is a Gurzuf Defence product line, not a company. Merged, with Ayudag and Ayudag-6
  moving across and "Heavy Shot" kept as a brand alias.

Had I imported the verdicts as given, the landscape would have gained three phantom companies and
split two real ones.

**Two product records were attributed to the wrong owner:**

- **TerMit** sat on Quantum Systems, categorised as Counter-UAS. It is Tencore's unmanned ground
  vehicle. Reassigned and recategorised.
- **Motor-G** sat on Quantum WIY Industries as an Effector. It is the motor inside the SPYS
  interceptor — a component. Recategorised. SPYS itself belongs to WIY Drones and was deliberately
  *not* created, since no record currently claims it and guessing would invent ownership.

## Admissions (15)

Frontline Robotics (Linza, Zoom), Quantum WIY Industries (Quantum Systems / WIY Drones JV),
Odd Systems (Kurbas thermal payloads), Shield Systems (Shield X SkyBlock), Ukrainian Armor
(counter-UAS module), Gurzuf Defence, Apian (NHS-confirmed BVLOS medical delivery),
TAF Industries (Kolibri family), F-Drones (F7 LITAVR, confirmed by the Ukrainian MoD),
Greentech Harvest, Vyriy Industry, Greenjets (LCADE, UK MoD contract), Marshall Land Systems
(containerised Falcon Shield), The Fourth Law (TFL-1, Lupynis, Zerov-8), Steyr Motors (M12 power unit).

Fourteen new products were created and 23 taxonomy rows added, every one carrying its evidence URL.

## Exclusions (11)

Ground only: DevDroid, ARX Robotics, Tencore. Maritime: MSubs, Rheinmetall Naval Systems.
Not UAV/C-UAS: Archer-LPP (optoelectronics), T-Mobile Czech Republic (telecom), Vantor (US
satellite imagery), Avtrain (pilot training). Not companies: Avengers Labs (a Ministry of Defence
platform), Lasar's Group (a National Guard unit).

Five countries were wrong in the queue and are now fixed: ARX Robotics → Germany, Archer-LPP →
Czech Republic, Vantor → United States, Brigantes → United Kingdom, Gurzuf Defence → Ukraine.

## Declined (8)

Aerotechnika, Fincantieri, Babcock International, Teledyne Qioptiq, Brigantes Consulting,
Marlborough Communications, Roboneers, Grim Tech.

Three of these are worth naming. **Fincantieri** was returned IN_SCOPE on the strength of EU Drone
Alliance membership — membership of a consortium is not a capability, and the group is already in
the landscape through IDS (Fincantieri NexTech). **Marlborough Communications** resells Skydio
aircraft; the platform belongs to Skydio. **Roboneers**' only aerial claim comes from partner ARX
Robotics' own news page.

**Meta Bureau** was held for review rather than admitted: its sole evidence is an AUSA exhibitor
self-description with no website. That is the same standard applied to the Ukrainian directory
listings in Batch 06.

## Landscape after Batch 07

| | Before | After |
|---|---|---|
| Verified | 463 | **478** |
| UAV only | 249 | 257 |
| C-UAS only | 181 | 186 |
| Both | 33 | 35 |
| Candidates | 451 | 419 |
| Needs review | 35 | 36 |
| Excluded | 50 | 61 |

Rows 999 → 994, the difference being the five merges. QA clean: V1 = 273 and V2 = 358 unchanged,
zero verified companies failing the eligibility rule, zero redundant unevidenced parents, and
**zero publication changes**.

## Two things for Nazar

**1. The research queue is now empty of leads.** Of 342 never-researched candidates, *none* score
above the P4 floor, and 214 have no description, website or product at all. Batch 08 is therefore
a pure 40-row enrichment pass, no VERIFY rows. On this batch's evidence that is the better use of
the effort anyway.

**2. Excluded companies are live on the public site.** All 12 companies this batch excluded or held
— including T-Mobile Czech Republic, MSubs (submarines) and Vantor (US satellites) — are currently
`publication_status = live`, so they are on xsonomy.com now. Across the whole landscape **68
excluded or needs-review companies are published**. Nothing in the verification work changes
publication, and I have not touched it: which rows are public is your decision. But the two states
have drifted apart, and the catalogue is showing companies the landscape has judged out of scope.
Say the word and I will prepare the list and the change.

## Boundaries honoured

V1 (273) and V2 (358) untouched. No V3. No publication status changed by me. No ChatGPT verdict
imported without an independent check — three would have created phantom companies. No product
ownership assigned without a source naming the owner; SPYS was left unassigned for exactly that
reason.
