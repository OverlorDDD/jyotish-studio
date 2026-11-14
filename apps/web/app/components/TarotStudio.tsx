'use client';
import {useEffect,useState} from 'react';
import {History,RefreshCcw,Sparkles} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import GlossaryText from './GlossaryText';
import type {PortalLocale} from '../../lib/brand';
import {reportGrowthEvent,reportPublicToolEvent} from '../../lib/growth-metrics';
import {tarotCardById,YES_NO,type YesNo} from '../../lib/tarot-meanings';
import {countGuestSpread,guestLeft,localDay,markSeen,readJourney,writeJourney} from '../../lib/tarot-journey';
import {TarotBack,TarotFace} from './tarot/TarotArt';
import {guideTo} from '../../lib/guide-focus';
import styles from './tarot/TarotHub.module.css';

type Localized={en:string;uk:string};
type SpreadId='yesno'|'three'|'love'|'work'|'week'|'one'|'celtic';
type Draw={id:string;position:number;reversed:boolean;name:Localized;meaning:Localized;detail:Localized;positionInsight:Localized;positionName:Localized};
type Tone='favourable'|'mostlyGood'|'mixed'|'challenging'|'difficult';
type ReaderNarrative={directAnswer:string;development:string;cardExplanations:string[];caution:string;advice:string;tone?:Tone};
type Reading={id:string|null;createdAt:string;spread:SpreadId;question:string|null;cards:Draw[];
 reader:{en:ReaderNarrative;uk:ReaderNarrative};aiReading?:{language:string;model:string;reading:ReaderNarrative}|null;guest?:boolean};
type HistoryReply={readings:Reading[];remaining:number;limit:number;reset:string;aiAvailable:boolean};
type DrawReply=Reading&{remaining:number;limit:number;reset:string};
const SPREADS:readonly {id:SpreadId;count:number;uk:[string,string];en:[string,string];tag?:'quick'|'popular'|'advanced'}[]=[
 {id:'yesno',count:1,tag:'quick',uk:['Так чи ні','Коротка відповідь на одне питання і порада, що робити далі.'],en:['Yes or no','A short answer to one question and advice on what to do next.']},
 {id:'three',count:3,tag:'popular',uk:['Минуле, теперішнє, майбутнє','Звідки ситуація прийшла і куди рухається.'],en:['Past, present, future','Where the situation came from and where it is heading.']},
 {id:'love',count:3,uk:['Кохання і стосунки','Ви, інша людина і те, що між вами.'],en:['Love & relationships','You, the other person and what connects you.']},
 {id:'work',count:3,uk:['Робота і гроші','Сильна сторона, перешкода і найкращий крок.'],en:['Work & money','Your strength, the obstacle and the best next step.']},
 {id:'week',count:5,uk:['Порада на тиждень','Настрій тижня, справи, почуття, ризик і порада.'],en:['Advice for the week','The mood, plans, feelings, risk and advice for the week.']},
 {id:'one',count:1,uk:['Одна карта-порада','Одна карта як фокус для будь-якого питання.'],en:['One-card guidance','A single card as a focus for any question.']},
 {id:'celtic',count:10,tag:'advanced',uk:['Кельтський хрест','Десять карт для глибокого розбору важливого питання.'],en:['Celtic Cross','Ten cards for a deep look at an important question.']}
];
const TAG:Record<string,[string,string]>={quick:['1 хвилина','1 minute'],popular:['популярне','popular'],advanced:['для досвідчених','for experienced readers']};
const TONE:Record<Tone,[string,string]>={favourable:['сприятливий','favourable'],mostlyGood:['радше сприятливий','mostly favourable'],
 mixed:['неоднозначний','mixed'],challenging:['складний','challenging'],difficult:['важкий','difficult']};
const READER_TOPIC:Partial<Record<SpreadId,string>>={love:'relationships',work:'career',yesno:'decision'};
const spreadTitle=(id:string,uk:boolean)=>{const s=SPREADS.find(x=>x.id===id);return s?(uk?s.uk[0]:s.en[0]):id;};
/** Yes/no lean of one card; a reversal softens "yes" and hardens "maybe". */
function yesNoOf(id:string,reversed:boolean):YesNo{
 const base=tarotCardById(id)?.yesNo??'maybe';
 if(!reversed)return base;
 return base==='yes'?'maybe':'no';
}
export default function TarotStudio({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [spread,setSpread]=useState<SpreadId>('three');
 const [question,setQuestion]=useState(''),[reading,setReading]=useState<Reading|null>(null);
 const [history,setHistory]=useState<Reading[]>([]),[remaining,setRemaining]=useState<number|null>(null);
 const [signedIn,setSignedIn]=useState(false);
 const [revealed,setRevealed]=useState<number[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [aiAvailable,setAiAvailable]=useState(false),[aiConsent,setAiConsent]=useState(false);
 async function load(){
  setError('');setLoading(true);
  try{
   const response=await fetch('/api/v1/tarot/readings',{credentials:'same-origin',cache:'no-store'});
   if(response.status===401)reportPublicToolEvent('public_tool_auth_required','tarot');
   if(response.status===401){setSignedIn(false);setHistory([]);setRemaining(guestLeft(readJourney(),localDay()));return;}
   const r=await readApiJson<HistoryReply>(response);
   setSignedIn(true);setHistory(r.readings);setRemaining(r.remaining);setAiAvailable(r.aiAvailable);
  }catch{setSignedIn(false);setRemaining(guestLeft(readJourney(),localDay()));}
  finally{setLoading(false)}
 }
 useEffect(()=>{
  void load();
  const reload=()=>{setReading(null);setRevealed([]);setRemaining(null);setHistory([]);void load();};
  window.addEventListener('galaxiora:auth-changed',reload);
  return ()=>window.removeEventListener('galaxiora:auth-changed',reload);
 },[locale]);
 async function draw(event:React.FormEvent){
  event.preventDefault();if(busy)return;
  setBusy(true);setError('');
  reportGrowthEvent('tarot_spread_started');
  reportPublicToolEvent('public_tool_started','tarot');
  try{
   const response=await fetch(signedIn?'/api/v1/tarot/readings':'/api/v1/tarot/public-readings',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(signedIn?{spread,question:question.trim()||undefined,language:locale,aiConsent:aiAvailable&&aiConsent}
     :{spread,question:question.trim()||undefined})
   });
   const r=await readApiJson<DrawReply>(response);
   setReading(r);setRevealed([]);
   const today=localDay();
   let journey=markSeen(readJourney(),r.cards.map(c=>c.id));
   if(signedIn){setRemaining(r.remaining);setHistory(prev=>[r,...prev].slice(0,20));}
   else{journey=countGuestSpread(journey,today);setRemaining(guestLeft(journey,today));}
   writeJourney(journey);window.dispatchEvent(new Event('galaxiora:tarot-journey'));
   reportGrowthEvent('tarot_spread_completed');
   reportPublicToolEvent('public_tool_completed','tarot');
   window.setTimeout(()=>document.getElementById('tarot-result')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
  }catch(e){reportPublicToolEvent('public_tool_failed','tarot');setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 function showSaved(value:Reading){setReading(value);setRevealed(value.cards.map(x=>x.position));}
 const narrative=reading?(reading.aiReading?.language===locale?reading.aiReading.reading:reading.reader?.[locale]):null;
 const aiWasUsed=!!reading?.aiReading&&reading.aiReading.language===locale;
 const allOpen=!!reading&&revealed.length===reading.cards.length;
 const chosen=SPREADS.find(s=>s.id===spread)!;
 const outOfDraws=remaining===0;
 const nextToOpen=reading?.cards.find(c=>!revealed.includes(c.position))?.position??null;
 const tone=reading?.reader?.[locale]?.tone??null;
 const hardTone=tone==='challenging'||tone==='difficult';
 const keyCard=reading?tarotCardById(reading.cards[reading.cards.length-1].id):null;
 function reveal(position:number){
  if(!reading||revealed.includes(position))return;
  const next=[...revealed,position];
  setRevealed(next);
  if(next.length===reading.cards.length)guideTo('tarot-answer-heading',{block:'start',delay:450});
 }
 /** Carry the question and the drawn cards into the human reader form (it pre-fills empty fields). */
 function toReader(event:React.MouseEvent){
  if(!reading)return;
  event.preventDefault();
  const cards=reading.cards.map((c,i)=>(i+1)+'. '+c.positionName[locale]+': '+c.name[locale]+(c.reversed?(uk?' (перевернута карта)':' (reversed)'):'')).join('\n');
  window.dispatchEvent(new CustomEvent('galaxiora:tarot-to-reader',{detail:{
   question:reading.question??'',
   context:(uk?'Мій онлайн-розклад «':'My online spread “')+spreadTitle(reading.spread,uk)+(uk?'»:\n':'”:\n')+cards,
   topic:READER_TOPIC[reading.spread]??null}}));
  guideTo('human-readings',{block:'start'});
 }
 const answer=reading&&reading.spread==='yesno'&&allOpen?yesNoOf(reading.cards[0].id,reading.cards[0].reversed):null;
 return <div className="as-tarot-studio" id="spreads">
  <section className={styles.card} aria-labelledby="tarot-spreads-heading">
   <div className={styles.secHead}><h2 id="tarot-spreads-heading">{uk?'Запитайте карти':'Ask the cards'}</h2>
    <span>{uk?'Три кроки: тема → питання → карти':'Three steps: topic → question → cards'}</span></div>
   <form className="as-tarot-form" onSubmit={draw}>
    <fieldset className={styles.spreads} id="spreads-choose" tabIndex={-1}><legend className={styles.stepTitle}><b className={styles.stepNo}>1</b>{uk?'Оберіть, про що ваше питання':'Choose what your question is about'}</legend>
     {SPREADS.map(v=><label className={styles.spread} data-selected={spread===v.id?'1':undefined} data-wide={v.id==='celtic'?'1':undefined} key={v.id}>
      <input type="radio" name="spread" value={v.id} checked={spread===v.id} onChange={()=>setSpread(v.id)}
       onClick={e=>{if(e.detail>0)guideTo('as-tarot-question',{focus:true,delay:30});}}/>
      {v.tag&&<span className={styles.tag} data-tag={v.tag}>{TAG[v.tag][uk?0:1]}</span>}
      <span className={styles.mini} aria-hidden="true">{Array.from({length:Math.min(v.count,10)},(_,i)=><i key={i}/>)}</span>
      <strong>{uk?v.uk[0]:v.en[0]}</strong><small>{uk?v.uk[1]:v.en[1]}</small>
     </label>)}
    </fieldset>
    <label htmlFor="as-tarot-question" className={styles.label}><b className={styles.stepNo}>2</b>{spread==='yesno'?(uk?'Ваше питання, на яке можна відповісти «так» чи «ні»':'Your yes-or-no question')
     :(uk?'Ваше питання (необов’язково)':'Your question (optional)')}</label>
    <textarea id="as-tarot-question" className={styles.textarea} rows={2} maxLength={600} value={question} onChange={e=>setQuestion(e.target.value)}
     placeholder={spread==='love'?(uk?'Наприклад: що нас чекає з цією людиною?':'For example: where is this relationship going?')
      :spread==='work'?(uk?'Наприклад: чи варто мені шукати нову роботу?':'For example: should I look for a new job?')
      :(uk?'Наприклад: на що мені звернути увагу цього тижня?':'For example: what should I pay attention to this week?')}/>
    {signedIn&&aiAvailable&&<label className={styles.consent}>
     <input type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/>
     <span>{uk?'Хочу розгорнуту AI-трактовку. Дозволяю передати питання і назви карт підключеному AI-провайдеру.':'I want an extended AI reading and allow sending my question and card names to the connected AI provider.'}</span>
    </label>}
    <div className={styles.actions}>
     <b className={styles.stepNo} aria-hidden="true">3</b>
     <button className="as-button as-button-primary" type="submit" disabled={busy||outOfDraws||loading}>
      <Sparkles size={17}/>{busy?(uk?'Перемішуємо…':'Shuffling…'):(uk?'Розкласти карти':'Draw the cards')}</button>
     <span className={styles.small}>{remaining===null?'':outOfDraws?(uk?'На сьогодні розклади закінчилися — повертайтеся завтра.':'No more readings today — come back tomorrow.')
      :(uk?'Сьогодні залишилось розкладів: ':'Readings left today: ')+remaining}</span>
     <a className={'as-tarot-live-link '+styles.liveLink} href="#human-readings">{uk?'Важливе питання? Живий таролог →':'An important question? Ask a human reader →'}</a>
    </div>
    {!signedIn&&!loading&&<p className={styles.small}>{uk?'Без реєстрації — 3 розклади на день. Увійдіть, щоб розклади зберігалися в історії на будь-якому пристрої.':
     'Without an account: 3 readings a day. Sign in to keep them on any device.'}</p>}
    {chosen.id==='celtic'&&<p className={styles.small}>{uk?'Кельтський хрест — великий розклад. Якщо ви тільки починаєте, спробуйте «Минуле, теперішнє, майбутнє».':
     'The Celtic Cross is a large spread. If you are just starting, try “Past, present, future”.'}</p>}
   </form>
   {error&&<p className="as-account-error" role="alert">{error}</p>}
  </section>
  {reading&&<section id="tarot-result" className={'as-tarot-result '+styles.card} aria-label={uk?'Результат розкладу':'Tarot reading'}>
   <div className={styles.secHead}><div><span className={styles.eyebrow}>{spreadTitle(reading.spread,uk)}</span>
     <h2>{uk?'Відкривайте карти по одній':'Reveal the cards one by one'}</h2>{reading.question&&<p className={styles.question}>«{reading.question}»</p>}</div>
    {!allOpen&&<button type="button" onClick={()=>{setRevealed(reading.cards.map(c=>c.position));guideTo('tarot-answer-heading',{block:'start',delay:350});}} className="as-button as-button-secondary">{uk?'Відкрити всі':'Reveal all'}</button>}
   </div>
   <div className={styles.cardsRow} data-count={reading.cards.length}>
    {reading.cards.map((card,i)=>{
     const open=revealed.includes(card.position),lib=tarotCardById(card.id);
     const isNext=!allOpen&&nextToOpen===card.position;
     return <div className={styles.slot} key={card.position}>
      <span className={styles.position}>{i+1}. {card.positionName[locale]}</span>
      <button type="button" className={styles.reveal} data-next={isNext?'1':undefined} aria-label={open?card.name[locale]:(uk?'Відкрити карту ':'Reveal card ')+(i+1)}
       onClick={()=>reveal(card.position)}>
       {open?<TarotFace id={card.id} name={card.name[locale]} num={lib?.group==='major'?lib.num:undefined} reversed={card.reversed} locale={locale} size="sm"/>:<TarotBack size="sm"/>}
      </button>
      {open&&<div className={styles.interpret}><strong>{card.name[locale]} · {card.reversed?(uk?'перевернута':'reversed'):(uk?'пряма':'upright')}</strong>
       <p>{lib?(card.reversed?lib[locale].r:lib[locale].u):<GlossaryText text={card.meaning[locale]} locale={locale}/>}</p>
       {lib&&<a href={'/'+locale+'/tarot/cards/'+lib.slug}>{uk?'Значення карти →':'Card meaning →'}</a>}</div>}
     </div>;
    })}
   </div>
   {answer&&<p className={styles.answer} data-answer={answer}>{uk?'Відповідь карт: ':'The cards say: '}<b>{YES_NO[answer][locale]}</b></p>}
   {allOpen&&narrative&&<article className={styles.synthesis} aria-labelledby="tarot-answer-heading">
    <h3 id="tarot-answer-heading" tabIndex={-1}>{uk?'Що показують карти':'What the cards suggest'}</h3>
    {tone&&<p className={styles.tone} data-tone={tone}>{uk?'Загальний настрій розкладу: ':'Overall tone of the spread: '}<b>{TONE[tone][uk?0:1]}</b></p>}
    <p className={styles.direct}><GlossaryText text={narrative.directAnswer} locale={locale}/></p>
    <h4>{uk?'Як може розвиватися ситуація':'How the situation could unfold'}</h4>
    <p><GlossaryText text={narrative.development} locale={locale}/></p>
    {reading.cards.length>1&&<><h4>{uk?'Кожна карта у вашому питанні':'Every card in your question'}</h4>
     {narrative.cardExplanations.map((paragraph,i)=><p key={i}><strong>{i+1}.{aiWasUsed?' '+reading.cards[i].name[locale]+(reading.cards[i].reversed?(uk?' (перевернута карта)':' (reversed)'):'')+':':''}</strong> {paragraph}</p>)}</>}
    <h4>{uk?'На що звернути увагу':'What to watch for'}</h4>
    <p><GlossaryText text={narrative.caution} locale={locale}/></p>
    <h4>{uk?'Порада':'Advice'}</h4>
    <p><GlossaryText text={narrative.advice} locale={locale}/></p>
    <p className={styles.small}>{aiWasUsed?(uk?'AI-трактовка за вашою згодою · модель: ':'AI reading with your consent · model: ')+reading.aiReading?.model:
     (uk?'Авторське тлумачення без AI: значення карт і їхня взаємодія в розкладі.':'Original reading without AI: card meanings and how they interact in the spread.')}</p>
    <div className={styles.nextSteps} id="tarot-next-steps">
     <h4>{uk?'Що далі?':'What next?'}</h4>
     {hardTone&&<p className={styles.small}>{uk?'Розклад непростий. Такі ситуації краще розібрати разом із живим тарологом: він подивиться глибше й підкаже, як обійти ризики.':
      'This spread is not an easy one. Situations like this are best explored with a human reader, who can look deeper and help you get around the risks.'}</p>}
     <div className={styles.nextGrid}>
      <a href="#human-readings" className={styles.nextCard} data-primary={hardTone?'1':undefined} onClick={toReader}>
       <b>{uk?'Розібрати з живим тарологом':'Go through it with a human reader'}</b>
       <span>{uk?'Ми перенесемо ваше питання й карти у форму. Перший крок безкоштовний.':'We will carry your question and cards into the form. The first step is free.'}</span></a>
      <button type="button" className={styles.nextCard} onClick={()=>{setReading(null);setRevealed([]);guideTo('as-tarot-question',{focus:true,delay:60});}}>
       <b>{uk?'Уточнити питання або новий розклад':'Refine the question or start a new reading'}</b>
       <span>{remaining===0?(uk?'Сьогоднішні розклади закінчились — нові будуть завтра.':'No readings left today — new ones tomorrow.'):(uk?'Поставте наступне питання, поки ситуація свіжа.':'Ask the follow-up while the situation is fresh.')}</span></button>
      {keyCard&&<a href={'/'+locale+'/tarot/cards/'+keyCard.slug} className={styles.nextCard}>
       <b>{uk?'Детальніше про «'+keyCard.name.uk+'»':'More about '+keyCard.name.en}</b>
       <span>{uk?'Ключова карта цього розкладу: символи, кохання, робота, порада.':'The key card of this spread: symbols, love, work, advice.'}</span></a>}
     </div>
    </div>
   </article>}
   {!allOpen&&<p className={styles.hint}>{uk?'Натисніть на карту '+(reading.cards.findIndex(c=>c.position===nextToOpen)+1)+', щоб відкрити її. Коли відкриєте всі, з’явиться загальна відповідь.':
    'Tap card '+(reading.cards.findIndex(c=>c.position===nextToOpen)+1)+' to turn it over. When all are open, the overall answer appears.'}</p>}
   <p className={styles.small}>{uk?'Ілюстрації: власна колода Galaxiora за класичною символікою Райдера–Вейта–Сміт. Таро не замінює медичних, юридичних чи фінансових рішень.':
    'Artwork: Galaxiora’s own deck, drawn on the classic Rider–Waite–Smith symbolism. Tarot does not replace medical, legal or financial decisions.'}</p>
  </section>}
  {signedIn&&<section className={'as-tarot-history '+styles.card}>
   <h2><History size={21}/>{uk?'Історія моїх розкладів':'My reading history'}</h2>
   {history.length?history.map(h=><button type="button" key={h.id??h.createdAt} onClick={()=>showSaved(h)}>
    <span>{new Date(h.createdAt).toLocaleString(uk?'uk-UA':'en-US')}</span>
    <strong>{spreadTitle(h.spread,uk)}</strong>
    <small>{h.question?.slice(0,60)||'—'}</small><RefreshCcw size={15}/>
   </button>):<p className={styles.small}>{uk?'Ваш перший розклад з’явиться тут.':'Your first reading will appear here.'}</p>}
  </section>}
 </div>;
}
