/** Independent N4 RC math release gate: ONLY 12 NEW cards, not D1/D9/D10.
 * Runs upstream PyJHora 4.8.7 in a subprocess. Tests the exact values emitted
 * by production N4 server-contract (Lagna + all nine grahas + houses).
 * This is a symbolic same-input check, not a physical astronomical certificate.
 * PyJHora source stays external under its own license. No user natal records.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload,N4_RC_DIVISIONS} from '../apps/api/src/n4-rc-contract.ts';
const NEW12=[2,3,4,7,12,16,20,24,27,30,40,45];
const NAME=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const EXPECTED_BLOB='3a4f2dec84a0ed13cb692f52a76612e0de1306e6';
function gitBlobSha(bytes){
 const src=Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'));
 return createHash('sha1').update(Buffer.from('blob '+src.length+'\0')).update(src).digest('hex');
}
function mod(x,n=360){return ((x%n)+n)%n}
function testCases(){
 return Array.from({length:50},(_,seed)=>{
  const longitudes=Object.fromEntries(NAME.map((name,index)=>{
   let degree;
   if(seed<24){
    // Independent low-precision physical source isn't necessary here:
    // fixed input longitudes within 0.1332" of a divisor edge.
    const division=NEW12[seed%NEW12.length];
    const sign=(seed*7+index*5)%12;
    const part=(seed+index*11)%division;
    const offset=seed%2===0?0.000037:30/division-0.000037;
    degree=sign*30+part*30/division+offset;
   }else if(seed<44){
    // Explicit unequal D30 sector thresholds, both sign parities and both sides.
    const k=seed-24;
    const oddSign=Math.floor(k/10)===0;
    const sign=mod((oddSign?0:1)+index*2,12);
    const thresholds=oddSign?[0,5,10,18,25]:[0,5,12,20,25];
    const boundary=thresholds[Math.floor((k%10)/2)];
    const delta=k%2===0?-0.000037:0.000037;
    degree=sign*30+boundary+delta;
   }else{
    degree=(seed+1)*17.3711+index*37.20977+index*index*0.0137+seed*0.000101;
   }
   return [name,mod(degree)];
  }));
  return {id:'N4-SYNTH-'+String(seed+1).padStart(3,'0'),longitudes};
 });
}
function assertOriginalSourcePin(){
 const file=readFileSync(new URL('../packages/jyotish-core/src/vargas.ts',import.meta.url));
 assert.equal(gitBlobSha(file),EXPECTED_BLOB,'N4_NEW12_SOURCE_FORMULAS_CHANGED_REQUIRES_RERUN');
}
function buildPublicN4(item){
 const points=NAME.slice(1).map(name=>({name,longitude:item.longitudes[name],speed:0.1}));
 const chart=calculateChart({
  date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',
  latitude:50.45,longitude:30.52,place:'SYNTHETIC_ONLY'
 },{
  ayanamsa:23.8,ascendant:item.longitudes.Ascendant,
  positions:points,julianDay:2451545.0,backend:'synthetic-coordinates-unit-only'
 });
 // No claim of genuine physical verification. Only invoke the real candidate
 // API mapper on reproducible synthetic coordinates for independent sign QA.
 const evidence={version:'jyotish-integrity-v3',status:'verified_internal',
  checks:['synthetic_source_only'],digest:'a'.repeat(64),externalReferenceChecked:false};
 return makeN4RcPayload(chart,evidence);
}
export function compareNew12WithIndependentOracle(reference,cases=testCases()){
 assertOriginalSourcePin();
 assert.equal(reference?.provider,'PyJHora');
 assert.equal(reference.version,'4.8.7');
 assert.equal(reference.profile,'production-sun-moon-hora');
 assert.equal(reference.certifiesPhysics,false);
 assert.equal(reference.certifiesIndividualBirth,false);
 assert.deepEqual(Object.keys(reference.methods).map(Number),NEW12);
 assert.equal(Number(reference.methods['2']),2,'D2 method must be Sun/Moon, never US');
 for(const d of NEW12.filter(n=>n!==2))
  assert.equal(Number(reference.methods[d]),1,'Pinned Parashari formula choice D'+d);
 assert.equal(reference.cases?.length,50);
 assert.equal(cases.length,50);
 const perDivision=NEW12.map(division=>({division,signMatched:0,houseMatched:0,checked:0}));
 const mismatches=[];
 for(let index=0;index<50;index++){
  const item=cases[index],ref=reference.cases[index];
  assert.equal(ref?.id,item.id);
  const n4=buildPublicN4(item);
  assert.equal(n4.charts.length,15);
  assert.deepEqual(n4.charts.map(c=>c.division),[...N4_RC_DIVISIONS]);
  assert.equal(n4.d60Excluded,true);
  for(const record of perDivision){
   const n=record.division;
   const chart=n4.charts.find(c=>c.division===n);
   const expected=ref.signs?.['D'+n];
   assert.ok(expected&&Object.keys(expected).length===10,'independent chart missing D'+n);
   const actual={Ascendant:chart.lagnaSign,...Object.fromEntries(chart.planets.map(p=>[p.name,p.sign]))};
   const ascSign=expected.Ascendant;
   for(const name of NAME){
    const want=expected[name],got=actual[name];
    assert.ok(Number.isInteger(want)&&want>=1&&want<=12);
    record.checked++;
    if(want===got)record.signMatched++;
    else mismatches.push({id:item.id,division:n,body:name,expected:want,actual:got});
    if(name!=='Ascendant'){
     const house=chart.planets.find(p=>p.name===name).house;
     const wantHouse=((want-ascSign+12)%12)+1;
     if(house===wantHouse)record.houseMatched++;
     else mismatches.push({id:item.id,division:n,body:name,
      expectedHouse:wantHouse,actualHouse:house});
    }
   }
  }
 }
 assert.equal(perDivision.length,12);
 assert.equal(perDivision.reduce((v,r)=>v+r.checked,0),6000);
 if(mismatches.length)throw Error('N4_RC_NEW12_PYJHORA_MISMATCH '+JSON.stringify(mismatches.slice(0,18)));
 for(const r of perDivision){
  assert.equal(r.checked,500,'missing independent 50 cases for D'+r.division);
  assert.equal(r.signMatched,500,'sign mismatch D'+r.division);
  assert.equal(r.houseMatched,450,'house mismatch D'+r.division);
 }
 return Object.freeze({
  status:'N4_RC_NEW12_PYJHORA_INDEPENDENT_6000_OF_6000_PASS',
  comparator:'external-PyJHora-4.8.7',
  sourceRulesGitBlob:EXPECTED_BLOB,sourceCases:50,profile:'production-sun-moon-hora',
  newDivisions:[...NEW12],newCards:12,totalSigns:6000,matchedSigns:6000,
  totalPlanetHouses:5400,matchedPlanetHouses:5400,
  byDivision:perDivision,
  originalJHoraUmaShambhuD2Used:false,externalBirthEphemerisCertified:false,
  originalJHoraSameProfile50PhysicalCertified:false,
  publicProductionReleaseAuthorized:false
 });
}
const cases=testCases();
const python=process.env.N4_RC_PYTHON||(process.platform==='win32'?'python':'python3');
const arguments_=[...(python==='py'?['-3']:[]),'tools/n4-rc-new12-pyjhora-oracle.py'];
const child=spawnSync(python,arguments_,{
 input:JSON.stringify({cases}),encoding:'utf8',timeout:210000,maxBuffer:10*1024*1024,
 env:{...process.env,PYTHONWARNINGS:'ignore',QT_QPA_PLATFORM:'offscreen'}
});
if(child.error||child.status!==0){
 console.error((child.stderr||child.error?.message||'').slice(-2500));
 throw Error('N4_RC_PYJHORA_4_8_7_ORACLE_UNAVAILABLE_FAIL_CLOSED');
}
const reference=JSON.parse(child.stdout);
const evidence=compareNew12WithIndependentOracle(reference,cases);
console.log(JSON.stringify(evidence,null,2));
console.log('N4_RC_NEW12_SYMBOLIC_6000_6000_PASS_EXTERNAL_BIRTH_PROOF_NOT_CLAIMED');
