import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveCityAlias,mergeAliasResults} from '../apps/api/src/city-search-aliases.ts';
import {SavedChartUseCases} from '../apps/api/src/chart-application.ts';

const uk={id:'703845',name:'Kryvyi Rih',country:'Ukraine',region:'Dnipropetrovsk Oblast',
 latitude:47.90572,longitude:33.39404,timeZone:'Europe/Kyiv'};
const ru={id:'818639',name:'Krivoy Rog',country:'Russia',region:'Oryol oblast',
 latitude:52.71861,longitude:35.34083,timeZone:'Europe/Moscow'};
const east={id:'11269924',name:'Krivoy Rog East',country:'Ukraine',region:'Dnipropetrovsk Oblast',
 latitude:47.88861,longitude:33.5375,timeZone:'Europe/Kyiv'};

test('N503 legacy aliases recover verified Ukrainian Kryvyi Rih, not a false Russian match',()=>{
 for(const name of ['Krivoy Rog','KRIVOY ROG',' Krivoi   Rog ','kriviy rog','Kryvyi Rig','Кривой Рог']){
  assert.deepEqual(resolveCityAlias(name),{canonical:'Kryvyi Rih',geoNamesId:'703845'},name);
 }
 for(const name of ['London','Mumbai','Kyiv','Kremenchuk','Krivoy Rog East','Kryvyi Rih']){
  assert.equal(resolveCityAlias(name),null,name);
 }
 const matches=mergeAliasResults([ru,east],[uk,east],resolveCityAlias('Krivoy Rog'));
 assert.equal(matches[0].id,'703845');
 assert.equal(matches[0].timeZone,'Europe/Kyiv');
 assert.equal(matches[0].latitude,47.90572);
 assert.equal(matches[0].longitude,33.39404);
 assert.equal(matches[1].id,'818639','do not silently erase another exact-name town');
 assert.equal(new Set(matches.map(x=>x.id)).size,matches.length);
});
test('N503 no fabricated coordinates or incorrect canonical result when upstream record is missing',()=>{
 const alias=resolveCityAlias('Krivoy Rog');
 assert.deepEqual(mergeAliasResults([ru],[east],alias),[ru]);
 assert.deepEqual(mergeAliasResults([uk,ru],[uk],alias),[uk,ru]);
 const input=[uk,ru];
 assert.deepEqual(mergeAliasResults(input,[],null),input,'all other city search unaffected');
});

test('N503 saved-chart input is passed without dropping latitude/longitude/timeZone',async()=>{
 const birth={date:'2000-01-01',time:'12:00',timeZone:'Europe/Kyiv',place:'Kryvyi Rih, Ukraine',
  latitude:47.90572,longitude:33.39404};
 let captured=null;
 const store={
  count:async()=>0,
  create:async(_owner,chart,report)=>{captured={chart,report};return {id:'sample',createdAt:new Date('2026-11-10')}}
 };
 const calculate=async input=>({input:{date:input.date,time:input.time,timeZone:input.timeZone,
  latitude:input.latitude,longitude:input.longitude,place:input.place},verification:{status:'verified_internal'}});
 const usecases=new SavedChartUseCases(store,calculate,()=>({editorial:{chapters:[]}}));
 await usecases.save('test-owner',birth);
 assert.deepEqual(captured.chart.input,birth);
 assert.equal(captured.chart.input.longitude,33.39404);
 assert.equal(captured.report.readerVersion,'6.0.0');
});

test('N503 real persistence and calculation code require original coordinates',()=>{
 const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const prisma=read('../apps/api/src/chart-prisma.ts');
 const app=read('../apps/api/src/logic.ts');
 const ephemeris=read('../apps/api/src/ephemeris.ts');
 const client=read('../apps/web/app/astrology/jyotish/page.tsx');
 const controller=read('../apps/api/src/panchanga-places-controller.ts');
 assert.match(prisma,/input:JSON\.parse\(JSON\.stringify\(chart\.input\)\)/);
 assert.match(prisma,/result:JSON\.parse\(JSON\.stringify\(chart\)\)/);
 assert.match(app,/latitude:b\.latitude,longitude:b\.longitude/);
 assert.match(ephemeris,/calculateHouses\(jd,input\.latitude,input\.longitude/);
 assert.match(ephemeris,/input:\s*JSON\.stringify\(\{utc,latitude:input\.latitude,longitude:input\.longitude\}\)/);
 assert.match(client,/data-testid="n503-birthplace-coordinates"/);
 assert.match(client,/data-testid="n503-birthplace-name"/);
 assert.match(client,/setForm\(\{\.\.\.incoming\.input,latitude:String\(incoming\.input\.latitude\),longitude:String\(incoming\.input\.longitude\)\}\)/);
 assert.match(controller,/Promise\.allSettled/);
 assert.match(controller,/mergeAliasResults\(original,canonical,alias\)/);
});
