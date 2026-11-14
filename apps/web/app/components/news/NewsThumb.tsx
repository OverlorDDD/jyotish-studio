'use client';
/** Small story picture. Publisher previews are shown only at thumbnail size,
 * credited and linked through the story; a failed or missing picture falls
 * back to Galaxiora's own topic artwork, so a card is never blank. */
import {useState} from 'react';
import {newsFallbackArtwork,type NewsArtworkTopic} from '../news-fallback-artwork';
import styles from './News.module.css';

export default function NewsThumb({src,topic,seed,credit,className,locale='uk'}:{src?:string|null;topic:string;seed:string;credit?:string|null;className?:string;locale?:'uk'|'en'}){
 const [failed,setFailed]=useState(false);
 const show=Boolean(src)&&!failed;
 return <span className={(className||styles.thumb)} aria-hidden={show?undefined:true}>
  <img src={newsFallbackArtwork(topic as NewsArtworkTopic,seed)} alt="" loading="lazy" data-image-role="fallback"/>
  {show&&<img src={src!} alt="" loading="lazy" referrerPolicy="no-referrer" decoding="async"
   data-image-role="publisher-preview" onError={()=>setFailed(true)}/>}
  {show&&credit&&<small>{(locale==='uk'?'Фото: ':'Photo: ')+credit}</small>}
 </span>;
}
