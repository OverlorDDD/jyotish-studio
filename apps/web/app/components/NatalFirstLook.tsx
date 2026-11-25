import {useEffect,useRef,useState} from 'react';
import type {PlanetPosition} from '../../lib/north-indian-layout';
import NorthIndianChart from './NorthIndianChart';
import styles from './NatalFirstLook.module.css';

type Locale='en'|'uk';
type FirstLookChart={ascendant:{sign:number};d1:PlanetPosition[]};
export type NatalFormVariant='short'|'steps';

// Positions for the fictional London example, calculated using the normal Jyotish engine.
// The regression test compares both placements with the engine independently of the UI.
const sample={ascendant:{sign:4},d1:[{name:'Moon',house:3,sign:6,degreesInSign:10.121413434338706,retrograde:false}]};
export function NatalSample({lang,onStart}:{lang:Locale;onStart:()=>void}){
 const uk=lang==='uk';
 return <section className={styles.intro} aria-labelledby="natal-page-title">
  <div className={styles.copy}>
   <h1 id="natal-page-title">{uk?'Твоя ведична натальна карта':'Your Vedic birth chart'}</h1>
   <p>{uk?'Дізнайся, який знак сходив у мить твого народження і де був Місяць. Для розрахунку потрібні дата, місцевий час і місто.':'See which sign was rising when you were born and where the Moon was. Enter your birth date, local time and city to build your chart.'}</p>
   <button type="button" className={styles.primary} onClick={onStart} data-testid="natal-pilot-start">{uk?'Розрахувати мою карту':'Calculate my chart'} <span aria-hidden="true">↗</span></button>
  </div>
  <figure className={styles.sample} data-testid="natal-pilot-sample">
   <figcaption>{uk?'Зразок карти · вигадані дані':'Sample chart · fictional birth details'}</figcaption>
   <NorthIndianChart lang={lang} division="d1" chartLabel={uk?'Зразок':'Sample'} planets={sample.d1} lagna={sample.ascendant} showDegrees={false}/>
   <p>{uk?'Висхідний знак — Рак. Місяць у Діві.':'Cancer rising. Moon in Virgo.'}</p>
  </figure>
 </section>;
}

export function NatalFirstResult({lang,chart,rising,moon,onEdit}:{
 lang:Locale;chart:FirstLookChart;rising:string;moon?:string;onEdit:()=>void
}){
 const uk=lang==='uk';
 const [expanded,setExpanded]=useState(false);
 const title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{title.current?.focus();},[]);
 function goToReading(){
  const target=document.getElementById('natal-reading-options');
  target?.focus();
 }
 return <section className={styles.result} data-testid="natal-pilot-result" id="chart-result" aria-labelledby="natal-result-title">
  <header className={styles.top}>
   <h1 ref={title} id="natal-result-title" tabIndex={-1}>{uk?'Твоя натальна карта':'Your birth chart'}</h1>
   <button type="button" className={styles.textButton} onClick={onEdit} data-testid="natal-pilot-edit">{uk?'Змінити дані народження':'Edit birth details'}</button>
  </header>
  <div className={styles.layout}>
   <div className={styles.chart} data-highlight={expanded}>
    <NorthIndianChart lang={lang} division="d1" chartLabel={uk?'Карта народження':'Birth chart'} planets={chart.d1} lagna={chart.ascendant}/>
   </div>
   <div className={styles.reading}>
    <h2>{uk?'Як читати цю карту':'How to read this chart'}</h2>
    <h3>{uk?'Висхідний знак':'Rising sign'} · {rising}</h3>
    <p>{uk?'Цей знак піднімався на східному горизонті у мить народження. З нього в Джйотіш починають відлік домів.':'This sign was rising on the eastern horizon at birth. In Jyotish it marks the first house.'}</p>
    <button className={styles.textButton} type="button" aria-expanded={expanded} aria-controls="natal-lagna-detail" data-testid="natal-pilot-lagna" onClick={()=>setExpanded(!expanded)}>
     {expanded?(uk?'Сховати підказку':'Hide chart hint'):(uk?'Показати Лагну на карті':'Show the ascendant on the chart')}</button>
    <p id="natal-lagna-detail" hidden={!expanded}>{uk?'Позначка Lg у виділеній клітинці — твоя Лагна.':'Look for Lg in the outlined cell. That is your ascendant.'}</p>
    {moon&&<><h3>{uk?'Місяць':'Moon'} · {moon}</h3><p>{uk?'У момент народження Місяць перебував у цьому знаку. У традиції Джйотіш з нього починають читання настрою та звичок.':'The Moon occupied this sign at birth. In Jyotish it is a starting point for reading moods and habits.'}</p></>}
    <button className={styles.primary} type="button" data-testid="natal-pilot-reading" onClick={goToReading}>{uk?'Перейти до трактування':'Explore my reading'} <span aria-hidden="true">↓</span></button>
   </div>
  </div>
 </section>;
}
