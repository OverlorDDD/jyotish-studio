/**
 * Reader 8.1 — source-bound editorial synthesis.
 *
 * Deliberately separates story (a question, a tension and one useful action)
 * from provenance (book/rule IDs), which stays in expandable UI details.
 * All individual choices derive from D1 + verified Dn evidence tokens.
 * Language is curated, not produced by an LLM or a generic house template.
 */
export const N45_EDITORIAL_VERSION='n45-human-reading-1.0.0' as const;
export type ReaderLanguage='uk'|'en';
export type EditorialInput={
 division:number; title:string; proof:readonly string[];
 support:boolean; friction:boolean; contrast:boolean; complement:boolean;
 directCareer:boolean; timeSensitive:boolean;
};
export type EditorialNarrative={
 headline:string;strength:string;challenge:string;context:string;step:string;
 highlight:string;voice:'curated_source_bound';
};
type Topic={
 opening:string;question:string;scenario:string;stakes:string;
 actions:readonly [string,string,string,string];
};
const TOPICS_UK:Readonly<Record<number,Topic>>={
 1:{opening:'Справжній напрям рідко відкривається одним осяянням. Частіше його видно за рішеннями, які ви повторюєте.',
 question:'Що у вашому житті варто обирати свідомо, а не за інерцією?',
 scenario:'потрібно вирішити, заради чого ви готові відмовитися від зайвого',
 stakes:'Не все важливе потрібно робити одночасно',
 actions:['Оберіть одне рішення, яке відкладаєте, і сформулюйте його в одному реченні.',
 'Визначте одну справу, після якої ваш день справді відчувається вашим.',
 'Назвіть людину, з якою варто обговорити важливий вибір, і домовтеся про розмову.',
 'Приберіть з найближчого тижня одне зобов’язання, яке більше не служить вашій меті.']},
 2:{opening:'Гроші — це не тільки суми на рахунку. Це ще й свобода сказати «так» важливому та «ні» зайвому.',
 question:'Що дає вам відчуття фінансової опори?',
 scenario:'доводиться вибирати між негайним бажанням і спокійнішою перспективою',
 stakes:'Поспіх у витратах часто дорожчий за маленьку паузу',
 actions:['Запишіть одну фінансову мету та її перший невеликий крок без ризикових вкладень.',
 'Перегляньте три регулярні витрати й вирішіть, яку можна скоротити без втрати якості життя.',
 'Обговоріть очікування щодо спільних грошей до наступної великої покупки.',
 'Відкладіть рішення про необов’язкову покупку на добу та порівняйте її з пріоритетами.']},
 3:{opening:'Сміливість не завжди виглядає як великий стрибок. Іноді це вчасно сказане слово.',
 question:'Коли варто проявити ініціативу замість чекати дозволу?',
 scenario:'потрібно почати складну розмову або показати незавершену ідею',
 stakes:'Очікування ідеальної миті може забрати саму можливість',
 actions:['Напишіть перше речення розмови, яку давно відкладаєте.',
 'Приділіть двадцять хвилин навичці, якою хочете користуватися впевненіше.',
 'Попросіть одну конкретну думку про свою ідею замість загальної оцінки.',
 'Розбийте складний початок на дію, яку можна зробити сьогодні без підготовки.']},
 4:{opening:'Дім стає опорою не тоді, коли все ідеально, а коли там можна відновити власний ритм.',
 question:'Що допомагає вам відчувати спокій і належність?',
 scenario:'зовнішні справи займають більше місця, ніж внутрішній спокій',
 stakes:'Без місця для відновлення навіть хороші плани виснажують',
 actions:['Звільніть один куточок простору для справи, яка вас заспокоює.',
 'Домовтеся про одну побутову межу, яку всі можуть виконувати.',
 'Запитайте близьку людину, чого їй зараз бракує вдома, не перебиваючи відповідь.',
 'Виберіть одну повторювану домашню турботу й спростіть її до маленького ритуалу.']},
 7:{opening:'Турбота розкривається в дрібницях. Добрі наміри стають важливими, коли знаходять форму.',
 question:'Як дати своєму теплу та творчості реальне місце?',
 scenario:'ідея чи увага до близької людини губиться серед поточних справ',
 stakes:'Невисловлена підтримка не завжди відчувається як підтримка',
 actions:['Запропонуйте близькій людині конкретну допомогу без очікування відповіді.',
 'Виділіть двадцять хвилин на творчий задум без вимоги довести його до досконалості.',
 'Поговоріть про одну спільну радість, яку давно відкладали.',
 'Зменште кількість планів і доведіть до кінця один маленький творчий жест.']},
 9:{opening:'Близькість не вимагає вгадувати чужі думки. Вона виростає з розмов, у яких можна бути чесним.',
 question:'Як поєднати бажання бути поруч і право залишатися собою?',
 scenario:'потрібно узгодити різні потреби, не перетворюючи розмову на змагання',
 stakes:'Замовчування очікувань поступово створює відстань',
 actions:['Скажіть близькій людині одну важливу потребу без звинувачень.',
 'Запишіть, у чому ви готові поступитися, а де важлива межа.',
 'Запропонуйте спільний план і запитайте, що в ньому незручно іншій стороні.',
 'Знайдіть спокійний момент, щоб обговорити тему, яку зазвичай оминаєте.']},
 10:{opening:'Покликання рідко ховається в назві посади. Частіше воно проявляється в тому, яку задачу ви вмієте довести до результату.',
 question:'Який тип роботи дозволяє розкрити вашу корисність?',
 scenario:'потрібно вибрати між видимим статусом і справою, яка має зміст',
 stakes:'Постійна зайнятість і справжній результат — не одне й те саме',
 actions:['Оберіть робочу задачу, в якій можете взяти ініціативу, і завершіть її невеликий фрагмент.',
 'Запишіть один вимірюваний результат, якого прагнете до кінця тижня, і перший крок до нього.',
 'Запитайте колегу, яку конкретну робочу проблему ви допомагаєте вирішувати найкраще.',
 'Погляньте на непомітну частину своєї роботи: що можна спростити, передати або автоматизувати?']},
 12:{opening:'Сімейна історія дає нам мову близькості. Але вона не має писати всі наступні сторінки за нас.',
 question:'Які родинні звички хочеться зберегти, а які — переписати?',
 scenario:'давні очікування стикаються з вашим нинішнім вибором',
 stakes:'Звичка, яку ніхто не обговорює, легко стає обов’язком',
 actions:['Назвіть одну сімейну традицію, яку хочете передати далі свідомо.',
 'Запишіть одну побутову звичку, яка виснажує, і домовтеся про альтернативу.',
 'Поставте рідній людині запитання про її досвід, а не про те, як вам слід жити.',
 'Дозвольте собі змінити один успадкований сценарій без суперечки про минуле.']},
 16:{opening:'Комфорт — не винагорода після виснаження. Він допомагає жити й працювати в людському ритмі.',
 question:'Що справді відновлює сили, а не лише відволікає?',
 scenario:'приємні дрібниці займають час, але не додають енергії',
 stakes:'Відпочинок без відновлення залишає відчуття порожнечі',
 actions:['Оберіть одну просту річ, після якої вам легше зосереджуватися.',
 'Перегляньте розклад і захистіть короткий час без повідомлень і справ.',
 'Домовтеся про комфортну межу в побуті, яка не залежить від настрою.',
 'Замініть один звичний спосіб втечі від втоми на справжній відпочинок.']},
 20:{opening:'Внутрішня опора не обов’язково приходить у тиші. Вона з’являється, коли ви починаєте чути себе.',
 question:'Яка практика допомагає не губити напрям серед шуму?',
 scenario:'багато голосів радять різне, а свого рішення не чути',
 stakes:'Навіть корисна практика може перетворитися на ще один обов’язок',
 actions:['Побудьте п’ять хвилин наодинці з одним запитанням без потреби негайно відповісти.',
 'Оберіть коротку практику, яку реально виконувати тричі на тиждень.',
 'Поговоріть із людиною, чия присутність допомагає мислити ясніше.',
 'Спробуйте одну добу без зайвого інформаційного шуму й помітьте різницю.']},
 24:{opening:'Знання стає вашим, коли виходить зі сторінки й починає працювати в руках.',
 question:'Як навчатися так, щоб результат залишався з вами?',
 scenario:'ви збираєте матеріал, але не вистачає нагоди його застосувати',
 stakes:'Враження від прочитаного ще не дорівнює навичці',
 actions:['Перевірте одну нову ідею маленьким практичним завданням.',
 'Виділіть двадцять хвилин на повторення замість пошуку ще одного курсу.',
 'Поясніть вивчену тему іншій людині своїми словами.',
 'Закрийте зайві вкладки й завершіть один конспект або приклад до кінця.']},
 27:{opening:'Сила не завжди гучна. Часто вона проявляється в тому, що ви продовжуєте рухатися, коли легкий шлях закінчився.',
 question:'На який спосіб діяти ви можете спертися в складний момент?',
 scenario:'обставини вимагають витримки й ясного наступного кроку',
 stakes:'Спроба бути сильним у всьому одразу виснажує',
 actions:['Пригадайте одну складну ситуацію та назвіть дію, яка реально допомогла.',
 'Виберіть маленьке завдання, де можна потренувати стійкість без перевантаження.',
 'Попросіть конкретну підтримку до того, як відчуєте повне виснаження.',
 'Розділіть велику проблему на дві частини: що залежить від вас і що — ні.']},
 30:{opening:'Слабке місце — не вирок. Іноді це просто ділянка дороги, де варто йти уважніше.',
 question:'Який повторюваний збій можна попередити завчасно?',
 scenario:'відома складність повертається в новій обстановці',
 stakes:'Непомічена звичка керує рішеннями швидше, ніж нам здається',
 actions:['Назвіть один сигнал, після якого зазвичай починаються зайві труднощі.',
 'Підготуйте просте правило на випадок повторення складної ситуації.',
 'Запитайте довірену людину, який ваш звичний поспіх вона помічає.',
 'Приберіть одну умову, що систематично робить завдання важчим, ніж потрібно.']},
 40:{opening:'Не все успадковане потрібно нести далі. Частину звичок можна подякувати й залишити в минулому.',
 question:'Який родинний сценарій допомагає, а який вже став тісним?',
 scenario:'знайомі правила працюють у минулому, але заважають у сьогоденні',
 stakes:'Вірність родині не обов’язково означає повторення кожного її рішення',
 actions:['Назвіть родинну звичку, яка додає вам сил, і підтримайте її свідомо.',
 'Відокремте почуте в дитинстві правило від того, що справді працює зараз.',
 'Розпитайте рідних про походження важливої традиції, не шукаючи винних.',
 'Обирайте одну невелику зміну звичного сценарію й перевірте, як вона впливає на побут.']},
 45:{opening:'Цінності стають видимими не в красивих словах, а в момент, коли доводиться робити вибір.',
 question:'За який принцип ви готові відповідати власними діями?',
 scenario:'зручне рішення суперечить тому, що ви вважаєте правильним',
 stakes:'Великі принципи втрачають силу, коли їх неможливо застосувати в дрібницях',
 actions:['Запишіть один принцип і спосіб проявити його цього тижня.',
 'Перевірте одне своє рішення на відповідність обраній цінності.',
 'Обговоріть з близькою людиною важливу межу без спроб її переконати.',
 'Відмовтеся від одного зручного, але зайвого компромісу із собою.']}
};
const TOPICS_EN:Readonly<Record<number,Topic>>={
 1:{opening:'Direction rarely arrives as a single revelation. More often, it shows up in the choices you keep making.',
 question:'What is worth choosing deliberately rather than by habit?',
 scenario:'you must decide what deserves your energy and what can wait',
 stakes:'Not everything important needs to happen at once',
 actions:['Name one decision you have delayed and put it in a single sentence.',
 'Notice one activity that makes the day feel genuinely your own.',
 'Arrange a conversation with someone who can listen to your important choice.',
 'Remove one commitment from next week that no longer serves your priorities.']},
 2:{opening:'Money is more than a number. It can also mean the freedom to say yes to what matters and no to what does not.',
 question:'What would make your resources feel steadier?',
 scenario:'an immediate desire competes with a more secure long-term plan',
 stakes:'A short pause can be worth more than a rushed purchase',
 actions:['Choose one money goal and one low-risk step toward it.',
 'Review three repeating expenses and decide which one can be reduced.',
 'Discuss expectations about shared money before a major purchase.',
 'Wait a day before a nonessential purchase and compare it with your priorities.']},
 3:{opening:'Courage does not always look like a leap. Sometimes it is the first honest sentence.',
 question:'Where might a small initiative change more than a long delay?',
 scenario:'a difficult conversation or unfinished idea needs a beginning',
 stakes:'Waiting for the perfect moment may cost the opportunity',
 actions:['Write the first line of a conversation you have postponed.',
 'Practice one useful skill for twenty focused minutes.',
 'Ask for one specific response to an idea instead of a general rating.',
 'Find the smallest beginning you can make today without more preparation.']},
 4:{opening:'Home becomes a refuge not when everything is perfect, but when you can regain your own rhythm there.',
 question:'What gives you a sense of belonging and calm?',
 scenario:'other people’s demands crowd out the space you need to recover',
 stakes:'Without room to recover, even good plans become exhausting',
 actions:['Clear one small space for an activity that settles you.',
 'Agree on one household boundary everyone can actually follow.',
 'Ask someone close what would make home easier for them and listen fully.',
 'Simplify one repeating domestic responsibility.']},
 7:{opening:'Care lives in small acts. An intention becomes real when someone can feel it.',
 question:'How can your affection and creativity take a usable shape?',
 scenario:'attention to someone or a creative idea gets lost in daily errands',
 stakes:'Unspoken care is not always received as care',
 actions:['Offer a loved one a specific form of help without expecting a return.',
 'Give one creative idea twenty minutes without demanding perfection.',
 'Suggest a small shared joy you have both postponed.',
 'Choose one creative gesture to finish instead of starting another project.']},
 9:{opening:'Closeness does not require mind reading. It grows through conversations where both people can be honest.',
 question:'How do you stay close without losing your own boundaries?',
 scenario:'two sets of needs must fit together without becoming a contest',
 stakes:'Unspoken expectations slowly create distance',
 actions:['State one important need without accusing the other person.',
 'Decide where you can compromise and where a boundary matters.',
 'Propose a shared plan and ask what feels difficult about it.',
 'Choose a calm time to discuss a topic you usually avoid.']},
 10:{opening:'A calling rarely fits inside a job title. It shows up in the problems you can actually help solve.',
 question:'What kind of work lets your contribution become visible?',
 scenario:'visible status competes with work that feels meaningful',
 stakes:'Being constantly busy is not the same as producing useful results',
 actions:['Take initiative on one small work task and finish a visible part.',
 'Set one measurable result for the week and write the first step.',
 'Ask a colleague which specific problem you help solve best.',
 'Find one invisible task you could simplify, delegate or automate.']},
 12:{opening:'Family history gives us a language of closeness, but it need not write every chapter that follows.',
 question:'Which family patterns deserve to stay, and which can change?',
 scenario:'old expectations run into the life you are building now',
 stakes:'An unspoken habit can quietly become an obligation',
 actions:['Name one tradition you want to pass on by choice.',
 'Find a tiring household pattern and agree on a workable alternative.',
 'Ask a relative about their experience rather than their expectations of you.',
 'Change one inherited habit without turning the past into an argument.']},
 16:{opening:'Comfort is not a reward for exhaustion. It is part of living and working at a human pace.',
 question:'What genuinely restores you rather than merely distracting you?',
 scenario:'small pleasures fill the hours without returning your energy',
 stakes:'Rest without recovery can leave you empty',
 actions:['Choose one simple thing that helps you regain focus.',
 'Protect a short period without messages or other obligations.',
 'Agree on a practical household boundary that works on difficult days too.',
 'Replace one routine escape from fatigue with a real break.']},
 20:{opening:'Inner steadiness does not always come from silence. It begins when you can hear your own thoughts.',
 question:'What practice helps you keep direction amid noise?',
 scenario:'many voices offer advice and your own decision becomes harder to hear',
 stakes:'Even a useful ritual can become another burden',
 actions:['Spend five quiet minutes with one question and no need for an immediate answer.',
 'Choose a short practice you can sustain three times a week.',
 'Speak to someone whose presence helps you think clearly.',
 'Try one day with less unnecessary information and observe the difference.']},
 24:{opening:'Knowledge becomes yours when it leaves the page and starts working in your hands.',
 question:'How can learning turn into something you can actually use?',
 scenario:'you keep collecting material but rarely test what you know',
 stakes:'Reading something once is not the same as being able to do it',
 actions:['Test one new idea in a small hands-on task.',
 'Spend twenty minutes practicing instead of looking for another course.',
 'Explain what you learned to someone in your own words.',
 'Close the extra tabs and finish one example or set of notes.']},
 27:{opening:'Strength is not always loud. Often it is what keeps you moving after the easy route ends.',
 question:'What can you rely on when a situation becomes difficult?',
 scenario:'circumstances demand endurance and one clear next step',
 stakes:'Trying to be strong everywhere at once is exhausting',
 actions:['Recall a difficult moment and identify what actually helped.',
 'Practice persistence on one modest task rather than overloading yourself.',
 'Ask for specific support before you are already depleted.',
 'Divide a large problem into what you can and cannot influence.']},
 30:{opening:'A blind spot is not a sentence. Sometimes it is simply a turn in the road that asks for more care.',
 question:'Which repeating difficulty could you prepare for sooner?',
 scenario:'an old difficulty returns in a different setting',
 stakes:'Unnoticed patterns often steer choices faster than we realise',
 actions:['Name the first sign that a familiar difficulty is returning.',
 'Make a short response plan for the next time a hard situation repeats.',
 'Ask someone trustworthy which kind of haste they notice in you.',
 'Remove one condition that repeatedly makes a task harder than it needs to be.']},
 40:{opening:'Not everything inherited needs to be carried forward. Some habits can be thanked and left behind.',
 question:'Which family script still helps, and which feels too narrow?',
 scenario:'familiar rules from the past do not fit the present',
 stakes:'Loyalty to family need not mean repeating every decision',
 actions:['Choose one family habit that strengthens you and keep it intentionally.',
 'Separate a childhood rule from what truly works today.',
 'Ask family members where a tradition came from without looking for blame.',
 'Try a small change to one inherited routine and notice the effects.']},
 45:{opening:'Values become visible not in beautiful words, but when a choice asks something of us.',
 question:'Which principle would you stand by in a difficult moment?',
 scenario:'the convenient answer does not match what you believe is right',
 stakes:'Big principles become weak when they never reach daily decisions',
 actions:['Write down one principle and how to act on it this week.',
 'Compare one real decision with a value you care about.',
 'Discuss an important boundary without trying to win the conversation.',
 'Decline one easy compromise that would take you away from your priorities.']}
};
const PLANETS_UK:Readonly<Record<string,{gift:string;trap:string}>>={
 Sun:{gift:'готовність брати відповідальність і називати власну позицію',trap:'намагатися все вирішити самостійно'},
 Moon:{gift:'чуйність до потреб і настроїв людей',trap:'підлаштовуватися під чужий стан ціною власного спокою'},
 Mars:{gift:'рішучість розпочинати складне й доводити дію до результату',trap:'поспішати там, де потрібна розмова'},
 Mercury:{gift:'уміння ставити точні запитання й знаходити зв’язки між фактами',trap:'роздумувати без кінця замість перевірити ідею'},
 Jupiter:{gift:'прагнення бачити ширший сенс і ділитися знаннями',trap:'покладатися на красиву ідею без практичної перевірки'},
 Venus:{gift:'відчуття міри, краси та вміння знаходити спільну мову',trap:'уникати незручної розмови заради зовнішньої гармонії'},
 Saturn:{gift:'терпіння, системність і здатність працювати на довгу дистанцію',trap:'перетворити обов’язок на нескінченне навантаження'}
};
const PLANETS_EN:Readonly<Record<string,{gift:string;trap:string}>>={
 Sun:{gift:'taking visible responsibility and naming your own position',trap:'trying to decide everything alone'},
 Moon:{gift:'noticing the needs and moods of others',trap:'absorbing other people’s feelings at the expense of your own balance'},
 Mars:{gift:'starting difficult things and turning effort into results',trap:'rushing where a conversation is needed'},
 Mercury:{gift:'asking precise questions and linking ideas together',trap:'thinking endlessly rather than testing an idea'},
 Jupiter:{gift:'seeing the larger meaning and sharing knowledge',trap:'trusting an elegant theory before trying it'},
 Venus:{gift:'finding proportion, beauty and common ground',trap:'avoiding an uncomfortable truth to keep the peace'},
 Saturn:{gift:'patience, structure and staying with the work',trap:'turning responsibility into constant strain'}
};
const FOCUS_UK=[
 'вашій власній ініціативі','матеріальних ресурсах і домовленостях',
 'розмовах і щоденних навичках','питаннях дому й внутрішнього спокою',
 'навчанні, дітях і творчих ідеях','повсякденній праці та способі долати труднощі',
 'співпраці та близьких стосунках','змінах і спільних зобов’язаннях',
 'пошуку знань і наставників','відповідальності за видимий результат',
 'друзях, спільнотах і підтримці','тихій роботі, витратах сил і відновленні'
] as const;
const FOCUS_EN=[
 'your initiative','material resources and agreements','conversation and practical skills',
 'home and inner stability','learning, care and creative projects','everyday effort and challenges',
 'partnership and close relationships','change and shared responsibilities','knowledge and mentors',
 'responsibility for visible results','friends, communities and support','quiet work, energy costs and recovery'
] as const;
const capture=(proof:readonly string[],regex:RegExp)=>proof.map(s=>regex.exec(s)).find(Boolean);
const house=(n:number)=>Number.isInteger(n)&&n>=1&&n<=12;
const group=(n:number)=> (n-1)%4;
function readableFacts(input:EditorialInput){
 const d=input.division;
 const lord=capture(input.proof,/^D1\.house-lord\.\d+=(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)$/)?.[1];
 if(!lord)return null;
 const natal=Number(capture(input.proof,new RegExp('^D1\\.'+lord+'\\.house=(\\d+)$'))?.[1]);
 const focused=Number(capture(input.proof,new RegExp('^D'+d+'\\.'+lord+'\\.house=(\\d+)$'))?.[1]);
 const second=input.proof.map(p=>new RegExp('^D'+d+'\\.(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)\\.house=(\\d+)$').exec(p))
  .find(m=>m&&m[1]!==lord);
 if(!house(natal)||!house(focused))return null;
 const secondary=second?.[1]||lord;
 return {lord,natal,focused,secondary,secondaryHouse:Number(second?.[2])||focused};
}
const tidy=(s:string)=>s.trim().replace(/\s+/g,' ');
export function renderN45Narrative(input:EditorialInput,lang:ReaderLanguage):EditorialNarrative{
 const uk=lang==='uk';
 const topic=(uk?TOPICS_UK:TOPICS_EN)[input.division];
 const facts=readableFacts(input);
 if(!topic||!facts)throw new Error('N45_READER_EDITORIAL_EVIDENCE_MISSING_D'+input.division);
 const main=(uk?PLANETS_UK:PLANETS_EN)[facts.lord];
 const second=(uk?PLANETS_UK:PLANETS_EN)[facts.secondary];
 const focus=(uk?FOCUS_UK:FOCUS_EN)[facts.focused-1];
 const startFocus=(uk?FOCUS_UK:FOCUS_EN)[facts.natal-1];
 const tension=(uk?FOCUS_UK:FOCUS_EN)[facts.secondaryHouse-1];
 const same=facts.natal===facts.focused;
 const close=facts.focused===facts.secondaryHouse;
 const action=topic.actions[group(facts.focused)];
 const headline=topic.opening;
 const strength=uk?
  tidy('За цією картою важливий ракурс теми відкривається у '+focus+'. '+
    'Одна з можливих опор — '+main.gift+'. '+
    'Її цінність не в самій ідеї, а в тому, що ви можете з нею зробити.'):
  tidy('Your chart brings attention to '+focus+'. '+
    'One possible strength here is '+main.gift+'. '+
    'Its value lies less in the label than in what you choose to do with it.');
 const challenge=uk?
  tidy((close?'Обидва ключові акценти сходяться в одній сфері. ':
   'Інший штрих цієї історії помітний у '+tension+'. ')+
   'Тут легко потрапити у пастку: '+second.trap+'. '+
   'Коли це починається, поверніться до одного конкретного питання: '+topic.question+'):
  tidy((close?'Both important factors touch the same area. ':
   'Another factor brings in '+tension+'. ')+
   'A trap to watch for is '+second.trap+'. '+
   'When that happens, return to one practical question: '+topic.question+');
 const context=uk?
  tidy('Ця тема стає особливо відчутною, коли '+topic.scenario+'. '+
   (same?'Загальний і детальний погляди ведуть до схожого запитання. ':
    'Загальна карта додає ще один ракурс у '+startFocus+' — тож рішення варто бачити з двох боків. ')+
   (input.contrast?'Можливий контраст: мати ресурс і не завжди знати, де його застосувати. ':
    input.complement?'Те, що складне в одному контексті, може виявитися корисним за інших умов. ':'')+
   topic.stakes+'.'):
  tidy('This becomes relevant when '+topic.scenario+'. '+
   (same?'The broad and focused charts point to a similar question. ':
    'The main chart also stresses '+startFocus+', adding another side to the choice. ')+
   (input.contrast?'There may be a gap between having an ability and finding where to use it. ':
    input.complement?'What feels difficult in one setting may be useful in another. ':'')+
   topic.stakes+'.');
 const step=action;
 const highlight=uk?
  tidy('Сюжет цієї теми проявляється у '+focus+'. '+topic.question+' '+action):
  tidy('A useful theme to explore is '+focus+'. '+topic.question+' '+action);
 return {headline,strength,challenge,context,step,highlight,voice:'curated_source_bound'};
}
