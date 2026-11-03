'use client';
import {useEffect,useMemo,useState,type CSSProperties} from 'react';
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
import {p386EvidenceShare} from '../../lib/panchanga-p386-evidence';
import styles from './PanchangaCleanDay.module.css';

type Point={date:string;timeZone:string;latitude:string;longitude:string;place:string};
type UserState='loading'|'ready'|'guest'|'no_chart'|'error';
type SavedChart={id:string;place:string;date:string;ascendant:string};
type FinderWindow={startUtc:string;endUtc:string;status:string;reasonIds:string[]};
type FinderResult={status:string;candidate:FinderWindow|null;review:FinderWindow|null;
 daysRequested?:number;searchThroughUtc?:string;divisionFocus?:string};
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
const TITLES={
 candidate:{uk:'Є традиційні підстави розглядати цей час',en:'This time matches documented traditional criteria'},
 avoid:{uk:'Для початку цієї справи є конкретне обмеження',en:'A specific traditional restriction applies to this start'},
 mixed:{uk:'Частина показників підтримує, інші потребують уваги',en:'Some factors support the start; others require review'},
 needs_full_election:{uk:'Для цієї справи потрібна повна мухурта',en:'This undertaking requires a full Muhurta'},
 undetermined:{uk:'Підтвердженого висновку для цієї справи поки немає',en:'There is not enough verified activity-specific evidence yet'},
 routine:{uk:'Для регулярної практики не потрібен окремий час початку',en:'Routine practice does not require a separate election'}
} as const;
const DECISION={
 supports:{uk:'Підтримує',en:'Supports'},
 cautions:{uk:'Застереження',en:'Caution'},
 excludes:{uk:'Обмеження',en:'Restriction'},
 context:{uk:'Контекст',en:'Context'}
} as const;
const CLOCK=(iso:string,zone:string,locale:PortalLocale)=>new Intl.DateTimeFormat(
 locale==='uk'?'uk-UA':'en-GB',{timeZone:zone,day:'numeric',month:'short',
 hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
function targetTime(day:P31Day,point:Point,now:number){
 const a=Date.parse(day.sunriseUtc),b=Date.parse(day.nextSunriseUtc);
 const at=now>=a&&now<b?now:a+1000;
 return new Date(at).toISOString();
}
export default function PanchangaMyDay({locale,day,point}:{
 locale:PortalLocale;day:P31Day;point:Point;
}){
 const uk=locale==='uk',verifiedDay=day as P32Day;
 const [category,setCategory]=useState<P38Category>('work');
 const [activity,setActivity]=useState<P38ActivityId>('job_start');
 const [capturedNow,setCapturedNow]=useState<number|null>(null);
 const [privateReport,setPrivateReport]=useState<P33Report|null>(null);
 const [userState,setUserState]=useState<UserState>('loading');
 const [finder,setFinder]=useState<FinderResult|null>(null);
 const [finderState,setFinderState]=useState<'idle'|'loading'|'error'>('idle');
 const [duration,setDuration]=useState<7|30>(7);
 const [partnerId,setPartnerId]=useState('');
 const [charts,setCharts]=useState<SavedChart[]>([]);
 const [chartState,setChartState]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 const pointKey=[point.date,point.timeZone,point.latitude,point.longitude].join('|');
 useEffect(()=>{setCapturedNow(Date.now());setPrivateReport(null);setFinder(null);
  setFinderState('idle');},[day,pointKey]);
 const iso=capturedNow===null?null:targetTime(day,point,capturedNow);
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
  fetch('/api/v1/account/charts',{credentials:'same-origin',cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error('chart list unavailable');return await r.json() as SavedChart[]})
   .then(c=>{if(alive){setCharts(Array.isArray(c)?c:[]);setChartState('ready')}})
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
 const evidence=useMemo(()=>screening?p386EvidenceShare(screening):null,[screening]);
 const important=screening?.observations.filter(e=>e.polarity==='excludes')||[];
 const supportive=screening?.observations.filter(e=>e.polarity==='supports')||[];
 const caution=screening?.observations.filter(e=>e.polarity==='cautions')||[];
 const highlight=[...important,...supportive,...caution].slice(0,3);
 const dayHasPassed=capturedNow!==null&&Date.parse(day.nextSunriseUtc)<=capturedNow;
 const searchStart=capturedNow===null?null:new Date(Math.max(
  capturedNow+120000,Date.parse(day.sunriseUtc)+60000)).toISOString();
 const canSearch=Boolean(searchStart&&!dayHasPassed&&userState==='ready'&&
  (!requiresPartner||partnerId)&&finderState!=='loading'&&activityInfo.method!=='routine');
 const clock=(v:string)=>CLOCK(v,point.timeZone,locale);
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
    <h2>{uk?'Мій день':'My day'}</h2></div>
   {iso&&<span className={styles.moment}><Clock3 size={15}/>{clock(iso)}</span>}
  </header>
  <div className={styles.advice}>
   <h3 className={styles.adviceLabel}>{uk?'Що плануєте?':'What are you planning?'}</h3>
   <div className={styles.topicButtons} role="group" aria-label={uk?'Категорія справи':'Activity category'}>
    {CATEGORIES.map(c=>{const Icon=c.icon;return <button type="button" key={c.id}
     aria-pressed={category===c.id} onClick={()=>{setCategory(c.id);
      setActivity(P38_ACTIVITIES.find(a=>a.category===c.id)!.id)}}>
      <Icon size={17} aria-hidden="true"/>{c[locale]}</button>})}
   </div>
   <label className={styles.activitySelector}>
    {uk?'Конкретна справа':'Specific activity'}
    <span className={styles.selectWrap}>
     <select value={activity} onChange={e=>setActivity(e.target.value as P38ActivityId)}
      data-testid="p386-activity-select">
      {relevant.map(a=><option key={a.id} value={a.id}>{a.name[locale]}</option>)}
     </select><ChevronDown size={17} aria-hidden="true"/></span>
   </label>
   {screening&&cards?<div data-testid="p32-interpretation" className={styles.decision}>
    <div className={styles.verdictRow}>
     <div><span className={styles.resultLabel}>{activityInfo.name[locale]}</span>
      <h4 data-testid="p32-headline">{TITLES[screening.verdict][locale]}</h4>
      {highlight.length>0&&<p className={styles.resultReason}>{highlight.map(e=>e.description[locale]).join(' ')}</p>}
     </div>
     {evidence?.percent!==null&&evidence?.percent!==undefined&&<div className={styles.ratioContainer}>
      <div className={styles.ratioRing} role="img" aria-label={(uk?'Підтримувальних перевірок: ':'Supportive source checks: ')+evidence.percent+'%'}
       style={{'--supportPct':evidence.percent+'%'} as CSSProperties}>
       <span>{evidence.percent}%</span>
      </div>
      <small>{uk?'Підтримувальних':'Supportive'}<br/>{uk?'показників':'factors'}</small>
     </div>}
    </div>
    {evidence&&<details className={styles.ratioHelp}>
     <summary>{uk?'Як формується оцінка?':'How is this figure calculated?'}</summary>
     <p>{uk?`Із ${evidence.denominator} перевірених незалежних груп сигналів підтримують початок ${evidence.numerator}. Застережень: ${evidence.caution}, обмежень: ${evidence.excluded}. Тітхі й карана мають спільну геометрію та не рахуються двічі. Це частка виявлених традиційних сигналів, не ймовірність успіху.`:
      `Of ${evidence.denominator} independent source-based signal groups, ${evidence.numerator} support the start; ${evidence.caution} caution, ${evidence.excluded} restrict. Tithi and Karana are not counted twice. This is a share of triggered traditional signals, not an outcome probability.`}</p>
     {evidence.percent===null&&<p>{uk?'Відсоток приховано, коли недостатньо незалежних сигналів або потрібна повна мухурта.':'No percentage when evidence is too sparse or a full election is required.'}</p>}
    </details>}
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
      {finder.candidate?<><strong>{uk?'Найближчий кандидатний час':'Next candidate interval'}</strong>
       <time>{clock(finder.candidate.startUtc)} – {clock(finder.candidate.endUtc)}</time>
       <small>{uk?'Перевірено застосовні календарні правила. Це не гарантія результату.':'Applicable calendar rules screened; this is not an outcome guarantee.'}</small>
      </>:finder.review?<><strong>{uk?'Найближчий інтервал для додаткової перевірки':'Next interval requiring special review'}</strong>
       <time>{clock(finder.review.startUtc)} – {clock(finder.review.endUtc)}</time>
       <small>{uk?'Для церемонії ще потрібні неперевірені спеціальні правила.':'Additional ceremonial conditions still require verification.'}</small>
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
