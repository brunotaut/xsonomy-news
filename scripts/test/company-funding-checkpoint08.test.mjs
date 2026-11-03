import test from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {prepareFundingSql} from '../prepare-funding-pilot.mjs';
test('checkpoint 08 rolls back, imports idempotently and guards the existing FlyingBasket correction',async()=>{
const db=new PGlite();
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create table public.companies(id uuid primary key default gen_random_uuid(),slug text unique,name text not null default 'Test Company',publication_status text not null default 'live');
 create table public.investor_research(id uuid primary key default gen_random_uuid(),research_id text unique,slug text unique,name text,entity_type text,evidence_status text,evidence_status_label text,evidence_basis text,source_dataset text,source_dataset_version text,publication_status text,map_ready boolean,verified_as_of date,approved_at timestamptz,missing_fields text[]);
 create table public.investor_research_sources(id uuid primary key default gen_random_uuid(),investor_id uuid references public.investor_research(id),location_id uuid,url text,title text,accessed_at date);
 create table public.investor_companies(investor_research_id uuid,company_id uuid,relationship_type text,evidence_status text,source_url text,reviewed_at date,portfolio_name_as_published text,match_method text,match_note_en text,unique(investor_research_id,company_id,relationship_type));
 insert into public.companies(slug) values ('alta-ares'),('helsing'),('quantum-systems'),('tekever'),('harmattan-ai');`);

for(const p of ['db/company-funding-schema.sql','db/company-funding-history-schema.sql','db/company-funding-amount-qualifier-schema.sql'])await db.exec(await readFile(p,'utf8'));
const data=JSON.parse(await readFile('research-agent/imports/company-funding-research-08-2026-11-02.json','utf8'));
for(const slug of new Set(data.rounds.map(r=>r.company_slug)))await db.query('insert into companies(slug) values($1) on conflict do nothing',[slug]);
const correction=await readFile('research-agent/imports/company-funding-research-08-flyingbasket-correction.sql','utf8');
await db.exec(`insert into company_funding_rounds(company_id,round_key,stage,financing_type,announced_date,amount_basis,closing_status,note_en,publication_status,checked_at,record_kind) select id,'cysero-investment-2022','Venture investment','equity','2022-03','undisclosed','closed','The later company statement reports Cysero as a shareholder; stake percentage is not an investment amount. No cheque size is established.','approved','2026-11-02','investment_disclosure' from companies where slug='flyingbasket'`);
await db.exec('begin');await db.exec(prepareFundingSql(data));await db.exec(correction);
assert.equal((await db.query('select count(*)::int n from company_funding_rounds')).rows[0].n,17);
await db.exec('rollback');assert.equal((await db.query('select count(*)::int n from company_funding_rounds')).rows[0].n,1);
await db.exec(prepareFundingSql(data));await db.exec(correction);
const counts=()=>db.query('select (select count(*)::int from company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) participants,(select count(*)::int from company_funding_round_sources) sources');
const before=(await counts()).rows;await db.exec(prepareFundingSql(data));assert.deepEqual((await counts()).rows,before);
assert.equal((await db.query("select amount_qualifier from company_funding_rounds where round_key='cysero-investment-2022'")).rows[0].amount_qualifier,'approximate');
await assert.rejects(db.exec(correction),/expected-old-value/);

}finally{await db.close()}
});
