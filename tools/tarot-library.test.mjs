import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAROT_LIBRARY,tarotCardBySlug,aspectText} from '../apps/web/lib/tarot-meanings.ts';
import {tarotArtFilename} from '../apps/web/lib/tarot-art.ts';
import {streak,weekDays,guestLeft,countGuestSpread,GUEST_DAILY_SPREADS} from '../apps/web/lib/tarot-journey.ts';
import {TarotUseCases} from '../apps/api/src/tarot-application.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Tarot library: 78 real cards, unique slugs, art for every card, complete bilingual meanings',()=>{
 assert.equal(TAROT_LIBRARY.length,78);
 assert.equal(new Set(TAROT_LIBRARY.map(c=>c.slug)).size,78);
 assert.equal(new Set(TAROT_LIBRARY.map(c=>c.id)).size,78);
 assert.equal(TAROT_LIBRARY.filter(c=>c.group==='major').length,22);
 for(const g of ['wands','cups','swords','pentacles'])assert.equal(TAROT_LIBRARY.filter(c=>c.group===g).length,14,g);
 for(const card of TAROT_LIBRARY){
  assert.ok(tarotArtFilename(card.id),card.id+' has art');
  assert.match(card.slug,/^[a-z]+(-[a-z]+)*$/);
  assert.ok(['yes','no','maybe'].includes(card.yesNo));
  for(const loc of ['uk','en']){
   const t=card[loc];
   assert.equal(t.k.length,3,card.id+' '+loc+' keywords');
   for(const f of ['u','r','l','w','a'])assert.ok(t[f].length>=30,card.id+' '+loc+' '+f+' too thin');
   assert.notEqual(t.u,t.r,card.id+' reversal adds value');
   assert.doesNotMatch(t.u+t.r+t.l+t.w+t.a,/гарант|guarantee|вагітн|pregnan|смерть людини/i,card.id+' no guaranteed or medical claims');
  }
 }
 assert.equal(tarotCardBySlug('star')?.name.uk,'Зірка');
 assert.equal(tarotCardBySlug('ace-of-cups')?.name.en,'Ace of Cups');
 assert.equal(aspectText('У коханні — ніжність і довіра.'),'Ніжність і довіра.');
 assert.equal(aspectText('At work: a fresh idea.'),'A fresh idea.');
});

test('Daily habit: Monday-first week, streak and three guest readings a day',()=>{
 assert.deepEqual(weekDays('2026-11-13'),['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-15']);
 assert.equal(streak(['2026-11-11','2026-11-12','2026-11-13'],'2026-11-13'),3);
 assert.equal(streak(['2026-11-11','2026-11-12'],'2026-11-13'),2,'today not drawn yet keeps yesterday’s streak');
 assert.equal(streak(['2026-11-10'],'2026-11-13'),0);
 let j={v:1,daily:null,days:[],seen:{},guest:{date:'',count:0}};
 assert.equal(guestLeft(j,'2026-11-13'),GUEST_DAILY_SPREADS);
 for(let i=0;i<3;i++)j=countGuestSpread(j,'2026-11-13');
 assert.equal(guestLeft(j,'2026-11-13'),0);
 assert.equal(guestLeft(j,'2026-11-14'),3,'resets next day');
});

test('Guest readings: every topic spread works, nothing is stored and AI is never called',()=>{
 let stored=0,ai=0;
 const repo=new Proxy({},{get:()=>()=>{stored++;}});
 const gateway={enabled:()=>{ai++;return true;},allowAttempt:()=>{ai++;return true;},generate:()=>{ai++;}};
 const uc=new TarotUseCases(repo,gateway);
 for(const [spread,count] of [['yesno',1],['one',1],['three',3],['love',3],['work',3],['week',5],['celtic',10]]){
  const r=uc.guestDraw({spread,question:'Чи варто мені змінити роботу?'});
  assert.equal(r.cards.length,count,spread);
  assert.equal(new Set(r.cards.map(c=>c.id)).size,count,'no duplicate cards');
  assert.equal(r.id,null);assert.equal(r.aiReading,null);
  assert.ok(r.reader.uk.directAnswer&&r.reader.en.directAnswer);
 }
 assert.equal(stored,0);assert.equal(ai,0);
 assert.throws(()=>uc.guestDraw({spread:'bogus'}));
 const api=read('apps/api/src/tarot.ts');
 assert.match(api,/@Post\('public-readings'\)/);
 const guest=api.slice(api.indexOf("@Post('public-readings')"),api.indexOf("@Post('readings')"));
 assert.match(guest,/sameOrigin\(req\)/);
 assert.match(guest,/allowGuestReading\(\)/);
 assert.doesNotMatch(guest,/requireUser|cookieUser/);
});

test('Tarot hub order, 78 card pages in the sitemap, and payment details never sent to the server',()=>{
 const section=read('apps/web/app/components/PortalSection.tsx');
 const order=['<TarotDailyCard','<TarotStudio','<TarotProgress','<TarotLibraryGrid','<TarotReaders','<TarotFaq'].map(x=>section.indexOf(x));
 assert.ok(order.every(i=>i>0));assert.deepEqual([...order].sort((a,b)=>a-b),order);
 assert.match(read('apps/web/app/sitemap.ts'),/TAROT_LIBRARY\.map/);
 assert.match(read('apps/web/app/[locale]/tarot/cards/[slug]/page.tsx'),/TAROT_LIBRARY\.map\(card=>\(\{locale,slug:card\.slug\}\)\)/);
 const admin=read('apps/web/app/components/AdminExpertRequests.tsx');
 assert.match(admin,/localStorage\.setItem\(PAY_KEY/);
 assert.doesNotMatch(admin.slice(admin.indexOf('function savePay')),/fetch\([^)]*pay/i);
 const readers=read('apps/web/app/components/tarot/TarotReaders.tsx');
 assert.match(readers,/\$30/);assert.match(readers,/Binance Pay/);
 assert.doesNotMatch(read('apps/web/app/components/tarot/TarotDailyCard.tsx')+read('apps/web/app/components/TarotStudio.tsx'),/[\u{1F300}-\u{1FAFF}]/u);
});

test('Readings are honest: reversed and hard cards are named as risks, never dressed up as a good spread',async()=>{
 const {readerReading}=await import('../apps/api/src/tarot-reader.ts');
 const {spreadTone}=await import('../apps/api/src/tarot-tone.ts');
 const hard=[{id:'major-tower',position:0,reversed:true},{id:'major-fool',position:1,reversed:true},{id:'swords-page',position:2,reversed:true}];
 assert.ok(['challenging','difficult'].includes(spreadTone(hard).tone));
 const r=readerReading(hard,'love','це буде гарний вечір?','uk');
 assert.match(r.directAnswer,/Скажу чесно/);
 assert.match(r.directAnswer,/Усі 3 карти перевернуті/);
 for(const name of ['Вежа','Блазень','Паж Мечів'])assert.ok(r.caution.includes(name),name);
 assert.match(r.caution,/Що може піти не так/);
 assert.ok(!/виглядає добрим/.test(r.development));
 const en=readerReading(hard,'love','Will tonight be good?','en');
 assert.match(en.directAnswer,/To be honest/);
 const good=[{id:'major-sun',position:0,reversed:false},{id:'major-star',position:1,reversed:false},{id:'major-world',position:2,reversed:false}];
 assert.equal(spreadTone(good).tone,'favourable');
 assert.ok(!readerReading(good,'three',null,'uk').caution.includes('Що може піти не так'));
 // A difficult final card is never presented as a good ending.
 const badEnd=[{id:'major-sun',position:0,reversed:false},{id:'cups-two',position:1,reversed:false},{id:'swords-five',position:2,reversed:false}];
 assert.equal(spreadTone(badEnd).tone,'mixed');
 assert.match(readerReading(badEnd,'three',null,'uk').development,/фінал розкладу тривожний/);
 // The AI prompt carries the same honesty rule and the computed tone.
 assert.match(read('apps/api/src/tarot-ai.ts'),/spreadTone:fallback\.tone/);
});
test('Card commentary speaks to the reader as «ви», like the rest of the site',()=>{
 const text=read('apps/api/src/tarot-depth.ts')+read('apps/api/src/tarot-deck.ts')+read('apps/api/src/tarot-reader.ts');
 for(const w of ['Почни','Обери','Спробуй','Зверни','Відбудовуй','Радій','Дозволь','Поміркуй','Перевіряй','твоя','твоє','можеш'])
  assert.ok(!new RegExp('(^|[^А-Яа-яІіЇїЄєҐґ’])'+w+'([^А-Яа-яІіЇїЄєҐґ’]|$)').test(text),w);
});
test('Signed-in journey: profile card of the day wins, days unite, card counts never double',async()=>{
 const {mergeJourney}=await import('../apps/web/lib/tarot-journey.ts');
 const local={v:1,daily:{date:'2026-11-13',id:'major-fool',reversed:false},days:['2026-11-12','2026-11-13'],seen:{'major-fool':2,'cups-ace':1},guest:{date:'',count:0}};
 const merged=mergeJourney(local,{days:['2026-11-10','2026-11-13'],daily:[{date:'2026-11-13',id:'major-sun',reversed:true}],seen:{'major-fool':1,'major-sun':4}},'2026-11-13');
 assert.deepEqual(merged.days,['2026-11-10','2026-11-12','2026-11-13']);
 assert.deepEqual(merged.daily,{date:'2026-11-13',id:'major-sun',reversed:true});
 assert.deepEqual(merged.seen,{'major-fool':2,'cups-ace':1,'major-sun':4});
 assert.equal(merged.profile,true);
 const repo=read('apps/api/src/tarot-prisma-repository.ts');
 assert.match(repo,/spread:\{not:DAILY_SPREAD\},createdAt:\{gte:input\.start/,'daily cards never use the spread quota');
 assert.match(read('apps/api/src/tarot.ts'),/@Post\('journey\/daily'\)[\s\S]*sameOrigin\(req\)[\s\S]*requireUser\(req\)/);
});
test('Guided path: topic → question → cards → answer → next step, with the question carried to a human reader',()=>{
 const studio=read('apps/web/app/components/TarotStudio.tsx');
 assert.match(studio,/guideTo\('as-tarot-question',\{focus:true/);
 assert.match(studio,/guideTo\('tarot-answer-heading'/);
 assert.match(studio,/galaxiora:tarot-to-reader/);
 assert.match(studio,/data-next=/);
 assert.match(read('apps/web/app/components/ExpertQuestionForm.tsx'),/addEventListener\('galaxiora:tarot-to-reader'/);
 const art=read('apps/web/app/components/tarot/TarotArt.module.css');
 assert.match(art,/aspect-ratio:720\/1248/,'whole printed card visible, title included');
 assert.ok(!/height:calc\(100% - 30px\)/.test(art));
});
