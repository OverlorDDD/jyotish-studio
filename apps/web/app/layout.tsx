import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {publicSiteOrigin} from '../lib/site-indexing';
import {BRAND} from '../lib/brand';
import './globals.css';

const siteUrl=publicSiteOrigin();
export const metadata:Metadata={
 title:{default:'Astrology, Tarot & Cosmic Wisdom | '+BRAND.name,template:'%s'},
 description:BRAND.name+' connects astrology, tarot, Vedic wisdom, mindfulness, and personal readings in one cosmic space.',
 applicationName:BRAND.name,
  icons:{icon:[{url:'/icon.svg?v=galaxiora-opaque-20261027',type:'image/svg+xml'}],shortcut:'/icon.svg?v=galaxiora-opaque-20261027'},
 openGraph:{siteName:BRAND.name,type:'website'},
 robots:{index:false,follow:true}, // Root / is a duplicate; localized pages opt in explicitly.
 ...(siteUrl&&/^https:\/\//.test(siteUrl)?{metadataBase:new URL(siteUrl)}:{})
};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const locale=(await headers()).get('x-galaxiora-locale')==='uk'?'uk':'en';
 const structured=siteUrl&&/^https:\/\//.test(siteUrl)?JSON.stringify({
  '@context':'https://schema.org','@type':'WebSite',name:BRAND.name,url:siteUrl,
  description:metadata.description,inLanguage:['en','uk']
 }).replace(/</g,'\\u003c'):null;
 return <html lang={locale}><body>
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>}
  {children}
 </body></html>;
}
