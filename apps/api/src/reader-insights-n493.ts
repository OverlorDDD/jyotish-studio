/**
 * N4.9.3 — prioritized traditional (NOT empirically predictive) insight engine.
 *
 * A finding needs at least two independently stated *facts*, but two vargas
 * containing the same planet never count as two independent life outcomes.
 * Ranked by interpretive specificity; no invented Shadbala, cancellation,
 * drishti, predictive life events or birth-time-certification for D60.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
export const N493_INSIGHTS_VERSION='n493-ranked-patterns-1.0.0' as const;
export type N493Insight={
 id:string;division:number;relatedDivisions:number[];planet:string;
 headline:string;teaser:string;interpretation:string;attention:string;
 prominence:number;kind:'support'|'tension'|'context';proof:string[];
};
export type N493Overview={
 version:typeof N493_INSIGHTS_VERSION;
 insights:N493Insight[];summary:string;
};
type Lang='uk'|'en';
const UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',
 Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const signsUk=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const signsEn=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const houseTopicsUk=['особисті рішення','матеріальні ресурси','навички та спілкування',
 'дім і внутрішня опора','творчий розвиток','щоденна практика й складні задачі',
 'партнерські домовленості','довіра та спільні ресурси','освіта, наставництво та світогляд',
 'професійна роль','здобутки та спільноти','усамітнення й відновлення'];
const houseTopicsEn=['personal initiative','resources and speech','skills and communication',
 'home and stability','creative development','daily practice and problem-solving',
 'partnership','trust and shared resources','learning and worldview',
 'professional responsibility','gains and community','solitude and recovery'];
const desc=(house:number,uk:boolean)=>(uk?houseTopicsUk:houseTopicsEn)[house-1];
const name=(p:string,uk:boolean)=>uk?UK[p]||p:p;
const sign=(n:number,uk:boolean)=>(uk?signsUk:signsEn)[n-1];
const strong=(x:string)=>x==='exalted'||x==='own';
const quality=(q:string,uk:boolean)=>q==='exalted'?(uk?'екзальтації':'exaltation'):
 q==='own'?(uk?'власному знаку':'own sign'):
 q==='debilitated'?(uk?'знаку падіння':'debilitation sign'):'';
const unique=(values:string[])=>[...new Set(values)];
const YOGA_THEMES:Readonly<Record<string,[string,string]>>={
 Ruchaka:['традиційно пов’язана з ініціативою, відвагою та здатністю братися за складні справи',
  'traditionally associated with initiative, courage and tackling demanding tasks'],
 Bhadra:['традиційно пов’язана зі здібністю працювати зі знаннями, мовою та аналізом',
  'traditionally associated with language, learning and analytical skill'],
 Hamsa:['традиційно пов’язана з навчанням, наставництвом і пошуком принципів',
  'traditionally associated with learning, mentoring and guiding principles'],
 Malavya:['традиційно пов’язана зі сферою естетики, стосунків та прагненням до гармонії',
  'traditionally associated with aesthetics, relationships and the pursuit of harmony'],
 Shasha:['традиційно пов’язана з витривалістю, організацією та довготривалою відповідальністю',
  'traditionally associated with endurance, organization and long-term responsibility']
};

export function buildN493Overview(chart:CalculatedChart,lang:Lang):N493Overview|null{
 const source=verifiedVargaSource(chart);if(!source)return null;
 const uk=lang==='uk',lords=classicalLordshipTable(chart.ascendant.sign);
 const yogas=yogakarakasForLagna(chart.ascendant.sign);
 const d1=(planet:string)=>chart.d1.find(p=>p.name===planet)!;
 const dn=(div:number,planet:string)=>source.charts.find(c=>c.division===div)!.planets.find(p=>p.name===planet)!;
 const results:N493Insight[]=[];
 const add=(x:N493Insight)=>{if(x.proof.length<3||new Set(x.proof).size!==x.proof.length)
  throw Error('N493_INVALID_EVIDENCE_'+x.id);results.push(x);};
 // Career: actual 10th-lord + D10 position + conditional exaltation/functional yoga
 // plus optional D24 (education). Repeating the SAME sign in D24 is correlated
 // evidence and is never advertised as independent confirmation.
 {
  const planet=lords[10],a=d1(planet),b=dn(10,planet),e=dn(24,planet);
  const q=dignityFor(planet,b.sign),eq=dignityFor(planet,e.sign),isYoga=yogas.includes(planet);
  const role=isYoga?(uk?'Для цієї лагни планета також керує 5-м і 10-м домами — традиційна йогакарака. ':
   'For this ascendant it rules both houses 5 and 10 (yogakaraka). '):'';
  const education=strong(eq)&&strong(q)?(uk?'D24 показує той самий тип знакової підтримки в темі навчання; це не друге незалежне підтвердження результату.':
   'D24 has similar sign dignity in education; it is related evidence, not a second independent guarantee.'):'';
  const headline=uk?(isYoga&&strong(q)?'Професія та здібності пов’язані через особливо значущого управителя':
   strong(q)?'Виразне знакове положення управителя професії':
   'Як пов’язані професійні завдання та життєвий напрям'):
   (isYoga&&strong(q)?'A particularly significant ruler connects skill and career':
    strong(q)?'Notable sign dignity for the career ruler':
    'The relationship between vocation and life direction');
  const interpretation=uk?'Управитель професійного дому '+name(planet,uk)+' перебуває в D1 у '+
    a.house+'-му домі ('+desc(a.house,uk)+'), а в D10 — у '+b.house+'-му ('+
    desc(b.house,uk)+'), у '+sign(b.sign,uk)+'. '+role+
    (strong(q)?(q==='exalted'?'У D10 ця планета в екзальтації. ':'У D10 вона у власному знаку. '):'')+
    (b.house===6?'Головний професійний мотив — системна робота зі складними практичними завданнями. ':
     b.house===9?'Важливий професійний мотив — навчання, наставництво або робота зі знаннями. ':'')+
    education:
    'The tenth-house ruler '+planet+' is in D1 house '+a.house+' ('+desc(a.house,uk)+
    ') and in D10 house '+b.house+' ('+desc(b.house,uk)+'), in '+sign(b.sign,uk)+'. '+role+
    (strong(q)?'D10 places it in '+quality(q,uk)+'. ':'')+
    (b.house===6?'The work theme emphasizes consistent skill and complex practical problems. ':
     b.house===9?'Study, mentorship or knowledge-based work is a relevant vocational theme. ':'')+
    education;
  const attention=uk?'Не визначайте професію або майбутній успіх за одним знаком: аспекти, повна сила й періоди ще не перевірені.':
   'A single sign cannot determine occupation or success: aspects, full strength and timing are not yet evaluated.';
  add({id:'career',division:10,relatedDivisions:strong(eq)&&strong(q)?[24]:[],planet,
   headline,
   teaser:uk?(isYoga&&strong(q)?'Управління 5-м і 10-м домами поєднується з сильним положенням у професійній D10.':
    strong(q)?'Управитель 10-го дому має виразне знакове положення у D10.':
    'Управитель професії в D1 та D10 вказує на різні, але пов’язані сфери діяльності.'):
    (isYoga&&strong(q)?'Fifth- and tenth-house rulership meets supportive D10 sign dignity.':
     strong(q)?'The career ruler has notable D10 sign dignity.':
     'The career ruler links two distinct areas in D1 and D10.'),
   interpretation:interpretation.trim(),attention,
   prominence:5+(isYoga?4:0)+(strong(q)?3:0)+(b.house===6||b.house===9?1:0),
   kind:strong(q)?'support':'context',
   proof:unique(['D1.house-lord.10='+planet,'D1.'+planet+'.house='+a.house,
    'D10.'+planet+'.sign='+b.sign,'D10.'+planet+'.house='+b.house,
    ...(isYoga?['D1.house-lord.5='+planet]:[]),
    ...(strong(eq)?['D24.'+planet+'.sign='+e.sign]:[])])});
 }
 // Relationships: D1 7th lord, D9 same-planet sign and actual Venus as
 // separate graha only when Venus is not the 7th lord. 7/8 dual rulership
 // is one functional fact, never "guaranteed commitment."
 {
  const planet=lords[7],a=d1(planet),b=dn(9,planet),venus=dn(9,'Venus');
  const double=lords[8]===planet,q=dignityFor(planet,b.sign);
  const text=uk?'Сьомим домом керує '+name(planet,uk)+' у '+a.house+'-му домі D1 ('+
    desc(a.house,uk)+'). У D9 '+name(planet,uk)+' перебуває в '+b.house+'-му домі ('+desc(b.house,uk)+'), у '+sign(b.sign,uk)+'. '+
    (double?'Ця сама планета керує і восьмим домом: до теми партнерства додається довіра та відповідальність за спільні рішення. ':'')+
    (planet!=='Venus'?'Венера як окремий показник близькості перебуває в D9 у '+sign(venus.sign,uk)+'. ':'')+
    (strong(q)?'Управитель має сприятливу знакову гідність у D9. ':''):
    'The seventh-house ruler '+planet+' occupies D1 house '+a.house+' ('+desc(a.house,uk)+
    ') and occupies D9 house '+b.house+' ('+desc(b.house,uk)+') in '+sign(b.sign,uk)+'. '+
    (double?'The same ruler governs the eighth house, linking partnerships to trust and shared decisions. ':'')+
    (planet!=='Venus'?'Venus is a separate relationship indicator in D9 '+sign(venus.sign,uk)+'. ':'')+
    (strong(q)?'The seventh ruler has supportive sign dignity in D9. ':'');
  add({id:'relationships',division:9,relatedDivisions:[1],planet,
   teaser:uk?(double?'Той самий управитель пов’язує партнерство з довірою та спільними рішеннями.':
    'Розташування управителя 7-го дому в D1 і D9 уточнює тему близькості.'):
    (double?'The same ruler connects partnership with trust and shared choices.':
     'The seventh-house ruler brings D1 and D9 into the relationship reading.'),
   headline:uk?(double?'Довіра й домовленості — пов’язані теми партнерства':
    'Що уточнює D9 у сфері партнерства'):
    (double?'Trust and agreements meet in partnership':'The D9 refinement of partnership'),
   interpretation:text.trim(),
   attention:uk?'Це не опис конкретного партнера та не передбачення шлюбу.':
    'These placements do not identify a partner or predict marriage.',
   prominence:4+(double?3:0)+(strong(q)?2:0)+(a.house===7?2:0),
   kind:strong(q)?'support':'context',
   proof:unique(['D1.house-lord.7='+planet,'D1.'+planet+'.house='+a.house,
    'D9.'+planet+'.sign='+b.sign,'D9.'+planet+'.house='+b.house,...(double?['D1.house-lord.8='+planet]:[]),
    ...(planet!=='Venus'?['D9.Venus.sign='+venus.sign]:[])])});
 }
 // Identity and recovery: lagna lord must be interpreted as lagna lord,
 // not simply confused with natural significator Moon.
 {
  const planet=lords[1],a=d1(planet),moon=d1('Moon'),sun=d1('Sun');
  const q=dignityFor(planet,a.sign);
  const shared=planet==='Moon';
  const text=uk?'Управитель вашого висхідного знака — '+name(planet,uk)+'. У D1 ця планета перебуває у '+
    a.house+'-му домі ('+desc(a.house,uk)+'). '+
    (shared?'Це водночас Місяць: його '+a.house+'-й дім пов’язує особистий напрям із темою «'+desc(a.house,uk)+'». ':
     'Місяць окремо перебуває у '+moon.house+'-му домі ('+desc(moon.house,uk)+'). ')+
    'Сонце у '+sun.house+'-му домі додає інший вимір — '+desc(sun.house,uk)+'.':
    'Your ascendant ruler '+planet+' is in house '+a.house+' ('+desc(a.house,uk)+'). '+
    (shared?'It is also the Moon, making its rhythm a central natal theme. ':
      'The Moon separately occupies house '+moon.house+' ('+desc(moon.house,uk)+'). ')+
    'The Sun in house '+sun.house+' adds '+desc(sun.house,uk)+'.';
  add({id:'identity',division:1,relatedDivisions:[],planet,
   teaser:uk?(a.house===12?'Управитель висхідного знака перебуває у 12-му домі: потреба у власному просторі має особливу роль.':
    'Управитель висхідного знака, Місяць і Сонце показують різні сторони натальної теми.'):
    (a.house===12?'The rising-sign ruler is in house 12: privacy and recovery are a relevant chart theme.':
     'The ascendant ruler, Moon and Sun offer different aspects of identity.'),
   headline:uk?(a.house===12?'Внутрішнє відновлення — важлива частина особистого напряму':
    'Особистий напрям і внутрішні потреби'):
    (a.house===12?'Personal direction also requires recovery':'Identity and inner needs'),
   interpretation:text,
   attention:uk?'Це символічні теми натальної карти, а не твердження про характер або минулі події.':
    'These are symbolic natal themes, not verified claims about personality or events.',
   prominence:6+(a.house===12?3:0)+(shared?1:0)+(strong(q)?2:0),
   kind:'context',
   proof:unique(['D1.house-lord.1='+planet,'D1.'+planet+'.house='+a.house,
    'D1.Moon.house='+moon.house,'D1.Sun.house='+sun.house])});
 }
 // Resources: never interpret the 2nd lord alone as guaranteed wealth.
 {
  const p=lords[2],q=lords[11],a=d1(p),b=d1(q),h=dn(2,p);
  const qualityD2=dignityFor(p,h.sign);
  add({id:'resources',division:2,relatedDivisions:[],planet:p,
   teaser:uk?'Управителі 2-го й 11-го домів розділяють теми збереження ресурсів і здобутків.':
    'Second- and eleventh-house rulers distinguish resources from gains.',
   headline:uk?'Грошові ресурси та результати роботи — різні показники':
    'Resources and professional gains have different indicators',
   interpretation:uk?'Другий дім ресурсів пов’язаний з '+name(p,uk)+' у '+a.house+
    '-му домі D1 ('+desc(a.house,uk)+'); одинадцятим домом здобутків керує '+
    name(q,uk)+' у '+b.house+'-му. У D2 '+name(p,uk)+' перебуває у '+sign(h.sign,uk)+
    (strong(qualityD2)?' — знакове положення підтримує тему ресурсів.':'.'):
    'The second-house ruler '+p+' is in D1 house '+a.house+' ('+desc(a.house,uk)+
    '), whereas the eleventh-house gains ruler '+q+' is in house '+b.house+
    '. In D2 '+p+' is in '+sign(h.sign,uk)+(strong(qualityD2)?', a supportive dignity.':'.'),
   attention:uk?'Розташування не дозволяє оцінити дохід, фінансовий ризик або багатство.':
    'The chart does not quantify income, investment risk or wealth.',
   prominence:3+(p===q?2:0)+(strong(qualityD2)?2:0),
   kind:strong(qualityD2)?'support':'context',
   proof:unique(['D1.house-lord.2='+p,'D1.'+p+'.house='+a.house,
    'D1.house-lord.11='+q,'D1.'+q+'.house='+b.house,'D2.'+p+'.sign='+h.sign])});
 }
 // Skills and study: use D24 and D1 fifth lord; avoid treating same Mars
 // in D10 + D24 as two statistically independent confirmations.
 {
  const planet=lords[5],a=d1(planet),b=dn(24,planet),q=dignityFor(planet,b.sign);
  const c=dn(10,planet),qc=dignityFor(planet,c.sign);
  const overlaps=strong(q)&&strong(qc);
  add({id:'education',division:24,relatedDivisions:overlaps?[10]:[],planet,
   teaser:uk?(overlaps?'D24 і D10 дають споріднені показники тієї самої планети — тему навчання й практики.':
    'Управитель 5-го дому пов’язує освіту з конкретною тематичною D24.'):
    (overlaps?'Related D24 and D10 placements connect study with practical work.':
     'The fifth-house ruler links education with the thematic D24 chart.'),
   headline:uk?(overlaps?'Навчання та професійна практика мають спільний показник':
    'Як знання переходять у навичку'):
    (overlaps?'Learning and vocation share a chart indicator':'Where learning becomes practiced skill'),
   interpretation:uk?'Управитель п’ятого дому '+name(planet,uk)+' у D1 перебуває в '+
    a.house+'-му домі ('+desc(a.house,uk)+'). У D24 він у '+b.house+'-му домі, у '+
    sign(b.sign,uk)+'. У темі освіти це зіставляє '+desc(a.house,uk)+' із '+
    desc(b.house,uk)+'. '+(strong(q)?'Це '+quality(q,uk)+' — традиційний знак підтримки навчальної теми. ':'')+
    (overlaps?'D10 повторює сприятливу знакову оцінку тієї ж планети, але це пов’язане, а не незалежне підтвердження.':''):
    'The fifth-house ruler '+planet+' is in D1 house '+a.house+' ('+desc(a.house,uk)+
    '), and in D24 house '+b.house+', in '+sign(b.sign,uk)+'. For education, this links '+
    desc(a.house,uk)+' with '+desc(b.house,uk)+'. '+
    (strong(q)?'Its '+quality(q,uk)+' is a traditional educational sign strength. ':'')+
    (overlaps?'D10 has comparable dignity for the same planet, which is correlated evidence, not a separate guarantee.':''),
   attention:uk?'Це не оцінка інтелекту чи дипломів; Меркурій та інші чинники перевіряються окремо.':
    'This is not an IQ or degree prediction; Mercury and other factors need separate evaluation.',
   prominence:3+(overlaps?3:0)+(strong(q)?2:0),
   kind:strong(q)?'support':'context',
   proof:unique(['D1.house-lord.5='+planet,'D1.'+planet+'.house='+a.house,
    'D24.'+planet+'.sign='+b.sign,'D24.'+planet+'.house='+b.house,
    ...(overlaps?['D10.'+planet+'.sign='+c.sign]:[])])});
 }
 // Fine conditions in D1. Only say "debilitated" as a qualified signal, not
 // as doom; no neechabhanga inference is made.
 {
  const fallen=chart.d1.filter(p=>dignityFor(p.name,p.sign)==='debilitated'&&UK[p.name]);
  if(fallen.length){
   const p=fallen[0],nameP=p.name;
   const roles=Array.from({length:12},(_,i)=>i+1).filter(h=>lords[h]===nameP);
   add({id:'dignity-caution',division:1,relatedDivisions:[],planet:nameP,
    teaser:uk?name(nameP,uk)+' у D1 в знаку падіння: оцінка ролей цієї планети потребує інших перевірок.':
      nameP+' occupies its debilitation sign in D1; other conditions must be checked.',
    headline:uk?'Показник, який потребує додаткової перевірки':
     'A placement requiring more context',
    interpretation:uk?name(nameP,uk)+' у D1 перебуває у '+sign(p.sign,uk)+
     ' — знаку традиційного падіння. Планета керує домами '+roles.join(' і ')+
     ', а її фактичне положення — '+p.house+'-й дім ('+desc(p.house,uk)+'). '+
     'Це уточнює теми для перевірки, але не визначає здібності чи життєвий результат.':
     nameP+' in D1 occupies '+sign(p.sign,uk)+', its traditional debilitation sign. '+
     'It rules houses '+roles.join(' and ')+' and occupies house '+p.house+' ('+desc(p.house,uk)+
     '). This identifies a question to investigate, not a fixed outcome.',
    attention:uk?'Потрібно перевірити аспекти, інші управління та можливе скасування падіння; цього двигун ще не сертифікував.':
     'Aspects, other factors and cancellation conditions remain uncertified.',
    prominence:6+(roles.includes(1)||roles.includes(10)?2:0),
    kind:'tension',
    proof:unique(['D1.'+nameP+'.sign='+p.sign,'D1.'+nameP+'.house='+p.house,
     ...roles.map(h=>'D1.house-lord.'+h+'='+nameP)])});
  }
 }
 // Pancha Mahapurusha: existing verified natal sign+angular condition, never
 // pretend to have screened combustion/aspects/full degree strength.
 for(const y of ruleFindings(chart).yogas){
  add({id:'mahapurusha-'+y.name.toLowerCase(),division:1,relatedDivisions:[],planet:y.planet,
   teaser:uk?'У D1 виконані перевірені умови знака та кутового дому для йоги '+y.name+'.':
      'The chart meets the checked sign-and-angular-house conditions for '+y.name+'.',
   headline:uk?'Класична комбінація '+y.name+' у головній карті':
    'A '+y.name+' condition in the birth chart',
   interpretation:uk?name(y.planet,uk)+' перебуває у '+y.house+'-му домі D1, у '+
    sign(y.sign,uk)+'. За умовами знакової гідності й кутового дому це поєднання '+y.name+
    ' — '+YOGA_THEMES[y.name][0]+'. Це не повний висновок про силу планети чи гарантовану рису людини.':
    y.planet+' occupies D1 house '+y.house+' in '+sign(y.sign,uk)+
    '. Its sign dignity and angular placement meet the '+y.name+' condition, '+
    YOGA_THEMES[y.name][1]+'. This is not full planetary strength or a guaranteed trait.',
   attention:uk?'З’єднання, аспекти, градусна сила та скасування потребують окремого аналізу.':
    'Conjunctions, aspects, degree strength and cancellations need separate analysis.',
   prominence:8,kind:'support',
   proof:unique(['D1.'+y.planet+'.house='+y.house,'D1.'+y.planet+'.sign='+y.sign,
    'dignity:'+y.planet.toLowerCase()+'='+y.reason])});
 }
 // Stable tie-breaking. Keep 3–5 genuinely different thematic patterns;
 // a career lord appearing again in education is not a second 'career win'.
 results.sort((a,b)=>b.prominence-a.prominence||a.id.localeCompare(b.id,'en'));
 const selected:N493Insight[]=[];
 const used=new Set<string>();
 for(const finding of results){
  // 3 insights are the useful minimum; 4th/5th must clear an evidence-quality
  // threshold. Never include weaker filler merely to make a five-item list.
  if(selected.length>=3&&finding.prominence<6)break;
  const topic=finding.id.startsWith('mahapurusha')?'special-yoga':finding.id;
  if(used.has(topic))continue;
  // "dignity caution" can coexist with career if a different graha;
  // avoid repeating the same planet's primary assertion across top findings.
  const already=selected.some(s=>s.planet===finding.planet&&(
   ((s.id==='career'||s.id==='education')&&(finding.id==='education'||finding.id==='career'))||
   ((s.id==='career'&&finding.id.startsWith('mahapurusha-'))||
    (finding.id==='career'&&s.id.startsWith('mahapurusha-')))
  ));
  if(already)continue;
  selected.push(finding);used.add(topic);
  if(selected.length===5)break;
 }
 // Top three patterns are from independent areas, not necessarily unique
 // planets; every finding has ≥2 grounded natal/varga facts and a clear scope.
 if(selected.length<3)throw Error('N493_NOT_ENOUGH_DISTINCT_FINDINGS');
 // A second interpretive pass converts ranked facts into a personal
 // question or action. Repetition of one graha never counts as new evidence.
 for(const item of selected){
  let next='';
  if(item.id==='career'){
   const a=d1(lords[10]),b=dn(10,lords[10]);
   next=uk?(a.house===b.house?
    'Обидва ракурси підкреслюють '+desc(b.house,uk)+'. Перевірте цю тему в одному реальному робочому проєкті.':
    'У D1 професійні рішення пов’язані з темою «'+desc(a.house,uk)+'», а D10 уточнює їх практичне вираження через «'+desc(b.house,uk)+
    '». Спробуйте невеликий робочий проєкт, який поєднує обидві теми, перш ніж обирати спеціалізацію.'):
    (a.house===b.house?
     'Both lenses emphasize '+desc(b.house,uk)+'. Test that theme in one real project.':
     'The D1-to-D10 bridge runs from '+desc(a.house,uk)+' toward '+desc(b.house,uk)+
     '. Test a project where one helps the other before choosing a specialization.');
  }else if(item.id==='relationships'){
   const p=lords[7],b=dn(9,p),v=dn(9,'Venus');
   next=uk?(p==='Venus'?
    'Венера вже є управителем сьомого дому: не рахуйте ту саму планету двічі. Поговоріть з партнером про реальні очікування та обов’язки.':
    b.house===v.house?
    'Венера й управитель партнерства займають один дім D9. Близькість і домовленості тут стосуються однієї сфери: перевірте це розмовою про взаємність.':
    'Венера й управитель партнерства стоять у різних домах D9. Почуття і спільні обов’язки не завжди вирішуються однією розмовою.'):
    (p==='Venus'?
     'Venus already rules house seven: never count it twice. Discuss real expectations and responsibilities.':
     b.house===v.house?
     'Venus and the partnership ruler share a D9 house; affection and agreements meet in one arena. Discuss reciprocity.':
     'Venus and the partnership ruler occupy different D9 houses; affection and shared duties may need separate conversations.');
  }else if(item.id==='identity'){
   const a=d1(lords[1]),m=d1('Moon');
   next=uk?(a.house===m.house?
    'Управитель лагни та Місяць зосереджені в одній сфері. Дослідіть, що одночасно дає вам напрям і відновлення.':
    'Управитель лагни й Місяць у різних домах. Не вимагайте від одного заняття і самореалізації, і відпочинку.'):
    (a.house===m.house?
     'The rising-sign ruler and Moon share an arena. Find what supports both direction and recovery.':
     'The rising-sign ruler and Moon occupy different houses. One activity need not supply both purpose and rest.');
  }else if(item.id==='resources'){
   const sameLord=lords[2]===lords[11];
   next=uk?'Збережені ресурси (2-й дім) і здобутки (11-й) — не одне й те саме. '+
    (sameLord?'Тут їх пов’язує одна планета. ':'Вони мають різних управителів. ')+
    'Відокремте ці два питання у власному фінансовому плані.':
    'Retained resources (house 2) differ from gains (house 11). '+
    (sameLord?'The same planet rules both. ':'Their rulers differ. ')+
    'Track these two questions separately.';
  }else if(item.id==='education'){
   const p=lords[5],b=dn(24,p),m=dn(24,'Mercury');
   next=uk?(p==='Mercury'?
    'Меркурій уже керує п’ятим домом: його роль не слід дублювати. Перевіряйте знання завершеною практичною роботою.':
    'Меркурій у D24 займає '+m.house+'-й дім, а управитель п’ятого — '+b.house+
    '-й. Розрізняйте засвоєння матеріалу й застосування майстерності.'):
    (p==='Mercury'?
     'Mercury already rules the fifth: do not double-count it. Test learning with a finished practical task.':
     'Mercury occupies D24 house '+m.house+' while the fifth ruler is in '+b.house+
     '. Distinguish absorbing knowledge from applying a skill.');
   if(p!=='Mercury')item.proof=unique([...item.proof,'D24.Mercury.house='+m.house]);
  }
  // Headline must announce an actual pattern, never a topic label alone.
  if(item.id==='career'){
   const h=dn(10,lords[10]).house;
   if(h===6)item.headline=uk?'Професійна сила — у щоденній майстерності та складних задачах':
    'Work grows through craft and complex problem-solving';
   if(h===9)item.headline=uk?'Професійна тема проходить через знання й наставництво':
    'Knowledge and mentorship shape the vocational theme';
   if(h===11)item.headline=uk?'Професійна тема пов’язана з результатами та спільнотами':
    'A vocational emphasis on results and communities';
  }else if(item.id==='relationships'){
   const p=lords[7],b=dn(9,p),v=dn(9,'Venus');
   if(p!=='Venus')item.headline=b.house===v.house?
    (uk?'Близькість і домовленості зустрічаються в одній сфері':
      'Affection and commitment meet in one life area'):
    (uk?'Близькість і домовленості потребують різних підходів':
      'Affection and commitment take different routes');
  }else if(item.id==='identity'){
   const a=d1(lords[1]),m=d1('Moon');
   if(a.house!==m.house)item.headline=uk?
    'Особистий напрям і потреба у відновленні не тотожні':
    'Personal direction and the need to recover are distinct';
  }else if(item.id==='education'){
   const a=d1(lords[5]),b=dn(24,lords[5]);
   if(a.house!==b.house)item.headline=uk?
    'Знання народжується в одній сфері, а майстерність формується в іншій':
    'Knowledge begins in one arena, while mastery grows in another';
  }
  // The above-the-fold teaser must expose at least two exact properties of
  // THIS chart, not a reusable slogan about a house, a division or a planet.
  if(item.id==='career'){
   const p=lords[10],a=d1(p),b=dn(10,p);
   item.teaser=uk?'Управитель 10-го дому — '+name(p,uk)+
    ': у D1 це '+a.house+'-й дім, у професійній D10 — '+b.house+'-й. '+
    (a.house===b.house?'Акцент повторюється.':'Дія переходить в іншу сферу.'):
    'The tenth ruler '+p+' moves from D1 house '+a.house+' to D10 house '+
    b.house+'. '+(a.house===b.house?'The arena remains consistent.':'The focus shifts.');
  }else if(item.id==='relationships'){
   const p=lords[7],a=d1(p),b=dn(9,p),v=dn(9,'Venus');
   item.teaser=uk?'Управитель партнерства — '+name(p,uk)+
    ': D1, дім '+a.house+'; D9, дім '+b.house+'. '+
    (p==='Venus'?'Венера вже виконує цю роль.':v.house===b.house?'Венера займає той самий дім D9.':'Венера в іншому домі D9.'):
    'Partnership ruler '+p+': D1 house '+a.house+', D9 house '+b.house+
    '. '+(p==='Venus'?'Venus is already this ruler.':v.house===b.house?'Venus shares its D9 house.':'Venus occupies a different D9 house.');
  }else if(item.id==='identity'){
   const p=lords[1],a=d1(p),m=d1('Moon');
   item.teaser=uk?'Управитель лагни — '+name(p,uk)+', дім '+a.house+
    '; Місяць — дім '+m.house+'. '+
    (a.house===m.house?'Дві особисті теми сходяться в одному домі.':'Зовнішній напрям і внутрішній ритм мають різні опори.'):
    'Ascendant ruler '+p+' occupies house '+a.house+', Moon house '+m.house+
    '. '+(a.house===m.house?'Both concerns meet in one house.':'Direction and inner rhythms have separate anchors.');
  }else if(item.id==='resources'){
   const p=lords[2],q=lords[11],a=d1(p),b=d1(q);
   item.teaser=uk?'Ресурсами керує '+name(p,uk)+' у '+a.house+'-му домі; '+
    'здобутками — '+name(q,uk)+' у '+b.house+'-му. '+
    (p===q?'Одна планета має дві функції.':'Управителі різні.'):
    'Resources follow '+p+' in house '+a.house+'; gains follow '+q+
    ' in house '+b.house+'. '+(p===q?'One planet, two functions.':'Different rulers, different questions.');
  }else if(item.id==='education'){
   const p=lords[5],a=d1(p),b=dn(24,p);
   item.teaser=uk?'Управитель навчального 5-го дому — '+name(p,uk)+
    ': D1, дім '+a.house+'; D24, дім '+b.house+
    '. Це показує, як тема знань проявляється у варзі майстерності.':
    'The fifth ruler '+p+' occupies D1 house '+a.house+' and D24 house '+
    b.house+', locating the study theme in the skills division.';
  }
  if(next)item.interpretation=(item.interpretation+' '+next).trim();
 }
 // Synthesize roles rather than repeat the discovery headlines.
 const ascLord=lords[1],careerLord=lords[10],partnerLord=lords[7];
 const asc=d1(ascLord),career=d1(careerLord),partner=d1(partnerLord);
 const linked=ascLord===careerLord?(uk?'Одна планета керує і особистим напрямом, і кар’єрою. ':
  'The same planet rules identity and career. '):
  asc.house===career.house?(uk?'Управителі особистого напряму й кар’єри стоять в одному домі, але мають різні функції. ':
   'The identity and career rulers occupy one house but serve different roles. '):'';
 const workD10=dn(10,careerLord);
 const workFocus=dignityFor(careerLord,workD10.sign);
 const strengthText=strong(workFocus)?(uk?
   ' В D10 ця планета '+(workFocus==='exalted'?'в екзальтації.':'у власному знаку.'):
   ' D10 places it in '+(workFocus==='exalted'?'exaltation.':'its own sign.')):'';
 const work=uk?'Кар’єрний управитель '+name(careerLord,uk)+
   ' поєднує тему «'+desc(career.house,uk)+'» в основній карті з темою «'+
   desc(workD10.house,uk)+'» у D10.'+strengthText+' ':
   'The career ruler '+careerLord+' connects '+desc(career.house,uk)+
   ' in the natal chart with '+desc(workD10.house,uk)+' in D10.'+strengthText+' ';
 const recovery=uk?(asc.house===12?
  'Управитель висхідного знака в 12-му домі додає помітну потребу в тиші та відновленні. ':
  'Особистий напрям через '+name(ascLord,uk)+' пов’язаний із темою «'+desc(asc.house,uk)+'». '):
  (asc.house===12?'The rising-sign ruler in house 12 adds the theme of privacy and recovery. ':
   'Personal direction through '+ascLord+' connects with '+desc(asc.house,uk)+'. ');
 const partnership=uk?'Партнерство через '+name(partnerLord,uk)+' пов’язане з темою «'+desc(partner.house,uk)+'»'+
  (partner.house===career.house?
   ' — це спільна сфера з професійним управителем, але не тотожний результат.':
   '; воно має власні умови, відмінні від роботи.') :
  'Partnership through '+partnerLord+' relates to '+desc(partner.house,uk)+
  (partner.house===career.house?
   ', an arena it shares with the career ruler but not a guaranteed shared result.':
   ', with its own concerns distinct from work.');
 const summary=(linked+work+recovery+partnership).trim();
 return {version:N493_INSIGHTS_VERSION,insights:selected,summary};
}
