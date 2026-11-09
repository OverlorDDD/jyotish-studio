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
 // Two relevant, actually different grahas are checked, but a coincident
 // house number is not counted as independent strength. Say what the chart
 // contains; don't invent a life outcome from two raw placements.
 // First identify the source of a theme in D1; then show where it is
 // expressed in the thematic division, and what a distinct indicator adds.
 // This avoids treating two chart positions as two independent predictions.
 const natal=uk?'Для теми '+area[0]+' важливо, що '+pname(primary,uk)+
  ' керує '+focus.house+'-м домом D1 і перебуває в '+p1.house+'-му ('+
  house(p1.house,uk)+'). У D'+division+' ця планета стоїть у '+d1.house+
  '-му домі ('+house(d1.house,uk)+'), у '+sign(d1.sign,uk)+'. ':
  'For '+area[0]+', '+primary+' rules D1 house '+focus.house+' and occupies house '+
  p1.house+' ('+house(p1.house,uk)+'). In D'+division+' it occupies house '+
  d1.house+' ('+house(d1.house,uk)+') in '+sign(d1.sign,uk)+'. ';
 const bridge=uk?(p1.house===d1.house?
  'В обох ракурсах повторюється тема '+house(d1.house,uk)+
  ': вона стає головним способом проявити цю сферу життя. ':
  'Тут видно перехід від '+house(p1.house,uk)+' до '+house(d1.house,uk)+
  '. Перший дім описує початковий мотив, другий — його вираження в цій варзі. '):
  (p1.house===d1.house?
   'Both lenses emphasize '+house(d1.house,uk)+' as the central arena for this theme. ':
   'The emphasis shifts from '+house(p1.house,uk)+' to '+house(d1.house,uk)+
   ': the first is the natal motive, the second its expression in this division. ');
 const secondaryLine=uk?(d1.house===d2.house?
  pname(secondary,uk)+' — інша планета, пов’язана із '+area[1]+
  ' — займає той самий дім D'+division+
  '. Отже, в одній сфері поєднано дві різні потреби, а не два докази успіху. ':
  pname(secondary,uk)+' — інша планета, пов’язана із '+area[1]+
  ' — стоїть у '+d2.house+'-му домі D'+division+' ('+house(d2.house,uk)+
  '). Її потреби не варто автоматично прирівнювати до завдань управителя. '):
  (d1.house===d2.house?
   'A distinct indicator, '+secondary+', relates to '+area[1]+
   ' and shares that D'+division+' house: two concerns in one arena, not two proofs of success. ':
   'A separate indicator, '+secondary+' ('+area[1]+'), occupies D'+division+
   ' house '+d2.house+' ('+house(d2.house,uk)+
   '). Its concerns should not be confused with the ruler’s agenda. ');
 const quality=good(q1)?(uk?
  'Власний знак або екзальтація управителя додає традиційну знакову підтримку, але не визначає результат самостійно. ':
  'Own-sign or exaltation dignity traditionally supports this motif, without settling the outcome. '):
  q1==='debilitated'?(uk?
  'Знак падіння управителя вимагає перевірки інших умов, а не фатального висновку. ':
  'Debilitation calls for checking the other conditions, not a verdict. '):'';
 const meaning=natal+bridge+secondaryLine+quality+
  (uk?'Практичний крок: ':'A practical next step: ')+PRACTICE[division][uk?0:1];
 const proof=['D1.house-lord.'+focus.house+'='+primary,
  'D1.'+primary+'.house='+p1.house,'D1.'+secondary+'.house='+p2.house,
  'D'+division+'.'+primary+'.house='+d1.house,'D'+division+'.'+primary+'.sign='+d1.sign,
  'D'+division+'.'+secondary+'.house='+d2.house,'D'+division+'.'+secondary+'.sign='+d2.sign];
 return {meaning,proof,primary,secondary};
}
