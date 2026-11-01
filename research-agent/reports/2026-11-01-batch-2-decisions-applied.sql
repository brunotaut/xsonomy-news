-- Non-aerial batch 2 — Nazar's decisions, applied. 2026-11-01.
--
-- Report: 2026-11-01-batch-2-decisions-applied.md
-- Rollback: 2026-11-01-batch-2-decisions-applied-rollback.sql
--
-- Authorised: (1) retire MMCM, rMCM and XLUUV; (2) delete rMCM's false domain row;
-- (3) correct Ghost Shark's source_urls; (4) LUNA-2 left to my judgement.
--
-- On (4): LUNA-2 moves to Other and STAYS PUBLISHED. Two facts decided it. It is the ONLY
-- space-orbital record in the catalogue, so this was never a class-wide scope policy -
-- just one record to place. And Dot, the sidewalk delivery robot that raised the identical
-- doubt in batch 1, is already Other/live - the house answer exists. Unlike Exail A27,
-- LUNA-2 demonstrably exists (ASELSAN's own announcement, SpaceX launch 30 March 2026,
-- a web/high domain row), so unpublishing a real product to dodge a scope question would
-- trade a small ambiguity for a plain inaccuracy.
--
--   TX R - retire MMCM, rMCM, XLUUV, and delete rMCM's false domain row
--   TX S - Ghost Shark's source_urls
--   TX L - LUNA-2 to Other
--
-- The three are independent and can be run in any order; none touches a row another reads.
-- Each opens with guards that RAISE on drift.

-- =====================================================================  TX R
-- Retirement, per the proposal in 2026-11-01-mmcm-rmcm-xluuv-retirement-proposal.md.
-- The prepared TX B (recategorise to Other) is hereby NOT run and is superseded.
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                '9d80e014-03aa-4342-9a91-1fcaa702fca2')
     and publication_status = 'live' and category = 'UAV';
  if n <> 3 then raise exception 'TX R guard: expected 3 live UAV rows, found %', n; end if;

  select count(*) into n from products
   where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                '9d80e014-03aa-4342-9a91-1fcaa702fca2')
     and company_id is not null;
  if n <> 0 then raise exception 'TX R guard: % of the three now have a company - review first', n; end if;

  select count(*) into n from product_companies
   where product_id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                        '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                        '9d80e014-03aa-4342-9a91-1fcaa702fca2');
  if n <> 0 then raise exception 'TX R guard: % product_companies rows appeared', n; end if;

  -- what must survive: one article link each, XLUUV's five taxonomy rows
  select count(*) into n from article_products
   where product_id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                        '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                        '9d80e014-03aa-4342-9a91-1fcaa702fca2');
  if n <> 3 then raise exception 'TX R guard: expected 3 article links, found %', n; end if;

  select count(*) into n from product_taxonomy where product_id = '9d80e014-03aa-4342-9a91-1fcaa702fca2';
  if n <> 5 then raise exception 'TX R guard: expected 5 XLUUV taxonomy rows, found %', n; end if;

  -- rMCM's false row is still the row this was written against
  select count(*) into n from product_taxonomy
   where product_id = '5d6c6ab3-6b4c-4552-9734-b6f7cff54903'
     and option_id = '9624877b-041a-434e-b016-e35ee1988a30'      -- surface-usv
     and source = 'knowledge' and confidence = 'medium'
     and note = 'filed under category UAV but is not an aerial system — verify category';
  if n <> 1 then raise exception 'TX R guard: rMCM''s domain row is not as recorded'; end if;

  select count(*) into n from slug_redirects
   where from_slug::text in ('mmcm','rmcm','xluuv') or to_slug::text in ('mmcm','rmcm','xluuv');
  if n <> 0 then raise exception 'TX R guard: % redirect(s) reference these slugs', n; end if;
end $$;

update products set publication_status = 'draft'
 where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
              '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
              '9d80e014-03aa-4342-9a91-1fcaa702fca2')
   and publication_status = 'live';                              -- expect 3

-- MMCM's domain row is KEPT: its deliverable genuinely is a USV, so the assertion is
-- correct as far as it goes. Only the flag is answered.
update product_taxonomy
   set note = 'Surface (USV). This record names the FR/UK Maritime Mine Counter Measures PROGRAMME, managed by OCCAR for the French DGA and the UK MOD with Thales leading the industrial team - thalesgroup.com - not a product. The programme does field uncrewed surface vehicles, so this domain assertion is correct as far as it goes. Retired from publication on 2026-11-01 as a programme name extracted as a product; the earlier editorial instruction is answered by that retirement.'
 where product_id = 'ccfd9d18-4029-4c1b-a46e-68e8de044f6b'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
   and note = 'filed under category UAV but is not an aerial system — verify category';
                                                                 -- expect 1

-- XLUUV's domain row is KEPT and correct: an extra-large uncrewed UNDERSEA vehicle is
-- underwater by definition. Its other four rows are bare seeds and are left alone - a
-- retired record's seeds assert nothing publicly, and removing them would be a change
-- nobody has evidence for.
update product_taxonomy
   set note = 'Underwater (UUV/AUV). XLUUV is the US Navy''s CLASS TERM for extra-large uncrewed undersea vehicles, above 84 inches in diameter; Boeing''s Orca is the vehicle that fills it - boeing.com. This record names the class, not a product, and was extracted from an article about a DIU programme for XLUUVs. Retired from publication on 2026-11-01; the earlier editorial instruction is answered by that retirement.'
 where product_id = '9d80e014-03aa-4342-9a91-1fcaa702fca2'
   and option_id = '85766220-b0c7-4847-ad53-4eb5c7ad1bbb'
   and note = 'filed under category UAV but is not an aerial system — verify category';
                                                                 -- expect 1

-- rMCM's domain row is FALSE and is deleted, not re-worded. The programme delivers twelve
-- CREWED City-class and Vlissingen-class vessels which CARRY uncrewed systems - two Exail
-- Inspector 125 USVs, three A-18 AUVs and two Saab V200 Skeldar air vehicles apiece -
-- rather than being one. Deleting leaves the record with no domain assertion at all, which
-- is the honest state. Authorised separately and defensible either way.
delete from product_taxonomy
 where product_id = '5d6c6ab3-6b4c-4552-9734-b6f7cff54903'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30';       -- expect 1

commit;

-- =====================================================================  TX S
-- Ghost Shark's source_urls. The single entry was an article about Albacore's GHOSTFIN -
-- a different vehicle with a similar name - which is how the misattribution got in. With
-- the maker now corrected to Anduril, a record citing only that article is actively
-- misleading. Replaced with Anduril's own announcement and the Australian Department of
-- Defence's, the two sources the maker correction actually rests on.
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id = '0c420e85-28c1-4c88-acab-436348b91ec3'
     and company_id = '5e2751f3-e686-4264-b72a-d5b58ed8f3dc'      -- Anduril, as corrected
     and source_urls = array['https://dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia'];
  if n <> 1 then raise exception 'TX S guard: Ghost Shark is not in the state this was written against'; end if;
end $$;

update products
   set source_urls = array['https://www.anduril.com/news/first-ghost-shark-debuts-in-australia',
                           'https://www.defence.gov.au/news-events/news/2022-12-14/ghost-shark-stealthy-game-changer']
 where id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and source_urls = array['https://dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia'];
                                                                 -- expect 1

-- the note no longer needs to warn about a source that has been fixed
update product_taxonomy pt
   set note = 'Underwater (UUV/AUV): an extra-large autonomous undersea vehicle. Category corrected from UAV to Other on 2026-11-01, and the maker corrected in the same pass. This record was attributed to Albacore, whose only vehicle is Ghostfin - a separate record, albacore.inc names no other - and whose name is where the confusion came from; the record''s own source_urls had cited an article about that other vehicle, which is how the error got in, and they were replaced on 2026-11-01. Ghost Shark is Anduril''s XL-AUV, co-developed with the Royal Australian Navy and DSTG and placed under a production contract in September 2025: anduril.com, defence.gov.au.'
  from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain'
   and pt.note like '%NOT changed here: the record''s own source_urls%';
                                                                 -- expect 1

commit;

-- =====================================================================  TX L
-- LUNA-2 to Other, STILL PUBLISHED. See the header for why this, rather than retirement.
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id = '8a28d7c5-df6e-4d91-900a-d451f65a61ec'
     and slug::text = 'luna-2' and publication_status = 'live' and category = 'UAV';
  if n <> 1 then raise exception 'TX L guard: LUNA-2 is not the live UAV row expected'; end if;

  select count(*) into n from products
   where publication_status = 'live' and category = 'Other' and slug::text = 'luna-2';
  if n <> 0 then raise exception 'TX L guard: slug collision in /other/'; end if;

  select count(*) into n from slug_redirects
   where from_slug::text = 'luna-2' or to_slug::text = 'luna-2';
  if n <> 0 then raise exception 'TX L guard: % redirect(s) reference luna-2', n; end if;

  -- it really is the only space-orbital record, which is the premise of the decision
  select count(*) into n from product_taxonomy pt
    join taxonomy_options o on o.id = pt.option_id
    join taxonomy_facets f on f.id = o.facet_id
   where f.slug = 'domain' and o.slug = 'space-orbital';
  if n <> 1 then raise exception 'TX L guard: % space-orbital rows exist, not 1 - the scope question is now a class question and needs an answer, not this statement', n; end if;
end $$;

update products set category = 'Other'
 where id = '8a28d7c5-df6e-4d91-900a-d451f65a61ec'
   and category = 'UAV';                                         -- expect 1

insert into slug_redirects (from_slug, to_slug, kind, from_section, reason)
values ('luna-2','luna-2','product','uav','Non-aerial product batch 2, 2026-11-01: ASELSAN LoRa IoT nanosatellite; category corrected UAV -> Other, page moved to /other/luna-2/');
                                                                 -- expect 1

update product_taxonomy
   set note = 'Space (orbital). ASELSAN LoRa IoT nanosatellite, launched by SpaceX on 30 March 2026, the second after LUNA-1 - aselsan.com. Category corrected from UAV to Other on 2026-11-01. Kept published rather than retired: the record is well sourced and the product demonstrably exists. Noted for whoever comes next - this is the ONLY space-orbital record in the catalogue, so whether satellites belong here at all stayed a one-record question rather than a scope policy; if more arrive, that question returns and deserves a real answer.'
 where product_id = '8a28d7c5-df6e-4d91-900a-d451f65a61ec'
   and option_id = '3bc29cc3-3134-4724-a77b-21fd67f101a0'
   and note = 'LoRa IoT nanosatellite launched by SpaceX 30 Mar 2026 — aselsan.com — filed under UAV — verify category';
                                                                 -- expect 1

commit;

-- ---------------------------------------------------------------------------------------
-- Predicted after all three, from the post-applied-batch baseline:
--   live UAV 1409 (from 1413: 3 retired, 1 moved) · live Other 413 (from 412)
--   live total 3518 (from 3521) · taxonomy 11132 (from 11133) · redirects 98 (from 97)
--   'verify category' 0 (from 4) · 'not an aerial system' 0 (from 3)
-- Zero this time, and honestly: every flagged record has now been answered or retired.
