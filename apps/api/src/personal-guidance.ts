/** Galaxiora Personal: fact-bound daily/weekly Jyotish editorial rules.
 * Practical guidance is interpretive, never an objectively guaranteed outcome.
 * Natal facts are verified separately; no invented ingress moments.
 */
import type {dailyTransit} from './personal-transits.ts';
type L={uk:string;en:string};
type Transit=Awaited<ReturnType<typeof dailyTransit>>;
type Period={lord:string;start:string;end:string;antardasha?:{lord:string;start:string;end:string}|null};
type Natal={name:string;sign:number};
type Event={type:string;lord:string;date:string;atUtc:string};
type Evidence={kind:string;method:string;day?:string;sampledAtUtc?:string;planet?:string;sign?:number;house?:number|null;nakshatra?:string;major?:string;minor?:string};
type Brief={headline:L;description:L;action:L;goodFor:L;caution:L;evidence:Evidence};
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
 {topic:l('власна позиція','personal direction'),goodFor:l('переглянути особисті пріоритети та власний план','review your priorities and personal plan'),caution:l('не приймати імпульсивних рішень лише через настрій','avoid making impulsive mood-driven decisions'),action:l('Сформулюй одне рішення на найближчі сім днів і запиши, чому воно важливе.','Write one decision for the next seven days and why it matters.')},
 {topic:l('гроші й домовленості з родиною','money and family agreements'),goodFor:l('звірити витрати, бюджет і спільні домовленості','review expenses, budget and shared agreements'),caution:l('не обіцяти коштів, не перевіривши можливості','do not commit money without checking your capacity'),action:l('Перевір три найбільші витрати місяця й обери одну, яку можна скоротити.','Review your three largest monthly expenses and find one to reduce.')},
 {topic:l('навички, листування та короткі поїздки','skills, messages and short trips'),goodFor:l('написати важливе повідомлення та відпрацювати навичку','send an important message and practise a skill'),caution:l('не плутати швидкість відповіді з точністю','do not confuse a quick reply with a correct one'),action:l('Напиши чернетку потрібного листа, перевір факти й надішли його.','Draft an important email, check the facts and send it.')},
 {topic:l('дім і внутрішня опора','home and inner stability'),goodFor:l('налагодити домашні справи або розмову в родині','sort out a home task or family conversation'),caution:l('не переносити робоче роздратування на близьких','avoid taking work frustration out on loved ones'),action:l('Визнач одну домашню справу, що забирає увагу, і доведи її до кінця.','Complete one household task that has been weighing on you.')},
 {topic:l('творчість, навчання та діти','creativity, learning and children'),goodFor:l('показати власну ідею, навчити або навчитись','share an idea, teach or study'),caution:l('не відкладати завершення роботи заради нескінченних правок','avoid endless revisions instead of finishing'),action:l('Оформи одну ідею у завершену сторінку, ескіз або коротку презентацію.','Turn one idea into a complete page, sketch or short presentation.')},
 {topic:l('праця, звички та щоденні обов’язки','work, habits and daily responsibilities'),goodFor:l('закрити накопичені завдання та впорядкувати графік','clear a backlog and organise your schedule'),caution:l('не перевантажувати день обіцянками','avoid overcommitting your schedule'),action:l('Випиши три незавершені задачі й закрий найкоротшу до обіду.','List three outstanding tasks and finish the shortest before lunch.')},
 {topic:l('партнерство й домовленості','partnerships and agreements'),goodFor:l('погодити очікування з партнером чи клієнтом','align expectations with a partner or client'),caution:l('не трактувати мовчання іншої людини як згоду','do not mistake silence for agreement'),action:l('Постав одне конкретне запитання, яке давно лишалось без чіткої відповіді.','Ask one specific question that has lacked a clear answer.')},
 {topic:l('спільні фінанси та складні зміни','shared finances and difficult changes'),goodFor:l('розібрати незрозумілі умови, борги або спільні ресурси','review unclear terms, debts or shared resources'),caution:l('не підписувати незрозумілих умов та не поспішати з ризиком','avoid signing unclear terms or rushing into risk'),action:l('Перевір одну фінансову умову або підписку, якої досі не розумів повністю.','Review one financial term or subscription you have not fully understood.')},
 {topic:l('освіта, наставники та далекий горизонт','education, mentors and long-range plans'),goodFor:l('подати заявку, сформулювати запит наставнику, спланувати навчання','apply, consult a mentor or plan a course of study'),caution:l('не обіцяти більше, ніж дозволяють час і ресурси','avoid promises exceeding your time and resources'),action:l('Знайди вимоги до однієї програми чи вакансії та зроби конкретний наступний крок.','Check the requirements of one course or role and take the next concrete step.')},
 {topic:l('кар’єра, репутація та відповідальність','career, reputation and responsibility'),goodFor:l('представити результат, завершити робочу домовленість','present a result and finalise a work agreement'),caution:l('не плутати наполегливість із різким тоном','do not confuse determination with a harsh tone'),action:l('Заверши одну видиму робочу задачу й надішли результат тому, хто його очікує.','Finish one visible work item and send the result to its recipient.')},
 {topic:l('команди, спільноти та довгострокові цілі','teams, communities and long-term goals'),goodFor:l('узгодити спільний план або відновити корисний контакт','align a shared plan or reconnect with a useful contact'),caution:l('не покладатися на неозвучені очікування інших','do not rely on others understanding unspoken expectations'),action:l('Напиши одній людині зі своєї професійної спільноти з конкретною пропозицією.','Message one person in your professional network with a concrete proposal.')},
 {topic:l('відновлення сил, усамітнення та завершення','rest, solitude and closure'),goodFor:l('закінчити непомітну роботу й зняти зайве навантаження','finish behind-the-scenes work and reduce overload'),caution:l('не приймати важливих рішень у стані виснаження','avoid major decisions when exhausted'),action:l('Прибери одне необов’язкове завдання з вечора та залиш час для сну.','Remove one optional evening task and make space for sleep.')}
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
export function buildDailyGuidance(t:Transit|null):Brief|null{
 if(!t||!Number.isInteger(t.moon.sign)||t.moon.sign<1||t.moon.sign>12)return null;
 const h=t.moon.houseFromLagna;
 const focus=h!=null&&h>=1&&h<=12?houses[h-1]:null;
 const nak=mansions[t.moon.nakshatra],zodiac=signs[t.moon.sign-1];
 const domain=focus?focus.topic:l('загальну місячну динаміку','the general lunar rhythm');
 return {
  headline:l(focus?'У фокусі: '+domain.uk:'Місяць у '+zodiac.uk,
    focus?'Today: '+domain.en:'Moon in '+zodiac.en),
  description:l('Місяць у '+zodiac.uk+' · '+t.moon.nakshatra+', пада '+t.moon.pada+'. '+
   (focus?'Від лагни це '+h+'-й дім — '+domain.uk+'. ':'')+
   (nak?'Накшатра традиційно наголошує на '+nak.uk+'.':''),
   'Moon in '+zodiac.en+' · '+t.moon.nakshatra+', pada '+t.moon.pada+'. '+
   (focus?'From your Lagna this is house '+h+' — '+domain.en+'. ':'')+
   (nak?'Traditionally, this nakshatra highlights '+nak.en+'.':'')),
  goodFor:focus?focus.goodFor:l('уточнити плани й поточні зобов’язання','review plans and current commitments'),
  caution:focus?focus.caution:l('не робити особистих висновків без натальної карти','avoid personal predictions without a verified birth chart'),
  action:focus?focus.action:l('Перевір найближчу домовленість: запиши відповідального, термін і наступну дію.','Check your next commitment: write down the owner, deadline and next step.'),
  evidence:{kind:focus?'PERSONAL_MOON_HOUSE':'GENERAL_MOON_SKY',method:t.method,
   day:t.date,sampledAtUtc:t.sampledAtUtc,planet:'Moon',sign:t.moon.sign,house:h??null,nakshatra:t.moon.nakshatra}
 };
}
export type WeekHighlight={date:string;kind:'MOON_SIGN_SAMPLE_CHANGE'|'NAKSHATRA_SAMPLE_CHANGE'|'DASHA_START';
 headline:L;summary:L;action:L;goodFor:L;caution:L;
 evidence:{sampledAtUtc?:string;method:string;moonSign?:number;nakshatra?:string;lord?:string;date:string}};
export function buildWeekHighlights(days:Transit[],events:Event[]=[]):WeekHighlight[]{
 const week=days.slice(0,7),valid=new Set(week.map(x=>x.date));
 if(!week.length)return [];
 const hits:Array<WeekHighlight&{priority:number}>=[];
 for(const e of events){
  if(!valid.has(e.date)||!names[e.lord]||!['MAHADASHA_START','ANTARDASHA_START'].includes(e.type))continue;
  const major=e.type==='MAHADASHA_START';
  hits.push({priority:5,date:e.date,kind:'DASHA_START',
   headline:l('Новий '+(major?'великий період: ':'підперіод: ')+names[e.lord].uk,
    'New '+(major?'major period: ':'subperiod: ')+names[e.lord].en),
   summary:l('За календарем Vimshottari починається інший планетарний етап. Перевір пов’язані з ним натальні доми перед довгостроковими рішеннями.',
    'Your Vimshottari calendar enters a new planetary period. Review its natal-house context before making long-term commitments.'),
   goodFor:l('перегляд річного плану й пріоритетів','reviewing annual goals and priorities'),
   caution:l('не вважати зміну даші обіцянкою конкретної події','do not treat a Dasha change as a guaranteed event'),
   action:l('Переглянь два найбільші плани наступного місяця й уточни їхні терміни.','Review your two biggest plans for next month and refine their deadlines.'),
   evidence:{date:e.date,method:'GALAXIORA_DOCUMENTED_DASHA_YEAR',lord:e.lord}});
 }
 for(let i=1;i<week.length;i++){
  const t=week[i],previous=week[i-1];
  const newSign=t.moon.sign!==previous.moon.sign;
  const newNak=t.moon.nakshatra!==previous.moon.nakshatra;
  if(!newSign&&!newNak)continue;
  const guidance=buildDailyGuidance(t);
  if(!guidance)continue;
  hits.push({priority:newSign?3:1,date:t.date,kind:newSign?'MOON_SIGN_SAMPLE_CHANGE':'NAKSHATRA_SAMPLE_CHANGE',
   headline:l(newSign?guidance.headline.uk:'Акцент накшатри: '+t.moon.nakshatra,
    newSign?guidance.headline.en:'Nakshatra focus: '+t.moon.nakshatra),
   // The observational caveat is retained in evidence + UI methodology, not repeated as filler.
   summary:guidance.description,
   goodFor:guidance.goodFor,caution:guidance.caution,action:guidance.action,
   evidence:{date:t.date,method:t.method,sampledAtUtc:t.sampledAtUtc,
    moonSign:t.moon.sign,nakshatra:t.moon.nakshatra}});
 }
 // Show significant shifts, not an almost-duplicate of today's orientation.
 return hits.sort((a,b)=>b.priority-a.priority||a.date.localeCompare(b.date)).slice(0,4)
  .sort((a,b)=>a.date.localeCompare(b.date))
  .map(({priority,...rest})=>rest);
}
