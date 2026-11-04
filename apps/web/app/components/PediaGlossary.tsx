'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {PediaLocale} from '../../lib/pedia-content';

type Entry={id:string;label:string;definition:string;forms:string[];related?:{slug:string;title:string}};
export default function PediaGlossary({locale,entries}:{locale:PediaLocale;entries:Entry[]}){
 const uk=locale==='uk';
 const [query,setQuery]=useState('');
 const matches=useMemo(()=>{
  const q=query.toLocaleLowerCase(uk?'uk':'en').trim();
  return entries.filter(e=>!q||[e.label,e.definition,...e.forms].some(t=>t.toLocaleLowerCase(uk?'uk':'en').includes(q)));
 },[query,entries,uk]);
 return <section aria-label={uk?'Словник GalaxiPedia':'GalaxiPedia glossary'}>
  <label htmlFor="pedia-glossary-search" style={{display:'block',marginBottom:10,fontWeight:600}}>{uk?'Пошук визначень':'Find a term'}</label>
  <input id="pedia-glossary-search" type="search" value={query} onChange={e=>setQuery(e.target.value)}
   placeholder={uk?'Тітхі, Лагна, даша…':'Tithi, Lagna, dasha…'} style={{display:'block',width:'100%',padding:'13px 16px',fontSize:16,
    color:'inherit',background:'transparent',border:'1px solid #7896bb',borderRadius:12,marginBottom:20}}/>
  <p role="status" aria-live="polite">{uk?'Знайдено термінів: ':'Terms found: '}{matches.length}</p>
  <div className="as-lesson-sections">
   {matches.map(entry=><section className="as-lesson-section" id={'term-'+entry.id} key={entry.id}>
    <h2 style={{marginBottom:10}}>{entry.label}</h2><p>{entry.definition}</p>
    {entry.related&&<p><Link href={'/'+locale+'/pedia/'+entry.related.slug}>
     {uk?'Докладніше: ':'Read more: '}{entry.related.title}</Link></p>}
   </section>)}
  </div>
  {matches.length===0&&<p>{uk?'Спробуй інше написання терміна.':'Try an alternate spelling.'}</p>}
 </section>;
}
