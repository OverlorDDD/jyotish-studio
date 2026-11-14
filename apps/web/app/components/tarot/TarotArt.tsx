import {TAROT_DECK_BACK,tarotDeckArt} from '../../../lib/tarot-art';
import styles from './TarotArt.module.css';

/** Galaxiora card face: the card's own art from Galaxiora's original deck (night sky in a torana arch,
 * traditional symbols in gold line), with the localized name on a bar below the picture.
 * `num` is accepted for older callers; the art carries its own numeral. */
export function TarotFace({id,name,reversed=false,locale,size='md',label=true}:{id:string;name:string;num?:string;reversed?:boolean;
 locale:'uk'|'en';size?:'sm'|'md'|'lg';label?:boolean}){
 const src=tarotDeckArt(id);
 return <span className={styles.face} data-size={size} data-reversed={reversed?'1':undefined}>
  <span className={styles.pic}>{src?<img src={src} alt={name+(reversed?(locale==='uk'?' — перевернута':' — reversed'):'')}
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
