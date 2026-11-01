# Exact rollback manifest — the coverage pass and the Tech Horizons correction, 2026-11-01

Two passes that the earlier manifest does not cover:

| Pass | Window (UTC) | What it did |
|---|---|---|
| **D — coverage** | 18:43–19:05 | Took financial coverage from 55 investors to 102; two migrations |
| **E — correction** | 21:05–21:15 | Resolved the Tech Horizons identity; one migration |

`README-investor-rollback-manifest-2026-11-01.md` covers pass C (17:02–17:40). Passes A
(00:14–00:21) and B (14:38–14:45) have no exact-id manifest; that is stated plainly in §5
rather than implied by its absence.

## How these ids were obtained, and the one thing that makes them trustworthy

`created_at` windows. The four passes are separated by hours of silence — the minute
histogram shows writes only at 00:14–00:21, 14:38–14:45, 17:02–17:40, 18:43–19:05 and
21:05–21:15 — so the windows do not overlap and the per-table counts recovered from them
match the counts each pass reported. **`updated_at` was not usable for this.** There is no
trigger on any of these tables, so `updated_at` moves only when a statement sets it; one
row (`788055c2`) carries an `updated_at` equal to its `created_at` despite having been
updated later, which is why the other manifest marks it unrecoverable. The ids below are
literal, so the windows are never needed again.

`investor_research_vehicles` has **no `updated_at` column at all**, so a vehicle that is
renamed rather than inserted leaves no timestamp. Pass E renamed one; it is listed by id.

---

# Pass D — the coverage pass, 18:43–19:05 UTC

## D1. Inserted rows — delete by id, in this order

Order is forced by foreign keys and now by a constraint added in pass E
(`investor_financial_metrics_vehicle_belongs_to_investor`): metrics and holdings reference
vehicles, so vehicles go last.

### `investor_financial_metrics` — expect 107 rows affected
```
01dcafe8-4418-4003-a33d-62258b142e4b 09b73b97-853b-4dd2-97e6-8d9c621c96cd
0a18d58a-ea6f-41ac-bfd9-f094ded80901 16647a0e-acb3-46c9-8604-a421065f0003
18c00d83-ab14-4d2a-9912-71cd90cc78f1 194f2b24-309b-4bf6-a5f6-16a294de3e8f
1c3335fe-fcca-4fc4-8b3a-ccd1f15a8d79 1e0ff0a5-e2ac-406d-a273-a4a538b845f9
1ee24297-534d-46dc-8421-beca4baef66a 21c4417b-1f63-4d62-8197-065f2a091a70
2257a887-2018-42ba-8677-6ef0826ff36f 3675467a-5ff0-410f-9df1-fdca60fe57e9
375ba1ab-ed95-4ca1-bcd7-c6c59bb853ef 38150671-d184-4a13-87c7-2340b06ec393
39769834-d130-4c9c-859e-e7bf48eb5563 3efbbb2c-cd00-4036-906e-47983ce5b31a
4092b0f1-396d-48fa-a8a9-b6c9b60d9472 41e784ea-70f1-41f8-ac0a-3df7a52074b2
453309a6-692a-4199-ac6b-0efe4adebdce 488ac818-ed3c-49f8-a1ec-2d8f119ce1fe
48b1a695-0e64-4308-aee2-2ccca0f93e46 4a32d708-2534-49ce-beae-16ced4a5b733
4ae6f5e3-ddf8-497e-9ed9-d2571f62f37d 4c3d213d-8c5d-47e0-9eef-6cd0880fd402
4c610806-c796-49fc-897e-871f33a43175 4c99fc79-5e0b-41b3-b71e-9aca3aeda029
4ed0f551-8d33-40dd-813e-0970ee6822a1 4f74a98e-cb4e-49f7-9437-13c1a1bbc8ae
4fb36919-609a-44af-843d-e6f865d1a100 51a29466-ca82-48bb-86db-e4f763501def
56af50bc-f1fb-4808-8a6d-a116af8e1e88 608e26d0-d751-42d9-9dca-81974ca282f5
6162b20f-956f-4b6f-804f-d236a2ca157b 636be6f3-5d03-4f80-b310-2cc1273d57c5
63df4cf0-8c1f-4a8c-90d0-8e2f50b29bba 64d15f8d-1eef-4303-b24b-3bc21438a9d8
6586f235-e556-473c-8592-62465887ae82 65d2bbd3-a8b5-4e2c-92e4-0a8ae67d0d78
680337d8-a3c5-4253-985f-99953cc6fe8c 6872c71e-618f-45fc-b075-685d2002a0fd
6bc3ee24-b70f-4cbc-b03d-8a4bbebaf981 6fb0ae90-e5e6-4755-9ab9-ce27aba59d5b
73124e10-b3ce-45df-8d87-5ee98b911abc 737212e5-6f0e-45cb-afdb-c0ed76f94553
743cd986-e473-4609-8d63-2807aa6ad4f9 778b6ca0-ca17-4eff-8635-78098e7dbcbf
79c0fad8-4cf9-4401-8bb6-76a47256f24d 7b972958-21ff-4680-81fc-762bd714fc1e
7c04b442-da13-4307-82cd-e5c13820d55e 7e1639df-6c72-448f-83cc-e3817eef7db9
7ed9ee6d-e85d-48a9-a98c-753599ed79dd 7f2e90af-72bf-4fd8-a91e-0dce616be3f9
80d96722-1759-47e5-928b-1feaad9a8a08 83631036-ce93-40b1-b9da-a3f957f48f9d
83d34beb-fdaf-4caf-a190-70508bb03ddb 85dcc836-1139-4d96-b5e4-82121386f337
85ed1425-cd94-4222-80af-5812ef354f72 86bc1732-7f49-459d-844e-0b5a3053c36d
887ef9f5-a84f-46bf-bb8b-7b48125c8273 89ff7516-fb60-4de4-af7e-3ef195b44302
8e21cf3e-7571-4f5b-9a84-12687079e851 91506a6d-6b5f-4027-b01d-8adf1cc7a12a
96c1d897-7d27-4cc1-a3e7-eed7cce43c0d 979ae2fa-b902-4aeb-b8a9-d4f081189195
9863503a-9f7c-47de-87d7-d71cb85fb1b4 99f78829-9f90-40dc-99da-7d92b8cd2a9b
9c96802b-cd68-4dc2-b90b-33974267f689 a38c9c4b-2737-41f6-8f42-7aa00c89f818
a3dfe8d0-f744-473e-a842-2947036e7825 a714c0e4-74fd-49ee-8d3d-c0e0596173a6
a80749b0-09e5-49a3-a412-1d102f50aad3 a822e725-810f-4284-90b3-4a7da724f860
a866374b-4397-4442-8d5c-0499a4c1ed77 a91f4aa1-3f70-4510-abf7-28af4bed568a
a9d82e62-ba9d-45d1-bd59-e80ad932198d aabbc42f-b6ec-46e5-8c09-9a9d5d1c5caf
ae2f6b5e-31ae-40bc-8e98-1b93b77ff1aa b0a31ba3-c81c-4102-897b-a956547a4c91
b1b70778-7c6f-4916-b537-ea6966fb07a6 b570bdd7-c8db-4bcc-a931-08acde5001d1
b80dc33b-e955-4490-8810-97c901fa994e ba551625-2912-4a2c-96d9-1870b06ba91b
bb1e99ba-53fc-43bc-bc33-461346acaf67 bb518b95-b65d-4539-8437-73f0d9147030
bbe9f288-56e2-4808-93d4-a3e6257d66e7 bf8457f0-2f11-4fc5-be47-e82debedab80
c9403e1e-9bef-4bab-91bc-1a8589643708 cad54564-3cfc-4c5b-be22-2796e54c27d6
cdcde209-6da4-4129-a074-eeacca3fa767 d491f915-2d55-48c4-92c0-4fde5087b4b4
d4c80f18-53c7-445d-a6d6-42d298ec819d d5350608-e30d-4ef9-82cf-b6fcf336cba8
d699692c-caa8-4ab1-ad17-dd34ae293cf4 d796d00d-e18e-4ef4-afe3-97c0b318583d
e20a5790-bfc9-49bf-a8d2-3f4045575c3a e562335d-4de3-49d9-98cb-e162eba153d4
e5f96e89-5e2b-437c-ba3c-8186c3545aa7 e6283975-9a00-4211-81ed-6c053983a777
e77f2ebf-a693-4cd3-847d-dbfd4ea104df e7aa5930-cf4a-44fe-a49d-e1a0f365a408
ea44f3c7-d28b-4942-8277-10ac3e8513f5 ea5d7786-0787-4799-99d9-09b86f89b0cd
ee5eb01b-dff3-4ef1-ba00-3b5620a824d4 f5f97fef-9d70-4f4a-9d87-56ce161a4bf9
f9f0764f-eb9f-42d5-ba88-65a378f89594 fbb6174f-6e75-4e4c-975d-ba629c8216d6
fd42d000-dbf6-425a-bcf2-5228b640ff54
```

Two of these were later **updated by pass E** and must be reverted as pass E's §E2 says
before being deleted here, or the delete reverses a correction silently:
`6586f235-e556-473c-8592-62465887ae82` (the €150M, re-sourced) and
`c9403e1e-9bef-4bab-91bc-1a8589643708` (the ticket range, superseded).

### `investor_fund_positions` — expect 1 row affected
```
68eb142b-b931-433f-8d2e-9bab4e2a9258   EIF / Defence Equity Facility → Marathon Venture Capital Fund III
```

### `investor_financial_research_log` — expect 63 rows affected
```
01453cff-c5cc-49bc-8e72-626e1ae7596d 09412780-10c8-495e-8aab-5d3bbba5983f
0a3d59e2-ff33-478d-91e7-c0f68d76b077 0b4b59d5-6e2f-46cf-b769-4da77fb8639a
0fa18ff5-dbfa-44d1-9f82-d01caa5dd4e4 14ac5718-cfcb-44ac-abc6-f8abf4d0d1e2
194a747f-3470-48e2-8d5b-70ae23798362 1de31688-a3b9-4c28-ba22-332d371c64cf
213dec31-b9df-4ce0-8b61-9d6f7e35f59c 23e6c391-8aa5-415d-9df9-fdf794553682
291e8e7d-f78b-49f6-991f-8d1a46f08497 2a520b81-f6bd-4830-9226-baddbd84a829
3ec830d8-04e2-40b6-9f09-5b3d009c9cd0 43f05617-d750-4573-8ae1-afff2cac902d
44c69a4c-bfa9-47f1-bda1-9f9b91b496b2 44e76318-067e-470c-b2bc-0004b913730c
48f98013-e3e4-40bc-a016-1d314312cf37 4b259bd8-b47a-4b21-b126-dcaf385405fe
4e0ede0b-9594-4b07-a9ed-c5065170084f 591a5e13-795f-4e0b-8788-500f74e5cb6a
591ee2e9-1595-46a0-871a-b216363d2c87 5d61d307-bf7d-4c69-8bbb-2c0a28efb27c
6233ed41-52e5-41f2-894c-fc8f89613b7c 67434cd2-cb4b-47de-b36b-6a475ee75a47
706eeff8-8df8-4391-8156-006bf7510dd9 75c9a530-30a0-4f0b-96e2-a0e5b8ddb121
7763b3bf-7486-4eda-a3d9-4fafb545f147 79941446-6da2-4d40-94d9-8bbff0f043ab
7d638ca2-e94e-4530-9b95-b403532391c2 858b8965-e7ac-4356-9177-d18cc247e37b
87aa34ac-73d6-4c36-8a48-d054e4a63ca5 9c02dee8-7a8c-46ef-a1fb-27985c4d5b62
9d64c95b-0f7a-4cb7-8c98-bdc47da03aff 9dccb81f-f463-48ce-928d-852696de8dbb
9e8ebc5a-9772-4a10-8362-2e202947e37a a3299985-cec8-4920-932a-e1dcb9e92fc0
a504d09d-ca7a-4775-922e-7e1c7c5599f1 a5131095-1a16-421b-a2f4-359cb9b770b9
a5f1fc92-3c58-4fa0-977b-4963771532e5 a616c092-b903-4a56-937f-523e45beb7fc
a6f59499-36e2-40ee-9ecc-b4c653e1c7ff a9275ef1-6d0c-4900-bfd0-4fa04d67c648
ad347f72-a5e9-4f93-a4f3-15f14ef00675 ad7bdedb-8f48-4ee1-bda5-5768bdfcef00
adfd6de6-8fec-450f-b140-5c63b237951b ae917e64-5fd3-4012-b15b-08624d4eefc6
b1b3f35d-b90b-4c07-a4a8-5cfeb372349c ba9f71c0-bf77-413b-8101-8c0fc87a3e0a
babbe645-5aea-4281-b886-289fe78bc9ba c7117aec-6761-46c4-bc74-681dc43d9ebd
cb89466c-6ba2-4f02-9a96-ed286b0eef15 cbb06532-f692-4d3c-8faf-de462f410fe4
d557fde3-8121-4a9a-8b16-21959de6af2e d8c50a22-b4ba-4fca-807d-287669e2d68c
e1043bea-987e-4b0f-a6c5-355433f7c9df edd006e3-c935-437f-adce-12ac529637b6
ee674634-75bd-4c10-a67e-621fc61cd78b f2ba9bc4-5bb2-4468-96a0-4200e3ad9aed
f4d7d4c3-55b6-42db-bf8b-0e0ffc413144 f538c010-5f2d-41d7-95ea-2d5e3b70c7f7
fb8e89ba-be75-406f-8dea-ab621252a450 ff8600a8-d40b-4998-96d5-453e6783cedc
ff92c8d5-1150-4675-ba8c-b0acf3367a47
```

One of these, `44c69a4c-bfa9-47f1-bda1-9f9b91b496b2` (Tech Horizons), was **rewritten by
pass E**; its pass-D text is quoted verbatim inside the current row, under
`PRIOR NOTE, superseded by the above`, so deleting the row loses both versions at once.

### `investor_research_vehicles` — expect 68 rows affected (delete LAST)
```
01053b89-00a5-466f-b69d-4c607a511a46 0e66f907-d553-4677-9f8f-6477a2d03885
170e2860-8d98-4282-9c5a-9b2f6899329f 184440a7-b196-4060-94b4-2fc93f5c88f5
2133cc7d-a59d-49d6-9da8-2041e144582a 24d17e40-4581-4738-87f9-747919926731
2ac16e9e-c795-4013-b06d-55ee2a91602d 2b7c1187-ebe1-4e8a-abd3-554d278650c9
2d2a211c-d8c5-4f70-9b38-1215e2c390a6 2e215e27-003b-4ca7-a806-cc68c66345d4
34372e09-deaf-481c-8c96-073b195ee1b7 3470f702-169d-477b-9d6c-4895ca5b79f2
3499184a-c948-4ecf-b5c4-a079456091db 3ba1136a-59d3-47ba-a8c8-71468b23eff0
3fe6cb78-0130-419f-9e64-71a7bc886f58 4d95a540-90b0-4359-ba6f-c1374183ae2e
4dcd5c90-d44f-4771-9422-8eb6390b9b9a 51657f69-f219-41e7-bc10-4136a18afbba
5331fbe7-4fca-4603-99ca-c9c477b78a31 5349b169-fcaa-4cd5-aaac-be14b81ed494
6299d644-85ed-4840-aeeb-fc3982781947 64f8e375-8fcd-4c52-9580-f6bc9764b8f3
67f4244f-09d7-44be-b623-1db8e238924a 6d00df29-d390-4fe8-94f1-12a8ae67d0be
713dbca4-4497-4070-9210-09b767f4fd96 726bf682-9e08-4d4b-bd97-4a5f09d7bf94
72a88ada-9c54-409a-8d46-2375067f9569 790d1814-6885-47c7-83d1-79b6ce49df75
857bae36-f8f6-4c2e-8bf9-44a46267f584 98ba551f-e147-4613-8863-c748610fa434
99ea6b60-8ba4-427f-9c80-b970fca13926 9bbc6636-2512-45f4-8618-164b25b21b44
9c5cd091-430b-4ac2-a176-0c24dd7a5c25 9e0465f4-f76f-4307-ad11-c9e37f0dc2d2
9f7f9563-72b7-424e-8da7-f4b6968b6200 a039bfc0-ac5a-41a8-a797-2c1c1b9b2585
a33f4568-a555-4158-b3ca-e6c8242fce05 a3620bd5-9a1d-4120-a24d-ed4d190cc771
a37d4819-18f5-4342-a0d3-052c9f128178 ac50bdb1-dec4-454f-82f7-43d3939e586d
aec41f6f-98b5-4c02-9f07-7d07b300323a af174ccc-94f3-4c76-9e40-25fe82ba8803
b1f3e701-b278-4f73-a497-8298c77f14f1 b2cc27e3-a74b-4678-9fb6-b51a04687643
b6e9e71d-133b-4b94-858d-337a1fe9c952 ba65bd61-19cb-4066-96df-011d0b8a8331
ba9fa421-fd88-4711-aa9e-e1f08bad6155 baa6faaa-0895-4335-9840-73024ab972d4
c3753abd-e263-45a0-bcd8-feb1be076182 c3b1342c-3c1c-4f72-9106-aceefe7dcda1
c5b9f14e-c2db-4bc3-88fe-cfbab5ebfe15 c6e6c1ec-7202-42b5-92c2-106b2812990c
c6ee494b-1aa7-4e7a-b6c7-3aed378d2dcf cdc33391-c32d-4092-a9ff-d7b548e10254
d203380e-a8cd-4b54-a511-374a5dbcac8d d7554909-ad4d-496a-a94e-b9281c599eb5
d90662e6-45d5-4a92-92cd-6d93be57bbe6 d974c69b-0363-4937-a5ca-95ac5114be6f
dcc2c57b-7fbe-4caf-a246-9c47db89fe59 deec142c-9580-443e-9bb1-ac73d24af4b0
dfea4eae-a29f-45dc-9d0f-7ddaa664a6dd e5926135-b44c-48ca-a9c6-7c1ebb19e82b
e5cf3542-4468-496d-8ea8-052664d48aaf ed918ce9-77d7-4a06-899a-52c4b8ca7f42
ede81e9c-449f-4dc2-af4d-6406d62ae79d ee56627b-6a27-4e56-ad0d-cca3866068a5
f2c4f3cc-59fc-4169-ab1b-f419fa2bc245 fd755950-89b3-42cf-818f-cc2f3b5f3ff0
```

`e5926135-b44c-48ca-a9c6-7c1ebb19e82b` was **renamed by pass E** (from `Presto Tech
Horizons` to `Tech Horizons SCSp`) and has no `updated_at` to show it.

### `slug_redirects` — expect 2 rows affected
No surrogate key on this table; the natural key is `from_slug`.
```
kara-dag-technologies → kara-dag
jisr                  → jisr-institute
```
**Delete these only together with the company demotions in §D2**, and in that order:
removing a redirect while its source slug is still a demoted draft breaks the live URL that
the redirect is the only thing preserving.

### Not inserted by this pass
`companies`: 0. `investor_companies`: 0. `company_aliases`: 0.

## D2. Updated rows — before-images

### The seven `investor_portfolio_unresolved` dispositions — expect 7 rows
All seven were `null` before, and that is **certain, not inferred**: the `disposition`
column was created by this pass's own migration
`investor_entity_class_and_unresolved_disposition`, so no row could have held a value.

| id | investor → published name | Now |
|---|---|---|
| `d28640fb-0bc8-42d2-aa78-d415a827c8bf` | Verve Ventures → ANYbotics | `relationship_unverified` |
| `dc8e3e5a-500f-4e10-9e9f-ff4260c265c9` | Sisyphus Ventures → ZeroPhase | `organisation_unidentified` |
| `d1c22105-1ef4-4fd1-af76-8b07fc84dbb5` | Rockaway Alpha Defense → URC | `wrong_group_vehicle` |
| `655e9d7d-c3c0-4520-9a2a-e3f3dd40c61e` | Freedom Fund VC → Bravo Dynamics | `organisation_unidentified` |
| `ddca7c15-7b87-41fe-bacf-f3d9c7a03113` | Front Ventures → Aviation Center Engelholm | `facility_acquisition` |
| `173b31a3-f3d6-4d68-8234-8d6e0b69e6b7` | Depo Ventures → Wayren | `relationship_unverified` |
| `a51382c6-8194-4dd3-8f12-1df1dd745e22` | Rockaway Alpha Defense → JISR | `relationship_unverified` |

```sql
update investor_portfolio_unresolved set disposition = null
 where id in (<the seven ids>) and disposition is not null;   -- expect 7; 0 is an abort
```
Reverting the migration drops the column and achieves the same thing; do one or the other,
not both.

### `investor_research` — expect 2 rows
| id | record | Changed | Before-image |
|---|---|---|---|
| `9e0b2266-fd19-4b3e-b076-5dc70ef8d3a0` | R-G.AI | `entity_type` → `Technology company (corporate investor)`, `matched_company_id` → `83c2924f-0cda-40f8-8aa7-e06aece2f3a3`, `research_note` rewritten | `matched_company_id` was **null** (certain: the column was added by this pass's migration). `entity_type` and `research_note` prior values: **NOT RECORDED** |
| `9768c931-93b9-4677-9229-c337a882a6ca` | Defender Ventures | `research_note` rewritten | **NOT RECORDED** |

So: `matched_company_id` is reversible, the two prose fields are not. See §5.

### `investor_companies` — expect 1 row
`fa0fec40-56f8-472e-8cf8-f01d1058c461` (Rockaway Alpha Defense → JISR Institute) was
retired by this pass: `retired_at`, `retired_reason` and `retired_kind` were all set in one
statement, on a row created at 00:21 by pass A.
```sql
update investor_companies
   set retired_at = null, retired_reason = null, retired_kind = null
 where id = 'fa0fec40-56f8-472e-8cf8-f01d1058c461'
   and retired_at = '2026-11-01' and retired_kind = 'unsupported_evidence';  -- expect 1
```
Clear the three columns **together**: `investor_companies_retired_kind_with_retirement`
rejects a null kind while `retired_at` is set, so nulling the kind alone fails. Its
`evidence_status` (`third_party_reported`), `relationship_type` (`portfolio_listed`) and
`source_url` were not changed, so the row returns to a live holding sourced only to the
Czech government directory — which is the state pass D judged unsupportable. Reverting it
is therefore a decision, not a repair.

### `companies` — expect 3 rows, and a URL consequence
| id | company | `publication_status` now | Before-image |
|---|---|---|---|
| `5f552c75-b64c-44a8-84da-c8a2e9624603` | JISR | `draft` | **NOT RECORDED.** It had a live URL, since a redirect was created for `jisr`, so `live` is near-certain — but "near-certain" is not a before-image |
| `1ebe9d32-a7fc-44c7-94a8-0d284947007d` | Kara Dag Technologies | `draft` | same |
| `61a28106-72f0-4306-9f1b-d3e39ed62a2c` | Kara Dag | `live` | **NOT RECORDED**; it may not have changed at all |

**Restoring either duplicate to `live` must happen only after the matching
`slug_redirects` row is deleted**, or the catalogue would publish a page and a redirect for
the same slug. The redirects are what keep `/companies/jisr/` and
`/companies/kara-dag-technologies/` working today; neither URL has been dropped.

## D3. Migrations — in reverse order, and only at pass D's own checkpoint
1. `investor_metric_cumulative_capital_raised` → restore the previous `metric_type` CHECK
   without `cumulative_capital_raised`. **The one row of that type must be deleted first**
   (Karista; it is in the 107 above), or the constraint cannot be re-added.
2. `investor_entity_class_and_unresolved_disposition` → drop
   `investor_portfolio_unresolved_disposition_check`, then the `disposition` column, then
   `investor_research.matched_company_id`.

Neither may be reverted while **pass E** is applied: pass E's own migration adds a CHECK
and a column to `investor_financial_metrics` and leaves the `metric_type` vocabulary in
place, and the catalogue's exported `attribution` field reads a column pass E created.

## D4. Dependency checks — each must return 0
```sql
select count(*) from investor_financial_metrics
 where created_at >= '2026-11-01 20:00:00+00' and vehicle_id in (<the 68 vehicle ids>);
select count(*) from investor_companies  where vehicle_id in (<the 68 vehicle ids>);
select count(*) from investor_fund_positions
 where target_vehicle_id in (<the 68 vehicle ids>);
```
Measured 2026-11-01 21:15: the only later row touching any of them is pass E's new metric
`9bd93c71-2fae-4678-866d-ef73d356c011`, which points at vehicle
`e5926135-b44c-48ca-a9c6-7c1ebb19e82b`. **That is a real dependency**: the vehicle cannot be
deleted until pass E is reversed first. Exact ids did not make it safe; the check did.

---

# Pass E — the Tech Horizons correction, 21:05–21:15 UTC

Five rows, all listed with complete before-images. This is the pass whose own corrections
were the point, so nothing here is approximate.

## E1. Inserted rows — delete by id
### `investor_financial_metrics` — expect 1 row
```
9bd93c71-2fae-4678-866d-ef73d356c011   Tech Horizons, initial_investment_range, €1M–€5M
```

## E2. Updated rows — complete before-images

### `investor_research` `9f6bd84c-7cba-4621-9c59-5bdde4601197` (Tech Horizons) — expect 1
```sql
update investor_research set
  legal_domicile_country   = null,
  legal_domicile_precision = null,
  legal_domicile_note      = null,
  research_note = 'CSG industrial partnership; office vs domicile pending verification.'
 where id = '9f6bd84c-7cba-4621-9c59-5bdde4601197'
   and legal_domicile_country = 'LU';            -- guard: expected current value
```

### `investor_research_vehicles` `e5926135-b44c-48ca-a9c6-7c1ebb19e82b` — expect 1
Prior `name`: `Presto Tech Horizons`. Prior `note`, verbatim:
> Defence, security and deep-tech fund launched with Czechoslovak Group (CSG) as industrial partner, raising EUR150m for startups across NATO countries and their allies; portfolio includes the Ukrainian defence startups Vidar Systems and Bavovna.ai. NOTE an unresolved identity question: a separate profile describes a Luxembourg-domiciled "Tech Horizons" writing EUR300k-EUR3m tickets, and no reviewed source establishes whether the Prague-based Presto Tech Horizons and that Luxembourg entity are the same vehicle, so the EUR150m raise may not apply to the Luxembourg entity.

Guard on `name = 'Tech Horizons SCSp'`. This table has no `updated_at`, so the guard is the
only concurrency check available.

### `investor_financial_metrics` `6586f235-e556-473c-8592-62465887ae82` — expect 1
| Field | Before | After |
|---|---|---|
| `source_url` | `https://parsers.vc/news/251121-european-defense-tech-fund-secures-150m/` | the vestbee launch article |
| `as_of_text` | `2025-11` | `2024-06` |
| `as_of` | null | null (unchanged) |
| `display_en` | `€150M being raised` | `€150M announced at launch` |
| `verification_status` | `reported` | `reported` (unchanged) |
| `checked_at` | `2026-11-01` | `2026-11-01` (unchanged) |

Prior `scope_en`, verbatim:
> EUR150m being raised by Presto Tech Horizons, launched with Czechoslovak Group (CSG) as industrial partner, for defence, security and deep tech across NATO countries and their allies; its portfolio already includes the Ukrainian defence startups Vidar Systems and Bavovna.ai. CAVEAT: a separate profile describes a Luxembourg-domiciled "Tech Horizons" writing EUR300k-EUR3m tickets, and no reviewed source establishes that the two are the same vehicle, so this figure may not apply to the Luxembourg entity.

**Reverting this one restores a citation that does not support the figure** — the parsers.vc
article reports a €150M first close by Keen Venture Partners and mentions this fund only in
passing with no amount attached. Reverse it only to reproduce the old state, never to
correct anything.

### `investor_financial_metrics` `c9403e1e-9bef-4bab-91bc-1a8589643708` — expect 1
| Field | Before | After |
|---|---|---|
| `is_current` | `true` | `false` |
| `checked_at` | `2026-11-01` | `2026-11-01` (unchanged) |

Amounts, currency, bound, type, source and `display_en` (`€300K-€3M per deal`) were **not**
changed. Prior `scope_en`, verbatim:
> Tickets of EUR300,000 to EUR3m, attributed to the Luxembourg-domiciled "Tech Horizons" profile - see the identity caveat on the fund size.

### `investor_financial_research_log` `44c69a4c-bfa9-47f1-bda1-9f9b91b496b2` — expect 1
`note_en` and `sources_checked` were rewritten. The prior `note_en` is **inside the current
row**, quoted verbatim after `PRIOR NOTE, superseded by the above:`, so this is the one
rewritten prose field on 2026-11-01 whose before-image is fully recoverable. Prior
`sources_checked` — **NOT RECORDED**.

### Explicit `updated_at` touches
Pass E set `updated_at = now()` on the four rows above that have the column, precisely
because pass D taught that an untimestamped update cannot be attributed later. Reverting
the data does not restore the old timestamps, and that is harmless.

## E3. Migrations
`investor_metric_attribution_guards` and
`investor_landscape_projection_metric_attribution`. To revert:
```sql
drop view public.v_landscape_investors;   -- then recreate it without 'attribution'
alter table investor_financial_metrics drop constraint investor_financial_metrics_unresolved_is_not_published;
alter table investor_financial_metrics drop constraint investor_financial_metrics_attribution_status_check;
alter table investor_financial_metrics drop column attribution_status;
alter table investor_fund_positions drop constraint investor_fund_positions_vehicle_needs_target;
alter table investor_fund_positions drop constraint investor_fund_positions_vehicle_belongs_to_target;
alter table investor_companies drop constraint investor_companies_vehicle_belongs_to_investor;
alter table investor_financial_metrics drop constraint investor_financial_metrics_vehicle_belongs_to_investor;
alter table investor_research_vehicles drop constraint investor_research_vehicles_id_investor_key;
```
The view must be recreated, not merely dropped: the catalogue build reads it. Drop the
foreign keys **before** the unique constraint they depend on.

## E4. Assertions after reversing pass E only
```
investors in v_landscape_investors                      = 118   (unchanged)
investors with a current metric                         = 102   (unchanged)
current metric observations                             = 207   (unchanged: one row retired, one inserted)
Tech Horizons current observations                       = 2     (unchanged)
Tech Horizons vehicle name                               = 'Presto Tech Horizons'
```
The counts do not move because pass E traded one observation for another. That is the
reason a count-based assertion cannot stand alone, and why every statement above carries
its own expected affected-row count.

---

## 5. Passes A and B have no exact-id manifest

Pass A (00:14–00:21: 14 metrics, 5 vehicles, 6 unresolved rows, and the `investor_companies`
row `788055c2`) and pass B (14:38–14:45: 36 metrics, 14 vehicles, 9 fund positions, 1
unresolved row) were written before exact-id manifests were kept. Their rows are
identifiable from the `created_at` windows above, and those windows are clean, but a window
is a predicate — the same kind of thing this whole exercise replaced — so it is offered as
a starting point for a human, not as a rollback. **Automatic rollback of passes A and B is
unavailable.**

## 6. Unavailable reversals in passes D and E
1. `entity_type` and `research_note` prior values for R-G.AI; `research_note` for Defender
   Ventures (pass D).
2. `publication_status` prior values for the three `companies` rows (pass D). `live` is
   near-certain for the two demoted duplicates, from the existence of their redirects, and
   near-certain is recorded as such rather than written as fact.
3. `sources_checked` prior value on the Tech Horizons log row (pass E).

Everything else in passes D and E has a complete before-image or is an insert.

## 7. Not executed
Nothing in this manifest has been run against production. The shapes — delete by id,
update with an expected-current-value guard, the dependency checks, the constraint
ordering — were exercised against fixtures; see `scripts/test/rollback-scenarios.test.mjs`.
The two pass-E constraints were proven in production only by statements that are *expected
to fail* and therefore wrote nothing: an attempt to point a Tech Horizons metric at Flyer
One's vehicle, and an attempt to mark a published metric `unresolved_identity`. Both were
rejected by the database.
