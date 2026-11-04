import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePanchangaLocation} from '../apps/api/src/panchanga-location.ts';
const loc={place:'Kyiv',timeZone:'Europe/Kyiv',latitude:50.4501,longitude:30.5234};
test('accepts valid saved observer location',()=>{
 assert.deepEqual(normalizePanchangaLocation(loc),loc);
});
test('supports natal location without a human-readable city label',()=>{
 assert.equal(normalizePanchangaLocation({...loc,place:undefined}).place,'Birth chart location');
});
test('rejects invalid observer coordinates and time zone',()=>{
 for(const v of [{...loc,latitude:90},{...loc,longitude:181},{...loc,latitude:NaN},
  {...loc,timeZone:'Imaginary/Zone'},{...loc,place:'\nBad'},{...loc,place:'<script>'}])
  assert.equal(normalizePanchangaLocation(v),null);
});
test('rejects strings instead of numbers and missing saved location',()=>{
 assert.equal(normalizePanchangaLocation({...loc,latitude:'50.4501'}),null);
 assert.equal(normalizePanchangaLocation(null),null);
 assert.equal(normalizePanchangaLocation({place:null,timeZone:null,latitude:null,longitude:null},''),null);
});
