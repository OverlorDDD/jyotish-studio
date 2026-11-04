/**
 * N4.6 personal theme bridge.
 * Deterministic, opt-in, owner-scoped natal context ONLY.
 * Does not alter Panchanga astronomy, time-slot favorable scoring or daily transits.
 * Requires external reference approval and the personal release flag.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {calculateAllVargas,VARGA_RULESET_VERSION,VARGA_PROFILE} from '../../../packages/jyotish-core/src/vargas.ts';

export type N4PersonalPlacement=Readonly<{
 division:2|3|4|7|9|10|12|20|24;
 body:string;
 sign:number;
 house:number;
 rulesVersion:typeof VARGA_RULESET_VERSION;
 profile:typeof VARGA_PROFILE;
}>;
const chartByHouse:Readonly<Record<number,N4PersonalPlacement['division']|null>>=Object.freeze({
 1:null,2:2,3:3,4:4,5:7,6:null,7:9,8:null,9:20,10:10,11:2,12:20
});
const SIGNS_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANETS_UK:Readonly<Record<string,string>>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
export const N4_PERSONAL_VERSION='n4-personal-v1' as const;
export function n4PersonalEligible(env:Record<string,string|undefined>=process.env):boolean{
 return env.N4_VARGA_PERSONAL_ENABLED==='1'&&env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED==='1';
}
/** No input date/time, owner ID, chart ID, city, coordinates or raw birth longitudes in output. */
export function n4PersonalPlacements(chart:CalculatedChart):readonly N4PersonalPlacement[]{
 const charts=calculateAllVargas(chart.ascendant.longitude,chart.d1.map(p=>({
  name:p.name,longitude:p.longitude,speed:p.retrograde?-1:1
 })));
 return Object.freeze(charts.filter(c=>[2,3,4,7,9,10,12,20,24].includes(c.division))
  .flatMap(c=>c.planets.map(p=>Object.freeze({
   division:c.division as N4PersonalPlacement['division'],body:p.name,sign:p.vargaSign,house:p.house,
   rulesVersion:VARGA_RULESET_VERSION,profile:VARGA_PROFILE
  }))));
}
export function n4DailyTheme(house:number,planet:string,placements:readonly N4PersonalPlacement[]|undefined):
 {text:{uk:string;en:string};evidence:N4PersonalPlacement}|null{
 if(!placements||!Number.isInteger(house)||house<1||house>12)return null;
 const division=chartByHouse[house];
 if(!division)return null;
 if(!PLANETS_UK[planet]||!['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].includes(planet))return null;
 const hit=placements.find(p=>p.division===division&&p.body===planet&&p.rulesVersion===VARGA_RULESET_VERSION&&
  Number.isInteger(p.sign)&&p.sign>=1&&p.sign<=12&&Number.isInteger(p.house)&&p.house>=1&&p.house<=12);
 if(!hit)return null;
 return {
  text:{
   uk:'У додатковій карті D'+division+' '+PLANETS_UK[planet]+' у '+SIGNS_UK[hit.sign-1]+', дім '+hit.house+'. Це тематичний контекст, а не розрахунок часу події.',
   en:'In supplementary D'+division+', '+planet+' occupies '+SIGNS_EN[hit.sign-1]+', house '+hit.house+'. This is thematic context, not an event-time calculation.'
  },evidence:hit
 };
}
