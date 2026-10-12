import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import config from '../apps/web/next.config.mjs';

test('one-domain API rewrite routes to local-only NestJS listener',async()=>{
 const rewrites=await config.rewrites();
 assert.ok(config.experimental?.proxyTimeout>=75_000,'Slow free AI responses must outlast the Next.js proxy timeout');
 assert.deepEqual(rewrites,[{source:'/api/:path*',destination:'http://127.0.0.1:4000/api/:path*'}]);
 const page=readFileSync(new URL('../apps/web/app/page.tsx',import.meta.url),'utf8');
 assert.ok(page.includes("const api='';"),'Browser must use same origin for API requests');
 assert.ok(!page.includes('NEXT_PUBLIC_API_URL'),'Browser must not embed localhost:4000');
});
test('demo middleware covers API and requires credentials on remote host',()=>{
 const source=readFileSync(new URL('../apps/web/middleware.ts',import.meta.url),'utf8');
 assert.ok(source.includes("'authorization'"));
 assert.ok(source.includes('WWW-Authenticate'));
 assert.ok(source.includes('status:503'));
 assert.ok(source.includes('DEMO_ACCESS_PASSWORD'));
 assert.ok(source.includes("matcher:['/((?!_next/static|_next/image|favicon.ico).*)']"));
});

test('demo preflight refuses paid AI before any public network probe',()=>{
 const result=spawnSync(process.execPath,['tools/demo-preflight.mjs'],{
  cwd:new URL('..',import.meta.url),
  encoding:'utf8',
  env:{...process.env,DEMO_ACCESS_USER:'demo',DEMO_ACCESS_PASSWORD:'test_only_password_123456',AI_MODE:'paid_openai',OPENAI_ENABLED:'1'}
 });
 assert.equal(result.status,1);
 assert.match(result.stderr,/BLOCKED: AI_MODE=paid_openai/);
});
