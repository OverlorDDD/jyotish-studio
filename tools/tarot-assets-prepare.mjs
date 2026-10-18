/**
 * Safe one-time local art preparation for npm run dev:full.
 * On missing images, downloads the pinned 78 classic cards; after that,
 * verifies JPEG magic + full file presence. If offline, Next still starts
 * and the client falls back to the pinned remote archive.
 */
import {stat,open} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {TAROT_DECK} from '../apps/api/src/tarot-deck.ts';
import {tarotArtFilename} from '../apps/web/lib/tarot-art.ts';

const root=process.cwd();
const folder=join(root,'apps','web','public','tarot','rws');
const files=[...new Set(TAROT_DECK.map(c=>tarotArtFilename(c.id)))];
if(files.length!==78||files.some(f=>!f))throw new Error('Expected 78 mapped classic Tarot cards');
async function jpegReady(name){
 const path=join(folder,name);
 let handle;
 try{
  const size=(await stat(path)).size;
  if(size<=4000)return false;
  handle=await open(path,'r');
  const first=Buffer.alloc(2),last=Buffer.alloc(2);
  await handle.read(first,0,2,0);await handle.read(last,0,2,size-2);
  return first[0]===0xff&&first[1]===0xd8&&last[0]===0xff&&last[1]===0xd9;
 }catch{return false}
 finally{await handle?.close()}
}
async function countReady(){
 const result=await Promise.all(files.map(jpegReady));
 return result.filter(Boolean).length;
}
let count=await countReady();
if(count===78){
 console.log('Tarot art ready: all 78 classic illustrations available locally.');
 process.exit(0);
}
console.log('Tarot art preparation: '+count+'/78 cached. Downloading missing cards…');
const run=spawnSync(process.execPath,['tools/tarot-assets.mjs'],{
 cwd:root,stdio:'inherit',timeout:240_000
});
count=await countReady();
if(count===78){
 console.log('Tarot art verified: 78/78 classic cards.');
}else{
 console.warn('WARNING: only '+count+'/78 tarot images cached. Check internet and retry npm run tarot:assets.');
 console.warn('The UI will try the pinned public archive for missing images.');
 if(process.env.TAROT_ART_REQUIRE_LOCAL==='true')process.exitCode=1;
}
if(run.error)console.warn('Tarot image download note:',run.error.message);
