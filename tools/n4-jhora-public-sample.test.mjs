/**
 * One genuine, public JHora 8.0 export from separately maintained JHoraKit.
 * This is a documented *method-variant drift test*, not a 50-case certification.
 * Our Parashari profile is not claimed to match JHoraKit's GUI preferences.
 *
 * Provenance: normalmystic/JHoraKit@f63826b501eabe69c6b08c5365875e1e2f74c24a
 * sample-data/Mahatma_Gandhi/chart.json, Git blob SHA1:
 * abf3afd4cab0f11f8431ff193543d2ec18ec7cc3
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {calculateAllVargas,SHODASHAVARGA} from '../packages/jyotish-core/src/vargas.ts';

const path=process.argv[2];
if(!path)throw Error('N4 requires original publicly exported JHoraKit chart.json; no generated golden data');
const bytes=readFileSync(path);
const header=Buffer.from('blob '+bytes.length+'\\0');
const gitBlob=createHash('sha1').update(header).update(bytes).digest('hex');
assert.equal(gitBlob,'abf3afd4cab0f11f8431ff193543d2ec18ec7cc3',
  'Original JHoraKit git blob provenance differs; fail closed');
const source=JSON.parse(bytes.toString('utf8'));
assert.equal(source.meta?.chart_type,'Natal Chart');
assert.equal(source.meta?.name,'Mahatma Gandhi');
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const expectedMismatchCounts={1:0,2:10,3:9,4:0,7:4,9:0,10:3,12:0,16:5,20:0,24:5,27:0,30:0,40:0,45:0,60:8};
const points=names.map(name=>({name,longitude:source.planets?.[name]?.longitude}));
const lagna=source.planets?.Lagna?.longitude;
if(!Number.isFinite(lagna)||points.some(p=>!Number.isFinite(p.longitude)))
 throw Error('JHoraKit public source lacks complete physical D1 longitudes');
const charts=calculateAllVargas(lagna,points);
let matches=0,divergences=0;
for(const c of charts){
 const matchesTable=Object.entries(source.divisionals).filter(([k])=>k.endsWith('(D'+c.division+')'));
 assert.equal(matchesTable.length,1,'exactly one original source table D'+c.division);
 const ref=matchesTable[0][1];
 let n=0;
 for(const row of [c.lagna,...c.planets]){
  const name=row.name==='Ascendant'?'Lagna':row.name;
  const nameOfReference=ref[name]?.sign;
  if(!signs.includes(nameOfReference))throw Error('Unverified reference sign in D'+c.division+' '+name);
  if(row.vargaSign!==signs.indexOf(nameOfReference)+1)n++;
 }
 matches+=10-n;divergences+=n;
 console.log('N4_JHORA8_PUBLIC_SAMPLE D'+c.division+': '+(10-n)+'/10 same signs; '+n+' method-option differences');
 assert.equal(n,expectedMismatchCounts[c.division],
  'JHoraKit sample changed or Galaxiora N4 mapping regressed, investigate method settings');
}
assert.equal(charts.length,SHODASHAVARGA.length);
assert.equal(matches,116);
assert.equal(divergences,44);
console.log('N4_JHORA8_ONE_SAMPLE_CONVENTION_DRIFT_CONFIRMED: 116/160 equal, 44/160 different');
console.log('N4_JHORA8_FULL_50_PROFILE_CERTIFICATION: NOT CERTIFIED');
