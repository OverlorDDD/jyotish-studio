import type {CalculatedChart,Graha} from '../../../packages/jyotish-core/src/index.ts';
import {ukTerm} from './terminology.ts';
import {practicalGuidance,type PracticalTip} from './practical-guidance.ts';
import {ruleFindings,ruleFingerprint,RULESET_VERSION,SIGN_NAMES} from '../../../packages/jyotish-core/src/rules.ts';

/** Report data is compiled from Swiss Ephemeris output, not invented by the LLM. */
export type ReportSection={
 id:string;heading:string;eyebrow:string;lead:string;paragraphs:string[];
 facts?:string[];image?:'cosmos'|'earth'|'nebula';
};
export type DetailedReport={
 sections:ReportSection[];generatedAt:string;chartSummary:string;language:'uk'|'en';
 asOf:string;rulesVersion:string;rulesDigest:string;ruleFacts:ReturnType<typeof ruleFindings>['facts'];
 practicalTips:PracticalTip[];
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
const line=(g:Graha,uk:boolean)=>planet(g.name,uk)+" — "+sign(g.sign,uk)+", "+(uk?"сфера життя ":"life area ")+g.house;
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
export function detailedReportFacts(chart:CalculatedChart,lang:'uk'|'en',asOf=new Date().toISOString().slice(0,10)){
 const uk=lang==='uk',sun=chart.d1.find(p=>p.name==='Sun'),moon=chart.d1.find(p=>p.name==='Moon');
 const reference=Date.parse(asOf+'T12:00:00.000Z');
 const active=chart.dasha.find(d=>Date.parse(d.start)<=reference&&reference<Date.parse(d.end));
 const sub=active?.antardashas?.find(d=>Date.parse(d.start)<=reference&&reference<Date.parse(d.end));
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
  {id:"rules",fact:(uk?"Верифіковані правила Engine 2.0: ":"Verified Engine 2.0 rules: ")+
   ruleFindings(chart).facts.map(f=>f.id+"="+Object.entries(f.values).map(([key,value])=>key+":"+value).join(",")).join("; ").slice(0,3000)},
  {id:"dasha",fact:active?(uk?"Махадаша ":"Mahadasha ")+planet(active.lord,uk)+", "+active.start.slice(0,10)+"—"+active.end.slice(0,10)+(sub?"; "+(uk?"антардаша ":"Antardasha ")+planet(sub.lord,uk)+", "+sub.start.slice(0,10)+"—"+sub.end.slice(0,10):""):(uk?"Немає активної даші в межах карти.":"No active dasha within chart data.")}
 ];
}

export function buildDetailedReport(chart:CalculatedChart,lang:'uk'|'en',asOf=new Date().toISOString().slice(0,10)):DetailedReport{
 const uk=lang==='uk',sections:ReportSection[]=[];
 const asc=chart.ascendant,sun=chart.d1.find(x=>x.name==='Sun'),moon=chart.d1.find(x=>x.name==='Moon');
 sections.push(header("portrait",uk?"Ваш астрологічний портрет":"Your astrological portrait",uk?"I · ОСНОВА КАРТИ":"I · CHART FOUNDATION",
  uk?"Цілісне прочитання натальної карти, побудоване на перевірених планетних положеннях.":"A guided reading grounded in verified planetary positions.",
  [uk?"Карта обчислена за системою Лахірі. Висхідний знак — "+sign(asc.sign,true)+"; у цій традиції він задає порядок дванадцяти сфер життя.":"The chart uses the Lahiri system. The rising sign is "+sign(asc.sign,false)+"; in this tradition, it sets the order of twelve life areas.",
   uk?"Наведені нижче тематичні інтерпретації розділяють обчислені факти, традиційні правила Джйотіш і додатковий AI-коментар.":"Below, calculated facts, classical Jyotish rules and optional AI commentary are kept separate."],
  [(uk?"Висхідний знак: ":"Rising sign: ")+sign(asc.sign,uk),(uk?"Астрономічне джерело: ":"Astronomical source: ")+chart.ephemeris], "cosmos"));
 sections.push(header("sun-moon",uk?"Сонце, почуття та звичні реакції":"Sun, feelings and familiar reactions",uk?"II · ОСОБИСТІСНА ВІСЬ":"II · CORE INDICATORS",
  uk?"Два головні символічні орієнтири для самовираження й внутрішнього життя.":"Two core symbolic reference points for expression and inner life.",
  [(sun?line(sun,uk)+". ":"")+(uk?"Сонце традиційно пов’язують з волею, роллю та образом себе.":"The Sun is associated with purpose, identity and expression."),
   (moon?line(moon,uk)+". ":"")+(uk?"Додатковий зоряний сектор Місяця — ":"The Moon’s additional lunar sector is ")+(uk?ukTerm(moon?.nakshatra||"—"):(moon?.nakshatra||"—"))+", "+(uk?"частина ":"part ")+(moon?.pada||"—")+". "+(uk?"Це уточнення розрахунку; для основного прочитання його можна пропустити.":"This is an additional calculation detail; you can skip it on a first reading.")],
  [],"earth"));
 sections.push(header("planets-intro",uk?"Планети та їхні символічні теми":"Planets and their symbolic themes",uk?"III · ПЛАНЕТИ ОСНОВНОЇ КАРТИ":"III · PLANETS IN THE MAIN CHART",
  uk?"Кожне положення поєднує символічну тему, знак зодіаку й сферу життя.":"Each placement connects a symbolic theme with a zodiac sign and an area of life.",
  [uk?"Усі положення нижче взято з розрахунку. Позначка ℞ означає ретроградний рух у вихідних астрономічних даних.":"All placements below come from the calculation. The ℞ mark indicates retrograde motion in the astronomical data."],
  [joinPlanets(chart.d1,uk)]));
 for(const p of chart.d1){
  const planetName=planet(p.name,uk);
  const topic=uk?GRAHA_THEME_UK[p.name]||"особистісні теми":GRAHA_THEME_EN[p.name]||"personal themes";
  const houseTheme=uk?HOUSE_UK[p.house-1]:HOUSE_EN[p.house-1];
  const paragraphs=uk?[
   planetName+" у знаку "+sign(p.sign,true)+" традиційно розглядають через теми: "+topic+". Знак додає спосіб прояву — "+SIGN_THEMES_UK[p.sign-1]+".",
   "Ці символічні теми пов’язують зі сферою життя «"+houseTheme.toLowerCase()+"». Це привід для роздумів, а не висновок про конкретну подію.",
   "Додаткові розрахункові дані: "+p.degreesInSign.toFixed(2)+"° у знаку; зірковий сектор "+ukTerm(p.nakshatra)+", частина "+p.pada+". "+(p.retrograde?"Рух ретроградний за ефемеридами.":"")
  ]:[
   planetName+" in "+sign(p.sign,false)+" is traditionally associated with "+topic+".",
   "These symbolic themes are associated with the life area of "+houseTheme.toLowerCase()+". This is a prompt for reflection, not a concrete event claim.",
   "Additional calculated details: "+p.degreesInSign.toFixed(2)+"° in sign; lunar sector "+p.nakshatra+", part "+p.pada+". "+(p.retrograde?"Retrograde motion is indicated.":"")
  ];
  sections.push(header("planet-"+p.name.toLowerCase(),planetName+" · "+sign(p.sign,uk),uk?"ПОЛОЖЕННЯ ПЛАНЕТИ":"PLANET PLACEMENT",
    uk?"Сфера "+p.house+" · "+topic:"Life area "+p.house+" · "+topic,paragraphs,[line(p,uk)]));
 }
 sections.push(header("houses-intro",uk?"12 сфер життя":"12 areas of life",uk?"IV · СФЕРИ ЖИТТЯ":"IV · LIFE DOMAINS",
  uk?"Висхідний знак задає порядок дванадцяти сфер життя. Якщо в якійсь сфері немає планет, це не означає, що тема відсутня.":"The rising sign sets the order of twelve life areas. An area without planets is not considered absent.",
  [uk?"У цій системі кожна сфера життя відповідає одному знаку зодіаку. Нижче вказано тему сфери та планети, які з нею пов’язують.":"In this system, each life area corresponds to one zodiac sign. The entries show its theme and associated planets."],
  [],"nebula"));
 for(let h=1;h<=12;h++){
  const occupants=chart.d1.filter(p=>p.house===h),houseSign=(asc.sign+h-2)%12+1;
  const label=occupants.map(p=>planet(p.name,uk)).join(", ");
  sections.push(header("house-"+h,(uk?"Сфера життя ":"Life area ")+h+" · "+sign(houseSign,uk),uk?"XII СФЕР ЖИТТЯ":"TWELVE LIFE AREAS",
   uk?HOUSE_UK[h-1]:HOUSE_EN[h-1],
   [uk?"Знак "+sign(houseSign,true)+" додає цій сфері символічні теми: "+SIGN_THEMES_UK[houseSign-1]+".":"The sign "+sign(houseSign,false)+" adds symbolic themes to this area.",
    occupants.length?(uk?"Планети, пов’язані з цією сферою: ":"Planets associated with this area: ")+label+".":(uk?"У цій сфері немає планет, але це не означає, що тема неважлива. Традиція також враховує інші зв’язки карти.":"No planets occupy this area, but that does not mean it is unimportant. The tradition also considers other chart connections.")],
   occupants.map(p=>line(p,uk))));
 }
 const aspects=calculateParashariDrishti(chart);
 sections.push(header("drishti",uk?"Як планети символічно впливають одна на одну":"How planets symbolically influence one another",
  uk?"V · КЛАСИЧНІ АСПЕКТИ":"V · CLASSICAL ASPECTS",
  uk?"У традиції Джйотіш певним планетам приписують зв’язок з окремими сферами життя. Тут показані лише зв’язки, для яких визначено чітке правило.":"In Jyotish, planets are traditionally linked with particular areas of life. This section shows only connections defined by explicit rules.",
  [uk?"За обраною традицією різні планети пов’язують із різними напрямками уваги. Марс, Юпітер і Сатурн мають додаткові зв’язки; правила для Раху й Кету різняться між школами, тому тут вони не враховані.":"In the selected tradition, planets are associated with different directions of attention. Mars, Jupiter and Saturn have additional connections; rules for Rahu and Ketu vary by school, so they are omitted here.",
   uk?"Нижче показано, з якими сферами життя пов’язують кожну планету за обраними правилами. Це традиційна схема тлумачення, а не фізичний вплив чи гарантована подія.":"Below are the life areas associated with each planet under the selected rules. This is a traditional interpretive framework, not a physical effect or guaranteed event."],
  aspects.map(a=>planet(a.source,uk)+" → "+(uk?"сфера ":"life area ")+a.targetHouse+" ("+(a.occupants.length?a.occupants.map(p=>planet(p,uk)).join(", "):(uk?"без планет":"empty"))+")")));
 const conjunctions=Array.from({length:12},(_,index)=>({
  house:index+1,grahas:chart.d1.filter(p=>p.house===index+1)
 })).filter(x=>x.grahas.length>1);
 sections.push(header("conjunctions",uk?"Планети, розташовані разом":"Planets sharing a life area",
  uk?"V · СПІЛЬНІ ПОЛОЖЕННЯ":"V · SHARED PLACEMENTS",
  uk?"Коли кілька планет опиняються в одній сфері життя, традиція розглядає їхні теми разом.":"When several planets occupy the same life area, the tradition interprets their themes together.",
  [uk?"Тут зафіксовано спільне розташування в одній сфері, а не точну близькість за градусами.":"This identifies planets in the same area, not exact closeness measured in degrees.",
   uk?"Навіть якщо планети не стоять разом, традиція розглядає їхні зв’язки з іншими сферами карти.":"Even when planets do not share an area, the tradition considers their connections with other areas."],
  conjunctions.length?conjunctions.map(x=>(uk?"Сфера ":"Life area ")+x.house+": "+x.grahas.map(p=>planet(p.name,uk)).join(", ")):[uk?"У жодній сфері життя немає кількох планет, розташованих разом.":"No life area contains multiple planets together."]));
 sections.push(header("navamsa",uk?"Стосунки й цінності (D9)":"Relationships and values (D9)",uk?"VI · ПАРТНЕРСТВО ТА ЦІННОСТІ":"VI · RELATIONSHIPS & VALUES",
  uk?"Допоміжна карта, яку традиція використовує для роздумів про партнерство, внутрішню зрілість і цінності.":"A supplementary chart traditionally used to reflect on partnership, inner maturity and values.",
  [uk?"У допоміжній карті D9 висхідний знак — "+sign(chart.lagnaD9.sign,true)+". Її традиційно використовують як додаткову перспективу для тем стосунків, цінностей і зрілості.":"The rising sign in supplementary chart D9 is "+sign(chart.lagnaD9.sign,false)+". Traditionally, this chart offers another perspective on relationships, values and maturity.",
   uk?"Список положень D9 нижче сформовано з обчислень, а не з припущень LLM.":"The following D9 positions come from calculation rather than model guesses."],
  chart.d9.map(p=>line(p,uk)),"earth"));
 sections.push(header("dashamsa",uk?"Робота й суспільна роль (D10)":"Work and public role (D10)",uk?"VII · ПРОФЕСІЙНИЙ ШЛЯХ":"VII · WORK & VOCATION",
  uk?"Допоміжна карта для символічного розгляду роботи, внеску та суспільної ролі. Вона доповнює, а не замінює основну карту.":"A supplementary chart for reflecting on work, contribution and public role. It complements rather than replaces the main chart.",
  [uk?"У допоміжній карті D10 висхідний знак — "+sign(chart.lagnaD10.sign,true)+". Традиція використовує її для роздумів про професійний шлях і внесок у суспільство.":"The rising sign in supplementary chart D10 is "+sign(chart.lagnaD10.sign,false)+". The tradition uses it to reflect on vocation and contribution.",
   uk?"Усі дев’ять положень відображають ту саму вихідну карту, перетворену за правилами D10.":"All nine positions are mathematically derived from the same birth chart using D10 rules."],
  chart.d10.map(p=>line(p,uk)),"nebula"));
 sections.push(header("cross-varga",uk?"Одна планета в трьох картах":"One planet across three charts",uk?"VII · ЗВ’ЯЗКИ D1 / D9 / D10":"VII · CROSS-CHART CONNECTIONS",
  uk?"Порівняння положення тієї самої планети в основній і двох допоміжних картах.":"Compare the same planet in the main chart and two supplementary charts.",
  [uk?"D1 описує основні положення народження, D9 деталізує один із шарів внутрішніх цінностей та партнерства, а D10 — професійний контекст. Вони не є трьома незалежними прогнозами.":"D1 provides natal placements; D9 and D10 offer complementary traditional lenses on values, partnership and vocation. They are not three independent predictions.",
   uk?"Зміна знака при переході між варгами визначається математичними правилами поділу зодіаку, а не рішенням мовної моделі.":"Changes in sign across Vargas follow mathematical divisional rules, not AI guesses."],
  chart.d1.map(p=>{
   const d9=chart.d9.find(g=>g.name===p.name),d10=chart.d10.find(g=>g.name===p.name);
   return planet(p.name,uk)+": D1 "+sign(p.sign,uk)+" → D9 "+(d9?sign(d9.sign,uk):"—")+" → D10 "+(d10?sign(d10.sign,uk):"—");
  })));
 const reference=Date.parse(asOf+'T12:00:00.000Z');
 const active=chart.dasha.find(d=>Date.parse(d.start)<=reference&&reference<Date.parse(d.end));
 const sub=active?.antardashas?.find(d=>Date.parse(d.start)<=reference&&reference<Date.parse(d.end));
 sections.push(header("dasha",uk?"Життєві цикли в традиції Джйотіш":"Life cycles in the Jyotish tradition",uk?"VIII · РИТМ ПЕРІОДІВ":"VIII · PERIOD RHYTHM",
  uk?"Ця система поділяє час на символічні періоди, пов’язані з планетами.":"This system divides time into symbolic periods associated with planets.",
  [active?(uk?"Основний період — "+planet(active.lord,true)+" ("+active.start.slice(0,10)+" — "+active.end.slice(0,10)+").":"Main period: "+active.lord+" ("+active.start.slice(0,10)+" — "+active.end.slice(0,10)+")."):(uk?"Активного періоду в розрахованому діапазоні немає.":"No active period is available in the calculated range."),
   sub?(uk?"Вкладений підперіод — "+planet(sub.lord,true)+" ("+sub.start.slice(0,10)+" — "+sub.end.slice(0,10)+").":"Nested sub-period: "+sub.lord+" ("+sub.start.slice(0,10)+" — "+sub.end.slice(0,10)+")."):(uk?"Вкладений підперіод не визначено.":"No nested sub-period is available."),
   uk?"Ці дати — обчислені межі циклів; самі собою вони не передбачають конкретних подій.":"These dates are calculated cycle boundaries, not predictions of particular events."],
  chart.dasha.map(d=>planet(d.lord,uk)+": "+d.start.slice(0,10)+" — "+d.end.slice(0,10))));
 const findings=ruleFindings(chart);
 const label=(name:string)=>planet(name,uk);
 const dignityLabel:Record<string,[string,string]>={
  exalted:['екзальтація','exaltation'],debilitated:['дебілітація','debilitation'],
  own:['власний знак','own sign'],other:['інший знак (не оцінка сили)','other sign (not a strength rating)'],
  unassigned:['не визначено за цими правилами','unassigned by this ruleset']
 };
 // Deterministic interpretive templates: only validated house lordships and
 // computed dignity/yoga rule IDs may drive these paragraphs.
 const anchorLord=(house:number)=>findings.lords.find(x=>x.values.house===house)!;
 const lordStory=(house:number)=>{
  const f=anchorLord(house),v=f.values,source=Number(v.house)-1,target=Number(v.locatedHouse)-1;
  return uk?
   'Планета, яку традиція пов’язує зі сферою '+house+' ('+sign(Number(v.sign),true)+'), — '+label(String(v.ruler))+'. Її розташування у сфері '+v.locatedHouse+' ('+sign(Number(v.locatedSign),true)+') символічно поєднує теми «'+HOUSE_UK[source].toLowerCase()+'» і «'+HOUSE_UK[target].toLowerCase()+'». ['+f.id+']':
   'The planet traditionally associated with life area '+house+' ('+sign(Number(v.sign),false)+') is '+label(String(v.ruler))+'. Its placement in life area '+v.locatedHouse+' ('+sign(Number(v.locatedSign),false)+') symbolically connects '+HOUSE_EN[source].toLowerCase()+' with '+HOUSE_EN[target].toLowerCase()+'. ['+f.id+']';
 };
 const dignityStory=()=>{
  const highlighted=findings.dignities.filter(f=>['own','exalted','debilitated'].includes(String(f.values.dignity)));
  if(!highlighted.length)return uk?
   'За трьома спеціальними класами гідності додаткових акцентів немає; це не оцінка загальної сили карти.':
   'No special sign-level dignity categories are present; this is not a global strength assessment.';
  return highlighted.map(f=>{
   const status=String(f.values.dignity);
   const description=uk?
    status==='debilitated'?'класифікується як дебілітація; це не означає гарантованої невдачі':
    status==='exalted'?'класифікується як екзальтація; це не гарантує конкретних результатів':
    'перебуває у власному знаку; це лише символічна узгодженість':
    status==='debilitated'?'is in a debilitation sign, not a guaranteed setback':
    status==='exalted'?'is in an exaltation sign, not a guaranteed outcome':
    'occupies an own sign, indicating symbolic affinity';
   return label(f.subject)+' '+description+'. ['+f.id+']';
  }).join(' ');
 };
 const yogaLabel=(name:string)=>({
  Ruchaka:uk?'Ручака':'Ruchaka',
  Bhadra:uk?'Бхадра':'Bhadra',
  Hamsa:uk?'Хамса':'Hamsa',
  Malavya:uk?'Малав’я':'Malavya',
  Shasha:uk?'Шаша':'Shasha'
 } as Record<string,string>)[name]||name;
 const yogaThemes:Record<string,[string,string]>={
  Ruchaka:['ініціатива та дисципліна дії','initiative and disciplined action'],
  Bhadra:['інтелект, комунікація та навчання','intellect, communication and learning'],
  Hamsa:['світогляд, мудрість та наставництво','perspective, wisdom and teaching'],
  Malavya:['естетика, партнерство та відчуття гармонії','aesthetics, partnership and harmony'],
  Shasha:['структура, витримка та відповідальність','structure, endurance and responsibility']
 };
 const yogaStory=()=>{
  if(!findings.yogas.length)return uk?
   'За заданими критеріями ці п’ять комбінацій не виявлено. Це не виключає інших традиційних поєднань.':
   'None of these five combinations met the specified criteria. Other traditional combinations are not assessed here.';
  return findings.yogas.map(y=>(uk?'Для комбінації «':'For the combination “')+yogaLabel(y.name)+
   (uk?'» традиційні символічні теми — ':'”, the traditional symbolic themes are ')+
   yogaThemes[y.name][uk?0:1]+'. ['+y.id+']').join(' ');
 };
 const houseLordDetails=findings.lords.map(f=>{
  const v=f.values;
  return (uk?'Сфера життя ':'Life area ')+v.house+' ('+sign(Number(v.sign),uk)+') → '+
   label(String(v.ruler))+' → '+(uk?'сфера життя ':'life area ')+v.locatedHouse+
   ' ('+sign(Number(v.locatedSign),uk)+') ['+f.id+']';
 });
 sections.push(header("house-lords",uk?"Зв’язки між сферами життя":"Connections between life areas",
  uk?"IX · ВЕРИФІКОВАНІ ПРАВИЛА":"IX · VERIFIED RULES",
  uk?"За традиційними правилами кожному знаку відповідає планета-управитель. Її положення створює символічний зв’язок між двома сферами життя.":"In this tradition, each sign has a ruling planet. Its position creates a symbolic connection between two life areas.",
  [uk?"Планета-управитель допомагає пов’язати теми однієї сфери з іншою. Це структурне правило традиції, а не гарантія подій. Раху й Кету в цій системі не призначаються управителями знаків.":"The ruling planet connects the themes of one area with another. This is a traditional structural rule, not a guarantee of events. This ruleset does not assign sign rulership to Rahu or Ketu.",lordStory(1),lordStory(7),lordStory(10)],
  houseLordDetails));
 sections.push(header("dignities",uk?"Особливі положення планет":"Special planetary positions",
  uk?"X · КЛАСИЧНІ ПОЛОЖЕННЯ":"X · CLASSICAL PLACEMENTS",
  uk?"Традиція вважає одні знаки більш природними, а інші — складнішими для певних планет. Це умовна класифікація, а не оцінка людини.":"The tradition considers some signs more natural and others more challenging for particular planets. This is a symbolic classification, not a judgement of a person.",
  [uk?"Цей розділ класифікує положення лише за знаком. Повна сила планет, їхні взаємні стосунки, близькість до Сонця та інші уточнення тут не розраховуються.":"This section classifies sign placements only. Full planetary strength, relationships, proximity to the Sun and other modifiers are not calculated.",dignityStory()],
  findings.dignities.map(f=>{
   const v=f.values,term=dignityLabel[String(v.dignity)]||dignityLabel.other;
   return label(f.subject)+' — '+sign(Number(v.sign),uk)+', '+(uk?'сфера життя ':'life area ')+v.house+
    ': '+term[uk?0:1]+' ['+f.id+']';
  })));
 sections.push(header("yogas",uk?"Особливі комбінації планет":"Special planetary combinations",
  uk?"XI · ПЕРЕВІРЕНІ КОМБІНАЦІЇ":"XI · VERIFIED COMBINATIONS",
  uk?"Перевірка п’яти традиційних комбінацій за чіткими правилами розташування планет.":"Five traditional combinations checked against explicit planetary-position rules.",
  [uk?"Одна з п’яти комбінацій рахується, коли Марс, Меркурій, Юпітер, Венера або Сатурн перебуває в одній із ключових сфер життя (1, 4, 7 або 10) і в традиційно сильному для нього знаку. Інші варіанти та додаткові умови тут не оцінюються.":"One of the five combinations is counted when Mars, Mercury, Jupiter, Venus or Saturn occupies one of four key life areas (1, 4, 7 or 10) and a traditionally strong sign. Other variants and modifiers are not assessed here.",yogaStory()],
  findings.yogas.length?findings.yogas.map(y=>
   yogaLabel(y.name)+' — '+label(y.planet)+', '+sign(y.sign,uk)+', '+(uk?'сфера життя ':'life area ')+y.house+
   ' ('+(uk?(y.reason==='exalted'?'екзальтація':'власний знак'):y.reason)+') ['+y.id+']'
  ):[uk?"За цими конкретними критеріями жодна з п’яти йог не сформувалася. Це не висновок про інші йоги чи життєві події.":"None of the five yogas meets these exact rules; this says nothing about other yoga families or events."]));
 sections.push(header("rule-synthesis",uk?"Що підкреслюють правила карти":"What the chart rules highlight",
  uk?"XII · ПІДСУМОК ПЕРЕВІРЕНИХ ПРАВИЛ":"XII · SUMMARY OF VERIFIED RULES",
  uk?"Пояснення складається алгоритмом з конкретних правил і завжди повторюється для тих самих даних.":"Algorithm-written interpretation based on specific rules; repeatable for identical inputs.",
  [lordStory(1),lordStory(7),lordStory(10),dignityStory(),yogaStory(),
   uk?"Цей синтез є викладом традиційних символічних відповідностей, а не доказом подій чи науковим прогнозом. Його фактичні дані не змінюються генеративною моделлю.":
   "This is an interpretation of traditional symbolic correspondences, not evidence of events or a scientific forecast. The generative model cannot alter its data."],
  [(uk?"Версія правил: ":"Ruleset: ")+RULESET_VERSION,(uk?"Перевірені факти: ":"Verified facts: ")+findings.facts.length]));
 return {sections,generatedAt:asOf+'T00:00:00.000Z',asOf,
  rulesVersion:RULESET_VERSION,rulesDigest:ruleFingerprint(chart,asOf),
  ruleFacts:findings.facts,practicalTips:practicalGuidance(chart,lang),chartSummary:(uk?"Лагна: ":"Ascendant: ")+sign(asc.sign,uk),language:lang};
}
