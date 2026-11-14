import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
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
 // Guests are no longer blocked: a 401 switches the studio to stateless guest readings.
 assert.ok(studio.includes("'/api/v1/tarot/public-readings'"));
});

test('Offline Ukrainian tarot prose uses natural accusative event phrases',()=>{
 const code=read('apps/api/src/tarot-reader.ts');
 assert.ok(code.includes('початок може принести '));
 assert.ok(code.includes('Далі розклад натякає на '));
 assert.ok(code.includes('Порада таролога:'));
 assert.ok(code.includes('Саме зв’язок між цими двома образами'));
 assert.ok(!code.includes('Обери одну конкретну дію, яка відповідає цій темі.'));
 assert.ok(!code.includes('Порівняй його з першою картою'));
 assert.ok(code.includes('difficult.reversed'));
 assert.ok(!code.includes('Карти не свідчать про буквальну катастрофу'));
 assert.ok(!code.includes('Пильнуй, щоб несподіванка'));

 assert.ok(!code.includes('спочатку може проявитися '));
 assert.ok(!code.includes('У розвитку ситуації може втрутитися '));
});
test('Card artwork: the Galaxiora deck ships all 78 cards and a back; the classic scan tooling stays mapped',()=>{
 const api=read('apps/api/src/tarot.ts');
 const mapping=read('apps/web/lib/tarot-art.ts');
 const prep=read('tools/tarot-assets-prepare.mjs');
 const card=read('apps/web/app/components/tarot/TarotArt.tsx');
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
 assert.ok(card.includes('tarotDeckArt'));
 assert.ok(card.includes('TAROT_DECK_BACK'));
 const deck=readdirSync(new URL('../apps/web/public/tarot/galaxiora/',import.meta.url)).filter(f=>f.endsWith('.svg'));
 assert.equal(deck.length,79);
 for(const f of deck){const svg=read('apps/web/public/tarot/galaxiora/'+f);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 520"'),f);
  assert.doesNotMatch(svg,/<script|<image|href="http|foreignObject/i,f);}
 assert.ok(card.includes("data-reversed={reversed?'1':undefined}"));
});
