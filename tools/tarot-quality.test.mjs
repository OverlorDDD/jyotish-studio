import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewTarotEvidence} from '../apps/api/src/tarot-quality.ts';
import {describeDraws,TAROT_DECK} from '../apps/api/src/tarot-deck.ts';

function narrative(cards,spread,lang){
 const described=describeDraws(cards,spread);
 return {
  directAnswer:'A meaningful reading can unfold without certainties about external events.',
  development:'The transition between these positions suggests choices and responses rather than fixed fate.',
  cardExplanations:described.map(c=>(
   c.name[lang]+' — '+c.positionName[lang]+' — '+(c.reversed?(lang==='uk'?'перевернута':'reversed'):'upright')
   +'. This specific image grounds a possible scenario in its position and does not determine another person’s thoughts.'
  )),
  caution:'Treat one symbolic possibility as a prompt to reflect, not a fixed prediction.',
  advice:'Try a manageable next step consistent with what you actually know.'
 };
}
test('Tarot evidence accepts all drawn cards with exact positions and reversal states',()=>{
 const seeds=[
  {spread:'one',cards:[{id:'major-tower',position:0,reversed:true}]},
  {spread:'three',cards:[
   {id:'major-fool',position:0,reversed:true},
   {id:'cups-three',position:1,reversed:false},
   {id:'major-star',position:2,reversed:true}
  ]},
  {spread:'celtic',cards:TAROT_DECK.slice(0,10).map((c,i)=>({id:c.id,position:i,reversed:i%2===0}))}
 ];
 for(const lang of ['uk','en'])for(const sample of seeds){
  const value=narrative(sample.cards,sample.spread,lang);
  assert.deepEqual(reviewTarotEvidence(value,sample.cards,sample.spread,lang),[]);
 }
});
test('wrong card or missing reversed orientation fails without another AI request',()=>{
 const cards=[{id:'major-tower',position:0,reversed:true}];
 const value=narrative(cards,'one','uk');
 assert.deepEqual(reviewTarotEvidence({...value,cardExplanations:['Імператриця у цій позиції пропонує сміливе рішення для вечора й діалог.']},cards,'one','uk').map(i=>i.code).sort(),
  ['missing_card_anchor','missing_reversal']);
 const wrong=narrative(cards,'one','en');
 wrong.cardExplanations[0]=wrong.cardExplanations[0].replace('reversed','upright');
 assert.ok(reviewTarotEvidence(wrong,cards,'one','en').some(i=>i.code==='missing_reversal'));
});
test('explicit imaginary extra card rejected; common words World and Moon are not',()=>{
 const cards=[{id:'major-fool',position:0,reversed:false}];
 const value=narrative(cards,'one','en');
 value.development+=' The card "The High Priestess" confirms a new hidden card was found.';
 assert.ok(reviewTarotEvidence(value,cards,'one','en').some(i=>i.code==='invented_card'));
 value.development='The world feels uncertain under the moon tonight.';
 assert.deepEqual(reviewTarotEvidence(value,cards,'one','en'),[]);
});
test('card explanation count cannot differ from drawn cards',()=>{
 const cards=[{id:'major-star',position:0,reversed:false}];
 const v=narrative(cards,'one','en');v.cardExplanations=[];
 assert.deepEqual(reviewTarotEvidence(v,cards,'one','en'),[{code:'card_count'}]);
});
