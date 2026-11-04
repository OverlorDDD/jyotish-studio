import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('N4 is visible immediately after birth form and before AI reading',()=>{
 const page=file('apps/web/app/astrology/jyotish/page.tsx');
 const form=page.indexOf('jy-input-panel'),explorer=page.indexOf('<VargaExplorer chart={chart} lang={lang}/>');
 const ai=page.indexOf('jy-ai-launch'),report=page.indexOf('<DetailedReport');
 assert.ok(form>=0&&explorer>form&&ai>explorer&&report>ai);
 assert.equal(page.includes('<NorthIndianChart'),false,'no distant duplicated Vargas renderer');
 assert.ok(page.includes('jy-data-workspace'),'preserve D1 facts and dasha timeline');
 assert.ok(page.includes("data.verification.digest!==chart.verification?.digest"),'Reader remains integrity-gated');
});
test('N4 explorer renders sixteen actual charts, side-by-side D1 comparison and an accessible selector',()=>{
 const explorer=file('apps/web/app/components/VargaExplorer.tsx');
 const chart=file('apps/web/app/components/NorthIndianChart.tsx');
 for(const s of ['VARGA_INFO','calculateAllVargas','n4-comparison','jy-varga-tabs','aria-pressed','n4-matrix','id="varga-explorer"'])
  assert.ok(explorer.includes(s),s);
 assert.ok(explorer.includes("showDegrees={selected===1||selected===9||selected===10}"),
  'do not invent pseudo-degrees in non-legacy vargas');
 assert.ok(chart.includes('showDegrees=true'),'preserve legacy D1 D9 D10 degrees');
});
test('N4 SEO content is bilingual, indexable and preserves canonical UK/EN routes',()=>{
 const page=file('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 const guide=file('apps/web/app/components/VargaSeoGuide.tsx');
 assert.ok(page.includes('D1–D60'));
 assert.ok(page.includes('<VargaSeoGuide'));
 for(const n of [1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60])
  assert.ok(guide.includes("['D"+n+"'"),'D'+n);
 assert.ok(guide.includes('FAQ')||guide.includes('Faq'));
 assert.ok(page.includes("languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish'"));
 assert.ok(page.includes('indexRobots()'));
 assert.doesNotMatch(guide,/dateOfBirth|localStorage|birthCoordinates|GA4_SECRET/);
});
test('Responsive varga explorer uses one-column chart pairing on mobile',()=>{
 const css=file('apps/web/app/globals.css');
 assert.ok(css.includes('.n4-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));'),'desktop varga pairing is 2 columns');
 assert.ok(css.includes('.n4-comparison{grid-template-columns:minmax(0,1fr)}'));
 assert.ok(css.includes('.n4-tabs button:focus-visible'));
});
