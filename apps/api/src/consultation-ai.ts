import {verifyFreeProse} from './interpretation-policy.ts';

/** Only deterministic, server-authored finding material may enter the model context. */
export type AiChapterSpec={
 id:string;title:string;facts:ReadonlyArray<string>;
};
export type AiConsultationChapter={
 id:string;paragraphs:string[];source:'llm';
};
export const CHAPTER_IDS=['portrait','configuration','tensions','relationships','career','resources','timing','conclusion'] as const;

/** Plain section delimiters work with models that do not support JSON-schema mode.
 * The deterministic report retains the exact factual placements, houses and evidence. */
export function parseAiConsultation(raw:string,specs:ReadonlyArray<AiChapterSpec>,approvedYogas:ReadonlyArray<string>=[]):AiConsultationChapter[]{
 if(raw.length>24000)return [];
 const allowed=new Set(specs.map(c=>c.id));
 const markers=[...raw.matchAll(/\[\[([a-z][a-z-]*)\]\]/g)];
 const seen=new Set<string>(),chapters:AiConsultationChapter[]=[];
 for(let i=0;i<markers.length;i++){
  const id=markers[i][1];
  if(!allowed.has(id)||seen.has(id))continue;
  seen.add(id);
  const body=raw.slice(markers[i].index!+markers[i][0].length,markers[i+1]?.index??raw.length).trim();
  const parts=body.replace(/^#{1,4} .+$/gm,'').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const normalized=parts.length===1?parts:parts.slice(0,3);
  if(!normalized.length||normalized.some(p=>p.length<90||p.length>1300||!verifyFreeProse(p,approvedYogas).ok))continue;
  const combined=normalized.join(' ');
  // Reject empty headings, a list of isolated keywords, generic short worksheet prompts.
  if(combined.length<145||!/[\p{L}][^.!?]{12,}[.!?]/u.test(combined))continue;
  if(/(?:гарантовано|неодмінно|точно передбачає|guarantees|will certainly|fatal disease|безумовно)/iu.test(combined))continue;
  chapters.push({id,paragraphs:normalized,source:'llm'});
 }
 return chapters;
}

/** Protect the astronomy data contract: only each specific chapter's verified findings
 * are offered to the model; there are no user names, birth dates or locations. */
export function buildAiChapterSpecs(editorial:{
 chapters:ReadonlyArray<{id:string;title:string;evidence:ReadonlyArray<string>}>;
 findings:ReadonlyArray<{
  id:string;topic:string;ruleId:string;verifiedEvidence:ReadonlyArray<string>;
  traditionalMeaning:string;supportingFactors:ReadonlyArray<string>;counterFactors:ReadonlyArray<string>;limitations:ReadonlyArray<string>;
 }>
}):AiChapterSpec[]{
 return editorial.chapters.filter(c=>CHAPTER_IDS.includes(c.id as typeof CHAPTER_IDS[number])).map(ch=>{
  const related=editorial.findings.filter(f=>ch.evidence.some(e=>f.verifiedEvidence.includes(e))||
   (ch.id==='portrait'&&f.topic==='portrait')||
   (ch.id==='configuration'&&f.topic==='configuration')||
   (ch.id==='tensions'&&f.topic==='tensions')||
   (ch.id==='relationships'&&f.topic==='relationships')||
   (ch.id==='career'&&f.topic==='career')||
   (ch.id==='resources'&&f.topic==='resources')||
   (ch.id==='timing'&&f.topic==='timing'));
  const selected=ch.id==='conclusion'?editorial.findings.slice(0,4):related.slice(0,4);
  const facts=selected.map(f=>[
   'Verified rule '+f.ruleId, f.traditionalMeaning,
   'Supporting factors '+f.supportingFactors.slice(0,4).join('; '),
   'Counter-factors '+f.counterFactors.slice(0,3).join('; '),
   'Boundaries '+f.limitations.slice(0,2).join('; ')
  ].join('. '));
  return {id:ch.id,title:ch.title,facts:facts.length?facts:['No independent evidence; discuss only the adjacent verified themes.']};
 });
}
