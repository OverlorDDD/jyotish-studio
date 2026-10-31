'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import styles from './HoroscopeHub.module.css';
type L={uk:string;en:string};
type Signal={id:string;source:string;planet:string;title:L;detail:L;topic:string;
 transitLongitude:number;natalLongitude?:number;orbDegrees?:number;house?:number;
 sampledAtUtc:string;};
type Advanced={
 version:'ASE_V2';
 natal:{planets:Record<string,{longitude:number;sign:number;house:number}>;ascendant:number;midheaven:number;cusps:number[];
 contacts:{id:string;first:string;second:string;aspect:string;orb:number}[]};
 western:{contacts:{id:string;planet:string;target:string;aspect:string;orb:number;applying:string}[];
 timed:{id:string;startUtc:string;endUtc:string;exactUtc:string[];clippedStart:boolean;clippedEnd:boolean}[]};
 vedic:{ashtakavarga:{sav:number[];bav:Record<string,number[]>;total:number};
 gochara:{graha:string;sign:number;bav:number;sav:number;houseFromMoon:number;houseFromLagna:number}[];
 drishti:{graha:string;toSign:number;offset:number;natalTargets:string[]}[]};
};
type AiReading={status:'available'|'unavailable'|'disabled';reason?:string;
 paragraphs?:{id:string;text:string;evidenceIds:string[]}[];
 evidence?:{id:string;tradition:string;fact:string}[]};
type SynthesisDay={
 advanced?:Advanced;version:'ASE_V1';date:string;zone:string;status:'convergence'|'different_emphases'|'limited_evidence';
 headline:L;description:L;advice:L;reflection:L;
 commonTopics:{key:string;title:L}[];
 separateTopics?:{western:{key:string;title:L}|null;vedic:{key:string;title:L}|null};
 western:{signals:Signal[];matchedCount:number;reference:string};
 vedic:{signals:Signal[];reference:string;periodContext?:{lord:string;antardasha?:string|null}|null};
 provenance:{sampledAtUtc:string;interpretation:string;comparison:string;warning:string};
};
type Payload={status:'available'|'requires_verified_chart';
 reference:'ASTROLOGICAL_SYNTHESIS_V1'|'ASTROLOGICAL_SYNTHESIS_V2';advancedStatus?:string;date?:string;zone?:string;days:SynthesisDay[]};
const fmt=(v:number)=>Number.isFinite(v)?v.toFixed(2)+'°':'—';
export default function AstrologicalSynthesisPanel({locale,period}:{locale:PortalLocale;period:'day'|'week'}){
 const uk=locale==='uk';
 const [data,setData]=useState<Payload|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<'unauthorized'|'unavailable'|null>(null);
 const [retry,setRetry]=useState(0);
 const [aiConsent,setAiConsent]=useState(false);
 const [aiReading,setAiReading]=useState<AiReading|null>(null);
 const [aiLoading,setAiLoading]=useState(false);
 const generateReading=async()=>{
  if(!aiConsent||aiLoading)return;
  setAiLoading(true);setAiReading(null);
  try{
   const response=await fetch('/api/v1/personal/horoscope/synthesis/reading',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({consent:true,locale})});
   if(!response.ok)throw Error('reading unavailable');
   const body=await response.json() as AiReading;
   setAiReading(body);
  }catch{setAiReading({status:'unavailable',reason:'REQUEST_FAILED'});}
  finally{setAiLoading(false);}
 };
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setData(null);setError(null);setAiReading(null);
  fetch('/api/v1/personal/horoscope/synthesis/advanced?days='+(period==='week'?'7':'1'),
   {credentials:'same-origin',cache:'no-store',signal:controller.signal})
   .then(async response=>{
    if(response.status===401)throw Error('unauthorized');
    if(!response.ok)throw Error('unavailable');
    const body:Payload=await response.json();
    if(!['ASTROLOGICAL_SYNTHESIS_V1','ASTROLOGICAL_SYNTHESIS_V2'].includes(body.reference)||!Array.isArray(body.days))
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
   <span>ASTROLOGICAL SYNTHESIS ENGINE · V2 / V3</span>
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

   {day.advanced?<div className={styles.synthesisSources} data-testid="synthesis-advanced-v2">
    <details><summary>{uk?'Західна натальна карта · 7 планет і 12 домів':'Western natal chart · 7 planets and 12 houses'}</summary>
     <p>{uk?'Тропічна система домів Placidus. ASC: ':'Tropical Placidus houses. ASC: '}
      {fmt(day.advanced.natal.ascendant)} · MC: {fmt(day.advanced.natal.midheaven)}</p>
     <p>{uk?'Куспіди домів: ':'House cusps: '}
      {day.advanced.natal.cusps.map((v,i)=>(i+1)+': '+fmt(v)).join(' · ')}</p>
     {Object.entries(day.advanced.natal.planets).map(([name,p])=><p key={name}>
      {name}: {fmt(p.longitude)} · {uk?'знак':'sign'} {p.sign} · {uk?'дім':'house'} {p.house}</p>)}
     <h4>{uk?'Натальні аспекти':'Natal aspects'}</h4>
     {day.advanced.natal.contacts.length?day.advanced.natal.contacts.map(c=><p key={c.id}>
      {c.first} – {c.second}: {c.aspect} · {uk?'орбіс':'orb'} {fmt(c.orb)}</p>):
      <p>{uk?'Немає аспектів у заданих орбісах.':'No contacts within configured orbs.'}</p>}
    </details>
    <details><summary>{uk?'Транзитні аспекти та точний час':'Transit aspects and exact contacts'}</summary>
     {day.advanced.western.contacts.map(c=><p key={c.id}>
      {c.planet} → {c.target}: {c.aspect} · {fmt(c.orb)} ·
      {' '}{c.applying==='applying'?(uk?'наближається':'applying'):
       c.applying==='separating'?(uk?'віддаляється':'separating'):(uk?'зміна напрямку':'turning')}
     </p>)}
     {day.advanced.western.timed.map(w=><div key={w.id} className={styles.synthesisEvidence}>
      <strong>{w.id}</strong>
      <p>{uk?'Початок ':'Start '}{w.startUtc}
       {w.clippedStart?' ('+(uk?'раніше межі пошуку':'clipped')+')':''}
       {' · '}{uk?'Кінець ':'End '}{w.endUtc}
       {w.clippedEnd?' ('+(uk?'пізніше межі пошуку':'clipped')+')':''}</p>
      <p>{uk?'Точні збіги (UTC): ':'Exact contacts (UTC): '}
       {w.exactUtc.length?w.exactUtc.join(' · '):(uk?'Не знайдено у межах пошуку':'None within search horizon')}</p>
     </div>)}
    </details>
    <details><summary>{uk?'Граха-дрішті та Аштакаварга':'Graha drishti and Ashtakavarga'}</summary>
     <p>BPHS · {uk?'Нередукована Sarvashtakavarga':'Unreduced Sarvashtakavarga'} ·
      {' '}{uk?'усього':'total'} {day.advanced.vedic.ashtakavarga.total}</p>
     <p>{uk?'12 знаків: ':'12 signs: '}{day.advanced.vedic.ashtakavarga.sav.join(' · ')}</p>
     {day.advanced.vedic.gochara.map(g=><p key={g.graha}>{g.graha}:
      {' '}{uk?'знак':'sign'} {g.sign} · BAV {g.bav} · SAV {g.sav} ·
      {' '}{uk?'від Місяця дім':'house from Moon'} {g.houseFromMoon} ·
      {' '}{uk?'від Лагни дім':'house from Lagna'} {g.houseFromLagna}</p>)}
     {day.advanced.vedic.drishti.filter(d=>d.natalTargets.length>0).map(d=><p key={d.graha+':'+d.offset}>
      {d.graha} → {d.natalTargets.join(', ')}
      {' · '}{uk?'повний аспект на':'full aspect to sign'} {d.toSign}</p>)}
    </details>
   </div>:<p className={styles.note} data-testid="synthesis-v2-unavailable">
    {uk?'Розширений розрахунок ASE-2 для цієї карти недоступний. Базовий синтез ASE-1 збережено.':
      'ASE-2 advanced calculations are unavailable for this chart. ASE-1 remains available.'}
   </p>}
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
  {data?.status==='available'&&data.days[0]?.advanced&&<section data-testid="synthesis-ai-v3" className={styles.synthesisAdvice}>
   <h3>{uk?'ASE-3 · Глибоке AI-прочитання':'ASE-3 · Deep AI reading'}</h3>
   <p>{uk?'AI створює лише текстове тлумачення перевірених астрологічних свідчень. Обчислення не змінюються.':
    'AI writes only a narrative of verified astrological evidence. Calculations never change.'}</p>
   <label><input type="checkbox" checked={aiConsent}
    onChange={e=>setAiConsent(e.target.checked)}/>
    {' '}{uk?'Погоджуюся передати знеособлені астрологічні свідчення AI-провайдеру.':
     'I consent to sending de-identified astrological evidence to an AI provider.'}</label>
   <p><button type="button" disabled={!aiConsent||aiLoading}
    onClick={generateReading}>
    {aiLoading?(uk?'Створюємо прочитання…':'Generating…'):
     (uk?'Створити глибоке прочитання':'Generate deep reading')}</button></p>
   {aiReading?.status==='available'&&aiReading.paragraphs?.map(p=><div key={p.id}
    className={styles.synthesisEvidence}>
    <p>{p.text}</p>
    <small>{uk?'Підтверджені джерела: ':'Verified evidence: '}{p.evidenceIds.join(', ')}</small>
   </div>)}
   {aiReading&&aiReading.status!=='available'&&<p role="status">
    {uk?'AI-прочитання недоступне або не пройшло перевірку. Жодних вигаданих фактів не показано.':
     'AI reading unavailable or did not pass validation. No fabricated facts are shown.'}</p>}
  </section>}
 </section>;
}
