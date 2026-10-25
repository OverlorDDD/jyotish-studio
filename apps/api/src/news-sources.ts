/** Unverified candidate sources. Always inspect source-scan health before claiming coverage. */
import type {Topic} from './news-domain.ts';
export type RssSource={key:string;name:string;url:string;hint:Topic;allowSnippet:boolean};
const data:[string,string,string,Topic,boolean][]=[
 ['astrology-podcast','The Astrology Podcast','https://theastrologypodcast.com/feed/','astrology',true],
 ['astrology-podcast-audio','The Astrology Podcast','https://theastrologypodcast.com/feed/podcast/','astrology',true],
 ['biddy-tarot','Biddy Tarot','https://www.biddytarot.com/feed/','tarot',false],
 ['yoga-journal','Yoga Journal','https://www.yogajournal.com/feed/','yoga',false],
 ['llewellyn','Llewellyn Unbound','https://www.llewellyn.com/blog/feed/','tarot',false],
 ['yoga-lily','Yoga Lily','https://yogalily.com/feed/','yoga',false],
 ['yoga-synergy','Yoga Synergy','https://yogasynergy.com/feed/','yoga',false],
 ['astrology-weekly','Astrology Weekly','https://blog.astrologyweekly.com/rss.php','astrology',false],
 ['astrosage','AstroSage Magazine','https://astrosage.com/magazine/feed/','jyotish',false],
 ['astroved','AstroVed','https://www.astroved.com/articles/feed','jyotish',false],
 ['astrotalk','AstroTalk Blog','https://astrotalk.com/astrology-blog/feed/','jyotish',false],
 ['clickastro','Clickastro','https://www.clickastro.com/blog/feed/','jyotish',false],
 ['indastro','Indastro','https://www.indastro.com/astrology/blog/feed/','jyotish',false],
 ['lunar-astro','Lunar Astro','https://lunarastro.org/blog/feed/','jyotish',false],
 ['hinduism-today','Hinduism Today','https://www.hinduismtoday.com/feed/','vedic',false],
 ['hindu-press','Hindu Press International','https://www.hinduismtoday.com/hpi/feed/','vedic',false],
 ['tricycle','Tricycle','https://tricycle.org/feed/','meditation',false],
 ['lions-roar',"Lion's Roar",'https://www.lionsroar.com/feed/','meditation',false],
 ['mindful','Mindful','https://www.mindful.org/feed/','meditation',false],
 ['astrology-hub','Astrology Hub','https://astrologyhub.com/feed/','astrology',false],
 ['mountain-astrologer','The Mountain Astrologer','https://mountainastrologer.com/feed/','astrology',false],
 ['astrotwins','The AstroTwins','https://astrostyle.com/feed/','astrology',false],
 ['elephant-journal','Elephant Journal','https://www.elephantjournal.com/feed/','self-development',false],
 ['yoga-international','Yoga International','https://yogainternational.com/feed/','yoga',false],
 ['art-of-living','Art of Living','https://www.artofliving.org/blog/feed/','meditation',false]
];
export const RSS_SOURCES:readonly RssSource[]=data.map(([key,name,url,hint,allowSnippet])=>({key,name,url,hint,allowSnippet}));
export const GDELT_QUERIES=[
 ['vedic-jyotish','"Vedic astrology" OR Jyotish','jyotish'],
 ['nakshatra','nakshatra OR Vimshottari','jyotish'],
 ['tarot','"tarot cards" OR "tarot reading"','tarot'],
 ['tarot-arcana','"major arcana" OR "tarot deck"','tarot'],
 ['yoga','"yoga practice" OR "yoga philosophy"','yoga'],
 ['meditation','"meditation practice" OR "mindfulness meditation"','meditation'],
 ['vedic','"vedic tradition" OR "Bhagavad Gita"','vedic'],
 ['natal','astrology AND "natal chart"','astrology'],
 ['spiritual','"spiritual development" AND meditation','self-development']
] as const;
