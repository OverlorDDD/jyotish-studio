import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Account login and logout notify the mounted Tarot studio',()=>{
 const account=read('apps/web/app/components/GlobalAccount.tsx');
 const studio=read('apps/web/app/components/TarotStudio.tsx');
 assert.equal(account.split("window.dispatchEvent(new Event('galaxiora:auth-changed'))").length-1,2);
 assert.ok(studio.includes("window.addEventListener('galaxiora:auth-changed',reload)"));
 assert.ok(studio.includes("window.removeEventListener('galaxiora:auth-changed',reload)"));
 assert.ok(studio.includes('setReading(null)'));
 assert.ok(studio.includes('setRemaining(null)'));
 assert.ok(studio.includes('setHistory([])'));
 assert.ok(studio.includes("setError('');setLoading(true)"));
 assert.ok(studio.includes("Повторити перевірку акаунта"));
});

test('Offline Ukrainian tarot prose uses natural accusative event phrases',()=>{
 const code=read('apps/api/src/tarot-reader.ts');
 assert.ok(code.includes('початок може принести '));
 assert.ok(code.includes('Далі розклад натякає на '));
 assert.ok(code.includes('Якщо помітиш '));
 assert.ok(!code.includes('спочатку може проявитися '));
 assert.ok(!code.includes('У розвитку ситуації може втрутитися '));
});
test('Card artwork has 78 mapped classic images and is auto-cached before full launch',()=>{
 const api=read('apps/api/src/tarot.ts');
 const mapping=read('apps/web/lib/tarot-art.ts');
 const prep=read('tools/tarot-assets-prepare.mjs');
 const card=read('apps/web/app/components/TarotCardArt.tsx');
 const pkg=JSON.parse(read('package.json'));
 const rules=read('apps/api/src/tarot-domain.ts');
 assert.ok(rules.includes('ADMIN_LIMIT=100'));
 assert.ok(rules.includes('FREE_LIMIT=3'));
 assert.ok(rules.includes("role==='ADMIN'?ADMIN_LIMIT:FREE_LIMIT"));
 assert.ok(api.includes('TAROT_USE_CASES'));
 assert.ok(mapping.includes("tarot/rider-waite/720px/"));
 assert.ok(mapping.includes("'/tarot/rws/'"));
 assert.ok(prep.includes("count===78"));
 assert.equal(pkg.scripts['predev:full'],'node --experimental-strip-types tools/tarot-assets-prepare.mjs');
 assert.ok(card.includes('tarotArtLocal'));
 assert.ok(card.includes('tarotArtRemote'));
 assert.ok(card.includes("reversed?'is-reversed'"));
});
