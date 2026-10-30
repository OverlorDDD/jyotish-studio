import Link from 'next/link';
import {ArrowUpRight,BookOpen,Flower2,MoonStar,Orbit,Sparkles,Newspaper,MessagesSquare} from 'lucide-react';
import PortalShell from './PortalShell';
import {BRAND,moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';

const COPY={
 en:{
  eyebrow:'GALAXIORA · A COSMIC SPACE FOR DISCOVERY',headline:'Explore the unseen.',emphasis:'Connect with your universe.',
  intro:'Jyotish reveals the rhythms of destiny, Tarot speaks through symbols, and yoga brings you back to the power of breath. Explore your natal chart, draw the cards and find your practice today.',
  explore:'Explore the space',jyotish:'Open Vedic birth chart',choose:'Where will your journey begin?',sectionSub:'One platform, many ways to reflect and learn.',
  status:'Explore',ready:'Explore',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Astrology',description:'Calculate your Vedic birth chart, explore the D1/D9/D10 charts, nakshatras and personal planetary periods.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Tarot readings',description:'Explore 78 classic cards, meaningful interpretations, three popular spreads and a private reading journal.',live:true},
   {slug:'yoga',icon:'flower',title:'Yoga & mindfulness',description:'Visual box breathing with three rhythms, gentle movement and untimed mindful reflections.',live:true},
   {slug:'learn',icon:'book',title:'Learning library',description:'Eight original lessons on Jyotish, Tarot, yoga and mindful practice with knowledge checks.',live:true},
   {slug:'news',icon:'news',title:'Daily cosmic news',description:'Source-linked news, searchable topics and personal interests.',live:true},
   {slug:'community',icon:'community',title:'GalaxiCom forum',description:'Join real discussions and ask questions in the community.',live:true}
  ],
  quote:'The language of the stars, the wisdom of cards, a space for living practice.',
  disclaimer:'Explore your natal chart, Tarot and mindful practices in one place.'
 },
 uk:{
  eyebrow:'GALAXIORA · ПРОСТІР КОСМІЧНОГО ПІЗНАННЯ',headline:'Досліджуй невидиме.',emphasis:'Відчуй зв’язок зі Всесвітом.',
  intro:'Джйотіш відкриває ритми долі, Таро говорить мовою символів, а йога повертає до сили дихання. Відкрий свою натальну карту, обери розклад і знайди практику, що відгукнеться саме сьогодні.',
  explore:'Дослідити платформу',jyotish:'Відкрити натальну карту Джйотіш',choose:'З чого почнеться твій шлях?',sectionSub:'Одна платформа, багато шляхів для навчання та рефлексії.',
  status:'Дослідити',ready:'Дослідити',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Астрологія',description:'Створи натальну карту Джйотіш, досліджуй D1/D9/D10, накшатри та власні планетні періоди.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Розклади Таро',description:'78 класичних карт, продумані трактування, популярні розклади й особистий журнал Таро.',live:true},
   {slug:'yoga',icon:'flower',title:'Йога та медитація',description:'Дихання по квадрату з анімацією, три ритми на вибір і вправи без зайвих таймерів.',live:true},
   {slug:'learn',icon:'book',title:'Бібліотека знань',description:'Вісім авторських уроків про Джйотіш, Таро та йогу із запитаннями для самоперевірки.',live:true},
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
    <div className="as-actions">
     <a className="as-button as-button-primary" href="#explore">{t.explore}<ArrowUpRight size={18}/></a>
     <Link className="as-button as-button-secondary" href={portalPath(locale,'astrology/jyotish')}>{t.jyotish}</Link>
    </div>
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
  <aside className="as-statement"><span>✺</span><p>{t.quote}</p></aside>
  <p className="as-disclaimer">{t.disclaimer}</p>
 </PortalShell>;
}
