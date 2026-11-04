import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {auditN4ExplicitClaims} from '../apps/api/src/n4-ai-claims.ts';
import {n4InternalServerSnapshot} from '../apps/api/src/n4-varga-contract.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const chart=calculateChart({
 date:'1998-04-17',time:'06:41',latitude:22.2345,longitude:73.1234,
 timeZone:'Asia/Kolkata',place:'PRIVATE_BIRTH_LOCATION'
},{
 ayanamsa:23.8,julianDay:2450920,backend:'synthetic_test_only',
 ascendant:18.914,positions:names.map((name,i)=>({name,longitude:(12.49+i*33.721)%360,speed:0}))
});
const actual=n4InternalServerSnapshot(chart);
const lookup=(d,planet)=>actual.charts.find(c=>c.division===d).planets.find(x=>x.name===planet);
test('N4 claim reviewer verifies two different explicit chart-house claims',()=>{
 const a=lookup(24,'Mercury'),b=lookup(7,'Jupiter');
 const text='## Reading\nIn D24 Mercury house='+a.house+' and D7 Jupiter house='+b.house+'.';
 const r=auditN4ExplicitClaims(text,chart);
 assert.equal(r.errors.length,0);
 assert.equal(r.correct,2);
 assert.ok(r.claims.some(x=>x.includes('D24 Mercury house='+a.house)));
});
test('N4 claim reviewer catches wrong sign and house without echoing private input',()=>{
 const q=lookup(9,'Venus'),w=lookup(10,'Saturn');
 const wrongHouse=q.house===12?1:q.house+1,wrongSign=w.sign===12?1:w.sign+1;
 const r=auditN4ExplicitClaims('D9 Venus house='+wrongHouse+'. D10 Saturn sign='+wrongSign+'.',chart);
 assert.equal(r.errors.length,2);
 assert.equal(r.correct,0);
 assert.ok(r.errors.every(x=>x.includes('mismatched')));
 for(const privateValue of ['1998-04-17','06:41','22.2345','73.1234','Asia/Kolkata','PRIVATE_BIRTH_LOCATION'])
  assert.ok(!JSON.stringify(r).includes(privateValue));
});
test('N4 numeric review supports idiomatic English and Ukrainian house references',()=>{
 const q=lookup(4,'Moon'),w=lookup(20,'Mercury');
 const r=auditN4ExplicitClaims('In D4, Moon is in the '+q.house+'th house. У D20 Меркурій у '+w.house+'-му домі.',chart);
 assert.equal(r.errors.length,0);
 assert.equal(r.correct,2);
});
test('A mention of D24 without an explicit graha placement does not count as evidence',()=>{
 assert.equal(auditN4ExplicitClaims('D24 and D9 are key themes in this reading.',chart).correct,0);
 assert.equal(auditN4ExplicitClaims('D60 describes your destiny.',chart).correct,0);
});
