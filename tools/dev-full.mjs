/** Safe local Galaxiora bootstrap. Database readiness comes before Next/Nest.
 * Preserves jyotish-postgres volume. Never runs reset, down -v or destructive migrations.
 */
import {spawnSync} from 'node:child_process';
import {connect} from 'node:net';
import {existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const win=process.platform==='win32';
const error=(message)=>{
 console.error('\n[Galaxiora preflight] BLOCKED: '+message);
 console.error('  1. Launch Docker Desktop and wait for the Linux Engine to be running.');
 console.error('  2. Verify with: docker info');
 console.error('  3. Retry: npm run dev:full');
 console.error('  Existing PostgreSQL data is preserved. Never use docker compose down -v.\n');
 process.exit(1);
};
const run=(cmd,args,timeoutMs=45000)=>{
 const exe=win&&cmd==='docker'?'docker.exe':cmd;
 const result=spawnSync(exe,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:timeoutMs});
 return {ok:result.status===0,stdout:result.stdout||'',stderr:result.stderr||'',
  detail:result.error?.message||(result.stderr||result.stdout||'').trim().slice(-600)};
};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
if(process.argv.includes('--help')){
 console.log('Galaxiora local bootstrap: check Docker, start preserved PostgreSQL volume, generate Prisma, apply migrations, then start website.');
 console.log('Run: npm run dev:full (Docker Desktop must be running first).');
 process.exit(0);
}
if(existsSync(resolve(root,'.env'))&&typeof process.loadEnvFile==='function')process.loadEnvFile(resolve(root,'.env'));
const database=process.env.DATABASE_URL||'';
if(!database)error('DATABASE_URL is missing. Copy .env.example to .env and configure the local database.');
let parsed;
try{parsed=new URL(database);}catch{error('DATABASE_URL is invalid in .env');}
if(!['postgresql:','postgres:'].includes(parsed.protocol))error('Only PostgreSQL is supported in DATABASE_URL.');
const host=parsed.hostname.toLowerCase();
const port=Number(parsed.port||5432);
if(!['localhost','127.0.0.1'].includes(host)||port!==5433){
 console.error('[Galaxiora preflight] Database is configured as '+host+':'+port+' instead of the local Docker mapping localhost:5433.');
 console.error('For a managed database, run migration and startup procedures separately; automatic local Docker provisioning is intentionally disabled.');
 process.exit(1);
}
const docker=run('docker',['info','--format','{{.ServerVersion}}'],9000);
if(!docker.ok)error('Docker Engine cannot be reached: '+docker.detail);
console.log('[Galaxiora preflight] Docker Engine '+docker.stdout.trim()+' is running.');
const up=run('docker',['compose','up','-d','db'],90000);
if(!up.ok)error('Unable to start existing PostgreSQL service: '+up.detail);
console.log('[Galaxiora preflight] Waiting for PostgreSQL to pass its container healthcheck...');
let healthy=false,last='';
for(let n=0;n<60;n++){
 const state=run('docker',['inspect','--format','{{.State.Health.Status}}','jyotish-db'],7000);
 const value=state.stdout.trim();last=value||state.detail;
 if(state.ok&&value==='healthy'){healthy=true;break;}
 if(value==='unhealthy')break;
 await wait(1500);
}
if(!healthy)error('PostgreSQL did not become healthy ('+last+'). Check: docker logs jyotish-db');
const prisma=resolve(root,'node_modules/prisma/build/index.js');
if(!existsSync(prisma))error('Prisma is not installed. Run npm install in the project root first.');
for(const [label,arg] of [['Prisma Client','generate'],['Database migrations','migrate']]){
 console.log('[Galaxiora preflight] '+label+'...');
 const args=['--env-file-if-exists=.env',prisma,arg,...(arg==='generate'?['--schema=apps/api/prisma/schema.prisma']:['deploy','--schema=apps/api/prisma/schema.prisma'])];
 const result=run(process.execPath,args,120000);
 if(!result.ok)error(label+' failed: '+result.detail);
 if(result.stdout.trim())console.log(result.stdout.trim().slice(-1500));
}
/** Catch a previously running Next/Nest process before a new dev:full startup. */
const occupied=(port)=>new Promise(resolve=>{
 const socket=connect({host:'127.0.0.1',port});
 const finish=value=>{socket.destroy();resolve(value);};
 socket.setTimeout(950);
 socket.once('connect',()=>finish(true));
 socket.once('timeout',()=>finish(false));
 socket.once('error',()=>finish(false));
});
for(const [name,port] of [['Next.js',Number(process.env.WEB_PORT||3000)],
                          ['NestJS',Number(process.env.PORT||4000)]]){
 if(!Number.isInteger(port)||port<1024||port>65535)error('Invalid port for '+name);
 if(await occupied(port)){
  console.error('[Galaxiora preflight] '+name+' port '+port+' is already in use.');
  console.error('Stop the old Next/Nest terminal (Ctrl+C). On Windows use Get-NetTCPConnection -LocalPort '+port+' to find the process.');
  console.error('A running old frontend can make it look as though GitHub updates were not applied.');
  process.exit(1);
 }
}
console.log('[Galaxiora preflight] PASS: PostgreSQL healthy, Prisma generated, migrations applied. Starting Next.js and NestJS.');
