import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const view=readFileSync(new URL('../apps/web/app/components/ReaderN492View.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../apps/web/app/components/ReaderN492View.module.css',import.meta.url),'utf8');
const human=readFileSync(new URL('../apps/api/src/reader-human-n495.ts',import.meta.url),'utf8');

test('reader leads with five human life topics rather than sixteen bare D-card codes',()=>{
 const topics=[...view.matchAll(/id:'(identity|money|career|relationships|roots)',uk:'([^']+)',en:'([^']+)',lead:(\d+),divisions:\[([^\]]+)\]/g)];
 assert.equal(topics.length,5);
 assert.deepEqual(topics.map(t=>t[1]),['identity','money','career','relationships','roots']);
 const codes=topics.flatMap(t=>t[5].split(',').map(x=>Number(x.trim())));
 assert.equal(new Set(codes).size,16);
 assert.deepEqual([...codes].sort((a,b)=>a-b),[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
 assert.deepEqual(topics.map(t=>Number(t[4])),[1,2,10,9,4]);
 assert.match(view,/data-testid="reader-n496-life-topics"/);
 assert.match(view,/className=\{book\.lifeTopic\}/);
 assert.match(view,/className=\{book\.more\}/);
 assert.match(view,/data-testid=\{isD60\?'reader-v8-d60'/);
 assert.match(css,/\.lifeTopics\{display:grid/);
 assert.match(css,/\.story\{font-size:/);
 assert.match(css,/@media\(max-width:600px\)/);
});
test('reader hides machine evidence and methodology; full proof stays intact in API',()=>{
 assert.doesNotMatch(view,/<code>|card\.proof\.join|legacy\.sources|sourceIds\.join/);
 assert.match(view,/detailsFor\(main\)/);
 assert.match(view,/detailsFor\(card\)/);
 assert.match(view,/lastIndexOf\(basisLabel\)/);
 assert.match(view,/lastIndexOf\(actionLabel\)/);
 assert.match(view,/className=\{book\.technical\}/);
 assert.match(view,/data-testid="reader-n492-d60-nine"/);
 assert.match(view,/read\.method/);
 assert.match(view,/read\.cards\.length!==16/);
});
test('same-area prose no longer parrots the identical theme twice',()=>{
 assert.match(human,/const sameSphere=natal\.house===placement\.house/);
 assert.match(human,/if\(sameSphere&&!\[1,9,10,24\]\.includes\(division\)\)/);
 assert.match(human,/const teaser=choose\(LEAD\[division\],lang\).*sameSphere/s);
 assert.doesNotMatch(human,/У практичному житті це торкається сфери /);
 assert.doesNotMatch(human,/In practice this touches /);
});
