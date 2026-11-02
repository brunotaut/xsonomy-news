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
