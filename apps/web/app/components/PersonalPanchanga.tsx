'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import styles from './PersonalPanchanga.module.css';
import GlossaryText from './GlossaryText';
import PanchangaInfoTip from './PanchangaInfoTip';
type Quality='supportive'|'challenging'|'caution';
type Report={status:string;date?:string;sunriseUtc?:string;timeZone?:string;version?:string;
 tarabala?:{name:string;taraNumber:number;cycle:number;inclusiveCount:number;quality:Quality;
  birthNakshatraIndex:number;transitNakshatraIndex:number};
 chandrabala?:{houseFromJanmaRashi:number;quality:Quality;ashtamaChandra:boolean;
  natalMoonSign:number;transitMoonSign:number}};
type Point={date:string;timeZone:string;latitude:string;longitude:string};
const tt={
 uk:{title:'Мій місячний ритм',sub:'Положення Місяця на обрану дату порівняно з вашою натальною картою.',
 noAuth:'Увійди до акаунта, щоб побачити персональні показники.',noChart:'Обери основну перевірену натальну карту в «Мій Всесвіт».',
 toPersonal:'Відкрити Мій Всесвіт',retry:'Повторити',unavailable:'Персональний розрахунок зараз недоступний. Загальна Панчанга працює окремо.',
 pending:'Зіставляємо Місяць із натальною картою…',tara:'За місячною накшатрою',chandra:'За знаком Місяця',
 taraHelp:'Тарабала — традиційне порівняння накшатри Місяця при народженні з накшатрою на вибрану дату.',
 chandraHelp:'Чандрабала — традиційне порівняння знака Місяця при народженні зі знаком на вибрану дату.',
 supportive:'Сприятливе поєднання',challenging:'Напружене поєднання',caution:'Змішане поєднання',ashtama:'Аштама-чандра: восьмий знак від натального Місяця',
 house:'Знак від натального Місяця',at:'На час місцевого сходу Сонця',
 note:'Оцінка за взаємним положенням натальної й поточної накшатр та знаків Місяця.'},
 en:{title:'My lunar rhythm',sub:'Moon position on your selected date compared with your birth chart.',
 noAuth:'Sign in to see private lunar strength.',noChart:'Choose a verified primary natal chart in Personal.',
 toPersonal:'Open Personal',retry:'Retry',unavailable:'Private calculations are currently unavailable. Public Panchanga works separately.',
 pending:'Comparing the Moon with your natal chart…',tara:'By Moon nakshatra',chandra:'By Moon sign',
 taraHelp:'Tarabala compares the Moon’s birth nakshatra with its nakshatra on the selected date.',
 chandraHelp:'Chandrabala compares the Moon’s birth sign with its sign on the selected date.',
 supportive:'Traditionally supportive',challenging:'Traditionally challenging',caution:'Mixed rating',ashtama:'Ashtama Chandra: eighth sign from the natal Moon',
 house:'Sign counted from natal Moon',at:'At local sunrise',
 note:'Traditional rating based on birth and current Moon nakshatras and signs.'}
} as const;
export default function PersonalPanchanga({locale,point}:{locale:PortalLocale;point:Point}){
 const t=tt[locale];
 const [data,setData]=useState<Report|null>(null),[status,setStatus]=useState<'loading'|'anon'|'error'|'ready'>('loading'),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let alive=true;const ctrl=new AbortController();
  setStatus('loading');setData(null);
  const q=new URLSearchParams({date:point.date,zone:point.timeZone,latitude:point.latitude,longitude:point.longitude});
  fetch('/api/v1/personal/panchanga?'+q,{credentials:'same-origin',cache:'no-store',signal:ctrl.signal})
   .then(async r=>{
    if(r.status===401){if(alive)setStatus('anon');return null;}
    if(!r.ok)throw Error(String(r.status));
    return await r.json() as Report;
   }).then(x=>{if(alive&&x){setData(x);setStatus('ready')}})
   .catch(()=>{if(alive)setStatus('error')});
  return()=>{alive=false;ctrl.abort()};
 },[point.date,point.timeZone,point.latitude,point.longitude,retry]);
 const quality=(q:Quality)=>t[q];
 return <section className={styles.section} data-testid="personal-panchanga" aria-label={t.title}>
  <h2><GlossaryText text={t.title} locale={locale}/></h2><p><GlossaryText text={t.sub} locale={locale}/></p>
  {status==='loading'&&<p role="status">{t.pending}</p>}
  {status==='anon'&&<p>{t.noAuth}</p>}
  {status==='error'&&<div role="alert">{t.unavailable} <button type="button" onClick={()=>setRetry(v=>v+1)}>{t.retry}</button></div>}
  {status==='ready'&&data?.status==='requires_verified_chart'&&<div>
   <p>{t.noChart}</p><Link href={'/'+locale+'/personal'}>{t.toPersonal} ↗</Link>
  </div>}
  {status==='ready'&&data?.status==='available'&&data.tarabala&&data.chandrabala&&<>
   <div className={styles.grid}>
    <article>
     <div className="panchanga-personal-label"><small>{t.tara}</small>
      <PanchangaInfoTip locale={locale} text={t.taraHelp+' '+data.tarabala.name+' ('+data.tarabala.taraNumber+'/9).'}/>
     </div>
     <h3>{quality(data.tarabala.quality)}</h3>
    </article>
    <article>
     <div className="panchanga-personal-label"><small>{t.chandra}</small>
      <PanchangaInfoTip locale={locale} text={t.chandraHelp+' '+t.house+': '+data.chandrabala.houseFromJanmaRashi+'/12.'}/>
     </div>
     <h3>{quality(data.chandrabala.quality)}</h3>
     {data.chandrabala.ashtamaChandra&&<p>{locale==='uk'?'Місяць у восьмому знаку від вашого натального Місяця.':
      'The Moon is in the eighth sign from your birth Moon.'}</p>}
    </article>
   </div>
   <p className={styles.note}>{t.at} · {new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{
    dateStyle:'medium',timeStyle:'short',timeZone:data.timeZone
   }).format(new Date(data.sunriseUtc!))}. <GlossaryText text={t.note} locale={locale}/></p>
  </>}
 </section>;
}
