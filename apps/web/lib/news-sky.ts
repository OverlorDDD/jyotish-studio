/** Own GalaxiNews sky articles composed from a verified Swiss Ephemeris event
 * (kind, body, time, sidereal longitude). Facts come only from the event;
 * interpretation follows classical Jyotish significations and dignities.
 * Voice: docs/galaxiora-editorial-voice.md — warm, specific, «ви». */
import type {NewsLocale,SkyEvent} from './news-public.ts';

type L={uk:string;en:string};
export type SkyArticle={headline:L;lead:L;facts:{label:L;value:L}[];
 sections:{title:L;paragraphs:L[];bullets?:L[]}[];cta:{title:L;text:L;label:L;href:string};
 art:{kind:'station'|'ingress'|'phase'|'eclipse'|'calendar';body?:string;phase?:number;retro?:boolean;solar?:boolean;count?:number}};

const SIGN_NOM:L[]=[['Овен','Aries'],['Телець','Taurus'],['Близнюки','Gemini'],['Рак','Cancer'],['Лев','Leo'],['Діва','Virgo'],
 ['Терези','Libra'],['Скорпіон','Scorpio'],['Стрілець','Sagittarius'],['Козоріг','Capricorn'],['Водолій','Aquarius'],['Риби','Pisces']].map(([uk,en])=>({uk,en}));
const SIGN_GEN=['Овна','Тельця','Близнюків','Рака','Лева','Діви','Терезів','Скорпіона','Стрільця','Козорога','Водолія','Риб'];
const SIGN_SKT=['Меша','Врішабха','Мітхуна','Карка','Сімха','Канья','Тула','Врішчіка','Дхану','Макара','Кумбха','Міна'];
const SIGN_SKT_EN=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];

type Planet={nom:string;gen:string;skt:string;sktEn:string;en:string;themes:L;acc:string;exalt:number;debil:number;own:number[];
 todo:{direct:L[];retro:L[];ingress:L[]}};
const P:Record<string,Planet>={
 Sun:{nom:'Сонце',gen:'Сонця',skt:'Сур’я',sktEn:'Surya',acc:'життєву силу, волю, гідність і відповідальність',en:'Sun',themes:{uk:'життєва сила, воля, гідність і відповідальність',en:'vitality, will, dignity and responsibility'},
  exalt:1,debil:7,own:[5],todo:{direct:[],retro:[],ingress:[
   {uk:'Подумайте, за що ви готові взяти відповідальність у наступні тридцять днів, і назвіть це вголос.',en:'Decide what you are ready to take responsibility for over the next thirty days, and say it out loud.'},
   {uk:'Санкранті традиційно зустрічають даною — даруванням: їжі, часу, допомоги тому, хто її потребує.',en:'Sankranti is traditionally met with dana — giving food, time or help to someone who needs it.'},
   {uk:'Ранкове привітання Сонця, Сур’я намаскар чи кілька хвилин тиші на світанку налаштовують на новий місяць.',en:'Surya namaskar or a few quiet minutes at sunrise attune you to the new solar month.'}]}},
 Moon:{nom:'Місяць',gen:'Місяця',skt:'Чандра',sktEn:'Chandra',acc:'розум, почуття, дім і відчуття захищеності',en:'Moon',themes:{uk:'розум, почуття, дім і відчуття захищеності',en:'mind, feelings, home and a sense of safety'},
  exalt:2,debil:8,own:[4],todo:{direct:[],retro:[],ingress:[]}},
 Mercury:{nom:'Меркурій',gen:'Меркурія',skt:'Будха',sktEn:'Budha',acc:'мову, навчання, документи, торгівлю й домовленості',en:'Mercury',themes:{uk:'мова, навчання, документи, торгівля й домовленості',en:'speech, study, paperwork, trade and agreements'},
  exalt:6,debil:12,own:[3,6],todo:{
   direct:[{uk:'Відправте листи й підпишіть домовленості, які чекали кінця ретроградності, — але перечитайте їх ще раз.',en:'Send the messages and sign the agreements that waited for the retrograde to end — after one more read.'},
    {uk:'Поверніться до навчання, яке відклали: тепер воно піде легше.',en:'Return to the course you put aside: it will flow more easily now.'}],
   retro:[{uk:'Перевіряйте дати, адреси й умови двічі — Будха в ретроградності любить дрібні помилки.',en:'Double-check dates, addresses and terms — retrograde Budha loves small mistakes.'},
    {uk:'Добрий час довести до кінця старі тексти, листи й незавершені розмови.',en:'A good time to finish old texts, letters and unfinished conversations.'}],
   ingress:[{uk:'Помітьте, про що ви найчастіше говорите цими днями, — це тема, яку Будха підсвічує для вас.',en:'Notice what you talk about most these days — that is the theme Budha lights up for you.'}]}},
 Venus:{nom:'Венера',gen:'Венери',skt:'Шукра',sktEn:'Shukra',acc:'стосунки, красу, мистецтво, комфорт і радість',en:'Venus',themes:{uk:'стосунки, краса, мистецтво, комфорт і радість',en:'relationships, beauty, art, comfort and joy'},
  exalt:12,debil:6,own:[2,7],todo:{
   direct:[{uk:'Поверніться до розмови, яку відклали на час ретроградності.',en:'Return to the conversation you postponed during the retrograde.'},
    {uk:'Великі покупки для краси й дому краще відкласти ще на кілька днів, поки Венера набирає швидкість.',en:'Give large purchases for beauty and home a few more days while Venus regains speed.'},
    {uk:'Знайдіть час для того, що приносить радість без жодної мети.',en:'Make time for something that brings joy for its own sake.'}],
   retro:[{uk:'Не поспішайте з новими стосунками й великими покупками — це час переглянути, що для вас справді цінне.',en:'Do not rush new relationships or big purchases — this is a time to review what you truly value.'},
    {uk:'Старі знайомі й незавершені почуття можуть нагадати про себе: послухайте, що вони кажуть.',en:'Old acquaintances and unfinished feelings may resurface: listen to what they say.'}],
   ingress:[{uk:'Зробіть щось красиве своїми руками або для свого дому.',en:'Make something beautiful with your hands or for your home.'},
    {uk:'Скажіть близькій людині, що саме ви в ній цінуєте.',en:'Tell someone close exactly what you value in them.'}]}},
 Mars:{nom:'Марс',gen:'Марса',skt:'Мангала',sktEn:'Mangala',acc:'енергію, сміливість, межі, суперечки й нерухомість',en:'Mars',themes:{uk:'енергія, сміливість, межі, суперечки й нерухомість',en:'energy, courage, boundaries, disputes and property'},
  exalt:10,debil:4,own:[1,8],todo:{
   direct:[{uk:'Поверніться до відкладеної справи, що потребує сили й рішучості.',en:'Return to the postponed task that needs strength and resolve.'}],
   retro:[{uk:'Спрямуйте енергію в завершення, а не в нові конфлікти: суперечки зараз легко розгораються з нічого.',en:'Channel energy into finishing rather than new fights: arguments flare up easily now.'}],
   ingress:[{uk:'Фізична активність допоможе прожити нову енергію Мангали без зайвих суперечок.',en:'Physical activity helps you live the new energy of Mangala without needless arguments.'}]}},
 Jupiter:{nom:'Юпітер',gen:'Юпітера',skt:'Гуру',sktEn:'Guru',acc:'знання, вчителів, віру, дітей і щедрість долі',en:'Jupiter',themes:{uk:'знання, вчителі, віра, діти й щедрість долі',en:'knowledge, teachers, faith, children and fortune'},
  exalt:4,debil:10,own:[9,12],todo:{
   direct:[{uk:'Відновіть навчання або практику з наставником.',en:'Resume study or practice with a teacher.'}],
   retro:[{uk:'Перечитайте книгу, яка колись багато для вас означала.',en:'Reread a book that once meant a lot to you.'}],
   ingress:[{uk:'Подумайте, чого ви хочете навчитися за рік, який Гуру проведе в цьому знаку.',en:'Consider what you want to learn during the year Guru spends in this sign.'}]}},
 Saturn:{nom:'Сатурн',gen:'Сатурна',skt:'Шані',sktEn:'Shani',acc:'дисципліну, працю, строки, витривалість і відповідальність',en:'Saturn',themes:{uk:'дисципліна, праця, строки, витривалість і відповідальність',en:'discipline, work, deadlines, endurance and duty'},
  exalt:7,debil:1,own:[10,11],todo:{
   direct:[{uk:'Поверніться до довгих проєктів: Шані знову підтримує терплячу роботу.',en:'Return to long projects: Shani supports patient work again.'}],
   retro:[{uk:'Перегляньте свої зобов’язання й чесно відмовтеся від тих, що вже не ваші.',en:'Review your obligations and honestly release those that are no longer yours.'}],
   ingress:[{uk:'Шані перебуватиме в цьому знаку близько двох з половиною років — подумайте, яку звичку ви хочете вибудувати за цей час.',en:'Shani stays in this sign for about two and a half years — choose one habit to build over that time.'}]}}
};
export const planetName=(body:string,locale:NewsLocale)=>locale==='uk'?(P[body]?.nom||body):(P[body]?.en||body);
const dms=(lon:number)=>{const inSign=((lon%30)+30)%30;let d=Math.floor(inSign),m=Math.round((inSign-d)*60);if(m===60){d+=1;m=0;}return d+'°'+String(m).padStart(2,'0')+'′';};
const kyiv=(iso:string,locale:NewsLocale,o:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{timeZone:'Europe/Kyiv',...o}).format(new Date(iso));
const dayLong=(iso:string)=>({uk:kyiv(iso,'uk',{day:'numeric',month:'long',year:'numeric'}).replace(/\s*р\.$/,''),en:kyiv(iso,'en',{day:'numeric',month:'long',year:'numeric'})});
const hhmm=(iso:string)=>kyiv(iso,'uk',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function dignity(p:Planet,sign:number):L|null{
 if(sign===p.exalt)return {uk:'У цьому знаку '+p.skt+' в екзальтації (уччі) — найсильніше положення планети.',en:'Here '+p.en+' is exalted (uccha), its strongest placement.'};
 if(sign===p.debil)return {uk:'У цьому знаку '+p.skt+' в ослабленні (нічі): її теми потребують більше уваги й терпіння.'.replace('її теми',p.nom==='Венера'?'її теми':'його теми'),en:'Here '+p.en+' is debilitated (neecha): its themes need more care and patience.'};
 if(p.own.includes(sign))return {uk:'Це власний знак '+p.gen+': '+p.skt+' тут почувається вдома.',en:'This is one of '+p.en+'’s own signs: it is at home here.'};
 return null;
}
const ownSignNames=(p:Planet)=>({uk:p.own.map(s=>SIGN_NOM[s-1].uk).join(' й '),en:p.own.map(s=>SIGN_NOM[s-1].en).join(' and ')});
const PHASE_NAME:Record<string,{uk:string;en:string;skt:L;phase:number}>={
 new_moon:{uk:'Молодик',en:'New Moon',skt:{uk:'Амавасья',en:'Amavasya'},phase:0},
 first_quarter:{uk:'Перша чверть',en:'First Quarter',skt:{uk:'Шукла Аштамі',en:'Shukla Ashtami'},phase:1},
 full_moon:{uk:'Повня',en:'Full Moon',skt:{uk:'Пурніма',en:'Purnima'},phase:2},
 last_quarter:{uk:'Остання чверть',en:'Last Quarter',skt:{uk:'Крішна Аштамі',en:'Krishna Ashtami'},phase:3}
};

/** Returns null when the event has no own article template (the page then
 * shows the stored summary). `next` is the following event for the same body. */
export function composeSkyArticle(e:SkyEvent,next?:SkyEvent|null,now=Date.now()):SkyArticle|null{
 const when=dayLong(e.atUtc),time=hhmm(e.atUtc),past=now>=Date.parse(e.atUtc);
 const onUk=when.uk+' о '+time+' ',onEn='On '+when.en+' at '+time+' ';
 const method={label:{uk:'Розрахунок',en:'Calculation'},value:{uk:'Swiss Ephemeris, сидеричний зодіак, айанамша Лахірі',en:'Swiss Ephemeris, sidereal zodiac, Lahiri ayanamsha'}};
 const at={label:{uk:'Час (Київ)',en:'Time (Kyiv)'},value:{uk:when.uk+', '+time,en:when.en+', '+time}};
 const nextFact=next?[{label:{uk:'Наступна подія',en:'Next event'},value:{uk:dayLong(next.atUtc).uk+', '+hhmm(next.atUtc)+' — '+nextLabel(next).uk,en:dayLong(next.atUtc).en+', '+hhmm(next.atUtc)+' — '+nextLabel(next).en}}]:[];
 const phase=PHASE_NAME[e.kind];
 if(phase){
  const full=e.kind==='full_moon',newm=e.kind==='new_moon';
  return {headline:{uk:phase.uk+(e.kind.includes('quarter')?' Місяця ':' ')+when.uk,en:phase.en+(e.kind.includes('quarter')?' Moon':'')+' on '+when.en},
   lead:{uk:full?(past?'Місяць стоїть точно навпроти Сонця й освітлений повністю.':onUk+'Місяць стане точно навпроти Сонця й буде освітлений повністю.')+' У ведичному календарі це Пурніма — день завершення, подяки й духовної практики.':
     newm?(past?'Сонце й Місяць зійшлися в одній точці неба, і місячний диск зник із нічного неба.':onUk+'Сонце й Місяць зійдуться в одній точці неба, і місячний диск зникне з нічного неба.')+' У ведичному календарі це Амавасья — тихий день між двома місячними циклами.':
     (past?'Місяць пройшов чверть свого шляху від Сонця, і з Землі ми бачимо рівно половину диска.':onUk+'Місяць пройде чверть свого шляху від Сонця, і з Землі ми побачимо рівно половину диска.')+' Це точка розвороту місячного циклу.',
    en:full?(past?'The Moon stands exactly opposite the Sun and is fully lit.':onEn+'the Moon will stand exactly opposite the Sun, fully lit.')+' In the Vedic calendar this is Purnima — a day of completion, gratitude and spiritual practice.':
     newm?(past?'The Sun and Moon have met at one point in the sky and the lunar disc has vanished.':onEn+'the Sun and Moon will meet at one point in the sky and the lunar disc will vanish.')+' In the Vedic calendar this is Amavasya, the quiet day between two lunar cycles.':
     (past?'The Moon has travelled a quarter of its way from the Sun and we see exactly half of its disc':onEn+'the Moon will have travelled a quarter of its way from the Sun, showing exactly half of its disc')+' — a turning point of the lunar month.'},
   facts:[at,{label:{uk:'У традиції',en:'In tradition'},value:{uk:phase.skt.uk,en:phase.skt.en}},...nextFact,method],
   sections:[{title:{uk:'Що відбувається на небі',en:'What happens in the sky'},paragraphs:[{
     uk:full?'Повня — момент, коли кут між Сонцем і Місяцем, як їх видно із Землі, сягає 180°. Ніч найсвітліша за місяць, і після неї освітлена частина диска почне зменшуватися.':
      newm?'Молодик — сполучення Сонця й Місяця: їхні довготи на екліптиці збігаються. Перші дні після молодика тонкий серп видно ввечері на заході одразу після заходу Сонця.':
      'У момент чверті кут між Сонцем і Місяцем становить 90°. Місяць видно високо в небі вдень або в першій чи другій половині ночі, залежно від фази.',
     en:full?'Full Moon is the moment the Sun–Moon angle seen from Earth reaches 180°. It is the brightest night of the month; after it the lit part of the disc begins to shrink.':
      newm?'New Moon is the Sun–Moon conjunction: their ecliptic longitudes coincide. In the first evenings after it a thin crescent appears low in the west just after sunset.':
      'At a quarter the Sun–Moon angle is 90°. The Moon is visible high in the sky during the day or in the first or second half of the night, depending on the phase.'}]},
    {title:{uk:'Що це означає в Джйотиш',en:'What it means in Jyotish'},paragraphs:[{
     uk:full?'Пурніма вважається одним із найсприятливіших днів місяця для поста, мантри, вдячності й підсумків. Повний Місяць — Чандра в повній силі — посилює емоції, тому день добрий для доброти й поганий для гострих рішень.':
      newm?'Амавасья присвячена предкам і тиші. Цей день традиційно не обирають для нових починань: краще завершити старе, прибрати дім і думки, а намір на новий цикл сформулювати після появи першого серпа.':
      'Чверті не мають окремого обряду, але вони ділять місячний місяць на робочі відрізки: зростаючий Місяць підтримує розвиток розпочатого, спадний — завершення й відпускання.',
     en:full?'Purnima is one of the most auspicious days of the month for fasting, mantra, gratitude and taking stock. The full Moon — Chandra at full strength — amplifies emotions, so it is a good day for kindness and a poor one for sharp decisions.':
      newm?'Amavasya is dedicated to the ancestors and to silence. It is traditionally not chosen for new beginnings: finish the old, clear your home and mind, and set an intention for the new cycle once the first crescent appears.':
      'Quarters carry no rite of their own, but they divide the lunar month into working stretches: the waxing Moon supports what you have started, the waning Moon supports completion and letting go.'}],
     bullets:full?[{uk:'Підсумуйте, що вдалося за місячний цикл, і подякуйте за це.',en:'Take stock of what this lunar cycle brought and give thanks for it.'},{uk:'Повня добра для медитації й мантри; важливі суперечки краще відкласти на день-два.',en:'Full Moon suits meditation and mantra; postpone heated discussions by a day or two.'}]:
      newm?[{uk:'Завершіть одну справу, яка тягнеться давно.',en:'Finish one long-dragging task.'},{uk:'Згадайте своїх предків добрим словом — так Амавасью зустрічають у традиції.',en:'Remember your ancestors with a kind word — the traditional way to meet Amavasya.'}]:undefined}],
   cta:{title:{uk:'Місяць у вашому місті',en:'The Moon where you live'},text:{uk:'Тітхі, накшатра й добрі години дня — у Панчанзі для вашого міста.',en:'Tithi, nakshatra and the good hours of the day — in Panchanga for your city.'},label:{uk:'Відкрити Панчангу',en:'Open Panchanga'},href:'panchanga'},
   art:{kind:'phase',phase:phase.phase}};
 }
 if(e.kind==='solar-eclipse'||e.kind==='lunar-eclipse'){
  const solar=e.kind==='solar-eclipse';
  const KIND_UK:Record<string,string>={total:'Повне',annular:'Кільцеподібне',partial:'Часткове',penumbral:'Напівтіньове',hybrid:'Гібридне'};
  const kUk=e.eclipseKind&&KIND_UK[e.eclipseKind]?KIND_UK[e.eclipseKind]:'',kEn=e.eclipseKind?e.eclipseKind.charAt(0).toUpperCase()+e.eclipseKind.slice(1):'';
  const nameUk=(kUk?kUk+' '+(solar?'сонячне':'місячне'):(solar?'Сонячне':'Місячне'))+' затемнення',nameEn=(kEn?kEn+' ':'')+(solar?'solar':'lunar')+' eclipse';
  const vis=typeof e.visibleHere==='boolean'?{label:{uk:'Видимість у Києві',en:'Visible from Kyiv'},value:e.visibleHere?{uk:'так, за розрахунковою моделлю',en:'yes, per the calculated model'}:{uk:'ні, за розрахунковою моделлю',en:'no, per the calculated model'}}:null;
  return {headline:{uk:nameUk+' '+when.uk,en:nameEn.charAt(0).toUpperCase()+nameEn.slice(1)+' on '+when.en},
   lead:{uk:(past?when.uk+' о '+time+' був максимум ':onUk+'настане максимум ')+(solar?'сонячного':'місячного')+' затемнення.'+(e.visibleHere===false?' З України його не видно, але в Джйотиш затемнення враховують незалежно від видимості.':e.visibleHere?' Його можна буде побачити з України — за ясної погоди.':''),
    en:(past?'The '+(solar?'solar':'lunar')+' eclipse peaked on '+when.en+' at '+time+'.':onEn+'the '+(solar?'solar':'lunar')+' eclipse reaches its maximum.')+(e.visibleHere===false?' It is not visible from Ukraine, yet Jyotish takes eclipses into account regardless of visibility.':'')},
   facts:[{label:{uk:'Максимум (Київ)',en:'Maximum (Kyiv)'},value:at.value},...(vis?[vis]:[]),method],
   sections:[{title:{uk:'Що відбувається на небі',en:'What happens in the sky'},paragraphs:[{
     uk:solar?'Сонячне затемнення настає в молодик, коли Місяць проходить точно між Сонцем і Землею й закриває сонячний диск — повністю, частково або кільцем. Дивитися на Сонце без спеціального фільтра не можна навіть під час затемнення.':
      'Місячне затемнення настає в повню, коли Місяць заходить у тінь Землі. Його видно з усієї нічної півкулі, і дивитися на нього можна неозброєним оком.',
     en:solar?'A solar eclipse happens at New Moon, when the Moon passes exactly between the Sun and Earth and covers the solar disc — fully, partly or as a ring. Never look at the Sun without a proper filter.':
      'A lunar eclipse happens at Full Moon, when the Moon enters Earth’s shadow. It is visible from the whole night hemisphere and safe to watch with the naked eye.'}]},
    {title:{uk:'Що це означає в Джйотиш',en:'What it means in Jyotish'},paragraphs:[{
     uk:'У Джйотиш затемнення пов’язують із Раху й Кету — місячними вузлами. Цей час традиційно присвячують мантрі, медитації й тиші; важливі справи, урочистості й нові починання на день затемнення не призначають, а після нього роблять омивання й дають дану.',
     en:'Jyotish links eclipses with Rahu and Ketu, the lunar nodes. Traditionally the time is given to mantra, meditation and quiet; important undertakings and celebrations are not scheduled on the eclipse day, and afterwards one bathes and gives charity.'}],
     bullets:[{uk:'Присвятіть час затемнення мантрі або тихій медитації.',en:'Give the eclipse time to mantra or quiet meditation.'},{uk:'Не призначайте на цей день важливих починань.',en:'Do not schedule important beginnings for this day.'}]}],
   cta:{title:{uk:'Як затемнення торкається вашої карти?',en:'How does the eclipse touch your chart?'},text:{uk:'Побудуйте натальну карту й подивіться, у якому домі воно відбувається.',en:'Build your birth chart to see which house it falls in.'},label:{uk:'Побудувати карту',en:'Build my chart'},href:'astrology/jyotish'},
   art:{kind:'eclipse',solar}};
 }
 const p=P[e.body||''];
 if(!p)return null;
 if(e.kind==='direct_station'||e.kind==='retrograde_station'){
  const direct=e.kind==='direct_station',sign=e.sign||(typeof e.longitude==='number'?Math.floor(e.longitude/30)+1:0);
  const pos=typeof e.longitude==='number'&&sign?{uk:dms(e.longitude)+' '+SIGN_GEN[sign-1],en:dms(e.longitude)+' '+SIGN_NOM[sign-1].en}:null;
  const dig=sign?dignity(p,sign):null,fem=p.nom==='Венера';
  return {headline:{uk:p.nom+(direct?' розвертається в прямий рух ':' стає '+(fem?'ретроградною ':'ретроградним '))+when.uk,en:p.en+' stations '+(direct?'direct':'retrograde')+' on '+when.en},
   lead:{uk:(direct?(past?'Ретроградний відрізок '+p.gen+' завершився':onUk+'ретроградний відрізок '+p.gen+' завершиться'):(past?(fem?'Венера зупинилася й почала':p.nom+' зупинився й почав'):onUk+p.nom+' зупиниться й почне')+' видимий зворотний рух')+(pos?' на '+pos.uk:'')+'. '+
     (direct?'Теми, які '+p.skt+(fem?' уповільнювала':' уповільнював')+' останні тижні, — '+p.themes.uk+' — поступово знову почнуть рухатися вперед.':'Наступні тижні — час переглянути '+p.acc+', а не починати нове з нуля.'),
    en:(direct?(past?p.en+'’s retrograde stretch has ended':onEn+p.en+'’s retrograde stretch ends'):(past?p.en+' has stopped and begun its apparent backward motion':onEn+p.en+' stops and begins its apparent backward motion'))+(pos?' at '+pos.en:'')+'. '+
     (direct?'The themes '+p.en+' slowed down — '+p.themes.en+' — begin to move forward again.':'The coming weeks are for reviewing '+p.themes.en+' rather than starting from scratch.')},
   facts:[{label:{uk:direct?'Розворот':'Станція',en:direct?'Turn':'Station'},value:at.value},...(pos?[{label:{uk:'Положення',en:'Position'},value:pos}]:[]),...nextFact,method],
   sections:[{title:{uk:'Що сталося на небі',en:'What happened in the sky'},paragraphs:[{
     uk:direct?'Кілька тижнів видимий рух '+p.gen+' на тлі зірок був зворотним. Насправді планета не повертає назад: Земля й '+p.nom+' рухаються орбітами з різною швидкістю, і з нашої точки спостереження шлях на небі на якийсь час закручується в петлю. '+(past?'Тепер петля завершилася, і видимий рух знову прямий.':when.uk+' петля завершиться, і видимий рух знову стане прямим.'):
      'Із Землі '+p.nom+' на якийсь час здаватиметься такою, що рухається назад на тлі зірок.'.replace('такою',fem?'такою':'таким')+' Це оптичний ефект: Земля й '+p.nom+' рухаються орбітами з різною швидкістю, і видимий шлях планети закручується в петлю.',
     en:direct?'For several weeks '+p.en+' appeared to move backwards against the stars. The planet never actually reverses: Earth and '+p.en+' travel their orbits at different speeds, so from our vantage point its path loops for a while. '+(past?'Now the loop is complete and the apparent motion is direct again.':'On '+when.en+' the loop completes and the apparent motion turns direct again.'):
      'From Earth, '+p.en+' will appear to move backwards against the stars for a while. It is an optical effect: Earth and '+p.en+' orbit at different speeds, so the planet’s apparent path forms a loop.'}]},
    {title:{uk:'Що це означає в Джйотиш',en:'What it means in Jyotish'},paragraphs:[
     {uk:p.nom+', або '+p.skt+', відповідає за '+p.acc+'. '+(direct?'Ретроградний період традиційно повертає до незавершеного: відкладених розмов, старих рішень, людей із минулого. Після розвороту ці теми знову рухаються вперед, але перші дні планета майже стоїть на місці, тому поспіх зайвий.':'Ретроградна планета в Джйотиш не «погана»: вона повертає до незавершеного і дає силу всьому, що потребує перегляду, повторення й доопрацювання.'),
      en:p.en+', or '+p.sktEn+', governs '+p.themes.en+'. '+(direct?'A retrograde traditionally brings back the unfinished — postponed conversations, old decisions, people from the past. After the turn these themes move forward again, but for the first days the planet is nearly stationary, so there is no need to hurry.':'In Jyotish a retrograde planet is not “bad”: it returns us to the unfinished and empowers whatever needs review, repetition and refinement.')},
     ...(dig?[{uk:'Станція відбувається в знаку '+SIGN_GEN[sign-1]+'. '+dig.uk+(sign===p.debil?' Власні знаки '+p.gen+' — '+ownSignNames(p).uk+'.':''),en:'The station falls in '+SIGN_NOM[sign-1].en+'. '+dig.en}]:[])],
     bullets:(direct?p.todo.direct:p.todo.retro).length?(direct?p.todo.direct:p.todo.retro):undefined}],
   cta:{title:{uk:'Де '+p.nom+' у вашій карті?',en:'Where is '+p.en+' in your chart?'},text:{uk:'Побудуйте натальну карту — побачите, у якому домі цей розворот відчутиметься найбільше.',en:'Build your birth chart to see which house this turn touches most.'},label:{uk:'Побудувати карту',en:'Build my chart'},href:'astrology/jyotish'},
   art:{kind:'station',body:e.body,retro:!direct}};
 }
 if(e.kind==='sidereal_ingress'&&e.toSign&&e.toSign>=1&&e.toSign<=12){
  const to=e.toSign,from=e.fromSign&&e.fromSign>=1&&e.fromSign<=12?e.fromSign:null,dig=dignity(p,to),sun=e.body==='Sun';
  return {headline:{uk:p.nom+' входить у знак '+SIGN_GEN[to-1]+' '+when.uk,en:p.en+' enters sidereal '+SIGN_NOM[to-1].en+' on '+when.en},
   lead:{uk:p.nom+' переходить'+(from?' зі знака '+SIGN_GEN[from-1]:'')+' у знак '+SIGN_GEN[to-1]+' ('+SIGN_SKT[to-1]+'). '+(sun?'У ведичному календарі це '+SIGN_SKT[to-1]+'-санкранті — початок нового сонячного місяця.':'Теми '+p.gen+' — '+p.themes.uk+' — отримують новий тон.'),
    en:p.en+' moves'+(from?' from '+SIGN_NOM[from-1].en:'')+' into '+SIGN_NOM[to-1].en+' ('+SIGN_SKT_EN[to-1]+'). '+(sun?'In the Vedic calendar this is '+SIGN_SKT_EN[to-1]+' Sankranti, the start of a new solar month.':'The themes of '+p.en+' — '+p.themes.en+' — take on a new tone.')},
   facts:[{label:{uk:'Перехід',en:'Ingress'},value:at.value},{label:{uk:'Знак',en:'Sign'},value:{uk:SIGN_NOM[to-1].uk+' · '+SIGN_SKT[to-1],en:SIGN_NOM[to-1].en+' · '+SIGN_SKT_EN[to-1]}},...nextFact,method],
   sections:[{title:{uk:'Що сталося на небі',en:'What happened in the sky'},paragraphs:[{
     uk:'Сидерична довгота '+p.gen+' перетнула межу знака. Galaxiora рахує в сидеричному зодіаку з айанамшею Лахірі, як прийнято в Джйотиш, тому дати переходів відрізняються від західних гороскопів приблизно на 24 дні.',
     en:'The sidereal longitude of '+p.en+' has crossed a sign boundary. Galaxiora calculates in the sidereal zodiac with Lahiri ayanamsha, as Jyotish does, so ingress dates differ from Western horoscopes by about 24 days.'}]},
    {title:{uk:'Що це означає в Джйотиш',en:'What it means in Jyotish'},paragraphs:[
     {uk:sun?'Сонце, Сур’я, — душа зодіаку. Кожен його перехід відкриває сонячний місяць зі своїм настроєм, а сам день санкранті вважається святим: його зустрічають даною, омиванням і молитвою.':
       p.nom+', або '+p.skt+', відповідає за '+p.acc+'. Тепер ці теми проживатимуться через якості знака '+SIGN_GEN[to-1]+'.',
      en:sun?'The Sun, Surya, is the soul of the zodiac. Each ingress opens a solar month with its own mood, and the Sankranti day itself is sacred, met with charity, ritual bathing and prayer.':
       p.en+', or '+p.sktEn+', governs '+p.themes.en+'. These themes will now be lived through the qualities of '+SIGN_NOM[to-1].en+'.'},
     ...(dig?[dig]:[])],
     bullets:p.todo.ingress.length?p.todo.ingress:undefined}],
   cta:{title:{uk:'Що цей перехід змінює для вас?',en:'What does this change for you?'},text:{uk:'Побудуйте натальну карту — побачите, через який дім '+p.nom+' тепер проходить.',en:'Build your birth chart to see which house '+p.en+' now transits.'},label:{uk:'Побудувати карту',en:'Build my chart'},href:'astrology/jyotish'},
   art:{kind:'ingress',body:e.body}};
 }
 return null;
}
function nextLabel(e:SkyEvent):L{
 const p=P[e.body||''];
 if(PHASE_NAME[e.kind])return {uk:PHASE_NAME[e.kind].uk,en:PHASE_NAME[e.kind].en};
 if(!p)return {uk:'подія неба',en:'sky event'};
 if(e.kind==='sidereal_ingress'&&e.toSign)return {uk:p.nom+' входить у знак '+SIGN_GEN[e.toSign-1],en:p.en+' enters '+SIGN_NOM[e.toSign-1].en};
 if(e.kind==='direct_station')return {uk:p.nom+' розвертається в прямий рух',en:p.en+' stations direct'};
 if(e.kind==='retrograde_station')return {uk:p.nom+' стає '+(p.nom==='Венера'?'ретроградною':'ретроградним'),en:p.en+' stations retrograde'};
 return {uk:'подія неба',en:'sky event'};
}
/** Short one-line label for the «Небо найближчих днів» strip. */
export function skyEventLabel(e:SkyEvent):L{
 if(e.kind==='sidereal_ingress'&&e.body==='Moon'&&e.toSign)return {uk:'Місяць у знаку '+SIGN_GEN[e.toSign-1],en:'Moon enters '+SIGN_NOM[e.toSign-1].en};
 return nextLabel(e);
}
export const nextEventFor=(e:SkyEvent,events:SkyEvent[])=>events.find(x=>Date.parse(x.atUtc)>Date.parse(e.atUtc)&&
 (e.body&&e.body!=='Moon'?x.body===e.body:!!PHASE_NAME[x.kind]&&!!PHASE_NAME[e.kind]))||null;
