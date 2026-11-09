'use client';
import styles from './ReaderV7View.module.css';
import ui from './ReaderV8View.module.css';

type MeaningCard={
 division:number;reading:string;corroboration:string|null;attention:string|null;
 sourceFacts:readonly string[];sourceMethod:readonly string[];sensitivity:string
};
type MeaningReader={version:string;cards:readonly MeaningCard[];
 takeaways:readonly {text:string;sourceFacts:readonly string[]}[];limits:string};
export type ReaderV8UI={
 version:string;editorialVersion:string;ruleSetVersion:string;status:'available'|'unavailable';
 introduction:string;method:string;d60Notice:string;
 meaningReader?:MeaningReader|null;
 integrated?:{version:string;title:string;opening:string;closing:string;method:string;
  threads:readonly {id:string;title:string;text:string;evidence:readonly string[];sourceIds:readonly string[];
   directSourceIds:readonly string[];extensionSourceIds:readonly string[];scope:string}[];
  links:readonly {division:number;polarity:string;evidence:readonly string[]}[]};
 compactCards?:readonly {division:number;lead:string;connection:string;relatedDivision:number;contrast:string;proof:readonly string[]}[];
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
const ORDER=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
export default function ReaderV8View({data,lang,minutesUncertain=false}:{
 data:ReaderV8UI;lang:'uk'|'en';minutesUncertain?:boolean
}){
 const reader=data.meaningReader;
 if(data.status!=='available'||reader?.version!=='n492-meaning-first-16-v1'||
  reader.cards.length!==16||reader.cards.some((c,i)=>c.division!==ORDER[i]))return null;
 const uk=lang==='uk';
 const d60=data.d60Preview;
 return <section className={styles.root} data-testid="reader-v8" aria-labelledby="reader-v8-heading">
  <header className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ ВАША НАТАЛЬНА КАРТА':'✦ YOUR NATAL CHART'}</span>
   <h2 id="reader-v8-heading">{uk?'Що показують ваші карти':'What your charts suggest'}</h2>
   <p>{uk?'Спочатку головна карта D1, далі — тематичні карти. У кожній лише найважливіше, що підтверджують розраховані положення.':
    'Start with your main chart D1 and continue through the thematic divisions. Each focuses on the most relevant computed indicators.'}</p>
  </header>
  <div className={styles.grid} data-testid="reader-n492-card-grid">
   {reader.cards.map((card,index)=>{
    const original=data.insights.find(i=>i.division===card.division);
    const isD60=card.division===60;
    return <article key={card.division} className={styles.card+' '+ui.compactCard}
     data-testid={isD60?'reader-v8-d60':'reader-v8-D'+card.division}
     aria-labelledby={'reader-n492-title-'+card.division}>
     <header className={styles.cardTitle}>
      <span>D{card.division}</span>
      <h4 id={'reader-n492-title-'+card.division}>{isD60?
       (uk?'Тонкі показники D60':'Fine D60 indicators'):
       original?.title||('D'+card.division)}</h4>
     </header>
     {isD60?<>
      {d60?.status==='conditional_signs'&&d60.allPlanets?.length===9?<>
       <p className={ui.compactLead}>{minutesUncertain?
        (uk?'Час народження позначено як приблизний. Знаки нижче розраховані саме для введеного моменту; їхню стійкість до похибки часу не підтверджено.':
        'Birth time is marked approximate. These signs are calculated for the entered instant, but their stability over that time uncertainty is not verified.'):
        card.reading}</p>
       <div className={ui.d60Positions} data-testid="reader-n492-d60-nine">
        {d60.allPlanets.map(p=><div key={p.planet} className={ui.d60Position}>
         <strong>{p.label}</strong>
         <span>{p.d1SignName} <span aria-hidden="true">→</span> <b>{p.d60SignName}</b></span>
         {p.nearBoundary?<small>{uk?'Чутливо до часу':'Time-sensitive'}</small>:null}
        </div>)}
       </div>
      </>:<p className={ui.timeNotice}>{uk?
       'Немає перевіреної прив’язки D60 до основної карти. Персональні висновки не формуються.':
       'Verified D60 data are unavailable; no personal D60 inference is offered.'}</p>}
     </>:<>
      <p className={ui.compactLead} data-testid={'reader-n492-reading-D'+card.division}>{card.reading}</p>
      {card.corroboration?<p className={ui.crossNote} data-testid={'reader-n492-cross-D'+card.division}>{card.corroboration}</p>:null}
     </>}
     {card.attention?<p className={ui.conciseAttention}>{card.attention}</p>:null}
     {card.sensitivity==='fine'?<small className={ui.sensitivity}>{uk?
       'Точність тонкої карти залежить від часу народження.':
       'Fine divisions depend on birth-time accuracy.'}</small>:null}
     <details className={styles.proof}>
      <summary>{uk?'Показники та метод':'Chart evidence and method'}</summary>
      <code>{card.sourceFacts.join(' · ')}</code>
      {card.sourceMethod.length?<p>{uk?'Застосовані методи: ':'Applied methods: '}{card.sourceMethod.join(', ')}</p>:null}
      {isD60?<p>{d60?.warning}</p>:null}
     </details>
    </article>;
   })}
  </div>
  <section className={ui.summary} data-testid="reader-n492-conclusion" aria-labelledby="reader-n492-summary-title">
   <div className={ui.summaryHeading}>
    <span>{uk?'✦ ГОЛОВНЕ':'✦ THE MAIN POINTS'}</span>
    <h3 id="reader-n492-summary-title">{uk?'Що об’єднує вашу карту':'What connects your charts'}</h3>
   </div>
   {reader.takeaways.map((t,i)=><p key={i} data-testid={'reader-n492-takeaway-'+i}>{t.text}</p>)}
  </section>
  <details className={ui.methodDetails}>
   <summary>{uk?'Точність і джерела':'Accuracy and sources'}</summary>
   <p>{reader.limits}</p>
   <p>{data.method}</p>
  </details>
 </section>;
}
