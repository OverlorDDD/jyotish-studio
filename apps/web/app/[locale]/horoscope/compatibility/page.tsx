import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import CompatHome from '../../../components/horoscope/CompatHome';
import {BRAND,isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';
import {compatPath} from '../../../../lib/compatibility';
type Props={params:Promise<{locale:string}>};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isPortalLocale(locale))return {};
 const uk=locale==='uk';
 const title=uk?'Сумісність знаків зодіаку: таблиця пар і 36 гун за датою народження':'Zodiac compatibility: all sign pairs and 36 gunas by birth date';
 const description=uk?'Сумісність усіх 78 пар знаків у коханні, дружбі й справах, а також класична ведична перевірка пари Ашта-кута (36 гун) за датами народження.':'Compatibility for all 78 sign pairs in love, friendship and work, plus the classical Vedic Ashtakoota check (36 gunas) from birth dates.';
 return {title:title+' | Galaxiora',description,robots:{...indexRobots(),'max-image-preview':'large'},
  alternates:{canonical:compatPath(locale),languages:{uk:compatPath('uk'),en:compatPath('en'),'x-default':compatPath('en')}},
  openGraph:{type:'website',siteName:'Galaxiora',title,description,url:compatPath(locale),locale:uk?'uk_UA':'en_US'}};
}
export default async function CompatibilityPage({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <CompatHome locale={locale}/>;
}
