'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Moon,CalendarDays,Sparkles,Orbit,CircleDot,Clock3,BriefcaseBusiness,
 Wallet,Heart,Plane,GraduationCap,House,Flower2,Palette,ChevronDown} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import type {P31Day} from '../../lib/panchanga-p31-model';
import {interpretPanchanga,type P32Day} from '../../lib/panchanga-p32-engine';
import {explainClassicalPanchanga} from '../../lib/panchanga-p37-classical';
import {evaluateP38,p38Activity,P38_ACTIVITIES,type P38Category,
 type P38ActivityId,type P38Moment} from '../../lib/panchanga-p38-decision';
import {validateP33Report,type P33Report} from '../../lib/panchanga-p33-resonance';
import {p389Guidance,p389WindowReason} from '../../lib/panchanga-p389-guidance';
import styles from './PanchangaCleanDay.module.css';

type Point={date:string;timeZone:string;latitude:string;longitude:string;place:string};
type UserState='loading'|'ready'|'guest'|'no_chart'|'error';
type SavedChart={id:string;place:string;date:string;ascendant:string};
type FinderWindow={startUtc:string;endUtc:string;status:string;reasonIds:string[];score?:number|null};
type FinderResult={status:string;candidate:FinderWindow|null;review:FinderWindow|null;
 topCandidates?:FinderWindow[];daysRequested?:number;searchThroughUtc?:string;divisionFocus?:string};
const CATEGORIES:{id:P38Category;uk:string;en:string;icon:typeof BriefcaseBusiness}[]=[
 {id:'work',uk:'Робота',en:'Work',icon:BriefcaseBusiness},
 {id:'finance',uk:'Гроші',en:'Finance',icon:Wallet},
 {id:'relationships',uk:'Стосунки',en:'Relationships',icon:Heart},
 {id:'travel',uk:'Подорожі',en:'Travel',icon:Plane},
 {id:'education',uk:'Навчання',en:'Education',icon:GraduationCap},
 {id:'home',uk:'Дім',en:'Home',icon:House},
 {id:'spiritual',uk:'Практики',en:'Practices',icon:Flower2},
 {id:'personal',uk:'Творчість',en:'Creative',icon:Palette}
];
const ICONS={tithi:Moon,nakshatra:Sparkles,vara:CalendarDays,yoga:Orbit,karana:CircleDot};
const VARA_UK:Record<string,string>={Ravivara:'Неділя',Somavara:'Понеділок',
 Mangalavara:'Вівторок',Budhavara:'Середа',Guruvara:'Четвер',
 Shukravara:'П’ятниця',Shanivara:'Субота'};
const YOGA_UK=['Вішкумбха','Пріті','Аюшман','Саубхаг’я','Шобхана','Атіганда',
 'Сукарма','Дхріті','Шула','Ганда','Вріддхі','Дхрува','В’ягхата','Харшана',
 'Ваджра','Сіддхі','В’ятіпата','Варіяна','Парігха','Шіва','Сіддха',
 'Садх’я','Шубха','Шукла','Брахма','Індра','Вайдхріті'];

const TOPIC:Record<P38Category,'work'|'money'|'relationships'|'travel'|'study'|'home'|'personal'>={
 work:'work',finance:'money',relationships:'relationships',travel:'travel',
 education:'study',home:'home',spiritual:'personal',personal:'personal'
};
const DECISION={
 supports:{uk:'Підтримує',en:'Supports'},
 cautions:{uk:'Застереження',en:'Caution'},
 excludes:{uk:'Обмеження',en:'Restriction'},
 context:{uk:'Контекст',en:'Context'}
} as const;
const CLOCK=(iso:string,zone:string,locale:PortalLocale)=>new Intl.DateTimeFormat(
 locale==='uk'?'uk-UA':'en-GB',{timeZone:zone,day:'numeric',month:'short',
 hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
function targetTime(day:P31Day,point:Point,now:number,focusAtUtc:string|null){
 const a=Date.parse(day.sunriseUtc),b=Date.parse(day.nextSunriseUtc);
 const focus=focusAtUtc?Date.parse(focusAtUtc):NaN;
  const at=Number.isFinite(focus)&&focus>=a&&focus<b?focus:now>=a&&now<b?now:a+1000;
 return new Date(at).toISOString();
}
export default function PanchangaMyDay({locale,day,point,activity,onActivityChange,focusAtUtc=null,onResetToday}:{
 locale:PortalLocale;day:P31Day;point:Point;activity:P38ActivityId;
 onActivityChange:(id:P38ActivityId)=>void;focusAtUtc?:string|null;onResetToday:()=>void;
}){
 const uk=locale==='uk',verifiedDay=day as P32Day;
 const category=p38Activity(activity).category;
 const [capturedNow,setCapturedNow]=useState<number|null>(null);
 const [chosenTimeUtc,setChosenTimeUtc]=useState<string|null>(null);
 const [privateReport,setPrivateReport]=useState<P33Report|null>(null);
 const [userState,setUserState]=useState<UserState>('loading');
 const [finder,setFinder]=useState<FinderResult|null>(null);
 const [finderState,setFinderState]=useState<'idle'|'loading'|'error'>('idle');
 const [duration,setDuration]=useState<7|30>(7);
 const [partnerId,setPartnerId]=useState('');
 const [charts,setCharts]=useState<SavedChart[]>([]);
 const [chartState,setChartState]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 const pointKey=[point.date,point.timeZone,point.latitude,point.longitude].join('|');
 useEffect(()=>{setCapturedNow(Date.now());setChosenTimeUtc(null);
  setPrivateReport(null);setFinder(null);
  setFinderState('idle');},[day,pointKey,focusAtUtc]);
 const defaultIso=capturedNow===null?null:targetTime(day,point,capturedNow,focusAtUtc);
 const selectedTime=chosenTimeUtc?Date.parse(chosenTimeUtc):NaN;
 const iso=defaultIso===null?null:Number.isFinite(selectedTime)&&
  selectedTime>=Date.parse(day.sunriseUtc)&&selectedTime<Date.parse(day.nextSunriseUtc)?
  chosenTimeUtc:defaultIso;
 const activityInfo=p38Activity(activity);
 const relevant=P38_ACTIVITIES.filter(a=>a.category===category);
 const requiresPartner=activityInfo.required.includes('partner_chart');
 useEffect(()=>{if(!iso)return;
  let alive=true;const ctl=new AbortController();
  setUserState('loading');setPrivateReport(null);
  const q=new URLSearchParams({date:point.date,zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude,at:iso});
  fetch('/api/v1/personal/panchanga/resonance?'+q,{
   cache:'no-store',credentials:'same-origin',signal:ctl.signal
  }).then(async r=>{
   if(r.status===401)return {status:'guest'};
   if(!r.ok)throw Error('private natal unavailable');
   return await r.json();
  }).then(p=>{
   if(!alive)return;
   if(p.status==='guest'){setUserState('guest');return;}
   if(p.status==='requires_primary_chart'||p.status==='requires_verified_chart'){
    setUserState('no_chart');return;
   }
   validateP33Report(p as P33Report,point,verifiedDay,iso);
   setPrivateReport(p as P33Report);setUserState('ready');
  }).catch(()=>{if(alive&&!ctl.signal.aborted)setUserState('error')});
  return()=>{alive=false;ctl.abort()};
 },[iso,pointKey,day]);
 useEffect(()=>{setFinder(null);setFinderState('idle')},[activity,duration,partnerId]);
 useEffect(()=>{
  if(!requiresPartner||chartState!=='idle')return;
  let alive=true,ctl=new AbortController();setChartState('loading');
  Promise.all([
   fetch('/api/v1/account/charts',{credentials:'same-origin',cache:'no-store',signal:ctl.signal}),
   fetch('/api/v1/personal/profile',{credentials:'same-origin',cache:'no-store',signal:ctl.signal})
  ]).then(async ([list,profile])=>{
   if(!list.ok||!profile.ok)throw Error('private chart list unavailable');
   const c=await list.json() as SavedChart[];
   const p=await profile.json() as {profile?:{primaryChartId?:string|null}};
   const primary=p.profile?.primaryChartId;
   return Array.isArray(c)?c.filter(chart=>chart.id!==primary):[];
  }).then(c=>{if(alive){setCharts(c);setChartState('ready')}})
   .catch(()=>{if(alive&&!ctl.signal.aborted)setChartState('error')});
  return()=>{alive=false;ctl.abort()};
 },[requiresPartner,chartState]);
 const screening=useMemo(():P38Moment|null=>{
  if(!iso)return null;
  try{return evaluateP38(verifiedDay,iso,activity,privateReport?{point,report:privateReport}:undefined)}
  catch{return null}
 },[day,pointKey,iso,activity,privateReport]);
 const cards=useMemo(()=>{
  if(!iso||!screening)return null;
  try{
   const classic=interpretPanchanga(verifiedDay,Date.parse(iso),TOPIC[category],'at-instant');
   return explainClassicalPanchanga(verifiedDay,classic);
  }catch{return null}
 },[day,iso,category,screening]);
 const guidance=useMemo(()=>screening?p389Guidance(screening,locale):null,[screening,locale]);
 const timeOptions=useMemo(()=>{
  if(!iso)return [];
  const from=Date.parse(day.sunriseUtc),until=Date.parse(day.nextSunriseUtc);
  const choices=new Set<string>([iso]);
  // UTC instants distinguish even repeated local wall-clock hours at DST transitions.
  for(let t=from+60000;t<until;t+=30*60000)
   choices.add(new Date(t).toISOString());
  return [...choices].sort();
 },[day,iso]);
 const dayHasPassed=capturedNow!==null&&Date.parse(day.nextSunriseUtc)<=capturedNow;
 const searchStart=capturedNow===null?null:new Date(Math.max(
  capturedNow+120000,Date.parse(day.sunriseUtc)+60000,
  iso?Date.parse(iso):0)).toISOString();
 const canSearch=Boolean(searchStart&&!dayHasPassed&&userState==='ready'&&
  (!requiresPartner||partnerId)&&finderState!=='loading'&&activityInfo.method!=='routine');
 const clock=(v:string)=>CLOCK(v,point.timeZone,locale);
 const windowReasons=(ids:string[])=>
  [...new Set(ids.map(id=>p389WindowReason(id,locale)).filter((x):x is string=>Boolean(x)))].slice(0,7);
 async function runSearch(){
  if(!canSearch||!searchStart)return;
  setFinder(null);setFinderState('loading');
  try{
   const response=await fetch('/api/v1/personal/panchanga/time-finder',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({activityId:activity,atUtc:searchStart,timeZone:point.timeZone,
     latitude:Number(point.latitude),longitude:Number(point.longitude),
     days:duration,...(requiresPartner?{partnerChartId:partnerId}:{})})
   });
   if(!response.ok)throw Error('Time Finder HTTP '+response.status);
   const json=await response.json() as FinderResult;
   if(!json||typeof json.status!=='string'||!['candidate_found','review_only',
    'none_in_checked_range','requires_primary_chart','requires_verified_chart',
    'requires_partner_chart','requires_verified_partner_chart'].includes(json.status))
    throw Error('Invalid Time Finder response');
   if(['candidate_found','review_only','none_in_checked_range'].includes(json.status)){
    if(!json.searchThroughUtc||!Number.isFinite(Date.parse(json.searchThroughUtc)))
     throw Error('Incomplete verified horizon');
    if(json.candidate&&(!Number.isFinite(Date.parse(json.candidate.startUtc))||
     !Number.isFinite(Date.parse(json.candidate.endUtc))))
     throw Error('Invalid candidate UTC');
   }
   setFinder(json);setFinderState('idle');
  }catch{setFinderState('error')}
 }
 return <section className={styles.dashboard} data-testid="p31-my-day">
  <header className={styles.top}>
   <div><span className={styles.eyebrow}>GALAXIORA · {uk?'ПАНЧАНГА':'PANCHANGA'}</span>
    <h2>{uk?'Перевірка конкретної події':'Specific event timing'}</h2></div>
   {iso&&<span className={styles.moment}><Clock3 size={15}/>
     {focusAtUtc&&(iso===focusAtUtc)?(uk?'Обраний інтервал · ':'Selected interval · '):''}{clock(iso)}</span>}
  </header>
  <div className={styles.advice}>
   <h3 className={styles.adviceLabel}>{uk?'Що плануєте?':'What are you planning?'}</h3>
   <div className={styles.momentRow}>
    <label className={styles.momentSelector}>
     {uk?'Оберіть конкретний момент для перевірки':'Choose an exact moment to screen'}
     <select data-testid="p389-time-select" value={iso||''}
      disabled={!iso} onChange={e=>setChosenTimeUtc(e.target.value)}>
      {timeOptions.map(t=><option value={t} key={t}>
       {new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{timeZone:point.timeZone,
        day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',
        timeZoneName:'shortOffset'}).format(new Date(t))}
      </option>)}
     </select>
    </label>
    <button className={styles.todayButton} type="button" onClick={onResetToday}
     data-testid="p390-reset-today">{uk?'Сьогодні':'Today'}</button>
   </div>
   <div className={styles.topicButtons} role="group" aria-label={uk?'Категорія справи':'Activity category'}>
    {CATEGORIES.map(c=>{const Icon=c.icon;return <button type="button" key={c.id}
     aria-pressed={category===c.id} onClick={()=>onActivityChange(P38_ACTIVITIES.find(a=>a.category===c.id)!.id)}>
      <Icon size={17} aria-hidden="true"/>{c[locale]}</button>})}
   </div>
   <label className={styles.activitySelector}>
    {uk?'Конкретна справа':'Specific activity'}
    <span className={styles.selectWrap}>
     <select value={activity} onChange={e=>onActivityChange(e.target.value as P38ActivityId)}
      data-testid="p386-activity-select">
      {relevant.map(a=><option key={a.id} value={a.id}>{a.name[locale]}</option>)}
     </select><ChevronDown size={17} aria-hidden="true"/></span>
   </label>
   {screening&&cards?<div data-testid="p32-interpretation" className={styles.decision}>
    <div className={styles.verdictRow}>
     <div><span className={styles.resultLabel}>{activityInfo.name[locale]}</span>
      <h4 data-testid="p32-headline">{guidance?.headline}</h4>
      {guidance&&<p className={styles.resultReason}>{guidance.reason}</p>}
      {guidance&&<p className={styles.resultAction} data-testid="p389-action">{guidance.nextStep}</p>}
      <a href={activityInfo.source} target="_blank" rel="noopener noreferrer"
       className={styles.ruleSource}>{uk?'Джерело традиційних критеріїв':'Source of traditional criteria'} ↗</a>
      {guidance&&guidance.sharedActivities.length>0&&<details className={styles.sharedRules}
       data-testid="p389-shared-criteria">
       <summary>{uk?'Справи з тими самими правилами':'Activities sharing these rules'}</summary>
       <p>{guidance.sharedActivities.map(id=>p38Activity(id).name[locale]).join(', ')}</p>
      </details>}
     </div>
    </div>
    {requiresPartner&&<label className={styles.partnerSelect}>
     {uk?'Натальна карта партнера':'Partner natal chart'}
     <select value={partnerId} onChange={e=>setPartnerId(e.target.value)}>
      <option value="">{uk?'Оберіть збережену карту':'Select a saved chart'}</option>
      {charts.map(ch=><option key={ch.id} value={ch.id}>
       {[ch.date,ch.place||ch.ascendant||'Chart'].filter(Boolean).join(' · ')}</option>)}
     </select>
     {chartState==='error'&&<small>{uk?'Список карт недоступний':'Cannot load chart list'}</small>}
     {chartState==='ready'&&charts.length===0&&<Link href={'/'+locale+'/personal'}>
      {uk?'Спочатку збережіть карту партнера':'Save a partner chart first'}</Link>}
    </label>}
    {activityInfo.method==='special_election'&&<div className={styles.specialChecklist}
     data-testid="p389-muhurta-checklist">
     <h5>{uk?'Що потрібно для повної мухурти?':'What does a full Muhurta require?'}</h5>
     <p>{uk?'Це персональний підбір часу за натальними картами, місцем і лагною події та спеціальними традиційними правилами. Galaxiora зараз виконує лише попередній відбір.':
      'This requires birth charts, the event location and event Lagna, plus specialist classical checks. Galaxiora currently provides preliminary screening only.'}</p>
     <ul>
      {activityInfo.required.includes('natal_chart')&&<li>
       {userState==='ready'?(uk?'Ваша перевірена натальна карта: готова.':'Your verified chart: ready.'):
        <>{uk?'Потрібна ваша перевірена натальна карта.':'Your verified natal chart is needed.'}
         {' '}<Link href={'/'+locale+'/personal'}>{uk?'Створити в кабінеті':'Create in Personal'}</Link></>}
      </li>}
      {requiresPartner&&<li>{partnerId?
       (uk?'Карту партнера обрано; її перевірить Time Finder.':'Partner chart selected; Time Finder will validate it.'):
       (uk?'Оберіть нижче збережену карту партнера або створіть її в кабінеті.':
        'Select a saved partner chart below or create one in Personal.')}
      </li>}
      {activityInfo.required.includes('event_location')&&<li>
       {uk?'Місце події: ':'Event location: '}{point.place||point.timeZone}.
       {' '}<a href="#panchanga-place">{uk?'Змінити місто вище':'Change city above'}</a>
      </li>}
      {activityInfo.required.includes('election_lagna')&&<li>
       {uk?'Time Finder розраховує лагну обраного часу, але поки не перевіряє всі спеціальні правила.':
        'Time Finder computes the selected event Lagna, but does not yet check all specialist rules.'}
      </li>}
     </ul>
     <p className={styles.specialLimit}>{activityInfo.id==='wedding'?
      (uk?'Повну весільну мухурту тут наразі отримати НЕ можна: усі 21 доша й 8 кут ще не сертифіковані. Для завершеного традиційного підбору потрібен фахівець із джйотишу.':
       'A complete wedding Muhurta is NOT available here: all 21 doshas and 8 Kutas are not certified. A qualified Jyotish practitioner is required for a full traditional election.'):
      (uk?'Для цієї події спеціальні правила ще не всі реалізовані. Попередній інтервал не є остаточною сертифікованою мухуртою.':
       'Specialist rules for this event remain incomplete. A preliminary time window is not a final certified Muhurta.')}</p>
    </div>}
    <div className={styles.timeFinder} data-testid="p386-time-finder">
     {activityInfo.method!=='routine'&&<div className={styles.timeControls}>
      <label>{uk?'Пошук часу':'Time search'} <select value={duration}
       onChange={e=>setDuration(Number(e.target.value) as 7|30)}>
       <option value={7}>{uk?'7 днів':'7 days'}</option>
       <option value={30}>{uk?'30 днів':'30 days'}</option>
      </select></label>
      <button type="button" onClick={()=>void runSearch()} disabled={!canSearch}>
       {finderState==='loading'?(uk?'Перевіряємо моменти…':'Checking times…'):
        (uk?'Знайти найближчий час':'Find the next time')}</button>
     </div>}
     {userState==='loading'&&<p role="status">{uk?'Зіставляємо натальну карту…':'Comparing natal chart…'}</p>}
     {(userState==='no_chart'||userState==='guest')&&<p className={styles.guidanceNote}>
      {uk?'Для персонального пошуку потрібна ваша перевірена натальна карта.':'A verified saved birth chart is required for your personal time search.'}
      {' '}<Link href={'/'+locale+'/personal'}>{uk?'Перейти до натальної карти':'Open natal chart'}</Link></p>}
     {userState==='error'&&<p className={styles.guidanceNote}>
      {uk?'Персональні дані зараз недоступні; показані тільки загальні календарні правила.':'Personal data unavailable; calendar factors only.'}</p>}
     {dayHasPassed&&<p className={styles.guidanceNote}>{uk?'Для минулого дня майбутні моменти не шукаємо.':'Past dates are not used for future time search.'}</p>}
     {finderState==='error'&&<p role="alert">{uk?'Пошук не завершився перевіреними даними. Спробуйте згодом.':'No verified search result was returned. Try later.'}</p>}
     {finder&&<div className={styles.timeResult} role="status">
      {finder.candidate?<><strong>{uk?'Найкращі перевірені години':'Best verified start times'}</strong>
       <div className={styles.topWindows} data-testid="p390-top-windows">
        {(finder.topCandidates?.length?finder.topCandidates:[finder.candidate]).slice(0,3)
         .map(w=><div className={styles.topWindow} key={w.startUtc}>
          <time>{clock(w.startUtc)} – {clock(w.endUtc)}</time>
         </div>)}
       </div>
       <small>{uk?'Конкретні інтервали пройшли календарний відбір; для складних подій потрібна спеціальна перевірка.':'These intervals passed calendar screening; complex events require additional specialist checks.'}</small>
      </>:finder.review?<><strong>{uk?'Найближчий інтервал для додаткової перевірки':'Next interval requiring special review'}</strong>
       <time>{clock(finder.review.startUtc)} – {clock(finder.review.endUtc)}</time>
       <small>{uk?'Для цього моменту перевірено лише частину правил. Наведені факти стосуються саме знайденого інтервалу.':'Only part of the rules have been verified for this specific event interval.'}</small>
        {windowReasons(finder.review.reasonIds).length>0&&<ul className={styles.finderReasons}
         data-testid="p389-window-reasons">{windowReasons(finder.review.reasonIds).map(r=><li key={r}>{r}</li>)}</ul>}
      </>:<span>{finder.status==='none_in_checked_range'?
       (uk?'У перевіреному проміжку придатного часу не знайдено.':'No qualifying interval within the checked range.'):
       (uk?'Потрібна додаткова перевірка натальних карт.':'Additional natal verification is required.')}</span>}
     </div>}
    </div>
   </div>:<p role="alert">{uk?'Немає повного перевіреного набору показників для цього моменту.':'A complete verified five-limb snapshot is unavailable.'}</p>}
  </div>
  {cards&&<section className={styles.factorSection} data-testid="p32-evidence">
   <h3>{uk?'П’ять показників Панчанги':'Five Panchanga limbs'}</h3>
   <div className={styles.factorGrid}>
    {cards.map(card=>{
     const Icon=ICONS[card.factor];
     const localized=uk&&card.factor==='vara'?VARA_UK[card.value.en]||card.value[locale]:
    uk&&card.factor==='yoga'?YOGA_UK[(verifiedDay.periods.yoga.find(p=>
      Date.parse(p.startUtc)<=Date.parse(iso!)&&Date.parse(iso!)<Date.parse(p.endUtc))?.value.number||1)-1]||card.value[locale]:
    card.value[locale];
   return <details key={card.factor} data-factor={card.factor} className={styles.factorCard}>
      <summary><span className={styles.factorIcon}><Icon size={19} aria-hidden="true"/></span>
       <span className={styles.factorText}><small>{card.name[locale]}</small>
        <strong>{localized}</strong>
        <em>{card.classification[locale]}</em></span>
       <ChevronDown className={styles.chevron} size={16} aria-hidden="true"/></summary>
      <div className={styles.factorExtra}>
       <p>{card.explanation[locale]}</p>
       <a href={card.reference} target="_blank" rel="noopener noreferrer">
        {uk?'Класичне джерело':'Classical source'} ↗</a>
      </div>
     </details>;
    })}
   </div>
  </section>}
  {privateReport&&userState==='ready'&&<section className={styles.natalSection} data-testid="p33-personal">
   <h3>{uk?'Ваш Місяць і натальна карта':'Your Moon and natal chart'}</h3>
   <div className={styles.natalGrid}>
    <div><Moon size={17}/><strong>{uk?'Тарабала':'Tarabala'}</strong>
     <span>{privateReport.tarabala.name} · {privateReport.tarabala.quality==='supportive'?
      (uk?'підтримка':'support'):(uk?'потребує уваги':'requires attention')}</span></div>
    <div><Orbit size={17}/><strong>{uk?'Чандрабала':'Chandrabala'}</strong>
     <span>{privateReport.chandrabala.houseFromJanmaRashi}-{uk?'й знак від натального Місяця':'th sign from birth Moon'} · {privateReport.chandrabala.quality==='supportive'?
      (uk?'підтримка':'support'):(uk?'потребує уваги':'requires attention')}</span></div>
   </div>
   <details className={styles.natalDetail}><summary>{uk?'Як впливають мої натальні показники?':'How do my birth chart factors contribute?'}</summary>
    <p>{uk?'Тарабала порівнює накшатру теперішнього Місяця з накшатрою народження. Чандрабала — його теперішній знак із вашим натальним Місяцем. Їх враховано разом із п’ятьма показниками під час оцінки справи.':'Tarabala compares current and natal Moon nakshatras; Chandrabala compares zodiac signs. Both contribute to the activity assessment alongside the five Panchanga limbs.'}</p>
   </details>
  </section>}
 </section>
}
