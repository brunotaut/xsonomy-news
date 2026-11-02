import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function validateFundingPilot(data){
 if(!Array.isArray(data.rounds)||!data.rounds.length)throw Error('No rounds');
 const keys=new Set();
 for(const r of data.rounds){
  const key=r.company_slug+'|'+r.round_key;if(keys.has(key))throw Error('Duplicate round');keys.add(key);
  if(!/^[a-z0-9-]+$/.test(r.company_slug)||!/^[a-z0-9-]+$/.test(r.round_key))throw Error('Unsafe slug');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.announced_date)||Number.isNaN(Date.parse(r.announced_date)))throw Error('Invalid date');
  if(!(r.amount>0)||!/^[A-Z]{3}$/.test(r.currency))throw Error('Invalid amount/currency');
  if(!['announced','signed','first_close','closed','final_close','undisclosed'].includes(r.closing_status))throw Error('Invalid closing status');
  if(!['announced_round_size','target','closed_amount','first_close_amount','undisclosed'].includes(r.amount_basis))throw Error('Invalid amount basis');
  if(r.research_status!=='partial')throw Error('Pilot must not claim complete history');
  for(const source of r.sources||[]){if(!/^https:\/\//.test(source.url)||!source.title)throw Error('Missing source');}
  const seen=new Set();for(const p of r.investors||[]){if(seen.has(p.slug))throw Error('Duplicate round participant');seen.add(p.slug);if(!/^[a-z0-9-]+$/.test(p.slug)||!p.name||!r.sources[p.source_index])throw Error('Invalid participant source');if(!['lead','co_lead','participant','undisclosed'].includes(p.role))throw Error('Invalid role');}
 }
 return data;
}
export function prepareFundingSql(data){validateFundingPilot(data);
 const literal="'"+JSON.stringify(data).replaceAll("'","''")+"'::jsonb";
 const cte=`with input as(select ${literal} as data), rounds as(select value r from input,jsonb_array_elements(data->'rounds')), participants as(select r,value p from rounds,jsonb_array_elements(r->'investors')) `;
 return [
 cte+`insert into public.investor_research(research_id,slug,name,entity_type,evidence_status,evidence_status_label,evidence_basis,source_dataset,source_dataset_version,publication_status,map_ready,verified_as_of,approved_at,missing_fields) select distinct 'funding-pilot:'||(p->>'slug'),p->>'slug',p->>'name',p->>'entity_type','deal','Source-confirmed round participant','primary_or_transaction_party','company-funding-pilot-v1','2026-11-02','approved',false,(r->>'checked_at')::date,now(),array['Published offices','Fund size / manager AUM','Typical ticket size','Investment mandate'] from participants on conflict(slug) do nothing;`,
 cte+`insert into public.company_funding_rounds(company_id,round_key,stage,financing_type,announced_date,amount,currency,amount_basis,closing_status,note_en,publication_status,checked_at) select c.id,r->>'round_key',r->>'stage',r->>'financing_type',r->>'announced_date',(r->>'amount')::numeric,r->>'currency',r->>'amount_basis',r->>'closing_status',r->>'note_en','approved',(r->>'checked_at')::date from rounds join public.companies c on c.slug::text=r->>'company_slug' on conflict(company_id,round_key) do nothing;`,
 cte+`insert into public.company_funding_round_sources(round_id,url,title,source_type,checked_at) select f.id,s->>'url',s->>'title',s->>'source_type',(r->>'checked_at')::date from rounds join public.companies c on c.slug::text=r->>'company_slug' join public.company_funding_rounds f on f.company_id=c.id and f.round_key=r->>'round_key' cross join lateral jsonb_array_elements(r->'sources') s on conflict(round_id,url) do nothing;`,
 cte+`insert into public.company_funding_round_investors(round_id,investor_research_id,role,source_url,checked_at) select f.id,i.id,p->>'role',r->'sources'->((p->>'source_index')::int)->>'url',(r->>'checked_at')::date from participants join public.companies c on c.slug::text=r->>'company_slug' join public.company_funding_rounds f on f.company_id=c.id and f.round_key=r->>'round_key' join public.investor_research i on i.slug::text=p->>'slug' on conflict(round_id,investor_research_id) do nothing;`,
 cte+`insert into public.investor_research_sources(investor_id,url,title,accessed_at) select distinct i.id,r->'sources'->((p->>'source_index')::int)->>'url',r->'sources'->((p->>'source_index')::int)->>'title',(r->>'checked_at')::date from participants join public.investor_research i on i.slug::text=p->>'slug' where not exists(select 1 from public.investor_research_sources ex where ex.investor_id=i.id and ex.url=r->'sources'->((p->>'source_index')::int)->>'url' and ex.location_id is null) on conflict do nothing;`,
 cte+`insert into public.company_investment_research(company_id,coverage_status,coverage_note_en,checked_at,source_urls) select c.id,r->>'research_status',r->>'coverage_note_en',(r->>'checked_at')::date,array(select s->>'url' from jsonb_array_elements(r->'sources') s) from rounds join public.companies c on c.slug::text=r->>'company_slug' on conflict(company_id) do nothing;`,
 `do $check$ begin if(select count(*) from public.company_funding_rounds where round_key in ('series-a-2026','series-e-2026','series-d-2026','series-b-2026') and company_id in(select id from public.companies where slug::text in('alta-ares','helsing','quantum-systems','tekever','harmattan-ai')))<>5 then raise exception 'Pilot must resolve exactly five company rounds';end if;end $check$;`
 ].join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const data=JSON.parse(await readFile(new URL('../research-agent/imports/company-funding-pilot-v1.json',import.meta.url),'utf8'));process.stdout.write(prepareFundingSql(data));}
