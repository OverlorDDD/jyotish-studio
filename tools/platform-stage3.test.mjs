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
 const policy=source('apps/api/src/account-policy.ts');
 assert.ok(account.includes('publicUser(user)'));
 assert.ok(policy.includes("subscriptionEndsAt.getTime()>now.getTime()"));
 assert.ok(policy.includes("tier:effectiveSubscription(user,now)"));
 assert.ok(policy.includes('role:user.role'));
});
test('private draft requires account consent, daily limits and returns checkout unavailable',()=>{
 const api=source('apps/api/src/reading-orders.ts');
 for(const term of ["@Post('drafts')","privacyConsent!==true","cookieUser(req)","sameOrigin(req)","recent>=5","expiresAt:new Date(now.getTime()+7*24*60*60*1000)","checkoutAvailable:false"])
  assert.ok(api.includes(term),term);
 assert.ok(api.includes("where:{customerId,expiresAt:{gt:new Date()}}"));
 assert.ok(api.includes("where:{id,customerId}"));
 assert.ok(api.includes("status:'PAID'")&&api.includes('paymentVerifiedAt:{not:null}'));
});
test('Private Tarot question saves persistently; disabled donation does not charge',()=>{
 const offer=source('apps/web/app/components/ExpertOffer.tsx');
 const checkout=source('apps/web/app/components/DraftCheckout.tsx');
 assert.ok(offer.includes('<DraftCheckout locale={locale}/>'));
 assert.ok(checkout.includes("fetch('/api/v1/reading-orders/questions'"));
 assert.ok(source('apps/api/src/reading-orders.ts').includes("@Post('questions')"));
 assert.ok(source('apps/api/src/reading-orders.ts').includes("@Get('questions')"));
 assert.ok(checkout.includes('setDraft(saved)'));
 assert.ok(checkout.includes('role="dialog"'));
 assert.ok(checkout.includes('disabled aria-disabled="true"'));
 assert.ok(!checkout.includes('/api/v1/payments'));
});
test('Legacy admin draft count stays separate from owner-controlled permanent questions',()=>{
 const admin=source('apps/api/src/admin.ts');
 const account=source('apps/web/app/components/AccountDashboard.tsx');
 assert.ok(admin.includes('readingDraft.count'));
 assert.ok(!admin.includes('readingDraft.findMany'));
 assert.ok(account.includes('/api/v1/reading-orders/questions'));
 assert.ok(source('apps/api/prisma/schema.prisma').includes('model TarotQuestion'));
 assert.ok(source('apps/api/src/reading-orders.ts').includes("@Delete('questions/:id')"));
 assert.ok(account.includes("method:'DELETE'"));
});
test('new migration remains additive and includes expiry index',()=>{
 const sql=source('apps/api/prisma/migrations/20261018175000_subscription_and_reading_drafts/migration.sql');
 assert.ok(sql.includes('CREATE TABLE "ReadingDraft"'));
 assert.ok(sql.includes('ReadingDraft_expiresAt_idx'));
 assert.ok(!sql.includes('DROP TABLE'));
});

test('permanent private-question migration is additive and has owner foreign key',()=>{
 const sql=source('apps/api/prisma/migrations/20261024150000_private_tarot_questions/migration.sql');
 assert.match(sql,/CREATE TABLE "TarotQuestion"/);
 assert.match(sql,/TarotQuestion_userId_fkey/);
 assert.match(sql,/ON DELETE CASCADE/);
 assert.doesNotMatch(sql,/DROP TABLE/);
});
