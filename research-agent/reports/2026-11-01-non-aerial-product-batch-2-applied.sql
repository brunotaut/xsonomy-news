-- Non-aerial product batch 2 — THE AUTHORISED SUBSET. 2026-11-01.
--
-- Supersedes 2026-11-01-non-aerial-product-batch-2.sql for execution purposes. That file
-- proposed three transactions (A, B, T); this one carries only what was authorised, and
-- the differences are deliberate:
--
--   * LUNA-2 is EXCLUDED. The prepared TX A moved three records; this moves two. TX A is
--     therefore NOT run unchanged - it is replaced by TX A' below.
--   * TX B is NOT run. MMCM, rMCM and XLUUV stay as they are, and with them rMCM's wrong
--     surface-usv row, which TX B would have deleted. See the retirement proposal:
--     2026-11-01-mmcm-rmcm-xluuv-retirement-proposal.md
--   * Ghost Shark's manufacturer IS corrected here (Albacore -> Anduril), which the
--     prepared file deliberately held.
--   * Exail A27 is unpublished here, which the prepared file deliberately held.
--
-- ORDER MATTERS, and this is the reason. TX T's first statement rewrites every note that
-- contains 'not an aerial system' on a record no longer categorised UAV. If TX A' ran
-- first, Ghost Shark - which carries exactly that note and is being moved out of UAV -
-- would be swept into that generic rewrite and lose the note written for it. So TX T runs
-- FIRST, while Ghost Shark is still UAV and therefore out of its reach.
--
--   TX T  - taxonomy notes and evidence upgrades   (26 notes + 5 upgrades, no category)
--   TX A' - Dire WOLF and Ghost Shark              (category, redirects, maker, upgrades)
--   TX C  - Exail A27                              (publication_status -> draft)
--
-- Each transaction opens with guards that RAISE on drift, so a row edited since this was
-- prepared aborts the whole transaction instead of being overwritten. Rollback:
-- 2026-11-01-non-aerial-product-batch-2-applied-rollback.sql

-- =====================================================================  TX T  (first)
-- Taxonomy notes and evidence only. No category, slug, redirect or publication change.
--
-- THE DEFECT THIS FIXES, which is inherited and was nearly repeated. A fix that QUOTES the
-- instruction it retires re-creates the searchable string, so the flag population can
-- never shrink and a later pass re-reviews work already done. The 2026-11-01 Exail pass did
-- this to DriX and DriX O-16; the first draft of this transaction did it to all 26 rows.
-- Every replacement note below therefore contains NEITHER 'verify category' NOR
-- 'not an aerial system'.
begin;

do $$
declare n int;
begin
  select count(*) into n from product_taxonomy pt join products p on p.id = pt.product_id
   where pt.note ilike '%not an aerial system%' and p.category <> 'UAV';
  if n <> 17 then raise exception 'TX T guard T1: expected 17 stale rows, found %', n; end if;

  -- all 17 are byte-identical and carry no sourced description, so a wholesale
  -- replacement loses nothing. Assert that, rather than assume it.
  select count(*) into n from product_taxonomy pt join products p on p.id = pt.product_id
   where p.category <> 'UAV'
     and pt.note = 'filed under category UAV but is not an aerial system — verify category';
  if n <> 17 then raise exception 'TX T guard T1b: expected 17 identical notes, found %', n; end if;

  select count(*) into n from product_taxonomy pt join products p on p.id = pt.product_id
   where pt.note ilike '%filed under UAV — verify category%' and p.category <> 'UAV';
  if n <> 6 then raise exception 'TX T guard T2: expected 6 stale rows, found %', n; end if;

  select count(*) into n from product_taxonomy where note ilike '%verify category%';
  if n <> 31 then raise exception 'TX T guard: expected 31 flagged rows catalogue-wide, found %', n; end if;

  -- LUNA-2, MMCM, rMCM and XLUUV are PENDING and keep their flags. Ghost Shark's is
  -- cleared by TX A', not here.
  select count(*) into n from product_taxonomy
   where product_id in ('8a28d7c5-df6e-4d91-900a-d451f65a61ec',
                        'ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                        '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                        '9d80e014-03aa-4342-9a91-1fcaa702fca2')
     and note ilike '%verify category%';
  if n <> 4 then raise exception 'TX T guard: expected 4 pending flags, found %', n; end if;
end $$;

-- T1. Seventeen products already moved out of UAV still carry the instruction that asked
-- for the move - an instruction describing a problem that has been fixed.
update product_taxonomy pt
   set note = 'Non-aerial domain confirmed and the category corrected from UAV to Other by an earlier pass. The unresolved editorial instruction this note used to carry was answered by that correction, and was cleared on 2026-11-01.'
  from products p
 where p.id = pt.product_id and p.category <> 'UAV'
   and pt.note ilike '%not an aerial system%';                 -- expect 17

-- T2. The same thing in the other phrasing, on six records whose domain rows ARE sourced.
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

-- T3. HALIA is the opposite case: it is STILL categorised UAV and that is CORRECT. An
-- amphibious float-and-fly system holding an aerial domain row alongside its surface one,
-- so the instruction has an answer, and the answer is "leave it". Note only - no data
-- change to the record at all.
update product_taxonomy pt
   set note = 'Amphibious float-and-fly: 30+ day sea persistence between flights, and it also holds an aerial domain row - levantatech.com. Category reviewed on 2026-11-01 and deliberately left as UAV: a genuinely aerial system with a surface mode, not a surface system misfiled. The earlier editorial instruction is answered.'
 where pt.product_id = '4d80bcae-02da-44d5-8643-c030cd9a8df4'
   and pt.note ilike '%verify category%';                      -- expect 1

-- T5. Two Exail products moved on 2026-11-01 carry model-knowledge seeds that primary
-- sources now corroborate. Only the rows a source actually supports are upgraded.
--   A-18M: domain, control and origin upgraded. mission_military = isr is NOT upgraded -
--   the vehicle is for mine countermeasures, which is not the same thing as ISR, and
--   conflating them would be the same class of error this batch is clearing.
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

-- =====================================================================  TX A'  (second)
-- Dire WOLF and Ghost Shark. TWO records, not the prepared three: LUNA-2 is excluded, so
-- this is not TX A and must not be read as it. Four changes:
--   1. category UAV -> Other on both
--   2. cross-section redirects so /uav/<slug>/ keeps working
--   3. Ghost Shark's manufacturer corrected Albacore -> Anduril
--   4. Dire WOLF's four supported taxonomy upgrades (of five rows; the fifth is left)
begin;

do $$
declare n int;
begin
  -- the two records, as expected
  select count(*) into n from products
   where id in ('d77e3215-00e6-4bde-88cd-2aa49c294522',
                '0c420e85-28c1-4c88-acab-436348b91ec3')
     and publication_status = 'live' and category = 'UAV';
  if n <> 2 then raise exception 'TX A guard: expected 2 live UAV rows, found %', n; end if;

  -- no namesake may be sitting in /other/ under the same slug
  select count(*) into n from products
   where publication_status = 'live' and category = 'Other'
     and slug::text in ('dire-wolf','ghost-shark');
  if n <> 0 then raise exception 'TX A guard: % slug collision(s) in /other/', n; end if;

  -- and no redirect may already claim those old urls
  select count(*) into n from slug_redirects
   where kind = 'product' and from_slug::text in ('dire-wolf','ghost-shark');
  if n <> 0 then raise exception 'TX A guard: % redirect(s) already exist, found %', n, n; end if;

  -- OWNERSHIP, both ends. Ghost Shark must still point at Albacore and only Albacore,
  -- Anduril must be live, and no Anduril link may already exist - otherwise the update
  -- below would collide with it instead of moving the row.
  select count(*) into n from products
   where id = '0c420e85-28c1-4c88-acab-436348b91ec3'
     and company_id = '67acfba0-d73f-455f-ab06-f4476b5ef473';
  if n <> 1 then raise exception 'TX A guard: Ghost Shark no longer points at Albacore'; end if;

  select count(*) into n from product_companies
   where product_id = '0c420e85-28c1-4c88-acab-436348b91ec3';
  if n <> 1 then raise exception 'TX A guard: expected exactly 1 product_companies row for Ghost Shark, found %', n; end if;

  select count(*) into n from product_companies
   where product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
     and company_id = '67acfba0-d73f-455f-ab06-f4476b5ef473' and role = 'manufacturer';
  if n <> 1 then raise exception 'TX A guard: Ghost Shark''s one link is not Albacore/manufacturer'; end if;

  select count(*) into n from companies
   where id = '5e2751f3-e686-4264-b72a-d5b58ed8f3dc' and publication_status = 'live';
  if n <> 1 then raise exception 'TX A guard: the Anduril company record is not live'; end if;

  -- Ghostfin stays Albacore's, and stays a separate record. Assert it rather than hope.
  select count(*) into n from products
   where id = 'e78add2b-651e-411c-b801-5264183200b9'
     and company_id = '67acfba0-d73f-455f-ab06-f4476b5ef473' and publication_status = 'live';
  if n <> 1 then raise exception 'TX A guard: Ghostfin is no longer Albacore''s live record'; end if;

  -- Dire WOLF's five seed rows, four of which are upgraded below
  select count(*) into n from product_taxonomy
   where product_id = 'd77e3215-00e6-4bde-88cd-2aa49c294522'
     and source = 'knowledge' and confidence = 'medium';
  if n <> 5 then raise exception 'TX A guard: expected 5 Dire WOLF seed rows, found %', n; end if;
end $$;

update products set category = 'Other'
 where id in ('d77e3215-00e6-4bde-88cd-2aa49c294522',
              '0c420e85-28c1-4c88-acab-436348b91ec3')
   and category = 'UAV';                                       -- expect 2

insert into slug_redirects (from_slug, to_slug, kind, from_section, reason)
values
 ('dire-wolf','dire-wolf','product','uav','Non-aerial product batch 2, 2026-11-01: BLADE (ex-HDT Global) six-wheeled hybrid logistics UGV; category corrected UAV -> Other, page moved to /other/dire-wolf/'),
 ('ghost-shark','ghost-shark','product','uav','Non-aerial product batch 2, 2026-11-01: extra-large autonomous UNDERWATER vehicle; category corrected UAV -> Other, page moved to /other/ghost-shark/');
                                                               -- expect 2

-- THE MAKER. Albacore makes exactly one vehicle, Ghostfin, and albacore.inc names no
-- other; Ghost Shark is Anduril's. Both ends of the attribution move together, and
-- nothing else does: the 17 article links and Ghostfin's own record are untouched.
update products set company_id = '5e2751f3-e686-4264-b72a-d5b58ed8f3dc'
 where id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and company_id = '67acfba0-d73f-455f-ab06-f4476b5ef473';     -- expect 1

update product_companies set company_id = '5e2751f3-e686-4264-b72a-d5b58ed8f3dc'
 where product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and company_id = '67acfba0-d73f-455f-ab06-f4476b5ef473'
   and role = 'manufacturer';                                   -- expect 1

-- The flag that asked for the category review is now answered, so it stops asking. The
-- note records the maker correction, and records what was deliberately NOT changed.
update product_taxonomy pt set
 note = 'Underwater (UUV/AUV): an extra-large autonomous undersea vehicle. Category corrected from UAV to Other on 2026-11-01, and the maker corrected in the same pass. This record was attributed to Albacore, whose only vehicle is Ghostfin - a separate record, albacore.inc names no other - and whose name is where the confusion came from. Ghost Shark is Anduril''s XL-AUV, co-developed with the Royal Australian Navy and DSTG and placed under a production contract in September 2025: anduril.com/news/first-ghost-shark-debuts-in-australia, defence.gov.au. NOT changed here: the record''s own source_urls still cite an article about Albacore''s Ghostfin.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';   -- expect 1

-- Dire WOLF's seeded rows are now corroborated. FOUR of the five are upgraded; the fifth
-- (control = semi-autonomous-human-on-the-loop) is NOT, because no source states the
-- control mode - it keeps its seed note and its knowledge/medium evidence.
update product_taxonomy pt set source = 'web', confidence = 'high',
 note = 'BLADE (formerly HDT Global) six-wheeled diesel-electric hybrid UGV for autonomous battlefield resupply, derived from the WOLF-X; selected for the U.S. Army Project Sustainment effort, July 2026 - hdtglobal.com, armyrecognition.com, defence-blog.com. Corroborated 2026-11-01, replacing a model-knowledge seed.'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = 'd77e3215-00e6-4bde-88cd-2aa49c294522'
   and o.id = pt.option_id and f.id = o.facet_id
   and f.slug in ('domain','propulsion','mission_military','origin');     -- expect 4

commit;

-- =====================================================================  TX C  (third)
-- Exail A27 -> draft. Exail's AUV range is A9-M, A18-M, A6K-M and Ulyx, and its
-- ultra-deepwater vehicle for the French Navy derives from Ulyx. NO SOURCE NAMES AN A27.
-- This is also the one record in the batch whose CATEGORY is unsupported too - its
-- underwater domain row is a bare model seed - so moving it to Other would have asserted
-- "this is a non-aerial system" on no evidence either. Unpublishing answers both.
--
-- Nothing is deleted. The record, its four taxonomy rows, its source_urls and its Exail
-- link all stay, for audit and for whoever next tries to source the name. The site's
-- established retirement behaviour is simply that the build fetches
-- publication_status = 'live' only, so the page ceases to exist; no redirect is invented,
-- because there is no product to redirect to.
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id = '3515b298-4a7d-4cff-a1f4-ec6a7bf24726'
     and slug::text = 'exail-a27' and publication_status = 'live' and category = 'UAV';
  if n <> 1 then raise exception 'TX C guard: Exail A27 is not the live UAV row expected'; end if;

  -- no redirect may point at this slug in either direction, now or after
  select count(*) into n from slug_redirects
   where from_slug::text = 'exail-a27' or to_slug::text = 'exail-a27';
  if n <> 0 then raise exception 'TX C guard: % redirect(s) reference exail-a27', n; end if;

  -- what must survive the unpublication
  select count(*) into n from product_taxonomy
   where product_id = '3515b298-4a7d-4cff-a1f4-ec6a7bf24726';
  if n <> 4 then raise exception 'TX C guard: expected 4 A27 taxonomy rows, found %', n; end if;

  select count(*) into n from product_companies
   where product_id = '3515b298-4a7d-4cff-a1f4-ec6a7bf24726'
     and company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0';
  if n <> 1 then raise exception 'TX C guard: A27''s Exail link is missing'; end if;
end $$;

update products set publication_status = 'draft'
 where id = '3515b298-4a7d-4cff-a1f4-ec6a7bf24726'
   and publication_status = 'live';                             -- expect 1

commit;

-- ---------------------------------------------------------------------------------------
-- AFTER ALL THREE, a catalogue-wide search for 'verify category' returns 4, not 0: the
-- domain notes of LUNA-2, MMCM, rMCM and XLUUV. Those four records are pending by
-- instruction, and a pending record keeps its flag. That is the number being honest, not
-- the number being unfinished.
