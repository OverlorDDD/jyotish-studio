'use client';
import {useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import AstronomicalEventsPanel from './AstronomicalEventsPanel';
import PersonalPanchanga from './PersonalPanchanga';
import type {SourcePoint} from '../../lib/panchanga-integration';
import styles from './PanchangaHub.module.css';

type Panel='personal'|'sky';
export default function PanchangaRelatedPanels({locale,point}:{locale:PortalLocale;point:SourcePoint}){
 const uk=locale==='uk';
 const [selected,setSelected]=useState<Panel|null>(null);
 const sections:Record<Panel,{name:string;hint:string}>={
  personal:{name:uk?'Мій місячний ритм':'My lunar rhythm',
   hint:uk?'Порівняння Місяця з вашою натальною картою':'Moon position compared with your birth chart'},
  sky:{name:uk?'Переходи планет':'Planetary transitions',
   hint:uk?'Точні входження у знаки, ретроградність та фази':'Exact ingresses, stations and lunar phases'}
 };
 return <section className={styles.related} data-testid="panchanga-related">
  <header><h2>{uk?'Додаткові розрахунки':'More calculations'}</h2>
   <p>{uk?'Обери додатковий аналіз натальної карти чи руху планет.':
    'Choose natal chart comparisons or planetary movements.'}</p></header>
  <div className={styles.relatedNav} role="group"
   aria-label={uk?'Додаткові розділи Панчанги':'Additional Panchanga modules'}>
   {(['personal','sky'] as const).map(id=><button key={id} type="button"
    aria-pressed={selected===id} aria-controls={'panchanga-extra-'+id}
    onClick={()=>setSelected(cur=>cur===id?null:id)}>
    <strong>{sections[id].name}</strong><span>{sections[id].hint}</span>
   </button>)}
  </div>
  {selected&&<div id={'panchanga-extra-'+selected} className={styles.relatedContent}
   data-testid={'panchanga-related-'+selected}>
   {selected==='personal'&&<PersonalPanchanga locale={locale} point={point}/>}
   {selected==='sky'&&<AstronomicalEventsPanel locale={locale} start={point.date} zone={point.timeZone}/>}
  </div>}
  <p className={styles.relatedFootnote}>{uk?'Дивіться також':'See also'}: <Link href={'/'+locale+'/eclipses/2027'}>
   {uk?'Календар усіх затемнень 2027 року':'All eclipses in 2027'}</Link>.
  </p>
 </section>;
}
