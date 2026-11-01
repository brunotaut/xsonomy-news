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

See the deployment section below for the measured values. Live checks: Tech Horizons shows
two observations, both against `Tech Horizons SCSp`; investor and portfolio counts are
unchanged; and `/companies/jisr/` and `/companies/kara-dag-technologies/` still resolve
through their redirects, so the merges broke no indexed URL.

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
