/** Read-only GalaxiCom HTTP probe; never creates test users or posts. */
const base=(process.env.COM_LOAD_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const concurrency=Math.min(30,Math.max(1,Number(process.env.COM_LOAD_CONCURRENCY||5)));
const runs=Math.min(500,Math.max(1,Number(process.env.COM_LOAD_REQUESTS||100)));
if(!Number.isSafeInteger(concurrency)||!Number.isSafeInteger(runs))throw Error('Invalid probe configuration');
const paths=['/api/v1/com/categories','/api/v1/com/threads?page=1&sort=active'];
let index=0,success=0,failed=0;const durations=[];
const start=Date.now();
async function worker(){
 while(true){
  const n=index++;
  if(n>=runs)return;
  const t=Date.now();
  try{
   const response=await fetch(base+paths[n%paths.length],{signal:AbortSignal.timeout(8000)});
   if(!response.ok)failed++;else success++;
  }catch{failed++}
  durations.push(Date.now()-t);
 }
}
await Promise.all(Array.from({length:concurrency},()=>worker()));
durations.sort((a,b)=>a-b);
const p95=durations[Math.ceil(durations.length*.95)-1]||0;
const report={requests:runs,success,failed,concurrency,p95Ms:p95,seconds:(Date.now()-start)/1000,readonly:true};
console.info(JSON.stringify(report));
if(failed||p95>2000)process.exitCode=1;
