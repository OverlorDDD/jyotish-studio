import {readFileSync,existsSync} from 'node:fs';
import {n4SafeLocalOutput} from './n4-ai-capture-path.mjs';
import {n4AuditSampleId,N4_LIVE_AUDIT_CORPUS_VERSION} from './n4-ai-synthetic-profiles.mjs';
const file=n4SafeLocalOutput(process.argv[2]||''),rows=existsSync(file)?
 readFileSync(file,'utf8').split('\n').filter(Boolean).map(JSON.parse):[];
const expected=Array.from({length:48},(_,i)=>({...n4AuditSampleId(i),index:i}));
const ids=new Set();
for(const row of rows){
 if(!expected.some(x=>x.id===row.id)||ids.has(row.id)||row.corpus!==N4_LIVE_AUDIT_CORPUS_VERSION||
    !row.model||typeof row.text!=='string')throw Error('Invalid, duplicated, or incomplete audit record');
 ids.add(row.id);
}
const missing=expected.filter(x=>!ids.has(x.id));
const failures=existsSync(file+'.failures.jsonl')?
 readFileSync(file+'.failures.jsonl','utf8').split('\n').filter(Boolean).length:0;
console.log(JSON.stringify({status:missing.length?'INCOMPLETE_NOT_CERTIFIED':'CAPTURE_COMPLETE_EDITORIAL_REVIEW_PENDING',
 accepted:rows.length,expected:48,failedAttempts:failures,nextMissing:missing[0]||null,
 remaining:missing.length,humanReviewRequired:true},null,2));
