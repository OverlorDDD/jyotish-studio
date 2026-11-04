import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFullJqa3} from './jqa3-full-certifier.mjs';
const bodies=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const audit={
 independentJHoraCharts:21,explicitlyMatchedCharts:20,comparableLagnaSigns:12,
 signParityCertified:true,dashaSequenceCertified:true,
 lagnaLongitudeCertified:true,planetaryLongitudeCertified:true,
 bodyPrecision:Object.fromEntries(bodies.map(b=>[b,{total:20,passing:20,maxAbsArcseconds:0.96}]))
};
const calendar={status:'DATE_PARITY_CERTIFIED',birthCases:20,natalMoonPassing:20,
 mahaDates:{passing:180,required:180},antaraDates:{passing:1620,required:1620},
 perChart:Array.from({length:20},(_,i)=>({id:'jqa3-'+i,maha:9,antara:81,moonWithinOneArcsecond:true})),
 failures:[],exactUtcBoundaryInstantsCertified:false};
test('full JQA3 requires unaltered angular 1 arcsec gate and all 180+1620 original printed dates',()=>{
 assert.equal(evaluateFullJqa3(audit,calendar).status,'CERTIFIED');
 assert.equal(evaluateFullJqa3({...audit,bodyPrecision:{...audit.bodyPrecision,Moon:{total:20,passing:19,maxAbsArcseconds:1.01}}},calendar).status,'NOT_CERTIFIED');
 assert.equal(evaluateFullJqa3(audit,{...calendar,antaraDates:{passing:1619,required:1620}}).status,'NOT_CERTIFIED');
 assert.equal(evaluateFullJqa3({...audit,explicitlyMatchedCharts:19},calendar).status,'NOT_CERTIFIED');
 assert.equal(evaluateFullJqa3(audit,{...calendar,exactUtcBoundaryInstantsCertified:true}).status,'NOT_CERTIFIED');
});
