// Jyotish standalone public preview. Production Next build, private Nest API, preserved Docker volume.
import {spawn,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,readFileSync} from 'node:fs';
import net from 'node:net';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),win=process.platform==='win32';
const args=process.argv.slice(2),port=3001,api=4001;
const children=[];let stopping=false;
const info=(m)=>console.log('[jyotish-public] '+m);
function envFile(){
 const p=resolve(root,'.env');if(!existsSync(p))throw Error('Root .env missing');
 const v={};for(const line of readFileSync(p,'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Za-z_]\w*)=(.*)$/);if(m)v[m[1]]=m[2].trim().replace(/^["']|["']$/g,'');
 }return v;
}
function available(name){const r=spawnSync(win?'where.exe':'which',[name],{encoding:'utf8'});return r.status===0;}
function cmd(program,argv=[],env={}){
 const w=win&&['npm','docker','cloudflared'].includes(program);
 const p=w?'cmd.exe':program;
 const a=w?['/d','/s','/c',program+' '+argv.join(' ')]:argv;
 return {p,a,env:{...process.env,...env}};
}
function run(program,argv,cwd=root,env={}){
 const c=cmd(program,argv,env);
 const r=spawnSync(c.p,c.a,{cwd,env:c.env,encoding:'utf8',timeout:180000,windowsHide:true});
 if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);
 if(r.status!==0)throw Error(program+' '+argv.join(' ')+' failed. Stop here and inspect the log.');
}
function launch(name,program,argv,env={},cwd=root){
 const c=cmd(program,argv,env);
 const child=spawn(c.p,c.a,{cwd,env:c.env,stdio:['ignore','pipe','pipe']});
 children.push(child);
 for(const stream of [child.stdout,child.stderr]){
  let remain='';stream.on('data',chunk=>{
   remain+=String(chunk);const lines=remain.split(/\r?\n/);remain=lines.pop()||'';
   for(const line of lines)if(line.trim()){console.log('['+name+'] '+line);
    if(name==='cloudflared'){const url=line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);if(url)info('PUBLIC URL: '+url[0]);}
   }
  });
 }
 child.on('error',e=>console.error('['+name+'] '+e.message));
 child.on('exit',code=>{if(!stopping)console.error('['+name+'] stopped ('+code+'). The other services stay running.');});
}
function testPort(n){return new Promise((ok,fail)=>{
 const s=net.createServer();s.once('error',e=>fail(Error('Port '+n+' busy ('+e.code+')')));
 s.listen(n,'127.0.0.1',()=>s.close(ok));});
}
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
async function until(label,check,limit=90000){
 const end=Date.now()+limit;while(Date.now()<end){try{if(await check()){info(label+' ready');return;}}catch{}
  await wait(800);}
 throw Error(label+' not ready; inspect previous logs.');
}
async function http(url){try{const r=await fetch(url,{signal:AbortSignal.timeout(2200)});return r.status>=200&&r.status<500;}catch{return false;}}
function dbReady(){
 const r=spawnSync(win?'cmd.exe':'docker',win?['/d','/s','/c','docker inspect --format {{.State.Health.Status}} jyotish-db']:['inspect','--format','{{.State.Health.Status}}','jyotish-db'],{encoding:'utf8',timeout:4500});
 return r.status===0&&r.stdout.trim()==='healthy';
}
async function shutdown(){
 if(stopping)return;stopping=true;info('Stopping services and tunnel; PostgreSQL data is preserved.');
 for(const c of [...children].reverse())if(c.pid&&c.exitCode===null){
  if(win)spawnSync('taskkill',['/PID',String(c.pid),'/T','/F'],{stdio:'ignore',timeout:6000});
  else c.kill('SIGTERM');
 }
}
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>void shutdown().then(()=>process.exit(0)));
async function main(){
 if(!available('docker'))throw Error('Docker Desktop/CLI required');
 if(!existsSync(resolve(root,'node_modules')))throw Error('Dependencies missing: run npm install manually');
 const e=envFile();
 if((e.AUTH_SECRET||process.env.AUTH_SECRET||'').length<32)throw Error('Set strong AUTH_SECRET in local .env before opening to the internet');
 if(e.AI_MODE==='paid_openai')throw Error('Paid AI_MODE blocked in public demonstration; set AI_MODE=free or local in .env');
 await testPort(port);await testPort(api);
 run('docker',['compose','up','-d','db']);
 await until('PostgreSQL',dbReady,120000);
 run('npm',['run','db:generate']);
 run('npm',['run','db:migrate']);
 const overrides={PORT:String(api),WEB_PORT:String(port),INTERNAL_API_ORIGIN:'http://127.0.0.1:'+api};
 info('Production build for public use');
 run('npm',['run','build'],root,overrides);
 launch('api','npm',['run','dev:api'],overrides);
 launch('web','npm',['run','start','-w','@jyotish/web'],overrides);
 await until('Nest API',()=>http('http://127.0.0.1:'+api+'/api/health'));
 await until('Next web',()=>http('http://127.0.0.1:'+port+'/'));
 info('LOCAL URL: http://localhost:'+port);
 if(!available('cloudflared')){info('Cloudflared not installed; web remains available locally. See README.');}
 else {launch('cloudflared','cloudflared',['tunnel','--url','http://localhost:'+port]);info('Waiting for Cloudflare temporary HTTPS URL ...');}
 await new Promise(()=>{});
}
main().catch(e=>{console.error('[jyotish-public] '+e.message);void shutdown().then(()=>process.exit(1))});
