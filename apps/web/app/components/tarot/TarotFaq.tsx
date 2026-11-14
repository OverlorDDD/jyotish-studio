import styles from './TarotHub.module.css';

const FAQ={
 uk:[
  {q:'Чи справді Таро онлайн тут безкоштовне?',a:'Так. Карта дня і розклади на сайті безкоштовні й без реєстрації: до трьох розкладів на день. Платною є лише особиста консультація живого таролога.'},
  {q:'Як витягнути карту дня?',a:'Натисніть на колоду вгорі сторінки. Карта обирається випадково з повної колоди з 78 карт, а повернутися по нову можна завтра. Серія днів і карти, які ви вже зустріли, зберігаються у вашому браузері.'},
  {q:'Чим онлайн-розклад відрізняється від справжньої колоди?',a:'Карти обираються випадково з повної колоди, як під час звичайного тасування, а кожна може випасти прямою чи перевернутою. Тлумачення написані за класичною традицією Райдера–Вейта.'},
  {q:'Що означає перевернута карта?',a:'Енергія карти проявляється слабше, із затримкою або спрямована всередину. Це не завжди погано: часто перевернута карта підказує, де варто зупинитися й придивитися.'},
  {q:'Як працює розклад «так чи ні»?',a:'Ви ставите питання, на яке можна відповісти «так» чи «ні», і тягнете одну карту. Більшість світлих карт схиляються до «так», важкі — до «ні», а перевернута карта пом’якшує відповідь.'},
  {q:'Як поставити питання живому тарологу?',a:'Опишіть питання у формі внизу сторінки — це безкоштовно. Протягом доби тарологиня надішле на пошту коротку підказку, а якщо захочете піти глибше, запропонує повний живий розклад на вашу ситуацію.'}
 ],
 en:[
  {q:'Is the online Tarot here really free?',a:'Yes. The card of the day and the spreads are free with no sign-up: up to three readings a day. Only a personal reading with a human reader is paid.'},
  {q:'How do I draw my card of the day?',a:'Tap the deck at the top of the page. The card is chosen at random from the full 78-card deck, and you can come back for a new one tomorrow. Your streak and the cards you have met are kept in your browser.'},
  {q:'How is an online reading different from a real deck?',a:'Cards are drawn at random from the full deck, as in a normal shuffle, and each can come up upright or reversed. The meanings follow the classic Rider–Waite tradition.'},
  {q:'What does a reversed card mean?',a:'The card’s energy shows up weaker, delayed or turned inward. It is not always bad: a reversed card often points to where you should pause and look closer.'},
  {q:'How does the yes-or-no reading work?',a:'Ask a question that can be answered yes or no and draw one card. Most bright cards lean to yes, heavy cards to no, and a reversed card softens the answer.'},
  {q:'How do I ask a human reader?',a:'Describe your question in the form at the bottom of the page — it is free. Within a day a reader emails you a short hint, and if you want to go deeper, offers a full live reading for your situation.'}
 ]
} as const;
export default function TarotFaq({locale}:{locale:'uk'|'en'}){
 const items=FAQ[locale];
 const jsonLd=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',inLanguage:locale,
  mainEntity:items.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))}).replace(/</g,'\\u003c');
 return <section className={styles.card} aria-labelledby="tarot-faq-heading" data-testid="tarot-faq">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>
  <div className={styles.secHead}><h2 id="tarot-faq-heading">{locale==='uk'?'Часті запитання про Таро онлайн':'Online Tarot FAQ'}</h2></div>
  <div className={styles.faq}>{items.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div>
 </section>;
}
