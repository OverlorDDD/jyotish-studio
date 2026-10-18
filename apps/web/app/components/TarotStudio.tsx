'use client';
import {useEffect,useState} from 'react';
import {RefreshCcw,Sparkles,History,LockKeyhole} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';

type Localized={en:string;uk:string};
type Draw={id:string;position:number;reversed:boolean;name:Localized;meaning:Localized;positionName:Localized};
type Reading={id:string;createdAt:string;spread:'one'|'three'|'celtic';question:string|null;cards:Draw[]};
type HistoryReply={readings:Reading[];remaining:number;limit:number;reset:string};
type DrawReply=Reading&{remaining:number;limit:number;reset:string};
const spreads=[{id:'one',en:'One card',uk:'Одна карта',count:1},{id:'three',en:'Three cards',uk:'Три карти',count:3},{id:'celtic',en:'Celtic Cross',uk:'Кельтський хрест',count:10}] as const;
export default function TarotStudio({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [spread,setSpread]=useState<'one'|'three'|'celtic'>('three');
 const [question,setQuestion]=useState(''),[reading,setReading]=useState<Reading|null>(null);
 const [history,setHistory]=useState<Reading[]>([]),[remaining,setRemaining]=useState<number|null>(null);
 const [revealed,setRevealed]=useState<number[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true);
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
   setReading(r);setRemaining(r.remaining);setHistory(prev=>[r,...prev].slice(0,20));setRevealed([]);
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 function showSaved(value:Reading){setReading(value);setRevealed(value.cards.map(x=>x.position));}
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
        <span className={'as-card-front '+(card.reversed?'is-reversed':'')}><span className="as-card-ornament">☾ ✦ ☽</span><strong>{card.name[locale]}</strong><span>✧</span></span>}
      </button>
      {open&&<div className="as-card-interpret"><strong>{card.reversed?(uk?'Перевернута':'Reversed'):(uk?'Пряма':'Upright')}</strong><p>{card.meaning[locale]}</p></div>}
     </div>
    })}
   </div>
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
