'use client';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,RotateCcw,CheckCircle2,MoveUpRight,Eye,Hand} from 'lucide-react';
import Link from 'next/link';
import type {ContentLocale,YogaPractice} from '../../lib/yoga-content';
import YogaBreathSession from './YogaBreathSession';
export default function YogaSession({practice,locale}:{practice:YogaPractice;locale:ContentLocale}){
 const uk=locale==='uk';
 if(practice.category==='breathing')return <YogaBreathSession locale={locale}/>;
 return <ReflectionSteps practice={practice} locale={locale}/>;
}
function ReflectionSteps({practice,locale}:{practice:YogaPractice;locale:ContentLocale}){
 const uk=locale==='uk',total=practice.steps.length;
 const [index,setIndex]=useState(0),[viewed,setViewed]=useState(false);
 const step=practice.steps[index];
 const mobility=practice.category==='mobility';
 const Visual=mobility?MoveUpRight:index%2?Hand:Eye;
 function go(next:number){if(next>=total){setViewed(true);return;}setIndex(Math.max(0,next));}
 return <section className="as-session as-reflection-session" aria-label={uk?'Покрокові інструкції':'Step-by-step guidance'}>
  {viewed?<div className="as-session-done" role="status">
   <CheckCircle2 size={42} aria-hidden="true"/>
   <h2>{uk?'Усі підказки переглянуто':'All guidance reviewed'}</h2>
   <p>{uk?'Це не підтвердження виконання вправи. За бажанням повтори будь-який крок у комфортному темпі.':'This only means you have read the steps, not that you performed them. Repeat any step at your own pace.'}</p>
   <div className="as-session-actions"><button className="as-button as-button-primary" type="button" onClick={()=>{setIndex(0);setViewed(false)}}><RotateCcw size={16}/>{uk?'Переглянути знову':'Review again'}</button><Link className="as-button as-button-secondary" href={'/'+locale+'/yoga'}>{uk?'Інші практики':'All practices'}</Link></div>
  </div>:<>
   <div className="as-session-progress"><span>{uk?'Підказка':'Guidance'} {index+1} / {total}</span>
    <progress max={total} value={index+1} aria-label={uk?'Переглянуто підказок':'Steps reviewed'}/></div>
   <div className="as-reflection-visual" aria-hidden="true"><div className="as-reflection-halo"><Visual size={58} strokeWidth={1.2}/></div>
    <span>{mobility?(uk?'РУХАЙСЯ ПЛАВНО':'MOVE GENTLY'):(uk?'БЕЗ ПОСПІХУ':'AT YOUR OWN PACE')}</span></div>
   <div className="as-session-step"><span className="as-overline">{uk?'ПРОЧИТАЙ І ВИКОНАЙ ЗА БАЖАННЯМ':'READ AND TRY IF COMFORTABLE'}</span>
    <h2>{step.name[locale]}</h2><p className="as-session-guide">{step.guide[locale]}</p>
    <div className="as-session-option"><strong>{uk?'Можна інакше':'Another option'}</strong><p>{step.alternative[locale]}</p></div>
   </div>
   <p className="as-session-caption">{uk?'Тут немає таймера й автоматичної оцінки. Ти сам(-а) вирішуєш, скільки часу приділити кроку.':'There is no timer or automatic grading. You decide how much time to spend on each step.'}</p>
   <div className="as-session-actions"><button className="as-button as-button-secondary" disabled={index===0} type="button" onClick={()=>go(index-1)}><ArrowLeft size={17}/>{uk?'Назад':'Previous'}</button>
    <button className="as-button as-button-primary" type="button" onClick={()=>go(index+1)}>{index===total-1?(uk?'Усі підказки переглянуто':'Finish reviewing'):(uk?'Наступна підказка':'Next step')} <ArrowRight size={16}/></button></div>
  </>}
 </section>;
}