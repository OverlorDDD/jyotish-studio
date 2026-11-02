import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join, dirname} from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)), '..');
const source=join(root, 'apps/web/app/icon.png');
const layout=readFileSync(join(root,'apps/web/app/layout.tsx'),'utf8');

test('favicon uses selected original spiral galaxy PNG, not replacement SVG',()=>{
 assert.ok(existsSync(source),'approved icon.png missing');
 const png=readFileSync(source);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.ok(png.readUInt32BE(16)>=48);
 assert.ok(png.readUInt32BE(20)>=48);
 assert.ok(png.length>2000);
 assert.equal(existsSync(join(root,'apps/web/app/icon.svg')),false,'incorrect vector icon must stay removed');
 assert.match(layout,/icon\.png\?v=galaxy-original-20261102/);
 assert.doesNotMatch(layout,/icon\.svg\?v=galaxy6/);
});
