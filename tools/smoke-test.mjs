/** Run with the standalone or Nest server already running: node tools/smoke-test.mjs */
import assert from 'node:assert/strict';
const base=process.env.API_URL||'http://localhost:4000';
const health=await (await fetch(`${base}/api/health`)).json();assert.equal(health.status,'ok');
const fictional={date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209};
const res=await fetch(`${base}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fictional)});
const chart=await res.json();assert.equal(res.status,200,JSON.stringify(chart));
assert.equal(chart.d1.length,9);assert.equal(chart.d9.length,9);assert.equal(chart.d10.length,9);assert.equal(chart.dasha.length,9);
assert.ok(chart.ayanamsa>20&&chart.ayanamsa<27);assert.ok(chart.ascendant.longitude>=0&&chart.ascendant.longitude<360);
const ai=await fetch(`${base}/api/v1/interpretations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:chart.id,lang:'uk'})});
const reading=await ai.json();assert.equal(ai.status,200,JSON.stringify(reading));assert.ok(reading.text.length>60);
const invalid=await fetch(`${base}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fictional,latitude:99})});assert.ok(invalid.status>=400);
console.log('PASS: health, D1/D9/D10, Vimshottari, AI fallback/API, invalid coordinates');
console.log('Ephemeris:',chart.ephemeris,'| Lahiri:',chart.ayanamsa.toFixed(5),'| Asc:',chart.ascendant.signName);
