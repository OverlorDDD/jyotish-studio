/** One story row in «Останнє» / topic lists. No hooks: renders on the server
 * and inside the client «Показати ще» list alike. */
import Link from 'next/link';
import NewsThumb from './NewsThumb';
import NewsArt from './NewsArt';
import {composeSkyArticle} from '../../../lib/news-sky';
import styles from './News.module.css';
import {TOPIC_COPY,newsTeaser,newsTitle,relativeAge,sourceLabel,storyPath,isOwn,type NewsItem,type NewsLocale} from '../../../lib/news-public';

/** Our own stories show their own sky diagram, not a generic topic picture. */
export function OwnThumb({item,className}:{item:NewsItem;className?:string}){
 const art=item.rubric?{kind:'calendar' as const,count:item.rubric.kind==='week'?7:30}:item.event?composeSkyArticle(item.event)?.art:null;
 if(!art)return <NewsThumb topic={item.topic} seed={item.id} className={className}/>;
 return <span className={(className||styles.thumb)+' '+styles.artThumb} aria-hidden="true"><NewsArt art={art} id={'t-'+item.id.slice(0,8)} label=""/></span>;
}
export default function NewsRow({item,locale,now}:{item:NewsItem;locale:NewsLocale;now:number}){
 const title=newsTitle(item,locale);if(!title)return null;
 const topic=TOPIC_COPY[item.topic]||TOPIC_COPY.astrology,teaser=newsTeaser(item,locale);
 const own=isOwn(item);
 return <li className={styles.row} data-story-id={item.id} data-published={item.publishedAt}>
  <div className={styles.rowText}>
   <span className={styles.topicDot} style={{color:topic.color}}>{locale==='uk'?topic.uk:topic.en}</span>
   <h3><Link href={storyPath(item,locale)}>{title}</Link></h3>
   {teaser&&<p>{teaser}</p>}
   <span className={styles.meta}>{sourceLabel(item,locale)+' · '+relativeAge(item.publishedAt,locale,now)}</span>
  </div>
  {own?<OwnThumb item={item}/>:<NewsThumb src={item.thumbUrl} topic={item.topic} seed={item.id} locale={locale}
   credit={item.imageKind==='publisher'?sourceLabel(item,locale):null}/>}
 </li>;
}
