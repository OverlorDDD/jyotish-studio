'use client';
import {useEffect,useState} from 'react';
import {ExternalLink,Newspaper} from 'lucide-react';
import Link from 'next/link';
import type {PortalLocale} from '../../../lib/brand';
import {portalPath} from '../../../lib/brand';
import styles from './PersonalNewsPreview.module.css';
type Article={id:string;url:string;title:string;titleUk?:string|null;summaryUk?:string|null;summaryEn?:string|null;source:string;publishedAt:string;topic:string;imageUrl?:string|null;imageCredit?:string|null;imagePageUrl?:string|null;imageLicenseUrl?:string|null};
type Feed={items:Article[];personalized?:boolean};
const safeLink=(raw:string)=>{try{const url=new URL(raw);return ['https:','http:'].includes(url.protocol)?raw:null}catch{return null}};
export default function PersonalNewsPreview({locale,interests}:{locale:PortalLocale;interests:string[]}){
 const uk=locale==='uk';
 const [articles,setArticles]=useState<Article[]>([]),[status,setStatus]=useState<'loading'|'personal'|'world'|'empty'|'error'>('loading');
 useEffect(()=>{let active=true;const ctl=new AbortController();
  const url='/api/v1/news/feed?limit=4&page=1&sort=personal';
  fetch(url,{cache:'no-store',credentials:'same-origin',signal:ctl.signal})
   .then(async response=>{
    if(!response.ok)throw Error('news');
    return await response.json() as Feed;
   }).then(feed=>{if(active){setArticles(feed.items);setStatus(feed.items.length?(feed.personalized?'personal':'world'):'empty');}})
   .catch(()=>{if(active&&!ctl.signal.aborted)setStatus('error')});
  return()=>{active=false;ctl.abort()};
 },[interests.join(',')]);
 return <div className={styles.preview} data-testid="personal-news-preview">
  {status==='loading'&&<p role="status">{uk?'Шукаємо матеріали для тебе…':'Finding articles for you…'}</p>}
  {status==='error'&&<p role="status">{uk?'Стрічка тимчасово недоступна.':'News is temporarily unavailable.'}</p>}
  {status==='empty'&&<p>{uk?'За поточними інтересами поки немає статей.':'No articles for these interests yet.'}</p>}
  {articles.length>0&&<><small className={styles.context}>{status==='personal'?(uk?'Добірка за твоїми інтересами':'Based on your interests'):
    (uk?'Останні матеріали зі світу GalaxiNews':'Highlights from GalaxiNews')}</small>
   <div className={styles.list}>{articles.map(article=>{
    const url=safeLink(article.url),image=article.imageUrl?safeLink(article.imageUrl):null;
    return <article className={styles.story} key={article.id}>
     <small>{article.source} · {new Date(article.publishedAt).toLocaleDateString(uk?'uk-UA':'en-US')}</small>
     <div className={styles.storyContent}>
      {image?<div className={styles.thumbnailWrap}>
        <img src={image} alt="" className={styles.thumbnail} loading="lazy" referrerPolicy="no-referrer"/>
        {article.imagePageUrl?.startsWith('https://commons.wikimedia.org/')&&article.imageCredit&&
         <a className={styles.credit} href={article.imagePageUrl} target="_blank" rel="noopener noreferrer" title={article.imageCredit}>
          {uk?'Фото і ліцензія':'Photo and license'}
         </a>}
        {article.imageLicenseUrl?.startsWith('https://creativecommons.org/')&&
         <a className={styles.credit} href={article.imageLicenseUrl} target="_blank" rel="noopener noreferrer">
          {uk?'Умови ліцензії':'License terms'}
         </a>}
       </div>:
       <div className={styles.thumbnailArt} aria-label={uk?'Ілюстрація Galaxiora':'Galaxiora original illustration'}>
        <span aria-hidden="true">{article.topic==='yoga'?'ॐ':article.topic==='tarot'?'✦':article.topic==='astronomy'?'☽':'✧'}</span>
       </div>}
      <div className={styles.storyText}>
     {url?<a href={url} target="_blank" rel="noopener noreferrer">
       {uk?(article.titleUk||article.title):article.title} <ExternalLink size={14} aria-hidden="true"/>
      </a>:<strong>{uk?(article.titleUk||article.title):article.title}</strong>}
     {(uk?article.summaryUk:article.summaryEn)&&<p>{uk?article.summaryUk:article.summaryEn}</p>}
      </div></div>
    </article>;
   })}</div></>}
  <Link href={portalPath(locale,'news')} className={styles.more}>
   <Newspaper size={15}/>{uk?'Усі новини GalaxiNews':'All GalaxiNews stories'} <ExternalLink size={14}/>
  </Link>
 </div>;
}
