import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectN4OriginalJHoraIni,N4_ORIGINAL_JHORA_PINNED_SETTINGS}
 from './n4-jhora8-ini-preflight.mjs';

test('original JHora8 profile preflight rejects a profile with conflicting genuine user-method flags and leaks no location',()=>{
 const source='JHoraVersion=8.0.0.0\n'+Object.entries(N4_ORIGINAL_JHORA_PINNED_SETTINGS)
  .map(([k,v])=>k+'='+v).join('\n')+
  '\nHoraPreference=6\n'; // conflicting duplicate must fail hard
 assert.throws(()=>inspectN4OriginalJHoraIni(Buffer.from(source)),/Conflicting/);
 const fixed='JHoraVersion=8.0.0.0\n'+Object.entries(N4_ORIGINAL_JHORA_PINNED_SETTINGS)
  .map(([k,v])=>k+'='+(k==='HoraPreference'?'6':k==='D60Preference'?'2':v)).join('\n')+
  '\nDefaultLatitude=PRIVATE_LOCATION\nDefaultLongitude=PRIVATE_LOCATION\n';
 const result=inspectN4OriginalJHoraIni(Buffer.from(fixed));
 assert.equal(result.status,'METHOD_PROFILE_NOT_ALIGNED');
 assert.deepEqual(result.differences.map(d=>d.key),['HoraPreference','D60Preference']);
 assert.ok(!JSON.stringify(result).includes('PRIVATE_LOCATION'));
 assert.match(result.profileSha256,/^[a-f0-9]{64}$/);
});
test('matching INI is NOT claimed to certify JHora mathematics',()=>{
 const file='JHoraVersion=8.0.0.0\n'+Object.entries(N4_ORIGINAL_JHORA_PINNED_SETTINGS)
 .map(([k,v])=>k+'='+v).join('\n');
 const result=inspectN4OriginalJHoraIni(Buffer.from(file));
 assert.equal(result.status,'PROFILE_VALUES_MATCH_GUI_MAPPING_STILL_UNVERIFIED');
 assert.equal(result.differences.length,0);
 assert.match(result.note,/does not certify original executable/);
});
test('unknown version fails before parity even when option integers match',()=>{
 const file='JHoraVersion=7.66.0.0\n'+Object.entries(N4_ORIGINAL_JHORA_PINNED_SETTINGS)
 .map(([k,v])=>k+'='+v).join('\n');
 assert.equal(inspectN4OriginalJHoraIni(Buffer.from(file)).status,'JHORA_VERSION_UNVERIFIED');
});
