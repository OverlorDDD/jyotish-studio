/** D60 FORMULA CLOSEOUT, not a claim about birth-record seconds or future.
 * Requires two method-aware external references + exact pinned core source.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const EXPECTED='3a4f2dec84a0ed13cb692f52a76612e0de1306e6';
function sourceBlob(){
 const file=readFileSync(new URL('../packages/jyotish-core/src/vargas.ts',import.meta.url));
 const src=Buffer.from(file.toString('utf8').replace(/\r\n/g,'\n'));
 return createHash('sha1').update(Buffer.from('blob '+src.length+'\0')).update(src).digest('hex');
}
export function closeD60SymbolicMath(e,blob=sourceBlob()){
 assert.equal(e?.version,'n4-d60-symbolic-certificate-v1');
 assert.equal(blob,EXPECTED,'D60 source formulas changed; rerun external oracles');
 assert.equal(e.sourceRulesGitBlob,EXPECTED);
 assert.equal(e.method,'JHora8-Traditional-own-rashi-inclusive-D60');
 assert.equal(e.originalJHoraExecutableSha256,'3DDBE5FB0458AD1F0AD91B002C7EFB8BBA9F08891D3F46190ABA97D570B17908');
 assert.equal(e.originalJHora50PrivateSourceSha256,'5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992');
 assert.equal(e.originalJHora8TraditionalCases,50);
 assert.equal(e.originalJHora8D60MatchingSigns,500);
 assert.equal(e.originalJHora8D60TotalSigns,500);
 assert.equal(e.independentPyJHoraVersion,'4.8.7');
 assert.equal(e.independentPyJHoraMethod,1);
 assert.equal(e.independentNewSyntheticCases,50);
 assert.equal(e.independentPyJHoraD60MatchingSigns,500);
 assert.equal(e.independentPyJHoraD60TotalSigns,500);
 assert.equal(e.independentPyJHoraD60MatchingHouses,450);
 assert.equal(e.independentPyJHoraD60TotalHouses,450);
 assert.equal(e.symbolicMathCertificationClosed,true);
 for(const key of [
  'continuousD60BirthTimeStabilityCertified','userSpecificTimeExactnessCertified',
  'historicalCivilTimeGloballyCertified','userSpecificLagnaAndHousesAlwaysReliable',
  'publicReaderD60InterpretationEnabled','publicAIInterpretationD60Enabled',
  'publicProductionDeploymentAuthorized'
 ])assert.equal(e[key],false,'unjustified birth/AI/release certificate: '+key);
 return Object.freeze({
  status:'N4_D60_TRADITIONAL_SYMBOLIC_MATHEMATICS_CERTIFIED_CLOSED',
  originalJHora8:'500/500',
  independentPyJHora:'500/500 signs; 450/450 houses',
  method:'JHora Traditional D60, own-sign inclusive',
  pinnedSourceGitBlob:EXPECTED,
  userSpecificD60LagnaStabilityGuaranteed:false,
  requiresReopeningSymbolicFormulaResearch:false,
  publicDeploymentAuthorized:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const e=JSON.parse(readFileSync(new URL('./n4-d60-final-certification-evidence.json',import.meta.url),'utf8'));
  console.log(JSON.stringify(closeD60SymbolicMath(e),null,2));
 }catch(ex){console.error(ex instanceof Error?ex.message:String(ex));process.exitCode=2;}
}
