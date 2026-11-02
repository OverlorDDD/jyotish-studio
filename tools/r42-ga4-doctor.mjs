/** Galaxiora GA4 production configuration doctor.
 * Safe: reads only the GA4 public Measurement ID, checks compiled client files.
 * Does not send any GA events, read birth data, fetch secrets or change state.
 * Usage (AWS): node --env-file-if-exists=.env tools/r42-ga4-doctor.mjs
 */
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const id=process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim()||'';
const valid=/^G-[A-Z0-9]{6,16}$/.test(id);
let matches=0,files=0;
async function visit(directory){
 let entries=[];
 try{entries=await readdir(directory,{withFileTypes:true})}catch{return}
 for(const entry of entries){
  const path=join(directory,entry.name);
  if(entry.isDirectory())await visit(path);
  else if(entry.isFile()&&(entry.name.endsWith('.js')||entry.name.endsWith('.html'))){
   files++;
   const body=await readFile(path,'utf8');
   if(valid&&body.includes(id))matches++;
  }
 }
}
await visit('apps/web/.next/static');
const state=valid?(matches?'CONFIGURED_IN_COMPILED_CLIENT':'ENV_SET_BUT_CLIENT_BUNDLE_MISSING_ID'):
 id?'INVALID_MEASUREMENT_ID':'DISABLED_ENV_NOT_SET';
console.log('Galaxiora GA4 local doctor:',JSON.stringify({
 state,measurementId:valid?id:null,scannedClientFiles:files,bundleMatches:matches,
 note:'This checks installation only. It cannot verify Google collector delivery, consent, or GA4 Realtime.'
}));
if(id&&(!valid||!matches))process.exitCode=2;
