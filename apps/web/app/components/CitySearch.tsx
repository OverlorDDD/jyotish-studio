'use client';
import {useEffect,useState} from 'react';
type City={id:string;name:string;region:string;country:string;latitude:number;longitude:number;timeZone:string};
export default function CitySearch({locale,onChoose}:{locale:'uk'|'en';onChoose:(city:City)=>void}){
 const [query,setQuery]=useState(''),[cities,setCities]=useState<City[]>([]);
 const [state,setState]=useState<'idle'|'loading'|'error'|'ready'>('idle');
 useEffect(()=>{
  if(query.trim().length<2){setCities([]);setState('idle');return;}
  let live=true;const ctl=new AbortController();
  const timeout=setTimeout(()=>{
   setState('loading');
   fetch('/api/v1/panchanga/cities?'+new URLSearchParams({q:query.trim(),lang:locale}),
    {signal:ctl.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw Error(String(r.status));return r.json() as Promise<{items:City[]}>})
    .then(data=>{if(live){setCities(data.items);setState('ready');}})
    .catch(()=>{if(live&&!ctl.signal.aborted)setState('error');});
  },380);
  return()=>{live=false;clearTimeout(timeout);ctl.abort()};
 },[query,locale]);
 const uk=locale==='uk';
 return <div className="gp-global-city-search" data-testid="global-city-search">
  <label htmlFor="global-city-input">{uk?'Пошук міста у світі':'Search any city worldwide'}</label>
  <input id="global-city-input" autoComplete="off" type="search" value={query}
   placeholder={uk?'Введи назву, наприклад Кременчук, Tokyo…':'Search city: London, Tokyo, Mumbai…'}
   onChange={e=>setQuery(e.target.value)} aria-controls="global-city-results"/>
  {state==='loading'&&<small role="status">{uk?'Шукаємо населені пункти…':'Searching cities…'}</small>}
  {state==='error'&&<small role="alert">{uk?'Пошук недоступний: можна ввести координати вручну.':'Search unavailable; manual coordinates are still available.'}</small>}
  {state==='ready'&&<div id="global-city-results" role="listbox" aria-label={uk?'Результати пошуку міст':'City search results'}
   style={{display:'grid',gap:4,marginTop:6,maxHeight:260,overflowY:'auto'}}>
   {cities.length===0?<small>{uk?'Нічого не знайдено. Спробуй іншу назву.':'No matches; try another name.'}</small>:
    cities.map(c=><button type="button" role="option" aria-selected="false" key={c.id}
     style={{textAlign:'left',padding:'8px 12px',borderRadius:8,border:'1px solid #526780',background:'#1a2e49',color:'#fff'}}
     onClick={()=>{onChoose(c);setQuery([c.name,c.region,c.country].filter(Boolean).join(', '));setCities([]);setState('idle')}}>
      <strong>{c.name}</strong> <small>{[c.region,c.country].filter(Boolean).join(', ')} · {c.timeZone}</small>
    </button>)}
  </div>}
  <small style={{display:'block',marginTop:7,opacity:.8}}>
   {uk?'Після вибору координати й часовий пояс підставляться разом. Дані: Open-Meteo Geocoding (GeoNames).':
   'Selecting a city fills location and timezone together. Data: Open-Meteo Geocoding (GeoNames).'}
  </small>
 </div>;
}
