/** G4 human-reviewed public catalog. Do not label D60 as a certified natal chart.
 * The order matches the N4RC 15-chart payload plus the separate D60 annex.
 */
export type VargaLocale='uk'|'en';
export const SHODASHAVARGA_DIVISIONS=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60] as const;
export type VargaEntry={division:number;name:string;theme:Record<VargaLocale,string>;detail:Record<VargaLocale,string>;question:Record<VargaLocale,string>;status:'internally_verified_n4'|'provisional_d60'};
export const SHODASHAVARGA:readonly VargaEntry[]=[
  {
    "division": 1,
    "name": "Rashi",
    "theme": {
      "en": "Foundational birth chart",
      "uk": "Основна натальна карта"
    },
    "detail": {
      "en": "The D1 Rashi chart is the starting point: the sidereal signs of the planets, Ascendant, and whole-sign houses at the chosen birth moment. All other vargas refine particular themes of this foundation.",
      "uk": "Карта D1 Раші — вихідна точка: сидеричні знаки планет, Лагна й цілознакові доми для обраного моменту народження. Інші варги уточнюють окремі теми цієї основи."
    },
    "question": {
      "en": "Which positions form the starting chart?",
      "uk": "Які положення утворюють основну карту?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 2,
    "name": "Hora",
    "theme": {
      "en": "Resources and wealth",
      "uk": "Ресурси та достаток"
    },
    "detail": {
      "en": "D2 Hora groups planetary positions by the Sun/Moon Hora rule used in Galaxiora. It is traditionally compared with D1 when examining resources, not treated as a literal income forecast.",
      "uk": "D2 Хора застосовує прийняте в Galaxiora правило Сонячної/Місячної Хори. Традиційно її порівнюють із D1, коли розглядають ресурси, а не як буквальний прогноз заробітку."
    },
    "question": {
      "en": "How does the Sun/Moon Hora division differ from D1?",
      "uk": "Чим поділ Сонячної/Місячної Хори відрізняється від D1?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 3,
    "name": "Drekkana",
    "theme": {
      "en": "Courage and siblings",
      "uk": "Сміливість і братерство"
    },
    "detail": {
      "en": "D3 Drekkana divides a sign into three 10-degree segments. In Jyotish it is used to refine questions about initiative, courage and sibling relationships in the context of D1.",
      "uk": "D3 Дреккана ділить знак на три частини по 10 градусів. У Джйотіш її використовують для уточнення тем ініціативи, сміливості й стосунків із братами та сестрами в контексті D1."
    },
    "question": {
      "en": "What does the 10-degree division add?",
      "uk": "Що додає поділ на відрізки по 10 градусів?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 4,
    "name": "Chaturthamsa",
    "theme": {
      "en": "Home and property",
      "uk": "Дім і нерухомість"
    },
    "detail": {
      "en": "D4 Chaturthamsa divides each sign into four parts. Traditionally it adds context to D1 topics of home, property, residence and stability; it does not predict a property purchase.",
      "uk": "D4 Чатуртхамша ділить кожен знак на чотири частини. Традиційно уточнює теми житла, власності та стійкості, уже присутні в D1, але не передбачає конкретну покупку."
    },
    "question": {
      "en": "How is the D4 chart used for home questions?",
      "uk": "Як використовують D4 для тем житла?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 7,
    "name": "Saptamsa",
    "theme": {
      "en": "Children and continuity",
      "uk": "Діти та наступність"
    },
    "detail": {
      "en": "D7 Saptamsa traditionally explores children, nurturing and continuity. Its planetary sign placements come from sevenths of each sign; birth-time uncertainty can affect divisional Ascendants.",
      "uk": "D7 Саптамша традиційно пов'язана з дітьми, вихованням і наступністю. Знаки планет утворюються поділом кожного знака на сім частин; неточний час народження впливає на дробові Лагни."
    },
    "question": {
      "en": "What is Saptamsa consulted for?",
      "uk": "Для яких питань використовують Саптамшу?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 9,
    "name": "Navamsa",
    "theme": {
      "en": "Partnership and dharma",
      "uk": "Партнерство й дхарма"
    },
    "detail": {
      "en": "D9 Navamsa is the ninth division, traditionally consulted for partnership, values, dharma and the refinement of planetary strength. Compare it with D1 rather than reading it as an independent horoscope.",
      "uk": "D9 Навамша — дев'ятий поділ, традиційно пов'язаний із партнерством, цінностями, дхармою та уточненням сили планет. Її розглядають разом із D1, а не як окремий гороскоп."
    },
    "question": {
      "en": "How does Navamsa refine the birth chart?",
      "uk": "Як Навамша уточнює натальну карту?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 10,
    "name": "Dashamsa",
    "theme": {
      "en": "Career and vocation",
      "uk": "Кар'єра та покликання"
    },
    "detail": {
      "en": "D10 Dashamsa divides each sign into ten segments. It is traditionally examined for responsibilities, work, public role and career direction in relation to the D1 chart.",
      "uk": "D10 Дашамша ділить кожен знак на десять частин. Традиційно її розглядають для тем професії, відповідальності, суспільної ролі й кар'єрного напряму разом із D1."
    },
    "question": {
      "en": "How is the D10 chart connected to work?",
      "uk": "Як D10 пов'язана з професійними темами?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 12,
    "name": "Dwadasamsa",
    "theme": {
      "en": "Parents and ancestry",
      "uk": "Батьки та походження"
    },
    "detail": {
      "en": "D12 Dwadasamsa is traditionally read for parents, ancestry and family origins. Its divisions are 2°30′ each, and the starting chart and accurate birth inputs remain necessary for context.",
      "uk": "D12 Двадашамша традиційно пов'язана з батьками, походженням та родинною історією. Її частини мають по 2°30′; для тлумачення потрібен контекст D1 і правильні дані народження."
    },
    "question": {
      "en": "What does D12 add to family themes?",
      "uk": "Що додає D12 до тем родини?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 16,
    "name": "Shodasamsa",
    "theme": {
      "en": "Comfort and transport",
      "uk": "Комфорт та пересування"
    },
    "detail": {
      "en": "D16 Shodasamsa is a finer traditional view of comfort, vehicles and practical amenities. It is distinct from the whole-life D1 chart and does not guarantee material acquisitions.",
      "uk": "D16 Шодашамша — детальніший традиційний ракурс комфорту, транспорту та побутових зручностей. Вона відрізняється від загальної D1 й не гарантує матеріальних придбань."
    },
    "question": {
      "en": "Which life area is associated with D16?",
      "uk": "З якою сферою життя пов'язана D16?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 20,
    "name": "Vimsamsa",
    "theme": {
      "en": "Spiritual practices",
      "uk": "Духовні практики"
    },
    "detail": {
      "en": "D20 Vimsamsa traditionally addresses worship, spiritual discipline and sustained practice. It draws from twentieth divisions of the same original planetary longitudes, not a second sky calculation.",
      "uk": "D20 Вімшамша традиційно описує духовну дисципліну, ритуали та тривалу практику. Це двадцяті частини тих самих вихідних довгот планет, а не друге астрономічне спостереження."
    },
    "question": {
      "en": "Why use a distinct chart for spiritual practice?",
      "uk": "Навіщо окрема карта для духовної практики?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 24,
    "name": "Siddhamsa",
    "theme": {
      "en": "Learning and education",
      "uk": "Освіта й навчання"
    },
    "detail": {
      "en": "D24 Siddhamsa (Chaturvimsamsa) is traditionally linked to learning, education and mastery of skills. Study it alongside D1 and the broader circumstances instead of treating it as an examination outcome.",
      "uk": "D24 Сіддхамша (Чатурвімшамша) традиційно пов'язана з навчанням, освітою та розвитком умінь. Її розглядають разом із D1, а не як передбачення результату іспиту."
    },
    "question": {
      "en": "Which divisional chart explores learning?",
      "uk": "Яка дробова карта пов'язана з навчанням?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 27,
    "name": "Bhamsha",
    "theme": {
      "en": "Strengths and resilience",
      "uk": "Сили та витривалість"
    },
    "detail": {
      "en": "D27 Bhamsha (Saptavimsamsa) traditionally refines questions about strengths, resilience and vulnerabilities. The finer subdivision means boundary proximity and input precision should be checked.",
      "uk": "D27 Бхамша (Саптавімшамша) традиційно уточнює сильні сторони, витривалість та вразливості. Для тоншого поділу особливо важливо перевіряти близькість до меж і точність вихідних даних."
    },
    "question": {
      "en": "Which varga is traditionally used for strengths?",
      "uk": "Яку варгу традиційно використовують для тем сили?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 30,
    "name": "Trimsamsa",
    "theme": {
      "en": "Difficulties and obstacles",
      "uk": "Труднощі й перешкоди"
    },
    "detail": {
      "en": "D30 Trimsamsa concerns traditional interpretations of challenges and difficult circumstances. Unlike simple equal thirtyfold partitions, the pinned Parashari method in Galaxiora uses unequal Trimsamsa divisions.",
      "uk": "D30 Трімшамша традиційно стосується труднощів і перешкод. На відміну від простого поділу на тридцять рівних частин, Galaxiora застосовує зафіксовані нерівні поділи Трімшамші за правилом Парашарі."
    },
    "question": {
      "en": "Why is D30 not a simple thirty-way split?",
      "uk": "Чому D30 — не простий рівний поділ на 30 частин?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 40,
    "name": "Khavedamsa",
    "theme": {
      "en": "Maternal-line themes",
      "uk": "Теми материнського роду"
    },
    "detail": {
      "en": "D40 Khavedamsa is used in some Jyotish traditions for subtle auspicious and challenging patterns and maternal-line themes. Traditions vary in emphasis, so method and interpretation should be stated explicitly.",
      "uk": "D40 Кхаведамша в деяких традиціях Джйотіш розглядає тонкі сприятливі й складні тенденції та теми материнського роду. Тлумачення різняться між школами, тому важливо вказувати метод."
    },
    "question": {
      "en": "What are the limitations of D40 interpretation?",
      "uk": "Які обмеження тлумачення D40?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 45,
    "name": "Akshavedamsa",
    "theme": {
      "en": "Paternal-line themes",
      "uk": "Теми батьківського роду"
    },
    "detail": {
      "en": "D45 Akshavedamsa is associated in some later traditions with the paternal line and inherited patterns. It is a fine division where the source longitude and birth-time quality matter especially.",
      "uk": "D45 Акшаведамша в окремих пізніших традиціях пов'язана з батьківським родом та успадкованими темами. Це тонкий поділ, для якого особливо важливі точність довгот і часу."
    },
    "question": {
      "en": "How should a fine D45 placement be interpreted?",
      "uk": "Як трактувати тонке положення D45?"
    },
    "status": "internally_verified_n4"
  },
  {
    "division": 60,
    "name": "Shashtiamsa",
    "theme": {
      "en": "Fine symbolic context",
      "uk": "Тонкі символічні теми"
    },
    "detail": {
      "en": "D60 Shashtiamsa is the finest division in this sixteen-chart set. Galaxiora provides a provisional D60 symbolic reference; its individual-birth Ascendant and houses are NOT certified stable for rounded birth times. Do not treat it as a verified prediction.",
      "uk": "D60 Шаштіамша — найтонший поділ набору з 16 карт. Galaxiora показує попередню символічну D60; стабільність її Лагни й домів для округленого часу народження НЕ сертифікована. Не сприймай її як перевірене передбачення."
    },
    "question": {
      "en": "Why is the D60 Ascendant provisional?",
      "uk": "Чому Лагна D60 має попередній статус?"
    },
    "status": "provisional_d60"
  }
];
