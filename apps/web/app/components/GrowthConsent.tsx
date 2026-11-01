'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {safeGrowthEvent,safeGrowthPath} from '../../lib/growth-metrics';

const CONSENT_KEY='galaxiora-analytics-choice-v1';
const measurementId=process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim()||'';
const enabled=/^G-[A-Z0-9]{6,16}$/.test(measurementId);
type Choice='accepted'|'rejected'|null;
type Gtag=(command:string,...args:unknown[])=>void;
declare global {interface Window {dataLayer?:unknown[][];gtag?:Gtag;__galaxioraAnalyticsReady?:boolean}}
function startAnalytics(){
 if(typeof window==='undefined'||!enabled||window.__galaxioraAnalyticsReady)return;
 window.__galaxioraAnalyticsReady=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=(...args:unknown[])=>{window.dataLayer?.push(args)};
 window.gtag('js',new Date());
 window.gtag('consent','default',{
  analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'
 });
 window.gtag('config',measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
 const script=document.createElement('script');
 script.async=true;
 script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);
 script.dataset.galaxioraAnalytics='true';
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
 document.querySelector('script[data-galaxiora-analytics]')?.remove();
}
export default function GrowthConsent(){
 const pathname=usePathname();
 const [choice,setChoice]=useState<Choice>(null);
 const [loaded,setLoaded]=useState(false);
 const [open,setOpen]=useState(false);
 const uk=pathname?.startsWith('/uk')??false;
 useEffect(()=>{
  try{
   const stored=localStorage.getItem(CONSENT_KEY);
   setChoice(stored==='accepted'||stored==='rejected'?stored:null);
  }catch{setChoice(null)}
  setLoaded(true);
 },[]);
 useEffect(()=>{
  if(!loaded||!enabled)return;
  const safe=safeGrowthPath(pathname||'');
  if(choice!=='accepted'||!safe){
   if(window.__galaxioraAnalyticsReady)stopAnalytics();
   return;
  }
  startAnalytics();
  window.gtag?.('event','page_view',{page_path:safe,page_location:'https://galaxiora.com'+safe,page_title:'Galaxiora',send_to:measurementId});
 },[loaded,choice,pathname]);
 useEffect(()=>{
  if(!loaded||choice!=='accepted'||!enabled)return;
  const onClick=(e:MouseEvent)=>{
   const target=e.target;
   if(!(target instanceof Element))return;
   const a=target.closest('a[href]');
   if(!a||!(a instanceof HTMLAnchorElement))return;
   const from=safeGrowthPath(window.location.pathname);
   const to=safeGrowthPath(a.pathname);
   if(!from||!to||from===to)return;
   const toTool=/^\/(uk|en)\/(tarot|astrology\/jyotish|panchanga)$/.test(to);
   const fromArticle=/^\/(uk|en)\/(tarot\/cards|learn|eclipses\/2027)/.test(from);
   if(fromArticle&&toTool&&safeGrowthEvent('article_to_tool_click'))
    window.gtag?.('event','article_to_tool_click',{from_section:from.split('/')[2],tool:to.split('/').slice(2).join('_')});
  };
  document.addEventListener('click',onClick);
  return()=>document.removeEventListener('click',onClick);
 },[loaded,choice]);
 if(!enabled||!loaded)return null;
 const decide=(value:'accepted'|'rejected')=>{
  try{localStorage.setItem(CONSENT_KEY,value)}catch{}
  setChoice(value);setOpen(false);
  if(value==='rejected')stopAnalytics();
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
  {open&&choice!==null&&<aside role="dialog" aria-label={uk?'Змінити згоду':'Change analytics consent'} style={{position:'fixed',bottom:52,right:12,zIndex:10001,background:'#161b30',color:'#fff',borderRadius:10,padding:16}}>
   <p>{uk?'Аналітика необов’язкова. Зміни рішення:':'Analytics is optional. Change your choice:'}</p>
   <button type="button" onClick={()=>decide('rejected')}>{uk?'Відкликати згоду':'Withdraw consent'}</button>{' '}
   <button type="button" onClick={()=>decide('accepted')}>{uk?'Дозволити':'Allow'}</button>
  </aside>}
 </>;
}
