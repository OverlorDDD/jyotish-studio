/** «Обговорити на форумі»: opens a new GalaxiCom topic prefilled with this
 * story's title and link (the member still reviews and publishes it). */
import type {NewsLocale} from '../../../lib/news-public';
import styles from './News.module.css';

const CATEGORY:Record<string,string>={jyotish:'jyotish',astrology:'jyotish',astronomy:'jyotish',tarot:'tarot',
 yoga:'practices',meditation:'practices','self-development':'practices',vedic:'vedic'};
export default function NewsDiscuss({locale,title,path,topic}:{locale:NewsLocale;title:string;path:string;topic:string}){
 const q=new URLSearchParams({category:CATEGORY[topic]||'jyotish',discuss:path,title:title.slice(0,140)});
 return <aside className={styles.discuss} aria-label={locale==='uk'?'Обговорення':'Discussion'}>
  <p>{locale==='uk'?'Є думки чи запитання щодо цієї статті? Обговоріть із читачами Galaxiora.':'Thoughts or questions about this story? Discuss them with Galaxiora readers.'}</p>
  <a href={'/'+locale+'/community?'+q.toString()}>{locale==='uk'?'Обговорити на форумі':'Discuss on the forum'}</a>
 </aside>;
}
