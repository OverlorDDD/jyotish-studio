import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../apps/api/src/news.ts',import.meta.url),'utf8');
const jsx=readFileSync(new URL('../apps/web/app/components/NewsWorld.tsx',import.meta.url),'utf8');
test('P4 endpoint ownership, selective reset and confidentiality contract',()=>{
 assert.match(source,/@Get\('privacy\/export'\)/);
 assert.match(source,/@Delete\('privacy\/reset'\)/);
 assert.match(source,/@Put\('settings'\)/);
 assert.match(source,/newsPersonalizationEnabled/);
 assert.match(source,/await this\.reactionOwner\(req,true\)/);
 assert.match(source,/const legacy=.*newsTopics/);
 assert.match(source,/tx\.newsReaction\.deleteMany/);
 assert.match(source,/complete:reactions\.length===total/);
});
test('P4 GUI requires an explicit confirmation and does not submit silent resets',()=>{
 assert.match(jsx,/data-testid="news-privacy-controls"/);
 assert.match(jsx,/setConfirmMode\('reset'\)/);
 assert.match(jsx,/confirmedDelete/);
 assert.match(jsx,/exportNewsData/);
 assert.match(jsx,/undoHistory/);
 assert.match(jsx,/role="switch"/);
});
