import type {CalculatedChart,Graha} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_GRAHAS,dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';

/** A8.7: a complete narrative from checked calculated facts, even when the LLM fails.
 * This is a traditional interpretation, not a verified biography or prediction. */
const names:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const genitive:Record<string,string>={Sun:'Сонця',Moon:'Місяця',Mars:'Марса',Mercury:'Меркурія',Jupiter:'Юпітера',Venus:'Венери',Saturn:'Сатурна'};
const zodiac=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const ukAreas=['самостійності','цінностей і накопичень','спілкування та навичок','дому і коріння','творчого розуму','праці та подолання труднощів','партнерства','переосмислення і спільних ресурсів','світогляду й навчання','професійної реалізації','здобутків і підтримки','відновлення і внутрішнього життя'];
const enAreas=['personal agency','resources and family values','communication and skills','home and roots','creative intelligence','work and overcoming problems','relationships','change and shared resources','learning and worldview','vocation','gains and networks','rest and inner life'];
const current=(chart:CalculatedChart,name:string)=>{const p=chart.d1.find(g=>g.name===name);if(!p)throw new Error('Missing D1 '+name);return p;};
const divisional=(chart:CalculatedChart,kind:'d9'|'d10',name:string)=>{const p=chart[kind].find(g=>g.name===name);if(!p)throw new Error('Missing '+kind+' '+name);return p;};
const displayDate=(s:string,uk:boolean)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(s));
const signDignity=(p:Graha,uk:boolean)=>{
 const d=dignityFor(p.name,p.sign);
 return d==='own'?(uk?'у власному знаку':'in its own sign'):
  d==='exalted'?(uk?'в екзальтації':'exalted'):
  d==='debilitated'?(uk?'у знаку падіння':'in its sign of debilitation'):'';
};
export function authorConsultationV5(chart:CalculatedChart,lang:'uk'|'en',asOf:string){
 const uk=lang==='uk',L=classicalLordshipTable(chart.ascendant.sign);
 const P=(x:string)=>uk?(names[x]||x):x;
 const G=(x:string)=>uk?(genitive[x]||x):x;
 const A=(n:number)=>uk?ukAreas[n-1]:enAreas[n-1];
 const H=(x:string)=>current(chart,x).house;
 const U=(h:number)=>P(L[h]);
 const moon=current(chart,'Moon'),mercury=current(chart,'Mercury'),jupiter=current(chart,'Jupiter');
 const venus=current(chart,'Venus'),saturn=current(chart,'Saturn');
 const yoga=yogakarakasForLagna(chart.ascendant.sign),moonLagna=L[1]==='Moon';
 const cluster=Array.from({length:12},(_,i)=>({h:i+1,p:CLASSICAL_GRAHAS.filter(n=>H(n)===i+1)}))
  .sort((a,b)=>b.p.length-a.p.length||a.h-b.h)[0];
 const sameMarsSaturn=H('Mars')===H('Saturn');
 const ninthJupiter=jupiter.house===6&&signDignity(jupiter,true)==='у власному знаку';
 const mercuryFall=signDignity(mercury,true)==='у знаку падіння';
 const cancer=chart.ascendant.sign===4;
 const marsYoga=yoga.includes('Mars');
 const activeAt=Date.parse(asOf+'T12:00:00Z');
 const major=chart.dasha.find(d=>Date.parse(d.start)<=activeAt&&activeAt<Date.parse(d.end));
 const minor=major?.antardashas?.find(d=>Date.parse(d.start)<=activeAt&&activeAt<Date.parse(d.end));
 const lordHouses=(name:string)=>Array.from({length:12},(_,i)=>i+1).filter(h=>L[h]===name).join(', ');
 const house=(n:number)=>uk?n+'-му домі':'house '+n;
 const degNotice=uk?'Спільний дім означає поєднання на рівні цілих знаків, а не доведену близькість за градусами.':'A shared whole-sign house does not prove a close conjunction by degree.';
 const portrait=uk?[
  'Лагна у '+zodiac[chart.ascendant.sign-1]+', її управитель '+U(1)+' у '+house(H(L[1]))+'. У традиції Джйотіш це пов’язує особистий напрям зі сферою '+A(H(L[1]))+'. Це точніше за загальний опис людей цього знака: управитель показує, у якій сфері людина найгостріше стикається з питанням власного напряму.',
  'Місяць стоїть у '+zodiac[moon.sign-1]+', у '+house(moon.house)+', накшатра '+moon.nakshatra+', пада '+moon.pada+'. '+(moonLagna&&moon.house===12?'Для Рака Місяць керує самою лагною, тому потреба побути наодинці, обробити переживання та відновити сили є не просто рисою темпераменту, а окремою темою життєвої організації. Усамітнення важливо не плутати з небажанням мати близьких.':'Його положення описує внутрішній ритм і емоційну реакцію, які потрібно зіставляти з іншими управителями, а не виводити з одного знака.'),
  'Сонце в '+house(H('Sun'))+' висвітлює тему '+A(H('Sun'))+'. '+(H('Sun')!==H('Moon')?'Зовнішня потреба діяти та внутрішній спосіб відновлюватися належать до різних домів: важливо не вимагати від себе постійно бути однаково активним.':'Ці дві функції переплітаються в одній сфері, але не є тотожними.')+' Це можливе традиційне прочитання взаємодії, а не припущення про факти вашого життя.'
 ]:[
  'The ascendant ruler '+U(1)+' occupies '+house(H(L[1]))+', directing identity toward '+A(H(L[1]))+'. This specific house ownership matters more than broad sign adjectives.',
  'The Moon occupies '+house(moon.house)+' in '+moon.signName+', nakshatra '+moon.nakshatra+' pada '+moon.pada+'. It describes an additional emotional pattern, not a fixed psychological diagnosis.',
  'The Sun occupies '+house(H('Sun'))+', connecting purpose with '+A(H('Sun'))+'. Compare its outward role with the Moon rather than assuming every part of the chart has the same rhythm.'
 ];
 const configuration=uk?[
  cluster.p.length>=3?'У '+cluster.h+'-му домі зосереджені '+cluster.p.map(P).join(', ')+'. Це не чотири незалежні обіцянки успіху: кожна з цих планет керує іншими домами, тому головна тема виникає саме з їхньої взаємодії у сфері '+A(cluster.h)+'.':'Карта не має великого скупчення класичних планет. Найкраще читати її через управителів дев’ятого й десятого домів і те, як їхні теми пов’язані з рештою положень.',
  (marsYoga?'Марс тут — йогакарака: він керує п’ятим домом творчого розуму і десятим домом професії. Марс у '+house(H('Mars'))+' поєднує здатність формувати власні ідеї з потребою реалізовувати їх через справу. ':'Управитель десятого дому '+U(10)+' у '+house(H(L[10]))+' задає зв’язок професійних задач із життєвим напрямом. ')+
  'Управитель дев’ятого дому '+U(9)+' знаходиться в '+house(H(L[9]))+(signDignity(current(chart,L[9]),true)?', '+signDignity(current(chart,L[9]),true):'')+'. Його положення — необхідна противага висновкам, побудованим тільки на головному скупченні.',
  cancer&&ninthJupiter?'Для цієї лагни Юпітер, управитель дев’ятого і шостого домів, стоїть у власному Стрільці у шостому. Так знання й світогляд отримують практичний вимір: учитися недостатньо заради статусу — важливо розв’язувати реальні проблеми, вдосконалювати майстерність, допомагати та доводити задум до результату.': 'Отже, завдання не в тому, щоби приписати скупченню одну рису, а зрозуміти, які доми його учасники переносять у головну життєву сферу.'
 ]:[
  'The strongest D1 concentration is in '+house(cluster.h)+', with '+cluster.p.join(', ')+'. Read their different functional house rulerships together rather than announcing automatic good fortune.',
  (marsYoga?'Mars is a yogakaraka joining the fifth and tenth lordships. ':'The vocational ruler '+U(10)+' has its own house role. ')+'The ninth ruler '+U(9)+' occupies '+house(H(L[9]))+', making the life-purpose picture more specific.',
  'The wider significance depends on both the major placement and the ruler of that house. An emphasis on knowledge can call for practical mastery rather than only intellectual identification.'
 ];
 const tensions=uk?[
  (sameMarsSaturn?'Марс і Сатурн перебувають разом у '+house(H('Mars'))+'. Прагнення діяти швидко зустрічає потребу довго вибудовувати надійний результат; це може переживатися як суперечність між рішучістю і вимогливістю до себе. ':'Марс у '+house(H('Mars'))+', Сатурн у '+house(H('Saturn'))+'. Імпульс до дії й потреба структури стосуються різних сфер, отже не треба вигадувати між ними сполучення. ')+degNotice,
  'Меркурій у '+house(H('Mercury'))+(signDignity(mercury,true)?', '+signDignity(mercury,true):'')+'. '+(mercuryFall?'У традиційній класифікації Меркурій у Рибах має статус падіння: цілісне або образне розуміння не завжди легко перевести у точну аргументацію. Це не показник відсутності інтелекту і не доказ, що людина припускатиметься помилок; умови можливого пом’якшення цього статусу потрібно розраховувати окремо.':'Його роль у мисленні та комунікації важливо відділяти від дії Марса та обережності Сатурна.'),
  moon.house===12?'Місяць у дванадцятому додає ще один практичний контраст: сильне зовнішнє навантаження може вимагати особистого простору, щоб відновлювати ясність. Сила такого поєднання — не в постійному змаганні зі своєю чутливістю, а в умінні обирати темп.':'Порівняння Місяця з Марсом і Сатурном дає незалежний емоційний показник, але не дозволяє автоматично називати кожну напругу кризою.'
 ]:[
  (sameMarsSaturn?'Mars and Saturn share '+house(H('Mars'))+': initiative meets the demand for lasting responsibility. ':'Mars and Saturn operate in separate houses. ')+degNotice,
  'Mercury occupies '+house(H('Mercury'))+(signDignity(mercury,false)?', '+signDignity(mercury,false):'')+'. This adds a specific style of communication without implying that the person lacks ability.',
  'The Moon in '+house(moon.house)+' provides another axis for comparison: emotional recovery need not follow the rhythm of public activity.'
 ];
 const navVenus=divisional(chart,'d9','Venus');
 const relationships=uk?[
  'Сьомим домом керує '+U(7)+' з '+house(H(L[7]))+'; для цієї лагни ця сама планета керує також домами '+lordHouses(L[7])+'. '+(cancer&&L[7]==='Saturn'?'Отже, Сатурн поєднує партнерство (7-й дім) із темою спільних змін, довіри й уразливості (8-й). Це привід говорити про зрілі домовленості та здатність разом проходити складні етапи, а не про абстрактну «серйозність у коханні».':'Партнерство слід читати через реальні управління цієї планети й сферу її розташування.'),
  'Венера стоїть у '+house(venus.house)+', у '+zodiac[venus.sign-1]+'; вона керує домами '+lordHouses('Venus')+'. '+(cancer&&venus.house===10?'Це створює перетин потреби в близькості з професійною помітністю й соціальними зв’язками. Питання може звучати не «кар’єра чи любов», а як залишити в робочому розкладі реальний час для відносин.':'Зіставлення Венери з управителем сьомого дому дозволяє побачити різницю між способом виявляти тепло та формою зобов’язань.')+(moon.house===12?' Місяць у дванадцятому додає потребу в особистому просторі, яку варто проговорювати, а не приховувати.':''),
  'У Навамші D9 лагна у '+zodiac[chart.lagnaD9.sign-1]+', Венера в '+house(navVenus.house)+'. '+(navVenus.house===1?'Венера в першому домі D9 підкреслює роль власної позиції й самовираження у зрілих стосунках: близькість не повинна означати відмову від індивідуальності.':'Це другий погляд на роль Венери та взаємності, який уточнює, але не скасовує D1.')+' За одним цим показником не встановлюють дату шлюбу чи мотиви конкретного партнера.'
 ]:[
  'The seventh-house ruler '+U(7)+' occupies '+house(H(L[7]))+' and also rules '+lordHouses(L[7])+'. This links commitment to distinct natal responsibilities.',
  'Venus in '+house(venus.house)+' contributes affectionate expression, while the Moon in '+house(moon.house)+' supplies the emotional counterweight. Read both rather than promising a relationship outcome.',
  'In Navamsha D9, Venus occupies '+house(navVenus.house)+' and the ascendant sign is '+chart.lagnaD9.signName+'. D9 refines the partnership picture; it does not reveal another person’s intentions.'
 ];
 const professional=divisional(chart,'d10',L[10]);
 const career=uk?[
  'Управитель десятого дому '+U(10)+' перебуває в '+house(H(L[10]))+' — сфері '+A(H(L[10]))+'. '+(marsYoga?'Для цієї лагни Марс одночасно керує п’ятим домом: отже, творчий розум, здатність навчатися та професійна дія пов’язані через конкретну йогу управителів.':'Щоб зрозуміти характер праці, потрібно врахувати й інші доми цього управителя.')+' Це схиляє традиційне прочитання до питання, у чому знання можуть стати відповідальною дією, а не до одного «призначеного фаху».',
  'Управитель дев’ятого дому '+U(9)+' у '+house(H(L[9]))+(signDignity(current(chart,L[9]),true)?', '+signDignity(current(chart,L[9]),true):'')+'. '+(cancer&&ninthJupiter?'Юпітер у власному Стрільці в шостому переносить частину покликання в щоденну практику: роботу зі складними проблемами, системами, навчанням інших через власний досвід. Спробувати складну задачу й показати результат тут важливіше, ніж лише накопичити сертифікати.':'Це уточнює, де і як світогляд та майстерність проходять перевірку реальністю.'),
  'Дашамша D10 має лагну у '+zodiac[chart.lagnaD10.sign-1]+', а '+U(10)+' у D10 займає '+house(professional.house)+'. '+(professional.house===6?'Отже, навіть якщо професійний інтерес спрямований до наставництва чи створення ідей, спосіб реалізації може бути дуже практичним: розбирати проблеми, налагоджувати процеси й розвивати майстерність під навантаженням.':'Це додає окремий контекст повсякденної реалізації, який не можна виводити тільки з D1.')+' Як можливі напрями для роздумів, а не гарантію роботи, варто зіставляти навчання, аналітичні завдання, керування проєктами та допомогу людям у конкретних задачах.'
 ]:[
  'The tenth-house lord '+U(10)+' occupies '+house(H(L[10]))+', linking work with '+A(H(L[10]))+'. Functional house ownership sharpens the reading beyond a generic profession list.',
  'The ninth lord '+U(9)+' occupies '+house(H(L[9]))+'. The actual house indicates where a philosophy or skill needs to be put to use rather than merely admired.',
  'In Dashamsha D10 the tenth lord appears in '+house(professional.house)+' and D10 rises in '+chart.lagnaD10.signName+'. This is a separate indicator of professional method, not an occupational guarantee.'
 ];
 const resources=uk?[
  'Другим домом ресурсів і накопичень керує '+U(2)+' з '+house(H(L[2]))+'. Одинадцятим домом результатів і підтримки — '+U(11)+' з '+house(H(L[11]))+'. Це два різні питання: що людина зберігає та розвиває, і за рахунок яких зусиль чи співпраці отримує можливості.',
  cancer&&H('Sun')===9&&H('Venus')===10?'Тут Сонце, управитель другого дому, пов’язує ресурси зі знаннями та дев’ятим домом, тоді як Венера, управитель одинадцятого, стоїть у десятому — сфері реальних професійних результатів. Тому практична стратегія, яку підказує такий символічний зв’язок, — не гнатися за «легкими грошима», а створювати навички й репутацію, через які можуть виникати співпраця й підтримка.':'Другий управитель стоїть у сфері '+A(H(L[2]))+', а одинадцятий — у сфері '+A(H(L[11]))+'. Ці два канали варто оцінювати окремо; карта не дає підстав називати конкретні доходи.',
  'Таке прочитання не є фінансовим прогнозом. Воно допомагає відрізнити ваші цінності та вміння від реального результату праці; рішення про витрати, кредити чи інвестиції потрібно приймати за звичайними фінансовими даними.'
 ]:[
  'The second-house lord '+U(2)+' in '+house(H(L[2]))+' is distinct from eleventh-house lord '+U(11)+' in '+house(H(L[11]))+'. The former concerns stored resources and values, the latter gains and networks.',
  'These placements can prompt separate questions about skills and earned opportunities without predicting a salary or investment outcome.',
  'A financial decision still needs ordinary financial evidence, not a chart-based guarantee.'
 ];
 const timing=uk?[
  major?'Станом на '+displayDate(asOf,true)+' активна махадаша '+G(major.lord)+' — від '+displayDate(major.start,true)+' до '+displayDate(major.end,true)+'. Її планета керує домами '+lordHouses(major.lord)+' і перебуває в '+house(H(major.lord))+'. '+(cancer&&major.lord==='Saturn'?'Для Рака Сатурн керує сьомим і восьмим домами, тому головна тема періоду — не просто «дисципліна», а тривалі союзи, домовленості, спільна відповідальність і здатність проходити зміни.':'Зміст періоду випливає з цих конкретних функціональних ролей.'):'Для цієї дати активну махадашу в наданому розрахунку не визначено; вигадувати її не будемо.',
  minor?'Антардаша '+G(minor.lord)+' триває від '+displayDate(minor.start,true)+' до '+displayDate(minor.end,true)+'. '+P(minor.lord)+' керує домами '+lordHouses(minor.lord)+' та перебуває в '+house(H(minor.lord))+'. '+(cancer&&minor.lord==='Moon'&&moon.house===12?'Місяць, управитель першого дому, у дванадцятому домі додає питання власного ритму, внутрішньої ясності, особистих меж і відновлення. Так період Сатурн–Місяць співвідносить відповідальність перед іншими з необхідністю не втратити себе в цій відповідальності.':'Його функціональна роль змінює відтінок головного періоду; один загальний опис планет тут не підходить.'):'Обчислення не визначило чинний підперіод, тому конкретних меж антардаші не наводимо.',
  'Це часові межі Вімшоттарі, а не передбачені дати подій. Практичний спосіб розуміти цей етап — запитувати, які довгострокові обов’язки справді потребують вашої участі, і як організувати відновлення, щоб участь не перетворювалася на виснаження.'
 ]:[
  major?'The '+major.lord+' mahadasha runs from '+displayDate(major.start,false)+' to '+displayDate(major.end,false)+' and rules houses '+lordHouses(major.lord)+'. It occupies '+house(H(major.lord))+'.':'No active major period was calculated for the requested date.',
  minor?'The '+minor.lord+' antardasha runs from '+displayDate(minor.start,false)+' to '+displayDate(minor.end,false)+', ruling '+lordHouses(minor.lord)+'. It occupies '+house(H(minor.lord))+'.':'There is no calculated current subperiod.',
  'A planetary period gives the traditional frame for examining responsibilities and priorities, not the date of a guaranteed event.'
 ];
 const conclusion=uk?[
  'Найпомітніше в цій карті — співвідношення управителя лагни '+U(1)+' у '+house(H(L[1]))+', управителя професії '+U(10)+' у '+house(H(L[10]))+' та управителя партнерства '+U(7)+' у '+house(H(L[7]))+'. Вони відповідають за різні частини життя, тому ваш шлях не варто зводити до однієї риси характеру або до професійного ярлика.',
  (marsYoga?'Марс як йогакарака пов’язує творчий розум із професійною дією. ':'Професійна тема складається з ролей реальних управителів домів. ')+(sameMarsSaturn?'Марс і Сатурн у спільному домі показують напругу між ініціативою й тривалою відповідальністю. ':'Відмінні доми Марса й Сатурна розділяють імпульс та дисципліну. ')+(cancer&&ninthJupiter?'Юпітер у власному знаку в шостому допомагає перевіряти великі ідеї через реальні навички, службу та вирішення задач.':'Управитель дев’ятого дому показує, де переконання можуть перетворюватися на практику.'),
  'Два корисні способи дослідити ці теми: перший — обрати проєкт, де ваші знання можна перевірити помітним результатом, а не лише планами; другий — визначити межі часу й відновлення у стосунках і роботі, щоб довгі зобов’язання не витіснили внутрішнє життя. Це практичні варіанти для роздумів, а не пророкування.'
 ]:[
  'The ascendant ruler '+U(1)+' in '+house(H(L[1]))+', vocational ruler '+U(10)+' in '+house(H(L[10]))+' and partnership ruler '+U(7)+' in '+house(H(L[7]))+' lead different life themes. Their actual interaction is more specific than a generic personality label.',
  (marsYoga?'The Mars yogakaraka connects creative ability and professional action. ':'The vocational ruler indicates a particular focus. ')+(sameMarsSaturn?'A whole-sign Mars-Saturn conjunction adds the tension between initiative and responsibility.':'The Mars and Saturn houses indicate different rhythms.')+' The ninth ruler supplies the practical counterweight.',
  'Two grounded reflections are to test knowledge through a concrete project, and to reserve real restoration time that does not conflict with meaningful commitments. These are possibilities, not predictions.'
 ];
 return [
  {id:'portrait',paragraphs:portrait},{id:'configuration',paragraphs:configuration},
  {id:'tensions',paragraphs:tensions},{id:'relationships',paragraphs:relationships},
  {id:'career',paragraphs:career},{id:'resources',paragraphs:resources},
  {id:'timing',paragraphs:timing},{id:'conclusion',paragraphs:conclusion}
 ];
}
