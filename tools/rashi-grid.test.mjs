import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../apps/web/app/components/NorthIndianChart.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../apps/web/app/globals.css',import.meta.url),'utf8');

const signs=JSON.parse(src.match(/SOUTH_SIGN_GRID=\[([\d,]+)\]/)?.[0].match(/\[[\d,]+\]/)?.[0]||'[]');
const positions=[...src.matchAll(/\[(\d),(\d)\]/g)].slice(0,12).map(m=>[Number(m[1]),Number(m[2])]);
const expected=[[1,1],[2,1],[3,1],[4,1],[1,2],[4,2],[1,3],[4,3],[1,4],[2,4],[3,4],[4,4]];
test('Rashi perimeter has exactly the twelve fixed zodiac signs and zero duplicate or middle cells',()=>{
 assert.deepEqual(signs,[12,1,2,3,11,4,10,5,9,8,7,6]);
 assert.equal(new Set(signs).size,12);
 assert.deepEqual(positions,expected);
 assert.equal(new Set(positions.map(([x,y])=>x+':'+y)).size,12);
 assert.ok(positions.every(([x,y])=>x===1||x===4||y===1||y===4));
});
test('Every varga places all 9 grahas by actual sign, with individual degrees, reversal and Lagna',()=>{
 assert.match(src,/planets\.filter\(p=>p\.sign===sign/);
 assert.match(src,/occupants\.map/);
 assert.match(src,/p\.degreesInSign/);
 assert.match(src,/p\.retrograde/);
 assert.match(src,/sign===lagna\.sign/);
 assert.doesNotMatch(src,/occupants\.slice/);
 for(let lagna=1;lagna<=12;lagna++){
  const houses=signs.map(sign=>((sign-lagna+12)%12)+1);
  assert.equal(new Set(houses).size,12);
  assert.equal(houses[signs.indexOf(lagna)],1);
 }
});
test('Rashi grid clips at the frame, keeps its center empty and adapts at mobile sizes',()=>{
 assert.match(css,/\.jy-south-chart\{display:grid/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/overflow:hidden/);
 assert.match(css,/@media\(max-width:490px\)/);
 assert.match(src,/className="jy-south-center"/);
});
