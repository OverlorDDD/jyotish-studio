/** Safety gate before publishing port 3000 through a temporary ngrok tunnel.
 * Supports explicit PUBLIC_DEMO=1 (passwordless) or the default password-protected mode.
 * Never prints secrets and makes no paid inference requests. */
const publicDemo=process.env.PUBLIC_DEMO==='1';
const mode=process.env.AI_MODE||'free';
if(!['free','local'].includes(mode)){
 console.error('BLOCKED: Only AI_MODE=free or AI_MODE=local is permitted in an internet demo. Paid AI must remain disabled.');
 process.exit(1);
}
const user=process.env.DEMO_ACCESS_USER||'';
const password=process.env.DEMO_ACCESS_PASSWORD||'';
if(!publicDemo&&(user.length<3||password.length<14||user.includes(':'))){
 console.error('BLOCKED: Private demo requires DEMO_ACCESS_USER (3+ chars) and a unique DEMO_ACCESS_PASSWORD (14+ chars), or set PUBLIC_DEMO=1 for a passwordless preview.');
 process.exit(1);
}
try{
 const base='http://127.0.0.1:3000';
 const landing=await fetch(base+'/',{redirect:'manual',signal:AbortSignal.timeout(6000)});
 if(publicDemo&&landing.status!==200)
  throw Error(`Passwordless homepage expected HTTP 200; got ${landing.status}. Rebuild Next.js and restart after changing PUBLIC_DEMO.`);
 if(!publicDemo&&landing.status!==401)
  throw Error(`Private homepage expected HTTP 401; got ${landing.status}. Rebuild Next.js and restart after changing PUBLIC_DEMO.`);
 const auth='Basic '+Buffer.from(`${user}:${password}`).toString('base64');
 const allowed=await fetch(base+'/api/health',{
  headers:publicDemo?{}:{Authorization:auth},
  signal:AbortSignal.timeout(6000)
 });
 if(allowed.status!==200)throw Error(`API health expected HTTP 200; got ${allowed.status}`);
 const h=await allowed.json();
 if(h.status!=='ok'||h.service!=='jyotish-nestjs'||h.database!=='connected')
  throw Error('The Next.js proxy or PostgreSQL is not healthy');
 if(publicDemo){
  const swagger=await fetch(base+'/api/docs',{redirect:'manual',signal:AbortSignal.timeout(6000)});
  if(swagger.status!==404)throw Error(`Public demo must hide /api/docs (expected 404, got ${swagger.status})`);
  console.log('PASS: Public demo needs NO username/password; Next.js proxy reaches NestJS + PostgreSQL; Swagger hidden.');
  console.log('NOTICE: This is a temporary, unauthenticated preview. Use only fictional birth data. Stop ngrok when finished.');
 }else{
  console.log('PASS: Private demo is password-protected, same-origin API proxy reaches NestJS + PostgreSQL. Safe to start ngrok http 3000 for a temporary private demonstration.');
 }
}catch(e){
 console.error('BLOCKED: '+String(e instanceof Error?e.message:e));
 process.exitCode=1;
}
