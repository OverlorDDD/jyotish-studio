/** Candidate sources. Always inspect source-scan health before claiming coverage.
 * Review 2026-11-14 (production source scans + live feed check):
 * removed — stale for 90+ days: Mountain Astrologer, Llewellyn, Yoga Lily,
 *   Yoga Synergy, Biddy Tarot (last post Aug 2026, mostly course promos);
 *   empty: Lunar Astro; all items off-topic: Clickastro; duplicate of the main
 *   podcast feed: Astrology Podcast audio feed.
 * fixed — Hinduism Today moved to /rss.xml; AstroSage needs the trailing slash.
 * added — EarthSky, Sky & Telescope (astronomy). */
import type {Topic} from './news-domain.ts';
export type SourceKind='news'|'magazine'|'brand';
export type RssSource={key:string;name:string;url:string;hint:Topic;allowSnippet:boolean;kind:SourceKind};
const data:[string,string,string,Topic,boolean][]=[
 ['astrology-podcast','The Astrology Podcast','https://theastrologypodcast.com/feed/','astrology',true],
 ['yoga-journal','Yoga Journal','https://www.yogajournal.com/feed/','yoga',false],
 ['astrosage','AstroSage Magazine','https://horoscope.astrosage.com/feed/','jyotish',false],
 ['astroved','AstroVed','https://astroved.com/blogs/feed','jyotish',false],
 ['astrotalk','AstroTalk Blog','https://astrotalk.com/astrology-blog/feed/','jyotish',false],
 ['hinduism-today','Hinduism Today','https://www.hinduismtoday.com/rss.xml','vedic',false],
 ['hindu-press','Hindu Press International','https://www.hinduismtoday.com/hpi/feed/','vedic',false],
 ['tricycle','Tricycle','https://tricycle.org/feed/','meditation',false],
 ['lions-roar',"Lion's Roar",'https://www.lionsroar.com/feed/','meditation',false],
 ['mindful','Mindful','https://www.mindful.org/feed/','meditation',false],
 ['astrology-hub','Astrology Hub','https://astrologyhub.com/feed/','astrology',false],
 ['astrotwins','The AstroTwins','https://astrostyle.com/feed/','astrology',false],
 ['elephant-journal','Elephant Journal','https://www.elephantjournal.com/feed/','self-development',false],
 ['yoga-basics','Yoga Basics','https://www.yogabasics.com/feed/','yoga',false],
 // Sky news for the Astronomy hub (verified 2026-11-14: several stories a week).
 ['earthsky','EarthSky','https://earthsky.org/feed/','astronomy',false],
 ['sky-and-telescope','Sky & Telescope','https://skyandtelescope.org/feed/','astronomy',false]
];
/** Editorial weight of a publisher on the GalaxiNews front page.
 * news: reporting on events; magazine: edited long-form; brand: blogs of
 * services that sell readings/consultations — kept in topic pages, but never
 * leading the front page, where they read as advertising. */
const KIND:Record<string,SourceKind>={
 'hindu-press':'news','hinduism-today':'magazine','tricycle':'magazine','lions-roar':'magazine',
 'mindful':'magazine','yoga-journal':'magazine','astrology-podcast':'magazine',
 'earthsky':'news','sky-and-telescope':'magazine'
};
export const RSS_SOURCES:readonly RssSource[]=data.map(([key,name,url,hint,allowSnippet])=>({key,name,url,hint,allowSnippet,kind:KIND[key]||'brand'}));
const hostOf=(raw:string)=>{try{return new URL(raw).hostname.replace(/^www\./,'').toLowerCase();}catch{return '';}};
/** Kind for a stored article. Own Galaxiora items are 'own'; GDELT-indexed
 * outlets (mainstream press) count as 'news'; curated RSS uses KIND. */
export function sourceKindFor(article:{url:string;source:string}):SourceKind|'own'{
 if(/^Galaxiora\b/.test(article.source))return 'own';
 const host=hostOf(article.url);
 // Several feeds share a host (hinduismtoday.com hosts HPI and the magazine).
 const byName=RSS_SOURCES.find(s=>s.name===article.source);
 if(byName)return byName.kind;
 const byHost=RSS_SOURCES.find(s=>hostOf(s.url)===host);
 return byHost?byHost.kind:'news';
}
/** GDELT allows about one request per 5 s and answers cloud IPs with 429 when
 * pressed; 13 separate queries tripped the breaker every cycle. Four broader
 * queries cover the same topics (classification still decides the topic). */
export const GDELT_QUERIES=[
 ['vedic-jyotish','"Vedic astrology" OR Jyotish OR nakshatra OR "Bhagavad Gita" OR "vedic tradition"','jyotish'],
 ['astrology','astrology OR horoscope OR zodiac OR "natal chart"','astrology'],
 ['tarot','"tarot cards" OR "tarot reading" OR "tarot deck" OR "major arcana"','tarot'],
 ['yoga-meditation','"yoga practice" OR "yoga philosophy" OR "meditation practice" OR "mindfulness meditation"','yoga']
] as const;

/** Optional operator quarantine, not a silent removal of unreliable publishers.
 * Example: NEWS_SOURCE_DISABLED_KEYS=elephant-journal,astroved
 * GDELT group keys use the full 'gdelt-' prefix. */
export function disabledNewsSourceKeys(env=process.env):Set<string>{
 return new Set((env.NEWS_SOURCE_DISABLED_KEYS||'').split(',').map(x=>x.trim()).filter(Boolean));
}
export function selectedNewsSources(env=process.env){
 const disabled=disabledNewsSourceKeys(env);
 return {rss:RSS_SOURCES.filter(s=>!disabled.has(s.key)),
  gdelt:GDELT_QUERIES.filter(([key])=>!disabled.has('gdelt-'+key)),
  disabled:[...disabled].sort()};
}
