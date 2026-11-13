import styles from './Reader10View.module.css';

type Details={paragraphs:string[];basis:string;links:{label:string;path:string}[]};
export type Reader10UI={version:string;language:'uk'|'en';
 chapters:{id:string;title:string;lead:string;paragraphs:string[];details:Details|null}[]};
export const READER10_UI_VERSION='reader10-plain-1';
const SAFE_PATH=/^[a-z0-9][a-z0-9/-]{0,80}$/;
export function isReader10(data:unknown):data is Reader10UI{
 const d=data as Reader10UI|null|undefined;
 return !!d&&d.version===READER10_UI_VERSION&&Array.isArray(d.chapters)&&d.chapters.length>0&&
  d.chapters.every(c=>typeof c.title==='string'&&typeof c.lead==='string'&&Array.isArray(c.paragraphs)&&
   c.paragraphs.every(p=>typeof p==='string'&&p.length>0)&&
   (c.details===null||(Array.isArray(c.details?.paragraphs)&&typeof c.details?.basis==='string'&&Array.isArray(c.details?.links))));
}
/** Reader 10: plain-language reading first; the astrology behind each chapter is one tap away.
 * Plain text only; nothing here is HTML from the server, and links stay on this site. */
export default function Reader10View({data,lang,minutesUncertain=false}:{data:Reader10UI;lang:'uk'|'en';minutesUncertain?:boolean}){
 const uk=lang==='uk';
 return <section className={styles.root} data-testid="reader10" data-reader-version={data.version}
  aria-label={uk?'Трактування карти':'Chart reading'}>
  <h2 className={styles.title}>{uk?'Трактування вашої карти':'Your chart reading'}</h2>
  {minutesUncertain?<p className={styles.note} role="note">{uk
   ?'Час народження позначено як приблизний, тому висновки про дім, роботу й стосунки сприймайте як попередні.'
   :'Your birth time is marked approximate, so treat conclusions about home, work and relationships as provisional.'}</p>:null}
  {data.chapters.map(chapter=><article key={chapter.id} className={styles.chapter} data-testid={'reader10-'+chapter.id}>
   <h3>{chapter.title}</h3>
   <p className={styles.lead}>{chapter.lead}</p>
   {chapter.paragraphs.map((text,index)=><p key={index}>{text}</p>)}
   {chapter.details?<details className={styles.details} data-testid={'reader10-'+chapter.id+'-details'}>
    <summary>{uk?'Як це видно у вашій карті':'How this shows in your chart'}</summary>
    {chapter.details.paragraphs.map((text,index)=><p key={index}>{text}</p>)}
    <p className={styles.basis}>{chapter.details.basis}</p>
    {chapter.details.links.length?<p className={styles.links}>{uk?'Докладніше: ':'Read more: '}
     {chapter.details.links.filter(link=>SAFE_PATH.test(link.path)).map((link,index)=><span key={link.path}>
      {index?' · ':''}<a href={'/'+lang+'/'+link.path}>{link.label}</a></span>)}</p>:null}
   </details>:null}
  </article>)}
  <p className={styles.note}>{uk
   ?'Це прочитання вашої карти за правилами класичного Джйотіш. Воно описує схильності, а не гарантує подій.'
   :'This is a reading of your chart by the rules of classical Jyotish. It describes tendencies, not guaranteed events.'}</p>
 </section>;
}
