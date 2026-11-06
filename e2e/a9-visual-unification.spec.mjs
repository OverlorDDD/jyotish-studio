import {test,expect} from '@playwright/test';

test('Global shell is single in Jyotish and the local tool preserves saved-chart access',async({page})=>{
 await page.goto('/uk/astrology/jyotish');
 await expect(page.locator('header.as-header')).toHaveCount(1);
 await expect(page.locator('header.topbar')).toHaveCount(0);
 await expect(page.locator('.jy-workbench .logo')).toHaveCount(0);
 await expect(page.locator('.jy-workbench .lang-button')).toHaveCount(0);
 await expect(page.locator('button.as-account-trigger')).toHaveCount(1);
 await expect(page.locator('button.account-trigger')).toContainText('Зберегти карту');
 // The section rail intentionally collapses in the narrow responsive layout.
 if((page.viewportSize()?.width||0)<900)await expect(page.locator('.jy-section-nav')).toBeHidden();
 else await expect(page.locator('.jy-section-nav')).toBeVisible();
 await expect(page.locator('.jy-portal-toolbar')).toContainText('GalaxiAstro');
});
test('Root and localized home open the real chart, with About Me as first navigation item',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.jy-workbench')).toBeVisible();
 await expect(page.locator('header.as-header')).toHaveCount(1);
 await expect(page.getByRole('heading',{name:/Natal chart/i})).toBeVisible();
 const first=page.locator('.as-main-nav a').first();
 await expect(first).toHaveText('About Me');
 await expect(first).toHaveAttribute('href','/en/about-me');
 await page.goto('/uk');
 await expect(page).toHaveURL(/\/uk\/astrology\/jyotish$/);
 await expect(page.locator('.jy-workbench')).toBeVisible();
});

test('Main navigation reaches practical content without splash redirect loops',async({page})=>{
 await page.goto('/uk');
 await page.locator('.as-main-nav').getByRole('link',{name:'Астрологія'}).click();
 await expect(page).toHaveURL(/\/uk\/astrology\/jyotish$/);
 await expect(page.getByRole('heading',{name:/Натальна карта/})).toBeVisible();
 await page.locator('.as-main-nav').getByRole('link',{name:'Таро'}).click();
 await expect(page.getByRole('button',{name:'Розкласти карти'})).toBeVisible();
 await expect(page.locator('.as-tarot-live-link')).toHaveAttribute('href','#human-readings');
 await page.locator('.as-main-nav').getByRole('link',{name:'Йога та медитація'}).click();
 await expect(page.getByTestId('breathing-square')).toBeVisible();
});
