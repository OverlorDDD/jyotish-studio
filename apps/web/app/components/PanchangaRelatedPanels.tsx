'use client';
import {useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import AstronomicalEventsPanel from './AstronomicalEventsPanel';
import PersonalPanchanga from './PersonalPanchanga';
import EclipsePanel from './EclipsePanel';
import type {SourcePoint} from '../../lib/panchanga-integration';
import styles from './PanchangaHub.module.css';

type Panel='personal'|'sky'|'eclipses';
export default function PanchangaRelatedPanels({locale,point}:{locale:PortalLocale;point:SourcePoint}){
 const uk=locale==='uk';
 const [selected,setSelected]=useState<Panel|null>(null);
 const sections:Record<Panel,{name:string;hint:string}>={
  personal:{name:uk?'Тарабала й Чандрабала':'Tarabala & Chandrabala',
   hint:uk?'Тарабала та Чандрабала за натальною картою':'Tarabala and Chandrabala from your natal chart'},
  sky:{name:uk?'Переходи планет':'Planetary transitions',
   hint:uk?'Точні входження у знаки, ретроградність та фази':'Exact ingresses, stations and lunar phases'},
  eclipses:{name:uk?'Видимість затемнень':'Eclipse visibility',
   hint:uk?'Локальна видимість за координатами спостерігача':'Local visibility for selected coordinates'}
 };
 return <section className={styles.related} data-testid="panchanga-related">
  <header><h2>{uk?'Додаткові розрахунки':'More calculations'}</h2>
   <p>{uk?'Обери розрахунок: персональні показники, планети або затемнення.':
    'Choose natal indicators, planetary events or eclipses.'}</p></header>
  <div className={styles.relatedNav} role="group"
   aria-label={uk?'Додаткові розділи Панчанги':'Additional Panchanga modules'}>
   {(['personal','sky','eclipses'] as const).map(id=><button key={id} type="button"
    aria-pressed={selected===id} aria-controls={'panchanga-extra-'+id}
    onClick={()=>setSelected(cur=>cur===id?null:id)}>
    <strong>{sections[id].name}</strong><span>{sections[id].hint}</span>
   </button>)}
  </div>
  {selected&&<div id={'panchanga-extra-'+selected} className={styles.relatedContent}
   data-testid={'panchanga-related-'+selected}>
   {selected==='personal'&&<PersonalPanchanga locale={locale} point={point}/>}
   {selected==='sky'&&<AstronomicalEventsPanel locale={locale} start={point.date} zone={point.timeZone}/>}
   {selected==='eclipses'&&<EclipsePanel locale={locale} point={point}/>}
  </div>}
  <p className={styles.relatedFootnote}>{uk?'Дивіться також':'See also'}: <Link href={'/'+locale+'/eclipses/2027'}>
   {uk?'Календар усіх затемнень 2027 року':'All eclipses in 2027'}</Link>.
  </p>
 </section>;
}
