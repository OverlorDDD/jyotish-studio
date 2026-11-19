import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const page=read('apps/web/app/[locale]/partners/page.tsx');
const styles=read('apps/web/app/[locale]/partners/Partners.module.css');
const footer=read('apps/web/app/components/PortalShell.tsx');
const contact=read('apps/web/app/[locale]/partners/PartnerContactOptions.tsx');
const indexing=read('apps/web/lib/site-indexing.ts');

test('partners is EN/UK and has independent canonical and hreflang metadata',()=>{
 assert.match(page,/BRAND\.locales\.map/);
 assert.match(page,/isPortalLocale\(locale\)/);
 assert.match(page,/canonical:path/);
 assert.match(page,/\/en\/partners/);
 assert.match(page,/\/uk\/partners/);
 assert.match(page,/languagePath="partners"/);
 assert.match(page,/indexRobots\(\)/);
});

test('partner links belong to the footer rather than the main navigation',()=>{
 const nav=footer.split('<nav className="as-main-nav"')[1]?.split('</nav>')[0]??'';
 const footerSection=footer.split('<footer className="as-footer">')[1]??'';
 assert.doesNotMatch(nav,/\/partners/);
 assert.match(footerSection,/\/partners/);
 assert.match(footerSection,/Співпраця/);
 assert.match(footerSection,/Partnerships/);
});

test('partners page participates in canonical public sitemap and SEO rules',()=>{
 assert.match(indexing,/SEO_PATHS=\['about','about-me','partners'/);
 assert.match(page,/publicIndexingEnabled\(\)/);
 assert.match(page,/BreadcrumbList/);
});

test('editorial guardrails and genuinely useful destinations are present',()=>{
 for(const route of ['panchanga','astrology/jyotish','tarot/cards','yoga','pedia']){
  assert.ok(page.includes("path:'"+route+"'"),'missing editorial resource '+route);
 }
 assert.match(page,/We do not promise backlinks/);
 assert.match(page,/не гарантуємо зворотні посилання/);
 assert.match(page,/spiritual interpretations as experimentally verified predictions/);
 assert.match(page,/publicContact/);
 assert.match(page,/support@galaxiora\.com/);
});

test('mobile layout, focus styling and reduced motion are covered',()=>{
 assert.match(styles,/@media\(max-width:600px\)/);
 assert.match(styles, /:focus-visible/);
 assert.match(styles, /prefers-reduced-motion/);
});

test('partnership contact never depends on mailto-only click',()=>{
 assert.match(page,/PartnerContactOptions locale=\{loc\} email=\{publicContact\}/);
 assert.doesNotMatch(page,/href=\{contactHref\}/);
 assert.match(contact,/navigator\.clipboard/);
 assert.match(contact,/document\.execCommand\('copy'\)/);
 assert.match(contact,/mail\.google\.com\/mail/);
 assert.match(contact,/outlook\.live\.com\/mail\/0\/deeplink\/compose/);
 assert.match(contact,/aria-live="polite"/);
 assert.match(contact,/type="email"/);
 assert.match(contact,/target="_blank" rel="noopener noreferrer"/);
 assert.match(styles,/\.contactEmailRow/);
 assert.match(styles,/\.emailProviders/);
});
