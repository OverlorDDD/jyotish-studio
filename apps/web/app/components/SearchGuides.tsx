import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';

type Paragraph={heading:string;body:string};
type Copy={
 eyebrow:string;heading:string;intro:string;sections:Paragraph[];
 related:string;method:string;learn:string;secondary:string;secondaryHref:string;
};
const jyotish:Record<PortalLocale,Copy>={
 uk:{
  eyebrow:'GALAXIORA · ДЖЙОТІШ',
  heading:'Як побудувати й прочитати ведичну натальну карту',
  intro:'Натальна карта Джйотіш відтворює положення грах у момент народження та розташовує їх відносно лагни — висхідного знака. Тут можна розрахувати карту безкоштовно, а потім розібрати її складові у власному темпі.',
  sections:[
   {heading:'Які дані потрібні для точного розрахунку?',body:'Укажи дату, місцевий час народження та місто. Для місця важливі широта, довгота й правильний часовий пояс з історичними переходами на літній час. Навіть невелика похибка часу здатна змістити лагну або межі дробових карт. Якщо час невідомий, не сприймай розташування домів як точно встановлене.'},
   {heading:'Чим Джйотіш відрізняється від західної астрології?',body:'Galaxiora використовує сидеричні координати з аянамшею Лахірі для ведичної карти; західні матеріали можуть працювати з тропічним зодіаком. Тому знак Місяця в Джйотіш і звичний західний знак Сонця не повинні збігатися. Це різні точки відліку й різні астрологічні підходи.'},
   {heading:'Що показують D1, D9 і D10?',body:'D1, або Раші, — основа натальної карти: лагна, доми та положення грах. D9 (Навамша) уточнює традиційне прочитання сили й напрямку планет; D10 (Дашамша) застосовують для розгляду професійної реалізації. Дробові карти читають разом із D1, а не замість неї.'},
   {heading:'Як пов’язати накшатру й періоди Даша?',body:'Вімшоттарі визначає послідовність планетарних періодів від накшатри натального Місяця. Спочатку розглянь управителя періоду, його положення та управління домами в D1, а вже потім — конкретні теми поточного підперіоду. Так тлумачення залишається прив’язаним до твоєї карти, а не до загальної фрази про планету.'}
  ],
  related:'Дослідити ведичні й західні гороскопи',
  method:'Методологія обчислень Galaxiora',
  learn:'Урок: сидеричний і тропічний зодіаки',
  secondary:'Урок: періоди Вімшоттарі',
  secondaryHref:'pedia/vimshottari-life-cycle'
 },
 en:{
  eyebrow:'GALAXIORA · JYOTISH',
  heading:'How to calculate and understand a Vedic birth chart',
  intro:'A Jyotish birth chart places the grahas at the moment of birth and relates them to the Lagna, or rising sign. Calculate your chart for free here, then explore each part at your own pace.',
  sections:[
   {heading:'What birth details make a calculation reliable?',body:'Enter the birth date, local clock time and birthplace. Latitude, longitude and historical time-zone and daylight-saving rules all matter. Even a small uncertainty in birth time can affect the Ascendant or divisional chart boundaries. If the time is unknown, treat house placements as uncertain rather than exact.'},
   {heading:'Why can Jyotish and Western zodiac signs differ?',body:'Galaxiora uses sidereal positions with Lahiri ayanamsha for its Vedic chart, while Western material may use the tropical zodiac. Your Vedic Moon sign and familiar Western Sun sign therefore need not match: they represent different bodies and different frames of reference.'},
   {heading:'What are D1, D9 and D10 charts?',body:'D1, the Rashi chart, is the natal foundation for signs, houses and grahas. D9, the Navamsha, enriches traditional interpretation of planetary strength and direction. D10, the Dashamsha, is used when exploring professional expression. Read divisional charts with D1, never as a substitute for it.'},
   {heading:'How are nakshatras and Dashas connected?',body:'Vimshottari begins from the nakshatra occupied by the natal Moon and unfolds through planetary periods. Read the period ruler in its natal sign, house and rulership context before interpreting a subperiod. That keeps the reading grounded in an individual chart rather than a generic planetary slogan.'}
  ],
  related:'Explore Western and Vedic horoscopes',
  method:'Our calculation methodology',
  learn:'Lesson: sidereal and tropical zodiacs',
  secondary:'Lesson: Vimshottari life periods',
  secondaryHref:'pedia/vimshottari-life-cycle'
 }
};
const panchanga:Record<PortalLocale,Copy>={
 uk:{
  eyebrow:'GALAXIORA · ПАНЧАНГА',
  heading:'Панчанга: як читати ведичний календар для свого міста',
  intro:'Панчанга описує ритм традиційного ведичного дня через п’ять анг — тітхі, накшатру, вару, нітя-йогу й карану. Вибери дату та місто в калькуляторі вище: час сходу Сонця й переходів залежить від місцевості.',
  sections:[
   {heading:'Тітхі — місячна доба',body:'Тітхі визначається зміною кутової відстані між Місяцем і Сонцем на кожні 12°. Вона не дорівнює 24 календарним годинам: початок і закінчення можуть припадати на будь-який момент місцевої доби. Шукла-пакша відповідає зростанню Місяця, Крішна-пакша — спаданню.'},
   {heading:'Накшатра — ділянка місячного шляху',body:'Традиційний зодіак ділять на 27 накшатр по 13°20′. Положення Місяця серед них підказує, яка накшатра діє на обраний момент. Значення її образу та управителя застосовують у традиційному тлумаченні; точний момент переходу обчислюється окремо.'},
   {heading:'Вара, йога й карана',body:'Вара — день тижня, що в Панчанзі пов’язаний із місцевим сходом Сонця. Нітя-йогу визначають за сумою сидеричних довгот Сонця і Місяця у відрізках 13°20′. Карана — половина тітхі, тобто кожен приріст кутової різниці на 6°. Ці елементи описують різні сторони одного дня.'},
   {heading:'Чому важливі місто й часовий пояс?',body:'Один і той самий перехід має єдиний астрономічний момент, але відображається як різний місцевий час. Схід Сонця в Києві, Лондоні й Делі також відбувається в різний час, тому календарний запис дня змінюється залежно від обраних координат. Обирай місцевість, де плануєш подію чи практику.'}
  ],
  related:'Дослідити гороскопи',
  method:'Як ми розраховуємо календар',
  learn:'Урок: накшатри та місячний шлях',
  secondary:'Урок: сидеричний і тропічний зодіаки',
  secondaryHref:'pedia/sidereal-and-tropical'
 },
 en:{
  eyebrow:'GALAXIORA · PANCHANGA',
  heading:'How to read Panchanga for your city',
  intro:'Panchanga describes a traditional Vedic day through five limbs: Tithi, Nakshatra, Vara, Nitya Yoga and Karana. Choose a date and city in the calculator above. Sunrise and transition times depend on location.',
  sections:[
   {heading:'Tithi — the lunar day',body:'A Tithi covers each 12° change in the angular separation of the Moon and Sun. It is not a fixed 24-hour civil day: its start and end can occur at any local time. Shukla Paksha is the waxing half of the lunar cycle; Krishna Paksha is the waning half.'},
   {heading:'Nakshatra — a division of the lunar path',body:'The traditional zodiac is divided into 27 Nakshatras of 13°20′ each. The Moon’s sidereal position determines the Nakshatra for a given instant. Its symbolism and planetary ruler belong to traditional interpretation; the actual boundary time is calculated separately.'},
   {heading:'Vara, Nitya Yoga and Karana',body:'Vara is the weekday associated with local sunrise in Panchanga reckoning. Nitya Yoga uses the sum of the Sun’s and Moon’s sidereal longitudes in divisions of 13°20′. Karana is half a Tithi, corresponding to every 6° increment in their angular separation. Each limb describes a different dimension of the same day.'},
   {heading:'Why do city and time zone matter?',body:'An astronomical transition occurs at one instant, but appears at different local clock times around the world. Sunrise also differs between Kyiv, London and Delhi, so the calendar entry for a given civil date can vary by location. Select the place where you intend to observe the event or practice.'}
  ],
  related:'Explore horoscopes',
  method:'How our calendar is calculated',
  learn:'Lesson: Nakshatras and the lunar path',
  secondary:'Lesson: sidereal and tropical zodiacs',
  secondaryHref:'pedia/sidereal-and-tropical'
 }
};
function Guide({locale,copy,subject}:{locale:PortalLocale;copy:Record<PortalLocale,Copy>;subject:'jyotish'|'panchanga'}){
 const c=copy[locale],prefix='/'+locale+'/';
 const lesson=subject==='jyotish'?'pedia/sidereal-and-tropical':'pedia/nakshatras';
 return <section className="as-wellness as-academy-detail" aria-label={c.heading} data-testid={'r33-'+subject+'-guide'}>
  <header className="as-wellness-section-header">
   <span className="as-overline">{c.eyebrow}</span>
   <h2>{c.heading}</h2><p>{c.intro}</p>
  </header>
  <div className="as-lesson-sections">{c.sections.map(x=><section className="as-lesson-section" key={x.heading}>
   <h3>{x.heading}</h3><p>{x.body}</p>
  </section>)}</div>
  <nav aria-label={locale==='uk'?'Корисні матеріали':'Further reading'}>
   {subject==='jyotish'&&<p><Link href={prefix+'astrology/moon-sign-vs-sun-sign'}>{locale==='uk'?'Чому ведичний знак Місяця відрізняється від західного знака Сонця?':'Why your Vedic Moon sign differs from your Western Sun sign'}</Link></p>}
   <p><Link href={prefix+lesson}>{c.learn}</Link></p>
   <p><Link href={prefix+c.secondaryHref}>{c.secondary}</Link></p>
   <p><Link href={prefix+'methodology'}>{c.method}</Link></p>
   <p><Link href={prefix+'horoscope'}>{c.related}</Link></p>
  </nav>
 </section>;
}
export const JyotishSearchGuide=({locale}:{locale:PortalLocale})=><Guide locale={locale} copy={jyotish} subject="jyotish"/>;
export const PanchangaSearchGuide=({locale}:{locale:PortalLocale})=><Guide locale={locale} copy={panchanga} subject="panchanga"/>;
