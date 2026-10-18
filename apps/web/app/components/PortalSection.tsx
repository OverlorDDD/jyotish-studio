import Link from 'next/link';
import {ArrowUpRight,BookOpen,Flower2,HeartHandshake,Orbit,Sparkles} from 'lucide-react';
import PortalShell from './PortalShell';
import ExpertOffer from './ExpertOffer';
import TarotStudio from './TarotStudio';
import {moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';

export const SECTIONS=['astrology','tarot','experts','yoga','learn'] as const;
export type PortalSectionSlug=typeof SECTIONS[number];
export const isPortalSection=(v:string):v is PortalSectionSlug=>SECTIONS.includes(v as PortalSectionSlug);
export const SECTION_COPY={
 en:{
  astrology:{title:'Astrology tools',lead:'Explore your birth chart with our existing Vedic Jyotish engine. Western astrology, transits and lunar calendars are planned.',cta:'Calculate a Jyotish chart',sub:'Available now: Swiss Ephemeris, Lahiri sidereal chart, D1, D9, D10 and life cycles.'},
  tarot:{title:'Free online tarot readings',lead:'Explore your questions with 78 symbolic cards, reversals and a personal journal. Three free readings per UTC day for signed-in members.',cta:'Explore personal video readings',sub:'Now live: one card, three cards and the ten-card Celtic Cross. Local card meanings are provided without paid AI.'},
  experts:{title:'Readings with real people',lead:'A personal reading should have a clear question, relevant context and boundaries. Build a draft brief here before our expert booking service opens.',cta:'Prepare your question',sub:'Video consultations, verified practitioner profiles and secure checkout are being developed. No bookings are accepted yet.'},
  yoga:{title:'Yoga & mindfulness',lead:'A future library of guided breathing, meditation and yoga practices for your day-to-day routine.',cta:'Explore astrology',sub:'Educational guides and practices are being prepared; no classes or health outcomes are promised.'},
  learn:{title:'A living library',lead:'Accessible guides to astrology, tarot, yogic traditions and mindful self-reflection.',cta:'Explore astrology',sub:'Original multilingual articles and structured topic hubs are being prepared.'}
 },
 uk:{
  astrology:{title:'Інструменти астрології',lead:'Досліджуй натальну карту з готовим ведичним рушієм Джйотіш. Західна астрологія, транзити й місячний календар — у планах.',cta:'Розрахувати карту Джйотіш',sub:'Уже працює: Swiss Ephemeris, сидерична система Лахірі, D1, D9, D10 і життєві періоди.'},
  tarot:{title:'Безкоштовні розклади Таро',lead:'Досліджуй запитання із 78 символічними картами, перевернутими значеннями та власним журналом. Три безкоштовні розклади за UTC-добу після входу.',cta:'Персональний відеорозклад',sub:'Уже працює: 1 карта, 3 карти та Кельтський хрест на 10 карт. Локальні трактування не витрачають платні AI-токени.'},
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
   {section==='experts'&&<ExpertOffer locale={locale}/>}
   {section==='tarot'&&<TarotStudio locale={locale}/>}
  </div>
 </PortalShell>;
}
