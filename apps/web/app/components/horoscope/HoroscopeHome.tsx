/** /horoscope and /horoscope/vedic: today's forecast for all 12 signs,
 * server-rendered so search engines and first-time visitors see it at once. */
import Link from 'next/link';
import PortalShell from '../PortalShell';
import styles from './Horoscope.module.css';
import {Dots,elClass} from './parts';
import {MySignPanel} from './MySign';
import {SIGNS,dayLabel,glyph,hubPath,signByN,signPath,type HoroLocale,type HoroSystem} from '../../../lib/horoscope-signs';
import type {DayReading} from '../../../lib/horoscope-v3';

const PHASE:Record<string,{uk:string;en:string}>={new:{uk:'молодик',en:'New Moon'},waxing:{uk:'Місяць зростає',en:'waxing Moon'},full:{uk:'повня',en:'Full Moon'},waning:{uk:'Місяць спадає',en:'waning Moon'}};
const SIGN_LOC_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козерозі','Водолії','Рибах'];

export function SystemSwitch({locale,system,hrefs}:{locale:HoroLocale;system:HoroSystem;hrefs:{western:string;vedic:string}}){
 const uk=locale==='uk';
 return <nav className={styles.switch} aria-label={uk?'Система астрології':'Astrology system'}>
  <Link href={hrefs.western} aria-current={system==='western'?'page':undefined}>{uk?'Західний':'Western'}<small>{uk?'за датою народження':'by birthday'}</small></Link>
  <Link href={hrefs.vedic} aria-current={system==='vedic'?'page':undefined}>{uk?'Ведичний':'Vedic'}<small>{uk?'за знаком Місяця':'by Moon sign'}</small></Link>
 </nav>;
}
export const HOME_FAQ=(locale:HoroLocale)=>locale==='uk'?[
 {q:'Чому в західній і ведичній астрології в мене різні знаки?',a:'Західна астрологія рахує знаки від точки весняного рівнодення (тропічний зодіак), а ведична — від нерухомих зірок (сидеричний зодіак). За дві тисячі років ці системи розійшлися приблизно на 24°, тому ведичний знак Сонця здебільшого на один знак раніше. До того ж у Джйотиш головним вважають знак Місяця, а не Сонця. Свої знаки в обох системах можна дізнатися в «Зоряному паспорті».'},
 {q:'Як Galaxiora складає гороскоп?',a:'Щодня ми розраховуємо положення Сонця, Місяця й планет за Swiss Ephemeris і дивимося, через які доми від вашого знака вони проходять. Оцінки кохання, роботи, грошей і здоров’я рахуються за класичною таблицею сприятливих транзитів, а тексти пояснюють, що це означає простими словами. Під кожним прогнозом є «Чому так?» — з усіма розрахунками.'},
 {q:'Що таке Чандраштама?',a:'Так у ведичній астрології називають приблизно два з половиною дні щомісяця, коли Місяць проходить восьмий дім від вашого знака. Традиція радить у ці дні не починати важливого й берегти сили. Ми позначаємо такі дні в прогнозах і в календарі місяця.'},
 {q:'Чи замінює гороскоп за знаком персональний прогноз?',a:'Ні. Гороскоп за знаком — це загальна картина для всіх, хто народився під ним. Персональний прогноз ураховує вашу натальну карту: асцендент, положення Місяця й періоди даш. Його можна отримати в розділі «Мій персональний гороскоп».'}
]:[
 {q:'Why is my sign different in Western and Vedic astrology?',a:'Western astrology measures signs from the spring equinox (tropical zodiac), Vedic astrology from the fixed stars (sidereal zodiac). Over two thousand years they drifted about 24° apart, so the Vedic Sun sign is usually one sign earlier. Jyotish also treats the Moon sign as primary. Find both in the Star Passport.'},
 {q:'How does Galaxiora write the horoscope?',a:'Every day we calculate the Sun, Moon and planets with Swiss Ephemeris and see which houses from your sign they cross. Love, work, money and health ratings follow the classical table of favourable transits, and the text explains it in plain words. Every forecast has a “Why?” section with the calculation.'},
 {q:'What is Chandrashtama?',a:'In Vedic astrology, the roughly two and a half days each month when the Moon crosses the eighth house from your sign. Tradition advises not to start important things and to save energy. We mark these days in forecasts and in the month calendar.'},
 {q:'Does a sign horoscope replace a personal forecast?',a:'No. A sign horoscope is a general picture for everyone born under it. A personal forecast uses your birth chart — ascendant, Moon and dasha periods — and is available in “My personal horoscope”.'}
];

export default function HoroscopeHome({locale,system,date,signs}:{locale:HoroLocale;system:HoroSystem;date:string;signs:DayReading[]|null}){
 const uk=locale==='uk',sample=signs?.[0];
 const faq=HOME_FAQ(locale);
 const jsonLd=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(f=>({'@type':'Question',name:f.q,acceptedAnswer:{'@type':'Answer',text:f.a}}))}).replace(/</g,'\\u003c');
 return <PortalShell locale={locale} active="horoscope" languagePath={system==='vedic'?'horoscope/vedic':'horoscope'}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>
  <div className={styles.wrap}>
   <header className={styles.hero}>
    <div>
     <h1>{uk?'Гороскоп на сьогодні, '+dayLabel(date,'uk').replace(/ \d{4}$/,''):'Horoscope for today, '+dayLabel(date,'en').replace(/ \d{4}$/,'')}</h1>
     <p>{system==='western'?(uk?'Західна астрологія: знак за датою народження. Прогноз за справжнім положенням планет — кохання, робота, гроші й здоров’я для кожного знака.':'Western astrology: the sign of your birthday. A forecast from the real positions of the planets — love, work, money and health for every sign.'):
      (uk?'Ведична астрологія (Джйотиш): знак Місяця при народженні. Прогноз за сидеричним зодіаком із позначенням складних днів Чандраштами.':'Vedic astrology (Jyotish): your Moon sign at birth. Sidereal forecasts with the difficult Chandrashtama days marked.')}</p>
     <Link className={styles.passportHint} href={'/'+locale+'/horoscope/my-sign'}>{uk?'Не знаєте свій знак у ведичній системі? Зоряний паспорт →':'Don’t know your Vedic sign? Star Passport →'}</Link>
    </div>
    <SystemSwitch locale={locale} system={system} hrefs={{western:hubPath(locale,'western'),vedic:hubPath(locale,'vedic')}}/>
   </header>

   <MySignPanel system={system} locale={locale}/>

   {sample&&<p className={styles.sky}>
    <span>{uk?'Сьогодні на небі: ':'In the sky today: '}<b>{uk?'Місяць у '+SIGN_LOC_UK[sample.moon.sign-1]:'Moon in '+signByN(sample.moon.sign).en}</b>{', '+PHASE[sample.moon.phase][locale]}{sample.moon.nakshatra?(uk?', накшатра ':', nakshatra ')+sample.moon.nakshatra.name:''}</span>
    {sample.events.map((e,i)=><b key={i}>{e[locale]}</b>)}
   </p>}

   <h2 className={styles.sectionTitle} style={{marginTop:0}}>{uk?'Оберіть свій знак':'Choose your sign'}</h2>
   <div className={styles.grid}>
    {SIGNS.map(s=>{
     const r=signs?.[s.n-1];
     return <Link key={s.slug} href={signPath(locale,system,s.slug)} className={styles.card+' '+elClass(s)}>
      <div className={styles.cardTop}><span className={styles.medal} aria-hidden="true">{glyph(s)}</span>
       <div><h3>{uk?s.uk:s.en}</h3><span>{system==='western'?s.western[locale]:(uk?'Місяць у знаку '+s.gen:'Moon in '+s.en)}</span></div></div>
      {r&&<p>{r.headline[locale]}</p>}
      {r&&<div className={styles.minis}>
       <span className={styles.mini}>{uk?'Кохання':'Love'} <Dots n={r.ratings.love} label={uk?'Кохання':'Love'}/></span>
       <span className={styles.mini}>{uk?'Робота':'Work'} <Dots n={r.ratings.work} label={uk?'Робота':'Work'}/></span>
       {r.chandrashtama&&system==='vedic'&&<span className={styles.careful}>{uk?'Чандраштама':'Chandrashtama'}</span>}
      </div>}
     </Link>;
    })}
   </div>
   {!signs&&<p className={styles.error}>{uk?'Розрахунок прогнозу тимчасово недоступний. Спробуйте оновити сторінку за хвилину.':'The forecast calculation is temporarily unavailable. Please refresh in a minute.'}</p>}

   <section className={styles.faq} aria-labelledby="horo-faq">
    <h2 id="horo-faq">{uk?'Часті запитання':'FAQ'}</h2>
    {faq.map(f=><details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
    <p style={{marginTop:18}}><Link className={styles.link} href={'/'+locale+'/horoscope/personal'}>{uk?'Мій персональний гороскоп за натальною картою →':'My personal horoscope from my birth chart →'}</Link></p>
   </section>
  </div>
 </PortalShell>;
}
