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

export function buildHumanReaderCard(chart:CalculatedChart,lang:Lang,division:number):HumanReading|null{
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
 let lead=choose(LEAD[division],lang)+' '+theme(natal.house)+'.';
 if([1,2,9,10,24].includes(division))lead+=' '+choose(LIVED[natal.house-1],lang);
 const topic=theme(placement.house);
 const bridgeUk:Record<number,string>={
  1:'Тут особливої ваги набуває тема '+topic+'. Варто '+style+'.',
  2:'Фінансова впевненість виростає не лише з доходу, а й з повсякденних звичок. Зверніть увагу на тему '+topic+'; корисно '+style+'.',
  3:'Сміливість працює краще, коли її чують інші. У сфері '+topic+' вам стане в пригоді вміння '+style+'.',
  4:'Внутрішня опора не завжди тотожна зовнішньому комфорту. У сфері '+topic+' допомагає вміння '+style+'.',
  7:'Творчість має значення не лише для автора, а й для тих, хто отримує від неї користь. Тут важлива тема '+topic+'; спробуйте '+style+'.',
  9:'Тема '+topic+' може уточнювати ваші очікування від близькості. Особливо корисно '+style+'.',
  10:'Професійний шлях зачіпає тему '+topic+'. Спробуйте '+style+'.',
  12:'Не всі успадковані правила потрібно приймати автоматично. У темі '+topic+' корисно '+style+'.',
  16:'Зручність має підтримувати ваші звички, а не керувати ними. Зверніть увагу на тему '+topic+' і спробуйте '+style+'.',
  20:'Глибока практика починається не з обіцянок, а з послідовності. У темі '+topic+' корисно '+style+'.',
  24:'Знання стають майстерністю, коли проходять перевірку справою. Зверніть увагу на тему '+topic+' і спробуйте '+style+'.',
  27:'Справжня витривалість — це також вміння вчасно змінити темп. У сфері '+topic+' допомагає здатність '+style+'.',
  30:'Труднощі не обов’язково означають неправильний напрям. У темі '+topic+' варто '+style+'.',
  40:'Те, як у вашій родині проявляли турботу, не зобов’язує вас повторювати все без змін. Особливо важлива тема '+topic+'; спробуйте '+style+'.',
  45:'Між успадкованими правилами та власними переконаннями є простір для вибору. Тема '+topic+' допоможе його побачити; варто '+style+'.'
 };
 const bridgeEn:Record<number,string>={
  1:'The area of '+topic+' deserves special attention. Try to '+style+'.',
  2:'Financial confidence depends on daily habits, not just income. Look at '+topic+' and try to '+style+'.',
  3:'Courage works best when others can hear you. With '+topic+', practice how to '+style+'.',
  4:'Inner security is not always the same as outward comfort. In '+topic+', it helps to '+style+'.',
  7:'Creativity matters to the people it helps, not just its creator. Consider '+topic+' and try to '+style+'.',
  9:'The area of '+topic+' may clarify expectations in closeness. It helps to '+style+'.',
  10:'Working life brings the area of '+topic+' into focus. Try to '+style+'.',
  12:'Not every inherited rule has to become your own. In '+topic+', try to '+style+'.',
  16:'Comfort should support your habits rather than control them. Consider '+topic+' and try to '+style+'.',
  20:'A meaningful practice is built through consistency rather than big promises. In '+topic+', try to '+style+'.',
  24:'Knowledge becomes mastery when it survives a practical test. In '+topic+', try to '+style+'.',
  27:'Resilience includes knowing when to change your pace. In '+topic+', practice how to '+style+'.',
  30:'Difficulty does not automatically mean you are on the wrong path. In '+topic+', try to '+style+'.',
  40:'Inherited styles of care need not be repeated unchanged. Consider '+topic+' and try to '+style+'.',
  45:'There is room for choice between inherited rules and your own beliefs. In '+topic+', try to '+style+'.'
 };
 let bridge=uk?bridgeUk[division]:bridgeEn[division];
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
   'Особливу увагу звертайте на тему '+theme(placement.house)+'.':
   (trust?'Trust and shared responsibility are central parts of intimacy. ':
    'Mature relationships need both affection and clear agreements. ')+
   (lord==='Venus'?'Affection and commitment share one symbolic anchor. ':
    venus.house===placement.house?'Feelings and commitments meet in a shared arena. ':
    'Emotional closeness and practical duties may require different conversations. ')+
   'Give particular attention to '+theme(placement.house)+'.';
 }
 if(division===10){
  bridge=uk?
   'Ваші професійні здібності можуть особливо проявлятися там, де потрібно працювати з темою '+
   theme(placement.house)+'. У роботі вам може допомагати вміння '+style+'.':
   'Your professional strengths may be especially relevant where work involves '+
   theme(placement.house)+'. Try to '+style+'.';
 }
 if(division===24){
  bridge=uk?
   'Щоб знання стали навичкою, вам може допомагати робота з темою '+theme(placement.house)+
   '. Найкраще перевіряти навчання практикою, а не лише кількістю прочитаного.':
   'Turning knowledge into skill may benefit from work on '+theme(placement.house)+
   '. Test learning through practice, not just the amount you read.';
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
 const teaser=lead+' '+(uk?'У практичному житті це торкається сфери '+theme(placement.house)+'.':
  'In practice this touches '+theme(placement.house)+'.');
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
