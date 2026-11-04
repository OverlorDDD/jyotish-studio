import test from 'node:test';
import assert from 'node:assert/strict';
import {n4PersonalEligible,n4PersonalPlacements,n4DailyTheme,N4_PERSONAL_VERSION}
 from '../apps/api/src/n4-personal-themes.ts';
import {buildDailyGuidance} from '../apps/api/src/personal-guidance.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const chart={
 ascendant:{longitude:10,sign:1},
 d1:names.map((name,i)=>({name,longitude:(5+i*43.61)%360,sign:Math.floor(((5+i*43.61)%360)/30)+1,retrograde:false})),
 input:{date:'2000-01-01',time:'06:30',timeZone:'Europe/Kyiv',latitude:49.2,longitude:33.4}
};
const t={
 date:'2026-11-04',sampledAtUtc:'2026-11-04T12:00:00Z',timeZone:'Europe/Kyiv',
 method:'Swiss Ephemeris / Lahiri / verified local noon',personalized:true,
 moon:{sign:10,nakshatra:'Shravana',houseFromLagna:10,houseFromMoon:1},
 planets:[]
};
const context={lagnaSign:1,moonSign:chart.d1.find(p=>p.name==='Moon').sign,
 natalPositions:chart.d1.map(p=>({name:p.name,sign:p.sign})),
 period:null
};
test('N4 owner-specific themes require BOTH certification and an explicit personal switch',()=>{
 assert.equal(n4PersonalEligible({}),false);
 assert.equal(n4PersonalEligible({N4_VARGA_PERSONAL_ENABLED:'1'}),false);
 assert.equal(n4PersonalEligible({N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),false);
 assert.equal(n4PersonalEligible({N4_VARGA_PERSONAL_ENABLED:'1',N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),true);
 assert.match(N4_PERSONAL_VERSION,/n4-personal/);
});
test('Only derived chart facts (not coordinates/date/time/owner) enter personal transit context',()=>{
 const placements=n4PersonalPlacements(chart);
 assert.equal(placements.length,9*9);
 assert.ok(placements.every(p=>p.division!==60&&p.sign>=1&&p.sign<=12&&p.house>=1&&p.house<=12));
 const json=JSON.stringify(placements);
 for(const privateValue of ['2000-01-01','06:30','Europe/Kyiv','49.2','33.4'])assert.ok(!json.includes(privateValue));
});
test('N4 theme appears only when certified owner context is explicitly supplied',()=>{
 const placements=n4PersonalPlacements(chart);
 const without=buildDailyGuidance(t,context);
 const withN4=buildDailyGuidance(t,{...context,n4Placements:placements});
 assert.ok(without&&withN4);
 assert.equal(without.evidence.n4Varga,undefined);
 assert.match(withN4.description.en,/supplementary D10/);
 assert.equal(withN4.evidence.n4Varga?.division,10);
 assert.equal(withN4.evidence.n4Varga?.body,'Moon');
 assert.deepEqual(withN4.action,without.action,'Panchanga timing/action must not change');
 assert.deepEqual(withN4.goodFor,without.goodFor);
 assert.deepEqual(withN4.caution,without.caution);
 assert.equal(withN4.evidence.sampledAtUtc,without.evidence.sampledAtUtc);
 assert.equal(n4DailyTheme(6,'Moon',placements),null,'no speculative D30');
 assert.equal(n4DailyTheme(10,'Fake',placements),null,'no fabricated graha');
});
