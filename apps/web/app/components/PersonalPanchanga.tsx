'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import styles from './PersonalPanchanga.module.css';
import GlossaryText from './GlossaryText';
type Quality='supportive'|'challenging'|'caution';
type Report={status:string;date?:string;sunriseUtc?:string;timeZone?:string;version?:string;
 tarabala?:{name:string;taraNumber:number;cycle:number;inclusiveCount:number;quality:Quality;
  birthNakshatraIndex:number;transitNakshatraIndex:number};
 chandrabala?:{houseFromJanmaRashi:number;quality:Quality;ashtamaChandra:boolean;
  natalMoonSign:number;transitMoonSign:number}};
type Point={date:string;timeZone:string;latitude:string;longitude:string};
const tt={
 uk:{title:'Мій місячний ритм',sub:'Тарабала й Чандрабала від твоєї підтвердженої натальної карти та Місяця на місцевому сході Сонця.',
 noAuth:'Увійди до акаунта, щоб побачити персональні показники.',noChart:'Обери основну перевірену натальну карту в «Мій Всесвіт».',
 toPersonal:'Відкрити Мій Всесвіт',retry:'Повторити',unavailable:'Персональний розрахунок зараз недоступний. Загальна Панчанга працює окремо.',
 pending:'Зіставляємо Місяць із натальною картою…',tara:'Тарабала · натальна накшатра',chandra:'Чандрабала · натальний знак',
 supportive:'Сприятливе поєднання',challenging:'Потребує обачності',caution:'Змішана оцінка',ashtama:'Аштама-чандра: восьмий знак від натального Місяця',
 house:'Знак від натального Місяця',at:'На час місцевого сходу Сонця',
 note:'Це традиційна ведична класифікація за конкретними астрономічними даними, а не гарантія результату подій.'},
 en:{title:'My lunar rhythm',sub:'Tarabala and Chandrabala from your verified natal chart and the Moon at local sunrise.',
 noAuth:'Sign in to see private lunar strength.',noChart:'Choose a verified primary natal chart in Personal.',
 toPersonal:'Open Personal',retry:'Retry',unavailable:'Private calculations are currently unavailable. Public Panchanga works separately.',
 pending:'Comparing the Moon with your natal chart…',tara:'Tarabala · birth nakshatra',chandra:'Chandrabala · natal Moon sign',
 supportive:'Traditionally supportive',challenging:'Calls for caution',caution:'Mixed designation',ashtama:'Ashtama Chandra: eighth sign from the natal Moon',
 house:'Sign counted from natal Moon',at:'At local sunrise',
 note:'This is a traditional Vedic classification derived from astronomical positions, not a guarantee of life outcomes.'}
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
    <article><small><GlossaryText text={t.tara} locale={locale}/></small><h3>{data.tarabala.name} · {data.tarabala.taraNumber}/9</h3>
     <p>{quality(data.tarabala.quality)}</p><small>#{data.tarabala.birthNakshatraIndex} → #{data.tarabala.transitNakshatraIndex} · cycle {data.tarabala.cycle}</small></article>
    <article><small><GlossaryText text={t.chandra} locale={locale}/></small><h3>{t.house}: {data.chandrabala.houseFromJanmaRashi}/12</h3>
     <p>{quality(data.chandrabala.quality)}</p>
     {data.chandrabala.ashtamaChandra&&<strong><GlossaryText text={t.ashtama} locale={locale}/></strong>}
    </article>
   </div>
   <p className={styles.note}>{t.at} · {new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{
    dateStyle:'medium',timeStyle:'short',timeZone:data.timeZone
   }).format(new Date(data.sunriseUtc!))}. <GlossaryText text={t.note} locale={locale}/></p>
  </>}
 </section>;
}
