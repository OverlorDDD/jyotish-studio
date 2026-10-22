import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutHouses,CHART_HOUSES,SIGN_GLYPHS,PLANET_GLYPHS} from '../apps/web/lib/north-indian-layout.ts';
const planet=(name,house)=>({name,house,sign:1,degreesInSign:12.345,retrograde:false});
test('all 12 chart sectors have unique centered anchors inside their geometric zones',()=>{
 assert.equal(CHART_HOUSES.length,12);
 const entries=layoutHouses([]);
 assert.equal(entries.length,12);
 assert.equal(new Set(entries.map(p=>p.x+':'+p.y)).size,12);
 for(const p of entries){
  assert.ok(p.x>=40&&p.x<=320&&p.y>=38&&p.y<=322,'sector '+p.house);
  assert.ok(p.top>=11&&p.top+17<=349,'label stays inside frame '+p.house);
  assert.equal(p.house,entries.indexOf(p)+1);
 }
 assert.equal(entries[0].x,180);
 assert.equal(entries[6].x,180);
 assert.equal(entries[3].y,180);
 assert.equal(entries[9].y,180);
});
test('crowded corner/central houses display a safe bounded stack and explicit overflow',()=>{
 const all=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
 for(let house=1;house<=12;house++){
  const layout=layoutHouses(all.map(g=>planet(g,house)))[house-1];
  const end=layout.top+17+layout.numberOfRows*layout.lineHeight;
  assert.ok(layout.top>=12&&end<=350,'stack is inside SVG '+house);
  assert.equal(layout.shown.length,layout.kind==='corner'?3:6);
  assert.equal(layout.hidden,9-layout.shown.length);
  assert.equal(layout.shown.length+layout.hidden,9);
  assert.ok(layout.x-34>0&&layout.x+38<360,'glyph and degree stay within frame '+house);
 }
});
test('sign and graha glyphs are independent of Ukrainian/English text length',()=>{
 assert.equal(SIGN_GLYPHS.length,12);
 assert.ok(SIGN_GLYPHS.every(g=>g.endsWith('\uFE0E')));
 for(const name of ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']){
  assert.ok(PLANET_GLYPHS[name]?.endsWith('\uFE0E'));
 }
});
