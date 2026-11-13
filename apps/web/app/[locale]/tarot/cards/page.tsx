import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import TarotLibraryGrid from '../../../components/tarot/TarotLibraryGrid';
import styles from './TarotCards.module.css';
import hubStyles from '../../../components/tarot/TarotHub.module.css';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../../lib/brand';
import {indexRobots,publicSiteOrigin,publicIndexingEnabled} from '../../../../lib/site-indexing';

type Props={params:Promise<{locale:string}>};
const META={
 uk:{title:'Значення карт Таро — усі 78 карт: пряме й перевернуте | Galaxiora',description:'Значення всіх 78 карт Таро Райдера–Вейта: Старші Аркани, Жезли, Кубки, Мечі й Пентаклі. Пряме й перевернуте значення, кохання, робота, так чи ні.',
  home:'Головна',tarot:'Таро',heading:'Значення карт Таро',lead:'Довідник усіх 78 карт класичної колоди Райдера–Вейта: ключові слова, пряме й перевернуте значення, кохання, робота і відповідь «так чи ні». Оберіть масть і відкрийте карту.',
  method:'Як користуватися довідником',learn:'Урок про перевернуті карти',play:'Витягнути карту дня або зробити розклад'},
 en:{title:'Tarot Card Meanings — All 78 Cards, Upright and Reversed | Galaxiora',description:'Meanings of all 78 Rider–Waite Tarot cards: Major Arcana, Wands, Cups, Swords and Pentacles. Upright and reversed, love, work, yes or no.',
  home:'Home',tarot:'Tarot',heading:'Tarot card meanings',lead:'A guide to all 78 cards of the classic Rider–Waite deck: keywords, upright and reversed meanings, love, work and a yes-or-no answer. Choose a suit and open a card.',
  method:'How to use this guide',learn:'Learn about reversals',play:'Draw a card of the day or do a reading'}
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
  <div className={styles.page}>
   <nav className={styles.crumbs} aria-label={loc==='uk'?'Навігація':'Breadcrumb'}><Link href={'/'+loc}>{t.home}</Link> / <Link href={'/'+loc+'/tarot'}>{t.tarot}</Link> / {t.heading}</nav>
   <header className={styles.hub}>
    <span className={styles.eyebrow}>GALAXIORA · GALAXITAROT</span>
    <h1>{t.heading}</h1><p>{t.lead}</p>
   </header>
   <div className={hubStyles.page} style={{width:'100%',margin:0}}><TarotLibraryGrid locale={loc} heading={false}/></div>
   <section className={styles.section}>
    <h2>{t.method}</h2>
    <p>{loc==='uk'?'Кожна карта має пряме й перевернуте значення. Перевернута карта не обов’язково погана: її енергія слабша, із затримкою або спрямована всередину. Значення завжди читайте разом із питанням і позицією карти в розкладі.':
     'Every card has an upright and a reversed meaning. A reversed card is not necessarily bad: its energy is weaker, delayed or turned inward. Always read a meaning together with the question and the card’s position in the spread.'}</p>
    <p style={{marginTop:10}}><Link href={'/'+loc+'/pedia/tarot-reversals'}>{t.learn}</Link> · <Link href={'/'+loc+'/tarot'}>{t.play}</Link></p>
   </section>
  </div>
 </PortalShell>;
}
