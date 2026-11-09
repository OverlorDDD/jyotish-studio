'use client';
import styles from './ReaderV7View.module.css';
import book from './ReaderN492View.module.css';
import type {ReaderV8UI} from './ReaderV8View';

type Meaningful=NonNullable<ReaderV8UI['meaningful']>;
export default function ReaderN492View({data,lang,minutesUncertain=false}:
 {data:ReaderV8UI;lang:'uk'|'en';minutesUncertain?:boolean}){
 const uk=lang==='uk',read=data.meaningful as Meaningful|null|undefined;
 if(!read||read.cards.length!==16)return null;
 return <section className={styles.root+' '+book.root} data-testid="reader-v8" aria-labelledby="n492-heading">
  <header className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ ВАША НАТАЛЬНА КАРТА':'✦ YOUR NATAL CHART'}</span>
   <h2 id="n492-heading">{uk?'Трактування за сферами життя':'Your chart, area by area'}</h2>
   <p>{uk?'Від основної карти D1 до тонших карт. Лише найважливіші показники кожної теми.':
    'From the main D1 chart to its finer divisions, focusing on what matters in each theme.'}</p>
  </header>
  {(read.topInsights?.length??0)>=3?<section className={book.patterns} data-testid="reader-n493-patterns">
   <div className={book.patternsHeader}>
    <span className={styles.kicker}>{uk?'✦ ВАШІ ГОЛОВНІ АКЦЕНТИ':'✦ YOUR KEY PATTERNS'}</span>
    <h3>{uk?'Що вирізняє саме цю карту':'What stands out in your chart'}</h3>
    <p>{uk?'Відібрано за реальними положеннями та ролями планет, а не за довжиною тексту.':
      'Selected for actual natal roles and divisional conditions, not word count.'}</p>
   </div>
   <ol className={book.patternList}>
    {(read.topInsights||[]).map(pattern=><li key={pattern.id} className={book.patternItem}>
     <h4>{pattern.title}</h4>
     <p>{pattern.reading}</p>
     <p className={book.patternImplication}><strong>{uk?'Що це означає: ':'What it suggests: '}</strong>{pattern.implication}</p>
     <details className={styles.proof}>
      <summary>{uk?'На яких показниках ґрунтується':'Calculated evidence'}</summary>
      <code>{pattern.evidence.join(' · ')}</code>
      <p>{uk?'Сфери: ':'Chart divisions: '}{pattern.divisions.map(d=>'D'+d).join(', ')}</p>
     </details>
    </li>)}
   </ol>
  </section>:null}
  {minutesUncertain?<p className={book.notice} role="note">{uk?
   'Час народження позначено як приблизний: тонкі карти можуть змінитися; твердження щодо D60 умовні.':
   'Birth time is marked approximate: finer divisional positions may change; D60 statements are provisional.'}</p>:null}
  <div className={styles.grid} data-testid="reader-n492-16-cards">
   {read.cards.map(card=>{
    const isD60=card.division===60;
    const legacy=data.insights.find(i=>i.division===card.division);
    const d60=data.d60Preview;
    return <article key={card.division} className={styles.card+' '+book.card}
      data-testid={isD60?'reader-v8-d60':'reader-v8-D'+card.division}>
     <header className={styles.cardTitle}>
      <span>D{card.division}</span><h4>{card.title}</h4>
     </header>
     <p className={book.meaning} data-testid={'reader-n492-meaning-D'+card.division}>{card.meaning}</p>
     {card.connection?<p className={book.connection} data-testid={'reader-n492-link-D'+card.division}>
      <strong>{uk?'Що ще підтверджує карта':'Cross-chart evidence'}:</strong> {card.connection}
     </p>:null}
     {isD60&&d60?.status==='conditional_signs'&&d60.allPlanets?.length===9?
      <div className={book.signs} data-testid="reader-n492-d60-nine">
       {d60.allPlanets.map(p=><div key={p.planet} className={book.sign}>
        <strong>{p.label}</strong><span>{p.d60SignName}</span>
        {p.nearBoundary?<small>{uk?'Чутливо до часу':'Time-sensitive'}</small>:null}
       </div>)}
      </div>:null}
     {isD60&&minutesUncertain?<p className={book.notice}>{uk?
       'Знаки D60 наведено для введеного моменту, але без підтвердження точності часу вони не стають надійним описом людини.':
       'D60 signs refer to the entered instant, not an independently verified birth-time reading.'}</p>:null}
     {!isD60&&legacy?.timeSensitivity!=='ordinary'?
      <small className={book.caution}>{uk?'Точність цієї варги залежить від часу народження.':
       'This varga is sensitive to birth-time accuracy.'}</small>:null}
     <details className={styles.proof}>
      <summary>{uk?'Чому такий висновок':'Why this interpretation'}</summary>
      <code>{card.proof.join(' · ')}</code>
      {isD60?<p>{d60?.warning}</p>:null}
      {!isD60&&legacy?.sources.length?<ul>{legacy.sources.map(s=><li key={s.id}>
       {s.work}, {uk?'розділ':'chapter'} {s.chapter}, {uk?'строфа':'stanza'} {s.stanza}
       {s.application!=='direct_natal'?(uk?' · сучасна інтерпретація':' · modern interpretation'):''}
      </li>)}</ul>:null}
     </details>
    </article>;
   })}
  </div>
  <section className={book.final} data-testid="reader-n492-final">
   <span className={styles.kicker}>{uk?'✦ ГОЛОВНЕ':'✦ THE ESSENTIALS'}</span>
   <h3>{read.summary.title}</h3>
   <p><strong>{uk?'Ваша опора: ':'Your strengths: '}</strong>{read.summary.strength}</p>
   <p><strong>{uk?'На що звернути увагу: ':'Watch for: '}</strong>{read.summary.attention}</p>
   <p><strong>{uk?'Загальний напрям: ':'Your direction: '}</strong>{read.summary.direction}</p>
  </section>
  <details className={book.method}>
   <summary>{uk?'Методика та межі точності':'Method and limits'}</summary>
   <p>{read.method}</p>
  </details>
 </section>;
}
