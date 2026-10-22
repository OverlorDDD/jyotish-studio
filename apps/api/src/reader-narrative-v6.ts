import type {CalculatedChart,Graha} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_GRAHAS,dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {ukTerm} from './terminology.ts';

/**
 * Reader v6: whole-chart, editorial-first Jyotish consultation.
 *
 * Source of truth is the calculated chart, not free-form model prose.
 * Each passage combines two or more verified placements when meaningful,
 * separates D1 from D9/D10 and avoids unverified yogas, aspects, life events,
 * medical claims and promised outcomes.
 */
type Language='uk'|'en';
type ChapterId='portrait'|'configuration'|'tensions'|'relationships'|'career'|'resources'|'timing'|'conclusion';
const namesUk:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const genitiveUk:Record<string,string>={Sun:'Сонця',Moon:'Місяця',Mars:'Марса',Mercury:'Меркурія',Jupiter:'Юпітера',Venus:'Венери',Saturn:'Сатурна',Rahu:'Раху',Ketu:'Кету'};
const signsUk=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const signsEn=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const houseUk=[
 'власного голосу та особистої ініціативи','цінностей, слова й матеріальної опори',
 'майстерності, спілкування та сміливості пробувати','дому, близького кола й внутрішніх основ',
 'творчості, навчання й того, що хочеться передати іншим','праці, дисципліни та подолання складних завдань',
 'партнерства й мистецтва домовлятися','довіри, спільних ресурсів і внутрішніх змін',
 'знань, наставництва й пошуку сенсу','покликання, репутації й видимої праці',
 'спільнот, здобутків і підтримки','усамітнення, завершення справ і відновлення'];
const houseEn=[
 'identity, agency and finding your voice','resources, speech and enduring values',
 'courage, communication and practiced skill','home and inner foundations',
 'learning, creation and passing something onward','daily work, skill under pressure and service',
 'partnership and negotiating a shared path','trust, common resources and deep change',
 'knowledge, mentors and the search for meaning','vocation, reputation and visible work',
 'communities, gains and long-term allies','solitude, release and restorative inner life'];
const concreteUk=[
 'спершу обрати власний напрям, а вже потім узгоджувати його з очікуваннями інших',
 'відділяти справжню цінність роботи від зовнішньої оцінки й швидкого результату',
 'перетворювати допитливість на практичну навичку, яку можна застосувати',
 'будувати місце, де можна відновитися, перш ніж повертатися до вимог світу',
 'доводити творчі задуми до форми, яку можна показати або передати',
 'відточувати майстерність на складних, але посильних щоденних завданнях',
 'говорити про правила союзу до того, як мовчазні очікування стануть конфліктом',
 'розмежовувати власну відповідальність і те, що належить іншій людині',
 'зіставляти великі переконання з реальним навчанням та досвідом',
 'обирати справу, де результат говорить переконливіше за саму посаду',
 'плекати коло людей, з якими можливий взаємний розвиток',
 'залишати простір для тиші й відновлення без відмови від важливих зв’язків'];
const concreteEn=[
 'choose a direction before measuring it against everyone else’s expectations',
 'distinguish durable value from applause and short-term rewards',
 'turn curiosity into a skill that can actually be practiced',
 'protect a place of restoration before facing the outside world again',
 'give creative ideas a form others can experience or learn from',
 'build skill through demanding but manageable daily practice',
 'name the terms of partnership before silent expectations become a conflict',
 'distinguish one’s own obligations from another person’s',
 'test high ideals against genuine study and lived experience',
 'choose work where useful results matter more than titles',
 'nurture relationships capable of mutual development',
 'make room for rest without giving up meaningful human connections'];
const graha=(name:string,uk:boolean)=>uk?namesUk[name]||name:name;
const gen=(name:string,uk:boolean)=>uk?genitiveUk[name]||name:name;
const area=(h:number,uk:boolean)=>(uk?houseUk:houseEn)[h-1];
const example=(h:number,uk:boolean)=>(uk?concreteUk:concreteEn)[h-1];
const ordinal=(h:number,uk:boolean)=>uk?h+'-му домі':'house '+h;
const pos=(chart:CalculatedChart,name:string,division:'d1'|'d9'|'d10'='d1')=>{
 const p=chart[division].find(x=>x.name===name);
 if(!p)throw new Error('Reader v6: missing '+division+' '+name);
 return p;
};
const naturalDate=(s:string,uk:boolean,zone:string)=>{
 try{return new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:zone}).format(new Date(s));}
 catch{return new Date(s).toISOString().slice(0,10);}
};
const dignity=(p:Graha,uk:boolean)=>{
 const v=dignityFor(p.name,p.sign);
 if(v==='own')return uk?'у власному знаку':'in its own sign';
 if(v==='exalted')return uk?'в екзальтації':'exalted';
 if(v==='debilitated')return uk?'у знаку падіння':'in its sign of debilitation';
 return '';
};
const fullSign=(n:number,uk:boolean)=>uk?signsUk[n-1]:signsEn[n-1];
const sayRulers=(name:string,lords:Record<number,string>,uk:boolean)=>{
 const houses=Array.from({length:12},(_,i)=>i+1).filter(h=>lords[h]===name);
 return houses.length?(uk?'управляє домами ':'rules houses ')+houses.join(', '):'';
};
export function authorConsultationV6(chart:CalculatedChart,lang:Language,asOf:string){
 const uk=lang==='uk',lords=classicalLordshipTable(chart.ascendant.sign);
 const P=(name:string)=>graha(name,uk),G=(name:string)=>gen(name,uk);
 const lord=(n:number)=>lords[n],place=(name:string)=>pos(chart,name),H=(name:string)=>place(name).house;
 const rulerHouse=(n:number)=>H(lord(n));
 const lagna=lord(1),moon=place('Moon'),sun=place('Sun'),mercury=place('Mercury');
 const mars=place('Mars'),saturn=place('Saturn'),venus=place('Venus');
 const cluster=Array.from({length:12},(_,i)=>({house:i+1,names:CLASSICAL_GRAHAS.filter(name=>H(name)===i+1)}))
  .sort((a,b)=>b.names.length-a.names.length||a.house-b.house)[0];
 const hasCluster=cluster.names.length>=3;
 const clusterRuler=lord(cluster.house),dispositor=place(clusterRuler);
 const jointlyMarsSaturn=mars.house===saturn.house;
 const yogakarakas=yogakarakasForLagna(chart.ascendant.sign);
 const tenIsYoga=yogakarakas.includes(lord(10));
 const navVenus=pos(chart,'Venus','d9'),dashCareer=pos(chart,lord(10),'d10');
 const activeTime=Date.parse(asOf+'T12:00:00Z');
 const major=chart.dasha.find(period=>Date.parse(period.start)<=activeTime&&activeTime<Date.parse(period.end));
 const minor=major?.antardashas.find(period=>Date.parse(period.start)<=activeTime&&activeTime<Date.parse(period.end));
 const setting=hasCluster?area(cluster.house,uk):area(rulerHouse(1),uk);
 const summary=uk?
  (hasCluster?'Кілька важливих сил карти зустрічаються у сфері '+setting+'. ':'Ваша карта не зводиться до одного скупчення планет: її центр визначає шлях управителя лагни через сферу '+setting+'. ')+
  'Одна частина цього сюжету описує, де ви прагнете проявити себе; інша — що допомагає зберегти власний ритм.':
  (hasCluster?'Several chart factors gather around '+setting+'. ':'Rather than a single planetary concentration, this chart turns on the ascendant lord’s path through '+setting+'. ')+
  'Its defining question is how outward purpose can remain faithful to an inward rhythm.';
 const portrait=uk?[
  'У цій натальній карті вихідна точка — лагна у '+fullSign(chart.ascendant.sign,true)+'. Її управитель '+P(lagna)+' розташований у '+ordinal(H(lagna),true)+', тому ваша історія починається не з набору загальних рис, а з пошуку опори у сфері '+area(H(lagna),true)+'. На практиці ця тема може проявлятися через потребу '+example(H(lagna),true)+'. Це той простір, у якому ви найвиразніше відчуваєте різницю між своїм рішенням і рішенням, ухваленим за вас.',
  'Місяць у '+fullSign(moon.sign,true)+' та '+ordinal(moon.house,true)+' говорить про інший, менш публічний рівень життя. Накшатра '+ukTerm(moon.nakshatra)+', пада '+moon.pada+', уточнює його місце в місячному зодіаку. Там, де лагна показує спосіб іти назустріч світові, Місяць нагадує про власний темп: '+example(moon.house,true)+'. Якщо ці два напрями різняться, це не суперечність характеру, а завдання навчитися вчасно перемикатися між ними.',
  'Сонце у '+ordinal(sun.house,true)+' додає прагнення відстоювати позицію у сфері '+area(sun.house,true)+'. '+(sun.house===moon.house?'У цій карті зовнішній намір і внутрішнє переживання пов’язані з одним життєвим полем, хоча лишаються різними за змістом.':'Тому те, що помітно іншим, може не збігатися з тим, де ви насправді відновлюєте сили. ')+'Найбільш плідне прочитання цієї осі — не змушувати себе бути однаковими за будь-яких обставин, а розуміти, коли діяти відкрито, а коли потрібна тиша.'
 ]:[
  'The ascendant rises in '+fullSign(chart.ascendant.sign,false)+', and its ruler '+P(lagna)+' occupies '+ordinal(H(lagna),false)+'. Your chart therefore begins with a lived question rather than a list of sign adjectives: how to build confidence through '+area(H(lagna),false)+'. A practical expression is to '+example(H(lagna),false)+'. This is a particular chart emphasis, not a statement about someone’s documented past.',
  'The Moon occupies '+ordinal(moon.house,false)+' in '+fullSign(moon.sign,false)+', nakshatra '+moon.nakshatra+' pada '+moon.pada+'. Where the ascendant describes how you meet the world, this lunar position describes the rhythm that helps you return to yourself: '+example(moon.house,false)+'. Different outward and inward rhythms are not mutually exclusive; they need thoughtful transitions.',
  'The Sun in '+ordinal(sun.house,false)+' emphasizes '+area(sun.house,false)+'. '+(sun.house===moon.house?'Outward purpose and private response share one arena without becoming the same thing.':'The public direction of effort need not match the setting in which you recover. ')+'The opportunity is to know when to become visible and when to preserve the space that makes sustained action possible.'
 ];
 const configuration=uk?[
  hasCluster?
   'Головний малюнок D1 — '+cluster.names.map(P).join(', ')+' у '+ordinal(cluster.house,true)+'. Коли стільки грах ділять один знак і дім, навколо теми '+area(cluster.house,true)+' переплітаються кілька різних завдань. Це поєднання за домом, а не автоматично тісне сполучення за градусами. Тому воно говорить не про одну «сильну рису», а про місце, де воля, навички та відповідальність змушені взаємодіяти.':
   'У цій карті немає домінантного скупчення трьох або більше класичних планет. Її структуру точніше читати через управителя лагни '+P(lagna)+' у '+ordinal(H(lagna),true)+' і управителя десятого дому '+P(lord(10))+' у '+ordinal(rulerHouse(10),true)+'. Ці напрямки можуть підсилювати один одного або вимагати різного темпу, але жодного сполучення між планетами ми не вигадуємо.',
  hasCluster?
   'Важлива деталь: знаком цього скупчення керує '+P(clusterRuler)+', а він перебуває у '+ordinal(dispositor.house,true)+(dignity(dispositor,true)?' '+dignity(dispositor,true):'')+'. Отже, енергія головного дому знаходить вихід через '+area(dispositor.house,true)+'. Велика ідея або внутрішня напруга тут набуває форми лише тоді, коли переходить у конкретний досвід. Наприклад, можна '+example(dispositor.house,true)+'.':
   'Управитель дев’ятого дому '+P(lord(9))+' стоїть у '+ordinal(rulerHouse(9),true)+'. Через нього світогляд з’єднується зі сферою '+area(rulerHouse(9),true)+'. Це важливий міст між тим, у що ви вірите, і тим, у яких справах ці переконання проходять перевірку.',
  (tenIsYoga?P(lord(10))+' для цієї лагни є йогакаракою, бо поєднує управління кендрою та триконою. Це посилює значення його функціональної ролі, а не гарантує славу чи достаток. ':'Професійний управитель '+P(lord(10))+' вносить у загальну композицію тему '+area(rulerHouse(10),true)+'. ')+
  'Суть цього вузла карти можна висловити просто: не залишати свої переконання тільки словами. Їхня справжня сила відкривається у вчинках, відточених навичках і відповідальності за результат.'
 ]:[
  hasCluster?
   'The defining D1 concentration is '+cluster.names.join(', ')+' in '+ordinal(cluster.house,false)+'. Several distinct planetary roles meet in '+area(cluster.house,false)+'. This is a shared whole-sign house, not proof of a tight degree conjunction. The important theme is not a single trait but the work of reconciling initiative, knowledge and commitment in one arena.':
   'There is no dominant cluster of three or more classical planets. The chart is better organized around ascendant lord '+P(lagna)+' in '+ordinal(H(lagna),false)+' and tenth-house lord '+P(lord(10))+' in '+ordinal(rulerHouse(10),false)+'. Their roles may cooperate or call for different rhythms; no conjunction is claimed without a shared placement.',
  hasCluster?
   'The cluster’s sign is ruled by '+P(clusterRuler)+', placed in '+ordinal(dispositor.house,false)+(dignity(dispositor,false)?', '+dignity(dispositor,false):'')+'. It sends the theme of '+area(cluster.house,false)+' toward '+area(dispositor.house,false)+'. A workable expression is to '+example(dispositor.house,false)+'. This is where an abstract intention becomes something that can be practiced.':
   'The ninth-house lord '+P(lord(9))+' sits in '+ordinal(rulerHouse(9),false)+'. This is a specific route from belief and learning toward '+area(rulerHouse(9),false)+'. Ideas become stronger when they are tested by genuine involvement.',
  (tenIsYoga?P(lord(10))+' is a yogakaraka for this ascendant because it joins an angular and trinal lordship. This does not promise fame or wealth. ':'The tenth-house lord '+P(lord(10))+' adds the vocational dimension to this pattern. ')+
  'The central invitation is to let convictions acquire the weight of completed work, developed skills and responsibility for what you create.'
 ];
 const tensions=uk?[
  jointlyMarsSaturn?
   'Марс і Сатурн займають '+ordinal(mars.house,true)+'. Це образ двох різних темпів: Марс хоче розпочати дію, Сатурн — зважити її наслідки та перевірити міцність задуму. У сфері '+area(mars.house,true)+' така комбінація може давати відчуття одночасної вимоги рухатися швидше й зробити все бездоганно. Спільний знак не доводить точного градусного з’єднання, але підкреслює необхідність примирити ініціативу з послідовністю.':
   'Марс стоїть у '+ordinal(mars.house,true)+', а Сатурн — у '+ordinal(saturn.house,true)+'. Рішучість і терпіння в цій карті розгортаються в різних життєвих полях: '+area(mars.house,true)+' та '+area(saturn.house,true)+'. Тому немає підстав описувати їх як тісне сполучення або постійний внутрішній конфлікт. Корисніше бачити два інструменти — здатність починати й здатність довго утримувати обраний курс.',
  'Меркурій у '+fullSign(mercury.sign,true)+' та '+ordinal(mercury.house,true)+(dignity(mercury,true)?' має традиційний статус «'+dignity(mercury,true)+'».':'')+' Він додає свій голос до того, як людина мислить, пояснює й навчається. '+(dignity(mercury,true)==='у знаку падіння'?'Це не означає слабкий інтелект: образне мислення, точність висловлювання та реальні навички не зводяться до однієї класифікації.':'Його варто зіставити з реальною сферою застосування навичок, а не робити висновок з одного знака. ')+'Ваш практичний ресурс — '+example(mercury.house,true)+'.',
  'Внутрішній противагою служить Місяць у '+ordinal(moon.house,true)+'. '+(moon.house===12?'Потреба час від часу відходити від зовнішнього шуму може бути умовою ясності, а не слабкістю.':'Емоційний ритм може вимагати іншого простору, ніж той, у якому діють Марс і Сатурн.')+' Коли ви дозволяєте кожній із цих сил виконувати своє завдання, напруга перетворюється на здатність обирати момент: коли починати, коли перевіряти, а коли відновлюватися.'
 ]:[
  jointlyMarsSaturn?
   'Mars and Saturn share '+ordinal(mars.house,false)+'. Initiative and endurance meet in '+area(mars.house,false)+'. Mars presses for movement while Saturn tests whether the structure will last. A shared sign does not establish a tight degree conjunction, but it does invite a conscious negotiation between pace and reliability.':
   'Mars occupies '+ordinal(mars.house,false)+' and Saturn '+ordinal(saturn.house,false)+'. Drive and endurance address different areas of life; a conjunction or automatic internal conflict should not be invented. The more useful question is when to begin decisively and when to build a steadier structure.',
  'Mercury in '+fullSign(mercury.sign,false)+' and '+ordinal(mercury.house,false)+(dignity(mercury,false)?' is traditionally '+dignity(mercury,false)+'.':'')+' adds the language of reasoning, speech and skill. '+(dignity(mercury,false)==='in its sign of debilitation'?'This classification is not a measure of intelligence or a diagnosis of ability. ':'')+'The chart points toward a practical response: '+example(mercury.house,false)+'.',
  'The Moon in '+ordinal(moon.house,false)+' supplies the other rhythm. '+(moon.house===12?'Retreat and recovery may be necessary companions to visible accomplishment.':'Its needs need not match the timing of Mars or Saturn.')+' The strength of the combination is learning which moment calls for decisive action, careful revision or rest.'
 ];
 const relationships=uk?[
  'У сфері близькості починаємо із сьомого дому. Ним керує '+P(lord(7))+', що перебуває у '+ordinal(rulerHouse(7),true)+'. Отже, партнерство в цій карті торкається теми '+area(rulerHouse(7),true)+'. '+(lord(7)===lord(8)?'Той самий управитель пов’язує сьомий і восьмий доми: домовленість і довіра тут мають розвиватися разом.':'Це важливіше за спробу назвати характер майбутнього партнера за одним знаком.')+' Головна перевірка такого символічного зв’язку — чи вмієте ви говорити про очікування раніше, ніж вони перетворюються на мовчазні вимоги.',
  'Венера в '+ordinal(venus.house,true)+' у '+fullSign(venus.sign,true)+' описує мову тепла, прихильності та взаємності. Місяць у '+ordinal(moon.house,true)+' додає умови, у яких цю близькість легше переживати без втрати себе. '+(venus.house===10?'У такій композиції тема стосунків може зустрічатися з видимою професійною роллю: турбота потребує часу, а не лише красивих намірів.':'Коли ці дві планети звернені до різних домів, важливо не плутати спосіб вираження любові з особистою потребою у спокої.')+' У практиці це може означати '+example(rulerHouse(7),true)+'.',
  'Навамша D9 додає наступний шар: її лагна у '+fullSign(chart.lagnaD9.sign,true)+', а Венера розташована у '+ordinal(navVenus.house,true)+'. У традиції її читають поруч із D1, щоб краще побачити, як визрівають цінності й здатність бути у союзі. '+(navVenus.house===1?'Тут особливо виразна тема власної позиції в партнерстві: близькість не повинна поглинати особистість.':'Цей показник не замінює управителя сьомого дому основної карти.')+' Дата шлюбу чи наміри іншої людини з цих даних не випливають.'
 ]:[
  'Relationship themes begin with the seventh lord '+P(lord(7))+' in '+ordinal(rulerHouse(7),false)+'. Partnership therefore reaches into '+area(rulerHouse(7),false)+'. '+(lord(7)===lord(8)?'The same planet rules the seventh and eighth houses, linking commitment with vulnerability and shared responsibility.':'This describes the field in which partnership is negotiated rather than the character of a future partner.')+' A constructive question is how expectations become explicit agreements.',
  'Venus in '+ordinal(venus.house,false)+' in '+fullSign(venus.sign,false)+' adds the way affection is expressed. The Moon in '+ordinal(moon.house,false)+' adds the conditions of emotional replenishment. '+(venus.house===10?'A visible professional life can compete for time that a relationship also deserves.':'Their houses show that warmth and inner comfort are not always identical needs.')+' The practical invitation is to '+example(rulerHouse(7),false)+'.',
  'Navamsha D9 rises in '+fullSign(chart.lagnaD9.sign,false)+' and places Venus in '+ordinal(navVenus.house,false)+'. Traditionally it is read with D1 for a second perspective on maturing values and partnership. '+(navVenus.house===1?'Personal agency becomes a prominent part of how closeness is sustained.':'It does not replace the seventh lord of D1.')+' Neither a marriage date nor another person’s private intentions can be deduced from these facts.'
 ];
 const career=uk?[
  'Ваш професійний сюжет відкриває управитель десятого дому '+P(lord(10))+' у '+ordinal(rulerHouse(10),true)+'. Це пов’язує працю, суспільну роль і результат із темою '+area(rulerHouse(10),true)+'. '+(tenIsYoga?'Для цієї лагни він також є йогакаракою — сполучною ланкою творчого потенціалу і відповідальної дії.':'Саме його управління, а не просто знак Сонця, допомагає побачити спосіб реалізації.')+' Можливий практичний прояв — '+example(rulerHouse(10),true)+'.',
  'Управитель дев’ятого дому '+P(lord(9))+' перебуває у '+ordinal(rulerHouse(9),true)+(dignity(place(lord(9)),true)?' '+dignity(place(lord(9)),true):'')+'. Через це знання, учителі й переконання зустрічаються з темою '+area(rulerHouse(9),true)+'. '+(rulerHouse(9)===rulerHouse(10)?'У цій карті дев’ятий і десятий управителі перебувають в одній сфері: розуміння та дія мають спільний майданчик.':'Ці два управителі не обов’язково поєднані безпосередньо; один говорить про сенс, інший — про виконану роботу.')+' Сильна кар’єра у такому прочитанні починається з уміння показати, що саме ви створюєте, розв’язуєте чи передаєте іншим.',
  'Дашамша D10 уточнює метод професійної реалізації: її лагна у '+fullSign(chart.lagnaD10.sign,true)+', а управитель десятого дому D1 '+P(lord(10))+' займає у D10 '+ordinal(dashCareer.house,true)+'. Це не назва призначеної професії; це ще одна площина, у якій можна перевірити свій стиль праці. '+(dashCareer.house===6?'Особливу вагу має робота зі складністю: щоденна дисципліна, налагодження процесів, увага до помилок.':'Додаткова увага припадає на сферу '+area(dashCareer.house,true)+'.')+' Добрий експеримент — обрати конкретний проєкт і оцінювати себе за завершеним результатом, а не за очікуваннями.'
 ]:[
  'The tenth-house lord '+P(lord(10))+' occupies '+ordinal(rulerHouse(10),false)+', linking vocation and visible effort to '+area(rulerHouse(10),false)+'. '+(tenIsYoga?'For this ascendant it is also a yogakaraka, connecting a trinal and angular house role.':'Its actual house ownership matters more than a broad Sun-sign career list.')+' A practical expression is to '+example(rulerHouse(10),false)+'.',
  'The ninth-house lord '+P(lord(9))+' occupies '+ordinal(rulerHouse(9),false)+(dignity(place(lord(9)),false)?', '+dignity(place(lord(9)),false):'')+'. Belief and learning therefore meet '+area(rulerHouse(9),false)+'. '+(rulerHouse(9)===rulerHouse(10)?'The two rulers share a life arena, inviting knowledge and practice to inform one another.':'They are not claimed to form an aspect or conjunction merely because they represent related subjects.')+' Practical competence is a more useful measure than an imaginary predestined job title.',
  'Dashamsha D10 rises in '+fullSign(chart.lagnaD10.sign,false)+', while the D1 tenth lord '+P(lord(10))+' sits in D10 '+ordinal(dashCareer.house,false)+'. This is a separate vocational lens, not a promise of employment. '+(dashCareer.house===6?'It highlights skill developed through demanding daily problem-solving.':'It adds the arena of '+area(dashCareer.house,false)+'.')+' The useful experiment is to complete a tangible project and observe how your way of working actually performs.'
 ];
 const resources=uk?[
  'Матеріальну сферу в Джйотіш не варто зводити до одного «знака багатства». Другим домом володіє '+P(lord(2))+' у '+ordinal(rulerHouse(2),true)+', а одинадцятим — '+P(lord(11))+' у '+ordinal(rulerHouse(11),true)+'. Перший показує, як пов’язані особисті цінності, слово та опора; другий — як формується мережа результатів і взаємної підтримки. Це різні механізми, навіть якщо вони стосуються тієї самої діяльності.',
  'Для другого дому центральною стає сфера '+area(rulerHouse(2),true)+'. Для одинадцятого — '+area(rulerHouse(11),true)+'. '+(lord(2)===lord(11)?'Обидві теми веде одна планета, тому особисті ресурси й здобутки мають спільний центр.':'Вони керуються різними планетами, і тому варто розрізняти збереження вже створеного та розвиток нових можливостей.')+' Практично це означає: спершу зрозуміти, яку цінність ви можете стабільно давати людям, а вже потім шукати масштабування й визнання.',
  'Такі показники найкорисніше застосовувати як запитання до власної стратегії: що я накопичую — гроші, майстерність, стосунки довіри чи репутацію? Що саме з цього приносить довготривалу опору? Карта не встановлює суми доходу, але допомагає розрізняти справжню цінність роботи і короткочасний успіх.'
 ]:[
  'Material life is not described by a single wealth sign. The second lord '+P(lord(2))+' occupies '+ordinal(rulerHouse(2),false)+', while the eleventh lord '+P(lord(11))+' occupies '+ordinal(rulerHouse(11),false)+'. The former connects possessions, speech and values; the latter concerns achievements and networks. They are separate mechanisms even when they serve one long-term project.',
  'The second lord channels resources through '+area(rulerHouse(2),false)+', while the eleventh brings attention to '+area(rulerHouse(11),false)+'. '+(lord(2)===lord(11)?'One planet governs both, suggesting a shared point of emphasis.':'The rulers are different, so maintaining value and finding new opportunities need not happen in the same way.')+' A sound practical distinction is between developing genuine usefulness and earning public recognition for it.',
  'The helpful questions are concrete: what value are you actually accumulating — money, tested skill, trust or reputation? What will still matter after the immediate success fades? The chart does not specify income, but it can organize a clearer conversation about stewardship and long-term direction.'
 ];
 const timing=uk?[
  major?
   'На дату '+naturalDate(asOf,true,chart.input.timeZone)+' триває махадаша '+G(major.lord)+': від '+naturalDate(major.start,true,chart.input.timeZone)+' до '+naturalDate(major.end,true,chart.input.timeZone)+'. У вашій лагні '+P(major.lord)+' '+sayRulers(major.lord,lords,true)+' та стоїть у '+ordinal(H(major.lord),true)+'. Це надає періоду конкретний зміст: до яких зобов’язань, навичок або стосунків повертає увагу саме ваша карта.':
   'На обрану дату активної махадаші в розрахунку немає. Я не приписуватиму поточному етапу довільну планету: часову частину можна буде уточнити після перевірки періодів Вімшоттарі.',
  minor?
   'Усередині цього великого циклу діє антардаша '+G(minor.lord)+' — від '+naturalDate(minor.start,true,chart.input.timeZone)+' до '+naturalDate(minor.end,true,chart.input.timeZone)+'. '+P(minor.lord)+' '+sayRulers(minor.lord,lords,true)+' і стоїть у '+ordinal(H(minor.lord),true)+'. '+(major&&major.lord===minor.lord?'Основний період і підперіод підсилюють ту саму сферу відповідальності.':'Тепер поруч звучать два мотиви: '+area(H(major!.lord),true)+' та '+area(H(minor.lord),true)+'.')+' Важливо дивитися, як вони можуть співіснувати в повсякденних рішеннях.':
   'Чинний підперіод у наявному розрахунку не визначено, тому деталізувати його без даних було б неправильно.',
  major?
   'Корисний спосіб проживати цей час усвідомлено — перевірити, які обов’язки дійсно ваші, а де можна повернути собі простір для власного розвитку. '+(minor?'Спробуйте протягом кількох тижнів вести короткі нотатки: що потребує структури, а що — оновлення підходу.':'Почніть із кількох простих щоденних спостережень, не прив’язуючи їх до передбаченої події.')+' Даша задає ритм традиційного читання, але не гарантує дату життєвого повороту.':
   'Натомість можна спертися на сталі показники D1, D9 і D10 — і досліджувати їх через конкретні вибори, не роблячи прогнозу з відсутніх часових даних.'
 ]:[
  major?
   'As of '+naturalDate(asOf,false,chart.input.timeZone)+', the '+P(major.lord)+' mahadasha runs from '+naturalDate(major.start,false,chart.input.timeZone)+' to '+naturalDate(major.end,false,chart.input.timeZone)+'. The major-period lord '+sayRulers(major.lord,lords,false)+' and occupies '+ordinal(H(major.lord),false)+'. Those exact roles, rather than a generic planet archetype, set the themes of the period.':
   'No active mahadasha is calculated for the selected date. The reading does not assign an invented planetary ruler to the present period.',
  minor?
   'The '+P(minor.lord)+' antardasha runs from '+naturalDate(minor.start,false,chart.input.timeZone)+' to '+naturalDate(minor.end,false,chart.input.timeZone)+'. Its lord '+sayRulers(minor.lord,lords,false)+' and occupies '+ordinal(H(minor.lord),false)+'. '+(major&&major.lord===minor.lord?'The two layers amplify a common life arena.':'The two themes now meet: '+area(H(major!.lord),false)+' and '+area(H(minor.lord),false)+'.')+' Their coexistence matters more than a one-word prediction.':
   'No active subperiod is available in the supplied calculation.',
  major?
   'A practical response is to observe which obligations belong to you and where your own development still needs room. Keep a short record of the commitments that require structure and those that might benefit from changing course. Vimshottari provides a traditional timing frame, not guaranteed event dates.':
   'The natal D1, D9 and D10 positions still provide a complete traditional context without invented time-bound claims.'
 ];
 const conclusion=uk?[
  'Коли поєднати ці опори, вимальовується спільна лінія: '+summary+' Управитель лагни '+P(lagna)+' у '+ordinal(H(lagna),true)+' ставить питання особистої цілісності; управитель професійного десятого дому '+P(lord(10))+' у '+ordinal(rulerHouse(10),true)+' показує, де ця цілісність проходить випробування справою. Між ними і лежить особистий почерк вашої карти.',
  'Ваші сили не зобов’язані завжди діяти однаково. '+(jointlyMarsSaturn?'Марс і Сатурн в одному домі вчать поєднувати сміливий початок з витривалістю.':'Марс і Сатурн у різних домах пропонують два способи рухатися: ривок і поступове зростання.')+' Місяць у '+ordinal(moon.house,true)+' нагадує, що навіть найсильніша мета не варта повного ігнорування власного внутрішнього життя. '+(hasCluster?'А центральне скупчення у '+ordinal(cluster.house,true)+' збирає ці питання в сфері '+area(cluster.house,true)+'.':'Різні управителі створюють кілька полюсів, між якими можна свідомо обирати пріоритет.') ,
  'Дві практики для цього шляху. Перша: протягом найближчих тижнів зробіть одну важливу ідею перевірюваною дією — маленьким проєктом, розмовою або навичкою, яку можна показати іншим. Друга: визначте межі часу й уваги для близьких, праці та відновлення; запитайте себе, де ви погоджуєтеся з обов’язку, а де — зі щирого вибору. Так традиційне прочитання стає не ярликом і не фатальним вироком, а картою усвідомлених можливостей.'
 ]:[
  'Taken together, the chart tells one story: '+summary+' Ascendant lord '+P(lagna)+' in '+ordinal(H(lagna),false)+' highlights the terms of personal integrity, while tenth-house lord '+P(lord(10))+' in '+ordinal(rulerHouse(10),false)+' asks how that integrity becomes meaningful action.',
  (jointlyMarsSaturn?'Mars and Saturn sharing one house encourage a balance of bold beginnings and staying power.':'Mars and Saturn in separate houses offer distinct tools: starting and sustaining.')+' The Moon in '+ordinal(moon.house,false)+' keeps the inner rhythm in view. '+(hasCluster?'The central concentration in '+ordinal(cluster.house,false)+' gives these choices a particularly visible arena.':'Several different house rulers provide more than one valid focus, inviting conscious priorities.') ,
  'Try two grounded practices. First, make an important idea testable through a modest project, honest conversation or demonstrable skill. Second, establish real boundaries for partnership, work and restoration, then ask where you are acting out of obligation and where you are choosing freely. A traditional reading becomes valuable when it sharpens discernment, not when it labels a person or pretends to dictate the future.'
 ];
 const chapter=(id:ChapterId,paragraphs:string[])=>({id,paragraphs});
 return [chapter('portrait',portrait),chapter('configuration',configuration),
  chapter('tensions',tensions),chapter('relationships',relationships),
  chapter('career',career),chapter('resources',resources),
  chapter('timing',timing),chapter('conclusion',conclusion)];
}
