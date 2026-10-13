/** One public website: guest tools, private accounts. No paid calls in this check. */
const base='http://127.0.0.1:3000';
const mode=process.env.AI_MODE||'free';
if(!['free','local'].includes(mode)){
 console.error('BLOCKED: Use AI_MODE=free or AI_MODE=local; public site check never approves paid OpenAI.');
 process.exit(1);
}
if(!process.env.AUTH_SECRET||process.env.AUTH_SECRET.trim().length<32){
 console.error('BLOCKED: Set AUTH_SECRET to a unique random 32+ character value in root .env before enabling registration.');
 process.exit(1);
}
try{
 const homepage=await fetch(base+'/',{signal:AbortSignal.timeout(6000),redirect:'manual'});
 if(homepage.status!==200)throw Error('Guest homepage must return 200, got '+homepage.status);
 const health=await fetch(base+'/api/health',{signal:AbortSignal.timeout(6000)});
 const h=await health.json();
 if(health.status!==200||h.status!=='ok'||h.database!=='connected')
  throw Error('NestJS/Prisma health failed, HTTP '+health.status);
 const me=await fetch(base+'/api/v1/account/me',{signal:AbortSignal.timeout(6000)});
 const account=await me.json();
 if(me.status!==200||account.user!==null)throw Error('Unauthenticated account session should be empty.');
 const privateHistory=await fetch(base+'/api/v1/account/charts',{signal:AbortSignal.timeout(6000)});
 if(privateHistory.status!==401)throw Error('Saved history must reject guests with HTTP 401.');
 const doc=await fetch(base+'/api/docs',{signal:AbortSignal.timeout(6000)});
 if(doc.status!==404)throw Error('Public proxy must hide Swagger, got HTTP '+doc.status);
 console.log('PASS: One public site: guest page 200, NestJS/Postgres healthy, guest history 401, Swagger hidden.');
 console.log('NOTE: This verifies access boundaries, NOT signup email validation or OpenRouter availability.');
}catch(error){
 console.error('BLOCKED: '+(error instanceof Error?error.message:String(error)));
 process.exitCode=1;
}
