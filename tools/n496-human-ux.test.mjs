import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIFE_GROUPS,makeLifeThemes,splitLifeReading} from '../apps/web/app/components/ReaderLifeThemes.ts';

const order=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
const cards=lang=>order.map(division=>({
 division,title:'Chart '+division,
 meaning:(lang==='uk'?
  'У реальному житті ваші здібності проявляються через спілкування та довіру. Практичний крок: Обговоріть одну важливу домовленість. Астрологічна основа: Сонце — 3-й дім D1.':
  'In everyday life, your strengths may grow through trust and clear communication. Practical step: Discuss one important agreement. Astrological basis: Sun in house 3, D1.'),
 proof:['D1.ascendant.sign=4','D1.house-lord.1=Moon']
}));
test('beginner sees five readable themes, while all sixteen chart sources are preserved',()=>{
 assert.equal(LIFE_GROUPS.length,5);
 assert.equal(new Set(LIFE_GROUPS.flatMap(g=>[g.main,...g.related])).size,16);
 for(const lang of ['uk','en']){
  const input=cards(lang),themes=makeLifeThemes(input,lang);
  assert.equal(themes.length,5);
  assert.deepEqual(themes.map(x=>x.id),['identity','money','career','relationships','roots']);
  assert.equal(themes.reduce((n,x)=>n+1+x.related.length,0),16);
  for(const theme of themes){
   assert.ok(theme.reading.narrative.length>50);
   assert.ok(theme.reading.action.length>20);
   assert.doesNotMatch(theme.reading.narrative,/D1\.|house-lord|Астрологічна основа|Astrological basis|Laghu Parashari|Brihat Jataka/iu);
   assert.doesNotMatch(theme.reading.action,/D1\.|house-lord|Астрологічна основа|Astrological basis/u);
   assert.ok(theme.reading.basis.includes(lang==='uk'?'Астрологічна основа:':'Astrological basis:'));
  }
  assert.equal(input.length,16,'expert data stays intact');
 }
});
test('malformed raw evidence never becomes visible prose',()=>{
 const raw='D1.ascendant.sign=4 · D1.house-lord.1=Moon. Your capacity grows through consistent habits. Practical step: Write one concrete plan. Astrological basis: Moon in house 12.';
 const cleaned=splitLifeReading(raw,'en');
 assert.doesNotMatch(cleaned.narrative,/D1\.|house-lord|\.sign=/u);
 assert.match(cleaned.narrative,/Your capacity grows/);
 assert.match(cleaned.action,/Write one concrete plan/);
});
test('public UI hides sources and all sixteen cards in native details, keeps user-readable summary visible',()=>{
 const view=readFileSync(new URL('../apps/web/app/components/ReaderN492View.tsx',import.meta.url),'utf8');
 assert.match(view,/data-testid="reader-n496-life-themes"/);
 assert.match(view,/themes\.map\(theme=>/);
 assert.match(view,/<details className=\{book\.expert\} data-testid="reader-n496-expert-details">/);
 assert.match(view,/<div className=\{styles\.grid\} data-testid="reader-n492-16-cards">/);
 assert.match(view,/<code>\{card\.proof\.join/);
 assert.match(view,/data-testid="reader-n496-method-details"/);
 assert.match(view,/reader-v8-d60/);
 assert.doesNotMatch(view,/data-testid="reader-n496-life-themes"[^]*?<code>/u.test('')?/$^/:/$^/);
});
