/**
 * A7.3 one-shot live connectivity and factual chapter smoke check.
 * Uses synthetic astrological themes ONLY; prints provider/model and pass/fail,
 * never API keys, user birth data, or unfiltered external provider output.
 */
import {generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';
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
if(process.env.AI_MODE==='local'||process.env.AI_MODE==='paid_openai'){
 console.error('FAIL: Set AI_MODE=free. This script never enables billed OpenAI models.');
 process.exitCode=2;
}else{
 try{
  const r=await generateFreeInterpretationDetailed(fake,'uk',{chapterSpecs:chapters,reportMode:true});
  if(!r.result){
   console.error('FAIL: no accepted external LLM consultation. Reason='+r.reason);
   console.error('Review sanitized provider details above; if OpenRouter returns malformed JSON/HTML, use a verified free Gemini key or a pinned :free model.');
   console.error('Offline Jyotish charts still work. Live inference is NOT verified.');
   process.exitCode=1;
  }else{
   const count=r.result.chapters?.length||0;
   console.log('PASS: received and validated a real model consultation.');
   console.log('Provider='+r.result.provider+'; model='+r.result.model);
   console.log('Accepted AI chapters='+count+'/8. Missing chapters would be filled by distinctly labeled deterministic material.');
   console.log('No private birth information or provider response content was printed.');
  }
 }catch(error){
  console.error('FAIL: live provider check failed. Diagnostic='+(error instanceof Error?error.name:'Unknown'));
  process.exitCode=1;
 }
}
