/** Independent real-Swiss source-day acceptance for P389, not only synthetic verdict fixtures.
 * No fabricated expected planetary positions: these days are calculated with the
 * same verified SWIEPH/JHora profile tested independently by P388.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePanchangaDay} from '../apps/api/src/panchanga.ts';
import {evaluateP38,P38_ACTIVITIES} from '../apps/web/lib/panchanga-p38-decision.ts';
import {p389Guidance} from '../apps/web/lib/panchanga-p389-guidance.ts';

test('P389 real Swiss 25 activities × 3 sunrise-days show distinct rule evidence without fake statuses',async()=>{
 const dates=['2026-11-03','2027-02-15','2027-04-10'];
 let evaluated=0;
 for(const date of dates){
  const day=await calculatePanchangaDay({
   date,timeZone:'Europe/Kyiv',latitude:50.4501,longitude:30.5234});
  assert.match(day.astronomyProfile,/verified SWIEPH/);
  const utc=new Date(Date.parse(day.sunriseUtc)+4*3600000).toISOString();
  const rows=P38_ACTIVITIES.map(a=>{
   const moment=evaluateP38(day,utc,a.id);
   const msg=p389Guidance(moment,'uk');
   return {id:a.id,method:a.method,moment,msg};
  });
  assert.equal(rows.length,25);
  for(const row of rows){
   assert.ok(row.msg.headline.length>=18);
   assert.ok(row.msg.reason.length>=18);
   assert.ok(row.msg.nextStep.length>=18);
   if(row.moment.verdict==='mixed')
    assert.ok(row.moment.observations.some(o=>o.scope==='activity'&&o.polarity==='supports'),
     'Mixed cannot imply positive signals with no activity-specific support: '+row.id);
   if(row.method==='special_election')
    assert.notEqual(row.moment.verdict,'candidate','No full ceremonial certification: '+row.id);
  }
  const wedding=rows.find(r=>r.id==='wedding');
  const foundation=rows.find(r=>r.id==='foundation');
  const work=rows.find(r=>r.id==='job_start');
  const practice=rows.find(r=>r.id==='daily_meditation');
  const weddingIds=wedding.moment.observations.filter(o=>o.scope==='activity').map(o=>o.id);
  const foundationIds=foundation.moment.observations.filter(o=>o.scope==='activity').map(o=>o.id);
  assert.ok(weddingIds.some(id=>id.startsWith('MARRIAGE_')),'Real wedding election source absent');
  assert.ok(foundationIds.some(id=>id.startsWith('FOUNDATION_')),'Real foundation source absent');
  assert.ok(!weddingIds.some(id=>id.startsWith('FOUNDATION_')));
  assert.ok(!foundationIds.some(id=>id.startsWith('MARRIAGE_')));
  assert.notEqual(wedding.msg.reason,foundation.msg.reason);
  assert.notEqual(work.msg.headline,practice.msg.headline);
  const unique=new Set(rows.map(r=>r.msg.headline+'|'+r.msg.reason+'|'+r.msg.nextStep));
  assert.ok(unique.size>=9,'Real day still collapses 25 choices into too few explanations: '+date+' '+unique.size);
  evaluated+=rows.length;
 }
 assert.equal(evaluated,75);
 console.log('P389_REAL_SKY_DIVERSITY_PASS: 75 verified Swiss activity samples, 3 real sunrise-days');
});
