import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreP390,p390CanRecommend} from '../apps/web/lib/panchanga-p390-scoring.ts';
import {p389Guidance} from '../apps/web/lib/panchanga-p389-guidance.ts';
const ref='https://ved.bz/_jyotish/books/muhurtha.html';
const obs=(id,polarity,domain,scope='activity')=>({
 id,polarity,domain,scope,source:ref,
 description:{uk:id==='TARA_FIRST_CYCLE'?
  'Пратьярі (Тара 5): можливі перешкоди для нового початку; це не автоматична заборона.':
  'Фактор '+id,
 en:id==='TARA_FIRST_CYCLE'?'Pratyari Tara 5: obstacles, not an automatic veto.':'Factor '+id}
});
const rate=(arr,personalized=true,method='direct')=>scoreP390({
 activityId:'job_start',method,observations:arr,personalized
});
test('P390 one mild Tara 5 caution cannot defeat matching activity and supportive Chandra',()=>{
 const x=rate([obs('CLASS_FIXED','supports','nakshatra'),
  obs('TARA_FIRST_CYCLE','cautions','tarabala','personal'),
  obs('CHANDRA_SUPPORT','supports','chandrabala','personal')]);
 assert.equal(x.blocked,false);
 assert.ok(x.score>=60);
 assert.equal(p390CanRecommend(x,'direct'),true);
 assert.equal(x.hasActivitySupport,true);
});
test('P390 unreported natal indicators do not get negative votes; 1 known matching activity stays a useful candidate',()=>{
 const x=rate([obs('CLASS_FIXED','supports','nakshatra')],false);
 assert.ok(x.score>=60);
 assert.equal(x.personalized,false);
 assert.equal(p390CanRecommend(x,'direct'),true);
});
test('P390 no verified activity-specific support cannot claim a traditional candidate',()=>{
 const x=rate([obs('TARA_SUPPORT','supports','tarabala','personal'),
  obs('CHANDRA_SUPPORT','supports','chandrabala','personal')]);
 assert.equal(x.hasActivitySupport,false);
 assert.equal(p390CanRecommend(x,'direct'),false);
});
test('P390 strict Rahu or Vishti exclusion wins over a majority of positive signals',()=>{
 const x=rate([obs('CLASS_FIXED','supports','nakshatra'),
  obs('TARA_SUPPORT','supports','tarabala','personal'),
  obs('CHANDRA_SUPPORT','supports','chandrabala','personal'),
  obs('RAHU_START','excludes','rahu','general_election')]);
 assert.equal(x.blocked,true);
 assert.equal(x.score,null);
 assert.equal(p390CanRecommend(x,'direct'),false);
 assert.deepEqual(x.hardReasonIds,['RAHU_START']);
});
test('P390 Tithi and Karana count as one independent lunar elongation bucket',()=>{
 const a=rate([obs('CLASS_FIXED','supports','nakshatra'),
  obs('TITHI_CAUTION','cautions','tithi','general_election')],false);
 const b=rate([obs('CLASS_FIXED','supports','nakshatra'),
  obs('TITHI_CAUTION','cautions','tithi','general_election'),
  obs('KARANA_CAUTION','cautions','karana','general_election')],false);
 assert.equal(a.score,b.score);
});
test('P390 incomplete wedding is preliminary even if partial indicators look supportive',()=>{
 const x=rate([obs('MARRIAGE_PREFERRED_STAR','supports','nakshatra')],true,'special_election');
 assert.equal(x.label,'preliminary');
 assert.equal(p390CanRecommend(x,'special_election'),false);
});
test('P390 one Tara 5 description appears at most once in visible summary and advice',()=>{
 const observations=[obs('CLASS_FIXED','supports','nakshatra'),
  obs('TARA_FIRST_CYCLE','cautions','tarabala','personal'),
  obs('CHANDRA_SUPPORT','supports','chandrabala','personal')];
 const moment={version:'p38-election-screening-v1',activityId:'job_start',
  certification:'calendar-screening-only',personalized:true,
  matchedNakshatraClass:'fixed',observations,verdict:'candidate'};
 const x=p389Guidance(moment,'uk');
 const visible=x.headline+' '+x.reason+' '+x.nextStep;
 assert.equal(visible.split('Пратьярі (Тара 5)').length-1,1);
 assert.match(x.headline,/[Сс]приятливо/);
});
test('Panchanga Today keeps a Today reset and the classical five-limb panel, without .ics or preliminary Muhurta',()=>{
 const hub=readFileSync(new URL('../apps/web/app/components/PanchangaHub.tsx',import.meta.url),'utf8');
 for(const marker of ['resetToToday','localeDate(form.timeZone)','onClick={resetToToday}','p31-details','<PanchangaLiveDay','hourPlan(','activityPlan('])
  assert.ok(hub.includes(marker),marker);
 assert.ok(!hub.includes('PanchangaCleanDay'));
 assert.ok(!hub.includes('PanchangaDailyOpportunities'),'the .ics download block is retired from the public page');
 assert.ok(!hub.includes('p410-advanced'));
 assert.ok(!hub.includes('.ics'));
});
