import type {Metadata} from 'next';
import {notFound,permanentRedirect} from 'next/navigation';
import PairPage,{pairTitle} from '../../../../components/horoscope/PairPage';
import {BRAND,isPortalLocale} from '../../../../../lib/brand';
import {indexRobots} from '../../../../../lib/site-indexing';
import {ALL_PAIRS,bandLabel,compatPath,pairContent,parsePair} from '../../../../../lib/compatibility';
type Props={params:Promise<{locale:string;pair:string}>};
export function generateStaticParams(){return BRAND.locales.flatMap(locale=>ALL_PAIRS.map(p=>({locale,pair:p.slug})));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,pair:raw}=await params;
 if(!isPortalLocale(locale))return {};
 const pair=parsePair(raw);
 if(!pair||!pair.canonical)return {};
 const uk=locale==='uk',c=pairContent(pair),t=pairTitle(pair,locale);
 const title=uk?t+': кохання, дружба, шлюб':t+': love, friendship, marriage';
 const description=uk?c.tagline.uk+'. '+c.western.overall+'% — '+bandLabel(c.western.overall,'uk')+'. Як кохає кожен знак, що зближує пару, де тертя й ведичний погляд за знаками Місяця.':
  c.tagline.en+'. '+c.western.overall+'% — '+bandLabel(c.western.overall,'en')+'. How each sign loves, what brings the pair together, where friction arises and the Vedic Moon-sign view.';
 return {title:title+' | Galaxiora',description,robots:{...indexRobots(),'max-image-preview':'large'},
  alternates:{canonical:compatPath(locale,pair.slug),languages:{uk:compatPath('uk',pair.slug),en:compatPath('en',pair.slug),'x-default':compatPath('en',pair.slug)}},
  openGraph:{type:'article',siteName:'Galaxiora',title,description,url:compatPath(locale,pair.slug),locale:uk?'uk_UA':'en_US'}};
}
export default async function CompatibilityPairPage({params}:Props){
 const {locale,pair:raw}=await params;
 if(!isPortalLocale(locale))notFound();
 const pair=parsePair(raw);
 if(!pair)notFound();
 if(!pair.canonical)permanentRedirect(compatPath(locale,pair.slug));
 return <PairPage locale={locale} pair={pair}/>;
}
