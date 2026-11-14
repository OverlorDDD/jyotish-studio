/** Horoscope v3 editorial banks (UA/EN). Voice: docs/galaxiora-editorial-voice.md —
 * warm, specific, confident, «ви». Every text is chosen by a real position
 * (house of the Moon/Sun from the reader's sign) and a rating computed from
 * classical transit rules; the date only rotates between equivalent phrasings. */
export type L={uk:string;en:string};
const l=(uk:string,en:string):L=>({uk,en});

/** Spheres of the 12 houses, plain language. */
export const HOUSE_SPHERE:L[]=[
 l('ви самі: самопочуття, настрій, вигляд','you: wellbeing, mood, presence'),
 l('гроші, цінності й близькі','money, values and family'),
 l('розмови, поїздки, брати й сестри','conversations, short trips, siblings'),
 l('дім, родина, внутрішній спокій','home, family, inner calm'),
 l('кохання, творчість, діти, задоволення','romance, creativity, children, pleasure'),
 l('робота, обов’язки, здоров’я','work, duties, health'),
 l('партнерство, шлюб, домовленості','partnership, marriage, agreements'),
 l('зміни, спільні гроші, глибокі почуття','change, shared money, deep feelings'),
 l('навчання, подорожі, віра, наставники','learning, travel, faith, mentors'),
 l('кар’єра, репутація, цілі','career, reputation, goals'),
 l('друзі, спільноти, мрії й прибутки','friends, communities, hopes and gains'),
 l('відпочинок, усамітнення, внутрішнє життя','rest, solitude, inner life')
];

type MoonHouse={theme:L;headlines:L[];intro:L[];good:L[];avoid:L[]};
/** The Moon's house from your sign sets the tone of the day (changes every ~2.5 days). */
export const MOON_HOUSE:MoonHouse[]=[
 {theme:l('Ваш день','Your day'),
  headlines:[l('День, коли все крутиться навколо вас','A day that revolves around you'),l('Час повернутися до себе','Time to come back to yourself'),l('Ваш настрій задає тон усьому','Your mood sets the tone for everything')],
  intro:[l('Місяць у вашому знаку — і емоції, і сили сьогодні на поверхні. Ви помітніші, ніж зазвичай, тож гарний момент заявити про себе й почати те, що давно хотілося.','The Moon is in your sign, so feelings and energy run close to the surface. You are more visible than usual — a good moment to put yourself forward and begin something you have been waiting to start.'),
   l('Сьогодні добре чути власні бажання: Місяць проходить ваш знак і повертає увагу до того, чого хочете саме ви. Почніть день із того, що наповнює.','Your own wishes are easy to hear today: the Moon passes through your sign and turns attention back to what you want. Begin the day with something that fills you up.')],
  good:[l('почати новий особистий проєкт','start a personal project'),l('оновити образ або зачіску','refresh your look'),l('чесно сказати, чого хочете','say plainly what you want')],
  avoid:[l('ухвалювати рішення лише з емоцій','decide on emotion alone'),l('брати на себе чужий настрій','take on other people’s moods')]},
 {theme:l('Гроші й опора','Money and footing'),
  headlines:[l('День, щоб навести лад у грошах','A day to put money in order'),l('Цінуйте те, що вже маєте','Value what you already have'),l('Спокійна сила практичних кроків','The quiet power of practical steps')],
  intro:[l('Місяць у вашому другому домі підсвічує гроші, речі й усе, що дає відчуття опори. Емоційні покупки сьогодні спокусливі, а от планування бюджету вдасться легко.','The Moon in your second house lights up money, belongings and whatever gives you a sense of footing. Emotional purchases are tempting, while budgeting comes easily.'),
   l('Сьогодні хочеться стабільності й смачного: Місяць проходить дім цінностей. Подумайте, на що справді варто витрачати сили й гроші.','Today craves stability and good food: the Moon moves through the house of values. Consider what truly deserves your money and energy.')],
  good:[l('переглянути витрати й підписки','review spending and subscriptions'),l('приготувати щось смачне для близьких','cook something good for loved ones'),l('домовитися про оплату чи підвищення','negotiate payment or a raise')],
  avoid:[l('імпульсивні покупки «для настрою»','impulse buys “for the mood”'),l('позичати без чітких умов','lend without clear terms')]},
 {theme:l('Розмови й рух','Talk and movement'),
  headlines:[l('День легких розмов і швидких рішень','A day of easy talk and quick decisions'),l('Слова сьогодні мають вагу','Words carry weight today'),l('Рух, новини, нові ідеї','Movement, news, fresh ideas')],
  intro:[l('Місяць у третьому домі робить вас товариськими й допитливими. День для дзвінків, листів, коротких поїздок і справ, які давно чекали одного рішучого кроку.','The Moon in your third house makes you sociable and curious. A day for calls, messages, short trips and tasks that only needed one decisive step.'),
   l('Сміливість зростає: Місяць проходить дім ініціативи. Те, що вчора здавалося незручним, сьогодні вдається сказати просто й по-доброму.','Courage rises as the Moon crosses your house of initiative. What felt awkward yesterday can be said simply and kindly today.')],
  good:[l('написати людині, про яку думаєте','message someone on your mind'),l('коротка поїздка чи прогулянка','a short trip or walk'),l('почати курс або книжку','start a course or a book')],
  avoid:[l('пліткувати й перебивати','gossip or interrupt'),l('розпорошуватися на десяток справ','scatter across ten tasks')]},
 {theme:l('Дім і родина','Home and family'),
  headlines:[l('День, щоб побути вдома','A day to be at home'),l('Тепло сім’ї й тиша','Family warmth and quiet'),l('Подбайте про своє гніздо','Tend your nest')],
  intro:[l('Місяць у четвертому домі тягне додому — до близьких, тиші й простих справ. Сили сьогодні менше для публічності й більше для затишку.','The Moon in your fourth house pulls you home — towards family, quiet and simple things. Less energy for the public eye, more for comfort.'),
   l('Почуття сьогодні глибші, ніж здається: Місяць проходить дім коріння. Добрий день, щоб подзвонити мамі, прибрати вдома або просто відпочити.','Feelings run deeper than they look: the Moon is in your house of roots. A good day to call your mother, tidy the home or simply rest.')],
  good:[l('прибрати чи оновити щось удома','tidy or refresh something at home'),l('провести вечір із родиною','spend the evening with family'),l('лягти раніше','go to bed earlier')],
  avoid:[l('нові ризиковані починання','risky new ventures'),l('з’ясовувати старі образи','reopen old grievances')]},
 {theme:l('Кохання й радість','Love and joy'),
  headlines:[l('День для серця й творчості','A day for the heart and creativity'),l('Дозвольте собі радість','Allow yourself joy'),l('Флірт, натхнення, гра','Flirting, inspiration, play')],
  intro:[l('Місяць у п’ятому домі — один із найприємніших днів місяця. Сміливіше в коханні, у творчості й у всьому, що робите із задоволенням.','The Moon in your fifth house brings one of the sweetest days of the month. Be bolder in love, in creative work and in anything you do for pleasure.'),
   l('Сьогодні легко закохуватися — у людину, ідею чи справу: Місяць проходить дім радості. Знайдіть час на те, що захоплює.','It is easy to fall for a person, an idea or a project today: the Moon is in your house of joy. Make time for what thrills you.')],
  good:[l('побачення або романтичний сюрприз','a date or a romantic surprise'),l('творчість без мети','creating just for fun'),l('час із дітьми','time with children')],
  avoid:[l('азартні ставки','gambling'),l('ревнощі на порожньому місці','jealousy over nothing')]},
 {theme:l('Робота й здоров’я','Work and health'),
  headlines:[l('День, щоб закрити хвости','A day to clear the backlog'),l('Маленькі перемоги над рутиною','Small wins over routine'),l('Режим, порядок і турбота про тіло','Routine, order and care for the body')],
  intro:[l('Місяць у шостому домі дає силу на рутину: справи, які довго відкладали, сьогодні піддаються. Класична традиція вважає цей транзит сприятливим для перемоги над труднощами.','The Moon in your sixth house powers you through routine: postponed tasks finally give way. Classical tradition counts this transit as good for overcoming obstacles.'),
   l('Добрий день для порядку: Місяць проходить дім щоденних справ. Складіть список і перекресліть у ньому все, що встигнете, — задоволення гарантоване.','A good day for order: the Moon crosses your house of daily work. Make a list and cross off whatever you can — the satisfaction is guaranteed.')],
  good:[l('розібрати пошту й документи','clear mail and paperwork'),l('тренування чи довга прогулянка','a workout or a long walk'),l('записатися до лікаря, якого відкладали','book the doctor’s visit you postponed')],
  avoid:[l('брати чужу роботу з ввічливості','take on others’ work out of politeness'),l('переїдати на стресі','stress-eating')]},
 {theme:l('Партнерство','Partnership'),
  headlines:[l('День, коли важливі інші','A day when others matter'),l('Разом легше','Easier together'),l('Час домовлятися','Time to agree')],
  intro:[l('Місяць у сьомому домі повертає вас обличчям до партнера, колег і клієнтів. Усе, що робиться вдвох, сьогодні вдається краще, ніж наодинці.','The Moon in your seventh house turns you towards your partner, colleagues and clients. Whatever you do together goes better than alone today.'),
   l('Сьогодні люди тягнуться до вас: Місяць проходить дім стосунків. Добрий момент для щирої розмови, спільних планів і підписання домовленостей.','People are drawn to you today: the Moon is in your house of relationships. A good moment for an honest talk, joint plans and signing agreements.')],
  good:[l('спільна вечеря чи побачення','a dinner or date for two'),l('переговори й угоди','negotiations and deals'),l('попросити поради','ask for advice')],
  avoid:[l('вимагати, щоб усе було по-вашому','insist on everything your way'),l('мовчки ображатися','sulk in silence')]},
 {theme:l('Обережний день','A careful day'),
  headlines:[l('День, щоб пригальмувати','A day to slow down'),l('Тиша замість поспіху','Quiet instead of hurry'),l('Глибина, а не швидкість','Depth, not speed')],
  intro:[l('Місяць у восьмому домі — у Джйотиш це Чандраштама, найчутливіші два дні місяця для вашого знака. Емоції глибші, втома сильніша: важливі починання краще перенести, а сили віддати відпочинку.','The Moon in your eighth house is what Jyotish calls Chandrashtama — the most sensitive two days of the month for your sign. Feelings run deeper and tiredness is stronger: postpone important beginnings and give your energy to rest.'),
   l('Сьогодні не найкращий день для гучних рішень: Місяць проходить дім змін. Зате добрий для тиші, медитації й чесного погляду всередину.','Not a day for loud decisions: the Moon moves through your house of change. It is, however, good for quiet, meditation and an honest look within.')],
  good:[l('медитація чи тиха прогулянка','meditation or a quiet walk'),l('закінчити старе замість почати нове','finish the old rather than start new'),l('виспатися','get a full night’s sleep')],
  avoid:[l('підписувати важливі документи','sign important documents'),l('великі покупки й позики','big purchases and loans'),l('гострі розмови','heated conversations')]},
 {theme:l('Віра й горизонти','Faith and horizons'),
  headlines:[l('День, що розширює горизонт','A day that widens the horizon'),l('Щастить тим, хто вчиться','Luck favours the learner'),l('Подорож — хоча б у думках','A journey — even in the mind')],
  intro:[l('Місяць у дев’ятому домі приносить оптимізм і бажання дізнатися нове. Добрий день для навчання, планування подорожей і розмов із наставником.','The Moon in your ninth house brings optimism and a thirst for the new. A good day to study, plan a trip or talk with a mentor.'),
   l('Сьогодні ширшає погляд: Місяць проходить дім віри й мудрості. Те, що вчора здавалося проблемою, раптом видно в більшій картині.','Your view widens today: the Moon crosses your house of faith and wisdom. What felt like a problem yesterday suddenly fits a larger picture.')],
  good:[l('почати навчання чи лекцію','begin a course or lecture'),l('спланувати подорож','plan a journey'),l('духовна практика чи храм','spiritual practice or a temple visit')],
  avoid:[l('повчати інших','lecture others'),l('сперечатися про переконання','argue over beliefs')]},
 {theme:l('Кар’єра','Career'),
  headlines:[l('День, щоб вас помітили','A day to be noticed'),l('Кар’єра в центрі уваги','Career in the spotlight'),l('Діяти на результат','Act for results')],
  intro:[l('Місяць у десятому домі виносить вас на сцену: роботу, репутацію, цілі. Ваші дії сьогодні видно краще, ніж зазвичай, — це шанс показати, на що ви здатні.','The Moon in your tenth house puts you on stage: work, reputation, goals. Your actions are more visible than usual — a chance to show what you can do.'),
   l('Сьогодні сили йдуть у справу: Місяць проходить дім досягнень. Добрий день для важливих зустрічей, презентацій і розмови з керівником.','Energy flows into work today: the Moon is in your house of achievement. Good for key meetings, presentations and a talk with your manager.')],
  good:[l('важлива зустріч чи презентація','an important meeting or presentation'),l('попросити про підвищення','ask for a promotion'),l('поставити ціль на місяць','set a goal for the month')],
  avoid:[l('конфлікти з начальством','clashes with superiors'),l('забувати про близьких через роботу','forget loved ones for work')]},
 {theme:l('Друзі й здобутки','Friends and gains'),
  headlines:[l('Щасливий день для планів і друзів','A lucky day for plans and friends'),l('Бажання ближчі, ніж здається','Wishes are closer than they seem'),l('Добрі люди поруч','Good people around you')],
  intro:[l('Місяць в одинадцятому домі — один із найсприятливіших транзитів місяця. Друзі допомагають, плани складаються, а маленькі бажання збуваються без зусиль.','The Moon in your eleventh house is one of the most favourable transits of the month. Friends help, plans come together and small wishes come true without effort.'),
   l('Сьогодні щастить у колі людей: Місяць проходить дім здобутків. Скажіть уголос, чого хочете, — хтось обов’язково допоможе.','Luck lives among people today: the Moon is in your house of gains. Say out loud what you want — someone will help.')],
  good:[l('зустріч із друзями','meet friends'),l('попросити про послугу чи рекомендацію','ask for a favour or a referral'),l('загадати бажання й зробити перший крок','make a wish and take the first step')],
  avoid:[l('порівнювати себе з іншими','compare yourself with others'),l('обіцяти більше, ніж можете','promise more than you can')]},
 {theme:l('Відпочинок','Rest'),
  headlines:[l('День, щоб видихнути','A day to exhale'),l('Тиша, сон і відновлення','Quiet, sleep and renewal'),l('Відпустіть зайве','Let go of the extra')],
  intro:[l('Місяць у дванадцятому домі просить відпочинку: сил менше, а внутрішнє життя — багатше. Добрий день для сну, усамітнення, медитації й завершення справ.','The Moon in your twelfth house asks for rest: less energy, a richer inner life. A good day for sleep, solitude, meditation and wrapping things up.'),
   l('Сьогодні корисніше сповільнитися: Місяць проходить дім тиші. Не все треба вирішити сьогодні — дещо краще просто відпустити.','Slowing down pays today: the Moon crosses your house of quiet. Not everything needs solving today — some things are better let go.')],
  good:[l('довгий сон і вечір без гаджетів','a long sleep and an evening offline'),l('медитація, мантра, молитва','meditation, mantra, prayer'),l('допомогти комусь анонімно','help someone anonymously')],
  avoid:[l('великі витрати','big spending'),l('перевтому заради чужих очікувань','exhaust yourself for others’ expectations')]}
];

/** Category flavour by the Moon's house (sentence about that sphere today). */
export const LOVE_BY_HOUSE:L[]=[
 l('Ви сьогодні привабливі й помітні — дозвольте собі зробити перший крок.','You are magnetic and visible today — let yourself make the first move.'),
 l('Турбота виражається просто: смачна вечеря скаже більше за слова.','Care speaks simply: a good dinner says more than words.'),
 l('Легкий флірт у листуванні може перерости в щось цікаве.','A light flirt by message may turn into something interesting.'),
 l('Найкраща романтика сьогодні — домашня: плед, чай і щира розмова.','Today’s best romance is homely: a blanket, tea and an honest talk.'),
 l('Серце відкрите: ідеальний день для побачення чи зізнання.','Your heart is open: an ideal day for a date or a confession.'),
 l('Покажіть любов справами — маленька допомога партнерові важить багато.','Show love in deeds — small help for your partner means a lot.'),
 l('Партнер у центрі уваги: слухайте уважно, і стосунки стануть ближчими.','Your partner takes centre stage: listen closely and you grow closer.'),
 l('Почуття глибокі, але вразливі — не з’ясовуйте стосунки на емоціях.','Feelings run deep but tender — do not settle scores in the heat of emotion.'),
 l('Спільні плани на подорож або навчання зближують.','Shared plans for a trip or study bring you closer.'),
 l('Робота може відтягнути увагу від близьких — знайдіть для них хоча б годину.','Work may pull you away — find at least an hour for loved ones.'),
 l('Знайомство через друзів має добрі шанси.','An introduction through friends has good chances.'),
 l('Хочеться тиші вдвох або наодинці — і це нормально.','You want quiet together or alone — and that is fine.')
];
export const WORK_BY_HOUSE:L[]=[
 l('Ініціатива за вами: запропонуйте ідею першими.','The initiative is yours: put your idea forward first.'),
 l('Практичні справи й підрахунки вдаються найкраще.','Practical tasks and numbers go best.'),
 l('Листи, дзвінки й переговори складаються швидко.','Messages, calls and negotiations move quickly.'),
 l('Краще працювати з дому або в тиші, без зайвих зустрічей.','Better to work from home or in quiet, with fewer meetings.'),
 l('Творчий підхід приносить більше, ніж звична схема.','A creative approach brings more than the usual routine.'),
 l('День продуктивності: рутина піддається, хвости закриваються.','A productive day: routine yields, loose ends get tied.'),
 l('Командна робота й домовленості з клієнтами — у плюсі.','Teamwork and client agreements are favoured.'),
 l('Не беріться за нове — перевірте старе й виправте помилки.','Do not start new work — check the old and fix mistakes.'),
 l('Навчання й робота з іноземними партнерами йдуть добре.','Learning and work with partners abroad go well.'),
 l('Вас помітить керівництво — покажіть результат.','Leadership will notice you — show results.'),
 l('Нетворкінг і рекомендації відкривають двері.','Networking and referrals open doors.'),
 l('Завершуйте, а не починайте: сьогодні сила в підсумках.','Finish rather than begin: today’s strength is in wrapping up.')
];
export const MONEY_BY_HOUSE:L[]=[
 l('Витрати на себе виправдані, якщо вони на здоров’я чи розвиток.','Spending on yourself is fine if it is for health or growth.'),
 l('Добрий день, щоб скласти бюджет і відкласти частину доходу.','A good day to budget and set some income aside.'),
 l('Дрібні угоди й продаж речей вдаються.','Small deals and selling things go well.'),
 l('Гроші на дім і родину — вдале вкладення.','Money spent on home and family is well spent.'),
 l('Утримайтеся від ризику й азарту, навіть якщо дуже кортить.','Avoid risk and gambling, however tempting.'),
 l('Порядок у рахунках і чеках принесе спокій.','Order in bills and receipts brings peace of mind.'),
 l('Спільні фінансові рішення краще ухвалювати разом і письмово.','Joint money decisions are best made together and in writing.'),
 l('Не позичайте й не беріть кредитів — день для обережності.','Neither lend nor borrow — a day for caution.'),
 l('Вкладення в навчання повернеться з лишком.','Investing in learning will pay back richly.'),
 l('Розмова про оплату праці має добрі шанси.','A conversation about pay has good chances.'),
 l('Можливий приємний прибуток чи подарунок.','A pleasant gain or gift is possible.'),
 l('Гроші легко «втікають» — пильнуйте дрібні витрати.','Money slips away easily — watch the small spending.')
];
export const HEALTH_BY_HOUSE:L[]=[
 l('Енергії багато — спрямуйте її в рух.','Plenty of energy — channel it into movement.'),
 l('Їжа — ваші ліки сьогодні: просто, тепло, вчасно.','Food is your medicine today: simple, warm, on time.'),
 l('Прогулянка й свіже повітря знімуть напругу.','A walk and fresh air will ease the tension.'),
 l('Відновлюють сон і спокійний вечір удома.','Sleep and a calm evening at home restore you.'),
 l('Радісні заняття — найкращий тонус.','Joyful activity is the best tonic.'),
 l('Добрий день для тренування, режиму й профілактики.','A good day for training, routine and check-ups.'),
 l('Баланс між своїми й чужими потребами береже сили.','Balancing your needs with others’ protects your energy.'),
 l('Сил менше — не перевантажуйтеся й лягайте раніше.','Less energy — avoid overload and go to bed earlier.'),
 l('Йога чи розтяжка підтримають і тіло, і настрій.','Yoga or stretching supports body and mood.'),
 l('Не забувайте про перерви між справами.','Remember breaks between tasks.'),
 l('Компанія друзів заряджає краще за каву.','Friends recharge you better than coffee.'),
 l('Сон і тиша — головні ліки дня.','Sleep and quiet are the day’s best medicine.')
];
/** Rating-band closers per category: [high, mid, low]. */
export const BAND:Record<'love'|'work'|'money'|'health',L[][]>={
 love:[[l('Зірки на вашому боці — дійте сміливо.','The stars are on your side — act boldly.'),l('Тепла хвиля: відповідайте на почуття відкрито.','A warm wave: answer feelings openly.')],
  [l('Рівний день: більше уваги — більше тепла.','An even day: more attention, more warmth.'),l('Без сюрпризів, але з добрими моментами.','No surprises, but good moments.')],
  [l('Будьте м’якшими й не поспішайте з висновками.','Be gentle and slow to judge.'),l('Краще слухати, ніж доводити.','Better to listen than to prove.')]],
 work:[[l('Добрий момент для важливих кроків.','A good moment for important steps.'),l('Результат буде помітним.','Results will be visible.')],
  [l('Звичний темп — і все встигнете.','Your usual pace will do.'),l('Плануйте, а не поспішайте.','Plan rather than hurry.')],
  [l('Перевіряйте деталі двічі.','Double-check the details.'),l('Важливе краще перенести на інший день.','Move the important things to another day.')]],
 money:[[l('Фінансово сприятливий день.','A financially favourable day.'),l('Гроші люблять вашу рішучість.','Money likes your resolve.')],
  [l('Стабільно — без ризику й без втрат.','Steady — no risk, no loss.'),l('Добре для планування, не для ставок.','Good for planning, not for bets.')],
  [l('Відкладіть великі витрати.','Postpone big spending.'),l('Тримайте гаманець закритим.','Keep your wallet shut.')]],
 health:[[l('Сил вистачить на все задумане.','You have energy for everything planned.'),l('Тіло вдячне за рух.','Your body thanks you for moving.')],
  [l('Тримайте режим — і день мине легко.','Keep your routine and the day flows.'),l('Помірність — ваш найкращий друг.','Moderation is your best friend.')],
  [l('Бережіть сили й не перевантажуйтеся.','Save energy and avoid overload.'),l('Відпочинок сьогодні важливіший за подвиги.','Rest matters more than heroics today.')]]
};
export const PHASE:Record<'new'|'waxing'|'full'|'waning',L>={
 new:l('Молодик поруч — час для намірів, а не для гучних старів.','The New Moon is near — a time for intentions rather than loud launches.'),
 waxing:l('Місяць росте — добре починати й нарощувати.','The Moon is waxing — good for beginning and building.'),
 full:l('Повня підсилює емоції — тримайте баланс і не поспішайте з реакціями.','The Full Moon amplifies emotions — keep balance and do not rush to react.'),
 waning:l('Місяць спадає — добре завершувати, прибирати й відпускати.','The Moon is waning — good for finishing, clearing and letting go.')
};
/** Sun's house from your sign: the theme of the solar month (weekly/monthly overviews). */
export const SUN_HOUSE:L[]=[
 l('Сонце у вашому знаку — ваш особистий новий рік. Час ставити цілі, оновлюватися й бути на виду.','The Sun is in your sign — your personal new year. Time to set goals, renew yourself and be seen.'),
 l('Сонце проходить дім грошей: місяць, щоб зміцнити фінанси й зрозуміти, що для вас справді цінне.','The Sun crosses your money house: a month to strengthen finances and see what you truly value.'),
 l('Сонце в домі спілкування: багато розмов, коротких поїздок і нових знань.','The Sun is in your house of communication: lots of talk, short trips and new knowledge.'),
 l('Сонце в домі родини: увага до дому, близьких і власного коріння.','The Sun is in your house of family: attention to home, loved ones and your roots.'),
 l('Сонце в домі радості: творчість, кохання й задоволення виходять на перший план.','The Sun is in your house of joy: creativity, love and pleasure take the lead.'),
 l('Сонце в домі праці: місяць для порядку, режиму й турботи про здоров’я.','The Sun is in your house of work: a month for order, routine and health.'),
 l('Сонце в домі партнерства: стосунки, угоди й співпраця в центрі місяця.','The Sun is in your house of partnership: relationships, deals and cooperation lead the month.'),
 l('Сонце в домі змін: місяць глибини, спільних фінансів і внутрішнього оновлення.','The Sun is in your house of change: a month of depth, shared finances and inner renewal.'),
 l('Сонце в домі мудрості: навчання, подорожі й пошук сенсу.','The Sun is in your house of wisdom: study, travel and the search for meaning.'),
 l('Сонце в домі кар’єри: найкращий місяць року для професійних кроків.','The Sun is in your career house: the best month of the year for professional moves.'),
 l('Сонце в домі здобутків: друзі, спільноти й плани приносять плоди.','The Sun is in your house of gains: friends, communities and plans bear fruit.'),
 l('Сонце в домі усамітнення: місяць відпочинку, підсумків і підготовки до нового циклу.','The Sun is in your house of solitude: a month of rest, review and preparing a new cycle.')
];
/** Weekday colours by the planetary ruler (Vedic tradition). */
export const WEEKDAY:{planet:L;color:L;hex:string}[]=[
 {planet:l('Сонця (Сур’я)','the Sun (Surya)'),color:l('червоний і помаранчевий','red and orange'),hex:'#E0785A'},
 {planet:l('Місяця (Чандра)','the Moon (Chandra)'),color:l('білий і сріблястий','white and silver'),hex:'#E8ECF4'},
 {planet:l('Марса (Мангала)','Mars (Mangala)'),color:l('червоний','red'),hex:'#D9534F'},
 {planet:l('Меркурія (Будха)','Mercury (Budha)'),color:l('зелений','green'),hex:'#5FB57A'},
 {planet:l('Юпітера (Гуру)','Jupiter (Guru)'),color:l('жовтий','yellow'),hex:'#F2C94C'},
 {planet:l('Венери (Шукра)','Venus (Shukra)'),color:l('білий і ніжно-рожевий','white and soft pink'),hex:'#F4C2D4'},
 {planet:l('Сатурна (Шані)','Saturn (Shani)'),color:l('темно-синій і чорний','dark blue and black'),hex:'#2E3A6B'}
];
export const PLANET_NAME:Record<string,L>={Sun:l('Сонце','Sun'),Moon:l('Місяць','Moon'),Mercury:l('Меркурій','Mercury'),Venus:l('Венера','Venus'),
 Mars:l('Марс','Mars'),Jupiter:l('Юпітер','Jupiter'),Saturn:l('Сатурн','Saturn')};
export const CATEGORY_LABEL:Record<'mood'|'love'|'work'|'money'|'health',L>={mood:l('Настрій','Mood'),love:l('Кохання','Love'),work:l('Робота','Work'),money:l('Гроші','Money'),health:l('Здоров’я','Health')};
