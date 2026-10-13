import type {CalculatedChart,Graha} from '../../../packages/jyotish-core/src/index.ts';
import {ukTerm} from './terminology.ts';

/** Report data is compiled from Swiss Ephemeris output, not invented by the LLM. */
export type ReportSection={
 id:string;heading:string;eyebrow:string;lead:string;paragraphs:string[];
 facts?:string[];image?:'cosmos'|'earth'|'nebula';
};
export type DetailedReport={
 sections:ReportSection[];generatedAt:string;chartSummary:string;language:'uk'|'en';
};
const SIGNS_UK=["Овен","Телець","Близнюки","Рак","Лев","Діва","Терези","Скорпіон","Стрілець","Козоріг","Водолій","Риби"];
const SIGN_THEMES_UK=[
 "ініціатива, відвага, вміння починати","витримка, цінності й відчуття опори",
 "спілкування, різноманітність, цікавість","емоційна пам’ять, турбота й дім",
 "творчість, щедрість і самовираження","аналіз, точність та корисна праця",
 "партнерство, справедливість і гармонія","зосередження, зміни та глибина",
 "навчання, пошук сенсу і світогляд","дисципліна, відповідальність і досягнення",
 "незалежність, спільноти та оновлення","інтуїція, співчуття та уява"
];
const HOUSE_UK=[
 "Особистість, зовнішнє враження, починання","Ресурси, мовлення, родинні цінності",
 "Сміливість, зусилля, навички, спілкування","Дім, родина, внутрішня опора",
 "Творчість, навчання, діти, самовираження","Повсякденна праця, перешкоди, служіння",
 "Партнерство, домовленості, співпраця","Глибинні зміни, спільні ресурси, дослідження",
 "Світогляд, учителі, далекі горизонти","Професійний шлях, репутація, суспільна роль",
 "Друзі, спільноти, перспективні цілі","Усамітнення, відновлення, внутрішнє життя"
];
const HOUSE_EN=[
 "Identity, beginnings and first impressions","Resources, speech and family values",
 "Initiative, communication and practical skills","Home, family and inner foundations",
 "Creativity, learning and self-expression","Service, routines and obstacles",
 "Partnership, agreements and cooperation","Transformation, shared resources and research",
 "Worldview, education and distant horizons","Vocation, public role and reputation",
 "Community, long-term goals and networks","Rest, solitude and inner life"
];
const GRAHA_UK:Record<string,string>={Sun:"Сонце",Moon:"Місяць",Mars:"Марс",Mercury:"Меркурій",Jupiter:"Юпітер",Venus:"Венера",Saturn:"Сатурн",Rahu:"Раху",Ketu:"Кету"};
const GRAHA_THEME_UK:Record<string,string>={
 Sun:"воля, самовираження та образ авторитету",Moon:"емоційні реакції, внутрішня опора та звички",
 Mars:"рішучість, енергія та подолання опору",Mercury:"мислення, мовлення, аналіз та навчання",
 Jupiter:"сенс, мудрість, наставники та принципи",Venus:"взаємність, естетика, задоволення та зв’язки",
 Saturn:"обов’язок, межі, час та довготривала праця",
 Rahu:"новизна, сильне прагнення і вихід за звичні межі",
 Ketu:"відсторонення, переосмислення й інтерес до сутності"
};
const GRAHA_THEME_EN:Record<string,string>={
 Sun:"willpower, purpose and self-expression",Moon:"inner experience, feelings and habit",
 Mars:"motivation, courage and directed effort",Mercury:"thought, speech and learning",
 Jupiter:"meaning, wisdom and guiding principles",Venus:"aesthetics, affinity and relationships",
 Saturn:"time, structure and responsibility",Rahu:"exploration, ambition and new territory",
 Ketu:"detachment, reflection and simplification"
};
const sign=(n:number,uk:boolean)=>uk?SIGNS_UK[n-1]||"?":
 ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][n-1]||"?";
const planet=(name:string,uk:boolean)=>uk?GRAHA_UK[name]||name:name;
const header=(id:string,heading:string,eyebrow:string,lead:string,paragraphs:string[],facts?:string[],image?:ReportSection['image']):ReportSection=>
 ({id,heading,eyebrow,lead,paragraphs,facts,image});
const line=(g:Graha,uk:boolean)=>planet(g.name,uk)+" — "+sign(g.sign,uk)+", "+(uk?"дім ":"house ")+g.house;
const joinPlanets=(grahas:Graha[],uk:boolean)=>grahas.map(g=>line(g,uk)).join("; ");

/** Whole-sign Parashari graha drishti for seven classical planets only.
 * Generic 7th aspect, plus Mars 4/8, Jupiter 5/9, Saturn 3/10.
 * Rahu/Ketu drishti rules vary between schools; omitted. */
export function calculateParashariDrishti(chart:CalculatedChart){
 const offsets:Record<string,number[]>={Sun:[7],Moon:[7],Mercury:[7],Venus:[7],Mars:[4,7,8],Jupiter:[5,7,9],Saturn:[3,7,10]};
 const out:{source:string;targetHouse:number;offset:number;occupants:string[]}[]=[];
 for(const source of chart.d1){
  for(const offset of offsets[source.name]||[]){
   const targetHouse=((source.house+offset-2)%12)+1;
   const occupants=chart.d1.filter(p=>p.house===targetHouse&&p.name!==source.name).map(p=>p.name);
   out.push({source:source.name,targetHouse,offset,occupants});
  }
 }
 return out;
}

/** Thematic facts for AI, excluding date/time/location/name and other identifying birth input. */
export function detailedReportFacts(chart:CalculatedChart,lang:'uk'|'en'){
 const uk=lang==='uk',sun=chart.d1.find(p=>p.name==='Sun'),moon=chart.d1.find(p=>p.name==='Moon');
 const active=chart.dasha.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end));
 const sub=active?.antardashas?.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end));
 const houses=Array.from({length:12},(_,i)=>{
  const occupants=chart.d1.filter(p=>p.house===i+1);
  return (i+1)+":"+(occupants.length?occupants.map(p=>planet(p.name,uk)).join(","):"—");
 }).join("; ");
 const aspects=calculateParashariDrishti(chart).filter(x=>x.occupants.length>0).slice(0,14);
 const aspectText=aspects.map(a=>planet(a.source,uk)+"→"+a.targetHouse+":" +a.occupants.map(p=>planet(p,uk)).join(",")).join("; ");
 return [
  {id:"identity",fact:(uk?"Лагна: ":"Ascendant: ")+sign(chart.ascendant.sign,uk)+". "+(sun?line(sun,uk):"")+". "+(moon?line(moon,uk):"") + (moon?", "+(uk?ukTerm(moon.nakshatra):moon.nakshatra)+" pada "+moon.pada:"")},
  {id:"planets",fact:(uk?"Повна D1: ":"Full D1: ")+joinPlanets(chart.d1,uk)},
  {id:"houses",fact:(uk?"Дванадцять домів, зайняті планетами: ":"Twelve houses and occupants: ")+houses},
  {id:"aspects",fact:(uk?"Класичні Парашарі дрішті, без вузлів: ":"Classical Parashari drishti, excluding nodes: ")+(aspectText||"—")},
  {id:"navamsa",fact:(uk?"D9, Лагна ":"D9 ascendant ")+sign(chart.lagnaD9.sign,uk)+": "+joinPlanets(chart.d9,uk)},
  {id:"dashamsa",fact:(uk?"D10, Лагна ":"D10 ascendant ")+sign(chart.lagnaD10.sign,uk)+": "+joinPlanets(chart.d10,uk)},
  {id:"dasha",fact:active?(uk?"Махадаша ":"Mahadasha ")+planet(active.lord,uk)+", "+active.start.slice(0,10)+"—"+active.end.slice(0,10)+(sub?"; "+(uk?"антардаша ":"Antardasha ")+planet(sub.lord,uk)+", "+sub.start.slice(0,10)+"—"+sub.end.slice(0,10):""):(uk?"Немає активної даші в межах карти.":"No active dasha within chart data.")}
 ];
}

export function buildDetailedReport(chart:CalculatedChart,lang:'uk'|'en'):DetailedReport{
 const uk=lang==='uk',sections:ReportSection[]=[];
 const asc=chart.ascendant,sun=chart.d1.find(x=>x.name==='Sun'),moon=chart.d1.find(x=>x.name==='Moon');
 sections.push(header("portrait",uk?"Ваш астрологічний портрет":"Your astrological portrait",uk?"I · ОСНОВА КАРТИ":"I · CHART FOUNDATION",
  uk?"Цілісне прочитання натальної карти, побудоване на перевірених планетних положеннях.":"A guided reading grounded in verified planetary positions.",
  [uk?"В основі аналізу — сидеричний зодіак Лахірі та система цілознакових домів. Лагна у знаку "+sign(asc.sign,true)+" задає відлік усіх дванадцяти домів і їхніх тем.":"The report uses the Lahiri sidereal zodiac and whole-sign houses. "+sign(asc.sign,false)+" rises as the first house.",
   uk?"Наведені нижче тематичні інтерпретації розділяють обчислені факти, традиційні правила Джйотіш і додатковий AI-коментар.":"Below, calculated facts, classical Jyotish rules and optional AI commentary are kept separate."],
  [(uk?"Лагна: ":"Ascendant: ")+sign(asc.sign,uk),(uk?"Ефемериди: ":"Ephemeris: ")+chart.ephemeris], "cosmos"));
 sections.push(header("sun-moon",uk?"Сонце, Місяць і накшатра":"Sun, Moon and lunar mansion",uk?"II · ОСОБИСТІСНА ВІСЬ":"II · CORE INDICATORS",
  uk?"Два головні символічні орієнтири для самовираження й внутрішнього життя.":"Two core symbolic reference points for expression and inner life.",
  [(sun?line(sun,uk)+". ":"")+(uk?"Сонце традиційно пов’язують з волею, роллю та образом себе.":"The Sun is associated with purpose, identity and expression."),
   (moon?line(moon,uk)+". ":"")+(uk?"Місяць у накшатрі ":"The Moon is in nakshatra ")+(uk?ukTerm(moon?.nakshatra||"—"):(moon?.nakshatra||"—"))+", "+(uk?"пада ":"pada ")+(moon?.pada||"—")+". "+(uk?"Це деталізує місячне положення всередині зодіакального знака.":"This refines the lunar position within the zodiac sign.")],
  [],"earth"));
 sections.push(header("planets-intro",uk?"Дев’ять ґрах натальної карти":"Nine grahas of the birth chart",uk?"III · ПЛАНЕТИ D1":"III · PLANETS D1",
  uk?"Кожна ґраха поєднує тему планети, знак і дім.":"Each graha combines planetary themes with its sign and house.",
  [uk?"Нижче всі положення взяті безпосередньо з розрахунку D1. Ретроградність показується лише там, де вона є у вхідних ефемеридах.":"Every placement below comes directly from D1. Retrograde motion is shown only when present in the ephemeris."],
  [joinPlanets(chart.d1,uk)]));
 for(const p of chart.d1){
  const planetName=planet(p.name,uk);
  const topic=uk?GRAHA_THEME_UK[p.name]||"особистісні теми":GRAHA_THEME_EN[p.name]||"personal themes";
  const houseTheme=uk?HOUSE_UK[p.house-1]:HOUSE_EN[p.house-1];
  const paragraphs=uk?[
   planetName+" у знаку "+sign(p.sign,true)+" традиційно розглядають через теми: "+topic+". Знак додає спосіб прояву — "+SIGN_THEMES_UK[p.sign-1]+".",
   "Положення в "+p.house+"-му домі пов’язує ці символічні теми зі сферою: "+houseTheme.toLowerCase()+". Це контекст для читання карти, а не висновок про конкретну подію.",
   "Точне положення: "+p.degreesInSign.toFixed(2)+"° знака; накшатра "+ukTerm(p.nakshatra)+", пада "+p.pada+". "+(p.retrograde?"Рух ретроградний за ефемеридами.":"")
  ]:[
   planetName+" in "+sign(p.sign,false)+" is traditionally associated with "+topic+".",
   "House "+p.house+" brings these themes into "+houseTheme.toLowerCase()+". This is a framework for reading the chart rather than a concrete event claim.",
   "Calculated degree: "+p.degreesInSign.toFixed(2)+"°; nakshatra "+p.nakshatra+", pada "+p.pada+". "+(p.retrograde?"Retrograde motion is indicated.":"")
  ];
  sections.push(header("planet-"+p.name.toLowerCase(),planetName+" · "+sign(p.sign,uk),uk?"ПОЛОЖЕННЯ ПЛАНЕТИ":"PLANET PLACEMENT",
    uk?p.house+"-й дім · "+topic:"House "+p.house+" · "+topic,paragraphs,[line(p,uk)]));
 }
 sections.push(header("houses-intro",uk?"Усі 12 домів":"All twelve houses",uk?"IV · СФЕРИ ЖИТТЯ":"IV · LIFE DOMAINS",
  uk?"Розміщення домів визначає Лагна; порожній дім не означає відсутності теми.":"Houses are counted from the ascendant; an empty house does not mean that area of life is absent.",
  [uk?"У цілознаковій системі кожен дім відповідає окремому знаку. Далі наведено сферу кожного дому та фактичні планети в ньому.":"In whole-sign houses, each house corresponds to one zodiac sign. The entries show each house theme and its actual occupants."],
  [],"nebula"));
 for(let h=1;h<=12;h++){
  const occupants=chart.d1.filter(p=>p.house===h),houseSign=(asc.sign+h-2)%12+1;
  const label=occupants.map(p=>planet(p.name,uk)).join(", ");
  sections.push(header("house-"+h,(uk?"Дім ":"House ")+h+" · "+sign(houseSign,uk),uk?"XII ДОМІВ":"TWELVE HOUSES",
   uk?HOUSE_UK[h-1]:HOUSE_EN[h-1],
   [uk?"У цьому домі знак "+sign(houseSign,true)+" задає символічний тон: "+SIGN_THEMES_UK[houseSign-1]+".":"The sign "+sign(houseSign,false)+" gives this house its tonal context.",
    occupants.length?(uk?"Планети у домі: ":"Occupants: ")+label+".":(uk?"Планет у домі немає. Це не робить його неактивним: традиційний аналіз також враховує управителя знака.":"No grahas occupy this house. This does not imply inactivity; house rulers are also considered in traditional readings.")],
   occupants.map(p=>line(p,uk))));
 }
 const aspects=calculateParashariDrishti(chart);
 sections.push(header("drishti",uk?"Дрішті: як ґрахи впливають на доми":"Drishti: traditional planetary aspects",
  uk?"V · КЛАСИЧНІ АСПЕКТИ":"V · CLASSICAL ASPECTS",
  uk?"Обчислені цілознакові аспекти за правилами Парашарі.":"Calculated whole-sign graha aspects using Parashari conventions.",
  [uk?"Усі сім класичних планет аспектують сьомий дім від себе. Марс додатково аспектує четвертий і восьмий, Юпітер — п’ятий і дев’ятий, Сатурн — третій і десятий.":"All seven classical planets aspect their seventh house; Mars adds fourth and eighth, Jupiter fifth and ninth, and Saturn third and tenth.",
   uk?"Нижче показані всі цілознакові дрішті до домів, а також планети в цільовому домі, якщо вони є. Це не західні кутові аспекти з орбісами. Трактування аспектів Раху й Кету різниться між школами, тому їх тут не обчислюємо.":"The list includes every whole-sign drishti and the occupants of its target house, if present. These are not Western degree-orb aspects. Rahu/Ketu rules vary across traditions and are omitted."],
  aspects.map(a=>planet(a.source,uk)+" → "+(uk?"дім ":"house ")+a.targetHouse+" ("+(a.occupants.length?a.occupants.map(p=>planet(p,uk)).join(", "):(uk?"без планет":"empty"))+")")));
 const conjunctions=Array.from({length:12},(_,index)=>({
  house:index+1,grahas:chart.d1.filter(p=>p.house===index+1)
 })).filter(x=>x.grahas.length>1);
 sections.push(header("conjunctions",uk?"Сполучення ґрах у домах":"Graha conjunctions within houses",
  uk?"V · СПІЛЬНІ ПОЛОЖЕННЯ":"V · SHARED PLACEMENTS",
  uk?"Кілька ґрах в одному цілознаковому домі створюють додаткові теми для спільного читання.":"Multiple grahas in the same whole-sign house add another layer of context.",
  [uk?"Тут зафіксовано лише спільне перебування в домі, а не точне з’єднання за градусами, яке потребувало б окремого правила орбісу.":"The list identifies planets sharing a house, not degree-perfect conjunctions or orb-based proximity.",
   uk?"Відсутність сполучення у списку не означає відсутності впливів: окремі ґрахи можуть проявлятися через доми та дрішті.":"Not appearing here does not imply an absence of influence; individual grahas still inform house and drishti readings."],
  conjunctions.length?conjunctions.map(x=>(uk?"Дім ":"House ")+x.house+": "+x.grahas.map(p=>planet(p.name,uk)).join(", ")):[uk?"Спільних положень кількох ґрах в одному домі немає.":"No house contains multiple grahas."]));
 sections.push(header("navamsa",uk?"Навамша · D9":"Navamsa · D9",uk?"VI · ПАРТНЕРСТВО ТА ЦІННОСТІ":"VI · RELATIONSHIPS & VALUES",
  uk?"Дробова карта з окремими обчисленими положеннями.":"A divisional chart with separately computed positions.",
  [uk?"Лагна D9 — "+sign(chart.lagnaD9.sign,true)+". У традиції Навамшу розглядають як додатковий шар аналізу стосунків, узгодженості цінностей та внутрішньої зрілості.":"D9 ascendant: "+sign(chart.lagnaD9.sign,false)+". Navamsa is used traditionally as an additional layer for partnerships, values and maturation.",
   uk?"Список положень D9 нижче сформовано з обчислень, а не з припущень LLM.":"The following D9 positions come from calculation rather than model guesses."],
  chart.d9.map(p=>line(p,uk)),"earth"));
 sections.push(header("dashamsa",uk?"Дашамша · D10":"Dashamsa · D10",uk?"VII · ПРОФЕСІЙНИЙ ШЛЯХ":"VII · WORK & VOCATION",
  uk?"Окремий погляд на професійні теми, а не заміна D1.":"A complementary view of vocation, not a replacement for D1.",
  [uk?"Лагна D10 — "+sign(chart.lagnaD10.sign,true)+". Дашамшу традиційно застосовують для аналізу професійного самовираження, ролі у колективі та прагнень.":"D10 ascendant: "+sign(chart.lagnaD10.sign,false)+". Dashamsa is used traditionally to explore vocation, contribution and public roles.",
   uk?"Усі дев’ять положень відображають ту саму вихідну карту, перетворену за правилами D10.":"All nine positions are mathematically derived from the same birth chart using D10 rules."],
  chart.d10.map(p=>line(p,uk)),"nebula"));
 const active=chart.dasha.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end));
 const sub=active?.antardashas?.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end));
 sections.push(header("dasha",uk?"Вімшоттарі-даша: часові цикли":"Vimshottari Dasha: time cycles",uk?"VIII · РИТМ ПЕРІОДІВ":"VIII · PERIOD RHYTHM",
  uk?"Періоди обчислені з накшатри Місяця.":"Dasha periods are computed from the lunar nakshatra.",
  [active?(uk?"Активна махадаша — "+planet(active.lord,true)+" ("+active.start.slice(0,10)+" — "+active.end.slice(0,10)+").":"Current Mahadasha: "+active.lord+" ("+active.start.slice(0,10)+" — "+active.end.slice(0,10)+")."):(uk?"Активної махадаші у збереженому діапазоні немає.":"No active Mahadasha within the calculated range."),
   sub?(uk?"Поточна антардаша — "+planet(sub.lord,true)+" ("+sub.start.slice(0,10)+" — "+sub.end.slice(0,10)+").":"Current Antardasha: "+sub.lord+" ("+sub.start.slice(0,10)+" — "+sub.end.slice(0,10)+")."):(uk?"Антардаша не визначена для цього періоду.":"Antardasha is not specified for this time."),
   uk?"Ці дати — обчислені межі циклів; самі собою вони не передбачають конкретних подій.":"These dates are calculated cycle boundaries, not predictions of particular events."],
  chart.dasha.map(d=>planet(d.lord,uk)+": "+d.start.slice(0,10)+" — "+d.end.slice(0,10))));
 return {sections,generatedAt:new Date().toISOString(),chartSummary:(uk?"Лагна: ":"Ascendant: ")+sign(asc.sign,uk),language:lang};
}
