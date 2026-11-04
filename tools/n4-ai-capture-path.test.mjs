import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {n4SafeLocalOutput} from './n4-ai-capture-path.mjs';
test('local audit destinations work on Linux and Windows but never inside source tree',()=>{
 assert.equal(n4SafeLocalOutput('/tmp/n4-audit.jsonl','/opt/galaxiora/app',path.posix),'/tmp/n4-audit.jsonl');
 assert.equal(n4SafeLocalOutput('C:\\N4-Audit\\corpus.jsonl','C:\\galaxiora\\app',path.win32),'C:\\N4-Audit\\corpus.jsonl');
 assert.throws(()=>n4SafeLocalOutput('corpus.jsonl','/opt/galaxiora/app',path.posix),/absolute/);
 assert.throws(()=>n4SafeLocalOutput('/opt/galaxiora/app/audit.jsonl','/opt/galaxiora/app',path.posix),/repository/);
 assert.throws(()=>n4SafeLocalOutput('c:\\GALAXIORA\\app\\report.jsonl','C:\\galaxiora\\app',path.win32),/repository/);
 assert.throws(()=>n4SafeLocalOutput('\\\\server\\share\\report.jsonl','C:\\galaxiora\\app',path.win32),/Network share/);
});
