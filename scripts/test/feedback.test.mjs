import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {createHandler,CONSENT_VERSION,CONSENT_TEXT} from '../../supabase/functions/landscape-feedback/handler.mjs';
import {sendNotifications,notificationBody} from '../feedback-notifications.mjs';
const sql=readFileSync(new URL('../../supabase/migrations/20261112184634_landscape_feedback.sql',import.meta.url),'utf8');
const origin='https://xsonomy.com',url='https://test.supabase.co',ip='203.0.113.5';
const headers={origin,'x-forwarded-for':ip,'content-type':'application/json'};
async function solve(token){for(let n=0;n<2000000;n++){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token.split('.')[0]+':'+n)));if(bytes[0]===0&&bytes[1]===0)return n}throw Error('No test solution')}

test('feedback inbox enforces private access, consent, atomic quotas, replay and outbox leases',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');await db.exec(sql);await db.exec(sql);
  const submit=(email,challenge=crypto.randomUUID(),consent=true,msg='A useful suggestion with a source link.')=>db.query('select public.submit_landscape_feedback($1,$2,$3,$4,$5,$6) as result',[email,msg,consent,CONSENT_VERSION,'a'.repeat(43),challenge]);
  await db.exec('set role anon');await assert.rejects(db.query('select email from public.landscape_feedback'),/permission denied/);await assert.rejects(submit('a@example.com'),/permission denied/);await db.exec('reset role');
  await assert.rejects(submit('a@example.com',crypto.randomUUID(),false),/feedback_consent_required/);
  const id=crypto.randomUUID();const first=(await submit('a@example.com',id)).rows[0].result;const again=(await submit('a@example.com',id)).rows[0].result;assert.equal(first.id,again.id);assert.equal(again.duplicate,true);
  await assert.rejects(submit('a@example.com',id,true,'A changed message on the same challenge'),/feedback_replay_conflict/);
  await submit('a@example.com');await submit('a@example.com');await assert.rejects(submit('a@example.com'),/feedback_rate_limit/);
  const {rows:[stored]}=await db.query('select * from public.landscape_feedback where id=$1',[first.id]);assert.equal(stored.consent_text,CONSENT_TEXT);assert.equal(stored.notification_status,'pending');
  const claimed=(await db.query('select * from public.claim_landscape_feedback_notifications(1)')).rows;assert.equal(claimed.length,1);const row=claimed[0];assert.equal(row.notification_attempts,1);
  const others=(await db.query('select * from public.claim_landscape_feedback_notifications(20)')).rows;assert.equal(others.length,2);assert.ok(!others.some(r=>r.id===row.id));
  await assert.rejects(db.query('select public.finish_landscape_feedback_notification($1,$2,$3,$4)',[row.id,crypto.randomUUID(),'provider-1',null]),/feedback_lease_lost/);
  await db.query('select public.finish_landscape_feedback_notification($1,$2,$3,$4)',[row.id,row.notification_lease_token,null,'resend_http_503']);assert.equal((await db.query('select notification_status from public.landscape_feedback where id=$1',[row.id])).rows[0].notification_status,'pending');
  await db.exec("update public.landscape_feedback set notification_next_attempt_at=now()-interval '1 minute' where notification_status='pending'");
  const retry=(await db.query('select * from public.claim_landscape_feedback_notifications(1)')).rows[0];await db.query('select public.finish_landscape_feedback_notification($1,$2,$3,$4)',[retry.id,retry.notification_lease_token,'provider-1',null]);assert.equal((await db.query('select notification_status from public.landscape_feedback where id=$1',[retry.id])).rows[0].notification_status,'sent');
 }finally{await db.close()}
});

test('public endpoint rejects absent consent, spam trap, forged and replay-unbound proof before storage',async()=>{
 let time=Date.now(),calls=[];const handler=createHandler({serviceKey:'test-only-secret',url,now:()=>time,fetchFn:async(u,init)=>{calls.push(JSON.parse(init.body));return Response.json({id:'saved'})}});
 const request=(body,extra={})=>handler(new Request(url,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)}));
 const challenge=await (await handler(new Request(url,{headers}))).json();const solution=await solve(challenge.token);time+=2000;
 const valid={email:'hello@example.com',message:'Please add a missing company.',consent:true,consentVersion:CONSENT_VERSION,token:challenge.token,solution};
 assert.equal((await request({...valid,consent:false})).status,400);assert.equal((await request({...valid,contactWebsite:'https://spam.test'})).status,400);assert.equal((await request({...valid,token:challenge.token+'x'})).status,400);assert.equal((await request(valid,{origin:'https://evil.test'})).status,403);assert.equal(calls.length,0);
 assert.equal((await request({...valid,solution:-1})).status,400);assert.equal(calls.length,0);
 assert.equal((await request(valid)).status,200);assert.equal(calls.length,1);assert.equal(calls[0].p_consent,true);assert.equal(calls[0].p_consent_version,CONSENT_VERSION);
 time+=600001;assert.equal((await request(valid)).status,400);assert.equal(calls.length,1);
});

test('notification worker sends only to owner with stable idempotency, reply-to, and safe failure retry',async()=>{
 const rows=[{id:crypto.randomUUID(),email:'person@example.com',message:'<script>untrusted</script>',created_at:'2026-11-12',consented_at:'2026-11-12',consent_version:CONSENT_VERSION,consent_text:CONSENT_TEXT,notification_lease_token:crypto.randomUUID()}];const operations=[];let posts=[];
 const rpc=async(name,args)=>{operations.push([name,args]);return name==='claim_landscape_feedback_notifications'?rows:null};
 const run=await sendNotifications({rpc,key:'test',from:'Owner <owner@example.com>',fetchFn:async(url,init)=>{posts.push(init);return Response.json({id:'resend-1'})}});assert.equal(run.sent,1);const body=JSON.parse(posts[0].body);assert.deepEqual(body.to,['brntaut@gmail.com']);assert.equal(body.reply_to,'person@example.com');assert.equal(body.html,undefined);assert.match(body.text,/<script>untrusted<\/script>/);assert.equal(posts[0].headers['Idempotency-Key'],'landscape-feedback/'+rows[0].id);assert.equal(operations.at(-1)[1].p_provider_id,'resend-1');
 const failed=await sendNotifications({rpc,key:'test',fetchFn:async()=>new Response('private provider details',{status:503})});assert.equal(failed.failed,1);assert.equal(operations.at(-1)[1].p_error,'resend_http_503');assert.doesNotMatch(JSON.stringify(operations),/private provider details/);
 assert.deepEqual(notificationBody(rows[0],'sender').to,['brntaut@gmail.com']);let dryCalls=0;await sendNotifications({dry:true,rpc:async()=>{dryCalls++}});assert.equal(dryCalls,0);
});
