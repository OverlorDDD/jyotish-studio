import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isJyotishRuntimeCompatible} from '../apps/web/lib/jyotish-runtime-contract.ts';

const active={
 readerVersion:'6.0.0',
 readerEdition:'reader-v8.0.0-n44',
 editorialEdition:'n48-poetic-evidence-1.0.0',
 interpretationEdition:'n49-unified-evidence-v1',
 presentationEdition:'n493-ranked-patterns-1.0.0',
 verificationContract:'jyotish-integrity-v3'
};
const web=readFileSync(new URL('../apps/web/app/astrology/jyotish/page.tsx',import.meta.url),'utf8');

test('N502 AI writer upgrades are not mistaken for an incompatible natal Reader',()=>{
 for(const pipeline of ['direct-v2','direct-v3','direct-v4','some-next-free-cloud-writer',undefined]){
  assert.equal(isJyotishRuntimeCompatible({...active,pipeline}),true,String(pipeline));
 }
 assert.match(web,/if\(!isJyotishRuntimeCompatible\(data\)\)/);
 assert.doesNotMatch(web,/data\?\.pipeline\s*!==\s*['"]direct-v2['"]/);
});

test('N502 never allows an incompatible reader or integrity contract',()=>{
 for(const [key,bad] of [
  ['readerVersion','5.0.0'],
  ['readerEdition','reader-v7.0.0-n43'],
  ['editorialEdition','outdated'],
  ['interpretationEdition','outdated'],
  ['presentationEdition','outdated'],
  ['verificationContract','jyotish-integrity-v2']
 ]){
  assert.equal(isJyotishRuntimeCompatible({...active,[key]:bad}),false,key);
 }
 assert.equal(isJyotishRuntimeCompatible(null),false);
 assert.equal(isJyotishRuntimeCompatible({pipeline:'direct-v3'}),false);
});

test('N502 Natal UI can enable AI and local Reader when server contracts match',()=>{
 assert.match(web,/disabled=\{!chart\|\|aiBusy\|\|Boolean\(runtimeMismatch\)\}/);
 assert.match(web,/else setRuntimeMismatch\(''\)/);
 assert.match(web,/if\(!isJyotishRuntimeCompatible\(data\)\)/);
 assert.match(web,/jy-version-warning/);
});
