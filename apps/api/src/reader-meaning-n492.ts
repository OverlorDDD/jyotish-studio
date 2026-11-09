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
   3:{
    1:"Сміливість у цій карті починається з уміння самостійно почати розмову або новий проєкт.",
    2:"Слова, переговори та вміння визначити цінність власної праці стають практичним полем для цієї теми.",
    3:"Власні навички, письмо й регулярні вправи важливіші за разовий порив.",
    4:"Підтримка домашнього середовища допомагає розвивати впевненість у спілкуванні.",
    5:"Творчість і передавання знань іншій людині стають природним способом практикувати навички.",
    6:"Сміливість тут формується через щоденні складні задачі й готовність виправляти помилки.",
    7:"Домовленості та вміння почути іншого стають перевіркою сили слова.",
    8:"Доречна робота з конфіденційною інформацією й непростими питаннями довіри, а не лише публічні виступи.",
    9:"Навчання, викладання й пояснення власної позиції мають конкретне значення для спілкування.",
    10:"Навички найпомітніше проявляються у професійних поясненнях і відповідальності за результат.",
    11:"Участь у спільнотах і взаємний обмін досвідом підтримують цю тему.",
    12:"Самостійне навчання, письмо та спокійна підготовка можуть бути не менш цінні за гучне самовираження."
   },
   4:{
    1:"Відчуття дому пов’язується з особистим правом обирати, де й як будувати опору.",
    2:"Рішення щодо житла варто поєднувати з реальним бюджетом, резервами та сталістю доходів.",
    3:"Домашня стабільність може залежати від комунікації, документів і практичних навичок ведення господарства.",
    4:"Тут найважливіше саме створення надійного місця для відновлення та близьких.",
    5:"Дім стає простором для творчості, навчання й передачі досвіду наступному поколінню.",
    6:"Побутова стійкість вимагає планового догляду, ремонту та розподілу обов’язків.",
    7:"Спільне житло потребує чітких домовленостей щодо власності й особистих меж.",
    8:"У майнових питаннях варто окремо перевіряти спільні борги, спадкові умови й юридичні зобов’язання.",
    9:"Питання житла пов’язуються з освітою, світоглядом і далекими планами, але не визначають місце проживання.",
    10:"Кар’єрні рішення й умови житла тут впливають одне на одного; важливий реальний баланс.",
    11:"Домашня опора може спиратися на коло підтримки й спільну працю.",
    12:"Тема житла потребує уваги до приватного простору, витрат і можливості відпочинку."
   },
   7:{
    1:"Турбота та творчий спадок вимагають особистої участі, а не лише намірів.",
    2:"Для турботи про дітей і творчу справу потрібен продуманий розподіл ресурсів.",
    3:"Передавання навичок через розмови, спільні вправи та приклад має особливе значення.",
    4:"Домашня атмосфера стає важливою умовою для виховання й творчої роботи.",
    5:"Навчання дітей, творчість і бажання залишити щось цінне є центральними темами цієї позиції.",
    6:"Турбота тут потребує щоденної терплячої праці, а не короткого натхнення.",
    7:"Виховання й творчі проєкти виграють від узгоджених рішень із партнером.",
    8:"Тема дітей і спадкоємності вимагає уваги до довіри й поділу відповідальності.",
    9:"Наставництво, освіта і власні принципи можуть визначати спосіб передавання досвіду.",
    10:"Творчість і турбота поєднуються з видимою відповідальністю та прикладом у роботі.",
    11:"Взаємодія з друзями й спільнотами може підтримувати виховання або творчий проєкт.",
    12:"Турбота потребує приватного часу, відновлення сил і поваги до особистих меж."
   },
   12:{
    1:"Родинна історія впливає на запитання про власну ідентичність, але не визначає її автоматично.",
    2:"Передавання цінностей, ставлення до грошей і родинні звички стають темами для дослідження.",
    3:"Спілкування з батьками й родичами важливіше за припущення про їхні приховані мотиви.",
    4:"Батьківський дім і внутрішнє відчуття опори є важливими символічними темами D12.",
    5:"Передавання знань між поколіннями та спільна творчість можуть бути точкою зв’язку.",
    6:"Родинні обов’язки тут вимагають чіткого розподілу праці й турботи.",
    7:"Взаємні домовленості у сім’ї важливо відрізняти від мовчазних очікувань.",
    8:"Спільне майно й непроговорені зобов’язання потребують фактів і обережності, не домислів.",
    9:"Родинні традиції, навчання й світогляд можуть пояснювати, які цінності хочеться зберегти.",
    10:"Сімейні очікування щодо роботи та статусу варто відділяти від власного покликання.",
    11:"Підтримка з боку близьких важлива, але її реальна наявність визначається вчинками.",
    12:"Дистанція, приватність і пам’ять про родину можуть бути значущими без вигаданих подій минулого."
   },
   16:{
    1:"Якість комфорту залежить від власних рішень про щоденний ритм та умови життя.",
    2:"Витрати на побут і довговічність придбань краще оцінювати через конкретний бюджет.",
    3:"Навички ремонту, організація поїздок та практичне обслуговування допомагають створювати комфорт.",
    4:"Домашній простір і можливість відновлення — головна перевірка цієї теми.",
    5:"Творчі заняття й час для радості можуть бути важливими складниками побуту.",
    6:"Регулярний догляд, порядок і помірне навантаження підтримують стійкий комфорт.",
    7:"Спільне користування простором чи транспортом потребує домовленостей.",
    8:"Несподівані витрати на побут краще зустрічати з резервом і ясними зобов’язаннями.",
    9:"Подорожі й навчання можуть бути частиною способу відновлювати сили.",
    10:"Робочий графік впливає на комфорт; варто перевірити, чи лишається час на відпочинок.",
    11:"Коло друзів і спільні заняття можуть допомагати відновленню.",
    12:"Тиша, сон і особистий простір тут важливіші за демонстративні придбання."
   },
   20:{
    1:"Духовна практика починається з власного наміру, а не з чужих очікувань.",
    2:"Ресурси, час і звички можуть підтримувати регулярну особисту практику.",
    3:"Записи, повторення та короткі щоденні вправи допомагають утримувати увагу.",
    4:"Спокійний простір удома може стати опорою для внутрішньої дисципліни.",
    5:"Вивчення текстів і творче осмислення досвіду мають окреме значення.",
    6:"Найбільший акцент — на регулярній практиці без гонитви за швидким результатом.",
    7:"Спільна практика й повага до меж іншої людини потребують домовленостей.",
    8:"Внутрішні зміни варто проходити уважно, не називаючи кожне переживання містичним знаком.",
    9:"Наставництво, традиційні тексти й перевірка власних переконань стають центральними.",
    10:"Внутрішні принципи можуть проявлятися в відповідальній праці й служінні.",
    11:"Духовна спільнота корисна тоді, коли підтримує самостійну думку й розвиток.",
    12:"Тиша, усамітнення та відновлення можуть бути основним форматом практики."
   },
   24:{
    1:"Навчання тут потребує власної мети й готовності брати відповідальність за прогрес.",
    2:"Говоріння, пояснення й ведення нотаток допомагають перевіряти засвоєні знання.",
    3:"Практичні вправи, письмо і спроби пояснити складне формують навичку.",
    4:"Стабільне місце та ритм занять підтримують тривале навчання.",
    5:"Творчий експеримент і навчання інших можуть поглиблювати розуміння.",
    6:"Складні задачі, повторення й робота над помилками — головний спосіб вчитися.",
    7:"Зворотний зв’язок від учителів та партнерів по роботі може змінювати якість навчання.",
    8:"Дослідницька робота й уміння ставити незручні запитання підтримують глибину знань.",
    9:"Філософія, наставництво й системне вивчення матеріалу формують широку основу.",
    10:"Знання легше оцінити через професійний результат, а не тільки через диплом.",
    11:"Групове навчання й обмін досвідом можуть допомагати закріплювати навички.",
    12:"Зосереджена самостійна робота важлива, коли шум заважає глибокому засвоєнню."
   },
   27:{
    1:"Особиста ініціатива і вміння обирати навантаження допомагають зберігати витривалість.",
    2:"Витривалість залежить і від доступних ресурсів, а не тільки від сили волі.",
    3:"Регулярна практика навичок поступово формує стійкість до складних завдань.",
    4:"Домашня опора й якісне відновлення стають умовою тривалої діяльності.",
    5:"Творчість, гра й навчання можуть повертати енергію після навантаження.",
    6:"Послідовність у щоденних завданнях важлива, але не варто ігнорувати відпочинок.",
    7:"Підтримка й чіткі межі у стосунках допомагають розподіляти навантаження.",
    8:"У складних змінах витривалість вимагає розрізняти власні й спільні зобов’язання.",
    9:"Віра у власний напрям має спиратися на практику й готовність навчатися.",
    10:"Публічна відповідальність вимагає чергувати зусилля й реальне відновлення.",
    11:"Коло підтримки може зменшувати ізоляцію, коли задач стає забагато.",
    12:"Сон, тиша та межі часу тут важливіші за постійне доведення власної сили."
   },
   30:{
    1:"Під час труднощів корисно відділяти власне рішення від зовнішнього тиску.",
    2:"Фінансовий резерв і ясні пріоритети зменшують наслідки раптових витрат.",
    3:"Невдале спілкування чи поспішні обіцянки краще замінювати перевіркою фактів.",
    4:"Стабільність домашнього середовища підтримує здатність вирішувати складні питання.",
    5:"Надмірні очікування від дітей чи творчих планів потребують реалістичного темпу.",
    6:"Рутинні перешкоди краще долати через план, а не самозвинувачення.",
    7:"Договори й спільні рішення потребують зрозумілих меж відповідальності.",
    8:"У питаннях боргів, довіри та спільного майна не можна діяти лише на припущеннях.",
    9:"Переконання варто перевіряти фактами, особливо під тиском авторитетів.",
    10:"Професійні помилки краще виправляти процедурами й повторною перевіркою.",
    11:"Очікування групи не повинні витісняти власну оцінку ризику.",
    12:"Відновлення сил і обмеження перевантаження тут не менш важливі за боротьбу з проблемами."
   },
   40:{
    1:"Материнська родинна символіка тут торкається особистих коренів і самовизначення.",
    2:"Успадковані уявлення про ресурси та цінності можна перевіряти через реальні звички.",
    3:"Манера спілкування в родині може бути важливою темою для свідомого вибору.",
    4:"Дім і сімейні традиції стають центральним символічним ракурсом.",
    5:"Тема передавання знань і творчих умінь між поколіннями помітна в цій карті.",
    6:"Турбота й родинні обов’язки потребують розподілу, а не безмежної самопожертви.",
    7:"Межі та домовленості з родичами важливо вибудовувати без вигаданих претензій.",
    8:"Спільні ресурси й нез’ясовані родинні питання потрібно перевіряти документально.",
    9:"Традиції, світогляд і навчання можуть стати містком між поколіннями.",
    10:"Ставлення до професії й публічної ролі може бути частиною сімейного спадку.",
    11:"Коло підтримки й взаємна допомога можуть бути значущими темами цього ракурсу.",
    12:"Дистанція й приватний простір можуть допомагати зберігати близькість без тиску."
   },
   45:{
    1:"Батьківська родинна символіка торкається того, як людина формує власний напрям.",
    2:"Уявлення про гроші, цінність праці й відповідальність можна свідомо переосмислювати.",
    3:"Практичні навички та манера пояснювати світ можуть бути предметом передачі досвіду.",
    4:"Тема дому й почуття безпеки пов’язана з моделями підтримки, а не з доказами конкретних подій.",
    5:"Навчання й творчий приклад можуть бути важливою частиною спадкоємності.",
    6:"Робоча дисципліна й ставлення до обов’язків стають символічною родинною темою.",
    7:"Моделі домовленостей і меж відповідальності варто перевіряти в реальних стосунках.",
    8:"Спільні зобов’язання та родинні ресурси потребують фактів, а не припущень.",
    9:"Переконання, освіта й образ наставника формують помітний символічний контекст.",
    10:"Професійні очікування можна відокремлювати від власного рішення про покликання.",
    11:"Спільноти й коло підтримки можуть впливати на те, які цінності зберігаються.",
    12:"Простір для усамітнення допомагає відділяти власні потреби від успадкованих очікувань."
   },
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
   3:{
    1:"Initiative in communication begins with choosing to start a conversation or project independently.",
    2:"Speech, negotiation and articulating the value of work become useful areas to practice.",
    3:"Writing, practiced skill and sustained effort matter more than an occasional burst of courage.",
    4:"Supportive home conditions can make communication and personal confidence easier to develop.",
    5:"Creative learning and teaching another person become concrete ways to practice skills.",
    6:"Courage develops through demanding daily tasks and a willingness to correct mistakes.",
    7:"Negotiation and attentive listening become tests of a person's communication style.",
    8:"Confidential work and complicated trust questions may matter as much as public speaking.",
    9:"Study, teaching and communicating a viewpoint are visible themes for this area.",
    10:"Skills become most apparent through work communication and responsibility for outcomes.",
    11:"Communities and reciprocal exchanges of experience can support communication.",
    12:"Independent study, writing and quiet preparation can be as important as speaking publicly."
   },
   4:{
    1:"Home decisions are tied to personal agency and the right to choose a stable base.",
    2:"Housing decisions call for budgeting, reserves and a sustainable use of resources.",
    3:"Documents, conversations and practical household skills matter for domestic stability.",
    4:"Creating a dependable place for recovery and family is the central theme.",
    5:"Home can become a setting for creativity, learning and helping the next generation.",
    6:"Maintenance, repairs and shared responsibility support long-term domestic stability.",
    7:"Shared property calls for clear agreements about ownership and boundaries.",
    8:"Joint debts, inheritance terms and legal obligations deserve careful factual checking.",
    9:"Housing themes connect to learning, beliefs and long-range plans without predicting a move.",
    10:"Career choices and housing conditions can influence one another; their balance matters.",
    11:"Home stability can depend on mutual support and constructive cooperation.",
    12:"Privacy, financial costs and a place to rest matter in decisions about housing."
   },
   7:{
    1:"Care and creative legacy call for personal involvement, not intentions alone.",
    2:"Care for children and long-term creative projects calls for thoughtful resource planning.",
    3:"Teaching by example, conversations and shared practice can be important.",
    4:"The atmosphere at home can support care and long-term creative work.",
    5:"Learning, children and the desire to pass something meaningful onward become central.",
    6:"Care often needs patient everyday work more than brief bursts of inspiration.",
    7:"Parenting and creative projects benefit from decisions agreed upon with a partner.",
    8:"Children and legacy raise questions of trust and shared responsibilities.",
    9:"Mentorship, education and principles may inform what a person passes onward.",
    10:"Creative legacy and care link to visible responsibility and professional example.",
    11:"Friends and support networks can help sustain caregiving or creative projects.",
    12:"Care also requires private time, recovery and respect for personal boundaries."
   },
   12:{
    1:"Family symbolism raises questions of identity without deciding who a person is.",
    2:"Inherited values, resources and family habits become subjects worth examining.",
    3:"Actual conversations with parents and relatives matter more than guessing hidden motives.",
    4:"Parents, home and personal foundations become major symbolic themes.",
    5:"Passing knowledge across generations and creating together may be connecting points.",
    6:"Family duties benefit from clear expectations about work and care.",
    7:"Mutual agreements among relatives should be distinguished from silent expectations.",
    8:"Joint property and family obligations need documentation and care, not invented stories.",
    9:"Family traditions, education and beliefs can shape which values a person keeps.",
    10:"Family expectations about professional status need separating from one's own vocation.",
    11:"Mutual support among relatives matters only to the extent it exists in real actions.",
    12:"Distance, privacy and memory of family can matter without assuming any undocumented past."
   },
   16:{
    1:"Comfort depends partly on personal decisions about daily rhythm and living conditions.",
    2:"Household costs and durability of purchases call for a concrete budget.",
    3:"Repair skills, transport organization and maintenance can contribute to comfort.",
    4:"The home environment and space to recover are central to this topic.",
    5:"Recreation, creative activity and time for enjoyment may be part of sustainable comfort.",
    6:"Order, maintenance and moderate workloads are important parts of stable comfort.",
    7:"Shared space or vehicles require clear agreements with others.",
    8:"Unexpected household costs call for reserves and understandable obligations.",
    9:"Travel and learning can become part of how a person restores their energy.",
    10:"Work schedules affect comfort, so time for recovery should be considered.",
    11:"Friends and shared activities can contribute to enjoyment and restoration.",
    12:"Sleep, quiet and personal space can matter more than impressive possessions."
   },
   20:{
    1:"Spiritual practice starts with individual intention rather than others' expectations.",
    2:"Time, resources and habits can support a sustainable personal practice.",
    3:"Journaling, repetition and short daily exercises help develop attention.",
    4:"A quiet space at home can support inward discipline.",
    5:"Reading, reflection and creative interpretation of experience matter.",
    6:"The focus is on regular practice rather than a race toward extraordinary experiences.",
    7:"Shared practice works best with respect for another person's limits.",
    8:"Inner change deserves care without treating every experience as a mystical sign.",
    9:"Mentors, tradition and testing one's beliefs against study become important.",
    10:"Inner principles may be expressed through responsible work and service.",
    11:"A spiritual community helps when it supports independent thought and development.",
    12:"Solitude, quiet and recovery can provide the main conditions for practice."
   },
   24:{
    1:"Learning needs a self-directed goal and responsibility for real progress.",
    2:"Speaking, explaining and taking notes can test whether knowledge has been learned.",
    3:"Writing, practical exercises and explaining complex material help develop skill.",
    4:"A stable study setting and routine can support sustained education.",
    5:"Creative exploration and teaching can deepen understanding.",
    6:"Difficult exercises, repetition and correcting errors are central to learning.",
    7:"Feedback from mentors and partners can change the quality of study.",
    8:"Research and asking difficult questions can deepen learning.",
    9:"Philosophy, mentorship and a structured curriculum build a broad foundation.",
    10:"Professional results reveal applied learning better than credentials alone.",
    11:"Group study and exchanging experience can strengthen learning.",
    12:"Independent focused work can help when distractions interrupt deep learning."
   },
   27:{
    1:"Personal agency and choosing sustainable workloads matter for resilience.",
    2:"Resilience also depends on material resources rather than willpower alone.",
    3:"Regularly practicing skills builds steadiness under difficult demands.",
    4:"Home stability and proper recovery can support lasting effort.",
    5:"Play, creativity and learning may restore energy after demands.",
    6:"Daily consistency matters, but recovery should not be ignored.",
    7:"Support and boundaries in relationships help spread responsibility.",
    8:"Resilience during change includes distinguishing personal and shared obligations.",
    9:"A sense of direction needs to be tested by practical learning.",
    10:"Public responsibilities should be balanced with actual recovery.",
    11:"Support networks can reduce isolation when obligations grow.",
    12:"Sleep, solitude and limits on time matter more than continually proving toughness."
   },
   30:{
    1:"During difficulties, separate personal choice from external pressure.",
    2:"A reserve and clear priorities can reduce the consequences of unexpected costs.",
    3:"Fact-checking and revising promises may help when communication fails.",
    4:"A stable home environment can support resolving difficult issues.",
    5:"Expectations about children or creative plans may need a realistic pace.",
    6:"Recurring obstacles respond better to planning than to self-blame.",
    7:"Contracts and shared decisions need clear boundaries of responsibility.",
    8:"Debts, shared resources and trust cannot be handled by assumptions alone.",
    9:"Beliefs need checking against evidence, especially when authority figures apply pressure.",
    10:"Work mistakes call for processes, review and realistic deadlines.",
    11:"Group expectations should not replace one's own assessment of risk.",
    12:"Rest and recovery matter as much as direct efforts to solve problems."
   },
   40:{
    1:"The maternal-line symbolic lens raises questions of personal roots and identity.",
    2:"Inherited habits around resources and values can be examined through lived behavior.",
    3:"Family communication patterns may be important areas for conscious choice.",
    4:"Home and family traditions are central symbolic themes.",
    5:"The transfer of knowledge and creative skills across generations can matter.",
    6:"Care duties in families benefit from balance rather than boundless self-sacrifice.",
    7:"Boundaries and agreements among relatives matter without inventing accusations.",
    8:"Family assets and unresolved questions require records rather than assumptions.",
    9:"Traditions, worldview and education may connect different generations.",
    10:"Attitudes toward work and public responsibility may form part of the symbolic inheritance.",
    11:"Support networks and mutual help are relevant to this domain.",
    12:"Distance and privacy can preserve connection without pressure."
   },
   45:{
    1:"The paternal-line symbolic lens concerns how personal direction is formed.",
    2:"Ideas about money, the value of work and responsibility deserve reconsideration.",
    3:"Practical skills and ways of explaining the world may be themes of transmitted experience.",
    4:"Home and security are connected to patterns of support, not proof of past events.",
    5:"Learning and creative example can be significant parts of legacy.",
    6:"Work discipline and attitudes to duty become a symbolic inherited theme.",
    7:"Models of negotiation and boundaries should be tested in real relationships.",
    8:"Shared obligations and family assets require facts, not speculation.",
    9:"Beliefs, education and mentoring form meaningful symbolic contexts.",
    10:"Career expectations need separating from personal vocational choices.",
    11:"Communities and mutual support can influence which values endure.",
    12:"Private time can help separate personal needs from inherited expectations."
   },
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
  if(focus.length)d60+=' '+focus.map(x=>x.note.replace(' Цю різницю слід читати разом із D1, а не як окремий прогноз.','')
   .replace(' These two placements must be read together, not as an independent prediction.','')).join(' ');
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
 const partnershipDignity=dignityFor(lords[7],inD(9,lords[7]).sign);
 const partnershipStrong=strong(partnershipDignity);
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
  }:(partnershipStrong||weak(partnershipDignity))?{
   text:uk?'Стосунки: управитель сьомого дому '+name(lords[7])+
    ' у D9 стоїть у '+sign(inD(9,lords[7]).sign)+' ('+
    (partnershipStrong?
     (partnershipDignity==='own'?'власний знак — традиційний ресурс':'екзальтація — традиційний ресурс'):
     'знак падіння — традиційна точка уваги')+
    '). Перевіряйте це разом із D1 та Венерою, не роблячи висновку про конкретну людину.':
    'Partnership: the seventh lord '+lords[7]+' in D9 '+sign(inD(9,lords[7]).sign)+
    ' has '+(partnershipStrong?
     (partnershipDignity==='own'?'an own-sign placement':'an exalted placement'):
     'a debilitated sign placement')+
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
