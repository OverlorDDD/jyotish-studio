import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R4 places NASA eclipse calendar adjacent to real visibility module, not buried below article',()=>{
 const hub=read('apps/web/app/components/PanchangaHub.tsx');
 const page=read('apps/web/app/[locale]/panchanga/page.tsx');
 const eclipse=hub.indexOf('<EclipsePanel locale={locale}');
 const calendar=hub.indexOf("'/eclipses/2027'");
 assert.ok(eclipse>=0&&calendar>eclipse,'calendar CTA immediately follows local eclipse tool');
 assert.ok(calendar-eclipse<900,'CTA must remain visually adjacent to visibility module');
 assert.doesNotMatch(page,/eclipses\/2027/,'do not duplicate buried card after guide');
 assert.match(hub,/NASA|2027/);
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
