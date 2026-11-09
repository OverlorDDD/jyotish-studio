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
 assert.equal(sha,'c6a467d3ddfd2848181203382f16f60d9030b139');
 assert.deepEqual([...source.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(source.readUInt32BE(16),64);
 assert.equal(source.readUInt32BE(20),64);
 assert.ok(!existsSync(at('apps/web/app/icon.svg')),'rejected G SVG must not be present');
});
test('All browser Google and Apple icon metadata names approved galaxy #6',()=>{
 for(const path of ['/galaxiora-favicon.png','/apple-touch-icon.png','/site.webmanifest'])
  assert.ok(layout.includes(path),'missing '+path);
 assert.equal((layout.match(/url:'\/galaxiora-favicon\.png'/g)||[]).length,1,
  'Google should see exactly one canonical favicon declaration');
 assert.doesNotMatch(layout,/shortcut:\s*['"]/,'Do not advertise an alternate shortcut icon');
 assert.doesNotMatch(layout,/url:'\/favicon\.ico'/,'Legacy ICO must not compete with canonical PNG');
 assert.ok(layout.includes("logo:{'@type':'ImageObject',url:siteUrl+'/galaxiora-logo-128.png'"));
 assert.doesNotMatch(layout,/cosmic-g-20261101|galaxy-round-v4|\?v=approved-galaxy/);
 assert.ok(layout.includes("icon:[{url:'/galaxiora-favicon.png',type:'image/png',sizes:'64x64'}]"));
 const shell=read('apps/web/app/components/PortalShell.tsx').toString();
 assert.ok(shell.includes('src="/galaxiora-favicon.png"'));
 assert.doesNotMatch(shell,/\?v=approved-galaxy/);
});

test('The production favicon audit checks canonical EN natal URL, not obsolete title copy',()=>{
 const audit=read('tools/google-favicon-production-audit.mjs').toString();
 assert.ok(audit.includes('canonicalLinks.length===1'));
 assert.ok(audit.includes('galaxiora\\.com\\/en\\/astrology\\/jyotish'));
 assert.doesNotMatch(audit,/root\.txt\.includes\('Free Vedic Birth Chart Calculator'\)/);
});
