# Batch 15 reconciliation — European UAV & Counter-UAS Landscape

Reconciled 2026-10-28. Input: `research-agent/researched/batch-15-researched.csv` (40 rows,
the final enrichment batch). Output: `research-agent/reconciled/batch-15-reconciliation.csv`.

**Verified 533 → 537.** Landscape rows unchanged at 977; no merges this batch.

| | Batch 12 | Batch 13 | Batch 14 | Batch 15 |
|---|---:|---:|---:|---:|
| Admitted | 6 | 11 | 9 | **4** |
| Excluded | 23 | 19 | 15 | **30** |
| Held for review | 9 | 5 | 12 | **6** |
| Merged | 2 | 5 | 4 | **0** |

Four admissions from forty rows is the lowest rate of the run, and it is the right shape for a
final batch: the queue was down to the weakest-scoring records in the backlog, and most of them
turned out to be customers, universities, shipyards or publications.

**Enrichment is finished. No company in the backlog has an empty description.**

## Admitted (4)

| Company | Country | Why |
|---|---|---|
| **Heliguy** (Colena Ltd) | United Kingdom | drone and layered counter-UAS integration, training and repair |
| **Restube** | Germany | AUTOMATIC 75 rescue float with an attachment designed for drone deployment |
| **SBG Systems** | France | Quanta Micro inertial navigation developed for UAV payloads |
| **Avio Aero** | Italy | Catalyst 1300-ED1, a named engine variant under contract for the Eurodrone |

Three products created, six taxonomy rows added.

Avio Aero is the clean case for the Batch 13 rule: a named engine variant built for one specific
UAV programme is the Turkish Engine Industries pattern, not the Rotax pattern. Restube is the
interesting one — a water-rescue company that sells into several markets, but the AUTOMATIC 75 has
a drone attachment and is marketed for drone deployment, so the purpose-built test is met even
though drones are not its main business.

Avio Aero's country was kept as **Italy** despite the GE Aerospace parent, and its recorded domain
`avioacro.it` was a typo, corrected to `avioaero.com`.

## Two product-ownership corrections

**INTEGRAL E** was recorded under **Safran Electrical & Power**. It is an **AURA AERO** crewed
trainer, and Aura Aero already has its own record. Moved.

**Ricardo** was in this landscape because an article mentioned *Ricardo Mendes* — the chief
executive of TEKEVER. A person, not the engineering consultancy. Nothing was ever attached to it,
and it is now excluded with the reason written down so it does not come back.

## EE was excluded to avoid counting BT twice

**EE** came back as a hold. It is BT Group's mobile network, and the drone-specific product —
Drone SIM — belongs to **BT**, which was admitted last batch. Rather than hold it or create a second
record for the same product, EE was excluded with the allocation written into the note. One product,
one owner.

## Excluded (30) — the largest of the run

The composition says where the queue had got to:

- **End users**: Synnovis (the pathology lab in the Apian trials), Enedis, Téréga, VINCI.
- **Universities**: Rzeszów University of Technology, University of Porto.
- **Crewed aviation**: AirTanker, ATR, Martin-Baker, Dowty, CFM International, ADAC Luftrettung.
- **Shipyards**: Cammell Laird, Van der Valk, Exail Robotics Belgium.
- **Investors and publications**: Porsche SE (the Quantum Systems investor), Calibre Defence.
- **Non-European**: Silynx (Israel), Firecrest Aerospace and HALO Aeronautics (both United States).

Three country corrections, all of them moving a record out of Europe and therefore out of the
landscape view: **Silynx → Israel**, **Firecrest Aerospace → United States**, **HALO Aeronautics →
United States**.

## Held for review (6)

BMT Global (SPARO is a co-developed demonstrator), Marshall Aerospace (it certifies other people's
aircraft — the Extera it assessed is Flarebright's), DSV, INECO and Sopra Steria. The last three
are operator-and-services cases, which takes that open decision to **eleven companies**.

**Safran Electrical & Power was moved from excluded to held** after a concurrent supplementary
review found a 2020 Safran announcement: it manufactured the wiring harness for the XSun SX 1.2
pre-series drone. That is historical UAV-specific work at this exact subsidiary, which is more than
a categorical exclusion allows. The INTEGRAL E correction stands.

## The external audit, checked against the live database

A side audit of three public market maps ran alongside this batch. Its eight candidates were
checked against the live database by name and alias:

| Candidate | Result |
|---|---|
| Fly4Future, BizGarden, GINA Software, 42 Solutions, Adevex, AURYN Aero | **genuinely absent** — six real coverage gaps |
| Aeronautica SDLE | absent, but the entity itself is unresolved |
| **Drone Band** | **already in the database, already verified — and not published** |

Drone Band is the finding that matters. The audit flagged it as a company missing from the public
site, and it is: it is just not missing from the landscape. It is verified and sitting in `draft`.

No companies were created. That is a next-phase decision, not a reconciliation one.

## QA gate

| Check | Result |
|---|---|
| `included` rows failing the eligibility rule | **0** |
| Publication status written by this batch | **none** |
| V1 frozen snapshot | **273** |
| V2 frozen snapshot | **358** |
| Redundant unevidenced parent sectors | **0** |
| Backlog records with no description | **0** |

## The publication mismatch — and a correction to how I have been reporting it

For five batches I reported a growing number of companies the landscape had rejected that were
"live on xsonomy.com", and described it as the project's largest data-quality problem. A concurrent
check of the live site, run in parallel with this batch, shows **that framing was wrong**.

The public landscape page at `xsonomy.com/data/landscape.json` contains **exactly 375 companies** —
the verified-and-live set. Of 253 excluded and needs_review records checked against it, **zero were
present**. The landscape gate requires both `included` membership and `publication_status = live`,
and it works.

What `publication_status = live` actually governs for those records is the **wider site catalogue**,
about 2,300 companies and not scoped to this landscape. Being out of scope for a European UAV and
counter-UAS landscape is not a reason to unpublish a real company from a site-wide catalogue.
Dearsan is a genuine shipbuilder; Siemens is a genuine software company.

So the number splits in two:

| | Count |
|---|---:|
| Verified and on the landscape page | 375 |
| **Verified but NOT on the landscape page** | **158** |
| Out-of-scope records live in the wider catalogue | 292 |
| — of those, non-companies and extraction errors | about 21 |
| — of those, legitimate companies in other industries | about 271 |

**The real, one-sided gap is the 158.** Those companies passed the eligibility rule and do not
appear on the landscape page at all. The audit found one of them from the outside without knowing
it: **Drone Band**, flagged as a missing company, is verified in the database and sitting in draft.

The roughly 21 extraction errors — a procurement platform, publications, NGOs, an accelerator, two
universities, a grenade launcher — are wrong in any catalogue and are worth removing on their own
merits. The other 271 are not a problem to fix.

I was wrong to frame the growing number as companies wrongly on the public site, and I should have
checked what the landscape page actually renders before reporting it five times.

## Where the run ends

Fifteen batches. **Verified 273 → 537.** Backlog 634 → 119. Blank records 453 → 0.

There is no Batch 16 queued, because there is no enrichment work left and the next phase is a
decision rather than a default. The options are written up in
**`research-agent/decisions/batch-15-next-phase.md`**:

1. **Publish the 158 verified companies missing from the landscape page.** My recommendation:
   one-sided, needs no further research, and every record already passed the eligibility rule.
2. **Remove the roughly 21 entity-extraction errors** from the wider catalogue. Wrong in any
   catalogue, not merely out of this landscape.
3. **Merits verification** of the remaining 119, all of which now have descriptions.
4. **Discovery** — the six companies the external audit showed are genuinely missing.

No bulk unpublish. The concurrent scope check is explicit that the 292 is not a list to act on.

The backlog is listed with its evidence in `research-agent/queue/backlog-post-batch-15.csv`.

`STATE.json` is set to `AWAITING_HUMAN_DECISION`, not to another research batch.
