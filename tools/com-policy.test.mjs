import test from 'node:test';
import assert from 'node:assert/strict';
import {forumPermissions,validateForumText,withinEditWindow,authorView} from '../apps/api/src/com-policy.ts';
const user=(tier='FREE',until=null,role='MEMBER')=>({
 id:'95d76372-845f-4c8d-a4fa-afeaba19a9e0',role,subscriptionTier:tier,subscriptionEndsAt:until
});
test('free members can post; premium is separate from moderation and cannot be self-granted',()=>{
 const free=forumPermissions(user());
 assert.equal(free.canCreate,true);
 assert.equal(free.canReply,true);
 assert.equal(free.premiumBadge,false);
 assert.equal(free.canModerate,false);
 assert.equal(free.canCreatePremiumOnlyRooms,false);
 const active=forumPermissions(user('PREMIUM',new Date(Date.now()+86400000)));
 assert.equal(active.premiumBadge,true);
 assert.equal(active.canModerate,false);
 assert.equal(active.canOverrideModeration,false);
 assert.equal(forumPermissions(user('PREMIUM',new Date(Date.now()-86400000))).premiumBadge,false);
 assert.equal(forumPermissions(null).canCreate,false);
 assert.equal(forumPermissions(user('FREE',null,'SUPPORT')).canModerate,true);
});
test('public author projection never exposes e-mail or subscription expiry',()=>{
 const item=authorView({...user('PREMIUM',new Date(Date.now()+86400000),'EXPERT'),
  email:'private@example.invalid',passwordHash:'secret',comProfile:{displayName:'Зоряний практик',showPremiumBadge:true}});
 assert.equal(item.name,'Зоряний практик');
 assert.equal(item.expert,true);
 assert.equal(item.premium,true);
 assert.equal(JSON.stringify(item).includes('private@example.invalid'),false);
 assert.equal(JSON.stringify(item).includes('secret'),false);
});
test('all public content is constrained to plain text and bounded links',()=>{
 assert.equal(validateForumText('  Питання до досвідчених практиків   ',3,160),'Питання до досвідчених практиків');
 for(const bad of ['<script>alert(1)</script>','<img src=x onerror=alert(1)>','javascript:alert(1)',
  'http://a.test http://b.test http://c.test http://d.test'])
  assert.throws(()=>validateForumText(bad,3,5000));
 assert.throws(()=>validateForumText('ab',3,20));
 assert.throws(()=>validateForumText('c'.repeat(31),3,30));
});
test('authors have a finite edit window',()=>{
 const now=new Date('2026-10-26T15:30:00Z');
 assert.equal(withinEditWindow(new Date('2026-10-26T15:01:00Z'),now),true);
 assert.equal(withinEditWindow(new Date('2026-10-26T14:59:00Z'),now),false);
 assert.equal(withinEditWindow(new Date('2026-10-26T15:31:00Z'),now),false);
});
