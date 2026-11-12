import {pathToFileURL} from 'node:url';
import {feedbackRpc} from './lib/supabase.mjs';
export const FEEDBACK_TO='brntaut@gmail.com';
export function notificationBody(row,from){
 return {from,to:[FEEDBACK_TO],reply_to:row.email,subject:`xSonomy landscape suggestion · ${row.id.slice(0,8)}`,
 text:`New landscape suggestion\n\nFrom: ${row.email}\nSubmitted: ${row.created_at}\nReference: ${row.id}\n\n${row.message}\n\n---\nConsent accepted: ${row.consented_at}\nConsent version: ${row.consent_version}\n${row.consent_text}\n\nSaved privately in Supabase: public.landscape_feedback.\n`};
}
export async function sendNotifications({rpc=feedbackRpc,fetchFn=fetch,key=process.env.RESEND_API_KEY,from=process.env.DIGEST_FROM||'UAV360 News <news@uav360.xyz>',dry=false}={}){
 if(dry)return {dry:true,claimed:0,sent:0,failed:0};
 if(!key)throw new Error('RESEND_API_KEY is not configured');
 const rows=await rpc('claim_landscape_feedback_notifications',{p_limit:20});let sent=0,failed=0;
 for(const row of rows){
  let providerId=null,error=null;
  try {
   const res=await fetchFn('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`landscape-feedback/${row.id}`},body:JSON.stringify(notificationBody(row,from)),signal:AbortSignal.timeout(15000)});
   if(!res.ok)error=`resend_http_${res.status}`;
   else {const body=await res.json();if(typeof body.id==='string'&&body.id.length<200)providerId=body.id;else error='resend_bad_response'}
  }catch{error='resend_network'}
  await rpc('finish_landscape_feedback_notification',{p_id:row.id,p_lease_token:row.notification_lease_token,p_provider_id:providerId,p_error:error});
  if(providerId)sent++;else failed++;
 }
 return {claimed:rows.length,sent,failed};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=await sendNotifications({dry:process.argv.includes('--dry')});console.log(JSON.stringify(result));if(result.failed)process.exitCode=1}catch{console.error('Feedback notifications failed; records remain in the private inbox for retry.');process.exitCode=1}
}
