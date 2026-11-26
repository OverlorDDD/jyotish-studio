import test from 'node:test';
import assert from 'node:assert/strict';
import {buildN6Brief,parseN6Response} from '../apps/api/src/reader-n6.ts';
const reader={version:'reader10-plain-1',language:'en',chapters:['self','money','work','love','home','path','timing','summary'].map(id=>({id,title:id,lead:'Original lead for '+id+'.',paragraphs:['Original paragraph for '+id+'.'],details:{paragraphs:['First source fact.','Second source fact.'],basis:'Local basis.',links:[]}}))};
const brief=buildN6Brief(reader);
const output=()=>({chapters:brief.chapters.map(c=>({id:c.id,lead:'A thoughtful interpretation for '+c.id+'.',paragraphs:[{text:'First distinct interpretation for '+c.id+'.',evidenceIds:[c.evidence[0].id]},{text:'Second distinct interpretation for '+c.id+'.',evidenceIds:[c.evidence[1].id]}]}))});
test('N6 replaces prose only, preserves local details and does not mutate classic',()=>{
 const original=JSON.stringify(reader),x=parseN6Response(JSON.stringify(output()),reader,brief);
 assert.ok(x);assert.equal(x.chapters.length,8);assert.deepEqual(x.chapters.map(c=>c.details),reader.chapters.map(c=>c.details));assert.equal(JSON.stringify(reader),original);
});
test('N6 rejects incomplete chapters, unknown evidence, technical claims, repeated paragraphs and truncation',()=>{
 for(const mutate of [x=>x.chapters.pop(),x=>x.chapters[0].paragraphs[0].evidenceIds=['work.0'],x=>x.chapters[0].lead='Mercury sits in D9.',x=>x.chapters[1].paragraphs[0].text=x.chapters[0].paragraphs[0].text,x=>x.chapters[0].paragraphs[1].evidenceIds=['self.0']]){
 const x=output();mutate(x);assert.equal(parseN6Response(JSON.stringify(x),reader,brief),null);
 }
 assert.equal(parseN6Response('{',reader,brief),null);
});
