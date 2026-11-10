import type {Metadata} from 'next';
import JyotishCalculator from './astrology/jyotish/page';
import PortalShell from './components/PortalShell';
import GalaxiComModuleLink from './components/GalaxiComModuleLink';
import {JyotishSearchGuide} from './components/SearchGuides';
import OrganicIntentBridge from './components/OrganicIntentBridge';
import {indexRobots} from '../lib/site-indexing';

/** The domain root remains HTTP 200, with canonical English natal page for search. */
export const metadata:Metadata={
 title:'Free Vedic Birth Chart & Kundli Calculator | Galaxiora',
 description:'Create your free Vedic birth chart (Kundli) with 16 divisional charts, Moon sign, rising sign and nakshatra. Discover Jyotish astrology with Galaxiora.',
 robots:indexRobots(),
 alternates:{canonical:'/en/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/en/astrology/jyotish'}},
 openGraph:{siteName:'Galaxiora',type:'website',
  title:'Free Vedic Birth Chart & Kundli | Galaxiora',
  description:'Discover your Moon sign, rising sign and 16 Vedic divisional charts. Free bilingual birth chart calculator.',url:'/en/astrology/jyotish'}
};
export default function Home(){
 return <PortalShell locale="en" active="astrology" languagePath="astrology/jyotish">
  <JyotishCalculator initialLang="en"/>
  <JyotishSearchGuide locale="en"/>
  <OrganicIntentBridge kind="jyotish" locale="en"/>
  <GalaxiComModuleLink locale="en" kind="jyotish"/>
 </PortalShell>;
}
