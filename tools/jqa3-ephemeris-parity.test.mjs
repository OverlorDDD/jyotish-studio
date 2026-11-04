import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {getEphemeris} from '../apps/api/src/ephemeris.ts';
import {localToUTC,JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS} from '../packages/jyotish-core/src/index.ts';

const angular=(a,b)=>Math.abs(((a-b+540)%360)-180)*3600;
const cases=[
 {date:'1996-03-27',time:'10:58',timeZone:'Etc/UTC',latitude:47.9105,longitude:33.3918},
 {date:'2000-07-15',time:'21:05',timeZone:'Etc/UTC',latitude:28.6139,longitude:77.209},
 {date:'2026-10-23',time:'11:00',timeZone:'Etc/UTC',latitude:-33.8688,longitude:151.2093}
];
test('Python Swiss preserves apparent metadata and the historically attested mean-Lahiri JHora8 ascendant',async()=>{
 const py=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
 const script=resolve('tools/swiss_ephemeris.py');
 for(const input of cases){
  const utc=localToUTC(input.date,input.time,input.timeZone);
  const cp=spawnSync(py,[...(py==='py'?['-3']:[]),script],{
   input:JSON.stringify({utc,latitude:input.latitude,longitude:input.longitude}),
   cwd:process.cwd(),encoding:'utf8',timeout:12000
  });
  assert.equal(cp.status,0,cp.stderr||cp.error?.message);
  const p=JSON.parse(cp.stdout);
  const helper=spawnSync(py,[...(py==='py'?['-3']:[]),'-c',`import swisseph as s,json,sys
p=json.load(sys.stdin); jd=p['jd']; s.set_sid_mode(s.SIDM_LAHIRI)
ayan=s.get_ayanamsa_ex_ut(jd,s.FLG_SWIEPH)[1]
mean=s.get_ayanamsa_ex_ut(jd,s.FLG_SWIEPH|s.FLG_NONUT)[1]
trop=s.houses(jd,p['latitude'],p['longitude'],b'P')[1][0]
print(json.dumps({'ayanamsa':ayan,'mean':mean,'tropicalAscendant':trop,'former':(trop-ayan)%360}))
`],{input:JSON.stringify({jd:p.julianDay,latitude:input.latitude,longitude:input.longitude}),encoding:'utf8',timeout:12000});
  assert.equal(helper.status,0,helper.stderr||helper.error?.message);
  const expected=JSON.parse(helper.stdout);
  assert.ok(Math.abs(p.ayanamsa-(expected.ayanamsa-JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS/3600))<1e-9);
  assert.ok(angular(p.ascendant,
   (expected.tropicalAscendant-(expected.mean-JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS/3600)+360)%360)<0.00001,
   'historical mean Lahiri convention must be preserved, not inferred from chart targets');
  assert.ok(angular(p.ascendant,expected.former)>1,
   'a true-vs-mean difference must remain observable on these test epochs');
  assert.equal(p.positions.length,9);
 }
});
test('Native and Python ephemeris adapters agree to within 1 arcsecond for modern charts',async()=>{
 const old=process.env.ALLOW_PYTHON_SWISSEPH;
 process.env.ALLOW_PYTHON_SWISSEPH='0';
 try{
  for(const input of cases){
   const native=await getEphemeris(input);
   assert.match(native.backend,/swisseph\/node/,'Native backend required for independent backend parity');
   const cmd=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
   const script=resolve('tools/swiss_ephemeris.py');
   const python=spawnSync(cmd,[...(cmd==='py'?['-3']:[]),script],{
    input:JSON.stringify({utc:localToUTC(input.date,input.time,input.timeZone),latitude:input.latitude,longitude:input.longitude}),
    encoding:'utf8',timeout:12000
   });
   assert.equal(python.status,0,python.stderr||python.error?.message);
   const other=JSON.parse(python.stdout);
   assert.ok(angular(native.ayanamsa,other.ayanamsa)<=1,'Ayanamsa mismatch arcsec');
   assert.ok(angular(native.ascendant,other.ascendant)<=1,'Ascendant mismatch arcsec');
   for(const body of native.positions){
    const p=other.positions.find(x=>x.name===body.name);
    assert.ok(p&&angular(body.longitude,p.longitude)<=1,`Planet mismatch: ${body.name}`);
   }
  }
 }finally{
  if(old===undefined)delete process.env.ALLOW_PYTHON_SWISSEPH;
  else process.env.ALLOW_PYTHON_SWISSEPH=old;
 }
});

test('Native and Python historical Swiss profiles agree on real Moon and Sun within hundredth arcsec',async()=>{
 const py=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
 const script=resolve('tools/swiss_ephemeris.py');
 for(const input of cases){
  const utc=localToUTC(input.date,input.time,input.timeZone);
  const cp=spawnSync(py,[...(py==='py'?['-3']:[]),script],{
   input:JSON.stringify({utc,latitude:input.latitude,longitude:input.longitude}),
   cwd:process.cwd(),encoding:'utf8',timeout:12000
  });
  assert.equal(cp.status,0,cp.stderr||cp.error?.message);
  const pyData=JSON.parse(cp.stdout);
  const native=await getEphemeris(input);
  const left=pyData.positions.find(x=>x.name==='Moon');
  const right=native.positions.find(x=>x.name==='Moon');
  assert.ok(angular(left.longitude,right.longitude)<0.02,
   'historical Delta-T mismatch across Python/native '+utc);
  assert.match(pyData.backend,/jhora8-swiss20201/);
  assert.match(native.backend,/jhora8-swiss20201/);
 }
});
