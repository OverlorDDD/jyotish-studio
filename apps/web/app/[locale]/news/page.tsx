import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import NewsPortal from '../../components/news/NewsPortal';
import {isPortalLocale} from '../../../lib/brand';
import {indexRobots} from '../../../lib/site-indexing';

export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isPortalLocale(locale))return {};
 const uk=locale==='uk';
 const title=uk?'GalaxiNews — новини астрології, Джйотиш, Таро й ведичної традиції':'GalaxiNews — Astrology, Jyotish, Tarot and Vedic News';
 const description=uk?'Щоденні новини неба: ретроградні планети, фази Місяця, затемнення й переходи в сидеричному зодіаку, а також новини Джйотиш, Таро, йоги й ведичної традиції зі світових видань.':
  'Daily sky news — retrogrades, Moon phases, eclipses and sidereal ingresses — plus Jyotish, Tarot, yoga and Vedic tradition news from publications worldwide.';
 return {title,description,robots:{...indexRobots(),'max-image-preview':'large'},
  alternates:{canonical:'/'+locale+'/news',languages:{uk:'/uk/news',en:'/en/news','x-default':'/en/news'},
   types:{'application/rss+xml':'/'+locale+'/news/rss.xml'}},
  openGraph:{type:'website',siteName:'Galaxiora',title,description,url:'/'+locale+'/news',locale:uk?'uk_UA':'en_US'}};
}
export default async function NewsPage({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <NewsPortal locale={locale as 'uk'|'en'}/>;
}
