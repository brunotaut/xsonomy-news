import {createHandler} from './handler.mjs';
Deno.serve(createHandler({serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',url:(Deno.env.get('SUPABASE_URL')||'').replace(/\/$/,'')}));
