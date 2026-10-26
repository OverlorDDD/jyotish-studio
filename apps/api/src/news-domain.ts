/** GalaxiNews World: source metadata only; no copied full article texts or AI-invented facts. */
export const TOPICS=['jyotish','astrology','tarot','yoga','meditation','vedic','self-development','astronomy'] as const;
export type Topic=typeof TOPICS[number];
export type Candidate={url:string;title:string;publishedAt:Date;source:string;language:string;
 description?:string;imageUrl?:string;imageLicense?:string;imageCredit?:string;imageFeedPreview?:boolean;publishedAccuracy?:'published'|'observed';hint?:Topic;allowSnippet?:boolean};
const terms:Record<Topic,RegExp>={
 jyotish:/jyotish|vedic astrolog|nakshatra|vimshottari|navamsha|dasha|сидерич|джйотіш|накшатр/i,
 astrology:/astrolog|horoscope|zodiac|birth chart|natal chart|retrograde|гороскоп|астролог|зодіак|натальн/i,
 tarot:/tarot|rider.waite|arcana|таро|аркан/i,
 yoga:/\byoga\b|yogic|asana|pranayama|йог|асан|пранаям/i,
 meditation:/meditat|mindfulness|mantra|медитац|мантр/i,
 vedic:/vedic|vedanta|bhagavad.gita|upanishad|hindu tradition|hinduism|ведичн|ведант|упанішад|індуїзм/i,
 'self-development':/self.development|personal growth|self.discovery|духовн.{0,10}практик|саморозвит|особистісн.{0,10}розвит/i,
 astronomy:/astronom|telescope|solar eclipse|lunar eclipse|meteor shower|телескоп|затемнен|метеорн/i
};
export const TOPIC_LABELS:Record<Topic,{uk:string;en:string}>={
 jyotish:{uk:'Джйотіш',en:'Jyotish'},astrology:{uk:'Астрологія',en:'Astrology'},
 tarot:{uk:'Таро',en:'Tarot'},yoga:{uk:'Йога',en:'Yoga'},
 meditation:{uk:'Медитація',en:'Meditation'},vedic:{uk:'Ведична традиція',en:'Vedic traditions'},
 'self-development':{uk:'Саморозвиток',en:'Self-development'},astronomy:{uk:'Астрономія',en:'Astronomy'}
};
export function canonicalUrl(input:string):string|null{
 try{
  const u=new URL(input.trim());
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname.length>200||
   u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname.endsWith('.localhost')||
   /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||u.hostname.includes(':'))return null;
  for(const k of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid|ref_src|mc_cid|mc_eid)$/i.test(k))u.searchParams.delete(k);
  u.hash='';return u.toString();
 }catch{return null;}
}
/** Keep only displayable text; no copied HTML, scripts, or full article bodies. */
export function cleanDescription(input:string):string{
 return input.slice(0,18000).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]*>/g,' ')
  .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/gi,(m)=>{
   const e:{[k:string]:string}={'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"};
   return e[m.toLowerCase()]||m;
  }).replace(/&#(\d+);/g,(_,v)=>{const n=Number(v);return n>31&&n<1114112?String.fromCodePoint(n):'';})
  .replace(/\s+/g,' ').trim();
}
/** The Galaxiora editorial newsdesk does not aggregate polemics or hostile debunking.
 * Flag clear critique headlines; ambiguous opinion pieces need human review.
 * Do not automatically exclude neutral reporting just because it mentions skepticism. */
export function editorialDecision(title:string,description=''): 'REJECT'|'REVIEW'|'ACCEPT' {
 const headline=cleanDescription(title).toLowerCase();
 const teaser=cleanDescription(description).toLowerCase().slice(0,500);
 const content=headline+' '+teaser;
 if(/(?:astrology|horoscope|tarot|vedic astrology|horoscopes).{0,50}(?:is fake|is a fraud|is a scam|pseudoscience|debunked|bunk|quackery|nonsense|doesn.t work)|(?:debunk(?:ing|ed)?|expos(?:e|ing)|why not to believe).{0,45}(?:astrology|horoscopes|tarot)|(?:астрологія|таро|гороскопи).{0,50}(?:псевдонаук|шахрайств|обман|вигадк)|(?:викриття|розвінчан).{0,40}(?:астролог|таро|гороскоп)/i.test(content))return 'REJECT';
 if(/(?:is astrology|astrology and science|skepti(?:c|k)|critici[sz]m|critical look|the problem with horoscopes|чи працює астрологія|критика астрології)/i.test(headline))return 'REVIEW';
 return 'ACCEPT';
}
export function publisherDomain(raw:string):string|null {
 const u=canonicalUrl(raw);if(!u)return null;
 const host=new URL(u).hostname.toLowerCase();
 return host.startsWith('www.')?host.slice(4):host;
}
export function classifyWithReason(c:Candidate):{article:ReturnType<typeof classify>|null;reason:string}{
 const a=classify(c);
 if(a)return {article:a,reason:'accepted'};
 if(editorialDecision(c.title,c.description)==='REJECT')return {article:null,reason:'editorial_exclusion'};
 if(editorialDecision(c.title,c.description)==='REVIEW')return {article:null,reason:'editorial_review'};
 if(!canonicalUrl(c.url))return {article:null,reason:'invalid_url'};
 if(!Number.isFinite(c.publishedAt.getTime())||c.publishedAt.getTime()>Date.now()+86400000||
  c.publishedAt.getTime()<Date.now()-1000*60*60*24*90)return {article:null,reason:'date_out_of_range'};
 if(c.title.length<15||c.title.length>240)return {article:null,reason:'invalid_title'};
 if(/astrology is fake|astrology is a pseudoscience|debunk.{0,20}astrology|casino|coupon code/i.test(c.title))return {article:null,reason:'editorial_exclusion'};
 return {article:null,reason:'off_topic'};
}
/** Factual metadata paragraph in UA/EN; never claims to have read a full article.
 * When a publisher explicitly allows RSS previews, use a short, attributed snippet.
 * Otherwise explain only the observable headline/topic and mark it title-based.
 */
/** Article-level media metadata is not a blanket publishing licence.
 * Only explicit CC0/CC-BY metadata, or a publisher approved via env, can render. */
export function safeImageUrl(raw:string,license='',publisher='',feedPreview=false):string|null{
 const url=canonicalUrl(raw);
 if(!url||/\.(?:svg|gif|html|js)(?:\?|$)/i.test(url))return null;
 try{
  const host=new URL(url).hostname;
  const grant=(process.env.NEWS_IMAGE_ALLOWED_HOSTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const allowedHost=grant.some(x=>x===host);
  const explicitLicense=/creativecommons\.org\/licenses\/by(?:-sa)?\/|creativecommons\.org\/publicdomain\/|(?:^|\s)(?:CC0|CC-BY(?:-SA)?)(?:\s|$)/i.test(license);
  // External RSS image enclosures are intended as linked publisher previews. Never copy the media bytes.
  if(!allowedHost&&!explicitLicense&&!feedPreview)return null;
  return url;
 }catch{return null;}
}
/** No boilerplate, guessed article detail or fake one-paragraph summaries. */
export function articlePreview(c:Candidate,topic:Topic){
 const desc=cleanDescription(c.description||'');
 if(c.allowSnippet&&desc.length>=45){
  const excerpt=desc.slice(0,285).replace(/\s+\S*$/,'').trim();
  return {summary:excerpt,summaryKind:'source_excerpt' as const};
 }
 return {summary:'',summaryKind:'needs_editorial' as const};
}
export function classify(c:Candidate){
 const url=canonicalUrl(c.url),title=c.title.replace(/\s+/g,' ').trim();
 if(!url||title.length<15||title.length>240||!Number.isFinite(c.publishedAt.getTime())||
  editorialDecision(title,c.description)!=='ACCEPT'||/casino|coupon code/i.test(title))return null;
 const age=(Date.now()-c.publishedAt.getTime())/3600000;
 if(age < -24||age>24*90)return null;
 const matched=TOPICS.filter(t=>terms[t].test(title+' '+cleanDescription(c.description||'').slice(0,600)));
 if(!matched.length&&!(c.hint&&cleanDescription(c.description||'').length>60))return null;
 const priority:Topic[]=['jyotish','tarot','yoga','vedic','meditation','astrology','self-development','astronomy'];
 const primary=priority.find(t=>matched.includes(t))||(c.hint&&c.hint!=='astronomy'?c.hint:null);
 if(!primary)return null;
 // Astronomy is opt-in topic: no escalation to astrology, unless explicitly in text.
 const tags=[primary,...matched.filter(x=>x!==primary)].slice(0,5);
 const quality=c.description?.length&&cleanDescription(c.description).length>=70?8:0;
 const topicWeight=primary==='astronomy'?12:primary==='self-development'?24:42;
 const score=Math.round((35*Math.max(0,1-Math.max(age,0)/(24*30))+topicWeight+quality)*100)/100;
 return {...c,url,title,topic:primary,tags,score,
  imageUrl:c.imageUrl?safeImageUrl(c.imageUrl,c.imageLicense,c.source,Boolean(c.imageFeedPreview)):null,
  imageCredit:cleanDescription(c.imageCredit||c.source).slice(0,160),
  ...articlePreview(c,primary)};
}
export function rank(score:number,date:Date,now=Date.now()){
 return score+Math.max(0,40-5*Math.log2(1+Math.max(0,(now-date.getTime())/3600000)));
}
/** Stable publisher diversity: first pass max 3 per domain, then remaining stories. */
export function diversify<T extends {source:string}>(rows:T[],maxPerSource=3):T[]{
 const counts=new Map<string,number>(),selected:T[]=[],overflow:T[]=[];
 for(const row of rows){
  const n=counts.get(row.source)||0;
  if(n>=maxPerSource)overflow.push(row);
  else{counts.set(row.source,n+1);selected.push(row);}
 }
 return [...selected,...overflow];
}
/** Strictly bounded RSS/Atom metadata reader; no DTD, entity expansion or full body storage. */
export function parseXml(xml:string,source:string):Candidate[]{
 if(xml.length>1500000||/<!DOCTYPE|<!ENTITY/i.test(xml))return [];
 const field=(node:string,tag:string)=>node.match(new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i'))?.[1]||'';
 const itemRx=/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
 return [...xml.matchAll(itemRx)].slice(0,100).flatMap(([,kind,node])=>{
  const url=kind.toLowerCase()==='entry'
   ?node.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i)?.[1]||field(node,'link'):field(node,'link');
  const title=cleanDescription(field(node,'title'));
  const when=cleanDescription(field(node,'pubDate')||field(node,'published')||field(node,'updated'));
  const publishedAt=new Date(when);
  if(!title||!url||!when||!Number.isFinite(publishedAt.getTime()))return [];
  // Parse only metadata, not content:encoded or full HTML bodies.
  const description=cleanDescription(field(node,'description')||field(node,'summary')).slice(0,1100);
  const mediaTags=[...node.matchAll(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*>/gi)];
  const attr=(tag:string,name:string)=>tag.match(new RegExp('\\b'+name+'=["\\x27]([^"\\x27]+)["\\x27]','i'))?.[1]||'';
  const found=mediaTags.find(t=>{
   const u=attr(t[0],'url'),kind=attr(t[0],'type');
   return u&&(/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(u)||/^image\/(?:jpe?g|png|webp)$/i.test(kind));
  });
  const imageLicense=cleanDescription(field(node,'license')||field(node,'media:license'));
  // Some publishers place their lead photo only inside the RSS description or
  // content:encoded; inspect image metadata without copying the full article.
  const embeddedBody=node.match(/<content:encoded(?:\s[^>]*)?>([\s\S]*?)<\/content:encoded>/i)?.[1]||'';
  const imageInFeed=(field(node,'description')||embeddedBody).match(
   /<img\b[^>]*?\b(?:src|data-src)=["'](https:\/\/[^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/i)?.[1]||'';
  const imageUrl=found?attr(found[0],'url'):imageInFeed;
  const imageCredit=cleanDescription(field(node,'media:credit')||source).slice(0,150);
  return [{url:cleanDescription(url),title,publishedAt,source,description,
   imageUrl,imageLicense,imageCredit,imageFeedPreview:Boolean(imageUrl),language:'en',publishedAccuracy:'published' as const}];
 });
}
