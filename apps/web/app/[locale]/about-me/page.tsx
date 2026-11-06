import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import DeveloperPortfolio from '../../components/DeveloperPortfolio';
import PortalShell from '../../components/PortalShell';
import profile from '../../../lib/portfolio-profile.json';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../lib/site-indexing';

type Props={params:Promise<{locale:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 const localized=profile[locale];
 const description=locale==='uk'?
  'Денис Авраменко — Full-Stack Software Engineer. Досвід, навички, Galaxiora, OpsPilot Admin, GitHub та резюме PDF/Word.':
  'Denys Avramenko — Full-Stack Software Engineer. Experience, Galaxiora, OpsPilot Admin, GitHub and a downloadable PDF/Word resume.';
 return {title:(locale==='uk'?'Денис Авраменко':'Denys Avramenko')+' | About Me · '+localized.title,
  description,robots:indexRobots(),
  alternates:{canonical:'/'+locale+'/about-me',languages:{en:'/en/about-me',uk:'/uk/about-me','x-default':'/en/about-me'}},
  openGraph:{type:'profile',siteName:'Galaxiora',
   title:(locale==='uk'?profile.contact.nameUk:profile.contact.nameEn)+' · Full-Stack Software Engineer',
   description,url:'/'+locale+'/about-me',locale:locale==='uk'?'uk_UA':'en_US'}};
}
export default async function AboutMePage({params}:Props){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 const c=profile.contact,base=publicSiteOrigin();
 const structured=publicIndexingEnabled()&&base?JSON.stringify({
  '@context':'https://schema.org','@type':'ProfilePage',
  '@id':base+'/'+locale+'/about-me#profile',url:base+'/'+locale+'/about-me',
  inLanguage:locale,mainEntity:{
   '@type':'Person','@id':base+'/en/about-me#person',
   name:c.nameEn,alternateName:c.nameUk,jobTitle:profile.en.title,
   url:base+'/en/about-me',sameAs:[c.github,c.linkedin],
   hasCredential:{'@type':'EducationalOccupationalCredential',credentialCategory:'Master degree',recognizedBy:{'@type':'CollegeOrUniversity',name:'Kryvyi Rih National University'}}
  }
 }).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={locale as PortalLocale} active="about-me" languagePath="about-me">
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>}
  <DeveloperPortfolio locale={locale as PortalLocale}/>
 </PortalShell>;
}
