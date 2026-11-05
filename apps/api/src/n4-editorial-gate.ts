/**
 * Single N4 editorial gate used by Direct Jyotish publishing and offline corpus QA.
 * It verifies EXPLICIT machine-readable statements only, not astrological meaning.
 * Reader v6 and ordinary (non-N4) Direct v2 do not call this gate.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {selectN4NarrativeThemes,reviewN4Narrative} from './n4-interpretation-brief.ts';
import {auditN4ExplicitClaims} from './n4-ai-claims.ts';
import {reviewGeneratedConsultation} from './consultation-prose-review.ts';

export const N4_EDITORIAL_GATE_VERSION='n4-editorial-gate-v2' as const;
const criticalProse=new Set(['potential_house_lord_mismatch','unsupported_financial_directive','uk_language_defects']);
export function reviewN4EditorialGate(text:string,chart:CalculatedChart,lang:'uk'|'en',asOf:string){
 const themes=selectN4NarrativeThemes(chart);
 const narrative=reviewN4Narrative(text,themes);
 const claims=auditN4ExplicitClaims(text,chart);
 const supported=themes.filter(t=>claims.claims.some(c=>c.startsWith('D'+t.division+' ')));
 const prose=reviewGeneratedConsultation(text,chart,lang,asOf);
 const codes=[
  ...narrative.codes,
  ...(claims.errors.length?['n4_explicit_planet_sign_or_house_mismatch']:[]),
  ...(claims.correct<2?['n4_insufficient_two_verified_placement_claims']:[]),
  ...(supported.length<2?['n4_missing_grounded_placement_in_two_selected_lenses']:[]),
  ...prose.codes.filter(c=>criticalProse.has(c)).map(c=>'n4_'+c)
 ];
 return Object.freeze({
  version:N4_EDITORIAL_GATE_VERSION,
  codes:Object.freeze([...new Set(codes)]),
  selectedDivisions:Object.freeze(themes.map(t=>t.division)),
  groundedDivisions:Object.freeze(supported.map(t=>t.division)),
  validatedClaims:claims.correct,
  // Advisory-only: style, length and non-critical prose gaps still need human review.
  advisory:Object.freeze(prose.codes.filter(c=>!criticalProse.has(c)))
 });
}
