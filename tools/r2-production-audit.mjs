/** R2 non-destructive deployment readiness checklist. No secrets or personal data printed.
 * Distinguishes local private preview from a live production release.
 */
import {existsSync,readFileSync} from 'node:fs';
import {publicSiteOrigin,publicIndexingEnabled} from '../apps/web/lib/site-indexing.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const errors=[],warnings=[],passes=[];
function check(condition,success,failure){if(condition)passes.push(success);else errors.push(failure)}
const origin=publicSiteOrigin();
const publicMode=process.env.SITE_NOINDEX==='0';
const secret=process.env.AUTH_SECRET||'';
check(secret.length>=32,'Signed-session secret configured','AUTH_SECRET must be at least 32 characters');
check(Boolean(process.env.DATABASE_URL?.startsWith('postgresql://')||process.env.DATABASE_URL?.startsWith('postgres://')),
 'PostgreSQL configured','DATABASE_URL must point to PostgreSQL');
if(!publicMode){
 warnings.push('Private NOINDEX preview: this is NOT a public SEO certification');
 if(process.env.NEXT_PUBLIC_SITE_URL&&!origin)warnings.push('Site URL supplied but is not a valid external HTTPS origin');
}else{
 check(Boolean(origin),'External HTTPS origin configured','Set NEXT_PUBLIC_SITE_URL to the owned HTTPS domain before SITE_NOINDEX=0');
 check(publicIndexingEnabled(),'Public index switch and URL agree','Site remains non-indexable');
 check(process.env.SESSION_COOKIE_SECURE==='1','HTTPS-only session cookies enabled','Set SESSION_COOKIE_SECURE=1 on HTTPS production');
 check(Boolean(process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL&&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL)),
  'Public privacy contact configured','Set NEXT_PUBLIC_SITE_CONTACT_EMAIL before public launch');
 // Legal identity disclosures require a jurisdiction-specific review; do not
 // force a private individual's name into a public environment variable.
 check(process.env.PUBLIC_REGISTRATION_ENABLED==='1',
  'Public signup explicitly enabled','PUBLIC_REGISTRATION_ENABLED=1 is required for open registration');
 for(const name of ['TURNSTILE_SECRET_KEY','NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'RESEND_API_KEY','RESEND_FROM_EMAIL']){
  check(Boolean(process.env[name]?.trim()),name+' configured',name+' is required for protected signup');
 }
}
const files=[
 'apps/web/app/robots.ts','apps/web/app/sitemap.ts','apps/web/lib/site-indexing.ts',
 'apps/web/app/[locale]/methodology/page.tsx',
 'tools/backup-db.ps1','tools/site-preflight.mjs','tools/release-launch-verify.mjs',
 'apps/api/src/auth.ts','apps/api/src/registration-security.ts',
 'apps/web/app/[locale]/privacy/page.tsx','apps/web/app/[locale]/terms/page.tsx',
 'apps/api/src/news-domain.ts',
 'apps/api/src/news-editorial-coverage.ts','tools/news-release-gate.mjs'
];
for(const p of files)check(existsSync(p),'Present: '+p,'Missing required file: '+p);
const robots=existsSync('apps/web/app/robots.ts')?readFileSync('apps/web/app/robots.ts','utf8'):'';
const mw=existsSync('apps/web/middleware.ts')?readFileSync('apps/web/middleware.ts','utf8'):'';
check(robots.includes('OAI-SearchBot'),'OAI search crawler has a documented public rule','Missing public OAI crawler policy');
check(robots.includes('/uk/personal'),'Private personal URLs excluded from public robots','Personal URLs absent from robots disallow');
check(mw.includes('X-Content-Type-Options')&&mw.includes('X-Frame-Options'),
 'Basic security headers configured','Missing defensive response headers');
if(!existsSync('docs/operations/galaxiora-r2-r3-audit-2026-10-28.md'))
 errors.push('R2/R3 operating and launch guide missing');
warnings.push('Unverified until external HTTPS probe: TLS chain, CDN bot filtering, firewall, recovery drill, Core Web Vitals and Search Console');
warnings.push('Unverified until live database probe: news translation eligibility, active feeds, licenses and photo attribution');
warnings.push('Verify privacy notice, administrator identity/contact, retention and user consent before accepting real public inquiries');
for(const x of passes)console.log('PASS',x);
for(const x of warnings)console.warn('CHECK',x);
for(const x of errors)console.error('BLOCKED',x);
console.log(JSON.stringify({stage:'R2',mode:publicMode?'PRODUCTION':'PRIVATE_PREVIEW',
 status:errors.length?'BLOCKED':publicMode?'CONFIG_READY_NOT_DEPLOYED':'PREVIEW_CONFIG_READY',
 passes:passes.length,warnings:warnings.length,blockers:errors.length,origin:origin||null},null,2));
process.exitCode=errors.length?2:0;
