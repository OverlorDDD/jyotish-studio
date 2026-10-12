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
  const display=(positions:typeof chart.d1)=>positions.map(g=>`${name(g.name)} — ${sign(g.sign)}, ${g.house}-й дім`).join('; ');
  const nakshatra=NAKSHATRA_NAMES_UK[moon.nakshatra]||moon.nakshatra;
  const signTheme=SIGN_THEMES_UK[chart.ascendant.sign-1]||'особистий шлях';
  const sunHouse=HOUSE_THEMES_UK[sun.house-1]||'самовираження';
  const moonHouse=HOUSE_THEMES_UK[moon.house-1]||'емоційне життя';
  return [
   `ЛАГНА — ОСОБИСТИЙ ВЕКТОР\n${sign(chart.ascendant.sign)} — знак Лагни. У символіці Джйотіш він пов'язаний із такими темами, як ${signTheme}. Лагна задає основу, від якої рахуються дванадцять домів карти.`,
   `СОНЦЕ ТА МІСЯЦЬ\nСонце: ${sign(sun.sign)}, ${sun.house}-й дім (тема дому — ${sunHouse}). Місяць: ${sign(moon.sign)}, ${moon.house}-й дім (тема дому — ${moonHouse}). Накшатра Місяця — ${nakshatra}, пада ${moon.pada}. У традиційному читанні Сонце пов'язують із волею та самовираженням, а Місяць — із внутрішнім сприйняттям.`,
   `РАШІ (D1) — УСІ ПОЛОЖЕННЯ\n${display(chart.d1)}. Це обчислені положення планет і вузлів за цілознаковими домами, а не згенеровані AI-припущення.`,
   `НАВАМША (D9) — ВНУТРІШНІ ЦІННОСТІ\nЛагна D9 — ${sign(chart.lagnaD9.sign)}. Положення: ${display(chart.d9)}. У Джйотіш Навамшу використовують для розгляду тем партнерства, зрілості та цінностей.`,
   `ДАШАМША (D10) — ПРОФЕСІЙНИЙ НАПРЯМ\nЛагна D10 — ${sign(chart.lagnaD10.sign)}. Положення: ${display(chart.d10)}. Дашамша традиційно пов'язана з професійною реалізацією та суспільною роллю.`,
   `ВІМШОТТАРІ ДАША — ЧАСОВІ ПЕРІОДИ\n${active?`Поточна махадаша: ${name(active.lord)} (${active.start.slice(0,10)} — ${active.end.slice(0,10)}). ${sub?`Антардаша: ${name(sub.lord)} (${sub.start.slice(0,10)} — ${sub.end.slice(0,10)}).`:'Активна антардаша не визначена.'}`:'Поточний період поза збереженим діапазоном даш.'} У традиції ці періоди використовують як послідовність тем для роздумів.`
  ].join('\n\n');
 }
 const display=(positions:typeof chart.d1)=>positions.map(g=>`${g.name} — ${g.signName}, house ${g.house}`).join('; ');
 return [
  `ASCENDANT — PERSONAL THEMES\nAscendant: ${chart.ascendant.signName}. The ascendant anchors the twelve whole-sign houses in the Jyotish tradition.`,
  `SUN AND MOON\nSun: ${sun.signName}, house ${sun.house}. Moon: ${moon.signName}, house ${moon.house}; nakshatra ${moon.nakshatra}, pada ${moon.pada}. These positions traditionally inform themes of self-expression and inner experience.`,
  `RASHI (D1) — PLANETARY PLACEMENTS\n${display(chart.d1)}.`,
  `NAVAMSA (D9) — RELATIONSHIPS AND VALUES\nD9 ascendant: ${chart.lagnaD9.signName}. Placements: ${display(chart.d9)}.`,
  `DASHAMSA (D10) — VOCATION\nD10 ascendant: ${chart.lagnaD10.signName}. Placements: ${display(chart.d10)}.`,
  `VIMSHOTTARI DASHA\n${active?`Current Mahadasha: ${active.lord} (${active.start.slice(0,10)} — ${active.end.slice(0,10)}).${sub?` Antardasha: ${sub.lord} (${sub.start.slice(0,10)} — ${sub.end.slice(0,10)}).`:''}`:'The current period falls outside the calculated timeline.'}`
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
