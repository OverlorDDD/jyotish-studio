/** Run with the standalone or Nest server already running: node tools/smoke-test.mjs */
import assert from 'node:assert/strict';
const base=process.env.API_URL||'http://localhost:4000';
const healthResponse=await fetch(`${base}/api/health`);
assert.equal(healthResponse.status,200,'Health endpoint must return 200');
const health=await healthResponse.json();
assert.equal(health.status,'ok');
assert.ok(['jyotish-nestjs','jyotish-standalone'].includes(health.service),'Unknown API service');
const isNest=health.service==='jyotish-nestjs';
if(process.argv.includes('--require-nest'))assert.ok(isNest,'Full-stack smoke test must target NestJS, not standalone');
if(isNest)assert.equal(health.database,'connected','Nest API must have an active PostgreSQL connection');
const expectedCreatedStatus=isNest?201:200;
const errorHint=(response,body)=>`HTTP ${response.status}; ${JSON.stringify(body).slice(0,500)}`;
const fictional={date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209};
const res=await fetch(`${base}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fictional)});
const chart=await res.json();
assert.equal(res.status,expectedCreatedStatus,`Create chart: ${errorHint(res,chart)}`);
assert.ok(typeof chart.id==='string'&&chart.id.length>0,'A created chart needs a persistent identifier');
assert.equal(chart.d1.length,9);assert.equal(chart.d9.length,9);assert.equal(chart.d10.length,9);assert.equal(chart.dasha.length,9);
const saved=await fetch(`${base}/api/v1/charts/${chart.id}`);
const stored=await saved.json();assert.equal(saved.status,200);assert.equal(stored.utc,chart.utc);
const periods=await fetch(`${base}/api/v1/charts/${chart.id}/dashas`);
const dashaData=await periods.json();assert.equal(periods.status,200);assert.equal(dashaData.dasha.length,9);

assert.ok(chart.ayanamsa>20&&chart.ayanamsa<27);assert.ok(chart.ascendant.longitude>=0&&chart.ascendant.longitude<360);
const ai=await fetch(`${base}/api/v1/interpretations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:chart.id,lang:'uk',preferred:'local'})});
const reading=await ai.json();
assert.equal(ai.status,expectedCreatedStatus,`Create interpretation: ${errorHint(ai,reading)}`);
assert.ok(typeof reading.text==='string'&&reading.text.length>60,'Interpretation text missing');
if(isNest){
 const response=await fetch(`${base}/api/v1/reports`,{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:chart.id,lang:'uk',preferred:'local'})
 });
 const report=await response.json();
 assert.equal(response.status,201,`Report endpoint: ${errorHint(response,report)}`);
 assert.equal(report.ai.provider,'local');
 assert.ok(report.sections.length>=29,'Report must contain complete planet and house chapters');
 for(const id of ['portrait','sun-moon','navamsa','dashamsa','drishti','dasha'])
  assert.ok(report.sections.some(x=>x.id===id),`Missing report chapter ${id}`);
}

const invalid=await fetch(`${base}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fictional,latitude:99})});assert.ok(invalid.status>=400);
console.log(`PASS: ${health.service}, health, D1/D9/D10, Vimshottari, interpretation, invalid coordinates`);
console.log(`HTTP creation status ${expectedCreatedStatus}; ${isNest?'PostgreSQL connected':'standalone in-memory storage'}`);
console.log('Ephemeris:',chart.ephemeris,'| Lahiri:',chart.ayanamsa.toFixed(5),'| Asc:',chart.ascendant.signName);
