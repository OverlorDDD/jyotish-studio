import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {signFlow,validFlow,flowCookie,clearedCookie,oauthErrorMessage,providerConfig} from '../apps/api/src/social-auth.ts';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('one-time browser state is signed and bound to correct provider, nonce, state and expiry',()=>{
 const orig=process.env.AUTH_SECRET;
 process.env.AUTH_SECRET='g35-audited-test-key-32-plus-characters-0123456789';
 try{
  const now=Date.now();
  const flow={provider:'google',state:randomBytes(24).toString('base64url'),
   nonce:randomBytes(24).toString('base64url'),verifier:randomBytes(32).toString('base64url'),
   locale:'en',actor:null,exp:now+100000};
  const token=signFlow(flow);
  assert.deepEqual(validFlow(token,'google',flow.state,now),flow);
  assert.throws(()=>validFlow(token,'apple',flow.state,now),/invalid_state/);
  assert.throws(()=>validFlow(token,'google','different',now),/invalid_state/);
  assert.throws(()=>validFlow(token+'x','google',flow.state,now),/invalid_state/);
  assert.throws(()=>validFlow(token,'google',flow.state,now+120000),/invalid_state/);
  const altered=token.replace(/.$/,'A');
  if(altered!==token)assert.throws(()=>validFlow(altered,'google',flow.state,now),/invalid_state/);
 }finally{if(orig===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=orig;}
});
test('Apple form_post preserves only short-lived secure flow cookie; session cookies stay first-party',()=>{
 const apple=flowCookie('apple','signed','https://galaxiora.com');
 assert.match(apple,/HttpOnly/);
 assert.match(apple,/SameSite=None/);
 assert.match(apple,/Secure/);
 assert.match(apple,/Max-Age=600/);
 assert.match(clearedCookie('apple','https://galaxiora.com'),/Max-Age=0/);
 assert.match(flowCookie('google','signed','https://galaxiora.com'),/SameSite=Lax/);
});
test('social providers stay disabled until credentials exist',()=>{
 const prior=Object.fromEntries(['GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET',
  'APPLE_OAUTH_SERVICE_ID','APPLE_OAUTH_TEAM_ID','APPLE_OAUTH_KEY_ID','APPLE_OAUTH_PRIVATE_KEY_FILE']
 .map(k=>[k,process.env[k]]));
 try{
  for(const k of Object.keys(prior))delete process.env[k];
  assert.equal(providerConfig('google'),false);
  assert.equal(providerConfig('apple'),false);
 }finally{for(const [k,value]of Object.entries(prior)){if(value===undefined)delete process.env[k];else process.env[k]=value;}}
});
test('OAuth error redirect only permits known error codes',()=>{
 assert.equal(oauthErrorMessage('existing_email'),'existing_email');
 assert.equal(oauthErrorMessage('link_conflict'),'link_conflict');
 assert.equal(oauthErrorMessage('evil?birthDate=secret'),'try_again');
});
test('provider identity is unique by provider/sub and password credentials remain nullable only for social users',()=>{
 const schema=read('apps/api/prisma/schema.prisma');
 const migration=read('apps/api/prisma/migrations/20261105170000_optional_oidc_identities/migration.sql');
 assert.match(schema,/model ExternalIdentity/);
 assert.match(schema,/\@\@unique\(\[provider,subject\]\)/);
 assert.match(schema,/passwordHash String\?/);
 assert.match(migration,/DROP NOT NULL/);
 assert.match(migration,/CREATE UNIQUE INDEX "ExternalIdentity_provider_subject_key"/);
 const account=read('apps/api/src/account.ts');
 assert.match(account,/!user\.passwordHash\|\|!await passwordMatches/);
});
test('safe account binding: never automatically link by email; OAuth returns existing account only by subject',()=>{
 const src=read('apps/api/src/social-auth.ts');
 assert.match(src,/findUnique\(\{\s*where:\{provider_subject:\{provider,subject:identity\.subject\}\}/);
 assert.match(src,/if\(existing\)throw new SocialAuthError\('existing_email'\)/);
 assert.match(src,/if\(prior\)return prior\.userId/);
 assert.match(src,/if\(flow\.actor\)/);
 assert.match(src,/const actor=cookieUser\(req\)/);
 assert.match(src,/if\(!sameOrigin\(req\)\)/);
 assert.match(src,/jwtVerify\(/);
 assert.match(src,/nonce!==flow\.nonce/);
 assert.match(src,/response_mode','form_post/);
 assert.match(src,/code_challenge_method','S256/);
 assert.match(src,/algorithms:\['RS256'\]/);
 assert.match(src,/SameSite=None/);
 assert.doesNotMatch(src,/\brole:'ADMIN'\b/);
 assert.doesNotMatch(src,/console\.log\([^\n]*(?:token|secret|code)/i);
});
test('guest-first, no OAuth keys in browser bundle, no forced sign-in',()=>{
 const ui=read('apps/web/app/components/GlobalAccount.tsx');
 assert.match(ui,/Continue as guest/);
 assert.match(ui,/Продовжити без акаунта/);
 assert.match(ui,/social\.google&&<button/);
 assert.match(ui,/social\.apple&&<button/);
 assert.match(ui,/oauth\/providers/);
 assert.doesNotMatch(ui,/GOOGLE_OAUTH_CLIENT_SECRET|APPLE_OAUTH_PRIVATE_KEY|APPLE_OAUTH_TEAM_ID/);
 const backend=read('apps/api/src/main.ts');
 assert.match(backend,/useBodyParser\('urlencoded'/);
 const middleware=read('apps/web/middleware.ts');
 assert.doesNotMatch(middleware,/oauth.*redirect.*login/);
});
