/** Reader 10 plain-language layer: what a first-time reader sees before any astrological term.
 * Each line says the meaning in everyday words; the matching placement is explained only
 * in the collapsed "how this shows in your chart" part. Original bilingual texts. */
type T={uk:string;en:string};
const t=(uk:string,en:string):T=>({uk,en});

/** Temperament by rising sign. */
export const TEMPERAMENT:readonly T[]=[
 t('Ви людина дії: спершу робите, а вже потім думаєте. Чекати й підкорятися вам важко, а виклик лише додає сил.',
  'You are a person of action: you do first and think afterwards. Waiting and obeying are hard for you, and a challenge only gives you strength.'),
 t('Ви повільно розганяєтесь, зате доводите справу до кінця. Вам важливі достаток, смачна їжа й спокій, а різких змін ви не любите.',
  'You are slow to start but you finish what you begin. Comfort, good food and calm matter to you, and you dislike sudden change.'),
 t('Ви вчитеся на льоту й нудьгуєте без нових людей і новин. Говорити й домовлятися вам легко, а от довго триматися чогось одного важче.',
  'You learn on the fly and get bored without new people and news. Talking and agreeing come easily; sticking to one thing for long is harder.'),
 t('Ви тонко відчуваєте настрій інших і горою стоїте за своїх. Настрій у вас мінливий, зате добро ви пам’ятаєте довго. І кривду теж.',
  'You read other people’s moods finely and stand up for your own. Your mood changes, but you remember kindness for a long time. Hurt too.'),
 t('Ви природно опиняєтесь у центрі й берете відповідальність на себе. Вам важливі повага й щедрий жест, а приниження ви не забуваєте.',
  'You naturally end up at the centre and take responsibility. Respect and a generous gesture matter to you, and you do not forget being belittled.'),
 t('Ви помічаєте, що не працює, і знаєте, як це полагодити. До себе ви вимогливіші, ніж до інших, і спокійні лише тоді, коли все на своїх місцях.',
  'You notice what does not work and know how to fix it. You ask more of yourself than of others and relax only when everything is in its place.'),
 t('Ви шукаєте рівновагу, вмієте домовлятися й погано переносите грубість. Рішення зважуєте довго, зате поруч із вами людям легко.',
  'You look for balance, know how to agree and cannot stand rudeness. You weigh decisions for a long time, but people feel at ease around you.'),
 t('Ви бачите те, що інші ховають, і йдете до кінця. Довіряєте небагатьом, зате віддано. Зраду пам’ятаєте.',
  'You see what others hide and go all the way. You trust few people, but loyally. You remember betrayal.'),
 t('Вам потрібні сенс, простір і чесна розмова. Ви говорите прямо, вчитеся все життя й не терпите дріб’язковості.',
  'You need meaning, space and honest conversation. You speak plainly, keep learning all your life and have no patience for pettiness.'),
 t('Ви рано подорослішали й звикли планувати надовго. Зовні ви стримані, а визнання приходить до вас із роками.',
  'You grew up early and are used to planning far ahead. You look reserved, and recognition comes to you with the years.'),
 t('Ви маєте власний погляд на все й не йдете за натовпом. З людьми ви приязні, але близько підпускаєте небагатьох.',
  'You have your own view of everything and do not follow the crowd. You are friendly, but you let few people come close.'),
 t('Ви відчуваєте більше, ніж можете пояснити, і легко входите в чужий стан. Вам потрібні тиша й віра, а жорсткі рамки вас виснажують.',
  'You feel more than you can explain and slip easily into another person’s state. You need quiet and faith, and rigid frames wear you out.')
];

/** Main life theme by the house of the lagna lord. */
export const LIFE_THEME:readonly T[]=[
 t('Ви самі будуєте своє життя й рідко живете чужим розумом.',
  'You build your life yourself and rarely live by someone else’s mind.'),
 t('Ваше життя обертається навколо родини й власних грошей. Ви вмієте заробляти й відкладати, і ваше слово має вагу.',
  'Your life turns around family and your own money. You know how to earn and save, and your word carries weight.'),
 t('Усього в житті ви досягаєте самі, без спадку й везіння. Те, що у двадцять п’ять дається важко, після сорока стає вашою силою.',
  'You achieve everything in life yourself, without inheritance or luck. What is hard at twenty-five becomes your strength after forty.'),
 t('Вам потрібна своя земля під ногами. Найкращі рішення ви ухвалюєте тоді, коли вдома лад.',
  'You need ground of your own under your feet. You make your best decisions when things are in order at home.'),
 t('Ви мислите самостійно, вмієте вчити й творити. Те, що ви створюєте, будь то ідеї, проєкти чи учні, стає головною справою життя.',
  'You think for yourself and know how to teach and create. What you make, be it ideas, projects or students, becomes your life’s main work.'),
 t('Ваша сила в подоланні: ви найкращі там, де треба змагатися й наводити лад. Легких шляхів життя не обіцяє, зате з кожної боротьби ви виходите міцнішими.',
  'Your strength is in overcoming: you are at your best where you have to compete and put things in order. Life promises no easy roads, but every struggle leaves you stronger.'),
 t('Ви розкриваєтесь через іншу людину: у парі, в угоді, у роботі з людьми. Удвох ви сильніші, ніж поодинці.',
  'You open up through another person: in a couple, in a deal, in work with people. You are stronger in two than alone.'),
 t('Ваше життя йде через різкі повороти, і кожен змінює вас докорінно. Ви не боїтеся складних тем і бачите приховане.',
  'Your life moves through sharp turns, and each one changes you at the root. You are not afraid of difficult subjects and you see what is hidden.'),
 t('Вам щастить на наставників і на вдалий збіг обставин. Ви живете за принципами й з роками самі стаєте тим, до кого йдуть по пораду.',
  'You are lucky with mentors and with timing. You live by principle and in time become the one people come to for advice.'),
 t('Вас знають за тим, що ви зробили. Робота важить для вас більше, ніж затишок, і з відповідальністю до вас приходять ім’я та вплив.',
  'People know you by what you have done. Work weighs more for you than comfort, and with responsibility come a name and influence.'),
 t('Ви вмієте отримувати результат і збирати навколо себе потрібних людей. Друга половина життя щедріша за першу.',
  'You know how to get results and gather the right people around you. The second half of life is more generous than the first.'),
 t('Ваш шлях веде подалі від місця народження або всередину себе. Ви віддаєте більше, ніж берете, і сили відновлюєте на самоті.',
  'Your road leads away from your birthplace or inward. You give more than you take and recover your strength alone.')
];

/** Emotional nature by the Moon's sign. */
export const FEELINGS:readonly T[]=[
 t('Почуття у вас гарячі й швидкі: спалахуєте й так само швидко відходите.','Your feelings are hot and fast: you flare up and cool down just as quickly.'),
 t('Почуття у вас рівні й теплі, і вивести вас із рівноваги важко. Вам потрібні затишок, добра їжа й надійні люди.',
  'Your feelings are even and warm, and it is hard to throw you off balance. You need comfort, good food and dependable people.'),
 t('Ви думаєте словами й заспокоюєтесь у розмові. Одноманітність вас виснажує.','You think in words and calm down in conversation. Sameness wears you out.'),
 t('Почуття у вас глибокі, а прив’язаність до дому сильна. Ви дбаєте про інших так само природно, як дихаєте.',
  'Your feelings run deep and your attachment to home is strong. You care for others as naturally as you breathe.'),
 t('У вас горде й щедре серце. Вам треба, щоб вас помічали й цінували, і у відповідь ви грієте всіх навколо.',
  'You have a proud and generous heart. You need to be noticed and valued, and in return you warm everyone around you.'),
 t('Ваш розум усе розкладає по поличках. Ви помічаєте помилку раніше за інших і погано переносите безлад.',
  'Your mind sorts everything onto shelves. You spot the mistake before others and cannot stand a mess.'),
 t('Вам потрібні гармонія й товариство. Ви уникаєте сварок навіть тоді, коли посперечатися було б правильно.',
  'You need harmony and company. You avoid quarrels even when arguing would be right.'),
 t('Ви переживаєте все глибше, ніж показуєте, і нікому не довіряєте наполовину.','You feel everything more deeply than you show and trust no one halfway.'),
 t('Вам легшає в дорозі, у навчанні й у чесній розмові про головне.','You feel better on the road, in study and in an honest talk about what matters.'),
 t('Ви рано навчилися покладатися на себе. Спокій приходить тоді, коли є план і справа.','You learned early to rely on yourself. Calm comes when there is a plan and a task.'),
 t('На почуття ви дивитеся трохи збоку. Свобода й коло однодумців потрібні вам більше, ніж тісна близькість.',
  'You look at feelings slightly from the side. Freedom and like-minded people matter more to you than close intimacy.'),
 t('У вас м’яке й співчутливе серце. Ви вбираєте чужий настрій, тому вам потрібен час наодинці.',
  'You have a soft and compassionate heart. You absorb other people’s moods, so you need time alone.')
];

/** One inner tension in everyday words, keyed like the astrological tension it mirrors. */
export const TENSION:Record<'saturn'|'rahu'|'ketu'|'mars'|'hard6'|'hard8'|'hard12',T>={
 saturn:t('Головна ваша внутрішня суперечність: вам потрібне тепло, але ви звикли тримати все в собі.',
  'Your main inner conflict: you need warmth, but you are used to keeping everything inside.'),
 rahu:t('Вам завжди хочеться більшого, і через це буває важко просто зупинитися й відпочити.',
  'You always want more, and that makes it hard to simply stop and rest.'),
 ketu:t('Вас тягне відійти вбік, хоча насправді вам потрібна близькість.','You are pulled to step aside, though what you really need is closeness.'),
 mars:t('Ви реагуєте швидше, ніж встигаєте обдумати, і потім часом про це шкодуєте.','You react faster than you can think it through, and sometimes regret it later.'),
 hard6:t('Життя рідко веде вас прямою дорогою: ви йдете через працю й боротьбу.','Life rarely takes you by a straight road: you go through work and struggle.'),
 hard8:t('Життя рідко веде вас прямою дорогою: ви йдете через кризи й оновлення.','Life rarely takes you by a straight road: you go through crises and renewal.'),
 hard12:t('Життя рідко веде вас прямою дорогою: ви йдете через відпускання й віддаленість.','Life rarely takes you by a straight road: you go through letting go and distance.')
};
export const ASPECT_PLAIN={
 own:t('Ця сфера у вас добре захищена.','This area is well protected for you.'),
 Jupiter:t('Тут вам допомагають обставини й добрі люди.','Here circumstances and good people help you.'),
 Saturn:t('Тут усе приходить пізніше, ніж хочеться, і вимагає терпіння.','Here everything comes later than you would like and asks for patience.'),
 Mars:t('Тут не бракує поспіху й суперечок.','There is no shortage of haste and disputes here.')
} as const;
