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
test('Card artwork: all 78 classic cards re-painted in the site palette (two sizes) and a back; scan map stays pinned',()=>{
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
 const files=readdirSync(new URL('../apps/web/public/tarot/galaxiora/',import.meta.url));
 const big=files.filter(f=>/^[a-z]+-[a-z]+\.webp$/.test(f)),small=files.filter(f=>f.endsWith('-sm.webp'));
 assert.equal(big.length,78);assert.equal(small.length,78);assert.ok(files.includes('back.svg'));
 for(const f of big){const b=readFileSync(new URL('../apps/web/public/tarot/galaxiora/'+f,import.meta.url));
  assert.equal(b.subarray(0,4).toString(),'RIFF',f);assert.equal(b.subarray(8,12).toString(),'WEBP',f);}
 assert.doesNotMatch(read('apps/web/public/tarot/galaxiora/back.svg'),/<script|<image|href="http|foreignObject/i);
 assert.ok(read('apps/web/lib/tarot-art.ts').includes("-sm.webp 300w"));
 assert.ok(card.includes("data-reversed={reversed?'1':undefined}"));
});
