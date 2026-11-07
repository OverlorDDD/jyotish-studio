'use client';
import {useState} from 'react';
import s from './NatalSkyLayers.module.css';

type Locale='uk'|'en';
const THEMES=[
 {key:'strength',code:'D27',uk:'Сильні сторони',en:'Strengths',detailUk:'Здібності й витривалість',detailEn:'Abilities and resilience'},
 {key:'relations',code:'D9',uk:'Стосунки',en:'Relationships',detailUk:'Партнерство й цінності',detailEn:'Partnership and values'},
 {key:'career',code:'D10',uk:'Кар’єра',en:'Career',detailUk:'Праця та реалізація',detailEn:'Work and vocation'},
 {key:'growth',code:'D24',uk:'Розвиток',en:'Growth',detailUk:'Освіта й навички',detailEn:'Learning and skills'}
] as const;
type Theme=(typeof THEMES)[number]['key'];
const POINTS=[[38,70],[119,37],[206,77],[303,45],[332,142],[245,188],[177,132],[80,206],[41,292],[142,315],[280,297],[321,248]] as const;
/** Decorative layers illustrate distinct Jyotish perspectives, not actual planet positions or a tropical wheel. */
export default function NatalSkyLayers({lang}:{lang:Locale}){
 const [active,setActive]=useState<Theme>('strength');
 const uk=lang==='uk',current=THEMES.find(x=>x.key===active)!;
 const move=(e:React.PointerEvent<HTMLDivElement>)=>{
  if(e.pointerType==='touch')return;
  const r=e.currentTarget.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  e.currentTarget.style.setProperty('--sky-x',String(-y*8)+'deg');
  e.currentTarget.style.setProperty('--sky-y',String(x*8)+'deg');
 };
 const reset=(e:React.PointerEvent<HTMLDivElement>)=>{
  e.currentTarget.style.setProperty('--sky-x','0deg');
  e.currentTarget.style.setProperty('--sky-y','0deg');
 };
 return <div className={s.sky} data-testid="n41-sky" onPointerMove={move} onPointerLeave={reset}>
  <div className={s.glow} aria-hidden="true"/>
  <div className={s.stack} aria-hidden="true">
   {[0,1,2].map((level)=><div key={level} className={[s.plane,[s.back,s.middle,s.front][level],
      (level===0&&active==='career'||level===1&&(active==='relations'||active==='growth')||level===2&&active==='strength')?s.active:''].join(' ')}>
     <svg viewBox="0 0 360 360" focusable="false" aria-hidden="true">
      <path d="M38 70L119 37L206 77L303 45L332 142L245 188L177 132L80 206L41 292L142 315L280 297L321 248L245 188M80 206L177 132L142 315M119 37L177 132L245 188M206 77L245 188L280 297" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".73"/>
      <path d="M38 70L41 292L142 315L321 248L332 142L303 45Z" fill="none" stroke="currentColor" strokeDasharray="3 8" opacity=".3"/>
      {POINTS.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?3.7:2.7} fill={i%4===0?'#f9d5a0':'#e2edff'}/>)}
     </svg>
     <span className={s.layerLabel}>{['D1 · RASHI','D9 · NAVAMSHA','D27 · BHAMSHA'][level]}</span>
    </div>)}
   <span className={s.star}>✦</span>
  </div>
  <div className={s.current} aria-live="polite"><b>{current.code}</b><span><strong>{uk?current.uk:current.en}</strong><small>{uk?current.detailUk:current.detailEn}</small></span></div>
  <div className={s.controls} role="group" aria-label={uk?'Теми небесної схеми':'Sky diagram themes'}>
   {THEMES.map(x=><button type="button" key={x.key} aria-pressed={active===x.key}
     className={active===x.key?s.picked:s.choice} onClick={()=>setActive(x.key)}>{uk?x.uk:x.en}</button>)}
  </div>
  <small className={s.note}>{uk?'Ілюстрація принципу 16 карт · не особистий розрахунок':'16-chart concept illustration · not your calculated chart'}</small>
 </div>;
}
