import type {Metadata} from 'next';
import {BRAND} from '../lib/brand';
import './globals.css';

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/,'');
export const metadata:Metadata={
 title:{default:'Astrology, Tarot & Cosmic Wisdom | '+BRAND.name,template:'%s'},
 description:BRAND.name+' connects astrology, tarot, Vedic wisdom, mindfulness, and personal readings in one cosmic space.',
 applicationName:BRAND.name,
 openGraph:{siteName:BRAND.name,type:'website'},
 ...(siteUrl&&/^https:\/\//.test(siteUrl)?{metadataBase:new URL(siteUrl)}:{})
};
export default function RootLayout({children}:{children:React.ReactNode}){
 const structured=siteUrl&&/^https:\/\//.test(siteUrl)?JSON.stringify({
  '@context':'https://schema.org','@type':'WebSite',name:BRAND.name,url:siteUrl,
  description:metadata.description,inLanguage:['en','uk']
 }).replace(/</g,'\\u003c'):null;
 return <html lang="en"><body>
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>}
  {children}
 </body></html>;
}
