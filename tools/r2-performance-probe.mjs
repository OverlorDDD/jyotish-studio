/** Small read-only local HTTP latency probe, not a load test, Core Web Vitals
 * score or a substitute for production APM and real-user monitoring. */
const origin=process.env.R2_SITE_ORIGIN||'http://127.0.0.1:3000';
const paths=['/uk','/uk/methodology','/uk/learn','/api/health'];
const n=5,report=[];
async function probe(path){
 const start=performance.now();
 const response=await fetch(origin+path,{signal:AbortSignal.timeout(18000),cache:'no-store'});
 await response.arrayBuffer();
 return {status:response.status,ms:performance.now()-start};
}
try{
 for(const path of paths){
  // One warmup lets Next dev compile; measured requests are sequential.
  await probe(path);
  const samples=[];let status=200;
  for(let i=0;i<n;i++){
   const p=await probe(path);samples.push(p.ms);status=p.status;
  }
  samples.sort((a,b)=>a-b);
  report.push({path,status,samples:n,p50Ms:Math.round(samples[Math.floor(n*0.5)]),
   p95Ms:Math.round(samples[Math.ceil(n*0.95)-1]),maxMs:Math.round(samples[n-1])});
 }
 console.log(JSON.stringify({stage:'R2 HTTP observational smoke',origin,results:report,
  note:'5 sequential warmed requests per route only. Measure real Core Web Vitals LCP/INP/CLS and sustained load separately on production hosting.'},null,2));
 if(report.some(x=>x.status!==200))process.exitCode=2;
}catch(e){console.error('[R2] local performance probe failed:',e instanceof Error?e.message:String(e));process.exitCode=1}
