import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {createHandler,CONSENT_VERSION,CONSENT_TEXT} from '../../supabase/functions/landscape-subscribe/handler.mjs';
const sql=readFileSync(new URL('../../supabase/migrations/20261112225915_landscape_subscribers.sql',import.meta.url),'utf8');
test('private subscriber storage enforces consent, deduplication, replay binding and quotas',async()=>{const db=new PGlite();try{
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');await db.exec(sql);await db.exec(sql);
 const submit=(email,id=crypto.randomUUID(),consent=true,ip='daily-hash')=>db.query('select public.subscribe_landscape_updates($1,$2,$3,$4,$5) result',[email,consent,CONSENT_VERSION,ip,id]);
 await db.exec('set role anon');await assert.rejects(db.query('select email from public.landscape_subscribers'),/permission denied/);await assert.rejects(submit('a@example.org'),/permission denied/);await db.exec('reset role');
 await assert.rejects(submit('a@example.org',crypto.randomUUID(),false),/subscription_consent_required/);
 await db.exec('set role service_role');const id=crypto.randomUUID();await submit(' A@Example.org ',id);await submit('a@example.org',id);await assert.rejects(submit('b@example.org',id),/subscription_replay_conflict/);await submit('a@example.org');await submit('a@example.org');await assert.rejects(submit('a@example.org'),/subscription_rate_limit/);await db.exec('reset role');
 const rows=(await db.query('select email,consent_text from public.landscape_subscribers')).rows;assert.equal(rows.length,1);assert.equal(rows[0].email,'a@example.org');assert.equal(rows[0].consent_text,CONSENT_TEXT);
 await db.exec('set role authenticated');await assert.rejects(db.query('select * from public.landscape_subscription_requests'),/permission denied/);await db.exec('reset role');
 for(let i=0;i<17;i++)await submit(`person${i}@example.org`);await assert.rejects(submit('next@example.org'),/subscription_rate_limit/);
 }finally{await db.close()}});
test('public handler requires a signed, aged proof and rejects bots and missing consent',async()=>{
 let time=Date.now(),calls=0,saved;const handler=createHandler({serviceKey:'test-only-key',url:'https://example.supabase.co',now:()=>time,fetchFn:async(url,opts)=>{calls++;saved=JSON.parse(opts.body);return new Response(JSON.stringify({ok:true}),{status:200})}});
 const headers={origin:'https://xsonomy.com','content-type':'application/json'};
 const post=body=>handler(new Request('https://example.org',{method:'POST',headers,body:JSON.stringify(body)}));
 assert.equal((await handler(new Request('https://example.org',{headers:{origin:'https://elsewhere.example'}}))).status,403);
 const challenge=await(await handler(new Request('https://example.org',{headers}))).json();let solution;
 for(let i=0;i<2000000;i++){const d=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(challenge.token.split('.')[0]+':'+i)));if(!d[0]&&!d[1]){solution=i;break}}
 assert.ok(Number.isSafeInteger(solution));const body={email:' Person@Example.org ',consent:true,consentVersion:CONSENT_VERSION,token:challenge.token,solution};
 assert.equal((await post(body)).status,400);time+=2000;assert.equal((await post({...body,contactWebsite:'bot.example'})).status,400);assert.equal((await post({...body,consent:false})).status,400);assert.equal((await post({...body,token:'tampered.token'})).status,400);assert.equal(calls,0);
 assert.equal((await post(body)).status,200);assert.equal(calls,1);assert.equal(saved.p_email,'person@example.org');assert.equal(saved.p_consent,true);assert.equal('p_message' in saved,false);time+=600001;assert.equal((await post(body)).status,400);
});
