import test from 'node:test';
import assert from 'node:assert/strict';
import {buildN6Brief,parseN6Response} from '../apps/api/src/reader-n6.ts';
const reader={version:'reader10-plain-1',language:'en',chapters:['self','money','work','love','home','path','timing','summary'].map(id=>({id,title:id,lead:'Original lead for '+id+'.',paragraphs:['Original paragraph for '+id+'.'],details:{paragraphs:['First source fact.','Second source fact.'],basis:'Local basis.',links:[]}}))};
const brief=buildN6Brief(reader);
const output=()=>({chapters:brief.chapters.map(c=>({id:c.id,lead:'A thoughtful interpretation for '+c.id+'.',paragraphs:[{text:'First distinct interpretation for '+c.id+'.',evidenceIds:[c.evidence[0].id]},{text:'Second distinct interpretation for '+c.id+'.',evidenceIds:[c.evidence[1].id]}]}))});
test('N6 replaces prose only, preserves local details and does not mutate classic',()=>{
 const original=JSON.stringify(reader),x=parseN6Response(JSON.stringify(output()),reader,brief);
 assert.ok(x);assert.equal(x.chapters.length,8);assert.deepEqual(x.chapters.map(c=>c.details),reader.chapters.map(c=>c.details));assert.ok(x.chapters.every(c=>c.evidenceIds.length===2));assert.equal(JSON.stringify(reader),original);
});
test('N6 rejects incomplete chapters, unknown evidence, technical claims, repeated paragraphs and truncation',()=>{
 for(const mutate of [x=>x.chapters.pop(),x=>x.chapters[0].paragraphs[0].evidenceIds=['work.0'],x=>x.chapters[0].lead='Mercury sits in D9.',x=>x.chapters[1].paragraphs[0].text=x.chapters[0].paragraphs[0].text,x=>x.chapters[0].paragraphs[1].evidenceIds=['self.0']]){
 const x=output();mutate(x);assert.equal(parseN6Response(JSON.stringify(x),reader,brief),null);
 }
 assert.equal(parseN6Response('{',reader,brief),null);
});

test('N6 provider path uses one structured request and falls back without accepting malformed documents',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 let calls=0;
 const opts={reader10:reader,order:['gemini','groq'],keys:{gemini:'fake',groq:'fake'},freeConfirmed:{gemini:true,groq:true},limit:()=>true,fetcher:async(_u,req)=>{
  calls++;const body=JSON.parse(req.body);assert.match(body.messages[0].content,/Return ONLY JSON/);
  assert.doesNotMatch(JSON.stringify(body),/2000-01-01|latitude|longitude/);
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output())}}]}));
 }};
 const result=await generateDirectJyotish(chart,'en','2026-11-26',opts);
 assert.equal(calls,1);assert.equal(result.result.provider,'gemini');assert.equal(result.result.reader10.chapters.length,8);
 calls=0;const invalid=await generateDirectJyotish(chart,'en','2026-11-26',{...opts,fetcher:async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'not JSON'}}]}));}});
 assert.equal(calls,2);assert.equal(invalid.result,null);assert.equal(invalid.reason,'invalid_response');
});
