/** /horoscope/compatibility — sign picker, the 12×12 table of all 78 pairs
 * and the 36-guna calculator from birth dates. Server component. */
import Link from 'next/link';
import PortalShell from '../PortalShell';
import styles from './Horoscope.module.css';
import {elClass} from './parts';
import CompatPicker from './CompatPicker';
import CoupleMatch from './CoupleMatch';
import {SIGNS,glyph,type HoroLocale} from '../../../lib/horoscope-signs';
import {compatPath,pairSlug,westernScores} from '../../../lib/compatibility';
import {publicIndexingEnabled} from '../../../lib/site-indexing';

const FAQ=(uk:boolean)=>[
 {q:uk?'Як рахується сумісність знаків?':'How is sign compatibility calculated?',
  a:uk?'Західна оцінка спирається на кут між знаками в зодіакальному колі (тригон, секстиль, квадрат, опозиція тощо), їхні стихії та дружбу традиційних планет-управителів. Відсотки — це зручна шкала, а не ймовірність щастя.':'The Western score rests on the angle between the signs on the zodiac wheel (trine, sextile, square, opposition and so on), their elements and the friendship of their traditional ruling planets. Percentages are a convenient scale, not a probability of happiness.'},
 {q:uk?'Що таке 36 гун (Ашта-кута)?':'What are the 36 gunas (Ashtakoota)?',
  a:uk?'Це класична індійська перевірка пари: вісім критеріїв — варна, вашья, тара, йоні, граха-майтрі, гана, бхакут і наді — порівнюють Місяць при народженні двох людей. Максимум — 36 балів; 18 вважають мінімумом для шлюбу.':'It is the classical Indian check of a couple: eight criteria — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi — compare the Moon at the birth of two people. The maximum is 36 points; 18 is considered the minimum for marriage.'},
 {q:uk?'Чому потрібен час народження?':'Why does the birth time matter?',
  a:uk?'Місяць проходить накшатру приблизно за добу, тож без часу ми не завжди можемо точно визначити накшатру — від неї залежить 21 бал із 36. Тоді результат позначається як приблизний.':'The Moon crosses a nakshatra in about a day, so without a time we cannot always pin the nakshatra down — it decides 21 of the 36 points. The result is then marked approximate.'},
 {q:uk?'Чи можна вирішувати долю стосунків за сумісністю?':'Can compatibility decide a relationship?',
  a:uk?'Ні. Астрологічна сумісність — символічна мова традиції, яка допомагає краще зрозуміти себе й партнера. Повагу, довіру й рішення пари вона не замінює.':'No. Astrological compatibility is a tradition’s symbolic language that helps you understand yourself and your partner. It does not replace respect, trust or a couple’s own choices.'}
];

export default function CompatHome({locale}:{locale:HoroLocale}){
 const uk=locale==='uk',faq=FAQ(uk);
 const faqLd=publicIndexingEnabled()?JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(f=>({'@type':'Question',name:f.q,acceptedAnswer:{'@type':'Answer',text:f.a}}))}).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={locale} active="horoscope" languagePath="horoscope/compatibility">
  {faqLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:faqLd}}/>}
  <div className={styles.wrap}>
   <nav className={styles.crumbs} aria-label={uk?'Хлібні крихти':'Breadcrumbs'}><Link href={'/'+locale+'/horoscope'}>{uk?'Гороскопи':'Horoscopes'}</Link> / {uk?'Сумісність':'Compatibility'}</nav>
   <header className={styles.hero}><div>
    <h1>{uk?'Сумісність знаків зодіаку':'Zodiac sign compatibility'}</h1>
    <p>{uk?'Оберіть два знаки, щоб побачити, як вони поєднуються в коханні, дружбі й спільних справах. Або введіть дати народження — і порахуємо класичні 36 гун ведичної астрології.':'Pick two signs to see how they combine in love, friendship and shared work. Or enter birth dates and we will calculate the classical 36 gunas of Vedic astrology.'}</p>
   </div></header>

   <CompatPicker locale={locale}/>

   <section aria-labelledby="compat-table" className={styles.tableSection}>
    <h2 id="compat-table" className={styles.sectionTitle}>{uk?'Таблиця сумісності всіх знаків':'Compatibility table for all signs'}</h2>
    <div className={styles.matrixScroll}>
     <table className={styles.matrix}>
      <caption className={styles.srOnly}>{uk?'Західна сумісність у відсотках; натисніть на клітинку, щоб відкрити опис пари.':'Western compatibility in percent; select a cell to open the pair.'}</caption>
      <thead><tr><th scope="col"><span className={styles.srOnly}>{uk?'Знак':'Sign'}</span></th>{SIGNS.map(s=><th key={s.slug} scope="col" className={elClass(s)}><span aria-hidden="true">{glyph(s)}</span><span className={styles.srOnly}>{uk?s.uk:s.en}</span></th>)}</tr></thead>
      <tbody>{SIGNS.map(r=><tr key={r.slug}>
       <th scope="row" className={elClass(r)}><span aria-hidden="true">{glyph(r)}</span> {uk?r.uk:r.en}</th>
       {SIGNS.map(c=>{const pct=westernScores(r,c).overall;
        return <td key={c.slug} data-level={pct>=85?4:pct>=72?3:pct>=60?2:1}><Link href={compatPath(locale,pairSlug(r,c))} aria-label={(uk?r.uk+' і '+c.uk:r.en+' and '+c.en)+': '+pct+'%'}>{pct}</Link></td>;})}
      </tr>)}</tbody>
     </table>
    </div>
    <p className={styles.legendLine}><span><i data-level="4"/>{uk?'85+ чудово':'85+ excellent'}</span><span><i data-level="3"/>{uk?'72+ добре':'72+ good'}</span><span><i data-level="2"/>{uk?'60+ із зусиллями':'60+ with effort'}</span><span><i data-level="1"/>{uk?'складніше':'harder'}</span></p>
   </section>

   <CoupleMatch locale={locale}/>

   <section className={styles.faq} aria-labelledby="compat-faq">
    <h2 id="compat-faq">{uk?'Часті запитання':'FAQ'}</h2>
    {faq.map(f=><details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
   </section>
  </div>
 </PortalShell>;
}
