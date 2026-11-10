/**
 * N4.9.5 — a reader-facing, deterministic editorial layer.
 *
 * Facts still come exclusively from the certified/verified D1 and varga
 * payloads. Interpretation is traditional and conditional; placements
 * are NOT personal facts, verified psychological traits or predictions.
 * One compact "basis" sentence is the only chart jargon in each card.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';

type Lang='uk'|'en';
type Copy=[string,string];
export type HumanReading={headline:string;teaser:string;meaning:string;basis:string};
const PLANET:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const SIGN_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах',
 'Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra',
 'Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const THEME:readonly Copy[]=[
 ['самостійних рішень та особистої свободи','independent decisions and personal agency'],
 ['матеріальної впевненості й сімейних цінностей','material security and family values'],
 ['сміливості, навичок і відкритої розмови','initiative, skills and open communication'],
 ['дому, безпеки та внутрішньої опори','home, safety and inner stability'],
 ['творчості, навчання й турботи про розвиток інших','creativity, study and nurturing growth'],
 ['щоденної майстерності та розв’язання складних завдань','daily craft and solving difficult problems'],
 ['взаємності, партнерства й чесних домовленостей','reciprocity, partnership and fair agreements'],
 ['довіри, змін і спільної відповідальності','trust, change and shared responsibility'],
 ['знань, наставництва й життєвих принципів','learning, mentorship and guiding principles'],
 ['професійної відповідальності й видимого результату','professional accountability and visible results'],
 ['спільних результатів і кола однодумців','shared achievements and a community of peers'],
 ['власного простору, тиші та відновлення','privacy, quiet and recovery']
];
// A recognizable everyday situation grounded in the natal ruler's *actual*
// house. A soft possibility, not a psychological fact about the visitor.
const LIVED:readonly Copy[]=[
 ['Вам легше зберігати мотивацію, коли головні рішення залишаються за вами.',
  'You may feel more motivated when key decisions remain yours to make.'],
 ['Впевненість може зростати, коли ви бачите конкретну віддачу від своїх зусиль.',
  'Confidence may grow when you see a tangible return on your effort.'],
 ['Розмова, нова навичка чи самостійна ініціатива можуть давати вам відчуття руху.',
  'A conversation, new skill or initiative may give you a sense of progress.'],
 ['Надійний побут і своє місце можуть давати вам більше сил, ніж зовнішнє схвалення.',
  'A dependable home base may strengthen you more than outside approval.'],
 ['Творчість, навчання або можливість підтримати розвиток іншого можуть додавати радості.',
  'Creative work, learning or helping someone grow may bring you satisfaction.'],
 ['Складні щоденні завдання можуть радувати, коли ви помічаєте власну майстерність.',
  'Daily challenges can be satisfying when you notice growing mastery.'],
 ['Чіткі домовленості й взаємна повага можуть бути важливішими за красиві обіцянки.',
  'Mutual respect and clear agreements may matter more than grand promises.'],
 ['Вам може бути важливо знати, кому довіряти спільну відповідальність і як проходити зміни.',
  'You may care deeply about who shares responsibility when circumstances change.'],
 ['Навчання та зрозумілі життєві принципи можуть допомагати зберігати напрям.',
  'Learning and clear guiding principles may help you find direction.'],
 ['Вам може бути важливо бачити результат, за який хочеться взяти відповідальність.',
  'You may value work that produces a result you are proud to stand behind.'],
 ['Спільна мета й коло однодумців можуть підтримувати вашу мотивацію.',
  'A shared goal and supportive peers may help sustain your motivation.'],
 ['Час без зайвого шуму може бути потрібен вам, щоб повертати ясність і сили.',
  'Quiet time away from demands may help you restore clarity and energy.']
];
const STYLE:readonly Copy[]=[
 ['діяти сміливо, не нехтуючи перевіркою деталей','act decisively while checking the details'],
 ['будувати стабільний ритм і доводити розпочате до кінця','build a steady rhythm and follow through'],
 ['обмінюватися ідеями й знаходити спільну мову','exchange ideas and find a common language'],
 ['піклуватися про відчуття безпеки й близькості','care for security and emotional closeness'],
 ['проявляти ініціативу творчо й відкрито','express initiative creatively and openly'],
 ['помічати деталі й поступово вдосконалювати роботу','notice details and improve things step by step'],
 ['шукати рівновагу й домовлятися без тиску','seek balance and negotiate without pressure'],
 ['розбиратися в прихованій складності й будувати довіру','explore complexity and build trust'],
 ['навчатися, пояснювати й бачити ширший контекст','learn, teach and see the bigger picture'],
 ['планувати надовго й витримувати обраний темп','plan for the long term and sustain your pace'],
 ['шукати нестандартні рішення разом з іншими','seek unconventional answers with others'],
 ['поєднувати уяву зі співчуттям і конкретною допомогою','pair imagination and compassion with tangible help']
];
// Actual varga house -> a complete everyday situation. This avoids
// inserting a genitive house label into an ungrammatical "theme of" slot.
const ARENA:readonly Copy[]=[
 ['у ситуації, де рішення залежать від вас','when a decision is yours to make'],
 ['у плануванні витрат і заощаджень','when planning spending and savings'],
 ['у важливій розмові або спільному завданні','in a difficult conversation or shared task'],
 ['у турботі про свій дім і близьких','when caring for your home and loved ones'],
 ['у творчих завданнях або навчанні інших','when creating or teaching someone'],
 ['у розв’язанні складної щоденної задачі','when dealing with a demanding everyday task'],
 ['у домовленостях із партнером','when making agreements with a partner'],
 ['у спільній відповідальності й відновленні довіри','when trust and shared responsibility matter'],
 ['у навчанні або передачі досвіду','when learning or sharing what you know'],
 ['у виконанні професійного завдання','when taking responsibility for a result at work'],
 ['у роботі з однодумцями','when working with a community'],
 ['у хвилини тиші й відновлення','when you need quiet and recovery']
];
const LEAD:Readonly<Record<number,Copy>>={
 1:['Ваше відчуття себе тісно пов’язане з темою','Your sense of self is closely linked with'],
 2:['У ставленні до грошей і того, що справді цінне, помітна тема','In your approach to money and what matters, a central theme is'],
 3:['Ваша сміливість та спосіб говорити про свої ідеї пов’язані з темою','Your courage and the way you express ideas connect with'],
 4:['Відчуття дому й внутрішньої захищеності для вас переплетене з темою','Your sense of home and security is intertwined with'],
 7:['У творчості, турботі й передачі досвіду особливо важливою стає тема','In creative work, care and passing on knowledge, an important theme is'],
 9:['У близьких стосунках вам варто звертати увагу на тему','In close relationships, pay attention to'],
 10:['У виборі професійного напряму для вас може бути визначальною тема','In choosing a vocational direction, an important theme may be'],
 12:['У стосунках із родинною історією та батьківськими прикладами виникає тема','In your relationship with family history and parental examples, a theme is'],
 16:['У питанні комфорту, побуту та повсякденної зручності важлива тема','In everyday comfort, routines and practical convenience, a theme is'],
 20:['Духовна практика для вас може природно поєднуватися з темою','Your spiritual practice may naturally connect with'],
 24:['У навчанні та розвитку майстерності для вас важлива тема','In learning and developing mastery, an important theme is'],
 27:['Ваша витривалість найкраще розкривається, коли ви зважаєте на тему','Your resilience benefits from paying attention to'],
 30:['Коли виникають труднощі, корисно спиратися на тему','When difficulties arise, it helps to lean on'],
 40:['Успадковані способи турботи та материнські приклади зачіпають тему','Inherited patterns of care and maternal examples touch on'],
 45:['У переданих родиною принципах і батьківських прикладах важлива тема','In inherited principles and paternal examples, an important theme is']
};
// Situation-first openings for supplementary vargas. The following sentences
// are selected by chart placements; no naked "theme of X" template reaches the reader.
const HUMAN_OPENING:Readonly<Record<number,Copy>>={
 3:['Коли потрібно захистити свою думку, розпочати розмову або підтримати близьку людину, сміливість має йти поруч з умінням слухати.',
    'Whether you are speaking up, starting a conversation or standing by someone close, courage works best alongside listening.'],
 7:['Те, що ви створюєте або передаєте іншим, може бути цінним навіть без гучного визнання.',
    'What you create or pass on to others can have value even without public recognition.'],
 12:['Батьківський досвід може бути опорою, але не повинен автоматично визначати кожне ваше рішення.',
     'Parental examples may provide support without deciding every choice you make.'],
 16:['Комфорт — це не обов’язково дорожчі речі: важливіше, чи допомагає повсякденне середовище жити й відновлюватися.',
     'Comfort is not always about buying more: what matters is whether everyday surroundings help you live and recharge.'],
 20:['Духовна практика стає змістовнішою, коли є місце для регулярності та особистого досвіду.',
     'Spiritual practice can gain meaning through consistency and lived experience.'],
 27:['Сила проявляється не тільки в наполегливості, а й у здатності вчасно змінити темп.',
     'Strength includes not only persistence but also knowing when to change your pace.'],
 30:['Коли обставини тиснуть, важливо бачити конкретні можливості, а не сприймати труднощі як вирок.',
     'When circumstances are difficult, look for workable choices rather than treating setbacks as fate.'],
 40:['Родинні способи піклуватися можуть впливати на звички, але ви можете обрати власний спосіб підтримки.',
     'Family examples of care may shape habits, but you can choose what support means to you.'],
 45:['Успадковані принципи можуть допомагати, коли ви свідомо перевіряєте, які з них ваші.',
     'Inherited principles can help when you consciously decide which ones are truly yours.']
};
const ADVICE:Readonly<Record<number,Copy>>={
 1:['Виділіть окремо те, що дає вам відчуття мети, і те, що реально повертає сили.',
    'Distinguish what gives you purpose from what actually restores your energy.'],
 2:['Ведіть окремий облік надходжень, зобов’язань і накопичень: так стає видно, що створює опору.',
    'Track earnings, obligations and savings separately to see what builds stability.'],
 3:['Підготуйте одну важливу розмову й перевірте, чи ваша рішучість поєднується з умінням слухати.',
    'Prepare one important conversation and test whether resolve comes with listening.'],
 4:['Перед важливим рішенням про житло запитайте себе, чи воно забезпечує не лише зручність, а й спокій.',
    'Before a housing decision, ask whether it offers peace of mind as well as convenience.'],
 7:['Спробуйте навчити когось конкретної навички або створити щось, що допоможе іншій людині зростати.',
    'Teach someone a concrete skill or create something that helps another person grow.'],
 9:['Обговоріть окремо почуття, особисті межі та спільні зобов’язання: кожне питання потребує своєї розмови.',
    'Discuss feelings, boundaries and shared obligations separately; each deserves its own conversation.'],
 10:['Спробуйте невеликий робочий проєкт, у якому видно результат, перш ніж обирати нову спеціалізацію.',
    'Try a small project with a visible result before committing to a new specialization.'],
 12:['Згадайте одне сімейне правило і визначте, чи воно допомагає вашим рішенням сьогодні.',
    'Choose one inherited family rule and consider whether it serves your decisions today.'],
 16:['Перед покупкою перевірте, чи справді річ полегшить щоденне життя, а не лише порадує на мить.',
    'Before buying, test whether an item will make everyday life easier beyond the first thrill.'],
 20:['Оберіть коротку духовну практику, яку можна підтримувати щодня без очікування швидкого дива.',
    'Choose a short spiritual practice you can sustain without expecting instant transformation.'],
 24:['Перетворіть знання на невеликий завершений проєкт, щоб побачити, що вже вмієте на практиці.',
    'Turn what you have learned into a small finished project to test practical mastery.'],
 27:['Перед складним завданням визначте межу навантаження та час на відновлення.',
    'Before a demanding task, set a workload limit and protect recovery time.'],
 30:['Виберіть одну повторювану перешкоду і складіть план: що можна змінити, а що потребує терпіння.',
    'Pick one recurring obstacle and decide what can change and what needs patience.'],
 40:['Порівняйте сімейний спосіб піклуватися з тим, яку підтримку ви самі вважаєте корисною.',
    'Compare inherited styles of care with the support you personally find helpful.'],
 45:['Сформулюйте власними словами один успадкований принцип, який ви справді хочете зберегти.',
    'Put one inherited principle you genuinely want to keep into your own words.']
};
// These situations belong to their own varga's subject, not a generic
// "life topic" spliced into advice. Index = verified divisional house - 1.
const RELATIONSHIP_SCENE:readonly Copy[]=[
 ['Для партнерства це може означати домовленість про особистий простір і право кожного на власне рішення.','In a relationship, this can mean agreeing on personal space and each person\'s right to make their own choices.'],
 ['Обговоріть, що для вас обох означають спільні витрати, заощадження й сімейні цінності.','Talk about what shared expenses, savings and family values mean to each of you.'],
 ['Перевірте, чи вдається говорити про бажання відкрито й чути відповідь без поспіху.','Notice whether both people can express a wish openly and hear the answer without rushing.'],
 ['Поговоріть про те, який побут і відчуття дому роблять ваш союз спокійнішим.','Talk about the kind of home life that makes your relationship feel secure.'],
 ['Знайдіть заняття, у якому є місце і для спільної радості, і для творчості кожного.','Make room for shared enjoyment and each person\'s creativity.'],
 ['Узгодьте повсякденні справи: що кожен готовий робити регулярно, а де потрібна допомога.','Agree on everyday responsibilities, including what each person can sustain and where help is needed.'],
 ['Обговоріть взаємність: чи однаково ви розумієте підтримку, відданість і спільні рішення.','Discuss reciprocity: do you mean the same thing by support, commitment and shared decisions?'],
 ['З\'ясуйте, як ви говорите про довіру, спільні ризики та складні зміни.','Explore how you speak about trust, shared risks and difficult changes.'],
 ['Порівняйте життєві переконання: як кожен ставиться до навчання, духовних пошуків і порад інших.','Compare guiding beliefs, including how each person sees learning, spirituality and advice from others.'],
 ['Обговоріть, як робота й амбіції впливають на час, який ви залишаєте одне одному.','Discuss how work and ambitions affect the time you can give each other.'],
 ['Запитайте, які спільні плани й дружні зв\'язки підтримують ваш союз.','Ask which shared plans and friendships help the relationship thrive.'],
 ['Домовтеся, скільки часу на усамітнення потрібно кожному, щоб близькість не ставала тиском.','Agree on how much private time each person needs so closeness does not become pressure.']
];
const CHILDREN_CREATIVE_SCENE:readonly Copy[]=[
 ['У творчості або вихованні дайте іншій людині простір для власної ініціативи.','In creative work or caregiving, leave room for the other person\'s initiative.'],
 ['Якщо передаєте досвід, почніть із простих навичок і бережного ставлення до спільних ресурсів.','When passing on knowledge, start with practical skills and care for shared resources.'],
 ['Покажіть ідею на прикладі й дайте поставити запитання, замість вимагати повторення.','Demonstrate an idea and invite questions instead of demanding imitation.'],
 ['Для творчості та турботи важливий безпечний простір, у якому не страшно помилятися.','Creativity and care benefit from a safe environment where mistakes are allowed.'],
 ['Підтримуйте гру й творчі спроби без очікування негайного ідеального результату.','Encourage play and creative attempts without demanding an ideal result.'],
 ['У навчанні дітей або спільному проєкті краще працюють невеликі регулярні кроки.','When teaching children or building something together, small consistent steps can help.'],
 ['У вихованні та співавторстві заздалегідь узгоджуйте ролі й очікування.','In caregiving or creative collaboration, agree on roles and expectations.'],
 ['Під час складних змін у сім\'ї або творчій справі важливо пояснювати рішення доступно.','During difficult changes in a family or creative project, explain decisions clearly.'],
 ['Передавайте знання як запрошення до пошуку, а не як вимогу погоджуватися.','Offer knowledge as an invitation to explore, not a demand to agree.'],
 ['Помічайте, коли творчі чи виховні зусилля перетворюються на надмірну гонитву за успіхом.','Notice when creative or caregiving efforts become a stressful race for achievement.'],
 ['Спільна творча справа може зміцнити підтримку між поколіннями або друзями.','A shared creative effort can strengthen support between generations or friends.'],
 ['Після інтенсивного навчання або турботи залишайте час для відпочинку й тиші.','After intensive teaching or caring, make space for rest and quiet.']
];

const HOUSE_TASK:readonly Copy[]=[
 ['взяти на себе головне рішення в невеликому проєкті','own one important decision in a small project'],
 ['пояснити цінність роботи чи скласти прозорий бюджет','explain the value of work or build a clear budget'],
 ['створити інструкцію чи прототип для інших','create an explanation or prototype for others'],
 ['покращити процес, від якого залежить надійність команди','improve a process that makes a team more reliable'],
 ['створити власний прототип або навчити когось','build a prototype or teach someone'],
 ['виправити повторювану проблему й виміряти результат','fix a recurring problem and measure the result'],
 ['домовитися про розподіл обов’язків у спільній задачі','agree on responsibilities in shared work'],
 ['проаналізувати складну ситуацію та запропонувати обережне рішення','analyze a complex situation and propose a careful solution'],
 ['підготувати короткий навчальний матеріал','prepare a concise lesson or guide'],
 ['довести невеликий проєкт від плану до результату','deliver a small project from plan to result'],
 ['зробити щось корисне для групи й оцінити відгук','create something useful for a group and assess feedback'],
 ['самостійно дослідити проблему й описати висновки','investigate a problem independently and document findings']
];
const choose=(copy:Copy,lang:Lang)=>copy[lang==='uk'?0:1];
const isStrong=(quality:string)=>quality==='own'||quality==='exalted';

/**
 * D60 is a full editorial card, not the old raw-position dump. It uses only
 * sign-level factors accepted by the existing time/boundary evidence filter.
 * D60 houses, lagna, past lives and certified birth-time claims are excluded.
 */
export function buildHumanReaderD60(chart:CalculatedChart,lang:Lang):HumanReading|null{
 const evidence=buildD60Preview(chart,lang);
 if(evidence.status!=='conditional_signs'||evidence.factors.length===0)return null;
 const uk=lang==='uk',lords=classicalLordshipTable(chart.ascendant.sign);
 const first=evidence.factors[0],second=evidence.factors.find(p=>p.planet!==first.planet);
 const roleUk:Record<string,string>={Sun:'особистої відповідальності та вибору',
  Moon:'емоційного ритму й відчуття безпеки',
  Mars:'рішучості та захисту власних меж',
  Mercury:'мислення, навчання й спілкування',
  Jupiter:'принципів, знань і наставництва',
  Venus:'близькості, гармонії та почуття міри',
  Saturn:'витримки, обов’язків і довгострокових рішень'};
 const roleEn:Record<string,string>={Sun:'responsibility and personal choices',
  Moon:'emotional rhythms and feeling secure',
  Mars:'courage and personal boundaries',
  Mercury:'thinking, learning and communication',
  Jupiter:'principles, learning and mentorship',
  Venus:'affection, harmony and finding balance',
  Saturn:'endurance, commitments and long-term decisions'};
 const role=(p:string)=>uk?roleUk[p]:roleEn[p];
 const style=(sign:number)=>choose(STYLE[sign-1],lang);
 const significant=first.planet===lords[1];
 const opening=uk?
  'Зіставлення D1 та D60 допомагає помітити символічний мотив '+role(first.planet)+'. '+
  (significant?'Вона також пов’язана з тим, як ви визначаєте власний життєвий напрям. ':
   'Особливо помітною вона може ставати у важливих особистих рішеннях. '):
  'Comparing D1 and D60 may highlight the symbolic pattern of '+role(first.planet)+'. '+
  (significant?'This also connects with the direction you choose for yourself. ':
   'It may become especially relevant during important personal decisions. ');
 const contrast=first.d1Sign===first.d60Sign?
  (uk?'У звичному житті й у складніших ситуаціях повторюється той самий мотив: прагнення '+
   style(first.d60Sign)+'. Послідовність тут може бути вашою опорою. ':
   'In everyday life and more difficult moments, a similar theme repeats: the wish to '+
   style(first.d60Sign)+'. That consistency may be a useful anchor. '):
  (uk?'У повсякденному житті ви можете прагнути '+style(first.d1Sign)+
   ', а у складних виборах стає важливим уміння '+style(first.d60Sign)+
   '. Ці два підходи не суперечать один одному: вони можуть доповнюватися. ':
   'In everyday life you may prefer to '+style(first.d1Sign)+
   ', while difficult decisions can call for learning to '+style(first.d60Sign)+
   '. These approaches can complement one another. ');
 const secondSentence=!second?'':second.d1Sign===second.d60Sign?
  (uk?'Інша важлива тема — '+role(second.planet)+
   ': тут також повторюється прагнення '+style(second.d60Sign)+'. ':
   'Another theme is '+role(second.planet)+
   ', with a repeated inclination to '+style(second.d60Sign)+'. '):
  (uk?'У сфері '+role(second.planet)+' може знадобитися поєднати звичку '+
   style(second.d1Sign)+' з умінням '+style(second.d60Sign)+'. ':
   'With '+role(second.planet)+', you may need to combine the familiar wish to '+
   style(second.d1Sign)+' with the ability to '+style(second.d60Sign)+'. ');
 const practice=uk?
  'Практичний крок: згадайте один недавній непростий вибір. Що допомогло вам діяти впевнено, '+
  'а яку навичку хотілося б розвинути перед наступним таким рішенням?':
  'Practical step: reflect on one recent difficult choice. What helped you act confidently, '+
  'and which skill would you like to develop before the next one?';
 const name=(p:string)=>uk?PLANET[p]||p:p;
 const signName=(x:number)=>uk?SIGN_UK[x-1]:SIGN_EN[x-1];
 const clause=(p:typeof first)=>name(p.planet)+
  (uk?' — D1: '+signName(p.d1Sign)+', D60: '+signName(p.d60Sign):
   ' — D1 '+signName(p.d1Sign)+', D60 '+signName(p.d60Sign));
 const basis=(uk?'Астрологічна основа: ':'Astrological basis: ')+clause(first)+
  (second?'; '+clause(second):'')+'.';
 const meaning=opening+contrast+secondSentence+practice+' '+basis;
 const headline=uk?'D60 — Глибинні мотиви й життєві уроки':
  'D60 — Deeper motivations and life lessons';
 const teaser=uk?'Як ви поєднуєте звичні способи дії з тим, чого навчають непрості рішення.':
  'How familiar ways of acting relate to what difficult choices can teach you.';
 return {headline,teaser,meaning,basis};
}

export function buildHumanReaderCard(chart:CalculatedChart,lang:Lang,division:number):HumanReading|null{
 if(division===60)return buildHumanReaderD60(chart,lang);
 if(!LEAD[division])return null;
 const source=verifiedVargaSource(chart);if(!source)return null;
 const uk=lang==='uk',lords=classicalLordshipTable(chart.ascendant.sign);
 const subjectHouse:Record<number,number>={1:1,2:2,3:3,4:4,7:5,9:7,10:10,12:4,
  16:4,20:9,24:5,27:1,30:6,40:4,45:9};
 const lord=lords[subjectHouse[division]];
 const natal=chart.d1.find(p=>p.name===lord)!;
 const placement=source.charts.find(c=>c.division===division)!.planets.find(p=>p.name===lord)!;
 const moon=chart.d1.find(p=>p.name==='Moon')!;
 const sun=chart.d1.find(p=>p.name==='Sun')!;
 const theme=(house:number)=>choose(THEME[house-1],lang);
 const style=choose(STYLE[placement.sign-1],lang);
 const q=dignityFor(lord,placement.sign);
 let lead=HUMAN_OPENING[division]?
  choose(HUMAN_OPENING[division],lang):choose(LEAD[division],lang)+' '+theme(natal.house)+'.';
 if([1,2,9,10,24].includes(division))lead+=' '+choose(LIVED[natal.house-1],lang);
 // Lead with a lived situation, not mechanically inflected genitive house
 // topics ("із довіри", "через дому"). LIVED entries are complete sentences,
 // so Ukrainian grammar is sound regardless of the calculated house.
 if(division===1)lead=(uk?
  'Що допомагає вам обирати власний шлях? ':'What helps you choose your own direction? ')+
  choose(LIVED[natal.house-1],lang);
 if(division===2)lead=(uk?
  'Гроші легше впорядкувати, коли ви знаєте, що для вас означає достаток. ':
  'Managing money becomes easier when you know what security means to you. ')+
  choose(LIVED[natal.house-1],lang);
 if(division===4)lead=(uk?
  'Дім має бути місцем, де можна відновити сили, а не ще одним джерелом напруги. ':
  'Home should be somewhere you can recover, not another source of pressure. ')+
  choose(LIVED[natal.house-1],lang);
 if(division===9)lead=(uk?
  'Близькість тримається не лише на почуттях, а й на тому, як ви домовляєтеся в повсякденні. ':
  'Intimacy rests not just on feelings but on how you negotiate everyday life together. ')+
  choose(LIVED[natal.house-1],lang);
 if(division===10)lead=(uk?
  'У роботі важливо бачити результат своїх зусиль і розуміти, за що ви відповідаєте. ':
  'At work, seeing a clear result and knowing your responsibilities can matter. ')+
  choose(LIVED[natal.house-1],lang);
 const sameSphere=natal.house===placement.house;
 const topic=theme(placement.house);
 const arena=choose(ARENA[placement.house-1],lang);
 const bridgeUk:Record<number,string>={
  1:'Тут особливої ваги набуває тема '+topic+'. Варто '+style+'.',
  2:'Порівняйте свої реальні зобов’язання з тим, на що хочеться витратити гроші цього місяця. У рішеннях може допомогти звичка '+style+'.',
  3:'Слова й дії можуть підтримувати одне одного '+arena+'. Тут знадобиться вміння '+style+'.',
  4:'Облаштовуйте побут так, щоб у ньому залишався простір для звички '+style+'.',
  7:'Турбота й творчість часто стають помітними '+arena+'. Зверніть увагу, наскільки вам вдається '+style+'.',
  9:'Додаткова карта пропонує уважніше подивитися на '+topic+'. У спілкуванні корисно '+style+'.',
  10:'Професійний шлях зачіпає тему '+topic+'. Спробуйте '+style+'.',
  12:'Не всі успадковані правила потрібно приймати автоматично. Перевіряйте власний вибір '+arena+' й пробуйте '+style+'.',
  16:'Зручність має підтримувати вас, а не керувати звичками. Помічайте це '+arena+' й спробуйте '+style+'.',
  20:'Зосередженість краще перевіряти щоденною практикою '+arena+'. Тут може бути корисно '+style+'.',
  24:'Знання стають майстерністю, коли проходять перевірку справою. Зверніть увагу на тему '+topic+' і спробуйте '+style+'.',
  27:'Витривалість включає вміння змінити темп '+arena+'. Спробуйте '+style+'.',
  30:'Труднощі не означають, що напрям обрано неправильно. Перевірте свої звички '+arena+' та спробуйте '+style+'.',
  40:'Родинні зразки турботи можна переосмислювати '+arena+'. Корисно спробувати '+style+'.',
  45:'Між родинними правилами й вашим вибором завжди є простір для рішення '+arena+'. Спробуйте '+style+'.'
 };
 const bridgeEn:Record<number,string>={
  1:'The area of '+topic+' deserves special attention. Try to '+style+'.',
  2:'Compare your real commitments with what you want to spend this month. It may help to '+style+'.',
  3:'Words and action can support each other '+arena+'. Practice how to '+style+'.',
  4:'Shape daily routines so there is room to '+style+'.',
  7:'Care and creativity often show their value '+arena+'. Notice what happens when you '+style+'.',
  9:'The supplementary chart brings '+topic+' into view when expectations are discussed. It helps to '+style+'.',
  10:'Working life brings the area of '+topic+' into focus. Try to '+style+'.',
  12:'Not every inherited rule has to become your own. Test your choices '+arena+' and try to '+style+'.',
  16:'Comfort should support you rather than dictate habits. Notice this '+arena+' and try to '+style+'.',
  20:'Consistency grows through small repeated practices '+arena+'. Try to '+style+'.',
  24:'Knowledge becomes mastery when it survives a practical test. In '+topic+', try to '+style+'.',
  27:'Resilience includes adjusting your pace '+arena+'. Try to '+style+'.',
  30:'Difficulty does not mean you chose the wrong path. Check your habits '+arena+' and try to '+style+'.',
  40:'Family patterns of care can be reconsidered '+arena+'. Try to '+style+'.',
  45:'There is room to choose between inherited rules and your beliefs '+arena+'. Try to '+style+'.'
 };
 let bridge=uk?bridgeUk[division]:bridgeEn[division];
 // Mention a life area once. When both independent chart views point to
 // the same house topic, add a concrete working habit instead of repeating
 // that same noun phrase in two consecutive sentences.
 if(sameSphere&&![1,9,10,24].includes(division)){
  bridge=uk?
   'Цей акцент повторюється і в додатковій карті. Замість ще одного опису сфери спробуйте '+style+'.':
   'The supplementary chart returns to the same area. Rather than repeating its label, try to '+style+'.';
 }
 if(division===1){
  bridge=uk?
   (lord==='Moon'?
    'Ваш особистий ритм і потреба у відновленні тут пов’язані особливо тісно. ':
    'Ваш спосіб відновлювати сили пов’язаний із темою '+theme(moon.house)+'. ')+
   'Водночас рішення, за які ви готові відповідати, можуть розкриватися через тему '+theme(sun.house)+'.':
   (lord==='Moon'?
    'Your sense of direction and your need to recharge are closely connected. ':
    'Your need for recovery also relates to '+theme(moon.house)+'. ')+
   'The choices you take responsibility for can emerge through '+theme(sun.house)+'.';
 }
 if(division===9){
  const venus=source.charts.find(c=>c.division===9)!.planets.find(p=>p.name==='Venus')!;
  const trust=lords[8]===lord;
  bridge=uk?
   (trust?'Довіра та спільна відповідальність стають не другорядним питанням, а частиною самої близькості. ':
    'Зрілі стосунки потребують узгодити почуття й реальні домовленості. ')+
   (lord==='Venus'?'Бажання близькості й готовність до зобов’язань мають спільну основу. ':
    venus.house===placement.house?'Почуття й обов’язки частіше зустрічаються в одній сфері. ':
    'Почуття та побутові обов’язки можуть вимагати різних розмов. ')+
   choose(RELATIONSHIP_SCENE[placement.house-1],lang):
   (trust?'Trust and shared responsibility are central parts of intimacy. ':
    'Mature relationships need both affection and clear agreements. ')+
   (lord==='Venus'?'Affection and commitment share one symbolic anchor. ':
    venus.house===placement.house?'Feelings and commitments meet in a shared arena. ':
    'Emotional closeness and practical duties may require different conversations. ')+
   choose(RELATIONSHIP_SCENE[placement.house-1],lang);
 }
 if(division===7){
  // A D7 house colors parenting/creative legacy; it does not convert this
  // reading into a generic relationship or career instruction.
  bridge=choose(CHILDREN_CREATIVE_SCENE[placement.house-1],lang);
 }
 if(division===10){
  bridge=uk?
   'Перевірте свій спосіб працювати на реальному невеликому завданні: корисно '+style+'. Результат покаже, де ви найефективніші.':
   'Test your working style on one manageable real task: try to '+style+'. Use the result to see where your strengths actually help.';
 }
 if(division===24){
  bridge=uk?
   'Щоб знання стали навичкою, застосовуйте їх у справі — особливо '+arena+
   '. Результат важливіший за кількість прочитаного.':
   'Put knowledge into action, especially '+arena+
   '. The result matters more than the amount you read.';
 }
 const difficulty=q==='debilitated'?
  (uk?'Тут особливо важливо не поспішати з висновками: складне краще розбити на посильні кроки.':
   'Avoid rushing conclusions here: break difficult tasks into manageable steps.'):
  isStrong(q)?
  (uk?'Традиційне прочитання підкреслює цю тему як потенційну опору, яку варто перевірити на практиці.':
   'The traditional reading treats this as a potential strength worth testing in practice.'):'';
 const practice=division===10?
  (uk?'Спробуйте '+HOUSE_TASK[placement.house-1][0]+'.':
   'Try to '+HOUSE_TASK[placement.house-1][1]+'.'):
  choose(ADVICE[division],lang);
 const sign=uk?SIGN_UK[placement.sign-1]:SIGN_EN[placement.sign-1];
 const planet=uk?PLANET[lord]:lord;
 const basis=division===1?
  (uk?'Астрологічна основа: '+planet+' — управитель висхідного знака, '+natal.house+
    '-й дім D1; '+(lord==='Moon'?'':'Місяць — '+moon.house+'-й дім; ')+
    'Сонце — '+sun.house+'-й дім.':
   'Astrological basis: '+lord+' rules the ascendant, house '+natal.house+
    ' in D1; '+(lord==='Moon'?'':'Moon in house '+moon.house+'; ')+
    'Sun in house '+sun.house+'.'):
  (uk?'Астрологічна основа: '+planet+' — управитель '+subjectHouse[division]+
   '-го дому; D1: '+natal.house+'-й дім; D'+division+': '+placement.house+
   '-й дім, '+sign+'.':
   'Astrological basis: '+lord+' rules house '+subjectHouse[division]+
   '; D1 house '+natal.house+'; D'+division+' house '+placement.house+', '+sign+'.');
 const headline=uk?
  (division===10?'Робота: від '+theme(natal.house)+' до '+theme(placement.house):
   division===9?'Стосунки: близькість, довіра й реальні домовленості':
   division===1?'Ваш внутрішній напрям і те, що дає опору':
   'Як проявляється тема '+theme(natal.house)):
  (division===10?'Career: from '+theme(natal.house)+' to '+theme(placement.house):
   division===9?'Relationships: closeness, trust and agreements':
   division===1?'Your direction and what grounds you':
   'How '+theme(natal.house)+' shapes this area');
 const teaser=choose(LEAD[division],lang)+' '+theme(natal.house)+'. '+(sameSphere?
  (uk?'Цей самий акцент повторюється в додатковій карті.':'The same focus is repeated in the supplementary chart.'):
  (uk?'Другий акцент — '+theme(placement.house)+'.':'A second focus is '+theme(placement.house)+'.'));
 const meaning=[lead,bridge,difficulty,uk?'Практичний крок: '+practice:'Practical step: '+practice,basis]
  .filter(Boolean).join(' ');
 return {headline,teaser,meaning,basis};
}

export function buildHumanReaderSummary(chart:CalculatedChart,lang:Lang){
 const uk=lang==='uk';
 const identity=buildHumanReaderCard(chart,lang,1)!;
 const career=buildHumanReaderCard(chart,lang,10)!;
 const partner=buildHumanReaderCard(chart,lang,9)!;
 // Compact and person-first: no second round of planetary positions.
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const h=(p:string)=>chart.d1.find(x=>x.name===p)!.house;
 const theme=(house:number)=>choose(THEME[house-1],lang);
 const shared=h(lords[1])===h(lords[10]);
 return {
  strength:uk?
   'Ваш особистий напрям тісно пов’язаний із темою '+theme(h(lords[1]))+
   '. У професії на перший план виходить тема '+theme(h(lords[10]))+'.':
   'Your personal direction is linked with '+theme(h(lords[1]))+
   '. In working life, '+theme(h(lords[10]))+' comes to the foreground.',
  attention:uk?
   (shared?'Особисті цілі та робота можуть вимагати уваги одночасно; бережіть час на відновлення.':
    'Не вимагайте, щоб робота, стосунки та відпочинок давали однакове відчуття задоволення.'):
   (shared?'Personal goals and work may compete for attention; make room for recovery.':
    'Work, relationships and rest need not provide the same kind of fulfillment.'),
  direction:uk?
   (lords[1]===lords[10]?'Особистий напрям і професійні прагнення мають спільну основу; важливо, щоб робота не забирала весь простір для себе. ':'')+
   'У стосунках особливу роль може відігравати тема '+theme(h(lords[7]))+
   '. Для початку перевірте один професійний задум невеликим проєктом і обговоріть одну важливу домовленість із близькою людиною.':
   (lords[1]===lords[10]?'Personal direction and professional ambitions share a common foundation; leave room for life beyond work. ':'')+
   'Relationships may call attention to '+theme(h(lords[7]))+
   '. Start by testing one vocational idea with a small project and discussing one important agreement with someone close.',
  overview:uk?
   'Ваша внутрішня опора пов’язана з темою '+theme(h(lords[1]))+
   ', робочі прагнення — з темою '+theme(h(lords[10]))+
   ', а партнерство — з темою '+theme(h(lords[7]))+
   '. Розвивайте їх окремо: випробуйте професійний задум на практиці та проговоріть важливі зобов’язання.':
   'Your inner foundation connects with '+theme(h(lords[1]))+
   ', vocational pursuits with '+theme(h(lords[10]))+
   ', and partnership with '+theme(h(lords[7]))+
   '. Develop them deliberately: test a work idea in practice and discuss important commitments.',
  references:[identity.basis,career.basis,partner.basis]
 };
}
