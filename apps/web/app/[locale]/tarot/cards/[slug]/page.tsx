import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../../components/PortalShell';
import ShareTools from '../../../../components/ShareTools';
import {TarotFace} from '../../../../components/tarot/TarotArt';
import {tarotGuideBySlug} from '../../../../../lib/tarot-guides';
import {aspectText,TAROT_GROUPS,TAROT_LIBRARY,tarotCardBySlug,YES_NO} from '../../../../../lib/tarot-meanings';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../../../lib/brand';
import {articleStructuredData} from '../../../../../lib/seo-structured';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../../../lib/site-indexing';
import styles from '../TarotCards.module.css';

export const dynamicParams=false;
type Props={params:Promise<{locale:string;slug:string}>};
export function generateStaticParams(){return BRAND.locales.flatMap(locale=>TAROT_LIBRARY.map(card=>({locale,slug:card.slug})));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,slug}=await params,card=tarotCardBySlug(slug);
 if(!isPortalLocale(locale)||!card)return {robots:{index:false,follow:false}};
 const uk=locale==='uk',name=card.name[locale],t=card[locale];
 const title=uk?name+' — значення карти Таро: пряме, перевернуте, у коханні':name+' Tarot Card Meaning: Upright, Reversed, Love';
 const description=(uk?name+': '+t.k.join(', ')+'. ':name+': '+t.k.join(', ')+'. ')+t.u.split('. ')[0]+'. '+
  (uk?'Перевернуте значення, кохання, робота, так чи ні.':'Reversed meaning, love, work, yes or no.');
 const url='/'+locale+'/tarot/cards/'+slug;
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical:url,languages:{en:'/en/tarot/cards/'+slug,uk:'/uk/tarot/cards/'+slug,'x-default':'/en/tarot/cards/'+slug}},
  openGraph:{type:'article',siteName:'Galaxiora',title,description,url,locale:uk?'uk_UA':'en_US'}};
}
export default async function TarotCardPage({params}:Props){
 const {locale,slug}=await params,card=tarotCardBySlug(slug);
 if(!isPortalLocale(locale)||!card)notFound();
 const loc=locale as PortalLocale,uk=loc==='uk',name=card.name[loc],t=card[loc],guide=tarotGuideBySlug(slug);
 const url='/'+loc+'/tarot/cards/'+slug,base=publicSiteOrigin();
 const index=TAROT_LIBRARY.findIndex(x=>x.slug===slug);
 const prev=TAROT_LIBRARY[(index+TAROT_LIBRARY.length-1)%TAROT_LIBRARY.length],next=TAROT_LIBRARY[(index+1)%TAROT_LIBRARY.length];
 const group=TAROT_GROUPS.find(g=>g.id===card.group)!;
 const heading=uk?name+': значення карти Таро':name+' Tarot Card Meaning';
 const yes=YES_NO[card.yesNo][loc];
 const yesText=uk?(card.yesNo==='yes'?'Схиляється до «так»: карта підтримує задум, особливо у прямому положенні. Перевернута — «так, але пізніше» або з умовами.'
   :card.yesNo==='no'?'Схиляється до «ні» або «не зараз»: карта радить зупинитися й переглянути план. Перевернута може пом’якшувати це застереження.'
   :'Відповідь «можливо»: усе залежить від ваших дій і обставин. Уточніть питання або подивіться на сусідні карти.')
  :(card.yesNo==='yes'?'Leans to “yes”: the card supports the plan, especially upright. Reversed, it means “yes, but later” or with conditions.'
   :card.yesNo==='no'?'Leans to “no” or “not now”: the card advises pausing and reviewing the plan. Reversed, it may soften the warning.'
   :'The answer is “maybe”: it depends on your actions and circumstances. Refine the question or look at neighbouring cards.');
 const love=aspectText(t.l),work=aspectText(t.w);
 const faq=[
  {q:uk?'Що означає карта '+name+' в Таро?':'What does '+name+' mean in Tarot?',a:t.u},
  {q:uk?'Що означає перевернута карта '+name+'?':'What does '+name+' reversed mean?',a:t.r},
  {q:uk?name+' у коханні: що означає?':'What does '+name+' mean in love?',a:love},
  {q:uk?name+': так чи ні?':name+': yes or no?',a:yes+'. '+yesText}
 ];
 const json=articleStructuredData({locale:loc,path:url,title:heading,description:t.u});
 const crumbs=publicIndexingEnabled()&&base?JSON.stringify({
  '@context':'https://schema.org','@type':'BreadcrumbList',
  itemListElement:[
   {'@type':'ListItem',position:1,name:uk?'Головна':'Home',item:base+'/'+loc},
   {'@type':'ListItem',position:2,name:uk?'Таро':'Tarot',item:base+'/'+loc+'/tarot'},
   {'@type':'ListItem',position:3,name:uk?'Значення карт':'Card meanings',item:base+'/'+loc+'/tarot/cards'},
   {'@type':'ListItem',position:4,name,item:base+url}
  ]
 }).replace(/</g,'\\u003c'):null;
 const faqLd=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',inLanguage:loc,
  mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))}).replace(/</g,'\\u003c');
 const sections=[
  {h:uk?'Пряме значення':'Upright meaning',p:guide?guide.upright[loc]:t.u},
  {h:uk?'Перевернуте значення':'Reversed meaning',p:guide?guide.reversed[loc]:t.r},
  {h:uk?'У коханні й стосунках':'In love and relationships',p:love},
  {h:uk?'У роботі й фінансах':'In work and money',p:work},
  {h:uk?'Порада карти':'The card’s advice',p:t.a},
  {h:uk?'Так чи ні':'Yes or no',p:yes+'. '+yesText}
 ];
 return <PortalShell locale={loc} active="tarot" languagePath={'tarot/cards/'+slug}>
  {json&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:json}}/>}
  {crumbs&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:crumbs}}/>}
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:faqLd}}/>
  <article className={styles.page} data-testid="tarot-card-guide">
   <nav className={styles.crumbs} aria-label={uk?'Навігація':'Breadcrumb'}><Link href={'/'+loc+'/tarot'}>{uk?'Таро':'Tarot'}</Link> / <Link href={'/'+loc+'/tarot/cards'}>{uk?'Значення карт':'Card meanings'}</Link> / {name}</nav>
   <header className={styles.hero}>
    <div className={styles.art}><TarotFace id={card.id} name={name} num={card.group==='major'?card.num:undefined} locale={loc} size="lg"/></div>
    <div>
     <span className={styles.eyebrow}>{group[loc]}</span>
     <h1>{heading}</h1>
     <ul className={styles.kw}>{t.k.map(k=><li key={k}>{k}</li>)}</ul>
     <p className={styles.lead}>{t.u}</p>
     <dl className={styles.facts}>
      <div><dt>{uk?'Група':'Group'}</dt><dd>{group[loc]}</dd></div>
      <div><dt>{uk?'Так чи ні':'Yes or no'}</dt><dd data-yes={card.yesNo}>{yes}</dd></div>
      <div><dt>{uk?'Порада':'Advice'}</dt><dd>{t.a}</dd></div>
     </dl>
     <ShareTools locale={loc} title={heading} path={url}/>
    </div>
   </header>
   <div className={styles.sections}>{sections.map(s=><section key={s.h} className={styles.section}><h2>{s.h}</h2><p>{s.p}</p></section>)}</div>
   {guide&&<div className={styles.sections}>
    <section className={styles.section}><h2>{uk?'Символіка карти':'Card symbolism'}</h2><p>{guide.symbolism[loc]}</p></section>
    <section className={styles.section}><h2>{uk?'У контексті розкладу':'In a Tarot spread'}</h2><p>{guide.inSpread[loc]}</p></section>
    <section className={styles.section}><h2>{uk?'Запитання для роздумів':'A question for reflection'}</h2><p>{guide.reflection[loc]}</p></section>
   </div>}
   <section className={styles.cta}>
    <h2>{uk?'Перевірте карту на практиці':'Try the card in practice'}</h2>
    <p>{uk?'Витягніть карту дня або поставте картам своє питання — безкоштовно й без реєстрації. Значення карти завжди залежить від питання, позиції в розкладі й сусідніх карт.':
     'Draw your card of the day or ask the cards your own question — free, no sign-up. A card’s meaning always depends on the question, its position and neighbouring cards.'}</p>
    <p className={styles.ctaLinks}><Link href={'/'+loc+'/tarot'}>{uk?'Витягнути карту дня':'Draw my card of the day'} →</Link>
     <Link href={'/'+loc+'/tarot#spreads'}>{uk?'Розклад «так чи ні»':'Yes-or-no reading'} →</Link>
     <Link href={'/'+loc+'/pedia/tarot-reversals'}>{uk?'Урок про перевернуті карти':'Learn about reversals'} →</Link></p>
   </section>
   <section className={styles.section}>
    <h2>{uk?'Часті запитання':'Frequently asked questions'}</h2>
    {faq.map(x=><details key={x.q} className={styles.faq}><summary>{x.q}</summary><p>{x.a}</p></details>)}
   </section>
   <nav className={styles.pager} aria-label={uk?'Інші карти':'Other cards'}>
    <Link href={'/'+loc+'/tarot/cards/'+prev.slug}>← {prev.name[loc]}</Link>
    <Link href={'/'+loc+'/tarot/cards'}>{uk?'Усі 78 карт':'All 78 cards'}</Link>
    <Link href={'/'+loc+'/tarot/cards/'+next.slug}>{next.name[loc]} →</Link>
   </nav>
  </article>
 </PortalShell>;
}
