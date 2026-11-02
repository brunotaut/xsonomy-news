# Extraction safeguards validated, two defects fixed, taxonomy corrected

**Date:** 2026-11-02 · **Tests:** 100/100 · **Taxonomy corrections: APPLIED** ·
**Real-model evaluation and evidence backfill: BLOCKED on credentials — see §4 and §5**

Follows [the identity fix](2026-11-01-extraction-identity-fix.md), whose §2 and §4 this
report corrects.

---

## 1. The first scheduled production run: it has not happened

| | |
|---|---|
| Commit activated | news `7f03d6e` (pushed 2026-11-01 ~23:58 UTC) |
| Workflow | `.github/workflows/ingest-and-deploy.yml` |
| Schedule | `cron: "0 5 * * *"` — **05:00 UTC daily** |
| Time of this report | **2026-11-02 00:10 UTC** |
| First run that will exercise the code | **2026-11-02 05:00 UTC**, ~4h50m away |
| Run URL | **none to give** — no run has executed this code |

**Deployment is not execution, and the distinction is load-bearing here.** My push *did*
trigger the workflow, but both the ingest and resolve steps carry
`if: github.event_name != 'push'`, so a code push runs **build and deploy only**. The new
code is deployed and has never run.

Measured confirmation rather than inference:

| Check | Value |
|---|---|
| Articles with `entity_evidence` | **0** |
| Articles analysed since the push | **0** |
| Products created since the push | **0** |
| Products in `review` | **0** |

### A separate problem the inspection turned up, and it matters more

**The resolver has not stamped an article since 2026-10-26.** `max(entities_resolved_at)`
and `max(tag_resolutions.created_at)` are both 2026-10-26, seven days ago, while ingest has
kept running (`max(analyzed_at)` = 2026-11-01 11:39).

It is **not** the LLM gate cap. Of the 150 most recent unresolved articles, **47 have every
tag already decided** and need no model call at all — resolve would have stamped those and
written ~55 match-cache rows. It wrote nothing.

So the resolve step has been failing, or not running, for a week. I could not diagnose
further: there is **no `gh` CLI in this environment and no Actions access**, so the run logs
are not visible to me, and no code change to the resolver landed in that window. Guessing a
cause would be worse than naming the gap.

**This bears directly on activation.** The first scheduled run may well fail for this
pre-existing reason, which has nothing to do with the new code. **The Actions log for the
05:00 UTC run is the thing to read**, and it is the one piece of evidence I cannot fetch.

## 2. Weakness 1 — co-mention was being treated as a relationship. Confirmed, fixed

**The critique is correct and the defect was real.** Reproduced on the actual article text:

```
span = "Australia got there first with a partner. Anduril's Ghost Shark went from concept
        to a A$1.7 billion five-year contract with the Royal Australian Navy in roughly
        three years, and the company opened a Sydney factory to build them. Albacore is
        aiming much smaller and much cheaper…"

before:  makerFromEvidence(Ghost Shark, maker=Albacore) → "Albacore"   ← the original error
         makerFromEvidence(Ghost Shark, maker=Royal Australian Navy) → "Royal Australian Navy"
```

The earlier report claimed the misattribution was "prevented on the real article". **It was
prevented by a sentence splitter cutting between the two names, not by the rule.** Hand the
same test the wider passage as one span and it reinstates the original error. A customer
passed as a manufacturer on the same logic.

**The fix.** A maker now requires an explicit making relationship, not co-presence:

- the two names must be within **120 characters** of each other;
- the text *between* them is classified, and must read as manufacture —
  `possessive` ("Anduril's Ghost Shark"), `possessive_its` ("Albacore … awarded a contract
  for **its** Ghostfin"), `made_by` ("built by Anduril"), `adjacent` ("the Anduril Ghost
  Shark"), or `maker_verb` ("Baykar develops the …");
- a **disqualifying frame beats any positive cue**: comparison, competitor, customer,
  operator, purchaser, partner, integrator;
- every cue is anchored at both ends, and the accepted cue is **stored on the evidence
  record** so a published maker link says which relationship justified it.

### Two further defects the counterexamples caught

- **`"Boeing's Orca and Anduril's Ghost Shark"` named Boeing as Ghost Shark's maker.** The
  bridge began with a possessive — belonging to the *intervening* product. Cues are now
  anchored so the product must follow the possessive directly.
- **The rule was English-only, and the feed is not.** `"deux drones de surface Inspector
  125 **fournis par** Exail"` started returning null — a legitimate maker silently dropped
  for every French, German and Italian source. Patterns and disqualifiers now cover
  French, German, Italian and Spanish/Portuguese. German word order is only partly handled
  (`von X gebaut`), which is stated rather than hidden.

**Negative tests added:** comparisons, customers, operators, purchasers, partners,
integrators, a competing manufacturer named in the same breath, distance, and a
non-English customer. All pass.

## 3. Weakness 2 — the retired guard caught far less than claimed

**Also correct.** Measured, not argued:

| Candidate against a retired "MMCM" | Before | Now |
|---|---|---|
| `MMCM` | caught | caught (`key`) |
| `M.M.C.M.`, `mm cm`, `m-m-c-m` | caught | caught (`key`) |
| `MMCM programme` | **missed** | caught (`key`) |
| `Maritime Mine Counter Measures` | **missed** | caught (`acronym`) |
| `Maritime Mine Counter-Measures` | **missed** | caught (`acronym`) |
| `Mine Counter Measures`, `Inspector 125` | free | free (correctly) |

**The earlier claim that this "stopped a differently worded duplicate" was wrong.**
Collapsing punctuation does not equate an acronym with its expansion — exactly as the
critique says.

Added `acronymOf`, matching initials **both ways** and trying it with and without
connectives (so `MMCM` ⇄ "Maritime Mine Counter Measures" *and* `MOD` ⇄ "Ministry of
Defence"), plus trailing-descriptor stripping (`programme`, `class`, `system`, …).

**Hits route to review, never to refusal**, and the two tests are labelled differently on
purpose: `key` is a near-certain name collision; **`acronym` is plausible, not proven** —
"CAMP" could be an unrelated product as easily as an expansion. That is precisely the
ambiguous identity that belongs in front of a person.

**A limit, stated rather than papered over:** a **phonetic** acronym is not caught. `XLUUV`
expands to "extra-large uncrewed undersea vehicle", whose initials are ELUUV — the X is a
sound. This rule catches true initialisms only. Anything it misses still has to pass the
`kind` rule, where a class term is refused anyway.

## 4. Real-model evaluation: BLOCKED, with the blocker named

**I could not run it.** `ANTHROPIC_API_KEY` exists only as a GitHub secret; neither repo
holds a `.env`, and this environment has **no `gh` CLI and no Actions access**, so I can
neither read the secret nor dispatch a workflow that could. Running the eval locally fails
closed:

```
$ node scripts/eval-extraction.mjs --affected
BLOCKED: ANTHROPIC_API_KEY is not set. This evaluation calls the real
model, so it can only run where that secret exists (CI). Nothing was run.
```

**I am not claiming validation.** What I did instead:

- **Built the evaluation so it can be run by someone who can dispatch it.**
  `scripts/eval-extraction.mjs` + `.github/workflows/extraction-validate.yml`
  (`mode=eval`). It is read-only by construction — no `patchAnalysis`, no
  `patchEvidenceOnly`, no `insertRows`, no `--apply`, and a test asserts all of that
  against the **code** rather than the comments. For the four affected sources it prints
  an explicit `PREVENTED` / `*** NOT PREVENTED ***` per historical error, and reports an
  **estimated** cost from published rates, labelled as an estimate.
- **Ran the model-free half locally**, which is where both of this report's fixes came
  from. Quote verification and relationship classification need no API key, and exercising
  them against the real article text is what exposed weakness 1.

**Cost: zero model spend, because nothing was called.**

## 5. Evidence backfill: inspected and made safe, NOT run

Also blocked — the backfill calls the extraction model, so it needs the same key.

**Re-measured (the 1 Nov figures were estimates):**

| | 1 Nov report | Measured now |
|---|---:|---:|
| Backlog articles | 719 | **635** (719 counts articles with no products) |
| Product tag instances | 2,829 | **2,829** |
| Distinct product tags | 2,025 | **2,001** |
| …genuinely new | 1,041 | **1,039** |
| Articles with evidence | 0 | **0** |

**Safety verified by inspection, then pinned by tests:**

| Requirement | Verified |
|---|---|
| Writes restricted to `articles.entity_evidence` | `patchEvidenceOnly` sends that key alone; a test asserts `companies`, `products`, `analyzed_at`, `entities_resolved_at`, `publication_status` never appear in its body |
| Tags, `analyzed_at`, companies, products, statuses, caches, links preserved | the backfill calls only `patchEvidenceOnly`; a test asserts it never calls `patchAnalysis`, `insertRows`, `deleteTagResolutions` or `stampEntitiesResolved` |
| Dry mode writes nothing | a test asserts the `if (DRY)` guard appears **before** the write and returns |
| Evidence restricted to names already stored | asserted: it filters against the row's existing `products[]` |

**The cache question, which has a consequence:** right now **0 products are in `review`** and
**0 `tag_resolutions` rows carry a review reason** — because resolve has not run since
26 October. So **no retry decision is due yet.**

But once resolve does run, a held candidate is cached as `decision='created'` pointing at a
`review` product. **The cache then short-circuits it, so backfilling evidence later will
*not* retry or promote it.** That is correct — backfill must not promote anything — but it
means review products accumulate and need a deliberate pass. **That is a separate proposal
and is not attempted here**, per the instruction.

**How to run it when credentials are available:** `extraction-validate.yml` →
`mode=backfill-dry` (writes nothing), then `mode=backfill-pilot` with `pilot_size=10`,
confirm the stored evidence, then `mode=backfill` with `max_articles`. Bounded, resumable
(it selects `entity_evidence is null`, so a re-run continues), concurrency-capped, and
every mode runs `npm test` first.

**Counts: attempted 0, completed 0, failed 0. Remaining backlog: 635 articles / 2,001
distinct tags, unchanged.**

## 6. Taxonomy corrections: APPLIED

Re-verified against the manifest before touching anything — both rows exactly as recorded:
option `2e1d09e9-0cf6-4c08-bcfc-591d2dbb307f`, `source='rule'`, `confidence='high'`,
`note='category=UAV'`, `created_at='2026-09-05 16:52:03.652926+00'`.

Guarded transaction re-run with its round trip first (deleted 2, reversed 2, **0 rows
differing and 0 missing including `created_at`**, 11132/11132), then applied:

| | Before | After |
|---|---:|---:|
| `product_taxonomy` rows | 11,132 | **11,130** |
| `aerial-uav-uas` rows on non-UAV products | 2 | **0** |
| Cassio S | `Other` / `live`, Voltaero | **unchanged**, 0 taxonomy rows |
| DA 15-N.ISS | `Other` / `live`, Volz Servos | **unchanged**, 0 taxonomy rows |
| Their company links | 2 | **2** |
| Their article links | 2 | **2** |

Category, publication status, ownership, names and every other field preserved.

### A finding from verifying the URLs

`/other/da-15-niss/` **404s**, and did so before this change. The product's stored slug is
`da-15-niss`, but its published URL is `/other/da-15-n-iss/`.

**A product's public URL is generated from its Name, not from `products.slug`** —
`generate-supabase.mjs:1203`: `row.slug = slugify(row.Name || "item", bucket)`. The stored
slug column does not drive product pages at all.

That is worth recording because `CLAUDE.md` says *"Keep product/company URLs stable
(`slug`) — they are indexed by Google"*, and for products the lever is actually the **name**:
renaming a product moves its page, while editing the stored slug changes nothing. Nothing
is broken — the earlier batches' `slug_redirects` rows worked because the stored and
generated slugs happened to coincide for those products — but it inverts where the care is
needed. Not acted on; renames are excluded from this task.

## 7. Stale derivations: a read-only check, wired in

`scripts/lib/derived-taxonomy.mjs` + `scripts/check-derived-taxonomy.mjs`, added to
`ingest-and-deploy.yml` after resolve as a **non-blocking** step (a data question must not
stop the site deploying) and to the validation workflow.

It flags `source='rule'` rows whose recorded `category=<X>` basis contradicts the product's
current category. **It reports only** — never deletes, never touches an observed row
(`source` of `web` or `knowledge`), never infers a category change. An observed row is
research; a category is not grounds to overrule it.

**Both cases the brief asked for are tested:**

- **a stale derivation** — Cassio S shape: derived `category=UAV`, product now `Other` →
  flagged, with the basis named;
- **a legitimate multi-domain product** — HALIA, amphibious float-and-fly, holding a
  surface row *and* an aerial row, both observed, category correctly UAV → **not flagged**,
  and reported separately as legitimate context.

Plus: a derived row whose basis still holds is not flagged (1,007 live rows are in that
state); an unparseable rule note is reported rather than silently passed; and a test
asserts the SQL and the JS select the same thing and that the SQL stays read-only.

## 8. Tests, limitations, paths

**100/100** (was 70). New: `derived-taxonomy.test.mjs` (8), `backfill-safety.test.mjs` (8),
and 14 added to `identity-extraction.test.mjs`.

**Limitations, stated plainly:**

1. **No production run observed.** The first is 05:00 UTC today. No run URL exists.
2. **The resolver has been failing since 26 October** and I cannot see why without the
   Actions log.
3. **No real-model evaluation ran.** Zero model spend; the mechanism is built and
   dispatchable by someone with Actions access.
4. **No backfill ran.** 635 articles still carry no evidence.
5. **Phonetic acronyms are not caught** by the retired guard.
6. **German relationship patterns are partial**, given word order.
7. **Mocked and text-level tests do not establish extraction quality** — which is exactly
   why §4 is reported as blocked rather than as done.

| Path | |
|---|---|
| `research-agent/reports/2026-11-02-extraction-validation-and-taxonomy-applied.md` | this report |
| `research-agent/reports/2026-11-01-extraction-identity-fix.md` | corrected in place |
| `research-agent/reports/2026-11-01-domain-facet-semantics.md` | the applied analysis |
| `research-agent/reports/2026-11-01-domain-facet{.sql,-rollback.sql,-manifest.csv}` | as executed |

## 9. What needs a decision

1. **Read the Actions log for the 05:00 UTC run** — the one piece of evidence I cannot
   fetch, and it covers both the new code and the week-old resolve failure.
2. **Dispatch `extraction-validate.yml` → `eval`** to get the real-model evidence.
3. **Then `backfill-dry` → `backfill-pilot` → `backfill`** for the 635 articles.
4. **A separate retry/promotion pass** for review products, once any exist.
5. **Exail A27 / A-18M alias** — still a separate identity review, untouched.
