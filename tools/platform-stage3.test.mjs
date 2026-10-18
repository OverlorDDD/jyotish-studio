import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('normal member gets FREE without staff permissions, premium is separate and expires',()=>{
 const schema=source('apps/api/prisma/schema.prisma');
 const account=source('apps/api/src/account.ts');
 assert.match(schema,/role UserRole @default\(MEMBER\)/);
 assert.match(schema,/subscriptionTier SubscriptionTier @default\(FREE\)/);
 assert.match(schema,/subscriptionEndsAt DateTime\?/);
 assert.ok(account.includes("subscriptionEndsAt.getTime()>Date.now()"));
 assert.ok(account.includes("tier:user.subscriptionTier==='PREMIUM'"));
 assert.ok(account.includes('role:user.role'));
});
test('private draft requires account consent, daily limits and returns checkout unavailable',()=>{
 const api=source('apps/api/src/reading-orders.ts');
 for(const term of ["@Post('drafts')","privacyConsent!==true","cookieUser(req)","sameOrigin(req)","recent>=5","expiresAt:new Date(now.getTime()+7*24*60*60*1000)","checkoutAvailable:false"])
  assert.ok(api.includes(term),term);
 assert.ok(api.includes("where:{customerId,expiresAt:{gt:new Date()}}"));
 assert.ok(api.includes("where:{id,customerId}"));
 assert.ok(api.includes("status:'PAID'")&&api.includes('paymentVerifiedAt:{not:null}'));
});
test('question is submitted before checkout, disabled checkout never charges',()=>{
 const offer=source('apps/web/app/components/ExpertOffer.tsx');
 const checkout=source('apps/web/app/components/DraftCheckout.tsx');
 assert.ok(offer.includes('<DraftCheckout locale={locale}/>'));
 assert.ok(checkout.includes("fetch('/api/v1/reading-orders/drafts'"));
 assert.ok(checkout.includes('setDraft(saved)'));
 assert.ok(checkout.includes('role="dialog"'));
 assert.ok(checkout.includes('disabled aria-disabled="true"'));
 assert.ok(!checkout.includes('/api/v1/payments'));
});
test('admin aggregates only pre-payment draft counts, user has own drafts and delete',()=>{
 const admin=source('apps/api/src/admin.ts');
 const account=source('apps/web/app/components/AccountDashboard.tsx');
 assert.ok(admin.includes('readingDraft.count'));
 assert.ok(!admin.includes('readingDraft.findMany'));
 assert.ok(account.includes('/api/v1/reading-orders/drafts'));
 assert.ok(account.includes("method:'DELETE'"));
});
test('new migration remains additive and includes expiry index',()=>{
 const sql=source('apps/api/prisma/migrations/20261018175000_subscription_and_reading_drafts/migration.sql');
 assert.ok(sql.includes('CREATE TABLE "ReadingDraft"'));
 assert.ok(sql.includes('ReadingDraft_expiresAt_idx'));
 assert.ok(!sql.includes('DROP TABLE'));
});
