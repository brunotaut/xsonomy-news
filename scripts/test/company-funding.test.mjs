import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {prepareFundingSql,validateFundingPilot} from '../prepare-funding-pilot.mjs';
const root=new URL('../../',import.meta.url);
const fixture=JSON.parse(await readFile(new URL('research-agent/imports/company-funding-pilot-v1.json',root),'utf8'));
test('funding schema and import run in PostgreSQL, rerun cleanly and keep different rounds distinct',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create table public.companies(id uuid primary key default gen_random_uuid(),slug text unique,name text not null default 'Test Company',publication_status text not null default 'live');
 create table public.investor_research(id uuid primary key default gen_random_uuid(),research_id text unique,slug text unique,name text,entity_type text,evidence_status text,evidence_status_label text,evidence_basis text,source_dataset text,source_dataset_version text,publication_status text,map_ready boolean,verified_as_of date,approved_at timestamptz,missing_fields text[]);
 create table public.investor_research_sources(id uuid primary key default gen_random_uuid(),investor_id uuid references public.investor_research(id),location_id uuid,url text,title text,accessed_at date);
 create table public.investor_companies(investor_research_id uuid,company_id uuid,relationship_type text,evidence_status text,source_url text,reviewed_at date,portfolio_name_as_published text,match_method text,match_note_en text,unique(investor_research_id,company_id,relationship_type));
 insert into public.companies(slug) values ('alta-ares'),('helsing'),('quantum-systems'),('tekever'),('harmattan-ai');`);
 await db.exec(await readFile(new URL('db/company-funding-schema.sql',root),'utf8'));
 await db.exec(await readFile(new URL('db/company-funding-history-schema.sql',root),'utf8'));
 await db.exec(await readFile(new URL('db/company-funding-amount-qualifier-schema.sql',root),'utf8'));
 await db.exec(prepareFundingSql(fixture));
 const before=(await db.query(`select (select count(*)::int from company_funding_rounds) rounds,(select count(*)::int from company_funding_round_investors) participants,(select count(*)::int from investor_research_sources) sources`)).rows[0];
 assert.equal(before.rounds,5);assert.equal(before.participants,35);
 await db.exec(prepareFundingSql(fixture));
 assert.deepEqual((await db.query(`select (select count(*)::int from company_funding_rounds) rounds,(select count(*)::int from company_funding_round_investors) participants,(select count(*)::int from investor_research_sources) sources`)).rows[0],before);
 const alta=(await db.query(`select * from v_company_funding_rounds where round_key='series-a-2026'`)).rows[0];
 assert.equal(alta.investors.length,7);assert.equal(alta.investors.find(i=>i.slug==='air-street-capital').role,'lead');
 assert.ok(alta.investors.every(i=>i.contribution===null));
 await db.exec(`insert into company_funding_rounds(company_id,round_key,stage,financing_type,announced_date,amount_basis,closing_status,checked_at) select company_id,'future-test','Undisclosed','equity','2027','undisclosed','announced',current_date from company_funding_rounds where round_key='series-a-2026';
 insert into company_funding_round_sources(round_id,url,title,source_type,checked_at) select id,'https://example.com/test','Test','company_announcement',current_date from company_funding_rounds where round_key='future-test';
 insert into company_funding_round_investors(round_id,investor_research_id,role,source_url,checked_at) select f.id,i.id,'participant','https://example.com/test',current_date from company_funding_rounds f cross join investor_research i where f.round_key='future-test' and i.slug='air-street-capital';`);
 assert.equal((await db.query(`select count(*)::int n from company_funding_round_investors p join investor_research i on i.id=p.investor_research_id where i.slug='air-street-capital'`)).rows[0].n,2);
 assert.equal((await db.query(`select count(*)::int n from v_company_funding_rounds`)).rows[0].n,5,'draft round must not publish');
 await assert.rejects(db.exec(`update company_funding_rounds set currency=null where round_key='series-a-2026'`),/check constraint/);
 await assert.rejects(db.exec(`update company_funding_round_investors set source_url='https://example.com/unsupported' where investor_research_id=(select id from investor_research where slug='air-street-capital')`),/foreign key constraint/);
 const access=(await db.query(`select has_table_privilege('anon','company_funding_rounds','select') as base,has_table_privilege('anon','v_company_funding_rounds','select') as view,(select relrowsecurity from pg_class where oid='company_funding_rounds'::regclass) as rls`)).rows[0];
 assert.deepEqual(access,{base:false,view:false,rls:true});
 const history=JSON.parse(await readFile(new URL('research-agent/imports/company-funding-history-v1.json',root),'utf8'));
 await db.exec(prepareFundingSql(history));
 const counts=(await db.query(`select (select count(*)::int from v_company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) participants,(select count(*)::int from investor_companies) generic_links,(select count(*)::int from investor_research_sources) sources`)).rows[0];
 assert.equal(counts.events,24);assert.equal(counts.generic_links,2);
 await db.exec(prepareFundingSql(history));
 assert.deepEqual((await db.query(`select (select count(*)::int from v_company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) participants,(select count(*)::int from investor_companies) generic_links,(select count(*)::int from investor_research_sources) sources`)).rows[0],counts);
 const harmattan=(await db.query(`select announced_date,amount from company_funding_rounds f join companies c on c.id=f.company_id where c.slug='harmattan-ai' and f.round_key='seed-undated'`)).rows[0];assert.equal(harmattan.announced_date,null);assert.equal(harmattan.amount,null);
 const linked=(await db.query(`select f.company_id=p.company_id same_company,p.round_key from company_funding_rounds f join company_funding_rounds p on p.id=f.parent_round_id where f.round_key='series-c-extension-2025'`)).rows[0];assert.deepEqual(linked,{same_company:true,round_key:'series-c-2025'});
 await db.exec("update company_funding_rounds set amount=180000001 where round_key='series-c-extension-2025'");await assert.rejects(db.exec(prepareFundingSql(history)),/Manifest conflicts with stored event/);assert.equal((await db.query("select amount from company_funding_rounds where round_key='series-c-extension-2025'")).rows[0].amount,'180000001');


 const expansion=JSON.parse(await readFile(new URL('research-agent/imports/company-funding-expansion-2026-11-02.json',root),'utf8'));
 for(const slug of new Set(expansion.rounds.map(r=>r.company_slug)))await db.query('insert into companies(slug) values($1) on conflict do nothing',[slug]);
 await db.exec(prepareFundingSql(expansion));
 const newCounts=(await db.query('select (select count(*)::int from v_company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) participations,(select count(*)::int from investor_research_sources) sources')).rows[0];
 assert.equal(newCounts.events,24+expansion.rounds.length);
 await db.exec(prepareFundingSql(expansion));
 assert.deepEqual((await db.query('select (select count(*)::int from v_company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) participations,(select count(*)::int from investor_research_sources) sources')).rows[0],newCounts);
 const swiss=(await db.query("select amount,amount_qualifier from v_company_funding_rounds f join companies c on c.id=f.company_id where c.slug='swissdrones' and round_key='series-b-2024'")).rows[0];assert.equal(swiss.amount_qualifier,'more_than');assert.equal(swiss.amount,'10000000');
 const frank=(await db.query("select contribution_amount from company_funding_round_investors p join company_funding_rounds f on f.id=p.round_id join companies c on c.id=f.company_id where c.slug='frankenburg-technologies' and contribution_amount is not null")).rows[0];assert.equal(frank.contribution_amount,'7000000');
 const next=JSON.parse(await readFile(new URL('research-agent/imports/company-funding-research-02-2026-11-02.json',root),'utf8'));
 for(const slug of new Set(next.rounds.map(r=>r.company_slug)))await db.query('insert into companies(slug) values($1) on conflict do nothing',[slug]);
 await db.exec(prepareFundingSql(next));
 assert.equal((await db.query('select count(*)::int n from v_company_funding_rounds')).rows[0].n,24+expansion.rounds.length+next.rounds.length);
 const secondCounts=(await db.query('select (select count(*)::int from company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) participations,(select count(*)::int from investor_research_sources) sources')).rows[0];
 await db.exec(prepareFundingSql(next));assert.deepEqual((await db.query('select (select count(*)::int from company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) participations,(select count(*)::int from investor_research_sources) sources')).rows[0],secondCounts);
 const badQualifier=structuredClone(expansion);badQualifier.rounds[0].amount_qualifier='made-up';assert.throws(()=>validateFundingPilot(badQualifier),/Invalid amount qualifier/);

 }finally{await db.close()}
});
test('pilot preserves first-close uncertainty and does not claim full company research',()=>{
 const data=validateFundingPilot(structuredClone(fixture));
 const t=data.rounds.find(r=>r.company_slug==='tekever');assert.equal(t.closing_status,'first_close');assert.equal(t.amount_basis,'announced_round_size');
 assert.ok(data.rounds.every(r=>r.research_status==='partial'));
 const bad=structuredClone(data);bad.rounds[0].investors[0].source_index=99;assert.throws(()=>validateFundingPilot(bad),/source/);
});

test('history import preserves unknown dates, extension links, loan contributions and idempotency',async()=>{
 const history=JSON.parse(await readFile(new URL('research-agent/imports/company-funding-history-v1.json',root),'utf8'));
 assert.equal(history.rounds.length,19);validateFundingPilot(history);
 assert.ok(history.rounds.filter(r=>r.company_slug==='harmattan-ai').every(r=>r.amount===null&&r.announced_date===null));
 const bank=history.rounds.find(r=>r.round_key==='european-debt-2026');assert.equal(bank.amount,150000000);assert.equal(bank.investors[0].contribution.amount,70000000);
 const ext=history.rounds.find(r=>r.round_key==='series-c-extension-2025');assert.equal(ext.amount,180000000);assert.equal(ext.parent_round_key,'series-c-2025');
 const bad=structuredClone(history);bad.rounds[0].announced_date='2025-02-31';assert.throws(()=>validateFundingPilot(bad),/Invalid date/);
 const wrong=structuredClone(history);wrong.rounds.find(r=>r.round_key==='european-debt-2026').investors[0].contribution.amount=160000000;assert.throws(()=>validateFundingPilot(wrong),/exceeds/);
});
