#!/usr/bin/env node
/** Genuine original JHora8 private 50-source verification of the NEW
 * explicitly method-pinned 16-chart adapter (US Hora, TrueCitra input D1).
 * Does not assert that user's production Lahiri physical D1 is same.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {calculateN4VargasForMethod} from '../packages/jyotish-core/src/varga-method-profiles.ts';
import {auditN4JHora50MethodAwareReference} from './n4-original-jhora50-reference-gate.mjs';

const SHA='5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992';
const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const fail=m=>{throw Error('N4_ORIGINAL_JHORA50_ENGINE_PROFILE_BLOCKED: '+m)};
export function checkN4Original50ExactProfile(src){
 const preflight=auditN4JHora50MethodAwareReference(src);
 if(preflight.checkedSigns!==8000||preflight.sourceCases!==50)fail('not 50 authenticated source cases');
 let originalMatch=0,sunMoonMatch=0,total=0,methodDisagreement=0;
 for(const item of src.cases){
  const points=NAMES.map(name=>({name,longitude:item.natalLongitudes[name]}));
  const original=calculateN4VargasForMethod(item.natalLongitudes.Ascendant,points,{
   d2Method:'uma-shambhu',inputConvention:'original-jhora8-true-citra-geometric'
  });
  const productionRule=calculateN4VargasForMethod(item.natalLongitudes.Ascendant,points,{
   d2Method:'sun-moon',inputConvention:'original-jhora8-true-citra-geometric'
  });
  if(original.charts.length!==16||original.originalJHora50SameInputMethod!==true)
   fail('wrong original source profile/coverage');
  for(const chart of original.charts){
   const other=productionRule.charts.find(x=>x.division===chart.division);
   if(!other)fail('other profile missing D'+chart.division);
   for(const p of [chart.lagna,...chart.planets]){
    const expected=item.expectedSigns['D'+chart.division][p.name];
    if(p.vargaSign===expected)originalMatch++;
    if(chart.division===2){
     const current=p.name==='Ascendant'?other.lagna:other.planets.find(x=>x.name===p.name);
     if(current.vargaSign===expected)sunMoonMatch++;
     if(current.vargaSign!==p.vargaSign)methodDisagreement++;
    }
    total++;
   }
  }
 }
 if(total!==8000||originalMatch!==8000||sunMoonMatch+methodDisagreement!==500)
  fail('original JHora50 comparison incomplete or nonsensical');
 return Object.freeze({
  status:'N4_EXPLICIT_JHORA8_US_HORA_SYMBOLIC_8000_OF_8000_PASS',
  original50SourceCases:50,matchedSymbolicPlacements:originalMatch,
  totalSymbolicPlacements:total,
  originalJHoraD2UsPlacements:500,
  sunMoonMatchesOnOriginalInput:sunMoonMatch,
  D2MethodMismatchCount:methodDisagreement,
  exactInputSource:'original JHora8 captured True Citra D1 longitudes',
  originalJHora8SymbolicRulesVerified:true,
  productionLahiriAstronomyVerifiedByThisGate:false,
  actualBirthD60ContinuityVerified:false,
  originalDashaCalendarDatesVerified:false,
  publicProductionReleasePermitted:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv.length!==3)fail('usage: node --experimental-strip-types tools/n4-original50-explicit-profile-gate.mjs PRIVATE_JHORA50.json');
  const raw=readFileSync(resolve(process.argv[2]));
  if(createHash('sha256').update(raw).digest('hex')!==SHA)fail('original JHora50 corpus SHA mismatch');
  console.log(JSON.stringify(checkN4Original50ExactProfile(JSON.parse(raw.toString('utf8'))),null,2));
 }catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=2}
}
