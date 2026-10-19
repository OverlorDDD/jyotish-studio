/** Reusable pure timing model. No framework, personal data, side effects or health claims. */
export type BreathingPhase='inhale'|'holdIn'|'exhale'|'holdOut';
export type BreathingPattern={id:'box'|'equal'|'extended';seconds:Record<BreathingPhase,number>;rounds:number;
 title:{uk:string;en:string};summary:{uk:string;en:string};safety:{uk:string;en:string}};
export const PHASE_ORDER:BreathingPhase[]=['inhale','holdIn','exhale','holdOut'];
export const BREATHING_PATTERNS:BreathingPattern[]=[
 {id:'box',seconds:{inhale:4,holdIn:4,exhale:4,holdOut:4},rounds:15,
  title:{uk:'Дихання по квадрату',en:'Box breathing'},
  summary:{uk:'4 с вдих · 4 с пауза · 4 с видих · 4 с пауза',en:'4s inhale · 4s hold · 4s exhale · 4s hold'},
  safety:{uk:'Затримки — лише якщо комфортно. Якщо затримувати дихання неприємно, обери режим без пауз.',en:'Holds are optional. If holding your breath feels uncomfortable, choose a pattern without pauses.'}},
 {id:'equal',seconds:{inhale:4,holdIn:0,exhale:4,holdOut:0},rounds:30,
  title:{uk:'Рівне дихання',en:'Equal breathing'},
  summary:{uk:'4 с вдих · 4 с видих · без затримок',en:'4s inhale · 4s exhale · no holds'},
  safety:{uk:'Не форсуй глибину чи темп дихання: за потреби повернись до природного ритму.',en:'Never force breath depth or pace; return to your natural rhythm whenever needed.'}},
 {id:'extended',seconds:{inhale:3,holdIn:0,exhale:5,holdOut:0},rounds:30,
  title:{uk:'Подовжений видих',en:'Longer exhale'},
  summary:{uk:'3 с вдих · 5 с видих · без затримок',en:'3s inhale · 5s exhale · no holds'},
  safety:{uk:'Якщо довший видих незручний, повернись до звичайного дихання.',en:'If the longer exhale is uncomfortable, return to your usual breathing.'}}
];
export const patternById=(id:string)=>BREATHING_PATTERNS.find(p=>p.id===id);
export const cycleMs=(pattern:BreathingPattern)=>PHASE_ORDER.reduce((sum,p)=>sum+pattern.seconds[p]*1000,0);
export const sessionMs=(pattern:BreathingPattern)=>cycleMs(pattern)*pattern.rounds;
export type BreathFrame={phase:BreathingPhase;durationMs:number;phaseElapsedMs:number;ratio:number;cycle:number;completed:number;elapsedMs:number;remainingMs:number;done:boolean};
export function breathFrame(pattern:BreathingPattern,milliseconds:number):BreathFrame{
 const cycleLength=cycleMs(pattern);
 if(!Number.isFinite(cycleLength)||cycleLength<=0||pattern.rounds<=0)throw Error('Invalid breathing pattern');
 const full=sessionMs(pattern);
 const elapsedMs=Math.max(0,Math.min(full,Number.isFinite(milliseconds)?milliseconds:0));
 const done=elapsedMs>=full;
 const cycle=done?pattern.rounds:Math.floor(elapsedMs/cycleLength)+1;
 let within=done?cycleLength:elapsedMs%cycleLength;
 for(const phase of PHASE_ORDER){
  const durationMs=pattern.seconds[phase]*1000;
  if(durationMs<=0)continue;
  if(within<durationMs||phase==='holdOut'&&done){
   return {phase,durationMs,phaseElapsedMs:Math.min(durationMs,within),
    ratio:Math.min(1,within/durationMs),cycle,completed:done?pattern.rounds:cycle-1,
    elapsedMs,remainingMs:full-elapsedMs,done};
  }
  within-=durationMs;
 }
 const last=PHASE_ORDER.filter(p=>pattern.seconds[p]>0).at(-1)!;
 return {phase:last,durationMs:pattern.seconds[last]*1000,phaseElapsedMs:pattern.seconds[last]*1000,
  ratio:1,cycle,completed:pattern.rounds,elapsedMs,remainingMs:0,done};
}
export const formatBreathTime=(ms:number)=>{const sec=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');};
