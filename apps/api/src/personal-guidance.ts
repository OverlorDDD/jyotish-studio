/** Galaxiora Personal: fact-bound daily/weekly Jyotish editorial rules.
 * Practical guidance is interpretive, never an objectively guaranteed outcome.
 * Natal facts are verified separately; no invented ingress moments.
 */
import type {dailyTransit} from './personal-transits.ts';
import {horoscopeTheme} from './horoscope-editorial.ts';
type L={uk:string;en:string};
type Transit=Awaited<ReturnType<typeof dailyTransit>>;
type Period={lord:string;start:string;end:string;antardasha?:{lord:string;start:string;end:string}|null};
type Natal={name:string;sign:number};
type Event={type:string;lord:string;date:string;atUtc:string};
type Evidence={kind:string;method:string;day?:string;sampledAtUtc?:string;planet?:string;sign?:number;house?:number|null;nakshatra?:string;major?:string;minor?:string;natalLagnaSign?:number;natalMoonSign?:number;natalMoonHouse?:number|null;majorNatalHouse?:number|null;minorNatalHouse?:number|null};
type Brief={headline:L;description:L;action:L;goodFor:L;caution:L;evidence:Evidence};
export type VerifiedNatalContext={lagnaSign:number;moonSign:number;natalPositions:Natal[];period:Period|null};
const l=(uk:string,en:string):L=>({uk,en});
const names:Record<string,L>={
 Sun:l('Сонця','Sun'),Moon:l('Місяця','Moon'),Mars:l('Марса','Mars'),Mercury:l('Меркурія','Mercury'),
 Jupiter:l('Юпітера','Jupiter'),Venus:l('Венери','Venus'),Saturn:l('Сатурна','Saturn'),
 Rahu:l('Раху','Rahu'),Ketu:l('Кету','Ketu')
};
const qualities:Record<string,L>={
 Sun:l('самовизначення й відповідальності','identity and responsibility'),
 Moon:l('побуту й емоційних зв’язків','daily life and emotional bonds'),
 Mars:l('ініціативи й особистих зусиль','initiative and focused effort'),
 Mercury:l('письма, переговорів і навчання','writing, negotiation and learning'),
 Jupiter:l('освіти, наставництва й переконань','education, mentorship and beliefs'),
 Venus:l('партнерства й особистих цінностей','relationships and personal values'),
 Saturn:l('довгострокових обов’язків і витримки','long-term commitments and endurance'),
 Rahu:l('амбітних проєктів і нових підходів','ambitious projects and unconventional approaches'),
 Ketu:l('перегляду пріоритетів і завершення зайвого','reviewing priorities and letting go of excess')
};
// Whole-sign house contexts, not fortune scores or muhurta recommendations.
// Each instruction has an observable, finite action and a meaningful trade-off.
const houses:{topic:L;goodFor:L;caution:L;action:L}[]=[
 {topic:l("особистий напрям","personal direction"),goodFor:l("перевірити свій план","review your personal plan"),caution:l("не порівнювати свій темп із чужим","avoid comparing your pace with others"),action:l("Запиши одне особисте рішення на цей тиждень і визнач, що допоможе його виконати.","Write one personal decision for this week and what would help you follow it.")},
 {topic:l("матеріальні пріоритети","material priorities"),goodFor:l("звірити бажання й ресурси","review wishes against resources"),caution:l("не купувати з імпульсу","avoid impulse spending"),action:l("Пригадай останню покупку і виріши, чи відповідала вона твоїм пріоритетам.","Reflect on your latest purchase and whether it matched your priorities.")},
 {topic:l("спілкування й власний голос","communication and your voice"),goodFor:l("прояснити незрозуміле запитання","clarify an unresolved question"),caution:l("не підміняти факти здогадами","avoid substituting assumptions for facts"),action:l("Сформулюй одне запитання, на яке хочеш отримати відповідь, замість припускати її.","Formulate one question you want answered rather than assuming the answer.")},
 {topic:l("дім і відчуття опори","home and stability"),goodFor:l("зробити звичний простір спокійнішим","make your familiar surroundings calmer"),caution:l("не ігнорувати потребу у відпочинку","avoid ignoring your need for rest"),action:l("Звільни одну невелику ділянку свого простору або двадцять хвилин від зайвих справ.","Clear a small space or free twenty minutes from unnecessary tasks.")},
 {topic:l("творчість та особиста радість","creativity and personal joy"),goodFor:l("повернутись до приємного заняття","return to something enjoyable"),caution:l("не оцінювати творчість лише результатом","avoid judging creativity only by its result"),action:l("Виділи п’ятнадцять хвилин на заняття, яке обираєш лише для себе.","Make fifteen minutes for an activity you choose for yourself.")},
 {topic:l("повсякденні зобов’язання","everyday commitments"),goodFor:l("спростити власний розклад","simplify your schedule"),caution:l("не навантажувати день зайвими обіцянками","avoid overloading your day with promises"),action:l("Обери одну невелику справу, яку можеш завершити сьогодні, й визнач для неї час.","Choose one small task you can finish today and set a time for it.")},
 {topic:l("стосунки й особисті межі","relationships and boundaries"),goodFor:l("усвідомити власні потреби у спілкуванні","notice your own needs in interactions"),caution:l("не погоджуватись лише через незручність","avoid agreeing solely from discomfort"),action:l("Запиши одну межу, яку хочеш захищати в спілкуванні, та коротку фразу для цього.","Write one boundary you want to keep in your interactions and a short phrase to explain it.")},
 {topic:l("спільні зобов’язання і зміни","shared commitments and change"),goodFor:l("уточнити незрозумілу умову","clarify an unclear condition"),caution:l("не діяти без потрібної інформації","avoid acting without enough information"),action:l("Перевір одну умову, платіж або домовленість, яку варто зрозуміти перед рішенням.","Check a term, payment or agreement worth understanding before deciding.")},
 {topic:l("переконання й життєвий напрям","beliefs and life direction"),goodFor:l("співвіднести цінності з планами","align values with plans"),caution:l("не приймати чужі очікування за свої","avoid confusing others’ expectations with your own"),action:l("Запиши один принцип, який важливий для тебе, і перевір, чи відповідає йому твій теперішній план.","Write one principle that matters to you and check whether your current plan reflects it.")},
 {topic:l("відповідальність і завершення справ","responsibility and completing tasks"),goodFor:l("визначити зрозумілий результат справи","define a clear result for a task"),caution:l("не тиснути на себе через чужий темп","avoid pressuring yourself to match others’ pace"),action:l("Обери незавершену справу — навіть особисту — й запиши критерій її готовності.","Choose an unfinished task, even a personal one, and define what finished means.")},
 {topic:l("спільнота й особисті цілі","community and personal goals"),goodFor:l("визначити важливу ціль","identify a meaningful goal"),caution:l("не будувати план лише на підтримці інших","avoid a plan that depends solely on others"),action:l("Запиши одну мету на три місяці й одну дію, яку здатна чи здатен виконати самостійно.","Write one goal for three months and an action you can do independently.")},
 {topic:l("відновлення сил і завершення зайвого","rest and releasing excess"),goodFor:l("залишити простір для відпочинку","make room for rest"),caution:l("не плутати зайнятість із прогресом","avoid confusing busyness with progress"),action:l("Прибери одну необов’язкову справу зі свого вечора й залиш час для себе.","Remove one optional evening task and keep some time for yourself.")}
];
const signs:L[]=[
 l('Овні','Aries'),l('Тельці','Taurus'),l('Близнюках','Gemini'),l('Раку','Cancer'),
 l('Леві','Leo'),l('Діві','Virgo'),l('Терезах','Libra'),l('Скорпіоні','Scorpio'),
 l('Стрільці','Sagittarius'),l('Козорозі','Capricorn'),l('Водолії','Aquarius'),l('Рибах','Pisces')
];
const rulers=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const houseFrom=(sign:number,lagna:number)=>((sign-lagna+12)%12)+1;
// Traditional lunar-mansion associations: used for context, not mathematical proof
// of a predicted event. No generic filler fallback for unknown nakshatras.
const mansions:Record<string,L>={
 Ashwini:l('швидкий початок і відновлення','swift starts and recovery'),
 Bharani:l('межі й відповідальність за вибір','boundaries and ownership of decisions'),
 Krittika:l('відділення головного від зайвого','discernment and cutting away excess'),
 Rohini:l('вирощування й послідовність','steady growth and cultivation'),
 Mrigashira:l('пошук фактів і уточнення','investigation and asking better questions'),
 Ardra:l('прояснення складного через зміни','working through difficult change'),
 Punarvasu:l('повернення до основ','returning to essentials'),
 Pushya:l('підтримку й навчання','support and learning'),
 Ashlesha:l('складні мотиви й кордони','complex motives and boundaries'),
 Magha:l('спадщину й відповідальність','heritage and responsibility'),
 'Purva Phalguni':l('творчість і відновлення радості','creativity and joyful renewal'),
 'Uttara Phalguni':l('надійні союзи й домовленості','reliable alliances and commitments'),
 Hasta:l('майстерність і вправні руки','craft and skilled practice'),
 Chitra:l('проєктування й виразну форму','design and thoughtful form'),
 Swati:l('самостійність і гнучкість','independence and flexibility'),
 Vishakha:l('мету й дисципліну вибору','goals and disciplined choices'),
 Anuradha:l('дружбу й вірність домовленостям','friendship and loyalty to agreements'),
 Jyeshtha:l('захист і мудре управління','protection and mature leadership'),
 Mula:l('пошук причини, а не симптомів','finding root causes rather than symptoms'),
 'Purva Ashadha':l('стійкість переконань','conviction and resilience'),
 'Uttara Ashadha':l('тривале зусилля й результати','lasting effort and results'),
 Shravana:l('слухання та обмін знаннями','listening and shared knowledge'),
 Dhanishta:l('ритм і координацію з іншими','rhythm and coordination'),
 Shatabhisha:l('дослідження й потребу в просторі','investigation and personal space'),
 'Purva Bhadrapada':l('переосмислення цінностей','reconsidering values'),
 'Uttara Bhadrapada':l('терпіння та внутрішню глибину','patience and depth'),
 Revati:l('завершення й підготовку наступного шляху','completion and preparing the next journey')
};
export function natalPeriodContext(lagna:number|null,natal:Natal[],name:string){
 if(!lagna||lagna<1||lagna>12)return null;
 const p=natal.find(v=>v.name===name);
 if(!p||!Number.isInteger(p.sign)||p.sign<1||p.sign>12)return null;
 const house=houseFrom(p.sign,lagna);
 return {house,ruledHouses:rulers.flatMap((lord,i)=>lord===name?[houseFrom(i+1,lagna)]:[])};
}
export function buildPeriodGuidance(period:Period|null,lagna:number|null,natal:Natal[]):Brief|null{
 if(!period||!names[period.lord])return null;
 const a=natalPeriodContext(lagna,natal,period.lord),minor=period.antardasha?.lord;
 const b=minor?natalPeriodContext(lagna,natal,minor):null;
 const focus=a?houses[a.house-1]:null;
 const headline=l('Махадаша '+names[period.lord].uk+(minor&&names[minor]?' · антардаша '+names[minor].uk:''),
  names[period.lord].en+' Mahadasha'+(minor&&names[minor]?' · '+names[minor].en+' Antardasha':''));
 return {
  headline,
  description:l('Період '+names[period.lord].uk+' у традиції Джйотіш пов’язаний із темами '+qualities[period.lord].uk+
   (a?'. У твоїй карті планета у '+a.house+'-му домі ('+focus!.topic.uk+')':'')+
   (b&&minor?' ; підперіод '+names[minor].uk+' додає теми '+houses[b.house-1].topic.uk+' ('+b.house+'-й дім).':'.'),
   names[period.lord].en+' period in Jyotish relates to '+qualities[period.lord].en+
   (a?'. In your chart its placement in house '+a.house+' adds '+focus!.topic.en:'')+
   (b&&minor?'; the '+names[minor].en+' subperiod relates to '+houses[b.house-1].topic.en+' in house '+b.house+'.':'.')),
  goodFor:focus?focus.goodFor:l('звірити довгострокові плани з можливостями','review long-term plans against available resources'),
  caution:focus?focus.caution:l('не робити висновків лише за назвою планети','avoid conclusions based on the planet name alone'),
  action:focus?focus.action:l('Порівняй дві найближчі цілі зі своїм реальним графіком.','Compare your next two goals with your actual schedule.'),
  evidence:{kind:'VIMSHOTTARI_NATAL_HOUSE',method:'GALAXIORA_DOCUMENTED_DASHA_YEAR',
   major:period.lord,minor:minor||undefined,house:a?.house??null}
 };
}
/**
 * One canonical personal reading. Its entire chain of evidence comes from a
 * verified saved chart and the matching Swiss/Lahiri observation.
 * It never assumes jobs, formal education, children or mentors.
 */
export function buildDailyGuidance(t:Transit|null,context:VerifiedNatalContext|null):Brief|null{
 if(!t||!context||context.lagnaSign<1||context.lagnaSign>12||context.moonSign<1||context.moonSign>12||
 !t.personalized||!Number.isInteger(t.moon.sign)||t.moon.sign<1||t.moon.sign>12)return null;
 const house=houseFrom(t.moon.sign,context.lagnaSign);
 if(t.moon.houseFromLagna!==house||
  !context.natalPositions.some(p=>p.name==='Moon'&&p.sign===context.moonSign))return null;
 const natalMoonHouse=houseFrom(context.moonSign,context.lagnaSign);
 const major=context.period?.lord,minor=context.period?.antardasha?.lord;
 const majorNatalHouse=major?natalPeriodContext(context.lagnaSign,context.natalPositions,major)?.house??null:null;
 const minorNatalHouse=minor?natalPeriodContext(context.lagnaSign,context.natalPositions,minor)?.house??null:null;
 const voice=horoscopeTheme(house);
 const secondary=t.moon.houseFromMoon&&t.moon.houseFromMoon!==house?
  houses[t.moon.houseFromMoon-1]:null;
 const mahadasha=major&&names[major]?names[major]:null,antardasha=minor&&names[minor]?names[minor]:null;
 // Interpret ONLY validated natal and transit anchors. Keep house numbers and
 // exact dasha identifiers in evidence, not in the editorial opening.
 const description=l(
  [voice.story.uk,
   secondary?'Від твого натального Місяця цей самий рух також нагадує про '+secondary.topic.uk+'.':null,
   mahadasha?'На ширшому життєвому тлі період '+mahadasha.uk+' звертає увагу на '+qualities[major!].uk+
    (antardasha?' Підперіод '+antardasha.uk+' додає тему '+qualities[minor!].uk+'.':'.'):null]
   .filter(Boolean).join(' '),
  [voice.story.en,
   secondary?'Seen from your natal Moon, this transit also highlights '+secondary.topic.en+'.':null,
   mahadasha?'Against a longer backdrop, your '+mahadasha.en+' period brings attention to '+qualities[major!].en+
    (antardasha?' The '+antardasha.en+' subperiod adds '+qualities[minor!].en+'.':'.'):null]
   .filter(Boolean).join(' ')
 );
 return {
  headline:voice.title,
  description,
  goodFor:voice.opportunity,caution:voice.care,
  action:houses[house-1].action,
  evidence:{kind:'VERIFIED_NATAL_TRANSIT_DASHA',method:t.method,day:t.date,sampledAtUtc:t.sampledAtUtc,
   planet:'Moon',sign:t.moon.sign,house,nakshatra:t.moon.nakshatra,natalLagnaSign:context.lagnaSign,
   natalMoonSign:context.moonSign,natalMoonHouse,major,minor,majorNatalHouse,minorNatalHouse}
 };
}

export type WeekHighlight={date:string;kind:'TODAY'|'MOON_SIGN_SAMPLE_CHANGE'|'NAKSHATRA_SAMPLE_CHANGE'|'DASHA_START';
 headline:L;summary:L;action:L;goodFor:L;caution:L;
 evidence:Evidence & {transition?:{lord:string;atUtc:string;method:string}}};
/** Week summaries share the EXACT same daily reading, never alternate advice. */
export function buildWeekHighlights(days:Transit[],events:Event[]=[],contextAt?:(utc:string)=>VerifiedNatalContext|null):WeekHighlight[]{
 const week=days.slice(0,7),validDates=new Set(week.map(d=>d.date));
 if(!week.length||!contextAt)return [];
 const summary=(t:Transit,kind:WeekHighlight['kind']):WeekHighlight|null=>{
  const g=buildDailyGuidance(t,contextAt(t.sampledAtUtc));
  return g?{date:t.date,kind,headline:g.headline,summary:g.description,goodFor:g.goodFor,
   caution:g.caution,action:g.action,evidence:g.evidence}:null;
 };
 const first=summary(week[0],'TODAY');if(!first)return [];
 const possibilities:Array<WeekHighlight&{priority:number;house:number|null}>=[];
 for(let i=1;i<week.length;i++){
  const day=week[i],previous=week[i-1],signChanged=day.moon.sign!==previous.moon.sign;
  const nakChanged=day.moon.nakshatra!==previous.moon.nakshatra;
  if(!signChanged&&!nakChanged)continue;
  const v=summary(day,signChanged?'MOON_SIGN_SAMPLE_CHANGE':'NAKSHATRA_SAMPLE_CHANGE');
  if(v)possibilities.push({...v,priority:signChanged?5:2,house:day.moon.houseFromLagna});
 }
 for(const e of events){
  if(!validDates.has(e.date)||!names[e.lord]||
   !['MAHADASHA_START','ANTARDASHA_START'].includes(e.type)||e.date===first.date)continue;
  const day=week.find(d=>d.date===e.date),ctx=contextAt(e.atUtc);
  if(!day||!ctx)continue;
  const v=summary(day,'DASHA_START');if(!v)continue;
  possibilities.push({...v,priority:9,house:null,headline:l(
   'Перехід Vimshottari: '+names[e.lord].uk,'Vimshottari transition: '+names[e.lord].en),
   evidence:{...v.evidence,transition:{lord:e.lord,atUtc:e.atUtc,method:'GALAXIORA_DOCUMENTED_DASHA_YEAR'}}});
 }
 const picked=[first],usedHouses=new Set([week[0].moon.houseFromLagna]),usedActions=new Set([first.action.uk]);
 for(const h of possibilities.sort((a,b)=>b.priority-a.priority||a.date.localeCompare(b.date))){
  if(picked.length>=4)break;
  // A Dasha change is a real event, not a second actionable recommendation.
  // Do not suppress it just because its noon reading reuses a house action.
  if(h.date===first.date||(h.kind!=='DASHA_START'&&
    (usedActions.has(h.action.uk)||(h.house!=null&&usedHouses.has(h.house)))))continue;
  picked.push(h);usedActions.add(h.action.uk);usedHouses.add(h.house);
 }
 return [first,...picked.slice(1).sort((a,b)=>a.date.localeCompare(b.date))];
}
