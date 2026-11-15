import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PGlite} from '/workspace/scratch/6d8fec2895e0/xsonomy-news/node_modules/@electric-sql/pglite/dist/index.js';
import {prepareFundingSql,validateFundingPilot} from './scripts/prepare-funding-pilot.mjs';
const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create table public.companies(id uuid primary key default gen_random_uuid(),slug text unique,name text not null default 'Test Company',publication_status text not null default 'live');
 create table public.investor_research(id uuid primary key default gen_random_uuid(),research_id text unique,slug text unique,name text,entity_type text,evidence_status text,evidence_status_label text,evidence_basis text,source_dataset text,source_dataset_version text,publication_status text,map_ready boolean,verified_as_of date,approved_at timestamptz,missing_fields text[]);
 create table public.investor_research_sources(id uuid primary key default gen_random_uuid(),investor_id uuid references public.investor_research(id),location_id uuid,url text,title text,accessed_at date);
 create table public.investor_companies(investor_research_id uuid,company_id uuid,relationship_type text,evidence_status text,source_url text,reviewed_at date,portfolio_name_as_published text,match_method text,match_note_en text,unique(investor_research_id,company_id,relationship_type));
`);
for(const p of ['company-funding-schema.sql','company-funding-history-schema.sql','company-funding-amount-qualifier-schema.sql'])await db.exec(await fs.readFile('run101/db/'+p,'utf8'));
const oldContext=JSON.parse(await fs.readFile('run101/old.json','utf8'));
const corr=JSON.parse(await fs.readFile('run101/corrections.json','utf8'));
for(const c of corr.corrections){const old=c.expected_before;await db.query('insert into companies(id,slug) values($1,$2) on conflict do nothing',[old.company_id,c.company_slug]);await db.query('insert into company_funding_rounds select * from jsonb_populate_record(null::company_funding_rounds,$1::jsonb)',[JSON.stringify(old)]);}
for(const c of corr.corrections){const r=oldContext.find(r=>r.id===c.key);for(const i of r.investors){await db.query('insert into investor_research(id,slug,name) values($1,$2,$3) on conflict do nothing',[i.investor_research_id,JSON.parse(await fs.readFile('run101/profiles.json','utf8')).find(p=>p.id===i.investor_research_id).slug,'Fixture contracting agency']);}for(const source of r.sources)await db.query('insert into company_funding_round_sources select * from jsonb_populate_record(null::company_funding_round_sources,$1::jsonb)',[JSON.stringify(source)]);for(const i of r.investors)await db.query('insert into company_funding_round_investors select * from jsonb_populate_record(null::company_funding_round_investors,$1::jsonb)',[JSON.stringify(i)]);}
const norm=x=>Object.fromEntries(Object.entries(x).filter(([k])=>k!=='updated_at'));
const verify=async which=>{for(const c of corr.participant_corrections){const row=(await db.query('select to_jsonb(i) j from company_funding_round_investors i where round_id=$1 and investor_research_id=$2',[c.key.round_id,c.key.investor_research_id])).rows[0].j;assert.deepEqual(row,c[which]);}for(const c of corr.corrections){const row=(await db.query('select to_jsonb(r) j from company_funding_rounds r where id=$1',[c.key])).rows[0].j;assert.deepEqual(norm(row),norm(c[which]));}};
const m=JSON.parse(await fs.readFile('run101/manifest.json','utf8'));validateFundingPilot(m);for(const s of new Set([...m.rounds,...m.relationships].map(r=>r.company_slug)))await db.query('insert into companies(slug) values($1) on conflict do nothing',[s]);
const sql=corr.forward_sql+prepareFundingSql(m),counts=async()=> (await db.query('select (select count(*)::int from company_funding_rounds) events,(select count(*)::int from company_funding_round_investors) links,(select count(*)::int from company_funding_round_sources) sources,(select count(*)::int from investor_companies) relationships')).rows[0];
await db.exec('begin;'+sql+'rollback;');assert.equal((await counts()).events,corr.corrections.length);await verify("expected_before");
const last=corr.participant_corrections.at(-1);await db.query("update company_funding_round_investors set role='undisclosed' where round_id=$1 and investor_research_id=$2",[last.key.round_id,last.key.investor_research_id]);
await assert.rejects(db.exec('begin;'+sql+'commit;'),/guard failed/);await db.exec('rollback;');
assert.equal((await counts()).events,corr.corrections.length);
for(const x of corr.corrections){const row=(await db.query('select to_jsonb(r) j from company_funding_rounds r where id=$1',[x.key])).rows[0].j;assert.deepEqual(norm(row),norm(x.expected_before));}
await db.query('update company_funding_round_investors set role=$3 where round_id=$1 and investor_research_id=$2',[last.key.round_id,last.key.investor_research_id,last.expected_before.role]);await verify('expected_before');
await db.exec(sql);await verify('expected_after');let c=await counts();assert.equal(c.events,m.rounds.length+corr.corrections.length);assert.equal(c.links,3+m.rounds.reduce((n,r)=>n+r.investors.length,0));assert.equal(c.relationships,m.relationships.length);
await db.exec(sql);assert.deepEqual(await counts(),c);await verify('expected_after');
assert.equal(c.sources,m.rounds.reduce((n,r)=>n+r.sources.length,0)+3+corr.source_additions.length);
await db.exec(corr.reversal_sql);await verify('expected_before');await db.exec(corr.forward_sql);await verify('expected_after');
await assert.rejects(db.exec("update company_funding_round_investors set source_url='https://example.com/unsupported'"),/foreign key constraint/);
const x=m.rounds.find(r=>r.amount);if(x){await db.query('update company_funding_rounds set amount=amount+1 where round_key=$1 and company_id=(select id from companies where slug=$2)',[x.round_key,x.company_slug]);await assert.rejects(db.exec(sql),/Manifest conflicts/);}
console.log(JSON.stringify({combined_fullrow_guards_late_guard_atomicity_reversal_idempotence_and_import_tests:'passed',...c}));
}finally{await db.close()}

