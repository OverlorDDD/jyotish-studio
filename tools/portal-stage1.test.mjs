import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('public homepage supports bilingual Galaxiora portal and retains root HTTP 200 entry',()=>{
 const root=code('apps/web/app/page.tsx');
 const localePage=code('apps/web/app/[locale]/page.tsx');
 const home=code('apps/web/app/components/PortalHome.tsx');
 const shell=code('apps/web/app/components/PortalShell.tsx');
 assert.match(root,/PortalHome locale="en"/);
 assert.match(localePage,/generateStaticParams/);
 for(const slug of ['astrology','tarot','yoga','learn','news','community']){
   assert.ok(home.includes("slug:'"+slug+"'"),slug);
   assert.ok(shell.includes("'"+slug+"'"),slug);
 }
 assert.ok(shell.includes('aria-current'));
 assert.ok(home.includes('as-celestial'));
});
test('Jyotish calculator keeps bilingual routes, data flows and complete twelve-sign chart renderer',()=>{
 const old=code('apps/web/app/astrology/jyotish/page.tsx');
 const wrapper=code('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 const renderer=code('apps/web/app/components/NorthIndianChart.tsx');
 const layout=code('apps/web/lib/north-indian-layout.ts');
 for(const token of ['<NorthIndianChart','<AccountPortal','<DetailedReport','calculate','interpret']){
  assert.ok(old.includes(token),token);
 }
 assert.match(renderer,/SOUTH_SIGN_GRID\.map/);
 assert.match(renderer,/chartHouseForSign/);
 assert.match(renderer,/occupants\.map/);
 assert.match(renderer,/jy-south-chart/);
 assert.match(wrapper,/PortalShell/);
 assert.match(layout,/CHART_HOUSES/);
 assert.match(wrapper,/JyotishCalculator initialLang/);
 assert.match(old,/as-back-link/);
});
test('expert intake is never submitted to a fake API or payment system',()=>{
 const intake=code('apps/web/app/components/ReadingIntake.tsx');
 for(const token of ['question.trim().length>=12','context.trim().length>=20','e.preventDefault()','t.privacy','navigator.clipboard.writeText']){
   assert.ok(intake.includes(token),token);
 }
 assert.ok(!/\bfetch\s*\(/.test(intake));
 assert.ok(!/localStorage|sessionStorage/.test(intake)); // data stays in React state
 assert.ok(!/\baxios\s*\(/.test(intake));
 assert.ok(intake.includes('birth is NOT required'));
});
test('portal SEO avoids pretending a domain is registered and leaves API proxy unchanged',()=>{
 const layout=code('apps/web/app/layout.tsx');
 const config=code('apps/web/next.config.mjs');
 const css=code('apps/web/app/globals.css');
 assert.ok(layout.includes('publicSiteOrigin'));
 assert.ok(code('apps/web/lib/site-indexing.ts').includes('NEXT_PUBLIC_SITE_URL'));
 assert.ok(layout.includes('WebSite'));
 assert.ok(css.includes('.as-header')&&css.includes('.as-intake'));
 assert.ok(config.includes('INTERNAL_API_ORIGIN'));
});
