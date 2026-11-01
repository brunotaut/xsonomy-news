# Exact rollback manifest — investor semantics pass, 2026-11-01 17:02–17:40 UTC

**Replaces the date-scoped delete commands in
`research-agent/reports/2026-11-02-investor-financial-ledger.md`, which were unsafe.**

**This manifest covers ONE of four passes that wrote to these tables on 2026-11-01.** The
coverage pass of 18:43–19:05 and the Tech Horizons correction that followed it have their
own manifest, `README-investor-rollback-manifest-2026-11-01-coverage-and-correction.md`.
Reversing this pass alone, against a database that now carries both later passes, is the
*selective* scenario below — not the one the row counts in §4 describe.

## Two scenarios, and they are not interchangeable

| | **A — at the original checkpoint** | **B — selectively, against today's database** |
|---|---|---|
| Assumed state | Nothing has been written since 17:40 | Two later passes have been applied |
| Migrations | May be reverted (§3) | **Must not be reverted.** The three migrations add shared objects the later passes depend on: the `metric_type` vocabulary now carries `cumulative_capital_raised`, 107 later metric rows are typed against it, `investor_financial_research_log` holds 63 later rows, and `retired_kind` is set on a row this pass did not touch |
| §2 re-typings | Reversible for `metric_type`; see the per-field notes | Same, and the same fields stay unrecoverable |
| `retired_kind` | Column disappears with the migration | See §2 — one of the two rows belongs to another pass |
| §4 assertions | Hold | **Do not hold.** They describe the database as it stood at 17:40 |

Everything below is written for **B** unless a line says otherwise, because B is the only
scenario that still exists.

## Why the old instructions were dangerous

They scoped deletes by date, e.g.
`delete from investor_financial_metrics where checked_at='2026-11-01' and created_at::date='2026-11-01'`.
Three separate passes wrote to these tables on 2026-11-01, so those predicates were far
wider than the batch they were meant to reverse. Measured:

| Table | Rows created 2026-11-01 | Rows this batch actually inserted |
|---|---:|---:|
| `investor_financial_metrics` | **101** | 51 |
| `investor_companies` | **103** | 27 |
| `investor_research_vehicles` | **36** | 17 |
| `companies` | **34** | 8 |
| `slug_redirects` | **40** | 0 (the redirects that day were the Exail and product batches) |

Running the old rollback would have deleted **every current financial observation**, not
51 of them. The manifest below is frozen IDs instead of a predicate.

*(It also corrects a count in that ledger: the batch inserted **27** relationships, not 26.)*

## Provenance method, stated plainly

These IDs were reconstructed after the fact, from the `created_at` window
`2026-11-01 17:00:00+00 ≤ created_at < 18:00:00+00`, which isolates this batch cleanly —
the earlier investor pass wrote in the 00:00 hour and the hub/portfolio pass in the 14:00
hour, with no overlap. The per-table counts recovered from that window match the counts
the batch reported, which is what makes the reconstruction trustworthy. The IDs are now
literal, so the window is never needed again.

## Reversal order (dependency-aware)

`investor_financial_metrics` and `investor_companies` reference
`investor_research_vehicles(id)` with `on delete set null`, so vehicles could be dropped
first without error — but doing so would silently orphan rows that are about to be
deleted anyway. Reverse in this order:

1. metrics (51 delete) → 2. relationships (27 delete) → 3. fund positions (4 delete) →
4. vehicles (17 delete) → 5. research-log rows (55 delete) → 6. metric re-typings
(5 update, before-images below) → 7. the MITS bridge (1 update) → 8. `retired_kind`
backfill (2 update) → 9. unresolved-holding rows (6 insert, 2 update) →
10. companies and their aliases (8 + 6 delete) → 11. the three migrations.

## 1. Inserted rows — delete by id

### `investor_financial_metrics` — expect 51 rows affected
```
05781626-7bc1-4abd-8066-5d11ce1d308c 0a922b9b-613b-4eaf-9c43-43cc69d297e6
0bd11664-8727-40c7-97c5-890167a59f98 0d5c283f-82d1-4b9c-bb85-912cfc18e1b1
1dc95841-dd7e-4cdc-8543-06bd7e91d604 1dd37807-e307-41ab-8205-510b22bd6e7a
1ea143f1-218e-4f5c-8bec-ddcf96274d56 35e9e828-ee94-4eb3-a019-fccb5b2a90af
3e72712a-45b6-44b7-9572-53d4e2adce9c 43dc298b-c77a-4531-b292-30f96e2a5c68
458b0a34-f3d5-4e7a-a97f-e16bef35387d 4d57aafb-c3c6-4ced-b464-e43216d5b03a
4f6429fd-ea18-4441-a5e6-c5dd5c538344 4f903f8e-a056-4e82-b2af-17482096470b
52f719f9-11a5-44f3-8c08-295f2d06b0e5 5f2fadbb-62b3-43ca-ba9b-553fa01a18eb
6b983465-2d8d-48ad-94a0-e7d20a0371f0 787781a8-ce31-4fe8-826e-80370d8c2121
7a21aae6-817b-49c1-b121-72ed42b0ab6c 8081f709-1adf-46b6-aed3-ead04d908cee
812da7d7-b745-45be-ae88-93345bc38d42 81da94a3-ceaf-4a22-92ce-62fc2e82c86f
8ddcf658-2d7b-437c-a835-4f8b45bcc376 8e643bbe-c6d1-4e7a-aed3-2f2d6e91e5d7
8f4fa2d7-2218-4af3-b082-33c21417fc9f 9209cccf-9c0a-4b85-ab40-3350b14c817f
9ab0ca0b-bbd9-455a-9b9e-9670e824aaff 9cb4925a-0435-48b0-8b09-7ab5d3c7e8d3
a831f3ab-2be7-4340-b571-1e19457aebee a8acb075-945d-4682-9e2b-d24f72951693
ac7e284f-7bd5-47a4-9575-8c281f0b9eb3 acfdfd9f-8069-490d-be29-de516741fff7
ae48b672-8473-4ff3-b046-fa30100c3230 b233b18e-65ec-452d-8e5e-a552fa81f31c
b236a0d0-c429-4d90-8fd3-fd7652d7d26c b5ea389e-b3f8-40ab-86be-0389a04daf16
b860cb8e-c5a8-477a-b864-80be8dc8b4e8 ba6adba1-6020-45cf-9659-804bf7343c0e
bd379872-60cf-4fb2-bdbf-1ca242664ca3 c5d04819-8701-43b4-b737-07b2511821e1
c9e6ad7c-1763-448f-9ef5-37ebb3211eb4 d386a042-8300-40e2-8e09-ac4a16ba5265
d4619ea3-7c40-4d3f-9baf-db59de7133f6 dde90113-ea76-4d86-b96e-4c9c03f8b39c
e0976f63-2166-41a3-8437-57a8ba5ee958 e1910afe-6d75-4625-9752-a172483bc69b
e914b7e0-2e96-44ca-bf4f-0452638a42e3 ed7bbb62-dd29-4a94-8c5c-9fbdcf0a67f8
ee832e42-c79f-42d7-b7cb-7b8d781a567c eff77d14-bf86-4b7d-87a7-164b0f1bdee1
fa921272-9b9a-4e53-b4f5-1a966feded98
```

### `investor_companies` — expect 27 rows affected
```
07319a79-3149-462e-935b-7c627c4b3ad5 0ef3af40-92af-42fc-854f-875a750f9547
164604ca-05d9-4e5c-a6f5-41a5ae538226 16b46fb8-692c-41dc-bce9-056a256f7bce
26017eb1-ce8b-4106-8546-a123392a75b9 3e5333fd-034c-4152-a16b-34bcff2353ec
400953fe-9dda-481e-a16c-7ac13903547b 4a016a29-2f0a-4c4a-961b-68b1b9b3c09d
4d4ac807-bca4-464f-b779-9c87206e64e3 551f3638-832b-4b68-9e39-fc03726b6a87
61fa3c73-537b-487b-97b1-41a97b021416 6cf2d177-6dd6-40a4-a2d5-d7e25da2f150
72b73576-bc19-4e42-9117-dec7dfa75e8a 7a7c240b-db69-48d0-805b-677d58081ee6
7eb4f12c-3212-44a0-99cc-1180db6abdea 9caf573c-38bb-4b5f-8962-f8d630b48629
a8902aac-ac4d-4f9d-8d16-7b10e31d598a b2759705-9997-4738-891e-86ccd0a86489
b6aa154e-2d25-43fd-b5c3-fa66c2611491 bf98da44-2566-42a7-aa98-ffac78750345
d4bf74c7-0300-420e-8d93-e1463168be6a d555be58-60ad-4b44-95b4-bfcfa7083e62
d90e95e3-d4b7-4694-93b8-ce4eed5dad64 ecc1d06b-de80-4a8f-96b4-59436958a537
f63cfc40-f955-4bd6-8b33-e1c71e592b67 f788f46a-8b00-4a6f-a0f2-41a3233b9f38
fcfeb47f-58c6-4540-b88e-d04f3b55976a
```
One of these 27 is the Nazca → Teltronic row, which is stored **retired**
(`retired_kind='holding_ended'`) and is therefore not in the public export; deleting it
removes a historical record, not a live holding.

### `investor_fund_positions` — expect 4 rows affected
```
49bbc6f2-e419-4ff0-88b0-947628e8b9e0 9e9b7f94-ed60-42c3-9d3d-65e6e9d01515
d729757e-9a1b-4fb4-a787-f5eac6d5851d eaec55eb-2e40-43c0-8b53-464b67a0aa47
```

### `investor_research_vehicles` — expect 17 rows affected
```
04fb2686-899a-454b-8fb0-fe09e9be2c6a 07d8dc26-6b5b-495d-bfae-2e4e7b85363b
0c001d9b-8750-437d-85a5-dc644de91fd6 126175ad-4ec5-4fa2-ace5-e9bb32f04503
1b8477fd-f97e-4910-b56c-87e53990becc 30351c86-eeda-4dd8-a6fd-fc5483d3b3fc
47417c1e-7029-4479-8785-d1bcebb6c35d 80c5b5e2-1c77-4827-bcef-bb0dacddbdfb
8b0c0187-a1c7-4788-89f0-449030db05c5 a056b99a-c7a3-48b9-a0dd-e40ba9ecab46
b405b9fd-4026-437c-b8fb-28d614cfaa1c c263286d-e5cc-4b04-9745-cc481514d70c
cf9ba429-072f-4d64-8182-c4ed28577db9 e455a7fb-c006-4cd4-b576-b1c66b6150d0
f4f92cfb-2cd1-476a-9670-9133c4341624 f588b569-3509-4863-afa1-82825945a2e5
ff2948c5-1864-4b54-be23-b3173c5fc132
```

### `investor_financial_research_log` — expect 55 rows affected
```
01c1dfb4-cc7f-4b02-ae35-0b8ebb08925d 02c19008-2a44-48c7-a645-4f7b32338f6a
0b1888f9-2ac9-47ff-93bc-30dcb16c2fb0 0ee41d40-8fe2-4045-9830-4a552e55207f
1cf9a5e0-ce7c-471d-be38-d37cb88d1b6b 262647d6-231b-4b3b-9ced-3f42bbee39eb
29c5effa-30c6-45ce-aab2-b1b5708c2ad5 2ad84f87-a8c9-46b7-b67f-9861cf84abc5
2cc69f19-1c23-4d54-a797-61fe2bfa2dd7 35b81da3-b033-411b-a1b8-ade627342537
38d01e65-e3c8-4687-b3e6-5d2008eb343b 3a950df4-bfc8-45e7-b25a-de87b34a4357
3b358faf-4ef6-4b9c-97a1-2166fb120020 3b792b86-55ed-4a0f-80b0-892fcc6fa325
4246d8d6-1641-4672-a721-4ecfe0224863 4b4e16b6-a26a-4a4b-8547-4c5bdbbbb6a7
4d19459e-275b-440c-9451-8ed3120d091e 4ee1a701-b6c5-4b4b-b8f4-099a9150dc38
5759a9fb-d540-4ee4-a318-2915a0acef6a 5d3b66f5-af25-480d-bc1f-f172dfac0588
62ad901a-1827-4d8f-81f9-735711e26ffa 62bc837b-1c17-4bee-b948-81d42c57d2d3
6e41aabd-52f4-44f1-a261-2f320b2ec792 6e60b6a7-c857-4654-b3bd-4589733a9d97
6f1c4833-d99c-45dd-82e5-77f974e164d7 7027fe44-2945-4f46-9ba6-c7a2f6a682c8
75faa003-8389-457c-aefe-7e1391fb2030 7d127f94-e70f-496d-8e11-57167adaefa8
80a09639-ecab-4283-bef2-a24442ac2c16 83a431cd-ec74-4e19-b5f7-396b00da97c8
8fabe72b-7614-493f-8748-0514f4297c37 929d1456-0f46-4225-b4f4-0893147c0cc3
92dd640f-b77f-46aa-89e6-f2bee984785b 935455f5-d1e1-4437-aba4-d45b0eeb2db6
9899685f-94f1-4507-909e-c3d2a5767f27 996ffafa-0d0f-43fa-8423-a7e7a8a2c004
9f7a242c-0d3a-44e5-b827-fe7237ef572c a1c86c70-2d31-427f-9c56-c981f5c25fb0
a5259a74-3bbc-428d-94a2-c6efa4aeceec ac3abfca-e0da-45f1-8958-a05fdc0e423d
b79a584f-104c-4ee1-acae-b5c8b9fb7b7a b9c6b046-38f8-4bb7-b427-7c765d29fd82
ba16afde-b629-460c-96f4-4dbb46486d2f ba2d4374-7676-4ae8-8be6-01a29d062f6c
bc249a7c-361d-458e-a100-c3e8ec1e9abf c8924d3c-fdf8-4204-be2e-91cbce0bea3d
ca75eeea-05e1-4468-bc51-48a775094f7a d1259a03-29e0-4ea3-b3d0-62850202c9b9
d416043e-22c6-4787-8815-ac7308d56698 d527d8db-aa3a-4b14-8476-03ca6382ffb0
f1c30627-8f0a-4bfd-9a6c-0652d32ca11a f88e1dd8-67ee-478c-a377-20cbc4eea543
f908dc04-1b2f-4501-81ce-39ecac6b318c fe8032f0-f772-4eec-9ae2-23a8ea797d67
ffbb4c3e-1c3d-46cd-9696-96067c575806
```

### `companies` — expect 8 rows affected (aliases cascade)
```
26bc19fc-4031-4fd9-835a-e4362b33830e  abx-dynamics
67f10721-c68d-4c72-bf66-867a47a4ba4f  sky-hunter
832b6d37-89a1-42ea-9947-70861509faf6  teltronic
858f2eeb-5165-4c93-94e5-e5da821c572b  exotrail
8b8cd048-044a-4dd1-809c-89404e615700  scandinavian-x
8f39e122-de72-4c6d-ac69-5bcc5d8d9bad  vrgineers
a99742f0-7c1a-4c70-b6de-41d3a269ad9b  vermeer
f2d8a613-379f-4854-94b3-2dded616e97b  eu-motors
```
None carries a `company_sectors` or `landscape_candidates` row, so deleting them cannot
change the landscape count. **Delete the relationship rows above first**, or the
`on delete cascade` on `investor_companies.company_id` removes them for you and the
expected row counts no longer match.

### `company_aliases` — expect 6 rows affected (or 0, if the companies went first)
```
17317483-bb0a-4ef3-8bb8-a91743ce1036  ABX Dynamics AB
2c5e40ce-3f94-4ed1-a8a6-872e9fc6bc34  PowerTrunk
48a2ca1f-e939-41ae-8778-09cd9b66ce97  Scandinavian X AB
a50c20d7-012f-491d-886c-e32954143507  SkyHunter
b1735152-1e00-472d-8475-33cf83bca085  EU Motors Sp. z o.o.
b5fcdccf-9e5f-4b19-b3e8-a8f5275ed206  VRgineers, Inc.
```

## 2. Updated rows — before-images

### The five metric re-typings — expect 1 row each, with a guard

Each statement carries the value to restore **and** the value the row must currently hold.
If the expected current value does not match, the row has been changed since and the
statement must affect 0 rows — which is an abort, not a success.

| Metric id | Restore `metric_type` | Expect current `metric_type` | Also restore | Guard on |
|---|---|---|---|---|
| `73fc025e-739c-4472-b015-790075232879` | `manager_aum` | `vehicle_nav` | `vehicle_id = null` | `amount_min = 421300000`, `currency = 'GBP'` |
| `0f58d997-2207-4311-9b20-a4eed83f766c` | `initial_investment_range` | `average_investment_size` | `bound = 'approximate'`, `amount_max = 20000000` | `amount_min = 20000000`, `amount_max is null` |
| `e505f068-8ceb-4d36-ac9d-abf1cf61bcfc` | `cumulative_capital_invested` | `grant_funding_disbursed` | — | `amount_min = 6200000000`, `currency = 'UAH'` |
| `59ebaf8f-067e-4d71-a1a9-60fa7d6246a7` | `investment_count` | `grant_count` | — | `count_value = 1000` |
| `fb2f357e-56e4-4118-ae8b-ebb309b2a10a` | `fund_size_target` | `fund_size_stated` | **see below** | `amount_min = 50000000`, `currency = 'EUR'` |

The shape, with the guard in the `where` clause so a changed row is skipped rather than
overwritten:

```sql
update investor_financial_metrics
   set metric_type = 'manager_aum', vehicle_id = null
 where id = '73fc025e-739c-4472-b015-790075232879'
   and metric_type = 'vehicle_nav'                   -- expected current value
   and amount_min = 421300000 and currency = 'GBP';  -- and it is still the same figure
-- expect 1 row. 0 rows means someone else has edited it: stop, do not force.
```

**`scope_en` and `display_en` for all five: AUTOMATIC ROLLBACK UNAVAILABLE.** The previous
instruction said "scope and display per the superseded report". No report records them.
Those ids appear nowhere in this repository except this manifest and its test, the reports
record only the `metric_type` changes, and there is no audit table and no trigger, so the
prior text is not recoverable from the database either. A reversal therefore restores the
type, the vehicle, the bound and the amounts, and **leaves the scope and display text as
this pass rewrote it**. That is a partial reversal and is recorded as one. Inventing the
prior wording would be worse than saying so.

**`fb2f357e`'s `vehicle_id`: do not null it.** The previous instruction said to restore
`vehicle_id = null`. The vehicle it points at, `31363d2b-2631-46bf-a31b-eca20d3f52d6`
(Flyer One Ventures Fund V), was created at **00:16** — by the first pass of the day, not
this one. Nothing establishes that *this* pass attached it, so nulling it may destroy the
00:16 pass's attribution. Leave `vehicle_id` alone and revert only `metric_type`.

Contrast `73fc025e`, where nulling the vehicle **is** safe: its vehicle
`0c001d9b-8750-437d-85a5-dc644de91fd6` (Seraphim Space Investment Trust plc) was created at
17:02, inside this pass, so it did not exist before and the metric cannot have pointed at
it. That is the test: a metric's `vehicle_id` may be reverted to null only when the vehicle
itself is in this manifest's insert list.

Restore the **CHECK constraints last**, and in scenario B not at all: the old `metric_type`
CHECK rejects `vehicle_nav`, `grant_funding_disbursed`, `grant_count` and
`average_investment_size`, so re-typing these five must happen **before** the migration is
reverted — and the migration cannot be reverted at all while later rows depend on the
vocabulary it added.

One further metric, `fcbfda07-7b90-480f-be87-78f99d8e86c1` (Flyer One cumulative), had
only its `scope_en` sharpened. Prior text, recorded verbatim and therefore the one scope
reversal that **is** available:
`'Cumulative investment over seven years; manager-wide, all sectors'`.
Guard: `amount_min = 46000000 and currency = 'USD'`.

### The MITS bridge — expect 1 row
`update investor_research set matched_investor_id = null where id = '51ea94a6-1aee-4f49-9255-11fb92d0055f';`
(before-image: `null`.)

### The `retired_kind` backfill — ONE row, not a predicate

The previous instruction here was, in words rather than as runnable SQL so that it cannot
be copied by accident: *update `investor_companies`, setting `retired_kind` to null
wherever `retired_kind` equalled `'unsupported_evidence'`* — with an expectation of 2 rows. That was wrong three times over, and the evidence is in the
rows themselves:

| id | investor → company | `created_at` | `updated_at` | Whose change? |
|---|---|---|---|---|
| `788055c2-87e8-4ff5-9163-b488dcc18c11` | EIFO → Six Robotics | 00:21 | 00:21 | **Not determinable** |
| `fa0fec40-56f8-472e-8cf8-f01d1058c461` | Rockaway Alpha Defense → JISR Institute | 00:21 | **18:39** | the 18:43 pass, not this one |

1. **The predicate reaches another pass's work.** `fa0fec40` was retired at 18:39, by the
   coverage pass. It is not this batch's row and must not be touched here.
2. **`retired_kind = null` is not the before-image anyway.** For `fa0fec40` the whole
   retirement — `retired_at`, `retired_reason` and `retired_kind` — was applied in one
   statement, so nulling only the kind leaves a half-retired row.
3. **It would fail.** `investor_companies_retired_kind_with_retirement` requires the kind
   to be non-null whenever `retired_at` is set, so `set retired_kind = null` on a row with
   `retired_at = '2026-11-01'` is rejected. The safe sequence clears the three columns in
   one statement:

```sql
-- scenario B: this pass's own row only. Expect 1 row; abort if 0.
update investor_companies
   set retired_at = null, retired_reason = null, retired_kind = null
 where id = '788055c2-87e8-4ff5-9163-b488dcc18c11'
   and retired_kind = 'unsupported_evidence'          -- concurrency guard
   and retired_at = '2026-11-01';
```

**And even that one is not safe to run — see the next section.** `788055c2`'s
`updated_at` equals its `created_at`, which means the statement that set its `retired_kind`
did not touch `updated_at`. There is no trigger on this table (verified: no non-internal
triggers on `investor_companies`), so `updated_at` is maintained only when a statement sets
it explicitly, and it therefore cannot attribute this change to a pass. Its own
`retired_reason` cites a fund position that has existed since **14:38**, so the retirement
happened at or after 14:38 — in the 14:38 pass, this one, or the 18:43 pass. Nothing in the
database distinguishes them.

### `788055c2` — AUTOMATIC ROLLBACK UNAVAILABLE

Its pre-retirement values are not recorded and its authorship cannot be established.
Reverting it might restore a row the 14:38 pass deliberately withdrew. The retirement
reason is preserved verbatim in the row itself; a human decision, not a script, should
decide whether EIFO → Six Robotics belongs back in the portfolio.

### The six resolved unresolved-holdings — AUTOMATIC ROLLBACK UNAVAILABLE

Six rows were deleted from `investor_portfolio_unresolved`. Their ids were **not captured
before deletion** and cannot be recovered from the database. Their full prior content —
investor, published name, reason text, source URL and reviewed date — is preserved
verbatim in `research-agent/reports/2026-11-01-investor-portfolio-reconciliation.md`, so
they can be **re-created by hand** with new ids. They are:
Purple Ventures → VRgineers · N1 → VRgineers · Sunfish Partners → EU Motors ·
Rockaway Ventures → Vermeer · Bpifrance → Exotrail · Nazca Capital → Teltronic.

**This is marked unavailable rather than papered over with a broad delete.** Re-creating
them restores content, not the original ids.

### The two re-worded unresolved rows — exact ids

| id | investor → published name | Prior `reason` |
|---|---|---|
| `d1c22105-1ef4-4fd1-af76-8b07fc84dbb5` | Rockaway Alpha Defense → URC | quoted verbatim in `research-agent/reports/2026-11-01-investor-portfolio-reconciliation.md` |
| `d28640fb-0bc8-42d2-aa78-d415a827c8bf` | Verve Ventures → ANYbotics | same |

`reason`, `source_url` and `reviewed_at` were rewritten. The previous instruction said to
match them by `(investor_research_id, portfolio_name_as_published)`; the ids above are
better, because that pair is a natural key and natural keys move. Note that **both rows
were also written to again at 18:39** by the coverage pass, which set their `disposition` —
so in scenario B a reversal here must not also clear `disposition`, which belongs to the
other manifest.

## 3. Migrations — scenario A only

In **scenario B these three must not be reverted.** Each one adds a shared object that
later passes now use, so dropping it destroys work this manifest does not cover:

| Migration | Shared object | Who depends on it now |
|---|---|---|
| `investor_financial_research_log` | the whole table | **63** rows written by the 18:43 pass, plus this pass's 55 |
| `investor_companies_retired_kind` | `retired_kind` + two CHECKs | set on `fa0fec40`, retired by the 18:43 pass, and on `f63cfc40` |
| `investor_metric_types_vehicle_nav_grants_average` | the `metric_type` CHECK vocabulary | later migration `investor_metric_cumulative_capital_raised` rewrote the same constraint, and **107** later metric rows are typed against it |

In scenario A, revert last and in reverse order:

1. `investor_financial_research_log` → `drop table public.investor_financial_research_log;`
2. `investor_companies_retired_kind` → drop the two CHECKs, then the column.
3. `investor_metric_types_vehicle_nav_grants_average` → restore the prior `metric_type`
   and `shape` CHECKs and drop `investor_financial_metrics_vehicle_nav_needs_vehicle`.
   **The five re-typings in §2 must be reverted first** or this fails.

A fourth migration, `investor_metric_attribution_guards` (2026-11-01, the correction pass),
added a composite foreign key from `investor_financial_metrics` and `investor_companies` to
`investor_research_vehicles (id, investor_id)`. It does not block any delete in this
manifest — deleting a metric and then its vehicle still satisfies it — but it does mean a
vehicle cannot be deleted while a metric still points at it, so the order in §"Reversal
order" is now enforced by the database rather than merely recommended.

## 4. Dependency checks — run these BEFORE any delete

Exact ids do not make a delete safe on their own: a row inserted later may reference one of
them. Each query must return **0**.

```sql
-- a later metric pointing at a vehicle this manifest deletes
select count(*) from investor_financial_metrics
 where created_at >= '2026-11-01 18:00:00+00' and vehicle_id in (<the 17 vehicle ids>);
-- a later holding pointing at a company this manifest deletes
select count(*) from investor_companies
 where created_at >= '2026-11-01 18:00:00+00' and company_id in (<the 8 company ids>);
-- a later fund position pointing at one of those vehicles
select count(*) from investor_fund_positions
 where created_at >= '2026-11-01 18:00:00+00' and target_vehicle_id in (<the 17 vehicle ids>);
```

Measured on 2026-11-01 after the coverage pass: **0, 0, 0.** The 107 later metric rows and
68 later vehicles are disjoint from this manifest, so no later row blocks it today. Re-run
the checks rather than trusting that sentence: it was true at one moment.

## 5. Assertions — scenario A only
These describe the database as it stood at 17:40 on 2026-11-01. **They are not expected to
hold in scenario B**, where two later passes remain applied; they are kept because they are
the only record of that checkpoint.
```
investor_financial_metrics where is_current            = 49
distinct investors with a current metric                = 23
investor_companies where retired_at is null             = 74
investor_fund_positions                                 = 9
investor_portfolio_unresolved                           = 13  (only after manual re-creation)
companies where publication_status='live'               = 2456
landscape_candidates included, europe-uav-cuas-2026     = 567  (unchanged throughout)
```

For scenario B the only assertion that can be stated in advance is per-statement: every
delete and update above carries its own expected affected-row count, and a mismatch aborts.

## 6. Unavailable reversals, collected
1. **The six deleted `investor_portfolio_unresolved` rows** — ids not captured; content
   preserved in the reconciliation report; re-creatable by hand with new ids.
2. **`scope_en` and `display_en` of the five re-typed metrics** — prior text recorded
   nowhere.
3. **`fb2f357e`'s `vehicle_id`** — cannot be shown to have been set by this pass.
4. **`788055c2`'s retirement** — authorship not determinable; pre-retirement values not
   recorded.

## 7. Not executed
This manifest has **not been run**. Nothing in it was executed against production. The
delete-by-id and update-by-id shapes, the concurrency guards, the dependency checks and the
constraint ordering were exercised against fixtures only; see
`scripts/test/rollback-manifest.test.mjs` and `scripts/test/rollback-scenarios.test.mjs`.
