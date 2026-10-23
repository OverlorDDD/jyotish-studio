/** One real cloud call using synthetic chart data and current direct pipeline, no LLM text or private inputs logged. */
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {generateDirectJyotish,DIRECT_JYOTISH_VERSION,compactJyotishFacts} from '../apps/api/src/direct-jyotish.ts';
const input={date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0};
const positions=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
 .map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}));
const chart=calculateChart(input,{ayanamsa:23.8,ascendant:100,positions,julianDay:2451545,backend:'synthetic'});
console.log('Mode='+DIRECT_JYOTISH_VERSION+' single-completion, compactFactsCharacters='+compactJyotishFacts(chart,'2026-10-22').length);
for(const [name,enabled,key] of [
 ['gemini',process.env.GEMINI_FREE_TIER_CONFIRMED==='1',process.env.GEMINI_API_KEY],
 ['groq',process.env.GROQ_FREE_TIER_CONFIRMED==='1',process.env.GROQ_API_KEY],
 ['openrouter',true,process.env.OPENROUTER_API_KEY]
]){
 console.log(name+': '+(enabled&&key?'READY':'MISSING_OR_UNCONFIRMED'));
}
const result=await generateDirectJyotish(chart,'uk','2026-10-22');
if(!result.result){
 console.error('FAIL: direct cloud result unavailable, reason='+result.reason+'; Reader v6 remains ready.');
 process.exitCode=1;
}else{
 const words=result.result.text.split(/\s+/).length;
 const headings=[...result.result.text.matchAll(/^#{1,3}\s+/gm)].length;
 console.log('PASS: provider='+result.result.provider+', model='+result.result.model+', words='+words+', headings='+headings+', finished=true.');
 console.log("Check the site's real birth chart separately for literary acceptance and factual alignment.");
}
