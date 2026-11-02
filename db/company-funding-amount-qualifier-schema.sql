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
