import Link from 'next/link';
import {ORGANIC_INTENTS,type OrganicKind,type OrganicLocale} from '../../lib/organic-intents';

export default function OrganicIntentBridge({kind,locale}:{kind:OrganicKind;locale:OrganicLocale}){
 const topic=ORGANIC_INTENTS.find(entry=>entry.id===kind);
 if(!topic)return null;
 return <section className="as-wellness as-lesson-section" data-testid={'g32-organic-'+kind}
  aria-labelledby={'g32-organic-heading-'+kind}
  style={{margin:'24px 0',padding:'clamp(16px,3vw,28px)',borderRadius:16}}>
  <span className="as-overline">GALAXIORA · {locale==='uk'?'РОЗРАХУНОК І ПОЯСНЕННЯ':'CALCULATE & UNDERSTAND'}</span>
  <h2 id={'g32-organic-heading-'+kind}>{topic.heading[locale]}</h2>
  <p>{topic.intro[locale]}</p>
  <ol>{topic.steps.map((step,index)=><li key={index}>{step[locale]}</li>)}</ol>
  <nav aria-label={locale==='uk'?'Корисні матеріали GalaxiPedia':'Related learning guides'}
    style={{display:'flex',flexWrap:'wrap',gap:12,marginTop:14}}>
   {topic.guides.map(guide=><Link key={guide.path} href={'/'+locale+'/'+guide.path}>{guide.label[locale]} ↗</Link>)}
  </nav>
 </section>;
}
