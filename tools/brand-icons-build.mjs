/** Deterministic, single-source Galaxiora icon pipeline.
 * The checked-in SVG is the source of truth. Every browser/search/mobile
 * bitmap is generated from it before Next.js production build.
 * Requires explicit sharp dependency in apps/web/package.json.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import sharp from 'sharp';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(join(root,'apps/web/app/icon.svg'));
const out=join(root,'apps/web/public');
await mkdir(out,{recursive:true});

async function png(size){
 return sharp(source,{density:192})
  .resize(size,size,{fit:'fill',kernel:'lanczos3'})
  .png({compressionLevel:9,palette:false})
  .toBuffer();
}

const files=[
 ['galaxiora-favicon.png',64],
 ['galaxiora-logo-128.png',128],
 ['apple-touch-icon.png',180],
 ['galaxiora-192.png',192],
 ['galaxiora-512.png',512]
];
for(const [name,size] of files){
 const buffer=await png(size);
 await writeFile(join(out,name),buffer);
 console.log('[brand-icons] '+name+' '+size+'x'+size);
}

// ICO accepts embedded PNG frames. Include 16, 32, 48 and 64 px.
const icoSizes=[16,32,48,64];
const frames=await Promise.all(icoSizes.map(png));
const header=Buffer.alloc(6+16*frames.length);
header.writeUInt16LE(0,0);
header.writeUInt16LE(1,2);
header.writeUInt16LE(frames.length,4);
let offset=header.length;
for(let i=0;i<frames.length;i++){
 const size=icoSizes[i],cursor=6+i*16;
 header.writeUInt8(size,cursor);
 header.writeUInt8(size,cursor+1);
 header.writeUInt8(0,cursor+2);
 header.writeUInt8(0,cursor+3);
 header.writeUInt16LE(1,cursor+4);
 header.writeUInt16LE(32,cursor+6);
 header.writeUInt32LE(frames[i].length,cursor+8);
 header.writeUInt32LE(offset,cursor+12);
 offset+=frames[i].length;
}
await writeFile(join(out,'favicon.ico'),Buffer.concat([header,...frames]));
console.log('[brand-icons] favicon.ico (16/32/48/64)');
