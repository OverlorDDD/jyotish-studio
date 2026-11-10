/**
 * N500 safe remote readiness probe. A READY key is not proof of a working API.
 * Sends ONLY a one-word test prompt, never a real birth chart or private data.
 * Prints provider, numeric HTTP status and elapsed ms; never key, body or headers.
 * Uses the existing server .env. No write or paid-model fallback.
 */
import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const providers=[
 {name:'gemini',url:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  key:process.env.GEMINI_API_KEY,enabled:process.env.GEMINI_FREE_TIER_CONFIRMED==='1',model:'gemini-3.1-flash-lite'},
 {name:'groq',url:'https://api.groq.com/openai/v1/chat/completions',
  key:process.env.GROQ_API_KEY,enabled:process.env.GROQ_FREE_TIER_CONFIRMED==='1',
  model:['openai/gpt-oss-20b','openai/gpt-oss-120b'].includes(process.env.GROQ_MODEL)?process.env.GROQ_MODEL:'openai/gpt-oss-20b'},
 {name:'openrouter',url:'https://openrouter.ai/api/v1/chat/completions',
  key:process.env.OPENROUTER_API_KEY,enabled:true,model:'openrouter/free'}
];
let reachable=0;
for(const p of providers){
 if(!p.key?.trim()||!p.enabled){
  console.log('N500_PROBE '+p.name+' SKIPPED_CONFIG');continue;
 }
 const started=Date.now(),controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(p.url,{
   method:'POST',signal:controller.signal,
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+p.key.trim()},
   body:JSON.stringify({model:p.model,max_tokens:64,temperature:0,
    messages:[{role:'user',content:'For a connection test, reply with the single word READY.'}]})
  });
  // Never print or save upstream text, headers or key. Always consume response
  // before declaring a successful small-model completion.
  let valid=false;
  if(response.ok){
   try{
    const body=await response.json();
    const value=body?.choices?.[0]?.message?.content;
    valid=typeof value==='string'&&value.trim().length>0;
   }catch{}
  }
  if(response.ok&&valid)reachable++;
  console.log('N500_PROBE '+p.name+' HTTP_'+response.status+
   (valid?' CONTENT_OK':' NO_VALID_CONTENT')+' '+(Date.now()-started)+'ms');
 }catch{
  console.log('N500_PROBE '+p.name+' '+(controller.signal.aborted?'TIMEOUT':'NETWORK_ERROR')+
    ' '+(Date.now()-started)+'ms');
 }finally{clearTimeout(timer)}
}
console.log('N500_PROBE_REACHABLE='+reachable+'/3');
if(reachable===0)process.exitCode=2;
