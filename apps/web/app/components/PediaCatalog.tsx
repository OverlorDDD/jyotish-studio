'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,BookOpen,Search} from 'lucide-react';
import type {PediaCategory,PediaLocale,PediaText} from '../../lib/pedia-content';
import type {PublishedContent} from '../../lib/editorial-public';

export type PediaCatalogItem={slug:string;category:PediaCategory|'editorial';title:PediaText;summary:PediaText;minutes:number;kind:'lesson'|'article'|'editorial'};
type Props={locale:PediaLocale;items:PediaCatalogItem[];categories:{id:PediaCategory;title:PediaText;description:PediaText}[]};
export default function PediaCatalog({locale,items,categories}:Props){
 const uk=locale==='uk';
 const [query,setQuery]=useState(''),[category,setCategory]=useState<PediaCategory|'editorial'|'all'>('all');
 const [published,setPublished]=useState<PediaCatalogItem[]>([]);
 useEffect(()=>{
  let active=true;
  fetch('/api/v1/content?kind=ACADEMY',{credentials:'omit'})
   .then(r=>r.ok?r.json():[]).then((data:unknown)=>{
    if(!active||!Array.isArray(data))return;
    const extra=data.filter((x):x is PublishedContent=>
      Boolean(x)&&x.kind==='ACADEMY'&&typeof x.slug==='string'&&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug)&&
      typeof x.document?.title?.en==='string'&&typeof x.document?.title?.uk==='string'&&
      typeof x.document?.summary?.en==='string'&&typeof x.document?.summary?.uk==='string')
     .filter(x=>!items.some(item=>item.slug===x.slug))
     .slice(0,100).map(x=>({
      slug:x.slug,title:x.document.title,summary:x.document.summary,minutes:5,
      category:'editorial' as const,kind:'editorial' as const
     }));
    setPublished(extra);
   }).catch(()=>{});
  return ()=>{active=false};
 },[items]);
 const allItems=useMemo(()=>[...items,...published],[items,published]);
 const filtered=useMemo(()=>{
  const q=query.toLocaleLowerCase(locale==='uk'?'uk':'en').trim();
  return allItems.filter(item=>(category==='all'||item.category===category)&&(!q||
   [item.title[locale],item.summary[locale],categories.find(c=>c.id===item.category)?.title[locale]||'']
    .some(part=>part.toLocaleLowerCase(locale==='uk'?'uk':'en').includes(q))));
 },[query,category,allItems,categories,locale]);
 return <section className="as-wellness-section" id="pedia-explore" aria-label={uk?'Пошук матеріалів енциклопедії':'Search the encyclopedia'}>
  <div className="as-wellness-section-header"><span className="as-overline">GALAXIPEDIA · EXPLORE</span>
   <h2>{uk?'Вивчай за темою або запитанням':'Explore by topic or question'}</h2>
   <p>{uk?'Уроки й довідкові статті — один каталог, без реєстрації.':'Lessons and reference articles, together in one open catalog.'}</p>
  </div>
  <label htmlFor="pedia-search" style={{display:'block',marginBottom:10,fontWeight:600}}>{uk?'Пошук у GalaxiPedia':'Search GalaxiPedia'}</label>
  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,border:'1px solid #7896bb',borderRadius:14,padding:'10px 14px'}}>
   <Search size={19} aria-hidden="true"/><input id="pedia-search" type="search" value={query} onChange={e=>setQuery(e.target.value)}
    placeholder={uk?'Наприклад: тітхі, Місяць, Таро':'e.g. tithi, Moon, Tarot'}
    style={{width:'100%',minWidth:0,background:'transparent',color:'inherit',border:0,outlineOffset:4,fontSize:16}}/>
  </div>
  <div role="group" aria-label={uk?'Фільтр за темою':'Filter by topic'} style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:23}}>
   <button type="button" className="as-button as-button-secondary" aria-pressed={category==='all'}
    onClick={()=>setCategory('all')} style={{padding:'9px 14px',fontWeight:category==='all'?700:400}}>
    {uk?'Усі теми':'All topics'}</button>
   {published.length>0&&<button type="button" className="as-button as-button-secondary" aria-pressed={category==='editorial'}
    onClick={()=>setCategory('editorial')} style={{padding:'9px 14px',fontWeight:category==='editorial'?700:400}}>
    {uk?'Редакційні матеріали':'Editorial publications'}</button>}
   {categories.map(c=><button type="button" key={c.id} className="as-button as-button-secondary" aria-pressed={category===c.id}
    onClick={()=>setCategory(c.id)} style={{padding:'9px 14px',fontWeight:category===c.id?700:400}}>{c.title[locale]}</button>)}
  </div>
  <p role="status" aria-live="polite" style={{marginBottom:12}}>{uk?'Знайдено матеріалів: ':'Results: '}{filtered.length}</p>
  <div className="as-wellness-grid">
   {filtered.map(item=><Link key={item.slug} className="as-wellness-card as-lesson-card" data-lesson={item.kind==='lesson'?item.slug:undefined} data-published={item.kind==='editorial'?item.slug:undefined}
    href={'/'+locale+'/pedia/'+item.slug}>
    <span className="as-wellness-card-icon"><BookOpen size={25} aria-hidden="true"/></span>
    <span className="as-wellness-meta">{item.category==='editorial'?(uk?'Редакційна стаття':'Editorial article'):categories.find(c=>c.id===item.category)?.title[locale]} · {item.minutes} {uk?'хв':'min'} · {item.kind==='lesson'?(uk?'Урок':'Lesson'):item.kind==='editorial'?(uk?'Публікація':'Publication'):(uk?'Стаття':'Guide')}</span>
    <h3>{item.title[locale]}</h3><p>{item.summary[locale]}</p>
    <span className="as-wellness-card-link">{uk?'Читати матеріал':'Open article'} <ArrowUpRight size={16}/></span>
   </Link>)}
  </div>
  {filtered.length===0&&<p>{uk?'Нічого не знайдено. Спробуй інший термін або вибери «Усі теми».':'No matching content. Try another term or All topics.'}</p>}
 </section>;
}
