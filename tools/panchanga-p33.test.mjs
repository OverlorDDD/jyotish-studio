import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretPanchanga} from '../apps/web/lib/panchanga-p32-engine.ts';
import {synthesizePersonalResonance,validateP33Report} from '../apps/web/lib/panchanga-p33-resonance.ts';
const sunrise='2026-11-02T04:30:00.000Z',next='2026-11-03T04:31:00.000Z';
const time='2026-11-02T11:00:00.000Z';
const point={date:'2026-11-02',timeZone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'};
function day(){
 const d={date:point.date,location:{timeZone:point.timeZone},
  sunriseUtc:sunrise,nextSunriseUtc:next,sunsetUtc:'2026-11-02T14:30:00.000Z',
  sunrise:{tithi:{number:8,paksha:'Shukla',numberWithinPaksha:8},
   nakshatra:{number:4,name:'Rohini',pada:1},moonSign:5,
   vara:{number:2,name:'Somavara'},yoga:{number:16,name:'Siddhi'},
   karana:{slot:2,name:'Bava'}},
  periods:{},daytimeKalas:{rahuKalam:{fromUtc:'2026-11-02T05:45:00.000Z',untilUtc:'2026-11-02T07:00:00.000Z'}}};
 for(const k of ['tithi','nakshatra','yoga','karana'])
  d.periods[k]=[{startUtc:'2026-11-02T03:00:00.000Z',endUtc:'2026-11-03T05:00:00.000Z',value:d.sunrise[k]}];
 return d;
}
const signs=['Mercury','Venus','Mars','Jupiter','Saturn'];
function report(opts={}){
 const birthNak=opts.birthNak??3,natalMoon=opts.natalMoon??5,lagna=6,moonSign=5,nak=4;
 const count=(nak-birthNak+27)%27+1,tara=(count-1)%9+1;
 const q=tara===1?'caution':[2,4,6,8,9].includes(tara)?'supportive':'challenging';
 const house=(moonSign-natalMoon+12)%12+1;
 const gochar=signs.map(name=>{
  const sign=name==='Saturn'?7:name==='Jupiter'?9:5;
  return {name,sign,houseFromMoon:(sign-natalMoon+12)%12+1,houseFromLagna:(sign-lagna+12)%12+1};
 });
 return {status:'available',version:'personal-resonance-v1',
  observation:'VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL',
  date:point.date,timeZone:point.timeZone,latitude:Number(point.latitude),longitude:Number(point.longitude),
  sunriseUtc:sunrise,nextSunriseUtc:next,evaluatedAtUtc:time,
  transitMoon:{sign:moonSign,nakshatraNumber:nak},
  natal:{moonSign:natalMoon,lagnaSign:lagna},
  tarabala:{quality:q,name:'Sampat',taraNumber:tara,cycle:Math.floor((count-1)/9)+1,
   inclusiveCount:count,birthNakshatraIndex:birthNak,transitNakshatraIndex:nak},
  chandrabala:{quality:[1,3,6,7,10,11].includes(house)?'supportive':'challenging',
   houseFromJanmaRashi:house,ashtamaChandra:house===8,natalMoonSign:natalMoon,transitMoonSign:moonSign},
  period:{lord:'Mercury',start:'2024-01-01T00:00:00.000Z',end:'2034-01-01T00:00:00.000Z',
   antardasha:{lord:'Venus',start:'2026-01-01T00:00:00.000Z',end:'2027-01-01T00:00:00.000Z'}},
  gochar,...opts};
}
const combined=(d=day(),r=report(),topic='work',at=time,mode='auto')=>
 synthesizePersonalResonance(interpretPanchanga(d,Date.parse(at),topic,mode),d,point,r,at);
test('P3.3 verified chart plus 2 favorable Moon indicators yields one supported verdict',()=>{
 const x=combined();
 assert.equal(x.personalized,true);assert.equal(x.scope,'verified-own-natal');
 assert.equal(x.status,'supported');assert.equal(x.sourceCalendarStatus,'supported');
 assert.match(x.action.uk,/розмову про оплату/);
 assert.equal(x.evidence.filter(e=>e.category==='lunar').length,2);
 assert.ok(x.evidence.some(e=>e.category==='dasha'&&/Mercury/.test(e.note.en)));
 assert.ok(x.evidence.some(e=>e.category==='gochar'));
 assert.equal(x.missing.includes('PRECISE_PERSONAL_MUHURTA_P34'),true);
});
test('P3.3 conflicting Tara/Chandra never render two verdicts',()=>{
 const r=report({natalMoon:1});
 const x=combined(day(),r,'money');
 assert.equal(x.status,'caution');
 assert.match(x.reason.uk,/протилежні сигнали/);
 assert.match(x.action.uk,/Перевірте суму/);
 assert.equal(x.evidence.find(e=>e.id.startsWith('TARABALA')).verdict,'supports');
 assert.equal(x.evidence.find(e=>e.id.startsWith('CHANDRABALA')).verdict,'cautions');
});
test('P3.3 Ashtama Moon overrides favorable Tara and general Panchanga',()=>{
 const x=combined(day(),report({natalMoon:10}),'relationships');
 assert.equal(x.status,'avoid');
 assert.match(x.reason.uk,/Аштама-чандра/);
 assert.ok(x.evidence.find(e=>e.id==='ASHTAMA_CHANDRA'));
});
test('P3.3 hard calendar exclusion overrides lunar optimism',()=>{
 const d=day();d.sunrise.karana={slot:8,name:'Vishti'};d.periods.karana[0].value=d.sunrise.karana;
 const x=combined(d,report(),'work');
 assert.equal(x.status,'avoid');
 assert.equal(x.sourceCalendarStatus,'avoid');
 assert.match(x.reason.uk,/сильне обмеження Панчанги/);
});
test('P3.3 no active Dasha is stated as missing rather than invented',()=>{
 const x=combined(day(),report({period:null}));
 assert.equal(x.activePeriod,null);
 assert.ok(x.missing.includes('VERIFIED_ACTIVE_VIMSHOTTARI'));
 assert.ok(x.evidence.some(e=>e.id==='DASHA_UNAVAILABLE'));
});
test('P3.3 exact observer, source, lunar crossing, house and period mismatches are rejected',()=>{
 const d=day(),r=report();
 for(const [label,wrong] of [
  ['observer',{...r,latitude:49.5}],
  ['cross source',{...r,sunriseUtc:'2026-11-02T04:31:00.000Z'}],
  ['moon nakshatra',{...r,transitMoon:{sign:5,nakshatraNumber:8}}],
  ['wrong tara',{...r,tarabala:{...r.tarabala,taraNumber:8}}],
  ['wrong chandra',{...r,chandrabala:{...r.chandrabala,quality:'challenging'}}],
  ['another house',{...r,gochar:r.gochar.map(x=>x.name==='Saturn'?{...x,houseFromLagna:3}:x)}],
  ['bad dasha',{...r,period:{...r.period,start:'2027-01-01T00:00:00.000Z'}}],
  ['unverified metadata',{...r,observation:'UNKNOWN'}]
 ])assert.throws(()=>validateP33Report(wrong,point,d,time),/P33 verified/,label);
});
test('P3.3 future/historic dates must use the sunrise snapshot, never false current time',()=>{
 const d=day(),r=report({evaluatedAtUtc:sunrise});
 const base=interpretPanchanga(d,Date.parse(sunrise),'work','sunrise-snapshot');
 assert.equal(base.moment,'sunrise-snapshot');
 const x=synthesizePersonalResonance(base,d,point,r,sunrise);
 assert.equal(x.personalized,true);
 assert.throws(()=>synthesizePersonalResonance(
  interpretPanchanga(d,Date.parse(time),'work'),d,point,r,sunrise),/time scope/);
});
