/**
 * N4.9.2 — one concise, substantive reading per Shodashvarga, ordered D1..D60.
 * Uses existing v6 authored consultation AS EDITORIAL SOURCE, actual D1 lordship,
 * conditional yogakaraka, sign-dignity, traditional topic and verified varga.
 * No mandatory unrelated chart cross-reference. A linked chart must contribute
 * actual evidence; otherwise it is omitted.
 *
 * This is NOT an independent historical-varga or birth-time certificate.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {authorConsultationV6} from './reader-narrative-v6.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';
import {buildN493Overview,type N493Overview} from './reader-insights-n493.ts';
import {buildN493ThematicDetail} from './reader-detail-n493.ts';
import {buildHumanReaderCard,buildHumanReaderSummary} from './reader-human-n495.ts';

export const N492_MEANING_VERSION='n492-evidence-prioritized-16-varga-v1' as const;
export const N492_ORDER=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60] as const;
type Lang='uk'|'en';
type Card={division:number;title:string;meaning:string;connection:string|null;
 status:'notable'|'mixed'|'contextual'|'provisional';proof:string[];sourceIds:string[]};
export type MeaningfulReading={version:typeof N492_MEANING_VERSION;
 cards:readonly Card[];discoveries:N493Overview;summary:{title:string;strength:string;attention:string;direction:string;proof:string[]};
 method:string};
const HEADS:Readonly<Record<number,[string,string,number]>>={
 1:['Особистість і життєвий напрям','Identity and direction',1],
 2:['Гроші й ресурси','Money and resources',2],
 3:['Сміливість, спілкування, рідні брати й сестри','Courage, communication and siblings',3],
 4:['Дім, нерухомість і опора','Home, property and security',4],
 7:['Діти й творча спадщина','Children and creative legacy',5],
 9:['Партнерство і зрілість союзу','Partnership and mature commitment',7],
 10:['Кар’єра та професійні здібності','Career and vocation',10],
 12:['Батьки та родинні корені','Parents and ancestry',4],
 16:['Комфорт і транспорт','Comfort and vehicles',4],
 20:['Духовна практика','Spiritual practice',9],
 24:['Навчання і майстерність','Education and mastery',5],
 27:['Витривалість і внутрішні ресурси','Resilience and capabilities',1],
 30:['Труднощі й стратегії подолання','Difficulties and how to face them',6],
 40:['Материнська лінія','Maternal lineage',4],
 45:['Батьківська лінія та принципи','Paternal lineage and values',9],
 60:['Тонкі положення планет','Fine planetary positions',1]
};
const SIGN_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const NAMES_UK:Readonly<Record<string,string>>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const AREAS:Readonly<Record<number,[string,string]>>={
 1:['особистих рішень','personal decisions'],
 2:['грошей, мовлення та сімейних цінностей','money, speech and family values'],
 3:['навичок і спілкування','skills and communication'],
 4:['дому й внутрішньої опори','home and stability'],
 5:['творчості, навчання та дітей','creativity, learning and children'],
 6:['праці та складних завдань','work and challenges'],
 7:['партнерства і домовленостей','partnership and agreements'],
 8:['спільних зобов’язань і змін','shared responsibilities and change'],
 9:['знань, наставників і світогляду','knowledge, mentors and worldview'],
 10:['професії та відповідальності','career and responsibility'],
 11:['здобутків та однодумців','achievements and allies'],
 12:['усамітнення й відновлення','solitude and recovery']
};
const PRACTICAL:Readonly<Record<number,[string,string]>>={
 1:['Порівняйте власні цілі з тим, що справді допомагає відновлювати сили.','Compare your outward goals with what actually restores your energy.'],
 2:['Розділяйте заробіток, збереження та довготривалу цінність праці.','Separate income, stewardship and the long-term value of your work.'],
 3:['Перевіряйте ініціативу конкретною розмовою або вправою, а не лише наміром.','Test initiative with a concrete conversation or practiced skill.'],
 4:['Вивчайте, як домашня стабільність підтримує ваші інші зобов’язання.','Examine how stability at home supports your other responsibilities.'],
 7:['Відрізняйте здатність навчати й піклуватися від припущень про майбутніх дітей.','Distinguish care and mentorship from unsupported claims about future children.'],
 9:['Порівнюйте реальні умови взаємності з очікуваннями від партнера.','Compare actual mutual commitments with assumptions about a partner.'],
 10:['Зверніть увагу на завдання, у яких ваші знання стають вимірюваним результатом.','Look for work where knowledge becomes a visible, useful result.'],
 12:['Окремо досліджуйте вплив батьківських прикладів і власні теперішні рішення.','Distinguish parental examples from your own present choices.'],
 16:['Оцінюйте, чи побутові зручності допомагають відновлюватися, а не відволікають.','Notice whether practical comforts support recovery rather than distract you.'],
 20:['Підтримуйте практику, яку можете виконувати регулярно, без обіцянки швидких змін.','Choose a practice you can sustain without expecting instant transformation.'],
 24:['Поєднуйте навчання із завданнями, де знання проходять реальну перевірку.','Pair study with a task that puts knowledge to a real test.'],
 27:['Шукайте баланс між витривалістю, відпочинком і можливістю просити підтримку.','Balance endurance with rest and willingness to ask for support.'],
 30:['Визначайте способи долати складність, не ототожнюючи її з приреченістю.','Identify ways to face challenges without interpreting them as destiny.'],
 40:['Відрізняйте сімейні моделі, які допомагають, від тих, які ви бажаєте змінити.','Distinguish inherited examples worth keeping from those worth changing.'],
 45:['Перевіряйте, які родинні принципи стали вашими свідомими переконаннями.','Examine which inherited principles you have consciously chosen.'],
 60:['Розглядайте D60 лише як чутливе уточнення до основної карти.','Treat D60 only as a sensitive refinement of the birth chart.']
};
const RELEVANT:Readonly<Record<number,number>>={2:10,3:27,4:12,7:9,9:1,10:24,12:4,16:4,
 20:9,24:10,27:30,30:27,40:12,45:9};
const notable=(d:string)=>d==='own'||d==='exalted';
const statusMeaning=(d:string,uk:boolean)=>{
 if(d==='exalted')return uk?'у знаку екзальтації — виразний традиційний показник, який ще потребує перевірки іншими чинниками.':
  'in its exaltation sign, a notable traditional indicator requiring corroboration.';
 if(d==='own')return uk?'у власному знаку — додаткова традиційна підтримка теми.':
  'in its own sign, offering traditional support for this theme.';
 if(d==='debilitated')return uk?'у знаку дебілітації — можливу складність слід оцінювати разом з іншими показниками, не як вирок.':
  'in its debilitation sign; potential difficulty requires context, not a verdict.';
 return '';
};
const truncateSentences=(s:string,count:number)=>{
 const parts=s.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/gu)||[];
 return parts.slice(0,count).join(' ').replace(/\s+/g,' ').trim();
};
export function buildMeaningfulN492(chart:CalculatedChart,lang:Lang,asOf:string):MeaningfulReading|null{
 const verified=verifiedVargaSource(chart);if(!verified)return null;
 const uk=lang==='uk',idx=uk?0:1,lp=classicalLordshipTable(chart.ascendant.sign);
 const yoga=new Set(yogakarakasForLagna(chart.ascendant.sign));
 const pName=(p:string)=>uk?NAMES_UK[p]||p:p;
 const sign=(s:number)=>(uk?SIGN_UK:SIGN_EN)[s-1];
 const area=(h:number)=>AREAS[h][idx];
 const source=verified.charts;
 const authored=authorConsultationV6(chart,lang,asOf);
 const chapter=(id:string)=>authored.find(x=>x.id===id)?.paragraphs||[];
 const get=(name:string)=>chart.d1.find(p=>p.name===name);
 const same=(div:number,name:string)=>source.find(c=>c.division===div)?.planets.find(p=>p.name===name);
 const facts=ruleFindings(chart);
 const d60=buildD60Preview(chart,lang);
 const discoveries=buildN493Overview(chart,lang);
 if(!discoveries)return null;
 const cards:Card[]=[];
 for(const div of N492_ORDER){
  const [titleUk,titleEn,topicHouse]=HEADS[div];
  const title=uk?titleUk:titleEn;
  if(div===60){
   const usable=d60.status==='conditional_signs'&&d60.allPlanets.length===9;
   const main=d60.factors[0],second=d60.factors[1];
   const meaning=usable?
    (uk?'D60 — не ще один життєвий прогноз: це чутливий до точності часу зріз дев’яти розрахованих знаків. '+
     (main?main.note+' ':'Немає достатньо віддалених від межі положень для персонального зіставлення. ')+
     (second?second.note+' ':'')+
     'Ці зіставлення допомагають побачити, як змінюється символічний акцент між D1 та D60, але самі не підтверджують точність записаного часу.':
     'D60 is not another life forecast; it is a birth-time-sensitive view of nine calculated signs. '+
     (main?main.note+' ':'No placements are sufficiently far from divisional boundaries for a closer personal comparison. ')+
     (second?second.note+' ':'')+
     'These comparisons show changes in symbolic emphasis between D1 and D60, not a certification of the recorded birth time.'):
    (uk?'Немає надійно прив’язаних до D1 даних D60 для індивідуального висновку.':
      'D60 evidence cannot currently be reliably bound to the birth chart.');
   cards.push({division:60,title,meaning,connection:null,status:'provisional',
    sourceIds:[],proof:usable?d60.allPlanets.flatMap(p=>['D1.'+p.planet+'.sign='+p.d1Sign,'D60.'+p.planet+'.sign='+p.d60Sign]):[]});
   continue;
  }
  const lord=lp[topicHouse],natal=get(lord),varga=same(div,lord);
  if(!natal||!varga)throw Error('N492_MISSING_PLANET_D'+div);
  const natalQuality=dignityFor(lord,natal.sign);
  const dnQuality=dignityFor(lord,varga.sign);
  const isYoga=yoga.has(lord);
  const [t0,t1]=[natal.house,varga.house];
  const proof=['D1.ascendant.sign='+chart.ascendant.sign,'D1.house-lord.'+topicHouse+'='+lord,
    'D1.'+lord+'.sign='+natal.sign,'D1.'+lord+'.house='+t0,
    'D'+div+'.'+lord+'.sign='+varga.sign,'D'+div+'.'+lord+'.house='+t1];
  let meaning='';
  if(div===1){
   // Start from our already authored, richer D1 consultation, not D1 vs itself.
   meaning=truncateSentences(chapter('portrait')[0]||'',3).replace('лагна у Овні','лагна в Овні');
   const moon=get('Moon');
   if(moon&&moon.name!==lord)meaning+=' '+(uk?'Місяць у '+moon.house+'-му домі додає тему '+area(moon.house)+'.':
    'The Moon in house '+moon.house+' adds the theme of '+area(moon.house)+'.');
   if(moon?.name===lord){
    const sun=get('Sun');
    if(sun)meaning+=' '+(uk?'Сонце у '+sun.house+'-му домі додає інший акцент — сферу '+area(sun.house)+'.':
     'The Sun in house '+sun.house+' introduces the distinct theme of '+area(sun.house)+'.');
   }
  }else if(div===10){
   const from=natal.house,to=varga.house;
   meaning=uk?'У D1 професією керує '+pName(lord)+' у '+from+'-му домі (сфера '+area(from)+
    '). У D10 ця планета в '+to+'-му домі (сфера '+area(to)+
    '), у знаку «'+sign(varga.sign)+'».':
    'The D1 tenth house is ruled by '+lord+' in house '+from+' ('+area(from)+
    '). In D10 it occupies house '+to+' ('+area(to)+') in '+sign(varga.sign)+'.';
   if(isYoga){
    const ruled=Array.from({length:12},(_,i)=>i+1).filter(h=>lp[h]===lord);
    const trinal=ruled.find(h=>[5,9].includes(h));
    const angular=ruled.find(h=>[4,7,10].includes(h));
    if(!trinal||!angular)throw Error('N492_YOGAKARAKA_HOUSE_INCONSISTENCY');
    meaning+=' '+(uk?'Для вашої лагни '+pName(lord)+' є йогакаракою: керує '+trinal+
      '-м та '+angular+'-м домами. Це особлива функціональна роль, але не готовий прогноз.':
      'For this ascendant '+lord+' is a yogakaraka: it rules houses '+trinal+
      ' and '+angular+'. This is a special natal role, not a promised career outcome.');
    proof.push('D1.house-lord.'+trinal+'='+lord,'D1.house-lord.'+angular+'='+lord);
   }
   const degree=statusMeaning(dnQuality,uk);
   if(degree)meaning+=' '+(uk?'Професійна варга: '+pName(lord)+' '+degree:
    'Vocational division: '+lord+' is '+degree);
   // A concrete task based on the actual D10 house, not a guessed job title.
   // This survives as the fallback when no higher-ranked discovery owns D10.
   const vocationalTask:Record<number,[string,string]>={
    1:['Самостійна відповідальність: перевірте цей мотив на невеликому проєкті, де вам належить головне рішення.',
       'Own the decision on a small project and observe how independent responsibility feels.'],
    2:['Ресурси й мовлення: спробуйте завдання з бюджетування, пояснення вартості або прозорих домовленостей.',
       'Test work involving resource planning, explaining value or clear commercial agreements.'],
    3:['Навички та комунікація: створіть коротку інструкцію, доповідь або прототип, який інші зможуть перевірити.',
       'Build a short explanation, presentation or prototype others can test.'],
    4:['Основа й стабільність: оцініть свою роботу над процесом, який робить систему або команду надійнішою.',
       'Test a task that improves the reliability of a system, routine or team.'],
    5:['Творчість та наставництво: перевірте тему через власний прототип або навчання іншої людини.',
       'Test the creative or mentoring theme through a prototype or by teaching someone.'],
    6:['Щоденна майстерність і складні задачі: оберіть процес, який можете реально полагодити й виміряти результат.',
       'Pick a recurring complex problem you can solve and measure in practice.'],
    7:['Спільна робота: випробуйте роль, де важливі переговори, чіткі обов’язки й взаємний результат.',
       'Try a collaborative role that requires negotiation, clear duties and a shared result.'],
    8:['Зміни та спільна відповідальність: проведіть аудит складної задачі й складіть план безпечного вдосконалення.',
       'Audit a complex process and propose a careful improvement plan with shared ownership.'],
    9:['Знання й наставництво: створіть навчальний матеріал або поясніть складну тему тому, хто лише починає.',
       'Develop a lesson or explain a complex concept to a beginner.'],
    10:['Відповідальність і публічний результат: візьміть невеликий проєкт від плану до завершення.',
        'Lead a small visible project from planning to delivery.'],
    11:['Здобутки й спільноти: оберіть роботу, де користь можна оцінити за результатом для інших.',
        'Test a task with a measurable benefit for a group or community.'],
    12:['Закулісна робота: дослідіть складну проблему самостійно й зафіксуйте висновок у документі.',
        'Explore a complex problem independently and document a useful conclusion.']
   };
   meaning+=' '+(uk?'Практична перевірка професійного мотиву: ':'Test this vocational theme: ')+vocationalTask[to][idx];
  }else if(div===9){
   const venus=same(9,'Venus')!;
   meaning=uk?'У D1 сьомим домом керує '+pName(lord)+' у '+natal.house+'-му домі (сфера '+area(natal.house)+
    '). У D9 '+pName(lord)+' перебуває в знаку «'+sign(varga.sign)+'».':
    'In D1, the seventh-house ruler '+lord+' occupies house '+natal.house+' ('+area(natal.house)+
    '). In D9 the same '+lord+' occupies '+sign(varga.sign)+'.';
   if(lord===lp[8])meaning+=' '+(uk?'Сьомий і восьмий доми мають одного управителя: для традиційного прочитання союзу важливі і домовленості, і довіра.':
    'The seventh and eighth share one ruler: trust and shared commitments belong in the same discussion.');
   else if(natal.house===7)meaning+=' '+(uk?'Управитель партнерства в самому сьомому домі робить цю сферу окремим важливим акцентом.':
    'The relationship ruler in the seventh house makes this an especially direct life theme.');
   if(lord!=='Venus')meaning+=' '+(uk?'Венера додає незалежний показник взаємності: її D9 знак «'+sign(venus.sign)+'».':
    'Venus adds an independent relationship indicator in the D9 sign '+sign(venus.sign)+'.');
   else meaning+=' '+(uk?'У цій карті Венера має особливу вагу для партнерства, але оцінювати її слід разом з іншими показниками D1 і D9.':
    'Venus is especially relevant for partnership here, but needs context from the other D1 and D9 factors.');
   // A second relationship indicator is separate only if it is a different
   // graha; when Venus is already the seventh ruler, use Moon for needs.
   const secondaryName=lord==='Venus'?'Moon':'Venus';
   const relational=same(9,secondaryName)!;
   const d9Focus:Record<number,[string,string]>={
    1:['автономність поряд із союзом','independence within partnership'],
    2:['цінності, розмови й сімейні ресурси','values, conversations and family resources'],
    3:['спілкування і здатність відкрито просити','communication and speaking up'],
    4:['відчуття дому та безпеки','home and security'],
    5:['спільні творчі справи та підтримку розвитку','shared creativity and learning'],
    6:['поділ щоденних обов’язків','sharing everyday responsibilities'],
    7:['домовленості про взаємність','reciprocity and agreements'],
    8:['довіру та спільну відповідальність','trust and shared duties'],
    9:['цінності, світогляд та навчання разом','values, worldview and learning together'],
    10:['баланс роботи й обов’язків','balance between work and commitment'],
    11:['друзів, спільноти й взаємні цілі','friendships, communities and shared goals'],
    12:['особисті межі й потребу в тиші','privacy, boundaries and quiet']
   };
   meaning+=' '+(uk?'D9 розміщує управителя союзу в '+varga.house+'-му домі: '+
    'для розвитку стосунків традиційно важлива тема «'+d9Focus[varga.house][0]+'». '+
    (secondaryName==='Moon'?'Місяць ':'Венера ')+
    'як окремий показник у D9 знаходиться в '+relational.house+'-му домі. '+
    'Практично: проговоріть цю тему з іншою людиною, не припускаючи її відповіді наперед.':
    'D9 puts the partnership ruler in house '+varga.house+', bringing a traditional focus on '+
    d9Focus[varga.house][1]+'. '+secondaryName+' is a distinct indicator in D9 house '+
    relational.house+'. Discuss the practical issue with the other person rather than assuming their response.');
   proof.push('D9.Venus.sign='+venus.sign,'D9.'+secondaryName+'.house='+relational.house);
  }else if(div===2){
   const gains=lp[11],g=get(gains)!;
   meaning=uk?'Другим домом ресурсів керує '+pName(lord)+' у '+natal.house+'-му домі (сфера '+area(natal.house)+
    '), а одинадцятим домом здобутків — '+pName(gains)+' у '+g.house+'-му. '+
    'У D2 '+pName(lord)+' перебуває у знаку «'+sign(varga.sign)+'».':
    'The second-house resource ruler '+lord+' occupies natal house '+natal.house+
    ' ('+area(natal.house)+'), while the eleventh-house gains ruler '+gains+
    ' occupies house '+g.house+'. In D2 '+lord+' occupies '+sign(varga.sign)+'.';
   const degree=statusMeaning(dnQuality,uk);
   if(degree)meaning+=' '+(uk?'Знакова оцінка D2: '+pName(lord)+' '+degree:
    'D2 sign assessment: '+lord+' is '+degree);
   if(gains===lord)meaning+=' '+(uk?'Один управитель пов’язує збереження ресурсів і отримання результатів.':
    'The same ruler links accumulating resources with securing gains.');
   const moneyFocus:Record<number,[string,string]>={
    1:['особистої ініціативи','independent initiative'],2:['накопичення та сімейних цінностей','savings and family values'],
    3:['навичок і комунікації','skills and communication'],4:['дому та довготривалої опори','home and lasting security'],
    5:['творчих проєктів','creative projects'],6:['праці та щоденної дисципліни','work and daily discipline'],
    7:['домовленостей і партнерства','partnership and agreements'],8:['спільних зобов’язань і змін','shared duties and change'],
    9:['навчання та наставництва','learning and mentorship'],10:['професійної роботи','career and public work'],
    11:['спільноти та здобутків','community and gains'],12:['витрат і потреби у відновленні','expenses and recovery']
   };
   meaning+=' '+(uk?'Тема збереження ресурсів у D1 пов’язана зі сферою «'+moneyFocus[natal.house][0]+'». '+
    (natal.house===g.house?'Управителі 2-го й 11-го домів займають один дім, тож питання доходу й того, що залишається, зустрічаються в одній сфері. ':
     'Здобутки через 11-й дім мають іншу опору: «'+moneyFocus[g.house][0]+'». ')+
    'Практично розділяйте надходження, зобов’язання і те, що вдається зберегти.':
    'The natal resources theme involves '+moneyFocus[natal.house][1]+'. '+
    (natal.house===g.house?'The second and eleventh rulers share a house, linking two different money questions in one arena. ':
     'Gains point to a different arena: '+moneyFocus[g.house][1]+'. ')+
    'In practice separate incoming resources, obligations and what you retain.');
   proof.push('D1.house-lord.11='+gains,'D1.'+gains+'.house='+g.house);
  }else if(div===24){
   const otherName=lord==='Mercury'?'Jupiter':'Mercury';
   const other=same(24,otherName)!;
   const d24Focus:Record<number,[string,string]>={
    1:['самостійно розпочате завдання','a self-directed task'],
    2:['пояснення і відтворення знань','explaining and retaining knowledge'],
    3:['практику навичок і спілкування','practicing skills and communicating'],
    4:['створення міцної основи й регулярні заняття','building a strong learning foundation'],
    5:['творчий проєкт','a creative project'],
    6:['повторення й розв’язання помилок','repetition and solving real mistakes'],
    7:['навчання разом із партнером','learning with a partner'],
    8:['розбір складної проблеми','investigating a complex problem'],
    9:['навчання від наставника','learning from a mentor'],
    10:['професійне застосування знань','professional application of knowledge'],
    11:['взаємний обмін у спільноті','knowledge exchange in a community'],
    12:['самостійне дослідження','independent research']
   };
   meaning=uk?'У D1 управитель 5-го дому '+pName(lord)+' стоїть у '+natal.house+
    '-му домі (тема «'+area(natal.house)+'»). У D24 він у '+varga.house+
    '-му домі, у знаку «'+sign(varga.sign)+'». '+
    'Тому перевіряйте засвоєні знання через '+d24Focus[varga.house][0]+'. '+
    'Другий показник навчання, '+pName(otherName)+', у D24 займає '+other.house+
    '-й дім; його не можна прирівнювати до самого управителя п’ятого.':
    'In D1 the fifth-house ruler '+lord+' occupies house '+natal.house+
    ' ('+area(natal.house)+'); in D24 it occupies house '+varga.house+
    ' in '+sign(varga.sign)+'. Test learning through '+d24Focus[varga.house][1]+
    '. The separate learning indicator '+otherName+' is in D24 house '+other.house+
    ', a distinct influence from the fifth ruler.';
   const degree=statusMeaning(dnQuality,uk);
   if(degree)meaning+=' '+(uk?'Знакова оцінка D24: '+pName(lord)+' '+degree:
    'D24 sign dignity: '+lord+' is '+degree);
   proof.push('D24.'+otherName+'.sign='+other.sign,'D24.'+otherName+'.house='+other.house);
  }else{
   const focused=uk?'У D'+div+' '+pName(lord)+' перебуває в '+t1+'-му домі, у знаку «'+sign(varga.sign)+'».':
     'In D'+div+', '+lord+' occupies house '+t1+' in '+sign(varga.sign)+'.';
   const base=uk?
     'Управитель '+topicHouse+'-го дому '+pName(lord)+' стоїть у D1 в '+t0+'-му домі. '+
     'Тому тема цієї карти пов’язана також зі сферою '+area(t0)+'.':
     'The ruler of natal house '+topicHouse+', '+lord+', is in D1 house '+t0+
     '. This connects the chart topic with '+area(t0)+'.';
   meaning=base+' '+focused+' '+PRACTICAL[div][idx];
   const degree=statusMeaning(dnQuality,uk);
   if(degree)meaning+=' '+(uk?'Тут '+pName(lord)+' '+degree:lord+' is '+degree);
   if(isYoga)meaning+=' '+(uk?'Це також йогакарака для вашого висхідного знака — управитель кутового й тригонального дому.':
     'For this ascendant it is also a yogakaraka, ruling both an angular and a trinal house.');
  }
  const related=RELEVANT[div];
  let connection:string|null=null;
  if(related){
   const other=same(related,lord);
   if(other){
    const otherQuality=dignityFor(lord,other.sign);
    // A repeat is meaningful ONLY if supported by a concrete dignity condition;
    // otherwise don't add a comparison just to fill a UI slot.
    if((notable(dnQuality)&&notable(otherQuality))||
      ((notable(dnQuality)&&otherQuality==='debilitated')||(dnQuality==='debilitated'&&notable(otherQuality)))){
     connection=uk?
      (notable(dnQuality)&&notable(otherQuality)?
       'Додаткова підтримка: у D'+related+' '+pName(lord)+' також має сильне знакове положення («'+sign(other.sign)+'»). Обидва показники стосуються тієї самої планети.':
       'Важливий контраст: у D'+related+' '+pName(lord)+' у знаку «'+sign(other.sign)+'», і знакові оцінки різняться. Одного показника недостатньо для висновку.'):
      (notable(dnQuality)&&notable(otherQuality)?
       'Corroboration: the same '+lord+' also has supportive sign dignity in D'+related+' ('+sign(other.sign)+').':
       'Contrast: '+lord+' occupies '+sign(other.sign)+' in D'+related+' with a different sign dignity; neither placement alone settles the result.');
     proof.push('D'+related+'.'+lord+'.sign='+other.sign);
    }
   }
  }
  if(div===1){
   const special=facts.yogas.find(f=>f.planet===lord);
   if(special)proof.push(...special.evidence);
  }
  cards.push({division:div,title,meaning:meaning.trim(),connection,
   status:(dnQuality==='debilitated'&&notable(natalQuality))||(notable(dnQuality)&&natalQuality==='debilitated')?'mixed':
    notable(dnQuality)||isYoga?'notable':'contextual',proof,sourceIds:[]});
 }
 // Use the evidence-ranked narrative as the card's source of meaning when a
 // topic is one of the most characteristic for this specific chart.
 // Its claim is shown only once: the top overview is a short headline; the
 // expanded card carries the actual details and limitations.
 // All other subject cards now require a distinct secondary graha
 // comparison rather than a generic life-coaching tip.
 for(const card of cards){
  const detail=buildN493ThematicDetail(chart,lang,card.division);
  if(detail){
   card.meaning=detail.meaning;
   card.proof=[...new Set([...card.proof,...detail.proof])];
   card.sourceIds=[...new Set([...card.sourceIds,'N493-TWO-INDICATOR-COMPARISON'])];
  }
 }
 const leading=new Map<number,N493Overview['insights']>();
 for(const insight of discoveries.insights){
  leading.set(insight.division,[...(leading.get(insight.division)||[]),insight]);
 }
 for(const card of cards){
  const specials=leading.get(card.division)||[];
  if(specials.length){
   // Several distinct evidence patterns may belong to the same D1 card.
   // Keep each surfaced claim verifiable at its linked destination.
   card.meaning=specials.map(x=>x.interpretation).join(' ');
   card.proof=[...new Set([...card.proof,...specials.flatMap(x=>x.proof)])];
   card.sourceIds=[...new Set([...card.sourceIds,'N493-EVIDENCE-PRIORITY'])];
  }
 }
 // The external reader sees human meaning first, not the computational trace.
 // Keep proof/sourceIds untouched for audits. The single chart basis sentence
 // is part of the reading; no extra technical connection paragraph is needed.
 for(const card of cards){
  const human=buildHumanReaderCard(chart,lang,card.division);
  if(human){card.meaning=human.meaning;card.connection=null;}
 }
 if(cards.length!==16||new Set(cards.map(c=>c.division)).size!==16)return null;
 const readable=buildHumanReaderSummary(chart,lang);
 return {version:N492_MEANING_VERSION,cards,discoveries,
  summary:{title:uk?'Що головне у вашій карті':'Your key chart takeaway',
   strength:readable.strength,attention:readable.attention,direction:readable.direction,proof:[
    'D1.ascendant.sign='+chart.ascendant.sign,'D1.'+lp[1]+'.house='+asc.house,
    'D1.house-lord.10='+lp[10],'D1.'+lp[10]+'.house='+get(lp[10])!.house
   ]},
  method:uk?'Традиційна інтерпретація: D1, функціональні управителі, знакові положення, тематичні варги. Знакова гідність — не повна Shadbala; D60 умовна.':
   'Traditional interpretation: D1, functional lords, sign dignity and thematic divisional charts. Sign dignity is not full Shadbala; D60 is provisional.'};
}
