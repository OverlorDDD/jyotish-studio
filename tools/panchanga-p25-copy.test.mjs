import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const files=[
 'apps/web/app/components/PanchangaHub.tsx',
 'apps/web/app/components/PanchangaLiveDay.tsx',
 'apps/web/app/components/PanchangaDayGuide.tsx',
 'apps/web/app/components/PanchangaRangeView.tsx',
 'apps/web/app/components/PanchangaRelatedPanels.tsx',
 'apps/web/app/components/PersonalPanchanga.tsx',
 'apps/web/app/components/AstronomicalEventsPanel.tsx'
];
test('P2.5 visible Panchanga phrases state concrete astronomy or action',()=>{
 const live=read(files[1]),hub=read(files[0]),range=read(files[3]);
 for(const phrase of ['Кожні 12° між Місяцем і Сонцем','Половина тітхі: кожні 6°',
  'Сума довгот Сонця й Місяця: сектори по 13°20′',
  'Every 12° of Moon–Sun separation','Half a tithi: every 6°'])
  assert.ok(live.includes(phrase),'Missing measured definition: '+phrase);
 assert.match(hub,/Оновити календар/);
 assert.match(range,/Панчанга · місяць/);
});
test('P2.5 copy does not reintroduce vague slogans or internal error details',()=>{
 for(const path of files){
  const source=read(path);
  for(const phrase of ['Розумний календар · місяць','Дослідити глибше','Порівнюй календарні періоди',
   'обирай практики та досліджуй','Перевір Python Swiss Ephemeris',
   'Explore lunar cycles, traditional observances, and mindful practices.',
   'Smart monthly calendar'])
   assert.ok(!source.includes(phrase),'Vague/technical text in '+path+': '+phrase);
 }
});
test('P2.5 distinguishes traditional candidate dates from exact astronomical phases in both languages',()=>{
 const guide=read(files[2]),month=read(files[3]);
 for(const phrase of ['Дати свят попередні','Festival dates are provisional','Фази — астрономічний час',
  'Phases show astronomical times'])
  assert.ok(guide.includes(phrase)||month.includes(phrase),'Missing date qualification: '+phrase);
});
