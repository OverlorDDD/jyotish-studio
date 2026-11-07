#!/usr/bin/env node
/**
 * Natal N4: method-aware D2 and ephemeris crosswalk for ORIGINAL PRIVATE JHora8
 * data. This DOES NOT switch the production Sun/Moon Hora or Lahiri ayanamsha.
 *
 * Different valid D2 methods cannot be compared as a single certification.
 * Never export individual chart positions or original JHora case data.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {vargaSign,VARGA_PROFILE} from '../packages/jyotish-core/src/vargas.ts';
import {n4UmaShambhuHoraSign} from '../packages/jyotish-core/src/hora-uma-shambhu.ts';
import {auditN4JHora50MethodAwareReference} from './n4-original-jhora50-reference-gate.mjs';

const expectedSha='5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992';
const names=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const fail=m=>{throw Error('N4_D2_METHOD_CROSSWALK_BLOCKED: '+m)};

/** 0-based methods: both explicitly named, never silently switched. */
export function compareN4D2Methods(longitude){
 if(!Number.isFinite(longitude))fail('non-numeric natal longitude');
 const sunMoon=vargaSign(longitude,2);
 const umaShambhu=n4UmaShambhuHoraSign(longitude);
 return Object.freeze({sunMoonSign:sunMoon+1,umaShambhuSign:umaShambhu+1,
  sameSign:sunMoon===umaShambhu});
}
export function evaluateOriginalJHoraD2Crosswalk(source){
 const verified=auditN4JHora50MethodAwareReference(source);
 if(verified.sourceCases!==50||verified.checkedSigns!==8000)
  fail('original source sign gate incomplete');
 let checked=0,originalUmaMatches=0,originalSunMoonMatches=0,differentMethods=0;
 for(const c of source.cases){
  for(const name of names){
   const actual=compareN4D2Methods(c.natalLongitudes[name]);
   const original=c.expectedSigns.D2[name];
   if(actual.umaShambhuSign===original)originalUmaMatches++;
   if(actual.sunMoonSign===original)originalSunMoonMatches++;
   if(!actual.sameSign)differentMethods++;
   checked++;
  }
 }
 if(checked!==500||originalUmaMatches!==500)
  fail('original JHora method mismatch');
 return Object.freeze({
  status:'N4_JHORA8_D2_METHOD_CROSSWALK_DIAGNOSTIC_PASS',
  cases:50,checkedD2Placements:500,
  originalJHoraMethod:'Uma-Shambhu (US)',
  originalMethodMatches:originalUmaMatches,
  defaultGalaxioraMethod:'Sun/Moon Hora',
  defaultMethodMatchesOriginal:originalSunMoonMatches,
  methodDependentPlacements:differentMethods,
  currentGalaxioraVargaProfile:VARGA_PROFILE,
  currentGalaxioraDefaultUnchanged:true,
  nativeJHoraResearchAyanamsa:'True Citra / geometric',
  productionAyanamsa:'Lahiri / production JQA-3',
  productionEphemerisParityEstablished:false,
  productionD2SameMethodCertified:false,
  productionReleasePermitted:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv.length!==3)fail('usage: node --experimental-strip-types tools/n4-d2-original-profile-crosswalk.mjs PRIVATE_ORIGINAL_JHORA50.json');
  const raw=readFileSync(resolve(process.argv[2]));
  const hash=createHash('sha256').update(raw).digest('hex');
  if(hash!==expectedSha)fail('source SHA-256 differs from original private JHora 50-case reference');
  console.log(JSON.stringify(evaluateOriginalJHoraD2Crosswalk(JSON.parse(raw.toString('utf8'))),null,2));
 }catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
}
