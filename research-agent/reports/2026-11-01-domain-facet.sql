-- Domain facet: two stale derived rows. PREPARED, NOT APPLIED. 2026-11-01.
--
-- Report:   2026-11-01-domain-facet-semantics.md
-- Manifest: 2026-11-01-domain-facet-manifest.csv
-- Rollback: 2026-11-01-domain-facet-rollback.sql
--
-- Both rows are source='rule', note='category=UAV' - derived from the product's
-- category at a time when it was UAV. The category was later corrected to Other and
-- the derivation did not follow. They are deleted rather than re-tagged because they
-- assert something false (neither product is an uncrewed aerial system), because the
-- catalogue's convention for a non-UAV product is to carry NO domain row (0 of the
-- Sensor / Counter-UAS / Effector / Software products carry one), and because a
-- derivation whose basis is gone has no observation in it worth preserving.
--
-- product_taxonomy has no surrogate key, so rows are addressed by
-- (product_id, option_id) with the option resolved through the facet join.

begin;

do $$
declare n int;
begin
  -- exactly the two rows this was written against, in exactly that state
  select count(*) into n
    from product_taxonomy pt
    join products p on p.id = pt.product_id
    join taxonomy_options o on o.id = pt.option_id
    join taxonomy_facets f on f.id = o.facet_id and f.slug = 'domain'
   where o.slug = 'aerial-uav-uas' and p.category <> 'UAV'
     and pt.source = 'rule' and pt.confidence = 'high' and pt.note = 'category=UAV'
     and p.id in ('6fb1094b-2df0-405b-97c6-26c01211ea31',
                  'c0fca03f-7285-4e71-901b-2dc46c73ba5a');
  if n <> 2 then raise exception 'guard: expected 2 stale derived rows, found %', n; end if;

  -- and no OTHER product has grown one since, which would mean this is no longer a
  -- two-record cleanup and deserves re-reading rather than this statement
  select count(*) into n
    from product_taxonomy pt
    join products p on p.id = pt.product_id
    join taxonomy_options o on o.id = pt.option_id
    join taxonomy_facets f on f.id = o.facet_id and f.slug = 'domain'
   where o.slug = 'aerial-uav-uas' and p.category <> 'UAV';
  if n <> 2 then raise exception 'guard: % aerial rows on non-UAV products, not 2 - re-review first', n; end if;

  -- the convention this relies on still holds: components carry no domain row
  select count(*) into n
    from product_taxonomy pt
    join products p on p.id = pt.product_id
    join taxonomy_options o on o.id = pt.option_id
    join taxonomy_facets f on f.id = o.facet_id and f.slug = 'domain'
   where p.category in ('Sensor','Counter-UAS','Effector','Software');
  if n <> 0 then raise exception 'guard: % component products now carry a domain row - the convention has changed, re-read the report', n; end if;
end $$;

delete from product_taxonomy pt
 using taxonomy_options o, taxonomy_facets f
 where pt.product_id in ('6fb1094b-2df0-405b-97c6-26c01211ea31',
                         'c0fca03f-7285-4e71-901b-2dc46c73ba5a')
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain'
   and o.slug = 'aerial-uav-uas'
   and pt.source = 'rule' and pt.note = 'category=UAV';      -- expect 2

commit;

-- ---------------------------------------------------------------------------------------
-- Predicted after commit: product_taxonomy 11132 -> 11130; aerial-uav-uas rows on
-- non-UAV products 2 -> 0; both products otherwise untouched (category Other,
-- publication_status live, company and sources unchanged).
