/** GalaxiNews public boundary for server components: types, topic map,
 * locale-safe titles/teasers, story URLs and read-only API fetches.
 * No cookies are forwarded: every page here is the same for every visitor. */
export type NewsLocale='uk'|'en';
export type NewsTopic='jyotish'|'astrology'|'tarot'|'yoga'|'meditation'|'vedic'|'self-development'|'astronomy';
export type SkyEvent={kind:string;body?:string;atUtc:string;sign?:number;longitude?:number;fromSign?:number;toSign?:number};
export type NewsItem={id:string;url:string;title:string;source:string;language:string;topic:NewsTopic;tags:string[];
 publishedAt:string;publishedAccuracy?:'published'|'observed';summary?:string|null;summaryKind?:string;
 summaryUk?:string|null;summaryEn?:string|null;titleUk?:string|null;titleEn?:string|null;
 imageUrl?:string|null;thumbUrl?:string|null;imageKind?:'licensed'|'publisher'|null;imageCredit?:string|null;
 imageLicense?:string|null;imageLicenseUrl?:string|null;imagePageUrl?:string|null;
 sourceKind?:'own'|'news'|'magazine'|'brand';event?:SkyEvent|null};
export type NewsFeed={items:NewsItem[];total:number;articleCount?:number;lastScan?:{createdAt:string}|null};

export const NEWS_TOPICS:readonly NewsTopic[]=['astrology','jyotish','astronomy','tarot','yoga','meditation','vedic','self-development'];
export const TOPIC_COPY:Record<NewsTopic,{uk:string;en:string;color:string;leadUk:string;leadEn:string}>={
 astrology:{uk:'Астрологія',en:'Astrology',color:'#8FB1F0',leadUk:'Події неба, гороскопи й астрологічні новини світу.',leadEn:'Sky events, horoscopes and astrology news from around the world.'},
 jyotish:{uk:'Джйотиш',en:'Jyotish',color:'#E7BD72',leadUk:'Ведична астрологія: накшатри, транзити, традиція й дослідження.',leadEn:'Vedic astrology: nakshatras, transits, tradition and research.'},
 astronomy:{uk:'Астрономія',en:'Astronomy',color:'#A7C4E8',leadUk:'Фази Місяця, затемнення, метеорні потоки й точні розрахунки Galaxiora.',leadEn:'Moon phases, eclipses, meteor showers and Galaxiora’s precise calculations.'},
 tarot:{uk:'Таро',en:'Tarot',color:'#C9A8F0',leadUk:'Колоди, історія карт і практика Таро.',leadEn:'Decks, card history and Tarot practice.'},
 yoga:{uk:'Йога',en:'Yoga',color:'#8FD3B8',leadUk:'Практика, традиції та дослідження йоги.',leadEn:'Yoga practice, traditions and research.'},
 meditation:{uk:'Медитація',en:'Meditation',color:'#8FD3B8',leadUk:'Медитація, уважність і буддійські традиції.',leadEn:'Meditation, mindfulness and Buddhist traditions.'},
 vedic:{uk:'Ведична традиція',en:'Vedic tradition',color:'#F0B48F',leadUk:'Храми, свята, тексти й життя індуїстських громад світу.',leadEn:'Temples, festivals, texts and Hindu communities worldwide.'},
 'self-development':{uk:'Саморозвиток',en:'Self-development',color:'#CED6E6',leadUk:'Духовні практики й особистісний розвиток.',leadEn:'Spiritual practice and personal growth.'}
};
export const isNewsTopic=(v:string):v is NewsTopic=>(NEWS_TOPICS as readonly string[]).includes(v);

const origin=()=>process.env.INTERNAL_API_ORIGIN||'http://127.0.0.1:4000';
async function getJson<T>(path:string,timeout=3500):Promise<T|null>{
 try{
  const res=await fetch(origin()+path,{cache:'no-store',signal:AbortSignal.timeout(timeout)});
  return res.ok?await res.json() as T:null;
 }catch{return null;}
}
export async function fetchNewsFeed(o:{locale:NewsLocale;topic?:NewsTopic;scope?:'all'|'portal'|'own';limit?:number;sort?:'relevance'|'latest'}):Promise<NewsFeed>{
 const q=new URLSearchParams({lang:o.locale,limit:String(o.limit??24),sort:o.sort??'relevance',scope:o.scope??'portal'});
 if(o.topic)q.set('topic',o.topic);
 const data=await getJson<NewsFeed>('/api/v1/news/feed?'+q.toString());
 return data&&Array.isArray(data.items)?data:{items:[],total:0};
}
export async function fetchNewsStory(key:string){
 if(!/^[0-9a-f]{8}$/.test(key))return null;
 return getJson<{item:NewsItem;related:NewsItem[]}>('/api/v1/news/story/'+key);
}
export async function fetchSkyEvents(startDate:string,days=14):Promise<SkyEvent[]>{
 const data=await getJson<{events?:SkyEvent[]}>('/api/v1/astronomy/events?start='+startDate+'&days='+days+'&zone=Europe/Kyiv');
 return Array.isArray(data?.events)?data!.events!:[];
}
export type PanchangaToday={date:string;sunrise:{tithi:{number:number;paksha:string;numberWithinPaksha:number};
 moonSign:number;nakshatra:{number:number;name:string;pada:number};vara:{number:number;name:string};yoga:{number:number;name:string}};
 changes?:{kind:string;atUtc:string;nextIndex:number}[]};
export async function fetchPanchangaToday(date:string){
 return getJson<PanchangaToday>('/api/v1/panchanga/day?date='+date+'&zone=Europe/Kyiv&latitude=50.4501&longitude=30.5234');
}

/** Kyiv civil date YYYY-MM-DD for an instant. */
export function kyivDate(at=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
}
export function formatKyiv(iso:string,locale:NewsLocale,opts:Intl.DateTimeFormatOptions){
 const d=new Date(iso);if(!Number.isFinite(d.getTime()))return '';
 return new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{timeZone:'Europe/Kyiv',...opts}).format(d).replace(/\s*р\.$/,'');
}
export const kyivTime=(iso:string)=>formatKyiv(iso,'uk',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function relativeAge(iso:string,locale:NewsLocale,now=Date.now()){
 const t=Date.parse(iso);if(!Number.isFinite(t))return '';
 const min=Math.max(1,Math.round((now-t)/60000));
 if(min<60)return locale==='uk'?min+' хв тому':min+' min ago';
 const h=Math.round(min/60);
 if(h<24)return locale==='uk'?h+' год тому':h+' h ago';
 return formatKyiv(iso,locale,{day:'numeric',month:'long'});
}

const HINDI=/[ऀ-ॿ]/u,CYR=/[Ѐ-ԯ]/u,LAT=/[A-Za-z]/;
export function newsTitle(item:NewsItem,locale:NewsLocale){
 const t=locale==='uk'?item.titleUk:item.titleEn||(LAT.test(item.title)&&!CYR.test(item.title)?item.title:null);
 return t&&!HINDI.test(t)?t.trim():null;
}
/** Only real, language-matched teasers; never title-restating boilerplate. */
export function newsTeaser(item:NewsItem,locale:NewsLocale){
 const c=locale==='uk'?item.summaryUk:(item.summaryEn||(/^en/.test(item.language)?item.summary:null));
 if(!c||HINDI.test(c))return null;
 if(locale==='uk'&&!CYR.test(c))return null;
 if(locale==='en'&&(!LAT.test(c)||CYR.test(c)))return null;
 if(/Це орієнтир за назвою|Публікація джерела|Матеріал джерела|Орієнтир за заголовком|Read the original article|This publication by|This article from|^Час події за Swiss|^Swiss Ephemeris (event time|calculates)/i.test(c))return null;
 return c.trim();
}
export const isOwn=(item:NewsItem)=>item.sourceKind==='own'||/^Galaxiora\b/.test(item.source);
export function sourceLabel(item:NewsItem,locale:NewsLocale){
 if(isOwn(item))return 'Galaxiora';
 return item.source.replace(/^www\./,'');
}
/** /uk/news/venera-rozvertaietsia-…-98ad1bea — readable words + 8-hex key. */
const TRANSLIT:Record<string,string>={а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia','’':'',"'":''};
export function storySlug(item:Pick<NewsItem,'id'|'title'|'titleUk'|'titleEn'>,locale:NewsLocale){
 const base=(locale==='uk'?item.titleUk:item.titleEn)||item.title;
 const words=base.toLowerCase().split('').map(ch=>TRANSLIT[ch]??ch).join('')
  .normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').split('-').filter(Boolean);
 let out='';for(const w of words){if((out+'-'+w).length>64)break;out=out?out+'-'+w:w;}
 return (out?out+'-':'')+item.id.slice(0,8).toLowerCase();
}
export const storyKey=(slug:string)=>/(?:^|-)([0-9a-f]{8})$/.exec(slug)?.[1]||null;
export const storyPath=(item:NewsItem,locale:NewsLocale)=>'/'+locale+'/news/'+storySlug(item,locale);
export const topicPath=(topic:NewsTopic,locale:NewsLocale)=>'/'+locale+'/news/'+topic;
/** Only first-party stories are indexable: aggregated translations are not
 * original reporting, so they stay `noindex, follow` (Google's scaled-content policy). */
export const storyIndexable=(item:NewsItem)=>isOwn(item);
