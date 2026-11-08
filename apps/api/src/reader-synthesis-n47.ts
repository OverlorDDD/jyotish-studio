/**
 * N4.8 — a deterministic, evidence-first editorial synthesis.
 * No model, randomized praise, arbitrary character clipping, or claims to know a life.
 * Placements come from the verified birth chart + already checked divisional evidence.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable} from './reader-classical.ts';
export const SYNTHESIS_VERSION='n48-evidence-poetic-v1' as const;
type Lang='uk'|'en';
type Highlight={id:'strength'|'challenge'|'career';division:number;title:string;text:string};
export type ReaderSynthesis={version:typeof SYNTHESIS_VERSION;title:string;opening:string;
 strength:string;challenge:string;direction:string;method:string;highlights:readonly Highlight[]};
type Topic={division:number;title:string;strength:string;challenge:string;step:string;proof:readonly string[]};
const ASC_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const ASC_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const P_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',
 Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const H_UK=[
 'самостійного вибору','грошей, довіри й особистих цінностей','сміливості, слова та вміння домовлятися',
 'дому, пам’яті та відчуття безпеки','творчості, дітей і бажання бути почутими',
 'щоденної майстерності, служіння та подолання перешкод','партнерства й рівноправних домовленостей',
 'великих змін і спільних зобов’язань','пошуку вчителів, сенсу та далекої перспективи',
 'репутації, покликання та видимих результатів','друзів, спільнот і майбутніх планів',
 'усамітненої праці, снів і відновлення'
];
const H_EN=[
 'personal direction','money, trust and personal values','courage, words and negotiation',
 'home, memory and security','creativity, children and being heard',
 'daily craft, service and overcoming obstacles','partnership and equal agreements',
 'change and shared obligations','mentors, meaning and a larger horizon',
 'public contribution and reputation','friendship, networks and long-range hopes',
 'solitude, dreams and restoration'
];
const HOUSE_SCENE_UK=[
 'Виразним стає питання власного голосу: коли вести, а коли не намагатися вести все самотужки.',
 'Тема цінностей переходить у конкретику: що берегти, чим ділитися, на чому не варто торгуватися із собою.',
 'Слово тут має вагу вчинку; воно може відкрити шлях, а може стати надто гострим.',
 'Відчуття дому перестає бути тлом: без внутрішньої опори зовнішні перемоги швидко втрачають смак.',
 'Творчість просить не аплодисментів, а права вирости; поруч постає тема дітей, навчання й радості.',
 'Сила виявляється в непомітному ремеслі: розібрати складне, витримати повторення, не зламатися об опір.',
 'Ваші рішення особливо гостро відгукуються у партнерстві; важливо, хто стоїть поряд і на яких умовах.',
 'Часом життя просить змінити шкіру: навчитися довіряти, коли старі домовленості вже не працюють.',
 'Тут не вистачає простої відповіді: зростає потреба мати переконання, які витримують зустріч із досвідом.',
 'Особисте рішення отримує публічну вагу: важливо не тільки чого досягти, а й за що вас запам’ятають.',
 'Результат народжується серед людей, але потребує вибору свого кола і своєї ролі в ньому.',
 'Головні повороти можуть визрівати в тиші; важливо відрізняти цілющу самоту від втечі від світу.'
];
const HOUSE_SCENE_EN=[
 'Finding your own voice becomes central: knowing when to lead and when to share the burden.',
 'Values become tangible: what to protect, what to share and what cannot be bought.',
 'Words carry the weight of actions: they may open doors or close them too sharply.',
 'Home is no longer a backdrop; external success means less without an inner place to return to.',
 'Creativity needs room to grow, alongside themes of children, teaching and joy.',
 'Skill is forged in the overlooked work: solving difficult problems and enduring resistance.',
 'Decisions echo through partnership, making reciprocity and boundaries especially important.',
 'Change can demand new trust when familiar agreements stop working.',
 'Convictions need to survive an encounter with real experience rather than remain beautiful ideas.',
 'The work becomes visible: not only what you achieve but what your name comes to stand for.',
 'Outcomes are made among people, yet choosing the right circle matters.',
 'Important turns may ripen in silence; restorative solitude and withdrawal are not the same.'
];
type Theme={resourceUk:string;frictionUk:string;resourceEn:string;frictionEn:string};
const THEMES:Readonly<Record<number,Theme>>={
 1:{resourceUk:'Тут характер виявляється у способі брати на себе вибір, навіть коли готової дороги немає.',
  frictionUk:'Рішучість легко перетворити на самотній обов’язок бути сильним для всіх.',
  resourceEn:'Character shows in how you choose a course when no ready-made path exists.',
  frictionEn:'Decisiveness may become the lonely duty of being strong for everyone.'},
 2:{resourceUk:'Відчуття достатку починається там, де цінність перестає дорівнювати ціні.',
  frictionUk:'Прагнення гарантій може непомітно зробити з безпеки клітку.',
  resourceEn:'Abundance becomes more meaningful when worth is not confused with price.',
  frictionEn:'Seeking guarantees can quietly turn security into a cage.'},
 3:{resourceUk:'Сміливість іноді звучить не як крик, а як слово, сказане саме в потрібний момент.',
  frictionUk:'Коли думка випереджає слухання, навіть чесні слова можуть ранити.',
  resourceEn:'Courage sometimes sounds less like a shout than a word spoken at the right moment.',
  frictionEn:'When speaking outruns listening, even honest words can hurt.'},
 4:{resourceUk:'Дім може бути не місцем, а станом: там, де ви здатні не грати чужу роль.',
  frictionUk:'Звичка тримати все під контролем іноді позбавляє дім легкості.',
  resourceEn:'Home may be less a place than the freedom not to perform a role.',
  frictionEn:'The need to control everything can make home feel heavy.'},
 7:{resourceUk:'Творча спадщина народжується в увазі до того, що росте повільно: ідеї, дитини чи майстерності.',
  frictionUk:'Бажання вберегти близьких від кожної помилки може забрати в них власний шлях.',
  resourceEn:'Creative legacy grows through attention to what develops slowly: a craft, an idea or a child.',
  frictionEn:'Protecting someone from every mistake can deny them their own path.'},
 9:{resourceUk:'Близькість тут не про злиття двох доль, а про вміння залишитися собою поруч з іншою людиною.',
  frictionUk:'Мовчання заради миру може накопичувати образи, про які ніхто так і не дізнається.',
  resourceEn:'Intimacy is less about becoming one than remaining yourself beside another person.',
  frictionEn:'Silence maintained for peace may gather resentments that never get named.'},
 10:{resourceUk:'Покликання проступає там, де ваша здатність розв’язати складне стає потрібною іншим.',
  frictionUk:'Можна бути безупинно зайнятим і при цьому дедалі далі від справжньої майстерності.',
  resourceEn:'Vocation emerges where your ability to solve difficult things becomes useful to others.',
  frictionEn:'Constant busyness can lead further away from genuine mastery.'},
 12:{resourceUk:'Родинна історія здатна бути корінням, але не мусить ставати сценарієм життя.',
  frictionUk:'Вірність родині інколи помилково вимагає зрадити власний вибір.',
  resourceEn:'Family history can be roots without having to become your script.',
  frictionEn:'Loyalty to family can mistakenly demand disloyalty to your own direction.'},
 16:{resourceUk:'Комфорт набуває сили тоді, коли він повертає вас до себе, а не відволікає від себе.',
  frictionUk:'Шукати затишку в нових речах легше, ніж помітити, чому ви не знаходите спокою.',
  resourceEn:'Comfort becomes valuable when it brings you back to yourself.',
  frictionEn:'It is easier to seek comfort in new things than to notice what disturbs your peace.'},
 20:{resourceUk:'Тиша може стати майстернею думки: в ній визріває те, що не народилося б серед шуму.',
  frictionUk:'Але тиша не завжди означає спокій; часом вона приховує розмову, якої ви уникаєте.',
  resourceEn:'Silence can become a workshop for thoughts that would never grow in noise.',
  frictionEn:'Silence is not always peace; it can hide a conversation you are avoiding.'},
 24:{resourceUk:'Знання тут варте найбільше тоді, коли змінює те, як ви бачите й робите звичні речі.',
  frictionUk:'Любов до пояснень може затримати зустріч із самим досвідом.',
  resourceEn:'Knowledge matters most when it changes what you actually see and do.',
  frictionEn:'A love of explanations can postpone the encounter with experience.'},
 27:{resourceUk:'Витривалість — це не вміння терпіти нескінченно, а здатність зберігати форму під навантаженням.',
  frictionUk:'Коли надійність стає єдиною роллю, люди можуть не помітити, що вам теж потрібна підтримка.',
  resourceEn:'Resilience is not endless endurance but the ability to keep your shape under pressure.',
  frictionEn:'When being dependable becomes your only role, others may forget you also need support.'},
 30:{resourceUk:'Складнощі вчать бачити слабке місце системи раніше, ніж вона дасть збій.',
  frictionUk:'Звичка чекати небезпеки здатна затьмарити моменти, коли все вже добре.',
  resourceEn:'Difficulty can teach you to see a weak point before a system breaks.',
  frictionEn:'Anticipating trouble can darken moments when nothing is wrong.'},
 40:{resourceUk:'У пам’яті роду може зберігатися не тільки тягар, а й незвичайна здатність проходити зміни.',
  frictionUk:'Чужі давні страхи не повинні керувати сьогоднішніми рішеннями.',
  resourceEn:'Family memory may carry not only burdens but uncommon endurance through change.',
  frictionEn:'Yesterday’s inherited fears need not govern today’s choices.'},
 45:{resourceUk:'Переконання набувають ваги лише там, де стають способом жити, а не гарними словами.',
  frictionUk:'Занадто жорстка вірність принципу іноді заважає побачити живу людину поруч.',
  resourceEn:'Values gain weight when they become how you live, not just words you admire.',
  frictionEn:'Rigid loyalty to a principle can hide the human being in front of you.'}
};
const safe=(x:number)=>Number.isInteger(x)&&x>=1&&x<=12;
export function buildSourceSynthesis(chart:CalculatedChart,lang:Lang,all:readonly Topic[],
 resourceDivision:number,frictionDivision:number,
 polarity:{resource:boolean;friction:boolean}={resource:false,friction:false}):ReaderSynthesis{
 const uk=lang==='uk';
 const named=(n:string)=>uk?(P_UK[n]||n):n;
 const labels=uk?H_UK:H_EN;
 const area=(h:number)=>labels[safe(h)?h-1:0];
 const asc=chart.ascendant,sign=(uk?ASC_UK:ASC_EN)[asc.sign-1];
 const ruler=classicalLordshipTable(asc.sign)[1];
 const lord=chart.d1.find(p=>p.name===ruler);
 const moon=chart.d1.find(p=>p.name==='Moon');
 const lordHouse=safe(lord?.house||0)?lord!.house:1;
 const moonHouse=safe(moon?.house||0)?moon!.house:1;
 const houseImage=(uk?HOUSE_SCENE_UK:HOUSE_SCENE_EN)[lordHouse-1];
 const strength=all.find(x=>x.division===resourceDivision)!;
 const challenge=all.find(x=>x.division===frictionDivision)!;
 const work=all.find(x=>x.division===10)!;
 const partner=all.find(x=>x.division===9)!;
 const factor=(t:Topic)=>{
  const owner=t.proof.find(x=>/^D1\.house-lord\.\d+=/.test(x))?.split('=')[1];
  const match=t.proof.map(x=>new RegExp('^D'+t.division+'\\.([A-Za-z]+)\\.house=(\\d+)$').exec(x))
   .find(x=>x&&(!owner||x[1]===owner));
  const fallback=t.proof.map(x=>new RegExp('^D'+t.division+'\\.([A-Za-z]+)\\.house=(\\d+)$').exec(x)).find(Boolean);
  const found=match||fallback;
  return {planet:found?.[1]||owner||ruler,house:Number(found?.[2]||0)};
 };
 const sourceLine=(t:Topic)=>{
  const f=factor(t);
  if(!safe(f.house))return uk?'Тематичний зріз доповнює загальну карту.':'This focused lens adds context to the main chart.';
  return uk?'У карті «'+t.title+'» '+named(f.planet)+' пов’язаний із темою '+area(f.house)+'.':
   'In the '+t.title+' chart, '+named(f.planet)+' draws attention to '+area(f.house)+'.';
 };
 const lead=uk?
  'Для висхідного знака «'+sign+'» провідною планетою є '+named(ruler)+
   '. У цій натальній карті вона перебуває в '+lordHouse+'-му домі, у сфері '+area(lordHouse)+'. '+
   houseImage+' '+(ruler==='Moon'?
    'Місяць водночас є управителем вашого висхідного знака, тому його роль тут особливо важлива.':
    'А Місяць у '+moonHouse+'-му домі додає інший, особистіший шар — тему '+area(moonHouse)+'.'):
  'With '+sign+' rising, '+named(ruler)+' sets the tone. In this chart it occupies house '+
   lordHouse+', highlighting '+area(lordHouse)+'. '+houseImage+' '+(ruler==='Moon'?
    'The Moon is also your rising ruler, so the same factor carries both themes.':
    'The Moon in house '+moonHouse+' adds a more private thread: '+area(moonHouse)+'.');
 const strengthTheme=THEMES[strength.division]||THEMES[1];
 const riskTheme=THEMES[challenge.division]||THEMES[30];
 const strengthMeaning=uk?strengthTheme.resourceUk:strengthTheme.resourceEn;
 const riskMeaning=uk?riskTheme.frictionUk:riskTheme.frictionEn;
 const opportunity=uk?
  strengthMeaning+' '+(polarity.resource?
   'Тут ця якість має додаткову підтримку: вона здатна стати опорою, якщо не вимагати від себе бездоганності.':
   'Це напрям для уважного читання, а не знак гарантованого успіху.'):
  strengthMeaning+' '+(polarity.resource?
   'Supporting factors give this quality room to grow without demanding perfection.':
   'It is a direction worth considering, not a promise of success.');
 const risk=uk?
  riskMeaning+' '+(polarity.friction?
   'Іноді саме найсильніша риса стає вразливою: їй потрібна міра, а не постійне випробування.':
   'Так може проявитися тінь корисної якості; це не вирок і не вигадана загроза.'):
  riskMeaning+' '+(polarity.friction?
   'Even a remarkable ability can grow vulnerable when it is pushed beyond its natural limits.':
   'This is one possible shadow of a useful trait, not a fate or an invented danger.');
 const workFactor=factor(work),partFactor=factor(partner);
 const direction=uk?
  'Для професійної теми '+named(workFactor.planet)+
   (safe(workFactor.house)?' у карті D10 пов’язаний зі сферою '+area(workFactor.house)+'. ':' додає свій особливий акцент. ')+
   THEMES[10].resourceUk+' У стосунках '+named(partFactor.planet)+
   (safe(partFactor.house)?' в D9 підкреслює сферу '+area(partFactor.house)+'. ':' додає інший ракурс. ')+
   THEMES[9].frictionUk:
  'In work, '+named(workFactor.planet)+
   (safe(workFactor.house)?' in D10 highlights '+area(workFactor.house)+'. ':' adds a distinct emphasis. ')+
   THEMES[10].resourceEn+' In partnership, '+named(partFactor.planet)+
   (safe(partFactor.house)?' in D9 points toward '+area(partFactor.house)+'. ':' contributes another perspective. ')+
   THEMES[9].frictionEn;
 const highlights:Highlight[]=[
  {id:'strength',division:strength.division,
   title:uk?(polarity.resource?'Джерело сили · ':'Помітна тема · ')+strength.title:(polarity.resource?'Source of strength · ':'An emerging theme · ')+strength.title,
   text:sourceLine(strength)+' '+strengthMeaning},
  {id:'challenge',division:challenge.division,
   title:uk?(polarity.friction?'Справжня напруга · ':'Можлива складність · ')+challenge.title:(polarity.friction?'A real tension · ':'A possible difficulty · ')+challenge.title,
   text:sourceLine(challenge)+' '+riskMeaning},
  {id:'career',division:10,
   title:uk?'Професійне покликання · '+work.title:'Vocation · '+work.title,
   text:sourceLine(work)+' '+(uk?THEMES[10].resourceUk:THEMES[10].resourceEn)}
 ];
 return {version:SYNTHESIS_VERSION,
  title:uk?'Нитка, що єднає вашу карту':'The thread running through your chart',
  opening:lead,strength:opportunity,challenge:risk,direction,
  method:uk?'В основі — D1. Тематичні карти уточнюють, але не підміняють її; точні положення і книжкові джерела наведено нижче.':
   'D1 remains primary. Divisional charts add perspective without replacing it; calculations and historical references are listed below.',
  highlights};
}
