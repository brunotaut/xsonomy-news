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
