'use client';
import styles from './ReaderV7View.module.css';
import book from './ReaderN492View.module.css';
import type {ReaderV8UI} from './ReaderV8View';

type Meaningful=NonNullable<ReaderV8UI['meaningful']>;
export default function ReaderN492View({data,lang,minutesUncertain=false}:
 {data:ReaderV8UI;lang:'uk'|'en';minutesUncertain?:boolean}){
 const uk=lang==='uk',read=data.meaningful as Meaningful|null|undefined;
 const portrait=read?.portrait;
 if(!read||read.cards.length!==16||portrait?.areas.length!==5)return null;
 return <section className={styles.root+' '+book.root} data-testid="reader-v8" aria-labelledby="n496-heading">
  <header className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ ВАШ АСТРОЛОГІЧНИЙ ПОРТРЕТ':'✦ YOUR ASTROLOGICAL PORTRAIT'}</span>
   <h2 id="n496-heading">{portrait.title}</h2>
   <p>{portrait.intro}</p>
  </header>
  {minutesUncertain?<p className={book.notice} role="note">{uk?
   'Час народження позначено як приблизний. Детальні положення тонших карт залежать від точності часу.':
   'Birth time is marked approximate. Fine-chart details depend on the accuracy of that time.'}</p>:null}
  <div className={book.areas} data-testid="reader-n496-five-themes">
   {portrait.areas.map((area,index)=><article key={area.id} className={book.area}
     data-testid={'reader-n496-area-'+area.id}>
    <header className={book.areaHead}><span className={book.areaNumber}>{String(index+1).padStart(2,'0')}</span>
     <h3>{area.title}</h3></header>
    <p className={book.story} data-testid={'reader-n496-story-'+area.id}>{area.story}</p>
    <p className={book.nuance}>{area.nuance}</p>
    <div className={book.action}><strong>{uk?'Що можна спробувати':'A useful next step'}</strong>
     <p>{area.action}</p></div>
   </article>)}
  </div>
  <details className={book.divisions} data-testid="reader-n492-all-16-details">
   <summary>{uk?'Дослідити всі 16 астрологічних карт':'Explore all 16 astrological charts'}
    <span>{uk?'Додаткові пояснення та положення планет':'Extra context and planetary placements'}</span></summary>
   <p className={book.divisionsIntro}>{uk?
    'Кожна з 16 карт висвітлює окремий аспект. Їх не потрібно читати по черзі, щоб зрозуміти основний портрет вище.':
    'Each of the sixteen charts offers a different angle. You do not need to read them in sequence to understand your portrait above.'}</p>
   <div className={styles.grid} data-testid="reader-n492-16-cards">
    {read.cards.map(card=>{
     const isD60=card.division===60,d60=data.d60Preview;
     const prefix=uk?'Астрологічна основа: ':'Astrological basis: ';
     const start=card.meaning.lastIndexOf(prefix);
     const human=start<0?card.meaning:card.meaning.slice(0,start).trim();
     const basis=start<0?'':card.meaning.slice(start);
     return <article key={card.division} className={styles.card+' '+book.card}
       id={'reader-n493-card-D'+card.division}
       data-testid={isD60?'reader-v8-d60':'reader-v8-D'+card.division}>
      <header className={styles.cardTitle}><span>D{card.division}</span><h4>{card.title}</h4></header>
      <p className={book.meaning} data-testid={'reader-n492-meaning-D'+card.division}>{human}</p>
      {basis?<details className={book.basisDetails}><summary>{uk?'Які положення враховано':'What positions were considered'}</summary>
        <p className={book.basis}>{basis}</p></details>:null}
      {isD60&&d60?.status==='conditional_signs'&&d60.allPlanets?.length===9?
       <details className={book.signsDetails}>
        <summary>{uk?'Дев’ять положень планет':'Nine planetary placements'}</summary>
        <div className={book.signs} data-testid="reader-n492-d60-nine">
         {d60.allPlanets.map(p=><div key={p.planet} className={book.sign}>
          <strong>{p.label}</strong><span>{p.d60SignName}</span>
         </div>)}
        </div>
       </details>:null}
     </article>;
    })}
   </div>
  </details>
  <details className={book.method}>
   <summary>{uk?'Як читати цей портрет':'How to read this portrait'}</summary>
   <p>{uk?
    'Пояснення спираються на обчислені положення планет і традиційні правила їх тлумачення. Це теми для роздумів і практичної перевірки, а не твердження про ваш характер або майбутні події. Точність детальних карт залежить від часу народження.':
    'This reading draws on calculated planetary placements and traditional interpretive rules. It offers themes to explore, not established facts about your personality or future events. The finer chart details depend on an accurate birth time.'}</p>
  </details>
 </section>;
}
