import test from 'node:test';
import assert from 'node:assert/strict';
import {reportMarkdown} from './g32-report-summary.mjs';

test('G3.2 owner summary reports unknown, never invented zero or raw queries',()=>{
 const md=reportMarkdown({summary:{errors:0}},{access:'not_configured',opportunities:[
  {id:'jyotish',clicks:null,impressions:null,decision:'await_GSC_evidence'}],
  blocker:'GSC_SECRET_MISSING',propertyTotals:{clicks:null,impressions:null},period:'unknown'},null);
 assert.match(md,/GSC_SECRET_MISSING/);
 assert.match(md,/unknown/);
 assert.doesNotMatch(md,/secret search query/);
 assert.match(md,/0 errors/);
});
test('G3.2 summary keeps site totals independent of landing page breakdown',()=>{
 const md=reportMarkdown({summary:{errors:0}},{
  access:'verified_read_only',period:'2026-10-20..2026-10-29',
  propertyTotals:{impressions:73,clicks:4,ctr:4/73},
  opportunities:[{id:'panchanga',impressions:20,clicks:2,decision:'insufficient_sample_keep_current_page'}]
 },{assets:[{}, {}, {}]});
 assert.match(md,/73/);assert.match(md,/4/);
 assert.match(md,/20/);assert.match(md,/5\.5%/);
 assert.match(md,/3 reviewed tool bridges/);
});
