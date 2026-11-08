import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {N4_RC_CONTRACT_VERSION,N4_RC_DIVISIONS,type N4RcPayload} from './n4-rc-contract.ts';
import type {D60Candidate} from './n4-d60-candidate.ts';

/**
 * Reader N4.2: a second, topic-specific layer on top of Reader v6.
 * Use ONLY server-bound internally verified charts; no AI may invent vargas.
 * D60 is deliberately disclosed but excluded from individual house claims.
 */
type Lang='uk'|'en';
export const N4_VARGA_READER_VERSION='n4-varga-reader-1.0.0' as const;
export type VargaReading=Readonly<{
 division:number;title:string;topic:string;summary:string;practice:string;
 evidence:readonly string[];scope:'internal_verified_D1_derivation';
}>;
export type VargaReadingBundle=Readonly<{
 version:typeof N4_VARGA_READER_VERSION;
 status:'available'|'unavailable';
 readings:readonly VargaReading[];
 d60:{status:'provisional_no_individual_interpretation';message:string};
 methodology:string;
}>;
type Source=CalculatedChart&{verification?:{version:string;status:string;digest:string;externalReferenceChecked:boolean};n4?:N4RcPayload;n4D60?:D60Candidate};
const PLANETS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const NAMES_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const SIGNS_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const HOUSE_UK=[
 'власній ініціативі та особистих рішеннях','ресурсах, цінностях і способі говорити',
 'навичках, сміливості та комунікації','домі та внутрішній опорі',
 'навчанні, творчості та передачі досвіду','щоденній праці, служінні й роботі з перешкодами',
 'партнерстві та домовленостях','довірі, змінах і спільних зобов’язаннях',
 'освіті, наставниках і світогляді','професійній реалізації та репутації',
 'спільнотах, результатах і підтримці','відновленні, тиші та завершенні справ'
];
const HOUSE_EN=[
 'personal initiative and decisions','resources, values and speech',
 'skills, courage and communication','home and inner support',
 'learning, creativity and passing on knowledge','daily work, service and navigating obstacles',
 'partnership and agreements','trust, change and shared responsibility',
 'education, mentors and worldview','work, vocation and public responsibility',
 'communities, results and support','rest, reflection and completion'
];
const PRACTICE_UK=[
 'відокремити власне рішення від чужих очікувань',
 'виписати ресурси й пріоритети без поспішної оцінки',
 'обрати одну навичку для регулярної практики',
 'перевірити, де бракує стабільної внутрішньої опори',
 'дати творчому або навчальному задуму конкретну форму',
 'полегшити одну повторювану складність через дисципліну',
 'обговорити взаємні очікування й особисті межі',
 'розділити особисту й спільну відповідальність',
 'зіставити переконання з реальним досвідом навчання',
 'визначити один видимий результат своєї праці',
 'перевірити, які взаємини дають справжню підтримку',
 'залишити час для відновлення без зайвих зобов’язань'
];
const PRACTICE_EN=[
 'separate one personal decision from external expectations',
 'write down resources and priorities before making assumptions',
 'select one practical skill to strengthen consistently',
 'look for one sustainable form of inner stability',
 'give one learning or creative goal a concrete next step',
 'reduce one recurring difficulty through a repeatable routine',
 'discuss expectations and personal boundaries openly',
 'distinguish your own responsibilities from shared ones',
 'compare ideals with lived experience and study',
 'define a visible outcome for work you want to complete',
 'notice which relationships offer mutual support',
 'set aside time to recover without abandoning commitments'
];
/** Classical thematic assignments, not proof of predictive outcomes.
 * D40/D45 general significance varies by school, so labels stay broad. */
const PROFILE=[
 {n:1,h:1,uk:'Загальна карта',en:'Foundation',focusUk:'життєвий напрям',focusEn:'overall direction'},
 {n:2,h:2,uk:'Ресурси',en:'Resources',focusUk:'матеріальні звички та опора',focusEn:'material patterns and support'},
 {n:3,h:3,uk:'Зусилля і зв’язки',en:'Courage & kin',focusUk:'сміливість і взаємодія з близькими',focusEn:'courage and close relations'},
 {n:4,h:4,uk:'Дім і майно',en:'Home & property',focusUk:'стабільність дому та власності',focusEn:'home and long-term assets'},
 {n:7,h:5,uk:'Діти і спадкоємність',en:'Children & legacy',focusUk:'турбота, творчість і наступні покоління',focusEn:'care, creativity and the next generation'},
 {n:9,h:7,uk:'Стосунки',en:'Relationships',focusUk:'партнерство та цінності',focusEn:'partnership and values'},
 {n:10,h:10,uk:'Кар’єра',en:'Career',focusUk:'професійна роль',focusEn:'professional direction'},
 {n:12,h:4,uk:'Батьки й корені',en:'Parents & roots',focusUk:'сімейні корені',focusEn:'family roots'},
 {n:16,h:4,uk:'Комфорт',en:'Comfort',focusUk:'побут і задоволення від простору',focusEn:'comfort and daily surroundings'},
 {n:20,h:9,uk:'Духовна практика',en:'Spiritual practice',focusUk:'споглядання й особисту практику',focusEn:'devotional and reflective practice'},
 {n:24,h:5,uk:'Освіта',en:'Education',focusUk:'знання та способи навчання',focusEn:'knowledge and ways of learning'},
 {n:27,h:1,uk:'Сильні та слабкі сторони',en:'Strengths & challenges',focusUk:'витривалість і зони розвитку',focusEn:'resilience and growth areas'},
 {n:30,h:6,uk:'Виклики',en:'Challenges',focusUk:'способи долати труднощі',focusEn:'ways of addressing difficulty'},
 {n:40,h:4,uk:'Тонкі життєві теми',en:'Fine-grained themes',focusUk:'родинний контекст і загальні тенденції',focusEn:'family context and broad tendencies'},
 {n:45,h:9,uk:'Цінності та спадщина',en:'Values & inheritance',focusUk:'передані цінності й широкі життєві теми',focusEn:'inherited values and broad life themes'}
] as const;
const COMPARISON:Readonly<Record<number,string>>={
 1:'Sun',2:'Jupiter',3:'Mars',4:'Moon',7:'Jupiter',9:'Venus',10:'Sun',
 12:'Moon',16:'Venus',20:'Jupiter',24:'Mercury',27:'Mars',30:'Saturn',40:'Moon',45:'Sun'
};
const ACTION_UK:Readonly<Record<number,string>>={
 1:'помітити власний спосіб діяти',
 2:'зіставити бюджет із власними цінностями',
 3:'потренувати ясне прохання або рішучий крок',
 4:'обрати одну конкретну дію для стабільності вдома',
 7:'помітити, як ви підтримуєте творчість або молодших',
 9:'обговорити один принцип взаємності в стосунках',
 10:'описати свою професійну роль через реальний результат',
 12:'згадати, які сімейні звички хочеться зберегти, а які змінити',
 16:'визначити, який побутовий комфорт справді допомагає відновленню',
 20:'обрати послідовну духовну чи медитативну практику',
 24:'перевірити, який формат навчання приносить реальний поступ',
 27:'розділити те, що додає витривалості, і те, що виснажує',
 30:'назвати одну повторювану складність і безпечний спосіб дати їй раду',
 40:'оцінити, які родинні установки підтримують рішення сьогодні',
 45:'вибрати власний принцип, який варто передавати іншим'
};
const ACTION_EN:Readonly<Record<number,string>>={
 1:'notice how you initiate decisions',
 2:'compare spending patterns with your values',
 3:'practice a clear request or deliberate initiative',
 4:'choose one concrete step toward a more stable home',
 7:'notice how you support creativity or younger generations',
 9:'discuss one principle of reciprocity in partnership',
 10:'describe your professional role through a measurable result',
 12:'review which family habits you wish to keep or change',
 16:'identify which forms of comfort genuinely help you recharge',
 20:'choose a consistent contemplative or spiritual practice',
 24:'test which study method builds usable skill',
 27:'separate what builds resilience from what drains your effort',
 30:'identify one recurring obstacle and a safe practical response',
 40:'notice which inherited beliefs support your decisions today',
 45:'choose a value you would willingly pass to others'
};
const gname=(name:string,uk:boolean)=>uk?NAMES_UK[name]||name:name;
const nameSign=(n:number,uk:boolean)=>(uk?SIGNS_UK:SIGNS_EN)[n-1];
const validSign=(n:number)=>Number.isInteger(n)&&n>=1&&n<=12;
export function verifiedVargaSource(chart:CalculatedChart):N4RcPayload|null{
 const src=chart as Source,v=src.verification,n=src.n4;
 if(v?.version!=='jyotish-integrity-v3'||v.status!=='verified_internal'||
  !/^[a-f0-9]{64}$/.test(v.digest)||v.externalReferenceChecked!==false||
  n?.version!==N4_RC_CONTRACT_VERSION||
  n.sourceVerificationVersion!==v.version||n.sourceDigest!==v.digest||
  n.status!=='INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE'||
  n.ruleVersion!=='n4-parashari-v1.0.0'||n.d2Method!=='Sun/Moon Hora'||
  n.method!=='parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1'||
  n.d60Excluded!==true||n.externalJhoraPerBirthCertified!==false||
  n.charts?.length!==N4_RC_DIVISIONS.length)return null;
 for(let i=0;i<N4_RC_DIVISIONS.length;i++){
  const c=n.charts[i];
  if(c?.division!==N4_RC_DIVISIONS[i]||!validSign(c.lagnaSign)||
    !Number.isFinite(c.lagnaBoundaryArcseconds)||c.lagnaBoundaryArcseconds<0||
    c.planets?.length!==9||new Set(c.planets.map(p=>p.name)).size!==9||
    PLANETS.some(name=>!c.planets.some(p=>p.name===name)))return null;
  for(const p of c.planets){
   if(!validSign(p.sign)||p.house!==((p.sign-c.lagnaSign+12)%12)+1||
    !Number.isFinite(p.boundaryDistanceArcseconds)||p.boundaryDistanceArcseconds<0)return null;
  }
  if([1,9,10].includes(c.division)){
   const legacy=c.division===1?chart.d1:c.division===9?chart.d9:chart.d10;
   const lagna=c.division===1?chart.ascendant: c.division===9?chart.lagnaD9:chart.lagnaD10;
   if(c.lagnaSign!==lagna.sign||c.planets.some(p=>!legacy.some(x=>
    x.name===p.name&&x.sign===p.sign&&x.house===p.house)))return null;
  }
 }
 return n;
}
const caution=(uk:boolean)=>uk?
 'D60 має перевірену формулу для заданих довгот. Лагна та доми D60 НЕ сертифіковані для конкретного народження, навіть якщо час записаний до хвилини. Reader показує лише обережне порівняння деяких планетарних знаків із D1, не робить кармічних прогнозів чи висновків за домами.':
 'D60 has a checked formula for fixed longitudes. Its ascendant and houses are NOT certified for an individual birth, even with a time recorded to the minute. Reader provides only conditional planetary-sign comparisons with D1, never karmic forecasts or D60 house claims.';
export function buildN4VargaReadings(chart:CalculatedChart,lang:Lang):VargaReadingBundle{
 const uk=lang==='uk',source=verifiedVargaSource(chart);
 const d60={status:'provisional_no_individual_interpretation' as const,message:caution(uk)};
 const methodology=uk?
  'Тематичні варги уточнюють D1. Це обчислені положення та умовні трактування Джйотіш, не доведені життєві результати. Точність вищих варг залежить від часу народження.':
  'Divisional charts supplement D1. These are computed placements with conditional traditional readings, not proven life outcomes. Higher vargas depend on birth-time precision.';
 if(!source)return {version:N4_VARGA_READER_VERSION,status:'unavailable',readings:[],d60,methodology};
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const readings=PROFILE.map(profile=>{
  const varga=source.charts.find(c=>c.division===profile.n)!;
  const ruler=lords[profile.h];
  const from=chart.d1.find(p=>p.name===ruler)!;
  const to=varga.planets.find(p=>p.name===ruler)!;
  // Second, distinct computed placement supports a real two-factor interpretation.
  const chosen=COMPARISON[profile.n];
  const secondary=chosen===ruler?(chosen==='Moon'?'Jupiter':'Moon'):chosen;
  const factor=varga.planets.find(p=>p.name===secondary)!;
  const d1Area=(uk?HOUSE_UK:HOUSE_EN)[from.house-1];
  const dnArea=(uk?HOUSE_UK:HOUSE_EN)[to.house-1];
  const name=gname(ruler,uk);
  const common=from.house===to.house;
  const topic=uk?profile.focusUk:profile.focusEn;
  const summary=uk?
   'У D1 управитель тематичного '+profile.h+'-го дому '+name+' перебуває в '+from.house+'-му домі ('+d1Area+'). У D'+profile.n+
   ' він стоїть у '+to.house+'-му домі, у '+nameSign(to.sign,true)+'. '+(common?
    'Обидва ракурси наголошують на тій самій сфері: '+dnArea+'.':
    'Це додає інший ракурс — '+dnArea+' — до теми «'+topic+'», а не скасовує D1.')+
   ' Друга опора для порівняння — '+gname(secondary,true)+' у '+factor.house+'-му домі D'+profile.n+
   ' ('+HOUSE_UK[factor.house-1]+'). '+(factor.house===to.house?
    'Обидві планети перебувають у тому самому домі варги, але це не означає точного сполучення за градусами.':
    'Два різні доми показують, які життєві задачі варто розглядати разом.') :
   'In D1, '+name+' rules the relevant house '+profile.h+' and occupies house '+from.house+' ('+d1Area+'). In D'+profile.n+
   ' the same graha occupies house '+to.house+' in '+nameSign(to.sign,false)+'. '+(common?
    'Both lenses emphasize '+dnArea+'.':
    'This adds a different lens — '+dnArea+' — to '+topic+' without overriding D1.')+
   ' A second calculated factor is '+secondary+' in D'+profile.n+' house '+factor.house+
   ' ('+HOUSE_EN[factor.house-1]+'). '+(factor.house===to.house?
    'Both grahas share this divisional house, but a close degree conjunction is not established.':
    'These different houses show where the two life themes may need coordination.');
  const practice=uk?
   'Для роздумів про '+topic+': '+ACTION_UK[profile.n]+' і '+PRACTICE_UK[to.house-1]+'. Це практична пропозиція, не прогноз події.':
   'To explore '+topic+', '+ACTION_EN[profile.n]+' and '+PRACTICE_EN[to.house-1]+'. This is a practical reflection, not an event prediction.';
  return Object.freeze({
   division:profile.n,title:'D'+profile.n+' · '+(uk?profile.uk:profile.en),topic,summary,practice,
   evidence:Object.freeze([
    'D1.ascendant.sign='+chart.ascendant.sign,
    'D1.house-lord.'+profile.h+'='+ruler,
    'D1.'+ruler+'.house='+from.house,
    'D'+profile.n+'.lagna.sign='+varga.lagnaSign,
    'D'+profile.n+'.'+ruler+'.sign='+to.sign,
    'D'+profile.n+'.'+ruler+'.house='+to.house,
    'D'+profile.n+'.'+secondary+'.sign='+factor.sign,
    'D'+profile.n+'.'+secondary+'.house='+factor.house
   ]),
   scope:'internal_verified_D1_derivation' as const
  });
 });
 // D60 must never enter the per-person readings array.
 return {version:N4_VARGA_READER_VERSION,status:'available',readings,d60,methodology};
}
/** The LLM receives only a bounded, data-only summary from verified server payloads. */
export function compactN4VargaFacts(chart:CalculatedChart):string{
 const n=verifiedVargaSource(chart);
 if(!n)return 'N4 vargas: unavailable — do not claim any new divisional positions. D60 is never eligible for individual reading.';
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const lines=PROFILE.filter(p=>p.n!==1&&p.n!==9&&p.n!==10).map(p=>{
  const v=n.charts.find(c=>c.division===p.n)!;
  const ruler=lords[p.h],body=v.planets.find(g=>g.name===ruler)!;
  const before=chart.d1.find(g=>g.name===ruler)!;
  const candidate=COMPARISON[p.n];
  const indicator=candidate===ruler?(candidate==='Moon'?'Jupiter':'Moon'):candidate;
  const extra=v.planets.find(g=>g.name===indicator)!;
  return 'D'+p.n+' focus='+p.focusEn+'; D1 H'+p.h+' ruler='+ruler+
   ' D1.H'+before.house+'; D'+p.n+'.lagna.sign='+v.lagnaSign+
   '; D'+p.n+'.'+ruler+'.sign='+body.sign+',house='+body.house+
   '; second='+indicator+' sign='+extra.sign+',house='+extra.house;
 });
 return ['N4 provenance: internally verified D1 derivation, not externally certified per birth.',
  ...lines,
  'D60: METHOD_ONLY; unverified birth-time/lagna stability; NO personal D60 house, karma, previous-life or fate reading.'
 ].join('\n');
}
