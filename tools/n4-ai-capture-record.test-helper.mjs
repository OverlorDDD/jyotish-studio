import {appendFileSync,existsSync,lstatSync,statSync} from 'node:fs';
import {n4SafeLocalOutput} from './n4-ai-capture-path.mjs';
function secureAppend(dest,value){
 const file=n4SafeLocalOutput(dest);
 if(existsSync(file)){
  if(lstatSync(file).isSymbolicLink())throw Error('Symlinked audit files are forbidden');
  if(process.platform!=='win32'&&(statSync(file).mode&0o077)!==0)
   throw Error('Audit file must be private chmod 600');
 }
 appendFileSync(file,JSON.stringify(value)+'\n',{mode:0o600,flag:'a'});
}
export function saveN4SyntheticAttempt(dest,entry){
 if(!/^N4-SYNTH-\d{2}-(uk|en)-[AB]$/.test(entry?.id||''))
  throw Error('Only approved synthetic audit sample IDs may be recorded');
 const good=typeof entry.model==='string'&&entry.model.length>0&&
  typeof entry.text==='string'&&entry.text.length>=900;
 if(good)secureAppend(dest,entry);
 else secureAppend(dest+'.failures.jsonl',{...entry,text:null,model:entry.model||null,
  failureReason:entry.failureReason||'incomplete'});
 return good;
}
