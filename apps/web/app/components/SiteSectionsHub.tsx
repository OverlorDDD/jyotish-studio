import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import styles from './SiteSectionsHub.module.css';

type Text=Record<PortalLocale,string>;
type Section={path:string;title:Text;text:Text};

/** Crawlable brand overview shown below the natal calculator and its results.
 * Every path is an existing canonical public page listed in SEO_PATHS. */
export const SITE_SECTIONS:readonly Section[]=[
 {path:'horoscope',title:{uk:'Гороскопи',en:'Horoscopes'},
  text:{uk:'Ведичні гороскопи за знаком Місяця та західні за знаком Сонця — для кожного з 12 знаків.',en:'Vedic horoscopes by Moon sign and Western ones by Sun sign, for each of the 12 signs.'}},
 {path:'panchanga',title:{uk:'Панчанга',en:'Panchanga'},
  text:{uk:'Ведичний календар для твого міста: тітхі, накшатра, йога, карана і місцевий схід Сонця.',en:'The Vedic calendar for your city: tithi, nakshatra, yoga, karana and local sunrise.'}},
 {path:'tarot',title:{uk:'Таро',en:'Tarot'},
  text:{uk:'Розклади на одну, три та десять карт класичної колоди з 78 арканів.',en:'One-, three- and ten-card spreads with the classic 78-card deck.'}},
 {path:'tarot/cards',title:{uk:'Значення карт Таро',en:'Tarot card meanings'},
  text:{uk:'Символіка, пряме й перевернуте положення та роль карти в розкладі.',en:'Symbolism, upright and reversed meanings, and how a card speaks in a spread.'}},
 {path:'astrology/divisional-charts',title:{uk:'16 дробових карт',en:'16 divisional charts'},
  text:{uk:'Довідник Шодашаварги від D1 до D60: що показує кожна карта і як вона розраховується.',en:'A Shodashavarga reference from D1 to D60: what each chart shows and how it is calculated.'}},
 {path:'astrology/moon-sign-vs-sun-sign',title:{uk:'Знак Місяця і знак Сонця',en:'Moon sign vs Sun sign'},
  text:{uk:'Чому ведичний знак Місяця може відрізнятися від звичного західного знака.',en:'Why your Vedic Moon sign can differ from your familiar Western sign.'}},
 {path:'pedia',title:{uk:'GalaxiPedia',en:'GalaxiPedia'},
  text:{uk:'Уроки й довідкові статті про Джйотіш, Панчангу, накшатри та періоди Даша.',en:'Lessons and reference articles on Jyotish, Panchanga, nakshatras and Dasha periods.'}},
 {path:'yoga',title:{uk:'Йога й усвідомленість',en:'Yoga & mindfulness'},
  text:{uk:'М’які дихальні практики та короткі вправи на увагу для щоденного ритму.',en:'Gentle breathing practices and short attention exercises for a daily rhythm.'}},
 {path:'eclipses/2027',title:{uk:'Затемнення 2027',en:'Eclipses in 2027'},
  text:{uk:'Сонячні й місячні затемнення року з датами та астрономічними даними.',en:'The year’s solar and lunar eclipses with dates and astronomical data.'}},
 {path:'news',title:{uk:'GalaxiNews',en:'GalaxiNews'},
  text:{uk:'Стрічка новин про астрономію, астрологію та духовні традиції з посиланнями на першоджерела.',en:'A news feed on astronomy, astrology and spiritual traditions, linked to original sources.'}},
 {path:'community',title:{uk:'Спільнота',en:'Community'},
  text:{uk:'Обговорення Джйотіш, Таро, практик і можливостей порталу.',en:'Conversations about Jyotish, Tarot, practices and the portal itself.'}},
 {path:'methodology',title:{uk:'Методи розрахунків',en:'Calculation methods'},
  text:{uk:'Swiss Ephemeris, аянамша Лахірі та спосіб перевірки наших обчислень.',en:'Swiss Ephemeris, Lahiri ayanamsha and how our calculations are checked.'}}
];

export default function SiteSectionsHub({locale}:{locale:PortalLocale}){
 return <section className={styles.section} data-testid="site-sections-hub" aria-labelledby="site-sections-hub-heading">
  <span className={styles.eyebrow}>GALAXIORA</span>
  <h2 className={styles.title} id="site-sections-hub-heading">{locale==='uk'?'Що є на Galaxiora':'Everything on Galaxiora'}</h2>
  <p className={styles.lead}>{locale==='uk'
   ?'Galaxiora — двомовний портал про Джйотіш, Панчангу, Таро та усвідомлені практики. Натальна карта вище — основа: з неї виростають гороскопи, особистий календар і тлумачення.'
   :'Galaxiora is a bilingual home for Jyotish, Panchanga, Tarot and mindful practice. The birth chart above is the foundation that horoscopes, your personal calendar and readings grow from.'}</p>
  <nav aria-label={locale==='uk'?'Розділи Galaxiora':'Galaxiora sections'}>
   <ul className={styles.grid}>{SITE_SECTIONS.map(item=>
    <li key={item.path}><Link className={styles.card} href={'/'+locale+'/'+item.path}>
     <strong className={styles.cardTitle}>{item.title[locale]}</strong>
     <span className={styles.cardText}>{item.text[locale]}</span>
    </Link></li>)}
   </ul>
  </nav>
  <p className={styles.about}><Link href={'/'+locale+'/about'}>{locale==='uk'?'Про проєкт Galaxiora':'About the Galaxiora project'}</Link></p>
 </section>;
}
