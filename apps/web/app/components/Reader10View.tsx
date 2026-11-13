import styles from './Reader10View.module.css';

export type Reader10UI={version:string;language:'uk'|'en';
 chapters:{id:string;title:string;paragraphs:string[];summary:string;basis:string}[]};
export const READER10_UI_VERSION='reader10-full-1';
export function isReader10(data:unknown):data is Reader10UI{
 const d=data as Reader10UI|null|undefined;
 return !!d&&d.version===READER10_UI_VERSION&&Array.isArray(d.chapters)&&d.chapters.length>0&&
  d.chapters.every(c=>typeof c.title==='string'&&Array.isArray(c.paragraphs)&&c.paragraphs.length>0&&
   c.paragraphs.every(p=>typeof p==='string'&&p.length>0)&&typeof c.summary==='string'&&typeof c.basis==='string');
}
/** Reader 10: direct chart-specific chapters. Plain text only; nothing here is HTML from the server. */
export default function Reader10View({data,lang,minutesUncertain=false}:{data:Reader10UI;lang:'uk'|'en';minutesUncertain?:boolean}){
 const uk=lang==='uk';
 return <section className={styles.root} data-testid="reader10" data-reader-version={data.version}
  aria-label={uk?'Трактування карти':'Chart reading'}>
  <h2 className={styles.title}>{uk?'Трактування вашої карти':'Your chart reading'}</h2>
  {minutesUncertain?<p className={styles.note} role="note">{uk
   ?'Час народження позначено як приблизний: лагна, доми й дробові карти залежать від нього найбільше, тому висновки про них сприймайте як попередні.'
   :'Your birth time is marked approximate: the lagna, houses and divisional charts depend on it most, so treat conclusions about them as provisional.'}</p>:null}
  {data.chapters.map(chapter=><article key={chapter.id} className={styles.chapter} data-testid={'reader10-'+chapter.id}>
   <h3>{chapter.title}</h3>
   {chapter.paragraphs.map((text,index)=><p key={index}>{text}</p>)}
   <p className={styles.summary}>{chapter.summary}</p>
   <p className={styles.basis}>{chapter.basis}</p>
  </article>)}
  <p className={styles.note}>{uk
   ?'Трактування викладає правила класичного Джйотіш для положень саме вашої карти. Це мова традиції, а не гарантія подій.'
   :'This reading states what classical Jyotish rules say about the placements of your own chart. It is the language of a tradition, not a guarantee of events.'}</p>
 </section>;
}
