'use client';
import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCcw,Square,ShieldAlert} from 'lucide-react';
import {BREATHING_PATTERNS,breathFrame,formatBreathTime,sessionMs,type BreathingPhase} from '../../lib/breathing-patterns';
import type {ContentLocale} from '../../lib/yoga-content';

const PHASE_COPY:Record<BreathingPhase,{uk:string;en:string;instruction:{uk:string;en:string}}>={
 inhale:{uk:'Вдих',en:'Inhale',instruction:{uk:'М’яко вдихай носом. Живіт трохи розширюється під долонею, плечі залишаються розслабленими.',en:'Inhale gently through your nose. Let your belly expand softly under your hand, with shoulders relaxed.'}},
 holdIn:{uk:'Пауза після вдиху',en:'Hold after inhaling',instruction:{uk:'Не набирай додаткового повітря. Залишся у комфортній паузі без напруження шиї та горла.',en:'Do not take in extra air. Pause gently without tightening your throat or neck.'}},
 exhale:{uk:'Видих',en:'Exhale',instruction:{uk:'Спокійно видихай. Живіт природно повертається назад — не виштовхуй усе повітря силою.',en:'Exhale smoothly. Let your belly settle naturally; do not force all the air out.'}},
 holdOut:{uk:'Пауза після видиху',en:'Hold after exhaling',instruction:{uk:'М’яко зачекай перед наступним вдихом. Якщо пауза неприємна — припини або обери дихання без затримок.',en:'Pause gently before your next inhale. If it feels unpleasant, stop or choose a no-hold pattern.'}}
};
function SquarePacer({phase,ratio,uk}:{phase:BreathingPhase;ratio:number;uk:boolean}){
 const fromTo:Record<BreathingPhase,[[number,number],[number,number]]>={
  inhale:[[46,46],[254,46]],holdIn:[[254,46],[254,254]],
  exhale:[[254,254],[46,254]],holdOut:[[46,254],[46,46]]
 };
 const [a,b]=fromTo[phase],x=a[0]+(b[0]-a[0])*ratio,y=a[1]+(b[1]-a[1])*ratio;
 const hold=phase==='holdIn'||phase==='holdOut';
 const radius=hold?25+Math.round(32*ratio):phase==='inhale'?28+Math.round(28*ratio):56-Math.round(28*ratio);
 const title=PHASE_COPY[phase][uk?'uk':'en'];
 return <div className="as-breath-visual">
  <svg viewBox="0 0 300 300" role="img" aria-label={(uk?'Квадрат дихання: ':'Breathing square: ')+title}
   data-testid="breathing-square" data-phase={phase} className="as-breath-svg">
   <rect x="46" y="46" width="208" height="208" rx="6" fill="none" stroke="#74869a" strokeWidth="7"/>
   <path d="M46 46 H254 V254 H46 Z" fill="none" stroke="#d9ba7c" strokeWidth="3" strokeDasharray="2 10"/>
   <circle cx="150" cy="150" r={radius} fill={hold?'#b9a5dd38':'#91cbd630'} stroke={hold?'#c4b2e8':'#91d4dc'} strokeWidth="2" data-testid="breathing-orb"/>
   <circle cx="150" cy="150" r="60" stroke="#c9d6e21e" strokeWidth="1.5" fill="none"/>
   <text x="150" y="153" fill="#f8e6c3" textAnchor="middle" fontSize="16" fontWeight="600">{title}</text>
   <circle cx={x} cy={y} r="13" stroke="#162c3c" strokeWidth="3" fill="#f6d394" data-testid="breathing-marker"/>
   <text x="150" y="26" textAnchor="middle" fill="#cce9f2" fontSize="12">{uk?'Вдих':'Inhale'}</text>
   <text x="273" y="151" textAnchor="middle" fontSize="12" fill="#ead1b4" transform="rotate(90 273 151)">{uk?'Пауза після вдиху':'Hold in'}</text>
   <text x="150" y="279" textAnchor="middle" fill="#cbe5d2" fontSize="12">{uk?'Видих':'Exhale'}</text>
   <text x="27" y="151" textAnchor="middle" fontSize="12" fill="#e1d1ee" transform="rotate(-90 27 151)">{uk?'Пауза після видиху':'Hold out'}</text>
  </svg>
  </div>;
}
export default function YogaBreathSession({locale}:{locale:ContentLocale}){
 const uk=locale==='uk';
 const [mode,setMode]=useState('box');
 const pattern=BREATHING_PATTERNS.find(x=>x.id===mode)!;
 const [state,setState]=useState<'ready'|'running'|'paused'|'complete'|'stopped'>('ready');
 const [elapsed,setElapsed]=useState(0);
 const elapsedRef=useRef(0);
 const frame=breathFrame(pattern,elapsed);
 const lastTick=useRef<number|null>(null);
 useEffect(()=>{
  if(state!=='running')return;
  let id=0;
  const tick=(stamp:number)=>{
   if(lastTick.current!==null){
    const dt=Math.min(250,Math.max(0,stamp-lastTick.current));
    const next=Math.min(sessionMs(pattern),elapsedRef.current+dt);
    elapsedRef.current=next;setElapsed(next);
    if(next>=sessionMs(pattern)){lastTick.current=null;setState('complete');return;}
   }
   lastTick.current=stamp;id=requestAnimationFrame(tick);
  };
  id=requestAnimationFrame(tick);
  const hidden=()=>{if(document.hidden){setState('paused');lastTick.current=null;}};
  document.addEventListener('visibilitychange',hidden);
  return ()=>{cancelAnimationFrame(id);document.removeEventListener('visibilitychange',hidden);lastTick.current=null;};
 },[state,pattern]);
 const reset=(nextState:'ready'|'running'='ready')=>{elapsedRef.current=0;setElapsed(0);setState(nextState);lastTick.current=null;};
 const ready=state==='ready',running=state==='running',ended=state==='complete'||state==='stopped';
 const displayed=PHASE_COPY[frame.phase];
 return <section className="as-breath-player" aria-label={uk?'Візуальний тренажер дихання':'Visual breathing pacer'}>
  <div className="as-breath-intro">
   <span className="as-overline">{uk?'ДИХАЛЬНА ПРАКТИКА':'BREATHING PRACTICE'}</span>
   <h2>{uk?'Слідкуй за квадратом':'Follow the breathing square'}</h2>
   <p>{uk?'Один рух мітки — одна фаза. Повний оберт квадрата — один дихальний цикл. Короткі фази у секундах, а не хвилинах.':'Each moving edge marks one phase. One lap around the square is one breathing cycle. Phases last seconds, not minutes.'}</p>
  </div>
  <div className="as-breath-selector" role="group" aria-label={uk?'Техніка дихання':'Breathing technique'}>
   {BREATHING_PATTERNS.map(p=><button key={p.id} type="button" data-testid={'pattern-'+p.id}
    disabled={!ready} aria-pressed={mode===p.id} className={'as-breath-mode '+(mode===p.id?'is-selected':'')}
    onClick={()=>setMode(p.id)}>
    <strong>{p.title[locale]}</strong><span>{p.summary[locale]}</span>
   </button>)}
  </div>
  <aside className="as-breath-belly"><strong>{uk?'Як дихати діафрагмою':'Diaphragmatic breathing'}</strong>
   <p>{uk?'Поклади одну руку на живіт нижче ребер, іншу — на верх грудей. На плавному вдиху живіт м’яко піднімається під рукою; на видиху опускається. Дихай комфортно, не намагайся «надути» живіт силою.':'Place one hand below your ribs and another on your chest. On a gentle inhale, the belly softly rises under your hand; it settles on exhale. Do not push or force a large breath.'}</p>
  </aside>
  <div className="as-breath-stage">
   <SquarePacer phase={frame.phase} ratio={frame.ratio} uk={uk}/>
   <div className="as-breath-readout">
    {ready?<><span className="as-overline">{uk?'ПЕРЕД СТАРТОМ':'BEFORE STARTING'}</span>
      <h3>{pattern.title[locale]}</h3>
      <p>{uk?'Сядь зручно, розслаб плечі. Натисни «Поїхали!» і дихай у ритмі маркера.':'Sit comfortably and relax your shoulders. Select “Let’s go!” and follow the marker.'}</p>
    </>:ended?<><span className="as-overline">{uk?'ПІДСУМОК':'SESSION STATUS'}</span>
      <h3>{state==='complete'?(uk?'Усі цикли завершено':'All cycles completed'):(uk?'Сесію зупинено':'Session stopped')}</h3>
      <p>{state==='complete'?(uk?'Ти пройшов(-ла) обраний ритм. Повернись до звичайного дихання.':'You followed the chosen rhythm. Return to natural breathing.'):(uk?'Зупинитися в будь-який момент — нормально. Повернись до комфортного дихання.':'Stopping anytime is fine. Return to comfortable breathing.')}</p>
    </>:<>
     <span className="as-overline">{running?(uk?'ЗАРАЗ':'NOW'):(uk?'ПАУЗА':'PAUSED')}</span>
     <h3 data-testid="breath-phase" aria-live="polite">{displayed[locale]}</h3>
     <p>{displayed.instruction[locale]}</p>
     <strong data-testid="phase-countdown" className="as-breath-countdown">{Math.ceil((frame.durationMs-frame.phaseElapsedMs)/1000)} {uk?'с':'s'}</strong>
    </>}
    <div className="as-breath-stats">
     <span>{uk?'Цикл':'Cycle'} <strong data-testid="breath-round">{frame.cycle} / {pattern.rounds}</strong></span>
     <span>{uk?'Залишилось':'Remaining'} <strong role="timer">{formatBreathTime(frame.remainingMs)}</strong></span>
    </div>
    <progress aria-label={uk?'Прогрес циклів':'Cycle progress'} max={sessionMs(pattern)} value={elapsed}/>
    <div className="as-breath-actions">
     {ready?<button className="as-button as-button-primary" type="button" onClick={()=>reset('running')} data-testid="breath-start"><Play size={18}/>{uk?'Поїхали!':"Let's go!"}</button>:
     ended?<button className="as-button as-button-primary" type="button" onClick={()=>reset()}><RotateCcw size={17}/>{uk?'Ще раз':'Start again'}</button>:
     <><button className="as-button as-button-primary" type="button" onClick={()=>setState(running?'paused':'running')}>
      {running?<Pause size={17}/>:<Play size={17}/>}
      {running?(uk?'Пауза':'Pause'):(uk?'Продовжити':'Resume')}
     </button>
     <button className="as-button as-button-secondary" type="button" onClick={()=>setState('stopped')}><Square size={15}/>{uk?'Зупинити':'Stop'}</button></>}
    </div>
    <p className="as-breath-safety"><ShieldAlert size={16} aria-hidden="true"/>{pattern.safety[locale]} {uk?'Якщо паморочиться голова, є біль або бракує повітря — зупинись. Не практикуй за кермом.':'Stop if dizzy, in pain or short of breath. Never use while driving.'}</p>
   </div>
  </div>
 </section>;
}
