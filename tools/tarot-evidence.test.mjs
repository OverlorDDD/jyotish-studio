import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTarotEvidence} from '../apps/api/src/tarot-evidence.ts';
const reading={
 directAnswer:'The cards suggest a conversation rather than a certain result.',
 development:'The situation may shift and can be discussed with care.',
 cardExplanations:['The Tower (reversed) suggests tension that is easing, not a literal catastrophe.'],
 caution:'Do not make conclusions about other people without evidence.',
 advice:'Speak openly and notice what changes.'};
const cards=[{position:1,name:'The Tower',reversed:true}];
test('tarot evidence accepts a properly recorded reversal and an open-ended storyline',()=>{
 assert.deepEqual(validateTarotEvidence(reading,cards,'en'),{ok:true,codes:[]});
});
test('tarot evidence rejects an extra explicitly named card',()=>{
 const value={...reading,development:'Suddenly “The Fool” appears, then the situation may shift.'};
 assert.ok(validateTarotEvidence(value,cards,'en').codes.includes('invented_card'));
});
test('tarot evidence rejects explicit incorrect orientation',()=>{
 const value={...reading,cardExplanations:['The Tower (upright) appears in the final position.']};
 assert.ok(validateTarotEvidence(value,cards,'en').codes.includes('orientation_mismatch'));
});
test('tarot evidence rejects categorical high-stakes outcomes',()=>{
 const value={...reading,directAnswer:'You are guaranteed to win money after the meeting.'};
 assert.ok(validateTarotEvidence(value,cards,'en').codes.includes('certain_high_stakes_prediction'));
});
test('tarot evidence handles different spread sizes',()=>{
 assert.deepEqual(validateTarotEvidence(reading,[...cards,...cards],'en').codes,['card_count_mismatch']);
});
