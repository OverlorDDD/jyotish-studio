'use client';
import styles from './ReaderV7View.module.css';
import book from './ReaderN493View.module.css';
import type {ReaderV8UI} from './ReaderV8View';
type Quality=NonNullable<ReaderV8UI['quality']>;
export default function ReaderN493View({data,lang,minutesUncertain=false}:{
 data:ReaderV8UI;lang:'uk'|'en';minutesUncertain?:boolean}){
 const uk=lang==='uk',read=data.quality as Quality|null|undefined;
 if(!read||read.patterns.length<3||read.patterns.length>5||read.cards.length!==16)return null;
 return <section className={styles.root+' '+book.root} data-testid="reader-v8" aria-labelledby="n493-heading">
  <header className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ ВАША НАТАЛЬНА КАРТА':'✦ YOUR NATAL CHART'}</span>
   <h2 id="n493-heading">{uk?'Що найважливіше у вашій карті':'What stands out in your chart'}</h2>
   <p>{uk?'Спершу — 3–5 найвиразніших закономірностей, далі — пояснення кожної сфери життя.':
    'First, the most distinctive patterns; then the detail of each life area.'}</p>
  </header>
  {minutesUncertain?<p className={book.notice} role="note">{uk?
   'Час народження позначено як приблизний. Дрібні варги та D60 потребують обережності.':
   'Birth time is marked approximate. Finer divisions, especially D60, require extra caution.'}</p>:null}
  <section className={book.patterns} aria-label={uk?'Головні закономірності':'Key chart patterns'}
    data-testid="reader-n493-patterns">
   {read.patterns.map((p,i)=><article className={book.pattern} key={p.id}
     data-testid={'reader-n493-pattern-'+p.id}>
    <div className={book.patternHead}><span>{String(i+1).padStart(2,'0')}</span><h3>{p.title}</h3></div>
    <p>{p.insight}</p>
    <p className={book.patternContext}>{p.context}</p>
    <details className={book.proof}><summary>{uk?'Астрологічні підстави':'Chart evidence'}</summary>
     <code>{p.evidence.join(' · ')}</code>
    </details>
   </article>)}
  </section>
  <div className={book.sectionHeading}>
   <h3>{uk?'16 сфер життя':'16 chart divisions'}</h3>
   <p>{uk?'Від D1 до D60, у традиційному порядку.':'From D1 to D60, in traditional order.'}</p>
  </div>
  <div className={styles.grid} data-testid="reader-n493-16-cards">
   {read.cards.map(card=>{
    const isD60=card.division===60;
    const d60=data.d60Preview;
    return <article key={card.division} className={styles.card+' '+book.card}
      data-testid={isD60?'reader-v8-d60':'reader-v8-D'+card.division}>
     <header className={styles.cardTitle}><span>D{card.division}</span><h4>{card.title}</h4></header>
     <p className={book.meaning} data-testid={'reader-n493-card-D'+card.division}>{card.meaning}</p>
     {card.context?<p className={book.context}>{card.context}</p>:null}
     {isD60&&d60?.status==='conditional_signs'&&d60.allPlanets?.length===9?
      <div className={book.signs} data-testid="reader-n493-d60-nine">
       {d60.allPlanets.map(p=><div key={p.planet} className={book.sign}>
        <strong>{p.label}</strong><span>{p.d60SignName}</span>
        {p.nearBoundary?<small>{uk?'Поблизу межі':'Near boundary'}</small>:null}
       </div>)}
      </div>:null}
     {isD60?<p className={book.notice}>{d60?.warning||data.d60Notice}</p>:
      data.insights.find(i=>i.division===card.division)?.timeSensitivity==='near_boundary'?
       <small className={book.caution}>{uk?'Положення близьке до межі варги; час народження важливий.':
        'Near a divisional boundary; birth-time precision matters.'}</small>:null}
     <details className={book.proof}>
      <summary>{uk?'Чому такий висновок':'Why this reading'}</summary>
      <code>{card.proof.join(' · ')}</code>
      <p>{uk?'Метод: перевірене положення й традиційне тематичне прочитання. Висновок не є гарантією подій.':
       'Method: verified placement and its traditional interpretation; no future event is guaranteed.'}</p>
     </details>
    </article>;
   })}
  </div>
  <section className={book.final} data-testid="reader-n493-final">
   <span className={styles.kicker}>{uk?'✦ ЦІЛІСНИЙ ВИСНОВОК':'✦ WHOLE-CHART TAKEAWAY'}</span>
   <h3>{read.summary.title}</h3>
   <p>{read.summary.portrait}</p>
   <p className={book.finalFocus}>{read.summary.focus}</p>
  </section>
  <details className={book.method}><summary>{uk?'Методика та обмеження':'Method and limits'}</summary>
   <p>{read.method}</p>
  </details>
 </section>;
}
