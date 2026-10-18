'use client';
import {useEffect,useState} from 'react';
import {RefreshCcw,Sparkles,History,LockKeyhole} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import TarotCardArt from './TarotCardArt';
import type {PortalLocale} from '../../lib/brand';

type Localized={en:string;uk:string};
type Draw={id:string;position:number;reversed:boolean;name:Localized;meaning:Localized;detail:Localized;positionInsight:Localized;positionName:Localized};
type Synthesis={answer:Localized;connections:Localized;reflection:Localized;steps:{en:string[];uk:string[]}};
type ReaderNarrative={directAnswer:string;development:string;cardExplanations:string[];caution:string;advice:string};
type Reading={id:string;createdAt:string;spread:'one'|'three'|'celtic';question:string|null;cards:Draw[];
 synthesis:Synthesis;reader:{en:ReaderNarrative;uk:ReaderNarrative};
 aiReading?:{language:string;model:string;reading:ReaderNarrative}|null};
type HistoryReply={readings:Reading[];remaining:number;limit:number;reset:string;aiAvailable:boolean};
type DrawReply=Reading&{remaining:number;limit:number;reset:string};
const spreads=[{id:'one',en:'One card',uk:'Одна карта',count:1},{id:'three',en:'Three cards',uk:'Три карти',count:3},{id:'celtic',en:'Celtic Cross',uk:'Кельтський хрест',count:10}] as const;
export default function TarotStudio({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [spread,setSpread]=useState<'one'|'three'|'celtic'>('three');
 const [question,setQuestion]=useState(''),[reading,setReading]=useState<Reading|null>(null);
 const [history,setHistory]=useState<Reading[]>([]),[remaining,setRemaining]=useState<number|null>(null);
 const [revealed,setRevealed]=useState<number[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [limit,setLimit]=useState(3),[aiAvailable,setAiAvailable]=useState(false),[aiConsent,setAiConsent]=useState(false);
 async function load(){
  try{
   const r=await readApiJson<HistoryReply>(await fetch('/api/v1/tarot/readings',{credentials:'same-origin',cache:'no-store'}));
   setHistory(r.readings);setRemaining(r.remaining);setLimit(r.limit);setAiAvailable(r.aiAvailable);
  }catch(e){setError(uk?'Увійди або зареєструйся через кнопку у верхньому меню, щоб отримати безкоштовний розклад.':'Sign in using the header to save and draw your free readings.');}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);
 async function draw(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError('');
  try{
   const r=await readApiJson<DrawReply>(await fetch('/api/v1/tarot/readings',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({spread,question:question.trim()||undefined,language:locale,aiConsent:aiAvailable&&aiConsent})
   }));
   setReading(r);setRemaining(r.remaining);setLimit(r.limit);setHistory(prev=>[r,...prev].slice(0,20));setRevealed([]);
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 function showSaved(value:Reading){setReading(value);setRevealed(value.cards.map(x=>x.position));}
 const narrative=reading?(reading.aiReading?.language===locale?reading.aiReading.reading:reading.reader?.[locale]):null;
 const aiWasUsed=!!reading?.aiReading&&reading.aiReading.language===locale;
 return <div className="as-tarot-studio">
  <section className="as-tarot-workspace">
   <div className="as-section-heading"><div>
    <span className="as-overline">TAROT STUDIO · 78 CARDS</span>
    <h2>{uk?'Твоє символічне читання':'Your symbolic reading'}</h2>
    <p>{uk?'Карти обираються випадково на сервері. Трактування описують можливі теми для роздумів, а не гарантовані події.':'Cards are selected randomly by the server. Meanings are prompts for reflection, not certain predictions.'}</p>
   </div></div>
   <form className="as-tarot-form" onSubmit={draw}>
    <fieldset><legend>{uk?'Обери розклад':'Choose your spread'}</legend>
     <div className="as-spread-options">{spreads.map(v=><label className={'as-spread-choice '+(spread===v.id?'is-selected':'')} key={v.id}>
      <input type="radio" name="spread" value={v.id} checked={spread===v.id} onChange={()=>setSpread(v.id)}/>
      <strong>{uk?v.uk:v.en}</strong><small>{v.count} {uk?'карт':'cards'}</small>
     </label>)}</div>
    </fieldset>
    <label htmlFor="as-tarot-question">{uk?'Твоє питання (необов’язково)':'Your question (optional)'}</label>
    <textarea id="as-tarot-question" rows={2} maxLength={600} value={question} onChange={e=>setQuestion(e.target.value)} placeholder={uk?'Про що я хочу сьогодні подумати?':'What would I like to reflect on today?'}/>
    {aiAvailable&&<label className="as-tarot-ai-consent">
     <input type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/>
     <span>{uk?'Хочу розгорнуту AI-трактовку в стилі живого таролога. Дозволяю передати це питання і назви витягнутих карт підключеному AI-провайдеру.':'Generate an extended AI tarot reading. I consent to sending this question and drawn card details to the connected AI provider.'}</span>
    </label>}
    <div className="as-tarot-actions">
     <button className="as-button as-button-primary" type="submit" disabled={busy||remaining===0||loading}><Sparkles size={17}/>{busy?(uk?'Перемішуємо…':'Shuffling…'):(uk?'Розкласти карти':'Draw the cards')}</button>
     <span className="as-tarot-counter">{remaining===null?(uk?'Для розкладів потрібен акаунт':'Account required'):(uk?'Безкоштовних розкладів сьогодні: ':'Free draws left today: ')+remaining+' / '+limit}</span>
    </div>
    <p className="as-muted">{uk?'Ліміт оновлюється о 00:00 UTC. Для адміністратора — до 100 розкладів на добу. AI викликається тільки за згодою та якщо його налаштовано на сервері.':'Limits reset at midnight UTC. Administrators have up to 100 draws daily. AI runs only with consent and server configuration.'}</p>
   </form>
   {error&&<p className="as-account-error" role="alert"><LockKeyhole size={16}/>{error}</p>}
  </section>
  {reading&&<section className="as-tarot-result" aria-label={uk?'Результат розкладу':'Tarot reading'}>
   <div className="as-tarot-result-head"><div><span className="as-overline">{uk?'ТВІЙ РОЗКЛАД':'YOUR READING'}</span>
     <h2>{uk?'Відкрий карти':'Reveal your cards'}</h2><p>{reading.question||''}</p></div>
     <button type="button" onClick={()=>setRevealed(reading.cards.map(c=>c.position))} className="as-button as-button-secondary">{uk?'Відкрити всі':'Reveal all'}</button>
   </div>
   <div className={'as-tarot-card-grid '+(reading.spread==='celtic'?'as-tarot-celtic':'')}>
    {reading.cards.map((card,i)=>{
     const open=revealed.includes(card.position);
     return <div className="as-tarot-card-slot" key={card.position}>
      <span className="as-card-position">{i+1}. {card.positionName[locale]}</span>
      <button type="button" className={'as-tarot-card '+(open?'is-open':'')} aria-label={open?card.name[locale]:(uk?'Відкрити карту':'Reveal card')+' '+(i+1)}
       onClick={()=>setRevealed(prev=>prev.includes(card.position)?prev:[...prev,card.position])}>
       {!open?<span className="as-card-back"><span>✺</span><small>✦ TAROT ✦</small></span>:
        <TarotCardArt id={card.id} name={card.name[locale]} reversed={card.reversed} locale={locale}/>}
      </button>
      {open&&<div className="as-card-interpret"><strong>{card.reversed?(uk?'Перевернута':'Reversed'):(uk?'Пряма':'Upright')}</strong><p>{card.meaning[locale]}</p><p className="as-card-depth">{card.detail[locale]}</p><p className="as-card-position-meaning">{card.positionInsight[locale]}</p></div>}
     </div>
    })}
   </div>
   {revealed.length===reading.cards.length&&narrative&&<article className="as-tarot-synthesis" aria-labelledby="tarot-answer-heading">
    <span className="as-overline">{uk?'ТАРО — ПОВНЕ ЧИТАННЯ':'TAROT — FULL READING'}</span>
    <h3 id="tarot-answer-heading">{uk?'Що показують карти на твоє питання':'What the cards suggest about your question'}</h3>
    <p className="as-reader-direct">{narrative.directAnswer}</p>
    <h4>{uk?'Як можуть розвиватися події':'How the situation could unfold'}</h4>
    <p>{narrative.development}</p>
    <h4>{uk?'Кожна карта в контексті запитання':'Every card in context'}</h4>
    {narrative.cardExplanations.map((paragraph,i)=><p key={i} className="as-reader-card-detail">
     <strong>{i+1}. {reading.cards[i].name[locale]}{reading.cards[i].reversed?(uk?' (перевернута)':' (reversed)'):''}:</strong> {paragraph}
    </p>)}
    <h4>{uk?'На що звернути увагу':'What to watch for'}</h4>
    <p>{narrative.caution}</p>
    <h4>{uk?'Порада таролога':'Reader’s advice'}</h4>
    <p>{narrative.advice}</p>
    <p className="as-muted">{aiWasUsed?
      (uk?'AI-інтерпретація за згодою користувача · модель: ':'AI interpretation with your consent · model: ')+reading.aiReading?.model:
      (uk?'Авторська сценарна інтерпретація без AI. Події — можливі символічні сценарії, а не гарантоване майбутнє.':'Original rule-based reading without AI. Scenarios are symbolic possibilities, not known future events.')}
    </p>
    <a href="#human-readings" className="as-button as-button-secondary">{uk?'Замовити персональне відео у живої експертки':'Get a personal video from a human reader'}</a>
   </article>}

   {revealed.length!==reading.cards.length&&<p className="as-tarot-hint">{uk?'Відкрий усі карти, щоб побачити їхній спільний підсумок і відповідь на запитання.':'Reveal all cards to see their combined narrative and answer.'}</p>}
   <p className="as-muted">{uk?'Ілюстрації: Pamela Colman Smith, класична колода Rider–Waite–Smith (1909). Таро не замінює медичних, юридичних або фінансових рішень.':'Artwork: Pamela Colman Smith, Rider–Waite–Smith (1909). Tarot does not replace medical, legal or financial advice.'}</p>
  </section>}
  <section className="as-tarot-history">
   <h2><History size={21}/>{uk?'Моя історія':'My reading history'}</h2>
   {history.length?history.map(h=><button type="button" key={h.id} onClick={()=>showSaved(h)}>
    <span>{new Date(h.createdAt).toLocaleString(uk?'uk-UA':'en-US')}</span>
    <strong>{h.spread==='one'?(uk?'Одна карта':'One card'):h.spread==='three'?(uk?'Три карти':'Three cards'):(uk?'Кельтський хрест':'Celtic Cross')}</strong>
    <small>{h.question?.slice(0,60)||'—'}</small><RefreshCcw size={15}/>
   </button>):<p className="as-muted">{uk?'Перший розклад з’явиться тут.':'Your readings will appear here.'}</p>}
  </section>
 </div>;
}
