import Link from 'next/link';
import {ArrowUpRight,BookOpen,Flower2,MoonStar,Orbit,Sparkles,Newspaper,MessagesSquare} from 'lucide-react';
import PortalShell from './PortalShell';
import {BRAND,moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';

const COPY={
 en:{
  eyebrow:'GALAXIORA · A COSMIC SPACE FOR DISCOVERY',headline:'Explore the unseen.',emphasis:'Connect with your universe.',
  intro:'Explore astrology, tarot, mindfulness and the wisdom of living traditions. Start with free tools, learn at your own pace, and connect with real practitioners when you want a personal perspective.',
  explore:'Explore the space',jyotish:'Open Vedic birth chart',choose:'Where will your journey begin?',sectionSub:'One platform, many ways to reflect and learn.',
  status:'Coming next',ready:'Available now',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Astrology',description:'Your birth chart and traditional Jyotish calculations, with more chart tools to come.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Tarot readings',description:'Explore 78 cards, detailed interpretations, three daily spreads and human video-reading requests.',live:true},
   {slug:'yoga',icon:'flower',title:'Yoga & mindfulness',description:'Four step-by-step guided breathing, movement and mindfulness sessions, with pause and optional timer.',live:true},
   {slug:'learn',icon:'book',title:'Learning library',description:'Seven original lessons on Jyotish, Tarot, yoga and mindful practice with knowledge checks.',live:true},
   {slug:'news',icon:'news',title:'Daily cosmic news',description:'A future sourced editorial feed about astronomy, traditions and platform discoveries.',live:false},
   {slug:'community',icon:'community',title:'Community forum',description:'A future home for respectful discussion, experience sharing and questions.',live:false}
  ],
  quote:'Grounded calculations. Human perspectives. Room for your own interpretation.',
  disclaimer:'Our readings are reflective and educational, not medical, legal or financial advice.'
 },
 uk:{
  eyebrow:'GALAXIORA · ПРОСТІР КОСМІЧНОГО ПІЗНАННЯ',headline:'Досліджуй невидиме.',emphasis:'Відчуй зв’язок зі Всесвітом.',
  intro:'Досліджуй астрологію, Таро, медитацію та духовні традиції. Починай із безкоштовних інструментів, навчайся у своєму ритмі й звертайся до реальних практиків за персональним поглядом.',
  explore:'Дослідити платформу',jyotish:'Відкрити натальну карту Джйотіш',choose:'З чого почнеться твій шлях?',sectionSub:'Одна платформа, багато шляхів для навчання та рефлексії.',
  status:'Незабаром',ready:'Уже працює',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Астрологія',description:'Натальна карта та розрахунки Джйотіш. Згодом додамо більше інструментів.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Розклади Таро',description:'78 карт, детальні трактування, три розклади щодня та персональні розклади від експерток.',live:true},
   {slug:'yoga',icon:'flower',title:'Йога та медитація',description:'Чотири покрокові практики дихання, руху й уважності: таймер, пауза та вільний темп.',live:true},
   {slug:'learn',icon:'book',title:'Бібліотека знань',description:'Сім авторських уроків про Джйотіш, Таро та йогу із запитаннями для самоперевірки.',live:true},
   {slug:'news',icon:'news',title:'Космічні новини',description:'Майбутня щоденна стрічка з достовірними джерелами та редакційними матеріалами.',live:false},
   {slug:'community',icon:'community',title:'Спільнота та форум',description:'Майбутній простір обговорень, досвіду, запитань та підтримки.',live:false}
  ],
  quote:'Точні розрахунки. Людські погляди. Простір для власного розуміння.',
  disclaimer:'Трактування призначені для рефлексії та навчання, не замінюють медичних, юридичних чи фінансових консультацій.'
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
  <section className="as-hero">
   <div className="as-hero-copy">
    <div className="as-eyebrow"><MoonStar size={16} /> {t.eyebrow}</div>
    <h1>{t.headline}<br/><em>{t.emphasis}</em></h1>
    <p>{t.intro}</p>
    <div className="as-actions">
     <a className="as-button as-button-primary" href="#explore">{t.explore}<ArrowUpRight size={18}/></a>
     <Link className="as-button as-button-secondary" href={portalPath(locale,'astrology/jyotish')}>{t.jyotish}</Link>
    </div>
   </div>
   <div className="as-celestial" aria-hidden="true"><div className="as-orbit as-orbit-outer"/><div className="as-orbit as-orbit-mid"/><div className="as-orbit as-orbit-inner"/><span>✦</span><i>☽</i></div>
  </section>
  <section className="as-section" id="explore">
   <div className="as-section-heading"><div><span className="as-overline">DISCOVER</span><h2>{t.choose}</h2><p>{t.sectionSub}</p></div></div>
   <div className="as-card-grid">
    {t.cards.map(card=><Link href={portalPath(locale,card.slug)} className="as-category-card" key={card.slug}>
     <span className="as-category-icon"><IconFor name={card.icon}/></span>
     <span className="as-availability">{card.live?t.ready:t.status}</span>
     <h3>{moduleTitle(card.slug as 'astrology'|'tarot'|'yoga'|'learn'|'news'|'community')}</h3><p>{card.description}</p>
     <span className="as-category-next"><ArrowUpRight size={18}/></span>
    </Link>)}
   </div>
  </section>
  <aside className="as-statement"><span>✺</span><p>{t.quote}</p></aside>
  <p className="as-disclaimer">{t.disclaimer}</p>
 </PortalShell>;
}
