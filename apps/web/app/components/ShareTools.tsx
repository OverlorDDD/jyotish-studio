'use client';
import {useState} from 'react';
import type {PortalLocale} from '../../lib/brand';

/** On-device sharing only: no analytics, tokens, birth details or user identifiers. */
export default function ShareTools({locale,title,path}:{locale:PortalLocale;title:string;path:string}){
 const [message,setMessage]=useState('');
 const uk=locale==='uk';
 const share=async()=>{
  const safePath=/^\/(uk|en)\/[a-z0-9/-]+$/.test(path)?path:'/'+locale;
  const url='https://galaxiora.com'+safePath;
  try{
   if(typeof navigator!=='undefined'&&typeof navigator.share==='function'){
    await navigator.share({title,url});setMessage('');return;
   }
   if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(url);
    setMessage(uk?'Посилання скопійовано':'Link copied');return;
   }
   setMessage(url);
  }catch(e){
   if(e instanceof Error&&e.name==='AbortError')return;
   setMessage(url);
  }
 };
 return <div aria-label={uk?'Поділитися матеріалом':'Share this resource'} style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',margin:'22px 0'}}>
  <button type="button" className="as-button as-button-secondary" onClick={share}>
   {uk?'Поділитися матеріалом':'Share this resource'} ↗
  </button>
  {message&&<span role="status" aria-live="polite" style={{overflowWrap:'anywhere'}}>{message}</span>}
 </div>;
}
