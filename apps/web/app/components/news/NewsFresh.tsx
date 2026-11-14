'use client';
/** «N нових з вашого візиту»: compares story times with the previous visit.
 * Only a timestamp in this browser (localStorage); nothing is sent anywhere. */
import {useEffect,useState} from 'react';
import styles from './News.module.css';

const KEY='gx-news-last-visit',SESSION='gx-news-visit-base';
export default function NewsFresh({locale}:{locale:'uk'|'en'}){
 const [count,setCount]=useState<number|null>(null);
 useEffect(()=>{
  let base:number|null=null;
  try{
   const kept=sessionStorage.getItem(SESSION);
   if(kept!==null)base=Number(kept)||null;
   else{
    const prev=Number(localStorage.getItem(KEY))||0;
    sessionStorage.setItem(SESSION,String(prev));
    base=prev||null;
   }
   localStorage.setItem(KEY,String(Date.now()));
  }catch{return;}
  if(!base)return;
  let n=0;
  document.querySelectorAll<HTMLElement>('[data-story-id][data-published]').forEach(el=>{
   if(Date.parse(el.dataset.published||'')>base!){el.dataset.fresh='1';n++;}
  });
  setCount(n);
 },[]);
 if(!count)return null;
 return <span className={styles.fresh}>{locale==='uk'?count+' '+(count===1?'нова':count<5?'нові':'нових')+' з вашого візиту':count+' new since your last visit'}</span>;
}
