import {TAROT_DECK_BACK,tarotDeckArt} from '../../../lib/tarot-art';
import styles from './TarotArt.module.css';

/** Galaxiora card face: the classic Rider–Waite–Smith drawing re-painted in the site palette, with the
 * localized name on a bar below the picture. `num` is accepted for older callers; the art has its numeral. */
const SIZES={sm:'160px',md:'(max-width: 600px) 45vw, 220px',lg:'(max-width: 600px) 60vw, 280px'} as const;
export function TarotFace({id,name,reversed=false,locale,size='md',label=true}:{id:string;name:string;num?:string;reversed?:boolean;
 locale:'uk'|'en';size?:'sm'|'md'|'lg';label?:boolean}){
 const art=tarotDeckArt(id);
 return <span className={styles.face} data-size={size} data-reversed={reversed?'1':undefined}>
  <span className={styles.pic}>{art?<img src={art.src} srcSet={art.srcSet} sizes={SIZES[size]} alt={name+(reversed?(locale==='uk'?' — перевернута':' — reversed'):'')}
   loading="lazy" decoding="async" draggable={false}/>:<span className={styles.missing}>{name}</span>}</span>
  {label&&<span className={styles.name}><span className={styles.nameText}>{name}</span></span>}
 </span>;
}

/** Card back of the Galaxiora deck; same picture box and bar as the face, so a turned card keeps its size. */
export function TarotBack({size='md'}:{size?:'sm'|'md'|'lg'}){
 return <span className={styles.back} data-size={size} aria-hidden="true">
  <span className={styles.pic}><img src={TAROT_DECK_BACK} alt="" decoding="async" draggable={false}/></span>
  <span className={styles.name}><span className={styles.ornament}>✦</span></span>
 </span>;
}
