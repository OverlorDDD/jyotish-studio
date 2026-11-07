import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateN4VargasForMethod} from '../packages/jyotish-core/src/varga-method-profiles.ts';
import {calculateAllVargas,SHODASHAVARGA} from '../packages/jyotish-core/src/vargas.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const points=()=>names.map((name,i)=>({name,longitude:(i*37.231+20.04)%360,speed:0}));
test('16 D charts, one explicit D2 method, all 15 other divisions bit-identical',()=>{
 const p=points(),legacy=calculateAllVargas(10,p);
 const us=calculateN4VargasForMethod(10,p,{d2Method:'uma-shambhu',
  inputConvention:'original-jhora8-true-citra-geometric'});
 assert.deepEqual(us.charts.map(x=>x.division),SHODASHAVARGA);
 for(let i=0;i<16;i++)if(us.charts[i].division!==2)assert.deepEqual(us.charts[i],legacy[i]);
 const old=legacy.find(x=>x.division===2),alternate=us.charts.find(x=>x.division===2);
 assert.equal(old.lagna.vargaSign,5);assert.equal(alternate.lagna.vargaSign,1);
 assert.equal(alternate.lagna.house,1);
 assert.equal(us.originalJHora50SameInputMethod,true);
 assert.equal(us.verifiedPhysicalSourceForThisBirth,false);
 assert.equal(us.productionReleasePermitted,false);
});
test('legacy Sun-Moon is unchanged, regardless of stated input source',()=>{
 const p=points();
 for(const convention of ['production-lahiri-apparent','original-jhora8-true-citra-geometric']){
  const r=calculateN4VargasForMethod(10,p,{d2Method:'sun-moon',inputConvention:convention});
  assert.deepEqual(r.charts,calculateAllVargas(10,p));
  assert.equal(r.originalJHora50SameInputMethod,false);
 }
});
test('source ayanamsha label cannot silently establish JHora sign parity',()=>{
 const r=calculateN4VargasForMethod(10,points(),
  {d2Method:'uma-shambhu',inputConvention:'production-lahiri-apparent'});
 assert.equal(r.originalJHora50SameInputMethod,false);
 assert.equal(r.productionReleasePermitted,false);
});
test('reject unknown/source-missing methodologies',()=>{
 for(const request of [undefined,{}, {d2Method:'uma-shambhu'},
  {d2Method:'fake',inputConvention:'production-lahiri-apparent'}]){
  assert.throws(()=>calculateN4VargasForMethod(10,points(),request),/N4_EXPLICIT/);
 }
});
