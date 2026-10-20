import test from 'node:test';
import assert from 'node:assert/strict';
import {validateExpertApplication,reviewExpert,ExpertProfileError} from '../apps/api/src/expert-policy.ts';
import {JYOTISH_EXPERT_VOICE,JYOTISH_PROSE_FORMAT,JYOTISH_READER_VERSION} from '../apps/api/src/jyotish-reader-style.ts';
const application={displayName:'Test Practitioner',bioUk:'Досвідчена практика Джйотіш, натальні карти та ведична традиція.'.repeat(2),
 bioEn:'Traditional practitioner of Jyotish, natal charts and spiritual practice.'.repeat(2),
 specialties:['jyotish','tarot'],consent:true};
test('only approved identity and reviewed professional bio can become public',()=>{
 const good=validateExpertApplication(application);
 assert.equal(good.specialties.length,2);
 assert.throws(()=>validateExpertApplication({...application,consent:false}),ExpertProfileError);
 assert.throws(()=>validateExpertApplication({...application,specialties:['jyotish','jyotish']}),ExpertProfileError);
 assert.throws(()=>validateExpertApplication({...application,email:'private@example.org'}),ExpertProfileError);
 assert.throws(()=>validateExpertApplication({...application,bioEn:'Short'}),ExpertProfileError);
});
test('admin-only expertise review and valid status transitions',()=>{
 assert.equal(reviewExpert('ADMIN','verify','SUBMITTED'),'VERIFIED');
 assert.equal(reviewExpert('ADMIN','suspend','VERIFIED'),'SUSPENDED');
 assert.equal(reviewExpert('ADMIN','reject','SUBMITTED'),'REJECTED');
 assert.throws(()=>reviewExpert('EXPERT','verify','SUBMITTED'),ExpertProfileError);
 assert.throws(()=>reviewExpert('ADMIN','verify','VERIFIED'),ExpertProfileError);
});
test('professional Jyotish prompt requires connected evidence and disallows generic homework',()=>{
 assert.equal(JYOTISH_READER_VERSION,'parashari-v2');
 assert.match(JYOTISH_EXPERT_VOICE,/Parashari/);
 assert.match(JYOTISH_EXPERT_VOICE,/Navamsha D9/);
 assert.match(JYOTISH_EXPERT_VOICE,/Vimshottari dasha/);
 assert.match(JYOTISH_PROSE_FORMAT,/not generic self-reflection/);
 assert.ok(!JYOTISH_EXPERT_VOICE.includes('Avoid technical words entirely'));
});
