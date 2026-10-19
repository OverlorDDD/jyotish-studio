import Link from 'next/link';
import {ArrowUpRight,BookOpen,Flower2,HeartHandshake,Orbit,Sparkles,Newspaper,MessagesSquare} from 'lucide-react';
import PortalShell from './PortalShell';
import ExpertOffer from './ExpertOffer';
import TarotStudio from './TarotStudio';
import YogaHub from './YogaHub';
import AcademyHub from './AcademyHub';
import {moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';

export const SECTIONS=['astrology','tarot','experts','yoga','learn','news','community'] as const;
export type PortalSectionSlug=typeof SECTIONS[number];
export const isPortalSection=(v:string):v is PortalSectionSlug=>SECTIONS.includes(v as PortalSectionSlug);
export const SECTION_COPY={
 en:{
  astrology:{title:'Astrology tools',lead:'Explore your birth chart with our existing Vedic Jyotish engine. Western astrology, transits and lunar calendars are planned.',cta:'Calculate a Jyotish chart',sub:'Available now: Swiss Ephemeris, Lahiri sidereal chart, D1, D9, D10 and life cycles.'},
  tarot:{title:'Free online tarot readings',lead:'Explore your questions with 78 symbolic cards, reversals and a personal journal. Three free readings per UTC day for signed-in members.',cta:'Explore personal video readings',sub:'Now live: one card, three cards and the ten-card Celtic Cross. Local card meanings are provided without paid AI.'},
  experts:{title:'Readings with real people',lead:'A personal reading should have a clear question, relevant context and boundaries. Build a draft brief here before our expert booking service opens.',cta:'Prepare your question',sub:'Video consultations, verified practitioner profiles and secure checkout are being developed. No bookings are accepted yet.'},
  yoga:{title:'Yoga & mindfulness',lead:'Four original gentle step-by-step practices for breathing, movement and mindfulness, with an optional timer.',cta:'Explore astrology',sub:'Four guided sessions are available now; stop or adapt if a movement or breath focus feels uncomfortable.'},
  learn:{title:'A living library',lead:'Seven original bilingual lessons on Jyotish, Tarot and yoga, with a knowledge check after each one.',cta:'Explore astrology',sub:'Browse three topics, seven full lessons and simple self-check quizzes — no account required.'},
  news:{title:'Cosmic news and daily discoveries',lead:'A future daily editorial feed covering astronomy, cultural traditions, spirituality and platform updates, with clear source links.',cta:'Explore our live Tarot Studio',sub:'Editorial publishing, verification, author attribution, categories and archives are planned. No live news feed yet.'},
  community:{title:'A community for thoughtful discussion',lead:'A planned forum for exchanging experiences, asking questions and discussing astrology, tarot and mindful practices respectfully.',cta:'Explore our live Tarot Studio',sub:'Forum accounts, roles, threads, moderation, reporting, privacy and anti-spam tools are planned. User posting is not enabled yet.'}
 },
 uk:{
  astrology:{title:'Інструменти астрології',lead:'Досліджуй натальну карту з готовим ведичним рушієм Джйотіш. Західна астрологія, транзити й місячний календар — у планах.',cta:'Розрахувати карту Джйотіш',sub:'Уже працює: Swiss Ephemeris, сидерична система Лахірі, D1, D9, D10 і життєві періоди.'},
  tarot:{title:'Безкоштовні розклади Таро',lead:'Досліджуй запитання із 78 символічними картами, перевернутими значеннями та власним журналом. Три безкоштовні розклади за UTC-добу після входу.',cta:'Персональний відеорозклад',sub:'Уже працює: 1 карта, 3 карти та Кельтський хрест на 10 карт. Локальні трактування не витрачають платні AI-токени.'},
  experts:{title:'Розклади від реальних людей',lead:'Персональний розклад потребує чіткого запитання, контексту й розуміння меж. Підготуй чернетку для експертки до запуску замовлень.',cta:'Підготувати запитання',sub:'Профілі консультантів, відеорозклади й безпечна оплата в розробці. Замовлення поки не приймаються.'},
  yoga:{title:'Йога та медитація',lead:'Чотири готові покрокові практики м’якого руху, дихання й уважності з необов’язковим таймером.',cta:'Дослідити астрологію',sub:'Чотири практики вже доступні. За дискомфорту можна припинити, змінити або пропустити крок.'},
  learn:{title:'Бібліотека знань',lead:'Сім готових двомовних уроків про Джйотіш, Таро й йогу з перевіркою знань.',cta:'Дослідити астрологію',sub:'Три тематичні блоки, сім уроків та самоперевірки — без реєстрації.'},
  news:{title:'Щоденні новини та відкриття',lead:'Майбутня стрічка щоденних матеріалів про космос, духовні традиції, культуру та розвиток платформи з перевіреними джерелами.',cta:'Відкрити наш Tarot Studio',sub:'Плануються редактори, перевірка фактів, авторство, категорії й архів. Жива новинна стрічка ще не працює.'},
  community:{title:'Спільнота та форум',lead:'Майбутній простір для обміну досвідом і поважних дискусій про астрологію, Таро й духовні практики.',cta:'Відкрити наш Tarot Studio',sub:'Плануються теми, відповіді, модерація, скарги, захист приватності й антиспам. Дописи поки не приймаються.'}
 }
} as const;
const iconMap={astrology:Orbit,tarot:Sparkles,experts:HeartHandshake,yoga:Flower2,learn:BookOpen,news:Newspaper,community:MessagesSquare};
export default function PortalSection({locale,section}:{locale:PortalLocale;section:PortalSectionSlug}){
 if(section==='yoga')return <YogaHub locale={locale}/>;
 if(section==='learn')return <AcademyHub locale={locale}/>;
 const t=SECTION_COPY[locale][section];
 const Icon=iconMap[section];
 const href=section==='astrology'?portalPath(locale,'astrology/jyotish'):section==='tarot'?'#human-readings':portalPath(locale,'tarot');
 const working=section==='astrology'||section==='tarot';
 return <PortalShell locale={locale} active={section}>
  <div className="as-subpage">
   <section className="as-subpage-intro">
    <span className="as-subpage-symbol"><Icon size={34}/></span>
    <span className="as-overline">{working?(locale==='uk'?'ДОСТУПНО ЗАРАЗ':'LIVE TOOL'):(locale==='uk'?'У РОЗРОБЦІ':'COMING SOON')}</span>
    <h1>{moduleTitle(section)}</h1><p className="as-module-descriptor">{t.title}</p><p>{t.lead}</p>
    <div className="as-subpage-cta"><Link href={href} className="as-button as-button-primary">{t.cta}<ArrowUpRight size={17}/></Link></div>
   </section>
   <section className="as-detail">
    <h2>{locale==='uk'?'Що доступно':'What to expect'}</h2>
    <p>{t.sub}</p>
   </section>
   {section==='tarot'&&<TarotStudio locale={locale}/>}
   {section==='tarot'&&<section id="human-readings" className="as-human-readings"><ExpertOffer locale={locale}/></section>}
  </div>
 </PortalShell>;
}
