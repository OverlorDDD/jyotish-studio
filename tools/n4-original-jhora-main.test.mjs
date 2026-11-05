import test from 'node:test';
import assert from 'node:assert/strict';
import {vargaSign} from '../packages/jyotish-core/src/vargas.ts';
import {parseN4OriginalJHoraMain,diagnoseN4OriginalJHoraPair} from './n4-original-jhora-main.mjs';
import {parseN4OriginalDivisionalClipboard} from './n4-original-jhora-divisionals.mjs';
const bodies=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const codes=['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const ds=[1,9,10,2,3,4,7,12,16,20,24,27,30,40,45,60];
const places=bodies.map((b,i)=>i*30+7.3);
const field=i=>'7 '+codes[i]+' 18\u0027 00.00"';
function originalMain(){
 const intro='C:\\windows\\temp\\input\n\nNatal Chart\n\n'+
  'Date:          January 5, 1990\nTime:          5:11:00\n'+
  'Time Zone:     9:00:00 (West of GMT)\n'+
  'Place:         150 W 00\u0027 00", 48 S 00\u0027 00"\n'+
  'Ayanamsa:      23-44-11.32\n\nBody                    Longitude        Nakshatra Pada Rasi Navamsa\n';
 const rows=bodies.map((body,i)=>body.padEnd(24)+field(i)+'  Sample    1   Ar  Ar').join('\n');
 return intro+rows+'\n'+'SAMPLE METADATA\n'.repeat(70);
}
function originalDivisionals(){
 const header='Body'.padEnd(23)+ds.map(d=>'D-'+d+(d===2?' (US)':'')).join(' ');
 const rows=bodies.map((b,i)=>{
  const lon=places[i];
  return b.padEnd(23)+ds.map(d=>{
   let sg=vargaSign(lon,d),degree=d===1?'7':'0',minute=d===1?'18':'00';
   if(d===2&&i!==5)sg=(sg+1)%12; // genuine different GUI method
   return degree+codes[sg]+minute;
  }).join(' ');
 });
 return header+'\n\n'+rows.join('\n')+'\n';
}
test('original JHora main captures and parses exact sidereal arcseconds, ayanamsa and time',()=>{
 const parsed=parseN4OriginalJHoraMain(originalMain(),{
  date:'January 5, 1990',time:'5:11:00',timezone:'9:00:00 (West of GMT)'
 });
 assert.equal(parsed.numberOfOriginalMainBodies,10);
 assert.equal(parsed.ayanamsaDegrees,23+44/60+11.32/3600);
 assert.ok(Math.abs(parsed.longitudes.Ascendant-7.3)<1e-10);
 assert.match(parsed.sourceSha256,/^[a-f0-9]{64}$/);
 const div=parseN4OriginalDivisionalClipboard(originalDivisionals());
 const compare=diagnoseN4OriginalJHoraPair(parsed,div);
 assert.equal(compare.total,160);
 assert.equal(compare.matched,151);
 assert.equal(compare.mismatched,9);
 assert.equal(compare.assumedAlignedMatched,150);
 assert.equal(compare.mathematicallyCertifiedCases,0);
});
test('reject original source with swapped date, PowerShell copy or missing Ayanamsa',()=>{
 assert.throws(()=>parseN4OriginalJHoraMain(originalMain(),{date:'January 6, 1990'}),/date/);
 assert.throws(()=>parseN4OriginalJHoraMain('Get-Clipboard -Raw\n'+originalMain()),/script/);
 assert.throws(()=>parseN4OriginalJHoraMain(originalMain().replace('Ayanamsa:', 'Asc:' )),/Ayanamsa/);
});
