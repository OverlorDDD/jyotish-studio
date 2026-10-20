import {test,expect} from '@playwright/test';
test('shared glossary annotates existing Academy pages without editing lesson text',async({page})=>{
 await page.goto('/uk/learn/sidereal-and-tropical');
 const term=page.locator('abbr.as-glossary-term').filter({hasText:'Лахірі'}).first();
 await expect(term).toBeVisible();
 await expect(term).toHaveAttribute('tabindex','0');
 await expect(term).toHaveAttribute('data-definition',/стандарт/);
 await term.focus();
 await expect(term).toBeFocused();
 await expect(term).toHaveAttribute('title',/айанамші/);
 await page.goto('/en/learn/sidereal-and-tropical');
 const en=page.locator('abbr.as-glossary-term').first();
 await expect(en).toBeVisible();
 await expect(en).toHaveAttribute('data-definition',/.{20}/);
});
