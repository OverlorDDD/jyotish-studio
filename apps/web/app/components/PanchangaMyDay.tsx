'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Moon,CalendarDays,Sparkles,Orbit,CircleDot,BookOpen,Clock3} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import {p31DaySummary,P31_TOPICS,type P31Topic,type P31Day} from '../../lib/panchanga-p31-model';
import {interpretPanchanga,type P32Day} from '../../lib/panchanga-p32-engine';
import {explainClassicalPanchanga,type P37Factor} from '../../lib/panchanga-p37-classical';
import {synthesizePersonalResonance,validateP33Report,type P33Report,type P33Result} from '../../lib/panchanga-p33-resonance';
import PanchangaTimeGuidance from './PanchangaTimeGuidance';
import styles from './PanchangaMyDay.module.css';

type Point={date:string;timeZone:string;latitude:string;longitude:string;place:string};
const topics:Record<P31Topic,{uk:string;en:string}>={
 work:{uk:'Робота',en:'Work'},money:{uk:'Гроші',en:'Money'},
 relationships:{uk:'Стосунки',en:'Relationships'},travel:{uk:'Поїздки',en:'Travel'},
 personal:{uk:'Особисті справи',en:'Personal matters'},
 study:{uk:'Навчання',en:'Study'},home:{uk:'Фундамент',en:'Foundation'}
};
const factorIcons={tithi:Moon,vara:CalendarDays,nakshatra:Sparkles,yoga:Orbit,karana:CircleDot};
const toneNames={
 supports:{uk:'Підтримує обрану справу',en:'Supports this activity'},
 cautions:{uk:'Потребує обережності',en:'Caution for this activity'},
 blocks:{uk:'Традиційне обмеження',en:'Traditional restriction'},
 neutral:{uk:'Не визначає рішення',en:'Not decisive'}
};
export default function PanchangaMyDay({locale,day,point}:{locale:PortalLocale;day:P31Day;point:Point}){
 const uk=locale==='uk';
 const [topic,setTopic]=useState<P31Topic>('work');
 const [now,setNow]=useState<number|null>(null);
 const [resonance,setResonance]=useState<{report:P33Report;atUtc:string;key:string;mode:'live'|'sunrise-snapshot'}|null>(null);
 const [personalState,setPersonalState]=useState<'loading'|'guest'|'no_chart'|'ready'|'error'>('loading');
 const [personalRetry,setPersonalRetry]=useState(0);
 useEffect(()=>{const tick=()=>setNow(Date.now());tick();const timer=setInterval(tick,60000);
  return()=>clearInterval(timer);},[]);
 const summary=useMemo(()=>now===null?null:p31DaySummary(day,now,topic),[day,now,topic]);
 const interpretation=useMemo(()=>{
  if(now===null)return null;
  try{return interpretPanchanga(day as P32Day,now,topic);}
  catch{return null;}
 },[day,now,topic]);
 // Every visible card must match the validated P3.2 instant. Fail closed if any
 // source factor is missing: do not display inferred or stale advice.
 const cards=useMemo(()=>{
  if(!interpretation)return null;
  try{return explainClassicalPanchanga(day as P32Day,interpretation);}
  catch{return null;}
 },[day,interpretation]);
 const selectedKey=[point.date,point.timeZone,point.latitude,point.longitude].join('|');
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  setPersonalState('loading');setResonance(null);
  const current=Date.now();
  const local=new Intl.DateTimeFormat('en-US',{timeZone:point.timeZone,
   year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(current));
  const p=(k:string)=>local.find(x=>x.type===k)?.value||'';
  const civil=p('year')+'-'+p('month')+'-'+p('day');
  const live=civil===point.date&&current>=Date.parse(day.sunriseUtc)&&current<Date.parse(day.nextSunriseUtc);
  const target=live?new Date(current).toISOString():day.sunriseUtc;
  const search=new URLSearchParams({date:point.date,zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude,at:target});
  fetch('/api/v1/personal/panchanga/resonance?'+search,{credentials:'same-origin',
   cache:'no-store',signal:controller.signal})
   .then(async response=>{
    if(response.status===401){if(active)setPersonalState('guest');return null;}
    if(!response.ok)throw Error('Private resonance unavailable');
    return response.json();
   }).then(payload=>{
    if(!active||!payload)return;
    if(payload.status==='requires_primary_chart'||payload.status==='requires_verified_chart'){
     setPersonalState('no_chart');return;
    }
    validateP33Report(payload as P33Report,point,day as P32Day,target);
    setResonance({report:payload as P33Report,atUtc:target,key:selectedKey,mode:live?'live':'sunrise-snapshot'});
    setPersonalState('ready');
   }).catch(()=>{if(active&&!controller.signal.aborted)setPersonalState('error')});
  return()=>{active=false;controller.abort()};
 },[day,point.date,point.timeZone,point.latitude,point.longitude,selectedKey,personalRetry]);
 const personal=useMemo(():P33Result|null=>{
  if(!resonance||resonance.key!==selectedKey)return null;
  try{return synthesizePersonalResonance(
   interpretPanchanga(day as P32Day,Date.parse(resonance.atUtc),topic,resonance.mode==='live'?'auto':'sunrise-snapshot'),
   day as P32Day,point,resonance.report,resonance.atUtc);
  }catch{return null;}
 },[day,point,topic,resonance,selectedKey]);
 const decision=personal||interpretation;
 const fmt=(date:string,withDate=false)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:point.timeZone,...(withDate?{dateStyle:'medium' as const,timeStyle:'short' as const}:
   {hour:'2-digit' as const,minute:'2-digit' as const})
 }).format(new Date(date));
 return <section className={styles.dashboard} data-testid="p31-my-day">
  <header className={styles.top}>
   <div>
    <span className={styles.eyebrow}>GALAXIORA · {uk?'КЛАСИЧНА ПАНЧАНГА':'CLASSICAL PANCHANGA'}</span>
    <h2>{uk?'Мій день':'My day'}</h2>
    <p>{point.date} · {point.place} · {point.timeZone}</p>
   </div>
   <span className={styles.scope}>{uk?'5 показників · місцевий схід':'5 limbs · local sunrise'}</span>
  </header>
  {summary?<div className={styles.summary} data-testid="p31-summary">
   <p className={styles.status}>{summary.vedicDay==='live'?
    (uk?'Поточний ведичний день':'Current Vedic day'):
    (uk?'Оцінка на сході Сонця обраної дати':'At sunrise of selected date')}</p>
   <div className={styles.sunTimes}>
    <span>{uk?'Схід':'Sunrise'} <strong>{fmt(summary.sunriseUtc)}</strong></span>
    <span>{uk?'Захід':'Sunset'} <strong>{fmt(summary.sunsetUtc)}</strong></span>
    <span>{uk?'Наступний схід':'Next sunrise'} <strong>{fmt(summary.nextSunriseUtc)}</strong></span>
   </div>
   <div className={styles.advice} data-testid="p31-advice">
    <p className={styles.adviceLabel}>{uk?'Яку справу плануєте?':'What are you planning?'}</p>
    <div className={styles.topicButtons} role="group" aria-label={uk?'Тема поради':'Advice topic'}>
     {P31_TOPICS.map(key=><button key={key} type="button" aria-pressed={topic===key}
      onClick={()=>setTopic(key)}>{topics[key][locale]}</button>)}
    </div>
    {interpretation&&cards?<div data-testid="p32-interpretation">
     <p className={styles.scopeNote}>{uk?'Обрана тема':'Selected topic'}: <strong>{topics[topic][locale]}</strong> · {personal?
      (uk?'Персонально за перевіреною натальною картою':'Personal reading from verified birth chart'):
      (uk?'Загальна Панчанга · без натальної оцінки':'General Panchanga · no natal comparison')}</p>
     <p className={styles.scopeNote}>{uk?'Обрана справа':'Planned activity'}: <strong>{interpretation.subject[locale]}</strong></p>
     <h4 data-testid="p32-headline">{decision?.headline[locale]}</h4>
     <p className={styles.action}>{decision?.action[locale]}</p>
     <p className={styles.scopeNote}>{decision?.reason[locale]}</p>
     <div className={styles.factorHeader}>
      <div>
       <h3>{uk?'П’ять показників та їхнє значення':'Five limbs and what they mean'}</h3>
       <p>{uk?'Класи й трактування відповідають обраній справі та перевіреному моменту.':'Classes and interpretations for the selected activity at the verified instant.'}</p>
      </div>
      <span className={styles.moment}><Clock3 size={15}/>{fmt(interpretation.evaluatedAtUtc,true)}</span>
     </div>
     <div className={styles.factorGrid} data-testid="p32-evidence">
      {cards.map(card=>{
       const Icon=factorIcons[card.factor as P37Factor];
       return <article key={card.factor} className={styles.factorCard} data-factor={card.factor}>
        <div className={styles.factorTitle}>
         <span className={styles.factorIcon}><Icon aria-hidden="true" size={23} strokeWidth={1.65}/></span>
         <div><span className={styles.factorLabel}>{card.name[locale]}</span>
          <strong>{card.value[locale]}</strong></div>
        </div>
        <p className={styles.classification}>{card.classification[locale]}</p>
        <p>{card.explanation[locale]}</p>
        <p className={styles.application}><strong>{toneNames[card.tone][locale]}:</strong> {card.application[locale]}</p>
        <div className={styles.factorFoot}>
         {card.untilUtc&&<small>{uk?'Діє до':'Until'} {fmt(card.untilUtc,true)}</small>}
         <a href={card.reference} target="_blank" rel="noopener noreferrer">{uk?'Джерело правила':'Rule source'} ↗</a>
        </div>
       </article>;
      })}
     </div>
     <div className={styles.moonContext}>
      <Moon size={18} aria-hidden="true"/>
      <span>{summary.moon[locale]} · {uk?'Фаза Місяця — додатковий контекст, не шоста частина Панчанги.':'Moon phase is additional context, not a sixth Panchanga limb.'}</span>
     </div>
     {personal&&<section data-testid="p33-personal" className={styles.personalSummary}>
      <h3>{uk?'Чому це стосується саме мене?':'Why does this apply to me?'}</h3>
      <p className={styles.scopeNote}>{uk?
       'Місяць при народженні зіставлено з його поточним положенням, рухом планет і вашим планетарним періодом.':
       'Your birth Moon is compared with its current position, planetary movements and your current planetary period.'} · {fmt(personal.atUtc,true)}</p>
      <div className={styles.natalGrid}>
       {personal.evidence.filter(e=>e.id.startsWith('TARABALA')||e.id.startsWith('CHANDRABALA')).map(e=>
        <div className={styles.natalCard} key={e.id}><span className={styles.factorIcon}><Moon size={20} aria-hidden="true"/></span>
         <strong>{e.id.startsWith('TARABALA')?'Тарабала':'Чандрабала'}</strong><p>{e.note[locale]}</p></div>)}
      </div>
      <details className={styles.reasonDetails} data-testid="p33-evidence">
       <summary>{uk?'Інші перевірені персональні показники':'Other verified personal indicators'}</summary>
       <ul>{personal.evidence.filter(e=>!e.id.startsWith('TARABALA')&&!e.id.startsWith('CHANDRABALA')).map(e=><li key={e.id}>{e.note[locale]}</li>)}</ul>
       <p className={styles.scopeNote}>{uk?
        'Метод Чандрабали: у цій версії застосована таблиця 1, 3, 6, 7, 10, 11 за традицією Мухурта-Чінтамані. Б. В. Раман відносить 6-те положення до застережень; школи не змішуються.':
        'Chandrabala convention: this version uses positions 1, 3, 6, 7, 10, 11 (Muhurta Chintamani school). B. V. Raman cautions against the sixth position; the two schools are not mixed.'}</p>
       <a href="https://epandit.in/learn/panchang/chandra-bala" target="_blank" rel="noopener noreferrer">{uk?'Метод Чандрабали':'Chandrabala methodology'} ↗</a>
      </details>
     </section>}
     {personalState==='loading'&&!personal&&<p className={styles.scopeNote} role="status">{uk?'Перевіряємо натальну карту…':'Checking your birth chart…'}</p>}
     {personalState==='no_chart'&&!personal&&<p className={styles.scopeNote} data-testid="p33-need-chart">{uk?
      'Оберіть основну перевірену натальну карту в «Мій Всесвіт», щоб додати Тарабалу та Чандрабалу.':
      'Select a verified primary chart in Personal to add Tarabala and Chandrabala.'}</p>}
     {personalState==='error'&&!personal&&<p role="alert">{uk?'Натальна перевірка недоступна. Показані тільки п’ять загальних показників.':'Private calculation unavailable; only general calendar factors are shown.'}
      <button type="button" onClick={()=>setPersonalRetry(v=>v+1)}>{uk?'Повторити':'Retry'}</button></p>}
     {personal&&<button type="button" className={styles.resonanceRefresh} onClick={()=>setPersonalRetry(v=>v+1)}>{uk?'Оновити персональний розрахунок':'Refresh personal reading'}</button>}
     <p className={styles.scopeNote}>{uk?'Раху-калам':'Rahu Kalam'}: <strong>{fmt(summary.rahuFromUtc)}–{fmt(summary.rahuUntilUtc)}</strong> · {uk?
       'Додаткове традиційне обмеження, не один із п’яти показників.':'An additional traditional restriction, not one of the five limbs.'}</p>
     <PanchangaTimeGuidance locale={locale} day={day as P32Day} point={point} topic={topic} now={now}/>
     <p className={styles.scopeNote}>{uk?
      'Це тематичне читання Панчанги, не повна церемоніальна мухурта. Для точної мухурти потрібні додаткові правила й перевірка лагни.':
      'This is activity-specific Panchanga guidance, not a complete ceremonial muhurta. Precise election requires further rules and ascendant verification.'}</p>
     <Link className={styles.profileLink} href={'/'+locale+'/personal'}>{uk?
      'Створити або перевірити натальну карту':'Create or check your birth chart'}</Link>
    </div>:<p role="alert">{uk?'Не вдалося перевірити поєднання п’яти показників. Пораду не показано.':
     'Could not verify all five factors. No advice is displayed.'}</p>}
   </div>
  </div>:<p role="status">{uk?'Уточнюємо поточний момент…':'Checking the current moment…'}</p>}
  <div className={styles.methodFooter}><BookOpen size={17}/><span>{uk?
   'Класичне трактування на основі перевіреної Панчанги, а не передбачення результату події.':
   'Traditional interpretation from verified Panchanga values, not a prediction of real-world outcomes.'}</span></div>
 </section>;
}
