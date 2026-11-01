# The Albacore/Ghostfin article links — reviewed. NO CORRECTIONS PROPOSED

**Date:** 2026-11-01 · **Status:** evidence submitted for review; **nothing to change** ·
**Next actor:** Nazar (to accept the finding)

Manifest: [2026-11-01-article-association-manifest.csv](2026-11-01-article-association-manifest.csv)
(zero correction rows, by design — see §4)

---

## 1. What I was checking

[The batch 2 decisions report](2026-11-01-batch-2-decisions-applied.md) flagged that
`dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia` is linked to
three products, and called two of them doubtful:

| Linked | Company | What I said then |
|---|---|---|
| Ghostfin | Albacore | correct — it is Albacore's article |
| **Ghost Shark** | Anduril | **"spurious — same name confusion"** |
| **MAGURA V7** | Uforce | **"doubtful"** |

I read the full article. **Both of those calls were wrong.**

## 2. The evidence, from the article itself

Fetched with the repo's own `fetchBodyText` — 8,578 characters of body text.

### Ghost Shark — SUPPORTED, and substantively

A whole comparison paragraph, not a passing name-drop:

> "Australia got there first with a partner. **Anduril's Ghost Shark went from concept to a
> A$1.7 billion (about $1.1 billion) five-year contract with the Royal Australian Navy in
> roughly three years**, and the company opened a Sydney factory to build them. Albacore is
> aiming much smaller and much cheaper, which is the entire argument for buying hundreds
> instead of dozens."

Contract value, customer, timeline, manufacturing, and the strategic contrast that is the
article's actual argument. This is substantive discussion by any reasonable standard.

### Magura V7 — SUPPORTED

> "DroneXL reported in June 2025 that a Ukrainian **Magura V7 drone boat shot down Russian
> fighter jets**, a world first."

A specific factual claim, load-bearing in the section headed *"Ukraine's Sea Drones Wrote
Albacore's Business Case"*. Less central than Ghost Shark, but a real reference, not an
artefact. (Note the article spells it **"Magura V7"**, not "MAGURA V7" — the catalogue
record's casing differs, which is cosmetic and not an error.)

### Ghostfin — SUPPORTED, as expected

> "Albacore publishes Ghostfin's numbers: a 102-inch base length, a 12.75-inch outer
> diameter, 425 pounds dry weight…"

The article's main subject. Preserved, as instructed.

## 3. Why I got it wrong, which is the useful part

I inferred an error **from the fact that Ghost Shark is not the article's main subject** —
precisely the inference the brief warned against. The reasoning ran: the record's
`source_urls` wrongly pointed at this article, the record's maker was wrongly Albacore,
*therefore* the article link must be wrong too. The first two were genuine errors. The
third did not follow, and I asserted it without reading the article.

The data distinguishes the cases cleanly:

| Artefact | Status | Why |
|---|---|---|
| `products.company_id` = Albacore | **was wrong**, fixed | no source says Albacore makes Ghost Shark |
| `products.source_urls` = this article | **was wrong**, fixed | a record's sources should describe *it* |
| `article_products` link | **correct**, keep | the article genuinely discusses Ghost Shark |

A news link means "this article talks about this product". A source URL means "this is
where the record's facts come from". The same URL can legitimately be the first and not the
second — which is exactly the situation here, and the reason the earlier inference was
unsound.

## 4. Corrections proposed: none

The manifest has **zero correction rows**. There are no unsupported associations on this
article, so there is nothing to prepare exact-ID SQL or rollback for, and inventing a
change to fill the deliverable would be worse than reporting the finding.

Nothing was deleted, as instructed — and nothing needed to be.

**For the record, the three links that stay:**

| product_id | Product | article_id | Verdict |
|---|---|---|---|
| `e78add2b-651e-411c-b801-5264183200b9` | Ghostfin | the dronexl article | supported — main subject |
| `0c420e85-28c1-4c88-acab-436348b91ec3` | Ghost Shark | the dronexl article | supported — substantive comparison |
| `9c7d4543-2edc-42f3-a27c-41c467823516` | MAGURA V7 | the dronexl article | supported — specific factual reference |

## 5. One genuinely open item, not an error

The catalogue spells the record **"MAGURA V7"** and the article **"Magura V7"**. Other
MAGURA records exist (`MAGURA V5`). This is a naming-consistency question across the MAGURA
family, it is cosmetic, and renames are excluded from this task. Recorded, not acted on.
