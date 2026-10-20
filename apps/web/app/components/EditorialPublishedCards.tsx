'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,BookOpen,Leaf} from 'lucide-react';
import type {PublishedContent,Locale} from '../../lib/editorial-public';
export default function EditorialPublishedCards({kind,locale}:{kind:'ACADEMY'|'YOGA';locale:Locale}){
 const [items,setItems]=useState<PublishedContent[]>([]);
 useEffect(()=>{
  let alive=true;
  fetch('/api/v1/content?kind='+kind,{credentials:'omit'})
   .then(r=>r.ok?r.json():[])
   .then(result=>{if(alive&&Array.isArray(result))setItems(result.filter(x=>x&&x.kind===kind&&x.document?.title?.[locale]));})
   .catch(()=>{});
  return ()=>{alive=false};
 },[kind,locale]);
 if(!items.length)return null;
 const uk=locale==='uk';
 return <section className="as-wellness-section as-editorial-published" aria-label={uk?'Нові публікації':'New publications'}>
  <div className="as-wellness-section-header"><span className="as-overline">{uk?'РЕДАКЦІЙНІ ПУБЛІКАЦІЇ':'EDITORIAL RELEASES'}</span>
   <h2>{uk?'Нові матеріали Galaxiora':'New from Galaxiora'}</h2></div>
  <div className="as-wellness-grid">{items.map(entry=><Link className="as-wellness-card" key={entry.slug}
   data-published={entry.slug} href={'/'+locale+'/'+(kind==='ACADEMY'?'learn':'yoga')+'/'+entry.slug}>
   <span className="as-wellness-card-icon">{kind==='ACADEMY'?<BookOpen size={26}/>:<Leaf size={26}/>}</span>
   <span className="as-wellness-meta">{entry.topic}</span>
   <h3>{entry.document.title[locale]}</h3><p>{entry.document.summary[locale]}</p>
   <span className="as-wellness-card-link">{uk?'Відкрити матеріал':'Read more'} <ArrowUpRight size={16}/></span>
  </Link>)}</div>
 </section>;
}
