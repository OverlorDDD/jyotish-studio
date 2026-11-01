import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import {TAROT_GUIDES} from '../../../../lib/tarot-guides';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../../lib/brand';
import {indexRobots,publicSiteOrigin,publicIndexingEnabled} from '../../../../lib/site-indexing';

type Props={params:Promise<{locale:string}>};
const META={
 uk:{title:'Значення карт Таро — прямі й перевернуті | Galaxiora',description:'Авторський довідник Старших Арканів Таро: образи карт, прямі й перевернуті значення, приклади розкладів та запитання для роздумів.',heading:'Значення карт Таро: бібліотека Старших Арканів',lead:'Карта не існує окремо від запитання. Вивчай символи, порівнюй пряме та перевернуте положення, а потім дивись, як аркан працює в цілому розкладі.',read:'Дослідити карту',play:'Спробувати розклад GalaxiTarot',learn:'Як працюють перевернуті карти',method:'Чому контекст має значення',home:'Головна',tarot:'Таро'},
 en:{title:'Tarot Card Meanings — Upright and Reversed | Galaxiora',description:'Original Major Arcana Tarot guide: card symbols, upright and reversed meanings, spread context and questions for reflection.',heading:'Tarot card meanings: the Major Arcana library',lead:'A card never stands apart from its question. Explore its symbols, compare upright and reversed meanings, then see how it fits the entire spread.',read:'Explore this card',play:'Try a GalaxiTarot reading',learn:'How reversed cards work',method:'Why context matters',home:'Home',tarot:'Tarot'}
} as const;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isPortalLocale(locale))return {};
 const t=META[locale],url='/'+locale+'/tarot/cards';
 return {title:t.title,description:t.description,robots:indexRobots(),
  alternates:{canonical:url,languages:{uk:'/uk/tarot/cards',en:'/en/tarot/cards','x-default':'/en/tarot/cards'}},
  openGraph:{type:'website',siteName:'Galaxiora',title:t.title,description:t.description,url,locale:locale==='uk'?'uk_UA':'en_US'}};
}
export default async function TarotGuideHub({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const t=META[locale],loc=locale as PortalLocale,base=publicSiteOrigin();
 const breadcrumb=publicIndexingEnabled()&&base?JSON.stringify({
  '@context':'https://schema.org','@type':'BreadcrumbList',
  itemListElement:[
   {'@type':'ListItem',position:1,name:t.home,item:base+'/'+locale},
   {'@type':'ListItem',position:2,name:t.tarot,item:base+'/'+locale+'/tarot'},
   {'@type':'ListItem',position:3,name:t.heading,item:base+'/'+locale+'/tarot/cards'}
  ]
 }).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={loc} active="tarot" languagePath="tarot/cards">
  {breadcrumb&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:breadcrumb}}/>}
  <div className="as-wellness as-academy-detail">
   <nav aria-label={loc==='uk'?'Навігація':'Breadcrumb'}><Link href={'/'+loc}>{t.home}</Link> / <Link href={'/'+loc+'/tarot'}>{t.tarot}</Link> / {t.heading}</nav>
   <header className="as-wellness-detail-head" style={{marginTop:30}}>
    <span className="as-overline">GALAXIORA · GALAXITAROT · MAJOR ARCANA</span>
    <h1>{t.heading}</h1><p>{t.lead}</p>
   </header>
   <section className="as-wellness-grid" aria-label={t.heading}>
    {TAROT_GUIDES.map(card=><article className="as-wellness-card as-lesson-card" key={card.slug}>
     <span className="as-overline">MAJOR ARCANA</span>
     <h2 style={{margin:'0 0 10px',fontSize:'clamp(24px,2.4vw,30px)'}}>
      <Link href={'/'+loc+'/tarot/cards/'+card.slug}>{card.title[loc]}</Link>
     </h2>
     <p>{card.summary[loc]}</p>
     <Link className="as-wellness-card-link" href={'/'+loc+'/tarot/cards/'+card.slug}>{t.read} →</Link>
    </article>)}
   </section>
   <section className="as-lesson-section" style={{marginTop:32}}>
    <h2>{t.method}</h2>
    <p>{loc==='uk'?'Бібліотеку розпочато з восьми карт, для яких підготовлено окремі змістовні пояснення. Решта карт доступна в інтерактивному розкладі; ми додаватимемо гіди поступово після редакційної перевірки, а не створюватимемо шаблонні сторінки.':'This library begins with eight cards that have individually developed interpretations. All 78 cards are available in the interactive reading; additional guides will be published after editorial review instead of generating thin templates.'}</p>
    <p><Link href={'/'+loc+'/learn/tarot-reversals'}>{t.learn}</Link></p>
    <p><Link href={'/'+loc+'/tarot'}>{t.play}</Link></p>
   </section>
  </div>
 </PortalShell>;
}
