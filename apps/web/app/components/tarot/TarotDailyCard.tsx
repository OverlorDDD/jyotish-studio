'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Sparkles} from 'lucide-react';
import {aspectText,TAROT_LIBRARY,tarotCardById} from '../../../lib/tarot-meanings';
import {daysUk,localDay,markSeen,mergeJourney,pickDaily,readJourney,streak,weekDays,writeJourney,type TarotJourney} from '../../../lib/tarot-journey';
import {JOURNEY_EVENT,saveDailyCard,syncTarotJourney} from '../../../lib/tarot-journey-sync';
import {guideTo} from '../../../lib/guide-focus';
import {reportPublicToolEvent} from '../../../lib/growth-metrics';
import {TarotBack,TarotFace} from './TarotArt';
import styles from './TarotHub.module.css';

const IDS=TAROT_LIBRARY.map(c=>c.id);
export default function TarotDailyCard({locale}:{locale:'uk'|'en'}){
 const uk=locale==='uk';
 const [journey,setJourney]=useState<TarotJourney|null>(null);
 const [today,setToday]=useState('');
 const [phase,setPhase]=useState<'idle'|'flipping'|'done'>('idle');
 const [turned,setTurned]=useState(false);
 useEffect(()=>{
  const day=localDay(),j=readJourney();
  setToday(day);setJourney(j);
  if(j.daily?.date===day){setPhase('done');setTurned(true);}
  // The profile's card of the day (another device, earlier visit) replaces an undrawn deck.
  const sync=()=>{const next=readJourney();setJourney(next);
   if(next.daily?.date===localDay()){setPhase(p=>p==='idle'?'done':p);setTurned(true);}};
  const pull=()=>{void syncTarotJourney();};
  window.addEventListener(JOURNEY_EVENT,sync);
  window.addEventListener('galaxiora:auth-changed',pull);
  pull();
  return()=>{window.removeEventListener(JOURNEY_EVENT,sync);window.removeEventListener('galaxiora:auth-changed',pull);};
 },[]);
 function draw(){
  if(!journey||phase!=='idle')return;
  const pick=pickDaily(IDS);
  const next=markSeen({...journey,daily:{date:today,...pick},days:[...journey.days.filter(d=>d!==today),today]},[pick.id]);
  writeJourney(next);setJourney(next);setPhase('flipping');
  window.setTimeout(()=>setTurned(true),40);
  reportPublicToolEvent('public_tool_started','tarot');
  // Signed in: keep the card in the profile; if another device already drew today's card, show that one.
  void saveDailyCard({date:today,id:pick.id,reversed:pick.reversed}).then(server=>{
   if(!server)return;
   const merged=mergeJourney(readJourney(),server,today);
   writeJourney(merged);setJourney(merged);
  });
  window.setTimeout(()=>{setPhase('done');window.dispatchEvent(new Event(JOURNEY_EVENT));},900);
 }
 const daily=journey?.daily?.date===today?journey.daily:null;
 const card=daily?tarotCardById(daily.id):null;
 const t=card?card[locale]:null;
 const week=today?weekDays(today):[];
 const done=new Set(journey?.days??[]);
 const run=journey&&today?streak(journey.days,today):0;
 const dayNames=uk?['пн','вт','ср','чт','пт','сб','нд']:['Mo','Tu','We','Th','Fr','Sa','Su'];
 const dateLabel=today?new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{weekday:'long',day:'numeric',month:'long'}).format(new Date(today+'T12:00:00')):'';
 return <section className={styles.hero} aria-labelledby="tarot-daily-heading" data-testid="tarot-daily">
  <div className={styles.heroText}>
   <span className={styles.eyebrow}>{uk?'Карта дня · безкоштовно, без реєстрації':'Card of the day · free, no sign-up'}</span>
   {phase==='done'&&card&&t&&daily?<div className={styles.result} data-testid="tarot-daily-result">
    <h2 id="tarot-daily-heading">{uk?'Ваша карта дня':'Your card of the day'}</h2>
    <p className={styles.when}>{dateLabel} · {daily.reversed?(uk?'перевернута':'reversed'):(uk?'пряма':'upright')}</p>
    <h3 className={styles.cardName}>{card.name[locale]}</h3>
    <ul className={styles.kw}>{t.k.map(k=><li key={k}>{k}</li>)}</ul>
    <p>{daily.reversed?t.r:t.u}</p>
    <div className={styles.aspects}>
     <div><b>{uk?'Почуття':'Love'}</b>{aspectText(t.l)}</div>
     <div><b>{uk?'Справи':'Work'}</b>{aspectText(t.w)}</div>
     <div><b>{uk?'Порада':'Advice'}</b>{t.a}</div>
    </div>
    <p className={styles.links}><Link href={'/'+locale+'/tarot/cards/'+card.slug}>{uk?'Усе про карту ':'All about '}{card.name[locale]} →</Link>
     <a href="#spreads" onClick={e=>{e.preventDefault();guideTo('spreads-choose',{block:'start'});}}>{uk?'Поставити питання картам →':'Ask the cards a question →'}</a></p>
    <p className={styles.small}>{uk?'Наступна карта дня — завтра. Повертайтеся щоранку.':'Your next card of the day comes tomorrow. Come back every morning.'}</p>
   </div>:<>
    <h2 id="tarot-daily-heading">{uk?'Ваша карта дня чекає':'Your card of the day is waiting'}</h2>
    <p className={styles.lead}>{uk?'Подумайте про день, що починається, і витягніть одну карту. Вона підкаже, на що звернути увагу сьогодні.':
     'Think about the day ahead and draw one card. It will show what deserves your attention today.'}</p>
    <button type="button" className={styles.primary} onClick={draw} disabled={!journey||phase!=='idle'} data-testid="tarot-daily-draw">
     <Sparkles size={17} aria-hidden="true"/>{uk?'Витягнути карту дня':'Draw my card of the day'}</button>
   </>}
   {journey&&<div className={styles.streakBox}>
    <ol className={styles.week} aria-label={uk?'Карти дня цього тижня':'Daily cards this week'}>
     {week.map((d,i)=><li key={d} data-on={done.has(d)?'1':undefined} data-today={d===today?'1':undefined}>{dayNames[i]}</li>)}
    </ol>
    <p className={styles.small}>{run>1?(uk?'Серія: '+run+' '+daysUk(run)+' поспіль. Не переривайте її!':'Streak: '+run+' days in a row. Keep it going!')
     :run===1?(uk?'Перший день серії! Повертайтеся завтра по нову карту.':'Day one of your streak! Come back tomorrow for a new card.')
     :(uk?'Тягніть карту щодня — тут збиратиметься ваша серія.':'Draw a card every day — your streak will build up here.')}</p>
   </div>}
  </div>
  <div className={styles.stage}>
   {phase==='idle'?<button type="button" className={styles.deck} onClick={draw} disabled={!journey} aria-label={uk?'Витягнути карту дня':'Draw my card of the day'}>
    <TarotBack size="lg"/><TarotBack size="lg"/><TarotBack size="lg"/>
    <span className={styles.tap}>{uk?'натисніть на колоду':'tap the deck'}</span>
   </button>:<div className={styles.flip} data-turned={turned?'1':undefined}>
    <div className={styles.flipBack}><TarotBack size="lg"/></div>
    <div className={styles.flipFront}>{card&&<TarotFace id={card.id} name={card.name[locale]} num={card.group==='major'?card.num:undefined}
     reversed={daily?.reversed} locale={locale} size="lg"/>}</div>
   </div>}
  </div>
 </section>;
}
