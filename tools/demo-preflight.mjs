/** Before publishing port 3000 via ngrok. Never prints secrets. */
const user=process.env.DEMO_ACCESS_USER||'';
const password=process.env.DEMO_ACCESS_PASSWORD||'';
if(user.length<3||password.length<14||user.includes(':')){
 console.error('BLOCKED: Configure DEMO_ACCESS_USER (3+ chars) and unique DEMO_ACCESS_PASSWORD (14+ chars) in root .env first.');
 process.exit(1);
}
if(process.env.OPENAI_ENABLED==='1')console.warn('WARNING: Paid OpenAI calls are enabled. Each visitor may use your limited AI budget. Consider OPENAI_ENABLED=0 for public demos.');
try{
 const r=await fetch('http://127.0.0.1:3000/',{redirect:'manual',signal:AbortSignal.timeout(5000)});
 if(r.status!==401)throw Error(`Frontend authentication expected 401; received ${r.status}. Restart Next.js after editing .env.`);
 const auth='Basic '+Buffer.from(`${user}:${password}`).toString('base64');
 const allowed=await fetch('http://127.0.0.1:3000/api/health',{headers:{Authorization:auth},signal:AbortSignal.timeout(5000)});
 const h=await allowed.json();
 if(allowed.status!==200||h.status!=='ok'||h.service!=='jyotish-nestjs'||h.database!=='connected')throw Error(`Authenticated proxy health failed: HTTP ${allowed.status}`);
 console.log('PASS: Private demo is password-protected, same-origin API proxy reaches NestJS + PostgreSQL. Safe to start ngrok http 3000 for a temporary private demonstration.');
}catch(e){console.error('BLOCKED: '+String(e instanceof Error?e.message:e));process.exitCode=1;}
