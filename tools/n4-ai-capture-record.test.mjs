import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {saveN4SyntheticAttempt} from './n4-ai-capture-record.test-helper.mjs';
test('model failure does not poison accepted corpus and cannot leak discarded prose',()=>{
 const dir=mkdtempSync(join(tmpdir(),'n4-actual-model-')),f=join(dir,'audit.jsonl');
 assert.equal(saveN4SyntheticAttempt(f,{id:'N4-SYNTH-01-uk-A',model:'groq',text:'Reasoned synthetic reading. '.repeat(50)}),true);
 assert.equal(saveN4SyntheticAttempt(f,{id:'N4-SYNTH-01-uk-B',model:null,text:'PARTIAL_UNSAFE',
  failureReason:'rate_limited'}),false);
 assert.equal(readFileSync(f,'utf8').trim().split('\n').length,1);
 assert.equal(readFileSync(f+'.failures.jsonl','utf8').trim().split('\n').length,1);
 assert.ok(!readFileSync(f+'.failures.jsonl','utf8').includes('PARTIAL_UNSAFE'));
 if(process.platform!=='win32')assert.equal(statSync(f).mode&0o077,0);
 assert.throws(()=>saveN4SyntheticAttempt(f,{id:'REAL-PERSON',model:'x',text:'x'}),/synthetic/);
});
