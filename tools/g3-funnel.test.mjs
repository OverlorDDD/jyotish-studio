import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 safeGrowthPath,safeGrowthEvent,safeGrowthToolForPath,safePublicToolEvent,
 safePublicTool,reportPublicToolEvent
} from '../apps/web/lib/growth-metrics.ts';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('G3 public tool route attribution is exact and privacy-safe',()=>{
 for(const [path,tool] of [
  ['/en/astrology/jyotish','jyotish'],['/uk/astrology/jyotish','jyotish'],
  ['/en/panchanga','panchanga'],['/uk/panchanga','panchanga'],
  ['/en/tarot','tarot'],['/uk/tarot','tarot']
 ]){assert.equal(safeGrowthToolForPath(path),tool);assert.ok(safeGrowthPath(path));}
 for(const path of [
  '/en/tarot/cards/moon','/en/astrology/jyotish/private',
  '/en/account','/en/personal','/uk/admin','/en/community/topic/123',
  '/en/tarot?question=private','/en/panchanga?city=somewhere',
  '/api/v1/charts/calculate','/en/horoscope/aries'
 ])assert.equal(safeGrowthToolForPath(path),null,path);
});

test('SEO-1 + G3.0 measures public GalaxiPedia paths only by anonymous section',()=>{
 for(const [path,expected] of [
  ['/en/pedia','/en/pedia'],['/uk/pedia','/uk/pedia'],
  ['/en/pedia/glossary','/en/pedia/glossary'],
  ['/en/pedia/what-is-tithi-lunar-day','/en/pedia'],
  ['/uk/pedia/topic/panchanga','/uk/pedia']
 ])assert.equal(safeGrowthPath(path),expected,path);
 for(const path of [
  '/en/pedia?birth=1988-01-01','/uk/pedia/secret%3Fquestion',
  '/en/pedia/author/name','/en/pedia/topic/../admin','/en/personal'
 ])assert.equal(safeGrowthPath(path),null,path);
 assert.equal(safeGrowthToolForPath('/en/pedia'),null);
 const consent=source('apps/web/app/components/GrowthConsent.tsx');
 assert.match(consent,/const fromArticle=.*pedia/);
 assert.match(consent,/whether tools were started or completed/);
 assert.match(consent,/тільки його назву та мову/);
});

test('G3 funnel taxonomy accepts only specific coarse tool names and event names',()=>{
 for(const tool of ['jyotish','tarot','panchanga'])assert.equal(safePublicTool(tool),true);
 for(const tool of ['account','natal-report','tarotQuestion',''])assert.equal(safePublicTool(tool),false);
 for(const name of ['public_tool_started','public_tool_completed','public_tool_failed','public_tool_auth_required']){
  assert.equal(safePublicToolEvent(name),true);assert.equal(safeGrowthEvent(name),true);
 }
 for(const name of ['birth_data_submitted','public_tool_viewed_with_date','public_tool_personalized','email']){
  assert.equal(safePublicToolEvent(name),false);
 }
});

test('G3 event dispatcher cannot take or emit arbitrary birth or question properties',()=>{
 const beforeWindow=globalThis.window;
 const beforeCustomEvent=globalThis.CustomEvent;
 const emitted=[];
 try{
  globalThis.window={dispatchEvent:e=>{emitted.push(e);return true;}};
  globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init.detail;}};
  reportPublicToolEvent('public_tool_started','jyotish');
  reportPublicToolEvent('public_tool_completed','panchanga');
  reportPublicToolEvent('public_tool_failed','tarot');
  reportPublicToolEvent('public_tool_auth_required','tarot');
  reportPublicToolEvent('public_tool_started','private-chart');
  reportPublicToolEvent('anything','jyotish');
  assert.equal(emitted.length,4);
  assert.deepEqual(emitted.map(e=>e.detail),[
   {name:'public_tool_started',tool:'jyotish'},
   {name:'public_tool_completed',tool:'panchanga'},
   {name:'public_tool_failed',tool:'tarot'},
   {name:'public_tool_auth_required',tool:'tarot'}
  ]);
  for(const e of emitted){
   assert.equal(e.type,'galaxiora:growth');
   assert.deepEqual(Object.keys(e.detail).sort(),['name','tool']);
  }
 }finally{
  if(beforeWindow===undefined)delete globalThis.window;else globalThis.window=beforeWindow;
  if(beforeCustomEvent===undefined)delete globalThis.CustomEvent;else globalThis.CustomEvent=beforeCustomEvent;
 }
});

test('G3 consented collection validates actual tool route, never sends whole detail object',()=>{
 const code=source('apps/web/app/components/GrowthConsent.tsx');
 assert.match(code,/choice!=='accepted'/);
 assert.match(code,/safeGrowthToolForPath\(window\.location\.pathname\)/);
 assert.match(code,/detail\.tool!==currentTool/);
 assert.match(code,/public_tool_viewed/);
 assert.match(code,/window\.gtag\?\.\('event',name,\{tool:currentTool,/);
 assert.doesNotMatch(code,/window\.gtag\?\.\('event',name,detail/);
 assert.match(code,/send_page_view:false/);
 assert.match(code,/page_location:'https:\/\/galaxiora\.com'\+safe/);
});

test('G3 Jyotish and Tarot send completion only after verified live responses',()=>{
 const chart=source('apps/web/app/astrology/jyotish/page.tsx');
 const tarot=source('apps/web/app/components/TarotStudio.tsx');
 assert.match(chart,/if\(!verified\(data\)\)throw Error/);
 assert.ok(chart.indexOf("reportPublicToolEvent('public_tool_completed','jyotish')")>chart.indexOf('if(!verified(data))'));
 assert.match(chart,/reportPublicToolEvent\('public_tool_started','jyotish'\)/);
 assert.match(chart,/reportPublicToolEvent\('public_tool_failed','jyotish'\)/);
 assert.match(tarot,/if\(response\.status===401\)reportPublicToolEvent\('public_tool_auth_required','tarot'\)/);
 assert.ok(tarot.indexOf("reportPublicToolEvent('public_tool_completed','tarot')")>tarot.indexOf('const r=await readApiJson<DrawReply>'));
 assert.match(tarot,/reportPublicToolEvent\('public_tool_started','tarot'\)/);
 assert.match(tarot,/reportPublicToolEvent\('public_tool_failed','tarot'\)/);
});

test('G3 Panchanga counts auto-load separately from confirmed user actions',()=>{
 const p=source('apps/web/app/components/PanchangaHub.tsx');
 assert.match(p,/const manualDayRequest=useRef\(false\)/);
 assert.match(p,/const explicit=manualDayRequest\.current/);
 assert.match(p,/manualDayRequest\.current=false/);
 assert.match(p,/if\(explicit\)reportPublicToolEvent\('public_tool_started','panchanga'\)/);
 assert.match(p,/if\(explicit\)reportPublicToolEvent\('public_tool_completed','panchanga'\)/);
 assert.match(p,/if\(explicit\)reportPublicToolEvent\('public_tool_failed','panchanga'\)/);
 assert.match(p,/reportGrowthEvent\('panchanga_calculation_completed'\)/);
 assert.match(p,/if\(period==='day'&&view!=='day'\)manualDayRequest\.current=true/);
});
