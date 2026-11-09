'use client';
import styles from './ReaderV7View.module.css';
import n49 from './ReaderV8View.module.css';
export type ReaderV8UI={
 version:string;editorialVersion:string;ruleSetVersion:string;status:'available'|'unavailable';
 introduction:string;method:string;d60Notice:string;
 synthesis?:{version:string;title:string;opening:string;strength:string;challenge:string;direction:string;method:string};
 compactCards?:readonly {division:number;lead:string;connection:string;relatedDivision:number;contrast:string;proof:readonly string[]}[];
 meaningful?:{version:string;discoveries?:{
  version:string;summary:string;insights:readonly {
   id:string;division:number;relatedDivisions:number[];planet:string;headline:string;
   interpretation:string;attention:string;prominence:number;
   kind:'support'|'tension'|'context';proof:string[]
  }[]};
  cards:readonly {division:number;title:string;meaning:string;connection:string|null;
  status:string;proof:string[];sourceIds:string[]}[];
  summary:{title:string;strength:string;attention:string;direction:string;proof:string[]};method:string};
 integrated?:{version:string;title:string;opening:string;closing:string;method:string;
  threads:readonly {id:string;title:string;text:string;evidence:readonly string[];sourceIds:readonly string[];
   directSourceIds:readonly string[];extensionSourceIds:readonly string[];scope:string}[];
  links:readonly {division:number;polarity:string;evidence:readonly string[]}[]};
 d60Preview?:{version:string;status:'conditional_signs'|'unavailable';title:string;intro:string;
  factors:readonly {planet:string;d1Sign:number;d60Sign:number;boundaryDistanceArcseconds:number;note:string}[];
  allPlanets?:readonly {planet:string;label:string;d1Sign:number;d60Sign:number;
    d1SignName:string;d60SignName:string;boundaryDistanceArcseconds:number;nearBoundary:boolean}[];
  warning:string};
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
   <span className={styles.kicker}>{uk?'✦ ТЕМИ ВАШОЇ КАРТИ':'✦ YOUR CHART BY THEME'}</span>
   <h2 id="reader-v8-heading">{uk?'15 сфер життя':'15 life areas'}</h2>
   <p>{data.introduction}</p>
  </header>
  {minutesUncertain?<p className={n49.timeNotice} role="note">{uk?
   'Якщо час приблизний, положення в тонких картах можуть змінитися.':'An approximate birth time can change finer chart placements.'}</p>:null}
  <div className={styles.grid}>
   {data.insights.map(item=>{
    const personal=data.compactCards?.find(card=>card.division===item.division);
    return <article key={item.division} className={styles.card+' '+n49.compactCard} data-testid={'reader-v8-D'+item.division}>
     <header className={styles.cardTitle}><span>D{item.division}</span><h4>{item.title}</h4></header>
     {personal?<div className={n49.compactContent}>
      <p className={n49.compactLead}>{personal.lead}</p>
      <div className={n49.crossNote} data-testid={'reader-n491-link-D'+item.division}>
       <span>{uk?'Зв’язок з іншою картою':'Connected chart'}</span>
       <p>{personal.connection}</p>
      </div>
     </div>:<p className={styles.headline}>{item.headline}</p>}
     {item.timeSensitivity!=='ordinary'?<small className={styles.warning}>{uk?
      'Точність цього розділу залежить від часу народження.':
      'This fine chart depends on birth-time accuracy.'}</small>:null}
     <details className={styles.proof}>
      <summary>{uk?'Планети, доми та джерела':'Planets, houses and sources'}</summary>
      <code>{(personal?.proof||item.proof).join(' · ')}</code>
      {item.sources.length?<ul>{item.sources.map(ref=><li key={ref.id}>
       {ref.work} · {uk?'розділ':'chapter'} {ref.chapter}, {uk?'строфа':'stanza'} {ref.stanza}
       {' · '+(ref.application==='direct_natal'?(uk?'натальна умова':'natal condition'):(uk?'сучасне зіставлення':'modern comparison'))}
      </li>)}</ul>:null}
      <p>{uk?'Книжкові фрагменти ще не всі звірено з оригінальними сканами.':
       'Not all historical excerpts have been checked against original scans.'}</p>
     </details>
    </article>;
   })}
   <article className={styles.card+' '+n49.d60Card} data-testid="reader-v8-d60" aria-labelledby="reader-d60-title">
    <header className={styles.cardTitle}>
     <span>D60</span>
     <h4 id="reader-d60-title">{uk?'D60 · Тонкі положення планет':'D60 · Fine planetary positions'}</h4>
    </header>
    {!minutesUncertain&&data.d60Preview?.status==='conditional_signs'?<>
     <p className={n49.compactLead}>{data.d60Preview.intro}</p>
     <div className={n49.d60Positions} data-testid="reader-n491-d60-nine">
      {(data.d60Preview.allPlanets||[]).map(p=><div key={p.planet} className={n49.d60Position}>
       <strong>{p.label}</strong>
       <span>{p.d1SignName} <span aria-hidden="true">→</span> <b>{p.d60SignName}</b></span>
       {p.nearBoundary?<small>{uk?'Поблизу межі знака':'Near a sign boundary'}</small>:null}
      </div>)}
     </div>
     {data.d60Preview.factors.length?<div className={n49.d60Interpretations}>
      <strong>{uk?'Що це означає у зв’язку з D1':'How this relates to your birth chart'}</strong>
      {data.d60Preview.factors.map(f=><p key={f.planet}>{f.note}</p>)}
     </div>:null}
     <details className={styles.proof}>
      <summary>{uk?'Точність і методика D60':'D60 precision and methodology'}</summary>
      <p>{data.d60Preview.warning}</p>
      <code>{(data.d60Preview.allPlanets||[]).map(p=>
       p.planet+': D1='+p.d1Sign+', D60='+p.d60Sign+
       ', edge='+Math.round(p.boundaryDistanceArcseconds)+'″').join(' · ')}</code>
     </details>
    </>:<p className={styles.storyText}>{minutesUncertain?
      (uk?'Позначено приблизний час народження. Положення D60 за таким часом можуть змінитися — для персонального зіставлення потрібне уточнення хвилин.':
       'Your birth time is marked approximate. D60 placements may change; verify your birth minutes for this comparison.'):
      (data.d60Preview?.warning||data.d60Notice)}</p>}
   </article>
  </div>
  <details className={n49.methodDetails}>
   <summary>{uk?'Методика та межі точності':'Method and accuracy limits'}</summary>
   <p>{data.method}</p>
  </details>
 </section>;
}
