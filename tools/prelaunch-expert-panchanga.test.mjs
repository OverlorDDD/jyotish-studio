import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contextualEventInsight,eventInsight} from '../packages/jyotish-core/src/astro-education.ts';
import {glossaryParts} from '../apps/web/lib/glossary.ts';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Panchanga guidance depends on real planet and sign, not the same generic advice for every date',()=>{
 const mercury=contextualEventInsight({kind:'sidereal_ingress',body:'Mercury',fromSign:5,toSign:6,atUtc:'2026-11-01T08:00:00Z'},'uk');
 const venus=contextualEventInsight({kind:'sidereal_ingress',body:'Venus',fromSign:6,toSign:7,atUtc:'2026-11-03T18:00:00Z'},'uk');
 assert.notEqual(mercury.tradition,venus.tradition);
 assert.notEqual(mercury.practice,venus.practice);
 assert.match(mercury.tradition,/розмови|документи/);
 assert.match(venus.tradition,/стосунки/);
 assert.match(mercury.meaning,/Діви/);
 assert.match(venus.meaning,/Терезів/);
 const local=contextualEventInsight({kind:'retrograde_station',body:'Mercury'},'uk');
 assert.match(local.practice,/повідомлення/);
 assert.notEqual(local.practice,eventInsight('retrograde_station','uk').practice);
 const en=contextualEventInsight({kind:'sidereal_ingress',body:'Mars',toSign:1},'en');
 assert.match(en.tradition,/initiative/);
 assert.match(en.meaning,/Aries/);
});

test('Vedic calendar eliminates repeated lunar month and keeps actual month field',()=>{
 const calendar=source('apps/web/app/components/VedicFestivalPanel.tsx');
 assert.doesNotMatch(calendar,/month:'Місячний місяць'/);
 assert.match(calendar,/month:'Місяць за ведичним календарем'/);
 assert.match(calendar,/localMonth\(d\.moonMonth\.name\)/);
});

test('Panchanga, Calendar, News and Horoscope use shared glossary for incoming prose',()=>{
 for(const path of [
  'apps/web/app/components/PanchangaHub.tsx',
  'apps/web/app/components/VedicFestivalPanel.tsx',
  'apps/web/app/components/AstronomicalEventsPanel.tsx',
  'apps/web/app/components/PersonalPanchanga.tsx',
  'apps/web/app/components/NewsWorld.tsx',
  'apps/web/app/components/HoroscopeHub.tsx'
 ]){
  assert.match(source(path),/GlossaryText/,path);
 }
 for(const term of ['Панчанга','тітхі','Екадаші','Пурніманта','Санкранті','Абхіджіт','Чандрабала','ретроградність']){
  assert.equal(glossaryParts(term).filter(x=>x.entry).length,1,term);
 }
});

test('expert question is sent only with explicit consent and never exposes older private questions',()=>{
 const sql=source('apps/api/prisma/migrations/20261028165000_tarot_expert_inquiries/migration.sql');
 const schema=source('apps/api/prisma/schema.prisma');
 const api=source('apps/api/src/reading-orders.ts');
 const admin=source('apps/api/src/admin.ts');
 const frontend=source('apps/web/app/components/ExpertQuestionForm.tsx');
 const dashboard=source('apps/web/app/components/AdminExpertRequests.tsx');
 const header=source('apps/web/app/components/GlobalAccount.tsx');
 assert.match(sql,/ADD COLUMN "expertSubmittedAt"/);
 assert.match(schema,/expertSubmittedAt DateTime\?/);
 assert.match(api,/@Post\('questions\/expert'\)/);
 assert.match(api,/body\.privacyConsent!==true/);
 assert.match(api,/expertSubmittedAt:now/);
 assert.match(admin,/@Get\('expert-requests'\)/);
 assert.match(admin,/@Patch\('expert-requests\/:id\/review'\)/);
 assert.match(admin,/this\.requireAdmin\(req\)/);
 assert.match(admin,/expertSubmittedAt:\{not:null\}/);
 assert.match(admin,/if\(!sameOrigin\(req\)\)/);
 assert.match(frontend,/SENT_TO_EXPERT_INBOX/);
 assert.match(frontend,/https:\/\/t\.me\/Galaxiora/);
 assert.match(frontend,/privacyConsent:consent/);
 assert.match(dashboard,/expertReviewedAt/);
 assert.match(header,/expertUnread>0/);
 assert.doesNotMatch(frontend,/paymentProvider|paymentToken/);
 assert.doesNotMatch(frontend,/minLength=/,'No UI minimum character restriction for human expert questions');
 assert.match(frontend,/\.\/ExpertQuestionForm\.module\.css/);
 const css=source('apps/web/app/components/ExpertQuestionForm.module.css');
 assert.match(css,/\.form textarea/);
 assert.match(css,/color-scheme:dark/);
 const apiDto=api.slice(api.indexOf('export class ExpertInquiryDto'),api.indexOf('const allowDraft'));
 assert.doesNotMatch(apiDto,/@Length\(|@MinLength\(/,'Expert inquiry must not inherit old draft minimums');
 assert.match(api,/context=\(body\.context\|\|''\)\.trim\(\)/);
 assert.match(frontend,/адміністратору/);
 assert.match(source('apps/web/app/components/PrivateTarotQuestions.tsx'),/as-expert-drafts/);
});
