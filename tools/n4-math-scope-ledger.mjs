/**
 * N4 engineering evidence is SCOPED. Independent PyJHora verified the
 * Sun/Moon symbolic varga mapping at one pinned source blob; original JHora8
 * verified a DIFFERENT Uma-Shambhu + True Citra method. Never conflate them.
 * This is not a production feature flag or independent astronomical proof.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const N4_SCOPE_LEDGER_VERSION='n4-method-scoped-evidence-20261107-v1';
const EXPECTED_BLOB='3a4f2dec84a0ed13cb692f52a76612e0de1306e6';
function gitBlobSha(content){
 const canonical=content.toString('utf8').replace(/\r\n/g,'\n');
 const bytes=Buffer.from(canonical,'utf8');
 return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');
}
export function auditN4ScopedEvidence(){
 const ledger=JSON.parse(readFileSync(new URL('./n4-math-scope-ledger.json',import.meta.url),'utf8'));
 if(ledger.version!==N4_SCOPE_LEDGER_VERSION||ledger.researchOnly!==true||
   !Array.isArray(ledger.scopeRules)||ledger.scopeRules.length!==6)
  throw Error('N4_MATH_SCOPE_LEDGER_MALFORMED');
 const actual=gitBlobSha(readFileSync(new URL('../packages/jyotish-core/src/vargas.ts',import.meta.url)));
 if(actual!==EXPECTED_BLOB)throw Error('N4_SOURCE_BLOB_CHANGED_REQUIRES_NEW_EXTERNAL_PYJHORA_PARITY');
 const py=ledger.scopeRules[0],original=ledger.scopeRules[1],dasha=ledger.scopeRules[3];
 if(py.sourceRepoBlob!==EXPECTED_BLOB||py.referenceRun!==41845004488||
   py.referenceJob!==126626101250||py.originalIndependentPyJhoraMethodParity!==true||
   py.certifiesPhysicalBirthLongitude!==false||
   original.certifiesProductionLahiriD2SunMoon!==false||
   dasha.sourceYearDefinition!=='YearDefinition=0 3'||
   dasha.originalMinorDayMatches!==294||dasha.automaticModelSwitchAllowed!==false||
   ledger.productionFeatureFlagsMayBeEnabled!==false||
   ledger.homepageNatalRedesignMayStart!==false||
   ledger.enhancedN4AiPublicationMayStart!==false)
  throw Error('N4_MATH_SCOPE_LEDGER_UNVERIFIED_OR_INFLATED');
 return Object.freeze({
  status:'N4_SYMBOLIC_RULES_SCOPED_EXTERNAL_EVIDENCE_VALIDATED',
  productionSunMoonVargaRulesAtPinnedBlob:true,
  independentPyjhora8000ComparisonEvidence:true,
  originalJHoraUmaShambhu8000ComparisonEvidence:true,
  sourceMethodsDiffer:true,
  currentProductionPhysicalAstronomyFullyCertified:false,
  birthD60ContinuousStabilityCertified:false,
  calendarVimshottariDatesCertified:false,
  historicalLegalTimeForAllBirthplacesCertified:false,
  mathFirstReleaseGate:'BLOCKED_PENDING_PHYSICAL_AND_TEMPORAL_CERTIFICATION',
  userFacingRedesignAllowed:false,
  productionReleasePermitted:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(auditN4ScopedEvidence(),null,2))}
 catch(e){console.error(e.message);process.exitCode=2}
}
