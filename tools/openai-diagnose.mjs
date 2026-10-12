/**
 * Free diagnostic (model retrieval only) for OpenAI API key/model reachability.
 * NO paid chat/completions requests, API key or provider error body printed.
 * Run in project root: npm run openai:check
 */
const enabled=process.env.OPENAI_ENABLED==='1';
const key=process.env.OPENAI_API_KEY?.trim()||'';
const model=process.env.OPENAI_MODEL?.trim()||'gpt-4.1-mini';
console.log('OpenAI enabled:',enabled);
console.log('OpenAI API key configured:',key.length>0);
console.log('Configured model:',model);
if(!key){console.error('BLOCKED: Set OPENAI_API_KEY in root .env.');process.exit(1);}
try{
 const res=await fetch('https://api.openai.com/v1/models/'+encodeURIComponent(model),{
  headers:{Authorization:'Bearer '+key},
  signal:AbortSignal.timeout(12000)
 });
 if(res.ok){console.log('PASS: OpenAI accepted API key and model lookup (HTTP '+res.status+').');console.log('NOTE: This is a free model lookup; it does NOT verify Chat Completions quota/billing or structured output success.');}
 else{
  let errorCode='not_provided';
  try{
   const body=await res.json();
   const code=body?.error?.code;
   if(typeof code==='string'&&/^[a-z][a-z0-9_]{0,49}$/.test(code))errorCode=code;
  }catch{}
  console.error('FAIL: OpenAI model lookup HTTP '+res.status+'; provider code: '+errorCode+'.');
  if(res.status===401)console.error('Check the API key and its project permissions.');
  else if(res.status===403)console.error('Check project/model permissions.');
  else if(res.status===404)console.error('Check OPENAI_MODEL or model access.');
  else if(res.status===429)console.error('Check project usage, billing and rate limits.');
  process.exitCode=1;
 }
}catch(e){
 console.error('FAIL: Cannot reach OpenAI models endpoint (network/VPN/proxy/timeout).');
 process.exitCode=1;
}
