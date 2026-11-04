#!/usr/bin/env node
/** Guard for only the tracked Next.js-managed next-env.d.ts.
 * Preserve exact generated contents privately, then restore its already-reviewed
 * HEAD version without git reset/clean/stash. Any non-Next edit fails CLOSED.
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
const root=resolve(process.env.P388_APP_ROOT||process.cwd());
const state=resolve(process.env.P388_STATE_ROOT||join(process.env.HOME||'/home/ubuntu','.galaxiora-p388'));
const path='apps/web/next-env.d.ts';
const asText=(args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
function isNextGenerated(text){
 const lines=text.replace(/\r\n/g,'\n').split('\n').map(s=>s.trim()).filter(Boolean);
 if(lines.length<2||lines.length>12||
   lines[0]!=='/// <reference types="next" />'||
   lines[1]!=='/// <reference types="next/image-types/global" />')return false;
 return lines.slice(2).every(line=>
  line==='// This file is maintained by Next.js.'||
  line==='// NOTE: This file should not be edited'||
  line==='// NOTE: This file should not be edited manually.'||
  line==='// NOTE: This file should not be edited directly.'||
  line==='// This file should not be edited'||
  line==='// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.'||
  /^\/\/\/ <reference path="\.\/\.next\/(?:dev\/)?types\/routes\.d\.ts"\s*\/>$/.test(line)||
  /^import ["']\.\/\.next\/(?:dev\/)?types\/routes\.d\.ts["'];?$/.test(line)
 );
}
try{
 if(process.argv[2]!=='reconcile')throw Error('Usage: node p388-next-env-guard.mjs reconcile');
 asText(['ls-files','--error-unmatch','--',path]);
 const modified=execFileSync('git',['diff','--name-only','--',path],{cwd:root,encoding:'utf8'}).trim();
 if(!modified){
  console.log('P388_NEXT_ENV_CLEAN');
  process.exit(0);
 }
 const current=readFileSync(join(root,path),'utf8');
 const canonical=asText(['show','HEAD:'+path]);
 if(!isNextGenerated(current)||!isNextGenerated(canonical))
  throw Error('Tracked next-env.d.ts has non-generated content; refusing to overwrite');
 mkdirSync(state,{recursive:true,mode:0o700});
 const stamp=new Date().toISOString().replace(/[^0-9TZ]/g,'');
 const backup=join(state,'generated-next-env-'+stamp+'-'+process.pid+'.d.ts');
 const fd=openSync(backup,'wx',0o600);
 try{writeFileSync(fd,current)}finally{closeSync(fd)}
 // Restore the EXACT previous-HEAD content, *only* for the auto-generated file.
 writeFileSync(join(root,path),canonical);
 if(execFileSync('git',['diff','--name-only','--',path],{cwd:root,encoding:'utf8'}).trim())
  throw Error('Next.js generated header could not be restored');
 console.log('P388_NEXT_ENV_RECONCILED: Next.js-only generated file preserved privately');
}catch(err){
 console.error('P388_NEXT_ENV_STOP: '+(err instanceof Error?err.message:'unexpected failure'));
 process.exitCode=2;
}
