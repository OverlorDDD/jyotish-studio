/** Additive N6.1 timing interpretation. No changes to Reader 10 life chapters or astronomical calculations. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import type {Reader10Chapter} from './reader10.ts';
import {buildReader10Facts,PLANETS,aspectedHouses,signLord,dignityOf,type Planet,type PlanetFact} from './reader10-facts.ts';
import {PLANET_NAME,SIGN_NAME} from './reader10-texts.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
type Lang='uk'|'en';
const topics=[
 ['personal decisions and independence','власних рішеннях та самостійності'],
 ['income, savings and family resources','доходах, заощадженнях і сімейних ресурсах'],
 ['skills, communication and initiative','навичках, спілкуванні та ініціативі'],
 ['home, family and a sense of stability','домі, родині та відчутті стабільності'],
 ['study, creativity and care for the next generation','навчанні, творчості й турботі про наступне покоління'],
 ['daily responsibilities, service and problem-solving','щоденних обов’язках, служінні й розв’язанні проблем'],
 ['partnership and mutual commitments','партнерстві та взаємних зобов’язаннях'],
 ['trust, shared responsibilities and change','довірі, спільній відповідальності та змінах'],
 ['education, mentors and your outlook on life','освіті, наставниках і життєвому світогляді'],
 ['career and professional responsibility','кар’єрі та професійній відповідальності'],
 ['community, long-term aims and results','спільноті, довгострокових цілях і результатах'],
 ['rest, private life, distance and expenditure','відновленні, особистому просторі, віддаленні та витратах']
] as const;
const practices:Record<Planet,readonly [string,string]>={
 Sun:['Clarify which decisions are genuinely yours to make, and where responsibility needs to be shared.','Варто розрізняти рішення, за які відповідаєте саме ви, і ті, де відповідальність треба розділити.'],
 Moon:['Give emotional needs room in your decisions rather than reacting only to immediate changes in mood.','Зважайте на власні емоційні потреби, але не приймайте важливих рішень лише під впливом миттєвого настрою.'],
 Mars:['Direct initiative into a concrete task instead of treating every obstacle as a confrontation.','Спрямовуйте рішучість на конкретне завдання, не перетворюючи кожну перешкоду на протистояння.'],
 Mercury:['Clarify agreements and check assumptions through learning, writing or conversation.','Уточнюйте домовленості й перевіряйте припущення через навчання, письмові нотатки або розмову.'],
 Jupiter:['Compare your broader goals with what experience actually teaches you.','Зіставляйте великі цілі з тим, чого насправді вчить вас досвід.'],
 Venus:['Notice whether an arrangement genuinely serves both sides, not merely whether it feels agreeable.','Звертайте увагу на те, чи домовленість справді влаштовує обидві сторони, а не лише здається приємною.'],
 Saturn:['Build sustainable commitments through steady effort rather than measuring progress by immediate results.','Вибудовуйте довготривалі зобов’язання поступово, не вимірюючи поступ лише негайними результатами.'],
 Rahu:['Explore unfamiliar possibilities while checking motives, limits and the practical cost of ambition.','Досліджуйте незнайомі можливості, але перевіряйте мотиви, межі та реальну ціну амбіцій.'],
 Ketu:['Distinguish what no longer serves your aims from responsibilities that still deserve attention.','Розрізняйте те, що вже не служить вашим цілям, і обов’язки, які все ще потребують уваги.']
};
const interactions:Partial<Record<Planet,readonly [string,string]>>={
 Mars:['Initiative and impatience can pull in the same direction; make space to consider a response before acting.','Ініціатива й нетерпіння можуть посилювати одне одного; залишайте час обдумати реакцію перед дією.'],
 Jupiter:['Learning and considered advice offer a counterweight to narrow or immediate concerns.','Навчання й обдумана порада допомагають не зводити ситуацію до її негайних труднощів.'],
 Saturn:['Responsibilities and the need for a sustainable pace deserve particular attention.','Особливої уваги потребують відповідальність і темп, який можна підтримувати довго.'],
 Venus:['Consider reciprocity and the effect of choices on close relationships.','Зважайте на взаємність і вплив рішень на близькі стосунки.'],
 Mercury:['Conversation and careful clarification can help distinguish facts from assumptions.','Розмова й уважне уточнення допомагають відрізняти факти від припущень.']
};
const join=(xs:string[],uk:boolean)=>xs.length<2?xs.join(''):xs.slice(0,-1).join(', ')+(uk?' та ':' and ')+xs[xs.length-1];
export function timingChapter(chart:CalculatedChart,lang:Lang,asOf:string):Reader10Chapter{
 const uk=lang==='uk',l=uk?1:0,at=Date.parse(asOf+'T12:00:00Z'),f=buildReader10Facts(chart);
 const major=chart.dasha.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
 const minor=major?.antardashas?.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
 const title=uk?'Поточний період життя':'Current life period';
 const describe=(lord:string)=>PLANETS.includes(lord as Planet)?f.planets[lord as Planet]:null;
 const a=major&&describe(major.lord),b=minor&&describe(minor.lord);
 if(!major||!minor||!a||!b)return {id:'timing',title,lead:uk?'Для цієї дати немає підтвердженої пари періодів.':'No verified pair of periods is available for this date.',paragraphs:[uk?'Не робимо висновків про поточний період без обох розрахованих управителів.':'No current-period inference without both calculated rulers.'],details:null};
 const topic=(h:number)=>topics[h-1][l],name=(n:Planet)=>PLANET_NAME[n][lang],period=(p:{start:string;end:string},n:Planet)=>name(n)+' '+p.start.slice(0,10)+' — '+p.end.slice(0,10);
 const dignity=(p:PlanetFact)=>p.dignity==='own'?(uk?'власний знак':'own sign'):p.dignity==='exalted'?(uk?'екзальтація':'exaltation'):p.dignity==='debilitated'?(uk?'знак падіння':'debilitation'):(uk?'без екзальтації, падіння чи власного знака':'neither own sign, exaltation nor debilitation');
 const role=(p:PlanetFact)=>p.rules.length?(uk?' Його інші завдання можуть проявлятися у '+join(p.rules.filter(h=>h!==p.house).map(topic),uk)+'.':' This cycle also brings attention to '+join(p.rules.filter(h=>h!==p.house).map(topic),uk)+'.'):'';
 const roleText=(p:PlanetFact)=>p.rules.some(h=>h!==p.house)?role(p):'';
 const detail=(p:PlanetFact)=>name(p.name)+' — '+SIGN_NAME[p.sign-1][lang]+', '+(uk?p.house+'-й дім':'house '+p.house)+'; '+dignity(p)+(p.rules.length?(uk?'; управитель домів ':'; rules houses ')+p.rules.join(', '):'')+'.';
 const relation=a.name===b.name?'same_planet':a.house===b.house?'same_house':aspectedHouses(a.name,a.house).includes(b.house)||aspectedHouses(b.name,b.house).includes(a.house)?'aspect':signLord(a.sign)===b.name||signLord(b.sign)===a.name?'dispositor':'distinct';
 const relate=relation==='same_planet'||relation==='same_house'?(uk?'Обидва цикли підкреслюють одну сферу. Замість розпорошувати зусилля, оберіть пріоритет, якому готові приділяти увагу послідовно.':'Both cycles emphasize the same area. Rather than spreading your efforts thinly, choose a priority you can sustain.'):
  (uk?'Ключове завдання — поєднати увагу до '+topic(a.house)+' з увагою до '+topic(b.house)+'. Не варто ставити одну з цих сфер у залежність від миттєвих результатів в іншій.':'The central task is to balance attention to '+topic(a.house)+' with attention to '+topic(b.house)+'. Avoid making either area depend entirely on immediate results in the other.');
 // Use a grammatically stable sentence rather than concatenating nominative fragments after a preposition.
 let balance=relation==='same_planet'||relation==='same_house'?relate:uk?'Ключове завдання — знайти баланс між двома сферами: з одного боку, увага зосереджується на '+topic(a.house)+', з іншого — на '+topic(b.house)+'. Не вимагайте негайного результату в одній сфері за рахунок іншої.':relate;
 if(relation==='aspect')balance+=uk?' За цим прочитанням ці дві сфери безпосередньо пов’язані: варто враховувати, як зміни в одній позначаються на іншій.':'In this traditional reading the two areas are directly linked; consider how changes in one affect the other.';
 if(relation==='dispositor')balance+=uk?' Одне з цих завдань залежить від іншого, тому варто розглядати їх разом, а не як незалежні.':'One of these tasks depends on the other, so consider them together rather than independently.';
 if(a.name==='Saturn'&&b.name==='Moon')balance+=uk?' Тут особливо важливо не плутати відданість своїм обов’язкам із потребою ігнорувати власні почуття.':'In particular, do not confuse commitment to your responsibilities with ignoring your own feelings.';
 const others=PLANETS.map(n=>f.planets[n]).filter(p=>p.name!==a.name&&p.name!==b.name&&(p.house===b.house||aspectedHouses(p.name,p.house).includes(b.house)));
 const meaningful=others.filter(p=>interactions[p.name]).sort((x,y)=>['Mars','Saturn','Jupiter','Venus','Mercury'].indexOf(x.name)-['Mars','Saturn','Jupiter','Venus','Mercury'].indexOf(y.name)).slice(0,2);
 const interactionText=meaningful.map(p=>interactions[p.name]![l]).join(' ');
 const technical=others.map(p=>name(p.name)+(p.house===b.house?(uk?' у тому самому домі, що й ':' shares a house with '):(uk?' аспектує ':' aspects '))+name(b.name)+'.');
 const co=PLANETS.map(n=>f.planets[n]).filter(p=>p.name!==a.name&&p.house===a.house);
 const linked=Array.from(new Set(co.flatMap(p=>p.rules))).filter(h=>h!==a.house&&!a.rules.includes(h)&&h!==b.house&&!b.rules.includes(h)).slice(0,3);
 const cluster=co.length>=2&&linked.length?(uk?' Через інші управителі в цьому домі цей цикл може відбиватися також на '+join(linked.map(topic),uk)+'.':'This long-term theme also connects several other areas: attention may turn to '+join(linked.map(topic),uk)+'.'):'';
 const source=verifiedVargaSource(chart);
 const extra:string[]=[];
 for(const div of [9,10]){
  const v=source?.charts.find(c=>c.division===div);if(!v)continue;
  for(const n of [...new Set([a.name,b.name])]){
   const p=v.planets.find(q=>q.name===n);if(!p)continue;
   extra.push('D'+div+': '+name(n)+', '+SIGN_NAME[p.sign-1][lang]+', '+(uk?p.house+'-й дім':'house '+p.house)+', '+dignity({ ...f.planets[n],dignity:dignityOf(n,p.sign) })+'.');
  }
 }
 const indirect=others.filter(p=>p.house===a.house||p.name===signLord(a.sign));
 const bridge=indirect.map(p=>name(p.name)+(p.house===a.house?(uk?' у домі управителя махадаші':' shares the major ruler’s house'):(uk?' — диспозитор управителя махадаші':' disposits the major ruler'))+(p.house===b.house?(uk?' та в домі управителя антардаші':' and shares the minor ruler’s house'):(uk?' та аспектує управителя антардаші':' and aspects the minor ruler'))).join('; ');
 const relationFact=(uk?'Зв’язок управителів періодів: ':'Relationship between period rulers: ')+
  (relation==='same_planet'?(uk?'та сама планета':'same planet'):relation==='same_house'?(uk?'той самий дім D1':'same D1 house'):relation==='aspect'?(uk?'аспект D1':'D1 aspect'):relation==='dispositor'?(uk?'диспозиторний зв’язок D1':'D1 dispositor link'):(uk?'різні сфери D1; прямого аспекту між ними за цією методикою немає':'distinct D1 sectors; no direct aspect in this method'))+'.'+(bridge?(uk?' Опосередковані зв’язки: ':' Indirect links: ')+bridge+'.':'');
 return {id:'timing',title,lead:uk?'Нинішній період пропонує зосередитися на '+topic(a.house)+'.':'This stage brings particular attention to '+topic(a.house)+'.',
 paragraphs:[
  (uk?'Довгий життєвий цикл робить наголос на ':'During the longer life cycle, attention centers on ')+topic(a.house)+'.'+roleText(a)+cluster+' '+practices[a.name][l],
  (uk?'Поточний підперіод робить особливо важливим питання, як знайти опору у ':'The current shorter cycle puts particular weight on ')+(uk?topic(b.house)+'.':topic(b.house)+'.')+roleText(b)+' '+practices[b.name][l],
  balance+(interactionText?' '+interactionText:''),
  uk?'Спробуйте визначити одну довгострокову домовленість або справу, якій потрібна послідовність, і один конкретний крок на найближчі тижні. Зіставте їх із власними обставинами, а не сприймайте цикл як обіцянку події.':'Identify one long-term commitment that needs consistent attention and one concrete step for the coming weeks. Compare these themes with your circumstances rather than treating the cycle as a promise of events.'
 ],
 details:{paragraphs:[(uk?'Махадаша: ':'Mahadasha: ')+period(major,a.name)+'.',(uk?'Антардаша: ':'Antardasha: ')+period(minor,b.name)+'.',detail(a),detail(b),relationFact,
  ...(co.length?[(uk?'У домі управителя махадаші також: ':'Other occupants of the major ruler’s house: ')+co.map(p=>name(p.name)).join(', ')+'.']:[]),
  ...technical,...extra],
 basis:(uk?'Основа: ':'Basis: ')+asOf+'; '+detail(a)+' '+detail(b),links:[{label:uk?'Вімшоттарі: життєві цикли':'Vimshottari life cycles',path:'pedia/vimshottari-life-cycle'}]}};
}
