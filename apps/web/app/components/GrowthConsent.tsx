'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {safeGrowthCampaign,safeGrowthEvent,safeGrowthPath,safeGrowthToolForPath,safePublicToolEvent,safePublicTool} from '../../lib/growth-metrics';

const CONSENT_KEY='galaxiora-analytics-choice-v1';
const measurementId=process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim()||'';
const enabled=/^G-[A-Z0-9]{6,16}$/.test(measurementId);
type Choice='accepted'|'rejected'|null;
type Gtag=(command:string,...args:unknown[])=>void;
declare global {interface Window {dataLayer?:IArguments[];gtag?:Gtag;__galaxioraAnalyticsReady?:boolean;__galaxioraTagStatus?:'loading'|'loaded'|'blocked'|'request_observed';__galaxioraLastPageView?:string}}
function tagStatus(status:'loading'|'loaded'|'blocked'|'request_observed'){
 if(typeof window==='undefined')return;
 if(status==='loaded'&&window.__galaxioraTagStatus==='request_observed')return;
 window.__galaxioraTagStatus=status;
 window.dispatchEvent(new CustomEvent('galaxiora:tag-status',{detail:status}));
}
function watchCollectorRequests(){
 if(typeof PerformanceObserver==='undefined')return;
 // Resource Timing proves only that a request was attempted; Google receipt is
 // confirmed separately by DebugView/Realtime, never by the script load event.
 const observed=(name:string)=>{
  try{
   const url=new URL(name);
   return (url.hostname==='www.google-analytics.com'||url.hostname==='region1.google-analytics.com'||
    url.hostname.endsWith('.google-analytics.com'))&&/^\/(?:g|j)\/collect$/.test(url.pathname);
  }catch{return false;}
 };
 if(performance.getEntriesByType('resource').some(x=>observed(x.name)))tagStatus('request_observed');
 const observer=new PerformanceObserver(list=>{
  if(list.getEntries().some(x=>observed(x.name)))tagStatus('request_observed');
 });
 try{observer.observe({type:'resource',buffered:true});}catch{observer.disconnect();}
}
function startAnalytics(safePath:string){
 if(typeof window==='undefined'||!enabled||window.__galaxioraAnalyticsReady)return;
 window.__galaxioraAnalyticsReady=true;
 watchCollectorRequests();
 window.dataLayer=window.dataLayer||[];
 // Google gtag.js consumes the native Arguments object; a rest-array stays in
 // dataLayer but is not processed as a gtag command by the real tag runtime.
 // The previous rest-array shim made browser tests appear green while GA4
 // received no g/collect requests in production.
 window.gtag=function gtag(..._args:unknown[]){window.dataLayer?.push(arguments)};
 // Basic Consent Mode: the script is not fetched before affirmative consent.
 // Even after consent, queue the default DENIED state before js/config/event,
 // then apply the visitor's affirmative update (Google's required order).
 window.gtag('consent','default',{
  analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'
 });
 window.gtag('consent','update',{
  analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'
 });
 window.gtag('js',new Date());
 // Never let GA discover a raw URL query, birth details or private referrer.
 const safeLocation='https://galaxiora.com'+safePath;
 let safeReferrer='';
 try{
  if(document.referrer){
   const source=new URL(document.referrer);
   if(source.protocol==='https:'&&source.hostname!=='galaxiora.com')safeReferrer=source.origin+'/';
  }
 }catch{}
 window.gtag('config',measurementId,{send_page_view:false,page_location:safeLocation,page_referrer:safeReferrer,...(safeGrowthCampaign(window.location.search)||{}),allow_google_signals:false,allow_ad_personalization_signals:false});
 // Keep automatic GA4 page_view disabled; the route effect below emits exactly one.
 const script=document.createElement('script');
 script.async=true;
 script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);
 script.dataset.galaxioraAnalytics='true';
 tagStatus('loading');
 script.addEventListener('load',()=>tagStatus('loaded'),{once:true});
 script.addEventListener('error',()=>tagStatus('blocked'),{once:true});
 document.head.appendChild(script);
}
function stopAnalytics(){
 // Choice changes take effect immediately for measurement; an already-loaded
 // script cannot be unloaded safely. Prior consent cookies can be controlled by GA.
 if(typeof window==='undefined'||!window.gtag)return;
 window.gtag('consent','update',{
  analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'
 });
 window.gtag=undefined;
 window.__galaxioraAnalyticsReady=false;
 window.__galaxioraLastPageView=undefined;
 document.querySelector('script[data-galaxiora-analytics]')?.remove();
}
export default function GrowthConsent(){
 const pathname=usePathname();
 const [choice,setChoice]=useState<Choice>(null);
 const [loaded,setLoaded]=useState(false);
 // Quiet consent: never place a banner or floating control over public content.
 // A visitor can opt in or withdraw from the privacy page at any time.
 useEffect(()=>{
  const syncChoice=()=>{
   try{
    const stored=localStorage.getItem(CONSENT_KEY);
    setChoice(stored==='accepted'||stored==='rejected'?stored:null);
   }catch{setChoice(null)}
  };
  syncChoice();
  setLoaded(true);
  window.addEventListener('galaxiora:analytics-choice',syncChoice);
  return()=>window.removeEventListener('galaxiora:analytics-choice',syncChoice);
 },[]);
 useEffect(()=>{
  if(!loaded||!enabled)return;
  const safe=safeGrowthPath(pathname||'');
  if(choice!=='accepted'||!safe){
   if(window.__galaxioraAnalyticsReady)stopAnalytics();
   return;
  }
  startAnalytics(safe);
  // StrictMode, hydration and repeated consent clicks must not duplicate a view.
  // Count every new public document route, including two articles sharing a
  // sanitized section URL; still avoid root vs canonical /en duplicates.
  const routeKey=pathname==='/'?'/en':pathname;
  if(window.__galaxioraLastPageView===routeKey)return;
  window.__galaxioraLastPageView=routeKey;
  const debug=new URLSearchParams(window.location.search).get('ga4_debug')==='1';
  window.gtag?.('event','page_view',{page_path:safe,page_location:'https://galaxiora.com'+safe,
   page_title:'Galaxiora',page_referrer:'',send_to:measurementId,...(debug?{debug_mode:true}:{})});
  // Count only public calculator landings; never send form state or URL queries.
  const viewedTool=safeGrowthToolForPath(pathname||'');
  if(viewedTool)window.gtag?.('event','public_tool_viewed',{tool:viewedTool,
   locale:pathname?.startsWith('/uk/')?'uk':'en',send_to:measurementId});
  // Explicit, allowlisted control event: only for a manually opted-in debug visit.
  if(debug)window.gtag?.('event','galaxiora_debug_ping',{send_to:measurementId,debug_mode:true});
 },[loaded,choice,pathname]);
 useEffect(()=>{
  if(!loaded||choice!=='accepted'||!enabled)return;
  const onClick=(e:MouseEvent)=>{
   const target=e.target;
   if(!(target instanceof Element))return;
   const a=target.closest('a[href]');
   if(!a||!(a instanceof HTMLAnchorElement)||a.origin!==window.location.origin)return;
   const from=safeGrowthPath(window.location.pathname);
   const to=safeGrowthPath(a.pathname);
   if(!from||!to||from===to)return;
   const toTool=/^\/(uk|en)\/(tarot|astrology\/jyotish|panchanga)$/.test(to);
   const fromArticle=/^\/(uk|en)\/(tarot\/cards|pedia(?:\/|$)|learn(?:\/|$)|eclipses\/2027)/.test(from);
   if(fromArticle&&toTool&&safeGrowthEvent('article_to_tool_click'))
    window.gtag?.('event','article_to_tool_click',{from_section:from.split('/')[2],tool:to.split('/').slice(2).join('_')});
  };
  const onGrowth=(event:Event)=>{
   const detail=(event as CustomEvent<{name?:string;tool?:string}>).detail;
   const name=detail?.name;
   if(!name||!safeGrowthEvent(name))return;
   if(!safeGrowthPath(window.location.pathname))return;
   if(safePublicToolEvent(name)){
    // A forged event or a future component change cannot attach arbitrary
    // tool identifiers or turn a private page into a trackable action.
    const currentTool=safeGrowthToolForPath(window.location.pathname);
    if(!currentTool||!safePublicTool(detail.tool||'')||detail.tool!==currentTool)return;
    window.gtag?.('event',name,{tool:currentTool,
     locale:window.location.pathname.startsWith('/uk/')?'uk':'en',send_to:measurementId});
    return;
   }
   window.gtag?.('event',name);
  };
  document.addEventListener('click',onClick);
  window.addEventListener('galaxiora:growth',onGrowth);
  return()=>{document.removeEventListener('click',onClick);window.removeEventListener('galaxiora:growth',onGrowth)};

 },[loaded,choice]);
 return null;
}
