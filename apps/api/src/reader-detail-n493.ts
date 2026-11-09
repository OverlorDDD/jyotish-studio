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
 // The thematic story is evidence → interpretation → a grounded action,
 // not a list of two planetary positions and a generic disclaimer.
 const PRACTICE:Record<number,[string,string]>={
 3:['Підготуйте одну важливу розмову і перевірте, чи ваша рішучість поєднується зі слуханням.',
    'Prepare one important conversation; test whether resolve is paired with listening.'],
 4:['Перед рішенням про житло відокремте матеріальну стабільність від потреби відчувати себе вдома.',
    'Before a housing decision, separate material security from the feeling of belonging.'],
 7:['Знайдіть конкретний спосіб передати знання або підтримати чийсь розвиток, не роблячи прогнозу про дітей.',
    'Find one tangible way to share knowledge or nurture growth without predicting children.'],
 12:['Оберіть успадковане сімейне правило й перевірте, чи воно допомагає вашому теперішньому вибору.',
     'Choose one inherited family rule and test whether it helps your choices now.'],
 16:['Перевірте, чи конкретна покупка або зміна побуту справді полегшує ваш день.',
     'Check whether a concrete purchase or change in routine genuinely makes life easier.'],
 20:['Обирайте посильний ритм духовної практики; оцінюйте сталість, а не обіцянки швидкого результату.',
     'Choose a sustainable spiritual routine; judge consistency, not promises of quick results.'],
 27:['Для складного завдання заздалегідь визначте межу навантаження й спосіб відновлення.',
     'For a demanding task, define both a workload limit and a recovery plan.'],
 30:['Назвіть одну повторювану перешкоду: що ви можете змінити, а що потребує витримки?',
     'Name one recurring obstacle: what can you change and what requires patience?'],
 40:['Порівняйте успадковану модель турботи з підтримкою, яку ви справді хочете отримувати.',
     'Compare an inherited style of care with the support you actually need.'],
 45:['Сформулюйте власними словами один родинний принцип, який ви свідомо залишаєте собі.',
     'Restate one family principle you consciously choose to keep.']
 };
 const natal=uk?'У D1 управитель '+focus.house+'-го дому '+pname(primary,uk)+
  ' стоїть у '+p1.house+'-му домі ('+house(p1.house,uk)+'). ':
  'In D1, house '+focus.house+' is ruled by '+primary+' in house '+p1.house+
  ' ('+house(p1.house,uk)+'). ';
 const varga=uk?'У D'+division+' він у '+d1.house+'-му домі ('+
  house(d1.house,uk)+'), у '+sign(d1.sign,uk)+'. ':
  'In D'+division+' it is in house '+d1.house+' ('+house(d1.house,uk)+
  '), in '+sign(d1.sign,uk)+'. ';
 const bridge=uk?(p1.house===d1.house?
  'Обидві карти підкреслюють '+house(d1.house,uk)+': це сфера, через яку тема набуває практичного вираження. ':
  'Головний перехід — від '+house(p1.house,uk)+' до '+house(d1.house,uk)+
  '. Перше задає мотив, друге показує тематичний спосіб його реалізації. '):
  (p1.house===d1.house?
  'Both views emphasize '+house(d1.house,uk)+' as the arena of expression. ':
  'The central shift is from '+house(p1.house,uk)+' toward '+house(d1.house,uk)+
  ': one frames the motive, the other the thematic expression. ');
 const second=uk?(d1.house===d2.house?
  pname(secondary,uk)+' як окремий показник, пов’язаний із '+area[1]+' займає ту саму сферу D'+division+
  '; це спільна тема, але не подвійна обіцянка результату. ':
  pname(secondary,uk)+' як окремий показник, пов’язаний із '+area[1]+' у D'+division+
  ' стоїть у '+d2.house+'-му домі ('+house(d2.house,uk)+
  '). Це інша потреба, яку важливо не підміняти першою. '):
  (d1.house===d2.house?
  'The distinct indicator '+secondary+' ('+area[1]+
  ') shares that D'+division+' house: one theme, not two outcome guarantees. ':
  'The separate indicator '+secondary+' ('+area[1]+') occupies D'+division+
  ' house '+d2.house+' ('+house(d2.house,uk)+'); its needs need a separate answer. ');
 const qualified=good(q1)?(uk?'Знакова гідність управителя підтримує мотив, але не обіцяє подій. ':
  'The ruler has supportive sign dignity, not a promise of events. '):
  q1==='debilitated'?(uk?'Знак падіння управителя вимагає перевірки інших умов, а не фатального висновку. ':
  'The ruler’s debilitation calls for checking other factors, not a verdict. '):'';
 const meaning=(uk?'Тема '+area[0]+' має дві пов’язані, але не тотожні лінії. ':
  'The theme of '+area[0]+' has two connected but distinct strands. ')+
  natal+varga+bridge+second+qualified+
  (uk?'Практично: ':'Try this: ')+PRACTICE[division][uk?0:1];
 const proof=['D1.house-lord.'+focus.house+'='+primary,
  'D1.'+primary+'.house='+p1.house,'D1.'+secondary+'.house='+p2.house,
  'D'+division+'.'+primary+'.house='+d1.house,'D'+division+'.'+primary+'.sign='+d1.sign,
  'D'+division+'.'+secondary+'.house='+d2.house,'D'+division+'.'+secondary+'.sign='+d2.sign];
 return {meaning,proof,primary,secondary};
}
