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
  opportunity:l("Зупинись і зосередься на тому, що справді важливо.","Pause and focus on what really matters."),care:l("Не роби висновків про себе за одним настроєм.","Do not define yourself by a single mood."),prompt:l("Що справді потребує твоєї уваги сьогодні?","What genuinely needs your attention today?")},
 {title:l('Ресурси й відчуття опори','Resources and stability'),story:l('Другий дім підсвічує тему цінностей, ресурсів і того, як ти ними розпоряджаєшся. Уважність тут корисніша за спробу вгадати майбутні прибутки: подивися, на що вже спираєшся і що хочеш берегти.',
 'The second house brings values and the handling of resources into view. Rather than expecting a specific financial event, consider the support and priorities already in your life.'),
 opportunity:l("Подумай, чи справді ця справа варта твого часу.","Ask if this really deserves your time."),care:l("Не сприймай кожну дрібницю як загрозу стабільності.","Do not treat every small change as a threat."),prompt:l("Що саме у твоєму житті дає відчуття справжньої опори?","What brings a genuine sense of security?")},
 {title:l('Власний голос та ініціатива','Voice and initiative'),story:l('Третій дім у традиції пов’язують із особистим зусиллям, розмовами й навчанням через дію. Можеш придивитися до того, яку думку давно хотілося висловити, або до маленького кроку, що залежить саме від тебе.',
 'The third house connects with initiative, communication and learning by doing. Notice which conversation or manageable step is actually yours to begin.'),
 opportunity:l("Скажи прямо, що хочеш обговорити, і вислухай відповідь.","Say what you want to discuss and listen to the reply."),care:l("Не перетворюй розмову на змагання.","Do not turn a conversation into a contest."),prompt:l("Яке важливе слово чи запитання досі невисловлене?","What important question remains unspoken?")},
 {title:l('Дім і внутрішня рівновага','Home and inner balance'),story:l('Четвертий дім нагадує про простір, де можна бути собою: дім, близькість, спокій. Необов’язково чекати на велику подію, щоб звернути увагу на власне відчуття затишку й безпеки.',
 'The fourth house draws the focus to home, belonging and emotional grounding. Nothing dramatic has to happen for those questions to deserve time.'),
 opportunity:l("Знайди вдома кілька хвилин спокою для себе.","Find a few quiet minutes for yourself at home."),care:l("Не переносиш втому на близьких — і це вже добре.","Notice when tiredness risks spilling into conversations."),prompt:l("Де сьогодні тобі по-справжньому спокійно?","Where can you find a little more calm and comfort today?")},
 {title:l('Радість, творчість і серце','Joy and creativity'),story:l('П’ятий дім традиційно говорить про творче самовираження, знання й те, що захоплює серце. Він не обіцяє конкретної романтичної події; радше нагадує помітити, що надихає саме тебе.',
 'The fifth house points toward creativity, learning and what engages your heart. This does not predict a romance; it asks what genuinely inspires you.'),
 opportunity:l("Повернись до заняття, яке приносить радість.","Return to something that brings you joy."),care:l("Не вимірюй задоволення чужими оцінками.","Do not measure joy by someone else's approval."),prompt:l("Що тобі хотілося б робити заради самої радості?","What would you enjoy for its own sake?")},
 {title:l('Порядок у щоденних справах','Daily duties and clarity'),story:l('Шостий дім стосується праці, обов’язків і того, як ми справляємося з дрібними перешкодами. Тут корисне спокійне розмежування важливого та другорядного, без тривожних пророцтв про здоров’я чи конфлікти.',
 'The sixth house relates to duties, routines and the way small obstacles are handled. Calm prioritization is more useful here than anxious predictions about health or conflict.'),
 opportunity:l("Полегши свій день: відокрем потрібне від зайвого.","Simplify your day: separate essentials from extras."),care:l("Не бери чужі обов’язки лише з ввічливості.","Do not take on another person's duties just to be polite."),prompt:l("Яка маленька справа поверне відчуття порядку?","Which small task would restore a sense of order?")},
 {title:l('Зустріч із поглядом іншого','Relationships and reciprocity'),story:l('Сьомий дім повертає увагу до партнерства й домовленостей. Не йдеться про передбачення зустрічі чи розставання: традиційне запитання цього дому — чи достатньо простору в діалозі для двох сторін.',
 'The seventh house brings partnerships and agreements into focus. It cannot promise a meeting or separation; it invites you to notice whether dialogue gives both sides a voice.'),
 opportunity:l("Запитай близьку людину, що для неї важливо, і розкажи про своє.","Ask someone close what matters to them and share your needs."),care:l("Не роби висновків без відвертої розмови.","Do not draw conclusions without a conversation."),prompt:l("У яких стосунках тобі зараз потрібна більша взаємність і простір для діалогу?","Where could reciprocity matter more?")},
 {title:l('Глибина, довіра та зміни','Trust and transformation'),story:l('Восьмий дім пов’язують із внутрішніми змінами, довірою та спільними зобов’язаннями. Його тема не означає неминучої кризи. Це можливість чесно подивитися на складне питання, не драматизуючи його.',
 'The eighth house speaks of change, trust and shared responsibilities. It is not a prediction of crisis; it invites an honest and unhurried look at complexity.'),
 opportunity:l("Уточни умови однієї домовленості, перш ніж діяти.","Clarify the terms of an agreement before acting."),care:l("Не дозволяй тривозі вирішувати замість тебе.","Do not let anxiety make the decision for you."),prompt:l("Що потребує ясності, а не поспішного рішення?","What needs clarity rather than a rushed decision?")},
 {title:l('Сенс і ширший горизонт','Meaning and perspective'),story:l('Дев’ятий дім у Джйотіш пов’язують із дгармою, знанням та особистими переконаннями. Можливо, корисно перевірити, чи відповідає обраний напрям тому, у що ти справді віриш.',
 'The ninth house relates to dharma, learning and guiding beliefs. Consider whether your chosen direction still reflects the principles that matter to you.'),
 opportunity:l("Звір наступний крок зі своїми цінностями.","Check your next step against your values."),care:l("Не підміняй свої переконання чужими.","Do not replace your values with someone else's."),prompt:l("Який принцип допомагає тобі обирати шлях?","Which principle helps you choose a direction?")},
 {title:l('Покликання й відповідальність','Purpose and responsibility'),story:l('Десятий дім звертає погляд до справ, за які ти відповідаєш, і до того, яке місце вони займають у житті. Це не обіцянка кар’єрного стрибка — швидше нагода зіставити намір із реальною дією.',
 'The tenth house highlights responsibilities and the work you choose to stand behind. Rather than promising a career breakthrough, it asks how intent meets action.'),
 opportunity:l("Якщо є домовленість, уточни, хто й за що відповідає.","If there is an agreement, clarify who is responsible for what."),care:l("Не вимірюй свою цінність кількістю виконаних справ.","Do not measure your worth by how busy you are."),prompt:l("Яка справа справді заслуговує твоєї уваги?","Which responsibility truly deserves your energy?")},
 {title:l('Спільнота, друзі та наміри','Community and aspirations'),story:l('Одинадцятий дім пов’язують із друзями, колом однодумців і планами на майбутнє. Зараз доречно придивитися до того, з ким ти поділяєш прагнення — і чи залишається в цих планах місце для твого власного вибору.',
 'The eleventh house connects with friendships, shared circles and long-term hopes. Reflect on the people who share your direction while keeping your own choices visible.'),
 opportunity:l("Поділися задумом із людиною, якій довіряєш.","Share an idea with someone you trust."),care:l("Не віддавай іншим право вирішувати за тебе.","Do not give someone else the right to choose for you."),prompt:l("Який намір варто обговорити з тими, кому довіряєш?","Which intention is worth sharing with someone you trust?")},
 {title:l('Тиша та завершення циклу','Rest and release'),story:l('Дванадцятий дім нагадує про відпочинок, усамітнення і завершення того, що вже віджило. Він не обіцяє втрат: радше запрошує залишити трохи простору для спокою та внутрішнього підсумку.',
 'The twelfth house invites rest, solitude and letting go of what no longer serves you. It is not a prediction of loss, but an occasion for a quieter perspective.'),
 opportunity:l("Зроби паузу й переосмисли питання, яке зараз займає твої думки.","Pause and revisit an issue on your mind."),care:l("Не треба плутати відпочинок із бездіяльністю.","Rest is not the same as idleness."),prompt:l("Що ти можеш відпустити без жалю, щоб залишити більше місця для спокою?","What could you release without regret to create more room for rest?")}
] as const;

// Daily editorial movement is DATE-BASED and changes prose, not planetary facts.
// No claimed spiritual or astronomical meaning is assigned to a calendar modulo.
const DAILY_ACTIONS=[[["Назви одну межу, яку хочеш сьогодні зберегти.","Name one boundary you want to protect today."],["Дозволь собі не відповідати на прохання миттєво.","Give yourself time before agreeing to a request."],["Скажи вголос, чого тобі сьогодні хочеться.","Say aloud what you actually want today."],["Підтримай звичку, яка допомагає почуватися собою.","Keep a habit that helps you feel like yourself."]],[["Перед покупкою запитай: «Що вона змінить насправді?»","Before buying, ask: “What will this actually change?”"],["Визнач, які плани варті твого часу сьогодні.","Decide which plans deserve your time today."],["Порівняй потрібну витрату з тією, яку можна відкласти.","Compare an essential expense with one you can postpone."],["Збережи фінансову звичку, яка вже працює.","Keep a financial habit that already works."]],[["Уточни одне речення, яке залишилося незрозумілим.","Clarify one sentence you did not fully understand."],["Сформулюй свою думку двома простими реченнями.","Express your view in two clear sentences."],["Постав одне конкретне запитання без довгої передмови.","Ask one clear question without a long introduction."],["Подякуй людині за чесну і приємну розмову.","Thank someone for an honest, thoughtful conversation."]],[["Домовся про двадцять хвилин тиші без переривань.","Ask for twenty uninterrupted minutes of quiet."],["Зроби невеликий куточок затишнішим для себе.","Make a small corner more comfortable for yourself."],["Скажи близьким, коли тобі потрібен час наодинці.","Tell loved ones when you need time to yourself."],["Потішся тим, що у твоєму домі вже добре.","Enjoy something that is already good about your home."]],[["Приділи час улюбленому заняттю без оцінки результату.","Spend time on a hobby without judging the result."],["Спробуй щось нове й дозволь собі бути початківцем.","Try something new and allow yourself to be a beginner."],["Знайди власний цікавий спосіб зробити звичну річ.","Find a creative way to do something familiar."],["Насолодись приємним моментом без самоаналізу.","Enjoy a pleasant moment without analysing it."]],[["Уточни, які обов’язки справді твої.","Clarify which responsibilities are actually yours."],["Відклади необов’язкову справу, якщо вона заважає важливішому.","Postpone a nonessential task if something else matters more."],["Скажи прямо, з чим і коли потрібна допомога.","Say exactly what help would be useful and when."],["Збережи розпорядок, який уже полегшує твій день.","Keep a routine that already makes your day easier."]],[["Запитай близьку людину, що для неї зараз важливо.","Ask someone close what matters to them right now."],["Скажи: «Мені важливо ось це. А тобі?»","Say: “This matters to me. What matters to you?”"],["Обережно познач межу, яку хочеш зберегти у спілкуванні.","Gently name a boundary you want to keep."],["Подякуй за конкретний вчинок, у якому відчула підтримку.","Thank someone for a specific act of support."]],[["Уточни, хто вирішує, хто відповідає й коли переглянете умови.","Clarify who decides, who is responsible and when terms change."],["Зачекай із рішенням, доки матимеш потрібні факти.","Wait for the facts you need before deciding."],["Обговори одну незрозумілу умову без натяків.","Discuss one unclear condition openly."],["Перевір, чи зберегла важливі домовленості.","Check that important agreements are recorded."]],[["Назви один принцип, яким не хочеш поступатися.","Name one principle you do not want to compromise."],["Порівняй два варіанти зі своїми цінностями.","Compare two options against your values."],["Досліди одне питання, яке давно тебе цікавить.","Explore one question you have been curious about."],["Пригадай, чому обрала саме цей шлях.","Remember why you chose this path."]],[["Якщо є спільна справа, з’ясуй, що потрібно і до коли.","For a shared task, clarify what is needed and when."],["Постав одне конкретне запитання про очікування.","Ask one clear question about expectations."],["Відділи потрібний результат від необов’язкових деталей.","Separate the essential result from optional details."],["Поміть одну домовленість, яка вже працює, і підтримай її.","Notice an agreement that already works and support it."]],[["Обговори задум із людиною, яка вміє слухати.","Discuss an idea with someone who listens well."],["Спокійно скажи, якщо твоя думка відрізняється.","Speak calmly when your view differs from the group's."],["Запитай, як почувається людина, з якою давно не спілкувалася.","Check on someone you have not talked to lately."],["Подякуй за підтримку, яку пам’ятаєш.","Thank someone for support you remember."]],[["Зроби паузу й подивись спокійніше на питання, яке тривожить.","Pause and look calmly at an issue troubling you."],["Відмовся від однієї необов’язкової справи цього вечора.","Set aside one optional task this evening."],["Занотуй хвилювання і виріши, коли повернешся до нього.","Write down a worry and choose when to revisit it."],["Побудь у тиші без екрана хоча б кілька хвилин.","Spend a few screen-free minutes in quiet."]]];
const DAILY_INTROS=[["Якщо день вимагає вибору, почни із власних потреб.","If today calls for a decision, begin with your own needs."],["Коли виникає тиск, спочатку проясни умови.","When pressure rises, first clarify the expectations."],["Сьогодні можна озвучити те, що довго відкладалося.","Today could be a moment to speak up."],["Якщо все добре, збережи свій темп без зайвих змін.","If things are going well, protect your pace."]];
const DAILY_QUESTIONS=[[["Якої межі тобі зараз хочеться дотриматися?","Which boundary would you like to keep?"],["На яке прохання тобі краще відповісти не відразу?","Which request deserves a slower response?"],["Яке власне бажання ти давно не озвучувала?","Which wish have you not voiced lately?"],["Що вже допомагає тобі залишатися собою?","What already helps you stay true to yourself?"]],[["Яка покупка дійсно вирішить реальну потребу?","Which purchase would solve a real need?"],["Куди сьогодні варто спрямувати свій час?","What deserves your time today?"],["Яку витрату можна спокійно відкласти?","Which expense can wait?"],["Який спосіб планування вже добре тобі служить?","Which planning habit serves you well?"]],[["Що саме ти хочеш уточнити у співрозмовника?","What exactly would you like to clarify?"],["Яку думку можна висловити простіше?","Which idea could you express more simply?"],["Якого запитання ти уникаєш через незручність?","Which question have you been avoiding?"],["Кому ти хотіла б подякувати за відкритість?","Who deserves thanks for speaking openly?"]],[["Де можна побути у спокої хоча б кілька хвилин?","Where can you have a few quiet minutes?"],["Яка дрібниця робить дім приємнішим?","What small thing makes home more welcoming?"],["Як ти можеш сказати близьким про потребу в тиші?","How could you ask loved ones for quiet time?"],["Що в твоєму домі вже приносить затишок?","What already brings warmth to your home?"]],[["Яке заняття приносить радість без жодної мети?","What do you enjoy without needing a goal?"],["Що нового хочеться спробувати без страху помилки?","What would you try without fear of mistakes?"],["Як можна подивитися на звичне під іншим кутом?","How could you see something familiar differently?"],["Яким простим моментом сьогодні можна насолодитися?","Which simple moment can you enjoy today?"]],[["Який обов’язок варто розділити з іншими?","Which duty could be shared?"],["Що можна відкласти без реальних наслідків?","What can be postponed without real consequences?"],["Якої саме допомоги ти потребуєш, якщо вона потрібна?","What help would you need, if any?"],["Який звичний порядок уже полегшує твій день?","What routine already makes your day easier?"]],[["Про що варто запитати близьку людину?","What would you like to ask someone close?"],["Як сказати про потребу без докору?","How could you express a need without blame?"],["Яку межу в стосунках хочеться зберегти?","Which boundary in a relationship matters to you?"],["За який вчинок ти вдячна чи вдячний?","Which caring act are you grateful for?"]],[["У якій домовленості потрібні чіткі ролі?","Which agreement needs clearer roles?"],["Якої інформації бракує перед рішенням?","What information is missing before you decide?"],["Яку умову потрібно обговорити вголос?","Which condition needs open discussion?"],["Чи є домовленість, якій уже можна довіритися?","Is there an agreement you can already trust?"]],[["Який принцип ти хочеш зберегти за будь-якого вибору?","Which principle matters in any choice?"],["Який варіант ближчий до твоїх цінностей?","Which option best matches your values?"],["Яке питання ти хочеш дослідити глибше?","Which question would you like to explore?"],["Що колись переконало тебе обрати цей шлях?","What originally drew you to this direction?"]],[["Чого саме від тебе чекають у спільній справі?","What exactly is expected in a shared task?"],["Яке одне уточнення зніме зайву напругу?","Which clarification could ease needless pressure?"],["Який результат справді потрібен, а що зайве?","Which outcome matters, and what is optional?"],["Яка домовленість уже працює без твоїх додаткових зусиль?","Which agreement works without extra effort from you?"]],[["Із ким хочеться поділитися задумом?","Who would you like to share an idea with?"],["Де варто спокійно озвучити свою думку?","Where is it worth speaking up calmly?"],["Кому ти давно хотіла б написати?","Who have you wanted to check in with?"],["Чию підтримку хотілося б відзначити?","Whose support would you like to acknowledge?"]],[["Яке питання стане яснішим після короткої паузи?","Which issue might become clearer after a pause?"],["Від чого сьогодні можна відмовитися без втрати?","What could you leave aside without losing anything?"],["Яку тривожну думку можна повернути собі на завтра?","Which worry could wait until tomorrow?"],["Що допоможе тобі відчути спокій цього вечора?","What could help you feel at ease tonight?"]]];
/** A house theme legitimately spans 2-3 days. The subheading reflects a
 * different date-specific editorial angle, not a fabricated lunar ingress.
 */
/** Distinct, human-edited titles for all 12 lunar houses across four date steps.
 * House is astronomical; step changes editorial phrasing, never invents a transit.
 */
const DAILY_HEADLINES=[
 [l("Почути власні потреби","Listen to your needs"),l("Зберегти особисті межі","Protect personal boundaries"),l("Дати слово бажанням","Give your wishes a voice"),l("Повернутися до свого темпу","Return to your own pace")],
 [l("На що варто витратити сили","What deserves your energy"),l("Цінність часу й уваги","Value your time and attention"),l("Вибирати без поспіху","Choose without rushing"),l("Зберегти свою опору","Keep what grounds you")],
 [l("Уточнити найважливіше","Clarify what matters"),l("Висловитися простіше","Say it more simply"),l("Почати потрібну розмову","Begin a needed conversation"),l("Почути іншу сторону","Hear the other side")],
 [l("Знайти хвилину спокою","Find a quiet moment"),l("Затишок із простих речей","Comfort in simple things"),l("Поговорити про особистий простір","Talk about personal space"),l("Помітити тепло свого дому","Notice the warmth of home")],
 [l("Радість без результату","Enjoy without a goal"),l("Сміливість спробувати нове","Dare to try something new"),l("Знайти власний спосіб","Find your own approach"),l("Відчути смак моменту","Savour the moment")],
 [l("Повернути обов’язкам межі","Put boundaries around duties"),l("Зменшити зайве навантаження","Release unnecessary burdens"),l("Попросити про потрібну підтримку","Ask for the support you need"),l("Залишити місце для звичного","Make room for familiar routines")],
 [l("Почути того, хто поруч","Listen to someone close"),l("Сказати про свої потреби","Speak about your needs"),l("Зберегти простір для двох","Leave room for two voices"),l("Подякувати за турботу","Recognise an act of care")],
 [l("Визначити правила довіри","Set terms for trust"),l("Дочекатися потрібних фактів","Wait for the facts"),l("Прояснити складну умову","Clarify a difficult term"),l("Зміцнити вдалі домовленості","Support agreements that work")],
 [l("Не зраджувати своїм принципам","Stay true to your principles"),l("Побачити можливі шляхи","Consider different paths"),l("Поставити глибше запитання","Ask a deeper question"),l("Пригадати свій дороговказ","Remember what guides you")],
 [l("Уточнити спільну мету","Clarify a shared goal"),l("Знайти одне конкретне рішення","Find one concrete answer"),l("Відділити суттєве від зайвого","Separate essentials from extras"),l("Визнати зроблену роботу","Recognise work already done")],
 [l("Поділитися задумом","Share an idea"),l("Спокійно захистити свою думку","Express a different view calmly"),l("Поновити важливий зв’язок","Reconnect with someone important"),l("Відзначити підтримку друзів","Appreciate support from friends")],
 [l("Почути власну тишу","Listen to the quiet"),l("Зняти зайві зобов’язання","Release optional commitments"),l("Залишити тривогу на папері","Put a worry on paper"),l("Повернути собі спокій","Return to inner calm")]
] as const;
const DAILY_CAUTIONS=[["Не поспішай із висновками, поки бракує фактів.","Do not rush to conclusions without the facts."],["Не створи собі новий обов’язок лише через звичку.","Do not invent another duty out of habit."],["Не вимагай від себе миттєвого результату.","Do not demand an instant result from yourself."],["Не шукай неполадок там, де вже все працює.","Do not look for a problem where things already work."]];
export function editorialDayIndex(day:string){
 const utc=Date.parse(day+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(utc)||
  new Date(utc).toISOString().slice(0,10)!==day)throw Error('Invalid local date');
 return ((Math.floor(utc/86400000)%4)+4)%4;
}

export const EDITORIAL_REFERENCE={
 classical:'Phaladipika, chapter 26: transits read especially from Janma Rashi (natal Moon sign)',
 astronomy:'Swiss Ephemeris / Lahiri sidereal lunar longitude, sampled at 12:00 in chosen time zone',
 limits:'Interpretive house and nakshatra themes; no prediction of verified future events',
};
export function horoscopeTheme(house:number){if(!Number.isInteger(house)||house<1||house>12)throw Error('Invalid house');return HOUSES[house-1];}
/** Specific traditional lunar-mansion themes. A change in sampled nakshatra
 * changes this part of the forecast; the calendar date by itself does not.
 */
const NAKSHATRA_FOCUS:Record<string,L>={
 Ashwini:l('сміливого початку й відновлення','swift beginnings and renewal'),
 Bharani:l('меж вибору та відповідальності','boundaries and responsibility for choices'),
 Krittika:l('рішучості відділити важливе від зайвого','cutting away what is unnecessary'),
 Rohini:l('послідовного плекання того, що росте','patient cultivation and steady growth'),
 Mrigashira:l('пошуку відповіді й перевірки фактів','curiosity and checking the facts'),
 Ardra:l('прояснення того, що вже потребує змін','clarifying what must change'),
 Punarvasu:l('повернення до основ і відновлення','returning to essentials and restoring'),
 Pushya:l('підтримки та відповідального піклування','support and responsible care'),
 Ashlesha:l('мотивів, довіри й особистих кордонів','motives, trust and boundaries'),
 Magha:l('спадкоємності, гідності й відповідальності','legacy, dignity and responsibility'),
 'Purva Phalguni':l('радості, творчості й близькості','joy, creativity and closeness'),
 'Uttara Phalguni':l('міцних союзів та взаємних зобов’язань','durable alliances and shared duties'),
 Hasta:l('практичної майстерності й уваги до деталей','practical skill and attention to detail'),
 Chitra:l('створення форми й точного задуму','design and purposeful craftsmanship'),
 Swati:l('свободи вибору та гнучкості','independence and flexibility'),
 Vishakha:l('цілеспрямованості та вірності наміру','commitment and focused intention'),
 Anuradha:l('дружби, вірності й узгоджених дій','friendship, loyalty and cooperation'),
 Jyeshtha:l('зрілого керівництва та захисту меж','mature leadership and protection'),
 Mula:l('пошуку кореня проблеми','finding the root of the matter'),
 'Purva Ashadha':l('переконаності й завзятості','conviction and perseverance'),
 'Uttara Ashadha':l('послідовної праці заради тривкого результату','steady work toward lasting results'),
 Shravana:l('слухання, навчання та обміну знаннями','listening and learning'),
 Dhanishta:l('ритму, спільної праці й узгодженості','rhythm and coordinated effort'),
 Shatabhisha:l('дослідження і потреби в особистому просторі','inquiry and personal space'),
 'Purva Bhadrapada':l('переоцінки цінностей і рішучості','reassessing values and resolve'),
 'Uttara Bhadrapada':l('спокою, витримки та внутрішньої глибини','patience and depth'),
 Revati:l('турботливого завершення та підготовки шляху','kind closure and preparation')
};
export function readPublicSign(sign:number,transit:{date:string;sampledAtUtc:string;method:string;moon:{sign:number;nakshatra:string;pada:number}}){
 if(!Number.isInteger(sign)||sign<1||sign>12||!Number.isInteger(transit.moon.sign)||transit.moon.sign<1||transit.moon.sign>12)
  throw Error('Invalid natal Moon reference sign');
 editorialDayIndex(transit.date); // calendar validation ONLY, never editorial rotation
 if(!Number.isInteger(transit.moon.pada)||transit.moon.pada<1||transit.moon.pada>4||
    !transit.moon.nakshatra||typeof transit.moon.nakshatra!=='string')
  throw Error('Invalid lunar nakshatra observation');
 const house=((transit.moon.sign-sign+12)%12)+1;
 const theme=horoscopeTheme(house),focus=houseTheme(house);
 const mansion=NAKSHATRA_FOCUS[transit.moon.nakshatra];
 const mansionStory=mansion?
  l('Місяць перебуває в накшатрі '+transit.moon.nakshatra+': її мотив — '+mansion.uk+'.',
    'The Moon occupies '+transit.moon.nakshatra+' nakshatra, with its traditional focus on '+mansion.en+'.'):
  l('Місяць перебуває в накшатрі '+transit.moon.nakshatra+'.',
    'The Moon occupies '+transit.moon.nakshatra+' nakshatra.');
 const description=l(
  'За Джанма-раші Місяць проходить '+house+'-й дім. Сьогодні цей дім висуває на передній план потребу '+
   focus.focus.uk+'. '+mansionStory.uk+' Приділи увагу конкретним обставинам цієї сфери, а не загальним очікуванням.',
  'From the natal Moon sign, the transiting Moon moves through house '+house+
   '. This draws attention to the need to '+focus.focus.en+'. '+mansionStory.en+
   ' Address the circumstances of this part of life with a concrete decision.'
 );
 return {referenceSign:sign,house,headline:l(theme.title.uk+' · '+transit.moon.nakshatra,
    theme.title.en+' · '+transit.moon.nakshatra),description,
  goodFor:focus.step,caution:focus.guard,reflection:focus.question,
  evidence:{kind:'PUBLIC_JANMA_RASHI_REFERENCE',moonSign:transit.moon.sign,
   nakshatra:transit.moon.nakshatra,pada:transit.moon.pada,method:transit.method,
   date:transit.date,sampledAtUtc:transit.sampledAtUtc,
   editorialPolicy:'CALCULATED_MOON_HOUSE_AND_NAKSHATRA_NO_DATE_ROTATION'}};
}

/** ASE-3 rule-authored original prose: no provider call, no hidden random rotation.
 * Western Sun-sign references, Western natal aspects and Parashari evidence
 * remain mathematically distinct and are disclosed in the evidence panels.
 * The house topic tables below are traditional editorial correspondences.
 */
const WESTERN_HOUSES=[
 {title:l('Особистий курс','Personal direction'),focus:l('самостійно визначити пріоритет і взяти відповідальність за рішення','make a decision independently and own its consequences'),step:l('Назви власний пріоритет і зроби його перший видимий крок.','Name your priority and take its first visible step.'),guard:l('Не витрачай сили на доведення власної правоти.','Do not waste energy proving you are right.'),question:l('Яке рішення залежить саме від тебе?','Which decision rests with you?')},
 {title:l('Цінності та кошти','Values and money'),focus:l('переглянути витрати, особистий бюджет і ціну власного часу','review spending, your budget and the value of your time'),step:l('Зістав одну заплановану витрату з тим, що зараз справді важливо.','Compare a planned expense with what matters to you now.'),guard:l('Не погоджуйся на витрати лише заради чужого схвалення.','Do not spend just to win approval.'),question:l('Куди йдуть твої найцінніші ресурси?','Where do your most valuable resources go?')},
 {title:l('Спілкування та рішення','Communication and decisions'),focus:l('прояснити слова, домовленості й поточні переговори','clarify words, agreements and ongoing negotiations'),step:l('Уточни одну нерозв’язану домовленість — хто, що і коли робить.','Clarify one unfinished agreement: who does what and when.'),guard:l('Не замінюй запитання припущенням про наміри іншої людини.','Do not replace a question with an assumption about someone’s intentions.'),question:l('Що варто проговорити вголос?','What needs to be said out loud?')},
 {title:l('Дім і внутрішня опора','Home and inner grounding'),focus:l('налагодити домашні справи, межі й особистий простір','settle home matters, boundaries and personal space'),step:l('Заверши одну домашню справу й відведи час на спокій без зайвих домовленостей.','Finish a household task and keep time for quiet without new obligations.'),guard:l('Не перенось робочу напругу в розмови з близькими.','Do not carry work tensions into conversations at home.'),question:l('Що зараз повертає відчуття опори?','What gives you a sense of grounding now?')},
 {title:l('Почуття і творчість','Affection and creativity'),focus:l('дати простір почуттям, радості та творчій ініціативі','make room for affection, joy and creative initiative'),step:l('Повернися до особистого творчого задуму або знайди час для щирої зустрічі.','Return to a creative idea or make time for a genuine connection.'),guard:l('Не оцінюй щирість за миттєвою реакцією співрозмовника.','Do not judge sincerity by someone’s immediate reaction.'),question:l('Що приносить радість без потреби в оцінці?','What brings joy without needing approval?')},
 {title:l('Щоденні справи та здоровий ритм','Everyday work and a sound routine'),focus:l('упорядкувати обов’язки, графік і щоденні звички','organize obligations, schedules and daily habits'),step:l('Заверши важливу рутинну справу та скороти зайву частину розкладу.','Finish an essential routine task and trim an unnecessary part of the schedule.'),guard:l('Не перетворюй продуктивність на безперервну гонитву.','Do not turn productivity into a constant race.'),question:l('Який процес можна зробити простішим?','Which process can you simplify?')},
 {title:l('Партнерство та взаємність','Partnership and reciprocity'),focus:l('почути очікування іншої сторони та уточнити взаємні умови','hear the other side’s expectations and clarify mutual terms'),step:l('Окресли в одній важливій домовленості, за що відповідає кожна сторона.','Set out who is responsible for what in one important agreement.'),guard:l('Не поступайся принциповим лише для уникнення незручної розмови.','Do not concede something important just to avoid an awkward conversation.'),question:l('Де потрібно більше взаємності?','Where do you need more reciprocity?')},
 {title:l('Спільні ресурси та зміни','Shared resources and change'),focus:l('розібратися зі спільними грошима, зобов’язаннями та межами довіри','examine shared finances, obligations and boundaries of trust'),step:l('Перевір одну спільну фінансову або побутову домовленість: суму, строк і відповідального.','Review one shared financial or household agreement: amount, deadline and responsibility.'),guard:l('Не бери чужих обов’язків без чіткого розуміння умов.','Do not assume someone else’s obligations without clear terms.'),question:l('Що потрібно уточнити, перш ніж погоджуватися?','What should be clarified before agreeing?')},
 {title:l('Знання й нові горизонти','Knowledge and new horizons'),focus:l('переосмислити переконання, навчання й далекі плани','reconsider beliefs, learning and longer-term plans'),step:l('Зістав два надійні джерела перед важливим рішенням.','Compare two reliable sources before a significant decision.'),guard:l('Не приймай перше переконливе пояснення за остаточне.','Do not accept the first convincing explanation as final.'),question:l('Якої інформації бракує для ширшої картини?','What information is missing from the bigger picture?')},
 {title:l('Кар’єра та відповідальність','Career and responsibility'),focus:l('визначити професійну мету й показати реальний результат роботи','set a professional goal and show a tangible result'),step:l('Доведи одну помітну робочу справу до результату замість обіцяти нові.','Bring one visible work task to completion instead of making new promises.'),guard:l('Не плутай термінові запити з головними цілями.','Do not confuse urgent requests with the main goal.'),question:l('Який результат сьогодні зміцнить твою репутацію?','Which result would strengthen your reputation today?')},
 {title:l('Друзі та спільні цілі','Friends and shared goals'),focus:l('зміцнити дружні зв’язки та перевірити реалістичність спільних задумів','strengthen friendships and check the realism of joint plans'),step:l('Запитай партнера по задуму, які ресурси й час у нього дійсно є.','Ask a collaborator what time and resources they actually have.'),guard:l('Не покладай весь план на обіцянки інших.','Do not base the entire plan on others’ promises.'),question:l('Хто поділяє твою мету на ділі?','Who supports your goal through action?')},
 {title:l('Завершення та відновлення','Closure and renewal'),focus:l('звільнитися від зайвої метушні й завершити невидимі справи','clear unnecessary noise and close invisible loose ends'),step:l('Прибери одну виснажливу незавершену справу й збережи час для себе.','Close one draining unfinished task and protect time for yourself.'),guard:l('Не заповнюй звільнений час новими обіцянками автоматично.','Do not automatically fill freed-up time with new commitments.'),question:l('Що вже можна відпустити?','What are you ready to let go of?')}
] as const;
const PLANET_COPY:Record<string,{name:L,scope:L}>={
 Sun:{name:l('Сонце','Sun'),scope:l('самовизначення та сміливості діяти','identity and the courage to act')},
 Moon:{name:l('Місяць','Moon'),scope:l('почуттів та внутрішніх потреб','feelings and inner needs')},
 Mercury:{name:l('Меркурій','Mercury'),scope:l('перемовин, думок і документів','communication, thoughts and documents')},
 Venus:{name:l('Венера','Venus'),scope:l('стосунків і цінностей','relationships and values')},
 Mars:{name:l('Марс','Mars'),scope:l('волі та ініціативи','will and initiative')},
 Jupiter:{name:l('Юпітер','Jupiter'),scope:l('перспектив і навчання','perspective and learning')},
 Saturn:{name:l('Сатурн','Saturn'),scope:l('дисципліни, меж і зобов’язань','discipline, boundaries and commitments')},
 Rahu:{name:l('Раху','Rahu'),scope:l('амбіцій і незвичних рішень','ambition and unconventional decisions')},
 Ketu:{name:l('Кету','Ketu'),scope:l('переоцінки звичного','re-evaluating what is familiar')}
};
const ASPECT_COPY:Record<string,{name:L,meaning:L}>={
 conjunction:{name:l('з’єднання','conjunction'),meaning:l('підсилює нагальність цієї теми','puts that theme into sharper focus')},
 sextile:{name:l('секстиль','sextile'),meaning:l('відкриває шлях до домовленості й нового підходу','opens room for cooperation and a fresh approach')},
 square:{name:l('квадрат','square'),meaning:l('потребує узгодити суперечливі імпульси','calls for reconciling competing impulses')},
 trine:{name:l('трин','trine'),meaning:l('дозволяє спертися на сильну сторону','lets you draw on an existing strength')},
 opposition:{name:l('опозиція','opposition'),meaning:l('виводить назовні два протилежні бажання','brings opposing needs into view')},
 semisextile:{name:l('напівсекстиль','semisextile'),meaning:l('просить невеликого уточнення','asks for a small adjustment')},
 semisquare:{name:l('напівквадрат','semisquare'),meaning:l('виявляє приховане тертя','brings hidden friction into view')},
 sesquiquadrate:{name:l('півтораквадрат','sesquiquadrate'),meaning:l('робить накопичену напругу помітнішою','brings accumulated friction into focus')},
 quincunx:{name:l('квінконс','quincunx'),meaning:l('вимагає змінити звичну схему','calls for adjusting a familiar pattern')}
};
export function houseTheme(house:number){
 if(!Number.isInteger(house)||house<1||house>12)throw Error('Invalid reference house');
 return WESTERN_HOUSES[house-1];
}
export function editorialWesternReading({sunHouse,moonHouse,mercuryHouse}:{sunHouse:number;moonHouse:number;mercuryHouse:number}){
 const sun=houseTheme(sunHouse),moon=houseTheme(moonHouse),mercury=houseTheme(mercuryHouse);
 return {
  headline:l(sun.title.uk+' · '+moon.title.uk,sun.title.en+' · '+moon.title.en),
  description:l(
   'Сонце у '+sunHouse+'-му домі від твого сонячного знака підкреслює потребу '+sun.focus.uk+'. '+
   'Місяць у '+moonHouse+'-му домі додає інший акцент: '+moon.focus.uk+'. '+
   'Меркурій у '+mercuryHouse+'-му домі звертає увагу на переговори та ясність рішень у сфері: '+mercury.focus.uk+'. '+
   'Поєднай ці теми: обери конкретний крок і проясни, з ким його варто узгодити.',
   'The Sun in house '+sunHouse+' from your Sun sign emphasizes the need to '+sun.focus.en+'. '+
   'The Moon in house '+moonHouse+' adds a second focus: '+moon.focus.en+'. '+
   'Mercury in house '+mercuryHouse+' brings communication and decisions to the area of '+mercury.focus.en+'. '+
   'Bring these threads together with one concrete next step and a clear agreement.'
  ),
  goodFor:l(sun.step.uk+' '+moon.step.uk,sun.step.en+' '+moon.step.en),
  caution:l(moon.guard.uk+' '+sun.guard.uk,moon.guard.en+' '+sun.guard.en),
  reflection:l(sun.question.uk,sun.question.en)
 };
}
export type EditorialSignal={id:string;planet:string;topic:string;aspect?:string;target?:string;house?:number};
export function editorialSynthesis({western,vedic,topic,status}:{
 western:readonly EditorialSignal[];vedic:readonly EditorialSignal[];
 topic:L|null;status:'convergence'|'different_emphases'|'limited_evidence'}){
 const w=western[0],v=vedic[0];
 const wp=w?PLANET_COPY[w.planet]:null,vt=v?PLANET_COPY[v.planet]:null;
 const ap=w?.aspect?ASPECT_COPY[w.aspect]:null;
 const house=v?.house?houseTheme(v.house):null;
 const shared=status==='convergence'&&topic;
 const headline=shared?l('У центрі — '+topic.uk.toLowerCase(),'In focus: '+topic.en.toLowerCase()):
  status==='limited_evidence'?l('Гочара задає ритм дня','Gochara sets the day’s rhythm'):
   l('Як узгодити різні акценти','How to balance different emphases');
 const westernLine=w&&wp&&ap?l(
  'У західній карті транзитний '+wp.name.uk+' утворює '+ap.name.uk+' до натальної планети '+(PLANET_COPY[w.target||'']?.name.uk||w.target)+'. У традиційному читанні цей аспект '+ap.meaning.uk+' у питаннях '+wp.scope.uk+'.',
  'In the Western chart, transiting '+wp.name.en+' forms a '+ap.name.en+' to natal '+(PLANET_COPY[w.target||'']?.name.en||w.target)+'. Traditionally this contact '+ap.meaning.en+' in matters of '+wp.scope.en+'.'):
  l('Західних транзитних аспектів до натальних Сонця чи Місяця в обраному орбісі зараз немає.',
    'No close Western transit to natal Sun or Moon meets the selected orb at this observation.');
 const vedicLine=v&&vt&&house?l(
  'У Джйотіш '+vt.name.uk+' проходить '+v.house+'-й дім від натальної точки відліку. Цей дім спрямовує увагу на потребу '+house.focus.uk+'.',
  'In Jyotish, '+vt.name.en+' travels through house '+v.house+' from the natal reference. This house draws focus to '+house.focus.en+'.'):
  l('Ведичний акцент визначається окремо обчисленою гочарою.','The Vedic emphasis comes from independently calculated gochara.');
 const bridge=shared?l(
  'Обидві традиції підкреслюють «'+topic.uk.toLowerCase()+'» різними методами. Розглянь це питання в конкретних взаєминах і обов’язках, які маєш зараз.',
  'Both traditions point toward '+topic.en.toLowerCase()+' by different methods. Examine this theme within the responsibilities and relationships you actually have.'):
  status==='different_emphases'?l(
   'Західний аспект показує характер напруги чи можливості, а ведичний дім — сферу практичної уваги. Разом вони допомагають розставити пріоритети.',
   'The Western contact describes the kind of tension or opening, while the Vedic house points to an area for practical attention. Together they clarify priorities.'):
  l('Сьогодні виразніший орієнтир дає ведична гочара; західній карті не приписуємо аспектів, яких немає.',
   'Vedic gochara supplies the clearer emphasis today; no absent Western aspect is added.');
 return {
  headline,description:l(westernLine.uk+' '+vedicLine.uk+' '+bridge.uk,westernLine.en+' '+vedicLine.en+' '+bridge.en),
  advice:l(house?house.step.uk:'Вибери конкретний пріоритет і виріши, як його втілити.',
   house?house.step.en:'Choose a concrete priority and decide how to carry it through.'),
  reflection:l(house?house.question.uk:'Що зараз найважливіше?',house?house.question.en:'What matters most now?')
 };
}
export function editorialAdvancedReading({contacts,gochara,periods}:{
 contacts:readonly {id:string;planet:string;target:string;aspect:string;applying:string}[];
 gochara:readonly {graha:string;houseFromMoon:number;houseFromLagna:number;bav:number;sav:number}[];
 periods?:readonly {lord:string;level:string;natalHouse:number;ruledHouses:number[]}[]
}){
 const w=contacts[0],v=gochara.find(g=>g.graha==='Saturn')||gochara[0],period=periods?.[0];
 const planet=w?PLANET_COPY[w.planet]:null,target=w?PLANET_COPY[w.target]:null;
 const aspect=w?ASPECT_COPY[w.aspect]:null,vedPlanet=v?PLANET_COPY[v.graha]:null;
 const western=w&&planet&&target&&aspect?l(
  'У західному натальному читанні '+planet.name.uk+' утворює '+aspect.name.uk+' до натального '+target.name.uk+'. Це '+(w.applying==='applying'?'аспект, що наближається до точності':'аспект, що віддаляється від точності')+
  ': він '+aspect.meaning.uk+'. Тут переплітаються питання '+planet.scope.uk+' та '+target.scope.uk+'.',
  'In the Western natal reading, '+planet.name.en+' forms a '+aspect.name.en+' to natal '+target.name.en+'. This contact is '+(w.applying==='applying'?'applying toward exactness':'separating from exactness')+
  ': it '+aspect.meaning.en+'. This links '+planet.scope.en+' with '+target.scope.en+'.'):
  l('Близьких західних транзитних аспектів у вибраному наборі орбісів немає. Тут важливо читати повну натальну структуру, а не приписувати їй подію.',
    'No close Western transits meet the chosen orbs. The natal structure remains the context without inventing an event.');
 const vedic=v&&vedPlanet?l(
  'Ведична гочара додає власний акцент: '+vedPlanet.name.uk+' у '+v.houseFromMoon+'-му домі від натального Місяця й '+v.houseFromLagna+'-му від Лагни. '+
  'Його Бхінна-аштакаварга для поточного знака — '+v.bav+' із 8, а Сарваштакаварга — '+v.sav+'. Порівнюй ці бінду з домами та чинною дашею.',
  'Jyotish adds its own layer: '+vedPlanet.name.en+' in house '+v.houseFromMoon+' from natal Moon and '+v.houseFromLagna+' from Lagna. '+
  'Its Bhinna Ashtakavarga is '+v.bav+' of 8, and the sign Sarvashtakavarga is '+v.sav+'. Read these bindu figures alongside houses and the current dasha.'):
  l('Для ведичної частини потрібна підтверджена гочара.','The Vedic section requires verified gochara.');
 const d=period?l(
  'Чинна '+(period.level==='mahadasha'?'махадаша':'антардаша')+' '+(PLANET_COPY[period.lord]?.name.uk||period.lord)+
    ' підкреслює теми натального '+period.natalHouse+'-го дому'+
    (period.ruledHouses.length?' та управління домами '+period.ruledHouses.join(', '):'')+'. Це триваліший фон сьогоднішнього прочитання.',
  'The current '+(period.level==='mahadasha'?'mahadasha':'antardasha')+' of '+(PLANET_COPY[period.lord]?.name.en||period.lord)+
    ' highlights natal house '+period.natalHouse+
    (period.ruledHouses.length?' and its lordship of houses '+period.ruledHouses.join(', '):'')+
    '. This is the longer backdrop of the current reading.'):null;
 const action=v?houseTheme(v.houseFromLagna).step:l('Уточни одну реальну домовленість і наступну дію.','Clarify one real agreement and its next step.');
 return {
  version:'ASE_V3_DETERMINISTIC' as const,method:'VERIFIED_EVIDENCE_RULED_EDITORIAL_UK_EN_V1',
  paragraphs:[
   {id:'western',text:western,evidenceIds:w?[w.id]:[]},
   {id:'vedic',text:vedic,evidenceIds:v?['V:GOCHARA:'+v.graha]:[]},
   ...(d?[{id:'period',text:d,evidenceIds:['V:DASHA']}]:[])
  ],
  guidance:l('Практичний акцент: '+action.uk+' Зістав це з уже взятими зобов’язаннями.',
    'Practical focus: '+action.en+' Keep it aligned with your existing commitments.')
 };
}
