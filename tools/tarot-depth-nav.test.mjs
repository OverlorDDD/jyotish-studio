import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAROT_DEPTH} from '../apps/api/src/tarot-depth.ts';
import {TAROT_DECK,drawCards,describeDraws} from '../apps/api/src/tarot-deck.ts';
import {synthesizeTarot} from '../apps/api/src/tarot-synthesis.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('All 78 cards have individually written, nontrivial EN/UK meanings for both orientations',()=>{
 assert.equal(Object.keys(TAROT_DEPTH).length,78);
 for(const card of TAROT_DECK){
  const detail=TAROT_DEPTH[card.id];
  assert.ok(detail,'missing '+card.id);
  for(const mode of ['upright','reversed'])for(const lang of ['en','uk']){
   assert.ok(detail[mode][lang].length>75,'too short '+card.id+':'+mode+':'+lang);
   assert.ok(detail[mode][lang].includes('.'),'needs an explanation');
  }
 }
 assert.notEqual(TAROT_DEPTH['cups-two'].upright.uk,TAROT_DEPTH['swords-two'].upright.uk);
 assert.notEqual(TAROT_DEPTH['major-death'].upright.en,TAROT_DEPTH['major-death'].reversed.en);
});
test('Draws include position-specific context and reversible extended meanings',()=>{
 for(const spread of ['one','three','celtic']){
  for(let i=0;i<8;i++){
   const drawn=drawCards(spread),cards=describeDraws(drawn,spread);
   assert.equal(cards.length,drawn.length);
   for(const c of cards){
    assert.ok(c.detail.uk.length>75&&c.detail.en.length>75);
    assert.ok(c.positionInsight.uk&&c.positionInsight.en);
    assert.notEqual(TAROT_DEPTH[c.id].upright.uk,TAROT_DEPTH[c.id].reversed.uk);
    assert.equal(c.detail.uk,TAROT_DEPTH[c.id][c.reversed?'reversed':'upright'].uk);
   }
  }
 }
});
test('Questions receive a connected answer, meaningful summary and actions without an LLM',()=>{
 for(const spread of ['one','three','celtic']){
  const reading=drawCards(spread),q='Як прийняти рішення щодо подальших планів?';
  const synthesis=synthesizeTarot(reading,spread,q);
  for(const lang of ['en','uk']){
   assert.ok(synthesis.answer[lang].length>160);
   assert.ok(synthesis.connections[lang].length>120);
   assert.ok(synthesis.reflection[lang].length>120);
   assert.equal(synthesis.steps[lang].length,3);
  }
  assert.ok(synthesis.answer.uk.includes(q));
 }
 assert.ok(!read('apps/api/src/tarot-synthesis.ts').includes('fetch('));
});
test('Tarot experts are nested and legacy /experts links redirect correctly',()=>{
 const section=read('apps/web/app/components/PortalSection.tsx');
 const route=read('apps/web/app/[locale]/[section]/page.tsx');
 const home=read('apps/web/app/components/PortalHome.tsx');
 const nav=read('apps/web/app/components/PortalShell.tsx');
 const profile=read('apps/web/app/components/AccountDashboard.tsx');
 assert.ok(section.includes("section==='tarot'")&&section.includes("<TarotStudio locale={locale}/>"));
 const tarot=read('apps/web/app/components/TarotStudio.tsx');
 const expert=read('apps/web/app/components/ExpertQuestionForm.tsx');
 assert.ok(tarot.includes('<ExpertQuestionForm locale={locale}/>'));
 assert.ok(tarot.includes('<PrivateTarotQuestions locale={locale}/>'));
 assert.ok(expert.includes('id="human-readings"'));
 assert.ok(!section.includes('<ExpertOffer locale={locale}/>'),'The legacy payment form must not duplicate the new inquiry form');
 assert.ok(route.includes("redirect(portalPath(locale,'tarot')+'#human-readings')"));
 assert.ok(profile.includes("portalPath(locale,'tarot')+'#human-readings'"));
 assert.ok(!home.includes("slug:'experts'"));
 assert.ok(!nav.includes("['astrology','tarot','experts'"));
});
test('News and GalaxiCom are discoverable live modules without legacy coming-soon copy',()=>{
 const home=read('apps/web/app/components/PortalHome.tsx');
 const sections=read('apps/web/app/components/PortalSection.tsx');
 const nav=read('apps/web/app/components/PortalShell.tsx');
 for(const slug of ['news','community']){
  assert.ok(home.includes("slug:'"+slug+"'"));
  assert.ok(sections.includes(slug+':{title:'));
  assert.ok(nav.includes("'"+slug+"'"));
 }
 assert.ok(sections.includes("section==='news'")&&sections.includes('<NewsWorld locale={locale}/>'));
 assert.ok(sections.includes("section==='community'")&&sections.includes('<GalaxiCom locale={locale}/>'));
 assert.ok(home.includes("slug:'community'")&&home.includes("live:true"));
 assert.ok(!sections.includes('Жива новинна стрічка ще не працює'));
 assert.ok(!sections.includes('Дописи поки не приймаються'));
});

test('Tarologist advice is grounded in card sequence, not repeated generic instructions',async()=>{
 const {readerReading}=await import('../apps/api/src/tarot-reader.ts');
 const examples=[
  {spread:'one',cards:[{id:'major-star',position:0,reversed:false}]},
  {spread:'three',cards:[{id:'major-star',position:0,reversed:false},{id:'major-tower',position:1,reversed:true},{id:'major-sun',position:2,reversed:false}]}
 ];
 for(const {spread,cards} of examples){
  for(const lang of ['uk','en']){
   const response=readerReading(cards,spread,'Що показує цей розклад?',lang);
   assert.ok(response.advice.length>90);
   assert.ok(!response.advice.includes('Обери одну конкретну дію'));
   assert.ok(!response.advice.includes('Choose one concrete action'));
   if(cards.length>1)assert.ok(response.advice.includes(lang==='uk'?'Сонце':'Sun'));
   assert.ok(response.caution.length>20);
  }
 }
});
