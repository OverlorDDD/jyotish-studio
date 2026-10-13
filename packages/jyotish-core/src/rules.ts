import {createHash} from 'node:crypto';
import type {CalculatedChart,Graha} from './index.ts';

/** Explicit, versioned Parashari sign-level rules; not a Shadbala or predictive engine. */
export const RULESET_VERSION='2.0.0';
export const CLASSICAL_RULERS=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'] as const;
export const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'] as const;
export const CLASSICAL_GRAHAS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'] as const;
export type ClassicalGraha=typeof CLASSICAL_GRAHAS[number];
export type Dignity='exalted'|'debilitated'|'own'|'other'|'unassigned';
export type RuleFact={id:string;rule:string;subject:string;values:Record<string,string|number|boolean>;evidence:string[]};
export type YogaFinding={id:string;name:string;planet:string;house:number;sign:number;reason:'own'|'exalted';evidence:string[]};
const own:Record<ClassicalGraha,number[]>={
 Sun:[5],Moon:[4],Mars:[1,8],Mercury:[3,6],Jupiter:[9,12],Venus:[2,7],Saturn:[10,11]
};
const exalted:Record<ClassicalGraha,number>={Sun:1,Moon:2,Mars:10,Mercury:6,Jupiter:4,Venus:12,Saturn:7};
const fallen:Record<ClassicalGraha,number>={Sun:7,Moon:8,Mars:4,Mercury:12,Jupiter:10,Venus:6,Saturn:1};
const yogaNames:Record<string,string>={Mars:'Ruchaka',Mercury:'Bhadra',Jupiter:'Hamsa',Venus:'Malavya',Saturn:'Shasha'};
const isClassical=(name:string):name is ClassicalGraha=>(CLASSICAL_GRAHAS as readonly string[]).includes(name);
const houseFrom=(sign:number,ascendantSign:number)=>((sign-ascendantSign+12)%12)+1;
const assertSign=(number:number)=>{if(!Number.isInteger(number)||number<1||number>12)throw new Error('Invalid zodiac sign');};

export function classicalSignRuler(sign:number):ClassicalGraha{
 assertSign(sign);
 return CLASSICAL_RULERS[sign-1];
}
export function dignityFor(name:string,sign:number):Dignity{
 assertSign(sign);
 if(!isClassical(name))return 'unassigned'; // No speculative rulership or dignity for Rahu/Ketu.
 if(exalted[name]===sign)return 'exalted';
 if(fallen[name]===sign)return 'debilitated';
 return own[name].includes(sign)?'own':'other';
}
export function validateRuleInput(chart:CalculatedChart){
 assertSign(chart.ascendant.sign);
 if(chart.d1.length!==9)throw new Error('Expected nine D1 grahas');
 const found=new Set<string>();
 for(const position of chart.d1){
  if(found.has(position.name))throw new Error('Duplicate D1 graha');
  found.add(position.name);
  assertSign(position.sign);
  const house=houseFrom(position.sign,chart.ascendant.sign);
  if(position.house!==house)throw new Error('D1 whole-sign house mismatch: '+position.name);
  if(!Number.isFinite(position.longitude)||!Number.isFinite(position.degreesInSign))throw new Error('Invalid graha longitude');
 }
 for(const name of [...CLASSICAL_GRAHAS,'Rahu','Ketu'])if(!found.has(name))throw new Error('Missing D1 graha '+name);
}
export function houseLordFacts(chart:CalculatedChart):RuleFact[]{
 validateRuleInput(chart);
 return Array.from({length:12},(_,i)=>{
  const house=i+1,sign=((chart.ascendant.sign+i-1)%12)+1;
  const ruler=classicalSignRuler(sign);
  const location=chart.d1.find(p=>p.name===ruler)!;
  return {id:'house-lord:'+house,rule:'PARASHARI_SIGN_LORDSHIP',
   subject:ruler,values:{house,sign,ruler,locatedHouse:location.house,locatedSign:location.sign},
   evidence:['ascendant.sign='+chart.ascendant.sign,'house.sign='+sign,'D1.'+ruler+'.sign='+location.sign,'D1.'+ruler+'.house='+location.house]
  };
 });
}
export function dignityFacts(chart:CalculatedChart):RuleFact[]{
 validateRuleInput(chart);
 return chart.d1.map(p=>({
  id:'dignity:'+p.name.toLowerCase(),rule:'SEVEN_GRAHA_SIGN_DIGNITY',subject:p.name,
  values:{planet:p.name,sign:p.sign,house:p.house,dignity:dignityFor(p.name,p.sign)},
  evidence:['D1.'+p.name+'.sign='+p.sign,'D1.'+p.name+'.house='+p.house]
 }));
}
/** Five Pancha Mahapurusha yogas, strictly from natal Lagna and sign-level dignity.
 * No Moon-relative yoga, no cancellation, combustion or degree strength claimed. */
export function mahapurushaYogas(chart:CalculatedChart):YogaFinding[]{
 validateRuleInput(chart);
 const output:YogaFinding[]=[];
 for(const p of chart.d1){
  const name=yogaNames[p.name];if(!name)continue;
  const dignity=dignityFor(p.name,p.sign);
  if(![1,4,7,10].includes(p.house)||!['own','exalted'].includes(dignity))continue;
  output.push({id:'yoga:'+name.toLowerCase(),name,planet:p.name,house:p.house,sign:p.sign,
   reason:dignity==='exalted'?'exalted':'own',
   evidence:['D1.'+p.name+'.house='+p.house,'D1.'+p.name+'.sign='+p.sign,'dignity:'+p.name.toLowerCase()+'='+dignity]});
 }
 return output;
}
export function ruleFindings(chart:CalculatedChart){
 const lords=houseLordFacts(chart),dignities=dignityFacts(chart),yogas=mahapurushaYogas(chart);
 const facts:RuleFact[]=[...lords,...dignities,...yogas.map(y=>({
  id:y.id,rule:'PANCHA_MAHAPURUSHA_LAGNA',subject:y.planet,
  values:{name:y.name,planet:y.planet,house:y.house,sign:y.sign,reason:y.reason},
  evidence:y.evidence
 }))];
 return {version:RULESET_VERSION,lords,dignities,yogas,facts};
}
/** Stable fingerprint only of derived zodiac/dasha facts, not raw birth identifiers.
 * The current-period date must be included by any caller that needs daily context. */
export function ruleFingerprint(chart:CalculatedChart,asOf:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isFinite(Date.parse(asOf+'T12:00:00Z')))
  throw new Error('asOf must be ISO YYYY-MM-DD');
 const sorted=(rows:Graha[])=>[...rows].sort((a,b)=>a.name.localeCompare(b.name,'en'))
  .map(p=>[p.name,p.sign,p.house,Number(p.longitude.toFixed(9)),p.retrograde]);
 const details=ruleFindings(chart);
 return createHash('sha256').update(JSON.stringify({
  rules:RULESET_VERSION,asOf,lagna:chart.ascendant.sign,
  d1:sorted(chart.d1),d9:sorted(chart.d9),d10:sorted(chart.d10),
  dasha:chart.dasha,ruleFacts:[...details.facts].sort((a,b)=>a.id.localeCompare(b.id,'en'))
 })).digest('hex');
}
