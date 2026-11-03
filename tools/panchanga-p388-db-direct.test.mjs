import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,statSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {postgresEnv} from './panchanga-p388-db-direct.mjs';

const helper=fileURLToPath(new URL('./panchanga-p388-db-direct.mjs',import.meta.url));
test('P388 direct DSN: URL-escaped credentials go to child environment only',()=>{
 const env=postgresEnv('postgresql://jyotish:p%40s%24w@127.0.0.1:5433/galaxiora?schema=public&sslmode=require',
  {PATH:'/usr/bin',PGPASSWORD:'stale',PGHOST:'bad'});
 assert.equal(env.PGHOST,'127.0.0.1');
 assert.equal(env.PGPORT,'5433');
 assert.equal(env.PGUSER,'jyotish');
 assert.equal(env.PGPASSWORD,'p@s$w');
 assert.equal(env.PGDATABASE,'galaxiora');
 assert.equal(env.PGSSLMODE,'require');
 assert.equal(env.PGCONNECT_TIMEOUT,'8');
 assert.ok(!Object.values(env).includes('stale'));
 for(const broken of ['','sqlite://x:pass@localhost/db',
  'postgresql://localhost/db','postgresql://user:pass@localhost/'])
  assert.throws(()=>postgresEnv(broken),/DATABASE_URL/);
 assert.throws(()=>postgresEnv('postgresql://u:p@localhost/db?pgbouncer=true'),/PGBouncer/);
});
test('P388 direct check and private archive use libpq without Docker or credential argv',()=>{
 const root=mkdtempSync(join(tmpdir(),'p388-no-docker-'));
 try{
  const bin=join(root,'bin');mkdirSync(bin,{mode:0o700});
  const log=join(root,'commands.log');
  const mock=[
   '#!/usr/bin/env node',
   "const fs=require('node:fs'),path=require('node:path');",
   'const program=path.basename(process.argv[1]),args=process.argv.slice(2);',
   "if(process.env.PGPASSWORD!=='s3cret$token'||process.env.PGHOST!=='127.0.0.1')process.exit(15);",
   "fs.appendFileSync(process.env.TEST_P388_LOG,program+' '+args.join(' ')+'\\n');",
   "if(program==='psql'){process.stdout.write('1\\n');process.exit(0);}",
   "if(program==='pg_dump'){",
   " if(args.includes('--schema-only'))process.exit(0);",
   " const destination=args.find(s=>s.startsWith('--file='));",
   " if(!destination)process.exit(17);",
   " fs.writeFileSync(destination.slice('--file='.length),Buffer.alloc(2048,99));",
   " process.exit(0);",
   "}",
   "if(program==='pg_restore'){",
   " if(args.includes('--version')){process.stdout.write('pg_restore (PostgreSQL) 16.4\\n');process.exit(0);}",
   " if(args.includes('--list')){process.stdout.write('1; 1259 33 TABLE public users\\n2; 0 33 TABLE DATA public users\\n');process.exit(0);}",
   "}",
   "process.exit(30);"
  ].join('\n')+'\n';
  for(const name of ['psql','pg_dump','pg_restore'])
   writeFileSync(join(bin,name),mock,{mode:0o700});
  const env={...process.env,PATH:bin+':'+process.env.PATH,
   TEST_P388_LOG:log,DATABASE_URL:'postgresql://jyotish:s3cret%24token@127.0.0.1:5433/galaxiora',
   P388_STATE_ROOT:root};
  const cmd=(...args)=>spawnSync(process.execPath,[helper,...args],{env,encoding:'utf8',timeout:10000});
  let result=cmd('check');
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/P388_NATIVE_PG_READY/);
  const dir=join(root,'backup-20261103T180000Z');mkdirSync(dir,{mode:0o700});
  const dump=join(dir,'production-before.dump');
  result=cmd('backup',dump);
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/P388_NATIVE_PG_BACKUP_TOC_PASS/);
  assert.equal(statSync(dump).mode&0o777,0o600);
  assert.ok(statSync(dump).size>=1024);
  result=cmd('backup',dump);
  assert.notEqual(result.status,0,'never overwrite an existing backup');
  const output=readFileSync(log,'utf8');
  assert.match(output,/pg_dump --schema-only/);
  assert.match(output,/pg_dump -w --format=custom/);
  assert.match(output,/pg_restore --list/);
  assert.ok(!output.includes('s3cret'), 'no password in argv');
  assert.ok(!output.includes('postgresql://'), 'no URL in argv');
  assert.ok(!output.includes('docker '), 'no Docker CLI');
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('P388 invalid backup paths fail closed before pg_dump',()=>{
 const root=mkdtempSync(join(tmpdir(),'p388-archive-safe-'));
 try{
  const env={...process.env,P388_STATE_ROOT:root,
   DATABASE_URL:'postgresql://u:password@localhost:5433/db'};
  for(const bad of ['/tmp/not-a-private-backup.dump',
   '/tmp/backup-20261103T190000Z/production-before.dump']){
   const result=spawnSync(process.execPath,[helper,'backup',bad],{env,encoding:'utf8'});
   assert.notEqual(result.status,0);
   assert.match(result.stderr,/P388_NATIVE_PG_STOP/);
  }
 }finally{rmSync(root,{recursive:true,force:true})}
});
