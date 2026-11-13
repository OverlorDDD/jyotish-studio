import ExpertQuestionForm from '../ExpertQuestionForm';
import PrivateTarotQuestions from '../PrivateTarotQuestions';
import styles from './TarotHub.module.css';

/** Human readers: story and trust first, the free question next, the price and payment last.
 * Reader details are placeholders until the team provides final profiles. */
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
   <li><b>1</b>{uk?'Опишіть питання. Це безкоштовно і ні до чого не зобов’язує.':'Describe your question. It is free and with no obligation.'}</li>
   <li><b>2</b>{uk?'Таролог прочитає його й відповість на пошту: чи візьметься і який розклад пропонує.':'A reader replies by email: whether they can take it and which spread they suggest.'}</li>
   <li><b>3</b>{uk?'Тільки тоді ви вирішуєте, чи замовляти. Відповідь — протягом доби після оплати.':'Only then do you decide whether to order. The answer comes within a day of payment.'}</li>
  </ol>
  <ExpertQuestionForm locale={locale}/>
  <div className={styles.price}>
   <div><b>$30</b><p>{uk?'Живий розклад Таро на ваше питання: фото розкладу й докладна письмова відповідь.':'A live Tarot reading on your question: a photo of the spread and a detailed written answer.'}</p></div>
   <div><p className={styles.payTitle}>{uk?'Як оплатити':'How to pay'}</p>
    <ul className={styles.pay}><li>{uk?'Картка Visa / Mastercard':'Visa / Mastercard card'}</li><li>{uk?'USDT через Binance Pay':'USDT via Binance Pay'}</li></ul>
    <p className={styles.small}>{uk?'Платите лише після того, як таролог підтвердив, що візьметься за питання. Реквізити надсилаємо на пошту. Якщо відповідь не прийде протягом доби після оплати, повернемо гроші.':
     'You pay only after a reader confirms they will take your question. Payment details come by email. If the answer does not arrive within a day of payment, we refund you.'}</p></div>
  </div>
  <PrivateTarotQuestions locale={locale}/>
 </section>;
}
