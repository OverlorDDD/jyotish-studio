/** Original beginner-facing educational reading library, independent of external AI. */
import type {Bilingual} from './yoga-content.js';
export type AcademyTopic='jyotish'|'tarot'|'practice';
export type AcademyLesson={
 slug:string;topic:AcademyTopic;minutes:number;title:Bilingual;description:Bilingual;
 sections:{heading:Bilingual;paragraphs:[Bilingual,Bilingual]}[];
 takeaways:[Bilingual,Bilingual,Bilingual];
 quiz:{prompt:Bilingual;choices:[Bilingual,Bilingual,Bilingual];correct:0|1|2;explanation:Bilingual};
 related:'astrology/jyotish'|'tarot'|'yoga';
};
export const ACADEMY_TOPICS:{id:AcademyTopic;title:Bilingual;subtitle:Bilingual}[]=[
 {id:'jyotish',title:{uk:'Джйотіш і натальні карти',en:'Jyotish & birth charts'},subtitle:{uk:'Традиція, метод і межі інтерпретацій',en:'Tradition, method and interpretive limits'}},
 {id:'tarot',title:{uk:'Символіка Таро',en:'Tarot symbolism'},subtitle:{uk:'Питання, позиції та образи',en:'Questions, positions and images'}},
 {id:'practice',title:{uk:'Йога й уважність',en:'Yoga & mindfulness'},subtitle:{uk:'Усвідомлена практика без міфів',en:'Mindful practice without myths'}}
];
export const ACADEMY_LESSONS:AcademyLesson[]=[
 {slug:'vimshottari-life-cycle',topic:'jyotish',minutes:8,related:'astrology/jyotish',
  title:{uk:'Як читати свій життєвий цикл у Джйотіш',en:'How to understand your Jyotish life cycle'},
  description:{uk:'Махадаша, антардаша й зв’язок періодів із натальною картою: практичний посібник.',en:'Mahadasha, Antardasha and their connection to your birth chart: a practical guide.'},
  sections:[
   {heading:{uk:'Що показує Vimshottari',en:'What Vimshottari describes'},paragraphs:[
    {uk:'У традиції Джйотіш Vimshottari — послідовність планетарних періодів, відлічувана від накшатри натального Місяця. Махадаша — великий цикл, антардаша — його внутрішній підперіод. Кожен із них має власного управителя. Це астрологічна мова часу, а не список неминучих подій.',en:'In Jyotish, Vimshottari is a sequence of planetary periods based on the natal Moon’s nakshatra. A Mahadasha is a major cycle; an Antardasha is its inner subperiod. Each has a planetary lord. This is an astrological language of time, not a list of inevitable events.'},
    {uk:'Дати початку залежать від точної натальної довготи Місяця й обраної тривалості року в календарному методі. Тому дві програми можуть показувати дещо різні дати переходу за однакової карти. Galaxiora відображає використаний метод поряд із розрахунком.',en:'Period dates depend on the exact natal lunar longitude and the year-length convention used by the calendar method. Two programs may therefore produce slightly different changeover dates for the same chart. Galaxiora displays its selected calculation method.'}]},
   {heading:{uk:'Де шукати особистий сенс',en:'Where personal meaning comes from'},paragraphs:[
    {uk:'Почни з управителя поточної махадаші. Подивись, у якому домі стоїть ця планета в D1, якими домами вона керує, з якими планетами взаємодіє і чи підтверджують тему інші частини карти. Антардаша не скасовує загальну тему, але уточнює, де саме ти можеш відчувати її в повсякденних питаннях.',en:'Start with the lord of your current Mahadasha. Examine its D1 house, the houses it rules, its planetary relationships, and whether the rest of the chart supports the theme. The Antardasha does not cancel the main cycle; it refines how the theme may be experienced in everyday life.'},
    {uk:'Наприклад, Сатурн у 9-му домі традиційно спрямовує увагу на дисципліну в освіті, наставництві та довгострокових переконаннях. Якщо підперіодом керує Місяць із 12-го дому, додатковим фокусом може бути потреба у відпочинку й внутрішньому відновленні. Це приклад читання домів, не прогноз для кожної людини із Сатурном і Місяцем.',en:'For example, Saturn in house nine can bring a traditional focus on disciplined study, mentorship and long-range beliefs. If a Moon Antardasha is connected to house twelve, rest and inner restoration may become an additional theme. This illustrates house-based interpretation, not a universal Saturn–Moon prediction.'}]},
   {heading:{uk:'Як застосувати це в Personal',en:'Using your period in Personal'},paragraphs:[
    {uk:'У «Моїй астрологічній основі» знайди поточну махадашу й антардашу. Відкрий «Астрологічний орієнтир на сьогодні»: там рух Місяця додає короткостроковий контекст до довшого циклу. Не потрібно ухвалювати рішення лише через назву планети — перевір факти, можливості й реальні обставини.',en:'Find your Mahadasha and Antardasha in “My astrological foundation”. Open “Today’s astrological orientation” to see how the current Moon provides a shorter-term perspective alongside the larger cycle. Do not make decisions based on a planet’s name alone; check facts, capacity and real circumstances.'},
    {uk:'Для практики обери одну сферу: стосунки, роботу, дім, освіту чи особисті межі. Запиши конкретне спостереження й дату у приватному журналі, а через тиждень перевір, чи справді тема повторювалась. Так ти створюєш власний досвід роботи з традицією без нав’язування готової історії.',en:'Choose one area—relationships, work, home, learning or boundaries. Record a concrete observation and date in your private journal; revisit it a week later to see whether the theme recurred. This builds your own experience with the tradition rather than imposing a ready-made story.'}]}
  ],
  takeaways:[{uk:'Махадаша — великий цикл, антардаша — підперіод.',en:'Mahadasha is the larger cycle; Antardasha is its subperiod.'},
   {uk:'Особисте значення визначають положення й управління домами.',en:'Natal house placements and rulerships provide personal context.'},
   {uk:'Період — інструмент традиційного тлумачення, не гарантія події.',en:'A period is a traditional interpretive tool, not a guaranteed event.'}],
  quiz:{prompt:{uk:'Що уточнює особисту інтерпретацію махадаші?',en:'What refines a personal Mahadasha reading?'},
   choices:[{uk:'Положення й управління планети в натальній карті',en:'The planet’s natal placement and house rulership'},
    {uk:'Лише назва планети',en:'Only the planet’s name'},
    {uk:'Випадкова загальна порада дня',en:'A random generic daily suggestion'}],
   correct:0,explanation:{uk:'Доми й взаємозв’язки планети дають особистий контекст періоду.',en:'Natal houses and planetary relationships add the personal context.'}}
 },

 {slug:'sidereal-and-tropical',topic:'jyotish',minutes:7,related:'astrology/jyotish',
  title:{uk:'Сидеричний і тропічний зодіаки',en:'Sidereal and tropical zodiacs'},
  description:{uk:'Чому знак у двох астрологічних системах може відрізнятися.',en:'Why the same birth data can yield different signs in different traditions.'},
  sections:[
   {heading:{uk:'Дві системи координат',en:'Two frames of reference'},paragraphs:[
    {uk:'Тропічний зодіак прив’язує нуль Овна до весняного рівнодення Північної півкулі. Сидеричний зодіак співвідносять із зоряним тлом. Це різні системи відліку довготи, а не два варіанти однієї й тієї самої цифри.',en:'The tropical zodiac anchors zero Aries to the Northern Hemisphere’s March equinox. A sidereal zodiac is oriented relative to the stellar backdrop. These are different longitude frames, not two labels for an identical number.'},
    {uk:'Через прецесію земної осі обидві точки відліку повільно розходяться. Тому планета може бути в різних знаках за двома системами, навіть коли дата, час і місце народження збігаються.',en:'Due to Earth’s axial precession, the two reference points gradually diverge. A planet may therefore fall into different signs despite identical date, time and birthplace.'}]},
   {heading:{uk:'Що таке аянамша',en:'What is ayanamsha?'},paragraphs:[
    {uk:'Аянамша — кутова різниця між тропічною та обраною сидеричною системами координат. У Джйотіш існує кілька методів її визначення. У нашому калькуляторі використано систему Лахірі.',en:'Ayanamsha is the angular offset between tropical coordinates and a chosen sidereal reference. Several ayanamsha conventions exist within Jyotish. Our calculator uses Lahiri.'},
    {uk:'Щоб порівняння було змістовним, запиши не лише градус планети, а й систему відліку та метод аянамші. Інакше два коректні обчислення можуть виглядати суперечливими.',en:'For a meaningful comparison, record not only the planet’s degrees but also the reference system and ayanamsha method. Otherwise two valid calculations may look contradictory.'}]},
   {heading:{uk:'Число й інтерпретація',en:'Calculation versus interpretation'},paragraphs:[
    {uk:'Астрономічні координати розраховують за ефемеридами, часовим поясом і місцем спостереження. Астрологічні значення знаків — це вже частина культурної традиції тлумачення.',en:'Astronomical positions are computed using ephemerides, time zones and locations. Astrological meanings assigned to signs are a further interpretive step rooted in cultural tradition.'},
    {uk:'Важливо розрізняти перевірювані положення небесних тіл і неперевірені твердження про долю. Натальна карта корисна як спосіб вивчення традиції або символічної рефлексії, але не як гарантований прогноз.',en:'It helps to distinguish verifiable celestial positions from unverified claims about fate. A birth chart can support learning about a tradition or symbolic reflection, not a guaranteed prediction.'}]}
  ],
  takeaways:[{uk:'Враховуй систему відліку.',en:'Always name the zodiac reference frame.'},{uk:'Аянамша пояснює кутове зміщення.',en:'Ayanamsha specifies an angular offset.'},{uk:'Розрахунок і символічний висновок — не одне й те саме.',en:'Calculation is not the same as interpretation.'}],
  quiz:{prompt:{uk:'Що описує аянамша?',en:'What does ayanamsha describe?'},choices:[{uk:'Зміщення між системами відліку',en:'An offset between zodiac frames'},{uk:'Швидкість руху Місяця',en:'The Moon’s speed'},{uk:'Місцевий час народження',en:'The local time of birth'}],correct:0,explanation:{uk:'Аянамша — кутова різниця, зокрема між тропічною та обраною сидеричною системою.',en:'Ayanamsha specifies an angular difference between the tropical and a selected sidereal frame.'}}},
 {slug:'nakshatras',topic:'jyotish',minutes:6,related:'astrology/jyotish',
  title:{uk:'Що таке накшатри',en:'What are nakshatras?'},
  description:{uk:'27 місячних секторів, пади й контекст традиції.',en:'The 27 lunar sectors, padas and their traditional context.'},
  sections:[
   {heading:{uk:'27 частин екліптики',en:'27 divisions of the ecliptic'},paragraphs:[
    {uk:'У багатьох системах Джйотіш зодіак ділять на 27 накшатр. Кожна охоплює 13°20′ довготи. Це рівні сектори обраної сидеричної системи, а не твердження про однакову фізичну відстань до зірок.',en:'Many Jyotish traditions divide the zodiac into 27 nakshatras, each spanning 13°20′ of longitude. These are equal sectors of a chosen sidereal frame, not physically equal distances to stars.'},
    {uk:'Накшатру Місяця визначають за його сидеричною довготою в момент народження. В інших контекстах можна розглядати накшатри інших планет, але правила залежать від традиції.',en:'The Moon’s nakshatra comes from its sidereal longitude at birth. Nakshatras of other planets are also considered in some traditions, depending on the method.'}]},
   {heading:{uk:'Пади — чотири чверті',en:'Four padas per nakshatra'},paragraphs:[
    {uk:'Кожну накшатру поділяють на чотири пади по 3°20′. Отже, 27 × 4 = 108 сегментів кола. Якщо планета стоїть дуже близько до межі, точність часу народження може мати значення для пади.',en:'Each nakshatra contains four padas of 3°20′, giving 27 × 4 = 108 segments. Close to a boundary, the recorded birth time can influence the assigned pada.'},
    {uk:'Назви накшатр містять символіку та міфологічні асоціації. Їх корисно вивчати в історичному й текстовому контексті, а не зводити до «ярлика» особистості.',en:'Nakshatra names carry symbols and mythological associations. Study them in historical and textual context rather than reducing a person to a personality label.'}]},
   {heading:{uk:'Пов’язаний інструмент',en:'A related tool'},paragraphs:[
    {uk:'У Galaxiora Jyotish можна побачити накшатру та паду у розрахованих положеннях планет. Спробуй знайти Місяць та порівняй його знак з накшатрою.',en:'Galaxiora Jyotish displays nakshatra and pada within calculated planetary placements. Find your Moon and compare its zodiac sign with its nakshatra.'},
    {uk:'Калькулятор показує правило та результат для конкретних координат. Це не доказ того, що традиційне трактування визначає характер чи життєві події.',en:'The calculator applies a defined rule to positional data. It does not establish that traditional meanings determine personality or life events.'}]}
  ],
  takeaways:[{uk:'27 накшатр по 13°20′.',en:'27 nakshatras of 13°20′.'},{uk:'Кожна має чотири пади.',en:'Each has four padas.'},{uk:'Місяць у накшатрі визначають за його довготою.',en:'The Moon’s nakshatra follows its longitude.'}],
  quiz:{prompt:{uk:'Скільки пад у кожній накшатрі?',en:'How many padas does each nakshatra have?'},choices:[{uk:'12',en:'12'},{uk:'4',en:'4'},{uk:'27',en:'27'}],correct:1,explanation:{uk:'Кожну накшатру ділять на чотири чверті (пади).',en:'Each nakshatra is divided into four padas.'}}},
 {slug:'divisional-charts',topic:'jyotish',minutes:7,related:'astrology/jyotish',
  title:{uk:'D1, D9 і D10 — різні ракурси карти',en:'D1, D9 and D10: different chart lenses'},
  description:{uk:'Навіщо існують дробові карти й чому важлива точність.',en:'Why divisional charts exist and why precision matters.'},
  sections:[
   {heading:{uk:'Базова карта D1',en:'The foundational D1 chart'},paragraphs:[
    {uk:'D1, або Раші, відображає основні положення планет у дванадцяти знаках і домах. Це вихідний набір координат, з якого за визначеними правилами обчислюють дробові карти.',en:'D1, or Rashi, shows primary planetary placements across twelve signs and houses. It provides the positional input used by defined divisional-chart mapping rules.'},
    {uk:'Для розрахунку потрібні дата, місцевий час, часовий пояс і координати місця народження. Невизначений час може змінити асцендент і будинки.',en:'The calculation uses date, local clock time, time zone and birthplace coordinates. An uncertain birth time can change the ascendant and house placements.'}]},
   {heading:{uk:'Навамша D9',en:'Navamsa D9'},paragraphs:[
    {uk:'D9 ділить кожен знак на дев’ять рівних частин. У традиційних школах Джйотіш Навамшу часто застосовують як додатковий ракурс тем стосунків та дгарми; це символічні категорії, а не вимірювані властивості людини.',en:'D9 divides each sign into nine equal parts. Traditional Jyotish often uses Navamsa as another perspective on relationships and dharma. These are symbolic categories, not measured human traits.'},
    {uk:'Точні градуси важливі: навіть невелика помилка в довготі біля межі сегмента змінить знак у D9. Тому перевіряти треба спершу епоху, часовий пояс і положення в D1.',en:'Precise degrees matter: a small longitude error near a subdivision boundary changes a D9 assignment. Validate time zone and D1 positions before interpreting the derived chart.'}]},
   {heading:{uk:'Дашамша D10',en:'Dashamsa D10'},paragraphs:[
    {uk:'D10 поділяє кожен знак на десять частин і традиційно використовується в роздумах про професійну сферу. Формула відповідності знаків залежить від того, чи вихідний знак парний чи непарний.',en:'D10 divides a sign into ten parts and is traditionally discussed in the context of vocation. Its sign mapping depends on whether the original sign is odd or even.'},
    {uk:'D9 і D10 не містять нових спостережень неба: це математичні перетворення основних довгот. Вони не підтверджують наперед майбутню кар’єру чи шлюб.',en:'D9 and D10 do not add new sky observations; they transform the same base longitudes. They cannot reliably establish a future career or marriage.'}]}
  ],
  takeaways:[{uk:'D1 — первинні положення.',en:'D1 contains primary placements.'},{uk:'D9 — дев’ять частин знака.',en:'D9 divides each sign into nine.'},{uk:'D10 — десять частин знака.',en:'D10 divides each sign into ten.'}],
  quiz:{prompt:{uk:'Звідки беруться координати для D9?',en:'Where do the coordinates for D9 come from?'},choices:[{uk:'З окремої дати',en:'From a different date'},{uk:'Із випадкового вибору',en:'From a random draw'},{uk:'З положень у D1',en:'From positions in D1'}],correct:2,explanation:{uk:'Дробові карти отримують із тих самих початкових довгот за окремим правилом.',en:'Divisional charts map the same base longitudes according to a defined rule.'}}},
 {slug:'tarot-questions',topic:'tarot',minutes:6,related:'tarot',
  title:{uk:'Як формулювати питання до Таро',en:'How to frame a Tarot question'},
  description:{uk:'Запитання для осмислення, а не для втрати власного вибору.',en:'Prompts for reflection without surrendering your decisions.'},
  sections:[
   {heading:{uk:'Від передбачення — до фокусу',en:'From prediction to reflection'},paragraphs:[
    {uk:'Запитання «Що точно станеться?» часто підштовхує до пошуку однієї фатальної відповіді. Практичнішим є питання «На що я можу звернути увагу у цій ситуації?» — воно залишає місце для вибору.',en:'“What will definitely happen?” can lead to a search for a single fixed outcome. “What could I pay attention to in this situation?” leaves room for your decisions.'},
    {uk:'Можна обрати конкретну сферу: межі в спілкуванні, підготовка до розмови, цінності чи наступний крок. Карти тоді працюють як набір образів для роздумів, не як джерело перевірених фактів.',en:'Choose a concrete theme: communication boundaries, preparing for a conversation, values or your next action. Cards then act as imagery for thinking, not verified facts.'}]},
   {heading:{uk:'Позиція має значення',en:'Positions shape a spread'},paragraphs:[
    {uk:'У розкладі на три карти перша позиція може описувати контекст, друга — напруження, третя — можливу дію. Та сама карта в різних позиціях отримує різний акцент.',en:'A three-card spread might use positions for context, tension and a possible action. The same card is read differently depending on its place in the spread.'},
    {uk:'Перш ніж розкладати карти, домовся із собою, що означатиме кожна позиція. Так легше зберегти послідовність і не підганяти трактування під бажану відповідь.',en:'Define your positions before drawing. This helps keep a consistent framework and avoid changing interpretations to fit a preferred answer.'}]},
   {heading:{uk:'Не роби з образу діагноз',en:'Keep symbolic boundaries'},paragraphs:[
    {uk:'Карти не підтверджують стан здоров’я, вагітність, наміри іншої людини чи юридичний результат. Для рішень із ризиком потрібні відповідні фахівці та перевірювані дані.',en:'Cards do not confirm health status, pregnancy, another person’s intentions or legal outcomes. High-stakes decisions require appropriate expertise and verifiable information.'},
    {uk:'Після читання запиши: який образ відгукнувся, чому саме та яку малу дію ти можеш обрати незалежно від результату розкладу.',en:'After a reading, write down which image resonated, why, and what small action you can choose independently of the cards.'}]}
  ],
  takeaways:[{uk:'Питай про свій вибір, не про неминуче.',en:'Ask about choices, not inevitability.'},{uk:'Визнач позиції наперед.',en:'Define positions before drawing.'},{uk:'Не замінюй картами факти й фахівців.',en:'Do not replace evidence or expertise with cards.'}],
  quiz:{prompt:{uk:'Яке питання найкраще підтримує рефлексію?',en:'Which question best supports reflection?'},choices:[{uk:'Чи все точно станеться завтра?',en:'Will it definitely happen tomorrow?'},{uk:'Що я можу помітити перед розмовою?',en:'What can I notice before this conversation?'},{uk:'Який діагноз показують карти?',en:'What diagnosis do the cards show?'}],correct:1,explanation:{uk:'Відкриті запитання залишають рішення за людиною.',en:'Open-ended questions keep the decision with the person.'}}},
 {slug:'tarot-reversals',topic:'tarot',minutes:6,related:'tarot',
  title:{uk:'Прямі й перевернуті карти',en:'Upright and reversed cards'},
  description:{uk:'Чому перевернута карта — не завжди «погана».',en:'Why a reversed card is not automatically “bad”.'},
  sections:[
   {heading:{uk:'Що означає орієнтація',en:'What orientation changes'},paragraphs:[
    {uk:'В одних школах перевернутість означає внутрішній прояв теми, затримку або надмірність. В інших перевернуті карти взагалі не використовують. Обидва підходи — частина практик тлумачення.',en:'Some reading traditions use reversals for an inward expression, delay or excess of a theme. Others do not use reversals at all. Both are interpretive conventions.'},
    {uk:'Наприклад, символ перемоги може в перевернутій позиції підкреслювати невпевненість чи зовнішні очікування. Але сам по собі поворот карти не є доказом реальної події.',en:'For example, an image of recognition might, when reversed, invite reflection on uncertainty or outside expectations. A card’s orientation does not establish a real-world event.'}]},
   {heading:{uk:'Залежність від позиції',en:'Reading in context'},paragraphs:[
    {uk:'Спробуй поєднати три елементи: загальну символіку карти, позицію в розкладі й запитання. Так трактування буде послідовним, а не набором окремих випадкових фраз.',en:'Combine three elements: the card’s central imagery, its spread position, and the question. This produces a more coherent reading than isolated phrases.'},
    {uk:'У Кельтському хресті карта у позиції перешкоди може вказувати на напругу навіть коли вона пряма. Позиція не менш важлива, ніж орієнтація.',en:'In a Celtic Cross, a card in the obstacle position may represent tension even when upright. Position matters at least as much as orientation.'}]},
   {heading:{uk:'Що робити після розкладу',en:'After the spread'},paragraphs:[
    {uk:'Запиши дві інтерпретації символу: більш ресурсну та більш складну. Порівняй, яка з них краще допомагає побачити варіанти дій, а не навішує ярлики на людей.',en:'Write two interpretations of an image: one resource-oriented and one challenging. Notice which helps you see options rather than label people.'},
    {uk:'На Galaxiora можна відкрити класичні ілюстрації та переглянути трактування кожної позиції. Історія розкладів приватна для акаунта.',en:'On Galaxiora you can reveal classic illustrations and review position-specific readings. Saved spread history is private to the signed-in account.'}]}
  ],
  takeaways:[{uk:'Перевернутість — умовний спосіб читання.',en:'Reversals are a reading convention.'},{uk:'Враховуй контекст позиції.',en:'Include the spread position.'},{uk:'Не трактуй її як вирок.',en:'Never treat orientation as a verdict.'}],
  quiz:{prompt:{uk:'Чи означає перевернута карта обов’язково біду?',en:'Does a reversed card always mean something bad?'},choices:[{uk:'Так, завжди',en:'Yes, always'},{uk:'Лише у великому розкладі',en:'Only in large spreads'},{uk:'Ні, це залежить від підходу та контексту',en:'No, it depends on method and context'}],correct:2,explanation:{uk:'У різних школах перевернутість інтерпретують по-різному або не використовують.',en:'Different traditions interpret reversals differently or do not use them.'}}},
 {slug:'mindful-practice',topic:'practice',minutes:7,related:'yoga',
  title:{uk:'Уважність без магічних обіцянок',en:'Mindfulness without magical promises'},
  description:{uk:'Проста практика уваги, межі й доброзичливість до себе.',en:'Attention, boundaries and a practical way to begin.'},
  sections:[
   {heading:{uk:'Уважність — це помічати',en:'Mindfulness means noticing'},paragraphs:[
    {uk:'Практика уважності зазвичай пропонує звертати увагу на теперішній момент: звуки, предмети, дихання або думки. Мета не в тому, щоб думки зникли.',en:'Mindfulness practice commonly invites attention to the present moment: sounds, objects, breathing or thoughts. The aim is not to erase thinking.'},
    {uk:'Якщо увага відволікається, це природно. Помітити відволікання й повернутися до обраного об’єкта — теж частина процесу.',en:'Attention naturally wanders. Recognizing that and gently returning to a chosen anchor is part of the practice.'}]},
   {heading:{uk:'Обирай безпечний об’єкт уваги',en:'Choose a comfortable anchor'},paragraphs:[
    {uk:'Для деяких людей дихання чи сканування тіла можуть бути неприємними. Спробуй слухати звуки або бачити кольори в кімнаті. Очі не обов’язково заплющувати.',en:'Breath focus or body scans may feel uncomfortable to some people. Try listening to sounds or noticing colors in a room. Closing your eyes is optional.'},
    {uk:'Уважність не є заміною лікування. Якщо вправи посилюють тривогу або дискомфорт, зупинись і звернись по підтримку за потреби.',en:'Mindfulness does not replace treatment. Stop if an exercise increases distress and seek support if needed.'}]},
   {heading:{uk:'Спробуй протягом хвилини',en:'Try one minute'},paragraphs:[
    {uk:'Подивись на предмет поруч. Назви для себе три його властивості: колір, форму і поверхню. Потім зверни увагу на те, що чуєш, і повернись до дня.',en:'Look at an object near you. Silently name three features: its color, shape and texture. Then notice one sound before continuing your day.'},
    {uk:'Не оцінюй практику за тим, чи стало «краще». Важливіше помітити свій досвід і вирішити, чи підходить такий формат саме тобі.',en:'Do not grade the exercise by whether you feel “better.” Notice the experience and decide if this approach works for you.'}]}
  ],
  takeaways:[{uk:'Думки можуть виникати — це нормально.',en:'Thoughts are expected.'},{uk:'Обирай комфортний фокус.',en:'Choose a comfortable focus.'},{uk:'За дискомфорту зупинись.',en:'Stop when uncomfortable.'}],
  quiz:{prompt:{uk:'Що робити, коли увага відволікається?',en:'What if your attention wanders?'},choices:[{uk:'М’яко повернутись до фокусу',en:'Gently return to your anchor'},{uk:'Змусити себе не думати',en:'Force all thoughts away'},{uk:'Затримати дихання',en:'Hold your breath'}],correct:0,explanation:{uk:'Відволікання природні; повернення уваги — частина практики.',en:'Wandering is natural; returning is part of the practice.'}}},
 {slug:'yoga-roots-and-safety',topic:'practice',minutes:7,related:'yoga',
  title:{uk:'Йога: традиція та безпечний початок',en:'Yoga: traditions and a safe start'},
  description:{uk:'Асани, пранаяма, медитація й практичні обмеження.',en:'Asana, pranayama, meditation and practical boundaries.'},
  sections:[
   {heading:{uk:'Йога — ширша за пози',en:'Yoga is more than poses'},paragraphs:[
    {uk:'Слово «йога» охоплює різні історичні традиції й методи. У сучасних студіях часто зосереджуються на асанах, але тексти й школи також говорять про етику, зосередження, дихальні практики й медитацію.',en:'Yoga spans different historical traditions and methods. Contemporary classes often emphasize postures, while texts and schools also discuss ethics, concentration, breathing practices and meditation.'},
    {uk:'Тому немає однієї універсальної форми заняття. Практика може бути активною чи споглядальною, а її значення залежить від конкретного контексту.',en:'There is no single universal form of a session. Practice can be active or contemplative, and its meaning depends on context.'}]},
   {heading:{uk:'Почни з малого',en:'Start small'},paragraphs:[
    {uk:'Початківцям краще обирати доступні рухи й поступовий темп. Не потрібно ставати на голову, форсувати дихання чи терпіти біль. Стопи, стілець і опора — повноцінні варіанти для вправ.',en:'Beginners can choose accessible movements and gradual pacing. Headstands, forceful breathing and pushing through pain are unnecessary. Chairs and other supports are valid options.'},
    {uk:'За вагітності, травм або медичних обмежень варто погоджувати рухи з кваліфікованим фахівцем. Інструкції на сайті загальні й не замінюють індивідуального супроводу.',en:'During pregnancy, after injury, or with medical limitations, ask a qualified professional about appropriate modifications. Website instructions are general, not individualized guidance.'}]},
   {heading:{uk:'Поважай власні межі',en:'Respect your limits'},paragraphs:[
    {uk:'М’яка практика може складатися з короткої розминки, усвідомленого дихання без затримок і хвилини відпочинку. Відмова від вправи — теж прояв турботи про себе.',en:'A gentle session might contain a little movement, unforced breathing and a minute of rest. Choosing to stop is also a valid way to care for yourself.'},
    {uk:'У модулі Galaxiora Yoga кроки можна зупиняти, пропускати або виконувати без таймера. Жодне завершення не є медичною рекомендацією чи виміром здоров’я.',en:'In Galaxiora Yoga you can pause, skip or practice without the timer. Finishing is not medical advice or a measure of health.'}]}
  ],
  takeaways:[{uk:'Йога має різні традиції.',en:'Yoga contains diverse traditions.'},{uk:'Не форсуй рухи чи дихання.',en:'Do not force movement or breathing.'},{uk:'Адаптуй практику до себе.',en:'Adapt the practice to your circumstances.'}],
  quiz:{prompt:{uk:'Що найкраще для безпечного старту?',en:'What is a good way to start safely?'},choices:[{uk:'Складні перевернуті пози',en:'Advanced inversions'},{uk:'Легкі рухи без болю й примусу',en:'Gentle movements without pain or strain'},{uk:'Дихання із довгими затримками',en:'Long breath holds'}],correct:1,explanation:{uk:'Поступовість, комфорт і можливість змінювати або припиняти рух — базові принципи.',en:'Gradual pacing, comfort and the freedom to adapt or stop are important principles.'}}}
];
export const academyBySlug=(slug:string)=>ACADEMY_LESSONS.find(item=>item.slug===slug);
