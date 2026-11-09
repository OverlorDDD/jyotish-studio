import type {Metadata} from 'next';
import JyotishCalculator from './astrology/jyotish/page';
import PortalShell from './components/PortalShell';
import GalaxiComModuleLink from './components/GalaxiComModuleLink';
import {JyotishSearchGuide} from './components/SearchGuides';
import OrganicIntentBridge from './components/OrganicIntentBridge';
import {indexRobots} from '../lib/site-indexing';

/** The domain root remains HTTP 200 for visitors, but is a duplicate alias of the EN natal chart. */
export const metadata:Metadata={
 title:'Free Vedic Birth Chart Calculator (Kundli) | Galaxiora',
 description:'Create a free Vedic birth chart on Galaxiora. Calculate D1, D9 and D10 with Swiss Ephemeris, nakshatras and Vimshottari Dasha.',
 robots:indexRobots(),
 alternates:{canonical:'/en/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/en/astrology/jyotish'}},
 openGraph:{siteName:'Galaxiora',type:'website',
  title:'Galaxiora — Free Vedic Birth Chart Calculator',
  description:'Explore your Vedic natal chart in one practical, bilingual workspace.',url:'/en/astrology/jyotish'}
};
export default function Home(){
 return <PortalShell locale="en" active="astrology" languagePath="astrology/jyotish">
  <JyotishCalculator initialLang="en"/>
  <JyotishSearchGuide locale="en"/>
  <OrganicIntentBridge kind="jyotish" locale="en"/>
  <GalaxiComModuleLink locale="en" kind="jyotish"/>
 </PortalShell>;
}
