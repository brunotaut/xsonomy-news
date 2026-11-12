export const CONSENT_VERSION='2026-11-12';
export const CONSENT_TEXT='I agree that xSonomy may store and process my email address and message to review my suggestion and contact me about it. I have read the privacy information below.';
const ORIGINS=new Set(['https://xsonomy.com','https://www.xsonomy.com']);
const enc=new TextEncoder();
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unbase64=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export function validEmail(s){return typeof s==='string'&&s.length<=254&&!/[\r\n\s]/.test(s)&&/^[^@]+@[^@.]+(?:\.[^@.]+)+$/.test(s)}
export function validMessage(s){return typeof s==='string'&&s.trim().length>=10&&s.trim().length<=10000&&!s.includes('\0')}
export function proofMatches(bytes,bits=16){let n=bits;for(const b of new Uint8Array(bytes)){if(n<=0)return true;const take=Math.min(n,8);if(b>>>(8-take))return false;n-=take}return n<=0}
async function bodyJson(req){const reader=req.body?.getReader();if(!reader)throw Error('bad_body');let size=0,chunks=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw Error('too_large')}chunks.push(value)}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}return JSON.parse(new TextDecoder().decode(bytes))}
export function createHandler({serviceKey,url,fetchFn=fetch,now=()=>Date.now()}){
 let keyPromise;
 const key=()=>keyPromise??=crypto.subtle.importKey('raw',enc.encode('landscape-feedback-v1:'+serviceKey),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 const sign=async s=>base64url(await crypto.subtle.sign('HMAC',await key(),enc.encode(s)));
 return async function handler(req){
  const origin=req.headers.get('origin')||'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':ORIGINS.has(origin)?origin:'null','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'content-type','X-Content-Type-Options':'nosniff'};
  const reply=(status,body,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});
  if(!ORIGINS.has(origin))return reply(403,{error:'Please use the form on xsonomy.com.'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!serviceKey||!url)return reply(503,{error:'The form is temporarily unavailable. Please try again later.'});
  // No raw connection address is persisted. Email and global quotas also apply:
  // forwarded address headers alone must never be treated as authenticated identity.
  const ip=(req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||'unknown').split(',').at(-1).trim().slice(0,128);
  const ipHash=await sign('rate:'+new Date(now()).toISOString().slice(0,10)+':'+ip);
  if(req.method==='GET'){
   const issued=now(),payload=base64url(enc.encode(JSON.stringify({v:1,id:crypto.randomUUID(),issued,expires:issued+600000,bits:16})));
   return reply(200,{token:payload+'.'+await sign(payload),difficulty:16,consentVersion:CONSENT_VERSION});
  }
  if(req.method!=='POST')return reply(405,{error:'Method not allowed.'},{Allow:'GET, POST, OPTIONS'});
  if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply(415,{error:'Invalid submission format.'});
  try{
   const data=await bodyJson(req);
   if(!data||typeof data!=='object'||Array.isArray(data))return reply(400,{error:'Please check your message and try again.'});
   if(data.contactWebsite)return reply(400,{error:'Please check your message and try again.'});
   const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
   const message=typeof data.message==='string'?data.message.trim():'';
   if(!validEmail(email)||!validMessage(message))return reply(400,{error:'Enter a valid email address and a message between 10 and 10,000 characters.'});
   if(data.consent!==true||data.consentVersion!==CONSENT_VERSION)return reply(400,{error:'Please agree to the privacy information before sending.'});
   if(typeof data.token!=='string'||data.token.length>1500||!Number.isSafeInteger(data.solution)||data.solution<0)return reply(400,{error:'The spam check expired. Please try sending again.',retryChallenge:true});
   const parts=data.token.split('.');if(parts.length!==2)throw Error('invalid_challenge');
   const [payload,signature]=parts;
   if(!await crypto.subtle.verify('HMAC',await key(),unbase64(signature),enc.encode(payload)))throw Error('invalid_challenge');
   const c=JSON.parse(new TextDecoder().decode(unbase64(payload)));
   if(c.v!==1||c.bits!==16||!/^[-a-f0-9]{36}$/.test(c.id)||c.expires<now()||c.issued>now()||now()-c.issued<1500)throw Error('invalid_challenge');
   if(!proofMatches(await crypto.subtle.digest('SHA-256',enc.encode(payload+':'+data.solution)),16))throw Error('invalid_challenge');
   const res=await fetchFn(url+'/rest/v1/rpc/submit_landscape_feedback',{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify({p_email:email,p_message:message,p_consent:true,p_consent_version:CONSENT_VERSION,p_ip_hash:ipHash,p_challenge_id:c.id}),signal:AbortSignal.timeout(12000)});
   if(!res.ok){const err=await res.json().catch(()=>({}));if(err.message==='feedback_rate_limit')return reply(429,{error:'You have sent several messages recently. Please try again later.'},{'Retry-After':'3600'});if(err.message==='feedback_replay_conflict')return reply(409,{error:'Please try sending again with a fresh spam check.',retryChallenge:true});throw Error('storage_failed')}
   const result=await res.json();
   return reply(200,{ok:true,reference:result.id,message:'Thank you — your suggestion has been saved.'});
  }catch(err){if(['invalid_challenge','bad_body','too_large'].includes(err.message)||err instanceof SyntaxError||err instanceof DOMException)return reply(400,{error:'The spam check expired or could not be verified. Please try sending again.',retryChallenge:true});
   // Never log the request body, email, message or database/provider error payload.
   console.error('landscape-feedback: submission could not be confirmed');
   return reply(503,{error:'We could not confirm your submission. Your text is still here; please try again.'});
  }
 };
}
