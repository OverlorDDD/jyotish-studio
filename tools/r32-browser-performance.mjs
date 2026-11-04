/** R3.2 synthetic browser health. Captures NOT equivalent to CrUX field Core Web Vitals.
 * Run after the site is started, using a test browser with chromium installed.
 * No API mutations or credentials. Usage: node tools/r32-browser-performance.mjs
 */
import {chromium} from '@playwright/test';
const origin=(process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const routes=['/uk','/en','/uk/about','/uk/astrology/jyotish',
 '/en/astrology/jyotish','/uk/horoscope','/uk/panchanga','/en/panchanga',
 '/uk/news','/uk/community','/uk/tarot','/en/tarot',
 ...(process.env.SEO1_G30_REQUIRE_PEDIA==='1'?['/en/pedia','/uk/pedia']:[])];
const outputs=[];
const browser=await chromium.launch({headless:true});
try{
 for(const device of [{name:'desktop',viewport:{width:1365,height:900}},
  {name:'mobile-small',viewport:{width:360,height:800}},
  {name:'mobile',viewport:{width:390,height:844}}]){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.name==='mobile'});
  for(const route of routes){
   const page=await context.newPage();
   await page.addInitScript(()=>{
    window.__seoMetrics={lcp:null,cls:0};
    try{
     new PerformanceObserver(list=>{
      for(const entry of list.getEntries())window.__seoMetrics.lcp=entry.startTime;
     }).observe({type:'largest-contentful-paint',buffered:true});
     new PerformanceObserver(list=>{
      for(const entry of list.getEntries())
       if(!entry.hadRecentInput)window.__seoMetrics.cls+=entry.value;
     }).observe({type:'layout-shift',buffered:true});
    }catch{}
   });
   try{
    const response=await page.goto(origin+route,{waitUntil:'load',timeout:30000});
    await page.waitForTimeout(400);
    const data=await page.evaluate(()=>{
     const n=performance.getEntriesByType('navigation')[0];
     return {loadMs:n?.loadEventEnd??null,domContentLoadedMs:n?.domContentLoadedEventEnd??null,
      lcpMs:window.__seoMetrics?.lcp??null,cls:window.__seoMetrics?.cls??null,
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:document.documentElement.clientWidth};
    });
    outputs.push({device:device.name,route,http:response?.status(),...data});
   }catch(err){outputs.push({device:device.name,route,error:String(err?.message||err)});}
   finally{await page.close();}
  }
  await context.close();
 }
}finally{await browser.close();}
for(const row of outputs)console.log(JSON.stringify(row));
console.log('R3.2 synthetic browser measurements: '+outputs.length+' page/device samples');
console.log('LCP and CLS are laboratory browser observations; INP requires actual visitor interaction data. Never label these CrUX pass/fail.');
