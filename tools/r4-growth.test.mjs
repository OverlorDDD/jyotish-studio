import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R4 keeps 2027 eclipse calendar discoverable in the current Panchanga hero',()=>{
 const hub=read('apps/web/app/components/PanchangaHub.tsx');
 const page=read('apps/web/app/[locale]/panchanga/page.tsx');
 const css=read('apps/web/app/components/PanchangaHub.module.css');
 const hero=hub.indexOf('<header className={styles.cleanHero}>');
 const end=hub.indexOf('</header>',hero);
 const calendar=hub.indexOf("'/eclipses/2027'");
 assert.ok(hero>=0&&end>hero&&calendar>hero&&calendar<end,
  'a visible 2027 calendar link belongs above the observer controls');
 assert.match(hub,/styles\.eclipseShortcut/);
 assert.match(css,/\.eclipseShortcut\{/);
 assert.doesNotMatch(page,/eclipses\/2027/,'do not duplicate a buried card below the guide');
});

test('R4 native share is explicitly public, click-only and privacy-preserving',()=>{
 const share=read('apps/web/app/components/ShareTools.tsx');
 assert.match(share,/navigator.share/);
 assert.match(share,/navigator.clipboard/);
 assert.match(share,/https:\/\/galaxiora.com/);
 assert.match(share,/type="button"/);
 assert.doesNotMatch(share,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|ga\(|gtag\(|fbq\(/);
 const tarot=read('apps/web/app/[locale]/tarot/cards/[slug]/page.tsx');
 const eclipse=read('apps/web/app/[locale]/eclipses/2027/page.tsx');
 assert.match(tarot,/ShareTools/);
 assert.match(eclipse,/ShareTools/);
});
test('R4 does not leak private questions, chart attributes or auth in public sharing',()=>{
 const share=read('apps/web/app/components/ShareTools.tsx');
 for(const field of ['birthTime','birthDate','latitude','longitude','email','question','session','token'])
  assert.ok(!new RegExp('(?:\\bconst\\s+'+field+'\\b|[.]'+field+'\\b|[?&]'+field+'=)','i').test(share),'share must not access '+field);
 assert.match(share,/const safePath=/);
 assert.match(share,/https:\/\/galaxiora.com/);
});
