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
export function localInterpretation(chart:CalculatedChart,language:'uk'|'en'='en'){
 const moon=chart.d1.find(x=>x.name==='Moon')!,sun=chart.d1.find(x=>x.name==='Sun')!;
 if(language==='uk'){
  const sign=(number:number)=>SIGN_NAMES_UK[number-1]||'—';
  const nakshatra=NAKSHATRA_NAMES_UK[moon.nakshatra]||moon.nakshatra;
  return `Трактування за Джйотіш. Лагна — ${sign(chart.ascendant.sign)}. Сонце — ${sign(sun.sign)} (${sun.house}-й дім), Місяць — ${sign(moon.sign)} (${moon.house}-й дім). Накшатра Місяця — ${nakshatra}, пада ${moon.pada}. Карта D9 (Навамша) відкриває теми стосунків і внутрішніх цінностей, а D10 (Дашамша) — професійного шляху.`;
 }
 return `Jyotish chart reading. Ascendant — ${chart.ascendant.signName}; Sun — ${sun.signName} (house ${sun.house}); Moon — ${moon.signName} (house ${moon.house}). Lunar nakshatra: ${moon.nakshatra}, pada ${moon.pada}. D9 (Navamsa) explores relationships and personal values; D10 (Dashamsa) explores vocation and professional direction in the Jyotish tradition.`;
}

import {generateOpenAiInterpretation} from './ai.ts';
import {generateFreeInterpretation} from './free-ai.ts';
export async function interpretChart(chart:CalculatedChart,lang:'uk'|'en',preferred:'auto'|'local'='auto'){
 const local=()=>({provider:'local' as const,text:localInterpretation(chart,lang)});
 if(preferred==='local')return local();
 const mode=process.env.AI_MODE||'free';
 if(mode==='local')return local();
 if(mode==='free'){
  const free=await generateFreeInterpretation(chart,lang);
  return free||local();
 }
 // Legacy paid OpenAI path requires TWO deliberate switches. It is NEVER a free fallback.
 if(mode==='paid_openai'&&process.env.OPENAI_ENABLED==='1'&&process.env.OPENAI_API_KEY){
  return generateOpenAiInterpretation(chart,lang,{key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL});
 }
 return local();
}
