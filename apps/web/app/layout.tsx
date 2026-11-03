import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {publicSiteOrigin} from '../lib/site-indexing';
import {BRAND} from '../lib/brand';
import './globals.css';
import {Suspense} from 'react';
import GrowthConsent from './components/GrowthConsent';

const siteUrl=publicSiteOrigin();
export const metadata:Metadata={
 title:{default:'Astrology, Tarot & Cosmic Wisdom | '+BRAND.name,template:'%s'},
 description:BRAND.name+' connects astrology, tarot, Vedic wisdom, mindfulness, and personal readings in one cosmic space.',
 applicationName:BRAND.name,
 ...(process.env.GOOGLE_SITE_VERIFICATION||process.env.BING_SITE_VERIFICATION?{
  verification:{
   ...(process.env.GOOGLE_SITE_VERIFICATION?{google:process.env.GOOGLE_SITE_VERIFICATION}:{}),
   ...(process.env.BING_SITE_VERIFICATION?{other:{'msvalidate.01':process.env.BING_SITE_VERIFICATION}}:{})
  }}:{}),
  icons:{
   icon:[
    {url:'/icon.png?v=galaxy-round-v4',type:'image/png',sizes:'64x64'},
    {url:'/favicon.ico?v=galaxy-round-v4',type:'image/x-icon',sizes:'any'}
   ],
   shortcut:'/icon.png?v=galaxy-round-v4',
   apple:[{url:'/apple-touch-icon.png?v=galaxy-round-v4',type:'image/png',sizes:'180x180'}]
  },
  manifest:'/site.webmanifest',
 openGraph:{siteName:BRAND.name,type:'website',title:BRAND.name+' — Jyotish, Tarot & Panchanga',description:'Vedic astrology, lunar calendar, Tarot and mindful living.'},
 twitter:{card:'summary_large_image',title:BRAND.name,description:'Jyotish, Tarot, Panchanga and Yoga in one space.'},
 robots:{index:false,follow:true}, // Root / is a duplicate; localized pages opt in explicitly.
 ...(siteUrl&&/^https:\/\//.test(siteUrl)?{metadataBase:new URL(siteUrl)}:{})
};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const locale=(await headers()).get('x-galaxiora-locale')==='uk'?'uk':'en';
 const structured=siteUrl&&/^https:\/\//.test(siteUrl)?JSON.stringify({
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'WebSite','@id':siteUrl+'/#website',name:BRAND.name,
    alternateName:['galaxiora.com'],url:siteUrl+'/',
    description:'Galaxiora is a bilingual astrology, Tarot, Panchanga and learning platform.',
    inLanguage:['en','uk'],publisher:{'@id':siteUrl+'/#organization'}},
   {'@type':'Organization','@id':siteUrl+'/#organization',
    name:BRAND.name,url:siteUrl+'/',
    description:'Galaxiora is an online platform offering Vedic and Western astrology tools, Tarot, lunar calendars and original learning materials.',
    logo:{'@type':'ImageObject',url:siteUrl+'/galaxiora-logo-128.png',width:128,height:128}}
  ]
 }).replace(/</g,'\\u003c'):null;
 return <html lang={locale}><body>
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>}
  {children}
  <Suspense fallback={null}><GrowthConsent/></Suspense>
 </body></html>;
}
