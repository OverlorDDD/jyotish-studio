import test from 'node:test';
import assert from 'node:assert/strict';
import {p386EvidenceShare} from '../apps/web/lib/panchanga-p386-evidence.ts';

const make=(observations,activityMethod='direct',verdict='candidate')=>({
 version:'p38-election-screening-v1',activityId:'job_start',
 activityMethod,verdict,observations
});
const observation=(domain,polarity,id='R')=>({
 id:id+'-'+domain,domain,polarity,scope:'activity',
 source:'https://www.panchanga.lv/wp-content/uploads/2020/06/Muhurta_Raman.pdf',
 description:{uk:'Вплив',en:'Factor'}
});
test('P386 percentage is a share of independent documented signals, not success probability',()=>{
 const value=p386EvidenceShare(make([
  observation('nakshatra','supports'),
  observation('tarabala','supports'),
  observation('chandrabala','cautions')
 ],'direct','mixed'));
 assert.equal(value.percent,67);
 assert.equal(value.numerator,2);
 assert.equal(value.denominator,3);
 assert.equal(value.basis,'TRIGGERED_SOURCE_EVIDENCE_NOT_OUTCOME_PROBABILITY');
});
test('P386 mathematically dependent Tithi and Karana are one group, hard restriction wins',()=>{
 const value=p386EvidenceShare(make([
  observation('tithi','supports'),
  observation('karana','excludes'),
  observation('nakshatra','supports')
 ],'direct','avoid'));
 assert.equal(value.numerator,1);
 assert.equal(value.denominator,2);
 assert.equal(value.excluded,1);
 assert.equal(value.percent,50);
});
test('P386 percent suppressed for incomplete wedding/foundation, routines and one-factor observations',()=>{
 assert.equal(p386EvidenceShare(make([
  observation('nakshatra','supports'),observation('chandrabala','supports')
 ],'special_election','needs_full_election')).percent,null);
 assert.equal(p386EvidenceShare(make([
  observation('nakshatra','supports'),observation('tarabala','supports')
 ],'routine','routine')).percent,null);
 assert.equal(p386EvidenceShare(make([observation('nakshatra','supports')])).percent,null);
 assert.equal(p386EvidenceShare(make([observation('nakshatra','context')])).percent,null);
});
test('P386 no missing/unknown signal counted as a positive; unsourced votes rejected',()=>{
 const clean=p386EvidenceShare(make([
  observation('nakshatra','supports'),observation('vara','context'),
  observation('chandrabala','cautions')]));
 assert.equal(clean.percent,50);
 assert.throws(()=>p386EvidenceShare(make([
  {...observation('nakshatra','supports'),source:'unverified'},
  observation('tarabala','supports')
 ])),/unsourced/);
});
