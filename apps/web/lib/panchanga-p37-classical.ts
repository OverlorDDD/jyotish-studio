/** P3.7 Classical Panchanga: an auditable explanation layer, NOT a second ephemeris.
 * Each card is bound to the SAME verified P3.2 UTC evaluation and activity.
 * Sources: B. V. Raman, Muhurtha, chapters II–IV; Muhurta Chintamani
 * Nakshatra Prakarana 2–8; Drik Panchang's 27-star classification.
 * Avoid invented points, percentages, life-event predictions or unsupported dosha overrides.
 */
import type {P32Day,P32Result} from './panchanga-p32-engine';

type Lang={uk:string;en:string};
const L=(uk:string,en:string):Lang=>({uk,en});
export type P37Factor='tithi'|'vara'|'nakshatra'|'yoga'|'karana';
export type P37Card={factor:P37Factor;name:Lang;value:Lang;classification:Lang;
 explanation:Lang;application:Lang;tone:'supports'|'cautions'|'blocks'|'neutral';
 untilUtc:string|null;reference:string};
export const P37_SOURCES={
 nakshatra:'https://www.drikpanchang.com/panchang/nakshatra/classification/nakshatra-seven-category.html',
 classical:'https://www.panchanga.lv/wp-content/uploads/2020/06/Muhurta_Raman.pdf'
} as const;
// Numeric 1–27 Swiss/Panchanga order; Abhijit is outside the 27 equal divisions.
const STAR_CLASSES:Record<string,readonly number[]>={
 fixed:[4,12,21,26],movable:[7,15,22,23,24],fierce:[2,10,11,20,25],
 mixed:[3,16],swift:[1,8,13],gentle:[5,14,17,27],sharp:[6,9,18,19]
};
const STAR_LANGUAGE:Record<string,{label:Lang,meaning:Lang}>={
 fixed:{label:L('Дхрува (нерухома)','Dhruva (fixed)'),meaning:L(
  'Клас накшатри Дхрува традиційно використовують для тривалих, стійких починань — наприклад, основи будівництва або служби.',
  'Dhruva nakshatras are traditionally selected for stable, lasting undertakings such as laying foundations or starting service.')},
 movable:{label:L('Чара (рухома)','Chara (movable)'),meaning:L(
  'Клас Чара пов’язують із рухом, транспортом і початком подорожей.',
  'Chara is associated with movement, vehicles and beginning journeys.')},
 swift:{label:L('Кшипра (швидка)','Kshipra (swift)'),meaning:L(
  'Клас Кшипра використовують для коротких справ, торгівлі, навчання та швидких починань.',
  'Kshipra is used for shorter undertakings, trade, learning and swift starts.')},
 gentle:{label:L('Мріду (м’яка)','Mridu (gentle)'),meaning:L(
  'Клас Мріду пов’язують із дружбою, мистецтвом та мирними взаєминами.',
  'Mridu is linked with friendship, arts and gentle interpersonal activities.')},
 fierce:{label:L('Угра (сувора)','Ugra (fierce)'),meaning:L(
  'Угра традиційно призначена для жорстких дій; це не загальне схвалення мирних починань.',
  'Ugra is traditionally assigned to forceful acts, not a general endorsement of gentle beginnings.')},
 sharp:{label:L('Тікшна (гостра)','Tikshna (sharp)'),meaning:L(
  'Тікшна має різкий характер і не є універсально сприятливою для мирних починань.',
  'Tikshna has a sharp nature and is not broadly suitable for gentle beginnings.')},
 mixed:{label:L('Мішра (змішана)','Mishra (mixed)'),meaning:L(
  'Мішра має змішаний характер; призначення справи слід оцінювати окремо.',
  'Mishra has a mixed nature; suitability depends on the exact activity.')}
};
const TITHI_CLASSES=[
 {name:L('Нанда','Nanda'),meaning:L('Група Нанда асоціюється з радістю; сама назва ще не визначає результат справи.','The Nanda group is traditionally associated with joy; its name alone does not determine suitability.')},
 {name:L('Бхадра','Bhadra'),meaning:L('Група Бхадра асоціюється зі сприятливими, упорядкованими діями; інші складники теж потрібно перевірити.','The Bhadra tithi group is associated with orderly auspicious actions; the other limbs still matter.')},
 {name:L('Джая','Jaya'),meaning:L('Група Джая пов’язана з подоланням труднощів; це не обіцянка перемоги.','Jaya is associated with overcoming obstacles, not a promise of success.')},
 {name:L('Рікта (порожня)','Rikta (empty)'),meaning:L('4, 9 та 14 тітхі кожної пакші: традиційне застереження щодо важливих нових починань.','The 4th, 9th and 14th tithis of each paksha traditionally caution against important new starts.')},
 {name:L('Пурна (повна)','Purna (full)'),meaning:L('Група Пурна пов’язана із завершеністю; для конкретної справи потрібна перевірка решти показників.','The Purna group is associated with fullness; a specific undertaking still needs the other limbs checked.')}
] as const;
const VARA_RULERS=[L('Сонце','Sun'),L('Місяць','Moon'),L('Марс','Mars'),L('Меркурій','Mercury'),L('Юпітер','Jupiter'),L('Венера','Venus'),L('Сатурн','Saturn')];
const YOGA_WARN=new Set([17,27]);
const KARANA_UK:Record<string,string>={Kimstughna:'Кімстугхна',Bava:'Бава',Balava:'Балава',
 Kaulava:'Каулава',Taitila:'Тайтіла',Garaja:'Гараджа',Vanija:'Ваніджа',
 Vishti:'Вішті (Бхадра)',Shakuni:'Шакуні',Chatushpada:'Чатушпада',Naga:'Нага'};
const NAK_UK=['Ашвіні','Бхарані','Кріттіка','Рохіні','Мрігашіра','Ардра','Пунарвасу',
 'Пуш’я','Ашлеша','Магха','Пурва Пхалгуні','Уттара Пхалгуні','Хаста','Чітра','Сваті',
 'Вішакха','Анурадха','Дж’єштха','Мула','Пурва Ашадха','Уттара Ашадха','Шравана',
 'Дханіштха','Шатабхіша','Пурва Бхадрапада','Уттара Бхадрапада','Реваті'];
export function p37NakshatraClass(number:number){
 if(!Number.isInteger(number)||number<1||number>27)throw Error('P3.7 invalid nakshatra');
 const matches=Object.entries(STAR_CLASSES).filter(([,members])=>members.includes(number));
 if(matches.length!==1)throw Error('P3.7 ambiguous nakshatra class');
 return matches[0][0];
}
function activeUntil(day:P32Day,factor:Exclude<P37Factor,'vara'>,at:number):string{
 const matching=day.periods[factor].filter(p=>Date.parse(p.startUtc)<=at&&at<Date.parse(p.endUtc));
 if(matching.length!==1)throw Error('P3.7 missing/overlapping verified '+factor);
 return matching[0].endUtc;
}
export function explainClassicalPanchanga(day:P32Day,result:P32Result):P37Card[]{
 if(result.version!=='panchanga-interpretation-p32'||result.date!==day.date||
    result.timeZone!==day.location.timeZone||!Number.isFinite(Date.parse(result.evaluatedAtUtc)))
  throw Error('P3.7 unverified calendar identity');
 const at=Date.parse(result.evaluatedAtUtc);
 if(at<Date.parse(day.sunriseUtc)||at>=Date.parse(day.nextSunriseUtc))
  throw Error('P3.7 evaluation outside verified sunrise day');
 const values=Object.fromEntries(['tithi','vara','nakshatra','yoga','karana'].map(f=>{
  if(f==='vara')return [f,day.sunrise.vara];
  const periods=day.periods[f as Exclude<P37Factor,'vara'>];
  const hits=periods.filter(p=>Date.parse(p.startUtc)<=at&&at<Date.parse(p.endUtc));
  if(hits.length!==1)throw Error('P3.7 ambiguous '+f);
  return [f,hits[0].value];
 })) as Record<P37Factor,any>;
 const out:P37Card[]=[];
 const make=(factor:P37Factor,name:Lang,value:Lang,classification:Lang,explanation:Lang)=>{
  const matches=result.evidence.filter(e=>e.factor===factor);
  if(matches.length!==1||!matches[0].detail.uk||!matches[0].detail.en)
   throw Error('P3.7 missing source-backed '+factor+' interpretation');
  const evidence=matches[0];
  const until=factor==='vara'?day.nextSunriseUtc:activeUntil(day,factor,at);
  out.push({factor,name,value,classification,explanation,application:evidence.detail,
   tone:evidence.tone,untilUtc:until,reference:factor==='nakshatra'?P37_SOURCES.nakshatra:P37_SOURCES.classical});
 };
 const t=values.tithi,group=TITHI_CLASSES[(t.numberWithinPaksha-1)%5];
 make('tithi',L('Тітхі','Tithi'),
  L((t.paksha==='Shukla'?'Шукла':'Крішна')+' '+t.numberWithinPaksha,
    t.paksha+' '+t.numberWithinPaksha),
  group.name,group.meaning);
 const n=values.nakshatra,kind=p37NakshatraClass(n.number),description=STAR_LANGUAGE[kind];
 make('nakshatra',L('Накшатра','Nakshatra'),L(NAK_UK[n.number-1],n.name),
  description.label,description.meaning);
 const v=values.vara,ruler=VARA_RULERS[v.number-1];
 if(!ruler)throw Error('P3.7 invalid vara ruler');
 make('vara',L('Вара','Vara'),L(v.name,v.name),
  L('Планета дня — '+ruler.uk,'Day ruler — '+ruler.en),
  L('Вара описує традиційний характер дня тижня; сама по собі не дає дозволу на починання.',
    'Vara describes the traditional weekday ruler; it alone does not authorize an undertaking.'));
 const y=values.yoga;
 make('yoga',L('Нітья-йога','Nitya Yoga'),L(y.name,y.name),
  YOGA_WARN.has(y.number)?L('Йога з традиційним обмеженням','Traditionally restricted Yoga'):
  L('Одна із 27 нітья-йог','One of 27 Nitya Yogas'),
  YOGA_WARN.has(y.number)?L('Для В’ятіпати й Вайдхріті традиція описує застереження для сприятливих починань.',
   'Vyatipata and Vaidhriti traditionally carry cautions for auspicious beginnings.'):
  L('Йога обчислюється із суми сидеричних довгот Сонця й Місяця; оцінюється разом з іншими чотирма показниками.',
    'Yoga derives from the sum of the Sun and Moon sidereal longitudes and is read with the other four limbs.'));
 const k=values.karana;
 make('karana',L('Карана','Karana'),L(KARANA_UK[k.name]||k.name,k.name),
  k.name==='Vishti'?L('Вішті / Бхадра — обмеження','Vishti / Bhadra — restriction'):
  L('Половина місячного дня','Half of a lunar day'),
  k.name==='Vishti'?L('Вішті традиційно уникають для важливого сприятливого початку; є спеціальні винятки, які тут не перевіряються.',
   'Vishti is traditionally avoided for important auspicious beginnings; special exceptions are not evaluated here.'):
  L('Карана є половиною тітхі. Відсутність Вішті сама по собі не гарантує сприятливого моменту.',
   'Karana is half a tithi. Not being Vishti does not by itself establish an auspicious moment.'));
 return out;
}
