import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEditorial,mayEdit,transitionPolicy,canWrite,EditorialError} from '../apps/api/src/editorial-policy.ts';
import {readFileSync} from 'node:fs';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const both=(uk,en)=>({uk,en});
const article={
 title:both('Вступ до традиції','An introduction to tradition'),
 summary:both('Вивчай традиції обережно, без перебільшень.','Learn about traditions without exaggeration.'),
 body:both('Це освітній матеріал українською мовою. '.repeat(8),'This is an educational article about historical approaches and their important boundaries. '.repeat(4)),
 quiz:{question:both('Яка основна мета цього матеріалу?','What is the main purpose of this material?'),
  choices:[both('Навчання','Learning'),both('Діагноз','Diagnosis'),both('Пророцтво','Prophecy')],correct:0,
  explanation:both('Тут вивчають історичний і культурний контекст.','This educational reading focuses on historical and cultural context.')}
};
test('A6 document contract: bilingual required, normalized slug, topic allowlist and mandatory quiz',()=>{
 const valid=validateEditorial('ACADEMY','new-jyotish-topic','jyotish',article);
 assert.equal(valid.document.quiz.correct,0);
 assert.throws(()=>validateEditorial('ACADEMY','UPPER','jyotish',article),EditorialError);
 assert.throws(()=>validateEditorial('ACADEMY','x','medicine',article),EditorialError);
 assert.throws(()=>validateEditorial('ACADEMY','new-topic','jyotish',{...article,quiz:undefined}),EditorialError);
 assert.throws(()=>validateEditorial('ACADEMY','new-topic','jyotish',{...article,unexpected:'ignored'}),EditorialError);
 assert.throws(()=>validateEditorial('ACADEMY','nakshatras','jyotish',article),EditorialError);
});
test('A6 yoga requires safety and excludes user-created breathing timing',()=>{
 const yoga={title:both('М’яка розминка','Gentle mobility'),summary:both('Зручні рухи у своєму темпі без болю.','Comfortable movement at a pace of your choosing.'),
  body:both('Обери зручну позу. '.repeat(7),'Choose a comfortable starting posture. '.repeat(4)),
  safety:both('При болю або дискомфорті припини вправу, звернися до фахівця за потреби.','Stop if movement is painful or uncomfortable and ask a professional if appropriate.')};
 assert.equal(validateEditorial('YOGA','gentle-moving','mobility',yoga).topic,'mobility');
 assert.throws(()=>validateEditorial('YOGA','breath-test','breathing',yoga),EditorialError);
 assert.throws(()=>validateEditorial('YOGA','new-moving','mobility',{...yoga,safety:undefined}),EditorialError);
 assert.throws(()=>validateEditorial('YOGA','gentle-breath','mobility',yoga),EditorialError);
});
test('A6 roles and transitions enforce editorial approval',()=>{
 assert.equal(canWrite('SUPPORT'),true);assert.equal(canWrite('MEMBER'),false);
 assert.equal(transitionPolicy('submit','DRAFT','SUPPORT'),'IN_REVIEW');
 assert.throws(()=>transitionPolicy('approve','IN_REVIEW','SUPPORT'),EditorialError);
 assert.equal(transitionPolicy('approve','IN_REVIEW','ADMIN'),'APPROVED');
 assert.equal(transitionPolicy('publish','APPROVED','ADMIN'),'PUBLISHED');
 assert.equal(transitionPolicy('archive','PUBLISHED','ADMIN'),'ARCHIVED');
 assert.equal(transitionPolicy('reopen','ARCHIVED','ADMIN'),'DRAFT');
 assert.throws(()=>transitionPolicy('publish','DRAFT','ADMIN'),EditorialError);
 assert.throws(()=>mayEdit('SUPPORT','PUBLISHED'),EditorialError);
 assert.doesNotThrow(()=>mayEdit('SUPPORT','DRAFT'));
});
test('A6 routes, ownership and public read boundary',()=>{
 assert.ok(src('apps/api/src/editorial-prisma.ts').includes('updateMany({where:{id,revision,status:'));
 assert.ok(src('apps/api/src/editorial.ts').includes('sameOrigin(req)'));
 assert.ok(src('apps/api/src/editorial.ts').includes("status:'PUBLISHED'"));
 assert.ok(src('apps/web/app/[locale]/learn/[slug]/page.tsx').includes("publishedDetail('ACADEMY'"));
 assert.ok(src('apps/web/app/[locale]/yoga/[slug]/page.tsx').includes("publishedDetail('YOGA'"));
 assert.ok(src('apps/web/app/sitemap.ts').includes('publishedList'));
 assert.ok(!src('apps/web/lib/editorial-public.ts').includes('@prisma/client'));
});
