import {test,expect} from '@playwright/test';

test('GalaxiPedia migration: all former Academy URLs 308 to locale-preserving pages',async({request})=>{
 for(const lang of ['en','uk']){
  const landing=await request.get('/'+lang+'/learn',{maxRedirects:0});
  expect(landing.status()).toBe(308);
  expect(landing.headers().location).toBe('/'+lang+'/pedia');
  const lesson=await request.get('/'+lang+'/learn/sidereal-and-tropical',{maxRedirects:0});
  expect(lesson.status()).toBe(308);
  expect(lesson.headers().location).toBe('/'+lang+'/pedia/sidereal-and-tropical');
  const canonical=await request.get('/'+lang+'/pedia');
  expect(canonical.status()).toBe(200);
 }
});

test('GalaxiPedia: static lessons + guides, category filters, text search and no duplicate header tab',async({page})=>{
 await page.goto('/en/pedia');
 await expect(page.getByRole('heading',{level:1})).toContainText('Explore the cosmos');
 await expect(page.locator('[data-lesson]')).toHaveCount(8);
 await expect(page.locator('a[href$="/pedia/panchanga-five-limbs-explained"]')).toBeVisible();
 const header=page.locator('.as-main-nav');
 await expect(header.getByRole('link',{name:'GalaxiPedia'})).toHaveCount(1);
 await page.getByRole('searchbox',{name:'Search GalaxiPedia'}).fill('Moon phases');
 await expect(page.getByRole('heading',{name:'Moon Phases, Lunar Months and What You Can Observe'})).toBeVisible();
 await expect(page.locator('[data-lesson]')).toHaveCount(0);
 await page.getByRole('searchbox',{name:'Search GalaxiPedia'}).fill('');
 await page.getByRole('button',{name:'Panchanga & Vedic Calendar'}).click();
 await expect(page.getByRole('heading',{name:'The Five Parts of Panchanga: Tithi, Vara, Nakshatra, Yoga and Karana'})).toBeVisible();
 await page.getByRole('button',{name:'All topics'}).click();
 await expect(page.locator('[data-lesson]')).toHaveCount(8);
});

test('GalaxiPedia guide: real sourced original article, related concept and tool',async({page})=>{
 await page.goto('/uk/pedia/panchanga-five-limbs-explained');
 await expect(page.getByRole('heading',{level:1})).toContainText('П’ять складників Панчанги');
 await expect(page.locator('.as-lesson-section')).toHaveCount(4);
 await expect(page.getByRole('link',{name:'Спробувати інструмент Galaxiora'})).toHaveAttribute('href','/uk/panchanga');
 await expect(page.getByRole('link',{name:'Що таке накшатри'})).toBeVisible();
 await page.locator('.as-language a[lang="en"]').click();
 await expect(page).toHaveURL(/\/en\/pedia\/panchanga-five-limbs-explained$/);
 await expect(page.getByRole('heading',{level:1})).toContainText('The Five Parts');
});

test('GalaxiPedia glossary: bilingual definitions with search and useful links',async({page})=>{
 await page.goto('/en/pedia/glossary');
 const field=page.getByRole('searchbox',{name:'Find a term'});
 await field.fill('Tithi');
 await expect(page.getByRole('heading',{name:'Tithi'})).toBeVisible();
 await expect(page.getByRole('link',{name:/Five Parts of Panchanga/}).first()).toBeVisible();
 await page.locator('.as-language a[lang="uk"]').click();
 await expect(page).toHaveURL(/\/uk\/pedia\/glossary$/);
 await expect(page.getByRole('heading',{level:1})).toContainText('Словник');
});

test('Academy quizzes persist only successful completion in same browser and across locale',async({page})=>{
 await page.goto('/en/pedia/sidereal-and-tropical');
 const quiz=page.locator('.as-academy-quiz');
 await quiz.getByLabel('The Moon’s speed').check();
 await quiz.getByRole('button',{name:'Check answer'}).click();
 await expect(quiz).not.toContainText('Lesson complete');
 await quiz.getByRole('button',{name:'Try again'}).click();
 await quiz.getByLabel('An offset between zodiac frames').check();
 await quiz.getByRole('button',{name:'Check answer'}).click();
 await expect(quiz).toContainText('Lesson complete');
 await page.reload();
 await expect(page.locator('.as-academy-quiz')).toContainText('Lesson complete');
 await page.locator('.as-language a[lang="uk"]').click();
 await expect(page.locator('.as-academy-quiz')).toContainText('Урок пройдено');
});

test('Pedia canonical, hreflang and sitemap: only new public URLs',async({request})=>{
 const html=await (await request.get('/en/pedia/panchanga-five-limbs-explained')).text();
 expect(html).toContain('rel="canonical"');
 expect(html).toContain('https://galaxiora.example/en/pedia/panchanga-five-limbs-explained');
 expect(html).toContain('hrefLang="uk"');
 expect(html).toContain('application/ld+json');
 const sitemap=await (await request.get('/sitemap.xml')).text();
 for(const path of ['/en/pedia','/uk/pedia','/en/pedia/glossary','/en/pedia/panchanga-five-limbs-explained','/uk/pedia/moon-phases-and-lunar-calendar','/en/pedia/sidereal-and-tropical']){
  expect(sitemap).toContain('https://galaxiora.example'+path);
 }
 expect(sitemap).not.toContain('https://galaxiora.example/en/learn');
 expect(sitemap).not.toContain('https://galaxiora.example/uk/learn');
});

test('GalaxiPedia: no horizontal overflow at 360 px on representative pages',async({page})=>{
 await page.setViewportSize({width:360,height:780});
 for(const path of ['/en/pedia','/uk/pedia','/en/pedia/glossary','/uk/pedia/panchanga-five-limbs-explained','/en/pedia/sidereal-and-tropical']){
  await page.goto(path);
  const excess=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(excess,path).toBeLessThanOrEqual(2);
 }
});
