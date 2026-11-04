/**
 * N4.11 internal server read model for a known core CalculatedChart.
 * Not a public endpoint, not a trusted owner lookup, and NOT JHora certification.
 * Caller must separately authenticate the user and verify chart integrity.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {calculateAllVargas,VARGA_PROFILE,VARGA_RULESET_VERSION} from '../../../packages/jyotish-core/src/vargas.ts';

export const N4_SERVER_CONTRACT_VERSION='n4-server-varga-read-model-v1' as const;
export type N4ServerPlanet=Readonly<{
 name:string; sign:number; house:number;
 boundaryDistanceArcseconds:number;
}>;
export type N4ServerDivision=Readonly<{
 division:number;lagnaSign:number;lagnaBoundaryArcseconds:number;
 planets:readonly N4ServerPlanet[];
}>;
export type N4ServerSnapshot=Readonly<{
 version:typeof N4_SERVER_CONTRACT_VERSION;
 rulesVersion:typeof VARGA_RULESET_VERSION;
 profile:typeof VARGA_PROFILE;
 certification:'internal_rules_only_external_reference_pending';
 source:'calculated_chart_D1_without_separate_origin_attestation';
 charts:readonly N4ServerDivision[];
}>;
/** Pure, never serializes birth input, owner/chart ID, UTC, D1 longitude or credentials. */
export function n4InternalServerSnapshot(chart:CalculatedChart):N4ServerSnapshot{
 if(!chart||!Array.isArray(chart.d1)||chart.d1.length!==9||
    !Number.isFinite(chart.ascendant?.longitude))throw new Error('Incomplete N4 natal chart');
 const computed=calculateAllVargas(chart.ascendant.longitude,chart.d1.map(p=>({
  name:p.name,longitude:p.longitude,speed:p.retrograde?-1:1
 })));
 return Object.freeze({
  version:N4_SERVER_CONTRACT_VERSION,
  rulesVersion:VARGA_RULESET_VERSION,profile:VARGA_PROFILE,
  certification:'internal_rules_only_external_reference_pending' as const,
  source:'calculated_chart_D1_without_separate_origin_attestation' as const,
  charts:Object.freeze(computed.map(c=>Object.freeze({
   division:c.division,lagnaSign:c.lagna.vargaSign,
   lagnaBoundaryArcseconds:c.lagna.boundaryDistanceArcseconds,
   planets:Object.freeze(c.planets.map(p=>Object.freeze({
    name:p.name,sign:p.vargaSign,house:p.house,
    boundaryDistanceArcseconds:p.boundaryDistanceArcseconds
   })))
  })))
 });
}
/**
 * A future authenticated controller must still verify original JHora evidence
 * and chart digest; this is intentionally only a double opt-in gate and does
 * not expose any HTTP route on its own.
 */
export function n4ApiEligible(env:Record<string,string|undefined>=process.env):boolean{
 return env.N4_VARGA_API_ENABLED==='1'&&env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED==='1';
}
