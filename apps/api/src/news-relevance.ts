/** GalaxiNews Relevance Engine v2.
 * Explicit personal preferences only. No LLM, natal data, passive tracking or demographics.
 * Candidate generation -> scoring -> source diversity + exploration re-ranking.
 */
import {rank,diversify} from './news-domain.ts';
export type NewsCandidate={id:string;topic:string;tags:string[];source:string;score:number;publishedAt:Date;title?:string;titleUk?:string|null};
export type NewsFeedback={articleId:string;vote:string;article:{topic:string;tags:string[];title?:string;titleUk?:string|null}};
export type PersonalReason='selected_topic'|'similar_to_liked'|'fresh_discovery'|'world_highlight';
export type PersonalScore={score:number;reason:PersonalReason;matchingTag:string|null};

const TOP_LEVEL=new Set(['jyotish','astrology','tarot','yoga','meditation','vedic','self-development','astronomy']);
const GENERIC=new Set(['about','with','your','this','from','into','what','guide','today','world',
 'коли','його','ваше','свої','для','про','який','якої','чому','щодо','вплив','новини',
 'tarot','yoga','astrology','jyotish','vedic','horoscope','астрологія','таро','йога','джйотіш']);
function headlineWords(row:{title?:string;titleUk?:string|null}){
 const str=(row.titleUk||row.title||'').toLowerCase().normalize('NFKC');
 return new Set((str.match(/[\p{L}\p{N}]{4,}/gu)||[]).filter(w=>!GENERIC.has(w)));
}
/** Broad subject alone is deliberately insufficient to block an entire topic. */
export function strongNewsSimilarity(article:NewsCandidate,history:NewsFeedback['article']){
 const sharedNiche=article.tags.some(t=>!TOP_LEVEL.has(t)&&history.tags.includes(t));
 if(sharedNiche&&article.topic===history.topic)return true;
 const a=headlineWords(article),b=headlineWords(history);
 if(a.size<2||b.size<2)return false;
 const intersection=[...a].filter(w=>b.has(w)).length;
 return article.topic===history.topic&&intersection>=2&&intersection/Math.min(a.size,b.size)>=0.6;
}

export function computePersonalScore(article:NewsCandidate,tags:readonly string[],reactions:readonly NewsFeedback[],
 now=Date.now()):PersonalScore{
 const base=rank(article.score,article.publishedAt,now);
 const preferred=article.tags.find(tag=>tags.includes(tag))||(tags.includes(article.topic)?article.topic:null);
 let feedback=0;
 for(const entry of reactions){
  if(entry.articleId===article.id)continue;
  // Soft negative signals must never ban a whole category of stories.
  const overlap=entry.article.tags.filter(tag=>article.tags.includes(tag));
  if(!overlap.length&&entry.article.topic!==article.topic)continue;
  const weight=Math.min(3,Math.max(1,overlap.length));
  feedback+=(entry.vote==='YES'?1:-1)*weight;
 }
 const feedbackBonus=Math.max(-12,Math.min(15,feedback*2.5));
 const chosenBonus=preferred?20+(preferred!==article.topic?5:0):0;
 const specificPositive=feedbackBonus>0&&!preferred;
 return {score:Math.round((base+chosenBonus+feedbackBonus)*100)/100,
  reason:preferred?'selected_topic':specificPositive?'similar_to_liked':
   (now-article.publishedAt.getTime()<48*3600000?'fresh_discovery':'world_highlight'),
  matchingTag:preferred};
}
/** Deterministic 1-in-5 discovery slots stop the personal feed becoming a hard filter bubble. */
export function rankPersonalNews<T extends NewsCandidate>(items:readonly T[],tags:readonly string[],
 reactions:readonly NewsFeedback[],now=Date.now()){
 const negatives=reactions.filter(r=>r.vote==='NO');
 const rejected=new Set(negatives.map(r=>r.articleId));
 // Suppress truly close neighbors of explicitly dismissed stories. A generic
 // category match alone is never sufficient to hide every article in that area.
 const stronglySimilar=new Set(items.filter(a=>negatives.some(r=>
  strongNewsSimilarity(a,r.article))).map(a=>a.id));
 const seen=new Set<string>();
 const available=items.filter(a=>!rejected.has(a.id)&&!stronglySimilar.has(a.id)&&!seen.has(a.id)&&!!seen.add(a.id));
 const scores=new Map(available.map(a=>[a.id,computePersonalScore(a,tags,reactions,now)]));
 const best=diversify([...available].sort((a,b)=>scores.get(b.id)!.score-scores.get(a.id)!.score||
  b.publishedAt.getTime()-a.publishedAt.getTime()),3);
 if(!tags.length&&!reactions.length)
  return best.map(a=>({...a,personalReason:scores.get(a.id)!.reason,matchingTag:null}));
 const discovery=available.filter(a=>!a.tags.some(tag=>tags.includes(tag))&&!tags.includes(a.topic))
  .sort((a,b)=>rank(b.score,b.publishedAt,now)-rank(a.score,a.publishedAt,now));
 const output:T[]=[];const used=new Set<string>();
 for(let i=0;i<best.length;i++){
  // At most 20% dedicated exploration; never claim it follows explicit interests.
  const slot=(i+1)%5===0?discovery.find(a=>!used.has(a.id)):null;
  const candidate=slot||best.find(a=>!used.has(a.id));
  if(!candidate)break;
  output.push(candidate);used.add(candidate.id);
 }
 return output.map(a=>({...a,personalReason:scores.get(a.id)!.reason,matchingTag:scores.get(a.id)!.matchingTag}));
}
