'use client';
import {useEffect,useId,useState,type KeyboardEvent} from 'react';

type City={id:string;name:string;region:string;country:string;latitude:number;longitude:number;timeZone:string};

export default function CitySearch({locale,onChoose,resetToken,selectedPlace,onClear}:{locale:'uk'|'en';onChoose:(city:City)=>void;resetToken?:number;selectedPlace?:string;onClear?:()=>void}){
 const [query,setQuery]=useState('');
 const [cities,setCities]=useState<City[]>([]);
 const [state,setState]=useState<'idle'|'loading'|'error'|'ready'>('idle');
 const [selected,setSelected]=useState(false);
 const [activeIndex,setActiveIndex]=useState(-1);
 const listId='global-city-results-'+useId().replace(/:/g,'');
 const expanded=state==='ready'&&cities.length>0;
 const uk=locale==='uk';

 useEffect(()=>{if(!selectedPlace)return;setQuery(selectedPlace);setSelected(true);setCities([]);setActiveIndex(-1);setState('idle')},[selectedPlace]);
 useEffect(()=>{if(resetToken===undefined)return;setQuery('');setCities([]);setActiveIndex(-1);setState('idle');setSelected(false)},[resetToken]);
 useEffect(()=>{
  setActiveIndex(-1);
  if(selected||query.trim().length<2){setCities([]);setState('idle');return;}
  let live=true;
  const ctl=new AbortController();
  const timeout=setTimeout(()=>{
   setState('loading');
   fetch('/api/v1/panchanga/cities?'+new URLSearchParams({q:query.trim(),lang:locale}),
    {signal:ctl.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw Error(String(r.status));return r.json() as Promise<{items:City[]}>})
    .then(data=>{if(live){setCities(data.items);setState('ready');}})
    .catch(()=>{if(live&&!ctl.signal.aborted)setState('error');});
  },380);
  return()=>{live=false;clearTimeout(timeout);ctl.abort();};
 },[query,locale,selected]);

 function choose(city:City){
  setSelected(true);
  setQuery([city.name,city.region,city.country].filter(Boolean).join(', '));
  setCities([]);
  setActiveIndex(-1);
  setState('idle');
  onChoose(city);
 }
 function onKeyDown(e:KeyboardEvent<HTMLInputElement>){
  if(e.key==='Escape'&&expanded){e.preventDefault();setCities([]);setActiveIndex(-1);setState('idle');return;}
  if(!expanded)return;
  if(e.key==='ArrowDown'){e.preventDefault();setActiveIndex(i=>(i+1)%cities.length);}
  else if(e.key==='ArrowUp'){e.preventDefault();setActiveIndex(i=>i<=0?cities.length-1:i-1);}
  else if(e.key==='Enter'&&activeIndex>=0&&cities[activeIndex]){e.preventDefault();choose(cities[activeIndex]);}
 }
 return <div className="gp-global-city-search" data-testid="global-city-search">
  <label htmlFor="global-city-input">{uk?'Пошук міста у світі':'Search any city worldwide'}</label>
  <input id="global-city-input" autoComplete="off" type="search" role="combobox"
   value={query} placeholder={uk?'Введи назву, наприклад Кременчук, Tokyo…':'Search city: London, Tokyo, Mumbai…'}
   onChange={e=>{setSelected(false);setActiveIndex(-1);setQuery(e.target.value);onClear?.();}}
   onKeyDown={onKeyDown}
   aria-autocomplete="list" aria-expanded={expanded}
   aria-controls={expanded?listId:undefined}
   aria-activedescendant={expanded&&activeIndex>=0?listId+'-option-'+activeIndex:undefined}/>
  {state==='loading'&&<small role="status">{uk?'Шукаємо населені пункти…':'Searching cities…'}</small>}
  {state==='error'&&<small role="alert">{uk?'Пошук недоступний: можна ввести координати вручну.':'Search unavailable; manual coordinates are still available.'}</small>}
  {state==='ready'&&cities.length===0&&<small role="status">{uk?'Нічого не знайдено. Спробуй іншу назву.':'No matches; try another name.'}</small>}
  {expanded&&<div id={listId} role="listbox" aria-label={uk?'Результати пошуку міст':'City search results'}
   style={{display:'grid',gap:4,marginTop:6,maxHeight:260,overflowY:'auto'}}>
   {cities.map((c,i)=><div key={c.id} id={listId+'-option-'+i} role="option" aria-selected={activeIndex===i}
    style={{textAlign:'left',padding:'8px 12px',borderRadius:8,border:'1px solid '+(activeIndex===i?'#d8bc86':'#526780'),background:activeIndex===i?'#273b55':'#1a2e49',color:'#fff',cursor:'pointer'}}
    onMouseEnter={()=>setActiveIndex(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(c)}>
     <strong>{c.name}</strong> <small>{[c.region,c.country].filter(Boolean).join(', ')} · {c.timeZone}</small>
    </div>)}
  </div>}
 </div>;
}
