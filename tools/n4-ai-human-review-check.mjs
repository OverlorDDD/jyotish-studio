/** Read only local, de-identified human score exports. */
import {readFileSync} from 'node:fs';
import {n4SafeLocalOutput} from './n4-ai-capture-path.mjs';
import {evaluateN4HumanEditorialReviews} from './n4-ai-human-review-gate.mjs';
const files=process.argv.slice(2);
if(files.length!==2)throw Error('Usage: node tools/n4-ai-human-review-check.mjs /absolute/reviewer1.json /absolute/reviewer2.json');
const reviews=files.map(f=>JSON.parse(readFileSync(n4SafeLocalOutput(f),'utf8')));
const result=evaluateN4HumanEditorialReviews(reviews);
console.log(JSON.stringify(result,null,2));
if(result.issues.length)process.exitCode=2;
