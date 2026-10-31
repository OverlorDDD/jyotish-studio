import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('natal form uses worldwide city suggestions and preserves date and time',()=>{
 const form=source('apps/web/app/astrology/jyotish/page.tsx');
 assert.match(form,/import CitySearch from/);
 assert.match(form,/<CitySearch locale=\{lang\} onChoose=\{chooseCity\}/);
 assert.match(form,/setForm\(old=>\(\{\.\.\.old,latitude:String\(city\.latitude\)/);
 assert.match(form,/timeZone:city\.timeZone,place:/);
 assert.doesNotMatch(form,/<select value=\{preset\}/);
});
test('city selector never searches again after selecting a result',()=>{
 const city=source('apps/web/app/components/CitySearch.tsx');
 assert.match(city,/if\(selected\|\|query\.trim\(\)\.length<2\)/);
 assert.match(city,/onChoose\(c\)/);
 assert.match(city,/resetToken\?:number/);
});
test('privacy notice never renders a personal operator environment variable',()=>{
 const privacy=source('apps/web/app/[locale]/privacy/page.tsx');
 const audit=source('tools/r2-production-audit.mjs');
 const release=source('tools/galaxiora-final-release.sh');
 assert.doesNotMatch(privacy,/NEXT_PUBLIC_OPERATOR_NAME/);
 assert.doesNotMatch(audit,/NEXT_PUBLIC_OPERATOR_NAME/);
 assert.doesNotMatch(release,/NEXT_PUBLIC_OPERATOR_NAME/);
 assert.match(privacy,/Service and contact/);
 assert.match(privacy,/Galaxiora/);
 assert.match(privacy,/support@galaxiora\.com/);
});
