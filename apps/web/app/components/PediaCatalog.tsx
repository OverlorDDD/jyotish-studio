'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,BookOpen,Search,X} from 'lucide-react';
import type {PediaCategory,PediaLocale,PediaText} from '../../lib/pedia-content';

export type PediaCatalogItem={
 slug:string;category:PediaCategory|'editorial';title:PediaText;summary:PediaText;
 minutes:number;kind:'lesson'|'article'|'editorial'
};
type Category={id:PediaCategory;title:PediaText;description:PediaText};
type Filter=PediaCategory|'editorial'|'all';
type Props={locale:PediaLocale;items:PediaCatalogItem[];categories:Category[]};

export default function PediaCatalog({locale,items,categories}:Props){
 const uk=locale==='uk';
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState<Filter>('all');
 const [completed,setCompleted]=useState<Set<string>>(new Set());
 const inputRef=useRef<HTMLInputElement>(null);
 const resultsRef=useRef<HTMLDivElement>(null);
 const lessonCount=items.filter(item=>item.kind==='lesson').length;

 useEffect(()=>{
  try{
   const stored=JSON.parse(localStorage.getItem('galaxiora.pedia.progress.v1')||'{}') as Record<string,boolean>;
   setCompleted(new Set(Object.keys(stored).filter(slug=>stored[slug]===true)));
  }catch{setCompleted(new Set());}
 },[]);

 const filtered=useMemo(()=>{
  const normalized=query.trim().toLocaleLowerCase(uk?'uk':'en');
  return items.filter(item=>{
   if(category!=='all'&&item.category!==category)return false;
   if(!normalized)return true;
   const topic=categories.find(c=>c.id===item.category);
   // A Ukrainian visitor may type a common English Jyotish term, and vice versa.
   return [item.title.uk,item.title.en,item.summary.uk,item.summary.en,
    topic?.title.uk||'',topic?.title.en||'']
    .some(value=>value.toLocaleLowerCase(uk?'uk':'en').includes(normalized));
  });
 },[query,category,items,categories,uk]);

 const hasFilter=Boolean(query.trim())||category!=='all';
 const reset=()=>{
  setQuery('');
  setCategory('all');
  inputRef.current?.focus();
 };
 const search=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  resultsRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
 };

 return <section className="as-pedia-catalog" id="pedia-explore" aria-labelledby="pedia-library-heading">
  <div className="as-pedia-search-panel">
   <form role="search" onSubmit={search}>
    <label htmlFor="pedia-search">{uk?'Пошук у GalaxiPedia':'Search GalaxiPedia'}</label>
    <div className="as-pedia-search-controls">
     <div className="as-pedia-search-field">
      <Search size={23} aria-hidden="true"/>
      <input ref={inputRef} id="pedia-search" type="search" value={query}
       onChange={event=>setQuery(event.target.value)}
       placeholder={uk?'Наприклад: тітхі, Лагна, розклад Таро':'Try: tithi, ascendant, Tarot spread'}
       aria-controls="pedia-results" aria-describedby="pedia-search-hint" autoComplete="off"/>
      {query.length>0&&<button type="button" className="as-pedia-clear" onClick={()=>{setQuery('');inputRef.current?.focus();}}
       aria-label={uk?'Очистити пошук':'Clear search'} title={uk?'Очистити пошук':'Clear search'}>
       <X size={19} aria-hidden="true"/>
      </button>}
     </div>
     <button type="submit" className="as-pedia-search-submit">
      <Search size={17} aria-hidden="true"/>{uk?'Знайти':'Find articles'}
     </button>
    </div>
   </form>
   <p id="pedia-search-hint" className="as-pedia-search-hint">
    {uk?'Шукай серед усіх статей, уроків і редакційних матеріалів. Результати змінюються під час введення.':
     'Search all guides, lessons and published articles. Results update as you type.'}
   </p>
  </div>

  <div className="as-pedia-library-head">
   <div>
    <span className="as-overline">GALAXIPEDIA · {uk?'БІБЛІОТЕКА':'LIBRARY'}</span>
    <h2 id="pedia-library-heading">{uk?'Статті та уроки':'Guides and lessons'}</h2>
    <p>{uk?'Обери тему або відкрий матеріал із загального каталогу.':'Choose a subject or browse the complete library.'}</p>
   </div>
   <p className="as-pedia-progress">{uk?'Пройдено уроків у цьому браузері: ':'Lessons completed in this browser: '}
    <strong>{items.filter(item=>item.kind==='lesson'&&completed.has(item.slug)).length}/{lessonCount}</strong>
   </p>
  </div>

  <div className="as-pedia-filters" role="group" aria-label={uk?'Фільтр за темою':'Filter by topic'}>
   <button type="button" className="as-pedia-filter" aria-pressed={category==='all'}
    onClick={()=>setCategory('all')}>{uk?'Усі теми':'All topics'}</button>
   {categories.map(topic=><button type="button" key={topic.id} className="as-pedia-filter"
    aria-pressed={category===topic.id} onClick={()=>setCategory(topic.id)}>{topic.title[locale]}</button>)}
   {items.some(item=>item.category==='editorial')&&<button type="button" className="as-pedia-filter"
    aria-pressed={category==='editorial'} onClick={()=>setCategory('editorial')}>
    {uk?'Редакційні матеріали':'Editorial publications'}
   </button>}
  </div>

  <div className="as-pedia-results-head" ref={resultsRef} id="pedia-results-heading">
   <p role="status" aria-live="polite">{uk?'Знайдено матеріалів: ':'Results: '}<strong>{filtered.length}</strong></p>
   {hasFilter&&<button type="button" className="as-pedia-reset" onClick={reset}>
    <X size={16} aria-hidden="true"/>{uk?'Скинути фільтри':'Clear filters'}
   </button>}
  </div>

  <div className="as-pedia-result-grid" id="pedia-results" aria-labelledby="pedia-library-heading">
   {filtered.map(item=><Link key={item.slug}
    className="as-pedia-result-card as-wellness-card as-lesson-card"
    data-lesson={item.kind==='lesson'?item.slug:undefined}
    data-published={item.kind==='editorial'?item.slug:undefined}
    href={'/'+locale+'/pedia/'+item.slug}>
    <span className="as-pedia-result-meta"><BookOpen size={16} aria-hidden="true"/>
     {item.category==='editorial'?(uk?'Редакційні матеріали':'Editorial'):
       categories.find(x=>x.id===item.category)?.title[locale]}
     <span aria-hidden="true">·</span>{item.minutes} {uk?'хв':'min'}
     <span aria-hidden="true">·</span>
     {item.kind==='lesson'?(uk?'Урок':'Lesson'):item.kind==='editorial'?(uk?'Публікація':'Publication'):(uk?'Стаття':'Guide')}
    </span>
    <h3>{item.title[locale]}</h3>
    <p>{item.summary[locale]}</p>
    <span className="as-pedia-result-footer">
     <span>{uk?'Читати матеріал':'Read article'} <ArrowUpRight size={16} aria-hidden="true"/></span>
     {item.kind==='lesson'&&completed.has(item.slug)&&
      <span className="as-pedia-completed">{uk?'✓ Пройдено':'✓ Completed'}</span>}
    </span>
   </Link>)}
  </div>
  {filtered.length===0&&<div className="as-pedia-empty">
   <p>{uk?'За цим запитом нічого не знайдено. Спробуй інший термін або скинь фільтр.':
    'No matches. Try another term or clear the topic filter.'}</p>
   <button type="button" className="as-pedia-reset" onClick={reset}>{uk?'Показати всі матеріали':'Show all guides'}</button>
  </div>}
 </section>;
}
