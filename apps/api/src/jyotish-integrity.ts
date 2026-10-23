/**
 * Jyotish Quality Acceptance: fail-closed INTERNAL consistency check.
 * Runs before a birth chart enters the HTTP response, report builder, cache or LLM.
 *
 * This is NOT an external numerical oracle for Swiss Ephemeris and does NOT
 * claim independent JHora parity. Astronomical precision needs reference tests.
 */
import {createHash} from 'node:crypto';
import {
  mod,signIndex,nakshatraOf,divisionalLongitude,graha,vimshottari,
  type BirthInput,type EphemerisData,type CalculatedChart,type Graha
} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_RULERS,houseLordFacts,validateRuleInput} from '../../../packages/jyotish-core/src/rules.ts';

export const CHART_VERIFICATION_VERSION='jyotish-integrity-v1';
const REQUIRED=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'] as const;
const NAMES=new Set<string>(REQUIRED);
const EPS=1e-7;
const circular=(a:number,b:number)=>Math.abs(mod(a-b+180)-180);
const check=(ok:boolean,code:string)=>{if(!ok)throw new ChartIntegrityError(code);};
const finite=(n:number)=>Number.isFinite(n);
const match=(a:number,b:number,eps=EPS)=>Math.abs(a-b)<=eps;

export class ChartIntegrityError extends Error{
 constructor(readonly code:string){
  super('Jyotish chart integrity check failed: '+code);
  this.name='ChartIntegrityError';
 }
}
export type ChartVerification={
 version:typeof CHART_VERIFICATION_VERSION;
 status:'verified_internal';
 checks:readonly string[];
 digest:string;
 externalReferenceChecked:false;
};
const CHECKS=[
 'birth_utc_julian_day','ephemeris_grahas','mean_nodes_opposition',
 'd1_longitudes_houses','nakshatra_pada_retrograde',
 'd9_projection','d10_projection','all_12_house_lords',
 'vimshottari_sequence_and_subperiods','methodology'
] as const;
const expectedHouse=(sign:number,lagna:number)=>mod(sign-lagna,12)+1;
function comparePlacement(got:Graha,expected:Graha,scope:string){
 const name=scope+'.'+expected.name;
 check(got.name===expected.name,name+'.name');
 check(finite(got.longitude)&&circular(got.longitude,expected.longitude)<EPS,name+'.longitude');
 check(got.sign===expected.sign&&got.signName===expected.signName,name+'.sign');
 check(got.house===expected.house,name+'.house');
 check(match(got.degreesInSign,expected.degreesInSign),name+'.degree');
 check(got.retrograde===expected.retrograde,name+'.retrograde');
 check(got.nakshatra===expected.nakshatra&&got.pada===expected.pada,name+'.nakshatra_pada');
}
function checkPositions(positions:Graha[],scope:string,asc:number,
 eph:Map<string,{name:string;longitude:number;speed?:number}>,division:1|9|10){
 check(positions.length===9,scope+'.count');
 const found=new Set<string>();
 for(const p of positions){
  check(NAMES.has(p.name)&&!found.has(p.name),scope+'.unique_graha');
  found.add(p.name);
  const reference=eph.get(p.name)!;
  const lon=division===1?reference.longitude:divisionalLongitude(reference.longitude,division);
  const expected=graha(p.name,lon,asc,reference.speed);
  comparePlacement(p,division===1?expected:{...expected,nakshatra:'—',pada:0},scope);
  check(p.house===expectedHouse(p.sign,signIndex(asc)+1),scope+'.house_rule');
 }
}
/** Strict pre-publication verification of ALL displayed Jyotish calculations. */
export function verifyCalculatedChart(
 input:BirthInput,eph:EphemerisData,chart:CalculatedChart,birthUtc:string
):ChartVerification{
 const parsedUtc=Date.parse(birthUtc);
 check(Number.isFinite(parsedUtc)&&chart.utc===birthUtc,'birth.utc');
 check(chart.input.date===input.date&&chart.input.time===input.time&&
  chart.input.timeZone===input.timeZone&&chart.input.latitude===input.latitude&&
  chart.input.longitude===input.longitude,'birth.input_consistency');
 const expectedJulian=parsedUtc/86400000+2440587.5;
 check(finite(eph.julianDay)&&match(eph.julianDay,expectedJulian,0.00001),'astronomy.julian_day');
 check(finite(eph.ayanamsa)&&Math.abs(eph.ayanamsa)<45,'astronomy.ayanamsa');
 check(finite(eph.ascendant)&&eph.ascendant>=0&&eph.ascendant<360,'astronomy.ascendant');
 check(chart.ayanamsa===eph.ayanamsa&&chart.ephemeris===eph.backend,'astronomy.provenance');
 check(eph.positions.length===9,'astronomy.planet_count');
 const coords=new Map<string,{name:string;longitude:number;speed?:number}>();
 for(const p of eph.positions){
  check(NAMES.has(p.name)&&!coords.has(p.name),'astronomy.duplicate_or_unknown_graha');
  check(finite(p.longitude)&&p.longitude>=0&&p.longitude<360,'astronomy.longitude_range');
  check(typeof p.speed==='number'&&finite(p.speed),'astronomy.missing_speed');
  coords.set(p.name,p);
 }
 for(const n of REQUIRED)check(coords.has(n),'astronomy.missing_'+n);
 check(circular(coords.get('Rahu')!.longitude,coords.get('Ketu')!.longitude+180)<EPS,'astronomy.node_opposition');
 const expectedAsc=graha('Ascendant',eph.ascendant,eph.ascendant);
 comparePlacement(chart.ascendant,expectedAsc,'D1.ascendant');
 check(chart.ascendant.house===1,'D1.lagna_house');
 checkPositions(chart.d1,'D1',eph.ascendant,coords,1);
 const a9=divisionalLongitude(eph.ascendant,9),a10=divisionalLongitude(eph.ascendant,10);
 comparePlacement(chart.lagnaD9,graha('Ascendant',a9,a9),'D9.ascendant');
 comparePlacement(chart.lagnaD10,graha('Ascendant',a10,a10),'D10.ascendant');
 checkPositions(chart.d9,'D9',a9,coords,9);
 checkPositions(chart.d10,'D10',a10,coords,10);
 validateRuleInput(chart);
 const lords=houseLordFacts(chart);
 check(lords.length===12,'lords.count');
 for(let h=1;h<=12;h++){
  const expectedSign=mod(chart.ascendant.sign+h-2,12)+1;
  const ruler=CLASSICAL_RULERS[expectedSign-1];
  const lord=lords[h-1];
  check(lord.values.house===h&&lord.values.sign===expectedSign&&lord.subject===ruler,'lords.'+h);
  const planet=chart.d1.find(x=>x.name===ruler)!;
  check(lord.values.locatedHouse===planet.house&&lord.values.locatedSign===planet.sign,'lords.position.'+h);
 }
 const expectedPeriods=vimshottari(coords.get('Moon')!.longitude,birthUtc);
 check(chart.dasha.length===9,'dasha.period_count');
 for(let i=0;i<9;i++){
  const got=chart.dasha[i],expected=expectedPeriods[i];
  check(got.lord===expected.lord&&got.start===expected.start&&got.end===expected.end,'dasha.major.'+i);
  check(got.antardashas?.length===9,'dasha.minor_count.'+i);
  if(i>0)check(chart.dasha[i-1].end===got.start,'dasha.major_contiguity');
  for(let j=0;j<9;j++){
   const minor=got.antardashas![j],reference=expected.antardashas![j];
   check(minor.lord===reference.lord&&minor.start===reference.start&&minor.end===reference.end,'dasha.minor.'+i+'.'+j);
   if(j>0)check(got.antardashas![j-1].end===minor.start,'dasha.minor_contiguity');
  }
  check(got.antardashas![0].start===got.start&&got.antardashas![8].end===got.end,'dasha.minor_bounds');
 }
 check(chart.config.ayanamsa==='Lahiri'&&chart.config.houses==='Whole sign'&&
  chart.config.nodes==='Mean Rahu / opposite Ketu'&&
  match(chart.config.dashaYearDays,365.2425,1e-10),'methodology.conventions');
 const fingerprint={
  algorithm:CHART_VERIFICATION_VERSION,
  utc:birthUtc,ayanamsa:eph.ayanamsa,ascendant:chart.ascendant.longitude,
  ephemerisBackend:chart.ephemeris,
  d1:chart.d1.map(p=>[p.name,p.longitude,p.house,p.nakshatra,p.pada]),
  d9:chart.d9.map(p=>[p.name,p.longitude,p.house]),
  d10:chart.d10.map(p=>[p.name,p.longitude,p.house]),
  dashas:chart.dasha
 };
 const digest=createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
 return {version:CHART_VERIFICATION_VERSION,status:'verified_internal',
  checks:CHECKS,digest,externalReferenceChecked:false};
}
