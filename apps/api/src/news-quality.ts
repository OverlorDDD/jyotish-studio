/** Conservative source-preserving news event grouping. No LLM, no new persistence. */
export type QualityArticle={
 id:string;topic:string;title:string;titleUk?:string|null;url?:string;source:string;
 publishedAt:Date;publishedAccuracy?:string|null;imageUrl?:string|null;
 summaryUk?:string|null;summaryEn?:string|null;feedDescription?:string|null;summary?:string|null
};
const STOP=new Set(['about','again','after','from','with','their','today','latest','news',
 'guide','explained','traditional','through','these','those','tarot','yoga','astrology',
 'jyotish','vedic','what','your','the','and','for','україна','сьогодні','новини',
 'практика','традиції','астрологія','джйотіш','йога','таро','для','про','щодо']);
const MONTHS=new Set(['january','february','march','april','may','june','july','august',
 'september','october','november','december','січня','лютого','березня','квітня',
 'травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']);
const tokensCache=new WeakMap<object,Set<string>[]>();
function wordSets(row:QualityArticle):Set<string>[]{
 const old=tokensCache.get(row);if(old)return old;
 const sets=[row.title,row.titleUk||''].filter(Boolean).map(text=>
  new Set((text.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]{3,}/gu)||[])
   .filter(x=>!STOP.has(x))));
 tokensCache.set(row,sets);return sets;
}
function conflictsOnDate(x:Set<string>,y:Set<string>){
 const anchors=(s:Set<string>)=>[...s].filter(t=>/\d/.test(t)||MONTHS.has(t));
 const a=anchors(x),b=anchors(y);
 return Boolean(a.length&&b.length&&!a.some(t=>b.includes(t)));
}
export function sameNewsEvent(a:QualityArticle,b:QualityArticle):boolean{
 if(a.id===b.id)return true;
 if(a.topic!==b.topic)return false;
 const delta=Math.abs(a.publishedAt.getTime()-b.publishedAt.getTime());
 if(!Number.isFinite(delta)||delta>72*3600000)return false;
 if(a.url&&b.url&&a.url===b.url)return true;
 for(const x of wordSets(a))for(const y of wordSets(b)){
  if(x.size<4||y.size<4||conflictsOnDate(x,y))continue;
  const common=[...x].filter(w=>y.has(w)).length;
  if(common>=4&&common/Math.min(x.size,y.size)>=0.75&&
   common/(x.size+y.size-common)>=0.5)return true;
 }
 return false;
}
/** Retain the highest-ranked (or newest in Latest) source; never change the DB. */
export function collapseNewsEvents<T extends QualityArticle>(items:readonly T[]):T[]{
 const seen=new Map<string,T[]>(),output:T[]=[];
 for(const article of items){
  const peers=seen.get(article.topic)||[];
  if(peers.some(previous=>sameNewsEvent(previous,article)))continue;
  peers.push(article);seen.set(article.topic,peers);output.push(article);
 }
 return output;
}
export function newsQualitySnapshot(items:readonly QualityArticle[],now=Date.now()){
 const retained=collapseNewsEvents(items);
 return {sampledArticles:items.length,visibleAfterGrouping:retained.length,
  duplicatePresentationsAvoided:items.length-retained.length,
  sampledPublishers:new Set(items.map(x=>x.source)).size,
  sampledTopics:new Set(items.map(x=>x.topic)).size,
  within48Hours:items.filter(x=>now>=x.publishedAt.getTime()&&now-x.publishedAt.getTime()<=48*3600000).length,
  missingUkrainianTitles:items.filter(x=>!x.titleUk).length,
  missingGroundedPreviews:items.filter(x=>!x.summaryUk&&!x.summaryEn&&!x.feedDescription&&!x.summary).length,
  noApprovedImage:items.filter(x=>!x.imageUrl).length,
  observedNotPublisherDated:items.filter(x=>x.publishedAccuracy==='observed').length,
  scope:'latest 600 published candidates; no live licensing or SLO claim'};
}
