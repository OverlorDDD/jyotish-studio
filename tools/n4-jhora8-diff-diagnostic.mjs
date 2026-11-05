/** Compare ORIGINAL JHora 8.0 source matrix without declaring certification. */
import {readFileSync} from 'node:fs';
import {calculateAllVargas,SHODASHAVARGA,VARGA_PROFILE} from '../packages/jyotish-core/src/vargas.ts';
import {validateN4JHoraCase} from './n4-original-provenance.mjs';
const file=process.argv[2];if(!file)throw Error('Expected a sanitized 50-case JHora export');
const source=JSON.parse(readFileSync(file,'utf8'));
if(source.profile!==VARGA_PROFILE||source.cases?.length!==50)throw Error('Exactly 50 aligned source profiles required');
const names=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const byDivision=Object.fromEntries(SHODASHAVARGA.map(d=>['D'+d,0]));
let checked=0;
for(const c of source.cases){
 validateN4JHoraCase(c);
 const charts=calculateAllVargas(c.natalLongitudes.Ascendant,
  names.slice(1).map(name=>({name,longitude:c.natalLongitudes[name]})));
 for(const chart of charts){
  const key='D'+chart.division;
  const actual={Ascendant:chart.lagna.vargaSign,...Object.fromEntries(chart.planets.map(p=>[p.name,p.vargaSign]))};
  for(const name of names){
   const expected=c.expectedSigns?.[key]?.[name];
   if(!Number.isInteger(expected)||expected<1||expected>12)throw Error('Missing original JHora '+key+' expected sign');
   if(expected!==actual[name])byDivision[key]++;
   checked++;
  }
 }
}
const mismatches=Object.values(byDivision).reduce((a,b)=>a+b,0);
console.log(JSON.stringify({status:'DIAGNOSTIC_ONLY_NOT_CERTIFIED',profiles:50,comparisons:checked,
 mismatches,byDivision,methodCaveat:'Check each varga preference against original JHora INI; discrepancy is not an approved variant.'},null,2));
if(mismatches)process.exitCode=2;
