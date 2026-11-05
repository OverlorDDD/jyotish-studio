import test from 'node:test';
import assert from 'node:assert/strict';
import {planN4BirthTime,assessN4D60Evidence} from '../apps/api/src/n4-birth-time-certainty.ts';
import {vargaSign} from '../packages/jyotish-core/src/vargas.ts';

const bodies=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const bound=(name,i)=>({name,minimum:20+i*3+.20,nominal:20+i*3+.23,maximum:20+i*3+.27});
const all=bodies.map(bound);
test('unknown birth time is provisional local noon with full-day uncertainty, never an observed instant',()=>{
 const plan=planN4BirthTime({kind:'unknown'});
 assert.equal(plan.nominalLocalTime,'12:00');
 assert.equal(plan.source,'assumed_local_noon');
 assert.deepEqual(plan.localMinuteInterval,{startInclusive:0,endExclusive:1440});
 assert.equal(plan.nominalIsObserved,false);
 assert.equal(plan.natalHousesTrusted,false);
 assert.equal(plan.requiresIanaZoneAndHistoricalDst,true);
 assert.throws(()=>planN4BirthTime({kind:'unknown',localTime:'12:00'}),/Unknown/);
});
test('recorded and approximate times preserve the complete uncertainty interval including midnight',()=>{
 const record=planN4BirthTime({kind:'recorded',localTime:'08:14',uncertaintyMinutes:1});
 assert.deepEqual(record.localMinuteInterval,{startInclusive:493,endExclusive:496});
 assert.equal(record.nominalLocalTime,'08:14');
 const approx=planN4BirthTime({kind:'approximate',localTime:'23:50',uncertaintyMinutes:25});
 assert.deepEqual(approx.localMinuteInterval,{startInclusive:1405,endExclusive:1456});
 assert.throws(()=>planN4BirthTime({kind:'approximate',localTime:'12:00',uncertaintyMinutes:0}),/uncertainty/);
 assert.throws(()=>planN4BirthTime({kind:'recorded',localTime:'24:00',uncertaintyMinutes:1}),/HH:MM/);
});
test('D60 matches source pinned half-degree arithmetic, but a noon assumption never permits FULL interpretation',()=>{
 const time=planN4BirthTime({kind:'unknown'});
 const result=assessN4D60Evidence({time,envelopes:all,
  continuousBoundsVerified:true,originalJHora8MathApproved:true,historicalTimezoneResolved:true});
 assert.equal(result.status,'PROVISIONAL_SIGNS_ONLY');
 assert.equal(result.houseInterpretationEligible,false);
 assert.equal(result.uncertainBodies.length,0);
 for(const p of result.stableSigns)assert.equal(p.sign,vargaSign(all.find(x=>x.name===p.name).nominal,60)+1);
});
test('without original JHora proof or continuously certified longitude bounds, D60 stays gated OFF',()=>{
 const time=planN4BirthTime({kind:'recorded',localTime:'08:14',uncertaintyMinutes:0});
 const noMath=assessN4D60Evidence({time,envelopes:all,
  continuousBoundsVerified:true,originalJHora8MathApproved:false,historicalTimezoneResolved:true});
 assert.equal(noMath.status,'MATH_REFERENCE_NOT_CERTIFIED');
 assert.equal(noMath.houseInterpretationEligible,false);
 const samplesOnly=assessN4D60Evidence({time,envelopes:all,
  continuousBoundsVerified:false,originalJHora8MathApproved:true,historicalTimezoneResolved:true});
 assert.equal(samplesOnly.status,'INSUFFICIENT_CONTINUOUS_EPHEMERIS_EVIDENCE');
 assert.equal(samplesOnly.houseInterpretationEligible,false);
 const missingZone=assessN4D60Evidence({time,envelopes:all,
  continuousBoundsVerified:true,originalJHora8MathApproved:true,historicalTimezoneResolved:false});
 assert.equal(missingZone.houseInterpretationEligible,false);
});
test('even when JHora and continuous envelopes are approved, one D60 boundary disables complete chart',()=>{
 const time=planN4BirthTime({kind:'recorded',localTime:'08:14',uncertaintyMinutes:1});
 const verified=assessN4D60Evidence({time,envelopes:all,
  continuousBoundsVerified:true,originalJHora8MathApproved:true,historicalTimezoneResolved:true});
 assert.equal(verified.status,'ALL_D60_POSITIONS_ELIGIBLE');
 assert.equal(verified.houseInterpretationEligible,true);
 const ascJump=all.map(p=>p.name==='Ascendant'?{...p,minimum:20.45,nominal:20.5,maximum:20.55}:p);
 const changed=assessN4D60Evidence({time,envelopes:ascJump,
  continuousBoundsVerified:true,originalJHora8MathApproved:true,historicalTimezoneResolved:true});
 assert.equal(changed.status,'PROVISIONAL_SIGNS_ONLY');
 assert.equal(changed.lagnaStable,false);
 assert.ok(changed.uncertainBodies.includes('Ascendant'));
 assert.equal(changed.houseInterpretationEligible,false);
});
test('no false stability from same D60 sign at ends of an interval spanning 12 whole parts',()=>{
 const time=planN4BirthTime({kind:'approximate',localTime:'08:00',uncertaintyMinutes:15});
 const wrap=all.map(p=>p.name==='Mars'?{...p,minimum:30.23,nominal:33.23,maximum:36.23}:p);
 assert.equal(vargaSign(30.23,60),vargaSign(36.23,60));
 const result=assessN4D60Evidence({time,envelopes:wrap,
  continuousBoundsVerified:true,originalJHora8MathApproved:true,historicalTimezoneResolved:true});
 assert.ok(result.uncertainBodies.includes('Mars'));
 assert.equal(result.houseInterpretationEligible,false);
 assert.throws(()=>assessN4D60Evidence({time,envelopes:all.slice(1),
  continuousBoundsVerified:true,originalJHora8MathApproved:true,historicalTimezoneResolved:true}),/10 objects/);
});
