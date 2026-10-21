import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseOpenRouter,selectedFreeModel} from './openrouter-doctor.mjs';

const fakeEnv={AI_MODE:'free',OPENROUTER_API_KEY:'secret_do_not_echo',OPENROUTER_FREE_MODEL:'fresh/fresh-chat:free'};
const free={id:'fresh/fresh-chat:free',pricing:{prompt:'0',completion:'0'},architecture:{output_modalities:['text']}};
const reply=(json,status=200)=>new Response(JSON.stringify(json),{status,headers:{'content-type':'application/json'}});
function stub({auth=200,catalog=[free],endpoints=[{name:'test'}],probe=200}={}){
 const calls=[]; const fetcher=async(url,opts)=>{
  calls.push({url,authorization:opts.headers.Authorization,method:opts.method||'GET'});
  if(url.endsWith('/key'))return reply(auth===200?{data:{is_free_tier:true}}:{error:{}},auth);
  if(url.includes('/models?'))return reply({data:catalog});
  if(url.endsWith('/endpoints'))return reply({data:{endpoints}});
  if(url.endsWith('/chat/completions'))return reply(probe===200?{choices:[{message:{content:'OK'}}]}:{error:{}},probe);
  throw Error('unmatched');
 };
 return {calls,fetcher};
}
test('doctor validates a free-tier key, model and healthy endpoint without making a completion',async()=>{
 const t=stub(),logs=[];
 const r=await diagnoseOpenRouter({env:fakeEnv,fetcher:t.fetcher,log:x=>logs.push(x)});
 assert.equal(r.ok,true);assert.equal(r.reason,'precheck_only');
 assert.equal(t.calls.length,3);assert.ok(!t.calls.some(x=>x.method==='POST'));
 assert.ok(logs.join('\n').includes('Free-tier key: true'));
 assert.ok(!logs.join('\n').includes('secret_do_not_echo'));
});
test('doctor rejects stale free model before attempting a generation',async()=>{
 const t=stub({catalog:[]}),lines=[];
 const r=await diagnoseOpenRouter({env:fakeEnv,fetcher:t.fetcher,probe:true,log:x=>lines.push(x)});
 assert.equal(r.reason,'model_not_listed');
 assert.equal(t.calls.length,2);assert.ok(!lines.join('\n').includes('secret_do_not_echo'));
});
test('doctor refuses a model with zero provider endpoints',async()=>{
 const t=stub({endpoints:[]});
 const r=await diagnoseOpenRouter({env:fakeEnv,fetcher:t.fetcher,probe:true,log:()=>{}});
 assert.equal(r.reason,'no_endpoints');assert.equal(t.calls.length,3);
});
test('doctor reveals safe numeric 401 without logging key or body',async()=>{
 const t=stub({auth:401}),lines=[];
 const r=await diagnoseOpenRouter({env:fakeEnv,fetcher:t.fetcher,log:x=>lines.push(x)});
 assert.equal(r.reason,'auth_http_401');
 assert.ok(lines.join('\n').includes('invalid_or_expired_key'));
 assert.ok(!lines.join('\n').includes('secret_do_not_echo'));
 assert.equal(t.calls.length,1);
});
test('synthetic probe runs one free completion and has no paid-model escape',async()=>{
 const t=stub(),lines=[];
 const r=await diagnoseOpenRouter({env:fakeEnv,fetcher:t.fetcher,probe:true,log:x=>lines.push(x)});
 assert.equal(r.reason,'probe_pass');
 assert.equal(t.calls.filter(x=>x.method==='POST').length,1);
 assert.ok(lines.join('\n').includes('PROBE: PASS'));
 assert.ok(!lines.join('\n').includes('secret_do_not_echo'));
});
test('unsafe paid model override always falls back to the free router',()=>{
 assert.equal(selectedFreeModel({OPENROUTER_FREE_MODEL:'openai/gpt-4.1-mini'}),'openrouter/free');
 assert.equal(selectedFreeModel({OPENROUTER_FREE_MODEL:'fresh/fresh-chat:free'}),'fresh/fresh-chat:free');
 assert.equal(selectedFreeModel({OPENROUTER_FREE_MODEL:''}),'openrouter/free');
});
