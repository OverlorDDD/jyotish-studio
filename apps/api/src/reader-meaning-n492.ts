/**
 * N4.9.2: one meaningful, evidence-linked reading for each of the 16 vargas.
 *
 * Draws on the SAME classical context and authored V6 interpretation as the
 * former hidden "Optional detailed traditional interpretation". No LLM needed.
 * D60 has no claimed lagna/house result; the planet-to-sign map is conditional
 * on recorded birth time and stays visibly provisional.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor,CLASSICAL_GRAHAS} from '../../../packages/jyotish-core/src/rules.ts';
import {readerClassicalContext} from './reader-classical.ts';
import {authorConsultationV6} from './reader-narrative-v6.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';

export const N492_MEANING_VERSION='n492-meaning-first-16-v1' as const;
export const N492_DIVISIONS=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60] as const;
type Lang='uk'|'en';
type Card={
 division:number;
 reading:string;
 corroboration:string|null;
 attention:string|null;
 sourceFacts:readonly string[];
 sourceMethod:readonly string[];
 sensitivity:'ordinary'|'fine'|'provisional';
};
type Conclusion={version:typeof N492_MEANING_VERSION;cards:readonly Card[];
 takeaways:readonly {text:string;sourceFacts:readonly string[]}[];limits:string};
const HOUSES_UK=['особисті рішення','ресурси та мовлення','навички й спілкування','дім і внутрішня опора',
 'творчість і діти','повсякденна праця та подолання перешкод','партнерство й домовленості',
 'довіра та спільні зобов’язання','освіта й світогляд','професійна реалізація',
 'друзі, спільноти та здобутки','відновлення й особистий простір'];
const HOUSES_EN=['identity and decisions','resources and speech','skills and communication',
 'home and foundations','creativity and children','daily work and problem-solving',
 'partnership and agreements','trust and shared responsibilities','learning and worldview',
 'vocation and responsibility','friends and communities','rest and personal space'];
const SIGNS_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні',
 'Стрільці','Козорозі','Водолії','Рибах'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio',
 'Sagittarius','Capricorn','Aquarius','Pisces'];
const NAMES_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const GEN_UK:Record<string,string>={Sun:'Сонця',Moon:'Місяця',Mars:'Марса',
 Mercury:'Меркурія',Jupiter:'Юпітера',Venus:'Венери',Saturn:'Сатурна',Rahu:'Раху',Ketu:'Кету'};
// House numbers select D1 lords relevant for the traditional remit of each varga.
// Never mistake an "aspect" of a different varga for an unverified natal aspect.
const HOUSES:Readonly<Record<number,readonly number[]>>={
 1:[1],2:[2,11],3:[3],4:[4],7:[5],9:[7],10:[10,5],
 12:[4,9],16:[4],20:[9],24:[5,4],27:[1],30:[6,8],
 40:[4],45:[9]
};
const SECONDARY:Readonly<Record<number,string>>={
 2:'Jupiter',3:'Mars',4:'Venus',7:'Jupiter',9:'Venus',10:'Sun',12:'Sun',
 16:'Venus',20:'Jupiter',24:'Mercury',27:'Mars',30:'Saturn',40:'Moon',45:'Sun'
};
// Semantic cross-links are deliberately optional. Require a specific duplicated
// support/contrast on the SAME D1 house lord, never always print "connected to".
const COMPANION:Readonly<Record<number,number>>={
 2:10,4:12,7:9,9:7,10:24,12:4,16:4,20:9,24:10,27:30,30:27,40:12,45:9
};
const LESSON_UK:Readonly<Record<number,string>>={
 2:'Окремо оцінюйте особисті ресурси та результати роботи: вони не завжди зростають однаково.',
 3:'Практичний сенс — у розвитку навичок через дію, а не лише через наміри.',
 4:'Оцінюйте реальні умови дому й власності, а не робіть висновок лише зі статусу планети.',
 7:'Ця карта стосується дітей, наступних поколінь і того, що людина передає далі, а не автоматично любовних стосунків.',
 9:'D9 уточнює тему союзу, а не визначає характер або наміри іншої людини.',
 10:'Тут важливе не вгадування назви професії, а спосіб реалізації: де знання переходять у роботу.',
 12:'D12 стосується батьків і родинного походження; вона не може встановити біографічні факти без свідчень.',
 16:'Оцінюйте умови комфорту й побуту, не лише придбання речей.',
 20:'Це ракурс духовної практики та внутрішньої дисципліни, а не передбачення подій.',
 24:'D24 говорить про навчання й засвоєння знань; її не слід зводити до оцінок або дипломів.',
 27:'Це тема витривалості й способу витримувати навантаження, а не безпомилковий тест особистості.',
 30:'Обережні показники в D30 описують традиційні ризики та способи їх долати, а не неминучу поразку.',
 40:'Традиційний материнський родинний ракурс: не виводимо з нього конкретних подій минулого.',
 45:'Традиційний батьківський родинний ракурс: інші карти не замінюють фактичної сімейної історії.'
};
const LESSON_EN:Readonly<Record<number,string>>={
 2:'Holdings and career gains are separate mechanisms; do not assume they always rise together.',
 3:'The practical focus is practicing skills, not simply intending to act.',
 4:'Real home and property conditions matter more than one planetary label.',
 7:'D7 concerns children and what is passed to the next generation, not automatically romance.',
 9:'D9 adds a view of partnership without claiming to know another person’s thoughts.',
 10:'Look at the way skills become work, rather than guessing an inevitable job title.',
 12:'D12 concerns parents and ancestry, not verified facts about a family biography.',
 16:'Focus on sustainable comfort and daily surroundings, not just purchases.',
 20:'This is a lens on spiritual discipline, not a prediction of events.',
 24:'D24 concerns how learning develops, not a promise of academic awards.',
 27:'This reading concerns resilience, not a definitive personality test.',
 30:'Traditional caution is about navigating difficulties, not inevitable failure.',
 40:'A maternal-line symbolic lens, not a claim about unverified family history.',
 45:'A paternal-line symbolic lens; only evidence can establish family history.'
};
const strong=(v:string)=>v==='own'||v==='exalted';
const weak=(v:string)=>v==='debilitated';
const uniq=(values:readonly string[])=>[...new Set(values)];
export function buildN492Meaning(chart:CalculatedChart,lang:Lang,asOf:string):Conclusion|null{
 const source=verifiedVargaSource(chart);
 if(!source)return null;
 const uk=lang==='uk',context=readerClassicalContext(chart,asOf);
 const authored=authorConsultationV6(chart,lang,asOf);
 const chapter=(id:string)=>authored.find(x=>x.id===id)?.paragraphs||[];
 const lords=context.lords;
 const area=(h:number)=>(uk?HOUSES_UK:HOUSES_EN)[h-1]||('house '+h);
 const name=(p:string)=>uk?NAMES_UK[p]||p:p;
 const gen=(p:string)=>uk?GEN_UK[p]||p:p;
 const sign=(n:number)=>(uk?SIGNS_UK:SIGNS_EN)[n-1];
 const natal=(p:string)=>{const q=chart.d1.find(x=>x.name===p);if(!q)throw Error('N492_MISSING_D1_'+p);return q};
 const inD=(division:number,p:string)=>{
  const q=source.charts.find(d=>d.division===division)?.planets.find(x=>x.name===p);
  if(!q)throw Error('N492_MISSING_D'+division+'_'+p);return q;
 };
 const place=(p:string)=>natal(p).house;
 const yoga=context.yogakarakas;
 const status=(planet:string,s:number)=>{
  const d=dignityFor(planet,s);
  if(d==='exalted')return uk?'у знаку екзальтації':'exalted';
  if(d==='own')return uk?'у власному знаку':'in its own sign';
  if(d==='debilitated')return uk?'у знаку падіння':'in its sign of debilitation';
  return '';
 };
 const d1Facts=(planet:string)=>['D1.'+planet+'.sign='+natal(planet).sign,
  'D1.'+planet+'.house='+place(planet)];
 const cards:Card[]=[];
 const mk=(division:number,reading:string,main:string,secondary:string|null,attention:string|null,
  extras:readonly string[]=[]):Card=>{
  const proof=[...d1Facts(main),...(division===1?[]:[
   'D'+division+'.'+main+'.sign='+inD(division,main).sign,
   'D'+division+'.'+main+'.house='+inD(division,main).house]),
   ...secondary&&secondary!==main?d1Facts(secondary):[],...extras];
  return {division,reading:reading.trim(),corroboration:null,attention,
   sourceFacts:uniq(proof),sourceMethod:division===1?['PARASHARI_FUNCTIONAL_LORDSHIP','NAKSHATRA_D1']:
    ['PARASHARI_HOUSE_LORDSHIP','BPHS_SHODASAVARGA_SCOPE'],
   sensitivity:division>=16?'fine':'ordinary'};
 };
 const asc=lords[1],moon=natal('Moon'),lagna=chart.ascendant.sign;
 const yogakaraka=yoga[0];
 const d1Portrait=chapter('portrait')[0];
 const d1Moon=chapter('portrait')[1];
 const d1Reading=uk?
  'Висхідний знак задає ваш особистий напрям. Його управитель — '+name(asc)+
  ', у D1 він стоїть у '+place(asc)+'-му домі ('+area(place(asc))+'). '+
  'Місяць у '+sign(moon.sign)+' ('+moon.house+'-й дім) додає тему '+area(moon.house)+'.':
  'Your ascendant ruler is '+name(asc)+' in D1 house '+place(asc)+' ('+area(place(asc))+'). '+
  'The Moon in '+sign(moon.sign)+' (house '+moon.house+') adds '+area(moon.house)+'.';
 const d1Focus=yogakaraka?
  (uk?'Особливо важливий '+name(yogakaraka)+': він керує одночасно домами '+
   context.functional.find(f=>f.graha===yogakaraka)!.houses.join(' і ')+
   '. Це йогакарака, тому його положення необхідно врахувати при читанні праці та здібностей.':
   name(yogakaraka)+' is a yogakaraka, simultaneously ruling houses '+
   context.functional.find(f=>f.graha===yogakaraka)!.houses.join(' and ')+
   '. This functional role matters for vocational and creative readings.'):
  // Reuse the hidden, chart-specific authored interpretive layer, not a canned label.
  (d1Moon?d1Moon.split(/(?<=[.!?])\s+/u).slice(0,1).join(' '):'');
 cards.push(mk(1,d1Reading,asc,'Moon',d1Focus,
  ['D1.ascendant.sign='+lagna,...(yogakaraka?d1Facts(yogakaraka):[])]));
 for(const division of N492_DIVISIONS.filter(d=>d!==1&&d!==60)){
  const rulers=HOUSES[division]||[1], main=lords[rulers[0]], p=natal(main),d=inD(division,main);
  const second=SECONDARY[division]||lords[rulers[1]||rulers[0]];
  const alt=natal(second),dp=inD(division,second);
  const mainStatus=status(main,d.sign);
  const natalStatus=status(main,p.sign);
  const altStatus=status(second,dp.sign);
  const mainFocus=division===10?'професії':division===9?'стосунків':
   division===2?'ресурсів':division===24?'навчання':'цієї сфери';
  let statement=uk?
   'У темі '+mainFocus+' важливий управитель '+rulers[0]+'-го дому — '+name(main)+
   '. У головній карті він пов’язує її зі сферою «'+area(p.house)+
   '», а в D'+division+' стоїть у '+sign(d.sign)+' ('+d.house+'-й дім).':
   'For this area, a key D1 ruler is '+main+' (house '+rulers[0]+
   '), placed in D1 house '+p.house+' ('+area(p.house)+
   '). In D'+division+', it occupies '+sign(d.sign)+' (house '+d.house+').';
  if(division===10&&yoga.includes(main)){
   statement=uk?
    name(main)+' для вашого висхідного знака — йогакарака: він поєднує управління '+
    context.functional.find(f=>f.graha===main)!.houses.join('-м і ')+'-м домами. '+
    'У D1 він у '+p.house+'-му домі ('+area(p.house)+
    '), а в професійній D10 — у '+sign(d.sign)+' ('+d.house+'-й дім).':
    main+' is a yogakaraka for this ascendant, ruling houses '+
    context.functional.find(f=>f.graha===main)!.houses.join(' and ')+
    '. It occupies D1 house '+p.house+' ('+area(p.house)+
    ') and D10 '+sign(d.sign)+' (house '+d.house+').';
  }else if(division===9){
   statement=uk?'Сьомим домом D1 керує '+name(main)+' (у '+p.house+
    '-му домі). У D9 ця планета стоїть у '+sign(d.sign)+
    ', а Венера — у '+sign(inD(9,'Venus').sign)+
    '. Читаємо обидва показники разом: один описує зв’язок сфер життя, другий — символіку близькості.':
    'The D1 seventh lord '+main+' occupies house '+p.house+
    '. In D9 it is in '+sign(d.sign)+', while Venus is in '+sign(inD(9,'Venus').sign)+
    '. The partnership ruler and Venus provide complementary evidence.';
  }else if(division===2){
   const other=lords[11];
   statement=uk?'Другий дім (особисті ресурси) контролює '+name(main)+
    ' із '+p.house+'-го дому; одинадцятий (здобутки) — '+name(other)+
    ' із '+place(other)+'-го. У D2 '+name(main)+' перебуває у '+sign(d.sign)+
    '. Тут важливо розділити збереження ресурсів і приріст від роботи.':
    'Personal resources (house 2) are ruled by '+main+' in house '+p.house+
    ', while gains (house 11) are ruled by '+other+' in house '+place(other)+
    '. In D2, '+main+' occupies '+sign(d.sign)+'. These are different financial mechanisms.';
  }else if(division===12){
   statement=uk?'D12 стосується батьків і походження. Управитель четвертого дому '+
    name(main)+' у D1 розміщений у '+p.house+'-му, а в D12 — у '+
    sign(d.sign)+'. Управитель дев’ятого дому '+name(lords[9])+
    ' у D1 стоїть у '+place(lords[9])+'-му. Обидві лінії важливі, але не встановлюють фактів вашої родинної історії.':
    'D12 concerns parents and origins. The fourth lord '+main+
    ' is in D1 house '+p.house+' and D12 '+sign(d.sign)+
    ', while the ninth lord '+lords[9]+' occupies D1 house '+place(lords[9])+
    '. These are symbolic, not claims about actual family events.';
  }
  const dignityNote=mainStatus?
   (uk?' У D'+division+' '+name(main)+' '+mainStatus+
    '; це важливий традиційний показник, але не повна сила планети.':
    ' In D'+division+', '+main+' is '+mainStatus+
    ', a meaningful traditional indication but not complete planetary strength.'):'';
  const bornDignity=natalStatus&&natalStatus!==mainStatus?
   (uk?' У D1 ця сама планета '+natalStatus+' — оцінки двох карт треба розрізняти.':
    ' In D1 the same planet is '+natalStatus+'; these two indications need separate weighting.'):'';
  const supporting=second!==main&&altStatus&&(strong(dignityFor(second,dp.sign))||weak(dignityFor(second,dp.sign)))?
   (uk?' Додатково '+name(second)+' у D'+division+' '+altStatus+'.':
    ' The additional '+second+' in D'+division+' is '+altStatus+'.'):'';
  const reading=(statement+dignityNote+bornDignity+supporting).trim();
  const extra=second!==main?['D'+division+'.'+second+'.sign='+dp.sign,
   'D'+division+'.'+second+'.house='+dp.house]:[];
  if(division===2){
   extra.push('D1.house-lord.11='+lords[11],...d1Facts(lords[11]));
  }
  if(division===12){
   extra.push('D1.house-lord.9='+lords[9],...d1Facts(lords[9]));
  }
  const card=mk(division,reading,main,second,null,
   ['D1.house-lord.'+rulers[0]+'='+main,...extra]);
  // Only connect another varga when the SAME planet has a genuinely notable
  // concordance or counterpoint in sign dignity; never invent generic synergy.
  const related=COMPANION[division];
  if(related){
   const other=inD(related,main);
   const a=dignityFor(main,d.sign),b=dignityFor(main,other.sign);
   if(strong(a)&&strong(b)){
    card.corroboration=uk?
     'Підтвердження з D'+related+': '+name(main)+' має сприятливий знаковий статус і там. Дві варги підтримують один показник, але це не гарантує результату.':
     'D'+related+' independently repeats a favourable sign dignity for '+main+
     '. That supports one specific indicator without promising an outcome.';
   }else if(strong(a)&&weak(b)||weak(a)&&strong(b)){
    card.corroboration=uk?
     'Важлива різниця: у D'+related+' '+name(main)+' має протилежний знаковий статус. Не можна переносити висновок з однієї теми на всі інші.':
     'In D'+related+', '+main+' has the opposite sign status. One favourable result cannot be applied to every area.';
   }else if(other.sign===d.sign&&division!==1&&related!==division){
    card.corroboration=uk?
     'D'+related+' повторює положення '+gen(main)+' у '+sign(d.sign)+
     '. Це перевірений збіг знака, не окремий доказ події.':
     'D'+related+' repeats '+main+' in '+sign(d.sign)+
     '. This is a verified same-sign agreement, not a separate event prediction.';
   }
   if(card.corroboration)card.sourceFacts=uniq([...card.sourceFacts,
    'D'+related+'.'+main+'.sign='+other.sign,'D'+related+'.'+main+'.house='+other.house]);
  }
  // This is a topic-specific, plain-language *interpretive* implication from
  // V6's domain meanings and the original Parashari functional roles.
  if(!card.corroboration&&division===10&&d.house===6){
   card.corroboration=uk?'Ключовий практичний акцент: складні задачі, щоденна майстерність і робота з помилками.':
    'The working theme is solving hard problems, building skill through practice and addressing mistakes.';
  }
  if(!card.corroboration&&division===9&&p.house===9){
   card.corroboration=uk?'Управитель партнерства у дев’ятому домі робить світогляд, навчання та спільні принципи помітною темою союзу.':
    'A seventh lord in the ninth makes shared beliefs, learning and principles a visible relationship theme.';
  }
  if(!card.corroboration&&division===24&&d.house===6){
   card.corroboration=uk?'Навчання в цій карті пов’язане з практикою й повторенням складних задач, а не тільки з теорією.':
    'Learning here emphasizes repeated practical work on demanding tasks rather than theory alone.';
  }
  if(!card.corroboration&&division===7&&p.house===9){
   card.corroboration=uk?'П’ятий управитель у дев’ятому домі пов’язує виховання та творчий спадок зі знаннями й наставництвом.':
    'The fifth lord in the ninth links creative legacy and children’s education with knowledge and mentorship.';
  }
  // Neither uncertainty nor lack of dignity should be translated into an
  // alarming claim. The traditional varga remit is shown briefly, if needed.
  if(!card.corroboration){
   card.attention=uk?LESSON_UK[division]||null:LESSON_EN[division]||null;
  }
  cards.push(card);
 }
 const preview=buildD60Preview(chart,lang);
 let d60=uk?'D60 уточнює тонкі символічні відтінки планет за введеним моментом народження.':
  'D60 shows finer symbolic planetary placements for the entered birth instant.';
 if(preview.status==='conditional_signs'&&preview.allPlanets.length===9){
  const focus=preview.factors.slice(0,2);
  if(focus.length)d60+=' '+focus.map(x=>x.note).join(' ');
  else d60+=' '+(uk?'Жодне з обраних положень не має достатнього відступу від межі для персонального акценту.':
   'No selected sign is sufficiently distant from the boundary for a personal emphasis.');
 }
 const c60:Card={division:60,reading:d60,corroboration:null,
  attention:uk?'Знаки D60 — обчислення для введеного часу, а не перевірка точності хвилини. Доми та лагна D60 тут не трактуються.':
   'D60 signs are computed for the entered time, not birth-time verification. D60 houses and ascendant remain uninterpreted.',
  sourceFacts:preview.status==='conditional_signs'?preview.allPlanets.flatMap(p=>
   ['D1.'+p.planet+'.sign='+p.d1Sign,'D60.'+p.planet+'.sign='+p.d60Sign,
    'D60.'+p.planet+'.boundaryArcsec='+Math.round(p.boundaryDistanceArcseconds)]):[],
  sourceMethod:['N4_D60_PROVISIONAL_SIGN_MAPPING'],sensitivity:'provisional'};
 cards.push(c60);
 if(cards.length!==16||cards.some((c,i)=>c.division!==N492_DIVISIONS[i]))throw Error('N492_MISSING_OR_DISORDERED_VARGAS');
 const key=lords[10],a=natal(key),work=inD(10,key);
 const workHigh=strong(dignityFor(key,work.sign));
 const d1Card=cards[0],profession=cards.find(c=>c.division===10)!;
 const relationships=cards.find(c=>c.division===9)!;
 const takeaways=[
  {text:uk?'Ваша основа: висхідний знак '+sign(lagna)+'; управитель '+name(asc)+
    ' у '+place(asc)+'-му домі ('+area(place(asc))+'). Місяць — у '+
    moon.house+'-му ('+area(moon.house)+').':
   'Your foundation: ascendant '+sign(lagna)+', ruled by '+name(asc)+
    ' in house '+place(asc)+' ('+area(place(asc))+'); Moon in house '+
    moon.house+' ('+area(moon.house)+').',
   sourceFacts:d1Card.sourceFacts},
  {text:uk?(yoga.includes(key)?name(key)+' — йогакарака для цієї лагни. ':'')+
     'Кар’єрний управитель у D1 стоїть у '+a.house+'-му домі, а в D10 — у '+
     sign(work.sign)+(workHigh?' (сприятливий статус за знаком)':'')+
     '. Порівнюйте навчання з реальними професійними діями.':
    (yoga.includes(key)?key+' is a yogakaraka for this ascendant. ':'')+
     'The tenth lord occupies D1 house '+a.house+' and D10 '+sign(work.sign)+
     (workHigh?' (favourable sign dignity)':'')+'. Connect learning with real professional practice.',
   sourceFacts:profession.sourceFacts},
  {text:uk?'У стосунках ключовий управитель сьомого дому '+name(lords[7])+
      ' у D1 займає '+place(lords[7])+'-й дім. Його потрібно читати разом із Венерою в D9, не підміняючи конкретну людину прогнозом.':
    'For relationships, the seventh lord '+lords[7]+' occupies D1 house '+
    place(lords[7])+'. Read it with Venus in D9, not as a claim about another person’s intentions.',
   sourceFacts:relationships.sourceFacts}
 ];
 return {version:N492_MEANING_VERSION,cards,takeaways,
  limits:uk?'Трактування описує традиційні астрологічні показники, не факти про життя. D60 залежить від часу; сила планет і спеціальні йоги не вважаються повністю сертифікованими.':
   'Traditional chart interpretation is not evidence about real-life events. D60 depends on birth-time accuracy; full planetary strength and specialized yogas are not claimed certified.'};
}
