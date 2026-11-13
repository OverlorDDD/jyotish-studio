import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {abhijitWindow,activityPlan,dayObservances,dayTier,haircutFriendly,hourPlan,moonLight,TODAY_ACTIVITIES,zonedMs}
 from '../apps/web/lib/panchanga-today.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const F=JSON.parse(read('tools/fixtures/panchanga-today-kyiv-2026-11-13.json'));
const kyiv=t=>new Intl.DateTimeFormat('uk-UA',{timeZone:'Europe/Kyiv',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(t));

test('local wall clock survives DST in the observer zone',()=>{
 assert.equal(new Date(zonedMs('2026-11-13',23,'Europe/Kyiv')).toISOString(),'2026-11-13T21:00:00.000Z');
 assert.equal(new Date(zonedMs('2026-07-01',23,'Europe/Kyiv')).toISOString(),'2026-07-01T20:00:00.000Z');
 assert.equal(new Date(zonedMs('2026-11-13',23,'Asia/Kolkata')).toISOString(),'2026-11-13T17:30:00.000Z');
});

test('hours cover sunrise to 23:00 without gaps or slivers, and kalas and Bhadra win',()=>{
 for(const day of [F.today,F.tomorrow]){
  const plan=hourPlan(day);
  assert.equal(plan[0].startMs,Date.parse(day.sunriseUtc));
  assert.equal(kyiv(plan.at(-1).endMs),'23:00');
  for(let i=1;i<plan.length;i++){
   assert.equal(plan[i].startMs,plan[i-1].endMs,'contiguous');
   assert.ok(plan[i].q!==plan[i-1].q||plan[i].why!==plan[i-1].why,'merged');
  }
  for(const p of plan)assert.ok(p.endMs-p.startMs>=3*60000,'no sliver');
  const rahu=plan.find(p=>p.why==='rahu');
  assert.equal(rahu.startMs,Date.parse(day.daytimeKalas.rahuKalam.fromUtc));
  assert.equal(rahu.q,'avoid');
 }
 const today=hourPlan(F.today);
 // Vishti runs until 17:12 local: nothing before it is friendly for new starts.
 assert.ok(today.filter(p=>p.endMs<=Date.parse('2026-11-13T15:12:00Z')).every(p=>p.q==='avoid'||p.why==='vishti'));
 assert.equal(today.some(p=>p.q==='good'||p.q==='best'),false);
 const tomorrow=hourPlan(F.tomorrow);
 const best=tomorrow.find(p=>p.q==='best');
 assert.equal(best.why,'abhijit');
 assert.ok(tomorrow.filter(p=>p.q==='good').length>=3);
});

test('Abhijit is the 8th of 15 daylight parts and skipped on Wednesday',()=>{
 const w=abhijitWindow({date:'2026-11-14',sunriseUtc:'2026-11-14T05:00:00.000Z',sunsetUtc:'2026-11-14T20:00:00.000Z'});
 assert.equal(new Date(w.startMs).toISOString(),'2026-11-14T12:00:00.000Z');
 assert.equal(new Date(w.endMs).toISOString(),'2026-11-14T13:00:00.000Z');
 assert.equal(abhijitWindow({date:'2026-11-11',sunriseUtc:'2026-11-11T05:00:00.000Z',sunsetUtc:'2026-11-11T20:00:00.000Z'}),null);
});

test('activities: Bhadra day postpones starts; the next day offers windows that fit each activity',()=>{
 const plan=hourPlan(F.today),now=Date.parse('2026-11-13T13:50:00Z');
 const today=Object.fromEntries(TODAY_ACTIVITIES.map(a=>[a.id,activityPlan(F.today,plan,a.id,now)]));
 for(const id of ['money','work','study','travel','love','arts','home'])assert.equal(today[id].status,'no',id);
 assert.equal(today.spirit.status,'good');
 const next=hourPlan(F.tomorrow),from=next[0].startMs;
 const t=Object.fromEntries(TODAY_ACTIVITIES.map(a=>[a.id,activityPlan(F.tomorrow,next,a.id,from)]));
 const fmt=w=>w.map(([a,b])=>kyiv(a)+'–'+kyiv(b));
 assert.ok(fmt(t.money.windows).includes('13:57–15:05'));
 assert.ok(fmt(t.love.windows).includes('08:17–09:25'),'Shubh suits meetings');
 assert.ok(fmt(t.travel.windows).includes('11:41–12:49'),'Char suits travel');
 assert.ok(!fmt(t.money.windows).includes('08:17–09:25'),'Shubh is not a money window');
 for(const p of Object.values(t))for(const [a,b] of p.windows){
  const inside=next.filter(x=>x.startMs<b&&x.endMs>a);
  assert.ok(inside.every(x=>x.q!=='avoid'&&x.q!=='routine'),'windows never cross kalas or routine hours');
 }
});

test('haircut follows kshaura rules',()=>{
 const base={tithi:{number:7},nakshatra:{number:22},vara:{number:2}};
 assert.equal(haircutFriendly(base),true);
 assert.equal(haircutFriendly({...base,vara:{number:3}}),false,'Tuesday');
 assert.equal(haircutFriendly({...base,vara:{number:7}}),false,'Saturday');
 assert.equal(haircutFriendly({...base,tithi:{number:14}}),false,'Rikta');
 assert.equal(haircutFriendly({...base,tithi:{number:30}}),false,'Amavasya');
 assert.equal(haircutFriendly({...base,nakshatra:{number:6}}),false,'Ardra');
 assert.equal(haircutFriendly(F.today.sunrise),false);
});

test('day tier, observances and Moon light',()=>{
 const d=F.today;
 assert.equal(dayTier({date:d.date,timeZone:'Europe/Kyiv',sunriseUtc:d.sunriseUtc,sunsetUtc:d.sunsetUtc,
  nextSunriseUtc:d.nextSunriseUtc,sunrise:d.sunrise,rahuKalam:d.daytimeKalas.rahuKalam}),'quiet');
 const o=dayObservances([{id:'ekadashi_arunodaya'},{id:'ekadashi_sunrise'},{id:'sankranti',metadata:{toSign:8}},{id:'unknown'}]);
 assert.deepEqual(o.map(x=>x.kind),['sankranti','ekadashi']);
 assert.equal(o[0].toSign,8);
 assert.deepEqual(dayObservances([{id:'amavasya_sunrise'},{id:'diwali_amavasya'}]).map(x=>x.kind),['diwali','amavasya']);
 const m=moonLight(43.5);
 assert.equal(m.waxing,true);assert.equal(Math.round(m.illumination*100),14);
 assert.equal(moonLight(200).waxing,false);
});

test('Panchanga page: day plan first, details later, no calendar-file download, FAQ and city index kept',()=>{
 const hub=read('apps/web/app/components/PanchangaHub.tsx');
 const page=read('apps/web/app/[locale]/panchanga/page.tsx');
 const order=['<Verdict','<HoursOfDay','<ActivityCards','<MonthCalendar','<Upcoming','data-testid="p31-details"'].map(x=>hub.indexOf(x));
 assert.ok(order.every(i=>i>0));
 assert.deepEqual([...order].sort((a,b)=>a-b),order);
 assert.doesNotMatch(hub,/\.ics|text\/calendar|PanchangaDailyOpportunities/);
 assert.match(page,/<OrganicIntentBridge kind="panchanga"[^>]*\/>\s*<PanchangaFaq/);
 assert.match(page,/<PanchangaCityIndex locale=/);
 const parts=read('apps/web/app/components/PanchangaTodayParts.tsx');
 assert.doesNotMatch(parts+hub,/[\u{1F300}-\u{1FAFF}]/u,'site line icons, not emoji');
 assert.doesNotMatch(parts+hub,/Близнят|місячного місяця|Місячний місяць/);
});

test('Diwali is shown as five days around the calculated Kartika Amavasya',async()=>{
 const {withFestivalSeries}=await import('../apps/web/lib/panchanga-today.ts');
 // Kyiv, November 2026: sunrise tithi and tithi at sunset (Pradosha).
 const rows=[['11-05',26,27],['11-06',27,28],['11-07',28,29],['11-08',29,30],['11-09',30,1],['11-10',1,2],['11-11',2,3],['11-12',3,4]];
 const days=rows.map(([d,t,p])=>({date:'2026-'+d,tithi:t,pradoshaTithi:p,observances:d==='11-08'?[{id:'diwali_amavasya'}]:[]}));
 const out=withFestivalSeries(days);
 const kinds=Object.fromEntries(out.map(d=>[d.date.slice(5),dayObservances(d.observances).map(o=>o.kind).join('+')]));
 assert.equal(kinds['11-06'],'dhanteras');
 assert.equal(kinds['11-07'],'naraka_chaturdashi');
 assert.equal(kinds['11-08'],'diwali');
 assert.equal(kinds['11-10'],'govardhan');
 assert.equal(kinds['11-11'],'bhai_dooj');
 assert.equal(kinds['11-12'],'');
 assert.equal(days[0].observances.length,0,'input is not mutated');
});
