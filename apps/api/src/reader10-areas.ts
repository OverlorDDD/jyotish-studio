/** Reader 10 life-area rule texts (original, bilingual): planets in a house, the house lord
 * by placement, verdicts, and the supporting divisional charts.
 * Boundaries: no claims about death, illness, fertility or guaranteed events. */
import type {Planet} from './reader10-facts.ts';
type T={uk:string;en:string};
const t=(uk:string,en:string):T=>({uk,en});
export type AreaId='money'|'work'|'love'|'home'|'path';
export type Tier='strong'|'mixed'|'hard';
export type AreaRule={id:AreaId;house:number;varga:number;support:readonly number[];title:T;vargaTopic:T;
 occupants:Record<Planet,T>;lord:readonly T[];verdict:Record<Tier,T>;short:Record<Tier,T>};

const P9=(sun:T,moon:T,mars:T,mercury:T,jupiter:T,venus:T,saturn:T,rahu:T,ketu:T):Record<Planet,T>=>
 ({Sun:sun,Moon:moon,Mars:mars,Mercury:mercury,Jupiter:jupiter,Venus:venus,Saturn:saturn,Rahu:rahu,Ketu:ketu});

export const AREAS:readonly AreaRule[]=[
 {id:'money',house:2,varga:2,support:[16],title:t('Гроші й ресурси','Money and resources'),vargaTopic:t('достаток','wealth'),
  occupants:P9(
   t('Сонце в другому домі: ви заробляєте через становище й авторитет, а говорите владно.','The Sun in the second house: you earn through position and authority, and you speak with command.'),
   t('Місяць у другому домі: дохід у вас коливається, як припливи, зате мова приємна, а родина важить дуже багато.','The Moon in the second house: your income rises and falls like the tide, but your speech is pleasant and family matters a great deal.'),
   t('Марс у другому домі: ви швидко заробляєте й так само швидко витрачаєте, а слово у вас гостре.','Mars in the second house: you earn fast and spend just as fast, and your tongue is sharp.'),
   t('Меркурій у другому домі: гроші приходять через розум, слово, торгівлю й рахунок.','Mercury in the second house: money comes through intellect, words, trade and calculation.'),
   t('Юпітер у другому домі: це достаток, щедрість і слово, якому вірять.','Jupiter in the second house: plenty, generosity and a word that people trust.'),
   t('Венера в другому домі: ви любите гарні речі й умієте заробляти на красі, мистецтві чи приємному спілкуванні.','Venus in the second house: you love fine things and know how to earn from beauty, art or pleasant company.'),
   t('Сатурн у другому домі: достаток приходить повільно, зате тримається; ви ощадливі й небагатослівні.','Saturn in the second house: wealth comes slowly but stays; you are thrifty and sparing with words.'),
   t('Раху в другому домі: джерела доходу нестандартні, а апетит до грошей великий.','Rahu in the second house: your sources of income are unconventional and your appetite for money is large.'),
   t('Кету в другому домі: до накопичення ви байдужі, а говорите мало й по суті.','Ketu in the second house: you are indifferent to accumulation and speak little and to the point.')),
  lord:[
   t('Ви заробляєте власною особистістю: ім’я, вміння й ініціатива і є вашим капіталом.','You earn by your own person: your name, skill and initiative are your capital.'),
   t('Управитель у власному домі дає стабільний дохід і вміння накопичувати: гроші у вас тримаються.','The lord in its own house gives a stable income and the ability to save: money stays with you.'),
   t('Гроші приходять через власні зусилля: слово, продажі, письмо, поїздки. Без вашої ініціативи дохід стоїть.','Money comes through your own effort: words, sales, writing, travel. Without your initiative income stands still.'),
   t('Достаток пов’язаний із домом: нерухомість, земля, родинна справа, підтримка матері.','Wealth is tied to home: property, land, a family business, a mother’s support.'),
   t('Ви заробляєте розумом: навчання, поради, творчість, вдалі вкладення. Це сильне положення для доходу.','You earn by intellect: teaching, advice, creativity, good investments. A strong placement for income.'),
   t('Гроші даються щоденною працею й службою. Позики й борги — ваша слабка точка: беріть їх обережно.','Money is won by daily work and service. Loans and debts are your weak point: take them with care.'),
   t('Дохід залежить від партнера: шлюб, спільна справа, угоди з клієнтами приносять вам гроші.','Income depends on a partner: marriage, a joint business and deals with clients bring you money.'),
   t('Гроші приходять нерівно й часто через чужі ресурси: спільні кошти, спадок, страхування, дослідження. Запас на чорний день вам потрібен більше, ніж іншим.','Money arrives unevenly and often through other people’s resources: shared funds, inheritance, insurance, research. You need a reserve more than most.'),
   t('Вам щастить у грошах: достаток приходить через учителів, батька, знання й далекі зв’язки.','You are lucky with money: wealth comes through teachers, a father, knowledge and distant connections.'),
   t('Гроші дає професія: що вищі становище й відповідальність, то більший дохід.','Your profession gives the money: the higher the standing and responsibility, the larger the income.'),
   t('Класична дхана-йога, комбінація багатства: прибуток зростає з роками, а зв’язки приносять гроші.','A classical dhana yoga, a combination for wealth: gains grow with the years and connections bring money.'),
   t('Гроші у вас не затримуються: витрати, поїздки й допомога іншим забирають зароблене. Найкраще ви заробляєте далеко від місця народження.','Money does not stay with you: expenses, travel and helping others take what you earn. You earn best far from your place of birth.')],
  verdict:{strong:t('Гроші — сильна сфера вашої карти: тут ви можете розраховувати на стабільність і зростання.','Money is a strong area of your chart: you can count on stability and growth here.'),
   mixed:t('Гроші — сфера середньої сили: дохід є, але він прямо залежить від того, скільки ви вкладаєте.','Money is an area of middling strength: income is there, but it depends directly on what you put in.'),
   hard:t('Гроші — вимоглива сфера вашої карти: тут нічого не дається задарма, і фінансова дисципліна вам потрібна змолоду.','Money is a demanding area of your chart: nothing comes free here, and you need financial discipline from early on.')},
  short:{strong:t('гроші — ваша сильна сфера','money is your strong area'),mixed:t('дохід залежить від ваших зусиль','income depends on your effort'),hard:t('гроші вимагають дисципліни','money demands discipline')}},

 {id:'work',house:10,varga:10,support:[24],title:t('Робота й покликання','Work and calling'),vargaTopic:t('професія','profession'),
  occupants:P9(
   t('Сонце в десятому домі стоїть у найсильнішій для себе позиції: це влада, керівництво й помітне становище.','The Sun in the tenth house is in its strongest position: authority, leadership and visible standing.'),
   t('Місяць у десятому домі: ваша робота на виду й пов’язана з людьми; професія змінюється кілька разів.','The Moon in the tenth house: your work is in public view and tied to people; your profession changes more than once.'),
   t('Марс у десятому домі стоїть у найсильнішій для себе позиції: ви керівник-практик, інженер, людина, яка діє й домагається.','Mars in the tenth house is in its strongest position: a hands-on leader, an engineer, a person who acts and gets results.'),
   t('Меркурій у десятому домі: ваша справа — слово, аналіз, торгівля; ви ведете кілька напрямів одразу.','Mercury in the tenth house: your work is words, analysis, trade; you run several lines at once.'),
   t('Юпітер у десятому домі: вас поважають як порадника, вчителя чи керівника з принципами.','Jupiter in the tenth house: you are respected as an adviser, a teacher or a leader with principles.'),
   t('Венера в десятому домі: кар’єра пов’язана з красою, мистецтвом, дипломатією чи роботою з людьми.','Venus in the tenth house: your career is tied to beauty, art, diplomacy or work with people.'),
   t('Сатурн у десятому домі: підйом повільний, зате високий і тривкий; ви заробляєте становище роками.','Saturn in the tenth house: the climb is slow but high and lasting; you earn your standing over years.'),
   t('Раху в десятому домі: сильна амбіція й тяга до нестандартних шляхів — технології, іноземні компанії, професії, яких не було в поколінні батьків. Просто мати роботу вам замало, потрібне помітне місце.','Rahu in the tenth house: strong ambition and a pull toward unconventional roads — technology, foreign companies, professions that did not exist in your parents’ generation. Merely having a job is not enough; you need a visible place.'),
   t('Кету в десятому домі: ви працюєте без жаги до слави й сильні у вузькій, тонкій спеціалізації.','Ketu in the tenth house: you work without a thirst for fame and are strong in a narrow, fine specialisation.')),
  lord:[
   t('Ви самі собі професія: власне ім’я, власна справа, робота на себе.','You are your own profession: your own name, your own venture, working for yourself.'),
   t('Робота пов’язана з грошима, словом або сімейною справою, і кар’єра прямо годує родину.','Work is tied to money, speech or a family business, and your career feeds the family directly.'),
   t('Ваша сфера — комунікації: медіа, продажі, письмо, усе, де треба брати ініціативу.','Your field is communication: media, sales, writing, anything that calls for initiative.'),
   t('Ваші сфери — нерухомість, будівництво, освіта, усе, що пов’язане з землею й домом; робота з дому вам підходить.','Your fields are property, construction, education, anything tied to land and home; working from home suits you.'),
   t('Ви працюєте головою й талантом: викладання, консультації, творчість, інвестиції.','You work with mind and talent: teaching, consulting, creative work, investment.'),
   t('Ваше місце — служба й змагання: медицина, право, армія, сервіс, усе, де розв’язують чужі проблеми.','Your place is service and contest: medicine, law, the forces, service work, anything that solves other people’s problems.'),
   t('Ви розкриваєтесь у бізнесі й роботі з клієнтами; партнер помітно впливає на вашу кар’єру.','You unfold in business and work with clients; a partner noticeably shapes your career.'),
   t('Кар’єра йде з поворотами: професію ви змінюєте докорінно, а сильні в дослідженнях і роботі з чужими ресурсами.','Your career runs through turns: you change profession at the root and are strong in research and work with other people’s resources.'),
   t('Раджа-йога покликання: кар’єрі сприяє удача, а ваші сфери — викладання, право, наука, робота за кордоном.','A raja yoga of calling: fortune favours your career, and your fields are teaching, law, science, work abroad.'),
   t('Управитель у власному домі дає сильну кар’єру: ви на своєму місці й тримаєте його міцно.','The lord in its own house gives a strong career: you are in your right place and hold it firmly.'),
   t('Кар’єра приносить прибуток і впливових друзів; що далі, то вищий дохід.','Your career brings gains and influential friends; the further you go, the higher the income.'),
   t('Ви працюєте далеко від дому або за лаштунками: за кордоном, в установах, у дослідженнях, без оплесків.','You work far from home or behind the scenes: abroad, in institutions, in research, without applause.')],
  verdict:{strong:t('Робота — сильна сфера вашої карти: тут ви здатні піднятися високо.','Work is a strong area of your chart: you are able to rise high here.'),
   mixed:t('Робота — сфера середньої сили: успіх приходить, але поступово й через накопичений досвід.','Work is an area of middling strength: success comes, but gradually and through accumulated experience.'),
   hard:t('Робота — вимоглива сфера вашої карти: шлях іде через зміни й перешкоди, і своє місце ви знаходите не з першої спроби.','Work is a demanding area of your chart: the road runs through changes and obstacles, and you do not find your place at the first attempt.')},
  short:{strong:t('у роботі ви здатні піднятися високо','you can rise high in work'),mixed:t('кар’єра росте поступово','your career grows gradually'),hard:t('своє місце в роботі ви знаходите не одразу','you do not find your place in work at once')}},

 {id:'love',house:7,varga:9,support:[7],title:t('Стосунки й шлюб','Relationships and marriage'),vargaTopic:t('шлюб і дхарма','marriage and dharma'),
  occupants:P9(
   t('Сонце в сьомому домі: партнер у вас гордий і самостійний, і в парі точиться боротьба за першість.','The Sun in the seventh house: your partner is proud and independent, and there is a contest for first place in the couple.'),
   t('Місяць у сьомому домі: партнер чутливий і турботливий, а ви емоційно залежите від стосунків.','The Moon in the seventh house: your partner is sensitive and caring, and you depend on the relationship emotionally.'),
   t('Марс у сьомому домі (мангала-доша): у стосунках багато пристрасті й суперечок; вам потрібен партнер із таким самим сильним характером.','Mars in the seventh house (mangala dosha): much passion and many arguments in relationships; you need a partner with an equally strong character.'),
   t('Меркурій у сьомому домі: партнер молодий душею й говіркий, а розмова тримає вашу пару.','Mercury in the seventh house: your partner is young at heart and talkative, and conversation holds your couple together.'),
   t('Юпітер у сьомому домі: партнер порядний, розсудливий і приносить у ваше життя зростання.','Jupiter in the seventh house: your partner is decent and wise and brings growth into your life.'),
   t('Венера в сьомому домі: партнер привабливий, а кохання для вас — одна з головних цінностей.','Venus in the seventh house: your partner is attractive, and love is one of your main values.'),
   t('Сатурн у сьомому домі: шлюб пізній або з людиною, старшою чи серйознішою за вас; з роками він лише міцніє.','Saturn in the seventh house: marriage is late or to someone older or more serious than you; it only grows stronger with the years.'),
   t('Раху в сьомому домі: партнер незвичайний, з іншого середовища чи культури, а стосунки ламають звичні правила.','Rahu in the seventh house: your partner is unusual, from another background or culture, and the relationship breaks the usual rules.'),
   t('Кету в сьомому домі: партнер відсторонений або духовний, і в парі завжди є дистанція.','Ketu in the seventh house: your partner is detached or spiritual, and there is always some distance in the couple.')),
  lord:[
   t('Партнер сам знаходить вас, і шлюб важить для вашої особистості дуже багато; ви з партнером схожі.','A partner finds you, and marriage weighs heavily in your personality; you and your partner are alike.'),
   t('Шлюб приносить достаток, а партнер тісно пов’язаний із вашою родиною.','Marriage brings wealth, and your partner is closely tied to your family.'),
   t('Партнер приходить із близького кола — сусіди, колеги, знайомі; пару тримає спілкування.','A partner comes from your near circle — neighbours, colleagues, acquaintances; communication holds the couple.'),
   t('Партнер дає вам дім і затишок: шлюб для вас — це передусім домашнє щастя.','A partner gives you home and comfort: for you marriage is above all happiness at home.'),
   t('Шлюб із кохання: романтика, спільна творчість і діти об’єднують вашу пару.','A marriage of love: romance, shared creativity and children unite your couple.'),
   t('Стосунки даються через працю й тертя: ви притираєтесь довго, а партнер часто приходить через роботу.','Relationships are won through work and friction: you take long to fit together, and a partner often comes through work.'),
   t('Управитель у власному домі дає міцний шлюб і вірного партнера.','The lord in its own house gives a firm marriage and a loyal partner.'),
   t('Зв’язок глибокий і непростий: шлюб змінює вас докорінно, а спільні гроші стають окремою темою.','The bond is deep and not simple: marriage changes you at the root, and shared money becomes a subject of its own.'),
   t('Шлюб щасливий: партнер приносить удачу, часто він з іншого міста, країни чи культури.','The marriage is fortunate: a partner brings luck and is often from another city, country or culture.'),
   t('Партнер пов’язаний із вашою роботою, і шлюб підносить ваше становище.','Your partner is tied to your work, and marriage raises your standing.'),
   t('Партнер приносить прибуток, друзів і здійснення бажань.','A partner brings gains, friends and the fulfilment of wishes.'),
   t('Партнер здалеку або з-за кордону; шлюб вимагає від вас поступок і вміння бути на відстані.','A partner from far away or from abroad; marriage asks concessions of you and the ability to live with distance.')],
  verdict:{strong:t('Стосунки — сильна сфера вашої карти: шлюб стає для вас опорою.','Relationships are a strong area of your chart: marriage becomes a support for you.'),
   mixed:t('Стосунки — сфера середньої сили: гармонія можлива, але її доводиться будувати вдвох.','Relationships are an area of middling strength: harmony is possible, but the two of you have to build it.'),
   hard:t('Стосунки — вимоглива сфера вашої карти: саме тут вас чекають головні уроки, і шлюб вимагає зрілості.','Relationships are a demanding area of your chart: your main lessons wait here, and marriage requires maturity.')},
  short:{strong:t('шлюб стає вашою опорою','marriage becomes your support'),mixed:t('гармонію в парі ви будуєте самі','you build harmony in the couple yourselves'),hard:t('стосунки — ваші головні уроки','relationships are your main lessons')}},

 {id:'home',house:4,varga:4,support:[12,40,45],title:t('Дім і родина','Home and family'),vargaTopic:t('дім і майно','home and property'),
  occupants:P9(
   t('Сонце в четвертому домі: ви пишаєтесь своїм домом, але спокою в ньому менше, ніж порядку.','The Sun in the fourth house: you are proud of your home, but there is less peace in it than order.'),
   t('Місяць у четвертому домі стоїть у найсильнішій для себе позиції: глибока прив’язаність до матері й дому, який вас живить.','The Moon in the fourth house is in its strongest position: a deep attachment to mother and to a home that nourishes you.'),
   t('Марс у четвертому домі: вдома неспокійно й людно, зате земля й нерухомість — ваша тема.','Mars in the fourth house: home is restless and busy, but land and property are your subject.'),
   t('Меркурій у четвертому домі: дім із книжками й розмовами; ви добре освічені.','Mercury in the fourth house: a home of books and conversation; you are well educated.'),
   t('Юпітер у четвертому домі: щасливий, просторий і гостинний дім.','Jupiter in the fourth house: a happy, spacious and hospitable home.'),
   t('Венера в четвертому домі: гарний дім, комфорт, добрий транспорт і любов до затишку.','Venus in the fourth house: a beautiful home, comfort, good vehicles and a love of cosiness.'),
   t('Сатурн у четвертому домі: у дитинстві вдома було стримано й суворо; власне майно приходить пізно, зате надовго.','Saturn in the fourth house: home in childhood was restrained and strict; property of your own comes late but lasts.'),
   t('Раху в четвертому домі: ви живете далеко від свого коріння або в незвичному домі, і внутрішній спокій дається важко.','Rahu in the fourth house: you live far from your roots or in an unusual home, and inner peace comes hard.'),
   t('Кету в четвертому домі: ви рано відриваєтесь від місця народження й шукаєте спокою на самоті.','Ketu in the fourth house: you leave your birthplace early and look for peace in solitude.')),
  lord:[
   t('Дім і освіта супроводжують вас усе життя: де ви, там і ваш дім.','Home and education go with you all your life: where you are, there your home is.'),
   t('Родинне майно й достаток у домі: сім’я дає вам матеріальну опору.','Family property and plenty at home: your family gives you material support.'),
   t('Ви часто переїжджаєте й будуєте дім власними зусиллями; близькі стосунки з братами й сестрами.','You move often and build your home by your own effort; close ties with brothers and sisters.'),
   t('Управитель у власному домі дає міцний дім, власну нерухомість і душевний спокій.','The lord in its own house gives a firm home, property of your own and peace of mind.'),
   t('Щаслива родина й добра освіта; дім оживає завдяки дітям і творчості.','A happy family and a good education; the home comes alive through children and creativity.'),
   t('Із житлом багато клопоту: ремонти, суперечки, робота замість відпочинку. Спокій удома вам доводиться відвойовувати.','Housing brings much trouble: repairs, disputes, work in place of rest. You have to win peace at home.'),
   t('Власний дім з’являється після шлюбу: затишок вам дає партнер.','A home of your own appears after marriage: your partner gives you comfort.'),
   t('Житло змінюється різко й не раз; майно приходить через спадок або спільні кошти.','Housing changes sharply and more than once; property comes through inheritance or shared funds.'),
   t('Удача з домом і землею; щастя приходить через батька, вчителів і віру в родині.','Luck with home and land; happiness comes through a father, teachers and faith in the family.'),
   t('Дім і робота у вас нероздільні: становище дає майно, а працюєте ви часто там, де живете.','Home and work are inseparable for you: standing gives property, and you often work where you live.'),
   t('Нерухомість приносить прибуток, а бажання про власний дім здійснюються.','Property brings gains, and wishes about a home of your own come true.'),
   t('Ваш дім далеко від батьківщини; спокій ви знаходите в усамітненні.','Your home is far from your homeland; you find peace in seclusion.')],
  verdict:{strong:t('Дім — сильна сфера вашої карти: родина й власний простір дають вам опору.','Home is a strong area of your chart: family and a space of your own hold you up.'),
   mixed:t('Дім — сфера середньої сили: затишок є, але його треба підтримувати.','Home is an area of middling strength: comfort is there, but it has to be maintained.'),
   hard:t('Дім — вимоглива сфера вашої карти: душевний спокій ви будуєте самі, часто далеко від місця, де виросли.','Home is a demanding area of your chart: you build peace of mind yourself, often far from where you grew up.')},
  short:{strong:t('дім дає вам опору','home holds you up'),mixed:t('затишок вимагає догляду','comfort needs upkeep'),hard:t('спокій удома ви будуєте самі','you build peace at home yourself')}},

 {id:'path',house:9,varga:20,support:[3,27,30],title:t('Шлях, удача й внутрішня сила','Path, fortune and inner strength'),vargaTopic:t('духовна практика','spiritual practice'),
  occupants:P9(
   t('Сонце в дев’ятому домі: у вас тверді принципи, а батько чи вчитель — великий авторитет.','The Sun in the ninth house: you have firm principles, and a father or teacher is a great authority.'),
   t('Місяць у дев’ятому домі: ви вірите серцем, любите подорожі, а удача приходить хвилями.','The Moon in the ninth house: you believe with the heart, love travel, and luck comes in waves.'),
   t('Марс у дев’ятому домі: ви боретеся за свої переконання й сперечаєтеся з учителями.','Mars in the ninth house: you fight for your convictions and argue with teachers.'),
   t('Меркурій у дев’ятому домі: ви вчитеся все життя й легко пояснюєте складне.','Mercury in the ninth house: you learn all your life and explain complex things with ease.'),
   t('Юпітер у дев’ятому домі — найкраще його місце: удача, мудрість і добрі вчителі.','Jupiter in the ninth house is its best place: fortune, wisdom and good teachers.'),
   t('Венера в дев’ятому домі: удача приходить через мистецтво, подорожі й приязних людей.','Venus in the ninth house: fortune comes through art, travel and friendly people.'),
   t('Сатурн у дев’ятому домі: удача пізня й заслужена; ваша віра сувора й тримається традиції.','Saturn in the ninth house: fortune is late and earned; your faith is strict and keeps to tradition.'),
   t('Раху в дев’ятому домі: погляди нетрадиційні, а вчителі приходять здалеку.','Rahu in the ninth house: your views are unorthodox, and teachers come from afar.'),
   t('Кету в дев’ятому домі: вроджена духовність і пошук поза обрядами.','Ketu in the ninth house: an inborn spirituality and a search beyond ritual.')),
  lord:[
   t('Удача супроводжує вас особисто: ви живете за принципами й самі творите свою долю.','Fortune goes with you personally: you live by principle and make your own destiny.'),
   t('Удача проявляється в грошах і родинних традиціях.','Fortune shows in money and in family traditions.'),
   t('Удача приходить через власні зусилля, письмо й поїздки: вам щастить, коли ви дієте.','Fortune comes through your own effort, writing and travel: you are lucky when you act.'),
   t('Щастя ви знаходите вдома: земля, мати й рідні місця приносять вам удачу.','You find happiness at home: land, mother and native places bring you luck.'),
   t('Одне з найкращих положень: ясний розум, мудрість і добрі плоди від усього, що ви створюєте.','One of the best placements: a clear mind, wisdom and good fruit from everything you create.'),
   t('Удача приходить через працю й подолання, а віра ваша не раз проходить випробування.','Fortune comes through work and overcoming, and your faith is tested more than once.'),
   t('Удача приходить після шлюбу, через партнерів і далекі країни.','Fortune comes after marriage, through partners and distant countries.'),
   t('Удача приходить через кризи й перервами; вас тягне до таємних знань.','Fortune comes through crises and with interruptions; you are drawn to hidden knowledge.'),
   t('Управитель у власному домі дає сильну дхарму: удачу, добрих учителів і ясний життєвий шлях.','The lord in its own house gives a strong dharma: fortune, good teachers and a clear road in life.'),
   t('Дхарма-карма раджа-йога: покликання й становище у вас збігаються, і це одна з найкращих комбінацій карти.','A dharma-karma raja yoga: calling and standing coincide for you, one of the best combinations in a chart.'),
   t('Удача дає прибуток і впливових друзів.','Fortune gives gains and influential friends.'),
   t('Ваш шлях духовний: паломництва, далекі країни, щедрість на добрі справи.','Your road is spiritual: pilgrimages, distant countries, generosity toward good causes.')],
  verdict:{strong:t('Удача — сильна сфера вашої карти: у вирішальні моменти обставини складаються на вашу користь.','Fortune is a strong area of your chart: at decisive moments circumstances turn in your favour.'),
   mixed:t('Удача — сфера середньої сили: вона приходить до того, хто вже зробив свою частину роботи.','Fortune is an area of middling strength: it comes to the one who has already done their share.'),
   hard:t('Удача — вимоглива сфера вашої карти: на везіння ви не розраховуєте й усе берете працею та досвідом.','Fortune is a demanding area of your chart: you do not count on luck and take everything by work and experience.')},
  short:{strong:t('обставини складаються на вашу користь','circumstances turn in your favour'),mixed:t('удача приходить після зробленої роботи','luck follows work done'),hard:t('усе ви берете працею','you take everything by work')}}
];

/** Supporting divisional charts: the planet read in each and what its strength says. */
export const SUPPORT:Record<number,{planet:Planet|'lagnaLord';topic:T;tier:Record<Tier,T>}>={
 3:{planet:'Mars',topic:t('сміливість і ініціатива','courage and initiative'),tier:{
  strong:t('сміливості вам не бракує, і власні починання ви доводите до кінця.','you do not lack courage and you carry your own undertakings through.'),
  mixed:t('ви зважуєтеся на крок тоді, коли бачите підтримку.','you take the step when you see support.'),
  hard:t('на перший крок ви зважуєтеся важко, і ініціативу вам треба тренувати.','the first step is hard for you, and initiative is something you have to train.')}},
 7:{planet:'Jupiter',topic:t('діти й творчий спадок','children and creative legacy'),tier:{
  strong:t('те, що ви створюєте й кого виховуєте, приносить вам радість і гордість.','what you create and whom you raise brings you joy and pride.'),
  mixed:t('творчість і виховання приносять плоди, коли ви вкладаєте в них час.','creativity and upbringing bear fruit when you put time into them.'),
  hard:t('тема дітей і власних творінь вимагає від вас терпіння й довгого дихання.','the theme of children and of your own creations asks patience and long breath of you.')}},
 12:{planet:'Sun',topic:t('батьки','parents'),tier:{
  strong:t('батьки дали вам міцну основу, і зв’язок із ними вас підтримує.','your parents gave you a firm foundation, and the bond with them supports you.'),
  mixed:t('від батьків ви взяли й добре, і складне, і розбираєтеся з цим самі.','you took both good and difficult things from your parents and sort them out yourself.'),
  hard:t('стосунки з батьками непрості, і опору вам довелося шукати поза родиною.','the relationship with your parents is not simple, and you had to look for support outside the family.')}},
 16:{planet:'Venus',topic:t('комфорт і зручності','comfort and conveniences'),tier:{
  strong:t('комфорт, транспорт і гарні речі приходять до вас легко.','comfort, vehicles and fine things come to you easily.'),
  mixed:t('зручності ви маєте, але платите за них працею.','you have your conveniences, but you pay for them with work.'),
  hard:t('комфорт дається дорого, і задоволення від речей швидко минає.','comfort comes at a high price, and the pleasure of things passes quickly.')}},
 20:{planet:'Jupiter',topic:t('духовна практика','spiritual practice'),tier:{
  strong:t('духовна практика дається вам природно й справді вас тримає.','spiritual practice comes naturally to you and truly holds you.'),
  mixed:t('практика діє тоді, коли ви робите її регулярно, а не від нагоди до нагоди.','practice works when you do it regularly rather than now and then.'),
  hard:t('до внутрішньої дисципліни ви йдете довго, через сумніви й перерви.','you come to inner discipline slowly, through doubts and interruptions.')}},
 24:{planet:'Mercury',topic:t('навчання й майстерність','learning and mastery'),tier:{
  strong:t('навчання дається вам легко, і знання швидко стають умінням.','learning comes easily to you, and knowledge quickly becomes skill.'),
  mixed:t('ви вчитеся найкраще на практиці, а не з книжок.','you learn best in practice rather than from books.'),
  hard:t('формальна освіта далася вам важко: свою майстерність ви набуваєте самотужки.','formal education was hard for you: you acquire your mastery on your own.')}},
 27:{planet:'lagnaLord',topic:t('запас сил','reserves of strength'),tier:{
  strong:t('запас сил у вас великий: ви витримуєте те, на чому ламаються інші.','your reserves of strength are large: you endure what breaks others.'),
  mixed:t('сил вам вистачає, якщо ви їх не розпорошуєте.','you have enough strength if you do not scatter it.'),
  hard:t('сили у вас закінчуються раніше, ніж плани: відпочинок для вас обов’язковий, а не бажаний.','your strength runs out before your plans do: rest is mandatory for you, not optional.')}},
 30:{planet:'Saturn',topic:t('випробування','trials'),tier:{
  strong:t('труднощі вас гартують: із випробувань ви виходите з користю.','difficulties temper you: you come out of trials with something gained.'),
  mixed:t('випробування приходять хвилями, і ви вчитеся на кожній.','trials come in waves, and you learn from each.'),
  hard:t('випробування б’ють у те саме місце кілька разів, доки ви не зміните підхід.','trials strike the same place several times until you change your approach.')}},
 40:{planet:'Moon',topic:t('материнський рід','the maternal line'),tier:{
  strong:t('материнський рід передав вам добру спадщину: звідти ваша внутрішня підтримка.','the maternal line passed a good legacy to you: your inner support comes from there.'),
  mixed:t('від материнського роду ви взяли і сильне, і те, що доводиться переглядати.','from the maternal line you took both strength and things you have to reconsider.'),
  hard:t('материнський рід залишив вам незавершені історії, які ви розв’язуєте у власному житті.','the maternal line left you unfinished stories that you resolve in your own life.')}},
 45:{planet:'Sun',topic:t('батьківський рід','the paternal line'),tier:{
  strong:t('батьківський рід передав вам гідність і характер, на які можна спиратися.','the paternal line passed on dignity and character you can lean on.'),
  mixed:t('від батьківського роду ви взяли і чесноти, і впертість.','from the paternal line you took both virtues and stubbornness.'),
  hard:t('батьківський рід залишив вам завдання, які ви розв’язуєте замість попередників.','the paternal line left you tasks that you resolve in place of those before you.')}}
};
export const VARGA_NAME:Record<number,T>={2:t('D2 (Хора)','D2 (Hora)'),3:t('D3 (Дреккана)','D3 (Drekkana)'),4:t('D4 (Чатуртхамша)','D4 (Chaturthamsha)'),
 7:t('D7 (Саптамша)','D7 (Saptamsha)'),9:t('D9 (Навамша)','D9 (Navamsha)'),10:t('D10 (Дашамша)','D10 (Dashamsha)'),
 12:t('D12 (Двадашамша)','D12 (Dvadashamsha)'),16:t('D16 (Шодашамша)','D16 (Shodashamsha)'),20:t('D20 (Вімшамша)','D20 (Vimshamsha)'),
 24:t('D24 (Чатурвімшамша)','D24 (Chaturvimshamsha)'),27:t('D27 (Бхамша)','D27 (Bhamsha)'),30:t('D30 (Трімшамша)','D30 (Trimshamsha)'),
 40:t('D40 (Кхаведамша)','D40 (Khavedamsha)'),45:t('D45 (Акшаведамша)','D45 (Akshavedamsha)'),60:t('D60 (Шаштіамша)','D60 (Shashtiamsha)')};
