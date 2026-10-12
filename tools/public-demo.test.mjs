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
 assert.ok(page.includes('readApiJson<Chart>(response)'), 'Calculate route must handle non-JSON errors');
 assert.ok(page.includes('readApiJson<{provider:string'), 'Interpretation route must handle non-JSON errors');
 assert.ok(!page.includes('NEXT_PUBLIC_API_URL'),'Browser must not embed localhost:4000');
});
test('demo middleware covers API and requires credentials on remote host',()=>{
 const source=readFileSync(new URL('../apps/web/middleware.ts',import.meta.url),'utf8');
 assert.ok(source.includes("'authorization'"));
 assert.ok(source.includes('WWW-Authenticate'));
 assert.ok(source.includes('status:503'));
 assert.ok(source.includes('DEMO_ACCESS_PASSWORD'));
 assert.ok(source.includes("process.env.PUBLIC_DEMO==='1'"),'Passwordless public mode must require explicit opt-in');
 assert.ok(source.includes("request.nextUrl.pathname.startsWith('/api/docs')"),'Public mode must conceal Swagger');
 assert.ok(source.includes("X-Robots-Tag"),'Public demo should discourage indexing');
 assert.ok(source.includes("matcher:['/((?!_next/static|_next/image|favicon.ico).*)']"));
});

test('demo preflight refuses paid AI before any public network probe',()=>{
 const result=spawnSync(process.execPath,['tools/demo-preflight.mjs'],{
  cwd:new URL('..',import.meta.url),
  encoding:'utf8',
  env:{...process.env,DEMO_ACCESS_USER:'demo',DEMO_ACCESS_PASSWORD:'test_only_password_123456',AI_MODE:'paid_openai',OPENAI_ENABLED:'1'}
 });
 assert.equal(result.status,1);
 assert.match(result.stderr,/BLOCKED: Only AI_MODE=free or AI_MODE=local/);
});

test('public preview preflight and API rate limiter are explicitly guarded',()=>{
 const preflight=readFileSync(new URL('./demo-preflight.mjs',import.meta.url),'utf8');
 const nest=readFileSync(new URL('../apps/api/src/nest.ts',import.meta.url),'utf8');
 assert.ok(preflight.includes("const publicDemo=process.env.PUBLIC_DEMO==='1'"));
 assert.ok(preflight.includes("landing.status!==200"));
 assert.ok(preflight.includes("swagger.status!==404"));
 assert.ok(preflight.includes("['free','local'].includes(mode)"));
 assert.ok(nest.includes("process.env.PUBLIC_DEMO==='1'&&!allowPublicCalculation()"));
 assert.ok(nest.includes("process.env.PUBLIC_DEMO==='1'&&!allowPublicInterpretation()"));
});
test('public mode cannot bypass ban on paid OpenAI even without Basic credentials',()=>{
 const result=spawnSync(process.execPath,['tools/demo-preflight.mjs'],{
  cwd:new URL('..',import.meta.url),
  encoding:'utf8',
  env:{...process.env,PUBLIC_DEMO:'1',DEMO_ACCESS_USER:'',DEMO_ACCESS_PASSWORD:'',AI_MODE:'paid_openai'}
 });
 assert.equal(result.status,1);
 assert.match(result.stderr,/BLOCKED: Only AI_MODE=free or AI_MODE=local/);
});
