import {verifyFreeProse} from './interpretation-policy.ts';
import {checkNarrativeLordClaims} from './reader-classical.ts';

/** Only deterministic, server-authored finding material may enter the model context. */
export type AiChapterSpec={
 id:string;title:string;facts:ReadonlyArray<string>;focus?:string;draft?:ReadonlyArray<string>;
};
export type AiConsultationChapter={
 id:string;paragraphs:string[];source:'llm';
};
export const CHAPTER_IDS=['portrait','configuration','tensions','relationships','career','resources','timing','conclusion'] as const;

/** Repetitive boilerplate is not a reading. Keep one methodology note in the UI instead. */
export function removeConsultationBoilerplate(value:string):string{
 return value.replace(/(?:Проте\s+)?[Тт]радиційн(?:а межа|і межі)\s+(?:нагадує|вказує|підкреслює)[^.!?]*[.!?]/gu,'')
  .replace(/[Зз]а традиційними межами[^.!?]*[.!?]/gu,'')
  .replace(/[Цц]е лише символічна інтерпретація[^.!?]*[.!?]/gu,'')
  .replace(/(?:This is only a symbolic interpretation|The traditional boundary reminds us)[^.!?]*[.!?]/giu,'')
  .replace(/\s{2,}/g,' ').trim();
}
const OUT_OF_SCOPE_CLUSTER=/(?:концентрац|скупчен|спільн.{0,15}присутн|concentrat|cluster).{0,95}(?:сонц|марс|меркур|сатурн|Sun|Mars|Mercury|Saturn)/iu;
/** Editorial focus is data supplied by the server, never a user-authored chart claim. */
const CHAPTER_FOCUS:Record<string,string>={
 portrait:'Identity only: ascendant and its true lord, Moon placement and individual limits; do not summarize the ninth-house cluster.',
 configuration:'Name the dominant D1 configuration, exact functional yoga-karaka roles, and one genuine counterweight.',
 tensions:'Analyze a real conjunction or competing Moon/ascendant needs, without recycling the main configuration paragraph.',
 relationships:'D1 seventh ruler, Venus and D9 comparison. Distinguish commitment and privacy; no unsupported marriage prediction or unrelated ninth-house list.',
 career:'D1 tenth and ninth rulers, yoga-karaka when confirmed, and a verified D10 position; name two different vocational forms and conditions, not a guaranteed job.',
 resources:'D1 second and eleventh house owners/locations and their actual distinct roles. No unsupported wealth, travel, business growth or ninth-house cluster.',
 timing:'Exact major/minor period lords and their D1 functional ownership; distinguish period ruler from natal sign, no invented transits or future events.',
 conclusion:'Synthesize three distinct verified themes: personal identity, calling, relationships or timing. No repeated chart inventory.'
};
/** Plain section delimiters work with models that do not support JSON-schema mode.
 * The deterministic report retains the exact factual placements, houses and evidence. */
export function parseAiConsultation(raw:string,specs:ReadonlyArray<AiChapterSpec>,approvedYogas:ReadonlyArray<string>=[],houseLords?:Record<number,string>,compact=false):AiConsultationChapter[]{
 const diagnostic=(id:string,reason:string)=>{if(compact&&process.env.A89_DIAGNOSTICS==='1')console.warn('A8.9 chapter QA: '+id+' '+reason);};
 if(raw.length>24000){diagnostic('response','too_long');return [];}
 const allowed=new Set(specs.map(c=>c.id));
 // A single-chapter response has an unambiguous server-selected identity.
 // Missing decorative markers must not discard otherwise factual prose.
 if(compact&&specs.length===1&&!/\[\[[a-z][a-z-]*\]\]/.test(raw))
  raw='[['+specs[0].id+']]\n'+raw.replace(/^```(?:markdown|text)?\s*|```$/gm,'').trim();
 const markers=[...raw.matchAll(/\[\[([a-z][a-z-]*)\]\]/g)];
 const seen=new Set<string>(),chapters:AiConsultationChapter[]=[];
 if(compact&&!markers.length)diagnostic('response','missing_chapter_markers');
 for(let i=0;i<markers.length;i++){
  const id=markers[i][1];
  if(!allowed.has(id)||seen.has(id))continue;
  seen.add(id);
  const body=raw.slice(markers[i].index!+markers[i][0].length,markers[i+1]?.index??raw.length).trim();
  const parts=body.replace(/^#{1,4} .+$/gm,'').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const normalized=(parts.length===1?parts:parts.slice(0,3)).map(removeConsultationBoilerplate).filter(Boolean);
  if(!normalized.length){diagnostic(id,'empty_body');continue;}
  if(normalized.some(p=>p.length<(compact?70:90)||p.length>1300)){diagnostic(id,'paragraph_length');continue;}
  const rejectedProse=normalized.map(p=>verifyFreeProse(p,approvedYogas)).find(r=>!r.ok);
  if(rejectedProse&&!rejectedProse.ok){diagnostic(id,'factual_policy_'+rejectedProse.reason);continue;}
  const combined=normalized.join(' ');
  // Reject empty headings, a list of isolated keywords, generic short worksheet prompts.
  if(combined.length<(compact?160:145)||!/[\p{L}][^.!?]{12,}[.!?]/u.test(combined))continue;
  if(/(?:гарантовано|неодмінно|точно передбачає|guarantees|will certainly|fatal disease|безумовно)/iu.test(combined)){diagnostic(id,'unfounded_certainty');continue;}
  if(houseLords&&!checkNarrativeLordClaims(combined,houseLords).ok){diagnostic(id,'wrong_lordship');continue;}
  const spec=specs.find(spec=>spec.id===id);
  const enriched=spec?.focus;
  if(enriched){
   // Minimum substance for a reader-facing consultation; an underdeveloped model
   // section falls back to the chart-specific deterministic chapter.
   // A model is an enrichment, not a replacement for a better-written
   // deterministic reading. A very short generic answer is never shown.
   const draftLength=(spec?.draft||[]).join(' ').length;
   if(combined.length<(compact?200:440)||(!compact&&normalized.length<2)||(!compact&&combined.length<Math.min(850,Math.floor(draftLength*0.6)))){diagnostic(id,'insufficient_substance');continue;}
   // Explicit domain-specific gate prevents 700 words of generic motivation from
   // displacing a calculation-grounded chapter. This is editorial, not a proof
   // that every natural-language statement is astrological truth.
   const cues:Record<string,RegExp>={
    portrait:/лагн|управител.{0,18}перш|місяц|ascendant|moon|first.house/iu,
    configuration:/йогакарак|з.{0,10}єднан|сполучен|управител.{0,24}дом|yogakaraka|conjunction|lordship/iu,
    tensions:/сатурн|марс|меркур|moon|saturn|mars|mercury/iu,
    relationships:/венер|сатурн|сьом|навамш|партнер|venus|saturn|seventh|navamsha|relationship/iu,
    career:/десят|марс|дашамш|профес|career|mars|tenth|dashamsha/iu,
    resources:/друг|одинадцят|венер|сонц|ресурс|second|eleventh|venus|sun|resource/iu,
    timing:/махадаш|антардаш|сатурн|місяц|mahadasha|antardasha|saturn|moon/iu,
    conclusion:/лагн|управител|місяц|марс|ascendant|moon|mars|lordship/iu
   };
   if(!compact&&cues[id]&&!cues[id].test(combined)){diagnostic(id,'missing_domain_anchor');continue;}
   if(['portrait','relationships','resources','timing'].includes(id)&&OUT_OF_SCOPE_CLUSTER.test(combined)){diagnostic(id,'out_of_scope_cluster');continue;}
  }
  chapters.push({id,paragraphs:normalized,source:'llm'});
 }
 return chapters;
}

/** Protect the astronomy data contract: only each specific chapter's verified findings
 * are offered to the model; there are no user names, birth dates or locations. */
export function buildAiChapterSpecs(editorial:{
 chapters:ReadonlyArray<{id:string;title:string;evidence:ReadonlyArray<string>;paragraphs?:ReadonlyArray<string>}>;
 findings:ReadonlyArray<{
  id:string;topic:string;ruleId:string;verifiedEvidence:ReadonlyArray<string>;
  traditionalMeaning:string;supportingFactors:ReadonlyArray<string>;counterFactors:ReadonlyArray<string>;limitations:ReadonlyArray<string>;
 }>
}):AiChapterSpec[]{
 return editorial.chapters.filter(c=>CHAPTER_IDS.includes(c.id as typeof CHAPTER_IDS[number])).map(ch=>{
  // Exact chapter anchors, not `any shared evidence token`: the previous matching
  // sent the ninth-house concentration to almost every life-domain chapter.
  const findings=editorial.findings;
  const one=(id:string)=>findings.find(f=>f.id===id);
  const functional=(house:number)=>findings.find(f=>f.id.startsWith('functional-')&&
   f.verifiedEvidence.some(ev=>ev.startsWith('house-lord:'+house+'=')));
  const namedYoga=findings.find(f=>f.id.startsWith('yogakaraka-'));
  const first=(topic:string)=>findings.find(f=>f.topic===topic);
  const time=one('active-dasha');
  const period=(role:'major'|'minor')=>time?.verifiedEvidence.find(x=>x.startsWith('dasha.'+role+'='))?.split('=')[1];
  const byPlanet=(name:string|undefined)=>name?one('functional-'+name.toLowerCase()):undefined;
  const chapters:Record<string,Array<typeof findings[number]|undefined>>={
   portrait:[one('ascendant'),one('moon'),functional(1)],
   configuration:[one('concentration')||one('distributed'),namedYoga,functional(9),functional(10)],
   tensions:[one('mars-saturn'),byPlanet('Saturn'),byPlanet('Mars'),one('moon')],
   relationships:[one('partnership'),functional(7),byPlanet('Venus'),one('moon')],
   career:[one('vocation'),functional(10),namedYoga,functional(9)],
   resources:[one('resources'),functional(2),functional(11)],
   timing:[time,byPlanet(period('major')),byPlanet(period('minor'))],
   conclusion:[one('ascendant'),namedYoga||first('configuration'),one('partnership'),one('vocation'),time]
  };
  const selected=[...new Map((chapters[ch.id]||[]).filter((f):f is typeof findings[number]=>Boolean(f)).map(f=>[f.id,f] as const)).values()].slice(0,3);
  // Groq Free has a shared per-minute token budget: keep factual anchors
  // concise and preserve the full chapter draft only on our own server.
  const facts=selected.map(f=>[
   'Evidence '+f.id+', rule '+f.ruleId, f.traditionalMeaning.slice(0,185),
   f.counterFactors.length?'Counterweight: '+f.counterFactors[0].slice(0,95):''
  ].filter(Boolean).join('. '));
  // D9, D10 and exact dasha evidence live in the deterministic chapter text;
  // the older model input unintentionally lost all of these facts.
  const crossVarga=['relationships','career','timing'].includes(ch.id)?
   (ch.paragraphs||[]).slice(-1).map(t=>'Varga/period context: '+t.slice(0,260)):[];
  // Enough detail for editorial direction without sending 8x full essays;
  // complete, readable content is served from the local authored report.
  const condensedDraft=(ch.paragraphs||[]).map(p=>p.slice(0,260));
  return {id:ch.id,title:ch.title,focus:CHAPTER_FOCUS[ch.id],draft:condensedDraft,
   facts:[...facts,...crossVarga].length?[...facts,...crossVarga]:['No independent evidence; avoid fabricating details.']};
 });
}
