import type {Metadata} from 'next';
import JyotishCalculator from './astrology/jyotish/page';
import PortalShell from './components/PortalShell';
import GalaxiComModuleLink from './components/GalaxiComModuleLink';
import {JyotishSearchGuide} from './components/SearchGuides';
import OrganicIntentBridge from './components/OrganicIntentBridge';
import {indexRobots} from '../lib/site-indexing';

/** The domain root is a real HTTP 200 natal page for Google WebSite discovery. */
export const metadata:Metadata={
 title:'Free Vedic Birth Chart Calculator (Kundli) | Galaxiora',
 description:'Create a free Vedic birth chart on Galaxiora. Calculate D1, D9 and D10 with Swiss Ephemeris, nakshatras and Vimshottari Dasha.',
 robots:indexRobots(),
 alternates:{canonical:'/',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/'}},
 openGraph:{siteName:'Galaxiora',type:'website',
  title:'Galaxiora — Free Vedic Birth Chart Calculator',
  description:'Explore your Vedic natal chart in one practical, bilingual workspace.',url:'/'}
};
export default function Home(){
 return <PortalShell locale="en" active="astrology" languagePath="astrology/jyotish">
  <JyotishCalculator initialLang="en"/>
  <JyotishSearchGuide locale="en"/>
  <OrganicIntentBridge kind="jyotish" locale="en"/>
  <GalaxiComModuleLink locale="en" kind="jyotish"/>
 </PortalShell>;
}
