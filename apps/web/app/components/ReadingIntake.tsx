'use client';
import {useState} from 'react';
import {ClipboardCopy,Info,ShieldCheck} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';

const T={
 en:{
  title:'Prepare your personal video reading',intro:'A clear, open-ended question helps a human reader respond thoughtfully. This is a local preview, not an order or booking.',
  weak:'Less helpful: “Will my ex come back? Yes or no?”',strong:'Better: “What could help me understand this relationship and decide my next step over the next three months?”',
  secondWeak:'Less helpful: “When will I become rich?”',secondStrong:'Better: “What strengths and choices should I focus on while planning my next career move?”',
  name:'Preferred name (optional)',topic:'Reading topic',question:'Your main question',context:'Relevant context',horizon:'Timeframe (optional)',goal:'What would make this reading useful?',
  topicOptions:['Relationships','Work & direction','Personal growth','A decision','Other'],
  nameHelp:'First name or nickname is enough. No legal name, address or ID needed.',
  questionHelp:'Ask an open question about your own choices or situation, not someone else’s private thoughts.',
  contextHelp:'Share 2–5 sentences: what happened, what matters to you and what you have already considered. Avoid details you do not wish to disclose.',
  horizonHelp:'Example: “the next three months”. Exact date of birth is NOT required for a tarot reading.',
  goalHelp:'Example: “I want a few constructive options and questions to reflect on.”',
  privacy:'This form currently stays in your browser only. Do not enter sensitive identifiers, payment details or confidential third-party information.',
  preview:'Preview my request',clear:'Clear form',yourBrief:'Your draft request',copy:'Copy draft',copied:'Copied',notYet:'Bookings and payments are not enabled yet. This draft is not sent or saved.',
  required:'Write a specific question and at least a little context to prepare the brief.',
  qPlaceholder:'What can I explore about…?',contextPlaceholder:'Describe the situation in your own words…',goalPlaceholder:'I would like to understand…'
 },
 uk:{
  title:'Підготуй персональний відеорозклад',intro:'Чітке відкрите запитання допоможе експертці дати змістовну відповідь. Це локальна підготовка, а не оформлення замовлення.',
  weak:'Не дуже вдало: «Чи повернеться колишній? Так чи ні?»',strong:'Краще: «Що допоможе мені розібратись у стосунках і обрати наступний крок протягом трьох місяців?»',
  secondWeak:'Не дуже вдало: «Коли я розбагатію?»',secondStrong:'Краще: «На яких сильних сторонах і діях мені зосередитись, плануючи новий кар’єрний крок?»',
  name:'Як до тебе звертатись (необов’язково)',topic:'Тема розкладу',question:'Основне запитання',context:'Контекст ситуації',horizon:'Період (необов’язково)',goal:'Якої користі очікуєш від розкладу?',
  topicOptions:['Стосунки','Робота та покликання','Особистий розвиток','Важливе рішення','Інше'],
  nameHelp:'Достатньо імені або псевдоніма. Паспортні дані, адреса й повне ім’я не потрібні.',
  questionHelp:'Став відкриті запитання про свою ситуацію та вибір, а не про таємні думки інших людей.',
  contextHelp:'2–5 речень: що відбулося, чому це важливо, які варіанти ти вже розглядав. Не додавай зайвих приватних деталей.',
  horizonHelp:'Наприклад: «протягом наступних трьох місяців». Для Таро точна дата народження НЕ потрібна.',
  goalHelp:'Наприклад: «хочу зрозуміти можливі варіанти дій та питання для рефлексії».',
  privacy:'Дані цієї форми наразі залишаються лише у твоєму браузері. Не вводь документи, платіжні дані чи чужу конфіденційну інформацію.',
  preview:'Переглянути запит',clear:'Очистити форму',yourBrief:'Чернетка для експертки',copy:'Копіювати',copied:'Скопійовано',notYet:'Замовлення й оплата поки не працюють. Ця чернетка нікуди не надсилається і не зберігається.',
  required:'Сформулюй конкретне запитання та хоча б короткий контекст.',
  qPlaceholder:'Що мені варто усвідомити про…?',contextPlaceholder:'Опиши ситуацію своїми словами…',goalPlaceholder:'Хочу краще зрозуміти…'
 }
} as const;

export default function ReadingIntake({locale}:{locale:PortalLocale}){
 const t=T[locale];
 const [name,setName]=useState('');
 const [topic,setTopic]=useState(0);
 const [question,setQuestion]=useState('');
 const [context,setContext]=useState('');
 const [horizon,setHorizon]=useState('');
 const [goal,setGoal]=useState('');
 const [preview,setPreview]=useState(false);
 const [copied,setCopied]=useState(false);
 const ready=question.trim().length>=12&&context.trim().length>=20;
 const brief=[t.topic+': '+t.topicOptions[topic],name.trim()?t.name+': '+name.trim():null,t.question+': '+question.trim(),t.context+': '+context.trim(),horizon.trim()?t.horizon+': '+horizon.trim():null,goal.trim()?t.goal+': '+goal.trim():null].filter(Boolean).join('\n\n');
 function clear(){setName('');setTopic(0);setQuestion('');setContext('');setHorizon('');setGoal('');setPreview(false);setCopied(false);}
 async function copy(){
  try{await navigator.clipboard.writeText(brief);setCopied(true);}
  catch{setCopied(false);}
 }
 return <section className="as-intake" aria-labelledby="as-intake-title">
  <div className="as-section-heading"><div><span className="as-overline">HUMAN READINGS</span><h2 id="as-intake-title">{t.title}</h2><p>{t.intro}</p></div></div>
  <div className="as-intake-columns">
   <aside className="as-examples">
    <h3><Info size={18}/> {locale==='uk'?'Як краще питати':'How to ask'}</h3>
    <div className="as-example"><p className="as-less">{t.weak}</p><p className="as-better">{t.strong}</p></div>
    <div className="as-example"><p className="as-less">{t.secondWeak}</p><p className="as-better">{t.secondStrong}</p></div>
    <p className="as-privacy"><ShieldCheck size={18}/>{t.privacy}</p>
   </aside>
   <form className="as-intake-form" onSubmit={e=>{e.preventDefault();setPreview(true);setCopied(false);}}>
    <div className="as-form-row">
     <div><label htmlFor="as-name">{t.name}</label><input id="as-name" value={name} maxLength={80} onChange={e=>setName(e.target.value)}/><small>{t.nameHelp}</small></div>
     <div><label htmlFor="as-topic">{t.topic}</label><select id="as-topic" value={topic} onChange={e=>setTopic(Number(e.target.value))}>{t.topicOptions.map((v,i)=><option value={i} key={i}>{v}</option>)}</select></div>
    </div>
    <label htmlFor="as-question">{t.question} *</label><textarea id="as-question" rows={3} required minLength={12} maxLength={600} placeholder={t.qPlaceholder} value={question} onChange={e=>{setQuestion(e.target.value);setPreview(false);}}/><small>{t.questionHelp}</small>
    <label htmlFor="as-context">{t.context} *</label><textarea id="as-context" rows={5} required minLength={20} maxLength={2000} placeholder={t.contextPlaceholder} value={context} onChange={e=>{setContext(e.target.value);setPreview(false);}}/><small>{t.contextHelp}</small>
    <label htmlFor="as-horizon">{t.horizon}</label><input id="as-horizon" value={horizon} maxLength={140} onChange={e=>setHorizon(e.target.value)}/><small>{t.horizonHelp}</small>
    <label htmlFor="as-goal">{t.goal}</label><textarea id="as-goal" rows={2} maxLength={600} placeholder={t.goalPlaceholder} value={goal} onChange={e=>setGoal(e.target.value)}/><small>{t.goalHelp}</small>
    <div className="as-actions"><button type="submit" className="as-button as-button-primary" disabled={!ready}>{t.preview}</button><button className="as-button as-button-secondary" type="button" onClick={clear}>{t.clear}</button></div>
    {!ready&&<p className="as-form-hint" aria-live="polite">{t.required}</p>}
    {preview&&ready&&<div className="as-brief" role="status"><h3>{t.yourBrief}</h3><pre>{brief}</pre><button type="button" className="as-button as-button-secondary" onClick={copy}><ClipboardCopy size={17}/>{copied?t.copied:t.copy}</button><p>{t.notYet}</p></div>}
   </form>
  </div>
 </section>;
}
