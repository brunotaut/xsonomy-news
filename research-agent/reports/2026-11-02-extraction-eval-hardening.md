# Extraction evaluation failures: causes, fixes, and what is still not proven

**Date:** 2026-11-02
**Run inspected:** [41438189153](https://github.com/brunotaut/xsonomy-news/actions/runs/41438189153), job 125253146071, commit `cc2c6b8`
**Outcome of that run:** green. It should not have been.

---

## 0. The headline problem

The run reported success while one required article was never parsed and three
required cases were never tested. Two independent defects produced that:

1. `eval-extraction.mjs` counted errors into a totals line and then **exited 0
   regardless**. Nothing could make it fail.
2. Its Ghost Shark expectation was written as `no-maker-Albacore`, so a **missing
   maker printed `PREVENTED`** and the **correct answer (`maker=Anduril`) printed
   as a failure marker**. The expectation was inverted.

Both are fixed. The evaluation now exits `1` on a wrong answer and `3` on a case
that was never tested, and a mutation check confirms it: feeding it a mock that
attributes Ghost Shark to Albacore yields exit 1.

---

## 1. "Unparseable response" — truncation, not malformed output

**Cause: `max_tokens` was 1024.** The opex360 article is French and
evidence-heavy. Its body cleans to 4,123 characters and yields on the order of
eight products; each evidence entry carries a verbatim `quote` and `makerQuote`
of up to 400 characters, so the evidence array alone needs roughly 900–1,200
output tokens. The reply was cut off mid-object, `JSON.parse` threw, and
`parseEntities` returned `null`, which the caller reported as the single
catch-all string `"unparseable response"`.

**`stop_reason` was never read.** `anthropicComplete` returned only concatenated
text, so truncation, invalid JSON, a wrong shape and an API error were
indistinguishable — which is why one line of log could not tell us which it was.

### What changed

| Before | After |
|---|---|
| `max_tokens: 1024` | `4096`, retried once at `8192` |
| `stop_reason` discarded | `anthropicMessage` returns `{ text, stopReason, usage, model }` |
| one failure string | `empty_reply` / `no_json_object` / `invalid_json` / `truncated_json` / `schema_violation` |
| no shape check | `validateEntities` rejects a well-formed reply of the wrong shape |
| no retry | bounded retry (one) for **truncation and invalid JSON only** |
| malformed → `ok:false` with empty arrays alongside a usable-looking result | malformed is **always** `ok:false`; never a confident empty extraction |

A schema violation is deliberately **not** retried: the prompt has drifted and
repeating the call just spends money twice.

`anthropicComplete` and `parseJsonObject` keep their old signatures — six other
callers (company enrichment, product enrichment, maturity, evidence extraction,
the resolver gate) depend on them.

**Caveat:** the job log text needs admin rights (`403`), so I could not read the
actual `stop_reason` from that run. The diagnosis rests on the token arithmetic,
on `"unparseable response"` being exactly what truncated JSON produces here, and
on the fix being verified against a mock that truncates. The new run will print
the real `stop_reason` if it recurs.

---

## 2. The XLUUV article — two bugs, both confirmed by inspection

The brief said not to assume those four products were unrelated until their
source passages were inspected. They were inspected. Both findings are mechanical.

### 2a. A leading rail of other headlines

Tracing `htmlToText` stage by stage on the live page:

```
0 raw                      len  235968 | <article> 1  </article> 1
1 after block-tag strip    len   68158 | <article> 1  </article> 1
2 after junk-class strip   len   43567 | <article> 0  </article> 1   <-- opening tag destroyed
3 after link-list strip    len   42538 | <article> 0  </article> 1
  <article> non-greedy match: NONE
```

The junk-class strip is single-level and non-greedy, so on this page's nested
`<div>`s it deleted the opening `<article>` tag and left its `</article>`.
Region selection then matched nothing, the **whole document** was kept, and the
page's leading headline rail went to the model as if it were the article:

```
HIT XLUUV @82     HIT DroneSentry @165   HIT Mission Master @446
HIT FUSE @502     HIT Chaparral @868
```

All four sat in the rail, *before* the story. They are contamination — now
proven rather than assumed.

**Fix:** region selection runs **before** the junk strip, and spans are taken
from the first opening tag to the **last** matching close rather than by a
non-greedy match. Several `<article>` elements pick the longest, not the first
teaser.

### 2b. The word "comments:" truncated the body in half

`"comments"` was a boilerplate cut marker matched **anywhere** in the text. The
article contains:

> "Bill Merz, Senior Vice President of Aerospace and Defense Technologies for
> OCEANEERING, **comments:** …"

That cut the real body at **2,292 of 5,018 characters, mid-quote**. Any article
where someone "comments:" lost everything after it.

**Fix:** cut markers match only at the **start of a line**, which is what they
are — headings and link labels. Mid-sentence occurrences are prose.

### Result, measured on the live page

| | before | after |
|---|---|---|
| body | 2,291 chars, truncated mid-quote | **2,248 chars, the complete story** |
| rail products present | DroneSentry-X Mk2, Mission Master SP, FUSE, Chaparral | **none** |
| XLUUV present | yes | yes |

2,248 is *smaller* than 2,291 and yet complete: the old text was half the story
plus a rail, the new text is the whole story and nothing else.

### Unavailable and mismatched bodies are now rejected explicitly

`fetchPage`/`fetchBody` report the **final URL**, HTTP status and a typed
failure — `fetch_failed`, `body_too_short`, `body_mismatch` — the last from a
loose headline-agreement check that catches a redirect to a section front or a
soft 404. Both surviving eval URLs are flagged as redirected (trailing slash /
`www.`), which is benign and now visible.

### A finding about `defence-blog.com`

It answers **403 to every non-browser client** — plain `curl` is refused too —
while its `robots.txt` disallows only `/wp-admin/`. So **that article's body has
never been available to this pipeline, and the Dire WOLF record was created from
its headline alone.**

I did not masquerade as a browser to get around a WAF. Instead that case now
asserts **safe degradation**: with no article body, nothing may be created live.
That assertion is deterministic and costs no model call.

Related tightening: **only the real body counts as article text.** A headline
plus an RSS summary is not the article — a quote "verified" against them is
verified against the one sentence the model was already shown, which is how the
old gate judged identity from headlines. With no body, every candidate is now
`review`.

---

## 3. Manufacturer attribution — 9 real gaps, 0 leaks

Measured against a battery of real phrasings rather than by inspecting the two
named pairs:

**Gaps found (legitimate relationships being dropped):** relative clause
(`X, which builds the Y`), `a product of X`, appositive (`the Y, a X aircraft`,
`Y is an X product`), `X said its Y`, `X is the manufacturer of Y`, and
hyphenated `X-built` / `X-made Y`. **Nine.** All fixed; the same battery now
reports **0 gaps, 0 leaks**, with customers, operators, competitors, partners
and integrators still refused.

### Supply is not manufacture — a deliberate reversal of my own earlier change

The brief is explicit, and it corrects me. `supplies`, `delivers`, `provides`,
`integrates`, `installs`, `sells` were in the **manufacture** verb list, and in
an earlier session I added French `fournis par` ("supplied by") as a positive
maker cue to fix a false negative. That was over-reach: a prime integrator, a
reseller and a sustainment contractor all "supply".

These now resolve to a distinct `SUPPLY_ONLY` cue which assigns **no maker** and
leaves the candidate reviewable, in all languages the feed carries. Manufacture
still wins when both are stated (`built and supplied by Baykar` → maker).

**One existing test was changed on purpose,** from `assert.equal(product.maker,
"Exail")` to `null`, with the reason recorded in the test body. The product
itself still survives — that counterexample's real job.

German needed separate handling: it puts the deciding participle **after** the
name (`von Rheinmetall gebaut` / `geliefert`), so it is never inside the bridge
between the two names. Bare `von` means only "from" and is no longer a maker cue
on its own — it used to be, and that reported Rheinmetall as the maker of a
system it had merely delivered.

### Ghostfin → Albacore: a documented recall limit, not a bug

Albacore does build Ghostfin. **This article never says so in one span.** All
three spans naming both are:

- "Albacore publishes Ghostfin's numbers: a 102-inch base length…"
- "…the battery design Albacore credits for the range, which the company says gives Ghostfin…"
- "Albacore names coastal defense of an island like Taiwan as its lead use case"

None states manufacture. The relationship is carried **across sentences** — "The
company is Albacore" plus "is building weaponized undersea drones" — and
cross-sentence coreference is exactly what attached Albacore to Ghost Shark in
the first place. The one-span rule is the safeguard; relaxing it would reinstate
the original error.

So the honest assertion is: **Ghostfin survives as a product and never acquires
a wrong owner**, and whether the maker is found is counted in **maker recall**,
not hidden inside a "prevented" total. `Ghost Shark` **is** asserted positively:
`maker=Anduril` is required, `Albacore` fails, and **no maker also fails** —
it prevents the historical error without satisfying recall.

---

## 4. The evaluation now means something

- **PASS / FAIL / BLOCKED per required case**, each with evidence and a reason.
  **BLOCKED is not PASS.**
- **Exit status:** `0` all passed · `1` wrong answer · `2` cannot run (no key) ·
  `3` a required case was never tested.
- **Retention and attribution measured separately** — extracted/created/review/
  rejected, and claimed/assigned/dropped-as-supply/dropped-no-relation, plus
  required-assertion recall and a wrong-maker count.
- **Contamination asserted:** the four rail names are required to be `absent`.
- **Machine-readable `eval-results.json`** plus `eval-log.txt`, uploaded as an
  artifact **on failure too**, since that is when the diagnostics matter.
- **Production code paths only:** `fetchBody` → `htmlToText` →
  `extractEntities` → `decideIdentity` are the same functions the daily ingest
  calls.
- **Cost from reported `usage`**, not an estimate from character counts.

A bug I introduced and caught in my own change: `node … | tee eval-log.txt`
takes **tee's** exit status, so a failing eval would still have been green —
the exact defect under repair. `set -o pipefail` added and verified (`exit 3`
propagates through the pipe).

---

## 5. Validation

- **134 tests pass** (was 107). New `scripts/test/extraction-robustness.test.mjs`,
  **27 tests**, each built from an observed failure plus negative counterexamples.
- **End-to-end against a mocked model** (via `XSONOMY_ANTHROPIC_BASE_URL`,
  deliberately not the commonly-set `ANTHROPIC_BASE_URL`): all four required cases PASS, exit 0; the mock's first reply for
  the French article is deliberately truncated, so the **retry path is exercised
  for real**. A mock attributing Ghost Shark to Albacore gives **exit 1**.
- **Zero database writes.** Re-measured after all work: live 3,518 · review 0 ·
  draft 115 · taxonomy 11,130 · articles with evidence 0 · pending resolve 719 ·
  `max(entities_resolved_at)` still 2026-10-26 10:45:30. Identical to the start.
- **Passing mocked tests do not establish extraction quality.** They establish
  that the mechanics are right. Only a real-model run on the new commit can
  speak to quality.

---

## 6. Is backfill ready? **No.**

Not from unit tests and not from a workflow's colour. The required gate is a
**new read-only eval run on the new commit**, and that needs a dispatch I cannot
perform: `POST /actions/workflows/403989389/dispatches` → **`401 Requires
authentication`**. Read access works unauthenticated; write does not.

### Minimum action

Open
<https://github.com/brunotaut/xsonomy-news/actions/workflows/extraction-validate.yml>
→ **Run workflow**, on the new commit, with:

| input | value |
|---|---|
| `mode` | `eval` |
| `sample` | `12` |

That runs all four historical cases **and** a host-diverse sample that
deliberately reserves a quarter of its slots for non-English hosts (opex360,
esut, analisidifesa, infodefensa, hartpunkt) — an English-only sample cannot
detect a rule that silently drops every French or German maker, which this
pipeline has already had once.

Expected cost: the four required cases are ~4 calls (one body is unfetchable and
spends nothing, one retries) plus 12 sampled articles — on the order of **$0.02–0.05**
at Haiku rates. The job now **fails** if a required case is wrong or untested,
and `eval-results.json` is attached either way. Download it or paste the log and
I will read it.

Backfill stays blocked until that run is green **and** the pre-cron coordination
question below is answered.

---

## 7. Open decisions for Nazar

1. **A dropped ownership claim does not force review.** When the model asserts a
   maker and the rules refuse it, the product is still created live with no
   maker — the recall loss is invisible. Proposed, **not applied**: route a
   refused maker claim to `review`. Publication routing is your call.
2. **Headline-only articles now yield `review` instead of live.** Correct, and
   required by "reject unavailable content" — but the volume is unmeasured. It
   affects only new resolutions, never existing records.
3. **Still unresolved from the previous session:** before the next cron, either
   backfill first (pausing only the resolve step) or let it run and accept
   `review` rows.
4. `if: always()` on the Build step, so a resolver bug cannot freeze the daily
   rebuild again. Offered, not taken.

## 8. Untouched, as instructed

No backfill, no bulk resolution, no cache clearing, no publication changes. The
two taxonomy corrections remain applied (11,130 rows). The three Albacore /
Ghostfin article associations are unchanged and no article link was edited. A27
remains unpublished. Investors 118 / current metrics 207 and frozen V1=273 /
V2=358 are untouched. No catalogue cleanup, merges, renames or taxonomy changes.
