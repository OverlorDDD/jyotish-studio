import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {closeD60SymbolicMath} from './n4-d60-final-certification.mjs';
const input=JSON.parse(readFileSync(new URL('./n4-d60-final-certification-evidence.json',import.meta.url),'utf8'));
test('D60 independent symbolic 50+50 method evidence is CLOSED, not a birthtime certificate',()=>{
 const r=closeD60SymbolicMath(input);
 assert.equal(r.status,'N4_D60_TRADITIONAL_SYMBOLIC_MATHEMATICS_CERTIFIED_CLOSED');
 assert.equal(r.originalJHora8,'500/500');
 assert.equal(r.userSpecificD60LagnaStabilityGuaranteed,false);
 assert.equal(r.requiresReopeningSymbolicFormulaResearch,false);
 assert.equal(r.publicDeploymentAuthorized,false);
});
test('D60 never accepts inflated birth-time precision, Reader or AI rights',()=>{
 for(const key of [
  'continuousD60BirthTimeStabilityCertified','userSpecificTimeExactnessCertified',
  'historicalCivilTimeGloballyCertified','userSpecificLagnaAndHousesAlwaysReliable',
  'publicReaderD60InterpretationEnabled','publicAIInterpretationD60Enabled',
  'publicProductionDeploymentAuthorized'
 ])assert.throws(()=>closeD60SymbolicMath({...input,[key]:true}),/unjustified birth\/AI\/release certificate/);
});
test('D60 changed method and short original reference must fail',()=>{
 assert.throws(()=>closeD60SymbolicMath({...input,method:'Uma-Shambhu'}));
 assert.throws(()=>closeD60SymbolicMath({...input,originalJHora8D60MatchingSigns:499}));
 assert.throws(()=>closeD60SymbolicMath({...input,independentPyJHoraD60MatchingHouses:449}));
 assert.throws(()=>closeD60SymbolicMath(input,'0'.repeat(40)),/source formulas changed/);
});
