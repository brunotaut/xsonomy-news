# Batch 06 reconciliation — Ukraine directory verification pass

Date: 2026-10-27
Input: `research-agent/researched/batch-06-researched.csv`
Output: `research-agent/reconciled/batch-06-reconciliation.csv`
Queue produced: `research-agent/queue/batch-07.csv`

## What this batch was

Batch 06 was not a general research batch. It was a dedicated second pass over the 43 Ukrainian
companies that were tagged `uav` purely because they appeared in a Ukrainian drone directory and
had no other evidence — the "classified but unverified" block that had sat at 43 records for
three batches.

## Input validation

44 data rows against a 43-row queue. The extra row is **GRIF**, which I moved to `needs_review`
during Batch 05; the researcher returned a NEEDS_REVIEW verdict for it, which confirms that
decision rather than changing it. No field shifts, every evidence column holds URLs.

## Cross-checks that changed the outcome

- **Pastka** is not a company. UNWAVE is already verified in the landscape and Pastka is its
  EW/ELINT system. Held for review rather than admitted.
- **Tekhnary** was declined. Its evidence URL is an article about **Wild Hornets** (already
  verified, Sting interceptors) — the article mentions both, which is co-occurrence, not evidence.
- **ComBat Vision** is battlefield coordination software that integrates third-party drones, not
  a UAV maker. Its directory-derived `uav` tag was removed.
- **Iron Cluster** is an industry association; **VARDIAN** is a consultancy; **Octopus Project**
  is a programme record.
- Five country attributions were wrong: TargetAI → Kazakhstan, VisionMap → Israel, Varangians →
  Sweden (an investor), Offset Labs → United Kingdom, Terminal Autonomy → United States.

## What was applied

**Stage A (identity):** 5 country corrections, 18 websites added, alias `SKYRIPER` on SkRIPer.

**Stage B (taxonomy):** 20 rows added across 15 companies. 23 rows archived — 14 wrong
directory-derived `uav` tags on companies that turned out not to be UAV companies, and 9
redundant parents that the derived-parent rule now supplies.

**Stage C (status):** 11 excluded, 3 newly held for review (Octopus Project, Pastka, Ruevit),
13 notes recorded on candidates that stay in the queue, verification recomputed.

| Outcome | Count |
|---|---|
| Admitted to landscape | 15 |
| Excluded | 11 |
| Held for review | 4 (3 new + GRIF) |
| Declined, insufficient evidence | 14 |
| **Total** | **44** |

## Landscape after Batch 06

| | Before | After |
|---|---|---|
| Verified | 448 | **463** |
| UAV only | 241 | 249 |
| C-UAS only | 181 | 181 |
| Both | 26 | 33 |
| Classified but unverified | 43 | **13** |
| Unclassified | 437 | 438 |
| Needs review | 32 | 35 |
| Excluded (in scope) | 39 | 40 |

Universe 989 = 463 + 13 + 438 + 35 + 40. QA clean: V1 = 273 and V2 = 358 unchanged, zero
publication changes, zero verified companies failing the eligibility rule, zero verified on
directory evidence alone, zero redundant unevidenced parents.

The directory block is the real result here: **43 → 13**. Thirty of those records have now been
resolved one way or the other, and the thirteen that remain have had two passes with nothing
found.

## The queue has run out of research leads

Of the 451 companies still in the backlog, 382 have never been in a batch. Scored:

| Priority | Never researched |
|---|---|
| P1 | 0 |
| P2 | 1 |
| P3 | 10 |
| P4 | 371 |

**222 of those 371 have no description, no website and no product in the database at all** —
nothing but a name and a news mention. They are not low priority because they were assessed and
found weak; they are low priority because there is nothing on file to assess. A general 40-row
batch from here would be 11 real leads padded out with 29 records that cannot be researched
because nobody has written down what they are.

So Batch 07 changes shape rather than continuing: **11 VERIFY rows** (every remaining lead above
the P4 floor) and **29 ENRICH rows** drawn from the no-data mass, which ask for the basics —
website, one factual sentence, named products, country, and whether the company is in UAV or
counter-UAS at all. `OUT_OF_SCOPE` is an accepted answer and a useful one. The protocol file
`instructions/CHATGPT_RESEARCH.md` now documents both task types.

**This is a direction change and it is Nazar's to confirm.** If the enrichment pass works, the
rest of the backlog can be cleared the same way, in bulk, and the records that turn out to be real
will then be worth verifying. If you would rather keep running verification batches, say so and
I will go back to 40-row VERIFY queues — they will just keep returning fewer admissions, as they
have: 31, 29, 14, 9, 7, 15.

## Noted while building Batch 07

Two likely duplicate pairs appear in the enrichment rows and are flagged for the researcher:
**Vyriy / Vyriy Industry**, and **PGZ / Polish Armaments Group** (PGZ is Polska Grupa Zbrojeniowa).
Neither was caught by name normalisation.

## Boundaries honoured

V1 (273) and V2 (358) untouched. No V3. Nothing published — verification is not publication, and
all 15 admissions stay `draft`. No row was admitted on directory evidence alone. No ChatGPT verdict
was imported without an independent check.
