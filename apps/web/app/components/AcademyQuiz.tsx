'use client';
import {useEffect,useState} from 'react';
import {CheckCircle2,RefreshCcw} from 'lucide-react';
import type {AcademyLesson} from '../../lib/academy-content';
import type {ContentLocale} from '../../lib/yoga-content';
export default function AcademyQuiz({quiz,locale,slug}:{quiz:AcademyLesson['quiz'];locale:ContentLocale;slug?:string}){
 const uk=locale==='uk';
 const [selected,setSelected]=useState<number|null>(null),[submitted,setSubmitted]=useState(false);
 const correct=selected===quiz.correct;
 const [completed,setCompleted]=useState(false);
 useEffect(()=>{
  if(!slug)return;
  try{const stored=JSON.parse(localStorage.getItem('galaxiora.pedia.progress.v1')||'{}') as Record<string,boolean>;
   setCompleted(stored[slug]===true);}catch{}
 },[slug]);
 const submit=()=>{
  if(selected===null)return;
  setSubmitted(true);
  if(selected===quiz.correct&&slug){
   setCompleted(true);
   try{const key='galaxiora.pedia.progress.v1';
    const stored=JSON.parse(localStorage.getItem(key)||'{}') as Record<string,boolean>;
    localStorage.setItem(key,JSON.stringify({...stored,[slug]:true}));
   }catch{}
  }
 };
 return <section className="as-academy-quiz" aria-label={uk?'Перевірка знань':'Knowledge check'}>
  <span className="as-overline">{uk?'ПЕРЕВІР СЕБЕ':'KNOWLEDGE CHECK'}</span>
  <h2>{uk?'Що запам’яталося?':'What did you learn?'}</h2>
  {completed&&<p role="status">{uk?'Урок пройдено — результат збережено в цьому браузері.':'Lesson complete — saved in this browser.'}</p>}
  <form onSubmit={e=>{e.preventDefault();submit()}}>
   <fieldset disabled={submitted}><legend>{quiz.prompt[locale]}</legend>
    <div className="as-academy-choices">{quiz.choices.map((choice,i)=><label key={i} className={'as-academy-choice '+(selected===i?'is-selected':'')}>
     <input type="radio" name="academy-answer" value={i} checked={selected===i} onChange={()=>setSelected(i)}/>
     <span>{choice[locale]}</span>
    </label>)}</div>
   </fieldset>
   {!submitted?<button className="as-button as-button-primary" type="submit" disabled={selected===null}>{uk?'Перевірити відповідь':'Check answer'}</button>:
    <div className="as-quiz-feedback" role="status" aria-live="polite">
     <strong>{correct?<CheckCircle2 size={20} aria-hidden="true"/>:null}{correct?(uk?'Правильно!':'Correct!'):(uk?'Спробуй ще раз':'Not quite — try again')}</strong>
     <p>{quiz.explanation[locale]}</p>
     <button type="button" className="as-button as-button-secondary" onClick={()=>{setSelected(null);setSubmitted(false)}}><RefreshCcw size={15}/>{uk?'Повторити':'Try again'}</button>
    </div>}
  </form>
 </section>;
}