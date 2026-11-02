/** Galaxiora: ONE immutable, owner-approved original galaxy spiral #6.
 * Never substitute the rejected G letter SVG or generate a new logo.
 * Final circular transparent binary is restored unchanged from approved galaxy-round-v4 commit.
 * Next auto-discovers generated app/icon.png. All formats regenerated before builds.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import sharp from 'sharp';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const approved=join(root,'apps/web/brand-assets/galaxiora-approved-spiral-6.png');
const original=await readFile(approved);
// Exact blob taken from the final circular user-approved #6 file in GitHub.
// Git's blob hashing protects against unintended brand changes.
const gitSha=createHash('sha1').update(Buffer.from('blob '+original.length+String.fromCharCode(0))).update(original).digest('hex');
if(gitSha!=='c6a467d3ddfd2848181203382f16f60d9030b139'){
 throw new Error('BRAND_BLOCKED: selected original galaxy #6 asset changed; no icons overwritten');
}
const metadata=await sharp(original).metadata();
if(metadata.format!=='png'||metadata.width!==64||metadata.height!==64||!metadata.hasAlpha){
 throw new Error('BRAND_BLOCKED: approved galaxy must be transparent 64x64 PNG');
}
const out=join(root,'apps/web/public');
await mkdir(out,{recursive:true});
async function png(size){
 if(size===64)return original; // Preserve selected artwork byte-for-byte for Google/browser/header.
 return sharp(original).resize(size,size,{kernel:'lanczos3'}).png({compressionLevel:9,palette:false}).toBuffer();
}
const generated=[
 ['galaxiora-favicon.png',64],
 ['galaxiora-logo-128.png',128],
 ['apple-touch-icon.png',180],
 ['galaxiora-192.png',192],
 ['galaxiora-512.png',512]
];
for(const [filename,size] of generated){
 await writeFile(join(out,filename),await png(size));
 console.log('[approved-galaxy-6] '+filename+' '+size+'x'+size);
}
await writeFile(join(root,'apps/web/app/icon.png'),original);
console.log('[approved-galaxy-6] apps/web/app/icon.png (64x64, original)');
const sizes=[16,32,48,64], frames=await Promise.all(sizes.map(png));
const directory=Buffer.alloc(6+frames.length*16);
directory.writeUInt16LE(0,0);directory.writeUInt16LE(1,2);directory.writeUInt16LE(frames.length,4);
let offset=directory.length;
for(let i=0;i<sizes.length;i++){
 const p=6+i*16,frame=frames[i],size=sizes[i];
 directory.writeUInt8(size,p);directory.writeUInt8(size,p+1);
 directory.writeUInt16LE(1,p+4);directory.writeUInt16LE(32,p+6);
 directory.writeUInt32LE(frame.length,p+8);directory.writeUInt32LE(offset,p+12);
 offset+=frame.length;
}
await writeFile(join(out,'favicon.ico'),Buffer.concat([directory,...frames]));
console.log('[approved-galaxy-6] favicon.ico 16/32/48/64; original image remains canonical');
