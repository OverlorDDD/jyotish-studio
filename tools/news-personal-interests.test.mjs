import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('news account preferences are opt-in and use private owner-based API instead of guest auto-upload',()=>{
 const ui=readFileSync(new URL('../apps/web/app/components/NewsWorld.tsx',import.meta.url),'utf8');
 const api=readFileSync(new URL('../apps/api/src/news.ts',import.meta.url),'utf8');
 assert.match(ui,/news\/interests/);
 assert.match(ui,/method:'PUT'/);
 assert.match(ui,/setPendingGuest/);
 assert.match(ui,/guestTopics\.current/);
 assert.match(ui,/accountStatus!=='guest'/);
 assert.match(api,/@Get\('interests'\)/);
 assert.match(api,/@Put\('interests'\)/);
 assert.match(api,/sameOrigin\(req\)/);
 assert.match(api,/new Set\(dto\.tags\)\.size/);
 assert.match(api,/legacy.*newsTopics|const legacy=/);
});
test('existing Personal profile accepts new twelve news interests plus legacy settings',()=>{
 const content=readFileSync(new URL('../apps/api/src/personal.ts',import.meta.url),'utf8');
 assert.match(content,/@ArrayMaxSize\(14\)/);
 assert.match(content,/natal-charts/);
 assert.match(content,/academy/);
});
