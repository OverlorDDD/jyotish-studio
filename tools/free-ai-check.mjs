/** Read-only diagnostics for $0 AI providers. No paid generation or birth data sent. */
const mode=process.env.AI_MODE||'free';
console.log('AI_MODE:',mode);
console.log('OpenRouter configured:',Boolean(process.env.OPENROUTER_API_KEY?.trim()));
console.log('Ollama enabled:',process.env.OLLAMA_ENABLED==='1');
console.log('Paid OpenAI calls: '+(mode==='paid_openai'?'POSSIBLE - change AI_MODE=free':'DISABLED'));
if(mode==='paid_openai'){console.error('BLOCKED: choose AI_MODE=free for a no-charge setup');process.exit(1);}
let success=false;
if(process.env.OPENROUTER_API_KEY?.trim()){
 try{
  const response=await fetch('https://openrouter.ai/api/v1/key',{
   headers:{Authorization:'Bearer '+process.env.OPENROUTER_API_KEY.trim()},
   signal:AbortSignal.timeout(12000)
  });
  if(response.ok){success=true;console.log('PASS: OpenRouter API key accepted (free-router inference not yet tested).');}
  else{console.log('OpenRouter key check HTTP '+response.status+' (check key and free-plan limits).');process.exitCode=1;}
 }catch{console.log('OpenRouter unavailable (network/VPN/timeout).');process.exitCode=1;}
}else console.log('OpenRouter key missing: create a key at https://openrouter.ai/keys.');
if(process.env.OLLAMA_ENABLED==='1'){
 try{
  const r=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(3000)});
  if(!r.ok)throw Error('unavailable');
  const list=await r.json();
  const name=process.env.OLLAMA_MODEL||'gemma3:1b';
  const found=Array.isArray(list.models)&&list.models.some(m=>m.name===name||m.model===name);
  if(found){success=true;console.log('PASS: Ollama has local model '+name+'.');}
  else console.log('Ollama running, but model '+name+' not installed: ollama pull '+name);
 }catch{console.log('Ollama unavailable: start it locally (no cloud key required).');}
}
if(!success)console.log('Fallback remains the built-in local Jyotish interpretation.');
console.log('NOTE: Read-only checks do not prove generation capacity; try one fictional chart.');
