import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import {isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots} from '../../../lib/site-indexing';
import {NAKSHATRA_GUIDES,nakshatraByNumber,nakshatraRuler,nakshatraSpan} from '../../../lib/nakshatra-guides';
import {moonMoment,moonNakshatraNow} from '../../../lib/nakshatra-moon';
import styles from './Nakshatra.module.css';

type Params={params:Promise<{locale:string}>};
export const dynamic='force-dynamic';
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 const uk=locale==='uk',path='nakshatra',canonical='/'+locale+'/'+path;
 const title=uk?'27 накшатр: значення, управителі та пади':'The 27 Nakshatras: Meanings, Rulers and Padas';
 const description=uk
  ?'Довідник 27 накшатр Джйотіш: сектори зодіаку, управителі Вімшоттарі, божества й символи. Дізнайся, у якій накшатрі Місяць зараз.'
  :'A reference to the 27 nakshatras of Jyotish: zodiac spans, Vimshottari rulers, deities and symbols. See which nakshatra the Moon is in now.';
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical,languages:{uk:'/uk/'+path,en:'/en/'+path,'x-default':'/en/'+path}},
  openGraph:{title,description,type:'website',locale:uk?'uk_UA':'en_US',url:canonical,siteName:'Galaxiora'},
  twitter:{card:'summary_large_image',title,description}};
}
export default async function NakshatraHub({params}:Params){
 const {locale:raw}=await params;if(!isPortalLocale(raw))notFound();
 const locale=raw as PortalLocale,uk=locale==='uk',prefix='/'+locale+'/';
 const now=await moonNakshatraNow(),current=now?nakshatraByNumber(now.number):null;
 return <PortalShell locale={locale} active="astrology" languagePath="nakshatra">
  <article className={styles.page} data-testid="nakshatra-hub">
   <h1 className={styles.title}>{uk?'27 накшатр Джйотіш':'The 27 nakshatras of Jyotish'}</h1>
   <p className={styles.sub}>{uk
    ?'Накшатри ділять сидеричний зодіак на 27 рівних секторів по 13°20′. Місяць проходить кожну приблизно за добу, і саме його накшатра в момент народження задає відлік періодів Вімшоттарі-даші.'
    :'The nakshatras divide the sidereal zodiac into 27 equal sectors of 13°20′. The Moon crosses each in about a day, and its nakshatra at birth sets the starting point of the Vimshottari dasha periods.'}</p>
   {now&&current&&<p className={styles.live} data-testid="nakshatra-live">{uk
    ?<>Зараз Місяць у накшатрі <Link href={prefix+'nakshatra/'+current.slug}><strong>{current.name[locale]}</strong></Link> — до {moonMoment(now.endUtc,locale)}.</>
    :<>The Moon is now in <Link href={prefix+'nakshatra/'+current.slug}><strong>{current.name[locale]}</strong></Link> until {moonMoment(now.endUtc,locale)}.</>}</p>}
   <div className={styles.scroll}><table className={styles.table}>
    <thead><tr><th scope="col">№</th><th scope="col">{uk?'Накшатра':'Nakshatra'}</th><th scope="col">{uk?'Сектор':'Span'}</th>
     <th scope="col">{uk?'Управитель':'Ruler'}</th><th scope="col">{uk?'Символ':'Symbol'}</th></tr></thead>
    <tbody>{NAKSHATRA_GUIDES.map(item=><tr key={item.slug} aria-current={now?.number===item.number?'true':undefined}>
     <td>{item.number}</td><th scope="row"><Link href={prefix+'nakshatra/'+item.slug}>{item.name[locale]}</Link></th>
     <td>{nakshatraSpan(item,locale)}</td><td>{nakshatraRuler(item,locale)}</td><td>{item.symbol[locale]}</td></tr>)}</tbody>
   </table></div>
   <p className={styles.cta}><Link href={prefix+'astrology/jyotish'}>{uk
    ?'Дізнатися свою накшатру: безкоштовна натальна карта':'Find your own nakshatra: free birth chart'}</Link></p>
   <p><Link href={prefix+'panchanga'}>{uk?'Накшатра сьогодні у твоєму місті — Панчанга':'Today’s nakshatra in your city — Panchanga'}</Link>
    {' · '}<Link href={prefix+'pedia/nakshatras'}>{uk?'Урок: що таке накшатри':'Lesson: what nakshatras are'}</Link></p>
  </article>
 </PortalShell>;
}
