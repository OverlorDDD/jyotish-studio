import test from 'node:test';
import assert from 'node:assert/strict';
import {validateN4JHoraCase} from './n4-original-provenance.mjs';
const valid={id:'N4-SYNTH-001',referenceTool:'Jagannatha Hora 8.0',isRealPerson:false,
 referenceSettings:'Authentic JHora 8.0 pinned INI SHA256 '+'a'.repeat(64)+'; D10Preference=0; D60Preference=0',
 referenceSourceSha256:'b'.repeat(64)};
test('JHora provenance guard checks proper 3-digit identifiers and sha256; NOT mathematical certification',()=>{
 assert.equal(validateN4JHoraCase(valid),true);
 for(const id of ['N4-SYNTH-000','N4-SYNTH-051','N4-SYNTH-1','REAL-BIRTH-001'])
  assert.throws(()=>validateN4JHoraCase({...valid,id}),/N4-SYNTH/);
 assert.throws(()=>validateN4JHoraCase({...valid,referenceSourceSha256:'notsha'}),/SHA256/);
 assert.throws(()=>validateN4JHoraCase({...valid,referenceSettings:'not pinned'}),/INI/);
 assert.throws(()=>validateN4JHoraCase({...valid,referenceTool:'PyJHora'}),/genuine/);
});
