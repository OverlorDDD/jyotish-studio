/** News World domain: external titles and source URLs only; no copied article bodies. */
export const TOPICS=['jyotish','astrology','tarot','yoga','meditation','vedic','self-development','astronomy'] as const;
export type Topic=typeof TOPICS[number];
export type Candidate={url:string;title:string;publishedAt:Date;source:string;language:string};
const terms:Record<Topic,RegExp>={
 jyotish:/jyotish|vedic astrolog|nakshatra|vimshottari|navamsha|сидерич|джйотіш|накшатр/i,
 astrology:/astrolog|horoscope|zodiac|birth chart|natal chart|гороскоп|астролог|зодіак|натальн/i,
 tarot:/tarot|rider.waite|arcana|таро|аркан/i,yoga:/\byoga\b|yogic|asana|pranayama|йог|асан|пранаям/i,
 meditation:/meditat|mindfulness|mantra|медитац|мантр/i,
 vedic:/vedic|vedanta|bhagavad.gita|upanishad|hindu tradition|ведичн|ведант|упанішад|індуїзм/i,
 'self-development':/self.development|personal growth|self.discovery|саморозвит|особистісн.{0,10}розвит/i,
 astronomy:/astronom|telescope|solar eclipse|lunar eclipse|meteor shower|телескоп|затемнен|метеорн/i
};
export const TOPIC_LABELS:Record<Topic,{uk:string;en:string}>={
 jyotish:{uk:'Джйотіш',en:'Jyotish'},astrology:{uk:'Астрологія',en:'Astrology'},
 tarot:{uk:'Таро',en:'Tarot'},yoga:{uk:'Йога',en:'Yoga'},meditation:{uk:'Медитація',en:'Meditation'},
 vedic:{uk:'Ведична традиція',en:'Vedic traditions'},
 'self-development':{uk:'Саморозвиток',en:'Self-development'},astronomy:{uk:'Астрономія',en:'Astronomy'}
};
export function canonicalUrl(input:string):string|null{
 try{
  const u=new URL(input.trim());if(u.protocol!=='https:'||u.username||u.password||u.port||
   u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname.endsWith('.localhost')||
   /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||u.hostname.includes(':'))return null;
  for(const k of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid|ref_src)$/i.test(k))u.searchParams.delete(k);
  u.hash='';return u.toString();
 }catch{return null;}
}
export function classify(c:Candidate){
 const url=canonicalUrl(c.url),title=c.title.replace(/\s+/g,' ').trim();
 if(!url||title.length<15||title.length>240||!Number.isFinite(c.publishedAt.getTime())||
  /astrology is fake|astrology is a pseudoscience|debunk.{0,20}astrology|гороскоп.{0,15}шахрай|casino|coupon code/i.test(title))return null;
 const age=(Date.now()-c.publishedAt.getTime())/3600000;
 if(age < -24||age>24*28)return null;
 const matched=TOPICS.filter(t=>terms[t].test(title));
 if(!matched.length)return null;
 // Astronomy never maps to astrology by association, or silently replaces it.
 const topic=TOPICS.find(t=>matched.includes(t))!;
 const tags=[topic,...matched.filter(x=>x!==topic)].slice(0,5);
 const score=Math.round((40*Math.max(0,1-Math.max(age,0)/336)+
  (topic==='astronomy'?15:topic==='self-development'?24:40))*100)/100;
 return {...c,url,title,topic,tags,score};
}
export function rank(score:number,date:Date,now=Date.now()){
 return score+Math.max(0,40-5*Math.log2(1+Math.max(0,(now-date.getTime())/3600000)));
}
export function parseXml(xml:string,source:string):Candidate[]{
 if(xml.length>1500000||/<!DOCTYPE|<!ENTITY/i.test(xml))return [];
 const field=(node:string,tag:string)=>node.match(new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i'))?.[1]||'';
 const clean=(x:string)=>x.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ')
  .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
  .replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
 return [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0,80).flatMap(([,kind,node])=>{
  const url=kind.toLowerCase()==='entry'
   ?node.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i)?.[1]||field(node,'link'):field(node,'link');
  const title=clean(field(node,'title')),when=clean(field(node,'pubDate')||field(node,'published')||field(node,'updated'));
  const publishedAt=new Date(when);
  return title&&url&&when&&Number.isFinite(publishedAt.getTime())?
   [{url:clean(url),title,publishedAt,source,language:'en'}]:[];
 });
}
