/**
 * N4.9.1 concise per-varga interpretation, not an additional free-standing report.
 * One D1 house lord, one verified subject varga, one relevant SECOND varga.
 * No numerology, cross-varga house equivalence or full-planet-strength claim.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
export const N491_CARD_EDITION='n491-compact-cross-varga-v1' as const;
type Lang='uk'|'en';
type Contrast='agreement'|'conflict'|'care'|'unresolved';
export type N491Card={
 division:number;lead:string;connection:string;relatedDivision:number;
 contrast:Contrast;proof:readonly string[];
};
const DIVS=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45] as const;
// Each cross-reference is relevant by topic, not selected just to be positive.
const RELATED:Readonly<Record<number,number>>={
 1:9,2:10,3:27,4:12,7:9,9:7,10:24,12:4,16:4,
 20:9,24:10,27:30,30:27,40:12,45:9
};
const HOUSE_BY_VARGA:Readonly<Record<number,number>>={
 1:1,2:2,3:3,4:4,7:5,9:7,10:10,12:4,16:4,
 20:9,24:5,27:1,30:6,40:4,45:9
};
const AREAS_UK=['особистими рішеннями','грошима й власними ресурсами',
 'спілкуванням і навичками','домом та відчуттям опори','творчістю і навчанням',
 'щоденною роботою','партнерством і домовленостями','спільними зобов’язаннями та змінами',
 'знаннями й світоглядом','професійною роллю','командою та результатами',
 'відновленням і усамітненням'];
const AREAS_EN=['personal decisions','money and resources',
 'communication and skills','home and stability','creativity and learning',
 'daily work','partnership and agreements','shared responsibilities and change',
 'knowledge and worldview','professional responsibilities','teams and results',
 'recovery and solitude'];
const FOCUS:Readonly<Record<number,[string,string]>>={
 1:['життєвого напряму','life direction'],2:['фінансів','finances'],
 3:['спілкування','communication'],4:['дому','home and property'],
 7:['творчості та турботи','creativity and care'],9:['стосунків','relationships'],
 10:['кар’єри','career'],12:['сімейних зв’язків','family roots'],
 16:['комфорту','comfort'],20:['духовної практики','spiritual practice'],
 24:['навчання','education'],27:['витривалості','resilience'],
 30:['подолання перешкод','handling obstacles'],40:['родинних тенденцій','family patterns'],
 45:['успадкованих цінностей','inherited values']
};
const SIGN_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах',
 'Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
 'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANET_UK:Readonly<Record<string,string>>={
 Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',
 Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'
};
const positive=(d:string)=>d==='own'||d==='exalted';
const negative=(d:string)=>d==='debilitated';
export function n491Contrast(a:string,b:string):Contrast{
 if(positive(a)&&negative(b)||negative(a)&&positive(b))return 'conflict';
 if(positive(a)&&positive(b))return 'agreement';
 if(negative(a)||negative(b))return 'care';
 return 'unresolved';
}
function interpretation(from:number,to:number,uk:boolean){
 if(from===9&&to===6)return uk?
  'Тут знання та пошук власного шляху переходять у конкретну щоденну роботу.':
  'Knowledge and a sense of direction meet the demands of practical daily work.';
 if(from===6&&to===8)return uk?
  'Тут щоденна дисципліна пов’язується зі здатністю переживати зміни, а не з готовою обіцянкою результату.':
  'Daily discipline is read together with adapting to change, not as a guaranteed outcome.';
 if(from===12&&to===7)return uk?
  'Потреба в тиші й відновленні впливає на те, як будуються домовленості з іншими.':
  'A need for privacy and recovery meets the demands of close relationships.';
 if(from===4&&to===10)return uk?
  'Домашня опора і відповідальність у роботі виявляються пов’язаними темами.':
  'Foundations at home and responsibility at work become connected themes.';
 if(from===2&&to===10)return uk?
  'Ставлення до власних ресурсів переходить у питання професійних результатів.':
  'Personal resources connect to professional outcomes.';
 if(from===10&&to===7)return uk?
  'Професійні рішення можуть впливати на потребу в чесних домовленостях.':
  'Professional decisions meet the need for clear agreements with others.';
 if(from===to)return uk?
  'Обидва ракурси повторюють цю сферу: вона заслуговує на окрему увагу.':
  'Both charts emphasize this same area rather than pointing to separate life themes.';
 // No fabricated causal life claim for a house pair without a matching rule.
 return '';
}
function statusSentence(c:Contrast,uk:boolean){
 if(c==='conflict')return uk?
  'Положення планети в знаках дають різні оцінки, тому легкого висновку про успіх тут немає.':
  'Sign placements give contrasting indications, so neither chart settles the outcome alone.';
 if(c==='agreement')return uk?
  'Два знакові положення підтримують цю тему; це не повна оцінка сили планети.':
  'Both sign placements support the theme, although this is not full planetary strength.';
 if(c==='care')return uk?
  'Одне зі знакових положень потребує обережнішого прочитання, а не негативного прогнозу.':
  'One sign placement calls for care, not a prediction of failure.';
 return ''; // Ambiguous indicators should add NO filler text.
}
export function buildN491Cards(chart:CalculatedChart,lang:Lang):readonly N491Card[]|null{
 const source=verifiedVargaSource(chart);
 if(!source)return null;
 const uk=lang==='uk',lords=classicalLordshipTable(chart.ascendant.sign);
 const area=(house:number)=>(uk?AREAS_UK:AREAS_EN)[house-1];
 const sign=(s:number)=>(uk?SIGN_UK:SIGN_EN)[s-1];
 const name=(planet:string)=>uk?PLANET_UK[planet]||planet:planet;
 const result=DIVS.map(division=>{
  const lord=lords[HOUSE_BY_VARGA[division]],relatedDivision=RELATED[division];
  const d1=chart.d1.find(p=>p.name===lord);
  const dn=source.charts.find(c=>c.division===division)?.planets.find(p=>p.name===lord);
  const other=source.charts.find(c=>c.division===relatedDivision)?.planets.find(p=>p.name===lord);
  if(!d1||!dn||!other)throw Error('N491_MISSING_VERIFIED_VARGA_EVIDENCE_'+division);
  const topic=FOCUS[division][uk?0:1];
  const lead=uk?
   'Для '+topic+' важливий '+name(lord)+': у головній карті він у '+sign(d1.sign)+
   ' ('+area(d1.house)+'), а в D'+division+' — у '+sign(dn.sign)+
   ' ('+area(dn.house)+'). '+interpretation(d1.house,dn.house,true):
   'For '+topic+', '+name(lord)+' is a relevant indicator: in the birth chart it occupies '+
   sign(d1.sign)+' ('+area(d1.house)+'), and in D'+division+' it occupies '+
   sign(dn.sign)+' ('+area(dn.house)+'). '+interpretation(d1.house,dn.house,false);
  const contrast=n491Contrast(dignityFor(lord,dn.sign),dignityFor(lord,other.sign));
  const connection=(uk?
   'Зв’язок із D'+relatedDivision+': той самий '+name(lord)+
   ' перебуває у '+sign(other.sign)+' (тема '+area(other.house)+'). ':
   'Connected to D'+relatedDivision+': the same '+name(lord)+
   ' occupies '+sign(other.sign)+' ('+area(other.house)+'). ')+statusSentence(contrast,uk);
  return {division,lead:lead.trim(),connection:connection.trim(),relatedDivision,contrast,
   proof:[
    'D1.house-lord.'+HOUSE_BY_VARGA[division]+'='+lord,
    'D1.'+lord+'.sign='+d1.sign,'D1.'+lord+'.house='+d1.house,
    'D'+division+'.'+lord+'.sign='+dn.sign,'D'+division+'.'+lord+'.house='+dn.house,
    'D'+relatedDivision+'.'+lord+'.sign='+other.sign,
    'D'+relatedDivision+'.'+lord+'.house='+other.house
   ]} satisfies N491Card;
 });
 return result;
}
