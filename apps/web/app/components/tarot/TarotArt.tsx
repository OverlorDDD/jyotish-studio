'use client';
import {useEffect,useRef,useState} from 'react';
import {tarotArtLocal,tarotArtRemote} from '../../../lib/tarot-art';
import styles from './TarotArt.module.css';

/** Galaxiora card face: the whole classic Rider–Waite–Smith image (public domain, with its own
 * numeral and printed title) in the site's navy-and-gold duotone, inside a double gold frame,
 * with the localized name on a bar BELOW the picture so nothing on the card is covered or cropped.
 * `num` is accepted for older callers; the printed card already shows its numeral. */
export function TarotFace({id,name,reversed=false,locale,size='md'}:{id:string;name:string;num?:string;reversed?:boolean;
 locale:'uk'|'en';size?:'sm'|'md'|'lg'}){
 const local=tarotArtLocal(id),remote=tarotArtRemote(id);
 const [source,setSource]=useState<string|null>(local);
 const img=useRef<HTMLImageElement>(null);
 useEffect(()=>setSource(local),[local]);
 // Server-rendered images can fail before React attaches onError (e.g. the local copy is not
 // deployed): detect that after hydration and switch to the next source.
 useEffect(()=>{const el=img.current;
  if(el&&el.complete&&el.naturalWidth===0)setSource(current=>current===local?remote:null);},[source,local,remote]);
 return <span className={styles.face} data-size={size} data-reversed={reversed?'1':undefined}>
  <svg className={styles.defs} aria-hidden="true" focusable="false"><filter id="gx-tarot-duo" colorInterpolationFilters="sRGB">
   <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
   <feComponentTransfer><feFuncR type="table" tableValues=".06 .96"/><feFuncG type="table" tableValues=".1 .87"/><feFuncB type="table" tableValues=".17 .69"/></feComponentTransfer>
  </filter></svg>
  <span className={styles.inner}>
   <span className={styles.pic}>{source?<img ref={img} src={source} alt={name+(reversed?(locale==='uk'?' — перевернута':' — reversed'):'')} loading="lazy" decoding="async" draggable={false}
    onError={()=>setSource(current=>current===local?remote:null)}/>:<span className={styles.missing}>{name}</span>}</span>
   <span className={styles.name}><span className={styles.nameText}>{name}</span></span>
  </span>
 </span>;
}
/** Card back: navy with a gold geometric star; same frame, picture box and bar as the face,
 * so a card keeps exactly the same size when it is turned over. */
export function TarotBack({size='md'}:{size?:'sm'|'md'|'lg'}){
 return <span className={styles.back} data-size={size} aria-hidden="true"><span className={styles.inner}><span className={styles.pic}>
  <svg viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet"><g fill="none" stroke="#e8c08a" strokeWidth=".6">
   <rect x="5" y="5" width="90" height="150" rx="6"/><rect x="9" y="9" width="82" height="142" rx="4" strokeOpacity=".5"/>
   <circle cx="50" cy="80" r="26"/><circle cx="50" cy="80" r="18" strokeOpacity=".6"/><circle cx="50" cy="80" r="34" strokeOpacity=".35"/>
   <path d="M50 46v68M16 80h68M26 56l48 48M74 56l-48 48" strokeOpacity=".35"/>
   <path d="M50 62l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#e8c08a" fillOpacity=".85" stroke="none"/>
   <path d="M50 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM50 128l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e8c08a" stroke="none"/></g></svg>
 </span><span className={styles.name}><span className={styles.ornament}>✦</span></span></span></span>;
}
