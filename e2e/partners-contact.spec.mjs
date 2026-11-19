import {test,expect} from '@playwright/test';

for(const locale of ['en','uk']){
 test('Partners contact '+locale+': Gmail, Outlook and copy do not require an installed email app',async({page})=>{
  await page.goto('/'+locale+'/partners');
  const contact=page.locator('#contact');
  await expect(contact).toBeVisible();
  const input=contact.locator('input[type="email"][readonly]');
  await expect(input).toHaveValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const address=await input.inputValue();
  const gmail=contact.getByRole('link',{name:locale==='uk'?'Написати через Gmail':'Write in Gmail'});
  const outlook=contact.getByRole('link',{name:locale==='uk'?'Написати через Outlook':'Write in Outlook'});
  const gmailHref=await gmail.getAttribute('href');
  const outlookHref=await outlook.getAttribute('href');
  expect(gmailHref).toBeTruthy();
  expect(outlookHref).toBeTruthy();
  const gmailUrl=new URL(gmailHref);
  const outlookUrl=new URL(outlookHref);
  expect(gmailUrl.origin).toBe('https://mail.google.com');
  expect(gmailUrl.searchParams.get('to')).toBe(address);
  expect(gmailUrl.searchParams.get('su')).toBe('Galaxiora editorial collaboration');
  expect(outlookUrl.origin).toBe('https://outlook.live.com');
  expect(outlookUrl.searchParams.get('to')).toBe(address);
  expect(outlookUrl.searchParams.get('subject')).toBe('Galaxiora editorial collaboration');
  await expect(gmail).toHaveAttribute('target','_blank');
  await expect(outlook).toHaveAttribute('target','_blank');
  const copy=contact.getByRole('button',{name:locale==='uk'?'Скопіювати адресу':'Copy address'});
  await copy.click();
  const status=contact.getByRole('status');
  await expect(status).toContainText(locale==='uk'?/Скопійовано|виділено/:/Copied|selected/);
 });
}
