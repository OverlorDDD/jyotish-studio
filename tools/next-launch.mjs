import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const command=process.argv[2];
if(!['dev','start'].includes(command)){console.error('Expected dev or start');process.exit(2);}
const port=Number(process.env.WEB_PORT||3000);
if(!Number.isInteger(port)||port<1024||port>65535){console.error('Invalid WEB_PORT');process.exit(2);}
const root=resolve(here,'..');
const child=spawn(process.execPath,['--env-file='+resolve(root,'.env'),resolve(root,'node_modules/next/dist/bin/next'),command,'--port',String(port)],{cwd:resolve(root,'apps/web'),stdio:'inherit',env:process.env});
child.on('error',err=>{console.error(err.message);process.exitCode=1});
child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0)});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>child.kill(sig));
