import Link from 'next/link';
import {ArrowUpRight,BookOpen,Flower2,HeartHandshake,Orbit,Sparkles} from 'lucide-react';
import PortalShell from './PortalShell';
import ReadingIntake from './ReadingIntake';
import {portalPath,type PortalLocale} from '../../lib/brand';

export const SECTIONS=['astrology','tarot','experts','yoga','learn'] as const;
export type PortalSectionSlug=typeof SECTIONS[number];
export const isPortalSection=(v:string):v is PortalSectionSlug=>SECTIONS.includes(v as PortalSectionSlug);
export const SECTION_COPY={
 en:{
  astrology:{title:'Astrology tools',lead:'Explore your birth chart with our existing Vedic Jyotish engine. Western astrology, transits and lunar calendars are planned.',cta:'Calculate a Jyotish chart',sub:'Available now: Swiss Ephemeris, Lahiri sidereal chart, D1, D9, D10 and life cycles.'},
  tarot:{title:'Tarot readings',lead:'Tarot is a symbolic prompt for reflection. Explore how to phrase a question before our interactive deck and free daily draws arrive.',cta:'Prepare a question for a human reader',sub:'In development: 78 cards, reversed meanings, one-, three- and ten-card spreads, and AI-assisted interpretation.'},
  experts:{title:'Readings with real people',lead:'A personal reading should have a clear question, relevant context and boundaries. Build a draft brief here before our expert booking service opens.',cta:'Prepare your question',sub:'Video consultations, verified practitioner profiles and secure checkout are being developed. No bookings are accepted yet.'},
  yoga:{title:'Yoga & mindfulness',lead:'A future library of guided breathing, meditation and yoga practices for your day-to-day routine.',cta:'Explore astrology',sub:'Educational guides and practices are being prepared; no classes or health outcomes are promised.'},
  learn:{title:'A living library',lead:'Accessible guides to astrology, tarot, yogic traditions and mindful self-reflection.',cta:'Explore astrology',sub:'Original multilingual articles and structured topic hubs are being prepared.'}
 },
 uk:{
  astrology:{title:'Інструменти астрології',lead:'Досліджуй натальну карту з готовим ведичним рушієм Джйотіш. Західна астрологія, транзити й місячний календар — у планах.',cta:'Розрахувати карту Джйотіш',sub:'Уже працює: Swiss Ephemeris, сидерична система Лахірі, D1, D9, D10 і життєві періоди.'},
  tarot:{title:'Розклади Таро',lead:'Таро можна використовувати як символічний інструмент рефлексії. Навчись ставити відкриті питання перед запуском інтерактивної колоди.',cta:'Підготувати запитання для експертки',sub:'У розробці: 78 карт, перевернуті значення, розклади на 1, 3 і 10 карт, допомога AI.'},
  experts:{title:'Розклади від реальних людей',lead:'Персональний розклад потребує чіткого запитання, контексту й розуміння меж. Підготуй чернетку для експертки до запуску замовлень.',cta:'Підготувати запитання',sub:'Профілі консультантів, відеорозклади й безпечна оплата в розробці. Замовлення поки не приймаються.'},
  yoga:{title:'Йога та медитація',lead:'Майбутня бібліотека дихальних вправ, медитацій та йогічних практик для щоденного життя.',cta:'Дослідити астрологію',sub:'Матеріали й практики готуються, без обіцянок лікувального ефекту.'},
  learn:{title:'Бібліотека знань',lead:'Доступні матеріали про астрологію, Таро, йогічні традиції та усвідомленість.',cta:'Дослідити астрологію',sub:'Авторські багатомовні статті й тематичні довідники готуються.'}
 }
} as const;
const iconMap={astrology:Orbit,tarot:Sparkles,experts:HeartHandshake,yoga:Flower2,learn:BookOpen};
export default function PortalSection({locale,section}:{locale:PortalLocale;section:PortalSectionSlug}){
 const t=SECTION_COPY[locale][section];
 const Icon=iconMap[section];
 const href=section==='astrology'?portalPath(locale,'astrology/jyotish'):section==='tarot'?portalPath(locale,'experts'):portalPath(locale,'astrology/jyotish');
 const working=section==='astrology';
 return <PortalShell locale={locale} active={section}>
  <div className="as-subpage">
   <section className="as-subpage-intro">
    <span className="as-subpage-symbol"><Icon size={34}/></span>
    <span className="as-overline">{working?(locale==='uk'?'ДОСТУПНО ЗАРАЗ':'LIVE TOOL'):(locale==='uk'?'У РОЗРОБЦІ':'COMING SOON')}</span>
    <h1>{t.title}</h1><p>{t.lead}</p>
    <div className="as-subpage-cta"><Link href={href} className="as-button as-button-primary">{t.cta}<ArrowUpRight size={17}/></Link></div>
   </section>
   <section className="as-detail">
    <h2>{locale==='uk'?'Що доступно':'What to expect'}</h2>
    <p>{t.sub}</p>
   </section>
   {section==='experts'&&<ReadingIntake locale={locale}/>}
  </div>
 </PortalShell>;
}
