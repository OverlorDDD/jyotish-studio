/** Jyotish editorial reading v2. Traditional interpretive themes, not factual predictions.
 * Inputs are fact-checked separately by the Swiss/Lahiri transit and verified natal engine.
 * Phaladipika ch.26: reference natal Moon sign for Gochara.
 * No guessed personal relationships, jobs, diagnoses, finances, meetings or events.
 */
type L={uk:string;en:string};
const l=(uk:string,en:string):L=>({uk,en});
const HOUSES=[
 {title:l('Особистий ритм','Your own rhythm'),story:l('Місячний транзит проходить через знак, з якого ти звикла чи звик дивитися на світ. У традиційному читанні цей момент повертає увагу до власних бажань, самопочуття й вибору. Це нагода прислухатися до себе, а не обов’язок щось негайно змінити.',
  'The Moon returns to your reference sign. In Jyotish this brings the reading back to your own pace, personal priorities and sense of self. Treat it as an invitation to listen before changing direction.'),
  opportunity:l('зрозуміти, що для тебе зараз найважливіше','recognize what matters to you now'),care:l('не робити висновків про себе за одним настроєм','not define yourself by a passing mood'),prompt:l('Що справді потребує твоєї уваги сьогодні?','What genuinely needs your attention today?')},
 {title:l('Ресурси й відчуття опори','Resources and stability'),story:l('Другий дім підсвічує тему цінностей, ресурсів і того, як ти ними розпоряджаєшся. Уважність тут корисніша за спробу вгадати майбутні прибутки: подивися, на що вже спираєшся і що хочеш берегти.',
 'The second house brings values and the handling of resources into view. Rather than expecting a specific financial event, consider the support and priorities already in your life.'),
 opportunity:l('співвіднести витрати часу й сили з цінностями','align your resources with your values'),care:l('не сприймати кожну дрібницю як загрозу стабільності','avoid treating minor changes as threats to stability'),prompt:l('Що саме у твоєму житті дає відчуття справжньої опори?','What brings a genuine sense of security?')},
 {title:l('Власний голос та ініціатива','Voice and initiative'),story:l('Третій дім у традиції пов’язують із особистим зусиллям, розмовами й навчанням через дію. Можеш придивитися до того, яку думку давно хотілося висловити, або до маленького кроку, що залежить саме від тебе.',
 'The third house connects with initiative, communication and learning by doing. Notice which conversation or manageable step is actually yours to begin.'),
 opportunity:l('говорити ясніше і діяти в межах своїх можливостей','communicate clearly and act within your means'),care:l('не перетворювати розмову на змагання','avoid making every conversation a contest'),prompt:l('Яке важливе слово чи запитання досі невисловлене?','What important question remains unspoken?')},
 {title:l('Дім і внутрішня рівновага','Home and inner balance'),story:l('Четвертий дім нагадує про простір, де можна бути собою: дім, близькість, спокій. Необов’язково чекати на велику подію, щоб звернути увагу на власне відчуття затишку й безпеки.',
 'The fourth house draws the focus to home, belonging and emotional grounding. Nothing dramatic has to happen for those questions to deserve time.'),
 opportunity:l('підтримати відчуття дому й довіри','nurture a sense of home and trust'),care:l('не переносити втому на близькі розмови','avoid letting fatigue steer close conversations'),prompt:l('Де сьогодні тобі по-справжньому спокійно?','Where can you find a little more calm and comfort today?')},
 {title:l('Радість, творчість і серце','Joy and creativity'),story:l('П’ятий дім традиційно говорить про творче самовираження, знання й те, що захоплює серце. Він не обіцяє конкретної романтичної події; радше нагадує помітити, що надихає саме тебе.',
 'The fifth house points toward creativity, learning and what engages your heart. This does not predict a romance; it asks what genuinely inspires you.'),
 opportunity:l('дати місце цікавості й власній творчості','make room for curiosity and creativity'),care:l('не міряти задоволення чужими оцінками','avoid measuring joy by outside approval'),prompt:l('Що тобі хотілося б робити заради самої радості?','What would you enjoy for its own sake?')},
 {title:l('Порядок у щоденних справах','Daily duties and clarity'),story:l('Шостий дім стосується праці, обов’язків і того, як ми справляємося з дрібними перешкодами. Тут корисне спокійне розмежування важливого та другорядного, без тривожних пророцтв про здоров’я чи конфлікти.',
 'The sixth house relates to duties, routines and the way small obstacles are handled. Calm prioritization is more useful here than anxious predictions about health or conflict.'),
 opportunity:l('упорядкувати одну повсякденну справу','organize one practical responsibility'),care:l('не навантажувати себе чужими обов’язками','avoid taking on more than belongs to you'),prompt:l('Яка маленька справа поверне відчуття порядку?','Which small task would restore a sense of order?')},
 {title:l('Зустріч із поглядом іншого','Relationships and reciprocity'),story:l('Сьомий дім повертає увагу до партнерства й домовленостей. Не йдеться про передбачення зустрічі чи розставання: традиційне запитання цього дому — чи достатньо простору в діалозі для двох сторін.',
 'The seventh house brings partnerships and agreements into focus. It cannot promise a meeting or separation; it invites you to notice whether dialogue gives both sides a voice.'),
 opportunity:l('почути іншу людину, не втрачаючи власної позиції','listen without losing your own position'),care:l('не робити висновків без розмови','avoid conclusions before a conversation'),prompt:l('У яких стосунках тобі зараз потрібна більша взаємність і простір для діалогу?','Where could reciprocity matter more?')},
 {title:l('Глибина, довіра та зміни','Trust and transformation'),story:l('Восьмий дім пов’язують із внутрішніми змінами, довірою та спільними зобов’язаннями. Його тема не означає неминучої кризи. Це можливість чесно подивитися на складне питання, не драматизуючи його.',
 'The eighth house speaks of change, trust and shared responsibilities. It is not a prediction of crisis; it invites an honest and unhurried look at complexity.'),
 opportunity:l('прояснити важливу умову або межу довіри','clarify a shared condition or boundary of trust'),care:l('не діяти з тривоги замість фактів','avoid treating anxiety as evidence'),prompt:l('Що потребує ясності, а не поспішного рішення?','What needs clarity rather than a rushed decision?')},
 {title:l('Сенс і ширший горизонт','Meaning and perspective'),story:l('Дев’ятий дім у Джйотіш пов’язують із дгармою, знанням та особистими переконаннями. Можливо, корисно перевірити, чи відповідає обраний напрям тому, у що ти справді віриш.',
 'The ninth house relates to dharma, learning and guiding beliefs. Consider whether your chosen direction still reflects the principles that matter to you.'),
 opportunity:l('повернутися до власних орієнтирів','reconnect with guiding principles'),care:l('не підміняти власні переконання чужими','avoid borrowing other people’s convictions'),prompt:l('Який принцип допомагає тобі обирати шлях?','Which principle helps you choose a direction?')},
 {title:l('Покликання й відповідальність','Purpose and responsibility'),story:l('Десятий дім звертає погляд до справ, за які ти відповідаєш, і до того, яке місце вони займають у житті. Це не обіцянка кар’єрного стрибка — швидше нагода зіставити намір із реальною дією.',
 'The tenth house highlights responsibilities and the work you choose to stand behind. Rather than promising a career breakthrough, it asks how intent meets action.'),
 opportunity:l('уточнити результат важливої справи','define a meaningful outcome'),care:l('не ототожнювати свою цінність лише з продуктивністю','avoid equating your worth with output alone'),prompt:l('Яка справа справді заслуговує твоєї уваги?','Which responsibility truly deserves your energy?')},
 {title:l('Спільнота, друзі та наміри','Community and aspirations'),story:l('Одинадцятий дім пов’язують із друзями, колом однодумців і планами на майбутнє. Зараз доречно придивитися до того, з ким ти поділяєш прагнення — і чи залишається в цих планах місце для твого власного вибору.',
 'The eleventh house connects with friendships, shared circles and long-term hopes. Reflect on the people who share your direction while keeping your own choices visible.'),
 opportunity:l('знайти спільну мову навколо реального наміру','connect over a genuine shared intention'),care:l('не ставити власні плани в залежність від чужого схвалення','avoid depending on outside approval for your plans'),prompt:l('Який намір варто обговорити з тими, кому довіряєш?','Which intention is worth sharing with someone you trust?')},
 {title:l('Тиша та завершення циклу','Rest and release'),story:l('Дванадцятий дім нагадує про відпочинок, усамітнення і завершення того, що вже віджило. Він не обіцяє втрат: радше запрошує залишити трохи простору для спокою та внутрішнього підсумку.',
 'The twelfth house invites rest, solitude and letting go of what no longer serves you. It is not a prediction of loss, but an occasion for a quieter perspective.'),
 opportunity:l('дати собі час на паузу й переосмислення','make space for reflection and rest'),care:l('не плутати відпочинок із бездіяльністю','avoid confusing rest with failure'),prompt:l('Що ти можеш відпустити без жалю, щоб залишити більше місця для спокою?','What could you release without regret to create more room for rest?')}
] as const;
export const EDITORIAL_REFERENCE={
 classical:'Phaladipika, chapter 26: transits read especially from Janma Rashi (natal Moon sign)',
 astronomy:'Swiss Ephemeris / Lahiri sidereal lunar longitude, sampled at 12:00 in chosen time zone',
 limits:'Interpretive house and nakshatra themes; no prediction of verified future events',
};
export function horoscopeTheme(house:number){if(!Number.isInteger(house)||house<1||house>12)throw Error('Invalid house');return HOUSES[house-1];}
export function readPublicSign(sign:number,transit:{date:string;sampledAtUtc:string;method:string;moon:{sign:number;nakshatra:string;pada:number}}){
 if(!Number.isInteger(sign)||sign<1||sign>12||transit.moon.sign<1||transit.moon.sign>12)throw Error('Invalid sign');
 const house=((transit.moon.sign-sign+12)%12)+1,theme=horoscopeTheme(house);
 return {referenceSign:sign,house,headline:theme.title,description:theme.story,goodFor:theme.opportunity,
  caution:theme.care,reflection:theme.prompt,evidence:{kind:'PUBLIC_JANMA_RASHI_REFERENCE',moonSign:transit.moon.sign,
   nakshatra:transit.moon.nakshatra,pada:transit.moon.pada,method:transit.method,
   date:transit.date,sampledAtUtc:transit.sampledAtUtc}};
}
