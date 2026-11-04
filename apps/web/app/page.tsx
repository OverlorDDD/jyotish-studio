import type {Metadata} from 'next';
import PortalHome from './components/PortalHome';
import {indexRobots} from '../lib/site-indexing';

/** Public root is the domain homepage for Google's site-name discovery.
 * /en remains the canonical English duplicate; /uk is its language alternate.
 * Root previously inherited noindex, which weakened hostname-level discovery.
 */
export const metadata:Metadata={
 title:'Galaxiora — Astrology, Tarot, Panchanga & Mindful Practice',
 description:'Official Galaxiora website. Explore Jyotish and Western astrology, Tarot card readings, local Panchanga and original bilingual learning.',
 robots:indexRobots(),
 alternates:{canonical:'/en',languages:{uk:'/uk',en:'/en','x-default':'/en'}},
 openGraph:{siteName:'Galaxiora',type:'website',
  title:'Galaxiora — Astrology, Tarot, Panchanga & Mindful Practice',
  description:'Official bilingual astrology and Tarot platform at galaxiora.com',
  url:'/en'}
};
export default function Home(){return <PortalHome locale="en"/>;}
