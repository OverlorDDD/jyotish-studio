import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import config from '../apps/web/next.config.mjs';

test('one-domain API rewrite routes to local-only NestJS listener',async()=>{
 const rewrites=await config.rewrites();
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
