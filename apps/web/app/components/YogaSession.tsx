'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,Pause,Play,RotateCcw,CheckCircle2} from 'lucide-react';
import Link from 'next/link';
import type {ContentLocale,YogaPractice} from '../../lib/yoga-content';

export default function YogaSession({practice,locale}:{practice:YogaPractice;locale:ContentLocale}){
 const uk=locale==='uk',total=practice.steps.length;
 const [index,setIndex]=useState(0),[seconds,setSeconds]=useState(practice.steps[0].seconds);
 const [running,setRunning]=useState(false),[untimed,setUntimed]=useState(false),[done,setDone]=useState(false);
 useEffect(()=>{
  if(!running||untimed||done||seconds<=0)return;
  const timer=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);
  return ()=>clearInterval(timer);
 },[running,untimed,done,seconds]);
 useEffect(()=>{if(seconds===0)setRunning(false)},[seconds]);
 function go(next:number){
  if(next>=total){setDone(true);setRunning(false);return;}
  if(next<0)return;
  setIndex(next);setSeconds(practice.steps[next].seconds);setRunning(false);
 }
 function restart(){setIndex(0);setSeconds(practice.steps[0].seconds);setRunning(false);setDone(false)}
 const step=practice.steps[index];
 const mins=String(Math.floor(seconds/60)).padStart(2,'0'),secs=String(seconds%60).padStart(2,'0');
 return <section className="as-session" aria-label={uk?'Інтерактивна практика':'Interactive practice'}>
  {done?<div className="as-session-done" role="status">
   <CheckCircle2 size={45} aria-hidden="true"/>
   <h2>{uk?'Практику завершено':'Session complete'}</h2>
   <p>{uk?'Дякуємо, що приділив(-ла) час собі. Це не тест на результат: можна повернутися будь-коли.':'Thanks for making time for yourself. This is not a performance test. Come back whenever you like.'}</p>
   <div className="as-session-actions"><button type="button" className="as-button as-button-primary" onClick={restart}><RotateCcw size={17}/>{uk?'Повторити':'Repeat'}</button><Link className="as-button as-button-secondary" href={'/'+locale+'/yoga'}>{uk?'Інші практики':'All sessions'}</Link></div>
  </div>:<>
   <div className="as-session-progress"><span>{uk?'Крок':'Step'} {index+1} / {total}</span>
    <progress value={index} max={total} aria-label={uk?'Прогрес практики':'Session progress'}/></div>
   <div className="as-session-step" key={index}>
    <span className="as-overline">{uk?'ЗАРАЗ':'RIGHT NOW'}</span>
    <h2>{step.name[locale]}</h2>
    <p className="as-session-guide">{step.guide[locale]}</p>
    <div className="as-session-option"><strong>{uk?'Можна інакше':'Another option'}</strong><p>{step.alternative[locale]}</p></div>
   </div>
   <div className="as-session-controls">
    <label className="as-session-untimed"><input type="checkbox" checked={untimed} onChange={e=>{setUntimed(e.target.checked);setRunning(false)}}/>{uk?'Без таймера':'Without timer'}</label>
    {!untimed&&<div className="as-session-clock">
     <span role="timer" aria-label={uk?'Залишилося часу':'Time remaining'}>{mins}:{secs}</span>
     <button type="button" onClick={()=>setRunning(r=>!r)} disabled={seconds===0} className="as-button as-button-secondary">
      {running?<Pause size={17}/>:<Play size={17}/>}
      {seconds===0?(uk?'Час кроку минув':'Step time ended'):running?(uk?'Пауза':'Pause'):(uk?'Почати / продовжити':'Start / resume')}
     </button>
    </div>}
    <div className="as-session-actions">
     <button type="button" className="as-button as-button-secondary" disabled={index===0} onClick={()=>go(index-1)}><ArrowLeft size={17}/>{uk?'Назад':'Previous'}</button>
     <button type="button" className="as-button as-button-primary" onClick={()=>go(index+1)}>{index===total-1?(uk?'Завершити':'Finish'):(uk?'Наступний крок':'Next step')} <ArrowRight size={17}/></button>
    </div>
    <p className="as-session-caption">{uk?'Таймер не перемикає кроки автоматично. Ти можеш рухатися у власному темпі.':'The timer never advances steps automatically. Move at your own pace.'}</p>
   </div>
  </>}
 </section>;
}