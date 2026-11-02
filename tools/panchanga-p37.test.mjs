import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretPanchanga} from '../apps/web/lib/panchanga-p32-engine.ts';
import {explainClassicalPanchanga,p37NakshatraClass,P37_SOURCES} from '../apps/web/lib/panchanga-p37-classical.ts';
const at=s=>'2026-11-02T'+s+':00.000Z';
function day(n=4,tithi=8){
 const d={date:'2026-11-02',location:{timeZone:'Europe/Kyiv'},
  sunriseUtc:at('04:30'),sunsetUtc:at('14:30'),nextSunriseUtc:'2026-11-03T04:31:00.000Z',
  sunrise:{tithi:{number:tithi,paksha:'Shukla',numberWithinPaksha:tithi},
   nakshatra:{number:n,name:n===4?'Rohini':n===11?'Purva Phalguni':n===15?'Swati':'Ashvini',pada:1},
   vara:{number:2,name:'Somavara'},yoga:{number:16,name:'Siddhi'},karana:{slot:2,name:'Bava'}},
  periods:{},daytimeKalas:{rahuKalam:{fromUtc:at('05:45'),untilUtc:at('07:00')}}};
 for(const k of ['tithi','nakshatra','yoga','karana'])
  d.periods[k]=[{startUtc:at('03:00'),endUtc:'2026-11-03T05:00:00.000Z',value:d.sunrise[k]}];
 return d;
}
const compile=(d,topic='work',time='10:00')=>explainClassicalPanchanga(d,
 interpretPanchanga(d,Date.parse(at(time)),topic));
test('P3.7: every one of the 27 nakshatras is in exactly one documented classical group',()=>{
 const counts={};for(let n=1;n<=27;n++)counts[p37NakshatraClass(n)]=(counts[p37NakshatraClass(n)]||0)+1;
 assert.deepEqual(counts,{swift:3,fierce:5,mixed:2,fixed:4,gentle:4,sharp:4,movable:5});
 assert.equal(p37NakshatraClass(11),'fierce'); // Purva Phalguni regression
 assert.equal(p37NakshatraClass(4),'fixed');
 assert.equal(p37NakshatraClass(15),'movable');
 for(const n of [0,28,1.25,NaN])assert.throws(()=>p37NakshatraClass(n));
});
test('P3.7: exactly five verified cards, named class, nonempty bilingual causal explanation and sources',()=>{
 const cards=compile(day());
 assert.deepEqual(cards.map(c=>c.factor),['tithi','nakshatra','vara','yoga','karana']);
 assert.equal(cards.length,5);
 assert.match(cards[1].classification.uk,/Дхрува/);
 assert.match(cards[1].explanation.uk,/тривалих/);
 assert.match(cards[0].classification.uk,/Джая/);
 assert.ok(cards.every(c=>c.name.uk&&c.value.uk&&c.classification.en&&c.explanation.uk&&c.application.en));
 assert.ok(cards.every(c=>c.reference===P37_SOURCES.classical||c.reference===P37_SOURCES.nakshatra));
 assert.ok(cards.every(c=>c.untilUtc==='2026-11-03T05:00:00.000Z'||c.factor==='vara'));
});
test('P3.7: movable Nakshatra relates to travel, not automatically salary negotiation',()=>{
 const d=day(15,1);
 const work=compile(d,'work'),travel=compile(d,'travel');
 assert.equal(work[1].tone,'neutral');assert.equal(travel[1].tone,'supports');
 assert.equal(work[1].classification.uk,travel[1].classification.uk);
 assert.notEqual(work[1].application.uk,travel[1].application.uk);
});
test('P3.7: Rikta tithi stays a caution even when nakshatra is appropriate',()=>{
 const cards=compile(day(15,9),'travel');
 assert.match(cards[0].classification.uk,/Рікта/);
 assert.equal(cards[0].tone,'cautions');
 assert.equal(cards[1].tone,'supports');
});
test('P3.7: cards follow real exact crossing (not a stale sunrise snapshot)',()=>{
 const d=day();
 d.periods.nakshatra=[{startUtc:at('03:00'),endUtc:at('10:30'),value:d.sunrise.nakshatra},
  {startUtc:at('10:30'),endUtc:'2026-11-03T05:00:00.000Z',
   value:{number:15,name:'Swati',pada:2}}];
 assert.match(compile(d,'travel','10:00')[1].classification.uk,/Дхрува/);
 assert.match(compile(d,'travel','11:00')[1].classification.uk,/Чара/);
});
test('P3.7: no invented classification when backend or P3.2 evidence is missing',()=>{
 const d=day(),verified=interpretPanchanga(d,Date.parse(at('10:00')),'work');
 assert.throws(()=>explainClassicalPanchanga({...d,date:'2027-01-01'},verified),/unverified/i);
 assert.throws(()=>explainClassicalPanchanga(d,{...verified,evidence:verified.evidence.filter(e=>e.factor!=='yoga')}),/missing source-backed yoga/);
 assert.throws(()=>explainClassicalPanchanga(d,{...verified,evaluatedAtUtc:'2026-11-04T10:00:00.000Z'}),/outside verified/);
});

test('P3.7: added specific traditional education and foundation activities, never broad outcomes',()=>{
 const education=compile(day(1,8),'study');
 assert.equal(education[1].tone,'supports');
 assert.match(education[1].application.uk,/навчан/);
 const foundation=compile(day(4,8),'home');
 assert.equal(foundation[1].tone,'supports');
 assert.match(foundation[1].application.uk,/фундамент/);
});
test('P3.7: a wrong Nakshatra label cannot silently use a different class',()=>{
 const d=day(11,8);d.sunrise.nakshatra.name='Rohini';
 assert.throws(()=>compile(d,'relationships'),/number\/name mismatch/);
});
