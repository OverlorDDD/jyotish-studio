import test from 'node:test';
import assert from 'node:assert/strict';
import {extractN4NaturalHouseClaims} from '../apps/api/src/n4-natural-house-claims.ts';
import {reviewN4EditorialGate} from '../apps/api/src/n4-editorial-gate.ts';
import {n4SyntheticAuditChart} from './n4-ai-synthetic-profiles.mjs';
import {n4InternalServerSnapshot} from '../apps/api/src/n4-varga-contract.ts';

test('N4 local-language parser understands sign-vs-house claims, D tag before/after planet',()=>{
 const examples=[
  ['У **Д9** (стосунки) Венеру бачимо у дванадцятому домі.',[{division:9,planet:'Venus',house:12}]],
  ['Венера у дванадцятому домі (Д9) — тема партнерства.',[{division:9,planet:'Venus',house:12}]],
  ['Д10 показує Сонце у одинадцятому домі.',[{division:10,planet:'Sun',house:11}]],
  ['In D9, Venus sits in the seventh house.',[{division:9,planet:'Venus',house:7}]],
  ['D1 Mars is in 3rd house, D3 Mars is in 7th house.',[{division:1,planet:'Mars',house:3},{division:3,planet:'Mars',house:7}]],
  ['У Д9 Венера у 7-му домі.',[{division:9,planet:'Venus',house:7}]],
  ['Д9 Венера в сьомому домі.',[{division:9,planet:'Venus',house:7}]],
  ['D9 Venus sign=12.',[]]
 ];
 for(const [s,expected] of examples)assert.deepEqual(extractN4NaturalHouseClaims(s),expected);
});
test('N4 catches synthetic D9 Venus sign=12 / house=7 confusion despite two valid technical source proofs',()=>{
 const chart=n4SyntheticAuditChart(0);
 const venus=n4InternalServerSnapshot(chart).charts.find(v=>v.division===9).planets.find(p=>p.name==='Venus');
 assert.equal(venus.sign,12);
 assert.equal(venus.house,7);
 const phrase='D3 Mars house=7. D24 Mercury house=1. У Д9 (стосунки) Венеру розміщено у дванадцятому домі. D10 Sun is in the eleventh house. '+ 
 'The symbolic placements point to two conditional actions, not guaranteed life events.';
 const bad=reviewN4EditorialGate(phrase,chart,'uk','2026-11-05');
 assert.ok(bad.codes.includes('n4_explicit_planet_sign_or_house_mismatch'));
 assert.ok(bad.rejectedNaturalHouseAssertions>=1);
 assert.ok(bad.checkedNaturalHouseAssertions>=2);
 const fixed=reviewN4EditorialGate(phrase.replace('дванадцятому домі','сьомому домі'),chart,'uk','2026-11-05');
 assert.ok(!fixed.codes.includes('n4_explicit_planet_sign_or_house_mismatch'));
});
test('N4 localized parsing is conservative and cannot certify ungrounded free prose',()=>{
 for(const s of ['In D9 Venus matters for relationships.','Венера у стосунках говорить про довіру.',
 'D9 Venus sign=12 is a sign, not a house.'])
  assert.deepEqual(extractN4NaturalHouseClaims(s),[]);
});
