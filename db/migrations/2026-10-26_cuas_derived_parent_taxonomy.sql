-- Mid-level taxonomy parents become DERIVED at query time instead of stored rows.
-- Applied 2026-10-26. Report: docs/CUAS_DERIVED_PARENT_TAXONOMY_MIGRATION_REPORT.md
--
-- Why: a stored `cuas-detection` row alongside a stored `cuas-det-radar` row says
-- nothing the leaf did not already say, but it counts as its own assignment. Audits
-- that matched sectors by slug pattern therefore counted parents as if they were
-- capabilities -- the measurement error behind the earlier "111 unevidenced C-UAS
-- leaves" report, which was really 10 leaves plus 101 parents.
--
-- Snapshots are untouched: landscape_entries is denormalised and immutable by trigger.

-- 1. Transitive closure of the taxonomy. Everything downstream joins this instead of
--    matching slug prefixes, so "is this a leaf / is this inside counter-UAS" becomes
--    a structural question the data answers.
create or replace view public.v_sector_closure as
  with recursive cl as (
    select id as ancestor_id, id as descendant_id, 0 as depth from sectors
    union all
    select cl.ancestor_id, s.id, cl.depth + 1
      from sectors s join cl on s.parent_id = cl.descendant_id)
  select * from cl;

comment on view public.v_sector_closure is
  'Ancestor/descendant pairs for the whole sector taxonomy, depth 0 = self. Use this instead of slug patterns such as ''cuas-%'', which silently conflate parents with capabilities.';

create or replace view public.v_sector_leaves as
  select s.id, s.slug, s.name, s.kind, s.parent_id
    from sectors s
   where not exists (select 1 from sectors ch where ch.parent_id = s.id);

-- 2. Archive before removing anything.
create table if not exists public.company_sectors_derived_archive (
  company_id   uuid not null,
  sector_id    uuid not null,
  sector_slug  citext not null,
  is_primary   boolean,
  confidence   text,
  source_urls  text[],
  assigned_by  text,
  assigned_at  timestamptz,
  note         text,
  removed_at   timestamptz not null default now(),
  removed_why  text not null
);

comment on table public.company_sectors_derived_archive is
  'company_sectors rows removed because a more specific sector the company already held implies them. Kept so the removal is reversible and auditable; these are never read by the site.';

-- 3. A row is redundant when the same company also holds a descendant of that sector.
--    Rows carrying their own evidence are kept even when redundant -- deleting them
--    would destroy a sourced assertion, and no count is worth that.
with redundant as (
  select cs.company_id, cs.sector_id, s.slug,
         cs.is_primary, cs.confidence, cs.source_urls, cs.assigned_by, cs.assigned_at, cs.note,
         coalesce(array_length(cs.source_urls, 1), 0) > 0 as has_evidence
    from company_sectors cs
    join sectors s on s.id = cs.sector_id
   where exists (
     select 1 from company_sectors other
       join v_sector_closure cl on cl.descendant_id = other.sector_id
      where other.company_id = cs.company_id
        and cl.ancestor_id = cs.sector_id
        and cl.depth > 0))
insert into public.company_sectors_derived_archive
  (company_id, sector_id, sector_slug, is_primary, confidence, source_urls,
   assigned_by, assigned_at, note, removed_why)
select company_id, sector_id, slug, is_primary, confidence, source_urls,
       assigned_by, assigned_at, note,
       'Implied by a more specific sector the company already holds; now derived at query time.'
  from redundant
 where not has_evidence;

delete from company_sectors cs
 using public.company_sectors_derived_archive a
 where a.company_id = cs.company_id and a.sector_id = cs.sector_id;

-- Milliray keeps its evidenced cuas-detection row, but the note was written before the
-- company gained a radar leaf and now contradicts the data.
update company_sectors cs
   set note = 'NATO DIANA names drone detection and counter-UAS without stating a modality. '
              'Kept as an explicit evidenced assignment; the cuas-det-radar leaf added later '
              'also implies detection.'
  from companies c, sectors s
 where cs.company_id = c.id and cs.sector_id = s.id
   and c.name = 'Milliray' and s.slug = 'cuas-detection';

-- 4. Reading model. `explicit` = somebody asserted it; `derived` = implied by a more
--    specific sector. Derived rows never borrow the leaf's evidence: they carry no
--    source_urls and no confidence, and name their basis in derived_from.
create or replace view public.v_company_sectors_explicit as
  select cs.company_id, cs.sector_id, s.slug, s.name as sector_name, s.kind,
         'explicit'::text as assignment_type,
         cs.is_primary, cs.confidence, cs.source_urls, cs.assigned_by, cs.assigned_at, cs.note,
         null::citext[] as derived_from
    from company_sectors cs
    join sectors s on s.id = cs.sector_id;

create or replace view public.v_company_sectors_effective as
  select company_id, sector_id, slug, sector_name, kind, assignment_type,
         is_primary, confidence, source_urls, assigned_by, assigned_at, note, derived_from
    from public.v_company_sectors_explicit
  union all
  select d.company_id, d.ancestor_id, s.slug, s.name, s.kind,
         'derived'::text,
         false, null, null, null, null, null,
         d.derived_from
    from (
      select cs.company_id, cl.ancestor_id,
             array_agg(distinct src.slug order by src.slug)::citext[] as derived_from
        from company_sectors cs
        join v_sector_closure cl on cl.descendant_id = cs.sector_id and cl.depth > 0
        join sectors src on src.id = cs.sector_id
       group by cs.company_id, cl.ancestor_id) d
    join sectors s on s.id = d.ancestor_id
   where not exists (
     select 1 from company_sectors cs2
      where cs2.company_id = d.company_id and cs2.sector_id = d.ancestor_id);

comment on view public.v_company_sectors_effective is
  'Every sector a company belongs to, explicit or implied by a more specific one. Use for display and category counts. Use v_company_sectors_explicit when asking what was actually asserted and on what evidence.';

-- 5. Specific C-UAS capabilities, decided structurally (leaf of the counter-uas
--    subtree) rather than by slug shape.
create or replace view public.v_cuas_specific_capabilities as
  select cs.company_id, cs.sector_id, s.slug, s.name as sector_name,
         cs.confidence, cs.assigned_by, cs.assigned_at, cs.source_urls, cs.note
    from company_sectors cs
    join sectors s on s.id = cs.sector_id
    join v_sector_closure cl
      on cl.ancestor_id = (select id from sectors where slug = 'counter-uas')
     and cl.descendant_id = s.id
   where not exists (select 1 from sectors ch where ch.parent_id = s.id);

-- Same contract as before, now derived from structure instead of a hard-coded slug list.
drop view if exists public.v_cuas_specific;
create view public.v_cuas_specific as
  select company_id, sector_id, slug, sector_name, confidence, assigned_by,
         assigned_at, source_urls, note
    from public.v_cuas_specific_capabilities;

-- 6. Keep it fixed. An unevidenced parent that a more specific sector already implies
--    is not stored, and adding a specific sector prunes the parents it makes redundant.
--    Evidenced rows and rows with product links are left alone in both directions.
create or replace function public.company_sectors_skip_derivable() returns trigger
language plpgsql as $$
begin
  if coalesce(array_length(new.source_urls, 1), 0) > 0 then
    return new;
  end if;
  if exists (
    select 1 from company_sectors other
      join public.v_sector_closure cl on cl.descendant_id = other.sector_id
     where other.company_id = new.company_id
       and cl.ancestor_id = new.sector_id
       and cl.depth > 0) then
    raise notice 'company_sectors: sector % is implied by a more specific sector % already holds - not stored, it is derived.', new.sector_id, new.company_id;
    return null;
  end if;
  return new;
end $$;

create or replace function public.company_sectors_prune_implied() returns trigger
language plpgsql as $$
begin
  delete from company_sectors cs
   using public.v_sector_closure cl
   where cs.company_id = new.company_id
     and cl.ancestor_id = cs.sector_id
     and cl.descendant_id = new.sector_id
     and cl.depth > 0
     and coalesce(array_length(cs.source_urls, 1), 0) = 0
     and not exists (select 1 from company_sector_products csp
                      where csp.company_id = cs.company_id and csp.sector_id = cs.sector_id);
  return null;
end $$;

drop trigger if exists company_sectors_no_implied_parent on company_sectors;
create trigger company_sectors_no_implied_parent
  before insert on company_sectors
  for each row execute function public.company_sectors_skip_derivable();

drop trigger if exists company_sectors_prune_implied_parents on company_sectors;
create trigger company_sectors_prune_implied_parents
  after insert on company_sectors
  for each row execute function public.company_sectors_prune_implied();
