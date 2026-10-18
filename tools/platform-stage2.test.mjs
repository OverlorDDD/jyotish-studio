import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('global account UI connects to existing cookie session without client-side role invention',()=>{
 const shell=source('apps/web/app/components/PortalShell.tsx');
 const login=source('apps/web/app/components/GlobalAccount.tsx');
 const api=source('apps/api/src/account.ts');
 assert.match(shell,/<GlobalAccount locale=\{locale\}\/>/);
 for(const word of ["'/api/v1/account/me'","'/api/v1/account/logout'","'/api/v1/account/'+mode"])assert.ok(login.includes(word),word);
 assert.ok(api.includes("role:user.role"),'Roles are provided by server');
 assert.ok(!login.includes('localStorage'),'Never store credentials in localStorage');
});
test('administrator endpoint checks the database role, never email, query or browser-controlled fields',()=>{
 const admin=source('apps/api/src/admin.ts');
 assert.match(admin,/user\.role!=='ADMIN'/);
 assert.match(admin,/ForbiddenException/);
 assert.match(admin,/cookieUser\(req\)/);
 assert.ok(!admin.includes('process.env.ADMIN_EMAIL'),'Bootstrap email is not auth check');
 assert.ok(!admin.includes('passwordHash'),'Admin dashboard must not expose password hash');
});
test('post-payment private brief endpoint is fail-closed and ownership-checked',()=>{
 const orders=source('apps/api/src/reading-orders.ts');
 assert.ok(orders.includes("status:'PAID'"));
 assert.ok(orders.includes('paymentVerifiedAt:{not:null}'));
 assert.ok(orders.includes('providerPaymentId:{not:null}'));
 assert.ok(orders.includes('customerId'));
 assert.ok(orders.includes("question:null,context:null"));
 assert.ok(orders.includes('updateMany'));
 const offer=source('apps/web/app/components/ExpertOffer.tsx');
 assert.ok(offer.includes('disabled aria-disabled="true"'));
 assert.ok(!offer.includes('fetch('));
 const section=source('apps/web/app/components/PortalSection.tsx');
 assert.ok(section.includes('<ExpertOffer locale={locale}/>'));
 assert.ok(!section.includes('<ReadingIntake locale={locale}/>'));
});
test('provider calls record usage fields and never log raw user prompts or keys',()=>{
 const ai=source('apps/api/src/ai.ts');
 const nest=source('apps/api/src/nest.ts');
 assert.ok(ai.includes('prompt_tokens'));
 assert.ok(ai.includes("reportUsage('provider_error')"));
 assert.ok(ai.includes("reportUsage('returned',result)"));
 assert.ok(nest.includes("recordAiUsage(event,'detailed_report')"));
 assert.ok(nest.includes("recordAiUsage(event,'short_reading')"));
 const admin=source('apps/api/src/admin.ts');
 assert.ok(admin.includes('requestsWithTokenUsage'));
 assert.ok(admin.includes('costUsdReported'));
});
test('existing users remain MEMBER; schema changes are additive and admin promotion explicit',()=>{
 const migration=source('apps/api/prisma/migrations/20261018160000_platform_roles_usage_orders/migration.sql');
 assert.ok(migration.includes("DEFAULT 'MEMBER'"));
 assert.ok(!migration.includes('DROP TABLE'));
 const grant=source('tools/grant-admin.mjs');
 assert.ok(grant.includes("CONFIRM_ADMIN_PROMOTION!=='YES'"));
 assert.ok(grant.includes("user.role==='ADMIN'"));
});
