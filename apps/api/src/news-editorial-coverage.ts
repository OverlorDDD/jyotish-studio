/** Distinguishes absent publisher evidence from unfinished translation.
 * An original teaser must never be invented from a headline alone.
 */
import {cleanDescription} from './news-domain.ts';
export type EditorialEvidence={
 feedDescription?:string|null;summary?:string|null;summaryKind?:string|null;
 titleUk?:string|null;summaryUk?:string|null
};
const boiler=/Це орієнтир за назвою|Орієнтир за заголовком|Публікація джерела|Матеріал джерела|Read the original article|This publication (?:by|from)|This article from|в першоджерелі|in its headline/i;
export function editorialSourceFacts(row:EditorialEvidence):string{
 return cleanDescription(row.feedDescription||(row.summaryKind==='source_excerpt'?row.summary:'')||'').slice(0,700);
}
export function hasEditorialEvidence(row:EditorialEvidence):boolean{
 const facts=editorialSourceFacts(row);
 return facts.length>=45&&!boiler.test(facts);
}
export type PreviewState='ready'|'missing_source_facts'|'translation_pending';
export function editorialPreviewState(row:EditorialEvidence):PreviewState{
 if(row.summaryUk?.trim())return 'ready';
 return hasEditorialEvidence(row)?'translation_pending':'missing_source_facts';
}
