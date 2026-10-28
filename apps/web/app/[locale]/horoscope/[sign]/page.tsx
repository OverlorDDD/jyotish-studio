import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {BRAND,isPortalLocale} from '../../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../../lib/site-indexing';
import {MOON_SIGN_GUIDES,moonSignGuide} from '../../../../lib/moon-sign-guides';
import PortalShell from '../../../components/PortalShell';
export const dynamicParams=false;
type Props={params:Promise<{locale:string;sign:string}>};
export function generateStaticParams(){
 return BRAND.locales.flatMap(locale=>MOON_SIGN_GUIDES.map(x=>({locale,sign:x.slug})));
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,sign}=await params,guide=moonSignGuide(sign);
 if(!isPortalLocale(locale)||!guide)return {robots:{index:false,follow:false}};
 const uk=locale==='uk',name=uk?guide.uk:guide.en;
 const title=uk?'Місячний гороскоп '+name+' — Джйотіш':'Moon Sign Horoscope: '+name+' — Jyotish';
 const description=uk?
  'Що означає натальний Місяць у знаку '+name+'? Риси раші, управитель, практичні орієнтири й посилання на актуальний гороскоп за Swiss Ephemeris.':
  'Explore the natal Moon in '+name+': Vedic rashi symbolism, ruling planet, practical themes and current Swiss Ephemeris horoscope.';
 const path='/'+locale+'/horoscope/'+sign;
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical:path,languages:{uk:'/uk/horoscope/'+sign,en:'/en/horoscope/'+sign,'x-default':'/en/horoscope/'+sign}},
  openGraph:{type:'article',title,description,url:path,siteName:'Galaxiora',locale:uk?'uk_UA':'en_US'},
  twitter:{card:'summary_large_image',title,description}};
}
export default async function MoonSignGuide({params}:Props){
 const {locale,sign}=await params,guide=moonSignGuide(sign);
 if(!isPortalLocale(locale)||!guide)notFound();
 const uk=locale==='uk',name=uk?guide.uk:guide.en;
 const origin=publicSiteOrigin(),jsonLd=publicIndexingEnabled()&&origin?JSON.stringify({
  '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
   {'@type':'ListItem',position:1,name:uk?'Головна':'Home',item:origin+'/'+locale},
   {'@type':'ListItem',position:2,name:uk?'Гороскопи':'Horoscopes',item:origin+'/'+locale+'/horoscope'},
   {'@type':'ListItem',position:3,name,item:origin+'/'+locale+'/horoscope/'+sign}
  ]
 }).replace(/</g,'\\u003c'):null;
 const ruler=uk?guide.lordUk:guide.lordEn,element=uk?guide.elementUk:guide.elementEn;
 const quality=uk?guide.modalityUk:guide.modalityEn;
 const theme=uk?guide.themesUk:guide.themesEn,tip=uk?guide.adviceUk:guide.adviceEn;
 return <PortalShell locale={locale} active="horoscope" languagePath={'horoscope/'+sign}>
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <article className="as-wellness as-academy-detail" data-testid="moon-sign-guide" style={{maxWidth:880,margin:'32px auto 70px'}}>
   <nav aria-label={uk?'Навігація':'Breadcrumb'} style={{marginBottom:24}}>
    <Link href={'/'+locale}>{uk?'Головна':'Home'}</Link> {' / '}
    <Link href={'/'+locale+'/horoscope'}>{uk?'Гороскопи':'Horoscopes'}</Link> {' / '}{name}
   </nav>
   <header className="as-wellness-detail-head">
    <span className="as-overline">GALAXIORA · JYOTISH · JANMA RASHI</span>
    <h1>{uk?'Місячний гороскоп — ':'Moon-sign horoscope — '}{name}</h1>
    <p>{uk?'Пізнай характер свого місячного раші та переглянь щоденний прогноз за реальним положенням Місяця.':
     'Discover your lunar rashi and explore the daily forecast based on the Moon’s real astronomical position.'}</p>
   </header>
   <section className="as-lesson-section"><h2>{uk?'Яке значення має Місяць у '+name+'?':'What does the Moon in '+name+' mean?'}</h2>
    <p>{uk?'У Джйотіш натальний Місяць описує звичний спосіб сприйняття подій, емоційні потреби та внутрішні пріоритети. Для раші '+name+' традиція підкреслює '+theme+'.':
     'In Jyotish, the natal Moon reflects patterns of perception, emotional needs and inner priorities. The '+name+' rashi traditionally emphasizes '+theme+'.'}</p>
    <p>{uk?'Управитель знака — '+ruler+', стихія — '+element+', характер знака — '+quality+'. Ці риси читаються разом із накшатрою, домами та іншими положеннями натальної карти.':
     'Its traditional ruler is '+ruler+', element '+element+', and modality '+quality+'. The full reading also considers nakshatra, natal houses and other planetary placements.'}</p>
   </section>
   <section className="as-lesson-section"><h2>{uk?'Практичний орієнтир':'One practical focus'}</h2>
    <p>{tip}</p><p>{uk?'Це загальне пояснення місячного знака. Щоб дізнатися, у якому домі зараз іде транзит Місяця саме для твого раші, відкрий актуальний гороскоп нижче.':
     'This describes the Moon-sign theme. To see the transiting Moon’s current house relative to this rashi, open the live horoscope below.'}</p>
   </section>
   <div className="as-actions" style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:24}}>
    <Link className="as-button as-button-primary" href={'/'+locale+'/horoscope?sign='+sign}>
     {uk?'Читати актуальний гороскоп '+name:'See today’s '+name+' horoscope'} ↗
    </Link>
    <Link className="as-button as-button-secondary" href={'/'+locale+'/astrology/jyotish'}>
     {uk?'Визначити свій натальний Місяць':'Calculate my birth-chart Moon'}
    </Link>
   </div>
   <aside className="as-wellness-note" style={{marginTop:26}}>
    <div><strong>{uk?'Місячний знак чи знак за датою народження?':'Moon sign or birth-date Sun sign?'}</strong>
     <p>{uk?'У західних популярних гороскопах знак зазвичай визначають за Сонцем. Тут використовується сидеричне положення Місяця на момент народження, тому назви знаків можуть відрізнятися. Для точного визначення потрібні дата, місце й час народження.':
      'Popular Western horoscopes usually use the Sun sign. Jyotish Moon-sign readings use the sidereal Moon at birth, so the sign may differ. Exact birth date, place and time establish your Moon sign.'}</p>
    </div>
   </aside>
   <section className="as-lesson-section">
    <h2>{uk?'Досліджуй більше':'Explore more'}</h2>
    <p><Link href={'/'+locale+'/panchanga'}>{uk?'Панчанга — поточна тітхі, накшатра й фази Місяця':'Panchanga — today’s tithi, nakshatra and Moon phases'}</Link></p>
    <p><Link href={'/'+locale+'/learn'}>{uk?'Академія Джйотіш':'Jyotish Academy'}</Link></p>
   </section>
  </article>
 </PortalShell>;
}
