/** N4 Release Candidate final decision. Green CI is necessary, not sufficient.
 * Never authorize 15-chart production without authentic 50-case Lahiri + D2
 * method oracle, time-source policy and explicit user-approved release.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const SRC=new URL('../packages/jyotish-core/src/vargas.ts',import.meta.url);
const BLOB='3a4f2dec84a0ed13cb692f52a76612e0de1306e6';
const fail=x=>{throw Error('N4_RC_RELEASE_GATE_FAIL_CLOSED: '+x)};
function blobHash(bytes){
 const data=Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'));
 return createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
}
export function decideN4RcRelease(evidence){
 if(!evidence||evidence.version!=='n4-rc-release-evidence-v1')fail('evidence version');
 if(evidence.originalProfileProductionLahiriCases!==20||
    evidence.requiredIndependentSameProfileLahiriCases!==50||
    evidence.fullIndependent15VargaSymbolicSourceCases!==0||
    evidence.new12IndependentOracle!=='PyJHora==4.8.7'||
    evidence.new12IndependentSyntheticCases!==50||
    evidence.new12IndependentSignComparisons!==6000||
    evidence.new12IndependentHouseComparisons!==5400||
    evidence.new12SourceRulesGitBlob!==BLOB||
    evidence.new12SymbolicScopeOnly!==true||
    evidence.d60PubliclyExcluded!==true||
    evidence.n4AiPublicEnabled!==false||
    evidence.legacyReaderV6Modified!==false||
    evidence.exactCurrentHeadCIGreenAttested!==false||
    evidence.explicitOwnerProductionApproval!==false||
    evidence.allHistoricalLocalTimeLegallyProven!==false)
  fail('invented external/CI/production certification');
 if(blobHash(readFileSync(SRC))!==BLOB)fail('symbolic formula source not pinned');
 return Object.freeze({
  version:'n4-rc-release-decision-20261107-v1',
  status:'N4_RC_IMPLEMENTED_RELEASE_BLOCKED_PENDING_EXTERNAL_SOURCE_AND_CI',
  sourceVargaRulesBlob:BLOB,
  new12SymbolicRuleParity:'6000/6000_SIGN_AND_5400/5400_HOUSE_METHOD_SCOPED_PYJHORA',
  new12IndependentSyntheticCases:50,
  new12ExactSourceHash:BLOB,
  new12PhysicalIndividualBirthCertified:false,
  original20LahiriEvidenceAvailable:true,
  required50SameProfileOriginalsAvailable:false,
  sourceIndependent15VargaOriginalsAvailable:false,
  n4TotalVisibleChartCount:15,
  n4ActuallyNewVargaCount:12,
  d60PublicEnabled:false,
  n4AiPublicEnabled:false,
  currentHeadFullCIGreenAttested:false,
  productionN4Certified:false,
  mergeOrDeployAuthorized:false,
  ownerApprovalRequired:true,
  allowedScope:'GITHUB_DRAFT_RC_ONLY'
 });
}
export function currentDecision(){
 const input=JSON.parse(readFileSync(new URL('./n4-rc-release-evidence.json',import.meta.url),'utf8'));
 return decideN4RcRelease(input);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(currentDecision(),null,2))}
 catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=2}
}
