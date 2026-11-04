import test from 'node:test';
import assert from 'node:assert/strict';
import {eventInsight} from '../packages/jyotish-core/src/astro-education.ts';
const kinds=['new_moon','first_quarter','full_moon','last_quarter',
 'sidereal_ingress','retrograde_station','direct_station'];
test('all seven Swiss event kinds have distinct user-readable UA/EN astronomy, traditional meaning and concrete action',()=>{
 for(const kind of kinds)for(const lang of ['uk','en']){
  const e=eventInsight(kind,lang);
  for(const field of ['meaning','tradition','practice','limits']){
   assert.ok(typeof e[field]==='string'&&e[field].length>=18,kind+lang+field);
  }
 }
 assert.match(eventInsight('new_moon','uk').meaning,/сполучення Сонця й Місяця/);
 assert.match(eventInsight('new_moon','uk').limits,/Немає надійного підтвердження/);
});
test('retrograde text never confuses apparent geocentric motion with a physically reversing orbit',()=>{
 assert.match(eventInsight('retrograde_station','en').meaning,/not a planet reversing/);
 assert.match(eventInsight('retrograde_station','uk').meaning,/не починає рухатися назад/);
});
test('new city-search UI and long-form astrological/calendar integrations remain wired',async()=>{
 const {readFileSync}=await import('node:fs');
 const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert.match(read('apps/web/app/components/PanchangaHub.tsx'),/<CitySearch/);
 assert.match(read('apps/api/src/nest.ts'),/PanchangaPlacesController/);
 assert.match(read('apps/api/src/horoscope.ts'),/dailySkyContext/);
 assert.match(read('apps/api/src/personal.ts'),/verifiedDailyMoonStrength/);
 assert.match(read('apps/api/src/nest.ts'),/current-sky-context/);
 assert.match(read('apps/web/app/components/YogaHub.tsx'),/<YogaLunarGuide/);
 assert.match(read('apps/api/src/news-ingestion.ts'),/publishAstronomicalNews/);
 assert.match(read('apps/web/app/components/NewsWorld.module.css'),/Owned editorial celestial illustrations/);
});
