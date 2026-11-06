import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeN413Case,checkedJhoraSyntheticCivilTime,compareN413AgainstSource,N413_PROFILE} from './n4-native-swieph-exact-profile.mjs';
import {n4SyntheticJHoraCase} from './n4-jhora8-windows-prepare.mjs';
import {SHODASHAVARGA,vargaSign} from '../packages/jyotish-core/src/vargas.ts';
import {n4UmaShambhuHoraSign} from '../packages/jyotish-core/src/hora-uma-shambhu.ts';
function fake(){
 const sw={
  SiderealMode:{TrueCitra:27},CalculationFlag:{SwissEphemeris:2,TruePositions:16,NoNutation:64,Sidereal:65536,Speed:256},
  LunarPoint:{MeanNode:10},Planet:{Sun:0,Moon:1,Mars:4,Mercury:2,Jupiter:5,Venus:3,Saturn:6},
  HouseSystem:{Placidus:'P'},setSiderealMode(mode){assert.equal(mode,27)},
  getAyanamsaExUt(){return 23.7},calculateHouses(){return {ascendant:250.1}},
  julianDay(){return 2450000},calculatePosition(jd,body,flags){
   assert.equal(flags,2|16|65536|256);
   return {longitude:(body*33+2)%360,longitudeSpeed:0.1,flags:2|16|65536|256};
  }
 };return sw;
}
test('strict isolated native True-Citra profile, real input UTC, truepos+nonut Lagna',()=>{
 const c=n4SyntheticJHoraCase(1);
 const time=new Date(new Date(c.date+'T'+c.time+':00Z').getTime()-c.timezoneHours*3600000);
 const input={id:c.id,birthUtc:time.toISOString()};
 const p=nativeN413Case(fake(),input,1);
 assert.ok(Math.abs(p.natalLongitudes.Ascendant-226.4)<1e-10);
 assert.equal(p.natalLongitudes.Ketu,(p.natalLongitudes.Rahu+180)%360);
 assert.equal(p.backend,'returned-SWIEPH-2-on-eight-body-calculations');
 assert.throws(()=>checkedJhoraSyntheticCivilTime({...input,birthUtc:'1990-01-05T00:00:00Z'},1),/original UTC/);
});
test('MOSEPH cannot be silently accepted even for numerically matching positions',()=>{
 const sw=fake();sw.calculatePosition=()=>({longitude:3,longitudeSpeed:1,flags:4});
 const c=n4SyntheticJHoraCase(0),d=new Date(new Date(c.date+'T'+c.time+':00Z').getTime()-c.timezoneHours*3600000);
 assert.throws(()=>nativeN413Case(sw,{id:c.id,birthUtc:d.toISOString()},0),/returned backend 4/);
});
test('shape-only fake reference is never a production release certificate',()=>{
 const actual=[],source={cases:[]};
 const b=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
 for(let i=0;i<50;i++){
  const l=Object.fromEntries(b.map((name,j)=>[name,(j*30+11+i*.0002)%360]));
  actual.push({id:'N4-SYNTH-'+String(i+1).padStart(3,'0'),natalLongitudes:l,ayanamsa:23.7});
  const expectedSigns={};
  for(const d of SHODASHAVARGA)expectedSigns['D'+d]=Object.fromEntries(b.map(name=>[name,
   (d===2?n4UmaShambhuHoraSign(l[name]):vargaSign(l[name],d))+1]));
  source.cases.push({id:actual[i].id,natalLongitudes:l,originalAyanamsaDegrees:23.7,expectedSigns});
 }
 const pass=compareN413AgainstSource(source,actual);
 assert.equal(pass.checkedVargaSigns,8000);assert.equal(pass.matchingVargaSigns,8000);
 assert.equal(pass.productionReleasePermitted,false);
 assert.equal(pass.status,'N413_NATIVE_SWIEPH_PRIVATE_50_CASE_DIAGNOSTIC_PASS');
 const broken=structuredClone(actual);broken[48].natalLongitudes.Ascendant+=20/3600;
 const failed=compareN413AgainstSource(source,broken);
 assert.equal(failed.status,'N413_NATIVE_SWIEPH_PRIVATE_50_CASE_DIAGNOSTIC_FAIL');
 assert.ok(failed.angularViolations>0);
});
