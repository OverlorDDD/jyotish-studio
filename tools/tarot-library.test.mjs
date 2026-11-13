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
