/** Real one-chart cloud check; no birth identifiers, prompts, response text or secrets logged.
 * To restrict calls to a single provider: AI_LIVE_PROVIDER=gemini|groq|openrouter.
 * CONFIGURED means keys + free-tier opt-in, not that a provider is reachable.
 */
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {generateDirectJyotish,DIRECT_JYOTISH_VERSION,compactJyotishFacts} from '../apps/api/src/direct-jyotish.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
const input={date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0};
const positions=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
 .map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}));
const calculated=calculateChart(input,{ayanamsa:23.8,ascendant:100,positions,julianDay:2451545,backend:'synthetic'});
const proof={version:'jyotish-integrity-v3',status:'verified_internal',
 digest:'a'.repeat(64),externalReferenceChecked:false,checks:['synthetic_unit_source']};
const chart={...calculated,verification:proof,
 n4:makeN4RcPayload(calculated,proof),n4D60:makeN4D60Candidate(calculated,proof)};
const choice=(process.env.AI_LIVE_PROVIDER||'').trim().toLowerCase();
const available=['gemini','groq','openrouter'];
if(choice&&!available.includes(choice)){
 console.error('Invalid AI_LIVE_PROVIDER. Allowed: gemini, groq, openrouter.');
 process.exitCode=2;
}else{
 console.log('Mode='+DIRECT_JYOTISH_VERSION+', data=FICTIONAL_CHART, factsCharacters='+compactJyotishFacts(chart,'2026-10-22').length);
 console.log('N501_SYNTHETIC_N4_VERIFIED=16_SOURCE_BOUND_CHARTS');
 for(const [name,enabled,key] of [
  ['gemini',process.env.GEMINI_FREE_TIER_CONFIRMED==='1',process.env.GEMINI_API_KEY],
  ['groq',process.env.GROQ_FREE_TIER_CONFIRMED==='1',process.env.GROQ_API_KEY],
  ['openrouter',true,process.env.OPENROUTER_API_KEY]
 ]){
  console.log(name+': '+(enabled&&key?'CONFIGURED':'MISSING_OR_UNCONFIRMED')+' (not a connectivity check)');
 }
 if(choice)console.log('Testing ONLY '+choice+'; no requests to other providers.');
 const failures=[];
 const result=await generateDirectJyotish(chart,'uk','2026-10-22',{
  ...(choice?{order:[choice]}:{}),
  onDiagnostic:event=>{
   if(event.stage==='success'){
    console.log('PROVIDER PASS: '+event.provider+' completed a validated response.');
    return;
   }
   const status=event.httpStatus===undefined?'':' HTTP '+event.httpStatus;
   const code=event.stage+':'+event.reason+status;
   failures.push(event.provider+' '+code);
   console.log('PROVIDER CHECK: '+event.provider+' '+code);
  }
 });
 if(!result.result){
  console.error('FAIL: no completed cloud interpretation for the FICTIONAL diagnostic chart. Last reason='+result.reason+'.');
  console.error('Important: this does not invalidate a previously successful real-site Gemini response.');
  process.exitCode=1;
 }else{
  const words=result.result.text.split(/\s+/).length;
  const headings=[...result.result.text.matchAll(/^#{1,3}\s+/gm)].length;
  console.log('PASS: provider='+result.result.provider+', model='+result.result.model+', words='+words+', headings='+headings+'.');
  console.log("This checks the cloud path, not independent correctness of astronomical calculations or literary quality.");
 }
}
