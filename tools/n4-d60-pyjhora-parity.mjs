/** D60 method certification: real API D60 mapper vs external PyJHora
 * v4.8.7, 50 synthetic input vectors, 500 symbolic signs, 450 houses.
 * Physics and birth-time window certainty remain explicitly uncertified.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
const NAMES=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const mod=x=>((x%360)+360)%360;
const CASES=Array.from({length:50},(_,i)=>{
 const longitudes=Object.fromEntries(NAMES.map((name,j)=>{
  const sign=(i*7+j*3)%12;
  const part=(i*17+j*11)%60;
  const frac=i%4===0?0.00003:i%4===1?0.49997:i%4===2?0.249999:0.37777;
  return [name,mod(sign*30+part*.5+frac)];
 }));
 return {id:'N4-D60-'+String(i+1).padStart(3,'0'),longitudes};
});
function mapped(input){
 const chart=calculateChart({
  date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52
 },{
  backend:'synthetic-test-longitudes-NOT-physical-certificate',
  julianDay:2451545,ayanamsa:23.8,ascendant:input.longitudes.Ascendant,
  positions:NAMES.slice(1).map(name=>({name,longitude:input.longitudes[name],speed:.02}))
 });
 return makeN4D60Candidate(chart,{version:'jyotish-integrity-v3',status:'verified_internal',
  digest:'a'.repeat(64),checks:['synthetic-test-only'],externalReferenceChecked:false});
}
const python=process.env.N4_RC_PYTHON||(process.platform==='win32'?'python':'python3');
const args=[...(python==='py'?['-3']:[]),'tools/n4-d60-pyjhora-oracle.py'];
const proc=spawnSync(python,args,{
 input:JSON.stringify({cases:CASES}),encoding:'utf8',timeout:120000,maxBuffer:6e6,
 env:{...process.env,QT_QPA_PLATFORM:'offscreen',PYTHONWARNINGS:'ignore'}
});
if(proc.status!==0||proc.error){
 console.error((proc.stderr||proc.error?.message||'').slice(-1500));
 throw Error('N4_D60_EXTERNAL_PYJHORA_ORACLE_NOT_AVAILABLE_FAIL_CLOSED');
}
const oracle=JSON.parse(proc.stdout);
assert.equal(oracle.oracle,'PyJHora');
assert.equal(oracle.version,'4.8.7');
assert.equal(oracle.division,60);assert.equal(oracle.method,1);
assert.equal(oracle.claimsContinuousTimeCert,false);
assert.equal(oracle.cases.length,50);
let matched=0,houses=0;
const byCase=[];
for(let i=0;i<50;i++){
 const source=CASES[i],other=oracle.cases[i];
 assert.equal(other.id,source.id);
 const out=mapped(source);
 assert.equal(out.method,'JHora8-Traditional-own-rashi-inclusive-D60');
 assert.equal(out.continuousTimeStabilityCertified,false);
 assert.equal(out.d60HouseInterpretationEligible,false);
 assert.equal(out.sourceDigest,'a'.repeat(64));
 const entries=[out.lagna,...out.planets];
 for(const p of entries){
  assert.equal(p.sign,other.signs[p.name],source.id+' '+p.name+' D60 sign');
  matched++;
  if(p.name!=='Ascendant'){
   const actual=(p.sign-out.lagna.sign+12)%12+1;
   assert.equal(p.house,actual,source.id+' D60 house '+p.name);
   const expected=(other.signs[p.name]-other.signs.Ascendant+12)%12+1;
   assert.equal(actual,expected,source.id+' independent D60 house '+p.name);
   houses++;
  }
 }
 byCase.push({id:source.id,verifiedSigns:10,verifiedHouses:9});
}
assert.equal(matched,500);assert.equal(houses,450);
console.log(JSON.stringify({
 status:'N4_D60_PYJHORA_500_SIGN_450_HOUSE_METHOD_SCOPED_PASS',
 profile:'JHora Traditional own-sign inclusive',
 independentOracle:'PyJHora 4.8.7 chart_method=1',
 originalJHora8SameMethodPriorReference:'500/500 original 50 cases in research PR #120',
 newSyntheticOriginalInputs:50,
 signedPlanetsAndLagna:matched,independentHouses:houses,
 recordTimePrecisionCertified:false,
 physicalEphemerisCertifiedForAllBirths:false,
 continuousStabilityCertified:false,
 publicReleaseAllowed:false
},null,2));
