'use client';
import styles from './ReaderV7View.module.css';
export type ReaderV8UI={
 version:string;editorialVersion:string;ruleSetVersion:string;status:'available'|'unavailable';
 introduction:string;method:string;d60Notice:string;
 synthesis?:{version:string;title:string;opening:string;strength:string;challenge:string;direction:string;method:string};
 integrated?:{version:string;title:string;opening:string;closing:string;method:string;
  threads:readonly {id:string;title:string;text:string;evidence:readonly string[];sourceIds:readonly string[];scope:string}[];
  links:readonly {division:number;polarity:string;evidence:readonly string[]}[]};
 d60Preview?:{version:string;status:'conditional_signs'|'unavailable';title:string;intro:string;
  factors:readonly {planet:string;d1Sign:number;d60Sign:number;boundaryDistanceArcseconds:number;note:string}[];warning:string};
 highlights:readonly {id:string;division:number;title:string;text:string}[];
 insights:readonly {division:number;title:string;headline:string;strength:string;challenge:string;context:string;step:string;
  proof:readonly string[];ruleIds:readonly string[];
  sources:readonly {id:string;work:string;chapter:string;stanza:string;edition:string;review:string;application:string}[];
  timeSensitivity:'ordinary'|'higher'|'near_boundary'}[];
};
export default function ReaderV8View({data,lang,minutesUncertain=false}:{data:ReaderV8UI;lang:'uk'|'en';minutesUncertain?:boolean}){
 if(data.status!=='available'||data.insights.length!==15)return null;
 const uk=lang==='uk';
 return <section className={styles.root} data-testid="reader-v8" aria-labelledby="reader-v8-heading">
  <header className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ CLASSICAL READER 8 · ПЕРСОНАЛЬНИЙ АНАЛІЗ':'✦ CLASSICAL READER 8 · PERSONAL READING'}</span>
   <h2 id="reader-v8-heading">{uk?'Ваш астрологічний портрет':'Your astrological portrait'}</h2>
   <p>{data.introduction}</p>
  </header>
  {data.integrated?.version==='n49-unified-evidence-v1'?<article className={styles.synthesis} data-testid="reader-v8-synthesis" aria-labelledby="reader-v8-synthesis-title">
   <span className={styles.kicker}>{uk?'✦ N4.9 · ЄДИНА ЛІНІЯ КАРТИ':'✦ N4.9 · A SINGLE CHART NARRATIVE'}</span>
   <h3 id="reader-v8-synthesis-title">{data.integrated.title}</h3>
   <p>{data.integrated.opening}</p>
   <div className={styles.synthesisParts}>
    {data.integrated.threads.map(t=><div key={t.id} data-testid={'reader-n49-thread-'+t.id}>
     <strong>{t.title}</strong>
     <p>{t.text}</p>
     <details className={styles.proof}>
      <summary>{uk?'Що розраховано і які є джерела':'Calculated basis and source scope'}</summary>
      <p>{t.scope==='d1_direct'?
       (uk?'Прямі показники D1, без окремих життєвих прогнозів.':'Direct D1 placements, no inferred life events.'):
       (uk?'Зв’язок D1 та тематичних варг — сучасне застосування; не дослівний висновок з книги.':
        'D1-to-varga linkage is a modern application, not a literal historical verse.')}</p>
      <code>{t.evidence.join(' · ')}</code>
      <p>{t.sourceIds.length?
       (uk?'Ідентифікатори зіставлених книжкових правил (статус кожного пояснено в тематичних картках): ':
        'Mapped book-rule IDs (review status is shown in the detailed thematic cards): ')+t.sourceIds.join(', '):
       (uk?'Для цієї ланки окреме книжкове правило не активувалося.':
        'No additional book rule activated for this link.')}</p>
     </details>
    </div>)}
   </div>
   <div className={styles.synthesisDirection}><strong>{uk?'Спільний висновок':'How it fits together'}</strong><p>{data.integrated.closing}</p></div>
   <small>{data.integrated.method}</small>
  </article>:null}
  {(!data.integrated||data.integrated.version!=='n49-unified-evidence-v1')&&data.synthesis&&<article className={styles.synthesis} data-testid="reader-v8-synthesis" aria-labelledby="reader-v8-synthesis-title">
   <span className={styles.kicker}>{uk?'✦ ЗАГАЛЬНИЙ СИНТЕЗ':'✦ INTEGRATED READING'}</span>
   <h3 id="reader-v8-synthesis-title">{data.synthesis.title}</h3>
   <p>{data.synthesis.opening}</p>
   <div className={styles.synthesisParts}>
    <div><strong>{uk?'Де ваша опора':'Where you can lean in'}</strong><p>{data.synthesis.strength}</p></div>
    <div><strong>{uk?'Де виникає напруга':'Where tension can arise'}</strong><p>{data.synthesis.challenge}</p></div>
   </div>
   <div className={styles.synthesisDirection}><strong>{uk?'Що об’єднує ці теми':'How these themes connect'}</strong><p>{data.synthesis.direction}</p></div>
   <small>{data.synthesis.method}</small>
  </article>}
  <h3 className={styles.takeawayHeading}>{uk?'Три найпомітніші акценти':'Three defining threads'}</h3>
  <div className={styles.highlights} aria-label={uk?'Головні висновки':'Main takeaways'}>
   {data.highlights.map((h,i)=><article className={styles.highlight} key={h.id} data-testid={'reader-v8-highlight-'+h.id}>
    <span className={styles.number}>{String(i+1).padStart(2,'0')}</span>
    <h3>{h.title}</h3><p>{h.text}</p>
    {/* Chart IDs and historical evidence appear only once, in the matching expanded thematic card. */}
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
    <div className={styles.part}><strong>{uk?'Тінь цієї сили':'The other side of this strength'}</strong><p>{item.challenge}</p></div>
    <div className={styles.next}><strong>{uk?'Як використати це на практиці':'What to do with this insight'}</strong><p>{item.step}</p></div>
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
   <article className={styles.card} data-testid="reader-v8-d60" aria-labelledby="reader-d60-title">
    <header className={styles.cardTitle}>
     <span>D60</span>
     <h4 id="reader-d60-title">{data.d60Preview?.title||(uk?'D60 · Внутрішні відтінки':'D60 · Subtle inner patterns')}</h4>
    </header>
    {!minutesUncertain&&data.d60Preview?.status==='conditional_signs'?<>
     <p className={styles.headline}>{data.d60Preview.intro}</p>
     {data.d60Preview.factors.map(factor=><p className={styles.storyText} key={factor.planet}>
      {factor.note}
     </p>)}
     <details className={styles.proof}>
      <summary>{uk?'Розрахунок D60 і межі методу':'D60 calculation and method scope'}</summary>
      <p>{data.d60Preview.warning}</p>
      <code>{data.d60Preview.factors.map(f=>
       f.planet+': D1 sign '+f.d1Sign+' → D60 sign '+f.d60Sign+
       ' · boundary '+Math.round(f.boundaryDistanceArcseconds)+' arcsec').join(' · ')}</code>
     </details>
    </>:<>
     <p className={styles.storyText}>{minutesUncertain?
      (uk?'Для цього тонкого зрізу необхідний достовірний час народження. Інші п’ятнадцять карт і загальний портрет доступні незалежно від D60.':
       'This very fine division needs a reliable birth time. Your fifteen other charts and integrated portrait remain available.'):
      (data.d60Preview?.warning||data.d60Notice)}</p>
    </>}
   </article>
  </div>
  <p className={styles.warning}>{data.method}</p>
 </section>;
}
