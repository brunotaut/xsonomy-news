-- UAV360 Maturity Classification + evidence of real-world use
--
-- APPLIED 2026-10-22. Reasoning: docs/DATA-MODEL.md.
-- Kept here as the record of what was run. Re-running it is safe.
--
-- It adds columns and one table. It changes existing data in exactly one place:
-- stage 5 rewrites the 225 products.use_class values to the new vocabulary. The
-- production-status backfill is NOT here — it is a script, scripts/migrate-status.mjs,
-- because 408 free-text values need normalising rather than a SQL mapping.
--
-- This covers stages 2-4 of DATA-MODEL.md §6. Stage 1 — giving ~2,000 companies a
-- primary category and a technology tag — needs no schema change and matters more.

begin;

-- ---------------------------------------------------------------------------
-- Stage 2 — the two classification columns the model was missing
-- ---------------------------------------------------------------------------

alter table public.companies
  add column if not exists offering_type text,
  add column if not exists use_class     text;

comment on column public.companies.offering_type is
  'What the company actually sells: hardware, software, both, or services only.';
comment on column public.companies.use_class is
  'Which side of the problem it works on: uav, cuas, or dual (both).';

-- ---------------------------------------------------------------------------
-- Stage 3 — evidence of real-world use
--
-- Customers, contracts, deployments, partnerships and funding are all the same
-- shape: a dated claim about a counterparty, backed by a source. One row each,
-- rather than four free-text columns that nobody can count or check.
-- ---------------------------------------------------------------------------

create table if not exists public.company_evidence (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  -- set when the evidence concerns one specific product rather than the company
  product_id           uuid references public.products(id) on delete set null,

  kind                 text not null,
  -- Who: the customer, partner, investor or operating unit. Free text on purpose —
  -- most counterparties (armed forces, ministries, foreign primes) are not rows in
  -- `companies` and never will be.
  counterparty         text,
  counterparty_country text,
  summary              text,

  -- whichever is known; a year on its own is common in reporting
  occurred_on          date,
  occurred_year        smallint,

  value_amount         numeric,
  value_currency       char(3),

  -- A claim with no source is not evidence, so this is NOT NULL.
  source_url           text not null,
  source_title         text,
  confidence           text not null default 'medium',

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists company_evidence_company_idx on public.company_evidence (company_id);
create index if not exists company_evidence_product_idx on public.company_evidence (product_id)
  where product_id is not null;
create index if not exists company_evidence_kind_idx    on public.company_evidence (kind);

-- same source + same counterparty + same kind = the same fact, so ingest can upsert
create unique index if not exists company_evidence_unique_idx
  on public.company_evidence (company_id, kind, source_url, coalesce(counterparty, ''));

comment on table public.company_evidence is
  'Dated, sourced claims that somebody bought, used, funded or partnered on this. '
  'Feeds the UAV360 maturity classification — see docs/DATA-MODEL.md.';

-- ---------------------------------------------------------------------------
-- Stage 4 — UAV360 Maturity Classification
--
-- Five levels, ordered by the strength of real-world evidence. NOT a ladder:
-- `deployed` does not require `commercial` first — a munition used in combat but
-- never offered for sale is deployed and was never commercial.
--
--   emerging      announced / prototype / startup; vendor-only evidence
--   demonstrated  public demo, trial or exercise, witnessed by a third party
--   commercial    can be bought — price, ordering information, distributor
--   deployed      confirmed operational use by a NAMED user, not a trial
--   scaled        multiple customers / contracts / production / deployments
--
-- This is our reading of the evidence, not an objective fact, so every value has
-- to carry its rationale, its sources and the date it was judged.
-- ---------------------------------------------------------------------------

create or replace function public.uav360_maturity_rank(m text)
returns smallint language sql immutable as $$
  select case m
    when 'emerging'     then 1
    when 'demonstrated' then 2
    when 'commercial'   then 3
    when 'deployed'     then 4
    when 'scaled'       then 5
  end::smallint;
$$;

comment on function public.uav360_maturity_rank(text) is
  'Sort order for the UAV360 maturity levels. Higher = stronger evidence of real-world use.';

-- Products carry the primary judgement: the evidence is about a specific system.
alter table public.products
  add column if not exists maturity             text,
  add column if not exists maturity_rationale   text,
  add column if not exists maturity_source_urls text[] not null default '{}',
  add column if not exists maturity_assessed_at timestamptz,
  add column if not exists maturity_assessed_by text,
  add column if not exists maturity_confidence  text;

-- Companies carry the summary. `maturity_is_override` separates a hand-set value
-- from one rolled up off the products, so a later roll-up never silently
-- overwrites an editor's decision.
alter table public.companies
  add column if not exists maturity             text,
  add column if not exists maturity_rationale   text,
  add column if not exists maturity_source_urls text[] not null default '{}',
  add column if not exists maturity_assessed_at timestamptz,
  add column if not exists maturity_assessed_by text,
  add column if not exists maturity_confidence  text,
  add column if not exists maturity_is_override boolean not null default false;

-- Constraints, added only when absent so the file can be re-run. The vocabularies
-- match the existing house style on companies (text + CHECK, not enum types).
do $outer$
declare
  t    text;
  spec text;
begin
  foreach t in array array['companies','products'] loop
    foreach spec in array array[
      'maturity_check|maturity = any (array[''emerging'',''demonstrated'',''commercial'',''deployed'',''scaled''])',
      'maturity_assessed_by_check|maturity_assessed_by = any (array[''editor'',''llm'',''import''])',
      'maturity_confidence_check|maturity_confidence = any (array[''low'',''medium'',''high''])',
      -- The rule that stops this decaying into guesswork: a maturity value must
      -- name at least one source and the date somebody judged it.
      'maturity_needs_evidence|maturity is null or (coalesce(array_length(maturity_source_urls, 1), 0) >= 1 and maturity_assessed_at is not null)'
    ] loop
      if not exists (
        select 1 from pg_constraint
         where conrelid = format('public.%I', t)::regclass
           and conname  = t || '_' || split_part(spec, '|', 1)
      ) then
        execute format('alter table public.%I add constraint %I check (%s)',
                       t, t || '_' || split_part(spec, '|', 1), split_part(spec, '|', 2));
      end if;
    end loop;
  end loop;
end $outer$;

-- Same vocabulary guards for stage 2's columns and the evidence table.
-- Each entry is table|constraint|expression.
do $outer$
declare spec text;
begin
  foreach spec in array array[
    'companies|companies_offering_type_check|offering_type = any (array[''hardware'',''software'',''both'',''services''])',
    'companies|companies_use_class_check|use_class = any (array[''uav'',''cuas'',''dual''])',
    'company_evidence|company_evidence_kind_check|kind = any (array[''customer'',''contract'',''deployment'',''partnership'',''funding'',''demonstration'',''production''])',
    'company_evidence|company_evidence_confidence_check|confidence = any (array[''low'',''medium'',''high''])'
  ] loop
    if not exists (
      select 1 from pg_constraint
       where conrelid = format('public.%I', split_part(spec, '|', 1))::regclass
         and conname  = split_part(spec, '|', 2)
    ) then
      execute format('alter table public.%I add constraint %I check (%s)',
                     split_part(spec, '|', 1), split_part(spec, '|', 2), split_part(spec, '|', 3));
    end if;
  end loop;
end $outer$;

-- ---------------------------------------------------------------------------
-- Stage 5 — redefined vocabularies on products
--
-- (a) use_class becomes uav / cuas / dual. The old values were Civil / C-UAS /
--     Dual-use on 225 rows, every one of them a Sensor. C-UAS and Dual-use map
--     straight across; the 41 Civil rows are agricultural satellites, industrial
--     LiDAR and crop analytics — neither UAV nor counter-UAS — so they go to NULL
--     for reclassification rather than being forced into a wrong bucket.
--
-- (b) status gains the vocabulary the site actually filters on. The existing
--     constraint allowed in_production / prototype / retired / concept / unknown,
--     which does not match the catalogue's Status filter; the column is empty on
--     all 3,385 rows, so nothing is lost by replacing it. `retired` disappears —
--     retired-from-service folds into `discontinued`, as the catalogue already does.
--
-- (c) status_detail keeps the original free text, which carries detail the
--     vocabulary cannot ("Cancelled (program ended 2018)", "Superseded by Orlan-3M").
-- ---------------------------------------------------------------------------

-- Snapshot first: mapping the 41 Civil rows to NULL throws away which rows they
-- were, and NULL is indistinguishable from the 3,160 that were never classified.
-- Drop this table once they have been reclassified.
create table if not exists public.use_class_migration_2026_10 as
  select id, name, use_class as old_use_class, now() as snapshot_at
    from public.products where use_class is not null;

comment on table public.use_class_migration_2026_10 is
  'One-off snapshot of products.use_class before the 2026-10-22 vocabulary change. '
  'The old Civil rows are the ones to reclassify. Safe to drop once that is done.';

alter table public.products drop constraint if exists products_use_class_check;

update public.products set use_class =
  case use_class
    when 'C-UAS'    then 'cuas'
    when 'Dual-use' then 'dual'
    else null              -- 'Civil' and anything unexpected
  end
where use_class is not null;

alter table public.products
  add constraint products_use_class_check
    check (use_class = any (array['uav','cuas','dual']));

alter table public.products drop constraint if exists products_status_check;

alter table public.products
  add column if not exists status_detail text,
  add constraint products_status_check
    check (status = any (array[
      'in_production','discontinued','prototype','development','cancelled','unknown']));

comment on column public.products.status is
  'Is it still being made? Normalised from the free text now in status_detail. '
  'Not the same question as maturity, which is whether anyone uses it.';
comment on column public.products.status_detail is
  'The original production-status text, kept because it carries detail the vocabulary '
  'cannot — "Cancelled (program ended 2018)", "Superseded by Orlan-3M".';

create index if not exists products_maturity_idx  on public.products  (maturity) where maturity is not null;
create index if not exists companies_maturity_idx on public.companies (maturity) where maturity is not null;

comment on column public.products.maturity is
  'UAV360 Maturity Classification for this product. Our assessment of the evidence, not a vendor claim.';
comment on column public.companies.maturity is
  'UAV360 Maturity Classification for the company. Normally the highest maturity among its '
  'products; maturity_is_override marks the ones an editor judged directly instead.';

-- Suggested company maturity, rolled up from the products, alongside the evidence
-- counts behind it. A suggestion only — nothing writes companies.maturity
-- automatically; an editor reviews this and decides.
create or replace view public.company_maturity_suggested as
  select c.id   as company_id,
         c.name,
         c.maturity as current_maturity,
         c.maturity_is_override,
         (select p.maturity
            from public.products p
           where p.company_id = c.id and p.maturity is not null
           order by public.uav360_maturity_rank(p.maturity) desc
           limit 1)                                               as suggested_maturity,
         (select count(*) from public.products p
           where p.company_id = c.id and p.maturity is not null)  as products_assessed,
         (select count(*) from public.company_evidence e
           where e.company_id = c.id)                             as evidence_rows,
         (select count(distinct e.counterparty) from public.company_evidence e
           where e.company_id = c.id
             and e.kind in ('customer','contract','deployment'))  as distinct_counterparties
    from public.companies c;

comment on view public.company_maturity_suggested is
  'Roll-up of product maturity plus the evidence counts behind it, for review. Writes nothing.';

commit;

-- PostgREST caches the schema, so the catalogue build will not see the new
-- columns until it reloads.
notify pgrst, 'reload schema';
