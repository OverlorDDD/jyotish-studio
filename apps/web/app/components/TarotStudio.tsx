'use client';
import {useEffect,useState} from 'react';
import {RefreshCcw,Sparkles,History,LockKeyhole} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';
import {tarotCardArt} from '../../lib/tarot-art';

type Localized={en:string;uk:string};
type Draw={id:string;position:number;reversed:boolean;name:Localized;meaning:Localized;detail:Localized;positionInsight:Localized;positionName:Localized};
type Synthesis={answer:Localized;connections:Localized;reflection:Localized;steps:{en:string[];uk:string[]}};
type Reading={id:string;createdAt:string;spread:'one'|'three'|'celtic';question:string|null;cards:Draw[];synthesis:Synthesis;aiText?:{uk:string|null;en:string|null}};
type HistoryReply={readings:Reading[];remaining:number;limit:number;reset:string};
type DrawReply=Reading&{remaining:number;limit:number;reset:string};
function IllustratedTarotCard({id,name,reversed}:{id:string;name:string;reversed:boolean}){
 const [failed,setFailed]=useState(false);
 const art=tarotCardArt(id);
 if(!art||failed)return <span className="as-card-front as-card-art-fallback"><span>☾ ✦ ☽</span><strong>{name}</strong><span>✧</span></span>;
 return <span className="as-card-art-holder">
  <img className={'as-tarot-art '+(reversed?'is-reversed':'')} src={art} alt={name} loading="lazy"
   onError={()=>setFailed(true)} />
 </span>;
}
const spreads=[{id:'one',en:'One card',uk:'Одна карта',count:1},{id:'three',en:'Three cards',uk:'Три карти',count:3},{id:'celtic',en:'Celtic Cross',uk:'Кельтський хрест',count:10}] as const;
export default function TarotStudio({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [spread,setSpread]=useState<'one'|'three'|'celtic'>('three');
 const [question,setQuestion]=useState(''),[reading,setReading]=useState<Reading|null>(null);
 const [history,setHistory]=useState<Reading[]>([]),[remaining,setRemaining]=useState<number|null>(null);
 const [revealed,setRevealed]=useState<number[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [aiConsent,setAiConsent]=useState(false),[aiBusy,setAiBusy]=useState(false),[aiNotice,setAiNotice]=useState('');
 async function load(){
  try{
   const r=await readApiJson<HistoryReply>(await fetch('/api/v1/tarot/readings',{credentials:'same-origin',cache:'no-store'}));
   setHistory(r.readings);setRemaining(r.remaining);
  }catch(e){setError(uk?'Увійди або зареєструйся через кнопку у верхньому меню, щоб отримати безкоштовний розклад.':'Sign in using the header to save and draw your free readings.');}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);
 async function draw(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError('');
  try{
   const r=await readApiJson<DrawReply>(await fetch('/api/v1/tarot/readings',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({spread,question:question.trim()||undefined})
   }));
   setReading(r);setAiNotice('');setAiConsent(false);setRemaining(r.remaining);setHistory(prev=>[r,...prev].slice(0,20));setRevealed([]);
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 function showSaved(value:Reading){setReading(value);setAiNotice('');setAiConsent(false);setRevealed(value.cards.map(x=>x.position));}
 async function interpretWithAi(){
  if(!reading||!aiConsent)return;
  setAiBusy(true);setAiNotice('');
  try{
   const answer=await readApiJson<{text:string|null;reason?:string;provider:string}>(await fetch('/api/v1/tarot/readings/'+encodeURIComponent(reading.id)+'/interpret',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({lang:locale,consent:true})
   }));
   if(!answer.text){
    setAiNotice(uk?'Безкоштовний AI-провайдер зараз недоступний або не налаштований. Прогноз за картами вище залишається доступним.':'The free AI provider is unavailable or not configured. Your symbolic forecast remains available above.');
    return;
   }
   const merged:Reading={...reading,aiText:{...reading.aiText,uk:locale==='uk'?answer.text:reading.aiText?.uk||null,en:locale==='en'?answer.text:reading.aiText?.en||null}};
   setReading(merged);setHistory(history.map(x=>x.id===merged.id?merged:x));
  }catch(e){setAiNotice(e instanceof Error?e.message:String(e))}
  finally{setAiBusy(false)}
 }
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
    <div className="as-tarot-actions">
     <button className="as-button as-button-primary" type="submit" disabled={busy||remaining===0||loading}><Sparkles size={17}/>{busy?(uk?'Перемішуємо…':'Shuffling…'):(uk?'Розкласти карти':'Draw the cards')}</button>
     <span className="as-tarot-counter">{remaining===null?(uk?'Для розкладів потрібен акаунт':'Account required'):(uk?'Безкоштовних розкладів сьогодні: ':'Free draws left today: ')+remaining+' / 3'}</span>
    </div>
    <p className="as-muted">{uk?'Ліміт оновлюється о 00:00 UTC. Платна AI-генерація тут не використовується.':'Your 3 free readings reset at 00:00 UTC. No paid AI generation is used here.'}</p>
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
        <IllustratedTarotCard id={card.id} name={card.name[locale]} reversed={card.reversed}/>}
      </button>
      {open&&<div className="as-card-interpret"><strong>{card.reversed?(uk?'Перевернута':'Reversed'):(uk?'Пряма':'Upright')}</strong><p>{card.meaning[locale]}</p><p className="as-card-depth">{card.detail[locale]}</p><p className="as-card-position-meaning">{card.positionInsight[locale]}</p></div>}
     </div>
    })}
   </div>
   {revealed.length===reading.cards.length&&<article className="as-tarot-synthesis" aria-labelledby="tarot-answer-heading">
    <span className="as-overline">{uk?'ЗАГАЛЬНА ІНТЕРПРЕТАЦІЯ':'READING SYNTHESIS'}</span>
    <h3 id="tarot-answer-heading">{uk?'Що можуть принести карти — прогноз':'What the cards suggest — forecast'}</h3>
    <p>{reading.synthesis.answer[locale]}</p>
    <h4>{uk?'Як карти пов’язані між собою':'How the cards connect'}</h4>
    <p>{reading.synthesis.connections[locale]}</p>
    <h4>{uk?'На що звернути увагу у фіналі':'What matters about the outcome'}</h4>
    <p>{reading.synthesis.reflection[locale]}</p>
    <h4>{uk?'Як краще зустріти ці події':'How to approach these developments'}</h4>
    <ol>{reading.synthesis.steps[locale].map((step,i)=><li key={i}>{step}</li>)}</ol>
    <p className="as-muted">{uk?'Це прогноз у традиції Таро, не доведені факти про майбутнє.':'This is a tarot-style prediction, not proven knowledge of future events.'}</p>
    <div className="as-tarot-ai">
     <h4>{uk?'Персональна розповідь таролога з AI':'Personalized AI tarot narrative'}</h4>
     <p className="as-muted">{uk?'Безкоштовна AI-модель може скласти більш природну історію на основі випалих карт. Потрібен окремий дозвіл на передачу запитання та карт сторонньому провайдеру OpenRouter; ця функція не використовує платний OpenAI.':'An optional free AI model can write a more natural, connected reading. Your question and card data will be sent to OpenRouter only with your consent, never to paid OpenAI.'}</p>
     {reading.aiText?.[locale]?
       <div className="as-tarot-ai-output"><strong>{uk?'Розгорнуте трактування':'Extended reading'}</strong><p>{reading.aiText[locale]}</p></div>:
       <>
        <label className="as-consent"><input type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/>
          {uk?'Даю згоду передати це запитання і дані випалих карт безкоштовному AI-провайдеру.':'I agree to share this question and drawn card details with the free AI provider.'}</label>
        <button type="button" className="as-button as-button-secondary" disabled={aiBusy||!aiConsent} onClick={interpretWithAi}>{aiBusy?(uk?'Готуємо трактування…':'Preparing your reading…'):(uk?'Отримати розгорнуту AI-відповідь':'Generate detailed AI reading')}</button>
       </>}
     {aiNotice&&<p className="as-muted" role="status">{aiNotice}</p>}
    </div>
   </article>}
   {revealed.length!==reading.cards.length&&<p className="as-tarot-hint">{uk?'Відкрий усі карти, щоб побачити їхній спільний підсумок і відповідь на запитання.':'Reveal all cards to see their combined narrative and answer.'}</p>}
   <p className="as-muted">{uk?'Важлива інформація: Таро не замінює медичних, юридичних або фінансових рішень.':'Tarot cannot replace medical, legal or financial advice.'}</p>
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
