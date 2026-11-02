import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const at=path=>new URL('../'+path,import.meta.url);
const read=path=>readFileSync(at(path));
const layout=read('apps/web/app/layout.tsx').toString();
const source=read('apps/web/brand-assets/galaxiora-approved-spiral-6.png');
test('Brand source is EXACT user-approved original galaxy artwork #6, no old G SVG',()=>{
 const sha=createHash('sha1').update(Buffer.from('blob '+source.length+String.fromCharCode(0))).update(source).digest('hex');
 assert.equal(sha,'e6cf1437d0d48c6851093d21c1873fd64f3d03fe');
 assert.deepEqual([...source.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(source.readUInt32BE(16),64);
 assert.equal(source.readUInt32BE(20),64);
 assert.ok(!existsSync(at('apps/web/app/icon.svg')),'rejected G SVG must not be present');
});
test('All browser Google and Apple icon metadata names approved galaxy #6',()=>{
 for(const path of ['/favicon.ico','/galaxiora-favicon.png','/icon.png?v=approved-galaxy-6-20261102','/apple-touch-icon.png','/site.webmanifest'])
  assert.ok(layout.includes(path),'missing '+path);
 assert.ok(layout.includes("logo:{'@type':'ImageObject',url:siteUrl+'/galaxiora-logo-128.png'"));
 assert.doesNotMatch(layout,/cosmic-g-20261101|galaxy-round-v4/);
 const shell=read('apps/web/app/components/PortalShell.tsx').toString();
 assert.ok(shell.includes('/galaxiora-favicon.png?v=approved-galaxy-6-20261102'));
});
