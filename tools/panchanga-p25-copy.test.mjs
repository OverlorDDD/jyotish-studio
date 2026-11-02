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
test('plain-language card summaries and precise technical hover/tap definitions are separate',()=>{
 const live=read(files[1]),hub=read(files[0]),range=read(files[3]);
 for(const phrase of ['Місячний день','Ділянка шляху Місяця','Положення Сонця й Місяця',
  'Половина місячного дня','Lunar day','Moon’s position in its lunar path','Half of a lunar day'])
  assert.ok(live.includes(phrase),'Missing plain-language description: '+phrase);
 for(const phrase of ['12°','13°20′','6°','27 секторів'])
  assert.ok(live.includes(phrase),'Missing tooltip detail: '+phrase);
 assert.match(live,/PanchangaInfoTip/);
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

test('personal Moon rhythm is accessible and technical Tara/Chandra terms are in help',()=>{
 const p=read(files[5]),rel=read(files[4]);
 assert.match(rel,/Мій місячний ритм/);
 assert.match(rel,/Порівняння Місяця з вашою натальною картою/);
 assert.match(p,/taraHelp:.*Тарабала/);
 assert.match(p,/chandraHelp:.*Чандрабала/);
 assert.match(p,/PanchangaInfoTip/);
 const help=read('apps/web/app/components/PanchangaInfoTip.tsx');
 assert.match(help,/<details/);
 assert.match(help,/<summary/);
 assert.match(help,/title=\{text\}/);
});
