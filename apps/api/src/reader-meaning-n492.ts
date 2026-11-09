/**
 * N4.9.2: one meaningful, evidence-linked reading for each of the 16 vargas.
 *
 * Draws on the SAME classical context and authored V6 interpretation as the
 * former hidden "Optional detailed traditional interpretation". No LLM needed.
 * D60 has no claimed lagna/house result; the planet-to-sign map is conditional
 * on recorded birth time and stays visibly provisional.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {readerClassicalContext} from './reader-classical.ts';
import {authorConsultationV6} from './reader-narrative-v6.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';

export const N492_MEANING_VERSION='n492-meaning-first-16-v1' as const;
export const N492_DIVISIONS=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60] as const;
type Lang='uk'|'en';
type Card={
 division:number;
 reading:string;
 corroboration:string|null;
 attention:string|null;
 sourceFacts:readonly string[];
 sourceMethod:readonly string[];
 sensitivity:'ordinary'|'fine'|'provisional';
};
export type N492Meaning={version:typeof N492_MEANING_VERSION;cards:readonly Card[];
 takeaways:readonly {text:string;sourceFacts:readonly string[]}[];limits:string};
const HOUSES_UK=['особисті рішення','ресурси та мовлення','навички й спілкування','дім і внутрішня опора',
 'творчість і діти','повсякденна праця та подолання перешкод','партнерство й домовленості',
 'довіра та спільні зобов’язання','освіта й світогляд','професійна реалізація',
 'друзі, спільноти та здобутки','відновлення й особистий простір'];
const HOUSES_EN=['identity and decisions','resources and speech','skills and communication',
 'home and foundations','creativity and children','daily work and problem-solving',
 'partnership and agreements','trust and shared responsibilities','learning and worldview',
 'vocation and responsibility','friends and communities','rest and personal space'];
const SIGNS_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні',
 'Стрільці','Козорозі','Водолії','Рибах'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio',
 'Sagittarius','Capricorn','Aquarius','Pisces'];
const NOM_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон',
 'Стрілець','Козоріг','Водолій','Риби'];
const FOCUS_UK:Readonly<Record<number,string>>={2:'фінансів',3:'спілкування й сміливості',
 4:'дому й майна',7:'дітей і творчого спадку',9:'партнерства',
 10:'кар’єри',12:'батьків і родинного походження',16:'комфорту й побуту',
 20:'духовної практики',24:'навчання',27:'витривалості',30:'подолання перешкод',
 40:'материнської родинної лінії',45:'батьківської родинної лінії'};
const FOCUS_EN:Readonly<Record<number,string>>={2:'resources',3:'courage and communication',
 4:'home and property',7:'children and creative legacy',9:'partnership',
 10:'career',12:'parents and ancestry',16:'comfort and daily surroundings',
 20:'spiritual practice',24:'education',27:'resilience',30:'handling difficulties',
 40:'maternal-line themes',45:'paternal-line themes'};

const NAMES_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const GEN_UK:Record<string,string>={Sun:'Сонця',Moon:'Місяця',Mars:'Марса',
 Mercury:'Меркурія',Jupiter:'Юпітера',Venus:'Венери',Saturn:'Сатурна',Rahu:'Раху',Ketu:'Кету'};
// House numbers select D1 lords relevant for the traditional remit of each varga.
// Never mistake an "aspect" of a different varga for an unverified natal aspect.
const HOUSES:Readonly<Record<number,readonly number[]>>={
 1:[1],2:[2,11],3:[3],4:[4],7:[5],9:[7],10:[10,5],
 12:[4,9],16:[4],20:[9],24:[5,4],27:[1],30:[6,8],
 40:[4],45:[9]
};
const SECONDARY:Readonly<Record<number,string>>={
 2:'Jupiter',3:'Mars',4:'Venus',7:'Jupiter',9:'Venus',10:'Sun',12:'Sun',
 16:'Venus',20:'Jupiter',24:'Mercury',27:'Mars',30:'Saturn',40:'Moon',45:'Sun'
};
// Semantic cross-links are deliberately optional. Require a specific duplicated
// support/contrast on the SAME D1 house lord, never always print "connected to".
const COMPANION:Readonly<Record<number,number>>={
 2:10,4:12,7:9,9:7,10:24,12:4,16:4,20:9,24:10,27:30,30:27,40:12,45:9
};
const LESSON_UK:Readonly<Record<number,string>>={
 2:'Окремо оцінюйте особисті ресурси та результати роботи: вони не завжди зростають однаково.',
 3:'Практичний сенс — у розвитку навичок через дію, а не лише через наміри.',
 4:'Оцінюйте реальні умови дому й власності, а не робіть висновок лише зі статусу планети.',
 7:'Ця карта стосується дітей, наступних поколінь і того, що людина передає далі, а не автоматично любовних стосунків.',
 9:'D9 уточнює тему союзу, а не визначає характер або наміри іншої людини.',
 10:'Тут важливе не вгадування назви професії, а спосіб реалізації: де знання переходять у роботу.',
 12:'D12 стосується батьків і родинного походження; вона не може встановити біографічні факти без свідчень.',
 16:'Оцінюйте умови комфорту й побуту, не лише придбання речей.',
 20:'Це ракурс духовної практики та внутрішньої дисципліни, а не передбачення подій.',
 24:'D24 говорить про навчання й засвоєння знань; її не слід зводити до оцінок або дипломів.',
 27:'Це тема витривалості й способу витримувати навантаження, а не безпомилковий тест особистості.',
 30:'Обережні показники в D30 описують традиційні ризики та способи їх долати, а не неминучу поразку.',
 40:'Традиційний материнський родинний ракурс: не виводимо з нього конкретних подій минулого.',
 45:'Традиційний батьківський родинний ракурс: інші карти не замінюють фактичної сімейної історії.'
};
const LESSON_EN:Readonly<Record<number,string>>={
 2:'Holdings and career gains are separate mechanisms; do not assume they always rise together.',
 3:'The practical focus is practicing skills, not simply intending to act.',
 4:'Real home and property conditions matter more than one planetary label.',
 7:'D7 concerns children and what is passed to the next generation, not automatically romance.',
 9:'D9 adds a view of partnership without claiming to know another person’s thoughts.',
 10:'Look at the way skills become work, rather than guessing an inevitable job title.',
 12:'D12 concerns parents and ancestry, not verified facts about a family biography.',
 16:'Focus on sustainable comfort and daily surroundings, not just purchases.',
 20:'This is a lens on spiritual discipline, not a prediction of events.',
 24:'D24 concerns how learning develops, not a promise of academic awards.',
 27:'This reading concerns resilience, not a definitive personality test.',
 30:'Traditional caution is about navigating difficulties, not inevitable failure.',
 40:'A maternal-line symbolic lens, not a claim about unverified family history.',
 45:'A paternal-line symbolic lens; only evidence can establish family history.'
};
const strong=(v:string)=>v==='own'||v==='exalted';
const weak=(v:string)=>v==='debilitated';
const uniq=(values:readonly string[])=>[...new Set(values)];
export function buildN492Meaning(chart:CalculatedChart,lang:Lang,asOf:string):N492Meaning|null{
 const source=verifiedVargaSource(chart);
 if(!source)return null;
 const uk=lang==='uk',context=readerClassicalContext(chart,asOf);
 const authored=authorConsultationV6(chart,lang,asOf);
 const chapter=(id:string)=>authored.find(x=>x.id===id)?.paragraphs||[];
 const lords=context.lords;
 const area=(h:number)=>(uk?HOUSES_UK:HOUSES_EN)[h-1]||('house '+h);
 const name=(p:string)=>uk?NAMES_UK[p]||p:p;
 const gen=(p:string)=>uk?GEN_UK[p]||p:p;
 const sign=(n:number)=>(uk?SIGNS_UK:SIGNS_EN)[n-1];
 const natal=(p:string)=>{const q=chart.d1.find(x=>x.name===p);if(!q)throw Error('N492_MISSING_D1_'+p);return q};
 const inD=(division:number,p:string)=>{
  const q=source.charts.find(d=>d.division===division)?.planets.find(x=>x.name===p);
  if(!q)throw Error('N492_MISSING_D'+division+'_'+p);return q;
 };
 const place=(p:string)=>natal(p).house;
 const yoga=context.yogakarakas;
 const status=(planet:string,s:number)=>{
  const d=dignityFor(planet,s);
  if(d==='exalted')return uk?'у знаку екзальтації':'exalted';
  if(d==='own')return uk?'у власному знаку':'in its own sign';
  if(d==='debilitated')return uk?'у знаку падіння':'in its sign of debilitation';
  return '';
 };
 // Meaningful, conditional subject-specific house combinations. These do NOT
 // assert that a life event occurred. No generic filler when no rule matches.
 const blend=(division:number,from:number,to:number):string=>{
  const pair=from+'>'+to;
  const ukCases:Record<number,Record<string,string>>={
   2:{'9>12':'Освіта, світогляд і далекі плани тут поєднані з темою витрат і відокремленого ресурсу. Це привід розрізняти вкладення у розвиток і щоденний фінансовий запас.'},
   3:{'9>9':'Сміливість і спілкування набувають форми через навчання, викладання або передачу досвіду; це напрям для практичного застосування навичок.'},
   4:{'10>1':'Питання дому й майна торкаються самостійності та власного вибору, а не лише зовнішньої професійної ролі.'},
   7:{'9>6':'Передавання знань або турбота про наступне покоління вимагають послідовної щоденної праці, не тільки ідей.'},
   9:{'9>9':'Спільні переконання, навчання та цінності стають важливими темами домовленостей; це не опис характеру майбутнього партнера.'},
   10:{'9>6':'Професійний потенціал спрямований від знань і світогляду до складних практичних задач, де вирішують результат і дисципліна.'},
   12:{'10>3':'Родинна тема символічно переходить від публічної ролі до способу спілкування й передачі навичок; конкретних подій родини це не доводить.'},
   16:{'10>7':'Комфорт і побут тут пов’язані з умінням узгоджувати потреби з іншими, особливо коли професійні обов’язки забирають час.'},
   20:{'6>8':'Внутрішня практика читається як дисципліна, що допомагає адаптуватися до змін, а не як обіцянка містичного досвіду.'},
   24:{'9>6':'Навчання особливо пов’язане з практичним розв’язанням задач: знання перевіряються регулярною роботою, а не тільки теорією.'},
   27:{'12>10':'Є контраст між потребою у відновленні та вимогами помітної роботи. Для витривалості важливо підтримувати обидва ритми.'},
   30:{'6>4':'Тема подолання труднощів поєднана зі стабільністю домашнього середовища та відновленням сил.'},
   40:{'10>11':'Материнський родинний ракурс читається через тему підтримки, спільнот і результатів праці; це не встановлює факти про предків.'},
   45:{'6>4':'Батьківський родинний ракурс символічно пов’язаний із працею, обов’язком і потребою у стабільній внутрішній опорі.'}
  };
  const enCases:Record<number,Record<string,string>>={
   2:{'9>12':'Study and long-range plans meet private costs and the need to preserve resources; the distinction between investment in growth and available reserves matters.'},
   3:{'9>9':'Courage and communication are expressed through study, teaching and making knowledge useful rather than remaining at the level of intentions.'},
   4:{'10>1':'Home and property decisions reach into personal agency rather than being defined only by public career expectations.'},
   7:{'9>6':'Passing knowledge onward or caring for the next generation calls for repeated practical effort, not just high ideals.'},
   9:{'9>9':'Shared principles, education and worldview become relevant to partnerships, without predicting another person’s character.'},
   10:{'9>6':'Professional purpose connects learning and guiding principles to difficult, practical work where discipline and finished results matter.'},
   12:{'10>3':'Family roots symbolically move from public responsibilities to communication and skills handed onward; this is not a biographical assertion.'},
   16:{'10>7':'Comfort depends partly on negotiating needs with others when career responsibilities compete for time.'},
   20:{'6>8':'Spiritual practice is framed as discipline supporting adaptation to change, not a promise of mystical experiences.'},
   24:{'9>6':'Learning needs repeated practice with demanding problems, not only theory or credentials.'},
   27:{'12>10':'There is a contrast between recovery in private and demands in visible work. Resilience requires space for both.'},
   30:{'6>4':'Navigating difficulties is connected with maintaining a stable home environment and room for recovery.'},
   40:{'10>11':'The maternal-line symbolic lens concerns mutual support, community and results; it cannot establish ancestral facts.'},
   45:{'6>4':'The paternal-line symbolic lens connects effort and responsibility to the search for a secure foundation.'}
  };
  const precise=(uk?ukCases:enCases)[division]?.[pair];
  if(precise)return precise;
  if(to===6&&[3,7,10,24,27].includes(division))
   return uk?'Саме регулярні складні задачі, а не разові зусилля, є важливим способом прояву цього показника.':
    'Repeated demanding tasks, rather than occasional bursts, are the visible emphasis of this indicator.';
  if(to===9&&[3,7,9,10,20,24].includes(division))
   return uk?'Тут особливого значення набувають навчання, передавання знань і вірність власним принципам.':
    'Learning, communicating knowledge and testing one’s principles form the relevant emphasis.';
  if(to===4&&[4,12,16,27,30,40,45].includes(division))
   return uk?'Цей показник повертає увагу до дому, відновлення та надійного середовища.':
    'This indication draws attention to home, recovery and a dependable environment.';
  // For the most consequential vargas, provide concrete, domain-specific
  // meanings for ALL twelve possible house placements; no bare "house X" output.
  const specificUk:Readonly<Record<number,Readonly<Record<number,string>>>>={
   10:{
    1:'Професійний шлях тут більше залежить від власної ініціативи та вміння відповідати за рішення.',
    2:'Важливими стають уміння представляти цінність праці, спілкуватися про гроші та тримати домовленості.',
    3:'У роботі цінуються практична комунікація, технічні навички й здатність пояснити складне.',
    4:'Професійна реалізація пов’язана з побудовою надійної бази та довгострокових умов роботи.',
    5:'Творчий внесок, навчання інших і передавання власних напрацювань стають помітною професійною темою.',
    6:'Складні щоденні задачі, дисципліна й виправлення помилок — важливий професійний канал.',
    7:'Результат роботи залежить від уміння домовлятися з партнерами, клієнтами та командою.',
    8:'Важливими можуть бути дослідження, конфіденційні задачі й управління спільною відповідальністю.',
    9:'Кар’єрна тема пов’язується з освітою, наставництвом і передаванням власного світогляду.',
    10:'Публічна відповідальність, репутація та якість видимого результату стають головним випробуванням.',
    11:'Тривалі професійні результати тут залежать від взаємодії зі спільнотами та колом підтримки.',
    12:'Професійна реалізація може вимагати самостійної праці, тиші або роботи поза публічною сценою.'
   },
   9:{
    1:'У близькості важливо зберігати особисту позицію, не руйнуючи взаємності.',
    2:'Питання спільних цінностей і поводження з ресурсами вимагають відкритої розмови.',
    3:'У союзі особливого значення набувають чесна комунікація та вміння слухати.',
    4:'Дім і відчуття безпеки — конкретні умови, через які може розкриватися близькість.',
    5:'Творчість, навчання й турбота про дітей можуть ставати темою спільних рішень.',
    6:'Повсякденний розподіл обов’язків важливіший за одні лише романтичні наміри.',
    7:'Партнерство насамперед потребує чітких взаємних домовленостей.',
    8:'Для близькості важливо навчитися розділяти довіру й спільні зобов’язання.',
    9:'Спільні принципи, навчання та світогляд можуть підтримувати стосунки.',
    10:'Публічна праця й очікування від професії потребують погодження часу для близьких.',
    11:'Дружнє коло і спільні довгострокові цілі впливають на якість союзу.',
    12:'Межі приватності й потреба у відновленні потребують поваги з обох сторін.'
   },
   2:{
    1:'Матеріальні рішення тут особливо пов’язані з власною ініціативою та відповідальністю.',
    2:'Накопичення та якість щоденних фінансових звичок мають пряме тематичне значення.',
    3:'Ресурси пов’язані з навичками, мовленням та умінням домовлятися.',
    4:'Надійний дім і базова фінансова подушка стають важливішими за швидкий результат.',
    5:'Творчі здібності й навчання можуть бути частиною способу створювати цінність.',
    6:'Матеріальна опора вимагає обліку, дисципліни та роботи з повторюваними витратами.',
    7:'Значення мають спільні фінансові рішення, договори й межі відповідальності.',
    8:'Ризики спільних ресурсів і великих зобов’язань варто оцінювати окремо.',
    9:'Навчання та далекі плани потрібно порівнювати з реальними витратами.',
    10:'Професійні результати й матеріальна опора можуть бути тісно пов’язані.',
    11:'Мережі підтримки та довгострокові проєкти можуть впливати на здобутки.',
    12:'Особлива увага припадає на витрати, приватний резерв і стабільність запасу.'
   }
  };
  const specificEn:Readonly<Record<number,Readonly<Record<number,string>>>>={
   10:{
    1:'Professional initiative and personal accountability become central.',
    2:'Communicating the value of work and maintaining financial agreements matter.',
    3:'Practical communication, technical skills and explaining complex ideas are prominent.',
    4:'Building a reliable base and durable working conditions becomes important.',
    5:'Creative contributions, teaching and passing skills onward are vocational themes.',
    6:'Difficult daily tasks, discipline and resolving errors are a central professional outlet.',
    7:'Negotiating with partners, clients and teams matters for the outcome of work.',
    8:'Research, confidential work and shared responsibility deserve attention.',
    9:'Education, mentoring and communicating a worldview become part of the vocational story.',
    10:'Public responsibility, reputation and visible results take the lead.',
    11:'Communities and support networks affect how professional results develop.',
    12:'Independent, quiet or behind-the-scenes work can matter more than public display.'
   },
   9:{
    1:'Preserving personal agency alongside closeness is important.',
    2:'Shared values and financial expectations call for clear discussion.',
    3:'Honest dialogue and attentive listening become pivotal.',
    4:'Home and emotional security form concrete conditions for closeness.',
    5:'Creativity, education and care for children can become shared decisions.',
    6:'How daily responsibilities are divided matters beyond romantic intentions.',
    7:'The relationship depends on clear mutual agreements.',
    8:'Trust and shared obligations need careful boundaries.',
    9:'Common values, learning and worldview may support the partnership.',
    10:'Visible work commitments must leave real time for closeness.',
    11:'Friendship networks and shared long-term aims matter.',
    12:'Respect for privacy and recovery is necessary on both sides.'
   },
   2:{
    1:'Resources call for personal initiative and responsibility.',
    2:'Savings and everyday financial habits are especially relevant.',
    3:'Money and resources connect with skill, speech and negotiations.',
    4:'A secure home base and financial reserves matter more than quick results.',
    5:'Creative skill and learning can shape the way value is created.',
    6:'Tracking recurring costs and maintaining discipline become central.',
    7:'Shared financial decisions, agreements and boundaries require care.',
    8:'Shared resources and serious obligations must be assessed separately.',
    9:'Education and long-range plans need to be compared with real costs.',
    10:'Material stability and professional outcomes may be strongly connected.',
    11:'Support networks and longer projects can shape gains.',
    12:'Expenses, private reserves and preserving a stable buffer are key themes.'
   }
  };
  return (uk?specificUk:specificEn)[division]?.[to]||'';
 };
 const d1Facts=(planet:string)=>['D1.'+planet+'.sign='+natal(planet).sign,
  'D1.'+planet+'.house='+place(planet)];
 const cards:Card[]=[];
 const mk=(division:number,reading:string,main:string,secondary:string|null,attention:string|null,
  extras:readonly string[]=[]):Card=>{
  const proof=[...d1Facts(main),...(division===1?[]:[
   'D'+division+'.'+main+'.sign='+inD(division,main).sign,
   'D'+division+'.'+main+'.house='+inD(division,main).house]),
   ...(secondary&&secondary!==main?d1Facts(secondary):[]),...extras];
  return {division,reading:reading.trim(),corroboration:null,attention,
   sourceFacts:uniq(proof),sourceMethod:division===1?['PARASHARI_FUNCTIONAL_LORDSHIP','NAKSHATRA_D1']:
    ['PARASHARI_HOUSE_LORDSHIP','BPHS_SHODASAVARGA_SCOPE'],
   sensitivity:division>=16?'fine':'ordinary'};
 };
 const asc=lords[1],moon=natal('Moon'),lagna=chart.ascendant.sign;
 const yogakaraka=yoga[0];

 const d1Moon=chapter('portrait')[1];
 const d1Reading=uk?
  (asc==='Moon'?
   'Ваш висхідний знак — '+NOM_UK[lagna-1]+'. Його управитель Місяць у '+sign(moon.sign)+
   ' у '+moon.house+'-му домі акцентує сферу «'+area(moon.house)+'».':
   'Ваш висхідний знак — '+NOM_UK[lagna-1]+', його управитель '+name(asc)+
   ' стоїть у '+place(asc)+'-му домі ('+area(place(asc))+
   '). Місяць у '+sign(moon.sign)+' в '+moon.house+'-му домі акцентує сферу «'+area(moon.house)+'».'):
  (asc==='Moon'?'Cancer rises: the Moon, its ruler, occupies '+sign(moon.sign)+
    ' in house '+moon.house+' ('+area(moon.house)+').':
   'Your ascendant ruler '+name(asc)+' occupies D1 house '+place(asc)+' ('+
    area(place(asc))+'). The Moon in '+sign(moon.sign)+' (house '+moon.house+
    ') adds '+area(moon.house)+'.');
 const d1Focus=yogakaraka?
  (uk?'Особливу роль відіграє йогакарака '+name(yogakaraka)+': поєднання управління домами '+
   context.functional.find(f=>f.graha===yogakaraka)!.houses.join(' і ')+
   '. Цей показник важливий для тем здібностей і професійної реалізації.':
   name(yogakaraka)+' is a yogakaraka, simultaneously ruling houses '+
   context.functional.find(f=>f.graha===yogakaraka)!.houses.join(' and ')+
   '. This functional role matters for vocational and creative readings.'):
  // Reuse the hidden, chart-specific authored interpretive layer, not a canned label.
  (d1Moon?d1Moon.split(/(?<=[.!?])\s+/u).slice(0,1).join(' '):'');
 cards.push(mk(1,d1Reading,asc,'Moon',d1Focus,
  ['D1.ascendant.sign='+lagna,...(yogakaraka?d1Facts(yogakaraka):[])]));
 for(const division of N492_DIVISIONS.filter(d=>d!==1&&d!==60)){
  const rulers=HOUSES[division]||[1], main=lords[rulers[0]], p=natal(main),d=inD(division,main);
  const second=SECONDARY[division]||lords[rulers[1]||rulers[0]];
  const dp=inD(division,second);
  const mainStatus=status(main,d.sign);
  const natalStatus=status(main,p.sign);
  const altStatus=status(second,dp.sign);
  const mainFocus=(uk?FOCUS_UK:FOCUS_EN)[division];
  let statement=uk?
   'У темі '+mainFocus+' важливий управитель '+rulers[0]+'-го дому — '+name(main)+
   '. У головній карті він пов’язує її зі сферою «'+area(p.house)+
   '», а в D'+division+' стоїть у '+sign(d.sign)+' ('+d.house+'-й дім).':
   'For '+mainFocus+', a key D1 ruler is '+main+' (house '+rulers[0]+
   '), placed in D1 house '+p.house+' ('+area(p.house)+
   '). In D'+division+', it occupies '+sign(d.sign)+' (house '+d.house+').';
  if(division===10&&yoga.includes(main)){
   statement=uk?
    'Йогакарака для вашого висхідного знака — '+name(main)+': управління '+
    context.functional.find(f=>f.graha===main)!.houses.join('-м і ')+'-м домами. '+
    'У D1 ця планета перебуває у '+p.house+'-му домі ('+area(p.house)+
    '), а в професійній D10 — у '+sign(d.sign)+' ('+d.house+'-й дім).':
    main+' is a yogakaraka for this ascendant, ruling houses '+
    context.functional.find(f=>f.graha===main)!.houses.join(' and ')+
    '. It occupies D1 house '+p.house+' ('+area(p.house)+
    ') and D10 '+sign(d.sign)+' (house '+d.house+').';
  }else if(division===9){
   statement=uk?'Сьомим домом D1 керує '+name(main)+' (у '+p.house+
    '-му домі). У D9 ця планета стоїть у '+sign(d.sign)+
    ', а Венера — у '+sign(inD(9,'Venus').sign)+
    '. У D1 Венера в '+natal('Venus').house+'-му домі, а Місяць — у '+natal('Moon').house+
    '-му: це додає різні умови для взаємності та відновлення, які потрібно читати разом.':
    'The D1 seventh lord '+main+' occupies house '+p.house+
    '. In D9 it is in '+sign(d.sign)+', while Venus is in '+sign(inD(9,'Venus').sign)+
    '. Natal Venus occupies house '+natal('Venus').house+
    ' and the Moon occupies house '+natal('Moon').house+
    '; affection and emotional recovery thus have distinct contexts.';
  }else if(division===2){
   const other=lords[11];
   statement=uk?'Другий дім (особисті ресурси) контролює '+name(main)+
    ' із '+p.house+'-го дому; одинадцятий (здобутки) — '+name(other)+
    ' із '+place(other)+'-го. У D2 '+name(main)+' перебуває у '+sign(d.sign)+
    '. Тут важливо розділити збереження ресурсів і приріст від роботи.':
    'Personal resources (house 2) are ruled by '+main+' in house '+p.house+
    ', while gains (house 11) are ruled by '+other+' in house '+place(other)+
    '. In D2, '+main+' occupies '+sign(d.sign)+'. These are different financial mechanisms.';
  }else if(division===12){
   statement=uk?'D12 стосується батьків і походження. Управитель четвертого дому '+
    name(main)+' у D1 розміщений у '+p.house+'-му, а в D12 — у '+
    sign(d.sign)+'. Управитель дев’ятого дому '+name(lords[9])+
    ' у D1 стоїть у '+place(lords[9])+'-му. Обидві лінії важливі, але не встановлюють фактів вашої родинної історії.':
    'D12 concerns parents and origins. The fourth lord '+main+
    ' is in D1 house '+p.house+' and D12 '+sign(d.sign)+
    ', while the ninth lord '+lords[9]+' occupies D1 house '+place(lords[9])+
    '. These are symbolic, not claims about actual family events.';
  }
  const dignityNote=mainStatus?
   (uk?' У D'+division+' '+name(main)+' '+mainStatus+
    '; це важливий традиційний показник, але не повна сила планети.':
    ' In D'+division+', '+main+' is '+mainStatus+
    ', a meaningful traditional indication but not complete planetary strength.'):'';
  const bornDignity=natalStatus&&natalStatus!==mainStatus?
   (uk?' У D1 ця сама планета '+natalStatus+' — оцінки двох карт треба розрізняти.':
    ' In D1 the same planet is '+natalStatus+'; these two indications need separate weighting.'):'';
  const supporting=second!==main&&altStatus&&(strong(dignityFor(second,dp.sign))||weak(dignityFor(second,dp.sign)))?
   (uk?' Додатково '+name(second)+' у D'+division+' '+altStatus+'.':
    ' The additional '+second+' in D'+division+' is '+altStatus+'.'):'';
  const meaning=blend(division,p.house,d.house);
  const reading=(statement+dignityNote+bornDignity+(meaning?' '+meaning:'')+supporting).trim();
  const extra=second!==main?['D'+division+'.'+second+'.sign='+dp.sign,
   'D'+division+'.'+second+'.house='+dp.house]:[];
  if(division===2){
   extra.push('D1.house-lord.11='+lords[11],...d1Facts(lords[11]));
  }
  if(division===9){
   extra.push(...d1Facts('Venus'),...d1Facts('Moon'),
    'D9.Venus.sign='+inD(9,'Venus').sign);
  }
  if(division===12){
   extra.push('D1.house-lord.9='+lords[9],...d1Facts(lords[9]));
  }
  const card=mk(division,reading,main,second,null,
   ['D1.house-lord.'+rulers[0]+'='+main,...extra]);
  // Only connect another varga when the SAME planet has a genuinely notable
  // concordance or counterpoint in sign dignity; never invent generic synergy.
  const related=COMPANION[division];
  if(related){
   const other=inD(related,main);
   const a=dignityFor(main,d.sign),b=dignityFor(main,other.sign);
   if(strong(a)&&strong(b)){
    card.corroboration=uk?
     'Підтвердження з D'+related+': '+name(main)+' має сприятливий знаковий статус і там. Дві варги підтримують один показник, але це не гарантує результату.':
     'D'+related+' independently repeats a favourable sign dignity for '+main+
     '. That supports one specific indicator without promising an outcome.';
   }else if(strong(a)&&weak(b)||weak(a)&&strong(b)){
    card.corroboration=uk?
     'Важлива різниця: у D'+related+' '+name(main)+' має протилежний знаковий статус. Не можна переносити висновок з однієї теми на всі інші.':
     'In D'+related+', '+main+' has the opposite sign status. One favourable result cannot be applied to every area.';
   }else if(other.sign===d.sign&&related!==division){
    card.corroboration=uk?
     'D'+related+' повторює положення '+gen(main)+' у '+sign(d.sign)+
     '. Це перевірений збіг знака, не окремий доказ події.':
     'D'+related+' repeats '+main+' in '+sign(d.sign)+
     '. This is a verified same-sign agreement, not a separate event prediction.';
   }
   if(card.corroboration)card.sourceFacts=uniq([...card.sourceFacts,
    'D'+related+'.'+main+'.sign='+other.sign,'D'+related+'.'+main+'.house='+other.house]);
  }
  // This is a topic-specific, plain-language *interpretive* implication from
  // V6's domain meanings and the original Parashari functional roles.
  if(!card.corroboration&&division===10&&d.house===6){
   card.corroboration=uk?'Ключовий практичний акцент: складні задачі, щоденна майстерність і робота з помилками.':
    'The working theme is solving hard problems, building skill through practice and addressing mistakes.';
  }
  if(!card.corroboration&&division===9&&p.house===9){
   card.corroboration=uk?'Управитель партнерства у дев’ятому домі робить світогляд, навчання та спільні принципи помітною темою союзу.':
    'A seventh lord in the ninth makes shared beliefs, learning and principles a visible relationship theme.';
  }
  if(!card.corroboration&&division===24&&d.house===6){
   card.corroboration=uk?'Навчання в цій карті пов’язане з практикою й повторенням складних задач, а не тільки з теорією.':
    'Learning here emphasizes repeated practical work on demanding tasks rather than theory alone.';
  }
  if(!card.corroboration&&division===7&&p.house===9){
   card.corroboration=uk?'П’ятий управитель у дев’ятому домі пов’язує виховання та творчий спадок зі знаннями й наставництвом.':
    'The fifth lord in the ninth links creative legacy and children’s education with knowledge and mentorship.';
  }
  // Neither uncertainty nor lack of dignity should be translated into an
  // alarming claim. The traditional varga remit is shown briefly, if needed.
  if(!card.corroboration){
   card.attention=uk?LESSON_UK[division]||null:LESSON_EN[division]||null;
  }
  cards.push(card);
 }
 const preview=buildD60Preview(chart,lang);
 let d60=uk?'D60 уточнює тонкі символічні відтінки планет за введеним моментом народження.':
  'D60 shows finer symbolic planetary placements for the entered birth instant.';
 if(preview.status==='conditional_signs'&&preview.allPlanets.length===9){
  const focus=preview.factors.slice(0,2);
  if(focus.length)d60+=' '+focus.map(x=>x.note.replace(' Цю різницю слід читати разом із D1, а не як окремий прогноз.','.')
   .replace(' These two placements must be read together, not as an independent prediction.','.')).join(' ');
  else d60+=' '+(uk?'Жодне з обраних положень не має достатнього відступу від межі для персонального акценту.':
   'No selected sign is sufficiently distant from the boundary for a personal emphasis.');
 }
 const c60:Card={division:60,reading:d60,corroboration:null,
  attention:uk?'Знаки D60 — обчислення для введеного часу, а не перевірка точності хвилини. Доми та лагна D60 тут не трактуються.':
   'D60 signs are computed for the entered time, not birth-time verification. D60 houses and ascendant remain uninterpreted.',
  sourceFacts:preview.status==='conditional_signs'?preview.allPlanets.flatMap(p=>
   ['D1.'+p.planet+'.sign='+p.d1Sign,'D60.'+p.planet+'.sign='+p.d60Sign,
    'D60.'+p.planet+'.boundaryArcsec='+Math.round(p.boundaryDistanceArcseconds)]):[],
  sourceMethod:['N4_D60_PROVISIONAL_SIGN_MAPPING'],sensitivity:'provisional'};
 cards.push(c60);
 if(cards.length!==16||cards.some((c,i)=>c.division!==N492_DIVISIONS[i]))throw Error('N492_MISSING_OR_DISORDERED_VARGAS');
 const key=lords[10],a=natal(key),work=inD(10,key);
 const workHigh=strong(dignityFor(key,work.sign));
 const d1Card=cards[0],profession=cards.find(c=>c.division===10)!;
 const relationships=cards.find(c=>c.division===9)!;
 const takeaways=[
  {text:uk?(asc==='Moon'?'Ваша основа: висхідний знак '+NOM_UK[lagna-1]+
    ', його управитель Місяць у '+moon.house+'-му домі ('+area(moon.house)+').':
    'Ваша основа: висхідний знак '+NOM_UK[lagna-1]+', управитель '+name(asc)+
    ' у '+place(asc)+'-му домі ('+area(place(asc))+
    '); Місяць у '+moon.house+'-му ('+area(moon.house)+').'):
   (asc==='Moon'?'Your foundation: Cancer ascendant, its ruler Moon in house '+
    moon.house+' ('+area(moon.house)+').':
    'Your foundation: ascendant '+sign(lagna)+', ruled by '+name(asc)+
    ' in house '+place(asc)+' ('+area(place(asc))+'); Moon in house '+
    moon.house+' ('+area(moon.house)+').'),
   sourceFacts:d1Card.sourceFacts},
  {text:uk?(yoga.includes(key)?name(key)+' — йогакарака для цієї лагни. ':'')+
     'Кар’єрний управитель у D1 стоїть у '+a.house+'-му домі, а в D10 — у '+
     sign(work.sign)+(workHigh?' (сприятливий статус за знаком)':'')+
     '. Порівнюйте навчання з реальними професійними діями.':
    (yoga.includes(key)?key+' is a yogakaraka for this ascendant. ':'')+
     'The tenth lord occupies D1 house '+a.house+' and D10 '+sign(work.sign)+
     (workHigh?' (favourable sign dignity)':'')+'. Connect learning with real professional practice.',
   sourceFacts:profession.sourceFacts},
  // Do not always rank partnership as the third priority. The best caution
  // should come from a meaningful verified factor in THIS person's chart.
  (dignityFor('Mercury',natal('Mercury').sign)==='debilitated'?{
   text:uk?'На що звернути увагу: Меркурій у D1 в '+sign(natal('Mercury').sign)+
    ' — це знак його традиційного падіння. Він не означає слабкого інтелекту, але робить особливо важливими ясність висловлювання, навчання та перевірку ідей на практиці.':
    'A point of attention: Mercury in D1 '+sign(natal('Mercury').sign)+
    ' is traditionally debilitated by sign. This is not a judgment of intelligence; clarity in communication, learning and testing ideas deserve care.',
   sourceFacts:[...d1Facts('Mercury'),...cards.find(x=>x.division===24)!.sourceFacts]
  }:(strong(dignityFor(lords[7],inD(9,lords[7]).sign))||
      weak(dignityFor(lords[7],inD(9,lords[7]).sign)))?{
   text:uk?'Стосунки: управитель сьомого дому '+name(lords[7])+
    ' у D9 стоїть у '+sign(inD(9,lords[7]).sign)+' ('+
    (strong(dignityFor(lords[7],inD(9,lords[7]).sign))?
     'власний знак або екзальтація — традиційний ресурс':'знак падіння — традиційна точка уваги')+
    '). Перевіряйте це разом із D1 та Венерою, не роблячи висновку про конкретну людину.':
    'Partnership: the seventh lord '+lords[7]+' in D9 '+sign(inD(9,lords[7]).sign)+
    ' has '+(strong(dignityFor(lords[7],inD(9,lords[7]).sign))?
     'a favourable traditional sign dignity':'a traditionally challenging sign dignity')+
    '. Read it with D1 and Venus, not as a verdict on another person.',
   sourceFacts:relationships.sourceFacts
  }:context.dasha?{
   text:uk?'Поточний життєвий ритм: махадаша '+name(context.dasha.major)+
    ' '+(context.dasha.majorHouses.length?
     '(управитель домів '+context.dasha.majorHouses.join(', ')+'), ':'')+
    'планета періоду у D1 стоїть у '+place(context.dasha.major)+'-му домі. Це контекст для уваги зараз, а не гарантований прогноз.':
    'Present timing lens: '+context.dasha.major+' mahadasha'+
    (context.dasha.majorHouses.length?', ruling houses '+context.dasha.majorHouses.join(', '):'')+
    '; its D1 planet occupies house '+
    place(context.dasha.major)+'. This frames attention, not a promised outcome.',
   sourceFacts:[...d1Facts(context.dasha.major),'dasha.major='+context.dasha.major]
  }:{
   text:uk?'У стосунках ключовий управитель сьомого дому '+name(lords[7])+
      ' у D1 займає '+place(lords[7])+'-й дім. Його потрібно читати разом із Венерою в D9, не підміняючи конкретну людину прогнозом.':
    'For relationships, the seventh lord '+lords[7]+' occupies D1 house '+
    place(lords[7])+'. Read it with Venus in D9, not as a claim about another person’s intentions.',
   sourceFacts:relationships.sourceFacts
  })
 ];
 return {version:N492_MEANING_VERSION,cards,takeaways,
  limits:uk?'Трактування описує традиційні астрологічні показники, не факти про життя. D60 залежить від часу; сила планет і спеціальні йоги не вважаються повністю сертифікованими.':
   'Traditional chart interpretation is not evidence about real-life events. D60 depends on birth-time accuracy; full planetary strength and specialized yogas are not claimed certified.'};
}
