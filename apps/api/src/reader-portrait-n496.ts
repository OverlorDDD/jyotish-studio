/**
 * N4.9.6 — five readable life areas, derived from the same verified
 * Shodashavarga data as the 16-card technical reader.
 *
 * A life-area portrait is a traditional symbolic interpretation, not a
 * psychological diagnosis or a prediction of real personal events.
 * Internal proof stays in the API; no symbolic key/value codes enter prose.
 * All example statements depend on actual chart rulership and placements.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';

type Lang='uk'|'en';
type Copy=readonly [string,string];
type Area='identity'|'money'|'career'|'relationships'|'roots';
export const N496_VERSION='n496-human-portrait-1.0.0' as const;
export const N496_AREAS:readonly {id:Area;divisions:readonly number[]}[]=[
 {id:'identity',divisions:[1,3,27,30,60]},
 {id:'money',divisions:[2,16]},
 {id:'career',divisions:[10,24]},
 {id:'relationships',divisions:[7,9]},
 {id:'roots',divisions:[4,12,20,40,45]}
];
export type LifeArea={
 id:Area;title:string;story:string;nuance:string;action:string;
 divisions:readonly number[];proof:readonly string[];
};
export type LifePortrait={version:typeof N496_VERSION;title:string;intro:string;areas:readonly LifeArea[]};
const pick=(c:Copy,lang:Lang)=>c[lang==='uk'?0:1];
const SELF:readonly Copy[]=[
 ['самі обираєте мету й відповідаєте за наслідки','choose the goal yourself and accept its consequences'],
 ['маєте ясність у грошах і власних пріоритетах','know what is worth your time and money'],
 ['можете навчитися нового й висловити свою думку','can learn something new and express your own view'],
 ['повертаєтеся до знайомого місця, де відновлюєте сили','return to a place where you feel grounded'],
 ['створюєте щось власне або допомагаєте іншому рости','create something of your own or help someone grow'],
 ['бачите, як щоденна праця поступово приносить результат','see steady practice pay off'],
 ['приймаєте рішення через рівноправну розмову','make decisions through an equal conversation'],
 ['проходите зміни й водночас зберігаєте власні межі','navigate change without losing your boundaries'],
 ['розумієте, заради яких переконань дієте','understand the principles behind your choices'],
 ['берете відповідальність за помітний результат','take responsibility for a visible result'],
 ['робите внесок у спільну справу, не зникаючи в групі','contribute to a group without losing your voice'],
 ['маєте час побути наодинці та впорядкувати думки','have time alone to organize your thoughts']
];
const MONEY:readonly Copy[]=[
 ['самі визначаєте межу ризику','set your own limit on financial risk'],
 ['розділяєте щоденні витрати й довгострокові заощадження','separate everyday spending from longer-term savings'],
 ['перетворюєте навичку на послугу або продукт','turn a skill into a useful service or product'],
 ['створюєте фінансову подушку для дому','build a cushion for your household'],
 ['інвестуєте час у навчання перед витратами','learn before committing money'],
 ['помічаєте дрібні регулярні витрати','notice small recurring expenses'],
 ['заздалегідь узгоджуєте спільний бюджет','agree on shared spending before it happens'],
 ['тримаєте резерв на непередбачувані зміни','keep a reserve for unexpected changes'],
 ['оцінюєте довгострокову користь замість гучних обіцянок','judge lasting value rather than big promises'],
 ['пов’язуєте винагороду з реальним результатом роботи','connect your income to tangible work'],
 ['відділяєте спільні зобов’язання від особистих грошей','separate group obligations from personal finances'],
 ['передбачаєте кошти на відпочинок і відновлення','budget for rest and recovery']
];
const WORK:readonly Copy[]=[
 ['можете самі визначити спосіб виконання завдання','have room to choose how a task is done'],
 ['робите користь помітною й вимірюваною','make the value of your work clear and measurable'],
 ['пояснюєте складне або швидко освоюєте новий інструмент','explain complexity or learn a new tool'],
 ['створюєте надійне середовище для роботи інших','build an environment others can rely on'],
 ['пропонуєте оригінальну ідею та доводите її до прототипу','turn an original idea into a prototype'],
 ['усуваєте повторювану помилку й покращуєте процес','fix a recurring problem and improve a process'],
 ['можете узгодити різні інтереси в команді','can reconcile different priorities in a team'],
 ['розбираєте складні питання без поспішних висновків','investigate a complex issue without rushing to a verdict'],
 ['передаєте знання або працюєте з наставником','teach someone or learn with a mentor'],
 ['доводите проєкт від задуму до завершення','take a project from proposal to completion'],
 ['об’єднуєте людей навколо корисної спільної справи','bring people together around useful work'],
 ['маєте простір для тихої зосередженої роботи','have uninterrupted time for focused work']
];
const PARTNER:readonly Copy[]=[
 ['можете зберігати особисту свободу','can keep some independence'],
 ['розумієте фінансові очікування одне одного','understand each other’s financial expectations'],
 ['можете говорити прямо і справді бути почутими','can speak openly and feel heard'],
 ['маєте спільне уявлення про домашній спокій','share an idea of what makes home feel safe'],
 ['залишаєте місце грі, творчості та спільним відкриттям','make room for play, creativity and curiosity'],
 ['можете справедливо розподілити щоденні обов’язки','can divide daily responsibilities fairly'],
 ['будуєте домовленості на взаємності','build agreements on reciprocity'],
 ['можете довіряти одне одному під час змін','can trust each other when plans change'],
 ['поважаєте різницю переконань та життєвих цілей','respect differences in beliefs and goals'],
 ['визнаєте робочі амбіції одне одного','make space for each other’s ambitions'],
 ['залишаєте місце друзям та спільноті','make room for friends and community'],
 ['поважаєте потребу одне одного в тиші','respect each other’s need for quiet']
];
const HOME:readonly Copy[]=[
 ['ви самі визначаєте домашні правила','you have a say in the rules of your home'],
 ['у побуті є зрозуміла фінансова опора','your household has clear financial foundations'],
 ['вдома можна говорити про складне без страху','difficult conversations are possible at home'],
 ['є знайомі ритуали, які заспокоюють','small familiar routines create calm'],
 ['у родині заохочують творчість і допитливість','curiosity and creativity have room to grow'],
 ['обов’язки не лягають постійно на одну людину','care and chores do not fall on one person'],
 ['є місце для різних характерів і компромісів','different personalities have room to coexist'],
 ['зміни не руйнують почуття належності','change does not erase a sense of belonging'],
 ['можна берегти традиції, але й ставити запитання','traditions can be kept and questioned'],
 ['успіх поза домом не замінює близькості всередині','outside success does not replace closeness at home'],
 ['ви відчуваєте підтримку свого кола','you feel supported by your circle'],
 ['у вас є приватний простір для відновлення','you have privacy to recharge']
];
const ACTIONS:Readonly<Record<Area,readonly Copy[]>>={
 identity:[
  ['Запишіть одне рішення, яке давно відкладали, і виберіть перший посильний крок.','Write down one decision you have postponed and choose its smallest next step.'],
  ['На найближчий тиждень захистіть один час без чужих вимог.','Protect one period this week from competing demands.'],
  ['Визначте, яку власну межу хочете зберегти в наступній важливій розмові.','Name one boundary to keep in your next important conversation.']
 ],
 money:[
  ['Перегляньте три останні витрати: яка з них справді підтримала важливу для вас мету?','Review three recent expenses. Which one supported a goal you genuinely value?'],
  ['Відділіть обов’язкові платежі від бажаних покупок у бюджеті на місяць.','Separate required payments from optional purchases in next month’s budget.'],
  ['Запишіть одну суму для резерву та реалістичний спосіб її відкладати.','Choose a realistic reserve amount and how you will set it aside.']
 ],
 career:[
  ['Виберіть одне завдання, яке можна завершити за тиждень і показати результат.','Choose a task you can finish within a week and show the result.'],
  ['Попросіть зворотний зв’язок про одну конкретну навичку, яку хочете посилити.','Ask for feedback on one specific skill you want to strengthen.'],
  ['Оберіть проблему, яку давно помічаєте, і запропонуйте мале перевірюване рішення.','Identify a recurring problem and test a small practical solution.']
 ],
 relationships:[
  ['Домовтеся про спокійну розмову: що кожен очікує від взаємної підтримки?','Have a calm conversation about what mutual support means to each of you.'],
  ['Сформулюйте одну потребу без звинувачень і запитайте, чого потребує інша людина.','Express one need without blame and ask what the other person needs.'],
  ['Узгодьте одну побутову відповідальність, яку досі розуміли по-різному.','Clarify one shared responsibility you have understood differently.']
 ],
 roots:[
  ['Оберіть одну сімейну звичку, яку варто зберегти, і одну, яку ви хочете змінити.','Choose one family habit worth keeping and one you want to change.'],
  ['Зробіть маленьку зміну вдома, яка полегшить щоденне відновлення сил.','Make one small change at home that makes daily rest easier.'],
  ['Запитайте близьку людину про сімейну історію, яку ви досі знали лише частково.','Ask someone close about a family story you only know in fragments.']
 ]
};
const TITLES:Readonly<Record<Area,Copy>>={
 identity:['Хто ви і де ваша опора','Identity and inner strength'],
 money:['Гроші та відчуття стабільності','Money and security'],
 career:['Робота, здібності та розвиток','Work, abilities and growth'],
 relationships:['Стосунки та близькість','Relationships and closeness'],
 roots:['Рід, дім і внутрішній світ','Family, home and inner life']
};
const NUDGE:Readonly<Record<Area,readonly Copy[]>>={
 identity:[
  ['Ваші сильні сторони можуть розкриватися через регулярність, а не постійний ривок.','Your strengths may grow through consistency rather than constant urgency.'],
  ['Якщо напрям неясний, не вимагайте негайної відповіді: перевірте його маленькою дією.','If direction feels unclear, test it through a small action rather than forcing certainty.'],
  ['Сприймайте власну чутливість як привід уважніше вибирати темп, а не як перешкоду.','Treat sensitivity as a reason to choose your pace thoughtfully, not as a failing.']
 ],
 money:[
  ['Надійність тут може народжуватися з послідовного обліку, а не з азартного рішення.','Reliability may come from consistent tracking, not an exciting bet.'],
  ['Не поспішайте порівнювати себе з чужими доходами: важливіші ваші зобов’язання та цілі.','Resist comparing incomes; your responsibilities and goals matter more.'],
  ['Ресурсом може бути вміння вчасно зупинити необов’язкові витрати.','Knowing when to stop unnecessary spending can be a real resource.']
 ],
 career:[
  ['Тут корисніше показати завершену роботу, ніж переконливо говорити про майбутній успіх.','A finished piece of work will speak more clearly than promises of success.'],
  ['Професійна впевненість може вирости з конкретної вправи й чесного відгуку.','Professional confidence may grow through practice and candid feedback.'],
  ['Не кожна складність вимагає змінити професію; спершу змініть спосіб роботи.','Not every obstacle calls for a new career; first test a different way of working.']
 ],
 relationships:[
  ['Відвертість тут важливіша за вгадування чужих почуттів.','Honesty matters more than guessing what someone feels.'],
  ['Підтримка не дорівнює згоді в усьому; простір для розбіжностей зберігає повагу.','Support does not require agreeing on everything; room for differences preserves respect.'],
  ['Близькість зміцнюють послідовні вчинки, а не одна велика обіцянка.','Closeness is built through consistent actions, not one grand promise.']
 ],
 roots:[
  ['Сімейний досвід може бути джерелом сили, але він не зобов’язує повторювати чужий шлях.','Family experience can help without obliging you to repeat someone else’s life.'],
  ['Внутрішній спокій іноді починається з простих, передбачуваних домашніх звичок.','Inner calm sometimes begins with simple, dependable routines at home.'],
  ['Успадковані переконання варто перевіряти власним досвідом, а не приймати автоматично.','Inherited beliefs deserve reflection rather than automatic acceptance.']
 ]
};
const domain=(arr:readonly Copy[],house:number,lang:Lang)=>pick(arr[house-1],lang);
const qIndex=(q:string)=>q==='debilitated'?1:q==='own'||q==='exalted'?0:2;

export function buildLifePortraitN496(chart:CalculatedChart,lang:Lang):LifePortrait|null{
 const source=verifiedVargaSource(chart);
 if(!source)return null;
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const evidence=(division:number,subject:number)=>{
  const lord=lords[subject];
  const natal=chart.d1.find(p=>p.name===lord);
  const varga=source.charts.find(c=>c.division===division)?.planets.find(p=>p.name===lord);
  if(!natal||!varga||!(natal.house>=1&&natal.house<=12)||!(varga.house>=1&&varga.house<=12))return null;
  return {lord,natal,varga,quality:dignityFor(lord,varga.sign)};
 };
 const one=evidence(1,1),money=evidence(2,2),career=evidence(10,10),
  relation=evidence(9,7),roots=evidence(4,4);
 // A second independently calculated varga must influence each human story.
 // These are related topics, not five new claims from D1 alone.
 const secondary={
  identity:{item:evidence(27,1),div:27,subject:1},
  money:{item:evidence(16,4),div:16,subject:4},
  career:{item:evidence(24,5),div:24,subject:5},
  relationships:{item:evidence(7,5),div:7,subject:5},
  roots:{item:evidence(12,4),div:12,subject:4}
 };
 if(!one||!money||!career||!relation||!roots||
  Object.values(secondary).some(x=>!x.item))return null;
 const uk=lang==='uk',idx=(id:Area,house:number,quality:string)=>
  // Action varies with a real varga placement and dignity (never with random text).
  (house+qIndex(quality))%ACTIONS[id].length;
 const build=(id:Area,story:string,nuance:string,subject:number,div:number,
  observed:NonNullable<typeof one>):LifeArea=>{
  const group=N496_AREAS.find(a=>a.id===id)!;
  const follow=secondary[id],also=follow.item!;
  const exampleUk:Record<Area,string>={
   identity:'Коли навантаження зростає, важливо помічати, чи ви ',
   money:'Побутовий комфорт теж пов’язаний з тим, як ви ',
   career:'Окремо перевіряйте, як навчання допомагає, коли ви ',
   relationships:'У спільних творчих або сімейних справах важливо, щоб ви ',
   roots:'Родинні приклади можуть підтримувати, коли '
  };
  const exampleEn:Record<Area,string>={
   identity:'When pressure rises, notice whether you ',
   money:'Everyday comfort is also affected by how you ',
   career:'Notice whether learning helps when you ',
   relationships:'In shared creative or family responsibilities, it matters that you ',
   roots:'Family examples may help when '
  };
  const vocabulary:Record<Area,readonly Copy[]>={
   identity:SELF,money:MONEY,career:WORK,relationships:PARTNER,roots:HOME
  };
  const secondSentence=(uk?exampleUk[id]:exampleEn[id])+
   domain(vocabulary[id],also.varga.house,lang)+'.';
  return {id,title:pick(TITLES[id],lang),story,
   nuance:nuance+' '+secondSentence,
   action:pick(ACTIONS[id][idx(id,observed.varga.house,also.quality)],lang),
   divisions:group.divisions,
   proof:['D1.house-lord.'+subject+'='+observed.lord,
    'D1.'+observed.lord+'.house='+observed.natal.house,
    'D'+div+'.'+observed.lord+'.sign='+observed.varga.sign,
    'D'+div+'.'+observed.lord+'.house='+observed.varga.house,
    'D1.house-lord.'+follow.subject+'='+also.lord,
    'D'+follow.div+'.'+also.lord+'.sign='+also.varga.sign,
    'D'+follow.div+'.'+also.lord+'.house='+also.varga.house]};
 };
 const areas:LifeArea[]=[
  build('identity',uk?
   'Ваше відчуття власного шляху може бути найміцнішим, коли ви '+
    domain(SELF,one.natal.house,lang)+'. Це підказка про те, в яких ситуаціях варто шукати самостійність, а не готову відповідь від інших.':
   'You may feel most at home with your own direction when you '+
    domain(SELF,one.natal.house,lang)+'. This suggests situations where agency may help more than waiting for someone else to decide.',
   pick(NUDGE.identity[qIndex(one.quality)],lang),1,1,one),
  build('money',uk?
   'Фінансова впевненість для вас може зростати, коли ви '+
    domain(MONEY,money.natal.house,lang)+'. Тут важливо відрізняти реальну опору від короткого відчуття, що все під контролем.':
   'Financial confidence may grow when you '+
    domain(MONEY,money.natal.house,lang)+'. Try to distinguish durable security from a brief feeling of control.',
   pick(NUDGE.money[qIndex(money.quality)],lang),2,2,money),
  build('career',uk?
   'У професії ви можете знаходити найбільше сенсу, коли ви '+
    domain(WORK,career.natal.house,lang)+'. Це радше орієнтир для вибору конкретних завдань, ніж ярлик «вашої єдиної професії».':
   'Work may feel most meaningful when you '+
    domain(WORK,career.natal.house,lang)+'. Treat this as a guide to choosing tasks, not a label for one destined career.',
   pick(NUDGE.career[qIndex(career.quality)],lang),10,10,career),
  build('relationships',uk?
   'У стосунках важливо, щоб ви '+
    domain(PARTNER,relation.natal.house,lang)+'. Уміння говорити про це прямо може бути кориснішим за спробу передбачити поведінку партнера.':
   'In a relationship, it may matter that you '+
    domain(PARTNER,relation.natal.house,lang)+'. Naming this openly can be more helpful than trying to predict a partner’s behavior.',
   pick(NUDGE.relationships[qIndex(relation.quality)],lang),7,9,relation),
  build('roots',uk?
   'Відчуття дому й належності може ставати міцнішим, коли '+
    domain(HOME,roots.natal.house,lang)+'. Ви можете взяти від родини те, що підтримує, і по-новому організувати решту.':
   'Your sense of home may strengthen when '+
    domain(HOME,roots.natal.house,lang)+'. You can keep what supports you from your family background and rethink what does not.',
   pick(NUDGE.roots[qIndex(roots.quality)],lang),4,4,roots)
 ];
 return {version:N496_VERSION,title:uk?'Ваш портрет у п’яти сферах життя':'Your life in five connected areas',
  intro:uk?'Розгляньте, як різні сторони життя поєднуються саме у вашій карті. Кожне пояснення має практичний крок; детальні карти можна відкрити окремо.':
   'Explore how different parts of life connect in your chart. Each area includes something practical to try; the detailed charts are available separately.',
  areas};
}
