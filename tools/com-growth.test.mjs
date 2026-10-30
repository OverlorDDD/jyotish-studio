import test from 'node:test';
import assert from 'node:assert/strict';
import {bookmarkCapacity,reputationLevel,visibleGrowthProfile} from '../apps/api/src/com-growth-policy.ts';
test('C5 uses real premium tier, and never grants moderation or free posting rights',()=>{
 assert.equal(bookmarkCapacity(false),20);assert.equal(bookmarkCapacity(true),200);
 assert.equal(reputationLevel(0),'NEW');assert.equal(reputationLevel(3),'ACTIVE');
 assert.equal(reputationLevel(10),'HELPFUL');assert.equal(reputationLevel(25),'GUIDE');
 assert.deepEqual(visibleGrowthProfile({signature:'x'.repeat(150),accent:'gold'},false),{signature:'x'.repeat(80),accent:'default'});
 assert.deepEqual(visibleGrowthProfile({signature:'x'.repeat(150),accent:'gold'},true),{signature:'x'.repeat(150),accent:'gold'});
 assert.equal(visibleGrowthProfile({signature:'Safe',accent:'BAD'},true).accent,'default');
});
