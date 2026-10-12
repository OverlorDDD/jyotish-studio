/**
 * Swiss Ephemeris regression: 3 fictional birth scenarios, pinned baseline and
 * cross-method (tropical longitude - Lahiri vs direct sidereal) consistency.
 * NOTE: both astronomical methods use Swiss Ephemeris; this is NOT an
 * independent JHora verification.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
const reference=JSON.parse(readFileSync(new URL('../tests/fixtures/swiss-reference.json',import.meta.url),'utf8'));
const command=process.env.PYTHON_BIN|| (process.platform==='win32'?'py':'python3');
for(const entry of reference.cases){
 const input={...entry};
 const r=spawnSync(command,[...(command==='py'?['-3']:[]),'tools/swiss_ephemeris.py'],{
  cwd:new URL('..',import.meta.url),input:JSON.stringify({utc:entry.utc,latitude:entry.latitude,longitude:entry.longitude}),encoding:'utf8',timeout:15000
 });
 if(r.status!==0)throw new Error(`PySwissEph unavailable: ${r.stderr||r.error?.message}`);
 const eph=JSON.parse(r.stdout);
 for(const key of ['ayanamsa','ascendant'])
  assert.ok(Math.abs(eph[key]-entry[key])<0.0001,`${entry.date} ${key}`);
 for(const [key,value] of Object.entries(entry.positions)){
  const got=eph.positions.find(x=>x.name===key);
  assert.ok(got,`Missing ${key}`);
  const circular=Math.abs(((got.longitude-value+540)%360)-180);
  assert.ok(circular<0.0001,`${entry.date} ${key}: ${got.longitude} vs ${value}`);
 }
 const chart=calculateChart({date:entry.date,time:entry.time,timeZone:entry.timeZone,latitude:entry.latitude,longitude:entry.longitude},eph);
 assert.equal(chart.utc,new Date(entry.utc).toISOString());
 assert.equal(chart.d1.length,9);assert.equal(chart.d9.length,9);assert.equal(chart.d10.length,9);
 for(const graha of chart.d1)assert.ok(graha.house>=1&&graha.house<=12);
 const moon=chart.d1.find(g=>g.name==='Moon');
 assert.ok(chart.dasha.some(d=>d.start<=chart.utc&&d.end>chart.utc));
 console.log(`PASS ${entry.date}: ayanamsha=${eph.ayanamsa.toFixed(6)}, Lagna=${eph.ascendant.toFixed(6)}, Moon=${moon.longitude.toFixed(6)}`);
}
const cross=spawnSync(command,[...(command==='py'?['-3']:[]),'tools/cross-method-check.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:15000});
if(cross.status!==0)throw new Error('Swiss cross-method test failed: '+(cross.stderr||cross.error?.message||cross.stdout));
process.stdout.write(cross.stdout);
console.log('Swiss reference regression PASS (3 synthetic cases). Independent JHora comparison remains pending.');
