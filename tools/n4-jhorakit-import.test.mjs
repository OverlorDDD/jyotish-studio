import test from 'node:test';
import assert from 'node:assert/strict';
import {importJHoraKitExport} from './n4-jhorakit-import.mjs';
import {SHODASHAVARGA,VARGA_PROFILE} from '../packages/jyotish-core/src/vargas.ts';
const names=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const settings='Pinned JHora 8.0 complete 16-varga method options, ephemeris, ayanamsa and INI SHA256';
const rec=()=>{
 const planets=Object.fromEntries(names.map(name=>[name,{longitude:0}]));
 const divisionals=Object.fromEntries(SHODASHAVARGA.map(d=>[
  'Fixture (D'+d+')',Object.fromEntries(names.map(name=>[name,{sign:'Aries'}]))
 ]));
 return {meta:{name:'N4-SYNTH-001',chart_type:'Natal Chart'},
  birth:{name:'DO_NOT_LEAK',place:'PRIVATE_PLACE',date:'1999-01-01'},
  planets,divisionals};
};
test('JHoraKit format importer maps source signs, strips birth metadata and never calculates them',()=>{
 const value=importJHoraKitExport(rec(),{
  id:'N4-SYNTH-001',profile:VARGA_PROFILE,referenceSettings:settings
 });
 assert.equal(value.referenceTool,'Jagannatha Hora 8.0');
 assert.equal(Object.keys(value.expectedSigns).length,16);
 assert.equal(Object.keys(value.expectedSigns.D30).length,10);
 assert.equal(value.expectedSigns.D60.Ascendant,1);
 assert.equal(value.natalLongitudes.Ascendant,0);
 assert.equal(value.isRealPerson,false);
 assert.ok(!JSON.stringify(value).includes('DO_NOT_LEAK'));
 assert.ok(!JSON.stringify(value).includes('PRIVATE_PLACE'));
});
test('Original JHora source must be synthetic, complete and matching exactly pinned profile',()=>{
 const opts={id:'N4-SYNTH-001',profile:VARGA_PROFILE,referenceSettings:settings};
 assert.throws(()=>importJHoraKitExport({...rec(),meta:{name:'Named real person',chart_type:'Natal Chart'}},opts),/synthetic/);
 assert.throws(()=>importJHoraKitExport(rec(),{...opts,id:'REAL-PERSON'}),/synthetic/);
 assert.throws(()=>importJHoraKitExport(rec(),{...opts,profile:'wrong'}),/Mismatched/);
 assert.throws(()=>importJHoraKitExport(rec(),{...opts,referenceSettings:'none'}),/Pinned/);
 const truncated=rec();delete truncated.divisionals['Fixture (D60)'];
 assert.throws(()=>importJHoraKitExport(truncated,opts),/missing/);
 const invalid=rec();invalid.divisionals['Fixture (D30)'].Moon.sign='Unknown';
 assert.throws(()=>importJHoraKitExport(invalid,opts),/unknown/);
});
