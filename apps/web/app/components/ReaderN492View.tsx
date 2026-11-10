'use client';
import styles from './ReaderV7View.module.css';
import book from './ReaderN492View.module.css';
import type {ReaderV8UI} from './ReaderV8View';

type Meaningful=NonNullable<ReaderV8UI['meaningful']>;
type Card=Meaningful['cards'][number];
type LifeTopic={id:string;uk:string;en:string;divisions:readonly number[];lead:number};
const TOPICS:readonly LifeTopic[]=[
 {id:'identity',uk:'Характер і сильні сторони',en:'Personality and strengths',lead:1,divisions:[1,3,20,27,30,60]},
 {id:'money',uk:'Гроші й ресурси',en:'Money and resources',lead:2,divisions:[2,16]},
 {id:'career',uk:'Робота й покликання',en:'Career and purpose',lead:10,divisions:[10,24]},
 {id:'relationships',uk:'Стосунки й близькість',en:'Relationships and intimacy',lead:9,divisions:[9,7]},
 {id:'roots',uk:'Родина й внутрішня опора',en:'Family and inner foundations',lead:4,divisions:[4,12,40,45]}
];

const VARGA_GUIDE:ReadonlyArray<{division:number;uk:string;en:string}>=[
 {division:1,uk:'Особистість і загальний життєвий напрям',en:'Identity and overall direction'},
 {division:2,uk:'Гроші, заробіток і збереження ресурсів',en:'Income, money and preserving resources'},
 {division:3,uk:'Сміливість, спілкування і зв’язок із братами та сестрами',en:'Courage, communication and siblings'},
 {division:4,uk:'Дім, нерухомість і відчуття опори',en:'Home, property and feeling secure'},
 {division:7,uk:'Діти, виховання і творча спадщина',en:'Children, nurturing and creative legacy'},
 {division:9,uk:'Партнерство, шлюб і особисті цінності',en:'Partnership, marriage and personal values'},
 {division:10,uk:'Робота, покликання і суспільна роль',en:'Career, vocation and public responsibilities'},
 {division:12,uk:'Батьки й родинне коріння',en:'Parents and family roots'},
 {division:16,uk:'Комфорт, транспорт і побутові зручності',en:'Comfort, vehicles and everyday conveniences'},
 {division:20,uk:'Духовна практика й внутрішня дисципліна',en:'Spiritual practice and inner discipline'},
 {division:24,uk:'Навчання, освіта і майстерність',en:'Education, learning and mastery'},
 {division:27,uk:'Сильні сторони, витривалість і вразливості',en:'Capabilities, stamina and vulnerabilities'},
 {division:30,uk:'Складні обставини та способи їх долати',en:'Difficulties and how to navigate them'},
 {division:40,uk:'Родинні впливи з материнського боку',en:'Maternal-line family influences'},
 {division:45,uk:'Родинні впливи з батьківського боку',en:'Paternal-line family influences'},
 {division:60,uk:'Тонкі символічні акценти — лише з обмеженнями точності',en:'Subtle symbolic patterns — time-accuracy limits apply'}
];

/** Keep the full, verified sixteen-card source; the first screen is not a list of D-codes. */
export const READER_LIFE_TOPIC_ORDER=TOPICS.map(topic=>topic.id);
const LABELS={uk:{step:'Що можна спробувати',extra:'Детальніше про цю сферу',source:'Як ми дійшли цього висновку',charts:'Додаткові трактування',basis:'Астрологічні показники',method:'Методика та точність',found:'Основні закономірності',summary:'Головний висновок',positions:'Положення планет'},
 en:{step:'A practical step',extra:'Explore this area',source:'Why this interpretation',charts:'Additional interpretations',basis:'Astrological indicators',method:'Method and accuracy',found:'Key patterns',summary:'The main takeaway',positions:'Planetary placements'}} as const;

function part(card:Card,lang:'uk'|'en'){
 const basisLabel=lang==='uk'?'Астрологічна основа:':'Astrological basis:';
 const actionLabel=lang==='uk'?'Практичний крок:':'Practical step:';
 const basisIndex=card.meaning.lastIndexOf(basisLabel);
 const body=basisIndex<0?card.meaning:card.meaning.slice(0,basisIndex);
 const actionIndex=body.lastIndexOf(actionLabel);
 return {
  story:(actionIndex<0?body:body.slice(0,actionIndex)).trim(),
  action:(actionIndex<0?'':body.slice(actionIndex+actionLabel.length)).trim(),
  basis:(basisIndex<0?'':card.meaning.slice(basisIndex+basisLabel.length)).trim()
 };
}

export default function ReaderN492View({data,lang,minutesUncertain=false}:
 {data:ReaderV8UI;lang:'uk'|'en';minutesUncertain?:boolean}){
 const read=data.meaningful as Meaningful|null|undefined;
 if(!read||read.cards.length!==16)return null;
 const copy=LABELS[lang],uk=lang==='uk';
 const cards=new Map(read.cards.map(card=>[card.division,card]));
 const divisions=TOPICS.flatMap(topic=>topic.divisions);
 if(new Set(divisions).size!==16||divisions.some(div=>!cards.has(div)))return null;
 const d60=data.d60Preview;
 const detailsFor=(card:Card)=>{
  const parsed=part(card,lang);
  return <details className={book.evidence} key={'evidence-'+card.division}>
   <summary>{copy.source}</summary>
   {parsed.basis?<p>{parsed.basis}</p>:null}
   {card.connection?<p>{card.connection}</p>:null}
   {card.division===60&&d60?.status==='conditional_signs'&&d60.allPlanets?.length===9?
    <details className={book.technical}>
     <summary>{copy.positions}</summary>
     <div className={book.signs} data-testid="reader-n492-d60-nine">
      {d60.allPlanets.map(p=><div key={p.planet} className={book.sign}><strong>{p.label}</strong><span>{p.d60SignName}</span></div>)}
     </div>
     {d60.warning?<p>{d60.warning}</p>:null}
    </details>:null}
  </details>;
 };
 return <section className={styles.root+' '+book.root} data-testid="reader-v8" aria-labelledby="n492-heading">
  <header className={styles.top}>
   <span className={styles.kicker}>{uk?'✦ ПЕРСОНАЛЬНЕ ТРАКТУВАННЯ':'✦ YOUR PERSONAL READING'}</span>
   <h2 id="n492-heading">{uk?'Що ваша карта розповідає про вас':'What your chart says about you'}</h2>
   <p>{uk?
    'Почнімо з п’яти знайомих сфер життя. Ви отримаєте зрозуміле пояснення й одну дію для кожної. Усі 16 астрологічних карт залишаються доступними для поглибленого читання.':
    'Start with five familiar areas of life. Each includes a clear interpretation and one practical idea. All 16 astrological charts remain available if you want to explore further.'}</p>
  </header>
  {minutesUncertain?<p className={book.notice} role="note">{uk?
   'Час народження позначено як приблизний. Деталі про чутливі до часу положення є в методиці.':
   'Your birth time is marked approximate. Details about time-sensitive placements are in the methodology.'}</p>:null}
  <div className={book.lifeTopics} data-testid="reader-n496-life-topics">
   {TOPICS.map(topic=>{
    const main=cards.get(topic.lead)!;
    const primary=part(main,lang);
    const more=topic.divisions.filter(div=>div!==topic.lead).map(div=>cards.get(div)!);
    return <section className={book.lifeTopic} key={topic.id} data-testid={'reader-n496-topic-'+topic.id}>
     <h3>{uk?topic.uk:topic.en}</h3>
     <article className={book.primary} data-testid={'reader-v8-D'+topic.lead}>
      <small className={book.primarySource}>{uk?'Астрологічна основа розділу':'Main chart for this section'}: D{topic.lead} · {uk?VARGA_GUIDE.find(v=>v.division===topic.lead)!.uk:VARGA_GUIDE.find(v=>v.division===topic.lead)!.en}</small>
      <p className={book.story} data-testid={'reader-n492-meaning-D'+topic.lead}>{primary.story}</p>
      {primary.action?<p className={book.action}><strong>{copy.step}:</strong> {primary.action}</p>:null}
      {detailsFor(main)}
     </article>
     {more.length?<details className={book.more}>
      <summary>{copy.extra}</summary>
      <p className={book.moreIntro}>{uk?'Окремі карти уточнюють різні грані цієї теми. Їх не потрібно читати підряд, щоб зрозуміти основне.':
        'The supplementary charts explore different aspects of this theme. You do not need to read all of them to understand the main message.'}</p>
      <div className={book.supporting}>
       {more.map(card=>{
        const parsed=part(card,lang),isD60=card.division===60;
        return <article className={book.supportingCard} key={card.division}
          data-testid={isD60?'reader-v8-d60':'reader-v8-D'+card.division}>
         <h4>{card.title} <small>D{card.division}</small></h4>
         <p data-testid={'reader-n492-meaning-D'+card.division}>{parsed.story}</p>
         {parsed.action?<p className={book.action}><strong>{copy.step}:</strong> {parsed.action}</p>:null}
         {detailsFor(card)}
        </article>;
       })}
      </div>
     </details>:null}
    </section>;
   })}
  </div>
  <section className={book.vargaGuide} aria-labelledby="n497-all-heading" data-testid="reader-n497-varga-map">
   <h3 id="n497-all-heading">{uk?'Усі 16 карт: що саме вони пояснюють':'All 16 charts: what each one explores'}</h3>
   <p>{uk?
    'П’ять основних розділів — короткий портрет. Нижче — повна карта тем, щоб жодна варга не загубилася. Основні трактування вже наведені вище; решту відкрийте через «Детальніше про цю сферу».':
    'The five main chapters give you a quick portrait. This is the complete guide to every varga: the main readings appear above and the rest can be opened under “Explore this area”.'}</p>
   <ol className={book.vargaGrid}>
    {VARGA_GUIDE.map(v=><li key={v.division} data-testid={'reader-n497-varga-D'+v.division}>
     <span className={book.vargaCode}>D{v.division}</span>
     <span>{uk?v.uk:v.en}</span>
     {v.division===60?<small>{uk?'D60 не є підтвердженим індивідуальним прогнозом':'D60 is not a certified individual prediction'}</small>:null}
    </li>)}
   </ol>
  </section>
  <section className={book.final} data-testid="reader-n492-final">
   <span className={styles.kicker}>{uk?'✦ ПІДСУМОК':'✦ THE BIG PICTURE'}</span>
   <h3>{copy.summary}</h3>
   <p data-testid="reader-n493-synthesis">{read.summary.direction}</p>
  </section>
  {read.discoveries?.insights?.length?<details className={book.method} data-testid="reader-n493-top-insights">
   <summary>{copy.found}</summary>
   <ol>{read.discoveries.insights.map(item=><li key={item.id}>
    <strong>{item.headline}</strong><p>{item.teaser}</p>
   </li>)}</ol>
  </details>:null}
  <details className={book.method}>
   <summary>{copy.method}</summary>
   <p>{read.method}</p>
   <p>{uk?'D1–D60 — назви 16 способів розглянути ту саму натальну карту; це не 16 різних прогнозів.':
     'D1–D60 are 16 ways of examining the same natal chart, not 16 separate predictions.'}</p>
  </details>
 </section>;
}
