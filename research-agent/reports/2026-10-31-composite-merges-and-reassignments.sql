-- TIERS B and C — the merge and the three unpublish/reassign proposals.
-- NOT READY. Each block changes publication_status, so each needs its own approval
-- under CLAUDE.md rule 4. Run only the blocks that are approved.
--
-- Two traps these blocks handle, both found in the dry run:
--
--  1. Product ownership is stored TWICE — products.company_id and
--     product_companies(product_id, company_id, role). Every affected product has one
--     mirror row with role 'manufacturer'. Updating only products.company_id leaves the
--     mirror pointing at a retired owner. Both are updated here.
--
--  2. A product's public URL comes from slugify(product name), not from its owner, so
--     reassigning ownership does NOT move a product page. No product redirect is needed.
--
-- Verified in the dry run: none of the four source records is in the landscape, so none
-- of these blocks changes landscape membership; no destination has a same-named live
-- product, so no slug collision; the destinations are all live.

-- =====================================================================
-- BLOCK B1 — IAI (Tamam / MALAT) -> Israel Aerospace Industries (IAI)
-- Tamam and MALAT are IAI divisions, not companies. The catalogue already says so: a
-- division_of relationship already points from this record to the real IAI record.
-- =====================================================================
begin;

update products set company_id = '4b8a899c-5577-48db-a78e-260e7d0a75fb', updated_at = now()
 where id = '60e21c8f-c868-4180-919f-aeb30bf7ee5c'
   and company_id = 'ce8f03bd-a0b5-4b24-9b32-3f7ee0040115';

update product_companies set company_id = '4b8a899c-5577-48db-a78e-260e7d0a75fb'
 where product_id = '60e21c8f-c868-4180-919f-aeb30bf7ee5c'
   and company_id = 'ce8f03bd-a0b5-4b24-9b32-3f7ee0040115';

insert into company_aliases (company_id, alias, type) values
  ('4b8a899c-5577-48db-a78e-260e7d0a75fb', 'Tamam', 'aka'),
  ('4b8a899c-5577-48db-a78e-260e7d0a75fb', 'MALAT', 'aka')
on conflict (company_id, alias) do nothing;

-- The old page is indexed, so leave a redirect rather than a 404.
insert into slug_redirects (from_slug, to_slug, kind, reason)
values ('iai-tamam-malat', 'israel-aerospace-industries-iai', 'company', 'merged division into parent')
on conflict (from_slug) do nothing;

-- The relationship described the composite, which no longer renders.
delete from company_relationships where id = '31f6263f-3135-484d-aaf2-23c3ac50f702';

update companies set publication_status = 'draft', updated_at = now()
 where id = 'ce8f03bd-a0b5-4b24-9b32-3f7ee0040115' and publication_status = 'live';

-- Expect: IAI 17 -> 18 live products, composite 0, landscape unchanged at 567.
select (select count(*) from products where company_id='4b8a899c-5577-48db-a78e-260e7d0a75fb' and publication_status='live') as iai_products,
       (select count(*) from products where company_id='ce8f03bd-a0b5-4b24-9b32-3f7ee0040115' and publication_status='live') as composite_products,
       (select count(*) from landscape_candidates where landscape_slug='europe-uav-cuas-2026' and status='included') as landscape;
commit;

-- ROLLBACK B1
-- update products set company_id='ce8f03bd-a0b5-4b24-9b32-3f7ee0040115' where id='60e21c8f-c868-4180-919f-aeb30bf7ee5c';
-- update product_companies set company_id='ce8f03bd-a0b5-4b24-9b32-3f7ee0040115' where product_id='60e21c8f-c868-4180-919f-aeb30bf7ee5c';
-- delete from company_aliases where company_id='4b8a899c-5577-48db-a78e-260e7d0a75fb' and alias in ('Tamam','MALAT');
-- delete from slug_redirects where from_slug='iai-tamam-malat';
-- insert into company_relationships (id, source_company_id, target_company_id, type)
--   values ('31f6263f-3135-484d-aaf2-23c3ac50f702','ce8f03bd-a0b5-4b24-9b32-3f7ee0040115','4b8a899c-5577-48db-a78e-260e7d0a75fb','division_of');
-- update companies set publication_status='live' where id='ce8f03bd-a0b5-4b24-9b32-3f7ee0040115';

-- =====================================================================
-- BLOCK C1 — BUAA / HAIG: unpublish, BZK-005 to Harbin
-- Beihang University designed the BZK-005; Harbin Aircraft Industry Group builds it. The
-- product follows the manufacturer. The destination exists, is live and has 0 products.
-- =====================================================================
begin;

update products set company_id = '7faad66c-33e3-448c-af95-afac064b5f0a', updated_at = now()
 where id = '9530be4e-cfa7-4cd9-960b-e77e059a79da'
   and company_id = 'b720eb0d-6505-493b-8a0e-f7b84589e621';

update product_companies set company_id = '7faad66c-33e3-448c-af95-afac064b5f0a'
 where product_id = '9530be4e-cfa7-4cd9-960b-e77e059a79da'
   and company_id = 'b720eb0d-6505-493b-8a0e-f7b84589e621';

insert into slug_redirects (from_slug, to_slug, kind, reason)
values ('beijing-univ-of-aeronautics-and-astronautics-buaa-harbin-aircraft-industry-group-haig',
        'harbin-aircraft-industry-corporation', 'company',
        'composite of a university designer and its manufacturer; product follows the manufacturer')
on conflict (from_slug) do nothing;

update companies set publication_status = 'draft', updated_at = now()
 where id = 'b720eb0d-6505-493b-8a0e-f7b84589e621' and publication_status = 'live';

select (select count(*) from products where company_id='7faad66c-33e3-448c-af95-afac064b5f0a' and publication_status='live') as harbin_products,
       (select count(*) from companies where publication_status='live') as live_companies;
commit;

-- ROLLBACK C1
-- update products set company_id='b720eb0d-6505-493b-8a0e-f7b84589e621' where id='9530be4e-cfa7-4cd9-960b-e77e059a79da';
-- update product_companies set company_id='b720eb0d-6505-493b-8a0e-f7b84589e621' where product_id='9530be4e-cfa7-4cd9-960b-e77e059a79da';
-- delete from slug_redirects where from_slug='beijing-univ-of-aeronautics-and-astronautics-buaa-harbin-aircraft-industry-group-haig';
-- update companies set publication_status='live' where id='b720eb0d-6505-493b-8a0e-f7b84589e621';

-- =====================================================================
-- BLOCK C2 — Northrop Grumman / IAI: unpublish, both Hunters to IAI
-- A JUDGEMENT CALL, not a clerical fix. The Hunter was a joint programme: IAI Malat
-- originated the design, TRW built the US side, and Northrop Grumman inherited it with
-- TRW in 2002. Assigning to IAI as originator is the better reading, but it is a reading.
-- Both products are 'discontinued', so neither record is losing current business.
-- =====================================================================
begin;

update products set company_id = '4b8a899c-5577-48db-a78e-260e7d0a75fb', updated_at = now()
 where id in ('bf2ebc7f-9324-42e2-bc2e-d52251432279','a358d9d4-ba8d-4a23-a879-39ba14e0efcb')
   and company_id = 'eb64fdb6-0618-4999-b1bc-53d3df466c8a';

update product_companies set company_id = '4b8a899c-5577-48db-a78e-260e7d0a75fb'
 where product_id in ('bf2ebc7f-9324-42e2-bc2e-d52251432279','a358d9d4-ba8d-4a23-a879-39ba14e0efcb')
   and company_id = 'eb64fdb6-0618-4999-b1bc-53d3df466c8a';

insert into slug_redirects (from_slug, to_slug, kind, reason)
values ('northrop-grumman-iai', 'israel-aerospace-industries-iai', 'company',
        'composite of two separate primes; Hunter reassigned to the originating designer')
on conflict (from_slug) do nothing;

delete from company_relationships where id = 'b135698d-64e9-4c76-8cf8-a77283cd12b2';

update companies set publication_status = 'draft', updated_at = now()
 where id = 'eb64fdb6-0618-4999-b1bc-53d3df466c8a' and publication_status = 'live';

select (select count(*) from products where company_id='4b8a899c-5577-48db-a78e-260e7d0a75fb' and publication_status='live') as iai_products,
       (select count(*) from products where company_id='cc57b545-cdc5-4f84-9f05-aae691d9d969' and publication_status='live') as northrop_products_unchanged;
commit;

-- ROLLBACK C2
-- update products set company_id='eb64fdb6-0618-4999-b1bc-53d3df466c8a' where id in ('bf2ebc7f-9324-42e2-bc2e-d52251432279','a358d9d4-ba8d-4a23-a879-39ba14e0efcb');
-- update product_companies set company_id='eb64fdb6-0618-4999-b1bc-53d3df466c8a' where product_id in ('bf2ebc7f-9324-42e2-bc2e-d52251432279','a358d9d4-ba8d-4a23-a879-39ba14e0efcb');
-- delete from slug_redirects where from_slug='northrop-grumman-iai';
-- insert into company_relationships (id, source_company_id, target_company_id, type)
--   values ('b135698d-64e9-4c76-8cf8-a77283cd12b2','eb64fdb6-0618-4999-b1bc-53d3df466c8a','cc57b545-cdc5-4f84-9f05-aae691d9d969','jv_partner');
-- update companies set publication_status='live' where id='eb64fdb6-0618-4999-b1bc-53d3df466c8a';

-- =====================================================================
-- BLOCK C3 — IAI / Israel MoD: unpublish. THE PRODUCT DECISION COMES FIRST.
-- The Israeli MoD is the sponsor and customer, not a co-manufacturer, so the composite
-- is wrong either way. But TecSAR / Ofeq are reconnaissance satellites — the same class
-- as the PRISMA and COSMO-SkyMed products unpublished on 2026-10-29. Choose C3a or C3b.
-- =====================================================================

-- C3a — the satellite-scope rule applies: unpublish the product with the record.
-- begin;
-- update products set publication_status='draft', updated_at=now()
--  where id='6c104a2f-8f91-44a6-8740-2a569ff177a4' and publication_status='live';
-- delete from company_relationships where id='8ed61e48-a574-450b-88e8-22c01c9b4165';
-- update companies set publication_status='draft', updated_at=now()
--  where id='2e8c588d-b397-48d6-912d-bfdd5c0b5e9c' and publication_status='live';
-- commit;

-- C3b — satellites stay in scope: move the product to IAI, then unpublish the composite.
-- begin;
-- update products set company_id='4b8a899c-5577-48db-a78e-260e7d0a75fb', updated_at=now()
--  where id='6c104a2f-8f91-44a6-8740-2a569ff177a4' and company_id='2e8c588d-b397-48d6-912d-bfdd5c0b5e9c';
-- update product_companies set company_id='4b8a899c-5577-48db-a78e-260e7d0a75fb'
--  where product_id='6c104a2f-8f91-44a6-8740-2a569ff177a4' and company_id='2e8c588d-b397-48d6-912d-bfdd5c0b5e9c';
-- insert into slug_redirects (from_slug, to_slug, kind, reason)
--  values ('iai-israel-mod','israel-aerospace-industries-iai','company','composite of a manufacturer and its government customer')
--  on conflict (from_slug) do nothing;
-- delete from company_relationships where id='8ed61e48-a574-450b-88e8-22c01c9b4165';
-- update companies set publication_status='draft', updated_at=now()
--  where id='2e8c588d-b397-48d6-912d-bfdd5c0b5e9c' and publication_status='live';
-- commit;
