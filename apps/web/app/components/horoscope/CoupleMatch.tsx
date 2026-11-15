'use client';
/** «36 гун»: classical Ashtakoota matching from two birth dates. Both birth
 * records go to the server once over POST, are used for the calculation and
 * are never stored; nothing is kept in this browser either. */
import {useState} from 'react';
import Link from 'next/link';
import styles from './Horoscope.module.css';
import {ZONES} from './parts';
import {SIGNS,type HoroLocale} from '../../../lib/horoscope-signs';

type Koota='varna'|'vashya'|'tara'|'yoni'|'grahaMaitri'|'gana'|'bhakoot'|'nadi';
type Person={sunSign:number;vedicSunSign:number;moonSign:number;nakshatra:{index:number;name:string;pada:number};timeKnown:boolean;exact:boolean};
type Result={a:Person;b:Person;approximate:boolean;band:'excellent'|'good'|'average'|'low';
 ashtakoota:{total:number;max:number;scores:Partial<Record<Koota,number>>;bhakoot:{pair:string;dosha:boolean;cancelled:boolean};
  nadi:{dosha:boolean;exception:boolean}|null;detail:Record<string,[string,string]>}};

const NAK_UK=['Ашвіні','Бхарані','Кріттіка','Рохіні','Мрігашіра','Ардра','Пунарвасу','Пуш’я','Ашлеша','Магха','Пурва Пхалгуні','Уттара Пхалгуні','Хаста','Чітра','Сваті','Вішакха','Анурадха','Дж’єштха','Мула','Пурва Ашадха','Уттара Ашадха','Шравана','Дханіштха','Шатабхіша','Пурва Бхадрапада','Уттара Бхадрапада','Реваті'];
const NAK_SLUG=['ashwini','bharani','krittika','rohini','mrigashira','ardra','punarvasu','pushya','ashlesha','magha','purva-phalguni','uttara-phalguni','hasta','chitra','swati','vishakha','anuradha','jyeshtha','mula','purva-ashadha','uttara-ashadha','shravana','dhanishta','shatabhisha','purva-bhadrapada','uttara-bhadrapada','revati'];
const WORD_UK:Record<string,string>={Brahmin:'брахман',Kshatriya:'кшатрій',Vaishya:'вайш’я',Shudra:'шудра',Chatushpada:'чотириногі',Nara:'людина',Jalachara:'водні',Vanachara:'дикі',Keeta:'комаха',
 Horse:'кінь',Elephant:'слон',Sheep:'баран',Serpent:'змія',Dog:'собака',Cat:'кіт',Rat:'щур',Cow:'корова',Buffalo:'буйвол',Tiger:'тигр',Deer:'олень',Monkey:'мавпа',Mongoose:'мангуст',Lion:'лев',
 Deva:'дева',Manushya:'манушья',Rakshasa:'ракшаса',Adi:'аді (вата)',Madhya:'мадхья (пітта)',Antya:'антья (капха)',
 Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const KOOTAS:{k:Koota;max:number;uk:string;en:string;dUk:string;dEn:string;detail?:string}[]=[
 {k:'varna',max:1,uk:'Варна',en:'Varna',dUk:'ставлення до обов’язку й духовний темперамент',dEn:'sense of duty and spiritual temperament',detail:'varna'},
 {k:'vashya',max:2,uk:'Вашья',en:'Vashya',dUk:'взаємне притягання і вплив',dEn:'mutual attraction and influence',detail:'vashya'},
 {k:'tara',max:3,uk:'Тара',en:'Tara',dUk:'доля й добробут пари за накшатрами',dEn:'fortune and wellbeing by nakshatra',},
 {k:'yoni',max:4,uk:'Йоні',en:'Yoni',dUk:'фізична й інтимна гармонія',dEn:'physical and intimate harmony',detail:'yoni'},
 {k:'grahaMaitri',max:5,uk:'Граха-майтрі',en:'Graha Maitri',dUk:'дружба розуму: стосунки управителів знаків Місяця',dEn:'friendship of minds: the Moon-sign lords',detail:'lords'},
 {k:'gana',max:6,uk:'Гана',en:'Gana',dUk:'темперамент',dEn:'temperament',detail:'gana'},
 {k:'bhakoot',max:7,uk:'Бхакут',en:'Bhakoot',dUk:'емоційна близькість, сім’я й достаток',dEn:'emotional closeness, family and prosperity'},
 {k:'nadi',max:8,uk:'Наді',en:'Nadi',dUk:'здоров’я й потомство за традицією',dEn:'health and progeny in the tradition',detail:'nadi'}
];
const BAND={excellent:{uk:'Чудова сумісність',en:'Excellent match'},good:{uk:'Добра сумісність',en:'Good match'},average:{uk:'Прийнятна сумісність',en:'Acceptable match'},low:{uk:'Складна сумісність',en:'Challenging match'}};

type Birth={date:string;time:string;zone:string};
function BirthFields({id,label,v,set,uk}:{id:string;label:string;v:Birth;set:(b:Birth)=>void;uk:boolean}){
 return <fieldset className={styles.person}>
  <legend>{label}</legend>
  <label>{uk?'Дата народження':'Birth date'}<input type="date" required min="1900-01-01" max="2099-12-31" value={v.date} onChange={e=>set({...v,date:e.target.value})}/></label>
  <label>{uk?'Час (якщо знаєте)':'Time (if known)'}<input type="time" value={v.time} aria-describedby="match-time-note" onChange={e=>set({...v,time:e.target.value})}/></label>
  <label>{uk?'Країна народження':'Country of birth'}<select value={v.zone} onChange={e=>set({...v,zone:e.target.value})} id={id+'-zone'}>{ZONES.map(([z,n])=><option key={z} value={z}>{n}</option>)}</select></label>
 </fieldset>;
}

export default function CoupleMatch({locale}:{locale:HoroLocale}){
 const uk=locale==='uk';
 const empty={date:'',time:'',zone:'Europe/Kyiv'};
 const [a,setA]=useState<Birth>(empty),[b,setB]=useState<Birth>(empty),[roles,setRoles]=useState('none');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[res,setRes]=useState<Result|null>(null),[copied,setCopied]=useState(false);
 const num=(x:number)=>uk?String(x).replace('.',','):String(x);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();setError('');setRes(null);setCopied(false);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(a.date)||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)){setError(uk?'Вкажіть обидві дати народження.':'Enter both birth dates.');return;}
  setBusy(true);
  const pack=(x:Birth)=>({date:x.date,...(x.time?{time:x.time}:{}),zone:x.zone});
  try{
   const r=await fetch('/api/v1/horoscope/v3/match',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',
    body:JSON.stringify({a:pack(a),b:pack(b),roles})});
   if(!r.ok)throw Error(String(r.status));
   setRes(await r.json() as Result);
  }catch{setError(uk?'Не вдалося розрахувати. Перевірте дати й спробуйте ще раз.':'Could not calculate. Check the dates and try again.');}
  finally{setBusy(false);}
 };
 const sign=(n:number)=>uk?SIGNS[n-1].uk:SIGNS[n-1].en;
 const word=(x:string)=>uk?(WORD_UK[x]||x):x;
 const pairHref=(x:number,y:number)=>{const p=SIGNS[Math.min(x,y)-1],q=SIGNS[Math.max(x,y)-1];return '/'+locale+'/horoscope/compatibility/'+p.slug+'-'+q.slug;};
 const share=async()=>{
  if(!res)return;
  const text=uk?'Наша сумісність за ведичною системою 36 гун: '+num(res.ashtakoota.total)+' з 36. А у вас?':'Our Vedic 36-guna compatibility: '+res.ashtakoota.total+' of 36. What’s yours?';
  const url=location.origin+'/'+locale+'/horoscope/compatibility';
  try{if(navigator.share){await navigator.share({text,url});return;}await navigator.clipboard.writeText(text+' '+url);setCopied(true);}catch{/* dismissed */}
 };
 const person=(p:Person,label:string)=><div className={styles.personResult}>
  <h3>{label}</h3>
  <p>{uk?'Місяць у знаку ':'Moon in '}<b>{sign(p.moonSign)}</b>{', '}{uk?'накшатра ':'nakshatra '}<Link className={styles.link} href={'/'+locale+'/nakshatra/'+NAK_SLUG[p.nakshatra.index]}>{uk?NAK_UK[p.nakshatra.index]:p.nakshatra.name}</Link></p>
  <p>{uk?'Західний знак: ':'Western sign: '}{sign(p.sunSign)}</p>
 </div>;
 const r=res?.ashtakoota;
 return <section id="by-birth" className={styles.matchBox} aria-labelledby="match-title">
  <h2 id="match-title">{uk?'Сумісність за датами народження: 36 гун':'Compatibility from birth dates: 36 gunas'}</h2>
  <p className={styles.matchLead}>{uk?'Класична ведична перевірка Ашта-кута: вісім «кут» порівнюють положення Місяця при народженні двох людей. Саме так в Індії перевіряють пару перед весіллям.':'The classical Vedic Ashtakoota check: eight kootas compare the Moon at the birth of two people. This is how couples are matched before a wedding in India.'}</p>
  <form className={styles.matchForm} onSubmit={submit}>
   <BirthFields id="a" label={uk?'Перша людина':'First person'} v={a} set={setA} uk={uk}/>
   <BirthFields id="b" label={uk?'Друга людина':'Second person'} v={b} set={setB} uk={uk}/>
   <div className={styles.matchFoot}>
    <label className={styles.rolesLabel}>{uk?'Класичні ролі':'Classical roles'}
     <select value={roles} onChange={e=>setRoles(e.target.value)}>
      <option value="none">{uk?'Не враховувати (середнє в обидва боки)':'Ignore (average both ways)'}</option>
      <option value="aBride">{uk?'Перша — наречена, друга — наречений':'First is the bride, second the groom'}</option>
      <option value="bBride">{uk?'Перший — наречений, друга — наречена':'First is the groom, second the bride'}</option>
     </select>
    </label>
    <button type="submit" className={styles.btn} disabled={busy}>{busy?(uk?'Рахуємо…':'Calculating…'):(uk?'Порахувати сумісність':'Calculate compatibility')}</button>
   </div>
   <p className={styles.formNote} id="match-time-note">{uk?'Без часу народження беремо полудень; якщо того дня Місяць змінив накшатру, результат буде приблизним. Дані нікуди не зберігаються.':'Without a birth time we use noon; if the Moon changed nakshatra that day the result is approximate. Nothing is stored.'}</p>
  </form>
  {error&&<p className={styles.error} role="alert">{error}</p>}
  {res&&r&&<div aria-live="polite" className={styles.matchResult}>
   <div className={styles.scoreCard}>
    <div className={styles.ring} style={{'--pct':Math.round(r.total/36*100)} as React.CSSProperties} role="img" aria-label={num(r.total)+' / 36'}>
     <span><b>{num(r.total)}</b><small>/36</small></span>
    </div>
    <div className={styles.scoreBody}>
     <h3>{BAND[res.band][locale]}</h3>
     <p>{uk?'Традиція вважає 18 гун мінімумом для шлюбу, 21–27 — добрим результатом, від 28 — чудовим.':'Tradition treats 18 gunas as the minimum for marriage, 21–27 as good and 28+ as excellent.'}</p>
     {res.approximate&&<p className={styles.careful}>{uk?'Приблизно: без часу народження Місяць міг бути в сусідній накшатрі.':'Approximate: without a birth time the Moon may have been in the next nakshatra.'}</p>}
    </div>
   </div>
   <div className={styles.persons}>{person(res.a,uk?'Перша людина':'First person')}{person(res.b,uk?'Друга людина':'Second person')}</div>
   <ul className={styles.kootaTable}>
    {KOOTAS.map(k=>{const s=r.scores[k.k]??0,d=k.detail?r.detail[k.detail]:null;
     return <li key={k.k}>
      <div><b>{uk?k.uk:k.en}</b><span>{uk?k.dUk:k.dEn}{d?' · '+word(d[0])+' / '+word(d[1]):''}</span></div>
      <span className={styles.bar}><span style={{width:(s/k.max*100)+'%'}}/></span>
      <strong>{num(s)}/{k.max}</strong>
     </li>;})}
   </ul>
   {(res.ashtakoota.nadi?.dosha||res.ashtakoota.bhakoot.dosha)&&<div className={styles.chandra}>
    <span>
     {res.ashtakoota.nadi?.dosha&&(uk?'Наді-доша: обидва Місяці в одній наді. '+(res.ashtakoota.nadi.exception?'Діє класичний виняток (однакова накшатра в різних знаках або один знак із різними накшатрами), тож доша вважається слабкою. ':'Традиція вважає її найсерйознішою з дош, але оцінює разом із цілою картою. '):'Nadi dosha: both Moons share a nadi. '+(res.ashtakoota.nadi.exception?'A classical exception applies, so the dosha is considered weak. ':'Tradition treats it as the most serious dosha, but weighs it against the full chart. '))}
     {res.ashtakoota.bhakoot.dosha&&(uk?'Бхакут-доша ('+res.ashtakoota.bhakoot.pair+')'+(res.ashtakoota.bhakoot.cancelled?' нейтралізується дружбою управителів знаків.':'.'):'Bhakoot dosha ('+res.ashtakoota.bhakoot.pair+')'+(res.ashtakoota.bhakoot.cancelled?' is neutralised by friendly sign lords.':'.'))}
    </span>
   </div>}
   <div className={styles.matchActions}>
    <Link className={styles.btnGhost} href={pairHref(res.a.sunSign,res.b.sunSign)}>{uk?'Західна сумісність: ':'Western match: '}{sign(res.a.sunSign)} + {sign(res.b.sunSign)}</Link>
    <button type="button" className={styles.btnGhost} onClick={share}>{copied?(uk?'Скопійовано':'Copied'):(uk?'Поділитися результатом':'Share the result')}</button>
   </div>
  </div>}
 </section>;
}
