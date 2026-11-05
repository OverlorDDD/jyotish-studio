import test from 'node:test';
import assert from 'node:assert/strict';
import {n4SyntheticAuditChart} from './n4-ai-synthetic-profiles.mjs';
import {buildN4LifeEvidence} from '../apps/api/src/n4-comprehensive-reading.ts';
import {reviewN4CompleteLifeText} from '../apps/api/src/n4-comprehensive-quality.ts';

function validNarrative(chart){
 const data=buildN4LifeEvidence(chart,'2026-11-05');
 const sample=[
  '# Full traditional reading',
  'D1 '+data.d1.grahas[0].name+' house='+data.d1.grahas[0].house+'.',
  ...data.scopes.filter(x=>x.status==='INTERNAL_MATH_ONLY')
   .map(x=>'D'+x.division+' '+x.anchor+' house='+x.dnAnchor.house+
    ' is the explicitly computed source of a conditional topic.'),
  Array(620).fill('Contextual practice and a concrete next step.').join(' ')
 ];
 return sample.join('\n');
}
test('full-life review requires all 14 domain references and substantial source evidence',()=>{
 for(let seed=0;seed<12;seed++){
  const chart=n4SyntheticAuditChart(seed),text=validNarrative(chart);
  const result=reviewN4CompleteLifeText(text,chart,'en','2026-11-05');
  assert.deepEqual(result.codes,[]);
  assert.equal(result.requiredCharts.length,15);
  assert.equal(result.groundedCharts.length>=9,true);
  assert.equal(result.humanSemanticReviewed,false);
  assert.equal(result.originalJHoraCertified,false);
 }
});
test('never accept a lengthy but generic story with no real charts',()=>{
 const chart=n4SyntheticAuditChart(0);
 const story='# Life\n'+Array(620).fill('Your potential is strong and your future is bright.').join(' ');
 const result=reviewN4CompleteLifeText(story,chart,'en','2026-11-05');
 assert.ok(result.codes.includes('n4_complete_missing_specific_domain'));
 assert.ok(result.codes.includes('n4_complete_missing_verified_core_claims'));
 assert.ok(result.codes.includes('n4_complete_weak_multivarga_evidence'));
});
test('D9 sign/house hallucination remains a hard error despite complete coverage',()=>{
 const chart=n4SyntheticAuditChart(0),text=validNarrative(chart);
 const wrong=text+' \nУ Д9 Венера у дванадцятому домі.';
 const report=reviewN4CompleteLifeText(wrong,chart,'uk','2026-11-05');
 assert.ok(report.codes.includes('n4_explicit_planet_sign_or_house_mismatch'));
 assert.ok(report.codes.length>=1);
});
test('dropping D24 cannot be disguised by repeating D10',()=>{
 const chart=n4SyntheticAuditChart(0),text=validNarrative(chart);
 const changed=text.replace(/D24 Mercury house=\d+/,'D10 Mercury house=1');
 const report=reviewN4CompleteLifeText(changed,chart,'en','2026-11-05');
 assert.ok(report.codes.includes('n4_complete_missing_specific_domain'));
});
