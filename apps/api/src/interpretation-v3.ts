import type {CalculatedChart,Graha} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_GRAHAS,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {readerClassicalContext} from './reader-classical.ts';

/** Interpretation rules are independently versioned from astronomy and Engine 2.0. */
export const INTERPRETATION_VERSION='4.0.0';
export type AstrologicalFinding={
 id:string;topic:string;ruleId:string;verifiedEvidence:string[];
 traditionalMeaning:string;supportingFactors:string[];counterFactors:string[];
 relativeImportance:number;limitations:string[];sourceIds?:string[];
};
export type ConsultationChapter={
 id:string;title:string;paragraphs:string[];insights:string[];evidence:string[];
};
export type InterpretationV3={
 version:typeof INTERPRETATION_VERSION;findings:AstrologicalFinding[];
 chapters:ConsultationChapter[];
 elements:{name:string;count:number;percentage:number}[];
 highlights:string[];method:string;
};
const signsUk=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const namesUk:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const housesUk=['особистості','цінностей і накопичень','мовлення та навичок','дому й внутрішньої опори','творчості та дітей','служіння й випробувань','партнерства','спільних ресурсів і змін','дгарми, навчання й наставників','професії та визнання','здобутків і підтримки','усамітнення та внутрішнього життя'];
const housesEn=['identity','family values and assets','speech and skills','home and inner foundations','creativity','service and challenges','partnership','shared assets and change','dharma and learning','work and public standing','gains and networks','solitude and inner life'];
const themesUk:Record<string,string>={
 Sun:'воля, авторитет і життєвий напрям',Moon:'емоційне життя та внутрішня безпека',
 Mars:'рішучість і сміливість діяти',Mercury:'мислення, мова й здатність навчатися',
 Jupiter:'мудрість, дгарма й наставництво',Venus:'близькість, взаємність і естетика',
 Saturn:'дисципліна, час і відповідальність',Rahu:'незвичний досвід',Ketu:'відсторонення'
};
const themesEn:Record<string,string>={
 Sun:'purpose and authority',Moon:'inner life and emotional security',
 Mars:'initiative and courage',Mercury:'reasoning and language',Jupiter:'wisdom and mentorship',
 Venus:'affection and reciprocity',Saturn:'discipline and responsibility',
 Rahu:'unfamiliar experience',Ketu:'detachment'
};
const meaningfulLimitations=['Traditional interpretation, not a confirmed life event.'];
const distinct=<T>(values:T[])=>[...new Set(values)];

export function analyzeAstrologicalFindings(chart:CalculatedChart,lang:'uk'|'en',asOf:string):AstrologicalFinding[]{
 const rules=ruleFindings(chart); // also validates all nine D1 whole-sign grahas and longitudes
 if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isFinite(Date.parse(asOf+'T12:00:00Z')))
  throw new Error('Invalid reference date');
 const uk=lang==='uk',planet=(n:string)=>uk?namesUk[n]||n:n;
 const area=(h:number)=>uk?housesUk[h-1]:housesEn[h-1];
 const sign=(n:number)=>uk?signsUk[n-1]:chart.d1.find(p=>p.sign===n)?.signName||['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][n-1];
 const get=(name:string)=>{const p=chart.d1.find(x=>x.name===name);if(!p)throw new Error('Missing '+name);return p;};
 const lord=(h:number)=>rules.lords.find(f=>f.values.house===h)!;
 const ruler=(h:number)=>planet(String(lord(h).subject));
 const at=(h:number)=>Number(lord(h).values.locatedHouse);
 const ev=(p:Graha)=>['D1.'+p.name+'.sign='+p.sign,'D1.'+p.name+'.house='+p.house];
 const findings:AstrologicalFinding[]=[];
 const add=(id:string,topic:string,ruleId:string,meaning:string,evidence:string[],supports:string[],counter:string[],importance:number,limitations=meaningfulLimitations)=>{
  findings.push({id,topic,ruleId,traditionalMeaning:meaning,verifiedEvidence:distinct(evidence),supportingFactors:distinct(supports),
   counterFactors:distinct(counter),relativeImportance:importance,limitations,
   sourceIds:ruleId.startsWith('PARASHARI_FUNCTIONAL')||ruleId.startsWith('PARASHARI_KENDRA_TRIKONA')?
    ['RULESET-D1-2.0.0','LAGHU-PARASHARI-JHA-1900']:['RULESET-D1-2.0.0']});
 };
 const moon=get('Moon'),sun=get('Sun'),mars=get('Mars'),saturn=get('Saturn'),venus=get('Venus');
 const confirmedYogas=rules.yogas;
 const yogasText=confirmedYogas.length?(uk?' За підтвердженими умовами йоги: ':' Verified yoga conditions: ')+confirmedYogas.map(y=>y.name+' ('+planet(y.planet)+', '+y.house+(uk?'-й дім':'th house')+')').join('; ')+'.':'';
 const date=Date.parse(asOf+'T12:00:00Z');
 const major=chart.dasha.find(d=>Date.parse(d.start)<=date&&date<Date.parse(d.end));
 const minor=major?.antardashas?.find(d=>Date.parse(d.start)<=date&&date<Date.parse(d.end));
 add('ascendant','portrait','PARASHARI_SIGN_LORDSHIP',
  uk?'Лагна у '+sign(chart.ascendant.sign)+' відкриває карту, а її управитель '+ruler(1)+' через дім '+at(1)+' пов’язує особистий шлях із темою '+area(at(1))+'.':
  'The ascendant in '+sign(chart.ascendant.sign)+' and its lord '+ruler(1)+' in house '+at(1)+' connect identity with '+area(at(1))+'.',
  ['ascendant.sign='+chart.ascendant.sign,...lord(1).evidence],
  [lord(1).id,'D1.Moon.house='+moon.house],[],95);
 add('moon','portrait','NAKSHATRA_D1',
  uk?'Місяць у '+sign(moon.sign)+', у домі '+moon.house+', накшатра '+moon.nakshatra+', пада '+moon.pada+', уточнює емоційну та внутрішню сторону прочитання.':
  'Moon in '+sign(moon.sign)+', house '+moon.house+', nakshatra '+moon.nakshatra+', pada '+moon.pada+', refines the inner and emotional portrait.',
  [...ev(moon),'D1.Moon.nakshatra='+moon.nakshatra,'D1.Moon.pada='+moon.pada],
  ['D1.Sun.house='+sun.house],[],85);
 const cohorts=Array.from({length:12},(_,index)=>({house:index+1,planets:CLASSICAL_GRAHAS.filter(n=>get(n).house===index+1)}))
  .sort((a,b)=>b.planets.length-a.planets.length||a.house-b.house);
 const cluster=cohorts[0];
 if(cluster.planets.length>=2){
  add('concentration','configuration','WHOLE_SIGN_CONJUNCTION',
   uk?'У '+cluster.house+'-му домі ('+area(cluster.house)+') зібралися '+cluster.planets.map(planet).join(', ')+'. Тут одночасно взаємодіють '+cluster.planets.map(n=>themesUk[n]).join('; ')+'.'+yogasText:
   'House '+cluster.house+' ('+area(cluster.house)+') gathers '+cluster.planets.map(planet).join(', ')+', combining '+cluster.planets.map(n=>themesEn[n]).join('; ')+'.'+yogasText,
   [...cluster.planets.flatMap(n=>ev(get(n))),...confirmedYogas.flatMap(y=>y.evidence)],cluster.planets.map(n=>'D1.'+n+'.house='+cluster.house),[],98);
 }else{
  add('distributed','configuration','PARASHARI_SIGN_LORDSHIP',
   uk?'У карті немає великого скупчення класичних грах. Замість вигаданого стеліуму головний сюжет формують управителі дев’ятого та десятого домів: '+ruler(9)+' і '+ruler(10)+'.':
   'There is no major classical graha cluster. The ninth and tenth lords, '+ruler(9)+' and '+ruler(10)+', carry the main structural emphasis.',
   [...lord(9).evidence,...lord(10).evidence],[lord(9).id,lord(10).id],[],88);
 }
 add('mars-saturn','tensions',mars.house===saturn.house?'WHOLE_SIGN_CONJUNCTION':'SEPARATE_D1_HOUSES',
  mars.house===saturn.house?
  (uk?'Марс і Сатурн разом у домі '+mars.house+': порив до дії зустрічає дисципліну й необхідність виваженого темпу. Це центральна внутрішня суперечність, яку не можна читати як дві незалежні планети.':
   'Mars and Saturn share house '+mars.house+': the impulse to act encounters discipline and measured pacing. Their combination is not two unrelated placements.'):
  (uk?'Марс у домі '+mars.house+', Сатурн у домі '+saturn.house+'. Прагнення діяти та потреба у структурі стосуються різних життєвих сфер, тому прямого з’єднання між ними немає.':
   'Mars occupies house '+mars.house+' and Saturn house '+saturn.house+'. Action and discipline arise in separate life domains; no conjunction is inferred.'),
  [...ev(mars),...ev(saturn)],['D1.Mars.house='+mars.house,'D1.Saturn.house='+saturn.house],
  mars.house===saturn.house?[]:['No D1 conjunction'],93);
 add('partnership','relationships','PARASHARI_SIGN_LORDSHIP',
  uk?'Сьомим домом керує '+ruler(7)+' із дому '+at(7)+'. Венера у '+sign(venus.sign)+' в домі '+venus.house+', а Місяць у домі '+moon.house+' показують, як взаємність і потреба у близькості можуть мати різні акценти.':
  'The seventh lord '+ruler(7)+' sits in house '+at(7)+'. Venus in '+sign(venus.sign)+' (house '+venus.house+') and Moon in house '+moon.house+' add distinct themes of affection and emotional security.',
  [...lord(7).evidence,...ev(venus),...ev(moon), 'D9.ascendant.sign='+chart.lagnaD9.sign,'D9.Venus.house='+chart.d9.find(g=>g.name==='Venus')!.house],
  [lord(7).id,'D1.Venus.house='+venus.house,'D9.ascendant.sign='+chart.lagnaD9.sign],[],90);
 add('vocation','career','PARASHARI_SIGN_LORDSHIP',
  uk?'Управитель десятого дому '+ruler(10)+' перебуває у домі '+at(10)+' ('+area(at(10))+'). Дашамша D10 має лагну у '+sign(chart.lagnaD10.sign)+'; її показники уточнюють професійну тему, не замінюючи D1.':
  'The tenth lord '+ruler(10)+' occupies house '+at(10)+' ('+area(at(10))+'). D10 has its ascendant in '+sign(chart.lagnaD10.sign)+' and supplements rather than replaces D1.',
  [...lord(10).evidence,...lord(9).evidence,'D10.ascendant.sign='+chart.lagnaD10.sign,'D10.'+String(lord(10).subject)+'.house='+chart.d10.find(g=>g.name===String(lord(10).subject))!.house],
  [lord(10).id,'D10.ascendant.sign='+chart.lagnaD10.sign],[],91);
 add('resources','resources','PARASHARI_SIGN_LORDSHIP',
  uk?'Управитель другого дому '+ruler(2)+' міститься в домі '+at(2)+'; управитель одинадцятого '+ruler(11)+' — у домі '+at(11)+'. Разом це зв’язує особисті ресурси, результати праці та коло підтримки.':
  'The second lord '+ruler(2)+' occupies house '+at(2)+'; the eleventh lord '+ruler(11)+' is in house '+at(11)+'. Together they connect resources with gains and networks.',
  [...lord(2).evidence,...lord(11).evidence],[lord(2).id,lord(11).id],[],78);
 if(major) add('active-dasha','timing','VIMSHOTTARI_VERIFIED_PERIOD',
  (uk?'Станом на '+asOf+' триває махадаша '+planet(major.lord)+(minor?' та антардаша '+planet(minor.lord):'')+'. Управитель головного періоду у домі '+get(major.lord).house+
   (minor?'; управитель підперіоду — у домі '+get(minor.lord).house:'')+'. Часові межі взято з розрахунку.':
   'As of '+asOf+', '+planet(major.lord)+' mahadasha'+(minor?' and '+planet(minor.lord)+' antardasha':'')+' are active. The major ruler occupies house '+get(major.lord).house+'.'),
  ['dasha.major='+major.lord, 'dasha.start='+major.start,'dasha.end='+major.end,...ev(get(major.lord)),
   ...(minor?['dasha.minor='+minor.lord,'dasha.minor.start='+minor.start,'dasha.minor.end='+minor.end,...ev(get(minor.lord))]:[])],
  ['D1.'+major.lord+'.house='+get(major.lord).house,...(minor?['D1.'+minor.lord+'.house='+get(minor.lord).house]:[])],[],84);
 // A8 Reader v4: functional lordship is a separate, chart-specific rule family.
 // A sign's generic planet archetype NEVER replaces its actual house ownership.
 const context=readerClassicalContext(chart,asOf);
 const topicalHouse=(houses:number[])=>houses.includes(7)?'relationships':
  houses.includes(10)||houses.includes(5)||houses.includes(9)?'career':
  houses.includes(2)||houses.includes(11)?'resources':
  houses.includes(1)||houses.includes(4)?'portrait':'tensions';
 for(const role of context.functional){
  const roleLabel=role.roles.includes('yogakaraka')?
   (uk?'йогакарака — управитель кендри й трикони':'yogakaraka, joining a kendra and a trikona'):
   (uk?'управитель домів':'ruler of houses');
  const listed=role.houses.join(', ');
  const dignity=uk?{exalted:'в екзальтації',debilitated:'у падінні',own:'у власному знаку',other:'без особливого статусу за знаком'}[role.dignity]:
   {exalted:'exalted',debilitated:'debilitated',own:'in own sign',other:'without a special sign dignity'}[role.dignity];
  const main=uk?
   planet(role.graha)+': '+roleLabel+' '+listed+'; положення у домі '+role.locatedHouse+
    ', '+(dignity||'невизначений стан знака')+'. Трактування залежить від цих домів, а не від загального образу планети.':
   role.graha+': '+roleLabel+' '+listed+', located in house '+role.locatedHouse+
    ', '+(dignity||'unknown sign status')+'. Interpret its actual owned houses rather than generic planet keywords.';
  add('functional-'+role.graha.toLowerCase(),topicalHouse(role.houses),'PARASHARI_FUNCTIONAL_LORDSHIP',
   main,role.evidence,[...role.roles,'Houses '+listed],
   role.dignity==='debilitated'?['debilitated in the natal sign']:[],role.roles.includes('yogakaraka')?99:role.houses.includes(1)?94:81,
   [uk?'Це правило про управління за знаком; ступеневу силу та скасування падіння не розраховано.':
    'Sign-level ownership only; no inferred degree-strength or debilitation cancellation.']);
 }
 if(context.yogakarakas.length){
  for(const graha of context.yogakarakas){
   const rule=context.functional.find(f=>f.graha===graha)!;
   add('yogakaraka-'+graha.toLowerCase(),'configuration','PARASHARI_KENDRA_TRIKONA_LORDSHIP',
    uk?planet(graha)+' керує '+rule.houses.join('-м і ')+
     '-м домами: поєднання управління триконою та кендрою називають йогакаракою. У D1 планета перебуває в домі '+rule.locatedHouse+'.':
     graha+' rules houses '+rule.houses.join(' and ')+
     ', combining kendra and trikona lordships as a yogakaraka. Its D1 house is '+rule.locatedHouse+'.',
    rule.evidence,[...rule.roles,'yogakaraka_'+graha],
    rule.dignity==='debilitated'?['Natal sign debilitation needs careful contextual review']:[],100);
  }
 }
 // No evidence silently disappears merely because the first eight rules were dominant.
 // The model selector narrows per-topic input separately; the UI keeps the full ledger.
 return findings.sort((a,b)=>b.relativeImportance-a.relativeImportance||a.id.localeCompare(b.id)).slice(0,24);
}
export function buildInterpretationV3(chart:CalculatedChart,lang:'uk'|'en',asOf='2026-10-20'):InterpretationV3{
 const uk=lang==='uk',findings=analyzeAstrologicalFindings(chart,lang,asOf);
 const rules=ruleFindings(chart);
 const get=(name:string)=>chart.d1.find(p=>p.name===name)!;
 const planet=(name:string)=>uk?namesUk[name]||name:name;
 const area=(house:number)=>uk?housesUk[house-1]:housesEn[house-1];
 const lord=(h:number)=>rules.lords.find(r=>r.values.house===h)!;
 const at=(h:number)=>Number(lord(h).values.locatedHouse);
 const sign=(n:number)=>uk?signsUk[n-1]:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][n-1];
 const text=(id:string)=>findings.find(f=>f.id===id)?.traditionalMeaning||'';
 const evidence=(ids:string[])=>distinct(findings.filter(f=>ids.includes(f.id)).flatMap(f=>f.verifiedEvidence));
 const chapter=(id:string,ua:string,en:string,paragraphs:string[],findingIds:string[]):ConsultationChapter=>({
  id,title:uk?ua:en,paragraphs:paragraphs.filter(Boolean),insights:[],
  evidence:distinct([...evidence(findingIds),...findings.filter(f=>f.topic===id||(id==='configuration'&&f.id.startsWith('yogakaraka'))).flatMap(f=>f.verifiedEvidence)])
 });
 const primary=findings.find(f=>f.id==='concentration'||f.id==='distributed')!;
 const functional=readerClassicalContext(chart,asOf);
 const yogaSummary=functional.yogakarakas.map(g=>findings.find(f=>f.id==='yogakaraka-'+g.toLowerCase())!.traditionalMeaning).join(' ');
 const dates=Date.parse(asOf+'T12:00:00Z');
 const active=chart.dasha.find(d=>Date.parse(d.start)<=dates&&dates<Date.parse(d.end));
 const minor=active?.antardashas?.find(d=>Date.parse(d.start)<=dates&&dates<Date.parse(d.end));
 const relationship=uk?
  'Навамша D9 із лагною у '+sign(chart.lagnaD9.sign)+' дає другий погляд на зрілість союзу. Венера у D9 стоїть у домі '+getD(chart.d9,'Venus').house+
  '. Найважливіше — зіставити її з управителем сьомого дому D1, а не виводити долю шлюбу з одного знака.':
  'Navamsha D9 rises in '+sign(chart.lagnaD9.sign)+' and places Venus in D9 house '+getD(chart.d9,'Venus').house+
  '. It clarifies partnership alongside D1, rather than deciding marriage from a single sign.';
 const workDharmaLinked=at(10)===9||at(9)===10||at(9)===at(10)||String(lord(9).subject)===String(lord(10).subject);
 const career=uk?
  'Управитель дев’ятого дому '+planet(String(lord(9).subject))+' перебуває у домі '+at(9)+
  ', а управитель десятого дому '+planet(String(lord(10).subject))+' — у домі '+at(10)+'. '+
  (workDharmaLinked?'Положення управителів пов’язують у цій карті теми професії та дгарми; їх слід читати разом. ':
   'Це різні астрологічні показники: не приписуємо їм прямого взаємозв’язку без підтвердження. ')+
  'У Дашамші D10 управитель десятого дому D1 '+planet(String(lord(10).subject))+
  ' перебуває у домі '+getD(chart.d10,String(lord(10).subject)).house+'.':
  'The ninth-house ruler '+planet(String(lord(9).subject))+' occupies house '+at(9)+
  ', while the tenth-house ruler '+planet(String(lord(10).subject))+' occupies house '+at(10)+'. '+
  (workDharmaLinked?'These verified placements link vocation with dharma and deserve a joint reading. ':
   'These are separate indicators; no direct connection is claimed without verified evidence. ')+
  'In D10 the D1 tenth-house ruler '+planet(String(lord(10).subject))+
  ' occupies house '+getD(chart.d10,String(lord(10).subject)).house+'.';
 const chapters=[
  chapter('portrait','Ваш астрологічний портрет','Your astrological portrait',
   [text('ascendant'),text('moon')+(uk?' Сонце у домі '+get('Sun').house+' додає тему '+area(get('Sun').house)+'. Особистий напрям і внутрішня потреба не завжди розвиваються в одному ритмі.':
    ' Sun in house '+get('Sun').house+' adds the life topic of '+area(get('Sun').house)+'. Outward direction and inner needs need not follow the same rhythm.')],['ascendant','moon']),
  chapter('configuration','Головна конфігурація карти','The defining configuration',
   [text(primary.id),uk?'Положення управителя дев’ятого дому '+planet(String(lord(9).subject))+' у домі '+at(9)+' допомагає зрозуміти, як цей центр карти пов’язаний з питаннями переконань та навчання.':
   'The ninth lord '+planet(String(lord(9).subject))+' in house '+at(9)+' adds the wider context of worldview and study.',yogaSummary],[primary.id,'ascendant']),
  chapter('tensions','Внутрішні суперечності й особисті сили','Inner tensions and personal strengths',
   [text('mars-saturn'),uk?'Порівнюючи волю Сонця у домі '+get('Sun').house+' з переживаннями Місяця у домі '+get('Moon').house+
    ', ми бачимо два різні способи реагувати на життєві завдання. Така відмінність може стати ресурсом, коли дія не пригнічує потреби у відновленні.':
    'Sun in house '+get('Sun').house+' and Moon in house '+get('Moon').house+' indicate different dimensions of outward choices and inner restoration.'],['mars-saturn','moon']),
  chapter('relationships','Кохання, близькість і партнерство','Love, intimacy and partnership',
   [text('partnership'),relationship],['partnership']),
  chapter('career','Професія, здібності й покликання','Profession, abilities and vocation',
   [text('vocation'),career,yogaSummary],['vocation','ascendant']),
  chapter('resources','Ресурси та матеріальний шлях','Resources and the material path',
   [text('resources'),uk?'Тут важливо розрізняти те, що людина вміє накопичувати, і те, що приходить через професійні результати й оточення. Положення управителів задають контекст для читання цих двох напрямів, але не визначають суму майбутніх доходів.':
    'The second and eleventh lords distinguish resources held from gains linked to work and community. They do not determine future earnings.'],['resources']),
  chapter('timing','Ваш життєвий етап зараз','Your current planetary period',
   [text('active-dasha')||(uk?'Для '+asOf+' активний період не встановлено у наданому розрахунку.':'No active period is available for '+asOf+'.'),
    active?(uk?'Розглядати цей період слід через доми його управителів, а не лише через загальні значення планет. '+planet(active.lord)+' пов’язаний із темою '+area(get(active.lord).house)+
     (minor?'; '+planet(minor.lord)+' уточнює тему '+area(get(minor.lord).house):'')+'.':
      planet(active.lord)+' directs attention toward '+area(get(active.lord).house)+(minor?'; '+planet(minor.lord)+' adds '+area(get(minor.lord).house):'')+'.'):''],['active-dasha']),
  chapter('conclusion','Головний висновок','The central insight',
   [uk?'Три опори цього прочитання — лагна й її управитель, головна конфігурація та взаємодія сьомого й десятого домів. Саме їхнє поєднання, а не окрема характеристика знака, формує неповторний малюнок натальної карти.':
    'The three anchors are the ascendant and its lord, the defining configuration, and the relationship between the seventh and tenth houses.',
    uk?'Управитель партнерства '+planet(String(lord(7).subject))+' у домі '+at(7)+' та управитель професії '+planet(String(lord(10).subject))+' у домі '+at(10)+
     ' описують різні шляхи реалізації. '+(active?'Нинішня махадаша '+planet(active.lord)+' привертає особливу увагу до дому '+get(active.lord).house+'.':'Часовий прогноз без активної даші не додаємо.'):
     'The seventh lord in house '+at(7)+' and tenth lord in house '+at(10)+' shape two dimensions of life. '+(active?'The current '+planet(active.lord)+' period further emphasizes house '+get(active.lord).house+'.':'No unsupported timing claim is added.')],
   ['ascendant',primary.id,'partnership','vocation','active-dasha'])
 ];
 const counts=[0,0,0,0];for(const name of CLASSICAL_GRAHAS)counts[(get(name).sign-1)%4]++;
 const labels=uk?['Вогонь','Земля','Повітря','Вода']:['Fire','Earth','Air','Water'];
 return {version:INTERPRETATION_VERSION,findings,chapters,
  elements:counts.map((count,i)=>({name:labels[i],count,percentage:Math.round(count/7*100)})),
  highlights:[text(primary.id),text('ascendant'),text('vocation')].map(t=>t.slice(0,280)),
  method:uk?'Парашарі Джйотіш: перевірені D1, управителі домів, накшатра, D9, D10 і Вімшоттарі. Версія синтезу '+INTERPRETATION_VERSION+'. Стихії наведено лише як статистику.':
   'Parashari Jyotish: verified D1, house lords, nakshatra, D9, D10 and Vimshottari. Narrative version '+INTERPRETATION_VERSION+'. Elements are technical statistics only.'};
}
function getD(positions:Graha[],name:string){
 const graha=positions.find(g=>g.name===name);
 if(!graha)throw new Error('Missing divisional chart graha '+name);
 return graha;
}
