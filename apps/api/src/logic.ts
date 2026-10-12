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
export function localInterpretation(chart:CalculatedChart,language:'uk'|'en'='en'){
 const moon=chart.d1.find(x=>x.name==='Moon')!,sun=chart.d1.find(x=>x.name==='Sun')!;
 if(language==='uk')return `Навчальне трактування Джйотіш: Лагна у знаку ${chart.ascendant.signName}, Сонце у ${sun.signName} (дім ${sun.house}), Місяць у ${moon.signName} (дім ${moon.house}), накшатра ${moon.nakshatra}, пада ${moon.pada}. Це традиційні астрологічні категорії, а не науковий прогноз. Подивіться D9 для додаткової символічної інтерпретації тем стосунків і D10 — професійної діяльності.`;
 return `Educational Jyotish reading: Ascendant in ${chart.ascendant.signName}, Sun in ${sun.signName} (house ${sun.house}), Moon in ${moon.signName} (house ${moon.house}), nakshatra ${moon.nakshatra}, pada ${moon.pada}. These are traditional astrological categories, not scientific predictions. D9 is used for additional symbolic relationship analysis; D10 traditionally concerns professional activity.`;
}
import {generateOpenAiInterpretation} from './ai.ts';
export async function interpretChart(chart:CalculatedChart,lang:'uk'|'en',preferred:'auto'|'local'='auto'){
 const key=process.env.OPENAI_API_KEY;
 // An API key alone cannot trigger paid calls. Explicit local opt-in is required.
 if(preferred==='local'||process.env.OPENAI_ENABLED!=='1'||!key)return {provider:'local' as const,text:localInterpretation(chart,lang)};
 return generateOpenAiInterpretation(chart,lang,{key,model:process.env.OPENAI_MODEL});
}
