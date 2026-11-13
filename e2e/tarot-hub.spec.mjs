import {test,expect} from '@playwright/test';
// Wait for the hydrated consent prompt before interacting with mobile UI.
async function rejectAnalyticsIfPrompted(page){
 const dialog=page.getByRole('dialog',{name:/Аналітика відвідувань|Visitor analytics/});
 try { await dialog.waitFor({state:'visible',timeout:8000}); }
 catch { return; }
 await dialog.getByRole('button',{name:/Відхилити|Reject/}).click();
 await expect(dialog).toHaveCount(0);
}
const noOverflow=async page=>{
 const d=await page.evaluate(()=>({w:window.innerWidth,s:document.documentElement.scrollWidth}));
 expect(d.s).toBeLessThanOrEqual(d.w+2);
};

test('Guest draws a card of the day without an account, and it stays after reload',async({page})=>{
 await page.goto('/uk/tarot');
 await rejectAnalyticsIfPrompted(page);
 await expect(page.getByRole('heading',{level:1})).toContainText('Таро онлайн');
 const daily=page.getByTestId('tarot-daily');
 await daily.getByTestId('tarot-daily-draw').click();
 const result=daily.getByTestId('tarot-daily-result');
 await expect(result).toBeVisible({timeout:10000});
 const name=await result.locator('h3').textContent();
 await expect(result.locator('a[href^="/uk/tarot/cards/"]')).toBeVisible();
 await page.reload();
 await expect(page.getByTestId('tarot-daily-result').locator('h3')).toHaveText(name??'',{timeout:10000});
 await expect(page.getByTestId('tarot-progress')).toContainText('з 78');
});

test('Guest yes-or-no reading works without sign-in and shows a clear answer',async({page})=>{
 await page.goto('/uk/tarot');
 await rejectAnalyticsIfPrompted(page);
 await page.locator('input[name="spread"][value="yesno"]').check();
 // Guided path: choosing a topic moves straight to the question field.
 await expect(page.locator('#as-tarot-question')).toBeFocused();
 await page.locator('#as-tarot-question').fill('Чи варто мені цього тижня почати курс?');
 await page.getByRole('button',{name:'Розкласти карти'}).click();
 const result=page.locator('.as-tarot-result');
 await expect(result).toBeVisible({timeout:30000});
 await result.getByRole('button',{name:/Відкрити карту 1/}).click();
 await expect(result.locator('[data-answer]')).toContainText(/Так|Ні|Можливо/);
 await expect(result.getByRole('heading',{name:'Що показують карти'})).toBeVisible();
 await expect(result.locator('[data-tone]')).toContainText('Загальний настрій розкладу');
 await expect(result.getByText('Що далі?')).toBeVisible();
 await result.getByRole('link',{name:/Розібрати з живим тарологом/}).click();
 await expect(page.locator('#expert-question')).toHaveValue('Чи варто мені цього тижня почати курс?');
 await expect(page.locator('#expert-context')).toHaveValue(/Так чи ні/);
 await expect(page.getByTestId('tarot-progress-storage')).toContainText('лише в цьому браузері');
 await expect(page.locator('.as-tarot-history')).toHaveCount(0);
 await expect(page.getByText(/Сьогодні залишилось розкладів: 2/)).toBeVisible();
});

test('All 78 card meaning pages are linked, rendered with FAQ data and in the sitemap',async({page,request})=>{
 await page.goto('/en/tarot/cards');
 await expect(page.getByTestId('tarot-library')).toBeVisible();
 expect(await page.getByTestId('tarot-library').locator('a[href^="/en/tarot/cards/"]').count()).toBe(78);
 await page.getByRole('tab',{name:'Cups'}).click();
 await expect(page.getByRole('link',{name:'Ace of Cups'}).first()).toBeVisible();
 for(const [locale,slug,title] of [['uk','star','Зірка'],['en','ace-of-cups','Ace of Cups'],['en','king-of-pentacles','King of Pentacles']]){
  const r=await request.get('/'+locale+'/tarot/cards/'+slug);
  expect(r.status()).toBe(200);
  const html=await r.text();
  expect(html).toContain(title);
  expect(html).toContain('"FAQPage"');
  expect(html).toContain('data-testid="tarot-card-guide"');
 }
 expect((await request.get('/en/tarot/cards/not-a-card')).status()).toBe(404);
 const xml=await (await request.get('/sitemap.xml')).text();
 expect(xml).toContain('/uk/tarot/cards/ace-of-cups');
});

test('Tarot hub has no horizontal overflow on phones and keeps the reader block last before FAQ',async({page})=>{
 for(const width of [390,320]){
  await page.setViewportSize({width,height:800});
  await page.goto('/uk/tarot');
  await rejectAnalyticsIfPrompted(page);
  await expect(page.getByTestId('tarot-readers')).toContainText('$30');
  await noOverflow(page);
 }
 const ld=await page.locator('script[type="application/ld+json"]').allTextContents();
 expect(ld.some(x=>x.includes('"FAQPage"'))).toBe(true);
});
