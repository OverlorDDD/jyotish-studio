import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../../components/PortalShell';
import ShareTools from '../../../../components/ShareTools';
import {TAROT_GUIDES,tarotGuideBySlug} from '../../../../../lib/tarot-guides';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../../../lib/brand';
import {articleStructuredData} from '../../../../../lib/seo-structured';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../../../lib/site-indexing';
export const dynamicParams=false;
type Props={params:Promise<{locale:string;slug:string}>};
export function generateStaticParams(){return BRAND.locales.flatMap(locale=>TAROT_GUIDES.map(card=>({locale,slug:card.slug})));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,slug}=await params,card=tarotGuideBySlug(slug);
 if(!isPortalLocale(locale)||!card)return {robots:{index:false,follow:false}};
 const title=locale==='uk'?'Таро '+card.title.uk+': пряме й перевернуте значення':'Tarot '+card.title.en+': Upright and Reversed Meaning';
 const description=card.summary[locale]+' '+(locale==='uk'?'Символи, тлумачення в розкладі та запитання для практики.':'Symbols, spread context and a reflective question.');
 const url='/'+locale+'/tarot/cards/'+slug;
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical:url,languages:{en:'/en/tarot/cards/'+slug,uk:'/uk/tarot/cards/'+slug,'x-default':'/en/tarot/cards/'+slug}},
  openGraph:{type:'article',siteName:'Galaxiora',title,description,url,locale:locale==='uk'?'uk_UA':'en_US'}};
}
export default async function TarotCardGuide({params}:Props){
 const {locale,slug}=await params,card=tarotGuideBySlug(slug);
 if(!isPortalLocale(locale)||!card)notFound();
 const loc=locale as PortalLocale,url='/'+locale+'/tarot/cards/'+slug;
 const index=TAROT_GUIDES.findIndex(x=>x.slug===slug),prev=TAROT_GUIDES[(index+TAROT_GUIDES.length-1)%TAROT_GUIDES.length],next=TAROT_GUIDES[(index+1)%TAROT_GUIDES.length];
 const uk=loc==='uk',base=publicSiteOrigin();
 const heading=(uk?'Таро ':'Tarot ')+card.title[loc]+(uk?': значення карти':': card meaning');
 const json=articleStructuredData({locale:loc,path:url,title:heading,description:card.summary[loc]});
 const crumbs=publicIndexingEnabled()&&base?JSON.stringify({
  '@context':'https://schema.org','@type':'BreadcrumbList',
  itemListElement:[
   {'@type':'ListItem',position:1,name:uk?'Головна':'Home',item:base+'/'+loc},
   {'@type':'ListItem',position:2,name:uk?'Таро':'Tarot',item:base+'/'+loc+'/tarot'},
   {'@type':'ListItem',position:3,name:uk?'Значення карт':'Card meanings',item:base+'/'+loc+'/tarot/cards'},
   {'@type':'ListItem',position:4,name:card.title[loc],item:base+url}
  ]
 }).replace(/</g,'\\u003c'):null;
 const sections=[
  {heading:uk?'Символіка карти':'Card symbolism',text:card.symbolism[loc]},
  {heading:uk?'Пряме положення':'Upright meaning',text:card.upright[loc]},
  {heading:uk?'Перевернуте положення':'Reversed meaning',text:card.reversed[loc]},
  {heading:uk?'У контексті розкладу':'In a Tarot spread',text:card.inSpread[loc]}
 ];
 return <PortalShell locale={loc} active="tarot" languagePath={'tarot/cards/'+slug}>
  {json&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:json}}/>}
  {crumbs&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:crumbs}}/>}
  <article className="as-wellness as-academy-detail" data-testid="tarot-card-guide">
   <ShareTools locale={loc} title={heading} path={url}/>

   <nav aria-label={uk?'Навігація':'Breadcrumb'}><Link href={'/'+loc+'/tarot'}>{uk?'Таро':'Tarot'}</Link> / <Link href={'/'+loc+'/tarot/cards'}>{uk?'Значення карт':'Card meanings'}</Link> / {card.title[loc]}</nav>
   <header className="as-wellness-detail-head" style={{marginTop:30}}>
    <span className="as-overline">GALAXIORA · MAJOR ARCANA</span>
    <h1>{heading}</h1><p>{card.summary[loc]}</p>
   </header>
   <div className="as-lesson-sections">{sections.map(section=><section className="as-lesson-section" key={section.heading}>
    <h2>{section.heading}</h2><p>{section.text}</p>
   </section>)}</div>
   <aside className="as-lesson-takeaways">
    <h2>{uk?'Запитання для власного розкладу':'A question for your reading'}</h2>
    <p>{card.reflection[loc]}</p>
   </aside>
   <section className="as-lesson-section">
    <h2>{uk?'Перевір значення на практиці':'Explore the card in practice'}</h2>
    <p>{uk?'У GalaxiTarot доступні розклади на одну, три або десять карт. Значення цього аркана залежить від запитання, позиції, прямого чи перевернутого положення та сусідніх карт. Одна карта не визначає долю й не підтверджує чужих намірів.':'GalaxiTarot offers one-card, three-card and ten-card readings. An Arcana meaning depends on the question, position, orientation and surrounding cards. A single card neither determines a future outcome nor proves what someone else intends.'}</p>
    <p><Link href={'/'+loc+'/tarot'}>{uk?'Спробувати розклад':'Try a Tarot reading'}</Link></p>
    <p><Link href={'/'+loc+'/pedia/tarot-reversals'}>{uk?'Урок про перевернуті карти':'Learn about reversals'}</Link></p>
   </section>
   <nav className="as-wellness-next" aria-label={uk?'Інші карти':'Other cards'}>
    <Link href={'/'+loc+'/tarot/cards/'+prev.slug}>← {prev.title[loc]}</Link>
    <Link href={'/'+loc+'/tarot/cards/'+next.slug}>{next.title[loc]} →</Link>
   </nav>
  </article>
 </PortalShell>;
}
