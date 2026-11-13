'use client';
import {useState} from 'react';
import {BookOpen,Check,ChevronLeft,ChevronRight,Circle,Coffee,Coins,Flame,Handshake,Heart,Hourglass,House,
 Leaf,Moon,Palette,Plane,Scissors,Sparkles,Star,Sun,Sunrise,Sunset,X,type LucideIcon} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import {dayObservances,isNewStartFriendly,moonLight,periodAt,type ActivityPlan,type DayTier,type HourPeriod,
 type HourQuality,type HourReason,type ObservanceKind,type TodayActivityId} from '../../lib/panchanga-today';
import styles from './PanchangaToday.module.css';

type L=PortalLocale;
const pick=<T,>(l:L,uk:T,en:T)=>l==='uk'?uk:en;
export const clock=(t:number,zone:string)=>new Intl.DateTimeFormat('uk-UA',{timeZone:zone,hour:'2-digit',
 minute:'2-digit',hourCycle:'h23'}).format(new Date(t));
const range=(a:number,b:number,zone:string)=>clock(a,zone)+'–'+clock(b,zone);
const civil=(date:string)=>new Date(date+'T12:00:00Z');
export function dayLabel(date:string,l:L,style:'long'|'short'|'weekday'='long'){
 const opts:Intl.DateTimeFormatOptions=style==='long'?{weekday:'long',day:'numeric',month:'long'}
  :style==='short'?{weekday:'short',day:'numeric'}:{weekday:'long'};
 return new Intl.DateTimeFormat(l==='uk'?'uk-UA':'en-GB',{...opts,timeZone:'UTC'}).format(civil(date));
}
const cap=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
export const addDays=(date:string,n:number)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const daysBetween=(a:string,b:string)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
function inDays(n:number,l:L){
 if(n===0)return pick(l,'сьогодні','today');
 if(n===1)return pick(l,'завтра','tomorrow');
 if(l==='en')return 'in '+n+' days';
 const w=n%10===1&&n%100!==11?'день':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?'дні':'днів';
 return 'через '+n+' '+w;
}

/* ---------- shared hour vocabulary ---------- */
const Q_ICON:Record<HourQuality,LucideIcon>={best:Star,good:Check,ok:Circle,routine:Coffee,avoid:X};
const Q_TITLE:Record<HourQuality,[string,string]>={best:['Найсильніший час дня','Strongest time of the day'],
 good:['Добрий час','Good time'],ok:['Звичайний час','Ordinary time'],
 routine:['Для звичних справ','For routine tasks'],avoid:['Не починайте важливого','Do not start anything important']};
const WHY:Record<HourReason,[string,string]>={
 abhijit:['Полуденне вікно Абхіджіт для важливих рішень.','Abhijit, the midday window for important decisions.'],
 any:['Підходить для будь-яких добрих справ.','Suits any worthwhile undertaking.'],
 gain:['Особливо для грошей, роботи й навчання.','Especially for money, work and study.'],
 people:['Особливо для зустрічей і творчості.','Especially for meetings and creative work.'],
 char:['Добре для поїздок і справ у русі.','Good for travel and things on the move.'],
 vishti:['Триває Бхадра: нове краще не починати.','Bhadra is running: better not to start new things.'],
 chog:['Робота й побут — так, важливі починання — ні.','Work and chores — yes; important beginnings — no.'],
 rahu:['Раху-кала: традиційно невдала частина дня.','Rahu Kalam: a traditionally unlucky part of the day.'],
 yama:['Ямаганда: традиційно невдала частина дня.','Yamaganda: a traditionally unlucky part of the day.'],
 gulika:['Гуліка-кала: традиційно невдала частина дня.','Gulika Kalam: a traditionally unlucky part of the day.']};
const PURPOSE:Partial<Record<HourReason,[string,string]>>={abhijit:['важливі рішення','important decisions'],
 any:['будь-які добрі справи','any worthwhile task'],gain:['гроші, робота й навчання','money, work and study'],
 people:['зустрічі й творчість','meetings and creativity']};

/** Contiguous run of start-friendly hours around t. */
function friendlyRun(plan:HourPeriod[],t:number){
 const i=plan.findIndex(p=>t>=p.startMs&&t<p.endMs);if(i<0)return null;
 let j=i;while(j+1<plan.length&&isNewStartFriendly(plan[j+1].q))j++;
 return {from:plan[i].startMs,until:plan[j].endMs};
}
/** Best upcoming window: Amrit (good for anything) first, then Abhijit, then any good window. */
export function bestWindow(plan:HourPeriod[],from:number){
 const future=plan.filter(p=>p.endMs>from&&isNewStartFriendly(p.q));
 return future.find(p=>p.why==='any')??future.find(p=>p.q==='best')??future[0]??null;
}
const longest=(w:[number,number][])=>w.reduce<[number,number]|null>((a,b)=>!a||b[1]-b[0]>a[1]-a[0]?b:a,null);
/** Prefer a daytime window (starting before 20:00 local) for everyday advice, otherwise the longest. */
const bestDaytime=(w:[number,number][],zone:string)=>longest(w.filter(([a])=>Number(clock(a,zone).slice(0,2))<20))??longest(w);

/* ---------- moon ---------- */
export function MoonDisc({elongation}:{elongation:number}){
 const {waxing,illumination}=moonLight(elongation);
 const r=44,rx=Math.abs(r*(1-2*illumination)).toFixed(1);
 // Lit limb on the right while waxing, on the left while waning (northern-hemisphere view).
 const outer=waxing?'M50 6 A44 44 0 0 1 50 94':'M50 6 A44 44 0 0 0 50 94';
 const crescent=illumination<.5,sweep=waxing?(crescent?0:1):(crescent?1:0);
 return <svg viewBox="0 0 100 100" className={styles.moonDisc} aria-hidden="true">
  <circle cx="50" cy="50" r="44" fill="#1d2b40" stroke="rgba(241,223,182,.25)"/>
  <path d={outer+' A'+rx+' 44 0 0 '+sweep+' 50 6Z'} fill="#f1dfb6"/>
 </svg>;
}

/* ---------- verdict ---------- */
const TIER:Record<DayTier,[string,string]>={good:['Добрий день для нового','A good day for new beginnings'],
 normal:['Звичайний день','An ordinary day'],quiet:['День для поточних справ','A day for ongoing tasks']};
export function Verdict({locale,zone,plan,nextPlan,now,tier,elongation,sunriseMs,sunsetMs,tithi,tithiEndMs,lunarMonth}:{
 locale:L;zone:string;plan:HourPeriod[];nextPlan:HourPeriod[]|null;now:number|null;tier:DayTier|null;elongation:number;
 sunriseMs:number;sunsetMs:number;tithi:number;tithiEndMs:number|null;lunarMonth:string|null}){
 const l=locale,live=now!==null&&now>=plan[0].startMs&&now<plan.at(-1)!.endMs;
 const cur=live?periodAt(plan,now!):null;
 let head:string,body:string;
 if(cur&&isNewStartFriendly(cur.q)){
  const run=friendlyRun(plan,now!)!;
  head=pick(l,'Зараз добрий час — до ','Good time now — until ')+clock(run.until,zone);
  body=pick(l,WHY[cur.why][0],WHY[cur.why][1]);
 }else if(cur&&cur.why==='vishti'){
  const end=plan.filter(p=>p.why==='vishti'&&p.startMs<=now!).at(-1)!.endMs;
  let until=end;for(const p of plan)if(p.startMs===until&&(p.why==='vishti'||p.q==='avoid'))until=p.endMs;
  head=pick(l,'До '+clock(until,zone)+' нове краще не починати','Better not to start new things until '+clock(until,zone));
  body=pick(l,'Триває Бхадра — час, який традиція залишає для звичних справ, прибирання й завершення розпочатого.',
   'Bhadra is running — tradition keeps this time for routine tasks, tidying up and finishing what you began.');
 }else if(cur&&cur.q==='avoid'){
  head=pick(l,'До '+clock(cur.endMs,zone)+' важливого не починайте','Hold important starts until '+clock(cur.endMs,zone));
  body=pick(l,WHY[cur.why][0],WHY[cur.why][1]);
 }else if(live){
  const next=bestWindow(plan,now!);
  head=next?pick(l,'Добрий час для нового: ','Good time for new things: ')+range(next.startMs,next.endMs,zone)
   :pick(l,'До кінця дня — час для звичних справ','Routine tasks for the rest of the day');
  body=cur?pick(l,WHY[cur.why][0],WHY[cur.why][1]):'';
 }else{
  const best=bestWindow(plan,plan[0].startMs);
  head=best?pick(l,'Найкращий час дня: ','Best time of the day: ')+range(best.startMs,best.endMs,zone)
   :pick(l,'День для звичних справ','A day for routine tasks');
  body=best?pick(l,WHY[best.why][0],WHY[best.why][1]):pick(l,'Важливі починання краще перенести на інший день.',
   'Important beginnings are better moved to another day.');
 }
 if(live&&cur&&!isNewStartFriendly(cur.q)){
  const later=bestWindow(plan,cur.endMs);
  body+=' '+(later?pick(l,'Добрий час для нового сьогодні: ','A good window for new things today: ')+range(later.startMs,later.endMs,zone)+'.'
   :pick(l,'Особливо сприятливих годин сьогодні більше немає.','No especially favourable hours remain today.'));
 }
 const from=live?now!:plan[0].startMs;
 const today=bestWindow(plan,from),tomorrow=nextPlan?bestWindow(nextPlan,nextPlan[0].startMs):null;
 const box=today?{w:today,when:live?pick(l,'сьогодні','today'):''}:tomorrow?{w:tomorrow,when:now!==null?pick(l,'завтра','tomorrow'):pick(l,'наступного дня','next day')}:null;
 const moon=moonLight(elongation),lenMin=Math.round((sunsetMs-sunriseMs)/60000);
 return <section className={styles.verdict} aria-labelledby="pt-verdict">
  <div className={styles.moonCol}>
   <MoonDisc elongation={elongation}/>
   <span>{moon.waxing?pick(l,'Місяць росте','Waxing Moon'):pick(l,'Місяць спадає','Waning Moon')}</span>
   <b>{Math.round(moon.illumination*100)}% {pick(l,'освітлено','lit')}</b>
  </div>
  <div>
   {tier&&<span className={styles.tier} data-tier={tier}>{pick(l,TIER[tier][0],TIER[tier][1])}</span>}
   <h2 id="pt-verdict">{head}</h2>
   {body&&<p>{body}</p>}
   {box&&<p className={styles.bestBox}>{pick(l,'Найкраще вікно для важливих справ','Best window for important things')}:{' '}
    <b>{box.when?box.when+' ':''}{range(box.w.startMs,box.w.endMs,zone)}</b>
    {PURPOSE[box.w.why]&&<> ({pick(l,PURPOSE[box.w.why]![0],PURPOSE[box.w.why]![1])})</>}</p>}
   <ul className={styles.facts}>
    <li><Sunrise size={16} aria-hidden="true"/>{pick(l,'Схід','Sunrise')} <b>{clock(sunriseMs,zone)}</b></li>
    <li><Sunset size={16} aria-hidden="true"/>{pick(l,'Захід','Sunset')} <b>{clock(sunsetMs,zone)}</b></li>
    <li><Hourglass size={16} aria-hidden="true"/>{pick(l,'Світловий день','Daylight')} <b>{Math.floor(lenMin/60)} {pick(l,'год','h')} {lenMin%60} {pick(l,'хв','min')}</b></li>
    <li><Moon size={16} aria-hidden="true"/>{pick(l,tithi+'-й місячний день',ordinal(tithi)+' lunar day')}
     {tithiEndMs!==null&&<>{pick(l,', з ',', from ')}{clock(tithiEndMs,zone)} — {pick(l,(tithi%30+1)+'-й',ordinal(tithi%30+1))}</>}</li>
    {lunarMonth&&<li><Sparkles size={16} aria-hidden="true"/>{pick(l,'Ведичний місяць','Vedic month')} <b>{lunarMonth}</b></li>}
   </ul>
  </div>
 </section>;
}
function ordinal(n:number){const s=n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]??'th';return n+s;}

/* ---------- hours of the day ---------- */
export function HoursOfDay({locale,zone,days,now}:{locale:L;zone:string;now:number|null;
 days:{date:string;plan:HourPeriod[];isToday:boolean}[]}){
 const l=locale,[tab,setTab]=useState(0);
 const tabs=days.map((d,i)=>{
  const rel=d.isToday?pick(l,'Сьогодні','Today'):i===1&&days[0].isToday?pick(l,'Завтра','Tomorrow'):'';
  return (rel?rel+', ':'')+dayLabel(d.date,l,'short');
 });
 const shown=days[Math.min(tab,days.length-1)];
 return <section className={styles.card} aria-labelledby="pt-hours" data-testid="panchanga-hours">
  <div className={styles.secHead}>
   <h2 id="pt-hours">{pick(l,'Години дня','Hours of the day')}</h2>
   {days.length>1&&<div className={styles.tabs} role="tablist" aria-label={pick(l,'День','Day')}>
    {tabs.map((label,i)=><button key={i} type="button" role="tab" aria-selected={tab===i} onClick={()=>setTab(i)}>{label}</button>)}
   </div>}
  </div>
  <HoursPanel locale={l} zone={zone} plan={shown.plan} now={shown.isToday?now:null}
   followUp={days[1]&&tab===0?days[1].plan:null}/>
  <div className={styles.legend}>{(['best','good','ok','routine','avoid'] as const).map(q=>
   <span key={q}><i data-q={q}/>{pick(l,Q_TITLE[q][0],Q_TITLE[q][1])}</span>)}</div>
 </section>;
}
function HoursPanel({locale,zone,plan,now,followUp}:{locale:L;zone:string;plan:HourPeriod[];now:number|null;followUp:HourPeriod[]|null}){
 const l=locale,start=plan[0].startMs,end=plan.at(-1)!.endMs,live=now!==null&&now>=start&&now<end;
 const pct=(t:number)=>((t-start)/(end-start)*100);
 const cur=live?periodAt(plan,now!):null;
 const goodCount=plan.filter(p=>isNewStartFriendly(p.q)).length;
 let summary:{q:HourQuality;title:string;text:string};
 if(cur){
  const later=bestWindow(plan,now!);
  const nextText=later&&later!==cur?pick(l,'Наступний добрий час: ','Next good time: ')+range(later.startMs,later.endMs,zone)+'.'
   :!isNewStartFriendly(cur.q)&&followUp&&bestWindow(followUp,followUp[0].startMs)
    ?pick(l,'Добрих годин для нового сьогодні вже немає. Наступний добрий час: завтра ','No good hours for new things remain today. Next good time: tomorrow ')
     +range(bestWindow(followUp,followUp[0].startMs)!.startMs,bestWindow(followUp,followUp[0].startMs)!.endMs,zone)+'.':'';
  summary={q:cur.q,title:pick(l,'Зараз ','Now ')+clock(now!,zone)+': '+pick(l,Q_TITLE[cur.q][0],Q_TITLE[cur.q][1]).toLowerCase()+'.',
   text:(isNewStartFriendly(cur.q)?pick(l,WHY[cur.why][0],WHY[cur.why][1])+' ':'')+nextText};
 }else{
  const best=bestWindow(plan,start);
  summary={q:best?best.q:'routine',title:goodCount?pick(l,goodWindows(goodCount),goodWindowsEn(goodCount)):
   pick(l,'Добрих вікон для нового немає.','No good windows for new things.'),
   text:best?pick(l,'Найважливіше плануйте на ','Plan the most important things for ')+range(best.startMs,best.endMs,zone)+'.'
    :pick(l,'Цей день добрий для звичних справ і завершення розпочатого.','This day suits routine tasks and finishing what you began.')};
 }
 const Icon=Q_ICON[summary.q];
 const ticks:number[]=[];
 for(let h=Math.ceil(start/3600000)*3600000;h<end;h+=3600000){
  const hour=Number(clock(h,zone).slice(0,2));if(hour%3===0&&pct(h)>5&&pct(h)<95)ticks.push(h);
 }
 const past=live?plan.filter(p=>p.endMs<=now!):[];
 const rest=plan.filter(p=>!past.includes(p));
 const row=(p:HourPeriod)=>{
  const state=live&&p.endMs<=now!?'past':live&&p.startMs<=now!&&now!<p.endMs?'now':undefined;
  const I=Q_ICON[p.q];
  return <li key={p.startMs} data-q={p.q} data-state={state}>
   <span className={styles.agTime}>{clock(p.startMs,zone)}<small>{clock(p.endMs,zone)}</small></span>
   <span className={styles.qDot} aria-hidden="true"><I size={15} strokeWidth={2.2}/></span>
   <span><b>{pick(l,Q_TITLE[p.q][0],Q_TITLE[p.q][1])}</b>
    {state==='now'&&<i className={styles.nowTag}>{pick(l,'зараз','now')}</i>}
    {state==='past'&&<i className={styles.pastTag}>{pick(l,'минуло','past')}</i>}
    <small>{pick(l,WHY[p.why][0],WHY[p.why][1])}</small></span>
  </li>;
 };
 return <>
  <div className={styles.nowCard} data-q={summary.q}>
   <span className={styles.qDot} aria-hidden="true"><Icon size={15} strokeWidth={2.2}/></span>
   <p><b>{summary.title}</b>{summary.text&&<><br/>{summary.text}</>}</p>
  </div>
  <div className={styles.ribbon} aria-hidden="true">
   <span className={styles.ribbonEnd}><Sun size={13}/>{clock(start,zone)}</span>
   <div className={styles.track}>
    {plan.map(p=><span key={p.startMs} className={styles.seg} data-q={p.q} data-past={live&&p.endMs<=now!?'1':undefined}
     style={{left:pct(p.startMs)+'%',width:(pct(p.endMs)-pct(p.startMs))+'%'}}/>)}
    {live&&<span className={styles.nowPin} style={{left:pct(now!)+'%'}}><b>{pick(l,'зараз','now')} {clock(now!,zone)}</b></span>}
    {ticks.map(t=><span key={t} className={styles.tick} style={{left:pct(t)+'%'}}>{clock(t,zone)}</span>)}
   </div>
   <span className={styles.ribbonEnd}>{clock(end,zone)}<Moon size={13}/></span>
  </div>
  {past.length>0&&<details className={styles.fold}><summary>{pick(l,'Минуло: ','Past: ')}{range(past[0].startMs,past.at(-1)!.endMs,zone)}
   {' · '}{pick(l,'показати '+past.length,'show '+past.length)}</summary><ol className={styles.agenda}>{past.map(row)}</ol></details>}
  <ol className={styles.agenda}>{rest.map(row)}</ol>
 </>;
}
const goodWindows=(n:number)=>({1:'Є одне добре вікно.',2:'Є два добрі вікна.',3:'Є три добрі вікна.',4:'Є чотири добрі вікна.'} as Record<number,string>)[n]??'Є '+n+' добрих вікон.';
const goodWindowsEn=(n:number)=>n===1?'There is one good window.':'There are '+n+' good windows.';

/* ---------- activities ---------- */
const ACT:Record<TodayActivityId,{icon:LucideIcon;t:[string,string];hint:[string,string]}>={
 money:{icon:Coins,t:['Гроші й покупки','Money & purchases'],hint:['Великі покупки, оплати, фінансові рішення.','Big purchases, payments, financial decisions.']},
 work:{icon:Handshake,t:['Робота й переговори','Work & negotiations'],hint:['Угоди, переговори, нові домовленості.','Deals, negotiations, new agreements.']},
 study:{icon:BookOpen,t:['Навчання','Study'],hint:['Перший урок, курс або складна тема.','A first lesson, a course or a hard topic.']},
 travel:{icon:Plane,t:['Поїздки','Travel'],hint:['Виїзд у дорогу, коротка поїздка.','Setting off, a short trip.']},
 love:{icon:Heart,t:['Знайомства й побачення','Dating & meeting people'],hint:['Перше побачення, нові знайомства.','A first date, new acquaintances.']},
 arts:{icon:Palette,t:['Творчість','Creativity'],hint:['Музика, малювання, новий творчий задум.','Music, drawing, a new creative idea.']},
 home:{icon:House,t:['Ремонт і дім','Home & repairs'],hint:['Початок ремонту, великі домашні справи.','Starting repairs, big household jobs.']},
 hair:{icon:Scissors,t:['Стрижка й догляд','Haircut & grooming'],hint:['Стрижка, гоління, манікюр.','Haircut, shaving, manicure.']},
 spirit:{icon:Flame,t:['Духовна практика','Spiritual practice'],hint:['Медитація, молитва, тиша.','Meditation, prayer, quiet.']}};
const BADGE:Record<ActivityPlan['status'],[string,string]>={good:['Добре','Good'],later:['Пізніше','Later'],
 ok:['Можна','Possible'],okLater:['Пізніше','Later'],no:['Відкласти','Postpone']};
export function ActivityCards({locale,zone,plans,nextPlans,isToday,nextHaircut,spiritWindow}:{
 locale:L;zone:string;plans:ActivityPlan[];nextPlans:ActivityPlan[]|null;isToday:boolean;
 nextHaircut:string|null;spiritWindow:{when:string;from:number;until:number}|null}){
 const l=locale,day=isToday?pick(l,'сьогодні','today'):pick(l,'цього дня','this day');
 return <section className={styles.card} aria-labelledby="pt-acts" data-testid="panchanga-activities">
  <div className={styles.secHead}><h2 id="pt-acts">{isToday?pick(l,'Що добре робити сьогодні','What is good to do today')
   :pick(l,'Що добре робити цього дня','What is good to do this day')}</h2>
   <span>{pick(l,'оцінки для вашого міста','for your city')}</span></div>
  <div className={styles.acts}>{plans.map(p=>{
   const a=ACT[p.id],next=nextPlans?.find(x=>x.id===p.id);
   const best=next?bestDaytime(next.windows,zone):null;
   const tomorrow=best?pick(l,'Найкраще вікно: ','Best window: ')+(isToday?pick(l,'завтра ','tomorrow '):pick(l,'наступного дня ','next day '))+range(best[0],best[1],zone):null;
   let line:string,note:string;
   if(p.id==='hair'){
    line=p.status==='good'?pick(l,'Добрий день для стрижки','A good day for a haircut')
     :cap(day)+' '+pick(l,'краще не стригтися','is better skipped');
    note=p.status==='good'?pick(l,a.hint[0],a.hint[1]):nextHaircut?pick(l,'Наступний добрий день: ','Next good day: ')+nextHaircut:pick(l,a.hint[0],a.hint[1]);
   }else if(p.id==='spirit'){
    line=cap(day)+' — '+pick(l,'добре','good');
    note=spiritWindow?pick(l,'Особливо сприятливо: ','Especially favourable: ')+spiritWindow.when+' '+range(spiritWindow.from,spiritWindow.until,zone):pick(l,a.hint[0],a.hint[1]);
   }else if(p.status==='good'){
    line=pick(l,'Зараз, до ','Now, until ')+clock(p.goodUntilMs!,zone);
    note=p.windows[1]?pick(l,'Ще: ','Also: ')+range(p.windows[1][0],p.windows[1][1],zone):pick(l,a.hint[0],a.hint[1]);
   }else if(p.status==='later'){
    line=pick(l,'Найкраще: ','Best: ')+range(p.windows[0][0],p.windows[0][1],zone);
    note=p.windows[1]?pick(l,'Ще: ','Also: ')+range(p.windows[1][0],p.windows[1][1],zone):pick(l,a.hint[0],a.hint[1]);
   }else if(p.status==='ok'){
    line=pick(l,'Можна, без особливої підтримки','Possible, without special support');
    note=tomorrow??pick(l,a.hint[0],a.hint[1]);
   }else if(p.status==='okLater'){
    line=pick(l,'Можна з ','Possible from ')+clock(p.okFromMs!,zone);
    note=tomorrow??pick(l,a.hint[0],a.hint[1]);
   }else{
    line=cap(day)+' '+pick(l,'краще відкласти','is better postponed');
    note=tomorrow??pick(l,a.hint[0],a.hint[1]);
   }
   const I=a.icon;
   return <article key={p.id} className={styles.act} data-status={p.status} data-testid="panchanga-activity">
    <div className={styles.actTop}><span className={styles.glyph} aria-hidden="true"><I size={22} strokeWidth={1.6}/></span>
     <span className={styles.badge}>{pick(l,BADGE[p.status][0],BADGE[p.status][1])}</span></div>
    <h3>{pick(l,a.t[0],a.t[1])}</h3><p className={styles.actLine}>{line}</p><p className={styles.actNote}>{note}</p>
   </article>;
  })}</div>
 </section>;
}

/* ---------- festivals ---------- */
const SIGNS_UK=['Овна','Тельця','Близнюків','Рака','Лева','Діви','Терезів','Скорпіона','Стрільця','Козорога','Водолія','Риб'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const OBS:Record<ObservanceKind,{icon:LucideIcon;t:[string,string];d:[string,string]}>={
 ekadashi:{icon:Leaf,t:['Екадаші','Ekadashi'],d:['11-й день місячної половини, день посту й тиші. Традиційно їдять легко або постять і більше часу дають молитві.','The 11th day of each lunar half, a day of fasting and quiet. People eat lightly or fast and give more time to prayer.']},
 pradosha:{icon:Flame,t:['Прадоша','Pradosha'],d:['Вечір 13-го місячного дня, присвячений Шиві. Добрий час для вечірньої молитви.','The evening of the 13th lunar day, devoted to Shiva. A good time for evening prayer.']},
 purnima:{icon:Circle,t:['Пурніма, повня','Purnima, Full Moon'],d:['Повний Місяць. День вдячності, медитації й пожертви.','Full Moon. A day of gratitude, meditation and giving.']},
 amavasya:{icon:Moon,t:['Амавасья, молодик','Amavasya, New Moon'],d:['Тихий день памʼяті предків. Нове в цей день традиційно не починають.','A quiet day to honour ancestors. Traditionally nothing new is started.']},
 sankranti:{icon:Sun,t:['Санкранті','Sankranti'],d:['Сонце переходить у новий знак. День подяки, пожертви й підсумків.','The Sun enters a new sign. A day of thanks, giving and taking stock.']},
 rama_navami:{icon:Sparkles,t:['Рама Навамі','Rama Navami'],d:['День народження Рами, свято праведності й вірності слову.','Rama’s birthday, a festival of righteousness and keeping one’s word.']},
 ganesh_chaturthi:{icon:Sparkles,t:['Ґанеша Чатуртхі','Ganesh Chaturthi'],d:['Свято Ґанеші, що усуває перешкоди. Добрий день для нових починань.','Festival of Ganesha, remover of obstacles. A good day for beginnings.']},
 chaitra_navratri:{icon:Sparkles,t:['Чайтра Наваратрі','Chaitra Navratri'],d:['Девʼять весняних ночей Богині: піст, молитва, очищення.','Nine spring nights of the Goddess: fasting, prayer, purification.']},
 sharad_navratri:{icon:Sparkles,t:['Шарад Наваратрі','Sharad Navratri'],d:['Девʼять осінніх ночей Богині, найбільше свято Дурґи.','Nine autumn nights of the Goddess, the great festival of Durga.']},
 guru_purnima:{icon:Sparkles,t:['Ґуру Пурніма','Guru Purnima'],d:['Повня вдячності вчителям і наставникам.','A Full Moon of gratitude to teachers and mentors.']},
 janmashtami:{icon:Sparkles,t:['Крішна Джанмаштамі','Krishna Janmashtami'],d:['Ніч народження Крішни: піст до півночі, співи й молитва.','The night of Krishna’s birth: fasting until midnight, songs and prayer.']},
 maha_shivaratri:{icon:Sparkles,t:['Маха Шиваратрі','Maha Shivaratri'],d:['Велика ніч Шиви: піст, нічна медитація й мантри.','The great night of Shiva: fasting, night meditation and mantras.']},
 diwali:{icon:Sparkles,t:['Дівалі, Лакшмі-пуджа','Diwali, Lakshmi Puja'],d:['Головна ніч пʼятиденного свята світла: вогні, молитва Лакшмі, вдячність і зустрічі з рідними.','The main night of the five-day festival of light: lamps, prayer to Lakshmi, gratitude and family gatherings.']},
 dhanteras:{icon:Sparkles,t:['Дхантерас','Dhanteras'],d:['Перший день Дівалі: прибирання дому, перші вогні, традиційні покупки металу й посуду.','The first day of Diwali: cleaning the home, the first lamps, traditional purchases of metal and utensils.']},
 naraka_chaturdashi:{icon:Sparkles,t:['Нарака Чатурдаші, мала Дівалі','Naraka Chaturdashi, Choti Diwali'],d:['Другий день Дівалі: ранкове омовення, вогні на порозі, перемога світла над темрявою.','The second day of Diwali: an early bath, lamps at the threshold, light over darkness.']},
 govardhan:{icon:Sparkles,t:['Говардхан-пуджа','Govardhan Puja'],d:['Четвертий день Дівалі: пам’ять про Крішну, що підняв пагорб Говардхан; щедре частування.','The fourth day of Diwali: Krishna lifting Govardhan hill; a generous food offering.']},
 bhai_dooj:{icon:Heart,t:['Бхай Дудж','Bhai Dooj'],d:['Останній день Дівалі: свято братів і сестер, тілак і молитва одне за одного.','The last day of Diwali: brothers and sisters, a tilak and prayers for each other.']}};
export const observanceShort=(k:ObservanceKind,l:L)=>pick(l,OBS[k].t[0],OBS[k].t[1]).split(',')[0];
export type UpcomingDay={date:string;observances:{id:string;metadata?:Record<string,unknown>}[]};
export function Upcoming({locale,from,days,today}:{locale:L;from:string;today:string|null;days:UpcomingDay[]|null}){
 const l=locale;
 const items=(days??[]).filter(d=>d.date>=from).flatMap(d=>dayObservances(d.observances).map(o=>({date:d.date,...o}))).slice(0,5);
 return <section className={styles.card} aria-labelledby="pt-fest" data-testid="panchanga-upcoming">
  <div className={styles.secHead}><h2 id="pt-fest">{pick(l,'Найближчі свята й пости','Upcoming festivals & fasts')}</h2></div>
  {days===null?<p className={styles.muted} role="status">{pick(l,'Рахуємо календар…','Calculating the calendar…')}</p>
  :items.length===0?<p className={styles.muted}>{pick(l,'Найближчим місяцем особливих днів немає.','No special days in the coming month.')}</p>
  :<ul className={styles.events}>{items.map(e=>{
   const o=OBS[e.kind],I=o.icon,n=today?daysBetween(today,e.date):null;
   const desc=e.kind==='sankranti'&&e.toSign?pick(l,'Сонце переходить у знак '+SIGNS_UK[e.toSign-1]+'. День подяки, пожертви й підсумків.',
    'The Sun enters '+SIGNS_EN[e.toSign-1]+'. A day of thanks, giving and taking stock.'):pick(l,o.d[0],o.d[1]);
   return <li key={e.date+e.kind}><span className={styles.glyph} aria-hidden="true"><I size={20} strokeWidth={1.6}/></span><div>
    <p className={styles.evWhen}>{dayLabel(e.date,l)}{n!==null&&n>=0?' · '+inDays(n,l):''}</p>
    <h3>{pick(l,o.t[0],o.t[1])}</h3><p>{desc}</p></div></li>;
  })}</ul>}
  <p className={styles.small}>{pick(l,'Дати свят залежать від місцевості й традиції. Для постів дотримуйтесь календаря своєї школи.',
   'Festival dates vary by place and tradition. For fasts, follow the calendar of your own school.')}</p>
 </section>;
}

/* ---------- month ---------- */
export type MonthCell={date:string;tier:DayTier|null;tag:string|null;phase:'new_moon'|'full_moon'|'first_quarter'|'last_quarter'|null};
export function MonthCalendar({locale,month,cells,selected,today,onPick,onMonth}:{locale:L;month:string;cells:MonthCell[]|null;
 selected:string;today:string|null;onPick:(date:string)=>void;onMonth:(delta:number)=>void}){
 const l=locale,first=civil(month+'-01');
 const title=cap(new Intl.DateTimeFormat(l==='uk'?'uk-UA':'en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(first));
 const lead=(first.getUTCDay()+6)%7;
 const heads=l==='uk'?['Пн','Вт','Ср','Чт','Пт','Сб','Нд']:['Mo','Tu','We','Th','Fr','Sa','Su'];
 return <section className={styles.card} aria-labelledby="pt-month" data-testid="panchanga-month">
  <div className={styles.secHead}><h2 id="pt-month">{title}</h2>
   <span className={styles.monthNav}>
    <button type="button" onClick={()=>onMonth(-1)} aria-label={pick(l,'Попередній місяць','Previous month')}><ChevronLeft size={18}/></button>
    <button type="button" onClick={()=>onMonth(1)} aria-label={pick(l,'Наступний місяць','Next month')}><ChevronRight size={18}/></button>
   </span></div>
  {cells===null?<p className={styles.muted} role="status">{pick(l,'Рахуємо місяць…','Calculating the month…')}</p>:<>
   <div className={styles.cal}>
    {heads.map(h=><span key={h} className={styles.calHead}>{h}</span>)}
    {Array.from({length:lead},(_,i)=><span key={'e'+i}/>)}
    {cells.map(c=><button type="button" key={c.date} className={styles.calCell} data-tier={c.tier??undefined}
      data-testid="panchanga-month-day" aria-current={c.date===selected?'date':undefined} data-today={c.date===today?'1':undefined}
      aria-label={dayLabel(c.date,l)+(c.tag?' · '+c.tag:'')} onClick={()=>onPick(c.date)}>
     <b>{Number(c.date.slice(8))}</b>
     {c.phase==='new_moon'||c.phase==='full_moon'?<i className={styles.phase} data-phase={c.phase} aria-hidden="true"/>:null}
     {c.tag&&<small>{c.tag}</small>}
    </button>)}
   </div>
   <div className={styles.legend}>
    <span><i data-tier="good"/>{pick(l,'Добрий день для нового','Good for new things')}</span>
    <span><i data-tier="normal"/>{pick(l,'Звичайний','Ordinary')}</span>
    <span><i data-tier="quiet"/>{pick(l,'День для тиші','Quiet day')}</span>
    <span><i className={styles.phase} data-phase="new_moon"/>{pick(l,'молодик','new moon')} <i className={styles.phase} data-phase="full_moon"/>{pick(l,'повня','full moon')}</span>
   </div>
   <p className={styles.small}>{pick(l,'Колір дня — за пʼятьма показниками на сході Сонця. Натисніть день, щоб побачити його години.',
    'Day colours use the five limbs at sunrise. Tap a day to see its hours.')}</p>
  </>}
 </section>;
}
