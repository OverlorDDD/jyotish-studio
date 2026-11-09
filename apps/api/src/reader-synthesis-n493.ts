/**
 * N4.9.3 whole-chart conclusion: derivation from chart facts, NEVER joined
 * already-rendered pattern 'implications'. Every sentence has a new role.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
type Lang='uk'|'en';
const NAMES:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const SIGNS_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const AREA_UK=[
 'власних рішень','матеріальної опори','спілкування й навичок',
 'дому та стабільності','творчості й навчання','праці та складних задач',
 'партнерства','спільних зобов’язань','знань і наставників',
 'кар’єрної відповідальності','спільнот і результатів','приватності й відновлення'
];
const AREA_EN=[
 'personal choice','material support','communication and skills',
 'home and stability','creativity and learning','daily work and obstacles',
 'partnership','shared responsibility','knowledge and mentors',
 'professional responsibility','community and achievements','privacy and recovery'
];
export type N493Synthesis={title:string;strength:string;attention:string;direction:string;proof:string[]};
export function synthesizeN493(chart:CalculatedChart,lang:Lang):N493Synthesis|null{
 const n4=verifiedVargaSource(chart);if(!n4)return null;
 const uk=lang==='uk',lp=classicalLordshipTable(chart.ascendant.sign);
 const p=(name:string)=>chart.d1.find(x=>x.name===name)!;
 const d=(div:number,name:string)=>n4.charts.find(x=>x.division===div)!.planets.find(x=>x.name===name)!;
 const name=(planet:string)=>uk?NAMES[planet]||planet:planet;
 const area=(house:number)=>(uk?AREA_UK:AREA_EN)[house-1];
 const sign=(s:number)=>(uk?SIGNS_UK:SIGNS_EN)[s-1];
 const head=lp[1],career=lp[10],partner=lp[7],c1=p(head),c10=p(career),c7=p(partner);
 const v10=d(10,career),v24=d(24,career);
 const dignity=dignityFor(career,v10.sign);
 const careerYoga=yogakarakasForLagna(chart.ascendant.sign).includes(career);
 const bothCareerEducation=dignityFor(career,v24.sign);
 const bothSupport=['own','exalted'].includes(dignity)&&['own','exalted'].includes(bothCareerEducation);
 const all=chart.d1.filter(x=>dignityFor(x.name,x.sign)==='debilitated');
 const significant=all.find(x=>[head,career,partner,lp[5]].includes(x.name))||all[0];
 const influence=significant?
  Array.from({length:12},(_,i)=>i+1).filter(h=>lp[h]===significant.name):[];
 let strength:string;
 if(careerYoga){
  const houses=Array.from({length:12},(_,i)=>i+1).filter(h=>lp[h]===career);
  strength=uk?
   name(career)+' для вашого висхідного знака керує '+houses.join('-м і ')+'-м домами — поєднує творчу або смислову сферу з професійною. '+
    'У D10 він у '+v10.house+'-му домі, у знаку «'+sign(v10.sign)+'»'+
    (dignity==='exalted'?' — це його екзальтація.':dignity==='own'?' — це власний знак.':'.')+
    (bothSupport?' D24 також показує підтримувальне положення, важливе для теми навчання.':''):
   career+' is a yogakaraka for this ascendant, ruling houses '+houses.join(' and ')+
    '. In D10 it occupies house '+v10.house+' in '+sign(v10.sign)+
    (dignity==='exalted'?', its exaltation sign.':dignity==='own'?', its own sign.':'.')+
    (bothSupport?' D24 adds a supportive education-related sign placement.':'');
 }else if(dignity==='exalted'||dignity==='own'){
  strength=uk?
   'Управитель кар’єри — '+name(career)+' у D1 у '+c10.house+'-му домі. У професійній D10 він у '+v10.house+
    '-му домі, у знаку «'+sign(v10.sign)+'»'+(dignity==='exalted?' — знаку екзальтації.':' — власному знаку.'):
   'The career ruler '+career+' occupies D1 house '+c10.house+
    '. In D10 it occupies house '+v10.house+' in '+sign(v10.sign)+
    (dignity==='exalted'?', its exaltation sign.':', its own sign.');
 }else{
  strength=uk?
   'Найвиразніший практичний зв’язок: '+name(career)+' керує професією, перебуває в D1 у '+
    c10.house+'-му домі ('+area(c10.house)+'), а в D10 — у '+v10.house+'-му ('+area(v10.house)+').':
   'The vocational ruler '+career+' connects D1 house '+c10.house+' ('+area(c10.house)+
    ') with D10 house '+v10.house+' ('+area(v10.house)+').';
 }
 const moon=p('Moon');
 let attention:string;
 if(significant){
  attention=uk?
   name(significant.name)+' у D1 перебуває у знаку «'+sign(significant.sign)+'» — традиційне падіння. '+
    'Планета керує '+influence.join('-м і ')+'-м домами; без перевірки аспектів і можливого скасування падіння цей показник не є остаточним висновком.':
   significant.name+' occupies '+sign(significant.sign)+' in D1 (traditional debilitation) and rules houses '+
    influence.join(' and ')+'. Aspects and cancellation conditions have not been checked.';
 }else if(moon.house===12||c1.house===12){
  attention=uk?
   'Місяць або управитель висхідного знака пов’язаний із 12-м домом: темами тиші та відновлення. '+
    'Це окремий акцент поруч із професійною сферою '+area(v10.house)+', а не ознака слабкості людини.':
   'The Moon or ascendant ruler connects to house 12: privacy and restoration. '+
    'This differs from D10 themes of '+area(v10.house)+' without implying personal weakness.';
 }else{
  attention=uk?
   'Місяць перебуває в '+moon.house+'-му домі ('+area(moon.house)+'), а професійна D10 підкреслює '+
    area(v10.house)+'. Ці символічні сфери важливо не змішувати в один висновок.':
   'The Moon occupies house '+moon.house+' ('+area(moon.house)+'), while D10 emphasizes '+
    area(v10.house)+'. These are distinct symbolic domains.';
 }
 let direction:string;
 if(head===career){
  direction=uk?
   name(head)+' одночасно керує 1-м і 10-м домами, тому особистий і професійний вектори спираються на одну планету. '+
    'Водночас партнерством керує '+name(partner)+' у '+c7.house+'-му домі; його слід оцінювати окремо, а не переносити робочий висновок на близькість.':
   'The same '+head+' rules both identity and vocation, joining those themes in one planet. '+
    'Partnership is ruled by '+partner+' in house '+c7.house+' and requires its own D9 assessment.';
 }else if(c10.house===c7.house){
  direction=uk?
   'У D1 управителі кар’єри ('+name(career)+') і партнерства ('+name(partner)+') перебувають у '+c10.house+
    '-му домі. Це спільна життєва сфера, але не гарантія однакових результатів у роботі й близькості; D10 і D9 залишаються окремими перевірками.':
   'Career ruler '+career+' and partnership ruler '+partner+' occupy the same D1 house '+c10.house+
    '. They share an arena without promising identical outcomes: D10 and D9 still answer different questions.';
 }else{
  direction=uk?
   'Управитель вашого особистого напряму ('+name(head)+') стоїть у '+c1.house+'-му домі, '+
    'кар’єри ('+name(career)+') — у '+c10.house+'-му, партнерства ('+name(partner)+') — у '+
    c7.house+'-му. Їхні ролі різні; у практичних рішеннях не варто робити висновок за одним сильним знаком.':
   'The identity ruler '+head+' occupies D1 house '+c1.house+', vocation ruler '+career+
    ' house '+c10.house+', and partnership ruler '+partner+' house '+c7.house+
    '. They serve different roles, so a single strong sign cannot decide every life area.';
 }
 return {title:uk?'Ваш головний астрологічний портрет':'Your key chart synthesis',
  strength,attention,direction,proof:[
   'D1.ascendant.sign='+chart.ascendant.sign,'D1.house-lord.1='+head,
   'D1.house-lord.10='+career,'D1.'+career+'.house='+c10.house,
   'D10.'+career+'.house='+v10.house,'D10.'+career+'.sign='+v10.sign,
   'D1.house-lord.7='+partner,'D1.'+partner+'.house='+c7.house,
   'D1.Moon.house='+moon.house,
   ...(significant?['D1.'+significant.name+'.sign='+significant.sign]:[])
  ]};
}
