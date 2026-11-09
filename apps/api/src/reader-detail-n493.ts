/**
 * N493 subject depth for the ten thematic D-cards previously reduced to
 * D1-ruler → Dn sign + generic action. The second planet is a declared
 * context indicator (never a proven prediction, independent benefic vote,
 * or a verse citation we haven't verified).
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
type Lang='uk'|'en';
export const N493_THEMATIC_DIVISIONS=[3,4,7,12,16,20,27,30,40,45] as const;
const SUBJECT:Readonly<Record<number,{house:number;reference:string;uk:[string,string];en:[string,string]}>>={
 3:{house:3,reference:'Mars',uk:['ініціативи та спілкування','рішучістю та дією'],en:['initiative and communication','decisive action']},
 4:{house:4,reference:'Moon',uk:['власності та домашньої опори','внутрішнім відчуттям дому'],en:['property and home','the need for stability']},
 7:{house:5,reference:'Jupiter',uk:['дітей і творчої спадщини','навчанням, передачею досвіду й підтримкою'],en:['children and creative legacy','mentorship and passing on knowledge']},
 12:{house:4,reference:'Sun',uk:['батьків і родинного коріння','батьківською роллю та авторитетом'],en:['parents and ancestral roots','parental authority and example']},
 16:{house:4,reference:'Venus',uk:['побутового комфорту й транспорту','зручністю та естетичними потребами'],en:['comfort and vehicles','personal comfort and aesthetics']},
 20:{house:9,reference:'Jupiter',uk:['духовної практики','пошуком сенсу та навчанням'],en:['spiritual practice','study and the search for meaning']},
 27:{house:1,reference:'Mars',uk:['витривалості','здатністю діяти під тиском'],en:['resilience','decisive energy']},
 30:{house:6,reference:'Saturn',uk:['перешкод і складних обставин','терпінням і тривалою працею'],en:['obstacles and challenging circumstances','patience and long-term effort']},
 40:{house:4,reference:'Moon',uk:['материнської лінії','способами турботи та підтримки'],en:['maternal lineage','care and support']},
 45:{house:9,reference:'Sun',uk:['батьківської лінії та переданих принципів','прикладом авторитету та власною позицією'],en:['paternal lineage and inherited values','authority and personal principles']}
};
const UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',
 Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const UK_CASE=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні',
 'Стрільці','Козорозі','Водолії','Рибах'];
const EN_CASE=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio',
 'Sagittarius','Capricorn','Aquarius','Pisces'];
const HOUSES_UK=['особистої ініціативи','ресурсів та способу говорити','навичок і спілкування',
 'дому й внутрішньої опори','творчості та освіти','щоденної праці та подолання труднощів',
 'партнерських домовленостей','довіри та спільної відповідальності','освіти та світогляду',
 'професійної діяльності','здобутків і спільнот','усамітнення та відновлення'];
const HOUSES_EN=['personal initiative','resources and speech','skills and communication',
 'home and foundations','creativity and study','daily work and challenges',
 'partnership','trust and shared duties','education and worldview',
 'professional work','results and communities','privacy and recovery'];
const pname=(name:string,uk:boolean)=>uk?UK[name]||name:name;
const sign=(n:number,uk:boolean)=>(uk?UK_CASE:EN_CASE)[n-1];
const house=(n:number,uk:boolean)=>(uk?HOUSES_UK:HOUSES_EN)[n-1];
const good=(v:string)=>v==='own'||v==='exalted';
const badge=(d:string,uk:boolean)=>d==='exalted'?(uk?'екзальтації':'exaltation'):
 d==='own'?(uk?'власному знаку':'own sign'):
 d==='debilitated'?(uk?'знаку падіння':'debilitation sign'):'';
export function buildN493ThematicDetail(chart:CalculatedChart,lang:Lang,division:number):
 {meaning:string;proof:string[];primary:string;secondary:string}|null{
 const focus=SUBJECT[division],source=verifiedVargaSource(chart);
 if(!focus||!source)return null;
 const uk=lang==='uk';
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const primary=lords[focus.house];
 // Never double-count one planet as two independent thematic observations.
 const secondary=focus.reference===primary?(primary==='Moon'?'Sun':'Moon'):focus.reference;
 const p1=chart.d1.find(p=>p.name===primary)!;
 const p2=chart.d1.find(p=>p.name===secondary)!;
 const v=source.charts.find(c=>c.division===division)!;
 const d1=v.planets.find(p=>p.name===primary)!;
 const d2=v.planets.find(p=>p.name===secondary)!;
 const q1=dignityFor(primary,d1.sign),q2=dignityFor(secondary,d2.sign);
 const area=uk?focus.uk:focus.en;
 const different=d1.house!==d2.house;
 const duo=uk?
  'У D'+division+' '+pname(primary,uk)+' перебуває у '+d1.house+'-му домі ('+
   house(d1.house,uk)+'), а '+pname(secondary,uk)+' — у '+d2.house+'-му ('+
   house(d2.house,uk)+').':
  'In D'+division+', '+primary+' occupies house '+d1.house+' ('+house(d1.house,uk)+
   '), while '+secondary+' occupies house '+d2.house+' ('+house(d2.house,uk)+').';
 const context=uk?
  'У D1 управитель тематичного '+focus.house+'-го дому '+pname(primary,uk)+
  ' стоїть у '+p1.house+'-му домі ('+house(p1.house,uk)+
  '); додатковий показник '+pname(secondary,uk)+' — у '+p2.house+'-му.':
  'In D1, natal house '+focus.house+' is ruled by '+primary+
  ' in house '+p1.house+' ('+house(p1.house,uk)+
  '); the secondary indicator '+secondary+' occupies house '+p2.house+'.';
 const meaning=uk?
  'Для теми '+area[0]+' тут важливо зіставити управителя та планету, пов’язану з '+
  area[1]+'. '+context+' '+duo+' '+
  (different?'Ці два положення в тематичній карті підкреслюють різні сфери, тому один висновок не повинен замінювати інший. ':
   'Обидві планети опиняються в одній тематичній сфері, що робить її помітним предметом для розгляду. ')+
  (good(q1)||good(q2)?'Знакова підтримка присутня у '+(good(q1)&&good(q2)?'двох показниках':
   good(q1)?pname(primary,uk):pname(secondary,uk))+
    ', але її не можна прирівнювати до повної сили планет.':
    q1==='debilitated'||q2==='debilitated'?'Є напружений знаковий показник; його слід перевіряти разом з іншими умовами.':
    'Однозначної сильної знакової оцінки немає; висновок обмежується розрахованими зв’язками.'):
  'For '+area[0]+', read its natal ruler together with a second indicator of '+area[1]+'. '+
  context+' '+duo+' '+
  (different?'They occupy different thematic houses, so one cannot stand in for the other. ':
   'They share a thematic house; this is a focus for interpretation, not a forecast. ')+
  (good(q1)||good(q2)?'Supportive sign dignity appears for '+
   (good(q1)&&good(q2)?'both indicators':good(q1)?primary:secondary)+
   ', though it is not full planetary strength.':
   q1==='debilitated'||q2==='debilitated'?'A challenging sign dignity needs other factors before a conclusion.':
   'There is no decisive positive dignity; the interpretation stays within the calculated relationships.');
 const proof=['D1.house-lord.'+focus.house+'='+primary,
  'D1.'+primary+'.house='+p1.house,'D1.'+secondary+'.house='+p2.house,
  'D'+division+'.'+primary+'.house='+d1.house,'D'+division+'.'+primary+'.sign='+d1.sign,
  'D'+division+'.'+secondary+'.house='+d2.house,'D'+division+'.'+secondary+'.sign='+d2.sign];
 return {meaning,proof,primary,secondary};
}
