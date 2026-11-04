/**
 * 50 independently evaluated synthetic N4 profiles, 16 vargas × 10 points each.
 * External oracle runs PyJHora 4.8.7 (under its own license) as a subprocess.
 * This is PyJHora parity, NOT a JHora 8 Windows attestation.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {SHODASHAVARGA,vargaSign} from '../packages/jyotish-core/src/vargas.ts';

const names=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const wrap=(v)=>((v%360)+360)%360;
const cases=Array.from({length:50},(_,seed)=>{
 const longitudes=Object.fromEntries(names.map((name,index)=>{
  let degree;
  if(seed<24){
   // Different signs and progressively closer to a sub-sign edge; NOT exact floating boundaries.
   const division=SHODASHAVARGA[seed%SHODASHAVARGA.length];
   const sign=(seed*7+index*5)%12;
   const part=(seed+index*11)%division;
   const offset=(seed%2===0?0.000037:30/division-0.000037);
   degree=sign*30+part*30/division+offset;
  }else{
   degree=(seed+1)*17.3711 + index*37.20977 + index*index*0.0137 +seed*0.000101;
  }
  return [name,wrap(degree)];
 }));
 return {id:'N4-SYNTH-'+String(seed+1).padStart(3,'0'),longitudes};
});
const out=spawnSync(process.env.N4_PYTHON||'python3',['tools/n4-pyjhora-oracle.py'],{
 input:JSON.stringify({cases}),encoding:'utf8',maxBuffer:10*1024*1024,timeout:180000,
 env:{...process.env,PYTHONWARNINGS:'ignore'}
});
if(out.error||out.status!==0){
 console.error(out.stderr?.slice(-5000)||String(out.error));
 throw Error('Independent PyJHora oracle unavailable: fail closed');
}
const result=JSON.parse(out.stdout);
assert.equal(result.provider,'PyJHora');
assert.equal(result.version,'4.8.7');
assert.equal(result.cases.length,50);
let checked=0;
const mismatches=[];
for(const [i,item] of result.cases.entries()){
 const original=cases[i];
 assert.equal(item.id,original.id);
 for(const division of SHODASHAVARGA){
  const expected=item.signs?.['D'+division];
  if(!expected)throw Error('Missing independent reference D'+division);
  for(const name of names){
   const target=expected[name];
   assert.ok(Number.isInteger(target)&&target>=1&&target<=12,'Invalid independent oracle output');
   const actual=vargaSign(original.longitudes[name],division)+1;
   checked++;
   if(actual!==target)mismatches.push({
    id:item.id,division,body:name,longitude:original.longitudes[name],actual,reference:target
   });
  }
 }
}
assert.equal(checked,8000);
if(mismatches.length){
 console.error('N4 independent PyJHora mismatches',JSON.stringify(mismatches.slice(0,45),null,2));
 throw Error('N4_PYJHORA_REFERENCE_MISMATCH '+mismatches.length+'/'+checked);
}
console.log('N4_PYJHORA_PARITY_PASS: '+checked+'/8000 independent PyJHora sign comparisons (50 synthetic profiles)');
console.log('N4_JHORA8_STATUS: NOT CERTIFIED, original Windows JHora corpus still required');
