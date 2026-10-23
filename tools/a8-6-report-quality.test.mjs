import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildAiChapterSpecs,CHAPTER_IDS,parseAiConsultation,removeConsultationBoilerplate} from '../apps/api/src/consultation-ai.ts';
import {classicalLordshipTable} from '../apps/api/src/reader-classical.ts';

const f=(id,topic,meaning,evidence=[])=>({
 id,topic,ruleId:'RULE_'+id,traditionalMeaning:meaning,verifiedEvidence:evidence,
 supportingFactors:[],counterFactors:[],limitations:[]
});
const source={
 chapters:CHAPTER_IDS.map(id=>({
  id,title:id,evidence:['section='+id],
  paragraphs:id==='relationships'?[
   'У D1 сьомим домом керує Сатурн, у дев’ятому домі. Венера має власні натальні ролі.',
   'Навамша D9 має лагну у Леві; Венера в D9 розташована в четвертому домі.'
  ]:id==='career'?[
   'У D1 Марс керує професійним десятим домом.',
   'Дашамша D10 має лагну у Леві; Марс у D10 стоїть у першому домі.'
  ]:id==='timing'?[
   'Махадаша Сатурна триває з 2020-01-01 до 2035-01-01.',
   'Антардаша Місяця триває з 2026-01-01 до 2027-01-01.'
  ]:[]
 })),
 findings:[
  f('ascendant','portrait','Рак — лагна, Місяць керує першим домом.',['section=portrait']),
  f('moon','portrait','Місяць у дванадцятому домі.'),
  f('concentration','configuration','Сонце, Марс, Меркурій, Сатурн зібралися в дев’ятому домі.'),
  f('yogakaraka-mars','configuration','Марс — йогакарака, управитель п’ятого й десятого.'),
  f('mars-saturn','tensions','Сполучення Марса із Сатурном.'),
  f('partnership','relationships','Сатурн керує сьомим домом.'),
  f('functional-saturn','relationships','Сатурн керує сьомим і восьмим домами.',['house-lord:7=Saturn']),
  f('functional-venus','resources','Венера керує четвертим та одинадцятим домами.',['house-lord:11=Venus']),
  f('functional-mars','career','Марс керує п’ятим і десятим домами.',['house-lord:10=Mars']),
  f('functional-sun','resources','Сонце керує другим домом.',['house-lord:2=Sun']),
  f('vocation','career','D10 уточнює професійні теми.'),
  f('resources','resources','Другий і одинадцятий доми мають різних управителів.'),
  f('active-dasha','timing','Махадаша Сатурна та антардаша Місяця.',['dasha.major=Saturn','dasha.minor=Moon'])
 ]
};

test('A8.6 each of eight sections receives distinct relevant evidence rather than shared 9th house cluster',()=>{
 const specs=buildAiChapterSpecs(source);
 assert.equal(specs.length,8);
 const by=id=>specs.find(s=>s.id===id);
 assert.match(by('configuration').facts.join(' '),/Сонце, Марс, Меркурій, Сатурн/);
 for(const id of ['portrait','relationships','resources','timing']){
  assert.doesNotMatch(by(id).facts.join(' '),/Сонце, Марс, Меркурій, Сатурн/);
 }
 assert.match(by('relationships').facts.join(' '),/Навамша D9/);
 assert.match(by('career').facts.join(' '),/Дашамша D10/);
 assert.match(by('timing').facts.join(' '),/2026-01-01/);
 assert.match(by('resources').facts.join(' '),/другим домом/);
 assert.ok(specs.every(s=>s.focus&&!s.focus.includes('No independent')));
});
test('A8.6 repeated artificial disclaimers are removed without changing chart assertions',()=>{
 const raw='Місяць керує лагною й перебуває у дванадцятому домі. Проте традиційна межа нагадує про умовність цих символів. Його положення вказує на потребу внутрішнього простору.';
 const filtered=removeConsultationBoilerplate(raw);
 assert.match(filtered,/Місяць керує лагною/);
 assert.match(filtered,/внутрішнього простору/);
 assert.doesNotMatch(filtered,/традиційна межа|умовність цих символів/i);
});
const first='Для лагни у Раку управитель особистого шляху Місяць перебуває у дванадцятому домі, через що питання самостійності варто читати разом із потребою у відновленні та приватному просторі. Цей зв’язок відрізняється від загальної характеристики водного знака, адже стосується реального управління першим домом.';
const second='У цій традиції сила такого поєднання проявляється в умінні поєднати турботу про близьких із періодами тиші, коли важливо відновити власні сили. Це не ізоляція за замовчуванням, а конкретна суперечність між зовнішньою відповідальністю та потребою самостійно осмислювати пережите.';
test('A8.6 focused Reader v5 accepts two specific substantial paragraphs; strips policy filler',()=>{
 const specs=[{id:'portrait',title:'Портрет',focus:'Identity only',facts:['Lagna Cancer; lord Moon in twelfth']}];
 const full='[[portrait]]\n'+first+' Проте традиційна межа нагадує про умовність.\n\n'+second;
 const chapters=parseAiConsultation(full,specs,[],classicalLordshipTable(4));
 assert.equal(chapters.length,1);
 assert.equal(chapters[0].paragraphs.length,2);
 assert.doesNotMatch(chapters[0].paragraphs.join(' '),/традиційна межа/i);
});
test('A8.6 short generic LLM prose falls back, and unrelated ninth-house list is not accepted as relationships',()=>{
 const specs=[{id:'relationships',title:'Стосунки',focus:'D1 and D9',facts:['Saturn rules house seven; D9 Venus']}];
 assert.equal(parseAiConsultation('[[relationships]]\n'+first,specs).length,0);
 const intrusion=first+'\n\n'+second+' Концентрація Сонця, Марса, Меркурія і Сатурна є основною темою всіх стосунків.';
 assert.equal(parseAiConsultation('[[relationships]]\n'+intrusion,specs).length,0);
});
test('A8.6 evidence rendering no longer uses empty-bullet list and UI identifies Reader v5',()=>{
 const ui=readFileSync(new URL('../apps/web/app/components/DetailedReport.tsx',import.meta.url),'utf8');
 const a=ui.indexOf('function ChapterEvidence('),b=ui.indexOf('export default function DetailedReport(',a);
 assert.ok(a>=0&&b>a);
 const section=ui.slice(a,b);
 assert.ok(section.includes('reading-evidence-entry'));
 assert.doesNotMatch(section,/<ul>|<li[\s>]/);
 assert.match(ui,/Jyotish Reader v6/);
});
