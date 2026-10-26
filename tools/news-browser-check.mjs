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
try{
 const response=await page.goto('http://127.0.0.1:3000/uk/news?check=v1.7',{waitUntil:'domcontentloaded',timeout:30000});
 await page.getByTestId('galaxinews-world').waitFor({state:'visible',timeout:15000});
 const apiResponse=await page.request.get('http://127.0.0.1:3000/api/v1/news/feed?limit=12',{timeout:15000});
 if(!apiResponse.ok())throw Error('Feed API HTTP '+apiResponse.status());
 const apiFeed=await apiResponse.json();
 if(!Array.isArray(apiFeed.items))throw Error('Feed API did not return items');
 // Make sure the first fetch finishes BEFORE clicking the manual refresh or any tab.
 await page.waitForFunction(()=>/\\d/.test(
  document.querySelector('[data-testid="news-article-count"]')?.textContent||''
 ),{timeout:15000});
 if(apiFeed.items.length){
  await page.waitForFunction(()=>document.querySelectorAll('[data-testid="galaxinews-world"] article').length>0,
   {timeout:15000});
 }
 await page.waitForTimeout(850); // catches the former 320ms state-erasing timer
 const initialArticles=await page.locator('[data-testid="galaxinews-world"] article').count();
 const initialStillVisible=!apiFeed.items.length||initialArticles>0;

 // Prove client hydration by triggering an actual React state transition.
 await page.getByRole('button',{name:/Для мене/}).click();
 await page.getByRole('heading',{name:'Для мене'}).waitFor({state:'visible',timeout:10000});
 await page.getByRole('button',{name:/Головне/}).click();
 await page.getByRole('heading',{name:'Головне'}).waitFor({state:'visible',timeout:10000});
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
   initiallyLoaded:initialArticles,
   obsoleteText:document.body.innerText.includes('Перевірка джерел приблизно кожні 15 хвилин')||
    document.body.innerText.includes('Астрономічні матеріали не змішуються')
  };
 },initialArticles);
 const pass=response?.ok()&&result.revision==='world-v1.7'&&result.visibleSearch&&result.searchWithinTabs
   &&result.tagCount===12&&!result.obsoleteText&&Boolean(result.articleCounter)
   &&/\d/.test(result.articleCounter)&&initialStillVisible;
 const imagePath=resolve('apps/web/.next/diagnostics/galaxinews-v1.7.png');
 mkdirSync(dirname(imagePath),{recursive:true});
 await page.screenshot({path:imagePath,fullPage:false});
 console.log('[GalaxiNews] Feed API items:',apiFeed.items.length,'initial cards after debounce:',initialArticles);
 console.log('[GalaxiNews] browser verification:',pass?'PASS':'FAIL',result);
 console.log('[GalaxiNews] screenshot:',imagePath);
 if(!pass)process.exitCode=1;
}catch(e){console.error('GalaxiNews browser check failed:',String(e));process.exitCode=1;}
finally{await context.close();await browser.close();}
