import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import profile from '../apps/web/lib/portfolio-profile.json' with {type:'json'};

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root=source('apps/web/app/page.tsx');
const localized=source('apps/web/app/[locale]/page.tsx');
const shell=source('apps/web/app/components/PortalShell.tsx');
const page=source('apps/web/app/[locale]/about-me/page.tsx');
const component=source('apps/web/app/components/DeveloperPortfolio.tsx');
const sitemap=source('apps/web/app/sitemap.ts');

test('GP1 root is a real natal form; localized home aliases go to canonical chart routes',()=>{
 assert.match(root,/JyotishCalculator initialLang="en"/);
 assert.match(root,/PortalShell locale="en" active="astrology"/);
 assert.match(root,/canonical:'\/'/);
 assert.doesNotMatch(root,/permanentRedirect|PortalHome/);
 assert.match(localized,/permanentRedirect\(portalPath\(locale,'astrology\/jyotish'\)\)/);
 assert.match(shell,/portalPath\(locale,'about-me'\)/);
 assert.match(shell,/t\.aboutMe/);
 assert.match(sitemap,/url:base\+'\/'/);
});
test('GP1 person resume metadata, actual links, localization and official Galaxiora brand remain distinct',()=>{
 for(const lang of ['en','uk']){
  const p=profile[lang];
  assert.ok(p.profile.length>150);
  assert.ok(p.projects.length===2);
  assert.ok(p.expertise.length===4);
  assert.match(p.startupText,/Galaxiora/);
 }
 assert.match(page,/indexRobots\(\)/);
 assert.match(page,/ProfilePage/);
 assert.match(page,/Person/);
 assert.match(page,/canonical:'\/'\+locale\+'\/about-me'/);
 assert.match(component,/download/);
 assert.match(component,/open-works/);
 assert.match(component,/support|Support|Підтримати/);
 assert.match(profile.contact.github,/github\.com\/OverlorDDD/);
 assert.match(profile.contact.website,/galaxiora\.com/);
});
test('GP1 all 4 downloadable resumes are real committed binaries, not print placeholders',()=>{
 for(const lang of ['en','uk']){
  const pdf='apps/web/public/resume/denys-avramenko-cv.'+lang+'.pdf';
  const word='apps/web/public/resume/denys-avramenko-cv.'+lang+'.docx';
  assert.ok(existsSync(new URL('../'+pdf,import.meta.url)),pdf+' missing');
  assert.ok(existsSync(new URL('../'+word,import.meta.url)),word+' missing');
  assert.equal(sourceBinary(pdf).subarray(0,4).toString('ascii'),'%PDF');
  assert.equal(sourceBinary(word).subarray(0,2).toString('ascii'),'PK');
 }
});
function sourceBinary(p){return readFileSync(new URL('../'+p,import.meta.url));}
