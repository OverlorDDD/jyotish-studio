'use client';
/** Live front page: the server checks sources every 15 minutes; while the page
 * is open we look for newer stories every 5 minutes and offer a refresh
 * instead of reshuffling what the reader is looking at. */
import {useEffect,useState} from 'react';
import styles from './News.module.css';

export default function NewsLive({locale,topic,newestAt}:{locale:'uk'|'en';topic?:string;newestAt?:string|null}){
 const [fresh,setFresh]=useState(0);
 useEffect(()=>{
  const since=Date.parse(newestAt||'');
  if(!Number.isFinite(since))return;
  let stop=false;
  const check=async()=>{
   if(document.visibilityState!=='visible')return;
   try{
    const q=new URLSearchParams({lang:locale,limit:'12',sort:'latest',scope:'portal'});
    if(topic)q.set('topic',topic);
    const r=await fetch('/api/v1/news/feed?'+q.toString(),{cache:'no-store'});
    if(!r.ok)return;
    const data=await r.json() as {items?:{publishedAt:string}[]};
    const n=(data.items||[]).filter(i=>Date.parse(i.publishedAt)>since).length;
    if(!stop)setFresh(n);
   }catch{/* offline: try again next time */}
  };
  const timer=setInterval(check,5*60*1000);
  document.addEventListener('visibilitychange',check);
  return()=>{stop=true;clearInterval(timer);document.removeEventListener('visibilitychange',check);};
 },[locale,topic,newestAt]);
 if(!fresh)return null;
 return <button type="button" className={styles.livePill} onClick={()=>window.location.reload()} aria-live="polite">
  {locale==='uk'?(fresh===1?'З’явилася 1 нова новина':'З’явилися нові новини: '+fresh)+' — оновити':(fresh===1?'1 new story':fresh+' new stories')+' — refresh'}
 </button>;
}
