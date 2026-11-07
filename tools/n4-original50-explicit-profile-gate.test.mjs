import test from 'node:test';
import assert from 'node:assert/strict';
import {checkN4Original50ExactProfile} from './n4-original50-explicit-profile-gate.mjs';
test('cannot certify new engine without actual original 50 source records',()=>{
 assert.throws(()=>checkN4Original50ExactProfile({}),/N4_JHORA50_METHOD_GATE_BLOCKED/);
});
test('reject one-case synthetic replacement',()=>{
 assert.throws(()=>checkN4Original50ExactProfile({cases:[{}]}),/N4_JHORA50_METHOD_GATE_BLOCKED/);
});
