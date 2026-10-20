import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
export type EditorialChapter={id:string;title:string;paragraphs:string[];insights:string[];evidence:string[]};
export type EditorialReading={version:'1.0';chapters:EditorialChapter[];elements:{name:string;count:number;percentage:number}[];highlights:string[];method:string};
const signsUk=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const signsEn=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const personalities=[
 ['ініціатива й сміливість','imagination and initiative','нетерплячість','impatience'],
 ['послідовність і надійність','stability and loyalty','упертість','stubbornness'],
 ['допитливість і спілкування','curiosity and communication','розпорошеність','scattered focus'],
 ['турбота й домашній затишок','care and belonging','надмірні переживання','emotional overload'],
 ['творчість і самовираження','creativity and expression','чутливість до оцінки','sensitivity to praise'],
 ['точність і практичність','practical attention','перфекціонізм','perfectionism'],
 ['баланс і співпраця','balance and cooperation','нерішучість','indecision'],
 ['глибина й пошук суті','depth and investigation','потреба контролю','need for control'],
 ['пошук сенсу й навчання','search for meaning','надмірні обіцянки','overcommitment'],
 ['витримка й дисципліна','patience and discipline','жорсткість до себе','self-criticism'],
 ['незалежність і новаторство','independence and innovation','емоційна дистанція','emotional distance'],
 ['уяву й співпереживання','imagination and empathy','складність з межами','weak boundaries']
] as const;
const elementStories=[
 ['Коли у символічному описі помітний Вогонь, головна тема — рішучість і старт нових справ. Слабкою стороною такого стилю може стати поспіх: перед важливим рішенням корисно перевірити наслідки.','Fire symbolizes initiative and drive; balance it by checking the practical consequences of important choices.'],
 ['Земля символічно пов’язана зі стабільністю, матеріальними справами та повільним, але надійним прогресом. Щоб не застрягати в перевірених схемах, можна час від часу пробувати новий підхід.','Earth suggests stability and practical effort; balance it with occasional experiments.'],
 ['Повітря нагадує про спілкування, ідеї та здатність бачити різні варіанти. Якщо можливостей стає забагато, варто обирати одну головну замість постійно змінювати напрямок.','Air symbolizes ideas and communication; balance many options by choosing one priority.'],
 ['Вода символічно пов’язана з уявою, близькістю та емоційною чутливістю. Відкритість важлива, але варто пам’ятати і про власні межі, а не лише потреби інших.','Water symbolizes imagination and emotional attunement; balance openness with clear boundaries.']
] as const;
const sunStories=[
 'Сонце в Овні додає образ людини, якій цікаво розпочинати нові справи й відчувати власну ініціативу.',
 'Сонце в Тельці підкреслює цінність стабільної праці, надійності та відчутних результатів.',
 'Сонце в Близнюках пов’язане з ідеями, навчанням і прагненням обмінюватися думками.',
 'Сонце в Раку додає тему турботи, особистої пам’яті та важливості близьких зв’язків.',
 'Сонце у Леві підкреслює бажання творити, проявляти себе й відповідати за власні рішення.',
 'Сонце в Діві пов’язане з бажанням розібратися в деталях і зробити звичні процеси кращими.',
 'Сонце в Терезах акцентує увагу на дипломатії, співпраці та пошуку чесних домовленостей.',
 'Сонце у Скорпіоні підкреслює глибину інтересів, цілеспрямованість та уважність до прихованих мотивів.',
 'Сонце у Стрільці підкреслює потребу розуміти, навіщо ви працюєте, вчитися і бачити ширший сенс власних зусиль.',
 'Сонце в Козорозі пов’язане з відповідальністю, довгими проєктами та поступовим досягненням мети.',
 'Сонце у Водолії додає незалежний погляд, пошук нових систем і бажання робити щось по-своєму.',
 'Сонце в Рибах додає образ людини, якій важливі уява, співпереживання й відчуття внутрішнього сенсу.'
];
const moonStories=[
 'Місяць в Овні символічно описує швидкі емоційні реакції та потребу в русі.',
 'Місяць у Тельці пов’язаний із прагненням до передбачуваності та спокійного ритму.',
 'Місяць у Близнюках додає потребу говорити про переживання та розбиратися в них через думки.',
 'Місяць у Раку символізує потребу в теплих стосунках і надійному просторі.',
 'Місяць у Леві може підкреслювати важливість творчості та взаємного визнання.',
 'Місяць у Діві пов’язують із потребою впорядковувати думки й побут.',
 'Місяць у Терезах символізує внутрішню потребу в гармонії та чесних стосунках; напруга може виникати, коли не вдається домовитися.',
 'Місяць у Скорпіоні акцентує емоційну глибину та тему довіри.',
 'Місяць у Стрільці підкреслює потребу бачити перспективу й відчувати свободу руху.',
 'Місяць у Козорозі символічно пов’язаний із внутрішньою стриманістю та прагненням до порядку.',
 'Місяць у Водолії додає потребу в незалежному просторі й дружньому обміні ідеями.',
 'Місяць у Рибах пов’язують із багатою уявою, співчуттям і потребою відновлювати внутрішню рівновагу.'
];
const areasUk=['починання','фінанси й цінності','спілкування','дім і сім’я','творчість і навчання','рутина й обов’язки','стосунки','довіра й зміни','пошук знань','кар’єра','спільнота й друзі','відпочинок'];
const areasEn=['new beginnings','resources','communication','home','creativity and learning','daily routines','relationships','trust and change','learning','career','community','rest'];
const namesUk:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const classical=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
export function buildEditorialReading(chart:CalculatedChart,lang:'uk'|'en',asOf='2026-10-20'):EditorialReading{
 const uk=lang==='uk',ix=uk?0:1;
 const reference=Date.parse(asOf+'T12:00:00Z');
 const period=chart.dasha.find(d=>Date.parse(d.start)<=reference&&reference<Date.parse(d.end));
 const subperiod=period?.antardashas?.find(d=>Date.parse(d.start)<=reference&&reference<Date.parse(d.end));
 const rules=ruleFindings(chart);
 const get=(name:string)=>{const p=chart.d1.find(g=>g.name===name);if(!p)throw new Error('Missing verified '+name);return p;};
 const name=(n:string)=>uk?namesUk[n]||n:n;
 const sign=(n:number)=>uk?signsUk[n-1]:signsEn[n-1];
 const area=(n:number)=>uk?areasUk[n-1]:areasEn[n-1];
 const character=(n:number)=>personalities[n-1][ix];
 const tension=(n:number)=>personalities[n-1][uk?2:3];
 const placement=(n:string)=>{
  const p=get(n);return name(n)+(uk?' у ':' in ')+sign(p.sign)+(uk?', у сфері «':', related to ')+area(p.house)+(uk?'»':'');
 };
 const ruler=(house:number)=>rules.lords.find(x=>x.values.house===house)!;
 const rulerPhrase=(house:number)=>{
  const r=ruler(house);return uk?'управитель '+name(String(r.subject))+' розташований у сфері «'+area(Number(r.values.locatedHouse))+'»':
   'ruler '+name(String(r.subject))+' is linked to '+area(Number(r.values.locatedHouse));
 };
 const chapter=(id:string,u:string,e:string,p:string[],tips:string[],ev:string[]):EditorialChapter=>({
  id,title:uk?u:e,paragraphs:consultation(id,p),insights:[],evidence:ev
 });
 const sun=get('Sun'),moon=get('Moon'),saturn=get('Saturn'),venus=get('Venus'),jupiter=get('Jupiter');
 const mercury=get('Mercury'),asc=chart.ascendant.sign;
 const groups=[...new Set(classical.map(n=>get(n).house))].map(h=>({h,count:classical.filter(n=>get(n).house===h).length}))
  .sort((a,b)=>b.count-a.count||a.h-b.h);
 const leading=groups[0],together=classical.filter(n=>get(n).house===leading.h);
 const count=[0,0,0,0];for(const n of classical)count[(get(n).sign-1)%4]++;
 const labels=uk?['Вогонь','Земля','Повітря','Вода']:['Fire','Earth','Air','Water'];
 const elements=count.map((c,i)=>({name:labels[i],count:c,percentage:Math.round(c/7*100)}));
 const max=Math.max(...count),min=Math.min(...count);
 const top=elements.filter(x=>x.count===max).map(x=>x.name).join(uk?' і ':' and ');
 const low=elements.filter(x=>x.count===min).map(x=>x.name).join(uk?' і ':' and ');
 const overlap=(a:string,b:string)=>get(a).house===get(b).house;

 // Reader-first, chart-grounded narrative. LLM is optional; the ten public chapters must
 // be helpful even when the provider is down. Explain a conjunction, NOT a raw coordinate.
 const locative=(g:string)=>name(g)+(uk?' у ':' in ')+sign(get(g).sign)+(uk?' в '+get(g).house+'-му домі':' in house '+get(g).house);
 const house=(h:number)=>uk?String(h)+'-й дім ('+area(h)+')':'house '+h+' ('+area(h)+')';
 const lord=(h:number)=>ruler(h);
 const rulerName=(h:number)=>name(String(lord(h).subject));
 const rulerAt=(h:number)=>Number(lord(h).values.locatedHouse);
 const same=(a:string,b:string)=>get(a).house===get(b).house;
 const periodName=period?name(period.lord):'';
 const subName=subperiod?name(subperiod.lord):'';
 const planetaryThemes:Record<string,[string,string]>={
  Sun:['воля, авторитет і самовираження','identity, authority and volition'],
  Moon:['емоційна пам’ять і потреба у внутрішньому просторі','emotional life, memory and inner security'],
  Mars:['рішучість, боротьба і спосіб діяти','initiative, conflict and the way we take action'],
  Mercury:['мислення, мова, аргументація та навчання','reasoning, speech and learning'],
  Jupiter:['сенс, наставництво і життєві принципи','purpose, mentorship and guiding values'],
  Venus:['прихильність, взаємність і краса','affection, reciprocity and aesthetics'],
  Saturn:['відповідальність, обмеження і випробування часом','discipline, limits and responsibilities']
 };
 const meaning=(g:string)=>planetaryThemes[g]?.[ix]||name(g);
 const cluster=together.map(n=>name(n)).join(', ');
 const conflicts=same('Mars','Saturn')?
  (uk?'Марс і Сатурн зосереджені в одному домі: імпульс діяти стикається з вимогою дисципліни. Це можна читати як внутрішнє напруження між швидким рішенням і потребою все перевірити, не оголошуючи його неминучою рисою людини.':
   'Mars and Saturn share a house: initiative meets restriction and discipline. Traditionally this suggests tension between starting quickly and demanding careful preparation, without defining a person as inevitably conflicted.'):
  (uk?'Марс і Сатурн займають різні доми. Тому їхні теми дії та дисципліни потрібно розглядати в різних життєвих обставинах, а не вигадувати пряме з’єднання.':
   'Mars and Saturn occupy different houses. Their themes of initiative and discipline should be interpreted in separate contexts, not as an invented conjunction.');
 const combined=leading.count>1?
  (uk?'Найпомітніша конфігурація D1 — '+leading.count+' класичних планет в '+house(leading.h)+': '+cluster+'. Тут поєднуються '+together.map(n=>meaning(n)).join('; ')+'. Саме взаємодія цих різних принципів важливіша за просту назву дому.':
   'The main D1 cluster has '+leading.count+' classical planets in '+house(leading.h)+': '+cluster+'. It connects '+together.map(n=>meaning(n)).join('; ')+'. The interaction matters more than a generic house label.'):
  (uk?'Класичні планети розподілені між різними домами. Тому в цій карті немає однієї великої планетної групи, а центральний сюжет треба збирати через лагну та управителів домів.':
   'The classical grahas are spread across separate houses, so the central narrative should come from the ascendant and house lords rather than an invented major conjunction.');
 const ninth=leading.h===9&&leading.count>=3?
  (uk?'Оскільки це дев’ятий дім, у традиції особливо підкреслюють світогляд, наставників, вищу освіту, дгарму, далекі горизонти та питання «для чого я це роблю?». Таку конфігурацію коректніше читати як напружений діалог власних переконань, способу мислити й способу діяти — а не просто як абстрактний «пошук знань».':
   'Because the cluster occupies the ninth house, classical themes include worldview, teachers, higher learning, dharma and the reasons behind a person’s choices. This reads as an interplay of convictions, reasoning and action, not a vague label of “learning”.'):
  (uk?'Положення планет у цьому домі надає особливої ваги його традиційним темам, але оцінка завжди залежить від управителів, інших домів і поточного періоду.':
   'The house cluster strengthens the importance of that domain in the tradition, subject to its rulers, other houses and current period.');
 const moonContext=get('Moon').house===12?
  (uk?'Місяць у дванадцятому домі додає інший полюс: приватність, сон, потребу в тиші, усамітнення та переживання, які не завжди хочеться показувати назовні. Це може створювати відмінність між зовнішнім стилем дій і внутрішнім способом відновлення.':
   'Moon in the twelfth house adds privacy, solitude, rest and emotions that may not be expressed openly. This can contrast with the more visible outward direction of the chart.'):
  (uk?'Місяць у '+house(get('Moon').house)+' переносить емоційну вагу саме в цю частину карти. Його знак '+sign(get('Moon').sign)+' і накшатра '+get('Moon').nakshatra+' уточнюють спосіб переживати цей життєвий мотив.':
   'Moon in '+house(get('Moon').house)+' locates the emotional center there. Its sign and nakshatra refine this traditional emphasis.');
 const signature=uk?'Лагна в '+sign(asc)+' описує вихідний стиль взаємодії зі світом. Її управитель '+rulerName(1)+' знаходиться в '+house(rulerAt(1))+'. Це важливіше за опис одного знака: управитель показує, в яких обставинах символічно розкривається тема першого дому.':
  'The ascendant in '+sign(asc)+' establishes the starting mode of expression. Its lord '+rulerName(1)+' is in '+house(rulerAt(1))+', showing where the first-house theme is developed in the traditional reading.';
 const conclusions=uk?'Провідні мотиви цієї карти: '+(leading.count>1?cluster+' в '+leading.h+'-му домі; ':'зв’язки управителів домів; ')+
  'лагна у '+sign(asc)+' та Місяць у '+house(get('Moon').house)+'. Їх варто читати разом: зовнішній напрям і внутрішні потреби можуть мати різний ритм.':
  'The principal motifs are '+(leading.count>1?cluster+' sharing house '+leading.h+', ':'house rulerships, ')+
  'the ascendant in '+sign(asc)+' and the Moon in '+house(get('Moon').house)+'. These form one portrait: outer direction and inner needs can follow different rhythms.';
 const timing=period?(uk?'Станом на '+asOf+' триває махадаша '+periodName+(subperiod?' й антардаша '+subName:'')+'. У традиції Вімшоттарі це надає ваги темам '+meaning(period.lord)+(subperiod?' і '+meaning(subperiod.lord):'')+'. Конкретні події з назви періоду не випливають: їх не слід вигадувати.':
  'As of '+asOf+' the active period is '+periodName+' mahadasha'+(subperiod?' with '+subName+' antardasha':'')+'. Vimshottari emphasizes the themes of these grahas, but their names alone do not predict specific events.'):
  (uk?'Для обраної дати немає підтвердженої активної даші, тому часові прогнози не додаємо.':
   'No verified active dasha is available on the reference date, so no timing claim is made.');
 const consultation=(id:string,fallback:string[]):string[]=>{
  const chunks:Record<string,string[]>={
   core:[signature,
    (uk?'Сонце '+(same('Sun','Moon')?'і Місяць розташовані в одному домі':'та Місяць перебувають у різних домах')+'. Сонце в '+sign(get('Sun').sign)+' в '+house(get('Sun').house)+' описує традиційну тему самовираження; Місяць у '+sign(get('Moon').sign)+' в '+house(get('Moon').house)+' — спосіб переживати й відновлювати внутрішню рівновагу. Їхня відмінність створює не «суперечливу людину», а два різні напрями потреб.':
     'Sun and Moon '+(same('Sun','Moon')?'share a house':'occupy different houses')+'. Sun in '+sign(get('Sun').sign)+' and '+house(get('Sun').house)+' symbolizes outward aims; Moon in '+sign(get('Moon').sign)+' and '+house(get('Moon').house)+' marks inner needs. The distinction forms two meaningful dimensions, not a diagnosis of a personality conflict.'),
    moonContext],
   elements:[(uk?'Серед семи класичних грах переважає стихія '+top+' ('+max+' із 7). Це лише пропорція положень за знаками. У традиційному читанні стихія додає барву, але не вирішує характер людини й не має переважати над лагною та управителями.':
     'Among seven classical grahas, the most common sign element is '+top+' ('+max+' of 7). This is a sign distribution, not a measurement of personality; the ascendant and house lords carry more interpretive weight.'),
    (uk?'Найменше представлена стихія '+low+' ('+min+' із 7). Це не означає дефіциту здібностей. Справжній сюжет цього гороскопа формують зв’язки конкретних планет, наведені далі, а не відсоток стихій.':
     'The least represented element is '+low+' ('+min+' of 7). This does not imply missing abilities; the meaningful story comes from actual planetary combinations discussed below.')],
   themes:[combined,ninth,conflicts],
   strengths:[(uk?'Сонце в '+house(get('Sun').house)+' підкреслює, де традиція бачить можливість проявляти волю та брати відповідальність. Меркурій у '+house(get('Mercury').house)+' додає інтелектуальну складову — аналіз, мову та здатність пояснювати.':
     'The Sun in '+house(get('Sun').house)+' highlights where will and responsibility are expressed. Mercury in '+house(get('Mercury').house)+' adds the themes of analysis, speech and explanation.'),
    same('Sun','Mercury')?(uk?'Оскільки Сонце і Меркурій стоять разом, теми власної позиції та мислення взаємно підсилюються у цій ділянці карти. У традиційному портреті це може проявлятися як потреба аргументувати власні переконання, навчати або переконувати, але висновок залежить і від інших чинників.':
     'Since Sun and Mercury share a house, identity and reasoning converge in this life domain. Traditional readings may associate that with articulating convictions, teaching or communicating ideas, subject to other placements.'):
     (uk?'Сонце й Меркурій розташовані в різних домах, тому прояв волі й здатність працювати з інформацією мають окремі центри ваги. Їх не слід штучно перетворювати на з’єднання.':
      'Sun and Mercury occupy different houses; self-expression and reasoning have separate domains, and no conjunction should be invented.'),
    (uk?'Юпітер у '+sign(get('Jupiter').sign)+' в '+house(get('Jupiter').house)+' уточнює, як у такому портреті працюють освіта, наставництво та власні принципи.':
     'Jupiter in '+sign(get('Jupiter').sign)+' and '+house(get('Jupiter').house)+' adds a separate perspective on learning, teaching and principles.')],
   relationships:[(uk?'Сьомий дім стосується союзу й домовленостей. Його управитель '+rulerName(7)+' розташований у '+house(rulerAt(7))+': у традиції це зв’язує тему партнерства з інтересами й обставинами саме цього дому. Це не означає, що вже можна описати зовнішність або наміри майбутнього партнера.':
     'The seventh house concerns partnership and agreements. Its lord '+rulerName(7)+' is located in '+house(rulerAt(7))+', connecting relationship themes with that domain without asserting a future partner’s traits or intentions.'),
    (uk?'Венера '+(same('Venus',String(lord(7).subject))?'стоїть разом з управителем сьомого дому':'знаходиться в '+house(get('Venus').house))+
     '. Вона додає мотиви прихильності, близькості й особистих цінностей. Місяць у '+house(get('Moon').house)+' показує інший рівень — потребу в безпечному емоційному просторі. Взаємодія цих тем важливіша за одну коротку характеристику знака.':
     'Venus '+(same('Venus',String(lord(7).subject))?'shares a house with the seventh lord':'is in '+house(get('Venus').house))+
     ', adding affection, attraction and values. The Moon in '+house(get('Moon').house)+' adds emotional needs; together they create a more nuanced relationship portrait.'),
    (uk?'Навамша D9 має лагну у '+sign(chart.lagnaD9.sign)+'. Ця дробова карта доповнює D1 у традиційному прочитанні стосунків і дгарми; сама її лагна ще не є доказом конкретного сценарію в особистому житті.':
     'The D9 Navamsha ascendant is in '+sign(chart.lagnaD9.sign)+'. This divisional chart supplements D1 for relationships and dharma rather than proving an outcome on its own.')],
   career:[(uk?'Десятий дім описує професію й суспільну роль. Його управитель '+rulerName(10)+' розташований у '+house(rulerAt(10))+'. Тому кар’єру тут традиційно пов’язують не лише з посадою, а й з тематикою цього дому.':
     'The tenth house concerns work and public standing. Its lord '+rulerName(10)+' occupies '+house(rulerAt(10))+', linking vocation to the matters of that house.'),
    rulerAt(10)===9?(uk?'Оскільки управитель кар’єри перебуває в дев’ятому домі, у такому прочитанні можуть виділятися викладання, розвиток компетенцій, робота з ідеями, міжнародний контекст або пошук сенсу у професії. Це варіанти традиційних відповідностей, а не готовий список гарантовано успішних професій.':
     'With the tenth lord in the ninth house, classical themes may include teaching, higher learning, international perspectives or work grounded in convictions—not a guaranteed list of careers.'):
     (uk?'Це положення насамперед описує стиль професійної реалізації: теми '+area(rulerAt(10))+' переплітаються з питаннями діяльності й репутації.':
      'This ties professional expression to '+area(rulerAt(10))+' without dictating a single occupation.'),
    (uk?'Дашамша D10 має лагну у '+sign(chart.lagnaD10.sign)+'. У Джйотіш її вивчають як додатковий професійний контекст, зіставляючи з основною картою D1, а не підміняючи нею розрахунок.':
     'D10 Dashamsha has its ascendant in '+sign(chart.lagnaD10.sign)+'. In Jyotish this adds vocational context and should be compared with the main D1 chart.')],
   resources:[(uk?'Другий дім пов’язаний із накопиченнями, сімейними цінностями й мовленням. Його управитель '+rulerName(2)+' у '+house(rulerAt(2))+' переносить цей сюжет у конкретну частину карти. Тому ресурси в традиційному тлумаченні не відокремлюються від освіти, обов’язків чи партнерства, якщо на це вказує положення управителя.':
     'The second house covers assets, family values and speech. Its lord '+rulerName(2)+' in '+house(rulerAt(2))+' links resources with that life area in the traditional framework.'),
    (uk?'Управитель одинадцятого дому, пов’язаного з досягненнями та мережами підтримки, — '+rulerName(11)+' — розташований у '+house(rulerAt(11))+'. Поєднання другого та одинадцятого домів дає глибший контекст, але не дозволяє обіцяти багатство чи точні суми доходів.':
     'The eleventh house concerns gains and networks; its lord '+rulerName(11)+' is in '+house(rulerAt(11))+'. Reading both houses adds nuance, but cannot justify guaranteed earnings or wealth.')],
   challenges:[conflicts,moonContext,(uk?'Сатурн у '+sign(get('Saturn').sign)+' в '+house(get('Saturn').house)+' показує, де традиція говорить про час, відповідальність та обмеження. Його взаємодію з іншими грахами потрібно читати за підтвердженими положеннями, а не вигадувати емоційні травми чи діагнози.':
    'Saturn in '+sign(get('Saturn').sign)+' and '+house(get('Saturn').house)+' frames the themes of time, responsibility and limits; chart evidence does not justify inventing traumas or diagnoses.')],
   growth:[(uk?'Юпітер у '+sign(get('Jupiter').sign)+' в '+house(get('Jupiter').house)+' описує, де у традиції шукають джерело мудрості, смислу й наставництва. Це не універсальна обіцянка духовного покликання, а конкретна частина цієї карти.':
     'Jupiter in '+sign(get('Jupiter').sign)+' and '+house(get('Jupiter').house)+' shows where the tradition places themes of wisdom, values and mentorship.'),
    (uk?'Дев’ятим домом керує '+rulerName(9)+' з '+house(rulerAt(9))+'. У поєднанні з Юпітером це допомагає відрізнити справжні пріоритети карти від простої поради «розвивайтеся».':
     'The ninth house is ruled by '+rulerName(9)+' in '+house(rulerAt(9))+'. Reading that lord alongside Jupiter provides a chart-grounded view of learning and worldview.'),
    (uk?'Місяць перебуває в накшатрі '+get('Moon').nakshatra+', пада '+get('Moon').pada+'. Ця подробиця допомагає читати місячний темперамент і лежить в основі обчислення періодів Вімшоттарі.':
     'The Moon occupies nakshatra '+get('Moon').nakshatra+', pada '+get('Moon').pada+'. This refines the lunar reading and grounds Vimshottari timing.')],
   conclusion:[combined, (uk?'Лагна у '+sign(asc)+' і управитель першого дому '+rulerName(1)+' у '+house(rulerAt(1))+' задають центральну рамку особистого шляху. Управитель сьомого дому '+rulerName(7)+' та десятого '+rulerName(10)+' вказують, як до цього додаються партнерство і професійна роль.':
     'The ascendant in '+sign(asc)+' and its lord '+rulerName(1)+' in '+house(rulerAt(1))+' frame the central life direction. Seventh and tenth lords '+rulerName(7)+' and '+rulerName(10)+' place relationships and vocation in that context.'), timing]
  };
  return chunks[id]||fallback;
 };
 const chapters=[
 chapter('core','Ядро особистості','Your inner and outer world',[
  uk?'Висхідний знак у '+sign(asc)+' додає до вашого традиційного портрета тему '+character(asc)+'. '+sunStories[sun.sign-1]+' '+moonStories[moon.sign-1]+' Зовнішні прагнення, емоційні потреби та перше враження не обов’язково збігаються — у цьому й полягає цікава взаємодія цих трьох положень.':
   'The rising sign in '+sign(asc)+' is linked to '+character(asc)+'. '+placement('Sun')+' speaks to outward aims, while '+placement('Moon')+' invites reflection on inner comfort.',
  overlap('Sun','Moon')?
   (uk?'Сонце й Місяць перебувають в одній життєвій сфері — '+area(sun.house)+'. Традиція поєднує тут тему рішень і внутрішніх переживань: те, чого хочеться досягти, може відчуватися особисто важливим.':
    'Sun and Moon share the same life area, connecting goals and emotions in the traditional reading.'):
   (uk?'Сонце й Місяць розташовані у різних сферах: '+area(sun.house)+' та '+area(moon.house)+'. Це дає образ людини, яка може прагнути одного на публіці, але потребувати іншого для внутрішнього спокою. Це лише можливість для самоспостереження.':
    'Sun and Moon emphasize different areas. Consider the balance between public goals and personal rest.'),
 ],[uk?'Складіть два списки: «що дає мені сенс» і «що допомагає відновитися». Залиште час для обох.':'List what gives you purpose and what helps you recharge.'],['ascendant.sign='+asc,'D1.Sun.sign='+sun.sign,'D1.Moon.sign='+moon.sign]),
 chapter('elements','Баланс стихій','Balance of elements',[
  uk?'Серед семи класичних планет найчастіше зустрічаються знаки стихії '+top+' ('+max+' із 7). Цей показник — простий підрахунок планет за знаками, а не вимірювання характеру чи «потужності енергії».':
   'Of seven classical planets, '+top+' signs are most frequent ('+max+' of 7). This is a count of placements, not a personality or strength score.',
  uk?'Найрідше представлені знаки стихії '+low+' ('+min+' із 7). Це не означає дефіцит відповідних якостей. У традиційному трактуванні всі ці теми можуть стати приводом розвивати баланс.':
   'The least frequent element is '+low+' ('+min+' of 7); that does not imply personal deficiency.',
  uk?elementStories[count.indexOf(max)][0]:
   elementStories[count.indexOf(max)][1]
 ],[uk?'Обирайте вправу за своїм реальним досвідом, а не лише за назвою стихії.':'Choose a habit based on actual needs.'],classical.map(n=>'D1.'+n+'.sign='+get(n).sign)),
 chapter('themes','Головні теми карти','Your recurring chart themes',[
  uk?'Найбільша концентрація класичних планет припадає на сферу «'+area(leading.h)+'» ('+leading.count+' із 7). Саме її традиція пропонує розглянути як один із помітних мотивів цієї карти.':
   'The biggest classical-planet cluster is in '+area(leading.h)+' ('+leading.count+' of 7).',
  leading.count>1?(uk?'Тут разом розташовані '+together.map(name).join(', ')+'. Це поєднує кілька символічних тем в одній сфері життя. Наприклад, для професійної сфери це може означати цікаву взаємодію цілей, способу мислення та готовності діяти.':
   'Sharing this area are '+together.map(name).join(', ')+', linking several traditional themes.'):
   (uk?'Класичні планети розподілені по різних сферах, тому не варто зводити всю карту до однієї «головної» риси.':'Planets spread across several areas, so no single trait defines this chart.')
 ],[uk?'Подумайте, чи справді ця сфера займає важливе місце у вашому житті.':'Check whether this theme actually matters in your experience.'],together.map(n=>'D1.'+n+'.house='+leading.h)),
 chapter('strengths','Сильні сторони й таланти','Strengths worth developing',[
  uk?placement('Sun')+' символічно пов’язує здатність проявляти себе зі сферою «'+area(sun.house)+'». Знак додає теми '+character(sun.sign)+'. Це радше підказка, де перевіряти власні здібності на практиці, а не твердження про природжений талант.':
   placement('Sun')+' suggests exploring '+character(sun.sign)+' through '+area(sun.house)+'.',
  overlap('Sun','Mercury')?(uk?'Сонце і Меркурій перебувають в одній сфері. У такому поєднанні традиція пов’язує цілі з мисленням і комунікацією: корисними можуть бути навчання інших, робота з ідеями, пояснення складного простими словами.':
    'Sun and Mercury share an area, linking purpose with reasoning and communication.'):
   (uk?placement('Mercury')+' додає окрему тему навчання, обміну ідеями й уміння пояснювати власні рішення.':
    placement('Mercury')+' adds a separate theme of communication and learning.')
 ],[uk?'Перевірте одну здібність реальним завданням: покажіть результат комусь і попросіть предметний відгук.':'Test a skill through a real task and ask for feedback.'],
 ['D1.Sun.sign='+sun.sign,'D1.Sun.house='+sun.house,'D1.Mercury.house='+mercury.house]),
 chapter('relationships','Кохання та стосунки','Love and relationships',[
  uk?placement('Venus')+' традиційно використовують, щоб розглядати прихильність, красу та особисті цінності. Це не вказує, кого ви зустрінете, але дозволяє поміркувати, які домовленості вам важливі.':
   placement('Venus')+' is traditionally associated with affection and values.',
  uk?'Для сфери партнерства '+rulerPhrase(7)+'. Таким чином, теми близькості символічно переплітаються зі сферою '+area(Number(ruler(7).values.locatedHouse))+'. У повсякденному житті цей зв’язок можна дослідити через спільні рішення та повагу до особистих меж.':
   'The partnership '+rulerPhrase(7)+', linking relationships with another life area.',
  uk?'Місяць у '+sign(moon.sign)+' додає мотив '+character(moon.sign)+'. Перевіряйте його через власні потреби, а не використовуйте карту для висновків про почуття іншої людини.':
   'The Moon in '+sign(moon.sign)+' adds the theme of '+character(moon.sign)+'. Do not use it to claim knowledge of another person.'
 ],[uk?'Запитайте близьку людину про одне невисловлене очікування й без оцінювання вислухайте відповідь.':'Discuss an unspoken expectation with someone close.'],
 ['D1.Venus.sign='+venus.sign,'D1.Venus.house='+venus.house,ruler(7).id,'D1.Moon.sign='+moon.sign]),
 chapter('career','Кар’єра та покликання','Career and purpose',[
  uk?placement('Sun')+' пов’язує самовираження з темою '+area(sun.house)+'. Це конкретна особливість розрахунку, а не універсальний опис усіх людей зі знаком Сонця.':
   placement('Sun')+' connects personal aims with '+area(sun.house)+'.',
  uk?'У цій карті професійна сфера має управителя: '+rulerPhrase(10)+'. У традиційному читанні робочі прагнення можна співвіднести зі сферою '+area(Number(ruler(10).values.locatedHouse))+'.':
   'The career '+rulerPhrase(10)+', linking professional themes with another area.',
  overlap('Sun','Mercury')?(uk?'Сонце та Меркурій розташовані разом, тож можна розглянути поєднання самовираження, навчання та спілкування. Наприклад, це може надихнути спробувати проєкт, у якому потрібно не просто придумати ідею, а чітко презентувати її.':
   'Sun and Mercury occur together, linking expression and communication.'):
   (uk?'Окреме положення Меркурія звертає увагу на навички роботи з інформацією та навчання. Саме реальний досвід, а не одна карта, допоможе оцінити професійний напрям.':
    'Mercury highlights skill-building; real-world feedback remains essential.')
 ],[uk?'Оберіть один вимірюваний професійний результат на тиждень і три кроки до нього.':'Choose one measurable weekly work result and three steps.'],
 ['D1.Sun.house='+sun.house,'D1.Mercury.house='+mercury.house,ruler(10).id]),
 chapter('resources','Гроші й ресурси','Money and resources',[
  uk?'Сфера ресурсів має управителя: '+rulerPhrase(2)+'. Традиція пов’язує матеріальні цінності та спосіб ними розпоряджатися з темою '+area(Number(ruler(2).values.locatedHouse))+'.':
   'The resource '+rulerPhrase(2)+'.',
  uk?'Це не означає майбутнє багатство або бідність і не дає підстав для фінансових прогнозів. Замість цього можна переглянути, чи відповідають ваші рішення вашим реальним пріоритетам.':
   'This cannot predict wealth. Consider whether spending matches your priorities.'
 ],[uk?'Запишіть три фінансові пріоритети й перегляньте одну необов’язкову витрату.':'Write three financial priorities and review one optional expense.'],[ruler(2).id]),
 chapter('challenges','Внутрішні суперечності','Inner tensions and growth areas',[
  uk?placement('Saturn')+' пов’язують із витримкою, межами та відповідальністю. Символічним викликом цього знака може бути '+tension(saturn.sign)+', але це не діагноз і не обов’язкова властивість людини.':
   placement('Saturn')+' connects persistence with '+tension(saturn.sign)+', without defining personality.',
  uk?'Місяць у '+sign(moon.sign)+' вводить тему '+character(moon.sign)+'. У такому поєднанні можна замислитися, чи не вступають бажання виконати все бездоганно та потреба у відпочинку в суперечність.':
   'The Moon in '+sign(moon.sign)+' invites reflection on '+character(moon.sign)+' and rest.',
  uk?'Наприклад, постійне прагнення бути корисним може конфліктувати з потребою побути без справ. Варто оцінювати це за реальними відчуттями, а не вважати рису встановленою наперед.':
   'Consider whether commitments sometimes crowd out personal rest.'
 ],[uk?'Відзначайте ситуації, коли берете зайве навантаження. Спробуйте одного разу ввічливо відмовитися від необов’язкової справи.':'Notice excess commitments and decline one optional task.'],
 ['D1.Saturn.sign='+saturn.sign,'D1.Saturn.house='+saturn.house,'D1.Moon.sign='+moon.sign]),
 chapter('growth','Особистий розвиток','Personal development',[
  uk?placement('Jupiter')+' у традиції символізує навчання, цінності та ширший погляд на життя. Знак додає теми '+character(jupiter.sign)+'.':
   placement('Jupiter')+' symbolizes learning and values, together with '+character(jupiter.sign)+'.',
  uk?'Це не дає єдиного визначення вашого «призначення». Але допомагає поставити корисні запитання: де я хочу поглибити навичку, чого не знаю, з ким хочу співпрацювати?':
   'The chart cannot prove a single purpose; use the theme to frame constructive questions.'
 ],[uk?'Оберіть нову навичку й приділіть їй два короткі заняття цього тижня.':'Practice one new skill twice this week.'],['D1.Jupiter.sign='+jupiter.sign,'D1.Jupiter.house='+jupiter.house]),
 chapter('conclusion','Ваш підсумок','Your takeaways',[
  uk?'Карта поєднує теми '+character(asc)+', '+area(sun.house)+' та '+area(moon.house)+'. Ці символи можуть допомогти подумати про баланс між тим, чого ви прагнете, і тим, що дозволяє відчувати себе спокійніше.':
   'The chart links '+character(asc)+', '+area(sun.house)+' and '+area(moon.house)+'.',
  uk?'Найбільша концентрація класичних планет припадає на '+area(leading.h)+', а найпоширенішою стихією є '+top+'. Це факти про структуру карти, але не доведені характеристики особистості.':
   'The biggest classical-planet cluster is in '+area(leading.h)+', and the most frequent element is '+top+'.',
  uk?'Суть цього натального прочитання не в переліку порад. Лагна задає характер прояву, Сонце й Місяць описують два різні центри переживань, а управителі важливих домів показують, як у традиції пов’язані особистий шлях, союз і справа життя. Часовий акцент уточнює Вімшоттарі-даша, а роздільні карти D9 та D10 слугують додатковими рівнями тлумачення.':
   'This reading is not a list of generic tasks. The ascendant defines the chart framework; Sun and Moon mark different emphases, while the house lords connect identity, partnership and vocation. Vimshottari dasha adds timing context, while D9 and D10 provide supplementary perspectives.',
  period?(uk?'Часовий акцент станом на '+asOf+': махадаша '+name(period.lord)+(subperiod?', антардаша '+name(subperiod.lord):'')+'. У традиції цей період уточнює, які теми карти можуть бути особливо актуальними. Це не автоматична обіцянка конкретної події.':
   'Timing emphasis as of '+asOf+': '+name(period.lord)+' mahadasha'+(subperiod?' / '+name(subperiod.lord)+' antardasha':'')+'. Traditionally this adds timing context to the natal reading, not a promise of a specific event.'):
   (uk?'Для обраної дати активний період даші у розрахованих даних не визначено.':'No active dasha period is available for the chosen reference date.'),
  uk?'Навамша D9 — лагна '+sign(chart.lagnaD9.sign)+'; Дашамша D10 — лагна '+sign(chart.lagnaD10.sign)+'. Це уточнювальні карти традиції, а не заміна основної D1.':
   'Navamsha D9 ascendant: '+sign(chart.lagnaD9.sign)+'; Dashamsha D10 ascendant: '+sign(chart.lagnaD10.sign)+'. These divisional charts complement rather than replace D1.'
 ],[uk?'Ключ до читання: управитель десятого дому — '+name(String(ruler(10).subject))+' — переносить тему професії у сферу «'+area(Number(ruler(10).values.locatedHouse))+'»; управитель сьомого дому — '+name(String(ruler(7).subject))+' — пов’язує партнерство зі сферою «'+area(Number(ruler(7).values.locatedHouse))+'». У традиції Парашари саме ці зв’язки, а не універсальні поради, задають основу подальшого аналізу.':
   'The tenth-house ruler '+name(String(ruler(10).subject))+' connects vocation with '+area(Number(ruler(10).values.locatedHouse))+', while the seventh-house ruler '+name(String(ruler(7).subject))+' connects partnership with '+area(Number(ruler(7).values.locatedHouse))+'. These verified lordship connections are the foundation of a Parashari reading.'],
 ['ascendant.sign='+asc,'D1.Sun.house='+sun.house,'D1.Moon.house='+moon.house])
 ];
 return {version:'1.0',chapters,elements,highlights:[
  uk?'Найбільша концентрація планет: '+area(leading.h):'Largest cluster: '+area(leading.h),
  uk?'Найчастіша стихія: '+top:'Most frequent element: '+top,
  uk?'Професійний зв’язок: '+area(Number(ruler(10).values.locatedHouse)):'Career theme: '+area(Number(ruler(10).values.locatedHouse))
 ],method:uk?'Сидеричний Джйотіш: підрахунок семи класичних планет за стихіями. Без Плацидуса, Урана, Нептуна чи вигаданих рейтингів сили.':
 'Sidereal Jyotish: elements count seven classical planets. No Placidus, outer planets or invented strength scores.'};
}
