import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_GRAHAS,CLASSICAL_RULERS,dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';

/**
 * N4.4 evidence register. OCR excerpts have been read in the files below;
 * they are NOT certified against page scans. Never present a derived editorial
 * conclusion as a verbatim historical verse.
 */
export const N44_CLASSICAL_RULESET_VERSION='classical-reader-n44-1.0.0' as const;
export const N44_CLASSICAL_SOURCES=[
 {id:'BJ-X-1',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'X',stanza:'1',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:7444,endLine:7480,anchor:'On  Avocation',review:'ocr_excerpt_checked',scope:'Tenth house from ascendant/Moon and navamsa lord for vocation'},
 {id:'BJ-X-2-3',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'X',stanza:'2–3',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:7482,endLine:7549,anchor:'writer,  an',review:'ocr_excerpt_checked',scope:'Occupation categories of navamsa dispositor'},
 {id:'BJ-XX-2-4',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'XX',stanza:'2–4',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:11095,endLine:11153,anchor:'Moon  occupy',review:'ocr_excerpt_checked',scope:'Sun and Moon in selected natal houses'},
 {id:'BJ-XX-6-8',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'XX',stanza:'6–8',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:11177,endLine:11216,anchor:'Mercury  occupy',review:'ocr_excerpt_checked',
  scope:'Specific natal Mercury, Jupiter and Venus placements, not verified life outcomes'},
 {id:'BJ-XX-10',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'XX',stanza:'10',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:11234,endLine:11262,anchor:'nature  of  such',review:'ocr_excerpt_checked',
  scope:'Read house placement with sign dignity and challenging houses, not in isolation'},
 {id:'BJ-XX-11',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'XX',stanza:'11',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:11264,endLine:11293,anchor:'exaltation  signs',review:'ocr_excerpt_checked',
  scope:'Dignity modifies literal effects; do not copy numeric fractions as modern scores'},
 {id:'BJ-XXI-1',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'XXI',stanza:'1',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:11295,endLine:11316,anchor:'own  house',review:'ocr_excerpt_checked',scope:'Own-sign planetary positions; applying to later high vargas is a modern extension'},
 {id:'BJ-XXI-2',work:'Brihat Jataka',edition:'N. Chidambaram Aiyar, second edition, 1905',
  chapter:'XXI',stanza:'2',path:'research-library/primary-texts/brihat-jataka-iyer-1905-ocr.txt',
  startLine:11317,endLine:11344,anchor:'exaltation',review:'ocr_excerpt_checked',scope:'Exaltation/debilitation classification; not proof of deterministic life outcomes'},
 {id:'LP-I-3',work:'Laghu Parashari',edition:'Sitaram Jha, 1900, Hindi/Sanskrit OCR',
  chapter:'I',stanza:'3',path:'research-library/primary-texts/laghu-parashari-jha-1900-ocr.txt',
  startLine:177,endLine:187,anchor:'अष्टोत्तरी',review:'ocr_excerpt_checked_translation_pending',
  scope:'Vimshottari chosen for THIS treatise; not proof every school must use it'},
 {id:'LP-I-SUBPERIOD',work:'Laghu Parashari',edition:'Sitaram Jha, 1900, Hindi/Sanskrit OCR',
  chapter:'I',stanza:'subperiod calculation following 3',path:'research-library/primary-texts/laghu-parashari-jha-1900-ocr.txt',
  startLine:274,endLine:296,anchor:'१२०',review:'ocr_excerpt_checked_translation_pending',
  scope:'Mahadasha/antardasha proportional duration divided by 120; no promised event'}
] as const;
export type ClassicalSourceId=typeof N44_CLASSICAL_SOURCES[number]['id'];
export type ClassicalEvidence={
 ruleId:string;sourceId:ClassicalSourceId;
 role:'resource'|'friction'|'context'|'timing';
 application:'direct_natal'|'modern_varga_extension'|'dasha_arithmetic_only';
 facts:readonly string[];
 detailUk:string;detailEn:string;
};
type Lang='uk'|'en';
const PLANET_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const TRAIT_UK:Record<string,string>={
 Sun:'самостійність, видиму відповідальність і здатність ухвалювати рішення',
 Moon:'турботу, роботу з людьми та відчуття їхніх потреб',
 Mars:'ініціативність, прикладні задачі й сміливість у дії',
 Mercury:'комунікацію, аналіз, письмо та роботу з інформацією',
 Jupiter:'навчання, наставництво та довгострокове бачення',
 Venus:'естетику, співпрацю та уважність до якості',
 Saturn:'витривалість, порядок і повільне вдосконалення'
};
const TRAIT_EN:Record<string,string>={
 Sun:'independent decisions and visible responsibility',
 Moon:'care, working with people and noticing needs',
 Mars:'initiative and practical problem-solving',
 Mercury:'communication, analysis, writing and information work',
 Jupiter:'learning, mentoring and long-term perspective',
 Venus:'aesthetics, cooperation and attention to quality',
 Saturn:'persistence, structure and patient improvement'
};
const name=(p:string,lang:Lang)=>lang==='uk'?(PLANET_UK[p]||p):p;
const signal=(ruleId:string,sourceId:ClassicalSourceId,role:ClassicalEvidence['role'],
 application:ClassicalEvidence['application'],facts:string[],detailUk:string,detailEn:string):ClassicalEvidence=>
 ({ruleId,sourceId,role,application,facts,detailUk,detailEn});
const isClassical=(p:string)=>CLASSICAL_GRAHAS.some(g=>g===p);
const houseFrom=(sign:number,base:number)=>((sign-base+12)%12)+1;
export function extractN44Evidence(chart:CalculatedChart,division:number,asOf:string):ClassicalEvidence[]{
 const source=verifiedVargaSource(chart);
 if(!source||division===60)return [];
 const dn=source.charts.find(c=>c.division===division);
 if(!dn)return [];
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const themeHouse:Record<number,number>={1:1,2:2,3:3,4:4,7:5,9:7,10:10,12:4,
 16:4,20:9,24:5,27:1,30:6,40:4,45:9};
 const h=themeHouse[division];
 const lord=lords[h];
 const d1=chart.d1.find(p=>p.name===lord);
 const placed=dn.planets.find(p=>p.name===lord);
 if(!d1||!placed||!isClassical(lord))return [];
 const facts=['D1.house-lord.'+h+'='+lord,'D1.'+lord+'.house='+d1.house,
  'D1.'+lord+'.sign='+d1.sign,'D'+division+'.'+lord+'.house='+placed.house,
  'D'+division+'.'+lord+'.sign='+placed.sign];
 const signals:ClassicalEvidence[]=[];
 const natal=dignityFor(lord,d1.sign),vargha=dignityFor(lord,placed.sign);
 if(natal==='own'||natal==='exalted'){
  signals.push(signal('BJ-XXI-D1-'+natal,'BJ-XXI-'+(natal==='own'?'1':'2'),'resource',
   'direct_natal',facts,
   name(lord,'uk')+' має традиційно підтримувальне положення у загальній карті. Це привід розглядати тему як можливий ресурс, а не обіцянка успіху.',
   lord+' has a traditionally supportive sign placement in the natal chart. This suggests a resource worth examining, not a promise of success.'));
 }
 if(natal==='debilitated'){
  signals.push(signal('BJ-XXI-D1-DEB','BJ-XXI-2','friction','direct_natal',facts,
   'У загальній карті '+name(lord,'uk')+' перебуває у знаку, який традиція трактує як складніший для прояву його теми. Це не означає нездатності чи невдачі.',
   'The natal sign of '+lord+' has a traditional difficulty marker. It does not establish inability or failure.'));
 }
 if(vargha==='own'||vargha==='exalted'){
  signals.push(signal('BJ-XXI-D'+division+'-'+vargha,'BJ-XXI-'+(vargha==='own'?'1':'2'),
   'resource','modern_varga_extension',facts,
   'У тематичній карті '+name(lord,'uk')+' також має підтримувальне положення за знаком. Це уточнює загальний ракурс; застосування давнього принципу до D'+division+' є сучасним розширенням.',
   'In the topic-specific chart '+lord+' also has a supportive sign status. Applying this older rule to D'+division+' is a modern interpretive extension.'));
 }
 if(vargha==='debilitated'){
  signals.push(signal('BJ-XXI-D'+division+'-DEB','BJ-XXI-2','friction','modern_varga_extension',facts,
   'У тематичній карті положення '+name(lord,'uk')+' за знаком потребує обережнішого прочитання. Саме по собі воно не визначає вашу здатність чи майбутнє.',
   'The topic-specific sign placement of '+lord+' calls for more caution, but does not determine abilities or outcomes.'));
 }
 if((natal==='own'||natal==='exalted')&&vargha==='debilitated'){
  signals.push(signal('N44-CONTRAST-D'+division,'BJ-XXI-2','context',
   'modern_varga_extension',facts,
   'Є контраст: загальна карта підкреслює ресурс, але деталізація показує умови, де його треба застосовувати уважніше.',
   'There is a contrast: the general chart suggests a resource while the detailed chart calls for more careful use of it.'));
 }
 if(natal==='debilitated'&&(vargha==='own'||vargha==='exalted')){
  signals.push(signal('N44-COMPLEMENT-D'+division,'BJ-XXI-2','context',
   'modern_varga_extension',facts,
   'Є доповнення: навіть якщо в загальній карті тема складніша, тематична карта показує інший спосіб її застосування.',
   'The focused chart offers another way to work with a topic that looks more complex in the general chart.'));
 }
 // Brihat Jataka XX/10 demands reading natal house and sign together.
 if(natal!=='other'&&natal!=='unassigned'){
  signals.push(signal('BJ-XX-10-CONTEXT-D'+division,'BJ-XX-10','context',
   'direct_natal',facts,
   'Книга пропонує не оцінювати положення планети лише за номером дому: її знак змінює традиційне прочитання. Тому цей висновок враховує обидві обчислені умови.',
   'The book asks readers to judge house position together with the planet’s sign. Both calculated factors are considered here.'));
 }
 // Carefully selected, non-diagnostic natal themes from BJ XX/6–8.
 if(division===24){
  const mercury=chart.d1.find(p=>p.name==='Mercury');
  if(mercury&&[1,4,5].includes(mercury.house)){
   signals.push(signal('BJ-XX-6-MERCURY-LEARNING','BJ-XX-6-8','context','direct_natal',
    ['D1.Mercury.house='+mercury.house],
    'У загальній карті положення Меркурія підсилює тему навчання та роботи з інформацією. Це привід перевірити, які способи навчання вам справді підходять.',
    'Mercury’s natal position adds a traditional learning and information theme. Compare it with how you actually learn.'));
  }
 }
 if(division===20||division===24){
  const jupiter=chart.d1.find(p=>p.name==='Jupiter');
  if(jupiter&&[1,5,9].includes(jupiter.house)){
   signals.push(signal('BJ-XX-7-JUPITER-LEARNING','BJ-XX-6-8','context','direct_natal',
    ['D1.Jupiter.house='+jupiter.house],
    'Юпітер у загальній карті додає тему знань, учительства чи пошуку сенсу. Давнє формулювання є символічним орієнтиром, не гарантією певної професії.',
    'Jupiter adds a theme of knowledge, mentoring or meaning. The historical association is a reflection cue, not a guaranteed occupation.'));
  }
 }
 if(division===16||division===7){
  const venus=chart.d1.find(p=>p.name==='Venus');
  if(venus&&[1,5].includes(venus.house)){
   signals.push(signal('BJ-XX-8-VENUS-COMFORT','BJ-XX-6-8','context','direct_natal',
    ['D1.Venus.house='+venus.house],
    'Венера у загальній карті пов’язує цю тему з комфортом або творчим самовираженням. Перевірте її прояв у конкретних щоденних діях.',
    'Venus connects this area with comfort or creative expression. Test the theme in real habits rather than treating it as destiny.'));
  }
 }
 // Brihat Jataka chapter X, stanza 1: the 10th FROM the Moon is not the
 // same as the natal tenth house; calculate it exactly.
 if(division===10){
  const tenth=chart.d1.filter(p=>isClassical(p.name)&&p.house===10);
  const moon=chart.d1.find(p=>p.name==='Moon')!;
  const fromMoon=chart.d1.filter(p=>isClassical(p.name)&&houseFrom(p.sign,moon.sign)===10);
  if(tenth.length){
   signals.push(signal('BJ-X-1-TENTH-LAGNA','BJ-X-1','context','direct_natal',
    [...facts,...tenth.map(p=>'D1.'+p.name+'.house=10')],
    'У професійній сфері помітні '+tenth.map(p=>name(p.name,'uk')).join(' і ')+'. Класичний метод пропонує врахувати саме ці показники разом із професійною картою.',
    'The natal career sector contains '+tenth.map(p=>p.name).join(' and ')+'. The classical method treats these as context alongside the career chart.'));
  }
  if(fromMoon.length){
   signals.push(signal('BJ-X-1-TENTH-MOON','BJ-X-1','context','direct_natal',
    ['D1.Moon.sign='+moon.sign,...fromMoon.map(p=>'D1.'+p.name+'.sign='+p.sign)],
    'Якщо відрахувати професійний сектор від Місяця, виділяється '+fromMoon.map(p=>name(p.name,'uk')).join(' і ')+'. Це другий погляд на робочі пріоритети.',
    'Counting the career sector from the Moon highlights '+fromMoon.map(p=>p.name).join(' and ')+'. This adds a second view of vocational priorities.'));
  }
  // D9 lord of the navamsa occupied by natal tenth-house ruler,
  // NOT the ruler of its house in D10.
  const nav=chart.d9.find(p=>p.name===lords[10]);
  if(nav){
   const dispositor=CLASSICAL_RULERS[nav.sign-1];
   signals.push(signal('BJ-X-1-NAVAMSA-VOCATION','BJ-X-1','context','direct_natal',
    ['D1.house-lord.10='+lords[10],'D9.'+lords[10]+'.sign='+nav.sign,'D9.sign-ruler.'+nav.sign+'='+dispositor],
    'У традиційному аналізі професії додатковий акцент пов’язаний із '+name(dispositor,'uk')+
     ': '+TRAIT_UK[dispositor]+'. Це не передбачає певної посади; зіставте ці навички зі своїм досвідом.',
    'A classical vocation cue points toward '+TRAIT_EN[dispositor]+
     '. This does not guarantee a job or title; compare the theme with your own experience.'));
  }
  const sun=chart.d1.find(p=>p.name==='Sun');
  if(sun?.house===10)signals.push(signal('BJ-XX-3-SUN-10','BJ-XX-2-4','context','direct_natal',
   ['D1.Sun.house=10'],
   'Сонце в професійному секторі додає тему видимої відповідальності; у сучасному прочитанні це питання про вашу реальну роль, не про соціальний статус.',
   'The Sun in the vocation sector brings up visible responsibility. Treat this as a question about your role, not a predicted social rank.'));
 }
 if(division===4||division===7){
  const moon=chart.d1.find(p=>p.name==='Moon');
  if(moon&&(moon.house===4||moon.house===5))
   signals.push(signal('BJ-XX-4-MOON-'+moon.house,'BJ-XX-2-4','context','direct_natal',
    ['D1.Moon.house='+moon.house],
    'Місяць у загальній карті додатково виділяє тему '+(moon.house===4?'внутрішньої опори та дому':'навчання і творчості')+
     '. Історичний текст містить також буквальні прогнози, які тут не повторюються.',
    'The Moon in the natal chart highlights '+(moon.house===4?'home and inner foundations':'learning and creativity')+
     '. Historical literal forecasts are deliberately not copied.'));
 }
 const at=Date.parse(asOf+'T12:00:00Z');
 if(/^\d{4}-\d{2}-\d{2}$/.test(asOf)&&Number.isFinite(at)){
  const major=chart.dasha.find(d=>Date.parse(d.start)<=at&&at<Date.parse(d.end));
  const minor=major?.antardashas?.find(d=>Date.parse(d.start)<=at&&at<Date.parse(d.end));
  if(major&&(major.lord===lord||minor?.lord===lord))
   signals.push(signal('LP-I-DASHA-D'+division,'LP-I-3','timing',
    'dasha_arithmetic_only',['asOf='+asOf,'Vimshottari.major='+major.lord,
     'Vimshottari.minor='+(minor?.lord||'none'),'D1.house-lord.'+h+'='+lord],
    'За обчисленим планетарним періодом ця тема може бути корисною для уваги зараз. Період не доводить, що подія відбудеться.',
    'The calculated planetary period makes this a useful theme for reflection now. It cannot prove any event will occur.'));
 }
 return signals;
}
export function sourceForRule(sourceId:ClassicalSourceId){
 return N44_CLASSICAL_SOURCES.find(x=>x.id===sourceId)!;
}
