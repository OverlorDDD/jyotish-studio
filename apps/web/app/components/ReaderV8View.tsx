'use client';
import styles from './ReaderV7View.module.css';
export type ReaderV8UI={
 version:string;editorialVersion:string;ruleSetVersion:string;status:'available'|'unavailable';
 introduction:string;method:string;d60Notice:string;
 highlights:readonly {id:string;division:number;title:string;text:string}[];
 insights:readonly {division:number;title:string;headline:string;strength:string;challenge:string;context:string;step:string;
  proof:readonly string[];ruleIds:readonly string[];
  sources:readonly {id:string;work:string;chapter:string;stanza:string;edition:string;review:string;application:string}[];
  timeSensitivity:'ordinary'|'higher'|'near_boundary'}[];
};
export default function ReaderV8View({data,lang}:{data:ReaderV8UI;lang:'uk'|'en'}){
 if(data.status!=='available'||data.insights.length!==15)return null;
 const uk=lang==='uk';
 return <section className={styles.root} data-testid="reader-v8" aria-labelledby="reader-v8-heading">
  <header className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ CLASSICAL READER 8 · ПЕРСОНАЛЬНИЙ АНАЛІЗ':'✦ CLASSICAL READER 8 · PERSONAL READING'}</span>
   <h2 id="reader-v8-heading">{uk?'Ваші 15 життєвих історій':'Fifteen stories your chart can tell'}</h2>
   <p>{data.introduction}</p>
  </header>
  <div className={styles.highlights} aria-label={uk?'Головні висновки':'Main takeaways'}>
   {data.highlights.map((h,i)=><article className={styles.highlight} key={h.id} data-testid={'reader-v8-highlight-'+h.id}>
    <span className={styles.number}>{String(i+1).padStart(2,'0')}</span>
    <h3>{h.title}</h3><p>{h.text}</p>
    <small>{uk?'Підстава: тематична карта ':'Based on chart '}D{h.division}</small>
   </article>)}
  </div>
  <div className={styles.sectionTitle}>
   <h3>{uk?'Сфери життя: від стосунків до роботи':'Your life themes: from relationships to work'}</h3>
   <p>{uk?'Точні астрологічні підстави та книги можна розкрити під кожним висновком.':
    'Expand any section to see the calculated evidence and the book references.'}</p>
  </div>
  <div className={styles.grid}>
   {data.insights.map(item=><article key={item.division} className={styles.card} data-testid={'reader-v8-D'+item.division}>
    <header className={styles.cardTitle}><span>D{item.division}</span><h4>{item.title}</h4></header>
    <p className={styles.headline}>{item.headline}</p>
    <p className={styles.storyText}>{item.strength}</p>
    <p className={styles.storyText}>{item.context}</p>
    <div className={styles.part}><strong>{uk?'Де потрібна уважність':'Where to take care'}</strong><p>{item.challenge}</p></div>
    <div className={styles.next}><strong>{uk?'Спробуйте цього тижня':'Try this week'}</strong><p>{item.step}</p></div>
    {item.timeSensitivity==='higher'||item.timeSensitivity==='near_boundary'?
     <small className={styles.warning}>{item.timeSensitivity==='near_boundary'?
      (uk?'Поблизу межі сектора: потрібна додаткова перевірка точності часу народження.':
       'Near a chart division boundary: verify the exact birth time.'):
      (uk?'Ця детальна карта чутливіша до часу народження.':
       'This fine division is more sensitive to birth-time precision.')}</small>:null}
    <details className={styles.proof}>
     <summary>{uk?'Розрахунки та класичні джерела':'Calculated evidence and historical sources'}</summary>
     {item.sources.length?<ul>
      {item.sources.map(ref=><li key={ref.id}>
       {ref.work} — {uk?'розділ':'chapter'} {ref.chapter}, {uk?'строфа':'stanza'} {ref.stanza};
       {' · '+(ref.application==='direct_natal'?(uk?'прямий натальний показник':'direct natal condition'):(uk?'тематичне розширення':'thematic extension'))}
       <span> ({ref.id}, {ref.review==='ocr_excerpt_checked'?
        (uk?'OCR перевірено за текстом, скан ще не звірено':'OCR excerpt reviewed, scan comparison pending'):
        (uk?'Переклад потребує додаткового звіряння':'Translation needs review')})</span>
      </li>)}
     </ul>:<p>{uk?'Для саме цього поєднання не активувалося окреме звірене книжкове правило; застосовано сучасний тематичний синтез.':
       'No additional reviewed historical rule was triggered; this is a modern thematic synthesis.'}</p>}
     <p>{uk?'Нижче — розраховані положення, на яких ґрунтується трактування:':
      'Calculated placements used by this interpretation:'}</p>
     <code>{item.proof.join(' · ')}</code>
    </details>
   </article>)}
  </div>
  <p className={styles.boundary} data-testid="reader-v8-d60"><strong>D60 · {uk?'Межа точності':'Precision limit'}</strong> {data.d60Notice}</p>
  <p className={styles.warning}>{data.method}</p>
 </section>;
}
