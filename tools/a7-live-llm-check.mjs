/**
 * A deliberate live connectivity smoke test. Uses invented chart facts only.
 * Makes at most one initial call per provider, plus one OpenRouter schema retry.
 * This is NOT part of CI: CI uses deterministic mocked provider responses.
 */
import {generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';

const fake={ascendant:{signName:'Cancer'},d1:[],dasha:[],input:{
 date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0}};
const facts=[
 {id:'ascendant',fact:'Verified test-only finding: Rising Cancer, Moon as first lord. Discuss the inward and outward orientation of responsibility and care without listing positions.'},
 {id:'moon',fact:'Verified test-only finding: The Moon emphasizes emotional privacy while the Sun emphasizes work. Explain the tension, without inventing another planet position.'},
 {id:'partnership',fact:'Verified test-only finding: partnership themes and personal boundaries are intertwined. Interpret traditional Venus and Moon principles without claiming a future marriage.'},
 {id:'vocation',fact:'Verified test-only finding: career and dharma are linked; explain meaningful work and continuity without citing invented exact coordinates.'}
];
if(process.env.AI_MODE==='local'){
 console.error('FAIL: AI_MODE=local means no cloud LLM will ever run. Set AI_MODE=free to verify.');
 process.exitCode=2;
}else if(process.env.AI_MODE==='paid_openai'){
 console.error('FAIL: paid mode is not permitted by the free live-check command.');
 process.exitCode=2;
}else{
 try{
  const r=await generateFreeInterpretationDetailed(fake,'uk',{factsOverride:facts,reportMode:true});
  if(!r.result){
   console.error('FAIL: no accepted external LLM output. Reason='+r.reason);
   console.error('The deterministic report can still work; this does NOT prove a live model is connected.');
   process.exitCode=1;
  }else{
   console.log('PASS: an actual model response was fetched and accepted.');
   console.log('Provider='+r.result.provider+'; model='+r.result.model);
   console.log('Accepted characters='+r.result.text.length);
   console.log('No personal birth data or API keys have been printed.');
  }
 }catch(error){
  console.error('FAIL: an external model did not produce an accepted response.');
  console.error(error instanceof Error?error.name:'Unknown error');
  process.exitCode=1;
 }
}
