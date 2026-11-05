/**
 * N4 original JHora 8.0 INI: READ-ONLY method preflight.
 * Never modifies a user's settings and never outputs private default birth/place.
 * Identical literal preferences are NECESSARY, not SUFFICIENT, for parity:
 * GUI variant semantics + original binary/version provenance still require proof.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const N4_ORIGINAL_JHORA_PINNED_SETTINGS=Object.freeze({
 HoraPreference:'0',D3Preference:'0',D4Preference:'0',D7Preference:'0',
 D9Preference:'0',D10Preference:'0',D12Preference:'0',D16Preference:'0',
 D20Preference:'0',D24Preference:'0',D27Preference:'0',D30Preference:'0',
 D60Preference:'0',DivLongFromEndToo:'0',Siddhanta:'0',
 TopocentricPositions:'0',TruePositions:'1',TrueNodes:'0',UserSelectedAyanamsa:'0'
});
export function inspectN4OriginalJHoraIni(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<50||bytes.length>2_000_000)
  throw Error('JHora8 INI bytes not available or too large');
 const text=bytes.toString('latin1');
 const settings=new Map();
 for(const match of text.matchAll(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*([^\r\n]*)/gm)){
  if(settings.has(match[1])&&settings.get(match[1])!==match[2].trim())
   throw Error('Conflicting INI calculation value for '+match[1]);
  settings.set(match[1],match[2].trim());
 }
 const version=settings.get('JHoraVersion')||null;
 const differences=Object.entries(N4_ORIGINAL_JHORA_PINNED_SETTINGS)
  .filter(([key,wanted])=>settings.get(key)!==wanted)
  .map(([key,expected])=>Object.freeze({key,expected,actual:settings.get(key)||'MISSING'}));
 return Object.freeze({
  status:version!=='8.0.0.0'?'JHORA_VERSION_UNVERIFIED':
   differences.length?'METHOD_PROFILE_NOT_ALIGNED':'PROFILE_VALUES_MATCH_GUI_MAPPING_STILL_UNVERIFIED',
  version,profileSha256:createHash('sha256').update(bytes).digest('hex'),
  comparedCalculationFields:Object.keys(N4_ORIGINAL_JHORA_PINNED_SETTINGS).length,
  differences:Object.freeze(differences),
  note:'Read-only flags only. Matching INI does not certify original executable, GUI mapping, 50 reference charts, Swiss ephemeris, nodes or dasha dates.'
 });
}
if(process.argv[1]?.replace(/\\/g,'/').endsWith('/n4-jhora8-ini-preflight.mjs')){
 const file=process.argv[2];if(!file)throw Error('Usage: node tools/n4-jhora8-ini-preflight.mjs <private-local-jhora.ini>');
 console.log(JSON.stringify(inspectN4OriginalJHoraIni(readFileSync(file)),null,2));
}
