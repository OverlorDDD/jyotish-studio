'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import styles from './HoroscopeHub.module.css';
type L={uk:string;en:string};
type Signal={id:string;source:string;planet:string;title:L;detail:L;topic:string;
 transitLongitude:number;natalLongitude?:number;orbDegrees?:number;house?:number;
 sampledAtUtc:string;};
type SynthesisDay={
 version:'ASE_V1';date:string;zone:string;status:'convergence'|'different_emphases'|'limited_evidence';
 headline:L;description:L;advice:L;reflection:L;
 commonTopics:{key:string;title:L}[];
 separateTopics?:{western:{key:string;title:L}|null;vedic:{key:string;title:L}|null};
 western:{signals:Signal[];matchedCount:number;reference:string};
 vedic:{signals:Signal[];reference:string;periodContext?:{lord:string;antardasha?:string|null}|null};
 provenance:{sampledAtUtc:string;interpretation:string;comparison:string;warning:string};
};
type Payload={status:'available'|'requires_verified_chart';
 reference:'ASTROLOGICAL_SYNTHESIS_V1';date?:string;zone?:string;days:SynthesisDay[]};
const fmt=(v:number)=>Number.isFinite(v)?v.toFixed(2)+'°':'—';
export default function AstrologicalSynthesisPanel({locale,period}:{locale:PortalLocale;period:'day'|'week'}){
 const uk=locale==='uk';
 const [data,setData]=useState<Payload|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<'unauthorized'|'unavailable'|null>(null);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setData(null);setError(null);
  fetch('/api/v1/personal/horoscope/synthesis?days='+(period==='week'?'7':'1'),
   {credentials:'same-origin',cache:'no-store',signal:controller.signal})
   .then(async response=>{
    if(response.status===401)throw Error('unauthorized');
    if(!response.ok)throw Error('unavailable');
    const body:Payload=await response.json();
    if(body.reference!=='ASTROLOGICAL_SYNTHESIS_V1'||!Array.isArray(body.days))
     throw Error('unavailable');
    if(body.status==='available'&&body.days.length!==(period==='week'?7:1))
     throw Error('unavailable');
    return body;
   })
   .then(body=>{if(!controller.signal.aborted)setData(body)})
   .catch(e=>{if(!controller.signal.aborted)setError(e.message==='unauthorized'?'unauthorized':'unavailable')})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[period,retry]);
 const t=(text:L)=>text[locale];
 return <section className={styles.synthesis} data-testid="synthesis-panel" aria-label={uk?'Астрологічний синтез':'Astrological synthesis'}>
  <header className={styles.personalHeading}>
   <h2>{uk?'Синтез моєї карти':'My chart synthesis'}</h2>
   <span>ASTROLOGICAL SYNTHESIS ENGINE · V1</span>
  </header>
  <p className={styles.note}>{uk?
   'Зіставлення західних аспектів до натальних Сонця й Місяця та ведичних транзитів від Джанма-раші й Лагни. Спільні теми виникають лише за наявності свідчень в обох традиціях.':
   'Western transits to your natal Sun and Moon compared with Vedic gochara from natal Moon and Ascendant. Shared themes appear only when both methods independently support them.'}</p>
  {loading&&<p role="status">{uk?'Звіряємо аспекти й гочару…':'Comparing aspects and gochara…'}</p>}
  {error&&<div role="alert" className={styles.error}>
   {error==='unauthorized'?(uk?'Для синтезу потрібно увійти до акаунта.':'Sign in to view your synthesis.'):
    (uk?'Не вдалося підтвердити планетарні розрахунки. Синтез не створено.':'Planetary data could not be verified. No synthesis was generated.')}
   {' '}<button type="button" onClick={()=>setRetry(n=>n+1)}>{uk?'Повторити':'Retry'}</button>
  </div>}
  {!loading&&data?.status==='requires_verified_chart'&&<div className={styles.empty}>
   <p>{uk?'Обери перевірену натальну карту у «Моєму Всесвіті» — синтез не будується за випадковим знаком.':
    'Select a verified birth chart in Your Universe. Synthesis cannot be built from a guessed sign.'}</p>
   <Link href={'/'+locale+'/personal'}>{uk?'Мій Всесвіт':'Your Universe'}</Link>
  </div>}
  {data?.status==='available'&&data.days.map(day=><article key={day.date} className={styles.synthesisDay} data-testid="synthesis-day">
   <small className={styles.kicker}>{day.date} · {day.zone}</small>
   <h3>{t(day.headline)}</h3>
   <p>{t(day.description)}</p>
   {day.status==='different_emphases'&&day.separateTopics&&<p className={styles.synthesisMatch}>
    {uk?'Західний акцент: ':'Western focus: '}{day.separateTopics.western?t(day.separateTopics.western.title):'—'}
    {' · '}{uk?'Ведичний акцент: ':'Vedic focus: '}{day.separateTopics.vedic?t(day.separateTopics.vedic.title):'—'}
   </p>}
   {day.status==='convergence'&&<p className={styles.synthesisMatch}>
    {uk?'Спільні теми: ':'Shared themes: '}{day.commonTopics.map(x=>t(x.title)).join(' · ')}</p>}
   {day.status!=='convergence'&&<p className={styles.note}>{day.status==='different_emphases'?
    (uk?'Дві традиції мають різні акценти — це не помилка розрахунків і не штучний консенсус.':
     'The two traditions emphasize different areas; this is not an arithmetic error or a forced consensus.'):
    (uk?'Мало близьких західних аспектів у визначених орбісах; не домислюємо збіг.':
     'Few close Western natal aspects meet the defined orbs; no agreement is fabricated.')}</p>}
   <div className={styles.synthesisAdvice}>
    <strong>{uk?'Порада з традиційного трактування':'Traditional guidance'}</strong>
    <p>{t(day.advice)}</p>
    <small>{t(day.reflection)}</small>
   </div>
   <div className={styles.synthesisSources}>
    {(['western','vedic'] as const).map(system=><details key={system} data-testid={'synthesis-evidence-'+system}>
     <summary>{system==='western'?(uk?'Західні аспекти':'Western aspects'):(uk?'Ведична гочара':'Vedic gochara')}
      {' · '}{day[system].signals.length}
     </summary>
     {system==='vedic'&&day.vedic.periodContext?.lord&&<p>
      {uk?'Чинний період Вімшоттарі: ':'Current Vimshottari period: '}{day.vedic.periodContext.lord}
      {day.vedic.periodContext.antardasha?' · '+day.vedic.periodContext.antardasha:''}
      {' '}{uk?'(додатковий часовий контекст)':'(timing context only)'}
     </p>}
     {day[system].signals.length===0&&<p>{uk?'Точних збігів у визначеному наборі правил немає.':
      'No matching evidence within the selected rules.'}</p>}
     {day[system].signals.map(signal=><div key={signal.id} className={styles.synthesisEvidence}>
      <strong>{t(signal.title)}</strong>
      <p>{t(signal.detail)}</p>
      <small>{uk?'Транзитна довгота: ':'Transit longitude: '}{fmt(signal.transitLongitude)}
       {signal.natalLongitude!==undefined?' · '+(uk?'Натальна: ':'Natal: ')+fmt(signal.natalLongitude):''}
       {signal.orbDegrees!==undefined?' · '+(uk?'Орбіс: ':'Orb: ')+fmt(signal.orbDegrees):''}
       {signal.house!==undefined?' · '+(uk?'Дім: ':'House: ')+signal.house:''}</small>
      <small>{signal.source} · {signal.sampledAtUtc}</small>
     </div>)}
    </details>)}
   </div>
   <small className={styles.note}>{uk?'Дані: Swiss Ephemeris · тропічна та сидерична Лахірі · місцевий полудень. Символічне тлумачення: редакційні правила Galaxiora v1.':
    'Data: Swiss Ephemeris · tropical and Lahiri sidereal · local noon. Symbolic interpretation: Galaxiora editorial rules v1.'}</small>
  </article>)}
 </section>;
}
