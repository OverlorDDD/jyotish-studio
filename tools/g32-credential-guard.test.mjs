import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('GSC credential exposure is limited to main read-only reporting step',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/g32-organic-engine.yml',import.meta.url),'utf8');
 const marker='  read-only-reports:\n';
 assert.equal(workflow.includes(marker),true);
 const job=workflow.slice(workflow.indexOf(marker));
 assert.match(job,/github\.ref == 'refs\/heads\/main'/);
 assert.match(job,/github\.event_name == 'schedule'/);
 assert.match(job,/github\.event_name == 'workflow_dispatch'/);
 const step=job.indexOf('      - name: Optional read-only GSC report');
 assert.ok(step>0);
 const before=job.slice(0,step);
 const after=job.slice(step);
 assert.doesNotMatch(before,/GSC_SERVICE_ACCOUNT_JSON/);
 assert.match(after,/^        env:\n          GSC_SERVICE_ACCOUNT_JSON:/m);
});
