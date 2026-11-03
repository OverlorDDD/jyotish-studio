import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url));
test('approved galaxy favicon is round and used by browser and header',()=>{
 const png=read('apps/web/app/icon.png');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),64);
 assert.equal(png.readUInt32BE(20),64);
 assert.ok(png.includes(Buffer.from('tRNS')),'PNG transparency for circular shape is missing');
 const layout=read('apps/web/app/layout.tsx').toString();
 const header=read('apps/web/app/components/PortalShell.tsx').toString();
 assert.match(layout,/icon\.png\?v=galaxy-round-v4/);
 assert.match(header,/galaxiora-favicon\.png\?v=galaxy-round-v4/);
 assert.match(header,/borderRadius:"50%"/);
 assert.doesNotMatch(layout,/galaxy6|icon\.svg/);
});
