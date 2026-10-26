/** C4 operator-only PostgreSQL backup and disposable restore drill.
 * Requires PostgreSQL client binaries. Never restores into source database.
 */
import {spawnSync} from 'node:child_process';
import {mkdirSync,statSync,chmodSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
if(!process.env.DATABASE_URL&&process.env.NODE_ENV!=='production')try{process.loadEnvFile('.env')}catch{}
const args=process.argv.slice(2),value=(k)=>{const i=args.indexOf(k);return i>=0?args[i+1]:undefined};
const output=value('--output');
if(!output){console.error('Usage: node tools/com-db-backup.mjs --output PATH.dump [--drill-url DISPOSABLE_TEST_DATABASE_URL]');process.exit(2)}
function parseUrl(input){
 const url=new URL(input);
 if(!['postgresql:','postgres:'].includes(url.protocol))throw Error('Only PostgreSQL is supported');
 return {host:url.hostname,port:url.port||'5432',user:decodeURIComponent(url.username),
  password:decodeURIComponent(url.password),database:decodeURIComponent(url.pathname.replace(/^\//,'')),
  sslmode:url.searchParams.get('sslmode')||undefined};
}
const source=process.env.DATABASE_URL;
if(!source)throw Error('DATABASE_URL must be supplied (never print it in logs)');
const original=parseUrl(source);
const destination=value('--drill-url')?parseUrl(value('--drill-url')):null;
if(destination){
 if(!process.env.GALAXICOM_DRILL_CONFIRM||process.env.GALAXICOM_DRILL_CONFIRM!=='YES_DISPOSABLE_DATABASE')
  throw Error('Set GALAXICOM_DRILL_CONFIRM=YES_DISPOSABLE_DATABASE for an explicitly disposable target');
 if(destination.host===original.host&&destination.port===original.port&&destination.database===original.database)
  throw Error('Refusing to restore into the source database');
 if(destination.database==='postgres'||destination.database==='template1'||destination.database==='template0')
  throw Error('Refusing to restore into system database');
}
function exec(command,argv,db){
 const env={...process.env,PGHOST:db.host,PGPORT:db.port,PGUSER:db.user,
  PGPASSWORD:db.password,PGDATABASE:db.database,
  ...(db.sslmode?{PGSSLMODE:db.sslmode}:{})};
 const result=spawnSync(command,argv,{env,stdio:'inherit',timeout:10*60_000});
 if(result.error)throw new Error(command+' unavailable or failed: '+result.error.message);
 if(result.status!==0)throw Error(command+' failed with status '+result.status);
}
const filepath=resolve(output);
mkdirSync(dirname(filepath),{recursive:true,mode:0o700});
exec('pg_dump',['--format=custom','--no-owner','--no-acl','--file',filepath],original);
chmodSync(filepath,0o600);
const length=statSync(filepath).size;
if(length<100)throw Error('Archive empty or truncated');
exec('pg_restore',['--list',filepath],original);
console.info(JSON.stringify({status:'BACKUP_VERIFIED',file:filepath,bytes:length,sensitive:true}));
if(destination){
 // Destructive ONLY to an independently supplied, explicitly confirmed disposable DB.
 exec('pg_restore',['--clean','--if-exists','--no-owner','--no-acl','--exit-on-error',
  '--dbname',destination.database,filepath],destination);
 exec('psql',['--tuples-only','--no-align','--command','SELECT count(*) FROM "ComCategory";'],destination);
 console.info(JSON.stringify({status:'DISPOSABLE_RESTORE_DRILL_PASSED',database:destination.database}));
}
