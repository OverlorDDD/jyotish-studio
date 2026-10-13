import test from 'node:test';
import assert from 'node:assert/strict';
import {ukTerm,normalizeUkrainianAstroTerms} from '../apps/api/src/terminology.ts';
import {astrologicalFacts} from '../apps/api/src/ai.ts';

test('canonical zodiac signs and planetary labels are stable',()=>{
 assert.equal(ukTerm('Pisces'),'Риби');
 assert.equal(ukTerm('Sagittarius'),'Стрілець');
 assert.equal(ukTerm('Libra'),'Терези');
 assert.equal(ukTerm('Swati'),'Сваті');
 assert.equal(ukTerm('Saturn'),'Сатурн');
 assert.equal(ukTerm('Ketu'),'Кету');
});
test('small-model phoneticized terms become correct Ukrainian forms',()=>{
 const result=normalizeUkrainianAstroTerms('Лагна: Піссіс; Сонце: Сагітарий; Місяць: Ліба, Сватьі. Pisces Sagittarius Libra Swati.');
 for(const term of ['Риби','Стрілець','Терези','Сваті'])
  assert.ok(result.includes(term),term);
 for(const wrong of ['Піссіс','Сагітарий','Ліба','Сватьі','Pisces','Sagittarius','Libra','Swati'])
  assert.ok(!result.includes(wrong),wrong);
});
test('normalizer does not break surrounding Cyrillic or English words',()=>{
 const input='mylibra2, Лібрація, astrosagittarius, Прориби';
 assert.equal(normalizeUkrainianAstroTerms(input),input);
});
test('AI source facts use localized signs and nakshatras, not raw English names',()=>{
 const p=(name,signName)=>({name,signName,house:1,nakshatra:'Swati',pada:4});
 const chart={
  ascendant:p('Ascendant','Pisces'),lagnaD9:p('Ascendant','Libra'),lagnaD10:p('Ascendant','Pisces'),
  d1:[p('Sun','Sagittarius'),p('Moon','Libra')],
  dasha:[{lord:'Saturn',start:'2020-01-01',end:'2030-01-01',
   antardashas:[{lord:'Ketu',start:'2026-01-01',end:'2027-01-01'}]}]
 };
 const text=JSON.stringify(astrologicalFacts(chart,'uk',Date.parse('2026-10-12')));
 for(const wrong of ['Pisces','Sagittarius','Libra','Swati','Saturn'])
  assert.ok(!text.includes(wrong),wrong);
 for(const expected of ['Риби','Стрілець','Терези','Сваті','Сатурн'])
  assert.ok(text.includes(expected),expected);
});
