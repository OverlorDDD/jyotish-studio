/** Cross-platform Python runner. Windows ships Python as 'py -3', not necessarily 'python3'. */
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const script=process.argv[2];
if(!script||!/^tools\/[\w.-]+\.py$/.test(script))throw Error('Expected repository tools/*.py');
const requested=process.env.PYTHON_BIN;
const commands=requested?[{bin:requested,args:requested==='py'?['-3']:[]}]:
 process.platform==='win32'?[{bin:'python',args:[]},{bin:'py',args:['-3']},{bin:'python3',args:[]}]:
 [{bin:'python3',args:[]},{bin:'python',args:[]}];
for(const cmd of commands){
 // Windows Python launcher and PATH Python can refer to separate installations.
 // Select the interpreter with the actual astronomy dependency, not merely the
 // first interpreter responding to --version.
 const probe=spawnSync(cmd.bin,[...cmd.args,'-c','import swisseph'],{
  stdio:'ignore',cwd:process.cwd(),timeout:5000
 });
 if(probe.status!==0)continue;
 const result=spawnSync(cmd.bin,[...cmd.args,resolve(script)],{stdio:'inherit',cwd:process.cwd(),timeout:120000});
 if(result.error?.code==='ENOENT')continue;
 if(result.error){console.error('Python runner: '+result.error.message);process.exitCode=1;break;}
 process.exitCode=result.status??1;
 break;
}
if(process.exitCode===undefined){
 console.error('Python 3 is unavailable. Install Python 3 or set PYTHON_BIN to its executable.');
 process.exitCode=2;
}
