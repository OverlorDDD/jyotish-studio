import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P38_ACTIVITIES,p38Activity} from '../apps/web/lib/panchanga-p38-decision.ts';
import {p389Guidance,p389SharedRuleActivities,p389WindowReason} from '../apps/web/lib/panchanga-p389-guidance.ts';

const obs=(polarity,scope='activity',domain='nakshatra',id='SOURCE')=>({
 id,polarity,scope,domain,source:'https://www.drikpanchang.com/panchang/nakshatra/classification/nakshatra-seven-category.html',
 description:{uk:'Конкретна перевірка: '+id+'.',en:'Specific check: '+id+'.'}
});
function moment(activityId,cls='fixed',observations=[],verdict='undetermined'){
 return {version:'p38-election-screening-v1',activityId,date:'2026-11-03',
  atUtc:'2026-11-03T09:00:01.000Z',
  sunriseUtc:'2026-11-03T06:00:00.000Z',
  nextSunriseUtc:'2026-11-04T06:00:00.000Z',
  activityMethod:p38Activity(activityId).method,
  matchedNakshatraClass:cls,observations,verdict,personalized:false,
  missingRequirements:p38Activity(activityId).required,
  certification:'calendar-screening-only'};
}
test('P389 same verified moment has different meaningful activity-specific explanations, not one generic headline',()=>{
 const job=p389Guidance(moment('job_start','fixed',[obs('supports')],'candidate'),'uk');
 const sale=p389Guidance(moment('sale_start','fixed',[]),'uk');
 const routine=p389Guidance(moment('daily_meditation','fixed',[],'routine'),'uk');
 const wedding=p389Guidance(moment('wedding','fixed',[],'needs_full_election'),'uk');
 const headlines=[job.headline,sale.headline,routine.headline,wedding.headline];
 assert.equal(new Set(headlines).size,4);
 assert.match(job.reason,/стійка/);
 assert.match(sale.reason,/швидка/);
 assert.match(wedding.nextStep,/не сертифіковано/);
 assert.match(routine.nextStep,/час/);
});
test('P389 honest caution-only does not claim that any activity evidence supports the moment',()=>{
 const m=moment('job_start','movable',[obs('cautions','general_election','yoga','YOGA_17')],'caution');
 const v=p389Guidance(m,'uk');
 assert.match(v.headline,/Недостатньо позитивних ознак/);
 assert.match(v.nextStep,/YOGA_17/);
 assert.doesNotMatch(v.headline,/підтриму/);
 assert.doesNotMatch(v.headline,/частина/);
});
test('P389 mixed verdict needs BOTH specific matching activity signal and an explicit caution',()=>{
 const m=moment('job_start','fixed',[
  obs('supports','activity','nakshatra','FIXED'),
  obs('cautions','general_election','yoga','YOGA_17')],'mixed');
 const v=p389Guidance(m,'uk');
 assert.match(v.headline,/сприятливо/);
 assert.match(v.nextStep,/YOGA_17/);
});
test('P389 genuine hard exclusion is actionably explained, never hidden beneath a percent or vague full-election label',()=>{
 const m=moment('short_journey','movable',[
  obs('supports','activity','nakshatra','CHARA'),
  obs('excludes','activity','tithi','RAMAN_TRAVEL_TITHI')],'avoid');
 const v=p389Guidance(m,'uk');
 assert.match(v.headline,/не підходить/);
 assert.match(v.reason,/RAMAN_TRAVEL_TITHI/);
});
test('P389 modern analogy is not mislabeled as a conflict or ancient proof',()=>{
 const v=p389Guidance(moment('first_date','gentle',[
  obs('supports','activity','nakshatra','GENTLE')],'analogy'),'uk');
 assert.match(v.headline,/аналогією/);
 assert.match(v.nextStep,/аналогію/);
 assert.doesNotMatch(v.headline,/суперечлив|потребують уваги/);
});
test('P389 equivalent rules are explicitly grouped instead of pretending 25 independent judgments',()=>{
 const shop=p389SharedRuleActivities('shop_opening');
 assert.ok(shop.includes('sale_start'));
 assert.ok(shop.includes('education_start'));
 assert.ok(!shop.includes('job_start'));
 assert.ok(!p389SharedRuleActivities('short_journey').includes('sale_start'));
 assert.deepEqual(p389SharedRuleActivities('wedding'),[]);
});
test('P389 honest specialized requirements and both language translations for all 25 undertakings',()=>{
 for(const a of P38_ACTIVITIES){
  const vUk=p389Guidance(moment(a.id,'fixed',[],a.method==='special_election'?
   'needs_full_election':a.method==='routine'?'routine':'undetermined'),'uk');
  const vEn=p389Guidance(moment(a.id,'fixed',[],a.method==='special_election'?
   'needs_full_election':a.method==='routine'?'routine':'undetermined'),'en');
  for(const v of [vUk,vEn]){
   assert.ok(v.headline.length>15&&v.reason.length>15&&v.nextStep.length>20,a.id);
   assert.ok(!/Частина показників підтримує, інші потребують уваги|Для цієї справи потрібна повна мухурта/.test(v.headline));
  }
  if(a.method==='special_election'){
   assert.match(vUk.nextStep,/не (може|сертифіковано|всі реалізовані)|бракує/);
  }
 }
});
test('P389 day UI makes actual time, event location, partner and limits accessible inline without counterfeit full certificate',()=>{
 const file=readFileSync(new URL('../apps/web/app/components/PanchangaCleanDay.tsx',import.meta.url),'utf8');
 for(const marker of ['p389-time-select','p389-action','p389-muhurta-checklist',
  'p389-shared-criteria','partnerId','chartState','panchanga-place','p389Guidance'])
  assert.ok(file.includes(marker),marker);
 assert.ok(!file.includes('Частина показників підтримує, інші потребують уваги'));
 assert.ok(!file.includes('Для цієї справи потрібна повна мухурта'));
 assert.ok(file.includes('21 доша'));
 assert.ok(file.includes('не є остаточною сертифікованою мухуртою'));
});

test('P389 exact Time Finder reasons are source-specific in UA/EN and unknown IDs are not fabricated',()=>{
 assert.match(p389WindowReason('MARRIAGE_LAGNA_GEMINI_VIRGO_LIBRA','uk'),/Близнюках/);
 assert.match(p389WindowReason('FOUNDATION_FIXED_LAGNA','uk'),/фундаменту/);
 assert.match(p389WindowReason('MARRIAGE_TUESDAY','en'),/Tuesday/);
 assert.match(p389WindowReason('RAMAN_YOGA_17','en'),/Yoga #17/);
 assert.equal(p389WindowReason('UNKNOWN_CUSTOM_DOSHA','uk'),null);
 assert.equal(p389WindowReason('X'.repeat(129),'uk'),null);
});
test('P389 Time Finder no longer discards preferred specialist findings at exact checked event UTC',()=>{
 const source=readFileSync(new URL('../apps/api/src/panchanga-p385-search.ts',import.meta.url),'utf8');
 assert.match(source,/r\.state==='excluded'\|\|r\.state==='preferred'/);
 const ui=readFileSync(new URL('../apps/web/app/components/PanchangaCleanDay.tsx',import.meta.url),'utf8');
 assert.match(ui,/p389-window-reasons/);
 assert.match(ui,/windowReasons\(finder\.review\.reasonIds\)/);
 assert.match(ui,/activityInfo\.source/);
});
