import type {PortalLocale} from '../../lib/brand';
import styles from './PanchangaFaq.module.css';

type QA={q:string;a:string};
export const PANCHANGA_FAQ:Record<PortalLocale,QA[]>={
 uk:[
  {q:'Чому для кожного міста Панчанга своя?',a:'День у ведичній традиції починається зі сходу Сонця, а схід у Києві й у Делі настає в різний час. Тому всі години, Раху-кала й переходи тітхі на цій сторінці рахуються для вашого міста.'},
  {q:'Що таке Раху-кала?',a:'Восьма частина світлового дня, яку традиція вважає невдалою для важливих починань. Щодня вона припадає на інший час, тож її рахують окремо для кожної дати й місця.'},
  {q:'Що таке Бхадра (Вішті-карана)?',a:'Половина місячного дня, яку традиція залишає для звичних справ, прибирання й завершення розпочатого. Нові важливі справи в цей час не починають.'},
  {q:'Що таке Екадаші?',a:'11-й день кожної половини місячного циклу, день посту й духовної практики. Буває двічі на місяць.'},
  {q:'Чи можна покладатися на ці поради?',a:'Схід Сонця, фази Місяця й переходи ми рахуємо астрономічно точно за Swiss Ephemeris. Поради щодо справ — це правила ведичної традиції, а не наукові прогнози: вони допомагають обрати час, але рішення лишається за вами.'}
 ],
 en:[
  {q:'Why is the Panchanga different for every city?',a:'In the Vedic tradition the day begins at sunrise, and sunrise in Delhi and in London comes at different times. That is why every hour, Rahu Kalam and tithi transition on this page is calculated for your city.'},
  {q:'What is Rahu Kalam?',a:'One eighth of the daylight hours that tradition treats as unlucky for important beginnings. It falls at a different time each day, so it is calculated for every date and place.'},
  {q:'What is Bhadra (Vishti karana)?',a:'A half of a lunar day that tradition keeps for routine work, tidying up and finishing what you began. Important new things are not started during it.'},
  {q:'What is Ekadashi?',a:'The 11th day of each half of the lunar cycle, a day of fasting and spiritual practice. It comes twice a month.'},
  {q:'Can I rely on this guidance?',a:'Sunrise, Moon phases and transitions are calculated astronomically with Swiss Ephemeris. The advice about activities follows the rules of the Vedic tradition rather than scientific forecasts: it helps you choose a time, and the decision stays yours.'}
 ]
};
/** Short answers to common beginner questions, with FAQ structured data. */
export default function PanchangaFaq({locale}:{locale:PortalLocale}){
 const items=PANCHANGA_FAQ[locale];
 const jsonLd=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',inLanguage:locale,
  mainEntity:items.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))}).replace(/</g,'\\u003c');
 return <section className={styles.section} data-testid="panchanga-faq" aria-labelledby="panchanga-faq-heading">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>
  <h2 id="panchanga-faq-heading">{locale==='uk'?'Часті запитання':'Frequently asked questions'}</h2>
  {items.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}
 </section>;
}
