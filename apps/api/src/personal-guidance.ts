/** Galaxiora Jyotish Journey v1.
 * Deterministic practitioner-authored text from actual Dasha and Swiss/Lahiri
 * local-noon transit samples. No fabricated events, AI chart facts or times.
 */
import type {dailyTransit} from './personal-transits.ts';
type L={uk:string;en:string};
type Transit=Awaited<ReturnType<typeof dailyTransit>>;
type Period={lord:string;start:string;end:string;antardasha?:{lord:string;start:string;end:string}|null};
type Natal={name:string;sign:number};
type Event={type:'MAHADASHA_START'|'ANTARDASHA_START';lord:string;date:string;atUtc:string};
type Brief={headline:L;description:L;action:L;evidence:{kind:string;method:string;day?:string;sampledAtUtc?:string;planet?:string;sign?:number;house?:number|null;nakshatra?:string;major?:string;minor?:string}};
const names:Record<string,L>={
 Sun:{uk:'Сонця',en:'Sun'},Moon:{uk:'Місяця',en:'Moon'},Mars:{uk:'Марса',en:'Mars'},
 Mercury:{uk:'Меркурія',en:'Mercury'},Jupiter:{uk:'Юпітера',en:'Jupiter'},
 Venus:{uk:'Венери',en:'Venus'},Saturn:{uk:'Сатурна',en:'Saturn'},
 Rahu:{uk:'Раху',en:'Rahu'},Ketu:{uk:'Кету',en:'Ketu'}
};
const planetary:Record<string,L>={
 Sun:{uk:'відповідальність і власний голос',en:'responsibility and personal direction'},
 Moon:{uk:'внутрішній стан і близькі зв’язки',en:'inner life and close relationships'},
 Mars:{uk:'дію й рішучість',en:'action and initiative'},
 Mercury:{uk:'знання й діалог',en:'learning and communication'},
 Jupiter:{uk:'мудрість та наставництво',en:'wisdom and mentorship'},
 Venus:{uk:'стосунки, красу й цінності',en:'connection, beauty and values'},
 Saturn:{uk:'витримку та довгі зобов’язання',en:'discipline and long commitments'},
 Rahu:{uk:'нові бажання й незвіданий шлях',en:'new ambitions and unfamiliar paths'},
 Ketu:{uk:'відпускання зайвого і внутрішній пошук',en:'simplification and inner exploration'}
};
const houses:{topic:L;action:L}[]=[
 {topic:{uk:'самовизначення',en:'identity'},action:{uk:'Запиши одне рішення, яке відображає твої цінності.',en:'Write down one choice aligned with your values.'}},
 {topic:{uk:'ресурси, родину та мову',en:'resources, family and speech'},action:{uk:'Поговори з близькою людиною про те, що для тебе цінне.',en:'Talk with someone close about what you value.'}},
 {topic:{uk:'навички й сміливість',en:'skills and courage'},action:{uk:'Присвяти п’ятнадцять хвилин розвитку навички.',en:'Spend fifteen minutes developing a skill.'}},
 {topic:{uk:'дім та внутрішню опору',en:'home and inner steadiness'},action:{uk:'Створи тихий простір і побудь у ньому без поспіху.',en:'Make a quiet space and spend a few unhurried minutes there.'}},
 {topic:{uk:'навчання й творчість',en:'learning and creativity'},action:{uk:'Повернись до творчої ідеї, яку відкладав.',en:'Return to a creative idea you put aside.'}},
 {topic:{uk:'звички та щоденну працю',en:'habits and daily work'},action:{uk:'Зроби маленький крок у корисній звичці.',en:'Take a small step with a useful habit.'}},
 {topic:{uk:'партнерство й рівновагу',en:'partnership and balance'},action:{uk:'Постав важливе питання близькій людині й уважно вислухай.',en:'Ask a meaningful question and listen carefully.'}},
 {topic:{uk:'зміни та спільні ресурси',en:'change and shared resources'},action:{uk:'Визнач, що вже можна відпустити без зайвого контролю.',en:'Identify something you can release without excessive control.'}},
 {topic:{uk:'знання, віру та наставників',en:'learning, faith and mentors'},action:{uk:'Прочитай кілька сторінок духовного або філософського тексту.',en:'Read a few pages of a spiritual or philosophical text.'}},
 {topic:{uk:'покликання й відповідальність',en:'vocation and responsibility'},action:{uk:'Визнач перший крок у важливій професійній справі.',en:'Choose a first step in meaningful work.'}},
 {topic:{uk:'спільноти й довгострокові цілі',en:'communities and long-term goals'},action:{uk:'Зв’яжися з людиною, що поділяє твою мету.',en:'Connect with someone who shares your goal.'}},
 {topic:{uk:'відпочинок та усамітнення',en:'rest and solitude'},action:{uk:'Залиши десять хвилин для тиші без екранів.',en:'Set aside ten screen-free minutes for quiet.'}}
];
const signs:L[]=[
 {uk:'Овні',en:'Aries'},{uk:'Тельці',en:'Taurus'},{uk:'Близнюках',en:'Gemini'},
 {uk:'Раку',en:'Cancer'},{uk:'Леві',en:'Leo'},{uk:'Діві',en:'Virgo'},
 {uk:'Терезах',en:'Libra'},{uk:'Скорпіоні',en:'Scorpio'},{uk:'Стрільці',en:'Sagittarius'},
 {uk:'Козорозі',en:'Capricorn'},{uk:'Водолії',en:'Aquarius'},{uk:'Рибах',en:'Pisces'}
];
const ruler=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const houseFrom=(sign:number,lagna:number)=>((sign-lagna+12)%12)+1;
export function natalPeriodContext(lagna:number|null,natal:Natal[],name:string){
 if(!lagna||lagna<1||lagna>12)return null;
 const p=natal.find(v=>v.name===name);
 if(!p||!Number.isInteger(p.sign)||p.sign<1||p.sign>12)return null;
 const house=houseFrom(p.sign,lagna);
 return {house,ruledHouses:ruler.flatMap((lord,i)=>lord===name?[houseFrom(i+1,lagna)]:[])};
}
export function buildPeriodGuidance(period:Period|null,lagna:number|null,natal:Natal[]):Brief|null{
 if(!period||!names[period.lord])return null;
 const a=natalPeriodContext(lagna,natal,period.lord),minor=period.antardasha?.lord;
 const b=minor?natalPeriodContext(lagna,natal,minor):null;
 const title:L={uk:'Махадаша '+names[period.lord].uk+(minor&&names[minor]?' · антардаша '+names[minor].uk:''),
  en:names[period.lord].en+' Mahadasha'+(minor&&names[minor]?' · '+names[minor].en+' Antardasha':'')};
 const ma=a?'; у натальній карті її положення в '+a.house+'-му домі пов’язує період зі сферою '+houses[a.house-1].topic.uk:'';
 const mb=b?'; у твоїй карті вона перебуває у '+b.house+'-му домі ('+houses[b.house-1].topic.uk+')':'';
 const ea=a?'; in your birth chart house '+a.house+' links the cycle to '+houses[a.house-1].topic.en:'';
 const eb=b?'; in your chart it occupies house '+b.house+' ('+houses[b.house-1].topic.en+')':'';
 return {headline:title,description:{
  uk:'У традиції Джйотіш цей довгий цикл підкреслює '+planetary[period.lord].uk+ma+'.'+
   (minor&&planetary[minor]?' Підперіод '+names[minor].uk+' додає тему: '+planetary[minor].uk+mb+'.':''),
  en:'In Jyotish this longer cycle highlights '+planetary[period.lord].en+ea+'.'+
   (minor&&planetary[minor]?' The '+names[minor].en+' subperiod adds '+planetary[minor].en+eb+'.':'')
 },action:a?houses[a.house-1].action:{
  uk:'Спостерігай за повторюваними подіями цього періоду й занотовуй їх.',
  en:'Observe recurring experiences during this period and record them.'
 },evidence:{kind:'VIMSHOTTARI_NATAL_HOUSE',method:'GALAXIORA_DOCUMENTED_DASHA_YEAR',
  major:period.lord,minor:minor||undefined,house:a?.house??null}};
}
export function buildDailyGuidance(t:Transit|null):Brief|null{
 if(!t||!Number.isInteger(t.moon.sign)||t.moon.sign<1||t.moon.sign>12)return null;
 const house=t.moon.houseFromLagna,topic=house&&house>=1&&house<=12?houses[house-1]:null;
 const sign=signs[t.moon.sign-1];
 return {
  headline:{uk:topic?'Місяць у '+house+'-му домі':'Місяць у '+sign.uk,
    en:topic?'Moon in house '+house:'Moon in '+sign.en},
  description:{
   uk:'За полуденним положенням Місяць перебуває в '+sign.uk+', накшатрі '+t.moon.nakshatra+
     ' (пада '+t.moon.pada+').'+(topic?' Для твоєї лагни це '+house+'-й дім: '+topic.topic.uk+'. Зверни увагу, як ця тема проявляється сьогодні.':
     ' Це загальний рух неба; для персонального прочитання обери основну натальну карту.'),
   en:'At local noon the Moon is in '+sign.en+', nakshatra '+t.moon.nakshatra+' (pada '+t.moon.pada+').'+
     (topic?' From your Lagna this is house '+house+': '+topic.topic.en+'. Notice how this theme appears today.':
     ' This is the shared sky; choose your primary chart for a personal interpretation.')
  },
  action:topic?topic.action:{
   uk:'Запиши свій настрій і одну важливу подію дня — так зростатиме твій щоденник спостережень.',
   en:'Note your mood and one meaningful event; build your personal observation journal.'
  },
  evidence:{kind:topic?'PERSONAL_MOON_HOUSE':'GENERAL_MOON_SKY',method:t.method,
   day:t.date,sampledAtUtc:t.sampledAtUtc,planet:'Moon',sign:t.moon.sign,
   house:house??null,nakshatra:t.moon.nakshatra}
 };
}
export type WeekHighlight={date:string;kind:'WEEK_OPENING'|'MOON_SIGN_SAMPLE_CHANGE'|'NAKSHATRA_SAMPLE_CHANGE'|'DASHA_START';
 headline:L;summary:L;action:L;evidence:{sampledAtUtc?:string;method:string;moonSign?:number;nakshatra?:string;lord?:string;date:string}};
export function buildWeekHighlights(days:Transit[],events:Event[]=[]):WeekHighlight[]{
 const week=days.slice(0,7);
 if(!week.length)return [];
 const first=buildDailyGuidance(week[0]);
 const highlights:WeekHighlight[]=[];
 if(first)highlights.push({date:week[0].date,kind:'WEEK_OPENING',
  headline:{uk:'Початок тижня · твій астрологічний орієнтир',en:'Start of the week · your sky orientation'},
  summary:first.description,action:first.action,
  evidence:{sampledAtUtc:week[0].sampledAtUtc,method:week[0].method,
   moonSign:week[0].moon.sign,nakshatra:week[0].moon.nakshatra,date:week[0].date}});
 const knownDates=new Set(week.map(v=>v.date));
 for(const e of events){
  if(!knownDates.has(e.date)||!names[e.lord])continue;
  const major=e.type==='MAHADASHA_START';
  highlights.push({date:e.date,kind:'DASHA_START',
   headline:{uk:'Початок '+(major?'махадаші ':'антардаші ')+names[e.lord].uk,
    en:names[e.lord].en+(major?' Mahadasha begins':' Antardasha begins')},
   summary:{uk:'Початок планетарного періоду у Vimshottari, за методом Galaxiora.',
    en:'A Vimshottari planetary period begins, according to the Galaxiora method.'},
   action:{uk:'Запиши свої наміри на новий період.',en:'Record your intentions for the new period.'},
   evidence:{date:e.date,method:'GALAXIORA_DOCUMENTED_DASHA_YEAR',lord:e.lord}});
 }
 for(let i=1;i<week.length;i++){
  const day=week[i],yesterday=week[i-1],note=buildDailyGuidance(day);
  if(day.moon.sign!==yesterday.moon.sign){
   highlights.push({date:day.date,kind:'MOON_SIGN_SAMPLE_CHANGE',
    headline:{uk:'Місяць спостерігається в '+signs[day.moon.sign-1].uk,
     en:'Moon observed in '+signs[day.moon.sign-1].en},
    summary:{uk:'Знак відрізняється від попереднього полуденного спостереження; це не точний час входження. '+(note?.description.uk||''),
     en:'The sign differs from yesterday’s noon sample, not an exact ingress instant. '+(note?.description.en||'')},
    action:note?.action||{uk:'Запиши спостереження.',en:'Record an observation.'},
    evidence:{date:day.date,method:day.method,sampledAtUtc:day.sampledAtUtc,moonSign:day.moon.sign}});
  }else if(day.moon.nakshatra!==yesterday.moon.nakshatra){
   highlights.push({date:day.date,kind:'NAKSHATRA_SAMPLE_CHANGE',
    headline:{uk:'Місяць спостерігається в '+day.moon.nakshatra,
     en:'Moon observed in '+day.moon.nakshatra},
    summary:{uk:'Накшатра змінилася між полуденними спостереженнями; точний час переходу тут не обчислено.',
     en:'Nakshatra differs between the two local-noon observations; exact ingress time was not calculated.'},
    action:note?.action||{uk:'Зроби запис у журналі.',en:'Make a journal note.'},
    evidence:{date:day.date,method:day.method,sampledAtUtc:day.sampledAtUtc,nakshatra:day.moon.nakshatra}});
  }
 }
 return highlights.sort((a,b)=>a.date.localeCompare(b.date)||(a.kind==='DASHA_START'?-1:1)).slice(0,5);
}
