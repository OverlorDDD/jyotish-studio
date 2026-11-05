/** Offline-only. Never fetches models, writes to the server or prints actual prose. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {n4SafeLocalOutput} from './n4-ai-capture-path.mjs';
import {renderN4BlindReview} from './n4-ai-blind-review-html.mjs';
const source=process.argv[2],output=process.argv[3];
if(!source||!output)throw Error('Usage: node tools/n4-ai-blind-review.mjs /absolute/path/to/48-responses.jsonl /absolute/path/to/review.html');
const input=n4SafeLocalOutput(source),target=n4SafeLocalOutput(output);
if(input===target)throw Error('Input/output paths must differ');
const rows=readFileSync(resolve(input),'utf8').split('\n').filter(Boolean).map(s=>JSON.parse(s));
writeFileSync(target,renderN4BlindReview(rows),{mode:0o600,flag:'w'});
console.log('N4_LOCAL_BLIND_REVIEW_READY pairs=24 synthetic_only=true output='+target);
