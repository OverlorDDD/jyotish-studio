'use client';
import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
import {classifyReferralBucket,publicAggregateSectionForPath} from '../../lib/visitor-analytics-policy';

/** Page renders, not identities. No cookies, localStorage, GA tag, full path,
 * referrer URL, URL query, fingerprints or birth information are transmitted.
 * Covers Next.js client navigation that produces no document HTTP request.
 * Kept separate from HTTP candidate counts: never sum these two metrics.
 */
export default function FirstPartyPageViews(){
 const pathname=usePathname();
 const previous=useRef<string|null>(null);
 useEffect(()=>{
  if(!pathname||previous.current===pathname)return;
  const first=previous.current===null;
  previous.current=pathname;
  // Only the official site (plus local development) may emit aggregates.
  if(!['galaxiora.com','localhost','127.0.0.1'].includes(window.location.hostname))return;
  const section=publicAggregateSectionForPath(pathname);
  if(!section)return;
  const locale=/^\/uk(?:\/|$)/.test(pathname)?'uk':'en';
  const channel=first
   ?classifyReferralBucket(document.referrer,window.location.search)
   :'internal';
  // Browser sends only three fixed enums to the same origin. Explicitly omit
  // credentials and disable cache. No GA4 consent state is read or changed.
  void fetch('/api/v1/traffic/page-view',{
   method:'POST',mode:'same-origin',credentials:'omit',cache:'no-store',keepalive:true,
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({section,channel,locale})
  }).catch(()=>{});
 },[pathname]);
 return null;
}
