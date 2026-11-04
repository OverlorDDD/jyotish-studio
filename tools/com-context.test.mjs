import test from 'node:test';
import assert from 'node:assert/strict';
import {communitySource,discussionCategory,isApprovedContentLink} from '../apps/api/src/com-context-policy.ts';
import {forumPermissions,authorView} from '../apps/api/src/com-policy.ts';
test('only immutable public editorial/practice kinds accepted; no private chart or reading IDs',()=>{
 assert.deepEqual(communitySource('ACADEMY','vimshottari-life-cycle'),{kind:'ACADEMY',slug:'vimshottari-life-cycle'});
 assert.deepEqual(communitySource('YOGA','gentle-breath'),{kind:'YOGA',slug:'gentle-breath'});
 for(const [kind,slug] of [['CHART','private-chart'],['TAROT_READING','private-reading'],
  ['PERSONAL','journal-1'],['ACADEMY','../private'],['YOGA','a?user=secret'],
  ['YOGA','X'.repeat(90)]])assert.throws(()=>communitySource(kind,slug));
});
test('published Academy topics map to same public GalaxiCom categories',()=>{
 assert.equal(discussionCategory('ACADEMY','tarot'),'tarot');
 assert.equal(discussionCategory('ACADEMY','jyotish'),'jyotish');
 assert.equal(discussionCategory('ACADEMY','practice'),'practices');
 assert.equal(discussionCategory('YOGA','meditation'),'practices');
});
test('context curation is ADMIN editorial approval, not SUPPORT, EXPERT or PREMIUM',()=>{
 for(const role of ['SUPPORT','EXPERT','MEMBER','READER'])assert.equal(isApprovedContentLink(role),false);
 assert.equal(isApprovedContentLink('ADMIN'),true);
 const member={id:'id123456',role:'MEMBER',subscriptionTier:'PREMIUM',subscriptionEndsAt:new Date(Date.now()+86400000)};
 assert.equal(forumPermissions(member).canManageContext,false);
 assert.equal(forumPermissions({...member,role:'SUPPORT'}).canManageContext,false);
 assert.equal(forumPermissions({...member,role:'ADMIN'}).canManageContext,true);
 assert.equal(authorView({...member,comProfile:{displayName:'Reader',showPremiumBadge:true}}).expert,false);
 assert.equal(authorView({...member,role:'EXPERT',comProfile:{displayName:'Practitioner',showPremiumBadge:false}}).expert,true);
});
