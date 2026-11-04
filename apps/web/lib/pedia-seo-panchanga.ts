/** Original GalaxiPedia long-form SEO reference: Panchanga cluster, edited EN + UK. */
import type {PediaArticle} from './pedia-content';
export const PEDIA_SEO_PANCHANGA:PediaArticle[]=[
  {
    "slug": "what-is-tithi-lunar-day",
    "category": "panchanga",
    "minutes": 9,
    "title": {
      "en": "What Is a Tithi? How a Lunar Day Is Calculated",
      "uk": "Що таке тітхі: як обчислюють місячний день"
    },
    "summary": {
      "en": "A worked 12-degree example, the difference from a civil day, and why the end time changes from one date to another.",
      "uk": "Приклад обчислення через 12°, відмінність від календарної доби та пояснення нерівномірної тривалості тітхі."
    },
    "sections": [
      {
        "title": {
          "en": "A lunar angle, not a 24-hour date",
          "uk": "Місячний кут, а не 24-годинна дата"
        },
        "paragraphs": [
          {
            "en": "A tithi is one thirtieth of the synodic lunar cycle in the traditional Panchanga. Rather than starting at midnight, each tithi starts when the apparent ecliptic longitude of the Moon minus that of the Sun crosses a successive multiple of 12 degrees. These boundaries are moments in time, not blocks of 24 clock hours.",
            "uk": "У традиційній Панчанзі тітхі — одна тридцята синодичного місячного циклу. Він починається не опівночі, а тоді, коли різниця екліптичних довгот Місяця й Сонця перетинає чергову межу, кратну 12 градусам. Це моменти переходу, а не обов’язково 24-годинні проміжки."
          },
          {
            "en": "Suppose the Moon has longitude 108° and the Sun 90° in a consistent coordinate system. Their separation is 18°, inside the second tithi, whose interval is 12° up to but not including 24°. When that separation reaches 24°, the third tithi begins; the example gives an angle, not a real-time forecast for today.",
            "uk": "Наприклад, довгота Місяця становить 108°, Сонця — 90° в одній системі координат. Різниця 18° відповідає другому тітхі: його межі від 12° до менш ніж 24°. Коли різниця досягне 24°, розпочнеться третій тітхі. Це навчальний приклад, а не прогноз на сьогодні."
          }
        ]
      },
      {
        "title": {
          "en": "Why a tithi can be short or long",
          "uk": "Чому тривалість тітхі змінюється"
        },
        "paragraphs": [
          {
            "en": "Both bodies move along the ecliptic, and the Moon’s angular speed is not constant. The time needed for the Moon–Sun separation to increase by 12° therefore varies; a tithi can begin and end during the same civil date or span parts of two dates. Thirty tithis make one complete cycle of elongation, but they are not thirty equal solar days.",
            "uk": "І Місяць, і Сонце змінюють екліптичну довготу, а кутова швидкість Місяця нерівномірна. Через це час, потрібний для зміни різниці на 12°, не є сталим: тітхі може початися та закінчитися в межах однієї цивільної дати або охопити частини двох дат. Тридцять тітхі не дорівнюють тридцяти однаковим добам."
          },
          {
            "en": "The name shown for a festival date may also follow a sunrise-based observance convention. That is a separate question from asking which tithi is astronomically active at 14:00. A reliable calendar should make the selected tradition and its local transition times visible instead of using one daily label as though nothing changes.",
            "uk": "Назва тітхі, визначена для дати свята, може залежати від традиційного правила сходу Сонця. Це інше запитання, ніж «який тітхі триває о 14:00». Коректний календар має показувати вибрану традицію й локальні переходи, а не створювати враження, що показник незмінний протягом доби."
          }
        ]
      },
      {
        "title": {
          "en": "How to read it in Galaxiora",
          "uk": "Як перевірити тітхі в Galaxiora"
        },
        "paragraphs": [
          {
            "en": "Choose your city and a date in Panchanga, then inspect the current tithi together with its end time. If you plan an activity in the afternoon, check whether a transition happens before it starts. Compare with the nakshatra and other relevant calendar factors; a tithi by itself cannot certify the whole occasion.",
            "uk": "Обери місто й дату в Панчанзі, після чого переглянь активний тітхі та час його завершення. Для запланованої на день справи перевір, чи не відбудеться перехід раніше її початку. Зістав тітхі з накшатрою та іншими потрібними чинниками: один показник не сертифікує всю подію."
          },
          {
            "en": "Write down the civil date, local time zone, tithi number and transition instant if you compare two websites. A mismatch between local display times may be a time-zone difference rather than an astronomical disagreement. The site’s practical advantage is a city-specific display, not a promise that the symbolic interpretation is scientifically predictive.",
            "uk": "Під час порівняння двох сайтів запиши цивільну дату, часовий пояс, номер тітхі та момент переходу. Різниця в показаних годинах інколи пов’язана з часовими поясами, а не з розбіжністю астрономічних розрахунків. Перевага нашого інструмента — прив’язка до міста, а не наукова гарантія символічного прогнозу."
          }
        ]
      }
    ],
    "related": [
      "panchanga-five-limbs-explained",
      "moon-phases-and-lunar-calendar"
    ],
    "tool": "panchanga",
    "references": [
      {
        "label": "Galaxiora — Panchanga calculation methodology",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  },
  {
    "slug": "rahu-kalam-calculation",
    "category": "panchanga",
    "minutes": 10,
    "title": {
      "en": "Rahu Kalam: Meaning, Weekday Rule and Local Time Example",
      "uk": "Раху-калам: значення, правила днів тижня й приклад розрахунку"
    },
    "summary": {
      "en": "The eight-part daylight method, weekday positions, a numerical example, and why one universal Rahu Kalam time is wrong.",
      "uk": "Поділ світлового дня на вісім частин, правила за днями тижня, числовий приклад і локальні часові межі."
    },
    "sections": [
      {
        "title": {
          "en": "One of eight daylight intervals",
          "uk": "Один із восьми інтервалів світлового дня"
        },
        "paragraphs": [
          {
            "en": "Rahu Kalam is a traditionally avoided period for initiating certain activities in a number of Hindu calendrical customs. It is determined from local sunrise and sunset, not a fixed number of hours after midnight. Divide the duration from sunrise to sunset into eight equal segments; one segment receives the Rahu Kalam label according to the weekday.",
            "uk": "Раху-калам — проміжок, якого в низці індійських календарних традицій намагаються уникати для початку певних справ. Його визначають від місцевого сходу до заходу Сонця, а не від фіксованої години після півночі. Тривалість світлового дня ділять на вісім однакових частин; вибір сегмента залежить від дня тижня."
          },
          {
            "en": "The conventional segment numbers, counting from sunrise, are Monday 2, Saturday 3, Friday 4, Wednesday 5, Thursday 6, Tuesday 7 and Sunday 8. This is a traditional assignment, not a model of a physical harmful influence. The other seven segments are not thereby automatically certified favorable for all activities.",
            "uk": "Поширене правило номерів від сходу Сонця: понеділок — 2, субота — 3, п’ятниця — 4, середа — 5, четвер — 6, вівторок — 7, неділя — 8. Це традиційний календарний розподіл, а не доведений фізичний шкідливий вплив. Решта семи частин дня від цього не стають автоматично сприятливими для будь-яких справ."
          }
        ]
      },
      {
        "title": {
          "en": "Worked example without pretending to know today's sky",
          "uk": "Навчальний приклад без вигаданого прогнозу"
        },
        "paragraphs": [
          {
            "en": "Assume sunrise is 06:00 and sunset is 18:00 at a hypothetical location. The day lasts 12 hours, or 720 minutes. Dividing by eight produces segments of 90 minutes. On a Monday the second segment is 07:30–09:00; on a Sunday the eighth is 16:30–18:00. These numbers are illustrative only.",
            "uk": "Припустімо, що для умовного міста схід Сонця — о 06:00, захід — о 18:00. Світловий день триває 12 годин, або 720 хвилин. Поділ на вісім дає інтервали по 90 хвилин. У понеділок другий сегмент — 07:30–09:00, у неділю восьмий — 16:30–18:00. Це лише навчальні числа."
          },
          {
            "en": "If sunrise instead occurs at 07:10 and sunset at 16:50, daylight lasts 580 minutes and each eighth is 72 minutes 30 seconds. The weekday rule stays the same, but the displayed clock time changes dramatically. Therefore copying a table prepared for Delhi into a Ukrainian calendar would be a methodological error.",
            "uk": "Якщо схід Сонця о 07:10, а захід о 16:50, світловий день становить 580 хвилин, а одна восьма — 72 хвилини 30 секунд. Номер сегмента за днем тижня не зміниться, але його години будуть зовсім іншими. Переносити таблицю для Делі до українського календаря без перерахунку — методична помилка."
          }
        ]
      },
      {
        "title": {
          "en": "How to use the interval responsibly",
          "uk": "Як застосовувати інтервал"
        },
        "paragraphs": [
          {
            "en": "Use Panchanga to get the sunrise and sunset for your selected location and date and inspect the available timing guidance. Rahu Kalam is one rule in a larger traditional context; for specialized ceremonies, other mandatory checks may apply. An unknown or unsupported rule should be displayed as unverified rather than silently called favorable.",
            "uk": "У Панчанзі обери місто й дату, знайди місцеві схід і захід Сонця та переглянь доступні часові підказки. Раху-калам — лише одне правило в ширшій традиції; для спеціальних церемоній існують додаткові перевірки. Якщо правило не реалізовано, його слід позначати як неперевірене, а не називати час сприятливим."
          },
          {
            "en": "Traditional avoid/choose labels are cultural interpretations. For real-world appointments, safety, medical care or emergency decisions, rely on practical constraints and professional guidance, not a single calendar segment. The educational calculation is reproducible; the claimed influence of Rahu Kalam is not an established scientific finding.",
            "uk": "Традиційні позначки «уникати» чи «обирати» є культурним тлумаченням. Для безпеки, лікування або невідкладних рішень спирайся на практичні умови й фахові поради, а не лише на сегмент календаря. Сам розрахунок відтворюваний; вплив Раху-калам не є науково встановленим фактом."
          }
        ]
      }
    ],
    "related": [
      "panchanga-five-limbs-explained",
      "panchanga-time-by-city"
    ],
    "tool": "panchanga",
    "references": [
      {
        "label": "Drik Panchang — Rahu Kalam and weekday segments",
        "url": "https://www.drikpanchang.com/panchang/rahu-kaal.html"
      },
      {
        "label": "US Naval Observatory — rise, set and twilight definitions",
        "url": "https://aa.usno.navy.mil/faq/RST_defs"
      }
    ]
  },
  {
    "slug": "panchanga-time-by-city",
    "category": "panchanga",
    "minutes": 9,
    "title": {
      "en": "Why Panchanga Times Differ Between Cities and Time Zones",
      "uk": "Чому час Панчанги різниться між містами та часовими поясами"
    },
    "summary": {
      "en": "A practical guide to astronomical instants, sunrise rules, DST, and avoiding incorrect copy-and-paste calendars.",
      "uk": "Практичне пояснення астрономічного моменту, місцевого сходу Сонця, літнього часу та помилок перенесення календарів."
    },
    "sections": [
      {
        "title": {
          "en": "The same instant can have different clock labels",
          "uk": "Один момент — різні покази годинника"
        },
        "paragraphs": [
          {
            "en": "A lunar transition such as a tithi boundary is one astronomical instant. It may be displayed as 09:00 UTC, 11:00 in a UTC+2 city and 14:30 in an UTC+5:30 city on the same date. The event has not shifted between the cities; only the representation in civil time has changed. Dates may differ near midnight.",
            "uk": "Перехід тітхі — один астрономічний момент. Його можна показати як 09:00 UTC, 11:00 у місті з UTC+2 та 14:30 у місті з UTC+5:30 тієї самої дати. Сам перехід не пересувався між містами; змінився тільки запис за місцевим годинником. Поблизу півночі може різнитися навіть дата."
          },
          {
            "en": "Never infer a time-zone offset from a country's name alone. Historical and seasonal daylight-saving rules are location-specific and change over time. A birth chart or festival calendar using a guessed UTC offset can be wrong despite otherwise correct planetary longitude calculations.",
            "uk": "Не визначай часовий пояс лише за назвою країни. Історичні та сезонні правила літнього часу залежать від міста й дати та можуть змінюватися. Натальна карта або календар свята з вгаданим зміщенням UTC може бути неправильним навіть за коректних довгот планет."
          }
        ]
      },
      {
        "title": {
          "en": "Sunrise-dependent rules truly vary by place",
          "uk": "Правила від сходу Сонця справді залежать від місця"
        },
        "paragraphs": [
          {
            "en": "Other Panchanga quantities are not just displayed in different time zones: they are defined from local events. Sunrise-based weekday attribution, the eight daylight divisions behind Rahu Kalam and certain observance rules depend on sunrise at that location. Geographic latitude and longitude affect the local horizon timing.",
            "uk": "Інші дані Панчанги не просто відображаються за різними поясами: вони залежать від місцевих подій. Прив’язка календарного дня до сходу Сонця, поділ денного часу для Раху-калам і деякі правила свят залежать від фактичного сходу Сонця у вибраній точці. На нього впливають широта й довгота."
          },
          {
            "en": "For example, two cities may share the same official UTC offset but have different solar noon and sunrise because they lie far apart in longitude. Consequently their Rahu Kalam intervals do not have identical boundaries. Polar regions can also have days without ordinary sunrise or sunset, which requires an explicit unavailable-rule state.",
            "uk": "Наприклад, два міста можуть мати однаковий офіційний часовий пояс, але різний сонячний полудень і схід Сонця через віддаленість за довготою. Тому межі Раху-калам не збігатимуться. У полярних районах бувають дати без звичайного сходу чи заходу Сонця — такі правила потребують явного статусу «недоступно»."
          }
        ]
      },
      {
        "title": {
          "en": "A repeatable comparison checklist",
          "uk": "Контрольний список порівняння"
        },
        "paragraphs": [
          {
            "en": "When comparing two calendars, match the city coordinates, date, local IANA time zone, calculation framework (sidereal and ayanamsha where relevant) and the convention used for festivals. Only after these settings agree does a difference in transitions suggest an implementation defect.",
            "uk": "Порівнюючи два календарі, звір координати міста, дату, часовий пояс IANA, систему розрахунку (сидеричну та айанамшу, де це потрібно) і традиційні правила свят. Лише після узгодження цих налаштувань розбіжність у переходах може свідчити про помилку алгоритму."
          },
          {
            "en": "On Galaxiora select a city instead of copying another website's timetable. Record the active tithi and nakshatra, their next transition, sunrise and the displayed time-zone information. If you travel, recalculate for the destination rather than translating every interval by a fixed number of hours.",
            "uk": "У Galaxiora обирай місто, а не копіюй таблицю з іншого сайту. Записуй тітхі й накшатру, найближчі переходи, схід Сонця та часовий пояс. Якщо подорожуєш, перерахуй інтервали для пункту призначення замість механічного додавання кількох годин до чужого розкладу."
          }
        ]
      }
    ],
    "related": [
      "rahu-kalam-calculation",
      "what-is-tithi-lunar-day"
    ],
    "tool": "panchanga",
    "references": [
      {
        "label": "US Naval Observatory — rise, set and twilight definitions",
        "url": "https://aa.usno.navy.mil/faq/RST_defs"
      },
      {
        "label": "Galaxiora — Panchanga calculation methodology",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  },
  {
    "slug": "nakshatra-today-location-guide",
    "category": "panchanga",
    "minutes": 8,
    "title": {
      "en": "Today's Nakshatra: Find the Lunar Mansion and Its Transition",
      "uk": "Накшатра сьогодні: як знайти місячний сектор і час переходу"
    },
    "summary": {
      "en": "A city-aware approach to the Moon's 27 sidereal sectors, exact transitions and how this differs from Moon sign.",
      "uk": "Як знайти одну з 27 сидеричних накшатр, перевірити час переходу та відрізнити її від місячного знака."
    },
    "sections": [
      {
        "title": {
          "en": "The Moon is in a sector, not a fixed daily box",
          "uk": "Місяць у секторі, а не в незмінній клітинці доби"
        },
        "paragraphs": [
          {
            "en": "Traditional Jyotish divides the sidereal ecliptic into 27 equal nakshatras. One sector measures 360° divided by 27, which is 13°20′. For a selected instant, the Moon's sidereal longitude identifies the active nakshatra. When the longitude crosses the next sector boundary, the nakshatra changes — whether or not it is midnight.",
            "uk": "Традиція Джйотіш поділяє сидеричну екліптику на 27 рівних накшатр. Одна займає 360° / 27, тобто 13°20′. Для певного моменту сидерична довгота Місяця визначає активну накшатру. Коли довгота перетинає наступну межу, накшатра змінюється незалежно від півночі."
          },
          {
            "en": "Consider a hypothetical longitude of 25° within the zodiac circle. It falls into the second 13°20′ interval, Bharani, whereas 12° falls in the first, Ashwini. This example assumes a consistent sidereal zero point; changing ayanamsha or reference convention can alter a boundary result close to a transition.",
            "uk": "Розгляньмо умовну довготу 25° на зодіакальному колі. Вона потрапляє до другого інтервалу по 13°20′ — Бхарані, тоді як 12° — до першого, Ашвіні. Приклад передбачає одну сидеричну точку відліку; інша айанамша поблизу межі може змінити результат."
          }
        ]
      },
      {
        "title": {
          "en": "Why a city search still matters",
          "uk": "Навіщо обирати місто"
        },
        "paragraphs": [
          {
            "en": "The nakshatra transition itself is a global astronomical instant, but your local clock displays it according to your time zone. A transition that is still 'today' in one place may already be 'tomorrow' elsewhere. City selection also matters for local sunrise, which can change which nakshatra is associated with a sunrise-based festival date.",
            "uk": "Сам перехід накшатри є глобальним астрономічним моментом, але місцевий годинник показує його у своєму часовому поясі. Те, що в одному місті відбувається «сьогодні», в іншому вже може бути «завтра». Місто також потрібне для сходу Сонця, від якого інколи залежить календарне приписування накшатри даті свята."
          },
          {
            "en": "Moon sign and nakshatra are not synonyms. A rashi spans 30° and a nakshatra spans 13°20′. One lunar sign can include portions of several nakshatras, so a generic horoscope based on Moon sign does not tell you the precise nakshatra transition time.",
            "uk": "Місячний знак і накшатра — не синоніми. Раші займає 30°, накшатра — 13°20′. Один місячний знак охоплює частини кількох накшатр, тож загальний гороскоп за знаком Місяця не повідомляє точного часу переходу накшатри."
          }
        ]
      },
      {
        "title": {
          "en": "Check the active value and the next change",
          "uk": "Перевір значення та найближчу зміну"
        },
        "paragraphs": [
          {
            "en": "Select your city and date in Panchanga, read the current nakshatra, then inspect its transition time. If the transition is within your intended activity window, make a note of both values rather than treating the entire day as one nakshatra. Use the separate Academy lesson for the traditional meanings of the sectors.",
            "uk": "Обери місто й дату в Панчанзі, прочитай активну накшатру та час її переходу. Якщо перехід відбувається посеред запланованої справи, зверни увагу на обидва значення замість позначати весь день однією накшатрою. Традиційні значення секторів докладніше пояснює окремий урок Академії."
          },
          {
            "en": "To compare results from different sites, agree on the time zone, ayanamsha, zodiac convention and moment of observation first. A site saying 'Nakshatra today' without a location or time convention is insufficient for a precise schedule. Symbolic interpretations belong to the tradition and should not be confused with the calculation itself.",
            "uk": "Щоб порівняти результати різних сайтів, спочатку узгодь часовий пояс, айанамшу, зодіакальну систему та момент спостереження. Підпису «накшатра сьогодні» без місця чи правила визначення часу недостатньо для точного розкладу. Символічне трактування є традиційним шаром, окремим від розрахунку."
          }
        ]
      }
    ],
    "related": [
      "nakshatras",
      "panchanga-five-limbs-explained"
    ],
    "tool": "panchanga",
    "references": [
      {
        "label": "Galaxiora — Panchanga calculation methodology",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  },
  {
    "slug": "panchanga-sunrise-day-rule",
    "category": "panchanga",
    "minutes": 8,
    "title": {
      "en": "Why a Traditional Panchanga Day Can Begin at Sunrise",
      "uk": "Чому традиційний день Панчанги може починатися зі сходом Сонця"
    },
    "summary": {
      "en": "Civil midnight versus sunrise-based observances, repeated or skipped sunrise tithis, and a worked timeline.",
      "uk": "Цивільна північ проти традиційного сходу Сонця, повторений чи пропущений тітхі та приклад часової шкали."
    },
    "sections": [
      {
        "title": {
          "en": "Two clocks answer different questions",
          "uk": "Два способи відліку відповідають на різні запитання"
        },
        "paragraphs": [
          {
            "en": "A civil date usually begins at midnight in its legal time zone. Many traditional Panchanga observances instead attribute the weekday or lunar calendar factor to a day by looking at the local sunrise. That does not mean astronomical transitions stop at sunrise; the Moon and Sun continue moving continuously throughout the night.",
            "uk": "Цивільна дата зазвичай починається опівночі в офіційному часовому поясі. Чимало традиційних календарних правил Панчанги пов’язують день тижня або місячний чинник із датою за місцевим сходом Сонця. Це не означає, що астрономічні переходи припиняються: Місяць і Сонце рухаються безперервно."
          },
          {
            "en": "Suppose a tithi ends at 05:50 and local sunrise is 06:20. That tithi was active overnight but is no longer active at sunrise. A festival calendar using a sunrise rule may therefore attribute a different tithi to the day from a timestamp viewed at 04:00. These statements are compatible rather than contradictory.",
            "uk": "Припустімо, тітхі завершується о 05:50, а місцевий схід Сонця відбувається о 06:20. Тітхі був активний уночі, але на сході вже не триває. Календар свята з правилом сходу може приписати даті інший тітхі, ніж віджет для 04:00. Це не суперечність, а різні критерії."
          }
        ]
      },
      {
        "title": {
          "en": "Skipped and repeated tithis are calendar effects",
          "uk": "Пропуски та повтори — властивість календарного правила"
        },
        "paragraphs": [
          {
            "en": "Because the duration of a tithi is variable, occasionally two transitions happen between consecutive sunrises. A given tithi is then absent from the sunrise-based sequence, even though it really occurred. Conversely, if no transition happens between sunrises, the same tithi can be associated with two consecutive sunrise dates.",
            "uk": "Оскільки тривалість тітхі змінюється, іноді між двома послідовними сходами Сонця відбуваються два переходи. Тоді один тітхі відсутній у послідовності значень на сході, хоча астрономічно він існував. І навпаки, якщо переходу не було, той самий тітхі може відповідати двом датам поспіль."
          },
          {
            "en": "This distinction explains why a festival calendar might show a date that surprises someone following a general Moon-phase app. Actual observances can involve additional school-specific rules, including whether a tithi prevails at a designated part of day. Never infer an exact festival date from the sunrise rule alone.",
            "uk": "Це пояснює, чому календар свята може показувати дату, неочікувану для користувача звичайного застосунку фаз Місяця. Реальні свята нерідко мають додаткові правила певної традиції, зокрема вимогу активності тітхі в конкретну частину дня. Не визначай дату свята лише за одним правилом сходу Сонця."
          }
        ]
      },
      {
        "title": {
          "en": "Read transitions and festival rules separately",
          "uk": "Читай переходи та правила свят окремо"
        },
        "paragraphs": [
          {
            "en": "To inspect a particular moment, use Panchanga's local transition data. To decide a traditional observance, identify the specific tradition and its festival rule before choosing the date. The first is an ephemeris and time-zone question; the second combines those inputs with a calendrical convention.",
            "uk": "Для конкретного моменту використай локальні дані переходів Панчанги. Щоб визначити дату традиційного обряду, спершу з’ясуй школу та правило відповідного свята. Перше завдання належить до ефемерид і часових поясів; друге додає до цих даних календарну конвенцію."
          },
          {
            "en": "When comparing two sites, write down the sunrise location, its time, and the transition instant rather than comparing only the bold daily heading. If a rule is unavailable, the honest answer is 'not calculated for this observance', not a fabricated universal favorable or unfavorable verdict.",
            "uk": "Порівнюючи два сайти, запиши місце й час сходу Сонця та момент переходу, а не лише жирний щоденний заголовок. Якщо потрібне правило не реалізоване, чесна відповідь — «для цього обряду не розраховано», а не вигаданий універсальний висновок про сприятливість."
          }
        ]
      }
    ],
    "related": [
      "what-is-tithi-lunar-day",
      "panchanga-time-by-city"
    ],
    "tool": "panchanga",
    "references": [
      {
        "label": "US Naval Observatory — rise, set and twilight definitions",
        "url": "https://aa.usno.navy.mil/faq/RST_defs"
      },
      {
        "label": "Galaxiora — Panchanga calculation methodology",
        "url": "https://galaxiora.com/en/methodology"
      }
    ]
  }
];
