import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {n4SyntheticJHoraCase,n4JhdContent,prepareN4JHoraInputCorpus} from './n4-jhora8-windows-prepare.mjs';
test('50 source-identical fake birth records produce genuine JHD inputs, never JHora outputs',()=>{
 const dir=mkdtempSync(join(tmpdir(),'n412-jhd-')),a=prepareN4JHoraInputCorpus(dir);
 assert.equal(a.caseCount,50);
 assert.deepEqual([a.first.id,a.first.date,a.first.time,a.first.latitude,a.first.longitude,a.first.timezoneHours],
 ['N4-SYNTH-001','1990-01-05','05:11',-48,-150,-9]);
 const raw=readFileSync(join(dir,'cases','N4-SYNTH-001.jhd'),'utf8').split('\n');
 assert.deepEqual(raw.slice(0,7),['1','5','1990','5.110000','9.000000','150.000000','-48.000000']);
 assert.equal(raw[12],'N4-SYNTH-001');
 const m=JSON.parse(readFileSync(a.manifest));assert.equal(m.originalJHoraCertificate,false);
 assert.equal(m.cases.length,50);assert.equal(new Set(m.cases.map(c=>c.id)).size,50);
 assert.ok(m.cases.every(c=>c.synthetic));
 assert.deepEqual(a,prepareN4JHoraInputCorpus(dir));
 assert.throws(()=>n4SyntheticJHoraCase(50),/0..49/);
 assert.throws(()=>n4JhdContent({id:'REAL',synthetic:true}),/Synthetic-only/);
});
test('changed local original case cannot silently be overwritten',()=>{
 const dir=mkdtempSync(join(tmpdir(),'n412-guard-'));prepareN4JHoraInputCorpus(dir);
 writeFileSync(join(dir,'cases','N4-SYNTH-001.jhd'),'modified');
 assert.throws(()=>prepareN4JHoraInputCorpus(dir),/differs/);
});
