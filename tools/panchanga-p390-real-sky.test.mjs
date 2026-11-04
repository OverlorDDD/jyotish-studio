/** Regression against real Swiss source days: prevent "every day is negative".
 * This does NOT guarantee an auspicious window on every date or for every
 * activity. It proves the engine can find legitimate positives across
 * distinct source-backed undertakings with no hard prohibitions.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePanchangaDay} from '../apps/api/src/panchanga.ts';
import {evaluateP38} from '../apps/web/lib/panchanga-p38-decision.ts';
import {scoreP390} from '../apps/web/lib/panchanga-p390-scoring.ts';
const DATE0=Date.parse('2026-11-03T00:00:00.000Z'),DAY=86400000;
const ACT=['job_start','short_journey','shop_opening','arts_start'];
test('P390 real SWIEPH 7-day Kyiv × 4 activities × exact hours contains non-vetoed positive recommendations',async()=>{
 let positives=0,blocked=0,samples=0;
 for(let d=0;d<7;d++){
  const date=new Date(DATE0+d*DAY).toISOString().slice(0,10);
  const day=await calculatePanchangaDay({date,timeZone:'Europe/Kyiv',
   latitude:50.4501,longitude:30.5234});
  assert.match(day.astronomyProfile,/verified SWIEPH/);
  const sunrise=Date.parse(day.sunriseUtc),end=Date.parse(day.nextSunriseUtc);
  for(const offset of [2,5,8,11,14]){
   const moment=sunrise+offset*3600000;
   if(moment>=end)continue;
   for(const activityId of ACT){
    const result=evaluateP38(day,new Date(moment).toISOString(),activityId);
    const score=scoreP390({activityId,method:result.activityMethod,
     observations:result.observations,personalized:false});
    samples++;
    if(result.verdict==='candidate'){
     positives++;
     assert.equal(score.blocked,false);
     assert.ok(score.score>=60);
     assert.equal(score.hasActivitySupport,true);
    }
    if(result.verdict==='avoid'){
     blocked++;
     assert.equal(score.blocked,true);
    }
   }
  }
 }
 assert.ok(samples>=100,'Real Swiss day/time coverage incomplete');
 assert.ok(positives>=1,'No real positive verified windows anywhere in 7 days × four documented activities');
 assert.ok(blocked>=1,'Safety exclusions must still work across 7-day sampling');
 console.log('P390_REAL_7DAY_PASS '+JSON.stringify({samples,positives,blocked}));
});
