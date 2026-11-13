'use client';
import {useState} from 'react';
import Link from 'next/link';
import {TAROT_GROUPS,TAROT_LIBRARY,type TarotGroup} from '../../../lib/tarot-meanings';
import {TarotFace} from './TarotArt';
import styles from './TarotHub.module.css';

/** All 78 card links are in the HTML for crawlers; the filter only changes what is shown. */
export default function TarotLibraryGrid({locale,heading=true}:{locale:'uk'|'en';heading?:boolean}){
 const uk=locale==='uk';
 const [group,setGroup]=useState<TarotGroup>('major');
 return <section className={styles.card} aria-labelledby="tarot-library-heading" data-testid="tarot-library">
  {heading&&<div className={styles.secHead}><h2 id="tarot-library-heading">{uk?'Значення 78 карт Таро':'Meanings of all 78 Tarot cards'}</h2>
   <span>{uk?'пряме й перевернуте значення, кохання, робота, так чи ні':'upright and reversed, love, work, yes or no'}</span></div>}
  <div className={styles.filters} role="tablist" aria-label={uk?'Масті':'Suits'}>
   {TAROT_GROUPS.map(g=><button key={g.id} type="button" role="tab" aria-selected={group===g.id} onClick={()=>setGroup(g.id)}>{g[locale]}</button>)}
  </div>
  <ul className={styles.library}>
   {TAROT_LIBRARY.map(card=><li key={card.id} hidden={card.group!==group}>
    <Link href={'/'+locale+'/tarot/cards/'+card.slug}>
     <TarotFace id={card.id} name={card.name[locale]} num={card.group==='major'?card.num:undefined} locale={locale} size="sm"/>
     <span>{card.name[locale]}</span>
    </Link>
   </li>)}
  </ul>
 </section>;
}
