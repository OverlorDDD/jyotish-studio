import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
const distinct=()=>randomUUID().slice(0,12);
test('News Personal Interests P1: guests private; explicit save; legacy profile preserved; accounts isolated',async({page})=>{
 const guestGet=await page.request.get('/api/v1/news/interests');
 expect(guestGet.status()).toBe(401);
 const guestPut=await page.request.put('/api/v1/news/interests',{data:{tags:['tarot']}});
 expect(guestPut.status()).toBe(401);
 const registerA=await page.request.post('/api/v1/account/register',{
  data:{email:'news-interests-a-'+distinct()+'@example.invalid',password:'News-interests-safe-test-password-2026'}
 });
 expect(registerA.status()).toBe(201);
 const legacy=await page.request.patch('/api/v1/personal/profile',{data:{newsTopics:['academy','jyotish']}});
 expect(legacy.status()).toBe(200);
 const before=await page.request.get('/api/v1/news/interests');
 expect(before.status()).toBe(200);
 expect((await before.json()).tags).toEqual(['jyotish']);
 await page.goto('/uk/news');
 // A saved account tag is selected without requiring old guest browser state.
 await expect(page.getByRole('button',{name:'Джйотіш'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Таро',exact:true}).click();
 const save=page.getByRole('button',{name:'Зберегти інтереси в кабінеті'});
 await expect(save).toBeVisible();
 const unexpected=await page.request.put('/api/v1/news/interests',{data:{tags:['invalid-tag']}});
 expect(unexpected.status()).toBe(400);
 const repeated=await page.request.put('/api/v1/news/interests',{data:{tags:['tarot','tarot']}});
 expect(repeated.status()).toBe(400);
 const csrf=await page.request.put('/api/v1/news/interests',{headers:{Origin:'https://hostile.example'},data:{tags:['tarot']}});
 expect(csrf.status()).toBe(403);
 await save.click();
 await expect(page.getByText('Інтереси збережено')).toBeVisible();
 const state=await page.request.get('/api/v1/news/interests');
 expect(state.status()).toBe(200);
 expect((await state.json()).tags.sort()).toEqual(['jyotish','tarot'].sort());
 const profile=await page.request.get('/api/v1/personal/profile');
 expect((await profile.json()).profile.newsTopics.sort()).toEqual(['academy','jyotish','tarot'].sort());
 await page.reload();
 await expect(page.getByRole('button',{name:'Таро',exact:true})).toHaveAttribute('aria-pressed','true');
 // Account B gets its own empty server-side preferences on this same browser.
 const registerB=await page.request.post('/api/v1/account/register',{
  data:{email:'news-interests-b-'+distinct()+'@example.invalid',password:'News-interests-safe-test-password-2026'}
 });
 expect(registerB.status()).toBe(201);
 await page.reload();
 const other=await page.request.get('/api/v1/news/interests');
 expect(other.status()).toBe(200);
 expect((await other.json()).tags).toEqual([]);
 await expect(page.getByRole('button',{name:'Таро',exact:true})).toHaveAttribute('aria-pressed','false');
});
