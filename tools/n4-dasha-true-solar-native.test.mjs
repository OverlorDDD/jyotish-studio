import test from 'node:test';
import assert from 'node:assert/strict';
import {solveN4SolarArcInstant} from './n4-dasha-true-solar-native.mjs';
const DAY=86400000;
test('solar longitude crossing agrees with constant solar period in analytic circular model',()=>{
 const yearDays=365.24219,center=Date.parse('2010-01-15T12:00:00Z');
 const sunAt=ms=>((ms-center)/DAY/yearDays*360%360+360)%360;
 for(const years of [-1.8,-0.4,0.4,1,6.2,19]){
  const root=solveN4SolarArcInstant({startMs:center,years,yearDays,getSun:sunAt});
  assert.ok(Math.abs(root-(center+years*yearDays*DAY))<2000,years);
 }
});
test('invalid solar bracket never produces a fake date',()=>{
 assert.throws(()=>solveN4SolarArcInstant({
  startMs:Date.now(),years:1,yearDays:365.24219,getSun:()=>15
 }),/cannot be bracketed/);
 assert.throws(()=>solveN4SolarArcInstant({
  startMs:0,years:0,yearDays:365.25,getSun:()=>15
 }),/invalid root inputs/);
});
