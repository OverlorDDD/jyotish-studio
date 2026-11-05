import test from 'node:test';
import assert from 'node:assert/strict';
import {vargaSign} from '../packages/jyotish-core/src/vargas.ts';
import {parseN4OriginalDivisionalClipboard,diagnoseN4OriginalDivisionalPilot,validateN4OriginalMainClipboard}
 from './n4-original-jhora-divisionals.mjs';
const bodies=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const ds=[1,9,10,2,3,4,7,12,16,20,24,27,30,40,45,60];
const codes=['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const map=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function syntheticTable(swapD2=true){
 const header='Body'.padEnd(23)+ds.map(n=>'D-'+n+(n===2?' (US)':n===3?' (Trd)':'')).join('  ');
 const rows=bodies.map((body,i)=>{
  const lon=(i*30+7.3)%360;
  const values=ds.map(d=>{
   let sign=vargaSign(lon,d),minute='00',degree='0';
   if(d===1){degree='7';minute='18';}
   if(d===2&&swapD2&&i!==5)sign=(sign+1)%12;
   return degree+codes[sign]+minute;
  });
  return body.padEnd(23)+values.join('  ');
 });
 return header+'\n\n'+rows.join('\n')+'\n';
}
test('strict raw original table parser recognizes 16 chart columns, 10 source bodies, D2 method label',()=>{
 const p=parseN4OriginalDivisionalClipboard(syntheticTable());
 assert.equal(p.bodyCount,10);assert.equal(p.columns.length,16);
 assert.equal(p.columns.find(x=>x.division===2).method,'US');
 assert.equal(Object.keys(p.expectedSigns).length,16);
 const audit=diagnoseN4OriginalDivisionalPilot(p);
 assert.equal(audit.status,'DIAGNOSTIC_ONLY_NOT_ORIGINAL_JHORA_CERTIFIED');
 assert.equal(audit.positions,160);
 assert.equal(audit.assumedAlignedMatches,150);
 assert.equal(audit.assumedAlignedTotal,150);
 assert.equal(audit.matches,151);
 assert.equal(audit.mismatches,9);
 assert.equal(audit.originalCertifiedCases,0);
});
test('fail closed on PowerShell pasted instead of source, absent D60 or absent bodies',()=>{
 assert.throws(()=>parseN4OriginalDivisionalClipboard(
  'Get-Clipboard -Raw\n'+syntheticTable()),/script/);
 assert.throws(()=>parseN4OriginalDivisionalClipboard(
  syntheticTable().replace('D-60','D-61')),/order/);
 assert.throws(()=>parseN4OriginalDivisionalClipboard(
  syntheticTable().replace(/^Ketu.*$/m,'')),/missing Lagna/);
 const badMain='$folder=\"$env:USERPROFILE\"; Get-Clipboard -Raw;\n'+ 'Natal Chart Ayanamsa: '.repeat(60)+'N4-SYNTH-001';
 assert.throws(()=>validateN4OriginalMainClipboard(badMain),/PowerShell source/);
});
test('proper main clipboard keeps source hash and refuses wrong case',()=>{
 const valid='N4-SYNTH-001 Natal Chart Ayanamsa: 22-01-00.00\n'+
  'Lagna 20 Sg 25 12.99\\n'.repeat(75);
 assert.match(validateN4OriginalMainClipboard(valid).sha256,/^[0-9a-f]{64}$/);
 assert.throws(()=>validateN4OriginalMainClipboard(valid,'N4-SYNTH-002'),/wrong or stale/);
});
