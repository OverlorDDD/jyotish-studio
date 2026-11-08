import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildN4VargaReadings,verifiedVargaSource} from './reader-varga-n4.ts';

/** A plain-language, evidence-bound reader. It does not assign trait scores or make forecasts. */
export const READER_V7_VERSION='reader-v7.0.0-n43' as const;
type Lang='uk'|'en';
export type PlainInsight={
 division:number;title:string;focus:string;headline:string;strength:string;
 challenge:string;step:string;proof:readonly string[];
 timeSensitivity:'ordinary'|'higher'|'near_boundary';
};
export type PlainReader={
 version:typeof READER_V7_VERSION;
 status:'available'|'unavailable';
 introduction:string;
 highlights:readonly {id:'strength'|'challenge'|'career';title:string;text:string;division:number}[];
 insights:readonly PlainInsight[];
 d60Notice:string;
 method:string;
};
/** Everyday spheres rather than unintroduced terms like nakshatra or bhava. */
const SPHERE_UK=[
 'особистих рішеннях','грошах та звичках витрачати','спілкуванні та нових навичках',
 'домі й відчутті опори','творчих ідеях та навчанні','щоденних справах і подоланні труднощів',
 'домовленостях та партнерстві','змінах і спільних зобов’язаннях',
 'поглядах, освіті та наставництві','професійних результатах',
 'команді та підтримці людей','відпочинку й відновленні'
];
const SPHERE_EN=[
 'personal decisions','money and spending habits','communication and practical skills',
 'home and stability','creative ideas and learning','daily work and dealing with obstacles',
 'agreements and partnership','change and shared responsibilities',
 'beliefs, education and mentors','career outcomes','teams and social support','rest and recovery'
];
const RESOURCE_UK=[
 'брати відповідальність за власний вибір','уважно поводитися з ресурсами',
 'переводити ідеї в короткі вправи','створювати надійне середовище вдома',
 'вчитися та ділитися ідеями','працювати послідовно, а не ривками',
 'домовлятися про спільні правила','переосмислювати складні зміни',
 'знаходити людей, у яких є чого навчитися','доводити роботу до видимого результату',
 'просити підтримки й ділитися досвідом','вчасно відновлювати сили'
];
const RESOURCE_EN=[
 'take ownership of your choices','handle resources deliberately',
 'turn ideas into short practice sessions','create a stable home environment',
 'learn and share creative ideas','work steadily rather than in bursts',
 'negotiate shared rules','adapt when plans change',
 'find people worth learning from','finish work with visible results',
 'ask for support and share experience','make room to recover'
];
const RISK_UK=[
 'ухвалювати рішення, не вислухавши інших','плутати власну цінність із кількістю грошей',
 'розпорошуватися між завданнями','чекати ідеальних домашніх умов',
 'брати забагато творчих планів одночасно','перетворювати дисципліну на постійну напругу',
 'забувати про власні межі у компромісах','триматися за те, що вже змінилося',
 'плутати переконання з фактами','оцінювати себе лише за посадою чи успіхом',
 'залежати від чужого схвалення','відкладати відпочинок до повного виснаження'
];
const RISK_EN=[
 'decide before hearing others','confuse your worth with your income',
 'scatter attention across too many tasks','wait for perfect domestic conditions',
 'take on too many creative projects at once','let discipline become constant pressure',
 'forget your own boundaries in compromises','cling to what has already changed',
 'confuse conviction with evidence','judge yourself only by your job title or success',
 'depend too much on outside approval','delay rest until you are depleted'
];
const MOVE_UK=[
 'відокремте власний пріоритет від чужого очікування','запишіть три витрати, які справді важливі',
 'виділіть 15 хвилин на одну навичку','приберіть одне джерело побутового стресу',
 'запишіть одну ідею й доведіть її до маленького результату',
 'оберіть просту дію, яку реально повторити завтра',
 'поставте одне чесне запитання про очікування у стосунках',
 'розділіть те, що можете контролювати, і те, що не можете',
 'перевірте одну думку на практиці','доведіть до кінця одну вимірювану робочу задачу',
 'поговоріть з людиною, яка може дати конструктивний зворотний зв’язок',
 'заплануйте відновлення так само серйозно, як робочі справи'
];
const MOVE_EN=[
 'separate one priority from other people’s expectations','write down three expenses that really matter',
 'give one skill 15 minutes of focused practice','remove one avoidable source of stress at home',
 'turn one creative idea into a small finished result','pick a simple action you can repeat tomorrow',
 'ask one honest question about expectations in a relationship',
 'separate what is yours to control from what is not',
 'test one belief against your experience','finish one measurable task at work',
 'seek constructive feedback from one trustworthy person','schedule recovery with the same care as work'
];
const TOPICS:Readonly<Record<number,{uk:string;en:string;stepUk:string;stepEn:string}>>={
 1:{uk:'Життєвий напрям',en:'Life direction',stepUk:'Запишіть три речі, які для вас важливі саме зараз.',stepEn:'Write down three priorities that matter right now.'},
 2:{uk:'Гроші та ресурси',en:'Money and resources',stepUk:'Перевірте бюджет: відокремте необхідне від імпульсивних витрат.',stepEn:'Review your budget: separate essentials from impulsive spending.'},
 3:{uk:'Сміливість і спілкування',en:'Courage and communication',stepUk:'Оберіть одну розмову або навичку, яку відкладали, і почніть з маленького кроку.',stepEn:'Start one postponed conversation or skill with a manageable step.'},
 4:{uk:'Дім і стабільність',en:'Home and stability',stepUk:'Подумайте, що саме зараз зробило б ваш простір спокійнішим.',stepEn:'Identify one realistic change that would make home feel calmer.'},
 7:{uk:'Турбота й творчість',en:'Care and creativity',stepUk:'Дайте місце одній творчій ідеї або добрій розмові з близькою людиною.',stepEn:'Make space for one creative idea or a caring conversation.'},
 9:{uk:'Стосунки',en:'Relationships',stepUk:'Сформулюйте, чого ви потребуєте від партнерства і що готові запропонувати.',stepEn:'Say what you need from partnership and what you can offer in return.'},
 10:{uk:'Робота і покликання',en:'Work and vocation',stepUk:'Назвіть одну сильну робочу навичку та ситуацію, в якій вона допомогла.',stepEn:'Name one useful work skill and a situation where it made a difference.'},
 12:{uk:'Сімейні зв’язки',en:'Family ties',stepUk:'Визначте сімейну звичку, яку хочете підтримати або змінити.',stepEn:'Identify a family habit you want to keep or change.'},
 16:{uk:'Комфорт і побут',en:'Comfort and daily life',stepUk:'Перевірте, який комфорт реально відновлює сили, а який лише забирає час.',stepEn:'Notice which comforts restore you and which merely consume time.'},
 20:{uk:'Внутрішня практика',en:'Inner practice',stepUk:'Спробуйте п’ять хвилин спокійної рефлексії щодня протягом тижня.',stepEn:'Try five minutes of quiet reflection each day for a week.'},
 24:{uk:'Навчання',en:'Learning',stepUk:'Оберіть одну тему й перевірте знання маленьким практичним завданням.',stepEn:'Pick one subject and test your learning with a practical exercise.'},
 27:{uk:'Сильні сторони',en:'Strengths and resilience',stepUk:'Запишіть два випадки, коли впоралися зі складним завданням: що саме допомогло?',stepEn:'Write down two times you handled something difficult: what helped?'},
 30:{uk:'Уразливості й перешкоди',en:'Challenges and blind spots',stepUk:'Назвіть одну повторювану перешкоду й підготуйте простий план дій.',stepEn:'Name one recurring obstacle and make a simple response plan.'},
 40:{uk:'Успадковані звички',en:'Inherited habits',stepUk:'Подумайте, яку сімейну установку ви хочете переосмислити.',stepEn:'Reflect on one inherited belief you want to examine.'},
 45:{uk:'Особисті цінності',en:'Personal values',stepUk:'Запишіть принцип, якого справді готові дотримуватися у складній ситуації.',stepEn:'Write down a principle you want to follow in difficult situations.'}
};
const capture=(evidence:readonly string[],rule:RegExp)=>{
 for(const item of evidence){const match=rule.exec(item);if(match)return match;}
 return null;
};
const house=(value:number)=>Number.isInteger(value)&&value>=1&&value<=12;
export function buildReaderV7(chart:CalculatedChart,lang:Lang):PlainReader{
 const uk=lang==='uk',n4=verifiedVargaSource(chart),basis=buildN4VargaReadings(chart,lang);
 const d60Notice=basis.d60.message;
 const unavailable:PlainReader={version:READER_V7_VERSION,status:'unavailable',
  introduction:uk?'Тематичний аналіз доступний лише після перевіреного розрахунку 16 карт.':
   'Life-area insights require a verified 16-chart calculation.',
  highlights:[],insights:[],d60Notice,method:basis.methodology};
 if(!n4||basis.status!=='available')return unavailable;
 const insights:PlainInsight[]=basis.readings.map(reading=>{
  const theme=TOPICS[reading.division];
  const lord=capture(reading.evidence,/^D1\.house-lord\.\d+=(\w+)$/)?.[1];
  const from=lord?capture(reading.evidence,new RegExp('^D1\\.'+lord+'\\.house=(\\d+)$')):null;
  const primary=lord?capture(reading.evidence,new RegExp('^D'+reading.division+'\\.'+lord+'\\.house=(\\d+)$')):null;
  const second=capture(reading.evidence,new RegExp('^D'+reading.division+'\\.(?!'+lord+'\\.)(\\w+)\\.house=(\\d+)$'));
  const c=n4.charts.find(x=>x.division===reading.division);
  const h=Number(primary?.[1]),hD1=Number(from?.[1]),other=Number(second?.[2]);
  if(!theme||!c||!house(h)||!house(hD1)||!house(other)||!lord)throw new Error('READER_V7_EVIDENCE_MISMATCH_D'+reading.division);
  const dn=(uk?SPHERE_UK:SPHERE_EN)[h-1],origin=(uk?SPHERE_UK:SPHERE_EN)[hD1-1];
  const skill=(uk?RESOURCE_UK:RESOURCE_EN)[h-1];
  const risk=(uk?RISK_UK:RISK_EN)[other-1];
  const consistency=h===hD1;
  const heading=uk?theme.uk:theme.en;
  const focus=uk?'У темі «'+heading+'»':'In '+heading.toLowerCase();
  const headline=uk?
   (consistency?'Основна й додаткова карти роблять наголос на одній сфері — '+dn+'.':
    'Основна карта звертає увагу на '+origin+', а тематична — на '+dn+'.'):
   (consistency?'Both chart perspectives draw attention to '+dn+'.':
    'The main chart emphasizes '+origin+', while the focused chart draws attention to '+dn+'.');
  const strength=uk?
   'Можлива опора: '+skill+'. Це напрям, який варто перевірити власним досвідом, а не наперед приписувати собі.':
   'A possible resource is to '+skill+'. Test this against your experience rather than taking it as an established trait.';
  const challenge=uk?
   'На що звернути увагу: '+risk+'. Додатковий показник пов’язаний із '+(SPHERE_UK[other-1])+', тому саме тут корисно помічати повторювані ситуації.':
   'A pattern worth watching: '+risk+'. Another calculated factor emphasizes '+SPHERE_EN[other-1]+', so notice what happens there over time.';
  const step=(uk?theme.stepUk:theme.stepEn)+' '+(uk?'Ще один маленький крок: ':'One more small step: ')+
   (uk?MOVE_UK[h-1]:MOVE_EN[h-1])+'.';
  const near=c.lagnaBoundaryArcseconds<=1||c.planets.some(p=>p.boundaryDistanceArcseconds<=1);
  return {division:reading.division,title:heading,focus,headline,strength,challenge,step,
   proof:reading.evidence,timeSensitivity:near?'near_boundary':reading.division>=16?'higher':'ordinary'};
 });
 const get=(n:number)=>insights.find(x=>x.division===n)!;
 const highlights=[
  {id:'strength' as const,title:uk?'Ваш можливий ресурс':'Your potential strength',
   text:get(27).strength,division:27},
  {id:'challenge' as const,title:uk?'Що може вас гальмувати':'What may hold you back',
   text:get(30).challenge,division:30},
  {id:'career' as const,title:uk?'Що спробувати в роботі':'What to try at work',
   text:get(10).step,division:10}
 ];
 return {version:READER_V7_VERSION,status:'available',insights,highlights,
  introduction:uk?'Це персональні теми для роздумів за ведичною традицією. Спершу — що може допомагати, потім — що варто перевірити на практиці. Це не психологічний тест і не передбачення.':
   'Personal reflection themes drawn from traditional Jyotish. First, what may help; then what you can test in real life. This is not a personality test or a prediction.',
  d60Notice,method:basis.methodology};
}
/** Only bounded, validated plain-language themes; never birth identifiers or D60 predictions. */
export function compactReaderV7ForAi(chart:CalculatedChart):string{
 const report=buildReaderV7(chart,'en');
 if(report.status!=='available')return 'Reader v7: additional thematic context unavailable.';
 const keys=[27,30,9,10,2,24,4,12];
 return ['Reader v7: conditional interpretive prompts (not verified life events).',
  ...keys.map(n=>{
   const item=report.insights.find(x=>x.division===n)!;
   return 'D'+n+' '+item.title+': '+item.headline+' Possible resource: '+item.strength+
    ' Watch: '+item.challenge+' Practice: '+item.step;
  }),
  'Never use D60 for personal conclusions; do not assert a personality trait as an observed fact.'
 ].join('\n').slice(0,4000);
}
