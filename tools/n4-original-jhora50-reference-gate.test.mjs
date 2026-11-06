import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN4JHora50MethodAwareReference,N4_JHORA8_ORIGINAL_50_PROFILE} from './n4-original-jhora50-reference-gate.mjs';
import {SHODASHAVARGA,vargaSign} from '../packages/jyotish-core/src/vargas.ts';
import {n4UmaShambhuHoraSign} from '../packages/jyotish-core/src/hora-uma-shambhu.ts';
const BODIES=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const sha=i=>i.toString(16).padStart(64,'0');
function fakeShapeFixture(){
 const cases=[];
 for(let i=1;i<=50;i++){
  const natalLongitudes=Object.fromEntries(BODIES.map((b,j)=>[b,(j*30+11.314159+i*0.0001)%360]));
  const expectedSigns={};
  for(const d of SHODASHAVARGA)expectedSigns['D'+d]=Object.fromEntries(
   BODIES.map(b=>[b,(d===2?n4UmaShambhuHoraSign(natalLongitudes[b]):vargaSign(natalLongitudes[b],d))+1]));
  cases.push({id:'N4-SYNTH-'+String(i).padStart(3,'0'),
   originalSourceSha256:sha(i),originalJhdSha256:sha(100+i),
   originalAyanamsaDegrees:23.7,originalChartMethodLabels:{D2:'US',D60:'Trd'},
   natalLongitudes,expectedSigns});
 }
 return {profile:N4_JHORA8_ORIGINAL_50_PROFILE,
  originalJhoraExecutableSha256:'3DDBE5FB0458AD1F0AD91B002C7EFB8BBA9F08891D3F46190ABA97D570B17908',
  productionEphemerisCertified:false,cases};
}
const copy=value=>structuredClone(value);
test('50 synthetic SHAPE fixtures exercise an original-JHora-compatible 8000-sign gate; do not claim external evidence from this',()=>{
 const got=auditN4JHora50MethodAwareReference(fakeShapeFixture());
 assert.equal(got.sourceCases,50);assert.equal(got.checkedSigns,8000);
 assert.equal(got.productionReleasePermitted,false);
 assert.equal(got.independentPhysicalEphemerisCertified,false);
});
test('fail closed for missing source, duplicate SHA and corrupted original D60',()=>{
 const p=fakeShapeFixture();
 assert.throws(()=>auditN4JHora50MethodAwareReference({...p,cases:p.cases.slice(0,49)}),/exactly 50/);
 const q=copy(p);q.cases[3].originalSourceSha256=q.cases[2].originalSourceSha256;
 assert.throws(()=>auditN4JHora50MethodAwareReference(q),/source SHA/);
 const r=copy(p);r.cases[37].expectedSigns.D60.Mars=1+(r.cases[37].expectedSigns.D60.Mars%12);
 assert.throws(()=>auditN4JHora50MethodAwareReference(r),/D60 Mars/);
});
test('wrong D2 profile, source fingerprint, independent-astronomy self-certification never pass',()=>{
 const p=fakeShapeFixture();
 const q=copy(p);q.cases[0].originalChartMethodLabels.D2='SunMoon';
 assert.throws(()=>auditN4JHora50MethodAwareReference(q),/D2 \(US\)/);
 const r=copy(p);r.cases[0].expectedSigns.D2.Sun=1+(r.cases[0].expectedSigns.D2.Sun%12);
 assert.throws(()=>auditN4JHora50MethodAwareReference(r),/D2 Sun/);
 const s=copy(p);s.productionEphemerisCertified=true;
 assert.throws(()=>auditN4JHora50MethodAwareReference(s),/self-certify/);
 const t=copy(p);t.originalJhoraExecutableSha256=sha(999);
 assert.throws(()=>auditN4JHora50MethodAwareReference(t),/unknown original JHora binary/);
});
