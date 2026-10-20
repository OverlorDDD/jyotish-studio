import test from 'node:test';
import assert from 'node:assert/strict';
import {GLOSSARY,glossaryParts} from '../apps/web/lib/glossary.ts';
test('shared glossary recognizes Ukrainian declensions and English abbreviations',()=>{
 const p=glossaryParts('Лагни Навамші та Дашамші: D9, D10; антардаша і Раху.');
 assert.deepEqual(p.filter(x=>x.entry).map(x=>x.entry.id),['lagna','navamsa','dashamsa','navamsa','dashamsa','antardasha','rahu']);
 const en=glossaryParts('Navamsha and Dashamsha in the Rashi D1, with a Mahadasha.');
 assert.deepEqual(en.filter(x=>x.entry).map(x=>x.entry.id),['navamsa','dashamsa','rashi','rashi','mahadasha']);
 assert.equal(p.map(x=>x.text).join(''),'Лагни Навамші та Дашамші: D9, D10; антардаша і Раху.');
});
test('glossary is safe on empty text, ordinary words, punctuation and preserves characters',()=>{
 for(const text of ['', 'Благна — не термін.', 'Це текст. Лагна, і Навамша (D9).']){
  assert.equal(glossaryParts(text).map(x=>x.text).join(''),text);
 }
 assert.equal(glossaryParts('Благна').filter(x=>x.entry).length,0);
 assert.ok(GLOSSARY.length>=20);
 assert.ok(GLOSSARY.every(t=>t.uk.length>20&&t.en.length>20));
});
