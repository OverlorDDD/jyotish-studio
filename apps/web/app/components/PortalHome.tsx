import Link from 'next/link';
import {ArrowUpRight,BookOpen,Flower2,MoonStar,Orbit,Sparkles,Newspaper,MessagesSquare} from 'lucide-react';
import PortalShell from './PortalShell';
import {BRAND,moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';

const COPY={
 en:{
  eyebrow:'GALAXIORA · A COSMIC SPACE FOR DISCOVERY',headline:'Astrology, Tarot & Panchanga.',emphasis:'Explore your universe.',
  intro:'Jyotish reveals the rhythms of destiny, Tarot speaks through symbols, and yoga brings you back to the power of breath. Explore your natal chart, draw the cards and find your practice today.',
  explore:'Explore the space',jyotish:'Free Vedic Birth Chart',panchanga:'Panchang Today',tarotAction:'Free Tarot Reading',choose:'Where will your journey begin?',sectionSub:'One platform, many ways to reflect and learn.',
  status:'Explore',ready:'Explore',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Astrology',description:'Calculate your Vedic birth chart, explore the D1/D9/D10 charts, nakshatras and personal planetary periods.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Tarot readings',description:'Explore 78 classic cards, meaningful interpretations, three popular spreads and a private reading journal.',live:true},
   {slug:'yoga',icon:'flower',title:'Yoga & mindfulness',description:'Visual box breathing with three rhythms, gentle movement and untimed mindful reflections.',live:true},
   {slug:'learn',icon:'book',title:'GalaxiPedia',description:'Explore bilingual reference guides, a searchable glossary and eight original Jyotish, Tarot and yoga lessons with quizzes.',live:true},
   {slug:'news',icon:'news',title:'Daily cosmic news',description:'Source-linked news, searchable topics and personal interests.',live:true},
   {slug:'community',icon:'community',title:'GalaxiCom forum',description:'Join real discussions and ask questions in the community.',live:true}
  ],
  quote:'The language of the stars, the wisdom of cards, a space for living practice.',
  disclaimer:'Explore your natal chart, Tarot and mindful practices in one place.'
 },
 uk:{
  eyebrow:'GALAXIORA · ПРОСТІР КОСМІЧНОГО ПІЗНАННЯ',headline:'Астрологія, Таро та Панчанга.',emphasis:'Пізнавай свій Всесвіт.',
  intro:'Джйотіш відкриває ритми долі, Таро говорить мовою символів, а йога повертає до сили дихання. Відкрий свою натальну карту, обери розклад і знайди практику, що відгукнеться саме сьогодні.',
  explore:'Дослідити платформу',jyotish:'Натальна карта Джйотіш',panchanga:'Панчанга сьогодні',tarotAction:'Безкоштовний розклад Таро',choose:'З чого почнеться твій шлях?',sectionSub:'Одна платформа, багато шляхів для навчання та рефлексії.',
  status:'Дослідити',ready:'Дослідити',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Астрологія',description:'Створи натальну карту Джйотіш, досліджуй D1/D9/D10, накшатри та власні планетні періоди.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Розклади Таро',description:'78 класичних карт, продумані трактування, популярні розклади й особистий журнал Таро.',live:true},
   {slug:'yoga',icon:'flower',title:'Йога та медитація',description:'Дихання по квадрату з анімацією, три ритми на вибір і вправи без зайвих таймерів.',live:true},
   {slug:'learn',icon:'book',title:'GalaxiPedia',description:'Двомовна енциклопедія зі статтями, словником термінів і вісьмома уроками Джйотіш, Таро та йоги з тестами.',live:true},
   {slug:'news',icon:'news',title:'Космічні новини',description:'Актуальні новини з джерелами, пошуком та персональною добіркою.',live:true},
   {slug:'community',icon:'community',title:'GalaxiCom · Форум',description:'Живі обговорення, запитання, відповіді та допомога спільноти.',live:true}
  ],
  quote:'Мова зірок, мудрість карт і простір живої практики.',
  disclaimer:'Натальна карта, Таро й духовні практики — у твоєму космічному просторі.'
 }
} as const;
function IconFor({name}:{name:string}){
 if(name==='orbit')return <Orbit size={26}/>;
 if(name==='sparkles')return <Sparkles size={26}/>;
 if(name==='news')return <Newspaper size={26}/>;
 if(name==='community')return <MessagesSquare size={26}/>;
 if(name==='flower')return <Flower2 size={26}/>;
 return <BookOpen size={26}/>;
}
export default function PortalHome({locale}: {locale:PortalLocale}){
 const t=COPY[locale];
 return <PortalShell locale={locale}>
  <section className="as-hero as-cosmic-hero">
   <div className="as-constellation-field" aria-hidden="true">
    {Array.from({length:56},(_,i)=><i key={i} className="as-stardust" style={{
     left:((i*73+19)%97)+'%',top:((i*41+13)%91)+'%',
     width:i%7===0?3:1.5,height:i%7===0?3:1.5,
     animationDelay:'-'+((i*7)%17)+'s',animationDuration:(4+i%9)+'s'
    }}/>)}
   </div>
   <div className="as-hero-copy">
    <div className="as-eyebrow"><MoonStar size={16} /> {t.eyebrow}</div>
    <h1>{t.headline}<br/><em>{t.emphasis}</em></h1>
    <p>{t.intro}</p>
    <nav className="as-actions" aria-label={locale==='uk'?'Основні інструменти':'Start with a free tool'}>
     <Link className="as-button as-button-primary" href={portalPath(locale,'astrology/jyotish')}>{t.jyotish}<ArrowUpRight size={18}/></Link>
     <Link className="as-button as-button-secondary" href={portalPath(locale,'panchanga')}>{t.panchanga}</Link>
     <Link className="as-button as-button-secondary" href={portalPath(locale,'tarot')}>{t.tarotAction}</Link>
    </nav>
   </div>
   <div className="as-celestial as-celestial-vfx" aria-hidden="true">
    <span className="as-cosmic-core">☉</span>
    <span className="as-orbit-ring as-orbit-ring-inner"/>
    <span className="as-orbit-ring as-orbit-ring-mid"/>
    <span className="as-orbit-ring as-orbit-ring-outer"/>
    <span className="as-orbit-track as-track-inner"><i className="as-orbit-body as-planet-azure"/></span>
    <span className="as-orbit-track as-track-mid"><i className="as-orbit-body as-planet-gold"/></span>
    <span className="as-orbit-track as-track-outer"><i className="as-orbit-body as-moon-orb"/></span>
   </div>
  </section>
  <section className="as-section" id="explore">
   <div className="as-section-heading"><div><span className="as-overline">DISCOVER</span><h2>{t.choose}</h2><p>{t.sectionSub}</p></div></div>
   <div className="as-card-grid">
    {t.cards.map(card=><Link href={portalPath(locale,card.slug)} className="as-category-card" key={card.slug}>
     <span className="as-category-icon"><IconFor name={card.icon}/></span>

     <h3>{moduleTitle(card.slug as 'astrology'|'tarot'|'yoga'|'learn'|'news'|'community')}</h3><p>{card.description}</p>
     <span className="as-category-next"><ArrowUpRight size={18}/></span>
    </Link>)}
   </div>
  </section>
  <section className="as-section" aria-label={locale==='uk'?'Про Galaxiora':'About Galaxiora'}>
   <div className="as-section-heading"><div>
    <span className="as-overline">GALAXIORA.COM · OFFICIAL WEBSITE</span>
    <h2>{locale==='uk'?'Що таке Galaxiora?':'What is Galaxiora?'}</h2>
    <p>{locale==='uk'?
     'Galaxiora — українсько-англійська платформа Джйотіш, західної астрології, Таро та усвідомлених практик. Обчислюйте натальні карти, досліджуйте Панчангу, дізнавайтеся про небесні події й знаходьте практичні пояснення в Академії.':
     'Galaxiora is a Ukrainian-English platform for Jyotish, Western astrology, Tarot and mindful practice. Calculate a natal chart, explore Panchanga, follow celestial events and study original lessons in the Academy.'}</p>
   </div></div>
   <div className="as-actions">
    <Link href={'/'+locale+'/about'} className="as-button as-button-secondary">{locale==='uk'?'Дізнатися про Galaxiora':'About Galaxiora'} <ArrowUpRight size={17}/></Link>
    <Link href={'/'+locale+'/methodology'} className="as-button as-button-secondary">{locale==='uk'?'Методологія розрахунків':'How calculations work'} <ArrowUpRight size={17}/></Link>
   </div>
  </section>
  <aside className="as-statement"><span>✺</span><p>{t.quote}</p></aside>
  <p className="as-disclaimer">{t.disclaimer}</p>
 </PortalShell>;
}
