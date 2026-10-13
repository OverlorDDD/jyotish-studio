import type {BirthInput,CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {calculateChart,validateBirth} from '../../../packages/jyotish-core/src/index.ts';
import {getEphemeris} from './ephemeris.ts';
export async function runCalculation(body:unknown):Promise<CalculatedChart>{
 if(!body||typeof body!=='object')throw new Error('Invalid request body');
 const b=body as Record<string,unknown>;
 for(const k of ['date','time','timeZone'])if(typeof b[k]!=='string')throw new Error(`Invalid ${k}`);
 if(typeof b.latitude!=='number'||typeof b.longitude!=='number')throw new Error('Coordinates must be numbers');
 const input:BirthInput={date:b.date as string,time:b.time as string,timeZone:b.timeZone as string,latitude:b.latitude,longitude:b.longitude,place:typeof b.place==='string'?b.place.slice(0,120):undefined};
 validateBirth(input);
 const eph=await getEphemeris(input);
 return calculateChart(input,eph);
}
const SIGN_NAMES_UK=["Овен","Телець","Близнюки","Рак","Лев","Діва","Терези","Скорпіон","Стрілець","Козоріг","Водолій","Риби"];
const NAKSHATRA_NAMES_UK:Record<string,string>={"Ashwini":"Ашвіні","Bharani":"Бхарані","Krittika":"Кріттіка","Rohini":"Рохіні","Mrigashira":"Мрігашіра","Ardra":"Ардра","Punarvasu":"Пунарвасу","Pushya":"Пушʼя","Ashlesha":"Ашлеша","Magha":"Магха","Purva Phalguni":"Пурва Пхалгуні","Uttara Phalguni":"Уттара Пхалгуні","Hasta":"Хаста","Chitra":"Чітра","Swati":"Сваті","Vishakha":"Вішакха","Anuradha":"Анурадха","Jyeshtha":"Джʼєштха","Mula":"Мула","Purva Ashadha":"Пурва Ашадха","Uttara Ashadha":"Уттара Ашадха","Shravana":"Шравана","Dhanishta":"Дханіштха","Shatabhisha":"Шатабхіша","Purva Bhadrapada":"Пурва Бхадрапада","Uttara Bhadrapada":"Уттара Бхадрапада","Revati":"Реваті"};
/** Chart coordinates are deterministic; these concise texts describe Jyotish traditions. */
const SIGN_THEMES_UK=[
 'ініціатива та сміливість','послідовність і опора на цінності','допитливість і спілкування',
 'турбота й почуття належності','творчість і самовираження','уважність до деталей і служіння',
 'пошук рівноваги й партнерства','глибина почуттів і перетворення','пошук сенсу й відкриття горизонтів',
 'відповідальність і тривала праця','незалежність і нові ідеї','уявлення, співпереживання та інтуїція'
];
const HOUSE_THEMES_UK=[
 'особистість і самосприйняття','ресурси й особисті цінності','спілкування та навички',
 'дім і внутрішня опора','творчість і самовираження','повсякденні справи та служіння',
 'стосунки й співпраця','зміни та спільні ресурси','світогляд і навчання',
 'покликання та суспільна роль','спільноти й прагнення','усамітнення та внутрішній світ'
];
const HOUSE_THEMES_EN=[
 'identity and self-image','resources and personal values','communication and skills',
 'home and inner foundations','creativity and self-expression','daily routines and service',
 'relationships and cooperation','change and shared resources','worldview and learning',
 'vocation and public role','communities and aspirations','solitude and inner life'
];
const GRAHAS_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',
 Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
/** Rich offline report built from actual chart facts; never pretends to be a language model. */
export function localInterpretation(chart:CalculatedChart,language:'uk'|'en'='en'){
 const moon=chart.d1.find(x=>x.name==='Moon')!,sun=chart.d1.find(x=>x.name==='Sun')!;
 const active=chart.dasha.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end));
 const sub=active?.antardashas?.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end));
 if(language==='uk'){
  const sign=(number:number)=>SIGN_NAMES_UK[number-1]||'—';
  const name=(english:string)=>GRAHAS_UK[english]||english;
  const display=(positions:typeof chart.d1)=>positions.map(g=>
   name(g.name)+' — '+sign(g.sign)+'; життєва сфера: '+(HOUSE_THEMES_UK[g.house-1]||'особисті теми')
  ).join('; ');
  const nakshatra=NAKSHATRA_NAMES_UK[moon.nakshatra]||moon.nakshatra;
  const signTheme=SIGN_THEMES_UK[chart.ascendant.sign-1]||'особистий шлях';
  const sunHouse=HOUSE_THEMES_UK[sun.house-1]||'самовираження';
  const moonHouse=HOUSE_THEMES_UK[moon.house-1]||'емоційне життя';
  return [
   'ЗАГАЛЬНИЙ ПОРТРЕТ\nУ традиції Джйотіш висхідний знак '+sign(chart.ascendant.sign)+' символічно пов’язують із темами '+signTheme+'. Це не остаточний опис характеру, а одна з тем для самоспостереження.',
   'ЦІЛІ ТА САМОВИРАЖЕННЯ\nСонце у знаку '+sign(sun.sign)+' традиційно пов’язують із волею та способом проявляти себе. У цій карті окрема увага приділяється темі «'+sunHouse+'».',
   'ПОЧУТТЯ ТА ВНУТРІШНІЙ КОМФОРТ\nМісяць у знаку '+sign(moon.sign)+' пов’язують із внутрішніми реакціями та звичками. Додатковий символічний сектор — '+nakshatra+'; ця традиція пропонує поміркувати про сферу «'+moonHouse+'» і про те, що допомагає відновлювати рівновагу.',
   'ПЛАНЕТИ ТА СФЕРИ ЖИТТЯ\n'+display(chart.d1)+'. Це символічні теми традиції, а не твердження про те, що неодмінно станеться.',
   'СТОСУНКИ Й ОСОБИСТІ ЦІННОСТІ\nДопоміжна карта D9, яку традиція використовує для роздумів про партнерство та зрілість, має висхідний знак '+sign(chart.lagnaD9.sign)+'. Сприймай її як додаткову перспективу, а не як гарантію певних стосунків.',
   'РОБОТА Й САМОРЕАЛІЗАЦІЯ\nДопоміжна карта D10 традиційно пов’язана з роботою, внеском і суспільною роллю; її висхідний знак — '+sign(chart.lagnaD10.sign)+'. Це один із поглядів на професійну тему, а не готовий вирок чи обіцянка успіху.',
   'ПОТОЧНИЙ СИМВОЛІЧНИЙ ПЕРІОД\n'+(active?
    'Традиційна система вказує на період '+name(active.lord)+' ('+active.start.slice(0,10)+' — '+active.end.slice(0,10)+'). '+(sub?'Додатковий підперіод — '+name(sub.lord)+' ('+sub.start.slice(0,10)+' — '+sub.end.slice(0,10)+').':'Детальніший підперіод не визначений.'):
    'Поточний період не входить до наявного розрахункового діапазону.')+' Використовуй це як привід спокійно переглянути пріоритети, а не як прогноз подій.'
  ].join('\n\n');
 }
 const signThemesEn=[
  'initiative and courage','consistency and values','curiosity and communication','care and belonging',
  'creativity and self-expression','attention to detail and useful work','balance and partnership',
  'emotional depth and change','learning and wider horizons','responsibility and sustained effort',
  'independence and new ideas','imagination, empathy and intuition'
 ];
 const display=(positions:typeof chart.d1)=>positions.map(g=>
  g.name+' — '+g.signName+'; life theme: '+(HOUSE_THEMES_EN[g.house-1]||'personal themes')
 ).join('; ');
 const activeText=active?
  'The traditional system places you in a symbolic '+active.lord+' period ('+active.start.slice(0,10)+' — '+active.end.slice(0,10)+'). '+(sub?'Its sub-period is '+sub.lord+' ('+sub.start.slice(0,10)+' — '+sub.end.slice(0,10)+').':'No smaller sub-period is available.'):
  'The current date falls outside the available calculated timeline.';
 return [
  'THE BIG PICTURE\nIn the Jyotish tradition, the rising sign '+chart.ascendant.signName+' is symbolically linked with '+(signThemesEn[chart.ascendant.sign-1]||'personal direction')+'. Treat this as a theme for reflection, not a complete description of your personality.',
  'SELF-EXPRESSION AND PURPOSE\nThe Sun in '+sun.signName+' is traditionally associated with willpower and the way a person expresses themselves. This chart also invites reflection on '+(HOUSE_THEMES_EN[sun.house-1]||'personal purpose')+'.',
  'FEELINGS AND INNER COMFORT\nThe Moon in '+moon.signName+' is linked with emotional responses and habits. The tradition also considers the lunar sector '+moon.nakshatra+'; you might reflect on '+(HOUSE_THEMES_EN[moon.house-1]||'inner life')+' and what helps you regain balance.',
  'PLANETS AND LIFE AREAS\n'+display(chart.d1)+'. These are symbolic themes within a tradition, not statements about what must happen.',
  'RELATIONSHIPS AND PERSONAL VALUES\nThe supplementary D9 chart, traditionally used to reflect on partnership and maturity, has '+chart.lagnaD9.signName+' as its rising sign. It is an additional perspective, not a guarantee about relationships.',
  'WORK AND FULFILMENT\nThe supplementary D10 chart is traditionally linked with work, contribution and public role; its rising sign is '+chart.lagnaD10.signName+'. This is one perspective on vocation, not a verdict or a promise of success.',
  'CURRENT SYMBOLIC PERIOD\n'+activeText+' Use it as a prompt to review priorities calmly, not as a prediction of events.'
 ].join('\n\n');
}

import {generateOpenAiInterpretation} from './ai.ts';
import {generateFreeInterpretationDetailed} from './free-ai.ts';
export async function interpretChart(chart:CalculatedChart,lang:'uk'|'en',preferred:'auto'|'local'='auto'){
 const local=()=>({provider:'local' as const,text:localInterpretation(chart,lang)});
 if(preferred==='local')return local();
 const mode=process.env.AI_MODE||'free';
 if(mode==='local')return local();
 if(mode==='free'){
  const free=await generateFreeInterpretationDetailed(chart,lang);
  return free.result||{...local(),fallbackReason:free.reason};
 }
 // Legacy paid OpenAI path requires TWO deliberate switches. It is NEVER a free fallback.
 if(mode==='paid_openai'&&process.env.OPENAI_ENABLED==='1'&&process.env.OPENAI_API_KEY){
  return generateOpenAiInterpretation(chart,lang,{key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL});
 }
 return local();
}
