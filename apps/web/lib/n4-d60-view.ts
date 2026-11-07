/** Client validation for separate provisional D60 annex; never represent
 * a nominal HH:MM time as a certified continuous birth-time enclosure.
 */
export const N4_D60_UI_VERSION='n4-d60-symbolic-reference-20261107-v1';
export type N4D60Placement=Readonly<{name:string;sign:number;house:number;part:number;boundaryDistanceArcseconds:number;retrograde:boolean}>;
export type N4D60UI=Readonly<{
 version:typeof N4_D60_UI_VERSION;
 sourceVerificationVersion:'jyotish-integrity-v3';sourceDigest:string;
 sourceMethod:'parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1';
 rulesVersion:'n4-parashari-v1.0.0';
 method:'JHora8-Traditional-own-rashi-inclusive-D60';division:60;
 lagna:N4D60Placement;planets:readonly N4D60Placement[];
 symbolicFormulaIndependentReference:'original-JHora8-50-same-method-and-PyJHora';
 symbolicMathScope:'VERIFIED_FOR_PINNED_INPUT_LONGITUDES_ONLY';
 birthTimePrecision:'NOT_INFERRED_FROM_HH_MM';
 continuousTimeStabilityCertified:false;
 d60HouseInterpretationEligible:false;
 astronomicalCoordinatesPerBirthExternallyCertified:false;
 status:'PROVISIONAL_D60_INDIVIDUAL_BIRTH';
}>;
type Source=Readonly<{
 verification?:{version:string;digest:string;status:string;externalReferenceChecked:boolean};
 n4D60?:N4D60UI;
}>;
const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const sign=(x:number)=>Number.isInteger(x)&&x>=1&&x<=12;
const valid=(p:N4D60Placement)=>!!p&&sign(p.sign)&&
 Number.isInteger(p.house)&&p.house>=1&&p.house<=12&&
 Number.isInteger(p.part)&&p.part>=1&&p.part<=60&&
 Number.isFinite(p.boundaryDistanceArcseconds)&&p.boundaryDistanceArcseconds>=0&&
 typeof p.retrograde==='boolean';
export function assertD60Provisional(source:Source):asserts source is Source&{n4D60:N4D60UI}{
 const v=source?.verification,p=source?.n4D60;
 const fail=(label:string):never=>{throw Error('N4_D60_UNVERIFIED_SOURCE: '+label)};
 if(!v||v.status!=='verified_internal'||v.version!=='jyotish-integrity-v3'||
  !/^[a-f0-9]{64}$/.test(v.digest)||v.externalReferenceChecked!==false)
  fail('v3 proof missing');
 if(!p||p.version!==N4_D60_UI_VERSION||p.division!==60||
  p.sourceVerificationVersion!==v?.version||p.sourceDigest!==v?.digest||
  p.sourceMethod!=='parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1'||
  p.rulesVersion!=='n4-parashari-v1.0.0'||
  p.method!=='JHora8-Traditional-own-rashi-inclusive-D60'||
  p.symbolicFormulaIndependentReference!=='original-JHora8-50-same-method-and-PyJHora'||
  p.symbolicMathScope!=='VERIFIED_FOR_PINNED_INPUT_LONGITUDES_ONLY'||
  p.birthTimePrecision!=='NOT_INFERRED_FROM_HH_MM'||
  p.continuousTimeStabilityCertified!==false||
  p.d60HouseInterpretationEligible!==false||
  p.astronomicalCoordinatesPerBirthExternallyCertified!==false||
  p.status!=='PROVISIONAL_D60_INDIVIDUAL_BIRTH')
  fail('scope, method or precision confidence mismatch');
 if(!valid(p.lagna)||p.lagna.name!=='Ascendant'||!Array.isArray(p.planets)||
  p.planets.length!==9||new Set(p.planets.map(x=>x.name)).size!==9||
  !NAMES.every(name=>p.planets.some(x=>x.name===name&&valid(x))))
  fail('required placements missing');
 for(const body of p.planets){
  if(body.house!==((body.sign-p.lagna.sign+12)%12)+1)
   fail('D60 houses do not match nominal lagna');
 }
}
export function hasD60Provisional(source:Source):boolean{
 try{assertD60Provisional(source);return true}catch{return false}
}
