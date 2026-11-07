import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN4ScopedEvidence} from './n4-math-scope-ledger.mjs';
import {readFileSync} from 'node:fs';
test('source blob exactly matches externally tested PyJHora 8000 profile and never certifies a different original JHora method',()=>{
 const r=auditN4ScopedEvidence();
 assert.equal(r.status,'N4_SYMBOLIC_RULES_SCOPED_EXTERNAL_EVIDENCE_VALIDATED');
 assert.equal(r.productionSunMoonVargaRulesAtPinnedBlob,true);
 assert.equal(r.sourceMethodsDiffer,true);
 assert.equal(r.calendarVimshottariDatesCertified,false);
 assert.equal(r.currentProductionPhysicalAstronomyFullyCertified,false);
 assert.equal(r.productionReleasePermitted,false);
});

test('JHora evidence field spelling matches validator EXACTLY; lowercase j is not allowed',()=>{
 const ledger=JSON.parse(readFileSync(new URL('./n4-math-scope-ledger.json',import.meta.url),'utf8'));
 const source=readFileSync(new URL('./n4-math-scope-ledger.mjs',import.meta.url),'utf8');
 const exactField='originalIndependentPyJhoraMethodParity';
 assert.equal(ledger.scopeRules[0][exactField],true);
 assert.equal(Object.hasOwn(ledger.scopeRules[0],'originalIndependentPyjhoraMethodParity'),false);
 assert.ok(source.includes('py.'+exactField+'!==true'));
 assert.ok(!source.includes('py.originalIndependentPyjhoraMethodParity'));
 assert.equal(auditN4ScopedEvidence().productionReleasePermitted,false);
});
