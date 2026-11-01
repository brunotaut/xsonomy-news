# Preventing the batch 2 extraction errors — implemented and activated

**Date:** 2026-11-01 · **Status:** code committed and activated; **not yet exercised in a
production run** (see §7) · **Tests:** 70/70

Follows [batch 2 decisions applied](2026-11-01-batch-2-decisions-applied.md).

---

## 1. The trace: five errors, one cause

The decision cache settles this rather than leaving it to inference. Every one of the five
bad rows is `decision='created', reason='llm'` — none came from name matching, the
blocklist, or the cache:

| Tag | Created | Shared timestamp |
|---|---|---|
| MMCM | `ccfd9d18` | **`2026-08-09 05:46:17.104672+00`** |
| Exail A27 | `3515b298` | **the same timestamp** |
| rMCM | `5d6c6ab3` | `2026-08-10 06:09:58.364739+00` |
| Ghost Shark | `0c420e85` | **`2026-08-28 17:12:28.084217+00`** |
| Ghostfin | `e78add2b` | **the same timestamp** |
| Albacore (company) | `67acfba0` | **the same timestamp** |
| XLUUV | `9d80e014` | `2026-08-30 10:18:56.296958+00` |

Ghost Shark, Ghostfin and Albacore were decided in **one batched call from one article**.
That is the Albacore misattribution, visible in the data: the gate was asked for a `maker`,
the only company in the batch was Albacore, and co-occurrence became ownership.

**All five went through `llmGate` in `scripts/lib/resolve.mjs`, and its instruction was:**

> "Judge from the name and the article titles it appeared in."

And `articles` **has no `body` column.** The body is fetched at analysis time and discarded;
only the extracted name lists persist. So by the time the gate ran, the article text was
gone and it was deciding what a name *denoted* from the name and a headline. From that:

- `MMCM` / `rMCM` — procurement programmes, indistinguishable from model designations.
- `XLUUV` — a size class, indistinguishable from a model name.
- `Exail A27` — see §5; the source does name it, which was not what we thought.
- `Ghost Shark` — a maker was requested and nothing required a source to support it.

Then `publication_status: 'live'` on insert, so none of it was reviewed.

## 2. The fix: three rules, enforced in code

New module `scripts/lib/identity.mjs`. Not a blacklist — **nothing matches on any of these
five names**, and an unseen programme is handled the same way.

1. **Positive classification.** A name is a product only if something says it is. `kind`
   must be exactly `product`; `programme`, `class`, `family`, `contract`, `organisation`
   and `unclear` are refused, and **an absent or unrecognised kind is not a product
   either** — it goes to review, so the default is never "publish".
2. **Quote verification.** The model returns a verbatim span; code checks the span is
   actually in the article text. Normalised for case, dashes and smart quotes; spans under
   12 characters are refused as evidence.
3. **Joint evidence for a relationship.** A maker is accepted only when **one span names
   both the product and the maker**. Two names in the same article is not a relationship.
   The product is still created — it is the ownership claim that is dropped, not the row.

**Evidence is captured where the body still exists.** `analyze.mjs` now asks for, and
verifies, per-product evidence at analysis time and stores the verdict in a new additive
column `articles.entity_evidence`. The body itself is still not stored: verification
happens while it is in hand and only the outcome travels.

`llmGate` keeps its real job — catalogue fit and category — and its prompt now says so
explicitly, so it cannot drift back into judging identity from headlines. **Its `maker`
field is no longer read when creating links.**

### Uncertain candidates stay reviewable

Anything not verified is created `publication_status='review'`, which is already in the
`products` CHECK and which the site build cannot reach (it fetches `publication_status=eq.live`).
So a doubtful candidate is neither published nor thrown away.

### Retired artefacts cannot come back

The product index is keyed on exact and normalised names, which stops an exact repeat but
**not a differently-worded duplicate** — "Maritime Mine Counter Measures" would not have
matched a retired "MMCM". Added `buildRetiredProductIndex` with a looser key that also
drops spaces and punctuation, and a hit routes to review rather than creating a second row.
Verified separately: **no code path anywhere sets a product back to `live`**, so
republication was never possible; recreation was.

## 3. Tests — 22 new, 70 total

`scripts/test/identity-extraction.test.mjs`. The five failure cases, plus counterexamples
that must keep working: a real product named alongside a programme in the same article, an
ordinary well-evidenced product, short real maker names, possessives and punctuation.

**Two of those counterexamples failed, and both bugs were in the fix:**

- `mentionsName` used a plain substring, so **"Ghostfin" matched the name "Ghost Shark"**
  through the shared "ghost" — the exact error class the module exists to prevent,
  reproduced inside the prevention. Fixed with word-boundary matching.
- The ≥4-character token floor silently dropped **"BAE"**, so a legitimate short maker
  name could never match. Lowered to 3, with weak corporate tokens ("Systems",
  "Industries", "Group") still unable to carry a match alone.

Both now have their own regression tests. **This is why mocked tests alone do not establish
extraction quality** — and why the comparison in §4 matters more than the suite.

## 4. Read-only comparison, against real article text

No writes, no replayed ingestion. **I could not call the model: neither repo holds a
`.env` and `ANTHROPIC_API_KEY` lives only in CI.** So this exercises the half of the fix
that is model-free — quote verification against the real sources, fetched with the repo's
own `fetchBodyText`.

| Source | Name | Result |
|---|---|---|
| opex360 | MMCM, rMCM | mentioned — **rule 2 does not stop these; rule 1 does** |
| opex360 | Exail A27 | **mentioned, with a joint span naming Exail** — see §5 |
| dronexl | Ghostfin | mentioned + joint span names Albacore → **maker accepted** |
| dronexl | **Ghost Shark** | mentioned, **no span names both it and Albacore → maker DROPPED** |
| dronesworldmag | XLUUV | mentioned — rule 1 again |
| defence-blog | Dire WOLF | **body unavailable** (bot-blocked) → held for review |

**The Albacore misattribution is prevented on the real article**, not on a fixture. And the
same article says "**Anduril's** Ghost Shark" — the right answer was in the source all along.

**What the body gives you, and only the body:** opex360 glosses MMCM as
*"le programme SLAM-F … repose sur quatre nouvelles capacités, dont … MMCM [pour Maritime
Mine Counter Measures], a été confiée à Thales"* and rMCM as *"chasseurs de mines **de
type** rMCM [ou classe City]"*. "Programme", "capacité", "de type" — the signals needed to
classify both correctly are in the text and nowhere else. That is the fix working for the
right reason.

**Representative sample, 16 recent pending articles:** body available **15/16 (94%)**,
median 3,693 chars. The one failure is `defence-blog.com` — the source Dire WOLF came
from. So roughly **6% of articles will hold their new products for review** because the
page cannot be fetched. That is the cost of the fix, it falls in the safe direction, and it
is a reportable number rather than a surprise.

## 5. A correction: Exail A27 was not a fabrication

The batch 2 review said *"No source names an A27. The name looks like a
plausible-but-invented member of the A-series."* **That was wrong.** The opex360 article
says:

> "trois drones sous-marins [AUV] **Exail A27 [ou A-18M]**"

A27 is named as a **bracketed alternative designation for the A-18M**, and the same article
later hedges *"il est probable qu'il s'agisse de drones sous-marins A-18M"*. So the
extraction was faithfully reporting a name the source used.

Two consequences, stated plainly:

- **Unpublishing A27 was still right**, but for a different reason than I gave: it is an
  alias of an existing catalogue product, not a product that does not exist.
- **Rule 2 would not have prevented A27**, because the quote verifies. This is an honest
  limit of the fix: it catches fabricated and unevidenced names, not a source that prints a
  designation the manufacturer does not use. A27 is now an **alias question** — plausibly
  an alias of A-18M `1de976af` — which is a merge decision and excluded from this task.

## 6. Files changed

| File | Change |
|---|---|
| `scripts/lib/identity.mjs` | **new** — the three rules, the retired guard, commutative evidence merging |
| `scripts/lib/analyze.mjs` | evidence requested, verified at analysis time, verdict returned |
| `scripts/lib/resolve.mjs` | gate prompt scoped; identity explicitly not its job |
| `scripts/resolve-entities.mjs` | evidence governs creation; review status; retired guard; maker from evidence only |
| `scripts/lib/supabase.mjs` | evidence persisted and read; `fetchMissingEvidenceBatch`, `patchEvidenceOnly` |
| `scripts/analyze-backfill.mjs` | `--missing-evidence` mode |
| `scripts/ingest.mjs` | passes evidence through |
| `scripts/test/identity-extraction.test.mjs` | **new** — 22 tests |
| migration `articles_entity_evidence` | one additive JSONB column |

No taxonomy or schema redesign: one additive column, which was unavoidable because the
body is not stored.

## 7. Activation status — activated, not yet exercised

**Committed and pushed.** `ingest-and-deploy.yml` runs `npm run ingest` then `npm run
resolve` in the same job, so a newly ingested article is analysed (evidence captured) and
resolved (evidence enforced) in one pass. The fix is live for new articles from the next
scheduled run.

**It has NOT completed a production run.** The workflow is scheduled; I cannot trigger or
observe it from here, and I will not claim a successful run I have not seen.

### One thing to know before that run: the backlog

| | Count |
|---|---:|
| Articles analysed but not yet resolved | **719** |
| Distinct product tags among them | 2,025 |
| …already cached or matching an existing product | 984 |
| …**genuinely new, and would now be held for review** | **1,041** |
| Articles carrying evidence today | **0** |

Those 719 were analysed before this column existed and are already `analyzed_at`, so
`ingest` will not revisit them. Their new products are **safe but held**: nothing reaches
the site, and the catalogue stops auto-growing from the backlog until evidence exists.

`node scripts/analyze-backfill.mjs --missing-evidence` fills it. It writes **only**
`entity_evidence`, restricted to the product names already on each row — it does not
re-extract, does not touch `companies`/`products` or `analyzed_at`, and so does not rewrite
historical records. **I have not run it**, because that is a production ingestion pass and
this task excludes replaying ingestion. Run it with `--dry` first; it reports
create/review/reject counts before writing.
