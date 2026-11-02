/**
 * Galaxiora approved favicon installer.
 * Uses the user's selected original concept #6, not a redrawn SVG.
 * Run after any legacy brand-icons generator, before next build.
 */
import {readFileSync, copyFileSync, existsSync, mkdirSync, rmSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)), '..');
const brand=join(root,'apps/web/brand-assets/galaxiora-option6');
const items=[
 ['galaxiora-option6-64.png','apps/web/app/icon.png'],
 ['galaxiora-option6-64.png','apps/web/public/galaxiora-favicon.png'],
 ['galaxiora-option6-128.png','apps/web/public/galaxiora-logo-128.png'],
 ['galaxiora-option6-180.png','apps/web/public/apple-touch-icon.png'],
 ['galaxiora-option6-192.png','apps/web/public/galaxiora-192.png'],
 ['galaxiora-option6-512.png','apps/web/public/galaxiora-512.png'],
 ['galaxiora-option6-favicon.ico','apps/web/public/favicon.ico'],
];
for(const [src,dst] of items){
 const from=join(brand,src),to=join(root,dst);
 if(!existsSync(from))throw Error('Missing approved original galaxy asset: '+from);
 if(src.endsWith('.png')){
  const png=readFileSync(from);
  if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not a valid PNG: '+from);
 }
 mkdirSync(dirname(to),{recursive:true});
 copyFileSync(from,to);
 console.log('[approved-galaxy] '+dst);
}
const wrongSvg=join(root,'apps/web/app/icon.svg');
if(existsSync(wrongSvg)){
 rmSync(wrongSvg);
 console.log('[approved-galaxy] removed incorrect app/icon.svg');
}
