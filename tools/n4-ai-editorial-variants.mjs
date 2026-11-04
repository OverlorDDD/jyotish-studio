/** Variant A/B exist ONLY in the synthetic, explicit opt-in N4 lab runner. */
export const N4_EDITORIAL_VARIANT_VERSION='n4-synthetic-emphasis-v1';
export const N4_SYNTHETIC_EDITORIAL_FOCUS=Object.freeze({
 A:'SYNTHETIC EDITORIAL TEST A: Lead each thematic comparison with exact verified D1 and divisional placements. Explain evidence first, then opportunity and friction, then a realistic practical action. Keep every existing factual and safety rule; do not invent any placement.',
 B:'SYNTHETIC EDITORIAL TEST B: Lead each thematic comparison with a realistic CONDITIONAL decision scene. Then ground it explicitly in verified D1 and divisional placements, explain opportunity versus friction, and finish with a specific practical choice. Keep every existing factual and safety rule; do not invent any placement.'
});
/** Only the system writing focus differs; user message, chart facts, limits and auth stay identical. */
export function n4SyntheticVariantFetcher(transport,variant){
 if(typeof transport!=='function'||!Object.hasOwn(N4_SYNTHETIC_EDITORIAL_FOCUS,variant))
  throw Error('Invalid synthetic editorial transport or variant');
 return async(url,init)=>{
  if(typeof init?.body!=='string')throw Error('Unexpected AI request shape');
  const request=JSON.parse(init.body);
  if(!Array.isArray(request.messages)||request.messages[0]?.role!=='system'||
     typeof request.messages[0].content!=='string'||request.messages[1]?.role!=='user')
   throw Error('Unexpected Direct Jyotish transport contract');
  const nl=String.fromCharCode(10);
  const instructions=nl+nl+N4_EDITORIAL_VARIANT_VERSION+nl+N4_SYNTHETIC_EDITORIAL_FOCUS[variant];
  const amended={...request,messages:[{...request.messages[0],content:request.messages[0].content+instructions},...request.messages.slice(1)]};
  return transport(url,{...init,body:JSON.stringify(amended)});
 };
}

/** Identical models/providers are essential for a meaningful within-chart A/B comparison. */
export function auditN4PairedModelIdentity(rows){
 const pairs=new Map(),issues=[];
 for(const row of rows){
  if(!Number.isInteger(row.seed)||!['uk','en'].includes(row.lang)||!['A','B'].includes(row.variant)||
     typeof row.provider!=='string'||typeof row.model!=='string')continue;
  const key=row.seed+'|'+row.lang;
  const prior=pairs.get(key);
  if(prior && prior.variant!==row.variant &&
     (prior.provider!==row.provider||prior.model!==row.model))
   issues.push({id:row.id,reasons:['paired_provider_or_model_mismatch']});
  else if(!prior)pairs.set(key,row);
 }
 return issues;
}
