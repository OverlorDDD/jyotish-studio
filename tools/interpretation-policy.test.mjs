import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFreeProse} from '../apps/api/src/interpretation-policy.ts';

test('safe thematic LLM prose passes without declaring calculated values',()=>{
 assert.deepEqual(verifyFreeProse('Цей символічний мотив пов’язаний з увагою, терпінням і відповідальним вибором.'),{ok:true});
});
test('invented degrees, houses and dates cannot enter trusted AI narrative',()=>{
 for(const text of [
  'Сонце має точну силу 18° та визначає життєвий шлях.',
  'Планета перебуває у 7-му домі і гарантує шлюб.',
  'A placement in house 10 will bring public success.',
  'This is guaranteed to happen on 2028-10-14 in your life.'
 ]){
  assert.equal(verifyFreeProse(text).ok,false,text);
 }
});
test('dignity and strength are calculated facts, never accepted from model prose',()=>{
 for(const text of ['Ця планета в екзальтації, тому вона точно сильна.','Mercury is exalted and strong in the chart.']){
  assert.equal(verifyFreeProse(text).ok,false,text);
 }
});
test('yoga references must occur on the approved engine yoga list',()=>{
 assert.equal(verifyFreeProse('Ruchaka yoga encourages initiative in the tradition.').ok,false);
 assert.equal(verifyFreeProse('Ruchaka yoga encourages initiative in the tradition.',['Ruchaka']).ok,true);
 assert.equal(verifyFreeProse('Shasha yoga influences discipline and responsibility.',['Ruchaka']).ok,false);
});

test('free LLM cannot independently invent sign placements or unnamed yoga families',()=>{
 for(const candidate of [
  'Sun in Pisces changes every aspect of your experience.',
  'Сонце у Скорпіоні нібито визначає життєвий шлях.',
  'Raja yoga is present and promises guaranteed wealth.',
  'Гаджакесарі йога показує матеріальний успіх.'
 ])assert.equal(verifyFreeProse(candidate).ok,false,candidate);
});
