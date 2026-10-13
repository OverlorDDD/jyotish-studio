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
export function buildEditorialReading(chart:CalculatedChart,lang:'uk'|'en'):EditorialReading{
 const uk=lang==='uk',ix=uk?0:1;
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
 const chapter=(id:string,u:string,e:string,p:string[],tips:string[],ev:string[]):EditorialChapter=>({id,title:uk?u:e,paragraphs:p,insights:tips,evidence:ev});
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
  uk?'Важливо не «вірити кожному реченню», а залишити ті ідеї, які допомагають краще розуміти свої потреби, реальні можливості й наступні кроки.':
   'Keep only reflections that help you make meaningful choices.'
 ],[uk?'Оберіть дві практичні ідеї з цього звіту й перевірте, чи справді вони працюють у вашому житті.':'Try two suggestions and see what helps.'],
 ['ascendant.sign='+asc,'D1.Sun.house='+sun.house,'D1.Moon.house='+moon.house])
 ];
 return {version:'1.0',chapters,elements,highlights:[
  uk?'Найбільша концентрація планет: '+area(leading.h):'Largest cluster: '+area(leading.h),
  uk?'Найчастіша стихія: '+top:'Most frequent element: '+top,
  uk?'Професійний зв’язок: '+area(Number(ruler(10).values.locatedHouse)):'Career theme: '+area(Number(ruler(10).values.locatedHouse))
 ],method:uk?'Сидеричний Джйотіш: підрахунок семи класичних планет за стихіями. Без Плацидуса, Урана, Нептуна чи вигаданих рейтингів сили.':
 'Sidereal Jyotish: elements count seven classical planets. No Placidus, outer planets or invented strength scores.'};
}
