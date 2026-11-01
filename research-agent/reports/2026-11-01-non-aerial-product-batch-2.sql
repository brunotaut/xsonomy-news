-- Non-aerial product batch 2 — PREPARED, NOT APPLIED. 2026-11-01.
--
-- Review: research-agent/reports/2026-11-01-non-aerial-product-batch-2.md
-- Manifest: research-agent/reports/2026-11-01-non-aerial-product-batch-2-manifest.csv
-- Rollback: research-agent/reports/2026-11-01-non-aerial-product-batch-2-rollback.sql
--
-- THREE INDEPENDENT TRANSACTIONS so the three decisions can be taken separately:
--   TX A — three records whose identity is settled      (Dire WOLF, Ghost Shark, LUNA-2)
--   TX B — three records that are programmes or a class term, whose CATEGORY is
--          nonetheless certain                           (MMCM, rMCM, XLUUV)
--   TX T — taxonomy notes only; touches no category and depends on neither A nor B
--
-- Exail A27 appears in none of them: see group C of the manifest.
--
-- Every transaction opens with a guard that RAISEs on drift, so a row edited since this
-- was prepared aborts the whole transaction instead of being overwritten. Run each inside
-- begin ... rollback first; the predicted verification values are in §7 of the review.

-- =====================================================================  TX A
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id in ('d77e3215-00e6-4bde-88cd-2aa49c294522',
                '0c420e85-28c1-4c88-acab-436348b91ec3',
                '8a28d7c5-df6e-4d91-900a-d451f65a61ec')
     and publication_status = 'live' and category = 'UAV';
  if n <> 3 then raise exception 'TX A guard: expected 3 live UAV rows, found %', n; end if;

  -- no namesake may be sitting in /other/ under the same slug
  select count(*) into n from products
   where publication_status = 'live' and category = 'Other'
     and slug::text in ('dire-wolf','ghost-shark','luna-2');
  if n <> 0 then raise exception 'TX A guard: % slug collision(s) in /other/', n; end if;
end $$;

update products set category = 'Other'
 where id in ('d77e3215-00e6-4bde-88cd-2aa49c294522',
              '0c420e85-28c1-4c88-acab-436348b91ec3',
              '8a28d7c5-df6e-4d91-900a-d451f65a61ec')
   and category = 'UAV';                                      -- expect 3

insert into slug_redirects (from_slug, to_slug, kind, from_section, reason)
values
 ('dire-wolf','dire-wolf','product','uav','Non-aerial product batch 2, 2026-11-01: BLADE (ex-HDT Global) six-wheeled hybrid logistics UGV; category corrected UAV -> Other, page moved to /other/dire-wolf/'),
 ('ghost-shark','ghost-shark','product','uav','Non-aerial product batch 2, 2026-11-01: extra-large autonomous UNDERWATER vehicle; category corrected UAV -> Other, page moved to /other/ghost-shark/'),
 ('luna-2','luna-2','product','uav','Non-aerial product batch 2, 2026-11-01: ASELSAN LoRa IoT nanosatellite; category corrected UAV -> Other, page moved to /other/luna-2/');
                                                               -- expect 3

-- the flag that asked for this is now answered, so it stops asking
update product_taxonomy pt set
 note = 'Underwater (UUV/AUV). Category corrected from UAV to Other in the non-aerial batch 2 of 2026-11-01. NOTE the open ownership question: Ghost Shark is Anduril''s XL-AUV for the Royal Australian Navy under Project SEA 1200, while this record is attributed to Albacore, whose own vehicle Ghostfin is a separate record. The category is settled either way; the maker is not.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';   -- expect 1

update product_taxonomy pt set
 note = 'Space (orbital). LoRa IoT nanosatellite launched by SpaceX 30 March 2026 - aselsan.com. Category corrected from UAV to Other in the non-aerial batch 2 of 2026-11-01. Whether a satellite belongs in a UAV and counter-UAS catalogue at all is an inclusion question, open and unaffected by this move.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '8a28d7c5-df6e-4d91-900a-d451f65a61ec'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';   -- expect 1

-- Dire WOLF's seeded rows are now corroborated. FOUR of the five are upgraded; the fifth
-- (control = semi-autonomous-human-on-the-loop) is NOT, because no source states the
-- control mode - it keeps its seed note.
update product_taxonomy pt set source = 'web', confidence = 'high',
 note = 'BLADE (formerly HDT Global) six-wheeled diesel-electric hybrid UGV for autonomous battlefield resupply, derived from the WOLF-X; selected for the U.S. Army Project Sustainment effort, July 2026 - hdtglobal.com, armyrecognition.com. Corroborated 2026-11-01, replacing a model-knowledge seed.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = 'd77e3215-00e6-4bde-88cd-2aa49c294522'
   and o.id = pt.option_id and f.id = o.facet_id
   and f.slug in ('domain','propulsion','mission_military','origin');     -- expect 4

commit;

-- =====================================================================  TX B
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                '9d80e014-03aa-4342-9a91-1fcaa702fca2')
     and publication_status = 'live' and category = 'UAV';
  if n <> 3 then raise exception 'TX B guard: expected 3 live UAV rows, found %', n; end if;

  select count(*) into n from products
   where publication_status = 'live' and category = 'Other'
     and slug::text in ('mmcm','rmcm','xluuv');
  if n <> 0 then raise exception 'TX B guard: % slug collision(s) in /other/', n; end if;
end $$;

update products set category = 'Other'
 where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
              '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
              '9d80e014-03aa-4342-9a91-1fcaa702fca2')
   and category = 'UAV';                                      -- expect 3

insert into slug_redirects (from_slug, to_slug, kind, from_section, reason)
values
 ('mmcm','mmcm','product','uav','Non-aerial product batch 2, 2026-11-01: the FR/UK Maritime Mine Counter Measures PROGRAMME; category corrected UAV -> Other, page moved to /other/mmcm/'),
 ('rmcm','rmcm','product','uav','Non-aerial product batch 2, 2026-11-01: the Belgian-Dutch replacement Mine CounterMeasures PROGRAMME; category corrected UAV -> Other, page moved to /other/rmcm/'),
 ('xluuv','xluuv','product','uav','Non-aerial product batch 2, 2026-11-01: a US Navy CLASS TERM for extra-large uncrewed undersea vehicles; category corrected UAV -> Other, page moved to /other/xluuv/');
                                                               -- expect 3

update product_taxonomy pt set
 note = 'Surface (USV). The FR/UK Maritime Mine Counter Measures programme, managed by OCCAR for the French DGA and the UK MOD with Thales leading the industrial team, fields uncrewed surface vehicles - thalesgroup.com. Category corrected from UAV to Other in the non-aerial batch 2 of 2026-11-01. STILL OPEN: this record names a PROGRAMME, not a product.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = 'ccfd9d18-4029-4c1b-a46e-68e8de044f6b'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';   -- expect 1

update product_taxonomy pt set
 note = 'Underwater (UUV/AUV). XLUUV is the US Navy''s class term for extra-large uncrewed undersea vehicles, above 84 inches in diameter; Boeing''s Orca is the vehicle that fills it - boeing.com. Category corrected from UAV to Other in the non-aerial batch 2 of 2026-11-01. STILL OPEN: this record names a CLASS, not a product.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '9d80e014-03aa-4342-9a91-1fcaa702fca2'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';   -- expect 1

-- T4. rMCM's domain row asserts a surface USV. The programme delivers TWELVE CREWED
-- City-class and Vlissingen-class mine countermeasures vessels, which carry uncrewed
-- systems rather than being one. The claim is wrong, not merely unsourced, so the row is
-- deleted rather than re-noted: this record now carries no domain assertion at all, which
-- is the honest state while the programme-vs-product question is open.
delete from product_taxonomy pt using taxonomy_options o, taxonomy_facets f
 where pt.product_id = '5d6c6ab3-6b4c-4552-9734-b6f7cff54903'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';   -- expect 1

commit;

-- =====================================================================  TX T
-- Taxonomy notes only. No category, no slug, no redirect, no publication status.
--
-- A DEFECT THE DRY RUN FOUND, and it is inherited. The first draft of this transaction
-- wrote replacement notes that QUOTED the instruction being retired, so the searchable
-- phrase survived the fix and the flag count did not move. The 2026-11-01 Exail pass made
-- the same mistake on DriX and DriX O-16, whose "corrected" notes still contain the string
-- `verify category`. That is why a catalogue-wide count of that phrase returns 31 rows
-- when only 5 of them are genuinely open: a fixed flag keeps answering to the query that
-- finds unfixed ones, so the population can never shrink and a later pass re-reviews work
-- already done.
--
-- Every replacement below therefore contains NEITHER `verify category` NOR
-- `not an aerial system`, and the DriX pair is corrected here as part of the same fix.
begin;

do $$
declare n int;
begin
  select count(*) into n from product_taxonomy pt join products p on p.id = pt.product_id
   where pt.note ilike '%not an aerial system%' and p.category <> 'UAV';
  if n <> 17 then raise exception 'TX T guard T1: expected 17 stale rows, found %', n; end if;

  select count(*) into n from product_taxonomy pt join products p on p.id = pt.product_id
   where pt.note ilike '%filed under UAV — verify category%' and p.category <> 'UAV';
  if n <> 6 then raise exception 'TX T guard T2: expected 6 stale rows, found %', n; end if;

  select count(*) into n from product_taxonomy where note ilike '%verify category%';
  if n <> 31 then raise exception 'TX T guard: expected 31 flagged rows catalogue-wide, found %', n; end if;
end $$;

-- T1. Seventeen products already moved out of UAV still carry the instruction that asked
-- for the move - an instruction describing a problem that has been fixed.
update product_taxonomy pt
   set note = 'Non-aerial domain confirmed and the category corrected from UAV to Other by an earlier pass. The unresolved editorial instruction this note used to carry was answered by that correction, and was cleared on 2026-11-01.'
  from products p
 where p.id = pt.product_id and p.category <> 'UAV'
   and pt.note ilike '%not an aerial system%';                 -- expect 17

-- T2. The same thing in the other phrasing, on six records whose domain rows are sourced.
-- The sourced description is kept; only the trailing instruction goes.
update product_taxonomy pt
   set note = regexp_replace(pt.note, '\s*—\s*filed under UAV — verify category\s*$', '')
              || ' — category corrected UAV -> Other by an earlier pass; the editorial instruction that followed this description was answered by that correction and cleared 2026-11-01.'
  from products p
 where p.id = pt.product_id and p.category <> 'UAV'
   and pt.note ilike '%filed under UAV — verify category%';    -- expect 6

-- T2b. DriX and DriX O-16, corrected by the 2026-11-01 Exail pass, whose replacement
-- notes still quote the retired instruction and so still answer to a flag search.
update product_taxonomy pt
   set note = 'Surface (USV). Category corrected from UAV to Other in the 2026-11-01 Exail pass. The editorial instruction this note used to carry was answered then; the quotation of it was removed on 2026-11-01 so that a flag search no longer returns this row.'
 where pt.product_id in ('c87b1319-f15d-48d3-a7fd-a09a49893e57','2dbd66ec-3f36-4a0a-87ff-0561e2bed85e')
   and pt.note ilike '%verify cate%';                          -- expect 2

-- T3. HALIA is the opposite case: it is STILL categorised UAV and that is CORRECT. It is
-- an amphibious float-and-fly system holding an aerial domain row alongside its surface
-- one, so the instruction has an answer, and the answer is "leave it". Note only.
update product_taxonomy pt
   set note = 'Amphibious float-and-fly: 30+ day sea persistence between flights, and it also holds an aerial domain row - levantatech.com. Category reviewed on 2026-11-01 and deliberately left as UAV: a genuinely aerial system with a surface mode, not a surface system misfiled. The earlier editorial instruction is answered.'
 where pt.product_id = '4d80bcae-02da-44d5-8643-c030cd9a8df4'
   and pt.note ilike '%verify category%';                      -- expect 1

-- T5. Two Exail products moved on 2026-11-01 carry model-knowledge seeds that are now
-- corroborated. Only the rows a source actually supports are upgraded.
--   A-18M: domain, control and origin upgraded. mission_military = isr is NOT upgraded -
--   the vehicle is for mine countermeasures, which is not the same thing as ISR.
update product_taxonomy pt set source = 'web', confidence = 'high',
 note = 'Exail A18-M, a mid-size autonomous underwater vehicle for mine countermeasure missions - exail.com, navalnews.com. Corroborated 2026-11-01, replacing a model-knowledge seed.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '1de976af-ff68-498c-b855-7c9ac2514e4d'
   and o.id = pt.option_id and f.id = o.facet_id
   and f.slug in ('domain','control','origin');                -- expect 3

--   K-Ster: domain and origin upgraded. control = tethered is NOT upgraded - no reviewed
--   source confirms a wire or fibre link, only remote operation.
update product_taxonomy pt set source = 'web', confidence = 'high',
 note = 'Exail K-STER C, an expendable remotely operated underwater mine disposal vehicle with a tiltable shaped charge, deployable from USVs; NSPA ordered several hundred for the Belgian and Royal Netherlands navies under an about EUR60m contract, August 2024 - exail.com, navalnews.com. Corroborated 2026-11-01, replacing a model-knowledge seed.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '6efaadb9-8c45-4695-ac50-49e3fdba53b0'
   and o.id = pt.option_id and f.id = o.facet_id
   and f.slug in ('domain','origin');                          -- expect 2

commit;

-- ---------------------------------------------------------------------------------------
-- After TX T alone, 5 flagged rows remain: the domain notes of Ghost Shark, LUNA-2, MMCM,
-- rMCM and XLUUV. TX A clears two of them, TX B clears the other three. After all three
-- transactions a catalogue-wide search for either phrase returns ZERO - which is the point
-- of not quoting the instruction you are retiring.
