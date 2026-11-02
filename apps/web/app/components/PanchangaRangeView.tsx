'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import styles from './PanchangaHub.module.css';

type Observer={date:string;timeZone:string;latitude:string;longitude:string};
type Day={date:string;sunrise:{tithi:{number:number;paksha:string;numberWithinPaksha:number};nakshatra:{number:number;name:string};vara:{name:string};yoga:{name:string};karana:{name:string}}};
type Range={days:Day[]};
export default function PanchangaRangeView({locale,view,point,onPick}:{
 locale:PortalLocale;view:'week'|'month';point:Observer;onPick:(date:string)=>void;
}){
 const uk=locale==='uk';
 const start=view==='month'?point.date.slice(0,7)+'-01':point.date;
 const count=view==='month'?new Date(Date.UTC(Number(start.slice(0,4)),Number(start.slice(5,7)),0)).getUTCDate():7;
 const [data,setData]=useState<Range|null>(null),[state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const ctl=new AbortController();let alive=true;setState('loading');setData(null);
  const params=new URLSearchParams({start,days:String(count),zone:point.timeZone,latitude:point.latitude,longitude:point.longitude});
  fetch('/api/v1/panchanga/range?'+params,{cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error(String(r.status));return await r.json() as Range})
   .then(result=>{if(alive){setData(result);setState('ready')} })
   .catch(()=>{if(alive&&!ctl.signal.aborted)setState('error')});
  return()=>{alive=false;ctl.abort()};
 },[start,count,point.timeZone,point.latitude,point.longitude,retry]);
 const tithi=(d:Day)=>(uk?(d.sunrise.tithi.paksha==='Shukla'?'Шукла':'Крішна'):d.sunrise.tithi.paksha)+' '+d.sunrise.tithi.numberWithinPaksha;
 const label=(d:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
 const offset=(new Date(start+'T12:00:00Z').getUTCDay()+6)%7;
 return <section data-testid="panchanga-calendar-range">
  <h2>{view==='week'?(uk?'Сім днів':'Seven days'):(uk?'Календар місяця':'Monthly calendar')}</h2>
  <p className={styles.rangeNote}>{uk?'Показники наведено на місцевому сході Сонця. Обери день для точних переходів.':'All five limbs are shown at local sunrise. Select a day to view exact transitions.'} {point.timeZone}</p>
  {state==='loading'&&<p role="status">{uk?'Розраховуємо…':'Calculating…'}</p>}
  {state==='error'&&<p role="alert">{uk?'Календар недоступний.':'Calendar is temporarily unavailable.'}
   <button type="button" onClick={()=>setRetry(i=>i+1)}>{uk?'Повторити':'Retry'}</button></p>}
  {data&&state==='ready'&&(view==='week'?
   <div className={styles.rangeDays}>{data.days.map(d=><button key={d.date} type="button" className={styles.rangeDay} onClick={()=>onPick(d.date)}>
    <strong>{label(d.date)}</strong>
    <span>{uk?'Тітхі':'Tithi'}: {tithi(d)}</span>
    <span>{uk?'Накшатра':'Nakshatra'}: {d.sunrise.nakshatra.name}</span>
    <span>{uk?'Вара':'Vara'}: {d.sunrise.vara.name}</span>
    <span>{uk?'Йога':'Yoga'}: {d.sunrise.yoga.name}</span>
    <span>{uk?'Карана':'Karana'}: {d.sunrise.karana.name}</span>
   </button>)}</div>:
   <div className={styles.monthGrid} role="group" aria-label={uk?'Дні календаря':'Calendar days'}>
    {(uk?['Пн','Вт','Ср','Чт','Пт','Сб','Нд']:['Mo','Tu','We','Th','Fr','Sa','Su']).map(x=><span className={styles.weekLabel} key={x}>{x}</span>)}
    {Array.from({length:offset},(_,i)=><span aria-hidden="true" key={i}/>)}
    {data.days.map(d=><button key={d.date} type="button" className={styles.monthDay}
     aria-label={label(d.date)+' · '+tithi(d)+' · '+d.sunrise.nakshatra.name}
     onClick={()=>onPick(d.date)}><strong>{Number(d.date.slice(-2))}</strong><small>{tithi(d)}</small><small>{d.sunrise.nakshatra.name}</small></button>)}
   </div>)}
 </section>;
}
