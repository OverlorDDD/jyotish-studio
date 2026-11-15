'use client';
/** «Зоряний паспорт»: one form → Western Sun sign, Vedic Sun and Moon signs,
 * the Moon's nakshatra and why they differ. Birth data is sent once over POST
 * for the calculation and is not stored; the signs stay in this browser only. */
import {useState} from 'react';
import Link from 'next/link';
import styles from './Horoscope.module.css';
import {ZONES,elClass} from './parts';
import {rememberSigns} from './MySign';
import {SIGNS,glyph,signPath,type HoroLocale} from '../../../lib/horoscope-signs';

type Result={western:{sunSign:number};vedic:{sunSign:number;moonSigns:number[];nakshatra:{name:string;pada:number}|null};ayanamshaDegrees:number;timeKnown:boolean};
const dm=(deg:number)=>{const d=Math.floor(deg),m=Math.round((deg-d)*60);return d+'°'+String(m===60?0:m).padStart(2,'0')+'′';};

export default function Passport({locale}:{locale:HoroLocale}){
 const uk=locale==='uk';
 const [date,setDate]=useState(''),[time,setTime]=useState(''),[zone,setZone]=useState('Europe/Kyiv');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[res,setRes]=useState<Result|null>(null),[saved,setSaved]=useState(false),[copied,setCopied]=useState(false);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();setError('');setRes(null);setSaved(false);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){setError(uk?'Вкажіть дату народження.':'Enter your birth date.');return;}
  setBusy(true);
  try{
   const r=await fetch('/api/v1/horoscope/v3/passport',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',
    body:JSON.stringify({date,...(time?{time}:{}),zone})});
   if(!r.ok)throw Error();
   setRes(await r.json() as Result);
  }catch{setError(uk?'Не вдалося розрахувати. Перевірте дату й спробуйте ще раз.':'Could not calculate. Check the date and try again.');}
  finally{setBusy(false);}
 };
 const W=res?SIGNS[res.western.sunSign-1]:null,VS=res?SIGNS[res.vedic.sunSign-1]:null;
 const VM=res?res.vedic.moonSigns.map(n=>SIGNS[n-1]):[];
 const name=(s:typeof SIGNS[number])=>uk?s.uk:s.en;
 const shareText=W&&VS?(uk?'Мій зоряний паспорт: на Заході я '+W.uk+', у ведичній астрології Сонце — '+VS.uk+(VM.length===1?', Місяць — '+VM[0].uk:'')+'. А ви?':'My Star Passport: Western '+W.en+', Vedic Sun '+VS.en+(VM.length===1?', Vedic Moon '+VM[0].en:'')+'. And you?'):'';
 return <>
  <form className={styles.form} onSubmit={submit}>
   <label>{uk?'Дата народження':'Birth date'}<input type="date" required value={date} min="1900-01-01" max="2099-12-31" onChange={e=>setDate(e.target.value)}/></label>
   <label>{uk?'Час народження (якщо знаєте)':'Birth time (if known)'}<input type="time" value={time} aria-describedby="passport-time-note" onChange={e=>setTime(e.target.value)}/></label>
   <label>{uk?'Країна народження':'Country of birth'}<select value={zone} onChange={e=>setZone(e.target.value)}>{ZONES.map(([z,n])=><option key={z} value={z}>{n}</option>)}</select></label>
   <button type="submit" className={styles.btn} disabled={busy}>{busy?(uk?'Рахуємо…':'Calculating…'):(uk?'Показати мої знаки':'Show my signs')}</button>
   <p className={styles.formNote} id="passport-time-note">{uk?'Час народження потрібен для точного знака Місяця й накшатри. Без нього покажемо можливі варіанти.':'Birth time gives the exact Moon sign and nakshatra. Without it we show the possible options.'}</p>
  </form>
  {error&&<p className={styles.error} role="alert">{error}</p>}
  {res&&W&&VS&&<section aria-live="polite">
   <div className={styles.result}>
    <article className={styles.resultCard+' '+elClass(W)}><h3>{uk?'Західний знак (Сонце)':'Western sign (Sun)'}</h3>
     <span className={styles.medal+' '+styles.medalBig} aria-hidden="true">{glyph(W)}</span><strong>{name(W)}</strong><p>{W.western[locale]}</p>
     <Link className={styles.link} href={signPath(locale,'western',W.slug)}>{uk?'Мій західний гороскоп →':'My Western horoscope →'}</Link></article>
    <article className={styles.resultCard+' '+elClass(VS)}><h3>{uk?'Ведичний знак Сонця':'Vedic Sun sign'}</h3>
     <span className={styles.medal+' '+styles.medalBig} aria-hidden="true">{glyph(VS)}</span><strong>{name(VS)}</strong><p>{VS.sanskrit}</p></article>
    <article className={styles.resultCard+' '+elClass(VM[0])}><h3>{uk?'Ведичний знак Місяця — ваш раші':'Vedic Moon sign — your rashi'}</h3>
     <span className={styles.medal+' '+styles.medalBig} aria-hidden="true">{glyph(VM[0])}</span>
     <strong>{VM.map(name).join(uk?' або ':' or ')}</strong>
     <p>{res.vedic.nakshatra?(uk?'Накшатра ':'Nakshatra ')+res.vedic.nakshatra.name+(uk?', пада ':', pada ')+res.vedic.nakshatra.pada:
      VM.length>1?(uk?'Того дня Місяць змінив знак — уточніть час народження.':'The Moon changed sign that day — add your birth time.'):(uk?'Додайте час, щоб дізнатися накшатру.':'Add the time to see your nakshatra.')}</p>
     {VM.length===1&&<Link className={styles.link} href={signPath(locale,'vedic',VM[0].slug)}>{uk?'Мій ведичний гороскоп →':'My Vedic horoscope →'}</Link>}</article>
   </div>
   <div className={styles.explain}>
    <p style={{margin:'0 0 10px'}}>{uk?'Чому знаки різні? Західна астрологія рахує зодіак від весняного рівнодення, а ведична — від нерухомих зірок. Через прецесію земної осі ці дві системи зараз розходяться на ':'Why are they different? Western astrology counts the zodiac from the spring equinox, Vedic astrology from the fixed stars. Because Earth’s axis slowly precesses, the two systems now differ by '}<b>{dm(res.ayanamshaDegrees)}</b>{uk?' (айанамша Лахірі). Тому ведичний знак Сонця часто на один раніше за західний.':' (Lahiri ayanamsha). That is why the Vedic Sun sign is often one sign earlier.'}</p>
    <p style={{margin:0}}>{uk?'У Джйотиш головним вважають знак Місяця: він описує розум і почуття, і саме від нього рахують щоденний гороскоп.':'In Jyotish the Moon sign is primary: it describes the mind and feelings, and the daily horoscope is counted from it.'}</p>
   </div>
   <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
    <button type="button" className={styles.btn} onClick={()=>{rememberSigns({western:W.slug,...(VM.length===1?{vedic:VM[0].slug}:{})});setSaved(true);}}>{saved?(uk?'✓ Запам’ятали':'✓ Saved'):(uk?'Запам’ятати мої знаки':'Remember my signs')}</button>
    <button type="button" className={styles.btnGhost} onClick={async()=>{
     const url=window.location.origin+'/'+locale+'/horoscope/my-sign';
     try{if(navigator.share)await navigator.share({text:shareText,url});else{await navigator.clipboard.writeText(shareText+' '+url);setCopied(true);}}catch{/* cancelled */}
    }}>{copied?(uk?'✓ Скопійовано':'✓ Copied'):(uk?'Поділитися з друзями':'Share with friends')}</button>
   </div>
  </section>}
 </>;
}
