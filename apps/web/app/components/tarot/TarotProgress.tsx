'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {tarotCardById,TAROT_LIBRARY} from '../../../lib/tarot-meanings';
import {daysUk,favouriteCard,localDay,readJourney,streak,weekDays,type TarotJourney} from '../../../lib/tarot-journey';
import styles from './TarotHub.module.css';

export default function TarotProgress({locale}:{locale:'uk'|'en'}){
 const uk=locale==='uk';
 const [j,setJ]=useState<TarotJourney|null>(null);
 useEffect(()=>{
  setJ(readJourney());
  const sync=()=>setJ(readJourney());
  window.addEventListener('galaxiora:tarot-journey',sync);
  return()=>window.removeEventListener('galaxiora:tarot-journey',sync);
 },[]);
 if(!j)return null;
 const today=localDay(),week=new Set(weekDays(today)),thisWeek=j.days.filter(d=>week.has(d)).length;
 const met=Object.keys(j.seen).length,fav=favouriteCard(j),favCard=fav?tarotCardById(fav):null;
 const run=streak(j.days,today);
 return <section className={styles.card} aria-labelledby="tarot-progress-heading" data-testid="tarot-progress">
  <div className={styles.secHead}><h2 id="tarot-progress-heading">{uk?'Ваш шлях з Таро':'Your Tarot journey'}</h2>
   <span data-testid="tarot-progress-storage">{j.profile?(uk?'збережено у вашому профілі — доступно на будь-якому пристрої':'saved in your profile — available on any device')
    :(uk?'поки зберігається лише в цьому браузері':'kept only in this browser for now')}</span></div>
  <div className={styles.stats}>
   <div className={styles.stat}><b>{run}</b><p>{uk?daysUk(run)+' поспіль з картою дня':(run===1?'day':'days')+' in a row with a daily card'}<br/>{uk?'цього тижня: ':'this week: '}{thisWeek}/7</p></div>
   <div className={styles.stat}><b>{met} {uk?'з':'of'} {TAROT_LIBRARY.length}</b><p>{uk?'карт ви вже зустріли':'cards you have met'}</p>
    <span className={styles.bar}><i style={{width:Math.round(met/TAROT_LIBRARY.length*100)+'%'}}/></span></div>
   <div className={styles.stat}>{favCard?<><b>{favCard.name[locale]}</b><p>{uk?'ваша найчастіша карта: ':'your most frequent card: '}{favCard[locale].k.join(', ')}.{' '}
    <Link href={'/'+locale+'/tarot/cards/'+favCard.slug}>{uk?'Що вона означає':'What it means'}</Link></p></>
    :<><b>—</b><p>{uk?'Тут з’явиться ваша найчастіша карта.':'Your most frequent card will appear here.'}</p></>}</div>
  </div>
  {!j.profile&&<p className={styles.small}>{uk?'Увійдіть або створіть акаунт, щоб карти дня, серія й зустрінуті карти зберігалися у вашому профілі й не загубилися при зміні браузера чи телефона. ':
   'Sign in or create an account so your daily cards, streak and cards met are kept in your profile and survive a new browser or phone. '}
   <button type="button" className={styles.inlineLink} onClick={()=>(document.querySelector('button.as-account-trigger') as HTMLButtonElement|null)?.click()}>
    {uk?'Увійти':'Sign in'}</button></p>}
 </section>;
}
