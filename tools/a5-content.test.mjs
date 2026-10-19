import test from 'node:test';
import assert from 'node:assert/strict';
import {YOGA_PRACTICES,yogaBySlug} from '../apps/web/lib/yoga-content.ts';
import {ACADEMY_LESSONS,ACADEMY_TOPICS,academyBySlug} from '../apps/web/lib/academy-content.ts';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('A5 Yoga: four original nonempty safe bilingual practices, real durations and steps',()=>{
 assert.equal(YOGA_PRACTICES.length,4);
 assert.equal(new Set(YOGA_PRACTICES.map(x=>x.slug)).size,4);
 for(const practice of YOGA_PRACTICES){
  assert.equal(yogaBySlug(practice.slug),practice);
  assert.ok(practice.steps.length>=4);
  const total=practice.steps.reduce((sum,step)=>sum+step.seconds,0);
  if(practice.category==='breathing')assert.equal(total,16,'editorial phase seconds, not continuous breathing holds');
  else assert.ok(total>=240&&total<=900);
  for(const lang of ['uk','en']){
   for(const value of [practice.title,practice.subtitle,practice.purpose,practice.preparation,practice.safety]){
    assert.ok(value[lang].length>10,practice.slug+' '+lang);
   }
   for(const step of practice.steps){
    assert.ok(step.name[lang].length>=(practice.category==='breathing'?4:6)&&step.guide[lang].length>25&&step.alternative[lang].length>10);
    assert.ok(step.seconds>0&&step.seconds<300);
   }
  }
 }
});
test('A5 Academy: 7 articles across all 3 topics with bilingual paragraphs and quizzes',()=>{
 assert.equal(ACADEMY_LESSONS.length,7);
 assert.equal(new Set(ACADEMY_LESSONS.map(x=>x.slug)).size,7);
 for(const topic of ACADEMY_TOPICS)assert.ok(ACADEMY_LESSONS.some(x=>x.topic===topic.id));
 for(const lesson of ACADEMY_LESSONS){
  assert.equal(academyBySlug(lesson.slug),lesson);
  assert.equal(lesson.sections.length,3);
  assert.equal(lesson.takeaways.length,3);
  assert.equal(lesson.quiz.choices.length,3);
  assert.ok([0,1,2].includes(lesson.quiz.correct));
  for(const lang of ['uk','en']){
   assert.ok(lesson.title[lang].length>9&&lesson.description[lang].length>25);
   for(const section of lesson.sections){
    assert.equal(section.paragraphs.length,2);
    for(const p of section.paragraphs)assert.ok(p[lang].length>100,lesson.slug);
   }
   assert.ok(lesson.quiz.prompt[lang].length>10);
   for(const c of lesson.quiz.choices)assert.ok(c[lang].length>=1);
   assert.ok(lesson.quiz.explanation[lang].length>15);
  }
 }
});
test('A5 route semantics: real detail pages, language-preserving locale switch and public SEO',()=>{
 for(const [mod,p] of [['yoga','apps/web/app/[locale]/yoga/[slug]/page.tsx'],['learn','apps/web/app/[locale]/learn/[slug]/page.tsx']]){
  const route=src(p);
  assert.ok(route.includes('generateStaticParams')&&route.includes('generateMetadata')&&route.includes('notFound()'));
  assert.ok(route.includes('indexRobots()'));
  assert.ok(route.includes("languagePath={"));
  assert.ok(src('apps/web/app/components/PortalSection.tsx').includes(mod==='yoga'?'YogaHub':'AcademyHub'));
 }
 const home=src('apps/web/app/components/PortalHome.tsx');
 assert.ok(home.includes("slug:'yoga'")&&home.includes("slug:'learn'"));
 assert.ok(src('apps/web/app/sitemap.ts').includes('ACADEMY_LESSONS'));
 assert.ok(src('apps/web/app/sitemap.ts').includes('YOGA_PRACTICES'));
});
