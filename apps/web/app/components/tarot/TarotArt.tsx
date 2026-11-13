'use client';
import {useEffect,useState} from 'react';
import {tarotArtLocal,tarotArtRemote} from '../../../lib/tarot-art';
import styles from './TarotArt.module.css';

const ROMAN:Record<string,string>={'1':'I','2':'II','3':'III','4':'IV','5':'V','6':'VI','7':'VII','8':'VIII','9':'IX','10':'X'};
/** Galaxiora card face: classic Rider–Waite–Smith image (public domain) in the site's
 * navy-and-gold duotone, inside a double gold frame with numeral and name. */
export function TarotFace({id,name,num,reversed=false,locale,size='md'}:{id:string;name:string;num?:string;reversed?:boolean;
 locale:'uk'|'en';size?:'sm'|'md'|'lg'}){
 const local=tarotArtLocal(id),remote=tarotArtRemote(id);
 const [source,setSource]=useState<string|null>(local);
 useEffect(()=>setSource(local),[local]);
 const numeral=num?ROMAN[num]??(/^[0IVXL]+$/.test(num)?num:''):'';
 return <span className={styles.face} data-size={size} data-reversed={reversed?'1':undefined}>
  <svg className={styles.defs} aria-hidden="true" focusable="false"><filter id="gx-tarot-duo" colorInterpolationFilters="sRGB">
   <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
   <feComponentTransfer><feFuncR type="table" tableValues=".06 .96"/><feFuncG type="table" tableValues=".1 .87"/><feFuncB type="table" tableValues=".17 .69"/></feComponentTransfer>
  </filter></svg>
  <span className={styles.inner}>
   {numeral&&<span className={styles.num}>{numeral}</span>}
   {source?<img src={source} alt={name+(reversed?(locale==='uk'?' — перевернута':' — reversed'):'')} loading="lazy" decoding="async" draggable={false}
    onError={()=>setSource(current=>current===local?remote:null)}/>:<span className={styles.missing}>{name}</span>}
   <span className={styles.name}>{name}</span>
  </span>
 </span>;
}
/** Card back: navy with a gold geometric star. */
export function TarotBack({size='md'}:{size?:'sm'|'md'|'lg'}){
 return <span className={styles.back} data-size={size} aria-hidden="true">
  <svg viewBox="0 0 100 160"><g fill="none" stroke="#e8c08a" strokeWidth=".6">
   <rect x="5" y="5" width="90" height="150" rx="6"/><rect x="9" y="9" width="82" height="142" rx="4" strokeOpacity=".5"/>
   <circle cx="50" cy="80" r="26"/><circle cx="50" cy="80" r="18" strokeOpacity=".6"/><circle cx="50" cy="80" r="34" strokeOpacity=".35"/>
   <path d="M50 46v68M16 80h68M26 56l48 48M74 56l-48 48" strokeOpacity=".35"/>
   <path d="M50 62l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#e8c08a" fillOpacity=".85" stroke="none"/>
   <path d="M50 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM50 128l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e8c08a" stroke="none"/></g></svg>
 </span>;
}
