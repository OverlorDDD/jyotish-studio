/**
 * Read-only AI provider readiness check. No key values, env file contents,
 * personal charts, prompts or upstream response bodies ever reach stdout.
 */
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const PROVIDER_ORDER=['gemini','groq','openrouter'];
const providerSettings={
 gemini:['GEMINI_API_KEY','GEMINI_FREE_TIER_CONFIRMED'],
 groq:['GROQ_API_KEY','GROQ_FREE_TIER_CONFIRMED'],
 openrouter:['OPENROUTER_API_KEY',null]
};
export function inspectFreeAiConfiguration(env){
 const mode=env.AI_MODE||'free';
 const readerOnly=env.GALAXIORA_READER_ONLY==='1';
 const providerStates=PROVIDER_ORDER.map(name=>{
  const [key,confirmation]=providerSettings[name];
  const present=Boolean(env[key]?.trim());
  const verified=!confirmation||env[confirmation]==='1';
  const state=!present?'MISSING_KEY':!verified?'FREE_TIER_NOT_CONFIRMED':'READY';
  return {name,state};
 });
 const ready=providerStates.filter(x=>x.state==='READY');
 const blocker=mode!=='free'?'AI_MODE_NOT_FREE':readerOnly?'READER_ONLY_ENABLED':
  !ready.length?'NO_ELIGIBLE_PROVIDER':null;
 return {mode:mode==='free'?'free':'not-free',readerOnly,order:[...PROVIDER_ORDER],
  providerStates,readyCount:ready.length,blocker};
}
function main(){
 const envFile=resolve(process.cwd(),'.env');
 if(existsSync(envFile)){
  try{process.loadEnvFile(envFile);}catch{console.error('N499_CONFIG: ENV_READ_FAILED');process.exitCode=2;return;}
 }else console.warn('N499_CONFIG: ENV_FILE_MISSING');
 const state=inspectFreeAiConfiguration(process.env);
 console.log('=== N499 PRIVATE PROVIDER CONFIG (NO CREDENTIALS SHOWN) ===');
 console.log('AI_MODE='+state.mode);
 console.log('READER_ONLY='+(state.readerOnly?'yes':'no'));
 console.log('EFFECTIVE_ORDER='+state.order.join(' > '));
 for(const item of state.providerStates)console.log(item.name+': '+item.state);
 if(state.blocker){
  console.error('N499_CONFIG_BLOCKED='+state.blocker);
  process.exitCode=2;
 }else console.log('N499_PROVIDER_CONFIG_READY='+state.readyCount);
 console.log('NOTE: This proves provider eligibility, NOT live inference.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();
