import ExpertQuestionForm from '../ExpertQuestionForm';
import PrivateTarotQuestions from '../PrivateTarotQuestions';
import styles from './TarotHub.module.css';

/** Human readers. The page never shows a price: the person first meets the readers, asks for free and
 * gets a short free hint by email; only that personal email (written from the admin inbox) offers a
 * full live reading with its price and payment details. Reader details are placeholders for now. */
const READERS=[
 {initial:'А',uk:{name:'Анна',focus:'Стосунки, почуття, складні вибори',text:'Працює з класичною колодою Райдера–Вейта. Допомагає побачити ситуацію в стосунках ясніше й зрозуміти, чого ви насправді хочете.'},
  en:{name:'Anna',focus:'Relationships, feelings, hard choices',text:'Works with the classic Rider–Waite deck. Helps you see a relationship more clearly and understand what you really want.'}},
 {initial:'Є',uk:{name:'Євгенія',focus:'Робота, гроші, самопізнання',text:'Поєднує Таро з досвідом консультування. Допомагає розібратися з роботою, змінами й наступним кроком.'},
  en:{name:'Yevheniia',focus:'Work, money, self-discovery',text:'Combines Tarot with counselling experience. Helps you sort out work, change and your next step.'}}
] as const;
export default function TarotReaders({locale}:{locale:'uk'|'en'}){
 const uk=locale==='uk';
 return <section id="human-readings" className={styles.card} aria-labelledby="tarot-readers-heading" data-testid="tarot-readers">
  <span className={styles.eyebrow}>{uk?'Особисте питання':'A personal question'}</span>
  <h2 id="tarot-readers-heading" className={styles.readersTitle}>{uk?'Коли питання надто важливе для автоматичного розкладу':'When a question is too important for an automatic reading'}</h2>
  <p className={styles.quote}>{uk?'«Карти не вирішують за вас. Вони допомагають побачити ситуацію ясніше, і тоді рішення приходить легше».':
   '“The cards do not decide for you. They help you see the situation more clearly, and then the decision comes more easily.”'}</p>
  <div className={styles.readers}>
   {READERS.map(r=><article key={r.initial} className={styles.reader}>
    <span className={styles.avatar} aria-hidden="true">{r.initial}</span>
    <div><h3>{r[locale].name}</h3><p className={styles.focus}>{r[locale].focus}</p><p>{r[locale].text}</p>
     <p className={styles.small}>{uk?'Фото, досвід і відгуки — незабаром.':'Photo, experience and reviews — coming soon.'}</p></div>
   </article>)}
  </div>
  <ol className={styles.steps}>
   <li><b>1</b>{uk?'Опишіть, що вас турбує. Це безкоштовно і ні до чого не зобов’язує.':'Describe what is on your mind. It is free and with no obligation.'}</li>
   <li><b>2</b>{uk?'Анна або Євгенія прочитає питання й протягом доби надішле вам на пошту коротку підказку: на що звернути увагу вже зараз.':
    'Anna or Yevheniia reads your question and within a day emails you a short hint: what to pay attention to right now.'}</li>
   <li><b>3</b>{uk?'Захочете піти глибше — тарологиня запропонує повний живий розклад саме на вашу ситуацію. Вирішуєте лише ви.':
    'If you want to go deeper, the reader will offer a full live reading for your situation. The choice is yours.'}</li>
  </ol>
  <ExpertQuestionForm locale={locale}/>
  <PrivateTarotQuestions locale={locale}/>
 </section>;
}
