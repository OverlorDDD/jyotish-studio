import test from 'node:test';
import assert from 'node:assert/strict';
import {createN4SyntheticCaptureBudget} from './n4-ai-capture-budget.mjs';
test('audit budget caps total provider calls including retries across two cases',()=>{
 const budget=createN4SyntheticCaptureBudget(2);
 assert.equal(budget.limit(),true);
 assert.equal(budget.limit(),true);
 assert.equal(budget.limit(),false);
 assert.equal(budget.used(),2);
});
test('global configured free-request limiter remains binding',()=>{
 let attempts=0;
 const budget=createN4SyntheticCaptureBudget(2,()=>++attempts<2);
 assert.equal(budget.limit(),true);
 assert.equal(budget.limit(),false);
 assert.equal(budget.used(),1);
 assert.throws(()=>createN4SyntheticCaptureBudget(3),/strict/);
});
