'use client';
/** «Показати ще»: appends the next pages from the same public feed. */
import {useState} from 'react';
import NewsRow from './NewsRow';
import styles from './News.module.css';
import type {NewsItem,NewsLocale,NewsTopic} from '../../../lib/news-public';

export default function NewsMore({locale,topic,startPage,pageSize,seen,total}:{locale:NewsLocale;topic?:NewsTopic;startPage:number;pageSize:number;seen:string[];total:number}){
 const [items,setItems]=useState<NewsItem[]>([]);
 const [page,setPage]=useState(startPage);
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(startPage*pageSize>=total);
 const [error,setError]=useState(false);
 const load=async()=>{
  setBusy(true);setError(false);
  try{
   const q=new URLSearchParams({lang:locale,limit:String(pageSize),page:String(page+1),sort:'latest',scope:'portal'});
   if(topic)q.set('topic',topic);
   const r=await fetch('/api/v1/news/feed?'+q.toString(),{cache:'no-store'});
   if(!r.ok)throw Error();
   const data=await r.json() as {items:NewsItem[];total:number};
   const known=new Set([...seen,...items.map(i=>i.id)]);
   setItems(old=>[...old,...data.items.filter(i=>!known.has(i.id))]);
   setPage(page+1);
   if((page+1)*pageSize>=data.total||!data.items.length||page+1>=20)setDone(true);
  }catch{setError(true);}
  finally{setBusy(false);}
 };
 const now=Date.now();
 return <>
  {items.length>0&&<ul className={styles.list}>{items.map(i=><NewsRow key={i.id} item={i} locale={locale} now={now}/>)}</ul>}
  {error&&<p className={styles.meta} role="status">{locale==='uk'?'Не вдалося завантажити. Спробуйте ще раз.':'Could not load more. Please try again.'}</p>}
  {!done&&<button type="button" className={styles.more} onClick={load} disabled={busy}>
   {busy?(locale==='uk'?'Завантажуємо…':'Loading…'):(locale==='uk'?'Показати ще':'Show more')}</button>}
 </>;
}
