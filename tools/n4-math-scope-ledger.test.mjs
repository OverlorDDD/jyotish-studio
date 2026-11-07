import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN4ScopedEvidence} from './n4-math-scope-ledger.mjs';
test('source blob exactly matches externally tested PyJHora 8000 profile and never certifies a different original JHora method',()=>{
 const r=auditN4ScopedEvidence();
 assert.equal(r.status,'N4_SYMBOLIC_RULES_SCOPED_EXTERNAL_EVIDENCE_VALIDATED');
 assert.equal(r.productionSunMoonVargaRulesAtPinnedBlob,true);
 assert.equal(r.sourceMethodsDiffer,true);
 assert.equal(r.calendarVimshottariDatesCertified,false);
 assert.equal(r.currentProductionPhysicalAstronomyFullyCertified,false);
 assert.equal(r.productionReleasePermitted,false);
});
