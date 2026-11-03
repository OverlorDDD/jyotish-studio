#!/usr/bin/env node
/**
 * P388 native PostgreSQL client: deliberately NO Docker API, sockets, sudo,
 * network introspection or localhost-port guesses. DB identity comes only from
 * the production DATABASE_URL already used by the running NestJS/Prisma API.
 *
 * Child processes receive libpq PG* settings via ENV, never in CLI arguments,
 * error output, JSON logs, GitHub or the shell history.
 */
import {spawnSync} from 'node:child_process';
import {chmodSync,closeSync,existsSync,lstatSync,openSync,unlinkSync} from 'node:fs';
import {homedir} from 'node:os';
import {basename,dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';

export function postgresEnv(raw,base={}){
 if(typeof raw!=='string'||raw.length<16)throw Error('DATABASE_URL is missing');
 let url;
 try{url=new URL(raw)}catch{throw Error('Invalid DATABASE_URL format')}
 if(!['postgresql:','postgres:'].includes(url.protocol)||!url.hostname||
  !url.username||!url.pathname||url.pathname==='/')
  throw Error('DATABASE_URL must be a complete PostgreSQL connection URL');
 if(url.searchParams.get('pgbouncer')==='true')
  throw Error('PGBouncer transaction pool is not approved for a complete production backup');
 const port=url.port||'5432';
 if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)
  throw Error('Invalid database port');
 // Drop inherited potentially conflicting libpq settings, then use only the
 // exact service DATABASE_URL. Password is held in this process' environment,
 // never appended to ps-visible argv.
 const env={...base};
 for(const key of Object.keys(env))if(key.startsWith('PG'))delete env[key];
 Object.assign(env,{
  PGHOST:decodeURIComponent(url.hostname),PGPORT:port,
  PGUSER:decodeURIComponent(url.username),
  PGPASSWORD:decodeURIComponent(url.password),
  PGDATABASE:decodeURIComponent(url.pathname.slice(1)),
  PGCONNECT_TIMEOUT:'8',PGAPPNAME:'galaxiora-p388-native-backup'
 });
 for(const [param,name] of [
  ['sslmode','PGSSLMODE'],['sslrootcert','PGSSLROOTCERT'],
  ['sslcert','PGSSLCERT'],['sslkey','PGSSLKEY']]){
  const val=url.searchParams.get(param);
  if(val)env[name]=val;
 }
 return env;
}

function run(program,args,env,timeout=60000){
 const r=spawnSync(program,args,{
  env,encoding:'utf8',maxBuffer:2*1024*1024,timeout,
  stdio:['ignore','pipe','pipe']
 });
 if(r.error||r.status!==0){
  // Intentionally omit libpq diagnostics: they may contain URL query params,
  // account IDs or server names. Do not print secrets, even on failure.
  throw Error(program+' failed (exit '+(r.status??'spawn')+'); verify PostgreSQL client version, database reachability, credentials and permissions');
 }
 return r.stdout;
}
function checkNative(env){
 const reply=run('psql',['-X','-w','-A','-t','-q','-c','SELECT 1'],env,30000);
 if(reply.trim()!=='1')throw Error('Database SELECT 1 did not return expected result');
 // pg_dump also checks server/client version and backup privileges. This
 // detects mismatched PG versions *before* any code switch or disk snapshot.
 run('pg_dump',['-w','--schema-only','--no-owner','--no-acl','--file=/dev/null'],env,90000);
 run('pg_restore',['--version'],env,10000);
 console.log('P388_NATIVE_PG_READY: existing DATABASE_URL verified; schema dump works (Docker not used)');
}
function safeArchivePath(arg){
 if(!arg||!isAbsolute(arg)||basename(arg)!=='production-before.dump')
  throw Error('Backup archive must be an absolute production-before.dump path');
 const root=resolve(process.env.P388_STATE_ROOT||resolve(homedir(),'.galaxiora-p388'));
 const dst=resolve(arg),rel=relative(root,dst);
 if(rel.startsWith('..'+sep)||rel==='..'||isAbsolute(rel)||!/^backup-[0-9]{8}T[0-9]{6}Z\/production-before\.dump$/.test(rel.split(sep).join('/')))
  throw Error('Backup path must be in the private P388 backup folder');
 const parent=dirname(dst);
 if(!existsSync(parent)||!lstatSync(parent).isDirectory()||lstatSync(parent).isSymbolicLink()||
  existsSync(dst))
  throw Error('Backup folder unavailable, symlinked or archive already exists');
 return dst;
}
function backupNative(env,arg){
 const dst=safeArchivePath(arg);
 // Reserve the file exclusively; a symlink/untracked file cannot be overwritten.
 closeSync(openSync(dst,'wx',0o600));
 try{
  run('pg_dump',['-w','--format=custom','--no-owner','--no-acl','--file='+dst],env,900000);
  const listed=run('pg_restore',['--list',dst],env,120000);
  if(!listed.includes('TABLE DATA')||!listed.includes(' TABLE '))
   throw Error('Backup archive lacks expected application tables/data');
  const f=lstatSync(dst);
  if(!f.isFile()||f.size<1024)throw Error('Database archive missing or unexpectedly small');
  chmodSync(dst,0o600);
  console.log('P388_NATIVE_PG_BACKUP_TOC_PASS: private custom-format archive and table contents list verified');
 }catch(err){
  try{unlinkSync(dst)}catch{}
  throw err;
 }
}
async function main(){
 const action=process.argv[2],env=postgresEnv(process.env.DATABASE_URL,process.env);
 if(action==='check')checkNative(env);
 else if(action==='backup')backupNative(env,process.argv[3]);
 else throw Error('Usage: node --env-file=.env tools/panchanga-p388-db-direct.mjs check|backup <absolute-private-archive>');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(err=>{
  console.error('P388_NATIVE_PG_STOP: '+(err instanceof Error?err.message:'native PostgreSQL operation failed'));
  process.exitCode=2;
 });
}
