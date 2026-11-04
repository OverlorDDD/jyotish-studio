/** Shared terms for current and future bilingual content. No remote lookups or HTML. */
export type GlossaryLocale='uk'|'en';
export type GlossaryEntry={id:string;uk:string;en:string;forms:string[]};
export const GLOSSARY:GlossaryEntry[]=[
 {id:'lagna',uk:'Лагна — висхідний знак у момент народження; у Джйотіш задає перший дім та будову всієї карти.',en:'Lagna is the rising sign at birth, setting the first house and chart framework.',forms:['лагна','лагни','лагною','лагну','lagna','ascendant','асцендент','асцендента']},
 {id:'navamsa',uk:'Навамша (D9) — дробова карта для глибшого традиційного трактування стосунків, дгарми й зрілості планет.',en:'Navamsha (D9) is a divisional chart used to deepen readings of relationships, dharma and planetary maturity.',forms:['навамша','навамші','навамшу','navamsa','navamsha','d9']},
 {id:'dashamsa',uk:'Дашамша (D10) — дробова карта, що доповнює основну D1 у питаннях професії й суспільної ролі.',en:'Dashamsha (D10) is a divisional chart supplementing D1 in readings of vocation and public roles.',forms:['дашамша','дашамші','дашамшу','dashamsha','dasamsa','d10']},
 {id:'rashi',uk:'Раші (D1) — основна натальна карта Джйотіш, що містить дванадцять знаків і домів.',en:'Rashi (D1) is the main natal Jyotish chart of twelve signs and houses.',forms:['раші','rashi','d1']},
 {id:'nakshatra',uk:'Накшатра — один із 27 місячних зоряних секторів. Накшатра Місяця використовується для відліку даш.',en:'Nakshatra is one of 27 lunar sectors; the Moon’s nakshatra is used to derive dasha periods.',forms:['накшатра','накшатри','накшатру','nakshatra','nakshatras']},
 {id:'dasha',uk:'Даша — традиційний планетний період, який визначає часовий акцент трактування.',en:'Dasha is a traditional planetary period used to time interpretive emphases.',forms:['даша','даші','дашу','dasha']},
 {id:'mahadasha',uk:'Махадаша — великий планетний період системи Вімшоттарі; включає коротші антардаші.',en:'Mahadasha is a major Vimshottari planetary period containing shorter antardashas.',forms:['махадаша','махадаші','махадашу','mahadasha']},
 {id:'antardasha',uk:'Антардаша — підперіод усередині великого планетного періоду (махадаші).',en:'Antardasha is a subperiod within a major mahadasha.',forms:['антардаша','антардаші','антардашу','antardasha']},
 {id:'vimshottari',uk:'Вімшоттарі — система планетних періодів загальною тривалістю 120 років, що відраховується від накшатри Місяця.',en:'Vimshottari is a 120-year sequence of planetary periods calculated from the Moon’s nakshatra.',forms:['вімшоттарі','вимшоттарі','vimshottari']},
 {id:'graha',uk:'Граха — планетний чинник карти Джйотіш: Сонце, Місяць, п’ять класичних планет, Раху або Кету.',en:'Graha is a Jyotish planetary factor: luminaries, five classical planets or lunar nodes.',forms:['граха','грахи','грах','грахою','graha','grahas']},
 {id:'drishti',uk:'Дрішті — астрологічний аспект, тобто традиційний зв’язок планети з домами або іншими планетами.',en:'Drishti is a Jyotish aspect connecting a planet with particular houses or other planets.',forms:['дрішті','дришті','drishti']},
 {id:'house-ruler',uk:'Управитель дому — планета, яка в цій традиції керує знаком дому. Її положення зв’язує теми різних домів.',en:'A house ruler is the planet traditionally governing a sign, linking different life areas.',forms:['управитель дому','управителя дому','управителі домів','управителями домів','house ruler','house lords']},
 {id:'ayanamsha',uk:'Айанамша — кутове зміщення між тропічним і сидеричним зодіаками.',en:'Ayanamsha is the angular offset between tropical and sidereal zodiacs.',forms:['айанамша','айанамші','ayanamsha','ayanamsa']},
 {id:'lahiri',uk:'Лахірі — стандарт айанамші, використаний для сидеричного розрахунку в Galaxiora.',en:'Lahiri is the ayanamsha standard used for Galaxiora sidereal calculations.',forms:['лахірі','lahiri']},
 {id:'rahu',uk:'Раху — північний місячний вузол; у Джйотіш його пов’язують із бажанням і новими досвідами.',en:'Rahu is the north lunar node, traditionally associated with desire and novelty.',forms:['раху','rahu']},
 {id:'ketu',uk:'Кету — південний місячний вузол; у Джйотіш його пов’язують із відстороненням і пошуком сенсу.',en:'Ketu is the south lunar node, associated with detachment and inquiry.',forms:['кету','ketu']},
 {id:'arcana',uk:'Аркан — карта Таро з особливим символічним значенням.',en:'An arcana is a Tarot card with a symbolic meaning.',forms:['аркан','аркани','арканів','arcana','arcanum']},
 {id:'celtic',uk:'Кельтський хрест — класичний розклад Таро з десяти позицій, кожна з яких має власне значення.',en:'Celtic Cross is a ten-position Tarot spread with a meaning for each position.',forms:['кельтський хрест','celtic cross']},
 {id:'pranayama',uk:'Пранаяма — йогічна практика регуляції дихання. Не всі інтенсивні техніки підходять кожному.',en:'Pranayama is yogic breath regulation; intensive exercises may not suit everyone.',forms:['пранаяма','пранаями','pranayama']},
 {id:'asana',uk:'Асана — положення тіла в йозі.',en:'Asana is a yoga posture.',forms:['асана','асани','asana','asanas']},
 {id:'dharma',uk:'Дгарма — в індійських традиціях поняття обов’язку, етичного шляху та належної дії.',en:'Dharma refers to duty, ethical order and proper conduct in Indian traditions.',forms:['дгарма','дгарми','дгарму','dharma']}
,
 {id:"panchanga",uk:"Панчанга — ведичний календар із п’яти показників дня: тітхі, накшатри, вара, йоги та карани.",en:"Panchanga is a Vedic almanac describing the day through five calendar factors.",forms:["панчанга","панчанги","панчангу","panchanga"]},
 {id:"tithi",uk:"Тітхі — один із 30 ведичних місячних днів. Він визначається зміною кута між Сонцем і Місяцем, а не рівно 24 годинами.",en:"Tithi is one of 30 lunar calendar divisions based on the Sun–Moon angular separation.",forms:["тітхі","tithi"]},
 {id:"paksha",uk:"Пакша — половина місячного циклу: шукла (зростання) або крішна (спадання) Місяця.",en:"Paksha is a lunar fortnight: Shukla (waxing) or Krishna (waning).",forms:["пакша","пакші","paksha"]},
 {id:"shukla",uk:"Шукла — світла, зростаюча половина місячного місяця від молодика до повні.",en:"Shukla is the waxing lunar fortnight from new moon to full moon.",forms:["шукла","shukla"]},
 {id:"krishna-paksha",uk:"Крішна-пакша — темна, спадна половина місячного місяця від повні до молодика.",en:"Krishna Paksha is the waning fortnight from full moon to new moon.",forms:["крішна-пакша","krishna paksha"]},
 {id:"vara",uk:"Вара — ведична назва дня тижня, пов’язана з традиційним управителем-планетою.",en:"Vara is the weekday within the traditional Vedic calendar.",forms:["вара","вари","vara"]},
 {id:"nitya-yoga",uk:"Нітья-йога — календарний показник із 27 секторів, який обчислюють за сумою довгот Сонця й Місяця.",en:"Nitya Yoga is one of 27 calendar divisions from the combined longitudes of Sun and Moon.",forms:["нітья-йога","нітья-йоги","нітья йога","nitya yoga"]},
 {id:"karana",uk:"Карана — половина тітхі, календарний інтервал тривалістю 6 градусів різниці довгот Сонця й Місяця.",en:"Karana is half a tithi, representing six degrees of Sun–Moon angular separation.",forms:["карана","карани","karana"]},
 {id:"pada",uk:"Пада — чверть накшатри, один із чотирьох її підрозділів.",en:"Pada is one of four quarters of a nakshatra.",forms:["пада","пади","pada"]},
 {id:"gochara",uk:"Гочара — рух планет по небу та його традиційне тлумачення щодо натальної карти.",en:"Gochara is a planetary transit interpreted in relation to a birth chart.",forms:["гочара","гочари","гочару","gochara"]},
 {id:"sankranti",uk:"Санкранті — момент переходу Сонця з одного сидеричного знака зодіаку в інший.",en:"Sankranti is the Sun crossing from one sidereal zodiac sign to the next.",forms:["санкранті","sankranti"]},
 {id:"muhurta",uk:"Мухурта — традиційний відрізок часу, який застосовують для вибору моменту дії.",en:"Muhurta is a traditional timing interval used when selecting an occasion.",forms:["мухурта","мухурти","мухурту","muhurta"]},
 {id:"abhijit",uk:"Абхіджіт-мухурта — відрізок навколо місцевого сонячного полудня, який традиційно вважають сприятливим, з окремими винятками.",en:"Abhijit Muhurta is a traditional interval around local solar noon, with customary exceptions.",forms:["абхіджіт-мухурта","абхіджіт","abhijit"]},
 {id:"rahu-kalam",uk:"Раху-калам — один із восьми денних інтервалів, який традиція радить враховувати під час вибору часу.",en:"Rahu Kalam is a traditional daytime interval used in timing customs.",forms:["раху-калам","раху калам","rahu kalam"]},
 {id:"yamaganda",uk:"Ямаганда — один із традиційних денних часових інтервалів у Панчанзі.",en:"Yamaganda is one of the traditional daily timing intervals in Panchanga.",forms:["ямаганда","yamaganda"]},
 {id:"gulika",uk:"Гуліка-калам — традиційний денний період, розрахований за тривалістю світлового дня.",en:"Gulika Kalam is a traditional timing period calculated from daylight hours.",forms:["гуліка-калам","гуліка калам","gulika kalam"]},
 {id:"ekadashi",uk:"Екадаші — одинадцятий тітхі зростаючої або спадної половини місячного місяця; день традиційних постів.",en:"Ekadashi is the eleventh tithi of each lunar fortnight, associated with traditional fasting.",forms:["екадаші","ekadashi"]},
 {id:"arunodaya",uk:"Арунодая — досвітній період перед сходом Сонця, важливий для деяких правил Екадаші.",en:"Arunodaya is the pre-dawn period used in certain Ekadashi calendar rules.",forms:["арунодая","арунодаї","arunodaya"]},
 {id:"pradosha",uk:"Прадоша — вечірній період, пов’язаний із тринадцятим тітхі та традиційним вшануванням Шиви.",en:"Pradosha is a twilight observance associated with the thirteenth tithi and Shiva.",forms:["прадоша","прадошу","pradosha"]},
 {id:"trayodashi",uk:"Трайодаші — тринадцятий місячний день у кожній половині циклу.",en:"Trayodashi is the thirteenth tithi of either lunar fortnight.",forms:["трайодаші","trayodashi"]},
 {id:"amavasya",uk:"Амавасья — новий місяць у ведичному календарі; тітхі поблизу астрономічного молодика.",en:"Amavasya denotes the new-moon tithi in the Vedic calendar.",forms:["амавасья","амавасьї","amavasya"]},
 {id:"purnima",uk:"Пурніма — тітхі повні в індійському місячному календарі.",en:"Purnima is the full-moon tithi in the Indian lunar calendar.",forms:["пурніма","пурніми","purnima"]},
 {id:"amanta",uk:"Аманта — спосіб називати місяці, за яким місяць закінчується молодиком.",en:"Amanta is a month-naming system in which the lunar month ends at new moon.",forms:["аманта","amanta"]},
 {id:"purnimanta",uk:"Пурніманта — спосіб називати місяці, за яким місяць закінчується повнею.",en:"Purnimanta is a month-naming system in which the lunar month ends at full moon.",forms:["пурніманта","purnimanta"]},
 {id:"adhika",uk:"Адхіка-маса — додатковий місячний місяць, що виникає для узгодження місячного та сонячного циклів.",en:"Adhika Masa is an intercalary lunar month used to align lunar and solar calendars.",forms:["адхіка-маса","адхіка","adhika masa"]},
 {id:"kshaya",uk:"Кшая-маса — рідкісне пропущення назви місяця в індійських календарних обчисленнях.",en:"Kshaya Masa is a rare skipped month-name occurrence in traditional lunar calendar reckoning.",forms:["кшая-маса","кшая","kshaya masa"]},
 {id:"retrograde",uk:"Ретроградність — видимий із Землі зворотний рух планети на тлі зір; планета фізично не змінює напрям орбіти.",en:"Retrograde motion is an apparent backward movement against the stars, not a planet reversing orbit.",forms:["ретроградність","ретроградного","ретроградний","ретроградно","retrograde"]},
 {id:"sidereal",uk:"Сидеричний зодіак — система знаків, прив’язана до зоряної системи відліку, на відміну від тропічного зодіаку.",en:"Sidereal zodiac uses a stellar reference frame rather than the tropical seasonal reference.",forms:["сидеричний","сидерична","сидеричної","сидеричних","сидеричні","sidereal"]},
 {id:"ephemeris",uk:"Ефемериди — таблиці або математичні моделі точного положення небесних тіл у певний час.",en:"Ephemerides are computed or tabulated positions of celestial bodies over time.",forms:["ефемериди","ефемеридами","ефемерид","ephemeris","ephemerides"]},
 {id:"chandrabala",uk:"Чандрабала — традиційна оцінка положення поточного Місяця щодо натального знака Місяця.",en:"Chandrabala is a traditional comparison of the transiting Moon with the natal Moon sign.",forms:["чандрабала","чандрабали","chandrabala"]},
 {id:"tarabala",uk:"Тарабала — традиційне порівняння транзитної накшатри Місяця з накшатрою народження.",en:"Tarabala compares the current Moon nakshatra with the birth nakshatra.",forms:["тарабала","тарабали","tarabala"]},
 {id:"ashtama",uk:"Аштама-чандра — Місяць у восьмому знаку від натального Місяця за традиційним рахунком.",en:"Ashtama Chandra means the Moon occupies the eighth sign from the natal Moon.",forms:["аштама-чандра","аштама","ashtama chandra"]},
 {id:"parana",uk:"Парана — завершення посту у визначений традиційним календарем час.",en:"Parana is the breaking of a religious fast at its appointed time.",forms:["парана","парани","parana"]},
 {id:"delta-t",uk:"Delta-T — різниця між рівномірним динамічним часом та часом обертання Землі; впливає на історичні астрономічні розрахунки.",en:"Delta-T is the difference between terrestrial dynamical time and Earth-rotation time, relevant to historical astronomy.",forms:["delta-t","дельта-т"]},
 {id:"whole-sign",uk:"Цілознакова система домів — метод, у якому кожен знак зодіаку відповідає одному цілому дому карти.",en:"Whole-sign houses assign each zodiac sign to one entire house.",forms:["whole-sign","цілознакова"]},
];
const forms=GLOSSARY.flatMap(entry=>entry.forms.map(form=>({form,entry}))).sort((a,b)=>b.form.length-a.form.length);
const pattern=new RegExp('(?<![\\p{L}\\p{N}])('+forms.map(x=>x.form).join('|')+')(?![\\p{L}\\p{N}])','giu');
const byForm=new Map(forms.map(item=>[item.form.toLowerCase(),item.entry]));
export function glossaryParts(text:string):{text:string;entry?:GlossaryEntry}[]{
 const parts:{text:string;entry?:GlossaryEntry}[]=[];
 let cursor=0;
 for(const match of text.matchAll(pattern)){
  const offset=match.index||0;
  if(offset>cursor)parts.push({text:text.slice(cursor,offset)});
  parts.push({text:match[0],entry:byForm.get(match[0].toLowerCase())});
  cursor=offset+match[0].length;
 }
 if(cursor<text.length||!parts.length)parts.push({text:text.slice(cursor)});
 return parts;
}
