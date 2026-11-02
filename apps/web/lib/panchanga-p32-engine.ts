/** Panchanga Interpretation Engine v1, P3.2.
 * Pure traditional electional interpretation of the FIVE verified limbs,
 * the waxing/waning lunar phase and the observer-local Rahu interval.
 * Not a natal reading and never a prediction of guaranteed life outcomes.
 *
 * Source policy / limitations: docs/research/panchanga-p32-rules-2026-11-02.md
 * No server calls, LLMs, birth data, astronomy or license changes.
 */
import type {P31Topic} from './panchanga-p31-model';

type Lang={uk:string;en:string};
type Tone='supports'|'cautions'|'blocks'|'neutral';
type Factor='tithi'|'nakshatra'|'vara'|'yoga'|'karana'|'moon'|'rahu';
type Tithi={number:number;paksha:'Shukla'|'Krishna';numberWithinPaksha:number};
type Named={number:number;name:string};
type Karana={slot:number;name:string};
type Nakshatra=Named&{pada:number};
type Angas={tithi:Tithi;nakshatra:Nakshatra;vara:Named;yoga:Named;karana:Karana};
type Period<K extends keyof Angas>={startUtc:string;endUtc:string;value:Angas[K]};
export type P32Day={
 date:string;location:{timeZone:string};sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 sunrise:Angas;periods:{tithi:Period<'tithi'>[];nakshatra:Period<'nakshatra'>[];
  yoga:Period<'yoga'>[];karana:Period<'karana'>[]};
 daytimeKalas:{rahuKalam:{fromUtc:string;untilUtc:string}};
};
export type InterpretationEvidence={id:string;factor:Factor;tone:Tone;detail:Lang;
 source:'rashtriya'|'drik-nakshatra'|'muhurta-tradition'|'swiss-calendar';
 startUtc?:string;endUtc?:string};
export type P32Result={version:'panchanga-interpretation-p32';scope:'traditional-calendar-only';
 topic:P31Topic;date:string;timeZone:string;moment:'live'|'sunrise-snapshot';
 status:'avoid'|'caution'|'supported'|'neutral';evaluatedAtUtc:string;
 headline:Lang;action:Lang;reason:Lang;untilUtc:string|null;
 moon:Lang;subject:Lang;personalized:false;coverage:{fiveLimbs:true;moonPhase:true;rahu:true;
 natal:false;exactMuhurta:false};
 evidence:InterpretationEvidence[]};

const speak=(uk:string,en:string):Lang=>({uk,en});
const TOPICS:Record<P31Topic,{act:Lang;prepare:Lang}>={
 work:{act:speak('переговори про підвищення або нові посадові умови','a salary negotiation or new job terms'),
  prepare:speak('Підготуйте факти про результати роботи, а початок переговорів перенесіть.',
    'Prepare evidence of your work and postpone starting the negotiation.')},
 money:{act:speak('нову фінансову угоду чи важливу покупку','a new financial agreement or major purchase'),
  prepare:speak('Перевірте суми й умови; підписання або початок угоди перенесіть.',
    'Check amounts and terms; postpone signing or starting the agreement.')},
 relationships:{act:speak('важливу розмову про стосунки','an important relationship conversation'),
  prepare:speak('Запишіть, що хочете обговорити; важливу розмову почніть пізніше.',
    'Write down what you want to discuss; start the important conversation later.')},
 travel:{act:speak('нову важливу поїздку','an important new trip'),
  prepare:speak('Перевірте маршрут і квитки; початок нової поїздки перенесіть.',
    'Check your route and tickets; postpone the start of the new journey.')},
 personal:{act:speak('нову важливу особисту справу','an important new personal undertaking'),
  prepare:speak('Завершіть підготовку; початок нової справи перенесіть.',
    'Finish preparing; postpone starting the new undertaking.')}
};
const ALL_TOPICS=Object.keys(TOPICS) as P31Topic[];
// Complete classical seven-nature grouping; index = Nakshatra number (1-based).
const NAK_NATURE=['','swift','fierce','mixed','fixed','gentle','sharp','movable','swift','sharp',
 'fierce','gentle','fixed','swift','gentle','movable','mixed','gentle','sharp','sharp',
 'fierce','fixed','movable','movable','movable','fierce','fixed','gentle'] as const;
const GROUPS:Record<string,{topics:P31Topic[];tone:Tone;detail:Lang}[]>={
 fixed:[{topics:['work','money','personal'],tone:'supports',detail:speak(
  'Стійка накшатра традиційно підходить для довготривалих домовленостей.',
  'A fixed nakshatra traditionally supports lasting commitments.')}],
 movable:[{topics:['travel'],tone:'supports',detail:speak(
  'Рухлива накшатра традиційно підходить для початку поїздки.',
  'A movable nakshatra traditionally supports starting a journey.')}],
 swift:[{topics:['work','money','travel'],tone:'supports',detail:speak(
  'Швидка накшатра традиційно підходить для торгівлі, навчання й коротких справ.',
  'A swift nakshatra traditionally suits trade, learning and short tasks.')}],
 gentle:[{topics:['relationships','personal'],tone:'supports',detail:speak(
  'М’яка накшатра традиційно підходить для примирення та дружніх розмов.',
  'A gentle nakshatra traditionally supports reconciliation and friendly conversations.')}],
 fierce:[{topics:['relationships','money'],tone:'cautions',detail:speak(
  'Сувора накшатра не вважається добрим вибором для мирної розмови чи добровільної угоди.',
  'A fierce nakshatra is not traditionally selected for gentle talks or voluntary agreements.')}],
 sharp:[{topics:['work','money','relationships','travel','personal'],tone:'cautions',detail:speak(
  'Гостра накшатра традиційно підходить для рішучих дій, а не для м’якого початку нової справи.',
  'A sharp nakshatra suits decisive acts, not gentle beginnings of new undertakings.')}],
 mixed:[], 
};
const VARA_SUPPORT:Partial<Record<number,P31Topic[]>>={
 1:['work'],2:['relationships'],3:['personal'],4:['work','money'],5:['work','money'],
 6:['relationships','personal'],7:['personal']
};
const YOGA_BLOCK=new Set([17,27]); // Vyatipata, Vaidhriti (Nitya Yoga)
const YOGA_SUPPORT=new Set([4,5,7,11,12,16,20,21,22,23,24,25]);
const MOVABLE_KARANAS=['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'] as const;
const YOGA_NAMES=['Vishkumbha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'] as const;
const VARA_NAMES=['Ravivara','Somavara','Mangalavara','Budhavara','Guruvara','Shukravara','Shanivara'] as const;
function expectedKarana(slot:number){
 if(slot===1)return 'Kimstughna';
 if(slot===58)return 'Shakuni';
 if(slot===59)return 'Chatushpada';
 if(slot===60)return 'Naga';
 return MOVABLE_KARANAS[(slot-2)%7];
}
const SOURCE={tithi:'muhurta-tradition',nakshatra:'drik-nakshatra',vara:'muhurta-tradition',
 yoga:'muhurta-tradition',karana:'muhurta-tradition',moon:'rashtriya',rahu:'muhurta-tradition'} as const;
function parse(iso:string){if(typeof iso!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(iso))throw Error('P32 invalid UTC time');const t=Date.parse(iso);if(!Number.isFinite(t))throw Error('P32 invalid UTC time');return t;}
function dayAt(t:number,zone:string){const p=new Intl.DateTimeFormat('en-US',{timeZone:zone,
 year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(t));
 const get=(k:string)=>p.find(x=>x.type===k)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');}
function checkAngas(a:Angas){
 if(!a||!a.tithi||!a.nakshatra||!a.vara||!a.yoga||!a.karana||
  !Number.isInteger(a.tithi.number)||a.tithi.number<1||a.tithi.number>30||
  !Number.isInteger(a.tithi.numberWithinPaksha)||a.tithi.numberWithinPaksha<1||a.tithi.numberWithinPaksha>15||
  !['Shukla','Krishna'].includes(a.tithi.paksha)||
  a.tithi.number!==(a.tithi.paksha==='Shukla'?a.tithi.numberWithinPaksha:a.tithi.numberWithinPaksha+15)||
  !Number.isInteger(a.nakshatra.number)||a.nakshatra.number<1||a.nakshatra.number>27||
  !Number.isInteger(a.vara.number)||a.vara.number<1||a.vara.number>7||
  !Number.isInteger(a.yoga.number)||a.yoga.number<1||a.yoga.number>27||
  !Number.isInteger(a.karana.slot)||a.karana.slot<1||a.karana.slot>60||
  typeof a.karana.name!=='string'||a.karana.name!==expectedKarana(a.karana.slot)||
  a.vara.name!==VARA_NAMES[a.vara.number-1]||
  a.yoga.name!==YOGA_NAMES[a.yoga.number-1])
  throw Error('P32 inconsistent five limbs; no interpretation emitted');
}
export function interpretPanchanga(day:P32Day,nowMs:number,topic:P31Topic,mode:'auto'|'sunrise-snapshot'='auto'):P32Result{
 if(!ALL_TOPICS.includes(topic)||!Number.isFinite(nowMs))throw Error('P32 invalid request');
 const sunrise=parse(day.sunriseUtc),sunset=parse(day.sunsetUtc),next=parse(day.nextSunriseUtc),
  rahuFrom=parse(day.daytimeKalas?.rahuKalam?.fromUtc??''),rahuEnd=parse(day.daytimeKalas?.rahuKalam?.untilUtc??'');
 if(!(sunrise<rahuFrom&&rahuFrom<rahuEnd&&rahuEnd<=sunset&&sunset<next&&
  next-sunrise>=20*3600000&&next-sunrise<=28*3600000))throw Error('P32 unverified sunrise/rahu times');
 const expectedVara=new Date(day.date+'T12:00:00Z').getUTCDay()+1;
 if(!Number.isFinite(expectedVara)||day.sunrise.vara?.number!==expectedVara)
  throw Error('P32 sunrise weekday mismatch');
 const live=mode!=='sunrise-snapshot'&&nowMs>=sunrise&&nowMs<next&&dayAt(nowMs,day.location.timeZone)===day.date;
 const sample=live?nowMs:sunrise,selected={} as Angas;
 const untils:number[]=[next];
 for(const limb of ['tithi','nakshatra','yoga','karana'] as const){
  const periods=day.periods?.[limb];
  if(!Array.isArray(periods)||periods.length<1||periods.length>12)throw Error('P32 incomplete '+limb+' periods');
  const matches=periods.filter(p=>parse(p.startUtc)<=sample&&sample<parse(p.endUtc));
  if(matches.length!==1)throw Error('P32 missing/overlapping '+limb+' period');
  const active=matches[0];
  // Preserve type relationship via structural assignments after validation.
  (selected as unknown as Record<string,unknown>)[limb]=active.value;
  const until=parse(active.endUtc);if(until>sample)untils.push(until);
 }
 selected.vara=day.sunrise.vara;
 checkAngas(selected);
 // A verified sunrise snapshot must also match backend sunrise values.
 checkAngas(day.sunrise);
 if(!live&&JSON.stringify(selected)!==JSON.stringify({
  tithi:day.sunrise.tithi,nakshatra:day.sunrise.nakshatra,yoga:day.sunrise.yoga,
  karana:day.sunrise.karana,vara:day.sunrise.vara}))throw Error('P32 sunrise snapshot mismatch');
 const evidences:InterpretationEvidence[]=[];
 const add=(id:string,factor:Factor,tone:Tone,detail:Lang,startUtc?:string,endUtc?:string)=>{
  evidences.push({id,factor,tone,detail,source:SOURCE[factor],...(startUtc?{startUtc}:{}),...(endUtc?{endUtc}:{})});
 };
 const n=selected.tithi.numberWithinPaksha;
 if([4,9,14].includes(n))add('TITHI_RIKTA', 'tithi','cautions',speak(
  'Порожня тітхі (4, 9 або 14): традиційно не обирають для початку важливих справ.',
  'Rikta tithi (4, 9 or 14): traditionally avoided for starting important work.'));
 else if(selected.tithi.number===30)add('TITHI_AMAVASYA','tithi','cautions',speak(
  'Амавасья: за традицією не обирають для початку великих нових справ.',
  'Amavasya: traditionally not selected for important new undertakings.'));
 else if([2,3,5,7,10,11,13].includes(n))add('TITHI_COMMON_SUPPORT','tithi','supports',speak(
  'Ця тітхі належить до груп, які зазвичай розглядають для початку справ.',
  'This tithi belongs to groups commonly considered for new undertakings.'));
 else add('TITHI_NO_VERDICT','tithi','neutral',speak(
  'Ця тітхі сама по собі не визначає рішення.',
  'This tithi alone does not determine the decision.'));
 const nature=NAK_NATURE[selected.nakshatra.number];if(!nature)throw Error('P32 unknown nakshatra');
 const nak=(GROUPS[nature]||[]).find(x=>x.topics.includes(topic));
 add('NAKSHATRA_'+nature.toUpperCase(),'nakshatra',nak?.tone??'neutral',nak?.detail??speak(
  'Для цієї справи накшатра не дає однозначного висновку.',
  'This nakshatra alone gives no decisive recommendation for this activity.'));
 const supportVara=VARA_SUPPORT[selected.vara.number]?.includes(topic)??false;
 add('VARA_'+selected.vara.number,'vara',supportVara?'supports':'neutral',supportVara?speak(
  'День тижня традиційно пов’язаний із цією сферою справ.',
  'The traditional weekday is associated with this kind of activity.'):speak(
  'День тижня не додає окремої заборони для цієї справи.',
  'The weekday adds no separate prohibition for this activity.'));
 const yog=selected.yoga.number;
 add('NITYA_YOGA_'+yog,'yoga',YOGA_BLOCK.has(yog)?'blocks':YOGA_SUPPORT.has(yog)?'supports':'neutral',
  YOGA_BLOCK.has(yog)?speak('В’ятіпата або Вайдхріті: традиційно не починають важливих сприятливих справ.',
   'Vyatipata or Vaidhriti: traditionally avoided for significant auspicious beginnings.'):
  YOGA_SUPPORT.has(yog)?speak('Нітья-йога належить до традиційно сприятливих для початку справ.',
   'This Nitya Yoga is traditionally considered supportive of new beginnings.'):
  speak('Нітья-йога не дає достатньої підстави для окремого рішення.',
   'This Nitya Yoga alone does not justify a decision.'));
 const badKarana=selected.karana.name==='Vishti';
 add('KARANA_'+selected.karana.name.toUpperCase(),'karana',badKarana?'blocks':'neutral',
  badKarana?speak('Вішті (Бхадра): за традицією не починають важливі сприятливі справи.',
   'Vishti (Bhadra): traditionally avoided for important auspicious beginnings.'):
  speak('Ця карана не є Вішті; сама по собі не гарантує сприятливого часу.',
   'This Karana is not Vishti; it does not alone establish an auspicious time.'));
 const waxing=selected.tithi.paksha==='Shukla';
 add('MOON_'+selected.tithi.paksha.toUpperCase(),'moon','neutral',waxing?
  speak('Місяць зростає; це фаза циклу, а не самостійний дозвіл починати справу.',
   'The Moon is waxing; the phase alone is not permission to start an undertaking.'):
  speak('Місяць спадає; це фаза циклу, а не самостійна заборона.',
   'The Moon is waning; the phase alone is not a prohibition.'));
 const duringRahu=sample>=rahuFrom&&sample<rahuEnd;
 add('RAHU_KALAM','rahu',duringRahu?'blocks':'neutral',duringRahu?speak(
  'Зараз Раху-калам: за традицією нові важливі справи не починають.',
  'Rahu Kalam is active: traditionally, do not begin important new undertakings.'):
  speak('Раху-калам не триває у вибраний момент; це не підтверджує загальну сприятливість.',
   'Rahu Kalam is inactive at the selected instant; this does not prove the time auspicious.'),
  day.daytimeKalas.rahuKalam.fromUtc,day.daytimeKalas.rahuKalam.untilUtc);
 if(live&&nowMs<rahuFrom)untils.push(rahuFrom);
 if(live&&duringRahu)untils.push(rahuEnd);
 const blocks=evidences.filter(e=>e.tone==='blocks'),cautions=evidences.filter(e=>e.tone==='cautions'),
  supports=evidences.filter(e=>e.tone==='supports');
 const status:P32Result['status']=blocks.length?'avoid':cautions.length?'caution':supports.length>=2?'supported':'neutral';
 const first=blocks[0]||cautions[0]||supports[0]||evidences[0];
 const action=TOPICS[topic].act,prep=TOPICS[topic].prepare;
 const headline=status==='avoid'?(live?speak('Не починайте цю справу зараз','Do not start this undertaking now'):
  speak('На сході Сонця — несприятливі умови для початку','At sunrise — unfavourable for starting')):
  status==='caution'?speak('Краще відкласти початок','Better postpone the start'):
  status==='supported'?speak('Традиційні показники підтримують цей задум','Traditional factors support this plan'):
  speak('Немає достатніх підстав радити початок','Not enough evidence to recommend starting');
 const advice=status==='avoid'||status==='caution'?prep:status==='supported'?
  speak('Можна розглянути '+action.uk+', але для точного часу потрібна окрема мухурта й натальна карта.',
   'You can consider '+action.en+', but precise timing requires a full muhurta and birth chart.'):
  speak('Для '+action.uk+' спочатку перевірте інший час і персональні чинники.',
   'Before '+action.en+', check another time and your personal factors.');
 const reasons=status==='avoid'||status==='caution'?first.detail: status==='supported'?speak(
  'Кілька незалежних календарних показників підтримують вибрану справу; суперечливих заборон у цьому наборі немає.',
  'Several independent calendar factors support this activity; no opposing prohibitions were found in this evaluated set.'):
  speak('Показники не дають стійкого спільного висновку.','The evaluated factors do not give a consistent joint conclusion.');
 const nextChange=live?Math.min(...untils.filter(ms=>ms>nowMs)):null;
 return {version:'panchanga-interpretation-p32',scope:'traditional-calendar-only',topic,date:day.date,
  timeZone:day.location.timeZone,moment:live?'live':'sunrise-snapshot',evaluatedAtUtc:new Date(sample).toISOString(),status,headline,
  action:advice,reason:reasons,untilUtc:nextChange===null?null:new Date(nextChange).toISOString(),
  moon:waxing?speak('Зростаючий Місяць','Waxing Moon'):speak('Спадний Місяць','Waning Moon'),
  subject:action,personalized:false,coverage:{fiveLimbs:true,moonPhase:true,rahu:true,natal:false,exactMuhurta:false},
  evidence:evidences};
}
