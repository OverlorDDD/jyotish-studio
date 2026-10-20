import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEditorial,mayEdit,transitionPolicy,canWrite,EditorialError} from '../apps/api/src/editorial-policy.ts';
import {readFileSync} from 'node:fs';
import {parseQuizChoices,quizChoiceCountMessage} from '../apps/web/lib/editorial-quiz.ts';
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
test('A6 yoga safety optional and custom breathing timing excluded',()=>{
 const yoga={title:both('М’яка розминка','Gentle mobility'),summary:both('Зручні рухи у своєму темпі без болю.','Comfortable movement at a pace of your choosing.'),
  body:both('Обери зручну позу. '.repeat(7),'Choose a comfortable starting posture. '.repeat(4)),
  safety:both('При болю або дискомфорті припини вправу, звернися до фахівця за потреби.','Stop if movement is painful or uncomfortable and ask a professional if appropriate.')};
 assert.equal(validateEditorial('YOGA','gentle-moving','mobility',yoga).topic,'mobility');
 assert.throws(()=>validateEditorial('YOGA','breath-test','breathing',yoga),EditorialError);
 const without=validateEditorial('YOGA','new-moving','mobility',{title:yoga.title,summary:yoga.summary,body:yoga.body});
 assert.equal(without.document.safety,undefined);
 assert.equal(validateEditorial('YOGA','other-moving','mobility',yoga).document.safety.uk,yoga.safety.uk);
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

test('A6 writing: long articles, long choices and short valid answers',()=>{
 const long={...article,
  title:{uk:'Назва',en:'Title'},
  summary:{uk:'Опис',en:'Desc'},
  body:{uk:'Текст '.repeat(9000),en:'Text '.repeat(9000)},
  quiz:{...article.quiz,question:{uk:'Чому?',en:'Why?'},
   choices:[{uk:'А',en:'A'},{uk:'Б',en:'B'},{uk:'В',en:'C'}],
   explanation:{uk:'Так!',en:'Yes!'}}};
 const valid=validateEditorial('ACADEMY','long-article','jyotish',long);
 assert.equal(valid.document.body.uk.length,long.body.uk.length);
 assert.equal(valid.document.quiz.choices[1].uk,'Б');
 assert.equal(valid.document.quiz.explanation.uk,'Так!');
 assert.throws(()=>validateEditorial('ACADEMY','overly-long-article','jyotish',
  {...long,body:{uk:'а'.repeat(120001),en:long.body.en}}),EditorialError);
});

test('A6 textarea quiz parser: blank spacers, Windows newlines, trim and extra answers',()=>{
 assert.deepEqual(parseQuizChoices('один\n\n два \n\nтри\n'),['один','два','три']);
 assert.deepEqual(parseQuizChoices('one\r\n\r\n two\r\n three\r\n'),['one','two','three']);
 assert.deepEqual(parseQuizChoices('one\n \n two\nthree\nFOUR'),['one','two','three','FOUR']);
 assert.match(quizChoiceCountMessage('one\n\ntwo\nthree',false),/3 of 3/);
 assert.match(quizChoiceCountMessage('один\n\nдва',true),/2 з 3/);
});
