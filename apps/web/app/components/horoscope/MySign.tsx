'use client';
/** Remembers the visitor's sign in this browser only (localStorage), separately
 * for the Western and Vedic systems. Nothing is sent to the server. */
import {useEffect,useState} from 'react';
import Link from 'next/link';
import styles from './Horoscope.module.css';
import {SIGNS,glyph,signPath,type HoroLocale,type HoroSystem} from '../../../lib/horoscope-signs';

const KEY='gx-horo-sign';
type Saved={western?:string;vedic?:string};
function read():Saved{try{return JSON.parse(localStorage.getItem(KEY)||'{}') as Saved;}catch{return {};}}
function write(v:Saved){try{localStorage.setItem(KEY,JSON.stringify(v));}catch{/* private mode */}}
export function rememberSigns(v:Saved){write({...read(),...v});}

export function MySignButton({system,slug,locale}:{system:HoroSystem;slug:string;locale:HoroLocale}){
 const [mine,setMine]=useState(false);
 useEffect(()=>{setMine(read()[system]===slug);},[system,slug]);
 return <button type="button" className={styles.btnGhost} aria-pressed={mine} onClick={()=>{
  const cur=read();if(mine){delete cur[system];write(cur);setMine(false);}else{write({...cur,[system]:slug});setMine(true);}
 }}>{mine?(locale==='uk'?'✓ Це мій знак':'✓ My sign'):(locale==='uk'?'Це мій знак':'This is my sign')}</button>;
}

export function MySignPanel({system,locale}:{system:HoroSystem;locale:HoroLocale}){
 const [slug,setSlug]=useState<string|null|undefined>(undefined);
 useEffect(()=>{
  // Old shared links used hub fragments (#vedic-aries); send them to the real sign page.
  const legacy=/^(vedic|western)-([a-z]+)$/.exec(window.location.hash.slice(1).toLowerCase());
  if(legacy&&SIGNS.some(x=>x.slug===legacy[2])){window.location.replace(signPath(locale,legacy[1] as HoroSystem,legacy[2]));return;}
  setSlug(read()[system]||null);
 },[system,locale]);
 if(slug===undefined)return null;
 const s=SIGNS.find(x=>x.slug===slug);
 const uk=locale==='uk';
 if(!s)return <aside className={styles.mine} aria-label={uk?'Ваш знак':'Your sign'}>
  <div><h2>{uk?'Оберіть свій знак — ми його запам’ятаємо':'Pick your sign — we will remember it'}</h2>
   <p>{uk?'Натисніть на свій знак нижче, а на його сторінці — «Це мій знак». Наступного разу ваш гороскоп відкриється першим.':'Tap your sign below, then “This is my sign”. Next time your horoscope opens first.'}</p></div>
  <div className={styles.mineActions}><Link className={styles.btnGhost} href={'/'+locale+'/horoscope/my-sign'}>{uk?'Не знаю свій знак':'I don’t know my sign'}</Link></div>
 </aside>;
 return <aside className={styles.mine} aria-label={uk?'Ваш знак':'Your sign'}>
  <span className={styles.medal} aria-hidden="true">{glyph(s)}</span>
  <div><h2>{uk?'Ваш знак — '+s.uk:'Your sign — '+s.en}</h2>
   <p>{uk?'Прогноз на сьогодні, завтра, тиждень і місяць:':'Your forecast for today, tomorrow, the week and the month:'}</p></div>
  <div className={styles.mineActions}>
   <Link className={styles.btn} href={signPath(locale,system,s.slug)}>{uk?'Сьогодні':'Today'}</Link>
   <Link className={styles.btnGhost} href={signPath(locale,system,s.slug,'tomorrow')}>{uk?'Завтра':'Tomorrow'}</Link>
   <Link className={styles.btnGhost} href={signPath(locale,system,s.slug,'week')}>{uk?'Тиждень':'Week'}</Link>
   <Link className={styles.btnGhost} href={signPath(locale,system,s.slug,'month')}>{uk?'Місяць':'Month'}</Link>
  </div>
 </aside>;
}
