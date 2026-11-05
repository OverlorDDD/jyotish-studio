import Link from 'next/link';
import {ORGANIC_INTENTS,type OrganicKind,type OrganicLocale} from '../../lib/organic-intents';
import styles from './OrganicIntentBridge.module.css';

export default function OrganicIntentBridge({kind,locale}:{kind:OrganicKind;locale:OrganicLocale}){
 const topic=ORGANIC_INTENTS.find(entry=>entry.id===kind);
 if(!topic)return null;
 return <section className={styles.section} data-testid={'g32-organic-'+kind}
  aria-labelledby={'g32-organic-heading-'+kind}>
  <span className={styles.eyebrow}>{locale==='uk'?'РОЗРАХУНОК І ПОЯСНЕННЯ':'CALCULATE & UNDERSTAND'}</span>
  <h2 className={styles.title} id={'g32-organic-heading-'+kind}>{topic.heading[locale]}</h2>
  <p className={styles.lead}>{topic.intro[locale]}</p>
  <ol className={styles.steps}>{topic.steps.map((step,index)=>
   <li className={styles.step} key={index}>
    <span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
    {step[locale]}
   </li>
  )}</ol>
  <nav className={styles.resources} aria-label={locale==='uk'?'Корисні матеріали GalaxiPedia':'Related learning guides'}>
   {topic.guides.map(guide=><Link key={guide.path} className={styles.resource} href={'/'+locale+'/'+guide.path}>
    {guide.label[locale]} <span className={styles.arrow} aria-hidden="true">↗</span>
   </Link>)}
  </nav>
 </section>;
}
