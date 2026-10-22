/**
 * A7.3 one-shot live connectivity and factual chapter smoke check.
 * Uses synthetic astrological themes ONLY; prints provider/model and pass/fail,
 * never API keys, user birth data, or unfiltered external provider output.
 */
import {generateResilientFreeConsultation} from '../apps/api/src/resilient-consultation.ts';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {buildInterpretationV3} from '../apps/api/src/interpretation-v3.ts';
import {generateConsultationIntelligence} from '../apps/api/src/consultation-intelligence.ts';
import {CHAPTER_IDS} from '../apps/api/src/consultation-ai.ts';

const fake={ascendant:{sign:4,signName:'Cancer'},d1:[],dasha:[],input:{
 date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0}};
const chapterIdeas=[
 'The first lord and lunar privacy are both verified; show the tension between caring for others and keeping emotional boundaries.',
 'Verified clustering of Sun, Mars, Mercury and Saturn in the dharma area: combine impulse, intellect and patience into a coherent symbolic motif.',
 'Verified Sun/Moon differences and Mars/Saturn combined themes: explain complementarity and internal tensions without destiny claims.',
 'Verified D1 seventh ruler and D9 Venus indicate different traditional layers of relationship needs, not guaranteed marriage.',
 'Verified tenth ruler and D10 career ruler offer a connection between meaningful vocation and craftsmanship.',
 'Verified second and eleventh ruler themes associate resources with long-term work and community, not specific money totals.',
 'Verified Saturn and Moon planetary-period themes: explain the rhythm of effort and reflection without an event forecast.',
 'Summarize confirmed personal orientation, counterweights, relationship and vocation themes in coherent Jyotish language.'
];
const chapters=CHAPTER_IDS.map((id,i)=>({
 id,title:id,facts:[chapterIdeas[i], 'Rule-grounded traditional context only; no new chart facts or invented dates.']
}));
// Show only provider eligibility and nonsecret IDs so 'skipped Groq' is actionable.
const order=(process.env.FREE_AI_ORDER||'gemini,groq,openrouter').split(',').map(x=>x.trim());
console.log('Cloud model check (only configured free-tier providers will be contacted):');
for(const p of order){
 const key=p==='gemini'?'GEMINI_API_KEY':p==='groq'?'GROQ_API_KEY':p==='openrouter'?'OPENROUTER_API_KEY':'';
 const flag=p==='gemini'?'GEMINI_FREE_TIER_CONFIRMED':p==='groq'?'GROQ_FREE_TIER_CONFIRMED':null;
 const reason=!key?'unsupported or disabled legacy provider':
  !process.env[key]?.trim()?'MISSING_KEY':
  flag&&process.env[flag]!=='1'?'FREE_TIER_NOT_CONFIRMED':'READY';
 console.log('  '+p+': '+reason+(p==='gemini'&&reason==='READY'?' (model gemini-3.1-flash-lite)':''));
}
if(process.env.AI_MODE==='local'||process.env.AI_MODE==='paid_openai'){
 console.error('FAIL: Set AI_MODE=free. This script never enables billed OpenAI models.');
 process.exitCode=2;
}else{
 try{
  const preview=process.env.GALAXIORA_A89_PREVIEW==='1';
  console.log('Mode='+(preview?'A8.9 unified author + editor':'Reader V5 enrichment'));
  const asOf=new Date().toISOString().slice(0,10);
  const synthetic=preview?calculateChart(fake.input,{
   ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',
   positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
    .map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))
  }):null;
  const r=preview?await generateConsultationIntelligence(synthetic,'uk',asOf,buildInterpretationV3(synthetic,'uk',asOf)):
   await generateResilientFreeConsultation(fake,'uk',{chapterSpecs:chapters,reportMode:true});
  if(!r.result){
   console.error('FAIL: no accepted external LLM consultation. Reason='+r.reason);
   console.error('Check provider READY/MISSING_KEY/FREE_TIER_NOT_CONFIRMED statuses above. Gemini uses gemini-3.1-flash-lite; Groq requires explicit FREE plan confirmation; OpenRouter long responses may time out.');
   console.error('Offline Jyotish charts still work. Live inference is NOT verified.');
   process.exitCode=1;
  }else{
   const count=r.result.chapters?.length||0;
   console.log('PASS: received and validated a real model consultation.');
   console.log('Provider='+r.result.provider+'; model='+r.result.model);
   console.log('Accepted AI chapters='+count+'/8. '+(preview?'Unified document passed author and editor gates.':'Incomplete chapters retain deterministic Reader V5 prose.'));
   console.log('No private birth information or provider response content was printed.');
  }
 }catch(error){
  console.error('FAIL: live provider check failed. Diagnostic='+(error instanceof Error?error.name:'Unknown'));
  process.exitCode=1;
 }
}
