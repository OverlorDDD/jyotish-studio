import {test,expect} from '@playwright/test';
test('public Jyotish horoscope navigation and 12 lunar signs with sources, plus private chart gating',async({page})=>{
 test.setTimeout(105000);
 const response=await page.request.get('/api/v1/horoscope/today');
 expect(response.status()).toBe(200);
 const result=await response.json();
 expect(result.reference).toBe('SIDEREAL_MOON_SIGN');
 expect(result.notAPersonalChart).toBe(true);
 expect(result.signs).toHaveLength(12);
 expect(new Set(result.signs.map(x=>x.house)).size).toBe(12);
 expect(result.signs.every(x=>x.evidence.kind==='PUBLIC_JANMA_RASHI_REFERENCE')).toBe(true);
 const weekResponse=await page.request.get('/api/v1/horoscope/week');
 expect(weekResponse.status()).toBe(200);
 const weekly=await weekResponse.json();
 expect(weekly.reference).toBe('SIDEREAL_MOON_SIGN');
 expect(weekly.days).toHaveLength(7);
 expect(weekly.days.every(d=>d.signs.length===12&&d.sampledAtUtc)).toBe(true);
 for(let i=1;i<weekly.days.length;i++){
  const previous=weekly.days[i-1],current=weekly.days[i];
  for(let sign=0;sign<12;sign++){
   expect(current.signs[sign].description.uk).not.toEqual(previous.signs[sign].description.uk);
   expect(current.signs[sign].goodFor.uk).not.toEqual(previous.signs[sign].goodFor.uk);
   expect(current.signs[sign].caution.uk).not.toEqual(previous.signs[sign].caution.uk);
   expect(current.signs[sign].reflection.uk).not.toEqual(previous.signs[sign].reflection.uk);
  }
 }
 const favicon=await page.request.get('/icon.svg');
 expect(favicon.status()).toBe(200);
 expect(favicon.headers()['content-type']).toMatch(/image\/svg\+xml/);
 expect(await favicon.text()).toContain('Galaxiora');
 await page.goto('/uk/horoscope');
 await expect(page.getByRole('heading',{name:'Гороскопи'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Овен'})).toBeVisible();
 await page.getByRole('button',{name:'Риби'}).click();
 await expect(page.getByRole('button',{name:'Риби'})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('horoscope-reading')).toBeVisible();
 await page.getByText('Астрологічна основа прогнозу').click();
 await expect(page.getByTestId('horoscope-reading').getByText(/Swiss Ephemeris/)).toBeVisible();
 await page.getByRole('button',{name:'Цей тиждень'}).click();
 await expect(page.getByTestId('public-horoscope-week')).toBeVisible();
 await expect(page.getByTestId('public-horoscope-week').locator('article').first()).toBeVisible();
 await page.getByRole('button',{name:'Мій персональний'}).click();
 await expect(page.getByText('Для справді персонального трактування',{exact:false})).toBeVisible();
 await expect(page.getByRole('link',{name:/Перейти до «Мого Всесвіту»/})).toHaveAttribute('href','/uk/personal');
 await page.goto('/en/horoscope');
 await expect(page.getByRole('heading',{name:'Horoscopes'})).toBeVisible();
});
