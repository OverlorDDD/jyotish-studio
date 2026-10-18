import {spawnSync} from 'node:child_process';
const run=(cmd,args)=>spawnSync(cmd,args,{encoding:'utf8',shell:process.platform==='win32',timeout:12000});
const check=run('docker',['info','--format','{{.ServerVersion}}']);
if(check.error||check.status!==0){
 console.error('BLOCKED: Docker Engine is not running. Start Docker Desktop and wait until Engine running.');
 console.error('Then execute: docker info; docker compose up -d db; npm run db:migrate');
 console.error('Do NOT run docker compose down -v or reset the PostgreSQL data volume.');
 process.exit(1);
}
console.log('PASS: Docker Engine reachable, version '+check.stdout.trim());
const containers=run('docker',['compose','ps','--status','running']);
if(containers.status!==0){console.error('Docker Compose status unavailable:',containers.stderr.trim());process.exit(1);}
console.log(containers.stdout.trim());
console.log('Tip: database mapped to 127.0.0.1:5433 and must be healthy before Prisma migration.');
