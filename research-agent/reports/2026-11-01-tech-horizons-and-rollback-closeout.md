# Closeout — Tech Horizons identity, and rollback safety finished

1 November 2026. A correction pass, not a research cycle: one record, two manifests, four
tests and three migrations.

| Part | Outcome |
|---|---|
| 1. Tech Horizons identity and metric attribution | **Resolved — one organisation.** Both observations kept, one re-sourced, one superseded |
| 2. Rollback safety | The predicate is gone; four reversals are now marked unavailable by name; the latest two passes have their own exact-id manifest |
| 3. Validation and deployment | Catalogue **75/75**, news **48/48**; deployed and verified live |
| 4. This report | — |

---

## 1. Tech Horizons: the same organisation, matched on a register number

The record carried a €150M raise attributed to Presto Tech Horizons and a €300K–€3M ticket
range attributed to a Luxembourg "Tech Horizons" profile, both pointed at one vehicle, with
a sentence of prose saying the match was unproven. The brief is right that this is not good
enough, and it was resolvable.

**The decisive fact is a registration number, not a name.** The manager's own legal notice
gives `RCS Luxembourg B282214`. The Luxembourg register's entry for **B282214** carries the
name history:

| Name | Recorded |
|---|---|
| Presto GP III Sàrl | 4 December 2023 |
| Presto Tech Horizons GP Sàrl | 24 October 2024 |
| Tech Horizons GP Sàrl | 3 April 2026 |

So the Prague-launched "Presto Tech Horizons" and the Luxembourg-domiciled "Tech Horizons"
are the same organisation, under one register number. Three independent corroborations:

- The launch coverage calls it **Presto Ventures' third fund**, and the register shows the
  fund vehicle (B283213) was formerly **Presto Ventures III SCSp**.
- The portfolio on the manager's own site holds **Vidar Systems** and **Bavovna AI** — the
  startups the October 2024 Presto Tech Horizons coverage named as its first investments.
- That site still carries news headlines styled "Presto Tech Horizons".

**Domicile and office are now separate fields, not a pending question.** Domicile:
Luxembourg — `Tech Horizons SCSp`, a sub-threshold AIF at 73–75 Parc d'Activités, L-8308
Capellen, managed by `Tech Horizons GP S.à r.l.` Office: Prague, the Presto Ventures team.
CSG (Czechoslovak Group) is industrial partner and anchor investor. The record's old note,
"office vs domicile pending verification", is answered rather than deleted.

### Sources

| What it settles | URL |
|---|---|
| `Tech Horizons SCSp`, the GP, the Capellen address, **RCS B282214**, €1M–€5M tickets, the 10-company portfolio | https://www.techhorizons.eu/ |
| The B282214 name history and the Presto Ventures III → Presto Tech Horizons → Tech Horizons chain | https://www.northdata.com/Presto%20Tech%20Horizons%20GP%20S%C3%A0rl,%20Capellen/B282214 |
| €150M at launch, June 2024, Presto Ventures with CSG | https://www.vestbee.com/insights/articles/presto-ventures-launches-a-150-m-fund |
| The launch itself, CSG's role (no amounts on the page) | https://tech.eu/2024/06/26/presto-ventures-and-czechoslovak-group-launch-presto-tech-horizons-fund/ |
| The aggregator profile the €300K–€3M range came from | https://www.sesamers.com/investor/tech-horizons/ |
| **The citation that did not support its figure** | https://parsers.vc/news/251121-european-defense-tech-fund-secures-150m/ |

### Two corrections the identity work uncovered

**The €150M cited an article about a different fund.** Its source was a November 2025 piece
headlined "European Defense Tech Fund Secures €150M" — which reports **Keen Venture
Partners'** €150M first close. It mentions Presto Tech Horizons once, in passing, with no
amount attached. Two funds, the same number, and the citation had attached one fund's
figure to the other's article. Re-sourced to the June 2024 launch coverage and re-dated
from `2025-11` to `2024-06`. It stays an **announced launch size**: the manager's own site
publishes no fund size, so there is still no close to report.

**The €300K–€3M ticket range is contradicted by the manager.** The fund's own site states
**€1M to €5M**; the June 2024 launch coverage stated €500K–€5M. The aggregator figure
matches neither — it is contradicted by the primary source, not merely unconfirmed. It is
now `is_current = false` with a scope line saying why, kept for audit, and **€1M–€5M** is
stored as `source_confirmed` from the manager's own site.

### Observations: retained, reassigned, withheld

| Observation | Disposition |
|---|---|
| €150M `fund_size_target`, `6586f235…` | **Retained**, same investor, same vehicle. Source, date, display and scope corrected |
| €300K–€3M `initial_investment_range`, `c9403e1e…` | **Withheld.** `is_current = false`, kept in the table |
| €1M–€5M `initial_investment_range`, `9bd93c71…` | **New**, `source_confirmed`, from the manager's own site |
| The North Vector Dynamics Series A (>$20M / $29M) | **Still not stored.** A round total is not this investor's cheque — unchanged from the earlier pass |

Nothing was reassigned to a different entity, because there is no second entity. **No
second record was created from the aggregator profile**, as the brief required.

### Identity conflation elsewhere in the record: checked, none found

- `investor_companies`: **0 rows.** No holding was attributed to either reading, so none
  needed separating. The manager publishes ten portfolio companies; adding them is research,
  not correction, and was deliberately left out of this pass.
- `investor_portfolio_unresolved`: 0 rows.
- Only one directory record matches `%horizon%` or `%presto%`, so there is no duplicate
  entity to merge and none was invented.
- `ticket_minimum` / `ticket_maximum` on the record were left **null**. Ten of 118 records
  use those legacy columns; filling them would duplicate the €1M–€5M range into a second
  representation that could drift from the first.

### Coverage was not preserved at the expense of attribution — it simply did not have to be

118 investors, 102 with figures, **207 observations**: identical before and after. One
observation was withdrawn and a better-sourced one took its place. Had the identity not
resolved, the €150M would have been held back and the count would have fallen; the new
`attribution_status` column exists precisely so that holding a figure back is a supported
state rather than a deletion.

---

## 2. Rollback safety

### The predicate is gone, and it was worse than it looked

The surviving unscoped statement was *update `investor_companies`, setting `retired_kind`
to null wherever it equalled `'unsupported_evidence'`*, expecting 2 rows. It was wrong
three ways, and the rows prove each one:

| id | investor → company | `created_at` | `updated_at` |
|---|---|---|---|
| `788055c2…` | EIFO → Six Robotics | 00:21 | 00:21 |
| `fa0fec40…` | Rockaway Alpha Defense → JISR Institute | 00:21 | **18:39** |

1. **It reached another pass's work.** `fa0fec40` was retired at 18:39 by the coverage pass,
   not by the pass the manifest describes.
2. **Null was not the before-image.** That row's `retired_at`, `retired_reason` and
   `retired_kind` were all set in one statement, so nulling the kind alone leaves it
   half-retired.
3. **It would have failed anyway.** `investor_companies_retired_kind_with_retirement`
   rejects a null kind while `retired_at` is set. The safe sequence clears all three
   columns in one statement — the constraint-ordering problem the brief named, confirmed
   against the actual constraint rather than assumed.

### A provenance finding that changes what can be claimed

**There is no trigger on any of these tables**, so `updated_at` moves only when a statement
sets it. `788055c2` carries an `updated_at` equal to its `created_at` despite having been
updated later, so **nothing in the database says which pass retired it.** Its own reason
cites a fund position that has existed since 14:38, which narrows it to three candidate
passes and no further. That reversal is therefore marked unavailable, not guessed.
`investor_research_vehicles` has no `updated_at` column at all.

### What is now reversible, and what is not

Each update carries the value to restore **and** the value the row must currently hold, in
the `where` clause, so a row changed since affects 0 rows — an abort, not a success. Two
scenarios are distinguished throughout: **A**, at the original checkpoint, and **B**,
selectively against today's database. In B the three pass-C migrations must **not** be
reverted: 63 later research-log rows, 107 later metric rows typed against the widened
vocabulary, and a `retired_kind` set on a row that pass never touched all depend on them.

One rule earned its own test. A metric's `vehicle_id` may be reverted to null **only when
the vehicle itself is in that manifest's insert list.** `73fc025e`'s vehicle (Seraphim Space
Investment Trust plc) was created at 17:02, inside the batch, so null is certain.
`fb2f357e`'s vehicle (Flyer One Ventures Fund V) was created at **00:16**, by the first pass
of the day — so the previous instruction to null it would have destroyed that pass's
attribution. The instruction is withdrawn.

**Unavailable reversals, named rather than papered over:**

1. The six deleted `investor_portfolio_unresolved` rows — ids not captured; content
   preserved; re-creatable by hand with new ids.
2. `scope_en` and `display_en` for the five re-typed metrics. The old manifest said "per
   the superseded report"; no report records them, those ids appear nowhere else in the
   repository, and there is no audit table. A reversal restores type, vehicle, bound and
   amounts and leaves the prose as rewritten. That is a partial reversal, recorded as one.
3. `fb2f357e`'s `vehicle_id` — cannot be shown to have been set by that pass.
4. `788055c2`'s retirement — authorship not determinable, pre-retirement values not recorded.

Plus, in the new manifest: R-G.AI's prior `entity_type` and `research_note`, Defender
Ventures' prior `research_note`, the three `companies.publication_status` values, and the
Tech Horizons log row's prior `sources_checked`. For the two demoted duplicates, `live` is
near-certain from the existence of their redirects — and "near-certain" is written as that,
not as a before-image.

### The latest two passes now have a manifest

`README-investor-rollback-manifest-2026-11-01-coverage-and-correction.md`: exact ids for
**107** metrics, **68** vehicles, **63** log rows, 1 fund position and 2 slug redirects from
the coverage pass, plus every update with its before-image, and five fully-specified rows
for the correction pass. **Passes A and B (00:14 and 14:38) are declared to have no
exact-id manifest** rather than left to look covered.

The dependency check earned its place immediately: the correction pass's new metric
`9bd93c71…` points at a coverage-pass vehicle, so that vehicle cannot be deleted until the
correction is reversed first. Exact ids did not make that delete safe; the check did.

### Two guards, so the next conflation cannot be published

Prose does not filter an export, so the rule is now in the schema:

- A **composite foreign key** from `investor_financial_metrics`, `investor_companies` and
  `investor_fund_positions` to `investor_research_vehicles (id, investor_id)`. One
  investor's figure cannot name another investor's fund.
- `attribution_status`, with a CHECK that an `unresolved_identity` row cannot be
  `is_current`. The export reads only current rows, so an unresolved figure is physically
  incapable of reaching the site while remaining available to the next pass. The catalogue
  generator drops it a second time, from the `attribution` field now carried in the export.

Both were proven in production **by statements expected to fail**, which therefore wrote
nothing: pointing a Tech Horizons metric at Flyer One's vehicle was rejected by the foreign
key, and marking a published metric `unresolved_identity` was rejected by the CHECK. No test
entity was inserted, and no rollback was executed.

---

## 3. Validation and deployment

### Tests

| Suite | Before | After |
|---|---|---|
| Catalogue | 73 | **75 / 75** |
| News | 41 claimed, **40 of 41 actually passing** | **48 / 48** |

**A correction to the previous report.** It reported news 41/41. On the committed tree the
test `the superseded ledger no longer carries a date-scoped delete` was **failing**: the
coverage pass regenerated the ledger and dropped its pointer to the rollback manifest, so
the assertion that the ledger points at the manifest had been red since that commit. The
ledger now points at both manifests and the suite is green. The earlier figure was wrong.

New tests, four of them for exactly the properties the brief named:

- **An unresolved identity cannot publish another entity's observation as its own** —
  catalogue (`investor-export.test.mjs`, two tests: the unresolved figure is absent from the
  export, including its amount, and a row with no attribution field still publishes so the
  guard cannot silently empty the export) and news (`rollback-scenarios.test.mjs`, the CHECK
  and composite-key rules as functions).
- **Unrelated same-day records survive the rollback** — four fixture passes; reversing one
  leaves the other three.
- **Later changes abort rather than being overwritten** — the guarded update matches 0 rows
  when the expected current value has moved, and the test also shows the damage the guard
  prevents.
- **Constraint and dependency order works** — clearing `retired_kind` alone throws;
  clearing the retirement together succeeds; a vehicle cannot be deleted while a later
  metric points at it.

The catalogue test was **mutation-checked**: with the generator's attribution filter
removed it fails on "the unresolved figure must not travel", and passes with it restored.

### Live verification

Deployed by push to `main`; the daily workflow also runs the same build. Commits:
catalogue **`cb68123`** "Refuse to publish a figure whose owner is not established"
(rebased onto three concurrent landscape-page commits, `a33803f`, `aeb9bbc`, `81cc2c1`,
which it does not touch), news **`fdafe62`** "Settle the Tech Horizons identity and finish
making rollback safe". Live URL: **https://xsonomy.com/landscape/** · export:
**https://xsonomy.com/data/landscape-investors.json**

Measured on the deployed file, against the brief's verified baseline:

| | Baseline | Live after deploy |
|---|---:|---:|
| Investors | 118 | **118** |
| With financial figures | 102 | **102** |
| Observations | 207 | **207** |
| Ukraine-linked / with figures | 26 / 23 | **26 / 23** |
| Portfolio relationships | 100 | **100** |
| Linked to published profiles | 82 | **82** |
| Fund positions | 14 | **14** |

**Nothing disappeared.** One observation was withdrawn and one inserted, which is why the
total is unmoved rather than merely close.

Live, on the deployed export:

- Tech Horizons shows **two** observations, both against the vehicle `Tech Horizons SCSp`:
  `€150M announced at launch` (`fund_size_target`, `reported`, as-of 2024-06, vestbee) and
  `€1M-€5M per deal` (`initial_investment_range`, **`source_confirmed`**, techhorizons.eu).
  Its `legalDomicile` reads country `LU`, precision `exact_entity`, with the SCSp, the
  Capellen address, the GP and `RCS Luxembourg B282214` in the note.
- The withdrawn figure is **gone from the file, not merely hidden**: the string `300000`
  does not occur anywhere in the Tech Horizons record, and `parsers.vc` does not occur
  anywhere in the whole export.
- **0 of 207** observations carry an attribution other than `attributed`.
- **0 true zeros.** No `amountMin`, `amountMax` or `count` is 0. (A loose first regex
  flagged six rows; all six are genuine `€0.5–3M`-style ranges with `amountMin = 500000`.
  The requirement that an unknown amount never displays as zero holds.)
- **0** observations missing a scope note; **0** missing a source; **136** name a vehicle.
- `/companies/jisr/` → `/companies/jisr-institute/` and
  `/companies/kara-dag-technologies/` → `/companies/kara-dag/`, all four returning 200, so
  the coverage pass's duplicate merges broke no indexed URL. A sample of the 52 distinct
  published portfolio profile links returned 200 with no breakage.
- The new export caveat is live: *"A figure is published only against the organisation it
  is established to belong to, and only against a fund of that organisation."*

### One limitation, stated again because it bounds the word "validated"

Neither repository holds a `.env`, and the service key lives only in CI, so the static site
cannot be built locally. Validation is the test suites — which run the whole generator
against a fixture API — and then the deployed site itself.

---

## 4. Verified, and still uncertain

**Verified.** The identity, on a register number. That the old €150M citation described a
different fund. That the €300K–€3M range is contradicted by the manager's own site. That
the `retired_kind` predicate reached another pass's row and would have failed its CHECK.
That `updated_at` is not trigger-maintained here. That both new constraints reject the
statements they exist to reject.

**Still uncertain.** Whether €150M was ever closed — no source says so, and the manager
publishes no fund size. Which pass retired `788055c2`. The prior prose of the five re-typed
metrics, and of R-G.AI's and Defender Ventures' notes. Whether `Kara Dag`'s
`publication_status` changed at all in the coverage pass.

**Not claimed.** Complete rollback safety. Passes C, D and E have exact-id manifests with
guards and dependency checks; passes A and B do not, and nine specific reversals across all
five are marked unavailable. A partial historical manifest is what exists, and that is what
this report says exists.

---

## Addendum, 1 November 2026 — the €150M was typed as a target it never claimed to be

**One row changed.** `6586f235-e556-473c-8592-62465887ae82`,
`metric_type` `fund_size_target` → **`fund_size_stated`**.

The scope note already described the figure correctly — "an announced launch size, not a
reported close" — but the **type** said `fund_size_target`, and on the live card that type
renders as the caption **"Fund size (announced target)"**. So the prose and the published
label disagreed, and the label was the one making the stronger claim.

**I rechecked the cited source rather than reasoning from the note.**
`vestbee.com/insights/articles/presto-ventures-launches-a-150-m-fund` says:

> "Czech Presto Ventures launches a €150M Presto Tech Horizons fund to invest in defence
> tech" — headline
>
> "Prague-based venture capital firm Presto Ventures has launched a €150 million Presto Tech
> Horizons fund in collaboration with Czechoslovak Group (CSG)" — lead

**No target language anywhere in it**: no "target", no "aims to raise", no "plans to raise",
and no commitment, first-close or raised figure. It reports a fund *launched at* €150M.
That is a stated size. `fund_size_target` asserted an intention the source does not
attribute to anyone, so the type is corrected rather than the wording.

It is still not a close, either — the manager's own site publishes no fund size — so
`fund_close_announced` would have been the opposite error. `verification_status` stays
`reported`: a trade outlet reporting a launch, not the manager confirming a number.

### What was deliberately not changed

- **`display_en` stays `€150M announced at launch`.** It never claimed a target, so there
  was nothing to align; "announced at launch" is exactly what the source supports.
- **`scope_en` keeps `EUR150m`, not `€150m`.** I checked the corpus convention before
  touching it: `display_en` uses the symbol (33 of 41 target rows, 21 of 26 stated rows)
  while `scope_en` uses the word (only 1 of 26 stated rows uses the symbol). The existing
  text was already right, and "aligning" it would have broken the convention.
- **Amount, currency, bound, vehicle, attribution, `is_current` and the source URL**: all
  untouched.
- **No research was rerun and no rollback work was touched.**

### Reversal

```sql
update investor_financial_metrics
   set metric_type = 'fund_size_target',
       scope_en = 'EUR150m announced at the fund''s launch in June 2024 by Presto Ventures with Czechoslovak Group (CSG) as industrial partner and anchor investor, for defence, security and deep tech across NATO countries and their allies. An announced launch size, not a reported close: the manager''s own site states no fund size. Announced under the fund''s former name, Presto Tech Horizons; the Luxembourg vehicle Tech Horizons SCSp is the same fund, matched on RCS Luxembourg B282214.'
 where id = '6586f235-e556-473c-8592-62465887ae82'
   and metric_type = 'fund_size_stated';          -- expected current value; expect 1 row
```

That is the complete before-image. `investor_financial_metrics` carries no trigger on
`updated_at`, so nothing else moves.

### Counts

| | Before | After |
|---|---:|---:|
| Current observations | 207 | **207** |
| Landscape investors | 118 | **118** |
| `fund_size_target`, current | 41 | **40** |
| `fund_size_stated`, current | 26 | **27** |

No coverage moved — one observation was re-typed, not added or withdrawn. No code change
was needed: `fund_size_stated` already carries the label "Fund size (stated)" and sits in
`FUND_METRICS`, so it has a card slot. The standing test that every type the database can
store has a label and exactly one slot still passes.

### Verified live

```
Tech Horizons  (domicile LU)
  fund_size_stated          €150M announced at launch  exact  reported          Tech Horizons SCSp
  initial_investment_range  €1M-€5M per deal           range  source_confirmed  Tech Horizons SCSp
```

Whole export unchanged where it should be: **118** investors, **102** with figures, **207**
observations, **26** Ukraine-linked, **100** holdings, **0** unattributed. Type totals moved
exactly as intended: `fund_size_target` **40**, `fund_size_stated` **27**.

### A correction to this report's own earlier verification

The main closeout said `300000` "occurs nowhere in the export", offered as evidence that the
superseded €300K–€3M range is not published. **That was the wrong test, and it no longer
passes:** the raw substring `300000` appears **24 times** in the live export — in
Archangel's €300K–€800K, Defence Builder's and Double Tap's $100–300K, Sunfish's €150–300K,
and inside larger numbers such as `3000000`, `300000000` and `421300000`.

A substring search over a JSON document was never going to isolate one investor's figure.
The claim that actually matters is narrower and does hold, checked per record: **Tech
Horizons publishes exactly two observations, and neither is the withheld range.** The
superseded row is `is_current = false`, the view reads only current rows, and the generator
drops anything not `attributed` — three independent reasons it cannot travel, none of which
depend on a text search.

`parsers.vc` genuinely does occur nowhere, and that one is a safe substring test because the
string is a domain unique to the mis-sourced citation.
