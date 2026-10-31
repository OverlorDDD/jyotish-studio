/**
 * Astrological Synthesis Engine v1: deterministic interpretive comparison.
 *
 * Ephemeris calculations happen in existing verified Swiss adapters. This
 * PURE module never adjusts longitudes, pretends systems agree, creates
 * arbitrary "lucky scores", calls an LLM, or asserts future events.
 *
 * WESTERN: tropical transit-to-natal Sun/Moon longitude aspects at local noon
 * (a deliberately limited, documented aspect set; not a full western chart).
 * JYOTISH: sidereal graha whole-sign gochara from verified Janma Rashi and
 * Lagna; dashas are timing context only, not invented directional evidence.
 *
 * Source-specific pieces of evidence have stable IDs and user-visible
 * computational provenance. Topic maps and advice are Galaxiora editorial
 * mappings, not quoted traditional verses or empirical forecasts.
 */
import type {TropicalSky,TropicalPlanet} from './western-horoscope.ts';
import {localToday,type dailyTransit} from './personal-transits.ts';
export type L={uk:string;en:string};
const l=(uk:string,en:string):L=>({uk,en});
const PLANETS:readonly TropicalPlanet[]=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
type Topic='communication'|'relationships'|'responsibility'|'initiative'|'resources'|'learning'|'rest'|'direction';
type Tradition='western'|'vedic';
export type Signal={
 id:string;tradition:Tradition;topic:Topic;title:L;
 detail:L;source:string;sampledAtUtc:string;
 planet:string;transitLongitude:number;
 natalLongitude?:number;natalSign?:number;transitSign?:number;
 aspect?:string;target?:string;orbDegrees?:number;house?:number;
};
const THEMES:Record<Topic,{title:L;step:L;question:L}>={
 communication:{
  title:l('Розмова і ясність','Communication and clarity'),
  step:l('Обери одну важливу розмову. Спочатку уточни факти, потім спокійно сформулюй власну позицію.','Choose one meaningful conversation. Clarify the facts first, then state your position calmly.'),
  question:l('Яке запитання варто поставити перш ніж робити висновок?','What question is worth asking before drawing a conclusion?')},
 relationships:{
  title:l('Стосунки і взаємність','Relationships and reciprocity'),
  step:l('Зверни увагу на домовленості: уточни очікування й вислухай співрозмовника без поспіху.','Review an agreement: clarify expectations and listen without rushing.'),
  question:l('Де потрібні ясні особисті межі?','Where would clear personal boundaries help?')},
 responsibility:{
  title:l('Обов’язки та витримка','Commitments and patience'),
  step:l('Вибери один реалістичний обов’язок і визнач наступну невелику дію, замість вимагати всього одразу.','Choose one realistic responsibility and one manageable next step instead of attempting everything at once.'),
  question:l('Яка справа справді потребує твоєї уваги?','Which commitment genuinely deserves your attention?')},
 initiative:{
  title:l('Дія і ініціатива','Action and initiative'),
  step:l('Почни з конкретної дії, перевіривши її наслідки, й залиш простір для корекції плану.','Start with a concrete step, check its implications, and leave room to adjust your plan.'),
  question:l('Що можна зробити без зайвого ризику?','What can you do without taking unnecessary risks?')},
 resources:{
  title:l('Цінності й ресурси','Values and resources'),
  step:l('Перевір, на що витрачаєш час та енергію, і зміни один пріоритет відповідно до власних можливостей.','Review where your time and energy go, then adjust one priority to fit your circumstances.'),
  question:l('Чи підтримують ресурси те, що для тебе важливе?','Do your resources support what matters to you?')},
 learning:{
  title:l('Знання і перспектива','Learning and perspective'),
  step:l('Знайди перевірене джерело для питання, яке хочеш зрозуміти глибше, і зроби нотатку про головне.','Find a reliable source on something you want to understand better and note the main insight.'),
  question:l('Що нового допоможе побачити ширшу картину?','What could help you see the wider picture?')},
 rest:{
  title:l('Відновлення і внутрішній ритм','Rest and inner rhythm'),
  step:l('Зменши одну необов’язкову справу і дай собі час завершити те, що вже розпочато.','Remove one optional task and make time to finish what you have already started.'),
  question:l('Де зараз потрібна пауза?','Where might a pause be helpful?')},
 direction:{
  title:l('Життєвий напрям','Personal direction'),
  step:l('Назви один пріоритет на найближчі дні й обери крок, який залежить від тебе.','Identify one priority for the coming days and choose a step within your control.'),
  question:l('Що ти хочеш визначати самостійно?','What would you like to decide for yourself?')}
};
const PLANET_TOPIC:Record<TropicalPlanet,Topic>={
 Sun:'direction',Moon:'rest',Mercury:'communication',Venus:'relationships',
 Mars:'initiative',Jupiter:'learning',Saturn:'responsibility'
};
const HOUSE_TOPIC:readonly Topic[]=[
 'direction','resources','communication','rest','relationships','responsibility',
 'relationships','resources','learning','responsibility','relationships','rest'
];
const ASPECTS=[
 {angle:0,key:'conjunction',uk:'з’єднання',en:'conjunction'},
 {angle:60,key:'sextile',uk:'секстиль',en:'sextile'},
 {angle:90,key:'square',uk:'квадрат',en:'square'},
 {angle:120,key:'trine',uk:'трин',en:'trine'},
 {angle:180,key:'opposition',uk:'опозиція',en:'opposition'}
] as const;
const MOD=(x:number)=>((x%360)+360)%360;
export const circularDistance=(a:number,b:number)=>{
 if(!Number.isFinite(a)||!Number.isFinite(b))throw Error('Invalid celestial longitude');
 const delta=MOD(a-b);return Math.min(delta,360-delta);
};
export function aspectBetween(transitLongitude:number,natalLongitude:number,orbLimit=3){
 if(!Number.isFinite(orbLimit)||orbLimit<=0||orbLimit>10)throw Error('Invalid aspect orb');
 const distance=circularDistance(transitLongitude,natalLongitude);
 const best=ASPECTS.map(aspect=>({...aspect,orbDegrees:Math.abs(distance-aspect.angle)}))
  .sort((a,b)=>a.orbDegrees-b.orbDegrees)[0];
 return best.orbDegrees<=orbLimit?best:null;
}
export type SynthesisInputs={
 date:string;western:TropicalSky;
 natalWestern:{Sun:number;Moon:number};
 vedic:Awaited<ReturnType<typeof dailyTransit>>;
 natalVedic:{moonSign:number;lagnaSign:number};
 period?:{lord:string;antardasha?:string|null}|null;
};
const validSign=(x:number)=>Number.isInteger(x)&&x>=1&&x<=12;
const fmt=(x:number)=>Math.round(x*100)/100;
export function buildAstrologicalSynthesis(input:SynthesisInputs){
 const {date,western,vedic,natalWestern,natalVedic}=input;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date!==vedic.date||
    date!==localToday(vedic.timeZone,new Date(western.sampledAtUtc))||
    western.sampledAtUtc!==vedic.sampledAtUtc)
  throw Error('Mismatched dates or sampling instants: refusing synthesis');
 if(!validSign(natalVedic.moonSign)||!validSign(natalVedic.lagnaSign)||
    !vedic.ephemerisBackend?.includes('verified-SWIEPH')||
    !western.planets||!Array.isArray(vedic.planets))
  throw Error('Incomplete verified natal/transit context');
 const westernSignals:Signal[]=[];
 for(const planet of PLANETS){
  const transit=western.planets[planet];
  if(!transit||!Number.isFinite(transit.longitude)||!validSign(transit.sign))
   throw Error('Incomplete tropical planet '+planet);
  for(const target of ['Sun','Moon'] as const){
   const natal=natalWestern[target];
   if(!Number.isFinite(natal)||natal<0||natal>=360)throw Error('Invalid tropical natal '+target);
   const aspect=aspectBetween(transit.longitude,natal,planet==='Saturn'||planet==='Jupiter'?4:3);
   if(!aspect)continue;
   westernSignals.push({
    id:'W:'+date+':'+planet+':'+target+':'+aspect.key,tradition:'western',
    topic:PLANET_TOPIC[planet],planet,
    source:'SWISS_TROPICAL_TRANSIT_TO_VERIFIED_TROPICAL_NATAL_V1',
    sampledAtUtc:western.sampledAtUtc,
    title:l('Транзит '+planet+' — '+aspect.uk+' до натального '+target,
     planet+' transit '+aspect.en+' natal '+target),
    detail:l('Кут '+aspect.angle+'°, відхилення '+fmt(aspect.orbDegrees)+'°.',
     'Angle '+aspect.angle+'°, orb '+fmt(aspect.orbDegrees)+'°.'),
    transitLongitude:fmt(transit.longitude),natalLongitude:fmt(natal),
    transitSign:transit.sign,natalSign:Math.floor(natal/30)+1,
    target,aspect:aspect.key,orbDegrees:fmt(aspect.orbDegrees)
   });
  }
 }
 // Rank tightness and slower structural transits first, but never call that
 // a probability or objective effectiveness score.
 const speedPriority=(name:string)=>name==='Saturn'?0:name==='Jupiter'?1:2;
 westernSignals.sort((a,b)=>speedPriority(a.planet)-speedPriority(b.planet)||
   (a.orbDegrees||0)-(b.orbDegrees||0)||a.id.localeCompare(b.id));
 const westernChosen=westernSignals.slice(0,5);
 const vedicSignals:Signal[]=[];
 for(const planet of ['Moon','Saturn','Jupiter','Mars','Mercury','Venus'] as const){
  const transit=vedic.planets.find(p=>p.name===planet);
  if(!transit||!validSign(transit.sign)||!Number.isFinite(transit.longitude))
   throw Error('Incomplete Lahiri transit '+planet);
  for(const anchor of ['moon','lagna'] as const){
   // Lagna whole-sign houses require authenticated birth time. They are
   // rendered independently of Janma Rashi; no reinterpretation of western signs.
   const natalSign=anchor==='moon'?natalVedic.moonSign:natalVedic.lagnaSign;
   const house=((transit.sign-natalSign+12)%12)+1;
   const topic=HOUSE_TOPIC[house-1];
   vedicSignals.push({
    id:'V:'+date+':'+planet+':'+anchor+':'+house,tradition:'vedic',
    topic,planet,source:'SWISS_LAHIRI_JHORA8_VERIFIED_GOCHARA_WHOLE_SIGN_V1',
    sampledAtUtc:vedic.sampledAtUtc,
    title:l(planet+' у '+house+'-му домі від '+(anchor==='moon'?'натального Місяця':'Лагни'),
     planet+' in house '+house+' from natal '+(anchor==='moon'?'Moon':'Ascendant')),
    detail:l('Традиційна тема дому: '+THEMES[topic].title.uk.toLowerCase()+'.',
     'Traditional house theme: '+THEMES[topic].title.en.toLowerCase()+'.'),
    transitLongitude:fmt(transit.longitude),transitSign:transit.sign,
    natalSign,house
   });
  }
 }
 // 2 Moon-origin gochar anchors + slower planets + selected Lagna influences.
 const vedicChosen=[
  ...vedicSignals.filter(x=>x.planet==='Moon'&&x.id.includes(':moon:')),
  ...vedicSignals.filter(x=>['Saturn','Jupiter'].includes(x.planet)&&x.id.includes(':moon:')),
  ...vedicSignals.filter(x=>['Mars','Mercury','Venus'].includes(x.planet)&&x.id.includes(':lagna:'))
 ].slice(0,6);
 const westernTopics=new Set(westernChosen.map(x=>x.topic));
 const vedicTopics=new Set(vedicChosen.map(x=>x.topic));
 const common=(Object.keys(THEMES) as Topic[]).filter(topic=>westernTopics.has(topic)&&vedicTopics.has(topic));
 const westernFocus=westernChosen[0]?.topic||null;
 const vedicFocus=vedicChosen[0]?.topic||null;
 const primary=common[0]||vedicFocus||westernFocus||null;
 const status=westernChosen.length===0||vedicChosen.length===0?'limited_evidence':
  common.length>0?'convergence':'different_emphases';
 const theme=primary?THEMES[primary]:null;
 const headline: L=common.length>0?
  l('Спільна тема: '+theme!.title.uk,'Shared theme: '+theme!.title.en):
  status==='different_emphases'?
   l('Два астрологічні акценти','Two astrological emphases'):
   l('Недостатньо близьких західних аспектів','No close Western aspects in the selected set');
 const description:L=common.length>0?
  l('Обидві традиції незалежно звертають увагу на тему «'+theme!.title.uk.toLowerCase()+'», але через різні натальні точки та правила транзитів.',
   'Both methods independently emphasize '+theme!.title.en.toLowerCase()+', using different natal anchors and transit conventions.'):
  status==='different_emphases'?
   l('Західна й ведична традиції зараз підкреслюють різні життєві теми. Це не обов’язково суперечність: їхні точки відліку й правила різні.',
    'Western and Vedic methods currently emphasize different life themes. This need not be a contradiction: their natal anchors and rules differ.'):
   l('Немає достатніх близьких західних аспектів у вибраному наборі правил. Ми не вигадуємо збіг — показуємо доступні ведичні транзити.',
    'The selected aspect rules yield no close Western natal contacts. Rather than inventing convergence, the available Vedic transits remain visible.');
 return {
  version:'ASE_V1',date,zone:vedic.timeZone,
  status,headline,description,
  advice:status==='different_emphases'&&westernFocus&&vedicFocus?
   l('Західний акцент: '+THEMES[westernFocus].step.uk+' Ведичний акцент: '+THEMES[vedicFocus].step.uk,
     'Western emphasis: '+THEMES[westernFocus].step.en+' Vedic emphasis: '+THEMES[vedicFocus].step.en):
   theme?theme.step:l('Спостерігай за власними рішеннями та обставинами; відсутність близького аспекту не є вказівкою до дії.',
    'Attend to your own circumstances; the absence of a close aspect is not an instruction to act.'),
  reflection:theme?theme.question:l('Яка тема зараз справді важлива для тебе?','Which theme matters to you right now?'),
  commonTopics:common.map(key=>({key,...THEMES[key]})),
  separateTopics:{
   western:westernFocus?{key:westernFocus,title:THEMES[westernFocus].title}:null,
   vedic:vedicFocus?{key:vedicFocus,title:THEMES[vedicFocus].title}:null
  },
  western:{reference:'TROPICAL_NATAL_SUN_AND_MOON',signals:westernChosen,
   consideredAspects:ASPECTS.map(x=>({name:x.key,angle:x.angle})),
   consideredPlanets:PLANETS,matchedCount:westernSignals.length,
   method:'Swiss Ephemeris / tropical / natal exact longitude aspects at local noon'},
  vedic:{reference:'SIDEREAL_NATAL_MOON_AND_LAGNA',signals:vedicChosen,
   method:vedic.method,natalMoonSign:natalVedic.moonSign,natalLagnaSign:natalVedic.lagnaSign,
   periodContext:input.period||null},
  provenance:{sampledAtUtc:western.sampledAtUtc,
   interpretation:'GALAXIORA_EDITORIAL_HOUSE_AND_PLANET_THEME_MAPPING_V1',
   comparison:'EXACT_TOPIC_INTERSECTION_NO_FORCED_CONSENSUS',
   warning:'General traditional interpretive guidance; not a deterministic event forecast'}
 };
}
