import {test,expect} from '@playwright/test';

const topics=[
 {path:'astrology/jyotish',qa:'r33-jyotish-guide',uk:'Як побудувати й прочитати ведичну натальну карту',en:'How to calculate and understand a Vedic birth chart'},
 {path:'panchanga',qa:'r33-panchanga-guide',uk:'Панчанга: як читати ведичний календар для свого міста',en:'How to read Panchanga for your city'}
];

for(const locale of ['uk','en']){
 for(const topic of topics){
  test('R3.3 '+locale+' '+topic.path+' is SSR-readable, localized and links to actual lessons',async({page,request})=>{
   const url='/'+locale+'/'+topic.path;
   const response=await request.get(url);
   expect(response.status()).toBe(200);
   const html=await response.text();
   expect(html).toContain(locale==='uk'?topic.uk:topic.en);
   expect(html).toContain('data-testid="'+topic.qa+'"');
   await page.goto(url);
   const section=page.getByTestId(topic.qa);
   await expect(section).toBeVisible();
   await expect(section.locator('h2')).toContainText(locale==='uk'?topic.uk:topic.en);
   await expect(section.locator('h3')).toHaveCount(4);
   await expect(section.locator('a[href^="/'+locale+'/learn/"]')).toHaveCount(2);
   await expect(section.locator('a[href="/'+locale+'/methodology"]')).toHaveCount(1);
   // Next 15 streams some metadata into the HTTP body for browsers.
   // Inspect the full original response, not only the hydrated DOM <head>.
   const canonicalLinks=[...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/g)].map(x=>x[0]);
   expect(canonicalLinks.some(tag=>tag.includes('href="https://galaxiora.example'+url+'"'))).toBe(true);
   expect(html).not.toMatch(/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i);
  });
 }
}
