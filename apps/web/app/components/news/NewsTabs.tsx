/** Topic navigation shared by the portal, story pages and «Для мене».
 * Plain links (crawlable, no client JS). */
import Link from 'next/link';
import styles from './News.module.css';
import {NEWS_TOPICS,TOPIC_COPY,topicPath,type NewsLocale,type NewsTopic} from '../../../lib/news-public';

export default function NewsTabs({locale,active}:{locale:NewsLocale;active:NewsTopic|'all'|'for-you'}){
 return <nav className={styles.tabs} aria-label={locale==='uk'?'Теми новин':'News topics'}>
  <Link className={styles.tab} href={'/'+locale+'/news'} aria-current={active==='all'?'page':undefined}>{locale==='uk'?'Усе':'All'}</Link>
  {NEWS_TOPICS.map(t=><Link key={t} className={styles.tab} href={topicPath(t,locale)} aria-current={active===t?'page':undefined}>
   {locale==='uk'?TOPIC_COPY[t].uk:TOPIC_COPY[t].en}</Link>)}
  <Link className={styles.tab} href={'/'+locale+'/news/for-you'} aria-current={active==='for-you'?'page':undefined}>{locale==='uk'?'Для мене':'For me'}</Link>
 </nav>;
}

