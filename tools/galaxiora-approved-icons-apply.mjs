/** Persist approved round galaxy #6 across every Next.js build; no legacy SVG input. */
import {readFileSync,copyFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const source=join(root,'apps/web/brand-assets/galaxiora-circle-64.png');
const png=readFileSync(source);
if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Approved icon is not a PNG');
for(const rel of ['apps/web/app/icon.png','apps/web/public/galaxiora-favicon.png','apps/web/public/apple-touch-icon.png']){
 const dest=join(root,rel);mkdirSync(dirname(dest),{recursive:true});copyFileSync(source,dest);
}
const header=Buffer.from([0,0,1,0,1,0]);
const item=Buffer.alloc(16);item[0]=64;item[1]=64;item.writeUInt16LE(1,4);item.writeUInt16LE(32,6);
item.writeUInt32LE(png.length,8);item.writeUInt32LE(22,12);
writeFileSync(join(root,'apps/web/public/favicon.ico'),Buffer.concat([header,item,png]));
console.log('[galaxiora-icons] approved circular galaxy #6 installed');
