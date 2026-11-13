/** Reader 10 rule texts (original, bilingual). Each entry states what the classical
 * Parashari rule says about a concrete placement, in direct language.
 * Boundaries: no claims about death, illness, fertility or guaranteed events. */
import type {Planet} from './reader10-facts.ts';
export type R10Locale='uk'|'en';
type T={uk:string;en:string};
const t=(uk:string,en:string):T=>({uk,en});

export const SIGN_NAME:readonly T[]=[t('Овен','Aries'),t('Телець','Taurus'),t('Близнюки','Gemini'),t('Рак','Cancer'),t('Лев','Leo'),
 t('Діва','Virgo'),t('Терези','Libra'),t('Скорпіон','Scorpio'),t('Стрілець','Sagittarius'),t('Козоріг','Capricorn'),
 t('Водолій','Aquarius'),t('Риби','Pisces')];
/** Ukrainian locative ("у Діві"); English uses the plain name. */
export const SIGN_IN:readonly T[]=[t('в Овні','in Aries'),t('у Тельці','in Taurus'),t('у Близнюках','in Gemini'),t('у Раку','in Cancer'),
 t('у Леві','in Leo'),t('у Діві','in Virgo'),t('у Терезах','in Libra'),t('у Скорпіоні','in Scorpio'),t('у Стрільці','in Sagittarius'),
 t('у Козорозі','in Capricorn'),t('у Водолії','in Aquarius'),t('у Рибах','in Pisces')];
export const PLANET_NAME:Record<Planet,T>={Sun:t('Сонце','Sun'),Moon:t('Місяць','Moon'),Mars:t('Марс','Mars'),
 Mercury:t('Меркурій','Mercury'),Jupiter:t('Юпітер','Jupiter'),Venus:t('Венера','Venus'),Saturn:t('Сатурн','Saturn'),
 Rahu:t('Раху','Rahu'),Ketu:t('Кету','Ketu')};
export const NAKSHATRA_NAME:readonly T[]=[t('Ашвіні','Ashwini'),t('Бхарані','Bharani'),t('Кріттіка','Krittika'),t('Рохіні','Rohini'),
 t('Мрігашіра','Mrigashira'),t('Ардра','Ardra'),t('Пунарвасу','Punarvasu'),t('Пуш’я','Pushya'),t('Ашлеша','Ashlesha'),
 t('Магха','Magha'),t('Пурва Пхалгуні','Purva Phalguni'),t('Уттара Пхалгуні','Uttara Phalguni'),t('Хаста','Hasta'),
 t('Чітра','Chitra'),t('Сваті','Swati'),t('Вішакха','Vishakha'),t('Анурадха','Anuradha'),t('Дж’єштха','Jyeshtha'),
 t('Мула','Mula'),t('Пурва Ашадха','Purva Ashadha'),t('Уттара Ашадха','Uttara Ashadha'),t('Шравана','Shravana'),
 t('Дханіштха','Dhanishta'),t('Шатабхіша','Shatabhisha'),t('Пурва Бхадрапада','Purva Bhadrapada'),
 t('Уттара Бхадрапада','Uttara Bhadrapada'),t('Реваті','Revati')];

/** Rising sign: temperament. `short` completes "Коротко: ви … / In short: you are …". */
export const LAGNA:readonly {text:T;short:T}[]=[
 {text:t('Овен на сході робить вас людиною дії: ви спершу починаєте, а вже потім обдумуєте. Вам потрібні виклик і власна територія; чекати й підкорятися ви не вмієте.',
   'Aries rising makes you a person of action: you start first and think it through afterwards. You need a challenge and territory of your own; waiting and obeying are not your skills.'),
  short:t('рішучі й нетерплячі','decisive and impatient')},
 {text:t('Телець на сході дає витривалість і любов до надійного: ви повільно розганяєтесь, зате доводите справу до кінця. Вам важливі достаток, смак і спокій, і різких змін ви не любите.',
   'Taurus rising gives endurance and a love of what is solid: you are slow to start but you finish. Comfort, taste and calm matter to you, and you dislike abrupt change.'),
  short:t('витривалі й ґрунтовні','enduring and thorough')},
 {text:t('Близнюки на сході дають швидкий розум і потребу в обміні: ви вчитеся на льоту й нудьгуєте без нових людей і новин. Говорити й домовлятися вам легко, довго тримати одну лінію важче.',
   'Gemini rising gives a quick mind and a need for exchange: you learn on the fly and grow bored without new people and news. Talking and negotiating come easily; holding one line for long is harder.'),
  short:t('швидкі розумом і товариські','quick-minded and sociable')},
 {text:t('Рак на сході робить людину чутливою до настрою інших і прив’язаною до свого кола: ви спершу захищаєте своїх, а вже потім думаєте про себе. Настрій у вас мінливий, як Місяць, зате пам’ять на добро і на кривду довга.',
   'Cancer rising makes a person sensitive to the mood of others and attached to their own circle: you protect your people first and think of yourself afterwards. Your mood changes like the Moon, but your memory for kindness and for injury is long.'),
  short:t('чутливі й віддані своїм','sensitive and loyal to your own')},
 {text:t('Лев на сході дає гідність і потребу бути помітним: ви природно стаєте в центр і берете відповідальність. Вам важливі повага й щедрий жест, а приниження ви не забуваєте.',
   'Leo rising gives dignity and a need to be seen: you step into the centre naturally and take responsibility. Respect and a generous gesture matter to you, and you do not forget a humiliation.'),
  short:t('горді й щедрі','proud and generous')},
 {text:t('Діва на сході дає точний розум і увагу до дрібниць: ви бачите, що не працює, і знаєте, як це полагодити. До себе ви вимогливіші, ніж до інших, і спокійні лише тоді, коли все на місці.',
   'Virgo rising gives a precise mind and an eye for detail: you see what does not work and know how to fix it. You demand more of yourself than of others and are calm only when everything is in its place.'),
  short:t('точні й вимогливі до себе','precise and demanding of yourself')},
 {text:t('Терези на сході дають такт і відчуття міри: ви шукаєте рівновагу, вмієте домовлятися й погано переносите грубість. Рішення ви зважуєте довго, зате люди поруч із вами почуваються почутими.',
   'Libra rising gives tact and a sense of measure: you look for balance, know how to reach agreement and cannot stand rudeness. You weigh decisions for a long time, but people feel heard around you.'),
  short:t('тактовні й справедливі','tactful and fair')},
 {text:t('Скорпіон на сході дає глибину й витримку: ви бачите приховане, мовчите про головне й ідете до кінця. Довіряєте ви небагатьом, зате віддано, а зраду пам’ятаєте.',
   'Scorpio rising gives depth and stamina: you see what is hidden, keep silent about what matters most and go all the way. You trust few, but loyally, and you remember betrayal.'),
  short:t('глибокі й потайні','deep and private')},
 {text:t('Стрілець на сході дає широту й віру у власний шлях: вам потрібні сенс, простір і чесна розмова. Ви говорите прямо, вчитеся все життя й погано терпите дріб’язковість.',
   'Sagittarius rising gives breadth and faith in your own road: you need meaning, space and honest conversation. You speak plainly, keep learning all your life and have little patience for pettiness.'),
  short:t('прямі й волелюбні','direct and freedom-loving')},
 {text:t('Козоріг на сході дає терпіння й практичний розум: ви рано дорослішаєте, плануєте надовго й піднімаєтеся крок за кроком. Зовні ви стримані, а визнання приходить до вас із віком.',
   'Capricorn rising gives patience and a practical mind: you grow up early, plan far ahead and climb one step at a time. You are reserved on the outside, and recognition comes to you with age.'),
  short:t('терплячі й практичні','patient and practical')},
 {text:t('Водолій на сході дає незалежний розум і власний погляд на все: ви думаєте про загальне благо й не йдете за натовпом. З людьми ви приязні, але близько підпускаєте небагатьох.',
   'Aquarius rising gives an independent mind and a view of your own on everything: you think about the common good and do not follow the crowd. You are friendly with people but let few come close.'),
  short:t('незалежні й небайдужі до спільної справи','independent and committed to a shared cause')},
 {text:t('Риби на сході дають уяву й співчуття: ви відчуваєте більше, ніж можете пояснити, і легко входите в чужий стан. Вам потрібні тиша й віра, бо жорсткі рамки вас виснажують.',
   'Pisces rising gives imagination and compassion: you feel more than you can explain and slip easily into another person’s state. You need quiet and faith, because rigid frames drain you.'),
  short:t('вразливі й співчутливі','impressionable and compassionate')}
];

/** Lagna lord by house: `focus` names the life theme, `short` completes "ви …/you …". */
export const LAGNA_LORD_HOUSE:readonly {focus:T;text:T;short:T}[]=[
 {focus:t('ваша власна особистість і самостійний шлях','your own personality and an independent road'),
  text:t('Перший дім — це ви самі. Управитель лагни у власному домі дає міцний внутрішній стрижень і звичку покладатися на себе: ви самі будуєте своє життя й рідко живете чужим розумом.',
   'The first house is you yourself. The lagna lord in its own house gives a firm inner core and the habit of relying on yourself: you build your life with your own hands and rarely live by someone else’s mind.'),
  short:t('покладаєтеся передусім на себе','rely above all on yourself')},
 {focus:t('родина, достаток і слово','family, wealth and speech'),
  text:t('Другий дім — дім родини, заробленого й мови. Ваше життя обертається навколо сім’ї та власних ресурсів: ви вмієте заробляти й накопичувати, а ваше слово має вагу.',
   'The second house is the house of family, earnings and speech. Your life turns around family and your own resources: you know how to earn and to save, and your word carries weight.'),
  short:t('будуєте життя навколо родини й достатку','build your life around family and means')},
 {focus:t('власні зусилля, сміливість і слово','your own effort, courage and voice'),
  text:t('Третій дім — дім власних зусиль, сміливості й слова, тож ваше життя будується на тому, що ви зробили самі, а не на спадку чи везінні. Класичні тексти називають таку людину відважною. Третій дім росте з віком: те, що у двадцять п’ять дається важко, після сорока стає вашою силою.',
   'The third house is the house of personal effort, courage and voice, so your life is built on what you did yourself rather than on inheritance or luck. Classical texts call such a person brave. The third house grows with age: what is hard at twenty-five becomes your strength after forty.'),
  short:t('усього досягаєте власною працею','achieve everything by your own work')},
 {focus:t('дім, корені й душевний спокій','home, roots and peace of mind'),
  text:t('Четвертий дім — дім матері, житла й душевного спокою. Вам потрібна власна земля під ногами: дім, родина й освіта дають вам опору, і найкращі рішення ви ухвалюєте, коли вдома лад.',
   'The fourth house is the house of mother, home and peace of mind. You need ground of your own under your feet: home, family and education hold you up, and you decide best when things are in order at home.'),
  short:t('черпаєте силу з дому й коріння','draw strength from home and roots')},
 {focus:t('розум, творчість і діти','intellect, creativity and children'),
  text:t('П’ятий дім — дім розуму, творчості й дітей, одне з найкращих положень для управителя лагни. Ви мислите самостійно, вмієте вчити й створювати, а те, що ви породжуєте — ідеї, проєкти, учні, — стає головною справою життя.',
   'The fifth house is the house of intellect, creativity and children, one of the best placements for the lagna lord. You think for yourself, know how to teach and create, and what you bring into being — ideas, projects, students — becomes your life’s main work.'),
  short:t('живете розумом і творчістю','live by intellect and creativity')},
 {focus:t('праця, служіння й подолання перешкод','work, service and overcoming obstacles'),
  text:t('Шостий дім — дім праці, суперництва й боргів. Ваше життя минає в подоланні: ви сильні там, де треба змагатися, наводити лад і служити. Легких шляхів карта вам не обіцяє, зате з кожної боротьби ви виходите міцнішими.',
   'The sixth house is the house of work, rivalry and debts. Your life is spent overcoming: you are strong where one has to compete, put things in order and serve. The chart promises no easy roads, but you come out of every struggle stronger.'),
  short:t('гартуєтесь у праці й боротьбі','are tempered by work and struggle')},
 {focus:t('партнерство й люди навпроти','partnership and the people facing you'),
  text:t('Сьомий дім — дім шлюбу, партнерів і публіки. Ви розкриваєтесь через іншого: у парі, в угоді, у роботі з людьми. Удвох ви сильніші, ніж поодинці, і вибір партнера важить для вашої долі більше, ніж для більшості людей.',
   'The seventh house is the house of marriage, partners and the public. You unfold through another person: in a couple, in a deal, in work with people. You are stronger in two than alone, and your choice of partner weighs more in your life than it does for most.'),
  short:t('розкриваєтесь через партнера','unfold through a partner')},
 {focus:t('глибокі зміни, таємне й спільні ресурси','deep change, the hidden and shared resources'),
  text:t('Восьмий дім — дім криз, таємниць і спільних грошей. Ваше життя йде через різкі повороти, і кожен із них змінює вас докорінно. Ви бачите приховане, не боїтеся складних тем і сильні в дослідженні, психології та роботі з чужими ресурсами.',
   'The eighth house is the house of crises, secrets and shared money. Your life moves through sharp turns, and each one changes you at the root. You see what is hidden, are not afraid of difficult subjects and are strong in research, psychology and work with other people’s resources.'),
  short:t('проходите крізь глибокі зміни','pass through deep change')},
 {focus:t('удача, вчителі й сенс','fortune, teachers and meaning'),
  text:t('Дев’ятий дім — дім удачі, вчителя й дхарми, найсприятливіший у карті. Вам щастить на наставників і добрий збіг обставин; шлях відкривається через знання, подорожі й віру. Ви живете за принципами і з роками самі стаєте тим, до кого йдуть по пораду.',
   'The ninth house is the house of fortune, the teacher and dharma, the most favourable in a chart. You are lucky with mentors and with timing; your road opens through knowledge, travel and faith. You live by principle and in time become the one others come to for advice.'),
  short:t('йдете за вчителями й сенсом','follow teachers and meaning')},
 {focus:t('справа життя й становище','your life’s work and standing'),
  text:t('Десятий дім — дім професії та становища. Ви людина справи: вас знають за тим, що ви зробили, і робота важить для вас більше, ніж затишок. Це положення дає ім’я й вплив, коли ви берете на себе відповідальність.',
   'The tenth house is the house of profession and standing. You are a person of deeds: people know you by what you have done, and work weighs more for you than comfort. This placement gives a name and influence when you take responsibility.'),
  short:t('живете справою','live for your work')},
 {focus:t('прибуток, друзі й здійснення бажань','gains, friends and fulfilled wishes'),
  text:t('Одинадцятий дім — дім прибутку, друзів і здійснених бажань. Ви вмієте отримувати результат і збирати навколо себе потрібних людей; зв’язки — ваш головний капітал. Одинадцятий дім росте з віком: друга половина життя щедріша за першу.',
   'The eleventh house is the house of gains, friends and fulfilled wishes. You know how to get results and gather the right people around you; connections are your main capital. The eleventh house grows with age: the second half of life is more generous than the first.'),
  short:t('досягаєте бажаного через людей','reach what you want through people')},
 {focus:t('усамітнення, далекі краї й внутрішнє життя','solitude, distant lands and the inner life'),
  text:t('Дванадцятий дім — дім усамітнення, чужини й відпускання. Ваш шлях веде подалі від місця народження або всередину: до духовної практики, роботи за лаштунками, служіння без оплесків. Ви віддаєте більше, ніж берете, і сили відновлюєте на самоті.',
   'The twelfth house is the house of solitude, foreign lands and letting go. Your road leads away from the place of birth or inward: to spiritual practice, work behind the scenes, service without applause. You give more than you take and recover your strength alone.'),
  short:t('шукаєте свого далеко від дому або всередині себе','seek your own far from home or within')}
];

export const MOON_SIGN:readonly T[]=[
 t('Місяць в Овні дає гарячі, швидкі почуття: ви спалахуєте й так само швидко відходите. Вам потрібна дія, і довго тримати в собі ви не вмієте.',
  'The Moon in Aries gives hot, fast feelings: you flare up and cool down just as quickly. You need action and cannot hold things in for long.'),
 t('Місяць у Тельці стоїть у знаку екзальтації: це рівний, теплий і стійкий розум. Вам потрібні затишок, добра їжа й надійні люди, і вивести вас із рівноваги важко.',
  'The Moon in Taurus is exalted: an even, warm and steady mind. You need comfort, good food and dependable people, and it is hard to throw you off balance.'),
 t('Місяць у Близнюках дає рухливий, цікавий до всього розум. Ви думаєте словами, заспокоюєтесь у розмові й нудьгуєте від одноманітності.',
  'The Moon in Gemini gives a mobile mind curious about everything. You think in words, calm down in conversation and grow bored with sameness.'),
 t('Місяць у Раку стоїть у власному знаку: почуття глибокі, пам’ять довга, прив’язаність до дому сильна. Ви дбаєте про інших так само природно, як дихаєте.',
  'The Moon in Cancer is in its own sign: feelings run deep, memory is long, attachment to home is strong. You care for others as naturally as you breathe.'),
 t('Місяць у Леві дає горде й щедре серце. Вам треба, щоб вас помічали й цінували; у відповідь ви грієте всіх навколо.',
  'The Moon in Leo gives a proud and generous heart. You need to be noticed and valued; in return you warm everyone around you.'),
 t('Місяць у Діві дає розум, який усе розкладає по поличках. Ви помічаєте помилку раніше за інших і погано переносите безлад.',
  'The Moon in Virgo gives a mind that sorts everything onto shelves. You notice the mistake before others do and cannot stand disorder.'),
 t('Місяць у Терезах дає потребу в гармонії й товаристві. Ви тонко відчуваєте настрій співрозмовника й уникаєте сварок, навіть коли варто було б сперечатися.',
  'The Moon in Libra gives a need for harmony and company. You read the other person’s mood finely and avoid quarrels even when arguing would be right.'),
 t('Місяць у Скорпіоні стоїть у знаку падіння: почуття сильні, приховані й безкомпромісні. Ви переживаєте все глибше, ніж показуєте, і нікому не довіряєте наполовину.',
  'The Moon in Scorpio is debilitated: feelings are strong, hidden and uncompromising. You live everything more deeply than you show and trust no one halfway.'),
 t('Місяць у Стрільці дає оптимізм і потребу в сенсі. Вам легшає в дорозі, у навчанні й у чесній розмові про головне.',
  'The Moon in Sagittarius gives optimism and a need for meaning. You feel better on the road, in study and in an honest talk about what matters.'),
 t('Місяць у Козорозі дає стримані, дисципліновані почуття. Ви рано навчилися покладатися на себе й спокійні тоді, коли є план і справа.',
  'The Moon in Capricorn gives restrained, disciplined feelings. You learned early to rely on yourself and are calm when there is a plan and a task.'),
 t('Місяць у Водолії дає розум спостерігача: ви дивитеся на почуття трохи збоку. Свобода й коло однодумців потрібні вам більше, ніж тісна близькість.',
  'The Moon in Aquarius gives an observer’s mind: you look at feelings slightly from the side. You need freedom and a circle of like-minded people more than close intimacy.'),
 t('Місяць у Рибах дає м’яке, вразливе й співчутливе серце. Ви вбираєте чужий настрій, тому вам потрібен час наодинці, музика чи молитва.',
  'The Moon in Pisces gives a soft, impressionable and compassionate heart. You absorb other people’s moods, so you need time alone, music or prayer.')
];

/** Completes "Накшатра X додає … / The nakshatra X adds …". */
export const MOON_NAKSHATRA:readonly T[]=[
 t('швидкість і потребу починати першими','speed and a need to be the first to begin'),
 t('силу витримувати важке й чесність перед собою','the strength to carry what is heavy and honesty with yourself'),
 t('прямоту й гострий язик: ви відсікаєте зайве','directness and a sharp tongue: you cut away what is superfluous'),
 t('привабливість, смак і вміння створювати красу навколо','attractiveness, taste and a gift for making beauty around you'),
 t('допитливість і вічний пошук нового','curiosity and an endless search for the new'),
 t('гострий розум і бурі в почуттях, після яких ви бачите ясніше','a keen mind and storms of feeling after which you see more clearly'),
 t('здатність щоразу підводитися й починати знову','the ability to rise and begin again every time'),
 t('надійність: ви годуєте й підтримуєте інших','dependability: you feed and support others'),
 t('проникливість і вміння бачити чужі мотиви','insight and an eye for other people’s motives'),
 t('гордість роду й потребу в повазі','pride of lineage and a need for respect'),
 t('любов до радощів життя, товариства й творчості','a love of life’s pleasures, company and creativity'),
 t('вірність слову й бажання бути корисними','loyalty to your word and a wish to be useful'),
 t('вправні руки: вам треба щось робити руками або словом, інакше з’являється неспокій','skilled hands: you need to make something with your hands or words, or restlessness sets in'),
 t('відчуття форми й бажання створити щось красиве','a sense of form and a wish to make something beautiful'),
 t('незалежність: ви гнетеся, але не ламаєтесь, і тиску не терпите','independence: you bend but do not break, and you do not tolerate pressure'),
 t('цілеспрямованість: ви обираєте мету й довго до неї йдете','single-mindedness: you choose a goal and walk toward it for a long time'),
 t('відданість друзям і вміння об’єднувати людей','devotion to friends and a gift for bringing people together'),
 t('звичку бути за старшого: ви рано берете відповідальність за інших','the habit of being the elder: you take responsibility for others early'),
 t('потребу докопатися до кореня й почати з нуля, якщо треба','a need to dig to the root and start from nothing if need be'),
 t('упевненість у своїй правоті й дар переконувати','confidence in being right and a gift for persuasion'),
 t('витримку й принциповість: ви перемагаєте чесно й надовго','composure and principle: you win honestly and for long'),
 t('уміння слухати й учитися','the ability to listen and to learn'),
 t('відчуття ритму, щедрість і хист до спільної справи','a sense of rhythm, generosity and a talent for shared work'),
 t('потребу у власному просторі й нестандартний розум','a need for space of your own and an unconventional mind'),
 t('палкість переконань: ви живете ідеєю','passionate conviction: you live by an idea'),
 t('спокій, глибину й терпіння','calm, depth and patience'),
 t('лагідність і турботу про слабших','gentleness and care for the weaker')
];

export const WITH_MOON:Record<Exclude<Planet,'Moon'>,T>={
 Sun:t('Сонце стоїть поруч із Місяцем: ви народилися близько нового Місяця. Почуття ховаються за волею, і власні потреби ви помічаєте в останню чергу.',
  'The Sun stands with the Moon: you were born near the new Moon. Feelings hide behind will, and you notice your own needs last.'),
 Mars:t('Марс стоїть поруч із Місяцем (Чандра-Мангала йога): це запал, підприємливість і вміння заробляти власною енергією. Настрій у вас гарячий.',
  'Mars stands with the Moon (Chandra-Mangala yoga): drive, enterprise and the ability to earn by your own energy. Your temper runs hot.'),
 Mercury:t('Меркурій стоїть поруч із Місяцем і дає жвавий, говіркий, дотепний розум.',
  'Mercury stands with the Moon and gives a lively, talkative, witty mind.'),
 Jupiter:t('Юпітер стоїть поруч із Місяцем (Гаджа-Кесарі йога): це розсудливість, добре ім’я й повага людей.',
  'Jupiter stands with the Moon (Gaja-Kesari yoga): good judgement, a good name and people’s respect.'),
 Venus:t('Венера стоїть поруч із Місяцем і дає чарівність, смак і любов до комфорту.',
  'Venus stands with the Moon and gives charm, taste and a love of comfort.'),
 Saturn:t('Сатурн стоїть поруч із Місяцем і дає серйозність не за віком: ви рано подорослішали й звикли тримати почуття при собі.',
  'Saturn stands with the Moon and gives a seriousness beyond your years: you grew up early and are used to keeping feelings to yourself.'),
 Rahu:t('Раху стоїть поруч із Місяцем і дає неспокійний, ненаситний розум: вам завжди хочеться більшого, і тривога приходить без причини.',
  'Rahu stands with the Moon and gives a restless, insatiable mind: you always want more, and anxiety arrives without a reason.'),
 Ketu:t('Кету стоїть поруч із Місяцем і дає відстороненість та сильну інтуїцію: ви відчуваєте більше, ніж хочете пояснювати.',
  'Ketu stands with the Moon and gives detachment and strong intuition: you sense more than you care to explain.')
};
export const ASPECT_ON_MOON:Partial<Record<Planet,T>>={
 Sun:t('Сонце стоїть навпроти Місяця: ви народилися близько повні. Почуття яскраві й помітні всім.',
  'The Sun stands opposite the Moon: you were born near the full Moon. Your feelings are vivid and visible to everyone.'),
 Mars:t('Марс дивиться на Місяць і додає запальності й сміливості: ви швидко реагуєте, гостро відчуваєте несправедливість і можете сказати різко.',
  'Mars aspects the Moon and adds heat and courage: you react fast, feel injustice sharply and can speak harshly.'),
 Mercury:t('Меркурій дивиться на Місяць і додає розуму жвавості й дотепності.',
  'Mercury aspects the Moon and adds liveliness and wit to the mind.'),
 Jupiter:t('Юпітер дивиться на Місяць: це розсудливість, великодушність і вміння робити висновки з досвіду.',
  'Jupiter aspects the Moon: good judgement, generosity and the ability to learn from experience.'),
 Venus:t('Венера дивиться на Місяць і додає чарівності та любові до приємного.',
  'Venus aspects the Moon and adds charm and a love of what is pleasant.'),
 Saturn:t('Сатурн дивиться на Місяць і робить вас стриманими в почуттях: ви рідко показуєте, що вас зачепило, і довго носите образу в собі.',
  'Saturn aspects the Moon and makes you reserved in feeling: you rarely show what hurt you and carry a grievance for a long time.')
};
export const IN_LAGNA:Record<Planet,T>={
 Sun:t('Сонце в першому домі дає владну вдачу й потребу керувати.','The Sun in the first house gives a commanding nature and a need to lead.'),
 Moon:t('Місяць у першому домі робить вас чутливими й мінливими; люди до вас тягнуться.','The Moon in the first house makes you sensitive and changeable; people are drawn to you.'),
 Mars:t('Марс у першому домі дає напористість, силу й гарячу вдачу.','Mars in the first house gives drive, strength and a hot temper.'),
 Mercury:t('Меркурій у першому домі дає дотепність, моложавість і розум учителя чи торговця.','Mercury in the first house gives wit, a youthful air and the mind of a teacher or trader.'),
 Jupiter:t('Юпітер у першому домі — один із найкращих захистів карти: розсудливість, оптимізм, повага людей.','Jupiter in the first house is one of the best protections a chart can have: judgement, optimism, people’s respect.'),
 Venus:t('Венера в першому домі дає привабливість, смак і легку вдачу.','Venus in the first house gives attractiveness, taste and an easy manner.'),
 Saturn:t('Сатурн у першому домі дає серйозність, витривалість і пізній, але міцний успіх.','Saturn in the first house gives seriousness, endurance and late but solid success.'),
 Rahu:t('Раху в першому домі дає нестандартність і сильне бажання вирізнитися.','Rahu in the first house gives unconventionality and a strong wish to stand out.'),
 Ketu:t('Кету в першому домі дає відстороненість і погляд усередину; зовнішній блиск вас мало цікавить.','Ketu in the first house gives detachment and an inward gaze; outer shine interests you little.')
};
export const ASPECT_ON_LAGNA:Partial<Record<Planet,T>>={
 Mars:t('Марс дивиться на лагну й додає вам рішучості та різкості.','Mars aspects the lagna and adds decisiveness and edge.'),
 Jupiter:t('Юпітер дивиться на лагну: це захист і розсудливість на все життя.','Jupiter aspects the lagna: lifelong protection and good judgement.'),
 Saturn:t('Сатурн дивиться на лагну й додає стриманості, терпіння та звичку все перевіряти.','Saturn aspects the lagna and adds reserve, patience and the habit of checking everything.')
};
