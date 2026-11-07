import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('N4.14 historical law provenance is scoped and cannot be treated as full timezone approval',()=>{
 const ledger=JSON.parse(readFileSync(new URL('./n4-14-historical-source-ledger.json',import.meta.url),'utf8'));
 assert.equal(ledger.version,'n4.14-historical-legal-provenance-v1');
 assert.equal(ledger.events.length,2);
 assert.deepEqual(ledger.events.map(x=>x.id),['UA-1990-JUL-CHANGE','SAMOA-2011-DATE-LINE']);
 assert.ok(ledger.events.every(x=>x.sourceUrl.startsWith('https://')));
 assert.ok(ledger.events.every(x=>x.reviewerAccepted===false));
 assert.equal(ledger.allHistoricalOffsetsCertified,false);
 assert.equal(ledger.allD60TimeInputsCertified,false);
 assert.equal(ledger.canEnablePublicD60,false);
});
