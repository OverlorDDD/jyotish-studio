import test from 'node:test';
import assert from 'node:assert/strict';
import {authAttemptCeiling} from '../apps/api/src/auth-limit-policy.ts';
test('production auth limit cannot be relaxed by generic CI or attacker env flags',()=>{
 const base={CI:'true',GALAXIORA_E2E_TEST_AUTH:'1'};
 assert.equal(authAttemptCeiling({...base,DATABASE_URL:'postgresql://prod:secret@prod.example/app'}),60);
 assert.equal(authAttemptCeiling({...base,DATABASE_URL:'postgresql://ci:ci@127.0.0.1:5433/real_users'}),60);
 assert.equal(authAttemptCeiling({...base,CI:'false',DATABASE_URL:'postgresql://ci:ci@127.0.0.1/galaxiora_a1_test'}),60);
 assert.equal(authAttemptCeiling({...base,GALAXIORA_E2E_TEST_AUTH:'0',DATABASE_URL:'postgresql://ci:ci@127.0.0.1/galaxiora_a1_test'}),60);
 assert.equal(authAttemptCeiling({...base,DATABASE_URL:'postgresql://ci:ci@localhost:5433/galaxiora_a1_test?schema=public'}),600);
});
