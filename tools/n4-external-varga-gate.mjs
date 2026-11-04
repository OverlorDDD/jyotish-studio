/**
 * Fail-closed N4.2 independent-reference certification gate.
 * Only accepts a real 50-case JHora 8 corpus with matching pinned settings.
 * Does not generate or self-attest expected results.
 * Usage: node --experimental-strip-types tools/n4-external-varga-gate.mjs <fixture.json>
 */
import {readFileSync} from 'node:fs';
import {SHODASHAVARGA,VARGA_PROFILE,calculateAllVargas} from '../packages/jyotish-core/src/vargas.ts';
const bodies=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const fail=(message)=>{console.error('N4_EXTERNAL_NOT_CERTIFIED: '+message);process.exitCode=1;};
const file=process.argv[2];
if(!file){fail('An independently recorded JHora 8 reference file is required');}
else try{
 const data=JSON.parse(readFileSync(file,'utf8'));
 if(data.profile!==VARGA_PROFILE)throw Error('Mismatched Parashari profile');
 if(!Array.isArray(data.cases)||data.cases.length<50)throw Error('At least 50 independent cases required');
 const ids=new Set();let checked=0;
 for(const c of data.cases){
  if(typeof c.id!=='string'||!c.id||ids.has(c.id))throw Error('Missing or duplicate case id');
  ids.add(c.id);
  if(c.referenceTool!=='Jagannatha Hora 8.0'||typeof c.referenceSettings!=='string'||c.referenceSettings.length<15)
   throw Error(c.id+': independently documented JHora 8 provenance/settings required');
  if(c.isRealPerson!==false)throw Error(c.id+': synthetic or consent-safe public fixture required');
  if(!/^N4-SYNTH-\\d{3,4}$/.test(c.id)||!/^\\b[a-f0-9]{64}\\b$/i.test(String(c.referenceSourceSha256||'')))
   throw Error(c.id+': original synthetic JHoraKit capture SHA256 provenance is required');
  const l=c.natalLongitudes;
  if(!l||bodies.some(b=>!Number.isFinite(l[b])))throw Error(c.id+': missing D1 sidereal longitude');
  const calculated=calculateAllVargas(l.Ascendant,bodies.slice(1).map(name=>({name,longitude:l[name]})));
  for(const chart of calculated){
   const key='D'+chart.division,ref=c.expectedSigns?.[key];
   if(!ref||bodies.some(b=>!Number.isInteger(ref[b])||ref[b]<1||ref[b]>12))
    throw Error(c.id+': missing JHora oracle results for '+key);
   const actual={Ascendant:chart.lagna.vargaSign,...Object.fromEntries(chart.planets.map(p=>[p.name,p.vargaSign]))};
   for(const name of bodies){
    checked++;
    if(actual[name]!==ref[name])throw Error(c.id+' '+key+' '+name+': got '+actual[name]+' expected '+ref[name]);
   }
  }
 }
 if(checked<8000||data.cases.length*SHODASHAVARGA.length*10!==checked)throw Error('Insufficient reference coverage');
 console.log('N4_EXTERNAL_PARITY_PASS: '+ids.size+' JHora cases, '+checked+' independently recorded signs agree');
 console.log('LIMIT: Parity does not by itself prove ephemeris, DST or input-time reliability');
}catch(error){fail(error instanceof Error?error.message:String(error));}
