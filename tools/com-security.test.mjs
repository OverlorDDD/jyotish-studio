import test from 'node:test';
import assert from 'node:assert/strict';
import {forumWriteLimit} from '../apps/api/src/com-budget.ts';
import {forumPermissions} from '../apps/api/src/com-policy.ts';
test('C4 rate classes do not favor PREMIUM or moderator impersonation',()=>{
 assert.deepEqual(forumWriteLimit('POST','/threads'),{name:'threads',max:12});
 assert.deepEqual(forumWriteLimit('POST','/api/v1/com/reports'),{name:'reports',max:15});
 assert.deepEqual(forumWriteLimit('POST','/threads/25f00eb7-5afa-44a2-bc9a-18e56f653615/posts'),{name:'replies',max:90});
 assert.deepEqual(forumWriteLimit('POST','/appeals'),{name:'appeals',max:6});
 assert.deepEqual(forumWriteLimit('POST','/privacy/requests'),{name:'privacy',max:3});
 assert.deepEqual(forumWriteLimit('PATCH','/mod/threads/25f00eb7-5afa-44a2-bc9a-18e56f653615'),{name:'mutations',max:300});
 const premium={id:'user',role:'MEMBER',subscriptionTier:'PREMIUM',subscriptionEndsAt:new Date(Date.now()+86400000)};
 assert.equal(forumPermissions(premium).canModerate,false);
 assert.equal(forumPermissions(premium).canManageContext,false);
});
