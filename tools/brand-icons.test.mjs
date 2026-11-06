import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../apps/web/public/'+p,import.meta.url));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function pngSize(data){assert.deepEqual([...data.subarray(0,8)],[137,80,78,71,13,10,26,10]);return [data.readUInt32BE(16),data.readUInt32BE(20)];}
test('Every 64px output and Next icon.png are byte-identical to the approved original #6',()=>{
 const source=readFileSync(new URL('../apps/web/brand-assets/galaxiora-approved-spiral-6.png',import.meta.url));
 const generated64=file('galaxiora-favicon.png');
 const next=readFileSync(new URL('../apps/web/app/icon.png',import.meta.url));
 assert.deepEqual(generated64,source);
 assert.deepEqual(next,source);
});
test('every generated web, Google, Apple and Android brand PNG has its declared square size',()=>{
 for(const [name,size] of Object.entries({
  'galaxiora-favicon.png':64,'galaxiora-logo-128.png':128,
  'apple-touch-icon.png':180,'galaxiora-192.png':192,'galaxiora-512.png':512
 })){
  assert.deepEqual(pngSize(file(name)),[size,size],name);
 }
});
test('favicon.ico has valid 16, 32, 48 and 64 pixel PNG-backed frames',()=>{
 const ico=file('favicon.ico');
 assert.equal(ico.readUInt16LE(0),0);
 assert.equal(ico.readUInt16LE(2),1);
 assert.equal(ico.readUInt16LE(4),4);
 const sizes=[];
 for(let i=0;i<4;i++){
  const p=6+i*16,size=ico.readUInt8(p)||256,bytes=ico.readUInt32LE(p+8),offset=ico.readUInt32LE(p+12);
  sizes.push(size);
  assert.deepEqual(pngSize(ico.subarray(offset,offset+bytes)),[size,size]);
 }
 assert.deepEqual(sizes,[16,32,48,64]);
});
test('PWA manifest and sitewide header refer to the user-approved spiral galaxy #6',()=>{
 const manifest=JSON.parse(read('apps/web/public/site.webmanifest'));
 assert.equal(manifest.short_name,'Galaxiora');
 assert.deepEqual(manifest.icons.map(icon=>icon.sizes),['192x192','512x512']);
 assert.ok(manifest.icons.every(icon=>icon.purpose==='any'&&icon.src.startsWith('/galaxiora-')));
 const shell=read('apps/web/app/components/PortalShell.tsx');
 assert.match(shell,/galaxiora-favicon\.png/);
 assert.doesNotMatch(shell,/MoonStar/);
 const layout=read('apps/web/app/layout.tsx');
 assert.match(layout,/\/favicon\.ico/);
 assert.ok(layout.includes("url:'/galaxiora-favicon.png'"));
 assert.doesNotMatch(layout,/galaxiora-favicon\.png\?v=/);
 assert.match(layout,/apple-touch-icon\.png/);
});
