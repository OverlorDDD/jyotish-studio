import test from 'node:test';
import assert from 'node:assert/strict';
import {readApiJson} from '../apps/web/lib/api-response.ts';

test('plain-text HTTP 500 from reverse proxy becomes actionable message, never SyntaxError',async()=>{
 await assert.rejects(
  readApiJson(new Response('Internal Server Error',{status:500,headers:{'Content-Type':'text/plain'}})),
  e=>e instanceof Error&&e.message.includes('API HTTP 500')&&e.message.includes('proxy')&&!e.message.includes('Unexpected token')
 );
});
test('server JSON error message is preserved without leaking response bodies',async()=>{
 await assert.rejects(
  readApiJson(new Response(JSON.stringify({message:'AI provider temporarily unavailable'}),{status:503,headers:{'Content-Type':'application/json'}})),
  e=>e.message==='API HTTP 503: AI provider temporarily unavailable'
 );
});
test('successful JSON response remains a typed object',async()=>{
 const value=await readApiJson(new Response(JSON.stringify({id:'demo',provider:'local'}),{status:201}));
 assert.deepEqual(value,{id:'demo',provider:'local'});
});
test('malformed success response has a useful error',async()=>{
 await assert.rejects(readApiJson(new Response('<html>proxy error</html>',{status:200})),/API HTTP 200: expected JSON/);
});
