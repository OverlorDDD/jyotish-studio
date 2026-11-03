'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {safeGrowthCampaign,safeGrowthEvent,safeGrowthPath} from '../../lib/growth-metrics';

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
 const [open,setOpen]=useState(false);
 const [tagState,setTagState]=useState<'off'|'loading'|'loaded'|'blocked'|'request_observed'>('off');
 const uk=pathname?.startsWith('/uk')??false;
 useEffect(()=>{
  const onStatus=(e:Event)=>setTagState((e as CustomEvent<'loading'|'loaded'|'blocked'|'request_observed'>).detail);
  window.addEventListener('galaxiora:tag-status',onStatus);
  setTagState(window.__galaxioraTagStatus||'off');
  try{
   const stored=localStorage.getItem(CONSENT_KEY);
   setChoice(stored==='accepted'||stored==='rejected'?stored:null);
  }catch{setChoice(null)}
  setLoaded(true);
  return()=>window.removeEventListener('galaxiora:tag-status',onStatus);
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
   const fromArticle=/^\/(uk|en)\/(tarot\/cards|learn|eclipses\/2027)/.test(from);
   if(fromArticle&&toTool&&safeGrowthEvent('article_to_tool_click'))
    window.gtag?.('event','article_to_tool_click',{from_section:from.split('/')[2],tool:to.split('/').slice(2).join('_')});
  };
  const onGrowth=(event:Event)=>{
   const detail=(event as CustomEvent<{name?:string}>).detail;
   if(!detail||!safeGrowthEvent(detail.name||''))return;
   if(!safeGrowthPath(window.location.pathname))return;
   window.gtag?.('event',detail.name);
  };
  document.addEventListener('click',onClick);
  window.addEventListener('galaxiora:growth',onGrowth);
  return()=>{document.removeEventListener('click',onClick);window.removeEventListener('galaxiora:growth',onGrowth)};

 },[loaded,choice]);
 if(!enabled||!loaded)return null;
 const decide=(value:'accepted'|'rejected')=>{
  try{localStorage.setItem(CONSENT_KEY,value)}catch{}
  setChoice(value);setOpen(false);
  if(value==='rejected'){
   stopAnalytics();
   // Removing a script tag does not unload executing gtag.js. Reload once on
   // withdrawal so no prior analytics runtime remains in this document.
   if(choice==='accepted')window.location.reload();
  }
 };
 return <>
  {choice===null&&<aside role="dialog" aria-label={uk?'Аналітика відвідувань':'Visitor analytics'} style={{position:'fixed',bottom:16,left:16,right:16,maxWidth:540,margin:'auto',zIndex:9999,background:'#161b30',color:'#fff',border:'1px solid #a08b67',borderRadius:14,padding:20,boxShadow:'0 12px 35px #0007'}}>
   <strong>{uk?'Допоможи покращити Galaxiora':'Help improve Galaxiora'}</strong>
   <p>{uk?'Лише за твоєю згодою ми вимірюємо відвідування публічних сторінок і переходи до інструментів через Google Analytics. Дані народження, тексти запитань і особисті записи не надсилаємо. Відмовитися можна без обмежень.':'Only with your consent, Google Analytics measures public page views and navigation to tools. Birth details, questions and private notes are never sent. You may decline without losing features.'}</p>
   <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    <button type="button" onClick={()=>decide('rejected')}>{uk?'Відхилити':'Reject'}</button>
    <button type="button" onClick={()=>decide('accepted')}>{uk?'Дозволити аналітику':'Allow analytics'}</button>
    <a href={'/'+(uk?'uk':'en')+'/privacy'} style={{color:'#ffe4ad'}}>{uk?'Конфіденційність':'Privacy'}</a>
   </div>
  </aside>}
  {choice!==null&&<div style={{position:'fixed',bottom:12,right:12,zIndex:100}}>
   <button type="button" style={{fontSize:12,opacity:.85}} onClick={()=>setOpen(v=>!v)}>{uk?'Налаштування аналітики':'Analytics settings'}</button>
  </div>}
  {open&&choice!==null&&<aside role="dialog" aria-label={uk?'Змінити згоду':'Change analytics consent'} style={{position:'fixed',bottom:52,right:12,zIndex:10001,background:'#161b30',color:'#fff',borderRadius:10,padding:16,maxWidth:320}}>
   <p>{uk?'Аналітика необов’язкова. Зміни рішення:':'Analytics is optional. Change your choice:'}</p>
   {choice==='accepted'&&<p role="status" data-testid="analytics-tag-status" style={{fontSize:12}}>{uk?'Стан Google-тега: ':'Google tag status: '}{tagState==='request_observed'?(uk?'запит g/collect виявлено (прийняття GA4 перевіряй у DebugView)':'g/collect request observed (verify receipt in GA4 DebugView)'):tagState==='loaded'?(uk?'скрипт завантажено (запит g/collect ще не підтверджений)':'script loaded (g/collect request not yet observed)'):tagState==='blocked'?(uk?'завантаження заблоковане або не вдалося':'blocked or failed to load'):(uk?'очікується завантаження':'waiting for script')}</p>}
   <button type="button" onClick={()=>decide('rejected')}>{uk?'Відкликати згоду':'Withdraw consent'}</button>{' '}
   <button type="button" onClick={()=>decide('accepted')}>{uk?'Дозволити':'Allow'}</button>
  </aside>}
 </>;
}
