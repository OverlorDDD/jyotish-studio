import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../apps/web/public/demo.js',import.meta.url),'utf8');
const demoCss=readFileSync(new URL('../apps/web/public/demo.css',import.meta.url),'utf8');
const appCss=readFileSync(new URL('../apps/web/app/globals.css',import.meta.url),'utf8');
const appPage=readFileSync(new URL('../apps/web/app/astrology/jyotish/page.tsx',import.meta.url),'utf8');
const geometricChart=readFileSync(new URL('../apps/web/app/components/NorthIndianChart.tsx',import.meta.url),'utf8');
const report=readFileSync(new URL('../apps/web/app/components/DetailedReport.tsx',import.meta.url),'utf8');
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
 const expected=[[180,90],[90,40],[45,90],[90,180],[45,270],[90,315],[180,270],[270,315],[315,270],[270,180],[315,90],[270,40]];
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

 const crowded=renderFixture({language:'uk',planets:[
  lagna,
  {name:'Mercury',house:6,sign:6},{name:'Jupiter',house:6,sign:6},
  {name:'Saturn',house:6,sign:6},{name:'Venus',house:6,sign:6},
  {name:'Mars',house:8,sign:8},{name:'Moon',house:8,sign:8},
  {name:'Rahu',house:8,sign:8},{name:'Ketu',house:8,sign:8}
 ],lagna}).svg;
 const tags=[...crowded.matchAll(/<text x="(\d+)" y="(\d+)"([^>]*)>([\s\S]*?)<\/text>/g)];
 assert.ok(tags.length>=18);
 for(const [,rawX,rawY,attrs,rawText] of tags){
  const x=Number(rawX),y=Number(rawY),font=Number(attrs.match(/font-size="([\d.]+)"/)?.[1]||10);
  assert.ok(y>=10&&y<=350,'Text baseline stays inside frame: '+y);
  if(x<=50||x>=310){
   const maxWidth=76,explicit=Number(attrs.match(/textLength="([\d.]+)"/)?.[1]||0);
   const estimate=rawText.replace(/<[^>]+>/g,'').length*font*0.58;
   assert.ok((explicit||estimate)<=maxWidth+1,'Edge label fits inside house: '+rawText);
  }
 }

});

test('both web interfaces wrap the Ukrainian brand tag and constrain chart text',()=>{
 for(const css of [demoCss,appCss]){
  assert.ok(css.includes('.logo{white-space:normal;min-width:0;align-items:flex-start}'),'Logo may not wrap');
  assert.ok(css.includes('.logo small{white-space:normal;'),'Brand tag may overflow');
  assert.ok(css.includes('.chart-svg{overflow:hidden}'),'SVG overflow must be clipped as a safety net');
 }
 assert.match(appPage,/NorthIndianChart planets=\{chart\.d1\}/);
 assert.match(appPage,/NorthIndianChart planets=\{placements\}/);
 assert.doesNotMatch(appPage,/function Wheel\(/);
 assert.match(geometricChart,/className="jy-south-chart"/);
 assert.match(geometricChart,/SOUTH_SIGN_GRID\.map/);
 assert.match(geometricChart,/jy-south-planet/);
 assert.match(geometricChart,/chartHouseForSign/);
 assert.match(geometricChart,/jy-south-ascendant/);
 assert.match(appCss,/\.jy-south-chart\{display:grid/);
 assert.match(report,/className="reading-principles"/);
 assert.match(report,/className="reading-principle-number"/);
 assert.doesNotMatch(report,/className="reading-editorial-highlights"/);
 assert.match(appCss,/\.reading-principle\{display:grid;grid-template-columns:38px minmax\(0,1fr\)/);
 assert.match(appCss,/\.reading-editorial-chapter\{margin:0!important;/);
});
