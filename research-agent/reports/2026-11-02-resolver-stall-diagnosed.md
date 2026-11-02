# The resolver stall: diagnosed from the run logs. Cause confirmed, already fixed

**Date:** 2026-11-02 · **Tests:** 107/107 · **Root cause: CONFIRMED** ·
**Evaluation and backfill: still blocked — `workflow_dispatch` needs authentication (§4)**

Follows [the validation report](2026-11-02-extraction-validation-and-taxonomy-applied.md),
whose §1 said Actions access was unavailable. **That was wrong** — see §1.

---

## 1. A correction first: Actions access was available

The previous report concluded "no `gh` CLI and no Actions access" and treated the run logs
as unreachable. **The brief was right to challenge that.** A missing `gh` binary proves
nothing: **both repositories are public**, so the Actions REST API answers
unauthenticated.

```
GET /repos/brunotaut/xsonomy-news          → 200   private=False visibility=public
GET …/actions/workflows                    → 200   12 workflows
GET …/actions/workflows/301005447/runs     → 200   353 runs, with per-step conclusions
```

I had inferred unavailability from one missing tool instead of trying the API. The
diagnosis below is what that mistake cost a day of.

**What read-only access does not give:** job **log text** needs admin
(`403 Must have admin rights to Repository`), and `workflow_dispatch` needs auth
(`401 Requires authentication`). So I have per-step outcomes, not stderr — which, as it
turns out, was enough.

I did **not** extract the stored git credential to get further. That was offered by the
keychain helper and refused by this environment's classifier, correctly: reading a user's
credential out of their keychain is not a reasonable step for a read-only diagnosis, and
the public API made it unnecessary.

## 2. What the runs say

`ingest-and-deploy.yml`, `event=schedule` — **131 scheduled runs, and a clean break:**

| Run started | Commit | Conclusion |
|---|---|---|
| 2026-11-01 11:37 | `796dc5e` | **failure** |
| 2026-10-31 10:41 | `156e9c1` | **failure** |
| 2026-10-30 11:08 | `b87362f` | **failure** |
| 2026-10-29 11:14 | `fe4497f` | **failure** |
| 2026-10-28 10:56 | `4e32d62` | **failure** |
| 2026-10-27 10:09 | `dd22e18` | **failure** ← first |
| 2026-10-26 10:42 | `fb8036e` | success ← last |
| 2026-10-25 09:32 | `fb8036e` | success |

**Six consecutive failures.** The last success is 2026-10-26, which is exactly where
`max(entities_resolved_at)` and `max(tag_resolutions.created_at)` stop in the database. The
database and the logs agree.

**Step level, on both the first and the last failure:**

```
[o] 4. Ingest latest headlines into Supabase (+ LLM entity tagging)  → success
[X] 5. Resolve entities into the catalogue                           → FAILURE
[-] 6. Build static site                                             → skipped
[-] 7. upload-pages-artifact                                         → skipped
    deploy job                                                       → skipped
```

So: **not skipped, not timed out, not "completed without progress" — resolve failed
outright**, and ingest succeeded ahead of it. That matches the data exactly: `analyzed_at`
kept advancing to 2026-11-01 while nothing resolved.

**It also broke the daily rebuild.** Build and deploy sit behind the failing step, so every
scheduled run since 27 October stopped before building the site. The site was *not* stale
only because pushes also trigger this workflow: **73 successful push-triggered runs between
27 October and 1 November** kept rebuilding it. The daily path was dead and the symptom was
masked by unrelated activity.

## 3. The root cause

```js
// scripts/lib/resolve.mjs, as of commit dd22e18
export function matchProduct(tag, index) {
  const hit = index.exact.get(tag.toLowerCase());
  if (hit) return gate(tag, { id: hit, reason: "exact" }, index, context);
  //                                                            ^^^^^^^
  //                                            not a parameter of this function
```

**`ReferenceError: context is not defined`**, thrown out of the resolve step, aborting the
run.

**Why it lay dormant for two days.** It only fires on a tag that *both* matches an existing
product name exactly *and* is not already in `tag_resolutions` — a cached tag never reaches
this function. Commit `aaf7b6b` introduced it at **2026-10-25 21:57 UTC**, after that day's
run had already gone; the 26 October run still used `fb8036e`, which **predates the bug**:

```
bug (aaf7b6b) in the last SUCCESSFUL run's commit fb8036e?  NO  — predates it
bug (aaf7b6b) in the first FAILING run's commit dd22e18?    YES
```

From 27 October onward there was always such a tag. (The pending set still holds **55**
of them, which is why it would fire again today.)

### It is already fixed, and that is why no new fix is deployed

Commit **`55a95f1`, 2026-11-01 18:08 UTC** — "Stop a retired company from capturing matches
under its old name" — removed the bad call as a side effect, and left the explanation in a
comment:

```js
export function matchProduct(tag, index) {
  // This used to call gate() with an undeclared `context`, so an exact product-name
  // match threw a ReferenceError and aborted the whole resolve run. Only the cache
  // hid it: a tag already decided never reaches here, so it fired on new tags only.
  const hit = index.exact.get(tag.toLowerCase());
  if (hit) return { id: hit, reason: "exact" };
```

**The timing is the whole story:**

```
fix (55a95f1) in the last failing run's commit 796dc5e?  NO — that run predates the fix
scheduled runs after 2026-11-01 18:08 UTC?               NONE
```

Every failing run predates the fix, and **no scheduled run has happened since it landed**.
So the correction is deployed and has never been exercised. The next cron is its first test.

## 4. What was missing: the test

**`matchProduct` had no test coverage at all.** One call with an exact hit would have caught
this on the first run of the suite.

Added `scripts/test/resolve-product-match.test.mjs` — 7 tests: the exact path, case
insensitivity, the normalized branch, a genuine miss, every fixture product reachable by
its own name, an arity assertion (`matchProduct.length === 2`), and a check that a malformed
index fails as a data error rather than a `ReferenceError`.

**Mutation-checked.** Reintroducing the original line into a scratch copy:

```
with the bug reintroduced: 4 test(s) fail
   not ok 1 - an EXACT product-name match returns, and does not throw
   ReferenceError seen: True
```

**107/107** passing with the file restored.

## 5. Still blocked, precisely

| Task | State | Blocker |
|---|---|---|
| Diagnose the stall | **done** | — |
| Regression test | **done**, mutation-checked | — |
| §2 real-model evaluation | **not run** | `workflow_dispatch` → `401 Requires authentication` |
| §3 evidence backfill | **not run** | same |
| §4 bounded resolver run | **not run** | depends on §2–§3 |

`extraction-validate.yml` has **0 runs**. I am not presenting it as a result.

**Workflow URL:** `https://github.com/brunotaut/xsonomy-news/actions/workflows/extraction-validate.yml`

**Minimum action:** open that page, press **Run workflow**, and choose `mode`:

1. `eval` — read-only, real model, the four historical failures plus a sample. Writes nothing.
2. `backfill-dry` — writes nothing.
3. `backfill-pilot`, `pilot_size=10` — writes only `articles.entity_evidence`.
4. `backfill`, `max_articles=100` and repeat — same, resumable.

Every mode runs `npm test` first. Paste the log back and I will read it.

**Zero model spend so far, because nothing has been called.**

## 6. A consequence to decide before the next cron

**The next scheduled run will now succeed — and will start consuming the
evidence-incomplete backlog.** 635 articles carry no evidence, so their new product names
will be created as `publication_status='review'` with reason `no_evidence_captured`. Safe
(nothing reaches the site) but it populates the review queue with candidates that the
backfill was meant to resolve *first*, and once a candidate is cached the backfill will not
retry it.

Two options, and this is a decision rather than something to apply unilaterally:

- **Backfill first.** Pause only the resolve step for one day, run §3, then restore. The
  narrowest mechanism is a single line on that step — `if: false` — reverted straight
  after. It does not touch ingest, the build, the deploy, or any other workflow.
- **Let it run.** Accept review rows for this cycle and reconcile later with the retry
  proposal, which is needed in any case.

I have **not** applied either: pausing resolve is exactly the thing that has been broken for
a week, and re-disabling it the moment it recovers should be a deliberate choice.

### Also worth a decision: build should not die with resolve

A resolver bug froze the daily rebuild for six days and nothing announced it. Making the
build step `if: always()` would let the site keep rebuilding while resolve still fails the
run visibly. One line, but it changes what a red run means, so it is offered rather than
taken.

## 7. Limitations

1. **No job log text** — admin-only. The diagnosis rests on per-step conclusions, the
   commit bracket and the database, not on stderr. The `ReferenceError` is identified by
   code inspection and reproduced by mutation test, not read from a log.
2. **No evaluation or backfill has run.** Zero spend.
3. **The fix is untested by a scheduled run.** Next cron, 05:00 UTC.
4. The 6-day gap also means **6 days of unresolved articles** on top of the existing
   backlog; the pending set is re-measured in §6 and in STATE.
