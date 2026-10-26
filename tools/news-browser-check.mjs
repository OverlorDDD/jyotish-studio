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
 const response=await page.goto('http://127.0.0.1:3000/uk/news?check=v1.6',{waitUntil:'domcontentloaded',timeout:30000});
 await page.getByTestId('galaxinews-world').waitFor({state:'visible',timeout:15000});
 // Prove client hydration by triggering an actual React state transition.
 await page.getByRole('button',{name:/Для мене/}).click();
 await page.getByRole('heading',{name:'Для мене'}).waitFor({state:'visible',timeout:10000});
 await page.getByRole('button',{name:/Головне/}).click();
 await page.getByRole('heading',{name:'Головне'}).waitFor({state:'visible',timeout:10000});
 const result=await page.evaluate(()=>{
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
   obsoleteText:document.body.innerText.includes('Перевірка джерел приблизно кожні 15 хвилин')||
    document.body.innerText.includes('Астрономічні матеріали не змішуються')
  };
 });
 const pass=response?.ok()&&result.revision==='world-v1.6'&&result.visibleSearch&&result.searchWithinTabs
   &&result.tagCount===12&&!result.obsoleteText&&Boolean(result.articleCounter);
 const imagePath=resolve('apps/web/.next/diagnostics/galaxinews-v1.6.png');
 mkdirSync(dirname(imagePath),{recursive:true});
 await page.screenshot({path:imagePath,fullPage:false});
 console.log('[GalaxiNews] browser verification:',pass?'PASS':'FAIL',result);
 console.log('[GalaxiNews] screenshot:',imagePath);
 if(!pass)process.exitCode=1;
}catch(e){console.error('GalaxiNews browser check failed:',String(e));process.exitCode=1;}
finally{await context.close();await browser.close();}
