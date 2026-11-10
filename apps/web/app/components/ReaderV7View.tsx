'use client';
import styles from './ReaderV7View.module.css';
export type ReaderV7UI={
 version:string;status:'available'|'unavailable';introduction:string;method:string;
 highlights:readonly {id:string;title:string;text:string;division:number}[];
 insights:readonly {division:number;title:string;focus:string;headline:string;strength:string;challenge:string;step:string;
  proof:readonly string[];timeSensitivity:'ordinary'|'higher'|'near_boundary'}[];
 d60Notice:string;
};
export default function ReaderV7View({data,lang}:{data:ReaderV7UI;lang:'uk'|'en'}){
 if(data.status!=='available'||data.insights.length!==15)return null;
 const uk=lang==='uk';
 return <section className={styles.root} data-testid="reader-v7" aria-labelledby="reader-v7-heading">
  <div className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ READER 7 · ПЕРСОНАЛЬНИЙ АНАЛІЗ':'✦ READER 7 · PERSONAL INSIGHTS'}</span>
   <h2 id="reader-v7-heading">{uk?'Що ваші 16 карт життя говорять про ваші можливості':'What your 16 life charts suggest about your potential'}</h2>
   <p>{data.introduction}</p>
  </div>
  <div className={styles.highlights} aria-label={uk?'Три головні висновки':'Three main takeaways'}>
   {data.highlights.map((item,i)=><article key={item.id} className={styles.highlight} data-testid={'reader-v7-highlight-'+item.id}>
    <span className={styles.number}>{String(i+1).padStart(2,'0')}</span>
    <h3>{item.title}</h3>
    <p>{item.text}</p>
    <small>{uk?'Додаткова карта ':'Supporting chart '}D{item.division}</small>
   </article>)}
  </div>
  <div className={styles.sectionTitle}>
   <h3>{uk?'Дослідіть кожну сферу життя':'Explore each area of life'}</h3>
   <p>{uk?'Кожна тема має окремі висновки та один невеликий крок, який можна перевірити в реальності.':
    'Every theme has its own observations and a small action to try in real life.'}</p>
  </div>
  <div className={styles.grid}>
   {data.insights.map(item=><article key={item.division} className={styles.card} data-testid={'reader-v7-D'+item.division}>
    <header className={styles.cardTitle}><span>D{item.division}</span><h4>{item.title}</h4></header>
    <p className={styles.headline}>{item.headline}</p>
    <div className={styles.part}><strong>{uk?'Можлива сильна сторона':'A potential strength'}</strong><p>{item.strength}</p></div>
    <div className={styles.part}><strong>{uk?'Що варто перевірити':'What to watch for'}</strong><p>{item.challenge}</p></div>
    <div className={styles.next}><strong>{uk?'Один практичний крок':'One practical next step'}</strong><p>{item.step}</p></div>
    {item.timeSensitivity==='higher'?<small className={styles.warning}>{uk?
     'Точність цієї додаткової карти особливо залежить від часу народження.':
     'This detailed chart is especially sensitive to the recorded birth time.'}</small>:null}
    {item.timeSensitivity==='near_boundary'?<small className={styles.warning}>{uk?
     'Положення поблизу межі сектора: потрібна додаткова перевірка часу та координат.':
     'Near a division boundary: verify birth-time and longitude precision.'}</small>:null}
    <details className={styles.proof}>
     <summary>{uk?'Чому карта пропонує саме це':'Why this interpretation?'}</summary>
     <p>{uk?'Це традиційне прочитання наведених нижче положень. Числа — технічні позначення, а не оцінка вашої особистості.':
      'This is a traditional reading of the calculated placements below. The numbers are references, not personality scores.'}</p>
     <code>{item.proof.join(' · ')}</code>
    </details>
   </article>)}
  </div>
  <p className={styles.boundary} data-testid="reader-v7-d60"><strong>D60 · {uk?'Важлива межа точності':'Important accuracy limit'}</strong> {data.d60Notice}</p>
 </section>;
}
