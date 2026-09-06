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

-- Make sure PostgREST picks up the new table/columns immediately.
notify pgrst, 'reload schema';
