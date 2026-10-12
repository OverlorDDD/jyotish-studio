import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../apps/web/public/demo.js',import.meta.url),'utf8');
const start=source.indexOf('const xml =');
const end=source.indexOf('\nfunction render()',start);
assert.ok(start>0&&end>start,'Locate actual standalone chart renderer');
const ukSigns=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const ukGrahas={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету',Ascendant:'Лагна'};
function renderFixture({language='uk',planets,lagna}){
 const globals={language,chartType:'d1',tr:k=>k,ukSigns,enSigns:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],grahaName:n=>language==='uk'?ukGrahas[n]||n:n,sign:s=>(language==='uk'?ukSigns:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'])[s-1]};
 const renderer=vm.runInNewContext(source.slice(start,end)+'\n({svgChart,houseIndex})',globals);
 return {svg:renderer.svgChart(planets,lagna),index:renderer.houseIndex(planets,lagna)};
}
const lagna={name:'Ascendant',house:1,sign:1};
const items=[{name:'Mercury',house:1,sign:1},{name:'Jupiter',house:1,sign:1},{name:'Saturn',house:1,sign:1},{name:'Moon',house:1,sign:1}];
test('Ukrainian SVG displays full names and never loses conjunctions',()=>{
 const {svg,index}=renderFixture({planets:[lagna,...items],lagna});
 assert.match(svg,/Лагна/);
 assert.match(svg,/Меркурій/);
 assert.match(svg,/ще 2/);
 for(const full of ['Лагна','Меркурій','Юпітер','Сатурн','Місяць'])assert.ok(index.includes(full),full);
 assert.match(svg,/Овен/);
 assert.doesNotMatch(svg,/>Юп<|>Ме<|>Са</);
});
test('English SVG uses full signs and planet names',()=>{
 const {svg,index}=renderFixture({language:'en',planets:[lagna,{name:'Venus',house:2,sign:2}],lagna});
 assert.match(svg,/Aries/);assert.match(svg,/Venus/);assert.match(index,/Taurus/);
});

test('all 12 house labels are geometrically centered, and stacks grow symmetrically',()=>{
 const sample=renderFixture({language:'en',planets:[lagna,{name:'Jupiter',house:2,sign:2},{name:'Saturn',house:2,sign:2},{name:'Mercury',house:2,sign:2}],lagna}).svg;
 const expected=[[180,90],[90,30],[30,90],[90,180],[30,270],[90,330],[180,270],[270,330],[330,270],[270,180],[330,90],[270,30]];
 for(let house=1;house<=12;house++){
  const [x,y]=expected[house-1];
  const body=sample.match(new RegExp(`<g class="vedic-house" data-house="${house}">([\\s\\S]*?)<\/g>`));
  assert.ok(body,`House ${house} exists`);
  const texts=[...body[1].matchAll(/<text x="(\d+)" y="(\d+)"/g)].map(m=>({x:Number(m[1]),y:Number(m[2])}));
  assert.ok(texts.length,`House ${house} has a label`);
  assert.ok(texts.every(t=>t.x===x),`House ${house} center x=${x}`);
  assert.ok(Math.abs((texts[0].y+texts[texts.length-1].y)/2-y)<=4,`House ${house} y centered around ${y}`);
 }
 assert.match(sample,/\+1 below/); // Third planet in a triangular house has an index fallback.
});
