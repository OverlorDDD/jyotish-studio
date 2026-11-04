/** CI-ONLY provider stand-ins. Never loaded in production.
 * They verify OTP/server behavior without calling external Turnstile or Resend. */
import {writeFileSync} from 'node:fs';
const url=new URL(process.env.DATABASE_URL||'postgresql://localhost/invalid');
if(process.env.CI!=='true'||
   process.env.GALAXIORA_SIGNUP_CI_MOCK!=='1'||
   url.pathname!=='/galaxiora_a1_test'||
   !['localhost','127.0.0.1'].includes(url.hostname)||
   process.env.PORT!=='45698')
 throw Error('REFUSE: mock providers may only run inside disposable signup HTTP CI');
const realFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const address=typeof input==='string'?input:input instanceof URL?String(input):input?.url;
 if(address==='https://challenges.cloudflare.com/turnstile/v0/siteverify'){
  const body=JSON.parse(init.body);
  const ok=body.secret==='ci-secret-key'&&body.response==='ci-good-token';
  return new Response(JSON.stringify({success:ok,
   hostname:ok?'galaxiora.com':undefined,action:ok?'register':undefined}),
   {status:200,headers:{'Content-Type':'application/json'}});
 }
 if(address==='https://api.resend.com/emails'){
  const body=JSON.parse(init.body);
  const match=/Код підтвердження:\s*(\d{6})/.exec(body.text||'');
  if(init.headers?.Authorization!=='Bearer re_ci-local-fake'||
     body.from!=='verify@mail.galaxiora.com'||
     !/^ci-signup-[0-9a-f-]+@example\.com$/.test(body.to?.[0]||'')||
     body.to?.length!==1||!match)
   return new Response(JSON.stringify({message:'invalid CI send'}),{status:400});
  writeFileSync(process.env.GALAXIORA_SIGNUP_OTP_FILE,match[1],{mode:0o600});
  return new Response(JSON.stringify({id:'ci-email'}),{status:200});
 }
 return realFetch(input,init);
};
