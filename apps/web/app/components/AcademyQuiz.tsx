'use client';
import {useState} from 'react';
import {CheckCircle2,RefreshCcw} from 'lucide-react';
import type {AcademyLesson} from '../../lib/academy-content';
import type {ContentLocale} from '../../lib/yoga-content';
export default function AcademyQuiz({quiz,locale}:{quiz:AcademyLesson['quiz'];locale:ContentLocale}){
 const uk=locale==='uk';
 const [selected,setSelected]=useState<number|null>(null),[submitted,setSubmitted]=useState(false);
 const correct=selected===quiz.correct;
 return <section className="as-academy-quiz" aria-label={uk?'Перевірка знань':'Knowledge check'}>
  <span className="as-overline">{uk?'ПЕРЕВІР СЕБЕ':'KNOWLEDGE CHECK'}</span>
  <h2>{uk?'Що запам’яталося?':'What did you learn?'}</h2>
  <form onSubmit={e=>{e.preventDefault();if(selected!==null)setSubmitted(true)}}>
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