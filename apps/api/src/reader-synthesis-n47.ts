/**
 * Reader N4.7: synthesis across verified D1 + thematic D9/D10/D27/D30.
 * All numbers/planets read from computed source, never from a guessed profile.
 * Narrative is written per locale; there is no LLM in the deterministic Reader.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable} from './reader-classical.ts';
export const SYNTHESIS_VERSION='n47-source-synthesis-v1' as const;
type Lang='uk'|'en';
type Highlight={id:'strength'|'challenge'|'career';division:number;title:string;text:string};
export type ReaderSynthesis={version:typeof SYNTHESIS_VERSION;title:string;opening:string;
 strength:string;challenge:string;direction:string;method:string;highlights:readonly Highlight[]};
type Topic={division:number;title:string;strength:string;challenge:string;step:string;proof:readonly string[]};
const SIGNS_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const P_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const HOUSES_UK=[
 'особисту ініціативу','матеріальну стабільність','спілкування й навички','дім та внутрішню опору',
 'творчість і навчання','щоденні зусилля та перешкоди','партнерство й домовленості',
 'спільну відповідальність і зміни','освіту та світогляд','професійну реалізацію',
 'команду й довгострокові цілі','усамітнену працю та відновлення'
];
const HOUSES_EN=[
 'personal initiative','financial stability','communication and skills','home and security',
 'creativity and learning','daily efforts and obstacles','partnership and agreements',
 'shared responsibility and change','education and beliefs','professional contribution',
 'teams and long-term goals','quiet work and restoration'
];
const safeHouse=(n:number)=>Number.isInteger(n)&&n>=1&&n<=12;
const clip=(s:string,max:number)=>s.length>max?s.slice(0,max).replace(/\s+\S*$/,'').replace(/[.,;: ]+$/,'')+'.':s;
export function buildSourceSynthesis(chart:CalculatedChart,lang:Lang,all:readonly Topic[],
 resourceDivision:number,frictionDivision:number):ReaderSynthesis{
 const uk=lang==='uk',named=(n:string)=>uk?(P_UK[n]||n):n;
 const phrase=(h:number)=>((uk?HOUSES_UK:HOUSES_EN)[h-1]||(uk?'життєві рішення':'life decisions'));
 const asc=chart.ascendant;
 const ruler=classicalLordshipTable(asc.sign)[1];
 const lord=chart.d1.find(x=>x.name===ruler);
 const moon=chart.d1.find(x=>x.name==='Moon');
 const work=all.find(x=>x.division===10)!;
 const partnership=all.find(x=>x.division===9)!;
 const strength=all.find(x=>x.division===resourceDivision)!;
 const challenge=all.find(x=>x.division===frictionDivision)!;
 const lordHouse=safeHouse(lord?.house||0)?lord!.house:1;
 const moonHouse=safeHouse(moon?.house||0)?moon!.house:1;
 const lordName=named(ruler);
 const sign=(uk?SIGNS_UK:SIGNS_EN)[asc.sign-1];
 const workProof=work.proof.find(s=>/^D1\.house-lord\.10=/.test(s));
 const workLord=workProof?.split('=')[1]||ruler;
 const focusProof=work.proof.find(s=>s.startsWith('D10.'+workLord+'.house='));
 const workHouse=Number(focusProof?.split('=')[1]);
 const vocational=safeHouse(workHouse)?phrase(workHouse):phrase(10);
 const opening=uk?
  'Ваша відправна точка — '+sign+' як висхідний знак. Його управитель '+lordName+
  ' розміщений у '+lordHouse+'-му домі: у традиційному читанні це поєднує особистий вибір і '+phrase(lordHouse)+
  '. Місяць у '+moonHouse+'-му домі додає до цього тему '+phrase(moonHouse)+
  '. Ці дві опори важливо читати разом, а не як два окремі гороскопи.':
  'Your rising sign is '+sign+'. Its ruler '+lordName+' falls in house '+lordHouse+
  ', linking personal direction with '+phrase(lordHouse)+'. The Moon in house '+moonHouse+
  ' brings in '+phrase(moonHouse)+'. Read these as related themes, not two independent predictions.';
 const opportunity=uk?
  'Найвиразніший підтримувальний акцент серед тематичних карт стосується «'+strength.title+'».'+
  ' '+clip(strength.strength,265):
  'The clearest supporting thematic emphasis concerns '+strength.title+'. '+clip(strength.strength,245);
 const risk=uk?
  'Водночас найбільш напружений із перевірених сюжетів стосується «'+challenge.title+'».'+
  ' '+clip(challenge.challenge,300):
  'The most challenging checked theme concerns '+challenge.title+'. '+clip(challenge.challenge,265);
 const direction=uk?
  'У професійному зрізі управитель десятої сфери '+named(workLord)+
  (safeHouse(workHouse)?' стоїть у '+workHouse+'-му домі й привертає увагу до теми '+vocational+'.':' вимагає окремого розгляду.')+
  ' '+clip(work.step,170)+' У близьких стосунках важливо пам’ятати й про інший сюжет — «'+partnership.title+'»: '+
  clip(partnership.step,165):
  'For vocation, the tenth-house ruler '+named(workLord)+
  (safeHouse(workHouse)?' occupies house '+workHouse+', bringing attention to '+vocational+'.':' calls for a separate check.')+
  ' '+clip(work.step,145)+' Relationships introduce a different lesson: '+clip(partnership.step,150);
 const highlights:Highlight[]=[
  {id:'strength',division:strength.division,title:uk?'Сильний бік · '+strength.title:'Resource · '+strength.title,
   text:clip(strength.strength,260)},
  {id:'challenge',division:challenge.division,title:uk?'Слабке місце · '+challenge.title:'Tension · '+challenge.title,
   text:clip(challenge.challenge,260)},
  {id:'career',division:10,title:uk?'Кар’єра · де зосередити зусилля':'Career · where to invest effort',
   text:uk?named(workLord)+' у професійній карті пов’язаний із '+vocational+'. '+clip(work.step,160):
    named(workLord)+' in the career chart connects with '+vocational+'. '+clip(work.step,155)}
 ];
 return {
  version:SYNTHESIS_VERSION,title:uk?'Головний сюжет вашої карти':'The central thread of your chart',
  opening,strength:opportunity,challenge:risk,direction,
  method:uk?'Синтез D1 з D9, D10 та тематичними картами. Підстави можна відкрити нижче; D60 не визначає цей висновок.':
   'Synthesis of D1, D9, D10 and the topical charts. Sources are available below; D60 does not determine this conclusion.',
  highlights
 };
}
