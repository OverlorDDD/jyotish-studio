/** Original bilingual topical guides: astrology, Tarot and observable astronomy. */
import type {PediaArticle} from './pedia-content';
export const PEDIA_SEO_COSMOS:PediaArticle[]=[
  {
    "slug": "astrology-aspects-angles-guide",
    "category": "western",
    "minutes": 10,
    "title": {
      "en": "Astrology Aspects Explained: Conjunction, Sextile, Square, Trine, Opposition",
      "uk": "Аспекти в астрології: з’єднання, секстиль, квадрат, трин і опозиція"
    },
    "summary": {
      "en": "A five-angle reference with worked ecliptic-longitude examples and a clear distinction between geometry and interpretation.",
      "uk": "П’ять основних кутів із числовими прикладами та чітким розділенням геометрії й традиційного трактування."
    },
    "sections": [
      {
        "title": {
          "en": "Five familiar angular patterns",
          "uk": "П’ять головних кутових співвідношень"
        },
        "paragraphs": [
          {
            "en": "In many Western astrology schools, an aspect is an angular relationship between two planetary positions measured along the zodiac circle. The major aspects are conjunction 0°, sextile 60°, square 90°, trine 120° and opposition 180°. Each name denotes a target angle before an astrologer assigns any symbolic meaning.",
            "uk": "У багатьох школах західної астрології аспект — це кутове співвідношення двох планетних положень уздовж зодіакального кола. Основні аспекти: з’єднання 0°, секстиль 60°, квадрат 90°, трин 120° й опозиція 180°. Кожна назва спочатку визначає геометрію, а вже потім дістає символічне тлумачення."
          },
          {
            "en": "Given ecliptic longitudes 15° and 135°, the smaller circular separation is 120°, an exact trine. Positions 350° and 10° differ by 340° arithmetically, but the smaller circular separation is only 20°, not 340°. Always reduce angular distance around a 360° circle before comparing with an aspect target.",
            "uk": "Для довгот 15° та 135° менша відстань на колі дорівнює 120° — це точний трин. Положення 350° і 10° арифметично різняться на 340°, але менша кутова відстань становить лише 20°. Завжди нормалізуй кут на колі 360° перед порівнянням з аспектами."
          }
        ]
      },
      {
        "title": {
          "en": "How symbolic readings traditionally differ",
          "uk": "Як традиційно відрізняються тлумачення"
        },
        "paragraphs": [
          {
            "en": "Conjunction is usually read as the two factors operating together; sextile as an opening for cooperation; square as friction requiring action; trine as comparatively fluid cooperation; and opposition as a polarity to balance. These are established interpretive conventions of astrology, not measurements of personality or scientific proof of outcomes.",
            "uk": "З’єднання зазвичай трактують як спільну дію чинників; секстиль — як можливість співпраці; квадрат — як напругу, що потребує дій; трин — як відносно природний зв’язок; опозицію — як полярність, яку слід врівноважити. Це конвенції астрологічного трактування, а не вимірювання характеру чи наукове підтвердження подій."
          },
          {
            "en": "The involved planets, natal houses, chart type and the margin from the exact angle all change how an astrologer might read a pattern. For example, a square between two points at 90° is geometrically identical whichever planets are involved, but its traditional symbolic story is not necessarily the same.",
            "uk": "Планети, натальні доми, тип карти й відхилення від точного кута впливають на спосіб прочитання аспекту. Наприклад, квадрат між двома точками з кутом 90° геометрично однаковий незалежно від планет, але його традиційний символічний зміст не обов’язково буде однаковим."
          }
        ]
      },
      {
        "title": {
          "en": "How to check rather than guess",
          "uk": "Як перевіряти, а не вгадувати"
        },
        "paragraphs": [
          {
            "en": "First record the coordinate system: tropical and sidereal longitudes can change sign labels, although relative longitudes for two planets are preserved if the same offset is applied to both. Then calculate the shorter angular separation and the difference from a major aspect. Finally choose and disclose the orb rule used for classification.",
            "uk": "Спочатку визнач систему координат: тропічні й сидеричні довготи можуть давати різні знаки, хоча різниця двох довгот зберігається, якщо до обох застосовано однакове зміщення. Обчисли менший кут між планетами, потім відхилення від основного аспекту й лише тоді вибери та зазнач правило орбісу."
          },
          {
            "en": "Galaxiora's horoscope tools present their own supported calculated facts and interpretations; do not assume every Western natal aspect is implemented simply because this educational guide exists. The next guide explains orbs so you can tell an exact aspect from a loose angular similarity.",
            "uk": "Інструменти гороскопів Galaxiora показують підтримувані факти та їхні тлумачення; не варто вважати, що кожен західний натальний аспект реалізовано лише через появу цієї статті. Наступний матеріал пояснює орбіси, щоб відрізняти точний аспект від приблизної кутової подібності."
          }
        ]
      }
    ],
    "related": [
      "astrology-aspect-orbs",
      "sun-moon-rising-signs-compared"
    ],
    "tool": "horoscope",
    "references": [
      {
        "label": "Astrodienst — definition of astrological aspects",
        "url": "https://www.astro.com/astrowiki/en/Aspect"
      }
    ]
  },
  {
    "slug": "astrology-aspect-orbs",
    "category": "western",
    "minutes": 8,
    "title": {
      "en": "What Is an Orb in Astrology? Exact Aspects and Allowed Deviation",
      "uk": "Що таке орбіс аспекту: точний кут і допустиме відхилення"
    },
    "summary": {
      "en": "How to measure deviation from 60°, 90°, 120° and 180° aspects without confusing the chosen tolerance with an astronomical fact.",
      "uk": "Як виміряти відхилення від 60°, 90°, 120° і 180° та не плутати обраний допуск з астрономічним фактом."
    },
    "sections": [
      {
        "title": {
          "en": "The two numbers behind an aspect label",
          "uk": "Два числа за назвою аспекту"
        },
        "paragraphs": [
          {
            "en": "The target angle defines an aspect type; the orb is the allowed deviation from that angle under a chosen astrological rule. If two objects have a circular separation of 93°, they are 3° away from an exact square of 90°. A system permitting a square with an orb of at least 3° includes that pair; a system permitting only 2° does not.",
            "uk": "Цільовий кут визначає тип аспекту, а орбіс — припустиме відхилення відповідно до вибраного астрологічного правила. Якщо менший кут між об’єктами дорівнює 93°, відхилення від точного квадрата 90° становить 3°. Система з орбісом щонайменше 3° включить цю пару, а система з допуском 2° — ні."
          },
          {
            "en": "An orb is a convention for categorizing aspects, not an instrumental measurement uncertainty in the telescope. The ecliptic longitude may be known very precisely while two interpreters choose different accepted orb limits. Consequently two websites can agree on the sky and still disagree on whether a loose aspect should be displayed.",
            "uk": "Орбіс — це правило класифікації аспектів, а не похибка вимірювального астрономічного приладу. Довгота може бути відома дуже точно, але два астрологи використають різні межі допуску. Тому сайти можуть збігатися в положеннях планет, але не погоджуватися, чи показувати неточний аспект."
          }
        ]
      },
      {
        "title": {
          "en": "Worked examples at sign boundaries",
          "uk": "Приклади поблизу меж знаків"
        },
        "paragraphs": [
          {
            "en": "Suppose one point is at 358° and another at 88°. Their difference is 270°, so the smaller circular separation is 360° − 270° = 90°: an exact square. If the second point instead is 91°, the smaller separation is 93°, and the square's deviation is 3°. The location of the 0° zodiac boundary creates no special exception.",
            "uk": "Нехай одна точка має довготу 358°, а друга — 88°. Різниця становить 270°, тому менший кут на колі — 360° − 270° = 90°, тобто точний квадрат. Якщо друга точка переміститься до 91°, менший кут стане 93°, а відхилення від квадрата — 3°. Перехід через 0° зодіаку не потребує особливого винятку."
          },
          {
            "en": "The same arithmetic works for sextiles, trines and oppositions. For a conjunction near the beginning of the zodiac, positions 359° and 2° are 3° apart rather than 357°. Always evaluate the shortest circular distance; taking an unadjusted subtraction can mislabel aspects near the 0°/360° wrap.",
            "uk": "Ті самі обчислення працюють для секстилів, тринів та опозицій. Для з’єднання на початку зодіаку положення 359° і 2° розділяють 3°, а не 357°. Завжди використовуй найкоротшу відстань на колі: звичайне віднімання без нормалізації дає хибні назви поблизу переходу 0°/360°."
          }
        ]
      },
      {
        "title": {
          "en": "Compare tools by disclosing their rules",
          "uk": "Порівнюй інструменти за правилами"
        },
        "paragraphs": [
          {
            "en": "Before concluding that one program is wrong, check whether both use the same planets, ecliptic reference, aspect list and orb widths. Some traditions vary the orb by planet or by aspect type; others use one constant cutoff. A result should say which policy produced the classification, especially for near-boundary cases.",
            "uk": "Перш ніж назвати програму неправильною, звір перелік планет, зодіакальну систему, набір аспектів та ширину орбісу. Деякі традиції змінюють допуск за планетою чи типом аспекту, інші застосовують єдину межу. Результат має пояснювати використане правило, особливо для прикордонних випадків."
          },
          {
            "en": "Use the Galaxiora horoscope section to explore the calculations it currently supports, and the connected aspects guide for the five major angles. This explanation does not imply that every historical aspect system or every birth-chart configuration is already certified in the product.",
            "uk": "Використовуй розділ гороскопів Galaxiora для доступних розрахунків, а пов’язану статтю — для п’яти головних кутів. Це пояснення не означає, що кожна історична система аспектів або будь-яка конфігурація натальної карти вже сертифікована в нашому продукті."
          }
        ]
      }
    ],
    "related": [
      "astrology-aspects-angles-guide",
      "sidereal-and-tropical"
    ],
    "tool": "horoscope",
    "references": [
      {
        "label": "Astrodienst — definition of astrological aspects",
        "url": "https://www.astro.com/astrowiki/en/Aspect"
      }
    ]
  },
  {
    "slug": "three-card-tarot-spread-examples",
    "category": "tarot",
    "minutes": 9,
    "title": {
      "en": "Three-Card Tarot Spread: Clear Questions and Two Practical Examples",
      "uk": "Розклад Таро на три карти: точні запитання й два практичні приклади"
    },
    "summary": {
      "en": "How to choose positions, interpret combinations, and record a reading without treating the cards as guaranteed future facts.",
      "uk": "Як обрати позиції, розбирати поєднання та записувати трактування без обіцянок достовірного майбутнього."
    },
    "sections": [
      {
        "title": {
          "en": "Positions turn three images into one question",
          "uk": "Позиції пов’язують три образи одним запитанням"
        },
        "paragraphs": [
          {
            "en": "A three-card Tarot spread is a reading structure: the question and the meaning of each position are agreed before drawing cards. One common layout is situation, challenge and next step; another is past, present and possible direction. The positions make the narrative coherent but do not transform shuffled cards into an objective forecast.",
            "uk": "Розклад на три карти — це структура читання: запитання та значення кожної позиції визначають ще до витягування карт. Поширена схема — ситуація, перешкода й наступний крок; інша — минуле, теперішнє й можливий напрямок. Позиції об’єднують сюжет, але не перетворюють випадкові карти на об’єктивний прогноз."
          },
          {
            "en": "Instead of asking 'Will everything go perfectly?', ask 'What is this situation asking me to notice, what complicates it, and which practical action can I take?' Such wording produces a useful reflection even when the reader does not believe in fixed destiny. Avoid questions that delegate safety-critical decisions to card draws.",
            "uk": "Замість «Чи все буде ідеально?» запитай: «На що варто звернути увагу, що ускладнює ситуацію і яку практичну дію я можу виконати?». Таке формулювання допомагає рефлексії навіть без віри в наперед визначену долю. Не передавай картам відповідальність за критичні для безпеки рішення."
          }
        ]
      },
      {
        "title": {
          "en": "Example one: an unfinished project",
          "uk": "Приклад перший: незавершений проєкт"
        },
        "paragraphs": [
          {
            "en": "Imagine a hypothetical draw: Eight of Pentacles in 'situation', Two of Swords in 'challenge' and the Magician in 'next step'. A symbolic reading might say: sustained practice is already present, indecision delays a choice, and the next action is to use the resources at hand. This is one possible interpretation, not an asserted future event.",
            "uk": "Уявімо навчальний витяг: Вісімка Пентаклів на позиції «ситуація», Двійка Мечів — «перешкода», Маг — «наступний крок». Можливе символічне читання: практика вже триває, нерішучість затягує вибір, а наступна дія — застосувати наявні ресурси. Це варіант тлумачення, не твердження про майбутню подію."
          },
          {
            "en": "The useful outcome is a concrete note such as 'Choose the next deliverable by Friday and spend 30 minutes outlining it'. That decision comes from the reader's circumstances rather than an obligation imposed by the card. If the cards seem contradictory, revisit the assigned positions before changing their meanings to force a result.",
            "uk": "Корисний висновок — конкретний запис на кшталт «До п’ятниці обрати наступний результат і присвятити 30 хвилин плануванню». Рішення випливає з реальних обставин людини, а не з наказу карти. Якщо образи суперечать один одному, спочатку перевір позиції, а не підганяй значення під бажану відповідь."
          }
        ]
      },
      {
        "title": {
          "en": "Example two: a difficult conversation",
          "uk": "Приклад другий: складна розмова"
        },
        "paragraphs": [
          {
            "en": "A second hypothetical draw could place Temperance as 'what helps', Five of Wands as 'what interferes' and the Hermit as 'what to prepare'. A reflective reading might favor patience, notice conflicting priorities and suggest privately writing down the main point before speaking. No claim is made about the other person's hidden thoughts.",
            "uk": "Другий умовний приклад: Поміркованість у позиції «що допомагає», П’ятірка Жезлів — «що заважає», Відлюдник — «що підготувати». Рефлексивне читання може підкреслити терпіння, помітити конфлікт інтересів і запропонувати записати головну думку перед розмовою. Воно не розкриває чужих прихованих думок."
          },
          {
            "en": "At Galaxiora you can explore Tarot symbolism in the existing tool and compare it with the Academy lessons on questions and reversed cards. Record the exact question and layout you used; otherwise a later reinterpretation can make any answer seem right. Cards can organize thought, but cannot replace evidence in interpersonal or legal matters.",
            "uk": "У Galaxiora можна дослідити символіку Таро через наявний інструмент і уроки Академії про запитання та перевернуті карти. Запиши точне запитання й схему розкладу, щоб потім не перетлумачувати будь-який результат як правильний. Карти можуть організувати думки, але не замінюють доказів у стосунках чи юридичних питаннях."
          }
        ]
      }
    ],
    "related": [
      "tarot-questions",
      "tarot-reversals"
    ],
    "tool": "tarot",
    "references": [
      {
        "label": "Galaxiora — Tarot methods and interpretation limits",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  },
  {
    "slug": "eclipse-visibility-your-city",
    "category": "astronomy",
    "minutes": 10,
    "title": {
      "en": "Can I See an Eclipse from My City? Visibility, UTC and Safety",
      "uk": "Чи видно затемнення з мого міста: видимість, UTC та безпека"
    },
    "summary": {
      "en": "A practical city-specific visibility checklist covering solar and lunar eclipses, local contact times, daylight and safe observation.",
      "uk": "Практичний алгоритм для міста: тип затемнення, час контакту, горизонт, нічний час і правила безпеки."
    },
    "sections": [
      {
        "title": {
          "en": "The global event is not a local viewing promise",
          "uk": "Глобальна подія не гарантує місцевого спостереження"
        },
        "paragraphs": [
          {
            "en": "An eclipse may occur on a published UTC date yet be entirely invisible from your location. Solar eclipses depend on where the Moon's moving shadow crosses Earth's surface; totality is only visible inside the much narrower umbral path. Lunar eclipses can be seen from the night side of Earth when the Moon is above the horizon.",
            "uk": "Затемнення може відбутися в зазначену дату UTC, але залишитися повністю невидимим із твого міста. Сонячні затемнення залежать від траєкторії рухомої місячної тіні Землею; повну фазу можна побачити тільки у вузькій смузі повної тіні. Місячні затемнення видно з нічної півкулі, коли Місяць над горизонтом."
          },
          {
            "en": "Solar eclipse predictions may list first contact, maximum and last contact in UTC. Convert each instant using the historical or future local time-zone rule for the observing city. A 16:30 UTC contact is 18:30 in a city at UTC+2 but 19:30 at UTC+3; choose the correct offset for the event date.",
            "uk": "Прогноз сонячного затемнення може вказувати початок, максимум і завершення в UTC. Переводь кожен момент за правилами часового поясу міста на дату події. Контакт о 16:30 UTC — це 18:30 за UTC+2, але 19:30 за UTC+3; обирай правильне зміщення саме для дати затемнення."
          }
        ]
      },
      {
        "title": {
          "en": "Local geometry, horizon and cloud cover",
          "uk": "Геометрія, горизонт і хмарність"
        },
        "paragraphs": [
          {
            "en": "Check a trusted geographic eclipse-visibility map, then the Sun or Moon altitude during the contacts and whether it is above a usable horizon. A predicted partial solar eclipse could happen after local sunset and be impossible to observe. Mountains, buildings, cloud cover and haze can prevent viewing even when the astronomical map includes the city.",
            "uk": "Спочатку перевір надійну географічну карту видимості, потім висоту Сонця або Місяця під час контактів і доступність горизонту. Часткова сонячна фаза може відбутися після місцевого заходу Сонця й бути невидимою. Гори, будівлі, хмари й серпанок здатні завадити навіть там, де астрономічна карта позначає видимість."
          },
          {
            "en": "Do not confuse an eclipse calendar with an hourly weather forecast. Astronomical event times can be known years in advance, while local observing conditions require nearer-term weather information. Galaxiora's eclipse calendar is a planning starting point, not a promise of clear sky or certified viewing conditions.",
            "uk": "Не плутай календар затемнень із погодинним прогнозом. Астрономічний час події можна обчислити на роки наперед, але умови спостереження потребують актуального прогнозу погоди. Календар Galaxiora допомагає планувати, але не гарантує ясного неба або сертифікованих умов огляду."
          }
        ]
      },
      {
        "title": {
          "en": "Solar safety cannot be guessed",
          "uk": "Правила захисту очей не можна ігнорувати"
        },
        "paragraphs": [
          {
            "en": "Never look directly at the Sun during a partial or annular eclipse without suitable purpose-made solar viewers meeting applicable safety standards. Ordinary sunglasses, unfiltered cameras, binoculars and telescopes are not safe substitutes. During a total eclipse, the brief total phase has specialized safety guidance and must be confirmed for the exact location and time.",
            "uk": "Не дивись безпосередньо на Сонце під час часткового чи кільцеподібного затемнення без спеціальних захисних окулярів, що відповідають застосовним стандартам. Звичайні сонцезахисні окуляри, неоснащені фільтрами камери, біноклі й телескопи не захищають очі. Навіть для короткої повної фази потрібні окремі правила й точні локальні дані."
          },
          {
            "en": "A lunar eclipse is generally safe to observe with unaided eyes; the dangerous viewing case concerns the Sun. Start with NASA's event maps and safety material, confirm your city's local contact times, and use Galaxiora's eclipse page to explore the calendar context. Never advertise full visibility based solely on a global date.",
            "uk": "Місячне затемнення зазвичай безпечно спостерігати неозброєним оком; небезпечний сценарій пов’язаний із Сонцем. Почни з карт і правил NASA, звір локальні моменти контактів та переглянь календар у Galaxiora. Не оголошуй повну видимість лише на підставі загальносвітової дати."
          }
        ]
      }
    ],
    "related": [
      "moon-phases-and-lunar-calendar",
      "panchanga-time-by-city"
    ],
    "tool": "eclipses/2027",
    "references": [
      {
        "label": "NASA Science — eclipses and the Moon",
        "url": "https://science.nasa.gov/moon/eclipses/"
      },
      {
        "label": "NASA Science — upcoming eclipses and geographic regions",
        "url": "https://science.nasa.gov/eclipses/future-eclipses/"
      },
      {
        "label": "NASA Science — eclipse viewing safety",
        "url": "https://science.nasa.gov/eclipses/safety/"
      }
    ]
  },
  {
    "slug": "lunar-nodes-astronomy-rahu-ketu",
    "category": "astronomy",
    "minutes": 9,
    "title": {
      "en": "What Are Lunar Nodes? Astronomy and Rahu–Ketu Symbolism",
      "uk": "Що таке місячні вузли: астрономія та символіка Раху й Кету"
    },
    "summary": {
      "en": "The two intersections of the lunar orbital plane and ecliptic, eclipse seasons, and their separate role in Jyotish.",
      "uk": "Два перетини площини місячної орбіти з екліптикою, сезони затемнень і окрема роль Раху та Кету."
    },
    "sections": [
      {
        "title": {
          "en": "Where the Moon's orbit crosses the ecliptic",
          "uk": "Де місячна орбіта перетинає екліптику"
        },
        "paragraphs": [
          {
            "en": "The Moon's orbital plane is inclined by about five degrees to the ecliptic, the plane of Earth's orbit around the Sun. The two crossing points are the lunar nodes. At the ascending node the Moon crosses from south to north of the ecliptic; at the descending node it crosses in the opposite direction. A node is a geometric point, not a physical planet.",
            "uk": "Площина орбіти Місяця нахилена приблизно на п’ять градусів до екліптики — площини земної орбіти навколо Сонця. Дві точки перетину називають місячними вузлами. У висхідному вузлі Місяць переходить із південної частини екліптики до північної, у низхідному — навпаки. Вузол — геометрична точка, а не фізична планета."
          },
          {
            "en": "The two points lie opposite one another on the ecliptic by definition. Their positions shift over time as the lunar orbital plane precesses. Some ephemerides provide a mean node and others a true or oscillating node; different conventions need not yield identical degrees at every instant.",
            "uk": "За визначенням ці точки розташовані по протилежні боки екліптики, на відстані 180°. Їхнє положення змінюється, адже площина місячної орбіти прецесує. Одні ефемериди подають середній вузол, інші — істинний або осцилюючий; ці конвенції можуть давати різні градуси для того самого моменту."
          }
        ]
      },
      {
        "title": {
          "en": "Why nodes are related to eclipse seasons",
          "uk": "Чому вузли пов’язані із сезонами затемнень"
        },
        "paragraphs": [
          {
            "en": "New Moon alone does not guarantee a solar eclipse, nor does Full Moon guarantee a lunar eclipse. The Sun and Moon must also be close to the lunar node line for a sufficiently close three-body alignment. This explains why eclipses cluster into seasons rather than occur at every new or full Moon.",
            "uk": "Сам молодик не гарантує сонячного затемнення, а повня — місячного. Сонце й Місяць мають також опинитися поблизу лінії місячних вузлів, щоб виникло достатнє вирівнювання трьох тіл. Саме тому затемнення групуються в сезони, а не стаються під час кожного молодика чи повні."
          },
          {
            "en": "For example, a New Moon far from either node passes north or south of the Sun in the sky and produces no solar eclipse for Earth. A New Moon close enough to the nodal line can cast the Moon's shadow onto Earth. The detailed outcome still depends on three-dimensional geometry and apparent angular sizes.",
            "uk": "Наприклад, під час молодика далеко від вузлів Місяць проходить на небі північніше або південніше Сонця, тож сонячного затемнення не відбувається. Молодик достатньо близько до лінії вузлів може дати місячну тінь на Землі. Конкретний тип визначається тривимірною геометрією та видимими кутовими розмірами."
          }
        ]
      },
      {
        "title": {
          "en": "Rahu and Ketu are symbolic names for nodes",
          "uk": "Раху й Кету — символічні назви вузлів"
        },
        "paragraphs": [
          {
            "en": "In Jyotish the ascending or north node is commonly called Rahu and the descending or south node Ketu, with schools choosing mean or true node conventions. The underlying geometric points are real astronomical constructs; claims about destiny, desire or release associated with them are interpretations rooted in the tradition.",
            "uk": "У Джйотіш висхідний, або північний, вузол зазвичай називають Раху, а низхідний, або південний, — Кету; школи можуть використовувати середні чи істинні вузли. Геометричні точки є реальними астрономічними об’єктами розрахунку, а висновки про долю, бажання чи звільнення належать до традиційної символіки."
          },
          {
            "en": "When comparing chart software, check the node model, zodiac reference and ayanamsha before declaring one system incorrect. The eclipse article explains where the resulting alignments are visible on Earth; the Jyotish chart can then be used to inspect the traditional symbolic placements separately.",
            "uk": "Порівнюючи карти, звір модель вузлів, зодіакальну систему й айанамшу, перш ніж робити висновок про помилку. Стаття про затемнення пояснює, де відповідні вирівнювання видно на Землі, а карта Джйотіш допомагає окремо переглянути традиційні символічні положення."
          }
        ]
      }
    ],
    "related": [
      "eclipse-visibility-your-city",
      "sun-moon-rising-signs-compared"
    ],
    "tool": "astrology/jyotish",
    "references": [
      {
        "label": "NASA Science — eclipse glossary and lunar nodes",
        "url": "https://science.nasa.gov/eclipses/glossary/"
      },
      {
        "label": "NASA Science — eclipses and the Moon",
        "url": "https://science.nasa.gov/moon/eclipses/"
      }
    ]
  }
];
