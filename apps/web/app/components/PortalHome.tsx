import Link from 'next/link';
import {ArrowUpRight,BookOpen,Flower2,HeartHandshake,MoonStar,Orbit,Sparkles} from 'lucide-react';
import PortalShell from './PortalShell';
import {portalPath,type PortalLocale} from '../../lib/brand';

const COPY={
 en:{
  eyebrow:'YOUR SPACE FOR DISCOVERY',headline:'Follow your curiosity.',emphasis:'Find your meaning.',
  intro:'Explore astrology, tarot, mindfulness and the wisdom of living traditions. Start with free tools, learn at your own pace, and connect with real practitioners when you want a personal perspective.',
  explore:'Explore the space',jyotish:'Open Vedic birth chart',choose:'Where will your journey begin?',sectionSub:'One platform, many ways to reflect and learn.',
  status:'Coming next',ready:'Available now',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Astrology',description:'Your birth chart and traditional Jyotish calculations, with more chart tools to come.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Tarot readings',description:'Discover spread formats, better questions and our upcoming interactive tarot experience.',live:false},
   {slug:'experts',icon:'heart',title:'Human readers',description:'Learn how to prepare a personal question for a video reading by a real tarot practitioner.',live:false},
   {slug:'yoga',icon:'flower',title:'Yoga & mindfulness',description:'A future home for accessible practices and reflective rituals.',live:false},
   {slug:'learn',icon:'book',title:'Learning library',description:'Guides to traditions, symbolism and thoughtful self-discovery.',live:false}
  ],
  quote:'Grounded calculations. Human perspectives. Room for your own interpretation.',
  disclaimer:'Our readings are reflective and educational, not medical, legal or financial advice.'
 },
 uk:{
  eyebrow:'ПРОСТІР ДЛЯ ПІЗНАННЯ',headline:'Слідуй за цікавістю.',emphasis:'Знайди свої сенси.',
  intro:'Досліджуй астрологію, Таро, медитацію та духовні традиції. Починай із безкоштовних інструментів, навчайся у своєму ритмі й звертайся до реальних практиків за персональним поглядом.',
  explore:'Дослідити платформу',jyotish:'Відкрити натальну карту Джйотіш',choose:'З чого почнеться твій шлях?',sectionSub:'Одна платформа, багато шляхів для навчання та рефлексії.',
  status:'Незабаром',ready:'Уже працює',
  cards:[
   {slug:'astrology',icon:'orbit',title:'Астрологія',description:'Натальна карта та розрахунки Джйотіш. Згодом додамо більше інструментів.',live:true},
   {slug:'tarot',icon:'sparkles',title:'Розклади Таро',description:'Види розкладів, мистецтво формулювання питань і майбутнє інтерактивне Таро.',live:false},
   {slug:'experts',icon:'heart',title:'Живі експерти',description:'Як підготувати особисте запитання для відеорозкладу від реальної людини.',live:false},
   {slug:'yoga',icon:'flower',title:'Йога та медитація',description:'Майбутній простір доступних практик і корисних ритуалів.',live:false},
   {slug:'learn',icon:'book',title:'Бібліотека знань',description:'Пізнавай традиції, символіку й практики усвідомленості.',live:false}
  ],
  quote:'Точні розрахунки. Людські погляди. Простір для власного розуміння.',
  disclaimer:'Трактування призначені для рефлексії та навчання, не замінюють медичних, юридичних чи фінансових консультацій.'
 }
} as const;
function IconFor({name}:{name:string}){
 if(name==='orbit')return <Orbit size={26}/>;
 if(name==='sparkles')return <Sparkles size={26}/>;
 if(name==='heart')return <HeartHandshake size={26}/>;
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
     <h3>{card.title}</h3><p>{card.description}</p>
     <span className="as-category-next"><ArrowUpRight size={18}/></span>
    </Link>)}
   </div>
  </section>
  <aside className="as-statement"><span>✺</span><p>{t.quote}</p></aside>
  <p className="as-disclaimer">{t.disclaimer}</p>
 </PortalShell>;
}
