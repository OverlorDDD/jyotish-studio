'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {YOGA_PRACTICES} from '../../lib/yoga-content';
import {eventInsight} from '../../../../packages/jyotish-core/src/astro-education.ts';
import type {PortalLocale} from '../../lib/brand';
type Phase='new_moon'|'first_quarter'|'full_moon'|'last_quarter';
type Event={kind:string;atUtc:string;localDate:string};
type Events={events:Event[];timeZone:string;version:string};
const choices:Record<Phase,string>={
 new_moon:'five-senses',first_quarter:'desk-mobility',
 full_moon:'evening-unwind',last_quarter:'gentle-breath'
};
const names:Record<Phase,{uk:string;en:string}>={
 new_moon:{uk:'Молодик',en:'New Moon'},first_quarter:{uk:'Перша чверть',en:'First Quarter'},
 full_moon:{uk:'Повня',en:'Full Moon'},last_quarter:{uk:'Остання чверть',en:'Last Quarter'}
};
const keys=Object.keys(choices) as Phase[];
export default function YogaLunarGuide({locale}:{locale:PortalLocale}){
 const [events,setEvents]=useState<Event[]>([]),[state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [zone]=useState('Europe/Kyiv');
 useEffect(()=>{
  let live=true;const ctl=new AbortController();
  const f=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
  const parts=f.formatToParts(new Date());const val=(k:string)=>parts.find(x=>x.type===k)?.value||'';
  const today=val('year')+'-'+val('month')+'-'+val('day');
  const q=new URLSearchParams({start:today,days:'30',zone});
  fetch('/api/v1/astronomy/events?'+q,{signal:ctl.signal,cache:'no-store'})
   .then(async r=>{if(!r.ok)throw Error('astronomy');return await r.json() as Events;})
   .then(data=>{if(live){setEvents(data.events.filter(e=>keys.includes(e.kind as Phase)));setState('ready');}})
   .catch(()=>{if(live&&!ctl.signal.aborted)setState('error')});
  return()=>{live=false;ctl.abort()};
 },[zone]);
 const uk=locale==='uk';
 const fmt=(utc:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(utc));
 return <section className="as-wellness-section" data-testid="yoga-lunar-guide" id="lunar-practice-calendar">
  <div className="as-wellness-section-header"><span className="as-overline">GALAXIORA · MOON RHYTHM</span>
   <h2>{uk?'Практики за місячним циклом':'Practice calendar by lunar phase'}</h2></div>
  <p>{uk?'Це календар реальних фаз Місяця й необов’язкових практик для рефлексії. Фаза сама по собі не визначає фізичну витривалість, настрій чи здоров’я. Час показано для Києва.':
   'Real astronomical lunar phases paired with optional mindful practices. A Moon phase alone does not determine stamina, mood or health. Times shown for Kyiv.'}</p>
  {state==='loading'&&<p role="status">{uk?'Обчислюємо фази Місяця…':'Calculating lunar phases…'}</p>}
  {state==='error'&&<p role="alert">{uk?'Календар зараз недоступний; усі практики нижче працюють незалежно.':'Moon schedule unavailable; you can still use every practice below.'}</p>}
  {state==='ready'&&<div className="as-wellness-grid">
   {events.map(e=>{
    const key=e.kind as Phase,practice=YOGA_PRACTICES.find(p=>p.slug===choices[key]);
    if(!practice)return null;
    const info=eventInsight(key,locale);
    return <article className="as-wellness-card" key={e.kind+e.atUtc}>
     <span className="as-overline">{fmt(e.atUtc)}</span>
     <h3>{names[key][locale]}</h3>
     <p>{info.tradition}</p>
     <p>{info.practice}</p>
     <Link href={'/'+locale+'/yoga/'+practice.slug}>
      {uk?'Відкрити практику: ':'Open practice: '}{practice.title[locale]} ↗
     </Link>
    </article>;
   })}
  </div>}
 </section>;
}
