# Batch 08 reconciliation — first pure enrichment batch

Date: 2026-10-27
Input: `research-agent/researched/batch-08-researched.csv`
Output: `research-agent/reconciled/batch-08-reconciliation.csv`
Queue produced: `research-agent/queue/batch-09.csv`

## Headline

Verified **478 → 485 (+7)**, and — the actual point of an enrichment batch — **33 of the 40 blank
records now have a description and 30 have a website.** Sixteen records were cleared out as
definitively not belonging.

| Outcome | Count |
|---|---|
| Admitted to landscape | 7 |
| Excluded | 16 |
| Held for review | 11 |
| Declined, stays a candidate | 6 |
| **Total** | **40** |

## Input validation

40 rows, clean — no field shifts, every evidence cell a URL, commas properly quoted. One UUID
(CiS) was missing its last character; same company, matched by name.

## Admissions (7)

**Novadem** (NX70, NX160 micro-UAVs) and **Aviation Design** (aerial target drones) are
straightforward French UAV manufacturers. **Cyberhawk** and **Airspection** are UK drone inspection
operators, classified like Manna. **Lendurai** (Estonia) builds autonomy software that UVision has
publicly integrated. **Dares Technology** (Spain) supplies the airborne SAR that goes into Indra's
Tarsis UAVs. **WZL-2** is the PGZ aerospace works that produces and integrates UAVs.

Three products and nine taxonomy rows added, each with its evidence URL.

## Two declines worth explaining

**Grupo Oesía** came back IN_SCOPE because it owns UAV Navigation. But **UAV Navigation is already
verified in the landscape as its own record**, holding exactly the capability cited. Admitting the
parent would have counted the same autopilot business twice. Declined, with the parent relationship
recorded instead.

**Skyports Infrastructure** is the vertiport arm, while the already-verified **Skyports** record
covers drone services. Excluded as infrastructure, with the relationship recorded, rather than
creating a second Skyports in the landscape.

Also declined: **SensusQ** (intelligence software, relevant only through its acquisition by Quantum
Systems), **MBDA Italia** (no Italian-specific UAV product; MBDA group is already verified),
**Alloyed** (turbojet programme not evidenced as UAV propulsion), **FLANQ** (its confirmed unmanned
product is a surface vessel; ORKA UAS is a portfolio listing only).

## Exclusions (16)

The enrichment pass did its clearest work here. Maritime: WASS, GABLER, ThyssenKrupp Marine Systems,
Couach, Diades Marine, Graal Tech, Remazel, SEAir, WSense, Next Geosolutions. Not UAV/C-UAS:
DNV Cyber (cybersecurity), Dedienne Aerospace (maintenance tooling), European Air Transport Leipzig
(a DHL cargo airline), Skyports Infrastructure. Not a manufacturer: Odense Robotics (an industry
cluster). And **LPP Holding, a fashion retailer** — Reserved, Cropp, Sinsay — which had been sitting
in the UAV backlog on the strength of an article co-occurrence.

Two countries corrected: Next Geosolutions and WSense are both Italian, not French.

## Held for review (11)

Six are entity-resolution failures where the researcher correctly refused to guess: **Dronery**,
**Tulip Tech**, **CiS**, **Defcomm**, **Telson**, **Unmanned Technologies** — generic names and
article artefacts with no identifiable legal entity. **Rheinmetall Kraken** appears to be a
composite of two companies that both already have their own records.

The other five are genuine judgement calls: **WITU** (a state military research institute that
co-develops the Pchła nano UAV — are institutional developers in scope?), **AndroMach** (a
suborbital hypersonic demonstrator, at the edge of what counts as a UAV), **Asfat** (the ANKA-3
belongs to Turkish Aerospace, not to it) and **Dynamit Nobel Defence**.

## TDW and the open warhead question

**TDW** supplies the warhead for STARK's Gambit loitering munition. This is the third company to
raise the warhead-supplier scope question, after EURENCO and Odin Defence in Batch 04. I have not
decided it — TDW is held at the same conservative default, a candidate with no taxonomy — and I have
added it to `decisions/batch-04-warhead-supplier-scope.md`.

TDW does change the balance: unlike the other two, its drone warhead is a **delivered, named
product**. If you pick option 3 (case by case), it admits TDW and still excludes the other two.
This has now cost two batches; it is worth five minutes of your time to settle.

## Landscape after Batch 08

| | Before | After |
|---|---|---|
| Verified | 478 | **485** |
| UAV only | 257 | 264 |
| C-UAS only | 186 | 186 |
| Both | 35 | 35 |
| Candidates | 419 | 385 |
| Needs review | 36 | 47 |
| Excluded | 61 | 77 |

QA clean: V1 = 273 and V2 = 358 unchanged, zero verified companies failing the eligibility rule,
zero redundant unevidenced parents, zero publication changes.

## Did enrichment work?

Yes, on both counts that matter.

- **Backlog records with nothing on file: 214 → 164.** Fifty records went from blank to assessable
  in one batch.
- **Yield.** 7 admissions and 16 clean exclusions from 40 blank records. Compare the last pure
  verification batches: 9, 7. Enrichment is removing more wrong rows than verification ever did,
  and the exclusions are permanent — a fashion retailer will not come back.

Batch 09 is another 40-row enrichment pass, with one instruction added: say UNRESOLVED rather
than guessing when the legal entity cannot be identified. Six rows in this batch needed that and
the researcher handled them well; making it explicit should keep it that way.

## Still waiting on you

1. **The warhead question** — now three companies deep.
2. **95 excluded or needs-review companies are live on xsonomy.com** — up from 68 after Batch 07,
   because this batch excluded 16 more and held 11. LPP Holding, the fashion retailer, is on the
   public UAV catalogue right now. I have not touched publication status; it is your call, and
   I can prepare the unpublish list whenever you want it.
