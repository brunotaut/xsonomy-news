-- xSonomy UAV news feed — Supabase / Postgres schema.
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query → Run).
-- Safe to re-run: every statement is idempotent.
--
-- SYNCED FROM THE LIVE DATABASE on 2026-09-05 (project uobidcahmrmfdmfbrtkt, Postgres 17).
-- Covers all 19 tables, 3 views, 3 functions, 2 triggers, 52 indexes and 15 RLS policies
-- that exist in the `public` schema. Regenerate this file whenever the live DB changes.
--
-- Two limits worth knowing:
--   * `create table if not exists` will NOT add CHECK / UNIQUE constraints to a table that
--     already exists. On a fresh database everything below applies; on an existing one, the
--     constraints listed inline are documentation. Indexes, policies and columns DO re-apply.
--   * Reference rows (sectors, taxonomy_facets, taxonomy_options) are data, not schema, and
--     are not seeded here.

-- ---------------------------------------------------------------------------
-- Extensions. `citext` gives case-insensitive slugs/aliases; `pg_trgm` powers
-- the fuzzy company-name matching in match_company() below. Both live in public.
-- (pgcrypto / uuid-ossp are installed by Supabase in the `extensions` schema;
-- gen_random_uuid() is built into Postgres 13+, so nothing else is needed.)
-- ---------------------------------------------------------------------------
create extension if not exists citext;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Shared trigger helper: stamps updated_at on every UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Table: articles  (one row per de-duplicated news item)
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  url           text not null unique,          -- canonical source URL = dedup key + backlink
  url_hash      text not null,                 -- sha256(url), for fast lookups
  title         text not null,
  summary       text,                          -- short, plain-text (1-3 sentences)
  image_url     text,                          -- the SOURCE's image URL (hotlinked, not stored)
  source        text not null,                 -- outlet name, e.g. "DroneLife"
  source_id     int,                           -- id from sources.json
  source_url    text,                          -- outlet homepage
  country       text,
  lang          text,
  tags          text[] not null default '{}',  -- e.g. {counter-uas, eu-regulatory, ukraine}
  companies     text[] not null default '{}',  -- orgs/manufacturers mentioned, e.g. {Anduril, DJI}
  products      text[] not null default '{}',  -- systems/products mentioned, e.g. {MQ-28 Ghost Bat}
  published_at  timestamptz,                   -- from the feed
  scraped_at    timestamptz not null default now(),
  analyzed_at   timestamptz                    -- when the LLM entity pass last ran (null = pending)
);

-- Back-fill the new columns onto pre-existing tables (idempotent).
alter table public.articles add column if not exists companies   text[] not null default '{}';
alter table public.articles add column if not exists products    text[] not null default '{}';
alter table public.articles add column if not exists analyzed_at  timestamptz;

-- ---------------------------------------------------------------------------
-- Indexes — feed is queried by recency, by tag, and by full-text search.
-- ---------------------------------------------------------------------------
create index if not exists articles_published_idx on public.articles (published_at desc);
create index if not exists articles_source_idx    on public.articles (source);
create index if not exists articles_tags_idx      on public.articles using gin (tags);
create index if not exists articles_companies_idx on public.articles using gin (companies);
create index if not exists articles_products_idx  on public.articles using gin (products);
create index if not exists articles_analyzed_idx  on public.articles (analyzed_at);

-- Full-text search over title + summary (used by the client search box).
alter table public.articles
  add column if not exists fts tsvector
  generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,''))
  ) stored;
create index if not exists articles_fts_idx on public.articles using gin (fts);

-- ---------------------------------------------------------------------------
-- Row Level Security: the public site reads with the ANON key (read-only).
-- Writes happen only from GitHub Actions using the SERVICE ROLE key,
-- which bypasses RLS — so we expose SELECT to anon, nothing else.
-- ---------------------------------------------------------------------------
alter table public.articles enable row level security;

drop policy if exists "public read" on public.articles;
create policy "public read"
  on public.articles
  for select
  to anon
  using (true);

-- ---------------------------------------------------------------------------
-- Optional helper: a view exposing only the public columns, ordered newest first.
-- The client can hit /rest/v1/articles directly; this is just a convenience.
-- ---------------------------------------------------------------------------
create or replace view public.feed as
  select id, url, title, summary, image_url, source, source_url,
         country, lang, tags, published_at
  from public.articles
  order by published_at desc nulls last;

-- ===========================================================================
-- ENTITY REGISTRY — companies, products and the taxonomies around them.
-- Written by resolve-entities.mjs and the enrichment scripts. These tables
-- existed in the live DB long before they were recorded here; this section was
-- reverse-engineered from the live schema on 2026-09-05.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Table: sectors  (self-nesting classification shared by companies + products)
-- ---------------------------------------------------------------------------
create table if not exists public.sectors (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  name        text not null,
  parent_id   uuid references public.sectors(id) on delete set null,
  kind        text not null default 'domain'
              check (kind in ('domain','capability','platform')),
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: companies  (the registry; one row per resolved organisation)
-- publication_status is the human gate: draft → review → live.
-- enrichment_status records who filled the profile in (llm / wikidata / curated).
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id                  uuid primary key default gen_random_uuid(),
  slug                citext not null unique,
  name                text not null,
  legal_name          text,
  description         text,
  overview            text,
  history             text,
  logo_url            text,
  company_type        text check (company_type in ('prime','tier1','tier2','sme','startup',
                        'state_owned','research_institute','university','jv','division',
                        'distributor','other')),
  ownership           text check (ownership in ('private','public','state_owned','subsidiary',
                        'joint_venture','academic','nonprofit','unknown')),
  status              text not null default 'active'
                      check (status in ('active','acquired','defunct','dormant','unknown')),
  founded_year        smallint,
  defunct_year        smallint,
  is_public           boolean not null default false,
  stock_ticker        text,
  stock_exchange      text,
  hq_country          text,
  hq_region           text,
  hq_city             text,
  hq_address          text,
  latitude            double precision,
  longitude           double precision,
  website             text,
  careers_url         text,
  linkedin_url        text,
  twitter_url         text,
  wikipedia_url       text,
  crunchbase_url      text,
  employee_count      integer,
  employee_range      text check (employee_range in ('1-10','11-50','51-200','201-500',
                        '501-1000','1001-5000','5001-10000','10000+')),
  revenue_amount      numeric,
  revenue_currency    char(3),
  revenue_year        smallint,
  revenue_is_estimate boolean default true,
  total_funding       numeric,
  funding_currency    char(3),
  valuation           numeric,
  valuation_currency  char(3),
  nato_cage_code      text,
  export_regime       text[] not null default '{}',
  combat_proven       boolean,
  is_sanctioned       boolean not null default false,
  sanctions_lists     text[] not null default '{}',
  risk_flags          text[] not null default '{}',
  publication_status  text not null default 'draft'
                      check (publication_status in ('draft','review','live')),
  enrichment_status   text,
  confidence          text check (confidence in ('low','medium','high')),
  source_urls         text[] not null default '{}',
  last_reviewed_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Back-fill onto a pre-existing companies table (idempotent).
alter table public.companies add column if not exists legal_name          text;
alter table public.companies add column if not exists description         text;
alter table public.companies add column if not exists overview            text;
alter table public.companies add column if not exists history             text;
alter table public.companies add column if not exists logo_url            text;
alter table public.companies add column if not exists company_type        text;
alter table public.companies add column if not exists ownership           text;
alter table public.companies add column if not exists status              text not null default 'active';
alter table public.companies add column if not exists founded_year        smallint;
alter table public.companies add column if not exists defunct_year        smallint;
alter table public.companies add column if not exists is_public           boolean not null default false;
alter table public.companies add column if not exists stock_ticker        text;
alter table public.companies add column if not exists stock_exchange      text;
alter table public.companies add column if not exists hq_country          text;
alter table public.companies add column if not exists hq_region           text;
alter table public.companies add column if not exists hq_city             text;
alter table public.companies add column if not exists hq_address          text;
alter table public.companies add column if not exists latitude            double precision;
alter table public.companies add column if not exists longitude           double precision;
alter table public.companies add column if not exists website             text;
alter table public.companies add column if not exists careers_url         text;
alter table public.companies add column if not exists linkedin_url        text;
alter table public.companies add column if not exists twitter_url         text;
alter table public.companies add column if not exists wikipedia_url       text;
alter table public.companies add column if not exists crunchbase_url      text;
alter table public.companies add column if not exists employee_count      integer;
alter table public.companies add column if not exists employee_range      text;
alter table public.companies add column if not exists revenue_amount      numeric;
alter table public.companies add column if not exists revenue_currency    char(3);
alter table public.companies add column if not exists revenue_year        smallint;
alter table public.companies add column if not exists revenue_is_estimate boolean default true;
alter table public.companies add column if not exists total_funding       numeric;
alter table public.companies add column if not exists funding_currency    char(3);
alter table public.companies add column if not exists valuation           numeric;
alter table public.companies add column if not exists valuation_currency  char(3);
alter table public.companies add column if not exists nato_cage_code      text;
alter table public.companies add column if not exists export_regime       text[] not null default '{}';
alter table public.companies add column if not exists combat_proven       boolean;
alter table public.companies add column if not exists is_sanctioned       boolean not null default false;
alter table public.companies add column if not exists sanctions_lists     text[] not null default '{}';
alter table public.companies add column if not exists risk_flags          text[] not null default '{}';
alter table public.companies add column if not exists publication_status  text not null default 'draft';
alter table public.companies add column if not exists enrichment_status   text;
alter table public.companies add column if not exists confidence          text;
alter table public.companies add column if not exists source_urls         text[] not null default '{}';
alter table public.companies add column if not exists last_reviewed_at    timestamptz;
alter table public.companies add column if not exists created_at          timestamptz not null default now();
alter table public.companies add column if not exists updated_at          timestamptz not null default now();

create index if not exists companies_hq_country on public.companies (hq_country);
create index if not exists companies_pubstatus  on public.companies (publication_status);
create index if not exists companies_name_trgm  on public.companies using gin (name gin_trgm_ops);

drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated
  before update on public.companies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: company_aliases  (alternate names the resolver matches against)
-- ---------------------------------------------------------------------------
create table if not exists public.company_aliases (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  alias      citext not null,
  type       text not null default 'aka'
             check (type in ('aka','former_name','native_name','abbreviation','ticker','brand')),
  unique (company_id, alias)
);

create index if not exists company_aliases_alias_trgm
  on public.company_aliases using gin (alias gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Table: company_locations  (sites beyond the HQ fields on companies)
-- ---------------------------------------------------------------------------
create table if not exists public.company_locations (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type       text not null default 'office'
             check (type in ('hq','office','factory','rnd','test_site')),
  country    text,
  city       text,
  address    text,
  latitude   double precision,
  longitude  double precision
);

-- ---------------------------------------------------------------------------
-- Table: company_relationships  (directed edges: who owns / partners with whom)
-- ---------------------------------------------------------------------------
create table if not exists public.company_relationships (
  id                uuid primary key default gen_random_uuid(),
  source_company_id uuid not null references public.companies(id) on delete cascade,
  target_company_id uuid not null references public.companies(id) on delete cascade,
  type              text not null
                    check (type in ('subsidiary_of','division_of','acquired_by','merged_with',
                      'jv_partner','investor_in','partner','competitor','supplier_to','spun_out_of')),
  started_year      smallint,
  ended_year        smallint,
  note              text,
  created_at        timestamptz not null default now(),
  check (source_company_id <> target_company_id),
  unique (source_company_id, target_company_id, type)
);

create index if not exists company_rel_source on public.company_relationships (source_company_id);
create index if not exists company_rel_target on public.company_relationships (target_company_id);

-- ---------------------------------------------------------------------------
-- Junction: company_sectors
-- ---------------------------------------------------------------------------
create table if not exists public.company_sectors (
  company_id uuid not null references public.companies(id) on delete cascade,
  sector_id  uuid not null references public.sectors(id)   on delete cascade,
  is_primary boolean not null default false,
  primary key (company_id, sector_id)
);

-- ---------------------------------------------------------------------------
-- Table: products  (systems/platforms; specs is free-form JSONB)
-- company_id is the headline maker; product_companies holds the full cast.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  slug               citext not null unique,
  company_id         uuid references public.companies(id) on delete set null,
  name               text not null,
  category           text not null
                     check (category in ('UAV','Sensor','Counter-UAS','Effector','Software','Other')),
  subcategory        text,
  use_class          text check (use_class in ('Civil','Dual-use','C-UAS')),
  country            text,
  summary            text,
  description        text,
  image_url          text,
  website            text,
  price              text,
  status             text check (status in ('in_production','prototype','retired','concept','unknown')),
  specs              jsonb not null default '{}'::jsonb,
  publication_status text not null default 'draft'
                     check (publication_status in ('draft','review','live')),
  enrichment_status  text,
  confidence         text check (confidence in ('low','medium','high')),
  source_urls        text[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Back-fill onto a pre-existing products table (idempotent).
alter table public.products add column if not exists company_id         uuid;
alter table public.products add column if not exists subcategory        text;
alter table public.products add column if not exists use_class          text;
alter table public.products add column if not exists country            text;
alter table public.products add column if not exists summary            text;
alter table public.products add column if not exists description        text;
alter table public.products add column if not exists image_url          text;
alter table public.products add column if not exists website            text;
alter table public.products add column if not exists price              text;
alter table public.products add column if not exists status             text;
alter table public.products add column if not exists specs              jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists publication_status text not null default 'draft';
alter table public.products add column if not exists enrichment_status  text;
alter table public.products add column if not exists confidence         text;
alter table public.products add column if not exists source_urls        text[] not null default '{}';
alter table public.products add column if not exists created_at         timestamptz not null default now();
alter table public.products add column if not exists updated_at         timestamptz not null default now();

create index if not exists products_category   on public.products (category);
create index if not exists products_company    on public.products (company_id);
create index if not exists products_name_trgm  on public.products using gin (name gin_trgm_ops);
create index if not exists products_specs_gin  on public.products using gin (specs);

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Junctions: product_companies (role-qualified) and product_sectors
-- ---------------------------------------------------------------------------
create table if not exists public.product_companies (
  product_id uuid not null references public.products(id)  on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role       text not null default 'manufacturer'
             check (role in ('manufacturer','integrator','partner','investor','operator')),
  primary key (product_id, company_id, role)
);

create table if not exists public.product_sectors (
  product_id uuid not null references public.products(id) on delete cascade,
  sector_id  uuid not null references public.sectors(id)  on delete cascade,
  primary key (product_id, sector_id)
);

-- ---------------------------------------------------------------------------
-- Faceted product taxonomy: facets (e.g. "propulsion") hold options (e.g.
-- "electric"), and product_taxonomy attaches options to products with a
-- provenance marker. Separate from `sectors`, which is a single hierarchy.
-- ---------------------------------------------------------------------------
create table if not exists public.taxonomy_facets (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.taxonomy_options (
  id          uuid primary key default gen_random_uuid(),
  facet_id    uuid not null references public.taxonomy_facets(id) on delete cascade,
  slug        citext not null,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (facet_id, slug)
);

create index if not exists taxonomy_options_facet_idx on public.taxonomy_options (facet_id);

create table if not exists public.product_taxonomy (
  product_id uuid not null references public.products(id)         on delete cascade,
  option_id  uuid not null references public.taxonomy_options(id) on delete cascade,
  source     text not null default 'rule',    -- 'rule' | 'llm' | 'curated'
  confidence text not null default 'medium',
  note       text,
  created_at timestamptz not null default now(),
  primary key (product_id, option_id)
);

create index if not exists product_taxonomy_option_idx on public.product_taxonomy (option_id);

-- ---------------------------------------------------------------------------
-- Junctions: articles ↔ resolved entities. Written by resolve-entities.mjs.
-- ---------------------------------------------------------------------------
create table if not exists public.article_companies (
  article_id   uuid not null references public.articles(id)  on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  confidence   real,
  mention_type text not null default 'mentioned'
               check (mention_type in ('primary','mentioned')),
  primary key (article_id, company_id)
);

create index if not exists article_companies_company on public.article_companies (company_id);

create table if not exists public.article_products (
  article_id   uuid not null references public.articles(id)  on delete cascade,
  product_id   uuid not null references public.products(id)  on delete cascade,
  confidence   real,
  mention_type text not null default 'mentioned'
               check (mention_type in ('primary','mentioned')),
  primary key (article_id, product_id)
);

create index if not exists article_products_product on public.article_products (product_id);

-- ---------------------------------------------------------------------------
-- Entity resolution (resolve-entities.mjs): per-tag decision cache + per-
-- article progress stamp. Applied to the live DB as migration
-- 'entity_resolution' (2026-07-02); kept here for reference/idempotent re-runs.
-- ---------------------------------------------------------------------------
create table if not exists public.tag_resolutions (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('company','product')),
  tag         citext not null,
  decision    text not null check (decision in ('matched','created','rejected')),
  entity_id   uuid,               -- companies.id or products.id (null when rejected)
  reason      text,               -- 'exact' | 'alias' | 'normalized' | 'fuzzy:0.93' | 'llm' | 'blocklist' | …
  created_at  timestamptz not null default now(),
  unique (kind, tag)
);

alter table public.articles add column if not exists entities_resolved_at timestamptz;

create index if not exists articles_entities_unresolved_idx
  on public.articles (published_at desc)
  where entities_resolved_at is null and analyzed_at is not null;

-- ---------------------------------------------------------------------------
-- Side catalogues (resolve-entities.mjs): investment funds and government/
-- quasi-government bodies mentioned in the news, kept out of the companies
-- registry. Applied to the live DB as migration 'investors_institutions'
-- (2026-07-02); kept here for reference.
-- ---------------------------------------------------------------------------
create table if not exists public.investors (
  id            uuid primary key default gen_random_uuid(),
  slug          citext unique not null,
  name          text not null,
  investor_type text,                -- vc / pe / corporate / impact / angel …
  hq_country    text,
  website       text,
  source_urls   text[] not null default '{}',
  created_at    timestamptz not null default now()
);

create table if not exists public.institutions (
  id               uuid primary key default gen_random_uuid(),
  slug             citext unique not null,
  name             text not null,
  institution_type text,             -- government_research / ansp / intergovernmental / think_tank / test_centre / association / foundation …
  hq_country       text,
  website          text,
  source_urls      text[] not null default '{}',
  created_at       timestamptz not null default now()
);

alter table public.investors    enable row level security;
alter table public.institutions enable row level security;
drop policy if exists "public read" on public.investors;
create policy "public read" on public.investors    for select to anon using (true);
drop policy if exists "public read" on public.institutions;
create policy "public read" on public.institutions for select to anon using (true);

-- ---------------------------------------------------------------------------
-- Table: subscribers  (website sign-ups; digest.mjs merges these on top of
-- recipients.json). Anon may INSERT (the sign-up form) but never SELECT.
-- ---------------------------------------------------------------------------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      citext not null unique,
  source     text default 'news',
  confirmed  boolean not null default false,
  created_at timestamptz not null default now(),
  -- Which digests this person wants. Defaulting to true means anyone who
  -- subscribed before the choice existed keeps receiving what they signed up for.
  daily      boolean not null default true,
  weekly     boolean not null default true,
  monthly    boolean not null default true
);

-- Applied to the live DB as migration 'subscriber_frequency_preferences'.
alter table public.subscribers add column if not exists daily   boolean not null default true;
alter table public.subscribers add column if not exists weekly  boolean not null default true;
alter table public.subscribers add column if not exists monthly boolean not null default true;

-- Self-service unsubscribe token (migration 'unsubscribe_token', 2026-10-12).
alter table public.subscribers add column if not exists unsub_token uuid not null default gen_random_uuid();
create unique index if not exists subscribers_unsub_token_idx on public.subscribers (unsub_token);

-- Switches every digest off for the holder of a token. SECURITY DEFINER so the
-- public site can call it without anon holding any UPDATE on the table.
create or replace function public.unsubscribe(token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare matched int;
begin
  update public.subscribers
     set daily = false, weekly = false, monthly = false
   where unsub_token = token;
  get diagnostics matched = row_count;
  return matched > 0;
end $$;
revoke all on function public.unsubscribe(uuid) from public;
grant execute on function public.unsubscribe(uuid) to anon, authenticated;

-- digest.mjs reads by period, so index the flag it filters on.
create index if not exists subscribers_daily_idx   on public.subscribers (daily)   where daily;
create index if not exists subscribers_weekly_idx  on public.subscribers (weekly)  where weekly;
create index if not exists subscribers_monthly_idx on public.subscribers (monthly) where monthly;

-- ---------------------------------------------------------------------------
-- match_company(tag) — the resolver's matching ladder, in SQL. Tries, in order:
--   1. exact name or alias hit
--   2. unique "tag is a prefix of one company name" hit
--   3. unique "company name + a generic suffix (Industries, Group, …)" hit
--   4. trigram similarity >= 0.55 against names and aliases
-- Returns at most one row. Used by the unresolved_company_tags view.
-- ---------------------------------------------------------------------------
create or replace function public.match_company(p_tag text)
returns table(cid uuid, score real)
language sql
stable
as $$
  with t as (select lower(btrim(p_tag)) as tag)
  select m.cid, m.score from (
    select c.id as cid, 1.0::real as score, 1 as pr from companies c, t where lower(c.name)=t.tag
    union all
    select a.company_id, 1.0::real, 1 from company_aliases a, t where lower(a.alias)=t.tag
    union all
    select c.id, 0.9::real, 2 from companies c, t
      where lower(c.name) like t.tag||' %'
        and (select count(*) from companies c2 where lower(c2.name) like t.tag||' %')=1
    union all
    select c.id, 0.85::real, 3 from companies c, t
      where t.tag like lower(c.name)||' %'
        and btrim(substr(t.tag, length(lower(c.name))+2)) in
            ('industries','group','systems','technologies','defense','defence','aerospace',
             'corporation','holdings','aviation','company','robotics','defense systems')
        and (select count(*) from companies c3 where t.tag like lower(c3.name)||' %'
              and btrim(substr(t.tag, length(lower(c3.name))+2)) in
              ('industries','group','systems','technologies','defense','defence','aerospace',
               'corporation','holdings','aviation','company','robotics','defense systems'))=1
    union all
    select f.cid, f.score, 4 from (
      select c.id as cid, similarity(lower(c.name), t.tag) as score from companies c, t
        where similarity(lower(c.name), t.tag) >= 0.55
      union all
      select a.company_id, similarity(lower(a.alias), t.tag) from company_aliases a, t
        where similarity(lower(a.alias), t.tag) >= 0.55
    ) f
  ) m order by m.pr, m.score desc limit 1
$$;

-- ---------------------------------------------------------------------------
-- Views. NOTE: these are plain (security-definer) views — they run as the view
-- owner and therefore BYPASS the row-level security on the tables underneath.
-- Anything a view exposes is readable by the anon key regardless of RLS.
-- ---------------------------------------------------------------------------

-- Flattens the faceted taxonomy into one row per product/facet/option.
create or replace view public.product_taxonomy_view as
  select pt.product_id,
         p.slug  as product_slug,
         p.name  as product_name,
         f.slug  as facet,
         f.name  as facet_name,
         o.slug  as option,
         o.name  as option_name,
         pt.source,
         pt.confidence,
         pt.note
  from public.product_taxonomy pt
    join public.products p          on p.id = pt.product_id
    join public.taxonomy_options o  on o.id = pt.option_id
    join public.taxonomy_facets f   on f.id = o.facet_id;

-- Company name strings the LLM extracted that match no company yet — the
-- worklist for improving aliases and the resolver.
create or replace view public.unresolved_company_tags as
  select btrim(g.t) as tag,
         count(*)   as mentions
  from public.articles a,
       lateral unnest(a.companies) g(t)
  where btrim(g.t) <> ''
    and not exists (select 1 from public.match_company(btrim(g.t)))
  group by btrim(g.t)
  order by count(*) desc, btrim(g.t);

-- ---------------------------------------------------------------------------
-- Row Level Security for the entity registry.
--
-- Pattern: anon + authenticated get SELECT only. `companies` and `products` are
-- additionally gated on publication_status = 'live', so draft rows are invisible
-- to the browser regardless of what the catalogue build asks for. The service
-- role key used by GitHub Actions bypasses all of this.
--
-- tag_resolutions, product_taxonomy, taxonomy_facets and taxonomy_options have
-- RLS ENABLED WITH NO POLICY — i.e. no direct anon access at all. The taxonomy
-- reaches the browser only through product_taxonomy_view above.
-- ---------------------------------------------------------------------------
alter table public.sectors               enable row level security;
alter table public.companies             enable row level security;
alter table public.company_aliases       enable row level security;
alter table public.company_locations     enable row level security;
alter table public.company_relationships enable row level security;
alter table public.company_sectors       enable row level security;
alter table public.products              enable row level security;
alter table public.product_companies     enable row level security;
alter table public.product_sectors       enable row level security;
alter table public.article_companies     enable row level security;
alter table public.article_products      enable row level security;
alter table public.subscribers           enable row level security;
alter table public.tag_resolutions       enable row level security;
alter table public.product_taxonomy      enable row level security;
alter table public.taxonomy_facets       enable row level security;
alter table public.taxonomy_options      enable row level security;

drop policy if exists public_read on public.sectors;
create policy public_read on public.sectors
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.company_aliases;
create policy public_read on public.company_aliases
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.company_locations;
create policy public_read on public.company_locations
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.company_relationships;
create policy public_read on public.company_relationships
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.company_sectors;
create policy public_read on public.company_sectors
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.product_companies;
create policy public_read on public.product_companies
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.product_sectors;
create policy public_read on public.product_sectors
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.article_companies;
create policy public_read on public.article_companies
  for select to anon, authenticated using (true);

drop policy if exists public_read on public.article_products;
create policy public_read on public.article_products
  for select to anon, authenticated using (true);

drop policy if exists public_read_live on public.companies;
create policy public_read_live on public.companies
  for select to anon, authenticated using (publication_status = 'live');

drop policy if exists public_read_live on public.products;
create policy public_read_live on public.products
  for select to anon, authenticated using (publication_status = 'live');

-- The sign-up form posts with the anon key: INSERT only, no read-back.
drop policy if exists subscribers_anon_insert on public.subscribers;
create policy subscribers_anon_insert on public.subscribers
  for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------------------
-- Not reproduced here: the `rls_auto_enable` event trigger in public. Supabase
-- installs and owns it (it force-enables RLS on any newly created public table);
-- recreating it needs superuser, so leave it to the platform.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Investor relationship retirement and fund positions
-- Applied to the live DB as migrations 'investor_relationship_retirement_and_fund_positions'
-- and 'investor_landscape_projection_with_fund_positions_v2' on 2026-11-01.
--
-- The whole investor research schema is now mirrored below, under "Investor research
-- staging schema", generated from the live database on 2026-11-01. That gap is closed.
-- ---------------------------------------------------------------------------

-- A relationship whose cited source turns out not to support the specific investor and
-- company stops being a public holding, but its history is part of the audit trail.
alter table if exists public.investor_companies
  add column if not exists retired_at date,
  add column if not exists retired_reason text;

do $$ begin
  if to_regclass('public.investor_companies') is not null then
    alter table public.investor_companies drop constraint if exists investor_companies_retired_reason;
    alter table public.investor_companies add constraint investor_companies_retired_reason
      check ((retired_at is null) = (retired_reason is null));
  end if;
end $$;

-- Capital committed by one investor to another manager's fund. Never a portfolio holding:
-- the fund's own investments are not this investor's companies, and storing them in
-- investor_companies would present indirect exposure as a direct cheque.
create table if not exists public.investor_fund_positions (
  id uuid primary key default gen_random_uuid(),
  investor_research_id uuid not null references public.investor_research(id) on delete cascade,
  target_investor_research_id uuid references public.investor_research(id) on delete set null,
  target_vehicle_id uuid references public.investor_research_vehicles(id) on delete set null,
  target_name_as_published text not null,
  position_type text not null check (position_type in
    ('limited_partner','fund_of_funds_commitment','anchor_investor','undisclosed')),
  commitment_amount numeric,
  commitment_currency char(3),
  bound text check (bound in ('exact','approximate','minimum','maximum')),
  announced_at date,
  as_of_text text,
  evidence_status text not null check (evidence_status in
    ('investor_announcement','investor_published_portfolio','third_party_reported',
     'research_record','unverified')),
  source_url text,
  reviewed_at date,
  note_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investor_research_id, target_name_as_published, position_type),
  constraint investor_fund_positions_currency
    check ((commitment_amount is null) = (commitment_currency is null)),
  constraint investor_fund_positions_not_self
    check (target_investor_research_id is null
           or target_investor_research_id <> investor_research_id)
);

-- Deny by default, like every other base table here: the build reads the view, which
-- bypasses RLS, and no browser ever reads this table directly.
alter table if exists public.investor_fund_positions enable row level security;

create index if not exists investor_fund_positions_investor_idx
  on public.investor_fund_positions (investor_research_id);
create index if not exists investor_fund_positions_target_idx
  on public.investor_fund_positions (target_investor_research_id);

-- ---------------------------------------------------------------------------
-- slug_redirects.from_section  (migration slug_redirects_from_section, 2026-11-01)
--
-- A product's public url is /<section>/<slug>/, where the section comes from
-- products.category and the slug from the product name. Correcting a category
-- therefore moves the url even though the slug does not change. The redirect table
-- could not express that: the catalogue generator wrote every stub into the section
-- of its TARGET, so a same-slug redirect landed on top of the live page it pointed
-- at, and CHECK (from_slug <> to_slug) rejected the row outright.
--
-- from_section records the section the OLD url lived in. NULL keeps the previous
-- behaviour (stub written beside its target), so every pre-existing row is
-- unaffected, and the relaxed not-self CHECK is strictly more permissive.
--
-- NOTE: the slug_redirects table itself is still not mirrored here, nor is most of
-- the companies / products / landscape schema (see STATUS task #1). Only this
-- migration is recorded, idempotently, so it is not lost.
-- ---------------------------------------------------------------------------
alter table if exists public.slug_redirects
  add column if not exists from_section text;

do $$
begin
  if to_regclass('public.slug_redirects') is not null then
    comment on column public.slug_redirects.from_section is
      'Section the old url lived under (uav|cuas|sensors|software|other|companies). Set only when a redirect crosses sections - a product whose category was corrected. NULL means the stub is written beside its target, which is the behaviour for every ordinary merged-slug redirect.';
    alter table public.slug_redirects drop constraint if exists slug_redirects_not_self;
    alter table public.slug_redirects add constraint slug_redirects_not_self
      check (from_slug <> to_slug or from_section is not null);
  end if;
end $$;

-- Make sure PostgREST picks up the new table/columns immediately.
notify pgrst, 'reload schema';

-- ===========================================================================
-- Investor research staging schema
--
-- Generated from the live database on 2026-11-01 and idempotent, closing the gap this
-- file used to record. Eight tables, applied by migration across the 2026-10-30,
-- 10-31 and 11-01 passes. As everywhere else here, column and constraint definitions
-- are inline in `create table`, so on an existing database the `create table if not
-- exists` is a no-op and the `alter table` blocks after it are what re-apply; the
-- CHECK vocabularies are therefore repeated in those blocks rather than only inline.
--
-- The three organisation classes stay separate and are never summed: catalogue
-- `companies`, `investor_research` records, and hub research records. `investors` is the
-- older pipeline table that `resolve-entities.mjs` writes; `investor_research` is the
-- researched directory that the public map publishes, and `investor_research.
-- matched_investor_id` is the only bridge between them.
-- ===========================================================================

create table if not exists public.investor_research (
  id uuid primary key default gen_random_uuid(),
  research_id text not null unique,
  slug citext not null unique,
  name text not null,
  entity_type text,
  -- deal | mandate | adjacent | watchlist | programme. `watchlist` means the DEFENCE
  -- RELEVANCE is unestablished; it says nothing about whether the organisation exists.
  evidence_status text not null check (evidence_status in
    ('deal','mandate','adjacent','watchlist','programme')),
  evidence_basis text,
  priority_for_uav_review text,
  stages text[] not null default '{}',
  focus text[] not null default '{}',
  selected_portfolio text[] not null default '{}',
  investment_geography text[] not null default '{}',
  -- free-text legacy field; typed figures live in investor_financial_metrics
  fund_size text,
  legal_domicile_country text,
  legal_domicile_precision text check (legal_domicile_precision is null
    or legal_domicile_precision in ('country_only','city','exact_entity')),
  legal_domicile_note text,
  research_note text,
  missing_fields text[] not null default '{}',
  verified_as_of date,
  map_ready boolean not null default false,
  publication_status text not null default 'research_staging'
    check (publication_status in ('research_staging','review','approved','rejected')),
  source_dataset text not null,
  source_dataset_version text,
  evidence_status_label text,
  country_association_meaning text,
  -- the bridge to the older `investors` table; see the note above
  matched_investor_id uuid references public.investors(id) on delete set null,
  match_key text,
  map_validation_errors text[] not null default '{}',
  approved_at timestamptz,
  ticket_currency char(3),
  ticket_minimum numeric,
  ticket_maximum numeric,
  ticket_basis text,
  ticket_source_url text,
  ukraine_related boolean not null default false,
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investor_research_vehicles (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investor_research(id) on delete cascade,
  name text not null,
  vehicle_kind text,
  note text,
  created_at timestamptz not null default now(),
  unique (investor_id, name)
);

create table if not exists public.investor_research_locations (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investor_research(id) on delete cascade,
  city text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  -- a published contact city, a meeting venue, an occupied office and a legal
  -- registration are four different things and are never interchangeable
  location_kind text not null check (location_kind in
    ('published_office_or_contact_city','published_meeting_location',
     'operational_office','legal_registration')),
  precision text not null default 'approximate_city_centroid'
    check (precision in ('approximate_city_centroid','street_address','exact')),
  created_at timestamptz not null default now(),
  unique (investor_id, city, country, location_kind)
);

create table if not exists public.investor_companies (
  id uuid primary key default gen_random_uuid(),
  investor_research_id uuid not null references public.investor_research(id) on delete cascade,
  investor_id uuid references public.investors(id) on delete set null,
  company_id uuid not null references public.companies(id) on delete cascade,
  vehicle_id uuid references public.investor_research_vehicles(id) on delete set null,
  relationship_type text not null check (relationship_type in
    ('direct_investment','fund_of_funds','limited_partner','portfolio_listed',
     'accelerator_participant','undisclosed')),
  evidence_status text not null check (evidence_status in
    ('investor_published_portfolio','investor_announcement','third_party_reported',
     'research_record','unverified')),
  source_url text not null,
  reviewed_at date not null,
  investment_date date,
  investment_round text,
  investor_role text check (investor_role is null
    or investor_role in ('lead','co_investor','participant','undisclosed')),
  -- an investor's own cheque and the whole round are separate facts; either may be null
  investor_contribution_amount numeric,
  investor_contribution_currency char(3),
  round_total_amount numeric,
  round_total_currency char(3),
  portfolio_name_as_published text not null,
  match_method text not null check (match_method in
    ('unique_exact_name','alias','legal_name','draft_company','verified_new_record',
     'manual','unresolved')),
  match_note_en text,
  -- retirement: not exported, kept for audit. See retired_kind for the two reasons.
  retired_at date,
  retired_reason text,
  retired_kind text check (retired_kind is null
    or retired_kind in ('unsupported_evidence','holding_ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investor_research_id, company_id, relationship_type),
  constraint investor_companies_contribution_currency
    check ((investor_contribution_amount is null) = (investor_contribution_currency is null)),
  constraint investor_companies_round_currency
    check ((round_total_amount is null) = (round_total_currency is null)),
  -- a contribution cannot exceed the round it was part of, when both are in one currency
  constraint investor_companies_contribution_within_round
    check (investor_contribution_amount is null or round_total_amount is null
           or investor_contribution_currency is distinct from round_total_currency
           or investor_contribution_amount <= round_total_amount),
  constraint investor_companies_retired_reason
    check ((retired_at is null) = (retired_reason is null)),
  constraint investor_companies_retired_kind_with_retirement
    check ((retired_at is null) = (retired_kind is null))
);

create table if not exists public.investor_portfolio_unresolved (
  id uuid primary key default gen_random_uuid(),
  investor_research_id uuid not null references public.investor_research(id) on delete cascade,
  portfolio_name_as_published text not null,
  reason text not null,
  candidate_company_id uuid references public.companies(id) on delete set null,
  source_url text,
  reviewed_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investor_research_id, portfolio_name_as_published)
);

create table if not exists public.investor_financial_metrics (
  id uuid primary key default gen_random_uuid(),
  investor_research_id uuid not null references public.investor_research(id) on delete cascade,
  vehicle_id uuid references public.investor_research_vehicles(id) on delete set null,
  -- WHAT the figure is, not merely how large. The interface reads this, not the prose.
  metric_type text not null check (metric_type in
    ('fund_size_target','fund_size_stated',
     'fund_close_first','fund_close_interim','fund_close_final','fund_close_announced',
     'committed_capital','manager_aum','vehicle_nav',
     'cumulative_capital_invested','grant_funding_disbursed','grant_count',
     'initial_investment_range','follow_on_investment_range','average_investment_size',
     'investment_count','portfolio_company_count')),
  amount_min numeric,
  amount_max numeric,
  currency char(3),
  count_value integer,
  bound text not null default 'exact'
    check (bound in ('exact','approximate','minimum','maximum','range')),
  scope_en text not null,
  -- as_of for a real date; as_of_text when the source gives only a year or month, so a
  -- year is never invented into a date
  as_of date,
  as_of_text text,
  source_url text not null,
  verification_status text not null
    check (verification_status in ('source_confirmed','reported','unverified')),
  checked_at date not null,
  -- a newer figure becomes a new row; the old one stays with is_current false
  is_current boolean not null default true,
  display_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investor_research_id, metric_type, scope_en, source_url),
  constraint investor_financial_metrics_range
    check (amount_max is null or amount_min is null or amount_min <= amount_max),
  -- count types carry a count and no money; money types carry an amount and a currency
  constraint investor_financial_metrics_shape check (case
    when metric_type in ('investment_count','portfolio_company_count','grant_count')
      then count_value is not null and amount_min is null and amount_max is null and currency is null
    else count_value is null and amount_min is not null and currency is not null end),
  -- a net asset value with no named vehicle is the ambiguity this type exists to remove
  constraint investor_financial_metrics_vehicle_nav_needs_vehicle
    check (metric_type <> 'vehicle_nav' or vehicle_id is not null)
);

create table if not exists public.investor_fund_positions (
  id uuid primary key default gen_random_uuid(),
  investor_research_id uuid not null references public.investor_research(id) on delete cascade,
  target_investor_research_id uuid references public.investor_research(id) on delete set null,
  target_vehicle_id uuid references public.investor_research_vehicles(id) on delete set null,
  target_name_as_published text not null,
  position_type text not null check (position_type in
    ('limited_partner','fund_of_funds_commitment','anchor_investor','undisclosed')),
  commitment_amount numeric,
  commitment_currency char(3),
  bound text check (bound in ('exact','approximate','minimum','maximum')),
  announced_at date,
  as_of_text text,
  evidence_status text not null check (evidence_status in
    ('investor_announcement','investor_published_portfolio','third_party_reported',
     'research_record','unverified')),
  source_url text,
  reviewed_at date,
  note_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investor_research_id, target_name_as_published, position_type),
  constraint investor_fund_positions_currency
    check ((commitment_amount is null) = (commitment_currency is null)),
  constraint investor_fund_positions_not_self
    check (target_investor_research_id is null
           or target_investor_research_id <> investor_research_id)
);

-- The financial research queue and audit trail. An investor with NO row here has not
-- been researched, which is not the same as researched and yielding nothing.
create table if not exists public.investor_financial_research_log (
  id uuid primary key default gen_random_uuid(),
  investor_research_id uuid not null references public.investor_research(id) on delete cascade,
  outcome text not null check (outcome in
    ('sourced_figures_found','researched_no_usable_figure','explicitly_undisclosed','blocked')),
  sources_checked text[] not null default '{}',
  researched_at date not null default current_date,
  note_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investor_research_id, researched_at)
);

-- Re-apply the parts that an existing database already has, so this file is idempotent
-- rather than only correct on a fresh one.
do $$ begin
  if to_regclass('public.investor_financial_metrics') is not null then
    alter table public.investor_financial_metrics
      add column if not exists display_en text;
    alter table public.investor_financial_metrics
      drop constraint if exists investor_financial_metrics_metric_type_check;
    alter table public.investor_financial_metrics
      add constraint investor_financial_metrics_metric_type_check check (metric_type in
        ('fund_size_target','fund_size_stated','fund_close_first','fund_close_interim',
         'fund_close_final','fund_close_announced','committed_capital','manager_aum',
         'vehicle_nav','cumulative_capital_invested','grant_funding_disbursed','grant_count',
         'initial_investment_range','follow_on_investment_range','average_investment_size',
         'investment_count','portfolio_company_count'));
    alter table public.investor_financial_metrics
      drop constraint if exists investor_financial_metrics_shape;
    alter table public.investor_financial_metrics
      add constraint investor_financial_metrics_shape check (case
        when metric_type in ('investment_count','portfolio_company_count','grant_count')
          then count_value is not null and amount_min is null and amount_max is null and currency is null
        else count_value is null and amount_min is not null and currency is not null end);
    alter table public.investor_financial_metrics
      drop constraint if exists investor_financial_metrics_vehicle_nav_needs_vehicle;
    alter table public.investor_financial_metrics
      add constraint investor_financial_metrics_vehicle_nav_needs_vehicle
      check (metric_type <> 'vehicle_nav' or vehicle_id is not null);
  end if;

  if to_regclass('public.investor_companies') is not null then
    alter table public.investor_companies add column if not exists retired_kind text;
    alter table public.investor_companies
      drop constraint if exists investor_companies_retired_kind_check;
    alter table public.investor_companies
      add constraint investor_companies_retired_kind_check check (retired_kind is null
        or retired_kind in ('unsupported_evidence','holding_ended'));
    alter table public.investor_companies
      drop constraint if exists investor_companies_retired_kind_with_retirement;
    alter table public.investor_companies
      add constraint investor_companies_retired_kind_with_retirement
      check ((retired_at is null) = (retired_kind is null));
  end if;
end $$;

-- Deny by default, like every other base table here: the build reads the views, which
-- bypass RLS, and no browser reads these tables directly.
alter table if exists public.investor_research enable row level security;
alter table if exists public.investor_research_vehicles enable row level security;
alter table if exists public.investor_research_locations enable row level security;
alter table if exists public.investor_companies enable row level security;
alter table if exists public.investor_portfolio_unresolved enable row level security;
alter table if exists public.investor_financial_metrics enable row level security;
alter table if exists public.investor_fund_positions enable row level security;
alter table if exists public.investor_financial_research_log enable row level security;

create index if not exists investor_companies_investor_idx
  on public.investor_companies (investor_research_id);
create index if not exists investor_companies_company_idx
  on public.investor_companies (company_id);
create index if not exists investor_financial_metrics_investor_idx
  on public.investor_financial_metrics (investor_research_id);
create index if not exists investor_financial_research_log_investor_idx
  on public.investor_financial_research_log (investor_research_id);
create index if not exists investor_financial_research_log_outcome_idx
  on public.investor_financial_research_log (outcome);

-- NOTE on the views. v_landscape_investors, v_investor_country_reviews, v_landscape_hubs
-- and v_hub_country_reviews are deliberately NOT mirrored here. They are rebuilt by
-- migration whenever a column is added, because adding one changes the column order and
-- `create or replace view` refuses that, and a stale copy in this file would be worse
-- than none. Their current definitions are in the live database; `pg_get_viewdef` prints
-- them. The investor projection filters `investor_companies.retired_at is null`, so no
-- retired relationship can reach the public export.

-- ---------------------------------------------------------------------------
-- 2026-11-01, the three migrations this file had not caught up with.
-- ---------------------------------------------------------------------------

-- A directory record that is a technology company rather than a fund bridges to its
-- catalogue company row, so the same organisation is not presented as two unrelated
-- things. Independent of matched_investor_id, which bridges to the legacy investors table.
alter table public.investor_research
  add column if not exists matched_company_id uuid references public.companies(id) on delete set null;

-- "Unresolved" was one queue holding five different findings. disposition records which
-- applies, while the row keeps the original assertion and its reason for audit.
alter table public.investor_portfolio_unresolved
  add column if not exists disposition text;
do $$
begin
  if to_regclass('public.investor_portfolio_unresolved') is not null then
    alter table public.investor_portfolio_unresolved
      drop constraint if exists investor_portfolio_unresolved_disposition_check;
    alter table public.investor_portfolio_unresolved
      add constraint investor_portfolio_unresolved_disposition_check
      check (disposition is null or disposition = any (array[
        'relationship_unverified', 'wrong_group_vehicle', 'facility_acquisition',
        'historical_exited', 'organisation_unidentified']));
  end if;
end $$;

-- cumulative_capital_raised = total LP capital raised across all vehicles since inception.
-- NOT assets under management (point-in-time, net of realisations) and NOT
-- cumulative_capital_invested (capital deployed into companies).
do $$
begin
  if to_regclass('public.investor_financial_metrics') is not null then
    alter table public.investor_financial_metrics
      drop constraint if exists investor_financial_metrics_metric_type_check;
    alter table public.investor_financial_metrics
      add constraint investor_financial_metrics_metric_type_check
      check (metric_type = any (array[
        'fund_size_target','fund_size_stated','fund_close_first','fund_close_interim',
        'fund_close_final','fund_close_announced','committed_capital','manager_aum',
        'vehicle_nav','cumulative_capital_raised','cumulative_capital_invested',
        'grant_funding_disbursed','grant_count','initial_investment_range',
        'follow_on_investment_range','average_investment_size','investment_count',
        'portfolio_company_count']));
  end if;
end $$;

-- Two attribution guards. A vehicle belongs to exactly one investor record, so naming
-- another investor's vehicle on your own observation - the mechanical form of an identity
-- conflation - is made impossible rather than reviewable. And an observation whose
-- recipient is not established cannot be is_current, so it cannot reach the public view:
-- a prose caveat does not stop an export, but a CHECK does.
alter table public.investor_financial_metrics
  add column if not exists attribution_status text not null default 'attributed';
do $$
begin
  if to_regclass('public.investor_research_vehicles') is not null then
    alter table public.investor_research_vehicles
      drop constraint if exists investor_research_vehicles_id_investor_key;
    alter table public.investor_research_vehicles
      add constraint investor_research_vehicles_id_investor_key unique (id, investor_id);

    alter table public.investor_financial_metrics
      drop constraint if exists investor_financial_metrics_vehicle_belongs_to_investor;
    alter table public.investor_financial_metrics
      add constraint investor_financial_metrics_vehicle_belongs_to_investor
      foreign key (vehicle_id, investor_research_id)
      references public.investor_research_vehicles (id, investor_id);

    alter table public.investor_companies
      drop constraint if exists investor_companies_vehicle_belongs_to_investor;
    alter table public.investor_companies
      add constraint investor_companies_vehicle_belongs_to_investor
      foreign key (vehicle_id, investor_research_id)
      references public.investor_research_vehicles (id, investor_id);

    alter table public.investor_fund_positions
      drop constraint if exists investor_fund_positions_vehicle_belongs_to_target;
    alter table public.investor_fund_positions
      add constraint investor_fund_positions_vehicle_belongs_to_target
      foreign key (target_vehicle_id, target_investor_research_id)
      references public.investor_research_vehicles (id, investor_id);

    alter table public.investor_fund_positions
      drop constraint if exists investor_fund_positions_vehicle_needs_target;
    alter table public.investor_fund_positions
      add constraint investor_fund_positions_vehicle_needs_target
      check (target_vehicle_id is null or target_investor_research_id is not null);

    alter table public.investor_financial_metrics
      drop constraint if exists investor_financial_metrics_attribution_status_check;
    alter table public.investor_financial_metrics
      add constraint investor_financial_metrics_attribution_status_check
      check (attribution_status = any (array['attributed', 'unresolved_identity']));

    alter table public.investor_financial_metrics
      drop constraint if exists investor_financial_metrics_unresolved_is_not_published;
    alter table public.investor_financial_metrics
      add constraint investor_financial_metrics_unresolved_is_not_published
      check (attribution_status = 'attributed' or is_current = false);
  end if;
end $$;

-- Make sure PostgREST picks up the new tables/columns immediately.
notify pgrst, 'reload schema';


-- Company funding rounds pilot, applied 2026-11-02.
-- Additive company funding pilot. Existing investor_companies records are unchanged.
create table if not exists public.company_funding_rounds (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  round_key text not null,
  stage text not null,
  financing_type text not null check (financing_type in ('equity','debt','grant','convertible','mixed','undisclosed')),
  announced_date text not null check (announced_date ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  amount numeric check (amount > 0),
  currency char(3),
  amount_basis text not null check (amount_basis in ('announced_round_size','target','closed_amount','first_close_amount','undisclosed')),
  closing_status text not null check (closing_status in ('announced','signed','first_close','closed','final_close','undisclosed')),
  note_en text,
  publication_status text not null default 'draft' check (publication_status in ('draft','approved','retired')),
  checked_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id,round_key),
  check ((amount is null) = (currency is null)),
  check ((amount is null) = (amount_basis = 'undisclosed')),
  check (currency is null or currency ~ '^[A-Z]{3}$')
);
create table if not exists public.company_funding_round_sources (
  round_id uuid not null references public.company_funding_rounds(id),
  url text not null check (url ~ '^https?://'),
  title text not null,
  source_type text not null check (source_type in ('company_announcement','investor_announcement','third_party_report')),
  checked_at date not null,
  primary key (round_id,url)
);
create table if not exists public.company_funding_round_investors (
  round_id uuid not null references public.company_funding_rounds(id),
  investor_research_id uuid not null references public.investor_research(id),
  role text not null check (role in ('lead','co_lead','participant','undisclosed')),
  contribution_amount numeric check (contribution_amount > 0),
  contribution_currency char(3),
  source_url text not null,
  checked_at date not null,
  primary key (round_id,investor_research_id),
  foreign key (round_id,source_url) references public.company_funding_round_sources(round_id,url),
  check ((contribution_amount is null) = (contribution_currency is null)),
  check (contribution_currency is null or contribution_currency ~ '^[A-Z]{3}$')
);
create index if not exists company_funding_round_investors_investor_idx on public.company_funding_round_investors(investor_research_id);
create table if not exists public.company_investment_research (
  company_id uuid primary key references public.companies(id),
  coverage_status text not null check (coverage_status in ('not_researched','partial','reviewed','no_public_round_found','conflicting')),
  coverage_note_en text not null,
  checked_at date not null,
  source_urls text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.company_funding_rounds enable row level security;
alter table public.company_funding_round_sources enable row level security;
alter table public.company_funding_round_investors enable row level security;
alter table public.company_investment_research enable row level security;
revoke all on public.company_funding_rounds,public.company_funding_round_sources,public.company_funding_round_investors,public.company_investment_research from anon,authenticated;
grant select,insert,update,delete on public.company_funding_rounds,public.company_funding_round_sources,public.company_funding_round_investors,public.company_investment_research to service_role;

-- Only the server-side build reads these views. No new anonymous Data API access.
create or replace view public.v_company_funding_rounds with (security_invoker=true) as
select r.id,r.company_id,r.round_key,r.stage,r.financing_type,r.announced_date,r.amount,r.currency,r.amount_basis,r.closing_status,r.note_en,r.checked_at,
  (select jsonb_agg(jsonb_build_object('url',s.url,'title',s.title,'type',s.source_type,'checkedAt',s.checked_at) order by s.url) from public.company_funding_round_sources s where s.round_id=r.id) as sources,
  coalesce((select jsonb_agg(jsonb_build_object('slug',i.slug,'name',i.name,'role',p.role,'contribution',case when p.contribution_amount is not null then jsonb_build_object('amount',p.contribution_amount,'currency',p.contribution_currency) else null end,'source',p.source_url) order by case p.role when 'lead' then 0 when 'co_lead' then 0 else 1 end,i.name) from public.company_funding_round_investors p join public.investor_research i on i.id=p.investor_research_id where p.round_id=r.id and i.publication_status='approved'),'[]'::jsonb) as investors
from public.company_funding_rounds r join public.companies c on c.id=r.company_id
where r.publication_status='approved' and c.publication_status='live'
and exists(select 1 from public.company_funding_round_sources s where s.round_id=r.id);
create or replace view public.v_company_investment_research with (security_invoker=true) as
select r.company_id,r.coverage_status,r.coverage_note_en,r.checked_at from public.company_investment_research r join public.companies c on c.id=r.company_id where c.publication_status='live';
revoke all on public.v_company_funding_rounds,public.v_company_investment_research from anon,authenticated;
grant select on public.v_company_funding_rounds,public.v_company_investment_research to service_role;


-- Funding history event types, applied 2026-11-02.
-- Additional financing history: unknown dates, extensions and source-specific roles.
alter table public.company_funding_rounds alter column announced_date drop not null;
alter table public.company_funding_rounds add column if not exists record_kind text not null default 'round' check (record_kind in ('round','extension','credit_facility','investment_disclosure'));
alter table public.company_funding_rounds add column if not exists parent_round_id uuid;
do $constraints$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.company_funding_rounds'::regclass and conname='company_funding_rounds_id_company_unique') then
  alter table public.company_funding_rounds add constraint company_funding_rounds_id_company_unique unique(id,company_id);
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.company_funding_rounds'::regclass and conname='company_funding_rounds_parent_same_company') then
  alter table public.company_funding_rounds add constraint company_funding_rounds_parent_same_company foreign key(parent_round_id,company_id) references public.company_funding_rounds(id,company_id);
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.company_funding_rounds'::regclass and conname='company_funding_rounds_extension_parent') then
  alter table public.company_funding_rounds add constraint company_funding_rounds_extension_parent check ((record_kind='extension')=(parent_round_id is not null) and (parent_round_id is null or parent_round_id<>id));
 end if;
end $constraints$;
create index if not exists company_funding_rounds_parent_idx on public.company_funding_rounds(parent_round_id,company_id);
alter table public.company_funding_round_investors drop constraint if exists company_funding_round_investors_role_check;
alter table public.company_funding_round_investors add constraint company_funding_round_investors_role_check check(role in ('lead','co_lead','participant','undisclosed','lender','grantor'));
do $evidence$ begin
 if to_regclass('public.investor_companies') is not null then
  alter table public.investor_companies drop constraint if exists investor_companies_evidence_status_check;
  alter table public.investor_companies add constraint investor_companies_evidence_status_check check(evidence_status in ('investor_published_portfolio','investor_announcement','company_published_investors','third_party_reported','research_record','unverified'));
 end if;
end $evidence$;
create or replace view public.v_company_funding_rounds with (security_invoker=true) as
select r.id,r.company_id,r.round_key,r.stage,r.financing_type,r.announced_date,r.amount,r.currency,r.amount_basis,r.closing_status,r.note_en,r.checked_at,
  (select jsonb_agg(jsonb_build_object('url',s.url,'title',s.title,'type',s.source_type,'checkedAt',s.checked_at) order by s.url) from public.company_funding_round_sources s where s.round_id=r.id) as sources,
  coalesce((select jsonb_agg(jsonb_build_object('slug',i.slug,'name',i.name,'role',p.role,'contribution',case when p.contribution_amount is not null then jsonb_build_object('amount',p.contribution_amount,'currency',p.contribution_currency) else null end,'source',p.source_url) order by case p.role when 'lead' then 0 when 'co_lead' then 0 else 1 end,i.name) from public.company_funding_round_investors p join public.investor_research i on i.id=p.investor_research_id where p.round_id=r.id and i.publication_status='approved'),'[]'::jsonb) as investors,r.record_kind,r.parent_round_id
from public.company_funding_rounds r join public.companies c on c.id=r.company_id
where r.publication_status='approved' and c.publication_status='live'
and exists(select 1 from public.company_funding_round_sources s where s.round_id=r.id);
create or replace view public.v_company_investment_research with (security_invoker=true) as
select r.company_id,r.coverage_status,r.coverage_note_en,r.checked_at from public.company_investment_research r join public.companies c on c.id=r.company_id where c.publication_status='live';
revoke all on public.v_company_funding_rounds,public.v_company_investment_research from anon,authenticated;
grant select on public.v_company_funding_rounds,public.v_company_investment_research to service_role;


-- Preserve reported lower/upper bounds and approximate amounts without implying exact proceeds.
alter table public.company_funding_rounds add column if not exists amount_qualifier text not null default 'exact' check (amount_qualifier in ('exact','approximate','more_than','at_least','up_to'));
create or replace view public.v_company_funding_rounds with (security_invoker=true) as
select r.id,r.company_id,r.round_key,r.stage,r.financing_type,r.announced_date,r.amount,r.currency,r.amount_basis,r.closing_status,r.note_en,r.checked_at,
  (select jsonb_agg(jsonb_build_object('url',s.url,'title',s.title,'type',s.source_type,'checkedAt',s.checked_at) order by s.url) from public.company_funding_round_sources s where s.round_id=r.id) as sources,
  coalesce((select jsonb_agg(jsonb_build_object('slug',i.slug,'name',i.name,'role',p.role,'contribution',case when p.contribution_amount is not null then jsonb_build_object('amount',p.contribution_amount,'currency',p.contribution_currency) else null end,'source',p.source_url) order by case p.role when 'lead' then 0 when 'co_lead' then 0 else 1 end,i.name) from public.company_funding_round_investors p join public.investor_research i on i.id=p.investor_research_id where p.round_id=r.id and i.publication_status='approved'),'[]'::jsonb) as investors,r.record_kind,r.parent_round_id,r.amount_qualifier
from public.company_funding_rounds r join public.companies c on c.id=r.company_id
where r.publication_status='approved' and c.publication_status='live'
and exists(select 1 from public.company_funding_round_sources s where s.round_id=r.id);
revoke all on public.v_company_funding_rounds from anon,authenticated;
grant select on public.v_company_funding_rounds to service_role;


-- European UAV & Counter-UAS events: data-only module, no website publication.
create table if not exists public.ecosystem_events (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 series_key text not null,
 name text not null,
 edition_year integer check (edition_year between 2000 and 2200),
 start_date date,
 end_date date,
 date_status text not null check (date_status in ('confirmed','announced','unannounced','conflicting')),
 date_precision text not null check (date_precision in ('day','month','season','year','unknown')),
 date_label text,
 event_status text not null check (event_status in ('scheduled','announced','unknown','postponed','cancelled','completed')),
 publication_status text not null default 'watchlist' check (publication_status in ('ready','watchlist','retired')),
 country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
 country text not null,
 city text,
 venue text,
 timezone text,
 attendance_mode text not null check (attendance_mode in ('in_person','online','hybrid','unknown')),
 organizer_name text,
 website_url text not null check (website_url ~ '^https?://'),
 registration_url text check (registration_url is null or registration_url ~ '^https?://'),
 exhibitor_url text check (exhibitor_url is null or exhibitor_url ~ '^https?://'),
 event_types text[] not null default '{}',
 topic_tags text[] not null default '{}',
 audience_tags text[] not null default '{}',
 relevance_tier text not null check (relevance_tier in ('core','adjacent')),
 classification_basis text not null,
 description_en text not null,
 access_policy text not null default 'not_verified' check (access_policy in ('not_verified','open_registration','invitation_only','approval_required')),
 ticket_price numeric check (ticket_price >= 0),
 ticket_currency char(3) check (ticket_currency is null or ticket_currency ~ '^[A-Z]{3}$'),
 registration_deadline date,
 speaker_deadline date,
 research_note_en text,
 source_verification text not null,
 checked_at date not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((start_date is null) = (end_date is null)),
 check (end_date >= start_date),
 check (date_status <> 'confirmed' or (date_precision='day' and start_date is not null and edition_year is not null)),
 check (date_precision <> 'day' or start_date is not null),
 check (publication_status <> 'ready' or (date_status='confirmed' and event_status='scheduled')),
 check ((ticket_price is null) = (ticket_currency is null))
);
create table if not exists public.ecosystem_event_sources (
 event_id uuid not null references public.ecosystem_events(id),
 url text not null check (url ~ '^https?://'),
 source_type text not null check (source_type in ('organizer','institution','industry_media','industry_association','exhibitor')),
 supported_fields text[] not null,
 finding_en text not null,
 checked_at date not null,
 primary key(event_id,url)
);
create index if not exists ecosystem_event_sources_event_idx on public.ecosystem_event_sources(event_id);
create index if not exists ecosystem_events_start_idx on public.ecosystem_events(start_date) where publication_status='ready';
create index if not exists ecosystem_events_country_idx on public.ecosystem_events(country_code);
create index if not exists ecosystem_events_series_idx on public.ecosystem_events(series_key);
create index if not exists ecosystem_events_topics_idx on public.ecosystem_events using gin(topic_tags);
create table if not exists public.ecosystem_event_research_runs (
 run_key text primary key,
 checked_at date not null,
 window_start date not null,
 window_end date not null check (window_end >= window_start),
 methodology_en text not null,
 limitations_en text not null,
 confirmed_count integer not null,
 watchlist_count integer not null,
 exclusions jsonb not null default '[]',
 coverage_notes jsonb not null default '{}'
);
alter table public.ecosystem_events enable row level security;
alter table public.ecosystem_event_sources enable row level security;
alter table public.ecosystem_event_research_runs enable row level security;
revoke all on public.ecosystem_events,public.ecosystem_event_sources,public.ecosystem_event_research_runs from anon,authenticated;
grant select,insert,update,delete on public.ecosystem_events,public.ecosystem_event_sources,public.ecosystem_event_research_runs to service_role;
create or replace view public.v_ecosystem_events with (security_invoker=true) as
select e.*,
 (select jsonb_agg(jsonb_build_object('url',s.url,'sourceType',s.source_type,'supportedFields',s.supported_fields,'finding',s.finding_en,'checkedAt',s.checked_at) order by s.url)
  from public.ecosystem_event_sources s where s.event_id=e.id) as sources
from public.ecosystem_events e
where e.publication_status='ready' and e.date_status='confirmed' and e.event_status='scheduled'
and exists(select 1 from public.ecosystem_event_sources s where s.event_id=e.id and 'dates'=any(s.supported_fields));
revoke all on public.v_ecosystem_events from anon,authenticated;
grant select on public.v_ecosystem_events to service_role;
comment on table public.ecosystem_events is 'Researched event editions and explicitly undated watch items. Ready means data ready, not published on website. Dates are local calendar days; end date inclusive.';
comment on view public.v_ecosystem_events is 'Server-only integration projection. Consumers choose their date window. No frontend is deployed by this migration.';
notify pgrst, 'reload schema';


-- Research can be open-ended. Historical fixed-window runs retain their end dates.
alter table public.ecosystem_event_research_runs alter column window_end drop not null;
comment on column public.ecosystem_event_research_runs.window_end is 'Null means open-ended discovery with no future upper cutoff. A non-null date describes a historical bounded research run.';

-- Private inbox for the public landscape feedback form. No anonymous table/RPC access.
create table if not exists public.landscape_feedback (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 email text not null check(length(email) between 3 and 254 and email !~ '[[:space:]]'),
 message text not null check(length(btrim(message)) between 10 and 10000),
 consent boolean not null check(consent=true),
 consent_version text not null check(consent_version='2026-11-12'),
 consent_text text not null,
 consented_at timestamptz not null default now(),
 ip_hash text check(ip_hash ~ '^[A-Za-z0-9_-]{43}$'),
 challenge_id uuid not null unique,
 review_status text not null default 'new' check(review_status in ('new','reviewed','closed')),
 notification_status text not null default 'pending' check(notification_status in ('pending','sending','sent','failed')),
 notification_attempts integer not null default 0 check(notification_attempts>=0),
 notification_next_attempt_at timestamptz not null default now(),
 notification_lease_token uuid,
 notification_locked_until timestamptz,
 notification_sent_at timestamptz,
 notification_provider_id text,
 notification_error text
);
alter table public.landscape_feedback enable row level security;
revoke all on table public.landscape_feedback from public,anon,authenticated;
grant select,insert,update on table public.landscape_feedback to service_role;
create index if not exists landscape_feedback_rate_ip on public.landscape_feedback(ip_hash,created_at desc) where ip_hash is not null;
create index if not exists landscape_feedback_rate_email on public.landscape_feedback(email,created_at desc);
create index if not exists landscape_feedback_notifications on public.landscape_feedback(notification_next_attempt_at,created_at) where notification_sent_at is null;
comment on table public.landscape_feedback is 'Private recommendations and contact emails; service-role only. Never export to the public catalogue.';

create or replace function public.submit_landscape_feedback(p_email text,p_message text,p_consent boolean,p_consent_version text,p_ip_hash text,p_challenge_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare existing public.landscape_feedback%rowtype; saved_id uuid;
begin
 if p_consent is distinct from true or p_consent_version is distinct from '2026-11-12' then raise exception 'feedback_consent_required'; end if;
 if p_email is null or length(p_email)>254 or p_email !~ '^[^@[:space:]]+@[^@.[:space:]]+([.][^@.[:space:]]+)+$' or p_message is null or length(btrim(p_message)) not between 10 and 10000 or p_ip_hash is null or p_ip_hash !~ '^[A-Za-z0-9_-]{43}$' or p_challenge_id is null then raise exception 'feedback_invalid'; end if;
 -- A small fixed lock makes quota checks + insert one atomic operation under concurrency.
 perform pg_catalog.pg_advisory_xact_lock(728394019);
 select * into existing from public.landscape_feedback where challenge_id=p_challenge_id;
 if found then
  if existing.email=lower(btrim(p_email)) and existing.message=btrim(p_message) then return jsonb_build_object('id',existing.id,'duplicate',true); end if;
  raise exception 'feedback_replay_conflict';
 end if;
 if (select count(*) from public.landscape_feedback where created_at>now()-interval '1 hour' and ip_hash=p_ip_hash)>=20
 or (select count(*) from public.landscape_feedback where created_at>now()-interval '1 hour' and email=lower(btrim(p_email)))>=3
 or (select count(*) from public.landscape_feedback where created_at>now()-interval '1 day')>=120 then raise exception 'feedback_rate_limit'; end if;
 insert into public.landscape_feedback(email,message,consent,consent_version,consent_text,ip_hash,challenge_id)
 values(lower(btrim(p_email)),btrim(p_message),true,'2026-11-12','I agree that xSonomy may store and process my email address and message to review my suggestion and contact me about it. I have read the privacy information below.',p_ip_hash,p_challenge_id) returning id into saved_id;
 return jsonb_build_object('id',saved_id,'duplicate',false);
end $$;
revoke all on function public.submit_landscape_feedback(text,text,boolean,text,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_landscape_feedback(text,text,boolean,text,text,uuid) to service_role;

create or replace function public.claim_landscape_feedback_notifications(p_limit integer default 20)
returns setof public.landscape_feedback language plpgsql security invoker set search_path='' as $$
begin
 -- Rate-limit identifiers are unnecessary after the quota window; keep the feedback itself.
 update public.landscape_feedback set ip_hash=null where ip_hash is not null and created_at<now()-interval '2 days';
 return query
 with pending as (
  select id from public.landscape_feedback where notification_sent_at is null and notification_attempts<8 and notification_next_attempt_at<=now() and (notification_locked_until is null or notification_locked_until<now()) order by created_at for update skip locked limit greatest(1,least(coalesce(p_limit,20),20))
 ) update public.landscape_feedback f set notification_status='sending',notification_attempts=f.notification_attempts+1,notification_locked_until=now()+interval '10 minutes',notification_lease_token=gen_random_uuid() from pending where f.id=pending.id returning f.*;
end $$;
revoke all on function public.claim_landscape_feedback_notifications(integer) from public,anon,authenticated;
grant execute on function public.claim_landscape_feedback_notifications(integer) to service_role;

create or replace function public.finish_landscape_feedback_notification(p_id uuid,p_lease_token uuid,p_provider_id text default null,p_error text default null)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_provider_id is null and (p_error is null or p_error !~ '^(resend_http_[0-9]{3}|resend_network|resend_bad_response)$') then raise exception 'feedback_invalid_delivery_result'; end if;
 update public.landscape_feedback set
  notification_status=case when p_provider_id is not null then 'sent' when notification_attempts>=8 then 'failed' else 'pending' end,
  notification_provider_id=p_provider_id,
  notification_sent_at=case when p_provider_id is not null then now() else null end,
  notification_error=case when p_provider_id is not null then null else p_error end,
  notification_next_attempt_at=now()+make_interval(mins=>least(120,5*(2^least(notification_attempts,5))::integer)),
  notification_locked_until=null,notification_lease_token=null
 where id=p_id and notification_lease_token=p_lease_token and notification_sent_at is null;
 if not found then raise exception 'feedback_lease_lost'; end if;
end $$;
revoke all on function public.finish_landscape_feedback_notification(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.finish_landscape_feedback_notification(uuid,uuid,text,text) to service_role;
