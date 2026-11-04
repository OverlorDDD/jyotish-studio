/** Original bilingual guides: verified Jyotish chart reading and dasha arithmetic. */
import type {PediaArticle} from './pedia-content';
export const PEDIA_SEO_JYOTISH:PediaArticle[]=[
  {
    "slug": "vedic-ascendant-birth-time",
    "category": "jyotish",
    "minutes": 9,
    "title": {
      "en": "Vedic Ascendant (Lagna): Why Birth Time and Place Matter",
      "uk": "Ведичний асцендент (Лагна): чому важливі час і місце народження"
    },
    "summary": {
      "en": "The rising zodiac degree, time-zone conversion, sensitivity near a sign boundary and a practical input-check workflow.",
      "uk": "Як визначається висхідний градус, чому важливі часовий пояс і точність часу та як перевіряти вихідні дані."
    },
    "sections": [
      {
        "title": {
          "en": "What the Lagna actually measures",
          "uk": "Що саме вимірює Лагна"
        },
        "paragraphs": [
          {
            "en": "Lagna, or the Ascendant, is the ecliptic degree intersecting the eastern horizon at a given time and geographic location. Its sign becomes the reference for houses in many Jyotish chart styles. This is different from the Sun sign or Moon sign: the horizon depends directly on local sidereal time and the observer's latitude.",
            "uk": "Лагна, або асцендент, — це градус екліптики, який перетинає східний горизонт у конкретний момент і для конкретних координат. У багатьох схемах Джйотіш її знак слугує відліком домів. На відміну від положення Сонця чи Місяця, горизонт безпосередньо залежить від місцевого зоряного часу та широти."
          },
          {
            "en": "Earth rotates through approximately 360 degrees of sidereal orientation in one sidereal day. The Ascendant's progression through zodiacal signs is not uniform, especially at higher latitudes. Therefore an expression such as 'one degree every four minutes' is not a universally accurate rule for Lagna; use a real astronomical calculation.",
            "uk": "Земля змінює зоряну орієнтацію приблизно на 360° за одну зоряну добу. Швидкість проходження знаків асцендентом нерівномірна, особливо на високих широтах. Тому правило «один градус кожні чотири хвилини» не є універсально точним для Лагни — потрібен справжній астрономічний розрахунок."
          }
        ]
      },
      {
        "title": {
          "en": "Why seemingly minor input errors matter",
          "uk": "Чому дрібні помилки вводу важливі"
        },
        "paragraphs": [
          {
            "en": "A birth time entered as 08:15 in the wrong UTC offset shifts the astronomical instant by an hour or more. A guessed city can alter the eastern horizon even when both cities use the same official time zone. Near a sign cusp, these mistakes can change the rising sign and the arrangement of houses rather than merely the printed minutes.",
            "uk": "Час народження 08:15 із неправильним зміщенням UTC зміщує астрономічний момент на годину або більше. Вгадане місто змінює положення східного горизонту, навіть якщо обидва міста в одному офіційному поясі. Біля межі знака ці помилки здатні змінити Лагну та розташування домів, а не лише друковані хвилини."
          },
          {
            "en": "For example, if a correct historical local offset was UTC+2 but a form incorrectly assumes UTC+3, 08:15 converts to 06:15 UTC in the first case and 05:15 UTC in the second. This is an example of conversion only; a real chart must use the place's actual historical time-zone rules on that birth date.",
            "uk": "Наприклад, якщо правильне історичне зміщення було UTC+2, а форма помилково взяла UTC+3, то 08:15 відповідає 06:15 UTC у першому випадку й 05:15 UTC у другому. Це лише приклад переведення часу: реальна карта потребує справжніх історичних правил для місця й дати народження."
          }
        ]
      },
      {
        "title": {
          "en": "A reliable verification routine",
          "uk": "Практична процедура перевірки"
        },
        "paragraphs": [
          {
            "en": "Enter the recorded date and time, the birthplace rather than today's residence, and the correct time zone. Inspect the Lagna longitude, not just its sign name. If the time is uncertain by 20–30 minutes, compare alternative charts across that interval; if the sign changes, mark the Ascendant as uncertain instead of claiming a precise result.",
            "uk": "Введи документальну дату й час народження, саме місце народження, а не теперішнього проживання, та відповідний часовий пояс. Перевір не лише назву знака, а й довготу Лагни. Якщо час невідомий із точністю до 20–30 хвилин, порівняй карти для меж цього інтервалу та познач невизначеність, якщо знак змінюється."
          },
          {
            "en": "Use the Galaxiora Jyotish chart calculator to see the placement with the chosen Lahiri sidereal convention. A calculation is an astronomical/coordinate result; any account of temperament, relationships or life outcomes is the tradition's interpretation and cannot recover an unknown birth time.",
            "uk": "Побудуй карту Джйотіш у Galaxiora, щоб побачити положення в обраній сидеричній системі Лахірі. Сам розрахунок є результатом геометрії й системи координат; традиційне тлумачення характеру, стосунків або подій не може «відновити» невідомий час народження."
          }
        ]
      }
    ],
    "related": [
      "sun-moon-rising-signs-compared",
      "sidereal-and-tropical"
    ],
    "tool": "astrology/jyotish",
    "references": [
      {
        "label": "Drik Panchang — Kundali with graha longitudes and Lagna",
        "url": "https://www.drikpanchang.com/jyotisha/kundali/kundali.html?lang=en"
      },
      {
        "label": "Galaxiora — method and calculation conventions",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  },
  {
    "slug": "how-to-read-vedic-d1-chart",
    "category": "jyotish",
    "minutes": 10,
    "title": {
      "en": "How to Read a Vedic D1 Birth Chart: Signs, Houses and Planets",
      "uk": "Як читати ведичну натальну карту D1: знаки, доми й планети"
    },
    "summary": {
      "en": "A step-by-step reading order that avoids confusing fixed signs with houses or treating one symbol as a complete prediction.",
      "uk": "Покроковий порядок читання карти D1 без плутанини між знаками, домами та окремими показниками."
    },
    "sections": [
      {
        "title": {
          "en": "Start with the coordinate framework",
          "uk": "Почни із системи координат"
        },
        "paragraphs": [
          {
            "en": "The D1, often called Rashi or the main natal chart, maps sidereal zodiac positions at birth. A planet has a longitude, which identifies its sign; the Ascendant identifies the chart's rising sign. Chart diagrams can be North Indian or South Indian: the visual placement of a box is not enough to know which sign or house it represents.",
            "uk": "D1, яку часто називають Раші або основною натальною картою, показує сидеричні положення на момент народження. Довгота планети визначає знак, а асцендент — висхідний знак карти. Діаграма може мати північноіндійський чи південноіндійський вигляд: за місцем клітинки без підписів не можна надійно визначити знак або дім."
          },
          {
            "en": "Read the chart legend before making any interpretation: identify Lagna, the 12 signs, graha abbreviations, degree notation and which houses follow from the ascendant. A label 'Su' typically means Surya/Sun, 'Ch' or 'Mo' means Chandra/Moon. Software conventions differ, so never guess an unfamiliar glyph.",
            "uk": "Перед тлумаченням прочитай легенду: знайди Лагну, 12 знаків, скорочення грах, градуси й порядок домів від асцендента. «Su» зазвичай позначає Сур’ю/Сонце, «Ch» або «Mo» — Чандру/Місяць. У різних програмах підписи відрізняються, тому незнайомі символи потрібно звіряти."
          }
        ]
      },
      {
        "title": {
          "en": "Work from observed placements to relationships",
          "uk": "Від положень — до взаємозв’язків"
        },
        "paragraphs": [
          {
            "en": "Consider an illustrative chart with Aries rising, Moon in Taurus and Sun in Gemini. Under a whole-sign house reading, Aries is house one, Taurus house two and Gemini house three. These statements establish positions only; interpreting their significance requires the tradition's house lords, aspects, planetary condition and the wider chart.",
            "uk": "Уявімо навчальну карту з Лагною в Овні, Місяцем у Тельці та Сонцем у Близнюках. У системі цілих знаків Овен буде першим домом, Телець — другим, Близнюки — третім. Це лише геометричні положення; трактування вимагає управителів домів, аспектів, стану планет і повної картини."
          },
          {
            "en": "A responsible sequence is: verify birth data; read Lagna; list planetary signs and degrees; locate the houses; then study rulers and aspects using one consistent school. Finally consider timing systems such as Vimshottari. Skipping to a prediction from an isolated 'planet in house' entry loses context.",
            "uk": "Надійна послідовність така: перевірити народження; знайти Лагну; виписати знаки й градуси планет; визначити доми; вивчити управителів та аспекти в межах однієї школи. Лише потім переходити до часових систем на кшталт Вімшоттарі. Прогноз за одним поєднанням «планета в домі» губить контекст."
          }
        ]
      },
      {
        "title": {
          "en": "Verify D1 before going to D9 or D10",
          "uk": "Перевір D1 перед D9 чи D10"
        },
        "paragraphs": [
          {
            "en": "Divisional charts subdivide the sidereal longitude using additional mathematical rules. They do not replace the D1 and can be highly sensitive to inaccurate birth times. If the underlying Lagna or longitude is uncertain, a highly detailed reading of a more sensitive varga should not masquerade as precise.",
            "uk": "Дробові карти будуються додатковим математичним поділом сидеричної довготи. Вони не замінюють D1 і можуть бути особливо чутливими до неточного часу народження. Якщо вихідна Лагна або довгота невизначена, надзвичайно детальне трактування чутливої варги не варто видавати за точне."
          },
          {
            "en": "Galaxiora's existing Academy lesson compares D1, D9 and D10; read it after inspecting your main chart. Keep a record of the sidereal convention and exact input timestamp if comparing tools. Agreement on the picture alone is weaker evidence than agreement on the numeric longitudes.",
            "uk": "Наявний урок Академії Galaxiora порівнює D1, D9 і D10 — звернися до нього після власної основної карти. Якщо зіставляєш калькулятори, збережи айанамшу та точний момент вводу. Однакова картинка є слабшим доказом точності, ніж збіг числових довгот."
          }
        ]
      }
    ],
    "related": [
      "vedic-ascendant-birth-time",
      "divisional-charts"
    ],
    "tool": "astrology/jyotish",
    "references": [
      {
        "label": "Drik Panchang — Kundali with graha longitudes and Lagna",
        "url": "https://www.drikpanchang.com/jyotisha/kundali/kundali.html?lang=en"
      },
      {
        "label": "Galaxiora — method and calculation conventions",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  },
  {
    "slug": "twelve-vedic-astrology-houses",
    "category": "jyotish",
    "minutes": 11,
    "title": {
      "en": "The 12 Houses in Vedic Astrology: Topics and Reading Method",
      "uk": "12 домів у Джйотіш: значення та правильний порядок читання"
    },
    "summary": {
      "en": "A complete one-page map of houses 1–12 with sign-versus-house distinctions and a worked whole-sign example.",
      "uk": "Зведена схема домів від першого до дванадцятого, відмінність від знаків та навчальний приклад."
    },
    "sections": [
      {
        "title": {
          "en": "Twelve fields measured from Lagna",
          "uk": "Дванадцять сфер відліку від Лагни"
        },
        "paragraphs": [
          {
            "en": "In a common whole-sign Jyotish presentation, house one is the sign containing Lagna, house two is the next sign, and so on around the zodiac. Houses represent domains of traditional life interpretation, while signs describe zodiacal sectors. A person may have Aries as their rising sign without Aries being assigned permanently to house one in every other person's chart.",
            "uk": "У поширеній системі цілих знаків Джйотіш перший дім — знак Лагни, другий — наступний знак і так далі по зодіаку. Доми представляють традиційні сфери життя, а знаки — ділянки зодіакального кола. Овен може бути першим домом однієї карти, але в іншої людини першим буде інший знак."
          },
          {
            "en": "A compact map: 1 self and embodiment; 2 resources and speech; 3 initiative and siblings; 4 home and roots; 5 learning and creativity; 6 routine, service and obstacles; 7 partnership; 8 shared resources and change; 9 worldview and teachers; 10 public work; 11 networks and gains; 12 withdrawal and expenditure.",
            "uk": "Стислий довідник: 1 — особистість і тіло; 2 — ресурси та мовлення; 3 — ініціатива й брати/сестри; 4 — дім і коріння; 5 — навчання та творчість; 6 — повсякденна праця й перешкоди; 7 — партнерство; 8 — спільні ресурси й зміни; 9 — світогляд і вчителі; 10 — суспільна діяльність; 11 — спільноти та здобутки; 12 — усамітнення й витрати."
          }
        ]
      },
      {
        "title": {
          "en": "A concrete worked chart example",
          "uk": "Конкретний приклад розміщення"
        },
        "paragraphs": [
          {
            "en": "Imagine Libra rising. In a whole-sign layout Libra is the first house, Scorpio second, Sagittarius third, Capricorn fourth, Aquarius fifth, Pisces sixth, Aries seventh, Taurus eighth, Gemini ninth, Cancer tenth, Leo eleventh and Virgo twelfth. If the Sun were in Cancer, it would be in the tenth house in this illustrative layout.",
            "uk": "Уявімо Лагну в Терезах. За системою цілих знаків Терези — перший дім, Скорпіон — другий, Стрілець — третій, Козоріг — четвертий, Водолій — п’ятий, Риби — шостий, Овен — сьомий, Телець — восьмий, Близнюки — дев’ятий, Рак — десятий, Лев — одинадцятий, Діва — дванадцятий. Сонце в Раку тоді було б у десятому домі."
          },
          {
            "en": "This does not mean that every Libra-rising person necessarily gets a particular career outcome. The example establishes the house number for a hypothetical position. Interpretation in Jyotish considers house rulers, conjunctions, aspects, dasha timing, strengths and exceptions, and different classical schools may weigh them differently.",
            "uk": "Це не означає, що кожна людина з Лагною в Терезах обов’язково матиме однакову кар’єру. Приклад визначає лише номер дому для умовного положення. Джйотіш також враховує управителів, з’єднання, аспекти, даші, силу й винятки; різні школи можуть зважувати їх по-різному."
          }
        ]
      },
      {
        "title": {
          "en": "Three errors to avoid",
          "uk": "Три типові помилки"
        },
        "paragraphs": [
          {
            "en": "Do not equate the fifth house with Leo or the tenth with Capricorn in every chart; that confuses symbolic analogies with actual house placements. Do not identify a house from the diagram's screen position without reading its chosen style. And do not interpret a life domain from a single house while ignoring the rest of the natal system.",
            "uk": "Не ототожнюй п’ятий дім із Левом або десятий із Козорогом для кожної карти: так плутають символічні аналогії з реальним розташуванням. Не вгадуй номер дому за позицією клітинки без розуміння типу діаграми. І не роби висновків про всю сферу життя за одним домом без інших показників."
          },
          {
            "en": "To practice, enter a chart in Galaxiora and list the sign on each of the twelve houses using the chosen chart layout. Only after you can reproduce that map without looking up ready-made personality descriptions should you explore interpretive patterns in the Academy lessons.",
            "uk": "Для практики побудуй карту в Galaxiora й випиши знак кожного з дванадцяти домів у вибраному стилі діаграми. Лише коли можеш правильно відтворити цю схему без готових описів характеру, переходь до інтерпретаційних поєднань з уроками Академії."
          }
        ]
      }
    ],
    "related": [
      "how-to-read-vedic-d1-chart",
      "sun-moon-rising-signs-compared"
    ],
    "tool": "astrology/jyotish",
    "references": [
      {
        "label": "Galaxiora — method and calculation conventions",
        "url": "https://galaxiora.com/en/methodology"
      },
      {
        "label": "Drik Panchang — Kundali with graha longitudes and Lagna",
        "url": "https://www.drikpanchang.com/jyotisha/kundali/kundali.html?lang=en"
      }
    ]
  },
  {
    "slug": "vimshottari-dasha-start-calculation",
    "category": "jyotish",
    "minutes": 10,
    "title": {
      "en": "How Is the Starting Vimshottari Dasha Calculated?",
      "uk": "Як обчислюють початкову Вімшоттарі-дашу за Місяцем"
    },
    "summary": {
      "en": "The natal nakshatra ruler, the 120-year scheme and a transparent example of remaining mahadasha fraction.",
      "uk": "Управитель накшатри народження, схема 120 років і прозорий приклад залишку махадаші."
    },
    "sections": [
      {
        "title": {
          "en": "The starting ruler comes from the birth Moon",
          "uk": "Початковий управитель визначається Місяцем"
        },
        "paragraphs": [
          {
            "en": "Vimshottari is a traditional Jyotish planetary-period system whose canonical cycle totals 120 dasha years. The natal Moon's position within one of 27 nakshatras identifies the initial mahadasha ruler according to the fixed nakshatra sequence. The other rulers then follow the conventional nine-planet order, not the person's Sun sign.",
            "uk": "Вімшоттарі — традиційна система планетних періодів Джйотіш із канонічним циклом у 120 років даші. Положення натального Місяця в одній із 27 накшатр визначає управителя початкової махадаші за фіксованою послідовністю. Подальші управителі йдуть у традиційному порядку дев’яти планет, а не за знаком Сонця."
          },
          {
            "en": "The standard durations are Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19 and Mercury 17 years. Their sum is 120. These years are part of the chosen dasha calculation convention; converting the balance into calendar dates requires a precisely defined year length and time zone.",
            "uk": "Стандартні тривалості: Кету — 7, Венера — 20, Сонце — 6, Місяць — 10, Марс — 7, Раху — 18, Юпітер — 16, Сатурн — 19, Меркурій — 17 років. Сума становить 120. Це роки конкретної конвенції даші; для переведення залишку в календарні дати треба визначити тривалість року та часовий пояс."
          }
        ]
      },
      {
        "title": {
          "en": "Calculate how much of the first period remains",
          "uk": "Як визначити залишок першого періоду"
        },
        "paragraphs": [
          {
            "en": "Each nakshatra covers 13°20′, or 800 arcminutes. If the Moon is exactly one quarter of the way through its natal nakshatra, three quarters of that ruler's mahadasha remain at birth. For a hypothetical Venus-ruled nakshatra, the balance would be 0.75 × 20 = 15 dasha years. This is arithmetic, not a prediction of an event.",
            "uk": "Кожна накшатра охоплює 13°20′, тобто 800 кутових хвилин. Якщо Місяць у момент народження пройшов рівно чверть своєї накшатри, залишилося три чверті махадаші її управителя. Для умовної накшатри Венери залишок становитиме 0,75 × 20 = 15 років даші. Це арифметика, а не передбачення події."
          },
          {
            "en": "If instead the Moon has reached 600 of the 800 arcminutes, only 200 remain: the fraction is 200/800 = 0.25. For a 20-year Venus period, the birth balance is five dasha years. A calculator needs the exact lunar longitude and specified ayanamsha to obtain this fraction correctly.",
            "uk": "Якщо Місяць пройшов 600 із 800 кутових хвилин, залишилося 200: частка дорівнює 200/800 = 0,25. Для двадцятирічної махадаші Венери залишок при народженні — п’ять років даші. Калькулятор потребує точної довготи Місяця та визначеної айанамші для правильного результату."
          }
        ]
      },
      {
        "title": {
          "en": "Dates and antardashas need another check",
          "uk": "Дати й антардаші потребують додаткової перевірки"
        },
        "paragraphs": [
          {
            "en": "A software display may subdivide the mahadasha into antardashas proportionally. Exact start and end dates should be compared only when both tools use the same birth instant, lunar longitude, ayanamsha, time-zone rules and dasha-year length. Differences in year conventions can accumulate across decades despite identical ruler sequences.",
            "uk": "Програма може додатково поділяти махадашу на антардаші пропорційно їхнім тривалостям. Точні дати початку й завершення можна порівнювати лише за однакового моменту народження, довготи Місяця, айанамші, часових поясів і довжини року даші. Відмінності конвенцій накопичуються за десятиліття навіть за однакового порядку управителів."
          },
          {
            "en": "Galaxiora's Jyotish chart is the correct starting point for examining the Moon and the selected sidereal framework; consult the existing life-cycle lesson for interpretation. The calculation structure is teachable and auditable, while the traditional life-event meanings are a separate interpretive layer.",
            "uk": "У Galaxiora почни з карти Джйотіш, щоб перевірити Місяць і вибрану сидеричну систему; традиційне трактування періодів пояснює наявний урок про життєвий цикл. Математичну структуру можна навчитися перевіряти, а тлумачення життєвих подій належить до окремого традиційного шару."
          }
        ]
      }
    ],
    "related": [
      "vimshottari-life-cycle",
      "nakshatras"
    ],
    "tool": "astrology/jyotish",
    "references": [
      {
        "label": "Galaxiora — method and calculation conventions",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  }
];
