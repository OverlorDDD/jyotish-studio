import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import PortalShell from '../../../components/PortalShell';
import Passport from '../../../components/horoscope/Passport';
import styles from '../../../components/horoscope/Horoscope.module.css';
import {isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isPortalLocale(locale))return {};
 const uk=locale==='uk';
 const title=uk?'Зоряний паспорт: ваш знак зодіаку в західній і ведичній астрології':'Star Passport: your zodiac sign in Western and Vedic astrology';
 const description=uk?'Дізнайтеся свій західний знак, ведичний знак Сонця й Місяця та накшатру за датою народження — і чому вони різні.':'Find your Western sign, Vedic Sun and Moon signs and nakshatra from your birth date — and why they differ.';
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical:'/'+locale+'/horoscope/my-sign',languages:{uk:'/uk/horoscope/my-sign',en:'/en/horoscope/my-sign','x-default':'/en/horoscope/my-sign'}},
  openGraph:{type:'website',siteName:'Galaxiora',title,description,url:'/'+locale+'/horoscope/my-sign'}};
}
export default async function MySignPage({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const uk=locale==='uk';
 return <PortalShell locale={locale} active="horoscope" languagePath="horoscope/my-sign">
  <div className={styles.wrap}>
   <nav className={styles.crumbs} aria-label={uk?'Хлібні крихти':'Breadcrumbs'}><Link href={'/'+locale+'/horoscope'}>{uk?'Гороскопи':'Horoscopes'}</Link> / {uk?'Зоряний паспорт':'Star Passport'}</nav>
   <header className={styles.hero}><div>
    <h1>{uk?'Зоряний паспорт':'Star Passport'}</h1>
    <p>{uk?'Хто ви за знаком зодіаку — на Заході й у Ведах? Одна дата народження покаже три знаки, накшатру й те, чому вони різні.':'Who are you in the zodiac — in the West and in the Vedas? One birth date shows three signs, your nakshatra and why they differ.'}</p>
   </div></header>
   <Passport locale={locale}/>
   <p style={{color:'var(--gx-mist)',fontSize:14}}>{uk?'Дані народження використовуються лише для розрахунку й ніде не зберігаються.':'Birth data is used only for the calculation and is never stored.'}</p>
  </div>
 </PortalShell>;
}
