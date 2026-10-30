import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
if(process.argv.includes('--help')){
 console.log('npm run news:verify-ui: check the actual GalaxiNews page in a new browser context.');
 process.exit(0);
}
let browser;
try{browser=await chromium.launch({channel:'chrome',headless:true});}
catch{
 try{browser=await chromium.launch({headless:true});}
 catch{console.error('Chrome/Chromium unavailable. Run: npx playwright install chromium');process.exit(2);}
}
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
let stage='opening GalaxiNews';
try{
 const response=await page.goto('http://127.0.0.1:3000/uk/news?check=v1.8',{waitUntil:'domcontentloaded',timeout:30000});
 stage='waiting for GalaxiNews client view';
 await page.getByTestId('galaxinews-world').waitFor({state:'visible',timeout:15000});
 stage='checking public feed API';
 const apiResponse=await page.request.get('http://127.0.0.1:3000/api/v1/news/feed?limit=12',{timeout:15000});
 if(!apiResponse.ok())throw Error('Feed API HTTP '+apiResponse.status());
 const apiFeed=await apiResponse.json();
 if(!Array.isArray(apiFeed.items))throw Error('Feed API did not return items');
 // Make sure the first fetch finishes BEFORE clicking the manual refresh or any tab.
 stage='waiting for React article counter';
 await page.waitForFunction(()=>/\d/.test(
  document.querySelector('[data-testid="news-article-count"]')?.textContent||''
 ),null,{timeout:15000});
 if(apiFeed.items.length){
  await page.waitForFunction(()=>document.querySelectorAll('[data-testid="galaxinews-world"] article').length>0,
   null,{timeout:15000});
 }
 await page.waitForTimeout(850); // catches the former 320ms state-erasing timer
 const initialArticles=await page.locator('[data-testid="galaxinews-world"] article').count();
 const initialStillVisible=!apiFeed.items.length||initialArticles>0;

 stage='testing Personal and World tab hydration';
 // Prove client hydration by triggering an actual React state transition.
 await page.getByRole('button',{name:/Для мене/}).click();
 await page.getByRole('heading',{name:'Для мене'}).waitFor({state:'visible',timeout:10000});
 await page.getByRole('button',{name:/Головне/}).click();
 await page.getByRole('heading',{name:'Головне'}).waitFor({state:'visible',timeout:10000});
 // Returning from Personal mode starts another async request. Do not claim PASS
 // while React is still showing the transient empty state.
 if(apiFeed.items.length){
  await page.waitForFunction(
   ()=>document.querySelectorAll('[data-testid="galaxinews-world"] article').length>0,
   null,{timeout:15000}
  );
 }
 // First-party artwork must be decoded, but offscreen remote photos are intentionally lazy.
 stage='checking all first-party artwork';
 if(apiFeed.items.length){
  await page.waitForFunction(()=>{
   const cards=[...document.querySelectorAll('[data-testid="galaxinews-world"] article')];
   return cards.length>0&&cards.every(card=>{
    const img=card.querySelector('img[data-image-role="fallback"]');
    return Boolean(img&&img.complete&&img.naturalWidth>0);
   });
  },null,{timeout:20000});
 }
 const result=await page.evaluate((initialArticles)=>{
  const root=document.querySelector('[data-testid="galaxinews-world"]');
  const input=document.querySelector('#galaxinews-search');
  const rectangle=input?.getBoundingClientRect();
  const tags=document.querySelector('[data-testid="news-all-interest-tags"]');
  return {
   revision:root?.getAttribute('data-release'),
   visibleSearch:Boolean(rectangle&&rectangle.width>100&&rectangle.height>20),
   searchWithinTabs:Boolean(input?.closest('[data-testid="news-tabs-search"]')),
   tagCount:tags?.querySelectorAll('button').length,
   articleCounter:document.querySelector('[data-testid="news-article-count"]')?.textContent?.trim(),
   articleCards:document.querySelectorAll('[data-testid="galaxinews-world"] article').length,
   validArtwork:[...document.querySelectorAll('[data-testid="galaxinews-world"] article img[data-image-role="fallback"]')].filter(
    img=>img.complete&&img.naturalWidth>0).length,
   loadedPhotos:[...document.querySelectorAll('[data-testid="galaxinews-world"] article img[data-image-role="licensed-photo"]')].filter(
    img=>img.complete&&img.naturalWidth>0).length,
   initiallyLoaded:initialArticles,
   obsoleteText:document.body.innerText.includes('Перевірка джерел приблизно кожні 15 хвилин')||
    document.body.innerText.includes('Астрономічні матеріали не змішуються')
  };
 },initialArticles);
 const pass=response?.ok()&&result.revision==='world-v1.8'&&result.visibleSearch&&result.searchWithinTabs
   &&result.tagCount===12&&!result.obsoleteText&&Boolean(result.articleCounter)
   &&/\d/.test(result.articleCounter)&&initialStillVisible
   &&(!apiFeed.items.length||(result.articleCards>0&&result.validArtwork>=result.articleCards));
 const imagePath=resolve('apps/web/.next/diagnostics/galaxinews-v1.8.png');
 mkdirSync(dirname(imagePath),{recursive:true});
 await page.screenshot({path:imagePath,fullPage:false});
 console.log('[GalaxiNews] Feed API items:',apiFeed.items.length,'initial cards after debounce:',initialArticles);
 console.log('[GalaxiNews] browser verification:',pass?'PASS':'FAIL',result);
 console.log('[GalaxiNews] screenshot:',imagePath);
 if(!pass)process.exitCode=1;
}catch(e){
 console.error('GalaxiNews browser check failed at:',stage,':',String(e));
 try{
  const diagnostic=await page.evaluate(()=>({
   count:document.querySelector('[data-testid="news-article-count"]')?.textContent?.trim(),
   articles:document.querySelectorAll('[data-testid="galaxinews-world"] article').length,
   decodedFallbacks:[...document.querySelectorAll('[data-image-role="fallback"]')].filter(img=>img.complete&&img.naturalWidth>0).length
  }));
  console.error('[GalaxiNews] browser diagnostic:',diagnostic);
  const imagePath=resolve('apps/web/.next/diagnostics/galaxinews-v1.8-failed.png');
  mkdirSync(dirname(imagePath),{recursive:true});
  await page.screenshot({path:imagePath,timeout:10000});
  console.error('[GalaxiNews] failure screenshot:',imagePath);
 }catch(screenError){console.error('[GalaxiNews] screenshot unavailable:',String(screenError));}
 process.exitCode=1;
}
finally{await context.close();await browser.close();}
