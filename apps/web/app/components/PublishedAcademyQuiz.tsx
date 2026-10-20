'use client';
import {useState} from 'react';
import type {PublishedContent,Locale} from '../../lib/editorial-public';
export default function PublishedAcademyQuiz({quiz,locale}:{quiz:NonNullable<PublishedContent['document']['quiz']>;locale:Locale}){
 const [selected,setSelected]=useState(-1),[checked,setChecked]=useState(false);
 const uk=locale==='uk';
 return <section className="as-academy-quiz" aria-label={uk?'Перевірка знань':'Knowledge check'}>
  <span className="as-overline">{uk?'ПЕРЕВІР СЕБЕ':'KNOWLEDGE CHECK'}</span>
  <h2>{quiz.question[locale]}</h2>
  <fieldset disabled={checked}><legend>{uk?'Обери відповідь':'Choose an answer'}</legend>
  <div className="as-academy-choices">{quiz.choices.map((choice,i)=><label className="as-academy-choice" key={i}>
   <input type="radio" name="published-answer" checked={selected===i} onChange={()=>setSelected(i)}/>
   <span>{choice[locale]}</span>
  </label>)}</div></fieldset>
  {checked?<div role="status" className="as-quiz-feedback"><strong>{selected===quiz.correct?(uk?'Правильно!':'Correct!'):(uk?'Спробуй ще раз':'Not quite')}</strong>
   <p>{quiz.explanation[locale]}</p><button type="button" className="as-button as-button-secondary" onClick={()=>{setChecked(false);setSelected(-1)}}>{uk?'Повторити':'Try again'}</button></div>:
   <button type="button" className="as-button as-button-primary" disabled={selected<0} onClick={()=>setChecked(true)}>{uk?'Перевірити відповідь':'Check answer'}</button>}
 </section>;
}
