#!/usr/bin/env node
/**
 * Checks EVERY tracked file against the content of HEAD, including files hidden
 * by git assume-unchanged/skip-worktree flags. This is not git status.
 * --repair: backs up differences OUTSIDE the repo, restores exact Git blobs.
 * Never touches untracked files (.env, package-lock.json, user uploads).
 */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readFileSync,readlinkSync,writeFileSync,mkdirSync,copyFileSync,chmodSync,symlinkSync,rmSync} from 'node:fs';
import {dirname,join,resolve,relative,isAbsolute} from 'node:path';
const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const git=(args)=>execFileSync('git',args,{cwd:root,encoding:'buffer',maxBuffer:96*1024*1024});
const head=git(['rev-parse','HEAD']).toString('utf8').trim();
const repair=process.argv.includes('--repair');
const tree=git(['ls-tree','-rz','--full-tree','HEAD']).toString('utf8').split('\0').filter(Boolean);
let wrong=[],missing=[],checked=0;
for(const record of tree){
 const tab=record.indexOf('\t');if(tab<0)throw Error('Unexpected git ls-tree data');
 const [mode,type,sha]=record.slice(0,tab).split(' ');
 if(type!=='blob')continue; // submodules are never rewritten
 const path=record.slice(tab+1);
 const absolute=resolve(root,path);
 if(!absolute.startsWith(root+'/'))throw Error('Unsafe Git path');
 let present=false,found=null;
 try{
  const stat=lstatSync(absolute);present=true;
  const body=mode==='120000'&&stat.isSymbolicLink()?
   Buffer.from(readlinkSync(absolute)):stat.isFile()?readFileSync(absolute):null;
  if(body)found=createHash('sha1').update('blob '+body.length+'\0').update(body).digest('hex');
 }catch(err){if(err.code!=='ENOENT')throw err}
 checked++;
 if(found!==sha){
  const entry={path,mode,sha,exists:present};
  wrong.push(entry);if(!present)missing.push(path);
 }
}
console.log('[integrity] expected='+head+' checked='+checked+' drift='+wrong.length+' missing='+missing.length);
for(const e of wrong.slice(0,50))console.log('[integrity] '+(e.exists?'DIFF ':'MISSING ')+e.path);
if(wrong.length>50)console.log('[integrity] +'+(wrong.length-50)+' additional mismatches');
if(!repair){if(wrong.length)process.exitCode=2;else console.log('SOURCE_TREE_INTEGRITY_OK');}
else {
 if(!wrong.length){console.log('SOURCE_TREE_INTEGRITY_OK');process.exit(0)}
 const backup=resolve(process.env.HOME||'/tmp','.galaxiora-source-recovery',new Date().toISOString().replace(/[:.]/g,'-')+'-'+head.slice(0,10));
 mkdirSync(backup,{recursive:true,mode:0o700});
 for(const e of wrong){
  const target=resolve(root,e.path),saved=join(backup,e.path);
  mkdirSync(dirname(saved),{recursive:true});
  if(e.exists){
   const stat=lstatSync(target);
   if(stat.isFile())copyFileSync(target,saved);
   else if(stat.isSymbolicLink())symlinkSync(readlinkSync(target),saved);
   else throw Error('Refusing to replace non-file: '+e.path);
  }
  // Restore exact source blob from currently checked-out commit, not origin/main.
  const data=git(['cat-file','blob',e.sha]);
  // Explicitly clear both index flags; no blind git reset or changes to .env.
  git(['update-index','--no-assume-unchanged','--',e.path]);
  git(['update-index','--no-skip-worktree','--',e.path]);
  mkdirSync(dirname(target),{recursive:true});
  rmSync(target,{force:true});
  if(e.mode==='120000')symlinkSync(data.toString('utf8'),target);
  else{writeFileSync(target,data);chmodSync(target,e.mode==='100755'?0o755:0o644);}
 }
 console.log('BACKUP_DIRECTORY='+backup);
 console.log('RESTORED_TRACKED_FILES='+wrong.length);
 // Double-check every tracked file, including restored ones, before build.
 const recheck=execFileSync(process.execPath,[process.argv[1]],{cwd:root,encoding:'utf8'});
 process.stdout.write(recheck);
}
